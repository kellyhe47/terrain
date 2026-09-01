import { describe, it, expect } from 'vitest';
import { testRepo } from '../db/testDb';
import { seedDemo } from './demoSeed';
import { readinessFor } from '../domain/readinessLoader';
import { CalendarService } from '../domain/calendar';
import { addDays, weekStart } from '../domain/dates';
import { consistency, avgReadiness, signalTrends, trainingLoad14 } from '../domain/progress';
import { weekStats, gaps14, dayMacros } from '../domain/nutrition';
import { nutrientReference } from './nutrientReference';
import { validatePlan, planFromActivities } from '../domain/plan';
import { exerciseLibrary } from './exerciseLibrary';

const AS_OF = '2026-09-01T09:00:00-05:00'; const TODAY = '2026-09-01';
describe('demo seed (R67)', () => {
  it('covers the loop and every displayed figure derives from data', async () => {
    const repo = await testRepo(); seedDemo(repo, AS_OF);
    expect(repo.getProfile()?.onboarded).toBe(true);
    // 31+ days of signals
    expect(repo.signalSeries('weight', addDays(TODAY, -34), TODAY).length).toBeGreaterThanOrEqual(31);
    // readiness today is a green score derived from today's signals + yesterday's run
    const r = readinessFor(repo, TODAY); expect(r.kind).toBe('score'); if (r.kind === 'score') { expect(r.band).toBe('green'); expect(r.score).toBe(84); }
    // every status incl. one 'now' today
    const cal = new CalendarService(repo); const week = cal.week(weekStart(TODAY), TODAY);
    const statuses = new Set(week.map((i) => i.status));
    for (const s of ['completed', 'skipped', 'pending', 'now']) expect(statuses.has(s as any)).toBe(true);
    expect(week.filter((i) => i.status === 'now')).toHaveLength(1);
    expect(week.find((i) => i.status === 'now')!.activity.exercises).toHaveLength(6); // "45 min · 6 exercises · bench focus"
    expect(week.find((i) => i.activity.type === 'run' && i.status === 'completed')?.subtitle).toBe('Completed · 2 of 3 miles logged');
    expect(week.find((i) => i.activity.type === 'gym' && i.status === 'completed')?.subtitle).toBe('Completed · 6/6 exercises');
    expect(week.find((i) => i.status === 'skipped')?.subtitle).toBe('Skipped · 6 × 20 s');
    // the seeded weeks pass the same rails as generated ones
    for (const off of [-21, -14, -7, 0, 7]) { const ws = addDays(weekStart(TODAY), off); const acts = repo.activitiesBetween(ws, addDays(ws, 6)); const res = validatePlan(planFromActivities(ws, acts), { library: exerciseLibrary, contraindicatedTags: ['deep_squat', 'plyometric_jump', 'overhead_press'], daysAvailable: 4, recurring: repo.getProfile()!.recurring, weekStart: ws }); expect(res).toEqual({ ok: true }); }
    // memory: all three types; meals across ≥ 3 days; supplements; PRs; chat
    expect(new Set(repo.listMemory().map((m) => m.type)).size).toBe(3);
    expect(new Set(repo.mealsBetween(addDays(TODAY, -13), TODAY).map((m) => m.date)).size).toBe(14);
    expect(dayMacros(repo.mealsOn(TODAY)).proteinG).toBe(86);
    expect(repo.listSupplements()).toHaveLength(4); expect(repo.takenOn(TODAY).size).toBe(2);
    expect(repo.listPRs()).toHaveLength(3); expect(repo.listChat()).toHaveLength(2);
    // progress figures are computable
    const c = consistency(repo, TODAY); expect(c.planned).toBeGreaterThan(5); expect(c.done).toBeLessThanOrEqual(c.planned);
    expect(avgReadiness(repo, TODAY)).not.toBeNull(); expect(signalTrends(repo, TODAY)[0].points.length).toBeGreaterThanOrEqual(28);
    expect(trainingLoad14(repo, TODAY)).toHaveLength(14);
    const ws = weekStats(repo, weekStart(TODAY), TODAY, repo.getTargets()); expect(ws.loggedDays).toBe(3);
    const g = gaps14(repo, TODAY, repo.getTargets(), nutrientReference, () => true);
    expect(g.ranked.map((x) => x.key)).not.toContain('vitamin_d_ug'); // covered by a daily supplement (R72b)
    expect(g.ranked.length).toBeGreaterThan(0);
  });
  it('holds on every weekday: statuses present, one session in progress, rails pass', async () => {
    for (let k = 0; k < 7; k++) {
      const today = addDays('2026-09-06', k); // Sun..Sat
      const repo = await testRepo(); seedDemo(repo, `${today}T09:00:00-05:00`);
      const cal = new CalendarService(repo);
      const nowItems = cal.day(today, today).filter((i) => i.status === 'now');
      expect(nowItems.length).toBeGreaterThanOrEqual(1);
      const all = cal.range(addDays(today, -30), addDays(today, 13), today);
      for (const s of ['completed', 'skipped', 'pending', 'now']) expect(all.some((i) => i.status === s)).toBe(true);
      for (const off of [-21, -14, -7, 0, 7]) { const ws = addDays(weekStart(today), off); const acts = repo.activitiesBetween(ws, addDays(ws, 6)); expect(validatePlan(planFromActivities(ws, acts), { library: exerciseLibrary, contraindicatedTags: ['deep_squat', 'plyometric_jump', 'overhead_press'], daysAvailable: 4, recurring: repo.getProfile()!.recurring, weekStart: ws })).toEqual({ ok: true }); }
      const r = readinessFor(repo, today); expect(r.kind).toBe('score');
    }
  });
});
