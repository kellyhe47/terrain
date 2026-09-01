// Calendar engine (PRD R24–R29, R40, R77–R79). Status is derived, never stored. One activity store; day/week/month are projections.
import { addDays, dayOf, diffDays, fmtTime12, parseISODate, toISODate, weekDays, weekStart, type ISODate } from './dates';
import type { Activity, ActivityResult, ActivityStatus, ActivityType, Intensity, ActivitySource } from './types';
import { newId, type Repo } from '../db/repo';

export const GUIDED: ActivityType[] = ['gym', 'sprint'];
export const ADD_TYPES: Array<{ label: string; type: ActivityType }> = [
  { label: 'Run', type: 'run' }, { label: 'Pilates', type: 'pilates' }, { label: 'Yoga', type: 'yoga' }, { label: 'Pickleball', type: 'pickleball' },
  { label: 'Padel', type: 'padel' }, { label: 'Sprint club', type: 'sprint_club' }, { label: 'Other', type: 'other' },
];

/** R24: a logged result wins; otherwise today ⇒ now, else pending. */
export function deriveStatus(a: Activity, result: ActivityResult | null, today: ISODate): ActivityStatus {
  if (result) return result.outcome === 'done' ? 'completed' : 'skipped';
  return a.date === today ? 'now' : 'pending';
}

export function subtitleFor(a: Activity, result: ActivityResult | null, status: ActivityStatus, today: ISODate): string {
  if (status === 'completed' && result) {
    if (result.subtitleNote) return `Completed · ${result.subtitleNote}`;
    if (a.type === 'gym') return `Completed · ${result.doneCount ?? 0}/${result.totalCount ?? a.exercises?.length ?? 0} exercises`;
    if (a.type === 'sprint') return `Completed · ${result.doneCount ?? a.intervals ?? 0} × 20 s`;
    if (a.distanceMi != null && result.distanceMi != null) return `Completed · ${trim(result.distanceMi)} of ${trim(a.distanceMi)} miles logged`;
    return `Completed · ${result.minutes ?? a.minutes} min · ${a.intensity}`;
  }
  if (status === 'skipped') return `Skipped · ${result?.subtitleNote ?? 'logged'}`;
  if (a.paused) return 'Paused · until you’ve been seen';
  if (status === 'now') return a.startTime ? `Starts ${fmtTime12(a.startTime)}` : `Today · ${a.minutes} min · ${a.intensity}`;
  if (a.date < today) return `Not logged · ${a.minutes} min planned`;
  return a.source === 'trainee_adhoc' ? `Planned · ${a.minutes} min · ${a.intensity}` : 'Planned';
}
const trim = (n: number) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(1)));

export interface CalendarItem {
  activity: Activity; result: ActivityResult | null; status: ActivityStatus; subtitle: string;
  startable: boolean; pastDue: boolean; recordable: boolean; guided: boolean;
}
export function toItem(a: Activity, result: ActivityResult | null, today: ISODate): CalendarItem {
  const status = deriveStatus(a, result, today);
  const resolved = status === 'completed' || status === 'skipped';
  const guided = GUIDED.includes(a.type);
  const pastDue = !resolved && a.date < today;
  return {
    activity: a, result, status, subtitle: subtitleFor(a, result, status, today), guided,
    startable: guided && !resolved && !a.paused && a.date <= today,
    pastDue,
    recordable: !resolved && a.date === today, // R40b: today or earlier; earlier is the past-due pair of buttons
  };
}

export type DotKind = 'today' | 'completed' | 'skipped' | 'planned' | 'none';
export function dotFor(items: CalendarItem[], date: ISODate, today: ISODate): DotKind {
  if (date === today) return 'today';
  if (!items.length) return 'none';
  if (items.some((i) => i.status === 'completed')) return 'completed';
  if (items.every((i) => i.status === 'skipped')) return 'skipped';
  return 'planned';
}

export class CalendarService {
  constructor(private repo: Repo) {}

  private items(acts: Activity[], today: ISODate): CalendarItem[] {
    const results = this.repo.resultsFor(acts.map((a) => a.id));
    return acts.map((a) => toItem(a, results.get(a.id) ?? null, today));
  }
  item(id: string, today: ISODate): CalendarItem | null { const a = this.repo.getActivity(id); return a ? toItem(a, this.repo.getResult(id), today) : null; }
  day(date: ISODate, today: ISODate): CalendarItem[] { return this.items(this.repo.activitiesOn(date), today); }
  week(start: ISODate, today: ISODate): CalendarItem[] { return this.items(this.repo.activitiesBetween(start, addDays(start, 6)), today); }
  range(from: ISODate, to: ISODate, today: ISODate): CalendarItem[] { return this.items(this.repo.activitiesBetween(from, to), today); }
  month(year: number, month0: number, today: ISODate): Map<ISODate, CalendarItem[]> {
    const first = toISODate(new Date(year, month0, 1)), last = toISODate(new Date(year, month0 + 1, 0));
    const m = new Map<ISODate, CalendarItem[]>();
    for (const it of this.range(first, last, today)) { const arr = m.get(it.activity.date) ?? []; arr.push(it); m.set(it.activity.date, arr); }
    return m;
  }
  weekDots(start: ISODate, today: ISODate): Record<ISODate, DotKind> {
    const items = this.week(start, today); const out: Record<ISODate, DotKind> = {};
    for (const d of weekDays(start)) out[d] = dotFor(items.filter((i) => i.activity.date === d), d, today);
    return out;
  }
  weekIsEmpty(start: ISODate): boolean { return this.repo.activitiesBetween(start, addDays(start, 6)).length === 0; }
  weekState(start: ISODate): 'empty' | 'regenerating' | 'planned' {
    const pw = this.repo.getPlanWeek(start);
    if (pw?.status === 'regenerating') return 'regenerating';
    return this.weekIsEmpty(start) ? 'empty' : 'planned';
  }

  /** R26/R26a. Past day ⇒ logged as completed; today/future ⇒ pending. Returns the toast copy. */
  addActivity(input: { type: ActivityType; name: string; date: ISODate; minutes: number; intensity: Intensity; source?: ActivitySource }, asOf: string): { activity: Activity; toast: string } {
    const today = dayOf(asOf);
    const a: Activity = { id: newId('act'), date: input.date, type: input.type, name: input.name, source: input.source ?? 'trainee_adhoc', minutes: Math.max(15, input.minutes), intensity: input.intensity, paused: false, createdAt: asOf };
    this.repo.transaction(() => {
      this.repo.saveActivity(a);
      if (input.date < today) this.repo.saveResult({ activityId: a.id, outcome: 'done', minutes: a.minutes, loggedAt: asOf });
    });
    return { activity: a, toast: input.date < today ? 'Logged · Nora will factor it in' : 'Added to calendar' };
  }

  /** R40: done writes completed with duration/intensity from the activity. R40b: only today or earlier, only unresolved. */
  logDone(id: string, asOf: string): { ok: boolean; toast: string } {
    const it = this.item(id, dayOf(asOf));
    if (!it || it.activity.date > dayOf(asOf) || it.status === 'completed' || it.status === 'skipped') return { ok: false, toast: 'Can’t mark that done yet' };
    const a = it.activity;
    const res: ActivityResult = { activityId: id, outcome: 'done', minutes: a.minutes, loggedAt: asOf };
    if (a.type === 'gym') { res.doneCount = a.exercises?.length ?? 0; res.totalCount = a.exercises?.length ?? 0; }
    if (a.type === 'sprint') { res.doneCount = a.intervals ?? 6; res.totalCount = a.intervals ?? 6; }
    if (a.distanceMi != null) res.distanceMi = a.distanceMi;
    this.repo.saveResult(res);
    return { ok: true, toast: 'Logged · Nora will factor it in' };
  }
  logSkipped(id: string, asOf: string): { ok: boolean; toast: string } {
    const it = this.item(id, dayOf(asOf));
    if (!it || it.status === 'completed' || it.status === 'skipped') return { ok: false, toast: 'Already resolved' };
    this.repo.saveResult({ activityId: id, outcome: 'skipped', loggedAt: asOf });
    return { ok: true, toast: 'Logged as skipped · Nora will adjust' };
  }
  /** R27: deterministic reschedule, no model call. */
  reschedule(id: string, toDate: ISODate): boolean {
    const a = this.repo.getActivity(id); if (!a) return false;
    this.repo.saveActivity({ ...a, date: toDate }); return true;
  }
  setPaused(id: string, paused: boolean): void { const a = this.repo.getActivity(id); if (a) this.repo.saveActivity({ ...a, paused }); }

  /** Session players: save a full or partial result (R32–R34, R39). */
  saveSessionResult(res: ActivityResult): void { this.repo.saveResult(res); }
  discardSession(id: string): void { this.repo.deleteResult(id); }

  /** Future intense sessions (for the safety card, R54): the next sprint, else next gym session after `today`. */
  nextIntenseSession(today: ISODate): Activity | null {
    const acts = this.repo.activitiesBetween(addDays(today, 1), addDays(today, 14));
    return acts.find((a) => a.type === 'sprint' && !a.paused) ?? acts.find((a) => a.type === 'gym' && !a.paused) ?? null;
  }
}

export function currentWeekStart(asOf: string): ISODate { return weekStart(dayOf(asOf)); }
export function daysUntil(date: ISODate, today: ISODate): number { return diffDays(date, today); }
export { parseISODate };
