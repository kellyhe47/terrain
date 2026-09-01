// Exercise library seed (PRD R22). Consumed by plan generation rails, the players and the Form video screen.
// Contraindication tags are the vocabulary R61 structures injuries into. Video URLs are demonstration links; the
// in-app Form video screen plays the bundled demo loop and links out to the URL.
import type { Phase } from '../domain/types';

export type EquipmentTier = 'gym' | 'home' | 'none';
export type Pattern = 'push' | 'pull' | 'legs' | 'hinge' | 'core' | 'cardio' | 'mobility';
export interface Exercise {
  id: string; name: string; pattern: Pattern; tags: string[]; equipment: EquipmentTier[]; phases: Phase[];
  cue: string; videoUrl: string; startWeightLb: number; reps: number; sets: number; loadedByWeight: boolean;
}

export const CONTRAINDICATION_TAGS = [
  'deep_squat', 'plyometric_jump', 'overhead_press', 'heavy_hinge', 'loaded_knee_flexion', 'spinal_compression',
  'high_impact', 'bench_press', 'pull_up', 'running', 'wrist_load', 'neck_load',
] as const;
export type ContraindicationTag = (typeof CONTRAINDICATION_TAGS)[number];

const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
const ex = (id: string, name: string, pattern: Pattern, tags: string[], equipment: EquipmentTier[], phases: Phase[], cue: string, videoId: string, startWeightLb: number, reps: number, sets = 3, loadedByWeight = startWeightLb > 0): Exercise =>
  ({ id, name, pattern, tags, equipment, phases, cue, videoUrl: yt(videoId), startWeightLb, reps, sets, loadedByWeight });

export const EXERCISES: Exercise[] = [
  // ---- warm-ups
  ex('empty_bar_bench', 'Empty-bar bench', 'push', ['bench_press'], ['gym'], ['warmup'], 'Just the bar — groove the path, wake up the shoulders. Fast and easy.', 'rT7DgCr-3pg', 45, 12, 2),
  ex('band_pull_apart', 'Band pull-apart', 'pull', [], ['gym', 'home'], ['warmup'], 'Pinch the shoulder blades at the end. Slow on the way back.', '5VlNPhKiJXk', 0, 15, 2),
  ex('bodyweight_squat', 'Bodyweight squat', 'legs', ['deep_squat'], ['gym', 'home', 'none'], ['warmup'], 'Sit between the heels, chest tall. Just moving, not working.', 'aclHkVaku9U', 0, 12, 2),
  ex('leg_swings', 'Leg swings', 'mobility', [], ['gym', 'home', 'none'], ['warmup'], 'Front to back, then side to side. Loosen the hips without forcing range.', '4a0HpM8T6d0', 0, 12, 2),
  ex('arm_circles', 'Arm circles', 'mobility', [], ['gym', 'home', 'none'], ['warmup'], 'Small circles growing bigger. Shoulders warm before anything overhead.', '140RTNMciH8', 0, 15, 2),
  ex('glute_bridge_warm', 'Glute bridge', 'hinge', [], ['gym', 'home', 'none'], ['warmup'], 'Drive through the heels, squeeze at the top. Wake the glutes up.', 'wPM8icPu6H8', 0, 12, 2),
  ex('empty_bar_deadlift', 'Empty-bar hinge', 'hinge', [], ['gym'], ['warmup'], 'Push the hips back, bar close to the legs. Feel the hamstrings load.', 'op9kVnSso6Q', 45, 10, 2),
  // ---- main: push
  ex('bench_press', 'Bench press', 'push', ['bench_press'], ['gym'], ['main'], 'Three seconds down, brief pause at the chest. Bar over mid-chest.', 'rT7DgCr-3pg', 135, 8),
  ex('incline_db_press', 'Incline DB press', 'push', [], ['gym', 'home'], ['main'], 'Elbows about 45°. Full stretch at the bottom, no bounce.', '8iPEnn-ltC8', 50, 10),
  ex('overhead_press', 'Overhead press', 'push', ['overhead_press'], ['gym', 'home'], ['main'], 'Brace hard, bar in a straight line. Head through at the top.', '2yjwXTZQDDI', 75, 8),
  ex('db_shoulder_press', 'DB shoulder press', 'push', ['overhead_press'], ['gym', 'home'], ['main'], 'Elbows slightly forward. Press up and slightly in.', 'qEwKCR5JCog', 35, 10),
  ex('push_up', 'Push-up', 'push', ['wrist_load'], ['gym', 'home', 'none'], ['main'], 'Body in one line. Chest to an inch off the floor.', 'IODxDxX7oi4', 0, 12),
  ex('dip', 'Dip', 'push', [], ['gym'], ['main'], 'Lean forward a touch, elbows to 90°. No shrugging.', '2z8JmcrW-As', 0, 8),
  ex('lateral_raise', 'Lateral raise', 'push', [], ['gym', 'home'], ['main'], 'Lead with the elbows, stop at shoulder height. Light and strict.', '3VcKaXpzqRo', 15, 12),
  ex('cable_fly', 'Cable fly', 'push', [], ['gym'], ['main'], 'Soft elbows, big stretch, squeeze in front of the chest.', 'Iwe6AmxVf7o', 25, 12),
  // ---- main: pull
  ex('seated_cable_row', 'Seated cable row', 'pull', [], ['gym'], ['main'], 'Squeeze the shoulder blades. No lean-back past vertical.', 'GZbfZ033f74', 120, 10),
  ex('lat_pulldown', 'Lat pulldown', 'pull', [], ['gym'], ['main'], 'Elbows down and in. Chest up, bar to the collarbone.', 'CAwf7n6Luuc', 110, 12),
  ex('pull_up', 'Pull-up', 'pull', ['pull_up'], ['gym', 'home'], ['main'], 'Full hang to chin over bar. Control the way down.', 'eGo4IYlbE5g', 0, 6),
  ex('db_row', 'One-arm DB row', 'pull', [], ['gym', 'home'], ['main'], 'Pull to the hip, not the armpit. Keep the torso square.', 'pYcpY20QaE8', 55, 10),
  ex('face_pull', 'Face pull', 'pull', [], ['gym', 'home'], ['main'], 'Rope to the forehead, elbows high. Pause and separate the hands.', 'rep-qVOkqgk', 40, 15),
  ex('inverted_row', 'Inverted row', 'pull', [], ['home', 'none'], ['main'], 'Body straight, chest to the bar or table edge. Slow down.', 'KOaCM1HMwU0', 0, 10),
  ex('band_row', 'Band row', 'pull', [], ['home', 'none'], ['main'], 'Anchor at chest height, pull to the ribs, pause.', 'pLl7n_mM8yA', 0, 15),
  // ---- main: legs
  ex('back_squat', 'Back squat', 'legs', ['deep_squat', 'spinal_compression'], ['gym'], ['main'], 'Brace, sit down between the heels, drive the floor away.', 'ultWZbUMPL8', 185, 5),
  ex('front_squat', 'Front squat', 'legs', ['deep_squat', 'spinal_compression'], ['gym'], ['main'], 'Elbows high, torso upright. Full depth if the knees allow.', 'm4ytaCJZpl0', 135, 6),
  ex('goblet_squat', 'Goblet squat', 'legs', ['deep_squat'], ['gym', 'home'], ['main'], 'Elbows inside the knees at the bottom. Heels down.', 'MeIiIdhvXT4', 50, 10),
  ex('leg_press', 'Leg press', 'legs', [], ['gym'], ['main'], 'Feet mid-plate, stop before the lower back rounds. Push through the whole foot.', 'IZxyjW7MPJQ', 270, 10),
  ex('split_squat', 'Split squat', 'legs', ['loaded_knee_flexion'], ['gym', 'home', 'none'], ['main'], 'Long stance, drop straight down. Front heel stays planted.', '2C-uNgKwPLE', 30, 10),
  ex('walking_lunge', 'Walking lunge', 'legs', ['loaded_knee_flexion'], ['gym', 'home', 'none'], ['main'], 'Long steps, knee tracks over the toes. Stay tall.', 'L8fvypPrzzs', 25, 12),
  ex('leg_extension', 'Leg extension', 'legs', [], ['gym'], ['main'], 'Squeeze hard at the top for a second. Don’t swing.', 'YyvSfVjQeL0', 90, 12),
  ex('leg_curl', 'Lying leg curl', 'legs', [], ['gym'], ['main'], 'Toes pointed, curl to the glutes, three seconds down.', 'ELOCsoDSmrg', 80, 12),
  ex('calf_raise', 'Standing calf raise', 'legs', [], ['gym', 'home', 'none'], ['main'], 'Full stretch at the bottom, pause at the top.', '-M4-G8p8fmc', 0, 15),
  ex('box_jump', 'Box jump', 'legs', ['plyometric_jump', 'high_impact'], ['gym'], ['main'], 'Land soft and quiet, then step down. Never jump down.', 'NBY9-kTuHEk', 0, 5),
  ex('jump_squat', 'Jump squat', 'legs', ['plyometric_jump', 'deep_squat', 'high_impact'], ['gym', 'home', 'none'], ['main'], 'Explode up, absorb the landing through the hips.', 'A-cFYWvaHr0', 0, 8),
  // ---- main: hinge
  ex('deadlift', 'Deadlift', 'hinge', ['heavy_hinge', 'spinal_compression'], ['gym'], ['main'], 'Bar over mid-foot, slack out, push the floor away. Lock out with the glutes.', 'op9kVnSso6Q', 225, 5),
  ex('romanian_deadlift', 'Romanian deadlift', 'hinge', ['heavy_hinge'], ['gym', 'home'], ['main'], 'Hips back, bar sliding down the thighs. Stop when the hamstrings say so.', 'JCXUYuzwNrM', 135, 8),
  ex('hip_thrust', 'Hip thrust', 'hinge', [], ['gym', 'home'], ['main'], 'Chin tucked, ribs down. Squeeze the glutes at the top for a beat.', 'xDmFkJxPzeM', 135, 10),
  ex('kb_swing', 'Kettlebell swing', 'hinge', ['heavy_hinge'], ['gym', 'home'], ['main'], 'Snap the hips, arms are ropes. Bell to chest height, no higher.', 'YSxHifyI6s8', 35, 15),
  ex('glute_bridge', 'Glute bridge', 'hinge', [], ['gym', 'home', 'none'], ['main'], 'Heels close, drive up, squeeze. Two seconds at the top.', 'wPM8icPu6H8', 0, 15),
  // ---- main: core
  ex('plank', 'Plank', 'core', ['wrist_load'], ['gym', 'home', 'none'], ['main'], 'Ribs down, glutes tight. Breathe.', 'pSHjTRCQxIw', 0, 45),
  ex('dead_bug', 'Dead bug', 'core', [], ['gym', 'home', 'none'], ['main'], 'Lower back pressed to the floor the whole time. Slow opposite arm and leg.', 'g_BYB0R-4Ws', 0, 10),
  ex('cable_crunch', 'Cable crunch', 'core', [], ['gym'], ['main'], 'Curl the spine, elbows to the knees. Hips stay still.', '3qjoXDTuyOE', 60, 15),
  ex('pallof_press', 'Pallof press', 'core', [], ['gym', 'home'], ['main'], 'Press out and hold. Don’t let the cable twist you.', 'AH_QZLm_0-s', 25, 12),
  // ---- main: cardio
  ex('bike_intervals', 'Bike intervals', 'cardio', [], ['gym', 'home'], ['main'], 'Hard 30 s, easy 60 s. Cadence high, shoulders loose.', 'V-vLJ-3ZaSU', 0, 8),
  ex('rower', 'Rowing machine', 'cardio', [], ['gym'], ['main'], 'Legs, then back, then arms. Reverse it on the way in.', 'H0r_ZPXJLtg', 0, 10),
  ex('incline_walk', 'Incline walk', 'cardio', [], ['gym'], ['main', 'cooldown'], 'Steep and slow. Hands off the rails.', '5ZOIkCHwbEo', 0, 10),
  // ---- cooldowns
  ex('doorway_stretch', 'Doorway chest stretch', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Forearm on the frame, step through until the chest opens. Breathe out into it.', 'cCF7OWGyWQ4', 0, 30, 2),
  ex('couch_stretch', 'Couch stretch', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Back knee against the wall, squeeze the glute. Stay tall.', 'A3CmmBXddo0', 0, 30, 2),
  ex('hamstring_stretch', 'Hamstring stretch', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Hinge from the hips with a long spine. Hold where it’s honest.', 'eN2Nxi2Pxao', 0, 30, 2),
  ex('child_pose', 'Child’s pose', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Hips to heels, arms long. Slow nose breathing for the whole hold.', '2MJGg-dUKh0', 0, 45, 2),
  ex('lat_stretch', 'Lat stretch', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Hang from the rack or lean on a bench. Let the ribs drop.', 'k7qb2Cyb5Cw', 0, 30, 2),
  ex('walk_cooldown', 'Easy walk', 'mobility', [], ['gym', 'home', 'none'], ['cooldown'], 'Three minutes easy. Let the heart rate come down before you leave.', '5ZOIkCHwbEo', 0, 3, 1),
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export function getExercise(id: string): Exercise | undefined { return BY_ID.get(id); }
export function exerciseIdSet(): Set<string> { return new Set(BY_ID.keys()); }

/** Typed seam: the library is injected where consumed so a fixture can swap it. */
export interface ExerciseLibrary { all(): Exercise[]; get(id: string): Exercise | undefined; has(id: string): boolean; tagVocabulary(): readonly string[]; }
export const exerciseLibrary: ExerciseLibrary = {
  all: () => EXERCISES, get: (id) => BY_ID.get(id), has: (id) => BY_ID.has(id), tagVocabulary: () => CONTRAINDICATION_TAGS,
};
