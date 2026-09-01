// Composition root. Everything the screens touch hangs off this object; the model seams are constructed here and
// handed ONLY to the assembler / the meal estimator.
import type { SqlDriver } from '../db/driver';
import { migrate } from '../db/schema';
import { Repo } from '../db/repo';
import { MemoryService } from '../domain/memory';
import { ContextAssembler, buildTextModel } from '../domain/contextAssembler';
import { PlanService } from '../domain/planService';
import { ChatService } from '../domain/chatService';
import { CalendarService } from '../domain/calendar';
import { MealEstimator } from '../domain/mealEstimator';
import { buildVisionProvider } from '../domain/vision/providers';
import { exerciseLibrary } from '../seed/exerciseLibrary';
import { nutrientReference } from '../seed/nutrientReference';
import { loadAiConfig, type AiConfig } from '../ai/config';
import { GatedTextModel, GatedVisionProvider, defaultFlags, type DemoFlags } from '../ai/demoGate';
import { FakeTextModel } from '../ai/fakeTextModel';
import { seedDemo, resetFresh } from '../seed/demoSeed';
import { nowISO } from '../domain/dates';

export interface Terrain {
  repo: Repo; memory: MemoryService; assembler: ContextAssembler; plans: PlanService; chat: ChatService; calendar: CalendarService;
  meals: MealEstimator; library: typeof exerciseLibrary; nutrientRef: typeof nutrientReference; cfg: AiConfig;
  flags: DemoFlags; now(): string; modelName: string; visionName: string; usingFakeModel: boolean;
  resetDemo(): void; resetFresh(): void; isFresh(): boolean;
}

export function createTerrain(db: SqlDriver, opts: { now?: () => string } = {}): Terrain {
  migrate(db);
  const repo = new Repo(db);
  const cfg = loadAiConfig();
  const flags: DemoFlags = { ...defaultFlags };
  try { const saved = repo.getMeta('demo_flags'); if (saved) Object.assign(flags, JSON.parse(saved)); } catch { /* defaults */ }
  const baseModel = buildTextModel(cfg);
  const textModel = new GatedTextModel(baseModel, () => flags);
  const vision = new GatedVisionProvider(buildVisionProvider(cfg), () => flags);
  const memory = new MemoryService(repo);
  const assembler = new ContextAssembler(repo, memory, textModel, exerciseLibrary);
  const plans = new PlanService(repo, memory, assembler, exerciseLibrary);
  const calendar = new CalendarService(repo);
  const chat = new ChatService(repo, memory, assembler, plans, calendar);
  const meals = new MealEstimator(repo, vision);
  const now = opts.now ?? (() => nowISO());
  const t: Terrain = {
    repo, memory, assembler, plans, chat, calendar, meals, library: exerciseLibrary, nutrientRef: nutrientReference, cfg, flags, now,
    modelName: baseModel.name, visionName: vision.name, usingFakeModel: baseModel instanceof FakeTextModel,
    resetDemo: () => { seedDemo(repo, now()); db.persist(); },
    resetFresh: () => { resetFresh(repo, now()); db.persist(); },
    isFresh: () => !repo.getProfile()?.onboarded,
  };
  // First launch: nothing in the store and not explicitly reset to fresh ⇒ seed the demo user (R67).
  if (!repo.getProfile() && repo.getMeta('mode') !== 'fresh') t.resetDemo();
  return t;
}
