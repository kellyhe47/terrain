// Plan service (R17–R23, R28): generation with rails + re-prompt, patch application through the same rails.
import { addDays, dayOf, weekStart, type ISODate } from './dates';
import type { Repo } from '../db/repo';
import type { MemoryService } from './memory';
import { ContextAssembler, ModelOutputError } from './contextAssembler';
import { materializePlan, planFromActivities, validatePlan, type RailContext, type WeeklyPlan } from './plan';
import type { ExerciseLibrary } from '../seed/exerciseLibrary';
import type { Activity } from './types';
import type { PatchOp } from './chatSchema';

export interface GenerationLog { attempts: number; violations: string[][]; }

export class PlanService {
  lastGeneration: GenerationLog | null = null;
  constructor(private repo: Repo, private memory: MemoryService, private assembler: ContextAssembler, private library: ExerciseLibrary) {}

  railContext(weekStart: ISODate): RailContext {
    const p = this.repo.getProfile();
    return { library: this.library, contraindicatedTags: this.memory.activeContraindicatedTags(), daysAvailable: p?.daysPerWeek ?? 4, recurring: p?.recurring ?? [], weekStart };
  }

  /** Generate + validate; violations are named back to the model; up to 3 attempts. Never silently accepted (R18). */
  async generateValidated(weekStart: ISODate, asOf: string): Promise<WeeklyPlan> {
    const log: GenerationLog = { attempts: 0, violations: [] };
    this.lastGeneration = log;
    let violations: string[] = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      log.attempts++;
      const plan = await this.assembler.generatePlan(weekStart, asOf, violations);
      const rails = validatePlan(plan, this.railContext(weekStart));
      if (rails.ok) return plan;
      violations = rails.violations; log.violations.push(violations);
    }
    throw new ModelOutputError('plan violated the rails after 3 attempts', violations);
  }

  /** R23/R29: fill an empty week (or the empty remainder of it). Marks the week regenerating while it runs. */
  async generateWeek(weekStart: ISODate, asOf: string): Promise<Activity[]> {
    this.repo.savePlanWeek({ weekStart, status: 'regenerating', summary: '', generatedAt: asOf });
    try {
      const plan = await this.generateValidated(weekStart, asOf);
      const acts = materializePlan(plan, asOf);
      const today = dayOf(asOf);
      this.repo.transaction(() => {
        for (const a of acts) { if (a.date < today) continue; this.repo.saveActivity(a); }
        this.repo.savePlanWeek({ weekStart, status: 'planned', summary: plan.summary, restReason: plan.rest_reason, generatedAt: asOf });
      });
      return acts;
    } catch (e) {
      this.repo.savePlanWeek({ weekStart, status: 'planned', summary: '', generatedAt: asOf });
      throw e;
    }
  }

  /** Onboarding: the first week is generated for the current week and (if past mid-week) the next one too. */
  async generateFirstWeeks(asOf: string): Promise<{ weekStart: ISODate; activities: Activity[]; summary: string }> {
    const today = dayOf(asOf);
    const ws = weekStart(today);
    const acts = await this.generateWeek(ws, asOf);
    const pw = this.repo.getPlanWeek(ws);
    return { weekStart: ws, activities: acts.filter((a) => a.date >= today), summary: pw?.summary ?? '' };
  }

  /** Apply a patch in memory, re-run the rails on the resulting week, then persist (R28). */
  applyPatch(ops: PatchOp[], asOf: string): { ok: true; touched: ISODate[] } | { ok: false; violations: string[] } {
    const touched = new Set<ISODate>();
    const acts = new Map<string, Activity>();
    for (const op of ops) { const a = this.repo.getActivity(op.activity_id); if (!a) return { ok: false, violations: [`activity ${op.activity_id} not found`] }; acts.set(a.id, { ...a }); }
    const weekOf = (d: ISODate) => weekStart(d); // local-calendar week (never `new Date(iso)`: that parses as UTC)
    for (const op of ops) {
      const a = acts.get(op.activity_id)!;
      if (op.op === 'move') { touched.add(a.date); a.date = op.to_date; touched.add(op.to_date); }
      else { a.exercises = (a.exercises ?? []).map((e) => (e.exerciseId === op.from_exercise_id ? { ...e, exerciseId: op.to_exercise_id, weightLb: this.library.get(op.to_exercise_id)?.startWeightLb ?? e.weightLb } : e)); touched.add(a.date); }
    }
    const weeks = new Set([...acts.values()].map((a) => weekOf(a.date)));
    for (const ws of weeks) {
      const week = this.repo.activitiesBetween(ws, addDays(ws, 6)).filter((a) => !acts.has(a.id)).concat([...acts.values()].filter((a) => weekOf(a.date) === ws));
      const rails = validatePlan(planFromActivities(ws, week), { ...this.railContext(ws), weekStart: ws });
      if (!rails.ok) return { ok: false, violations: rails.violations };
    }
    this.repo.transaction(() => { for (const a of acts.values()) this.repo.saveActivity(a); });
    return { ok: true, touched: [...touched] };
  }
}
