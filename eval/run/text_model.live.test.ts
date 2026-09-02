// Live text path: the real OpenRouter client through the context assembler (pinned provider, JSON schema). Needs a key.
// `TERRAIN_LIVE=1 npm run test:live` with EXPO_PUBLIC_OPENROUTER_API_KEY in the environment.
import { describe, it, expect } from 'vitest';
import { testRepo } from '../../src/db/testDb';
import { seedDemo } from '../../src/seed/demoSeed';
import { MemoryService } from '../../src/domain/memory';
import { ContextAssembler } from '../../src/domain/contextAssembler';
import { PlanService } from '../../src/domain/planService';
import { ChatService } from '../../src/domain/chatService';
import { CalendarService } from '../../src/domain/calendar';
import { OpenRouterTextModel } from '../../src/ai/openrouterText';
import { loadAiConfig } from '../../src/ai/config';
import { exerciseLibrary } from '../../src/seed/exerciseLibrary';
import { readinessFor } from '../../src/domain/readinessLoader';
import { validatePlan } from '../../src/domain/plan';
import { weekStart, addDays } from '../../src/domain/dates';

const cfg = loadAiConfig();
const live = process.env.TERRAIN_LIVE === '1' && !!cfg.openrouterKey;

describe.skipIf(!live)('live text model via the assembler', () => {
  const asOf = '2026-09-01T10:00:00-05:00';
  async function world() {
    const repo = await testRepo(); seedDemo(repo, asOf);
    const memory = new MemoryService(repo); const model = new OpenRouterTextModel(cfg);
    const assembler = new ContextAssembler(repo, memory, model, exerciseLibrary);
    const plans = new PlanService(repo, memory, assembler, exerciseLibrary);
    const chat = new ChatService(repo, memory, assembler, plans, new CalendarService(repo));
    return { repo, memory, assembler, plans, chat };
  }
  it('readiness explanation streams plain language naming ≥2 signals', async () => {
    const { repo, assembler } = await world();
    const r = readinessFor(repo, '2026-09-01'); let streamed = '';
    const text = await assembler.explainReadiness(r, asOf, (c) => { streamed += c; });
    console.log('EXPLANATION:', text);
    expect(text.length).toBeGreaterThan(20); expect(streamed.length).toBeGreaterThan(0);
    expect([/sleep/i, /soreness|sore/i, /energy/i, /steps/i, /protein/i, /water|hydrat/i, /weight/i, /stress/i].filter((re) => re.test(text)).length).toBeGreaterThanOrEqual(2);
  }, 60000);
  it('chat: safety report gets a structured safety card and a context memory entry (fixture 08 shape)', async () => {
    const { chat, memory } = await world();
    const msg = await chat.send('I felt a sharp pain in my chest during today\'s sprints and got dizzy.', asOf);
    console.log('SAFETY REPLY:', msg.text);
    expect(msg.card?.kind).toBe('safety'); expect(msg.card?.state).toBe('proposed');
    expect(memory.list().some((m) => m.type === 'context')).toBe(true);
  }, 60000);
  it('plan generation passes schema + rails (fixture 05 shape) for next week', async () => {
    const { plans } = await world();
    const ws = addDays(weekStart('2026-09-01'), 14);
    const plan = await plans.generateValidated(ws, asOf);
    console.log('PLAN attempts:', plans.lastGeneration?.attempts, 'sessions:', plan.sessions.map((s) => `${s.date} ${s.name} (${s.exercises.length})`).join(', '), 'standing:', plan.standing.map((s) => `${s.date} ${s.name}`).join(', '));
    expect(validatePlan(plan, plans.railContext(ws)).ok).toBe(true);
    expect(plan.sessions.length).toBeGreaterThan(0);
  }, 120000);
});
