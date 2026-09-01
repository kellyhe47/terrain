// Fixture 05 → operation: PlanService.generateValidated(weekStart, as_of) with the fixture intake as the profile and the
// contraindicated tags as an active injury memory entry; then materializePlan for the calendar-shaped assertions.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadFixture } from './fixtures';
import { testRepo } from '../../src/db/testDb';
import { MemoryService } from '../../src/domain/memory';
import { ContextAssembler } from '../../src/domain/contextAssembler';
import { PlanService } from '../../src/domain/planService';
import { FakeTextModel } from '../../src/ai/fakeTextModel';
import { exerciseLibrary } from '../../src/seed/exerciseLibrary';
import { materializePlan, validatePlan, WeeklyPlanSchema, type WeeklyPlan } from '../../src/domain/plan';
import { weekStart, dayOf, addDays } from '../../src/domain/dates';
import type { Repo } from '../../src/db/repo';
import type { Profile } from '../../src/domain/types';

const f = loadFixture('05_plan_generation_constraints.json');
const DOW: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

async function setup(minutes = f.given.intake.minutes_per_session) {
  const repo = await testRepo();
  const i = f.given.intake;
  const profile: Profile = { goal: 'Strength', goalText: i.goal, daysPerWeek: i.days_available_per_week, minutesPerSession: minutes, equipment: 'Commercial gym', activities: ['Running', 'Pickleball'],
    recurring: i.recurring_preferences.map((r: any) => ({ activity: r.activity, detail: r.detail, frequency: 'weekly', preferredDay: DOW[r.preferred_day] })), injuriesText: i.injuries.map((x: any) => `${x.area} — ${x.note}`).join('; '), onboarded: true, installedAt: f.given.as_of };
  repo.saveProfile(profile);
  const memory = new MemoryService(repo);
  memory.add('injury', 'Right knee — no deep squatting or jumping', f.given.as_of, f.given.contraindicated_exercise_tags);
  const model = new FakeTextModel();
  const assembler = new ContextAssembler(repo, memory, model, exerciseLibrary);
  const plans = new PlanService(repo, memory, assembler, exerciseLibrary);
  return { repo, memory, model, plans };
}

describe('fixture 05 plan_generation_constraints', () => {
  let plan: WeeklyPlan; let repo: Repo; let plans: PlanService; const ws = weekStart(dayOf(f.given.as_of));
  beforeAll(async () => { ({ repo, plans } = await setup()); plan = await plans.generateValidated(ws, f.given.as_of); });

  it('is schema-valid and passes the rails', () => {
    expect(WeeklyPlanSchema.safeParse(plan).success).toBe(true);
    expect(validatePlan(plan, plans.railContext(ws))).toEqual({ ok: true });
  });
  it('counts: ≤ 4 training days, exactly one Saturday 3-mile run, 5 scheduled activities', () => {
    const acts = materializePlan(plan, f.given.as_of);
    const trainingDays = new Set(acts.filter((a) => a.source === 'nora').map((a) => a.date));
    expect(trainingDays.size).toBeLessThanOrEqual(f.expect.counts.training_days_max);
    const satRun = acts.filter((a) => a.source === 'standing_preference' && a.type === 'run' && a.distanceMi === 3 && new Date(a.date + 'T12:00').getDay() === 6);
    expect(satRun).toHaveLength(f.expect.counts.saturday_run_3mi);
    expect(acts).toHaveLength(f.expect.counts.total_scheduled_activities);
  });
  it('excludes deep_squat / plyometric_jump exercises (knee)', () => {
    const bad = new Set(f.given.contraindicated_exercise_tags);
    for (const s of plan.sessions) for (const e of s.exercises) expect(exerciseLibrary.get(e.exercise_id)!.tags.some((t) => bad.has(t))).toBe(false);
  });
  it('every gym session has warmup + main + cooldown as phase-tagged entries in one list, each with a cue and a form video from the library', () => {
    const gyms = plan.sessions.filter((s) => s.type === 'gym');
    expect(gyms.length).toBeGreaterThan(0);
    for (const s of gyms) {
      const phases = s.exercises.map((e) => e.phase);
      expect(phases).toContain('warmup'); expect(phases).toContain('main'); expect(phases).toContain('cooldown');
      for (const e of s.exercises) { const ex = exerciseLibrary.get(e.exercise_id)!; expect(ex.cue.length).toBeGreaterThan(0); expect(ex.videoUrl).toMatch(/^https:\/\//); expect((e as any).form_video_url).toBeUndefined(); }
    }
  });
  it('source vocabulary: nora | trainee_adhoc | standing_preference; the run is standing, not nora', () => {
    const acts = materializePlan(plan, f.given.as_of);
    for (const a of acts) expect(['nora', 'trainee_adhoc', 'standing_preference']).toContain(a.source);
    expect(acts.find((a) => a.type === 'run')?.source).toBe('standing_preference');
  });
  it('session length is derived from minutes available, not fixed', async () => {
    const short = await (await setup(30)).plans.generateValidated(ws, f.given.as_of);
    const long = await (await setup(75)).plans.generateValidated(ws, f.given.as_of);
    const count = (p: WeeklyPlan) => p.sessions.filter((s) => s.type === 'gym')[0].exercises.length;
    expect(count(short)).toBeLessThan(count(long));
  });
  it('a rail violation is named and re-prompted, never silently accepted', async () => {
    const { plans: p2, model } = await setup();
    const bad = JSON.parse(JSON.stringify(plan));
    bad.sessions.find((s: any) => s.type === 'gym').exercises.push({ exercise_id: 'back_squat', phase: 'main', sets: 3, reps: 5, weight_lb: 185 });
    model.nextPlanOverride = bad;
    const ok = await p2.generateValidated(ws, f.given.as_of);
    expect(p2.lastGeneration?.attempts).toBe(2);
    expect(p2.lastGeneration?.violations[0].join(' ')).toMatch(/Back squat.*contraindicated.*deep_squat/);
    expect(validatePlan(ok, p2.railContext(ws)).ok).toBe(true);
  });
  it('generateWeek persists only future/today activities and marks the week planned', async () => {
    const acts = await plans.generateWeek(ws, f.given.as_of);
    expect(repo.getPlanWeek(ws)?.status).toBe('planned');
    expect(repo.activitiesBetween(ws, addDays(ws, 6)).every((a) => a.date >= dayOf(f.given.as_of))).toBe(true);
    expect(acts.length).toBe(5);
  });
});
