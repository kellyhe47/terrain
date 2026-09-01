// Progress & PRs (PRD R49–R52): trends, consistency, load — all derived from the store, deterministic.
import { addDays, type ISODate } from './dates';
import { readinessFor } from './readinessLoader';
import { toItem, type CalendarItem } from './calendar';
import type { Repo } from '../db/repo';
import type { SignalType } from './types';

export function readinessTrend(repo: Repo, today: ISODate, days: 14 | 30): Array<{ date: ISODate; score: number | null }> {
  const out: Array<{ date: ISODate; score: number | null }> = [];
  for (let i = days - 1; i >= 0; i--) { const d = addDays(today, -i); const r = readinessFor(repo, d); out.push({ date: d, score: r.kind === 'score' ? r.score : null }); }
  return out;
}
export function avgReadiness(repo: Repo, today: ISODate, days = 14): number | null {
  const pts = readinessTrend(repo, today, days as 14 | 30).map((p) => p.score).filter((s): s is number => s != null);
  return pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : null;
}
/** Sessions done vs planned over the last 3 weeks (21 days ending today), counting only prescribed + standing activities. */
export function consistency(repo: Repo, today: ISODate): { done: number; planned: number } {
  const acts = repo.activitiesBetween(addDays(today, -20), today).filter((a) => a.source !== 'trainee_adhoc');
  const res = repo.resultsFor(acts.map((a) => a.id));
  const planned = acts.filter((a) => a.date < today || res.has(a.id));
  return { done: planned.filter((a) => res.get(a.id)?.outcome === 'done').length, planned: planned.length };
}
export const TREND_SIGNALS: Array<{ type: SignalType; label: string; unit: string }> = [
  { type: 'weight', label: 'Weight', unit: 'lbs' }, { type: 'sleep', label: 'Sleep', unit: 'h' }, { type: 'steps', label: 'Steps', unit: '' },
  { type: 'soreness', label: 'Soreness', unit: '' }, { type: 'stress', label: 'Stress', unit: '' }, { type: 'hydration', label: 'Hydration', unit: 'L' },
];
export interface SignalTrend { type: SignalType; label: string; points: number[]; direction: string; tone: 'good' | 'neutral' | 'bad'; }
export function signalTrends(repo: Repo, today: ISODate): SignalTrend[] {
  return TREND_SIGNALS.map(({ type, label, unit }) => {
    const series = repo.signalSeries(type, addDays(today, -29), today);
    const pts = series.map((s) => s.value);
    if (pts.length < 4) return { type, label, points: pts, direction: 'not enough data', tone: 'neutral' as const };
    const half = Math.floor(pts.length / 2);
    const a = pts.slice(0, half).reduce((x, y) => x + y, 0) / half, b = pts.slice(half).reduce((x, y) => x + y, 0) / (pts.length - half);
    const delta = b - a, rel = Math.abs(delta) / (Math.abs(a) || 1);
    const inverted = type === 'soreness' || type === 'stress';
    if (rel < 0.03) return { type, label, points: pts, direction: '→ steady', tone: 'neutral' as const };
    const up = delta > 0;
    let direction: string;
    if (type === 'weight') direction = `${up ? '↗ +' : '↘ −'}${Math.abs(delta).toFixed(1)} lbs`;
    else if (type === 'sleep') direction = `${up ? '↗ +' : '↘ −'}${Math.abs(delta).toFixed(1)} h`;
    else if (type === 'hydration') direction = `${up ? '↗ +' : '↘ −'}${Math.abs(delta).toFixed(1)} L`;
    else if (type === 'steps') direction = `${up ? '↗ +' : '↘ −'}${Math.round(Math.abs(delta)).toLocaleString('en-US')}`;
    else direction = up ? '↗ rising' : '↘ easing';
    const good = inverted ? !up : up;
    const tone: SignalTrend['tone'] = type === 'weight' ? 'neutral' : good ? 'good' : 'bad';
    return { type, label, points: pts, direction, tone };
  });
}
const INT = { Easy: 1, Moderate: 2, Hard: 3 } as const;
/** Training load per day: sets × intensity for gym (logged sets, difficulty as intensity), minutes/10 × intensity elsewhere. */
export function trainingLoad14(repo: Repo, today: ISODate): Array<{ date: ISODate; load: number }> {
  const from = addDays(today, -13);
  const acts = repo.activitiesBetween(from, today);
  const res = repo.resultsFor(acts.map((a) => a.id));
  const byDay = new Map<ISODate, number>();
  for (let i = 0; i < 14; i++) byDay.set(addDays(from, i), 0);
  for (const a of acts) {
    const r = res.get(a.id); if (!r || r.outcome !== 'done') continue;
    const intensity = r.difficulty ?? INT[a.intensity];
    let units: number;
    if (a.type === 'gym') units = r.sets ? r.sets.filter((s) => s.done).length : (a.exercises ?? []).reduce((x, e) => x + e.sets, 0);
    else if (a.type === 'sprint') units = (r.doneCount ?? a.intervals ?? 6) * 1.5;
    else units = (r.minutes ?? a.minutes) / 10;
    byDay.set(a.date, (byDay.get(a.date) ?? 0) + units * intensity);
  }
  return [...byDay.entries()].map(([date, load]) => ({ date, load }));
}
export function workoutHistory(repo: Repo, today: ISODate, limit = 8): CalendarItem[] {
  const acts = repo.activitiesBetween(addDays(today, -60), today);
  const res = repo.resultsFor(acts.map((a) => a.id));
  return acts.filter((a) => res.has(a.id)).map((a) => toItem(a, res.get(a.id)!, today)).sort((x, y) => (x.activity.date < y.activity.date ? 1 : -1)).slice(0, limit);
}
