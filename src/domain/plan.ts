// Plan schema + deterministic rails (PRD R17–R23, fixtures 05/10). Model output is validated against the schema, then the
// rails; a violation is named and re-prompted — never silently accepted.
import { z } from 'zod';
import { addDays, dow, type ISODate } from './dates';
import type { Activity, ExercisePrescription, RecurringPreference, ActivityType, Intensity } from './types';
import type { ExerciseLibrary } from '../seed/exerciseLibrary';
import { newId } from '../db/repo';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const PlanExerciseSchema = z.object({
  exercise_id: z.string().min(1), phase: z.enum(['warmup', 'main', 'cooldown']),
  sets: z.number().int().min(1).max(10), reps: z.number().int().min(1).max(120), weight_lb: z.number().min(0).max(1000),
});
export const PlanSessionSchema = z.object({
  date: isoDate, type: z.enum(['gym', 'sprint']), name: z.string().min(1), focus: z.string().default(''), minutes: z.number().int().min(10).max(180),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().default(null),
  exercises: z.array(PlanExerciseSchema).default([]), intervals: z.number().int().min(1).max(20).nullable().default(null),
});
export const StandingSchema = z.object({
  date: isoDate, type: z.enum(['run', 'pilates', 'yoga', 'pickleball', 'padel', 'sprint_club', 'other']), name: z.string().min(1), detail: z.string().default(''),
  minutes: z.number().int().min(10).max(300), intensity: z.enum(['Easy', 'Moderate', 'Hard']).default('Moderate'), distance_mi: z.number().min(0).nullable().default(null),
});
export const WeeklyPlanSchema = z.object({
  week_start: isoDate, summary: z.string().default(''), rest_reason: z.string().default(''),
  sessions: z.array(PlanSessionSchema), standing: z.array(StandingSchema).default([]),
});
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;
export type PlanSession = z.infer<typeof PlanSessionSchema>;

/** JSON schema handed to the model for constrained decoding (R48a). Kept in sync with WeeklyPlanSchema. */
export const WEEKLY_PLAN_JSON_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['week_start', 'summary', 'rest_reason', 'sessions', 'standing'],
  properties: {
    week_start: { type: 'string' }, summary: { type: 'string' }, rest_reason: { type: 'string' },
    sessions: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['date', 'type', 'name', 'focus', 'minutes', 'start_time', 'exercises', 'intervals'], properties: {
      date: { type: 'string' }, type: { type: 'string', enum: ['gym', 'sprint'] }, name: { type: 'string' }, focus: { type: 'string' }, minutes: { type: 'integer' },
      start_time: { type: ['string', 'null'] }, intervals: { type: ['integer', 'null'] },
      exercises: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['exercise_id', 'phase', 'sets', 'reps', 'weight_lb'], properties: {
        exercise_id: { type: 'string' }, phase: { type: 'string', enum: ['warmup', 'main', 'cooldown'] }, sets: { type: 'integer' }, reps: { type: 'integer' }, weight_lb: { type: 'number' } } } } } } },
    standing: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['date', 'type', 'name', 'detail', 'minutes', 'intensity', 'distance_mi'], properties: {
      date: { type: 'string' }, type: { type: 'string', enum: ['run', 'pilates', 'yoga', 'pickleball', 'padel', 'sprint_club', 'other'] }, name: { type: 'string' }, detail: { type: 'string' },
      minutes: { type: 'integer' }, intensity: { type: 'string', enum: ['Easy', 'Moderate', 'Hard'] }, distance_mi: { type: ['number', 'null'] } } } },
  },
} as const;

export interface RailContext { library: ExerciseLibrary; contraindicatedTags: string[]; daysAvailable: number; recurring: RecurringPreference[]; weekStart: ISODate; }
export type RailResult = { ok: true } | { ok: false; violations: string[] };

/** Deterministic rails (R18, R18a, R19, R21, R42). */
export function validatePlan(plan: WeeklyPlan, ctx: RailContext): RailResult {
  const v: string[] = [];
  const weekEnd = addDays(ctx.weekStart, 6);
  const bad = new Set(ctx.contraindicatedTags);
  if (plan.week_start !== ctx.weekStart) v.push(`week_start must be ${ctx.weekStart}`);
  for (const s of plan.sessions) {
    if (s.date < ctx.weekStart || s.date > weekEnd) v.push(`session "${s.name}" dated ${s.date} is outside the week`);
    if (s.type === 'gym') {
      const phases = new Set(s.exercises.map((e) => e.phase));
      for (const ph of ['warmup', 'main', 'cooldown'] as const) if (!phases.has(ph)) v.push(`gym session "${s.name}" (${s.date}) has no ${ph} exercise`);
      for (const e of s.exercises) {
        const ex = ctx.library.get(e.exercise_id);
        if (!ex) { v.push(`unknown exercise_id "${e.exercise_id}" in "${s.name}"`); continue; }
        const hit = ex.tags.filter((t) => bad.has(t));
        if (hit.length) v.push(`exercise "${ex.name}" is contraindicated (${hit.join(', ')}) in "${s.name}"`);
      }
    } else if (!s.intervals || s.intervals < 1) v.push(`sprint session "${s.name}" needs intervals ≥ 1`);
  }
  const trainingDays = new Set(plan.sessions.map((s) => s.date));
  if (trainingDays.size > ctx.daysAvailable) v.push(`${trainingDays.size} training days exceed the ${ctx.daysAvailable} available`);
  for (const r of ctx.recurring) {
    const want = addDays(ctx.weekStart, r.preferredDay);
    const kept = plan.standing.some((st) => st.date === want && st.name.toLowerCase().includes(r.activity.toLowerCase()));
    if (!kept) v.push(`recurring preference "${r.activity} · ${r.detail}" on ${want} is not kept as a standing activity`);
    if (plan.sessions.some((s) => s.date === want && s.type === 'sprint')) v.push(`a max-effort sprint session collides with the standing ${r.activity} on ${want}`);
  }
  for (const st of plan.standing) if (st.date < ctx.weekStart || st.date > weekEnd) v.push(`standing "${st.name}" dated ${st.date} is outside the week`);
  return v.length ? { ok: false, violations: v } : { ok: true };
}

/** Turn a validated plan into calendar activities (R24b sources). */
export function materializePlan(plan: WeeklyPlan, asOf: string): Activity[] {
  const acts: Activity[] = [];
  for (const s of plan.sessions) {
    const exercises: ExercisePrescription[] = s.exercises.map((e) => ({ exerciseId: e.exercise_id, phase: e.phase, sets: e.sets, reps: e.reps, weightLb: e.weight_lb }));
    acts.push({
      id: newId('act'), date: s.date, type: s.type, name: s.name, source: 'nora', minutes: s.minutes, intensity: s.type === 'sprint' ? 'Hard' : 'Moderate',
      startTime: s.start_time ?? undefined, focus: s.focus || undefined, exercises: s.type === 'gym' ? exercises : undefined,
      intervals: s.type === 'sprint' ? s.intervals ?? 6 : undefined, detail: s.type === 'sprint' ? `${s.intervals ?? 6} × 20 s` : undefined, paused: false, createdAt: asOf,
    });
  }
  for (const st of plan.standing) {
    acts.push({ id: newId('act'), date: st.date, type: st.type as ActivityType, name: st.name, source: 'standing_preference', minutes: st.minutes, intensity: st.intensity as Intensity,
      detail: st.detail || undefined, distanceMi: st.distance_mi ?? undefined, paused: false, createdAt: asOf });
  }
  return acts;
}

/** Inverse of materialize, so a patched week can be re-validated with the same rails (R28). */
export function planFromActivities(weekStart: ISODate, acts: Activity[], summary = ''): WeeklyPlan {
  return {
    week_start: weekStart, summary, rest_reason: '',
    sessions: acts.filter((a) => a.source === 'nora' && (a.type === 'gym' || a.type === 'sprint')).map((a) => ({
      date: a.date, type: a.type as 'gym' | 'sprint', name: a.name, focus: a.focus ?? '', minutes: a.minutes, start_time: a.startTime ?? null,
      exercises: (a.exercises ?? []).map((e) => ({ exercise_id: e.exerciseId, phase: e.phase, sets: e.sets, reps: e.reps, weight_lb: e.weightLb })), intervals: a.intervals ?? null,
    })),
    standing: acts.filter((a) => a.source === 'standing_preference').map((a) => ({
      date: a.date, type: a.type as any, name: a.name, detail: a.detail ?? '', minutes: a.minutes, intensity: a.intensity, distance_mi: a.distanceMi ?? null,
    })),
  };
}

export function sessionSubtitle(s: { minutes: number; exercises?: unknown[]; focus?: string; type: string; intervals?: number }): string {
  if (s.type === 'sprint') return `${s.minutes} min · ${s.intervals ?? 6} × 20 s sprints`;
  const n = s.exercises?.length ?? 0;
  return [`${s.minutes} min`, `${n} exercise${n === 1 ? '' : 's'}`, s.focus].filter(Boolean).join(' · ');
}
export { dow };
