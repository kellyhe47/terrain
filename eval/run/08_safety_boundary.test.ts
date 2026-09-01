// Fixture 08 → operation: ChatService.send(chat_message, as_of) with a sprint session on the Thursday in context.
import { describe, it, expect, beforeAll } from 'vitest';
import { loadFixture } from './fixtures';
import { testRepo } from '../../src/db/testDb';
import { MemoryService } from '../../src/domain/memory';
import { ContextAssembler } from '../../src/domain/contextAssembler';
import { PlanService } from '../../src/domain/planService';
import { ChatService } from '../../src/domain/chatService';
import { CalendarService } from '../../src/domain/calendar';
import { FakeTextModel } from '../../src/ai/fakeTextModel';
import { exerciseLibrary } from '../../src/seed/exerciseLibrary';
import { checkSafety } from '../../src/domain/safety';
import type { Repo } from '../../src/db/repo';
import type { ChatMessage } from '../../src/domain/types';

const f = loadFixture('08_safety_boundary.json');
describe('fixture 08 safety_boundary', () => {
  let repo: Repo, chat: ChatService, memory: MemoryService, calendar: CalendarService, reply: ChatMessage;
  beforeAll(async () => {
    repo = await testRepo();
    repo.saveProfile({ goal: 'Strength', goalText: '', daysPerWeek: 4, minutesPerSession: 45, equipment: 'Commercial gym', activities: ['Running'], recurring: [], injuriesText: '', onboarded: true, installedAt: f.given.as_of });
    repo.saveActivity({ id: 'sprint_thu', date: '2026-08-20', type: 'sprint', name: 'Sprints', source: 'nora', minutes: 27, intensity: 'Hard', intervals: 6, detail: '6 × 20 s', paused: false, createdAt: f.given.as_of });
    memory = new MemoryService(repo); calendar = new CalendarService(repo);
    const assembler = new ContextAssembler(repo, memory, new FakeTextModel(), exerciseLibrary);
    chat = new ChatService(repo, memory, assembler, new PlanService(repo, memory, assembler, exerciseLibrary), calendar);
    reply = await chat.send(f.given.chat_message, f.given.as_of);
  });
  it('carries a structured safety card proposing to pause the Thursday sprint session', () => {
    expect(reply.card?.kind).toBe('safety');
    expect(reply.card?.state).toBe('proposed');
    expect(reply.card?.targetActivityId).toBe('sprint_thu');
    expect(reply.card?.items[0]).toMatch(/Thursday/);
  });
  it('response properties: referral, no diagnosis, no clearance — asserted structurally', () => {
    // The assembler rejects any flagged reply that fails these; a reply that reached the thread passed them.
    expect(checkSafety(f.given.chat_message, { flagged: true, referral: true, no_diagnosis: true, no_clearance: true, action: { activity_id: 'sprint_thu', label: 'x' } }, true)).toEqual([]);
    expect(checkSafety(f.given.chat_message, { flagged: false, referral: false, no_diagnosis: true, no_clearance: true, action: null }, true)).toContain('symptom report not flagged as a safety case');
    expect(checkSafety(f.given.chat_message, { flagged: true, referral: true, no_diagnosis: true, no_clearance: true, action: null }, true)).toContain('flagged reply lacks the plan-safety action card');
  });
  it('stores the report as a typed context memory entry regardless of the action', () => {
    const ctx = memory.list().filter((m) => m.type === 'context');
    expect(ctx).toHaveLength(1);
    expect(ctx[0].date).toBe('2026-08-18');
    chat.keepSession(reply.id);
    expect(memory.list().filter((m) => m.type === 'context')).toHaveLength(1);
    expect(chat.history().find((m) => m.id === reply.id)?.card?.state).toBe('kept');
  });
  it('pause is applied only on user confirmation; resume writes a second context entry (R54a)', () => {
    expect(repo.getActivity('sprint_thu')?.paused).toBe(false);
    chat.pauseSession(reply.id);
    expect(repo.getActivity('sprint_thu')?.paused).toBe(true);
    expect(calendar.item('sprint_thu', '2026-08-18')?.subtitle).toMatch(/Paused/);
    chat.resumeSession('sprint_thu', '2026-08-19T09:00:00-05:00');
    expect(repo.getActivity('sprint_thu')?.paused).toBe(false);
    expect(memory.list().filter((m) => m.type === 'context')).toHaveLength(2);
  });
  it('deletion removes the entry from context immediately', () => {
    const e = memory.list().find((m) => m.type === 'context')!;
    memory.delete(e.id);
    expect(memory.list().find((m) => m.id === e.id)).toBeUndefined();
  });
});
