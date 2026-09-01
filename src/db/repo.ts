// Typed repositories over the SqlDriver. Sync. Every read that depends on "today" takes an explicit date.
import type { SqlDriver, Row } from './driver';
import type { ISODate } from '../domain/dates';
import type {
  Activity, ActivityResult, ChatMessage, Meal, MemoryEntry, PersonalRecord, PlanWeek, Profile, Signal, SignalType,
  Supplement, TargetKey, Targets,
} from '../domain/types';

const num = (v: unknown): number => (v == null ? NaN : Number(v));
const bool = (v: unknown): boolean => Number(v) === 1;
const j = <T,>(v: unknown, fb: T): T => { if (v == null || v === '') return fb; try { return JSON.parse(String(v)) as T; } catch { return fb; } };

export const DEFAULT_TARGETS: Targets = { protein_g: 120, hydration_l: 2.5, steps: 10000, calories: 2200, carbs_g: 240, fat_g: 70, fiber_g: 30 };

export class Repo {
  constructor(public readonly db: SqlDriver) {}
  transaction<T>(fn: () => T): T { return this.db.transaction(fn); }

  // ---- meta
  getMeta(key: string): string | null { const r = this.db.get<{ value: string }>('SELECT value FROM meta WHERE key = ?', [key]); return r ? r.value : null; }
  setMeta(key: string, value: string): void { this.db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', [key, value]); }

  // ---- profile
  getProfile(): Profile | null {
    const r = this.db.get('SELECT * FROM profile WHERE id = 1');
    if (!r) return null;
    return {
      goal: r.goal as Profile['goal'], goalText: String(r.goal_text ?? ''), daysPerWeek: num(r.days_per_week), minutesPerSession: num(r.minutes_per_session),
      equipment: r.equipment as Profile['equipment'], activities: j<string[]>(r.activities_json, []), recurring: j(r.recurring_json, []),
      injuriesText: String(r.injuries_text ?? ''), onboarded: bool(r.onboarded), installedAt: String(r.installed_at),
    };
  }
  saveProfile(p: Profile): void {
    this.db.run(`INSERT OR REPLACE INTO profile (id, goal, goal_text, days_per_week, minutes_per_session, equipment, activities_json, recurring_json, injuries_text, onboarded, installed_at)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.goal, p.goalText, p.daysPerWeek, p.minutesPerSession, p.equipment, JSON.stringify(p.activities), JSON.stringify(p.recurring), p.injuriesText, p.onboarded ? 1 : 0, p.installedAt]);
  }

  // ---- targets (R11: the user's own; defaults only seed a fresh row)
  getTargets(): Targets {
    const t = { ...DEFAULT_TARGETS };
    for (const r of this.db.all<{ key: TargetKey; value: number }>('SELECT key, value FROM targets')) t[r.key] = Number(r.value);
    return t;
  }
  setTarget(key: TargetKey, value: number): void { this.db.run('INSERT OR REPLACE INTO targets (key, value) VALUES (?, ?)', [key, value]); }
  hasTarget(key: TargetKey): boolean { return !!this.db.get('SELECT 1 FROM targets WHERE key = ?', [key]); }

  // ---- signals
  upsertSignal(s: Signal): void { this.db.run('INSERT OR REPLACE INTO signals (date, type, value, logged_at) VALUES (?, ?, ?, ?)', [s.date, s.type, s.value, s.loggedAt]); }
  signalsOn(date: ISODate): Partial<Record<SignalType, number>> {
    const out: Partial<Record<SignalType, number>> = {};
    for (const r of this.db.all<{ type: SignalType; value: number }>('SELECT type, value FROM signals WHERE date = ?', [date])) out[r.type] = Number(r.value);
    return out;
  }
  signalsBetween(from: ISODate, to: ISODate): Signal[] {
    return this.db.all('SELECT * FROM signals WHERE date >= ? AND date <= ? ORDER BY date', [from, to]).map((r) => ({ date: String(r.date), type: r.type as SignalType, value: Number(r.value), loggedAt: String(r.logged_at) }));
  }
  signalSeries(type: SignalType, from: ISODate, to: ISODate): Array<{ date: ISODate; value: number }> {
    return this.db.all('SELECT date, value FROM signals WHERE type = ? AND date >= ? AND date <= ? ORDER BY date', [type, from, to]).map((r) => ({ date: String(r.date), value: Number(r.value) }));
  }

  // ---- activities
  private rowToActivity(r: Row): Activity {
    return {
      id: String(r.id), date: String(r.date), type: r.type as Activity['type'], name: String(r.name), source: r.source as Activity['source'],
      minutes: num(r.minutes), intensity: r.intensity as Activity['intensity'], startTime: r.start_time ? String(r.start_time) : undefined,
      detail: r.detail ? String(r.detail) : undefined, focus: r.focus ? String(r.focus) : undefined,
      distanceMi: r.distance_mi == null ? undefined : Number(r.distance_mi),
      exercises: r.exercises_json ? j(r.exercises_json, undefined) : undefined, intervals: r.intervals == null ? undefined : num(r.intervals),
      paused: bool(r.paused), createdAt: String(r.created_at),
    };
  }
  saveActivity(a: Activity): void {
    this.db.run(`INSERT OR REPLACE INTO activities (id, date, type, name, source, minutes, intensity, start_time, detail, focus, distance_mi, exercises_json, intervals, paused, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.date, a.type, a.name, a.source, a.minutes, a.intensity, a.startTime ?? null, a.detail ?? null, a.focus ?? null, a.distanceMi ?? null,
        a.exercises ? JSON.stringify(a.exercises) : null, a.intervals ?? null, a.paused ? 1 : 0, a.createdAt]);
  }
  getActivity(id: string): Activity | null { const r = this.db.get('SELECT * FROM activities WHERE id = ?', [id]); return r ? this.rowToActivity(r) : null; }
  deleteActivity(id: string): void { this.db.run('DELETE FROM activities WHERE id = ?', [id]); }
  activitiesBetween(from: ISODate, to: ISODate): Activity[] {
    return this.db.all('SELECT * FROM activities WHERE date >= ? AND date <= ? ORDER BY date, COALESCE(start_time, "99"), created_at', [from, to]).map((r) => this.rowToActivity(r));
  }
  activitiesOn(date: ISODate): Activity[] { return this.activitiesBetween(date, date); }
  allActivities(): Activity[] { return this.db.all('SELECT * FROM activities ORDER BY date, created_at').map((r) => this.rowToActivity(r)); }

  // ---- results
  private rowToResult(r: Row): ActivityResult {
    return {
      activityId: String(r.activity_id), outcome: r.outcome as ActivityResult['outcome'],
      doneCount: r.done_count == null ? undefined : num(r.done_count), totalCount: r.total_count == null ? undefined : num(r.total_count),
      minutes: r.minutes == null ? undefined : num(r.minutes), distanceMi: r.distance_mi == null ? undefined : Number(r.distance_mi),
      difficulty: r.difficulty == null ? undefined : num(r.difficulty), pain: r.pain == null ? undefined : bool(r.pain),
      painWhere: r.pain_where ? String(r.pain_where) : undefined, note: r.note ? String(r.note) : undefined,
      sets: r.sets_json ? j(r.sets_json, undefined) : undefined, subtitleNote: r.subtitle_note ? String(r.subtitle_note) : undefined, loggedAt: String(r.logged_at),
    };
  }
  saveResult(res: ActivityResult): void {
    this.db.run(`INSERT OR REPLACE INTO results (activity_id, outcome, done_count, total_count, minutes, distance_mi, difficulty, pain, pain_where, note, sets_json, subtitle_note, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [res.activityId, res.outcome, res.doneCount ?? null, res.totalCount ?? null, res.minutes ?? null, res.distanceMi ?? null, res.difficulty ?? null,
        res.pain == null ? null : res.pain ? 1 : 0, res.painWhere ?? null, res.note ?? null, res.sets ? JSON.stringify(res.sets) : null, res.subtitleNote ?? null, res.loggedAt]);
  }
  deleteResult(activityId: string): void { this.db.run('DELETE FROM results WHERE activity_id = ?', [activityId]); }
  getResult(activityId: string): ActivityResult | null { const r = this.db.get('SELECT * FROM results WHERE activity_id = ?', [activityId]); return r ? this.rowToResult(r) : null; }
  resultsFor(ids: string[]): Map<string, ActivityResult> {
    const m = new Map<string, ActivityResult>();
    if (!ids.length) return m;
    const rows = this.db.all(`SELECT * FROM results WHERE activity_id IN (${ids.map(() => '?').join(',')})`, ids);
    for (const r of rows) { const res = this.rowToResult(r); m.set(res.activityId, res); }
    return m;
  }

  // ---- meals
  private rowToMeal(r: Row): Meal {
    return { id: String(r.id), date: String(r.date), time: String(r.time), name: String(r.name), imageUri: r.image_uri ? String(r.image_uri) : null,
      confidence: (r.confidence as Meal['confidence']) ?? null, items: j(r.items_json, []), createdAt: String(r.created_at) };
  }
  saveMeal(m: Meal): void {
    this.db.run('INSERT OR REPLACE INTO meals (id, date, time, name, image_uri, confidence, items_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [m.id, m.date, m.time, m.name, m.imageUri, m.confidence, JSON.stringify(m.items), m.createdAt]);
  }
  mealsBetween(from: ISODate, to: ISODate): Meal[] { return this.db.all('SELECT * FROM meals WHERE date >= ? AND date <= ? ORDER BY date, time', [from, to]).map((r) => this.rowToMeal(r)); }
  mealsOn(date: ISODate): Meal[] { return this.mealsBetween(date, date); }

  // ---- supplements
  listSupplements(): Supplement[] {
    return this.db.all('SELECT * FROM supplements ORDER BY sort').map((r) => ({ id: String(r.id), name: String(r.name), dose: String(r.dose), nutrientKey: r.nutrient_key ? String(r.nutrient_key) : undefined, sort: num(r.sort) }));
  }
  saveSupplement(s: Supplement): void { this.db.run('INSERT OR REPLACE INTO supplements (id, name, dose, nutrient_key, sort) VALUES (?, ?, ?, ?, ?)', [s.id, s.name, s.dose, s.nutrientKey ?? null, s.sort]); }
  setTaken(supplementId: string, date: ISODate, taken: boolean): void { this.db.run('INSERT OR REPLACE INTO supplement_takes (supplement_id, date, taken) VALUES (?, ?, ?)', [supplementId, date, taken ? 1 : 0]); }
  takenOn(date: ISODate): Set<string> { return new Set(this.db.all<{ supplement_id: string }>('SELECT supplement_id FROM supplement_takes WHERE date = ? AND taken = 1', [date]).map((r) => r.supplement_id)); }
  takesBetween(from: ISODate, to: ISODate): Array<{ supplementId: string; date: ISODate }> {
    return this.db.all('SELECT supplement_id, date FROM supplement_takes WHERE taken = 1 AND date >= ? AND date <= ?', [from, to]).map((r) => ({ supplementId: String(r.supplement_id), date: String(r.date) }));
  }

  // ---- memory
  private rowToMemory(r: Row): MemoryEntry { return { id: String(r.id), type: r.type as MemoryEntry['type'], text: String(r.text), date: String(r.date), tags: j(r.tags_json, []), resolved: bool(r.resolved), createdAt: String(r.created_at) }; }
  listMemory(): MemoryEntry[] { return this.db.all('SELECT * FROM memory ORDER BY date DESC, created_at DESC').map((r) => this.rowToMemory(r)); }
  saveMemory(m: MemoryEntry): void { this.db.run('INSERT OR REPLACE INTO memory (id, type, text, date, tags_json, resolved, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [m.id, m.type, m.text, m.date, JSON.stringify(m.tags), m.resolved ? 1 : 0, m.createdAt]); }
  deleteMemory(id: string): void { this.db.run('DELETE FROM memory WHERE id = ?', [id]); }

  // ---- PRs
  listPRs(): PersonalRecord[] { return this.db.all('SELECT * FROM prs ORDER BY date DESC').map((r) => ({ id: String(r.id), activity: String(r.activity), kind: r.kind as PersonalRecord['kind'], result: String(r.result), date: String(r.date) })); }
  savePR(p: PersonalRecord): void { this.db.run('INSERT OR REPLACE INTO prs (id, activity, kind, result, date) VALUES (?, ?, ?, ?, ?)', [p.id, p.activity, p.kind, p.result, p.date]); }

  // ---- chat
  listChat(): ChatMessage[] { return this.db.all('SELECT * FROM chat_messages ORDER BY created_at, rowid').map((r) => ({ id: String(r.id), role: r.role as ChatMessage['role'], text: String(r.text), card: r.card_json ? j(r.card_json, null) : null, createdAt: String(r.created_at) })); }
  saveChat(m: ChatMessage): void { this.db.run('INSERT OR REPLACE INTO chat_messages (id, role, text, card_json, created_at) VALUES (?, ?, ?, ?, ?)', [m.id, m.role, m.text, m.card ? JSON.stringify(m.card) : null, m.createdAt]); }

  // ---- plan weeks
  getPlanWeek(weekStart: ISODate): PlanWeek | null { const r = this.db.get('SELECT * FROM plan_weeks WHERE week_start = ?', [weekStart]); return r ? { weekStart: String(r.week_start), status: r.status as PlanWeek['status'], summary: String(r.summary), restReason: String(r.rest_reason ?? ''), generatedAt: String(r.generated_at) } : null; }
  savePlanWeek(w: PlanWeek): void { this.db.run('INSERT OR REPLACE INTO plan_weeks (week_start, status, summary, rest_reason, generated_at) VALUES (?, ?, ?, ?, ?)', [w.weekStart, w.status, w.summary, w.restReason ?? '', w.generatedAt]); }
}

export function newId(prefix = 'id'): string { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }
