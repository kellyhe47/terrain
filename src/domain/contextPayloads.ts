// Shapes of the assembled context handed to the text model. These are the model's whole world — never a raw DB dump (R48).
import type { ISODate } from './dates';

export interface IntakeSummary { goal: string; goal_text: string; days_per_week: number; minutes_per_session: number; equipment: string; activities: string[]; recurring: Array<{ activity: string; detail: string; preferred_day: number; frequency: string }>; }
export interface MemorySummary { injuries: Array<{ id: string; text: string; tags: string[]; resolved: boolean; date: ISODate }>; preferences: string[]; context: string[]; }
export interface SessionSummary { id: string; date: ISODate; name: string; type: string; status: string; difficulty?: number; pain?: boolean; pain_where?: string; note?: string; paused?: boolean; }
/** `venues` is where the exercise is possible (gym/home/none); `tags` is the contraindication vocabulary; `muscles` is the primary movers. Gear (`equipment` on the seed row) is display-only and deliberately not sent to the model. */
export interface LibraryRow { id: string; name: string; pattern: string; tags: string[]; venues: string[]; muscles: string[]; phases: string[]; start_weight_lb: number; reps: number; sets: number; }
export interface WeekPlanRow { id: string; date: ISODate; name: string; type: string; source: string; status: string; paused: boolean; exercise_ids: string[]; exercises: string[]; }

export interface BaseContext {
  today: ISODate; as_of: string; intake: IntakeSummary | null;
  targets: Record<string, number>; signals_today: Record<string, number>;
  readiness: { score: number | null; band: string | null; components: Array<{ key: string; score: number; detail: string }> } | null;
  memory: MemorySummary; recent_sessions: SessionSummary[];
}
export interface PlanPayload extends BaseContext { week_start: ISODate; week_dates: ISODate[]; contraindicated_tags: string[]; library: LibraryRow[]; violations: string[]; readiness_recent: Array<{ date: ISODate; score: number | null }>; }
export interface ChatPayload extends BaseContext { message: string; week_plan: WeekPlanRow[]; next_intense_session: { id: string; name: string; type: string; date: ISODate; weekday: string } | null; contraindicated_tags: string[]; violations: string[]; }
export interface ExplanationPayload extends BaseContext { plan_today: { name: string; type: string; subtitle: string } | null; rest_day: boolean; }
export interface GapsPayload extends BaseContext { gaps: { days: number; logged_days: number; ranked: Array<{ key: string; label: string; unit: string; avg_per_day: number; target: number; ratio: number; ceiling: boolean }>; on_track: string[]; supplements: Array<{ name: string; nutrient_key?: string; adherence: number }> }; }
export interface InjuryPayload { text: string; vocabulary: readonly string[]; }
