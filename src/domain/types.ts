import type { ISODate } from './dates';

export type SignalType = 'sleep' | 'energy' | 'soreness' | 'stress' | 'steps' | 'hydration' | 'weight';
export const SIGNAL_TYPES: SignalType[] = ['sleep', 'energy', 'soreness', 'stress', 'steps', 'hydration', 'weight'];
export interface Signal { date: ISODate; type: SignalType; value: number; loggedAt: string; }

export type TargetKey = 'protein_g' | 'hydration_l' | 'steps' | 'calories' | 'carbs_g' | 'fat_g' | 'fiber_g';
export type Targets = Record<TargetKey, number>;

export type Goal = 'Strength' | 'Endurance' | 'Lean out' | 'General fitness';
export type Equipment = 'Commercial gym' | 'Home setup' | 'No equipment';
export interface RecurringPreference { activity: string; detail: string; frequency: 'weekly'; preferredDay: number; /* 0=Sun */ }
export interface Profile {
  goal: Goal; goalText: string; daysPerWeek: number; minutesPerSession: number; equipment: Equipment;
  activities: string[]; recurring: RecurringPreference[]; injuriesText: string; onboarded: boolean; installedAt: string;
}

export type ActivityType = 'gym' | 'sprint' | 'run' | 'pilates' | 'yoga' | 'pickleball' | 'padel' | 'sprint_club' | 'other';
export type ActivitySource = 'nora' | 'trainee_adhoc' | 'standing_preference';
export type Intensity = 'Easy' | 'Moderate' | 'Hard';
export type Phase = 'warmup' | 'main' | 'cooldown';
export interface ExercisePrescription { exerciseId: string; phase: Phase; sets: number; reps: number; weightLb: number; }
export interface Activity {
  id: string; date: ISODate; type: ActivityType; name: string; source: ActivitySource;
  minutes: number; intensity: Intensity; startTime?: string; // "19:00"
  detail?: string;        // "3 mi", "6 × 20 s"
  focus?: string;         // "bench focus"
  distanceMi?: number;
  exercises?: ExercisePrescription[]; // gym sessions
  intervals?: number;     // sprint sessions
  paused: boolean;        // R54 safety pause
  createdAt: string;
}
export interface SetLog { exerciseId: string; setIndex: number; weightLb: number; reps: number; done: boolean; }
export interface ActivityResult {
  activityId: string; outcome: 'done' | 'skipped';
  doneCount?: number; totalCount?: number; minutes?: number; distanceMi?: number;
  difficulty?: number; pain?: boolean; painWhere?: string; note?: string; sets?: SetLog[];
  subtitleNote?: string; loggedAt: string;
}
export type ActivityStatus = 'completed' | 'skipped' | 'pending' | 'now';

export interface MealItem { name: string; portionEstimate: string; portionQty: number; caloriesEst: number; proteinG: number; carbsG: number; fatG: number; }
export interface Meal { id: string; date: ISODate; time: string; name: string; imageUri: string | null; confidence: 'low' | 'medium' | 'high' | null; items: MealItem[]; createdAt: string; }

export interface Supplement { id: string; name: string; dose: string; nutrientKey?: string; sort: number; }

export type MemoryType = 'injury' | 'preference' | 'context';
export interface MemoryEntry { id: string; type: MemoryType; text: string; date: ISODate; tags: string[]; resolved: boolean; createdAt: string; }

export type PRKind = 'lift' | 'run' | 'sprint';
export interface PersonalRecord { id: string; activity: string; kind: PRKind; result: string; date: ISODate; }

export type CardState = 'proposed' | 'applied' | 'declined' | 'paused' | 'kept';
export interface ChatCard {
  kind: 'patch' | 'safety';
  state: CardState;
  title?: string;
  items: string[];         // itemized moves / the safety question
  ops?: Array<{ op: 'move'; activityId: string; toDate: ISODate } | { op: 'swap_exercise'; activityId: string; fromExerciseId: string; toExerciseId: string }>;
  targetActivityId?: string; // safety: session to pause
  appliedNote?: string;
}
export interface ChatMessage { id: string; role: 'user' | 'nora'; text: string; card: ChatCard | null; createdAt: string; }

export interface PlanWeek { weekStart: ISODate; status: 'planned' | 'regenerating'; summary: string; generatedAt: string; }
