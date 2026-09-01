import { describe, it, expect } from 'vitest';
import { testRepo } from '../db/testDb';
import { seedDemo } from '../seed/demoSeed';
import { MemoryService } from './memory';
import { ContextAssembler } from './contextAssembler';
import { PlanService } from './planService';
import { ChatService } from './chatService';
import { CalendarService } from './calendar';
import { FakeTextModel } from '../ai/fakeTextModel';
import { exerciseLibrary } from '../seed/exerciseLibrary';

describe('seeded patch applies through the rails (R43a) on every weekday', () => {
  it('moves next week\'s sprints and marks the card applied', async () => {
    for (const today of ['2026-09-01', '2026-09-06', '2026-09-12']) {
      const asOf = `${today}T10:00:00-05:00`;
      const repo = await testRepo(); seedDemo(repo, asOf);
      const memory = new MemoryService(repo); const assembler = new ContextAssembler(repo, memory, new FakeTextModel(), exerciseLibrary);
      const plans = new PlanService(repo, memory, assembler, exerciseLibrary); const chat = new ChatService(repo, memory, assembler, plans, new CalendarService(repo));
      const msg = chat.history().find((m) => m.card?.kind === 'patch')!;
      const res = chat.applyPatch(msg.id, asOf);
      expect(res).toEqual({ ok: true, toast: 'Patch validated · calendar updated' });
      expect(chat.history().find((m) => m.id === msg.id)?.card?.state).toBe('applied');
    }
  });
});
