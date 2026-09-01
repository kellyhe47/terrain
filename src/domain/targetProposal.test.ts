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

describe('R11a: Nora proposes a target; only the user sets it', () => {
  it('proposal card → Set target persists the value as the user\'s own', async () => {
    const asOf = '2026-09-01T10:00:00-05:00';
    const repo = await testRepo(); seedDemo(repo, asOf);
    const memory = new MemoryService(repo); const assembler = new ContextAssembler(repo, memory, new FakeTextModel(), exerciseLibrary);
    const chat = new ChatService(repo, memory, assembler, new PlanService(repo, memory, assembler, exerciseLibrary), new CalendarService(repo));
    const before = repo.getTargets().protein_g;
    const msg = await chat.send('Should I raise my protein target?', asOf);
    expect(msg.card?.kind).toBe('target'); expect(msg.card?.state).toBe('proposed');
    expect(repo.getTargets().protein_g).toBe(before); // nothing set silently
    chat.declinePatch(msg.id); expect(chat.history().find((m) => m.id === msg.id)?.card?.state).toBe('declined');
    chat.reconsiderPatch(msg.id);
    const r = chat.applyTarget(msg.id); expect(r.ok).toBe(true);
    expect(repo.getTargets().protein_g).toBe(msg.card!.target!.value);
    expect(repo.getTargets().protein_g).toBeGreaterThan(before);
  });
});
