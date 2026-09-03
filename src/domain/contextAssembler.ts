// Context assembler (PRD R63): the single choke point for text. It reads the store and memory itself — those are its
// inputs, not the caller's — assembles a bounded payload, calls the text model, and validates every output.
// Five surfaces: chat, plan generation/patches, readiness explanation, nutrition-gap narration, injury→tags.
import { addDays, dayOf, DOW_LONG, dow, weekDays, weekStart, type ISODate } from './dates';
import type { Repo } from '../db/repo';
import type { MemoryService } from './memory';
import type { TextModel, TextRequest } from '../ai/textModel';
import { OpenRouterTextModel } from '../ai/openrouterText';
import { FakeTextModel } from '../ai/fakeTextModel';
import type { AiConfig } from '../ai/config';
import type { BaseContext, ChatPayload, ExplanationPayload, GapsPayload, InjuryPayload, PlanPayload } from './contextPayloads';
import { WEEKLY_PLAN_JSON_SCHEMA, WeeklyPlanSchema, type WeeklyPlan } from './plan';
import { CHAT_JSON_SCHEMA, ChatReplySchema, GAPS_JSON_SCHEMA, GapsNarrationSchema, INJURY_TAGS_JSON_SCHEMA, InjuryTagsSchema, type ChatReply, type GapsNarration } from './chatSchema';
import { checkSafety } from './safety';
import { readinessFor } from './readinessLoader';
import { toItem } from './calendar';
import type { ExerciseLibrary } from '../seed/exerciseLibrary';
import type { Gaps14 } from './nutrition';
import type { ReadinessResult } from './readiness';

export class ModelOutputError extends Error { constructor(msg: string, public violations: string[] = []) { super(msg); this.name = 'ModelOutputError'; } }

export function buildTextModel(cfg: AiConfig): TextModel { return cfg.openrouterKey ? new OpenRouterTextModel(cfg) : new FakeTextModel({ streamDelayMs: 18, latencyMs: 1400 }); }

const SYSTEM = `You are Nora, Terrain's coach. Plain, supportive, nonjudgmental language; short replies (under 120 words unless the user asks for detail), no markdown headings or bullet lists. Refer to exercises by their names, never by exercise_id. Refer to days by weekday name, never by ISO date. You never diagnose, prescribe treatment, or imply medical clearance; for concerning symptoms you refer the user to a qualified professional. Use only the context provided.`;

export class ContextAssembler {
  constructor(private repo: Repo, private memory: MemoryService, private model: TextModel, private library: ExerciseLibrary) {}
  get modelName() { return this.model.name; }

  // ---------- context
  private base(asOf: string): BaseContext {
    const today = dayOf(asOf);
    const p = this.repo.getProfile();
    const r = readinessFor(this.repo, today);
    const mem = this.memory.active();
    const recent = this.repo.activitiesBetween(addDays(today, -7), today);
    const results = this.repo.resultsFor(recent.map((a) => a.id));
    return {
      today, as_of: asOf,
      intake: p ? { goal: p.goal, goal_text: p.goalText, days_per_week: p.daysPerWeek, minutes_per_session: p.minutesPerSession, equipment: p.equipment, activities: p.activities, recurring: p.recurring.map((x) => ({ activity: x.activity, detail: x.detail, preferred_day: x.preferredDay, frequency: x.frequency })) } : null,
      targets: this.repo.getTargets() as unknown as Record<string, number>,
      signals_today: this.sharedSignals(today),
      readiness: r.kind === 'score' ? { score: r.score, band: r.band, components: r.components.map((c) => ({ key: c.key, score: Math.round(c.score), detail: c.detail })) } : { score: null, band: null, components: [] },
      memory: {
        injuries: mem.filter((m) => m.type === 'injury').map((m) => ({ id: m.id, text: m.text, tags: m.tags, resolved: m.resolved, date: m.date })),
        preferences: mem.filter((m) => m.type === 'preference').map((m) => m.text),
        context: mem.filter((m) => m.type === 'context').map((m) => `${m.date}: ${m.text}`),
      },
      recent_sessions: recent.map((a) => { const it = toItem(a, results.get(a.id) ?? null, today); const rs = it.result; return { id: a.id, date: a.date, name: a.name, type: a.type, status: it.status, difficulty: rs?.difficulty, pain: rs?.pain, pain_where: rs?.painWhere, note: rs?.note, paused: a.paused }; }).reverse(),
    };
  }
  /** R9/R43: the signal types in the assembled context — what "Sees N shared signals" counts. */
  sharedSignals(today: ISODate): Record<string, number> {
    const s = this.repo.signalsOn(today) as Record<string, number>;
    const meals = this.repo.mealsOn(today);
    if (meals.length) s.protein = meals.flatMap((m) => m.items).reduce((a, i) => a + i.proteinG, 0);
    const supps = this.repo.listSupplements();
    if (supps.length) s.supplements_taken = this.repo.takenOn(today).size;
    return s;
  }
  sharedSignalCount(asOf: string): number { return Object.keys(this.sharedSignals(dayOf(asOf))).length; }

  private render(payload: Record<string, unknown>): string { return JSON.stringify(payload, null, 1); }

  // ---------- 1. readiness explanation (R6)
  async explainReadiness(result: ReadinessResult, asOf: string, onToken?: (chunk: string) => void): Promise<string> {
    const today = dayOf(asOf);
    const acts = this.repo.activitiesOn(today);
    const planned = acts.find((a) => a.source === 'nora');
    const payload: ExplanationPayload = { ...this.base(asOf), plan_today: planned ? { name: planned.name, type: planned.type, subtitle: `${planned.minutes} min` } : null, rest_day: !acts.some((a) => a.source === 'nora') };
    if (result.kind === 'score') payload.readiness = { score: result.score, band: result.band, components: result.components.map((c) => ({ key: c.key, score: Math.round(c.score), detail: c.detail })) };
    const req: TextRequest = { surface: 'explanation', system: SYSTEM + ' Explain today\'s readiness score in at most two short sentences and 200 characters total, naming at least two of the contributing signals. No formula jargon, no lists.', user: this.render(payload as unknown as Record<string, unknown>), payload: payload as unknown as Record<string, unknown> };
    const res = await this.model.complete(req, onToken);
    if (!res.text.trim()) throw new ModelOutputError('empty explanation');
    return res.text.trim();
  }

  // ---------- 2. plan generation (R17/R18) — schema validation here; rails in PlanService
  async generatePlan(weekStartDate: ISODate, asOf: string, violations: string[] = []): Promise<WeeklyPlan> {
    const base = this.base(asOf);
    const today = base.today;
    const payload: PlanPayload = {
      ...base, week_start: weekStartDate, week_dates: weekDays(weekStartDate),
      contraindicated_tags: this.memory.activeContraindicatedTags(),
      library: this.library.all().map((e) => ({ id: e.id, name: e.name, pattern: e.pattern, tags: e.tags, venues: e.venues, muscles: e.muscles.primary, phases: e.phases, start_weight_lb: e.startWeightLb, reps: e.reps, sets: e.sets })),
      violations,
      readiness_recent: Array.from({ length: 7 }, (_, i) => { const d = addDays(today, -i); const r = readinessFor(this.repo, d); return { date: d, score: r.kind === 'score' ? r.score : null }; }),
    };
    const req: TextRequest = {
      surface: 'plan', payload: payload as unknown as Record<string, unknown>,
      system: SYSTEM + ` Produce a weekly plan as JSON. Rules: use only exercise_id values from the library; never use an exercise whose tags intersect contraindicated_tags; at most days_per_week distinct session dates; every gym session has warmup, main and cooldown phase entries in one exercise list; size the main block to the minutes available — about (minutes_per_session − 15) / 7.5 main exercises (45 min ⇒ 4), plus 1 warm-up and 1 cooldown; keep every recurring preference as a standing activity on its preferred day (it does not count as a training day). ${violations.length ? 'The previous attempt violated: ' + violations.join('; ') + '. Fix every violation.' : ''}`,
      user: this.render(payload as unknown as Record<string, unknown>), jsonSchema: { name: 'weekly_plan', schema: WEEKLY_PLAN_JSON_SCHEMA as unknown as Record<string, unknown> },
    };
    const res = await this.model.complete(req);
    const parsed = WeeklyPlanSchema.safeParse(res.json ?? safeJson(res.text));
    if (!parsed.success) throw new ModelOutputError('plan failed schema validation', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    return parsed.data;
  }

  // ---------- 3. chat (R43–R48, R53–R55)
  async chat(message: string, asOf: string, onToken?: (chunk: string) => void, violations: string[] = []): Promise<ChatReply> {
    const base = this.base(asOf);
    const ws = weekStart(base.today);
    const week = this.repo.activitiesBetween(ws, addDays(ws, 6));
    const results = this.repo.resultsFor(week.map((a) => a.id));
    const next = this.repo.activitiesBetween(addDays(base.today, 1), addDays(base.today, 14)).filter((a) => !a.paused);
    const intense = next.find((a) => a.type === 'sprint') ?? next.find((a) => a.type === 'gym') ?? null;
    const payload: ChatPayload = {
      ...base, message,
      week_plan: week.map((a) => ({ id: a.id, date: a.date, name: a.name, type: a.type, source: a.source, status: toItem(a, results.get(a.id) ?? null, base.today).status, paused: a.paused, exercise_ids: (a.exercises ?? []).map((e) => e.exerciseId), exercises: (a.exercises ?? []).map((e) => this.library.get(e.exerciseId)?.name ?? e.exerciseId) })),
      next_intense_session: intense ? { id: intense.id, name: intense.name, type: intense.type, date: intense.date, weekday: DOW_LONG[dow(intense.date)] } : null,
      contraindicated_tags: this.memory.activeContraindicatedTags(), violations,
    };
    const req: TextRequest = {
      surface: 'chat', payload: payload as unknown as Record<string, unknown>,
      system: SYSTEM + ` Reply as JSON. memory_writes: durable facts the user shared (type injury|preference|context). plan_patch: only when the user asks to change the schedule, with ops that move week_plan activities by id or swap an exercise id. target_proposal: only when the user asks about a fitness or nutrition target — propose a value from the goal, training load and history; never state it as already set. safety: set flagged=true for any concerning symptom (chest pain, dizziness, fainting, numbness, breathing trouble); a flagged reply must recommend a qualified professional (referral=true), name no diagnosis (no_diagnosis=true), never clear the user (no_clearance=true), and set action to pause next_intense_session. ${violations.length ? 'Previous attempt violated: ' + violations.join('; ') : ''}`,
      user: this.render(payload as unknown as Record<string, unknown>), jsonSchema: { name: 'nora_chat_reply', schema: CHAT_JSON_SCHEMA as unknown as Record<string, unknown> },
    };
    const res = await this.model.complete(req);
    const parsed = ChatReplySchema.safeParse(res.json ?? safeJson(res.text));
    if (!parsed.success) throw new ModelOutputError('chat reply failed schema validation', parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    const reply = parsed.data;
    const v = checkSafety(message, reply.safety, !!intense);
    if (v.length) {
      if (violations.length) throw new ModelOutputError('safety check failed twice', v);
      return this.chat(message, asOf, onToken, v); // re-prompt naming the violation
    }
    if (onToken) for (let i = 0; i < reply.reply.length; i += 4) onToken(reply.reply.slice(i, i + 4));
    // R61: injury text entering the system is structured into tags by the same schema-validated call.
    for (const w of reply.memory_writes) if (w.type === 'injury' && !w.tags.length) w.tags = await this.structureInjury(w.text);
    return reply;
  }

  // ---------- 4. nutrition-gap narration (R72)
  async narrateGaps(gaps: Gaps14, asOf: string): Promise<GapsNarration> {
    const payload: GapsPayload = { ...this.base(asOf), gaps: { days: gaps.days, logged_days: gaps.loggedDays,
      ranked: gaps.ranked.map((g) => ({ key: g.key, label: g.label, unit: g.unit, avg_per_day: g.avgPerDay, target: g.target, ratio: g.ratio, ceiling: g.ceiling })),
      on_track: gaps.onTrack.map((g) => g.key), supplements: gaps.supplementCoverage.map((s) => ({ name: s.name, nutrient_key: s.nutrientKey, adherence: +s.adherence.toFixed(2) })) } };
    const req: TextRequest = { surface: 'nutrition_gaps', payload: payload as unknown as Record<string, unknown>, system: SYSTEM + ' Narrate the ranked nutrient gaps as JSON: for each, a name, a short stat and a plain-language note on cause and fix; then one summary line. A nutrient covered by a daily supplement is excluded or narrated as covered.', user: this.render(payload as unknown as Record<string, unknown>), jsonSchema: { name: 'nutrition_gaps', schema: GAPS_JSON_SCHEMA as unknown as Record<string, unknown> } };
    const res = await this.model.complete(req);
    const parsed = GapsNarrationSchema.safeParse(res.json ?? safeJson(res.text));
    if (!parsed.success) throw new ModelOutputError('gap narration failed schema validation');
    return parsed.data;
  }

  // ---------- 5. injury → contraindicated tags (R61)
  async structureInjury(text: string): Promise<string[]> {
    const payload: InjuryPayload = { text, vocabulary: this.library.tagVocabulary() };
    const req: TextRequest = { surface: 'injury_tags', payload: payload as unknown as Record<string, unknown>, system: 'Map the injury description to contraindicated exercise tags. Use only tags from the vocabulary. Return JSON {"tags": [...]}.', user: this.render(payload as unknown as Record<string, unknown>), jsonSchema: { name: 'injury_tags', schema: INJURY_TAGS_JSON_SCHEMA as unknown as Record<string, unknown> } };
    const res = await this.model.complete(req);
    const parsed = InjuryTagsSchema.safeParse(res.json ?? safeJson(res.text));
    if (!parsed.success) throw new ModelOutputError('injury tags failed schema validation');
    const vocab = new Set(this.library.tagVocabulary());
    return parsed.data.tags.filter((t) => vocab.has(t));
  }
}
function safeJson(s: string): unknown { try { return JSON.parse(s); } catch { return null; } }
