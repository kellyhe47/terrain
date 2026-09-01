// Fixture 10 → operations: ContextAssembler.structureInjury (chat injury → tags), MemoryService (persist/resolve/delete),
// PlanService.generateValidated on 2026-08-24 with a spy model capturing the planning payload.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadFixture } from './fixtures';
import { testRepo } from '../../src/db/testDb';
import { MemoryService } from '../../src/domain/memory';
import { ContextAssembler } from '../../src/domain/contextAssembler';
import { PlanService } from '../../src/domain/planService';
import { FakeTextModel } from '../../src/ai/fakeTextModel';
import { exerciseLibrary } from '../../src/seed/exerciseLibrary';
import { weekStart, dayOf } from '../../src/domain/dates';
import type { TextModel, TextRequest, TextResponse } from '../../src/ai/textModel';
import type { WeeklyPlan } from '../../src/domain/plan';

const f = loadFixture('10_adaptation_memory.json');
class SpyModel implements TextModel {
  name = 'spy'; requests: TextRequest[] = []; inner = new FakeTextModel();
  complete(req: TextRequest, onToken?: (c: string) => void): Promise<TextResponse> { this.requests.push(req); return this.inner.complete(req, onToken); }
}
async function world(withInjury: boolean) {
  const repo = await testRepo();
  repo.saveProfile({ goal: 'Strength', goalText: 'build strength', daysPerWeek: 4, minutesPerSession: 45, equipment: 'Commercial gym', activities: ['Running'], recurring: [], injuriesText: '', onboarded: true, installedAt: '2026-08-01T00:00:00-05:00' });
  const memory = new MemoryService(repo); const model = new SpyModel();
  const assembler = new ContextAssembler(repo, memory, model, exerciseLibrary);
  const plans = new PlanService(repo, memory, assembler, exerciseLibrary);
  let entry = null as null | ReturnType<MemoryService['add']>;
  if (withInjury) {
    const h = f.given.history[0];
    const tags = await assembler.structureInjury(h.content); // "shoulder pain during overhead press"
    entry = memory.add('injury', h.stored_as.text, `${h.date}T18:00:00-05:00`, tags, h.date);
  }
  return { repo, memory, model, assembler, plans, entry };
}
const lowerBody = (p: WeeklyPlan) => p.sessions.filter((s) => s.type === 'gym' && s.name === 'Lower body').map((s) => s.exercises.map((e) => e.exercise_id));

describe('fixture 10 adaptation_memory', () => {
  const ws = weekStart(dayOf(f.given.as_of));
  let w: Awaited<ReturnType<typeof world>>, plan: WeeklyPlan;
  beforeAll(async () => { w = await world(true); plan = await w.plans.generateValidated(ws, f.given.as_of); });

  it('the chat injury is structured into the fixture tags and stored as a typed, dated INJURY row', () => {
    expect(w.entry?.tags).toEqual(f.given.contraindicated_exercise_tags);
    expect(w.entry?.type).toBe('injury'); expect(w.entry?.date).toBe('2026-08-19'); expect(w.entry?.resolved).toBe(false);
  });
  it('the planning payload carries the injury note (inspectable, not vibes)', () => {
    const planReq = w.model.requests.find((r) => r.surface === 'plan')!;
    const payload = planReq.payload as any;
    expect(payload.memory.injuries.map((i: any) => i.text)).toContain(f.given.history[0].stored_as.text);
    expect(payload.contraindicated_tags).toEqual(['overhead_press']);
  });
  it('excludes exercises tagged overhead_press five days after the report', () => {
    for (const s of plan.sessions) for (const e of s.exercises) expect(exerciseLibrary.get(e.exercise_id)!.tags).not.toContain('overhead_press');
  });
  it('control: unrelated lower-body exercises are unchanged by the shoulder injury', async () => {
    const control = await (await world(false)).plans.generateValidated(ws, f.given.as_of);
    expect(lowerBody(plan)).toEqual(lowerBody(control));
    expect(lowerBody(plan).length).toBeGreaterThan(0);
  });
  it('resolve semantics: resolved injuries stop contraindicating; only injury entries resolve', async () => {
    expect(w.memory.resolve(w.entry!.id)).toBe(true);
    expect(w.memory.activeContraindicatedTags()).toEqual([]);
    const pref = w.memory.add('preference', 'Saturday run — keep it', f.given.as_of);
    expect(w.memory.resolve(pref.id)).toBe(false);
    const after = await w.plans.generateValidated(ws, f.given.as_of);
    const req = w.model.requests.filter((r) => r.surface === 'plan').pop()!;
    expect((req.payload as any).contraindicated_tags).toEqual([]);
    expect((req.payload as any).memory.injuries[0].resolved).toBe(true);
    expect(after.sessions.length).toBeGreaterThan(0);
  });
  it('deleted entry leaves the next assembled payload immediately, no regeneration required', async () => {
    w.memory.delete(w.entry!.id);
    await w.plans.generateValidated(ws, f.given.as_of);
    const req = w.model.requests.filter((r) => r.surface === 'plan').pop()!;
    expect((req.payload as any).memory.injuries).toEqual([]);
  });
});
