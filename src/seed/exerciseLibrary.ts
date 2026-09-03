// Exercise library seed (PRD R22). Consumed by plan generation rails, the players and the Form video screen.
//
// Four separate vocabularies live on an exercise, and they are deliberately not mixed:
//   `tags`      — contraindication vocabulary only. R21/R61 structure a reported injury into these, and the plan
//                 rails (domain/plan.ts) drop any exercise whose tags intersect the user's active injuries. Never
//                 put a muscle or a piece of gear in here: it would silently contraindicate healthy exercises.
//   `venues`    — where the exercise is possible (commercial gym / home setup / nothing at all). Drives eligibility
//                 from the intake `equipment` answer.
//   `equipment` — the actual gear the exercise needs. Display + future filtering; not used by the rails today.
//   `muscles`   — primary movers and secondary contributors, for contextual display and future balance checks.
//
// Videos are YouTube links: nothing is downloaded or bundled. Each exercise carries the raw id, so the Form video
// screen can build a thumbnail and an inline embed, and still link out to the watch page.
import type { Phase } from '../domain/types';

export type Venue = 'gym' | 'home' | 'none';
export type Pattern = 'push' | 'pull' | 'legs' | 'hinge' | 'core' | 'cardio' | 'mobility';

/** Muscle groups an exercise can target. Display + future programming balance; not part of the safety rails. */
export const MUSCLE_GROUPS = [
  'chest', 'front_delts', 'side_delts', 'rear_delts', 'triceps', 'biceps', 'forearms',
  'lats', 'upper_back', 'traps', 'lower_back', 'abs', 'obliques',
  'glutes', 'quads', 'hamstrings', 'adductors', 'calves', 'hip_flexors', 'heart_lungs',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Gear vocabulary. Captured now so equipment filtering and "what you need" copy can be built without a re-seed. */
export const EQUIPMENT_ITEMS = [
  'bodyweight', 'barbell', 'dumbbell', 'kettlebell', 'cable_machine', 'machine', 'bench', 'squat_rack',
  'pull_up_bar', 'dip_bar', 'resistance_band', 'plyo_box', 'mat', 'treadmill', 'rower', 'air_bike', 'wall', 'doorway',
] as const;
export type EquipmentItem = (typeof EQUIPMENT_ITEMS)[number];

/** The injury vocabulary. R61 maps free-text injuries onto these; the rails match them against `tags`. */
export const CONTRAINDICATION_TAGS = [
  'deep_squat', 'plyometric_jump', 'overhead_press', 'heavy_hinge', 'loaded_knee_flexion', 'spinal_compression',
  'high_impact', 'bench_press', 'pull_up', 'running', 'wrist_load', 'neck_load',
] as const;
export type ContraindicationTag = (typeof CONTRAINDICATION_TAGS)[number];

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  /** Contraindication tags only — see the header note. */
  tags: ContraindicationTag[];
  venues: Venue[];
  equipment: EquipmentItem[];
  muscles: { primary: MuscleGroup[]; secondary: MuscleGroup[] };
  phases: Phase[];
  /** Nora's one-line voice cue, shown in the players. */
  cue: string;
  /** Plain form points, shown on the Form video screen. */
  form: string[];
  videoId: string;
  /** Watch page — the link-out. */
  videoUrl: string;
  /** Inline player source for the in-app embed. */
  videoEmbedUrl: string;
  thumbnailUrl: string;
  startWeightLb: number;
  reps: number;
  sets: number;
  loadedByWeight: boolean;
}

type Spec = Omit<Exercise, 'videoUrl' | 'videoEmbedUrl' | 'thumbnailUrl' | 'sets' | 'loadedByWeight'>
  & { sets?: number; loadedByWeight?: boolean };

export const watchUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
export const embedUrl = (videoId: string) =>
  `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`;
export const thumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

const ex = (s: Spec): Exercise => ({
  ...s,
  sets: s.sets ?? 3,
  loadedByWeight: s.loadedByWeight ?? s.startWeightLb > 0,
  videoUrl: watchUrl(s.videoId),
  videoEmbedUrl: embedUrl(s.videoId),
  thumbnailUrl: thumbnailUrl(s.videoId),
});

const ALL: Venue[] = ['gym', 'home', 'none'];

export const EXERCISES: Exercise[] = [
  // ───────────────────────────── warm-ups
  ex({
    id: 'empty_bar_bench', name: 'Empty-bar bench', pattern: 'push', tags: ['bench_press'],
    venues: ['gym'], equipment: ['barbell', 'bench'],
    muscles: { primary: ['chest'], secondary: ['front_delts', 'triceps'] }, phases: ['warmup'],
    cue: 'Just the bar — groove the path, wake up the shoulders. Fast and easy.',
    form: ['Shoulder blades pinched down and back into the bench.', 'Bar touches mid-chest, wrists stacked over the elbows.', 'Move fast but full range — this is a rehearsal, not a set.'],
    videoId: 'rT7DgCr-3pg', startWeightLb: 45, reps: 12, sets: 2,
  }),
  ex({
    id: 'band_pull_apart', name: 'Band pull-apart', pattern: 'pull', tags: [],
    venues: ['gym', 'home'], equipment: ['resistance_band'],
    muscles: { primary: ['rear_delts', 'upper_back'], secondary: ['traps'] }, phases: ['warmup'],
    cue: 'Pinch the shoulder blades at the end. Slow on the way back.',
    form: ['Arms straight, band at chest height.', 'Pull until the band touches the sternum.', 'Three seconds back — the return is the work.'],
    videoId: 'kZDAZFxA3-c', startWeightLb: 0, reps: 15, sets: 2,
  }),
  ex({
    id: 'bodyweight_squat', name: 'Bodyweight squat', pattern: 'legs', tags: ['deep_squat'],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'abs'] }, phases: ['warmup'],
    cue: 'Sit between the heels, chest tall. Just moving, not working.',
    form: ['Feet shoulder-width, toes slightly out.', 'Sit back and down, knees tracking over the toes.', 'Whole foot stays planted — no rocking onto the toes.'],
    videoId: 'aclHkVaku9U', startWeightLb: 0, reps: 12, sets: 2,
  }),
  ex({
    id: 'leg_swings', name: 'Leg swings', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['bodyweight', 'wall'],
    muscles: { primary: ['hip_flexors', 'hamstrings'], secondary: ['glutes', 'adductors'] }, phases: ['warmup'],
    cue: 'Front to back, then side to side. Loosen the hips without forcing range.',
    form: ['Hold a wall or rack for balance.', 'Swing from the hip, torso stays upright.', 'Let range build over reps — never bounce into the end range.'],
    videoId: 'difYoBtZi2s', startWeightLb: 0, reps: 12, sets: 2,
  }),
  ex({
    id: 'arm_circles', name: 'Arm circles', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['front_delts', 'side_delts'], secondary: ['rear_delts', 'upper_back'] }, phases: ['warmup'],
    cue: 'Small circles growing bigger. Shoulders warm before anything overhead.',
    form: ['Arms straight out to the sides.', 'Start small, grow the circle every few reps.', 'Reverse direction halfway through.'],
    videoId: '140RTNMciH8', startWeightLb: 0, reps: 15, sets: 2,
  }),
  ex({
    id: 'glute_bridge_warm', name: 'Glute bridge', pattern: 'hinge', tags: [],
    venues: ALL, equipment: ['mat'],
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] }, phases: ['warmup'],
    cue: 'Drive through the heels, squeeze at the top. Wake the glutes up.',
    form: ['Heels close to the glutes, feet flat.', 'Ribs down — lift with the hips, not the lower back.', 'Pause and squeeze for a beat at the top.'],
    videoId: 'wPM8icPu6H8', startWeightLb: 0, reps: 12, sets: 2,
  }),
  ex({
    id: 'empty_bar_deadlift', name: 'Empty-bar hinge', pattern: 'hinge', tags: [],
    venues: ['gym'], equipment: ['barbell'],
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'lats'] }, phases: ['warmup'],
    cue: 'Push the hips back, bar close to the legs. Feel the hamstrings load.',
    form: ['Bar over mid-foot, shins near vertical.', 'Hinge at the hips with a flat back — this is not a squat.', 'Bar stays in contact with the legs the whole way.'],
    videoId: 'op9kVnSso6Q', startWeightLb: 45, reps: 10, sets: 2,
  }),
  ex({
    id: 'cat_cow', name: 'Cat-cow', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['mat'],
    muscles: { primary: ['lower_back', 'abs'], secondary: ['upper_back'] }, phases: ['warmup', 'cooldown'],
    cue: 'Arch and round one vertebra at a time. Breathe with it.',
    form: ['Hands under shoulders, knees under hips.', 'Inhale to arch, exhale to round.', 'Move the whole spine, not just the lower back.'],
    videoId: 'LIVJZZyZ2qM', startWeightLb: 0, reps: 10, sets: 2,
  }),
  ex({
    id: 'worlds_greatest_stretch', name: "World's greatest stretch", pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['bodyweight', 'mat'],
    muscles: { primary: ['hip_flexors', 'hamstrings'], secondary: ['glutes', 'upper_back', 'adductors'] }, phases: ['warmup'],
    cue: 'Lunge, drop the elbow inside the foot, then open the chest to the sky.',
    form: ['Deep lunge, back knee off the floor.', 'Lead elbow toward the instep of the front foot.', 'Rotate from the mid-back and follow the hand with your eyes.'],
    videoId: '-CiWQ2IvY34', startWeightLb: 0, reps: 6, sets: 2,
  }),
  ex({
    id: 'jumping_jacks', name: 'Jumping jacks', pattern: 'cardio', tags: ['high_impact'],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['heart_lungs'], secondary: ['calves', 'side_delts', 'glutes'] }, phases: ['warmup'],
    cue: 'Loose and rhythmic. Get the heart rate up before anything heavy.',
    form: ['Land soft on the balls of the feet.', 'Arms all the way overhead each rep.', 'Stay tall — no folding at the waist as you tire.'],
    videoId: 'XR0xeuK5zBU', startWeightLb: 0, reps: 30, sets: 2,
  }),

  // ───────────────────────────── main: push
  ex({
    id: 'bench_press', name: 'Bench press', pattern: 'push', tags: ['bench_press'],
    venues: ['gym'], equipment: ['barbell', 'bench', 'squat_rack'],
    muscles: { primary: ['chest'], secondary: ['triceps', 'front_delts'] }, phases: ['main'],
    cue: 'Three seconds down, brief pause at the chest. Bar over mid-chest.',
    form: ['Shoulder blades retracted, feet driving into the floor.', 'Elbows about 45° from the torso, not flared to 90°.', 'Bar path is a shallow arc from mid-chest to over the shoulders.'],
    videoId: 'rT7DgCr-3pg', startWeightLb: 135, reps: 8,
  }),
  ex({
    id: 'incline_db_press', name: 'Incline DB press', pattern: 'push', tags: [],
    venues: ['gym', 'home'], equipment: ['dumbbell', 'bench'],
    muscles: { primary: ['chest', 'front_delts'], secondary: ['triceps'] }, phases: ['main'],
    cue: 'Elbows about 45°. Full stretch at the bottom, no bounce.',
    form: ['Bench at roughly 30° — steeper turns it into a shoulder press.', 'Lower until you feel a stretch across the chest.', 'Press up and slightly in; do not clang the bells together.'],
    videoId: '8iPEnn-ltC8', startWeightLb: 50, reps: 10,
  }),
  ex({
    id: 'overhead_press', name: 'Overhead press', pattern: 'push', tags: ['overhead_press'],
    venues: ['gym', 'home'], equipment: ['barbell'],
    muscles: { primary: ['front_delts'], secondary: ['triceps', 'side_delts', 'abs'] }, phases: ['main'],
    cue: 'Brace hard, bar in a straight line. Head through at the top.',
    form: ['Squeeze glutes and abs so the lower back does not arch.', 'Tuck the chin so the bar clears the face.', 'Push the head "through the window" once the bar passes the forehead.'],
    videoId: '2yjwXTZQDDI', startWeightLb: 75, reps: 8,
  }),
  ex({
    id: 'db_shoulder_press', name: 'DB shoulder press', pattern: 'push', tags: ['overhead_press'],
    venues: ['gym', 'home'], equipment: ['dumbbell', 'bench'],
    muscles: { primary: ['front_delts'], secondary: ['triceps', 'side_delts'] }, phases: ['main'],
    cue: 'Elbows slightly forward. Press up and slightly in.',
    form: ['Start with the bells at ear height, palms forward.', 'Ribs down — no leaning back to make the press easier.', 'Lower under control to the start each rep.'],
    videoId: 'qEwKCR5JCog', startWeightLb: 35, reps: 10,
  }),
  ex({
    id: 'push_up', name: 'Push-up', pattern: 'push', tags: ['wrist_load'],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['chest'], secondary: ['triceps', 'front_delts', 'abs'] }, phases: ['main'],
    cue: 'Body in one line. Chest to an inch off the floor.',
    form: ['Hands under the shoulders, elbows back at ~45°.', 'Squeeze glutes so the hips do not sag.', 'Regress to an incline on a bench before you let form break.'],
    videoId: 'IODxDxX7oi4', startWeightLb: 0, reps: 12,
  }),
  ex({
    id: 'dip', name: 'Dip', pattern: 'push', tags: [],
    venues: ['gym'], equipment: ['dip_bar'],
    muscles: { primary: ['chest', 'triceps'], secondary: ['front_delts'] }, phases: ['main'],
    cue: 'Lean forward a touch, elbows to 90°. No shrugging.',
    form: ['Shoulders pulled down away from the ears at the top.', 'Stop at about 90° of elbow bend — deeper stresses the shoulder.', 'Control the descent; never drop into the bottom.'],
    videoId: '2z8JmcrW-As', startWeightLb: 0, reps: 8,
  }),
  ex({
    id: 'lateral_raise', name: 'Lateral raise', pattern: 'push', tags: [],
    venues: ['gym', 'home'], equipment: ['dumbbell'],
    muscles: { primary: ['side_delts'], secondary: ['traps', 'rear_delts'] }, phases: ['main'],
    cue: 'Lead with the elbows, stop at shoulder height. Light and strict.',
    form: ['Slight bend in the elbow, held throughout.', 'Raise to shoulder height, no higher.', 'If you have to swing it, the dumbbells are too heavy.'],
    videoId: '3VcKaXpzqRo', startWeightLb: 15, reps: 12,
  }),
  ex({
    id: 'cable_fly', name: 'Cable fly', pattern: 'push', tags: [],
    venues: ['gym'], equipment: ['cable_machine'],
    muscles: { primary: ['chest'], secondary: ['front_delts'] }, phases: ['main'],
    cue: 'Soft elbows, big stretch, squeeze in front of the chest.',
    form: ['Elbow angle stays fixed — this is a hug, not a press.', 'Step forward so there is tension at the stretched position.', 'Bring the hands together and hold for a beat.'],
    videoId: 'Iwe6AmxVf7o', startWeightLb: 25, reps: 12,
  }),
  ex({
    id: 'triceps_pushdown', name: 'Triceps pushdown', pattern: 'push', tags: [],
    venues: ['gym'], equipment: ['cable_machine'],
    muscles: { primary: ['triceps'], secondary: [] }, phases: ['main'],
    cue: 'Elbows pinned to the ribs. Only the forearms move.',
    form: ['Upper arms stay glued to the sides.', 'Push all the way to a straight arm and pause.', 'Let the rope come up to about 90° — no further shoulder involvement.'],
    videoId: '_w-HpW70nSQ', startWeightLb: 40, reps: 12,
  }),
  ex({
    id: 'overhead_triceps_ext', name: 'Overhead triceps extension', pattern: 'push', tags: ['overhead_press'],
    venues: ['gym', 'home'], equipment: ['dumbbell'],
    muscles: { primary: ['triceps'], secondary: ['abs'] }, phases: ['main'],
    cue: 'Elbows narrow and pointed up. Deep stretch behind the head.',
    form: ['Elbows stay close to the ears the whole set.', 'Lower until you feel a stretch, not until the shoulders shrug.', 'Ribs down so the lower back does not arch.'],
    videoId: '-Vyt2QdsR7E', startWeightLb: 30, reps: 12,
  }),

  // ───────────────────────────── main: pull
  ex({
    id: 'seated_cable_row', name: 'Seated cable row', pattern: 'pull', tags: [],
    venues: ['gym'], equipment: ['cable_machine', 'machine'],
    muscles: { primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'] }, phases: ['main'],
    cue: 'Squeeze the shoulder blades. No lean-back past vertical.',
    form: ['Chest up, slight knee bend, torso close to vertical.', 'Pull the handle to the belly button.', 'Let the shoulder blades travel forward on the stretch.'],
    videoId: 'GZbfZ033f74', startWeightLb: 120, reps: 10,
  }),
  ex({
    id: 'lat_pulldown', name: 'Lat pulldown', pattern: 'pull', tags: [],
    venues: ['gym'], equipment: ['cable_machine', 'machine'],
    muscles: { primary: ['lats'], secondary: ['biceps', 'upper_back', 'rear_delts'] }, phases: ['main'],
    cue: 'Elbows down and in. Chest up, bar to the collarbone.',
    form: ['Grip just outside shoulder width.', 'Lean back slightly and hold that angle — do not rock.', 'Pull the elbows toward the hips, not the hands toward the chin.'],
    videoId: 'CAwf7n6Luuc', startWeightLb: 110, reps: 12,
  }),
  ex({
    id: 'pull_up', name: 'Pull-up', pattern: 'pull', tags: ['pull_up'],
    venues: ['gym', 'home'], equipment: ['pull_up_bar'],
    muscles: { primary: ['lats'], secondary: ['biceps', 'upper_back', 'abs', 'forearms'] }, phases: ['main'],
    cue: 'Full hang to chin over bar. Control the way down.',
    form: ['Start from a dead hang with the shoulders pulled down.', 'Drive the elbows down toward the floor.', 'Three seconds down — the lowering builds the strength.'],
    videoId: 'eGo4IYlbE5g', startWeightLb: 0, reps: 6,
  }),
  ex({
    id: 'db_row', name: 'One-arm DB row', pattern: 'pull', tags: [],
    venues: ['gym', 'home'], equipment: ['dumbbell', 'bench'],
    muscles: { primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'] }, phases: ['main'],
    cue: 'Pull to the hip, not the armpit. Keep the torso square.',
    form: ['Flat back, hips square to the floor — no twisting to finish a rep.', 'Row toward the hip in a slight arc.', 'Full stretch at the bottom, letting the shoulder blade travel.'],
    videoId: 'pYcpY20QaE8', startWeightLb: 55, reps: 10,
  }),
  ex({
    id: 'barbell_row', name: 'Barbell row', pattern: 'pull', tags: ['heavy_hinge'],
    venues: ['gym'], equipment: ['barbell'],
    muscles: { primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts', 'lower_back'] }, phases: ['main'],
    cue: 'Hinge to about 45°, brace, then row to the belly button.',
    form: ['Flat back held for the whole set — this is the safety point.', 'Bar travels close to the legs.', 'No heaving with the hips to move the weight.'],
    videoId: '9efgcAjQe7E', startWeightLb: 115, reps: 10,
  }),
  ex({
    id: 'face_pull', name: 'Face pull', pattern: 'pull', tags: [],
    venues: ['gym', 'home'], equipment: ['cable_machine', 'resistance_band'],
    muscles: { primary: ['rear_delts', 'upper_back'], secondary: ['traps'] }, phases: ['main'],
    cue: 'Rope to the forehead, elbows high. Pause and separate the hands.',
    form: ['Set the cable at about head height.', 'Elbows stay above the wrists throughout.', 'Pull the hands apart as they reach the face, then pause.'],
    videoId: 'rep-qVOkqgk', startWeightLb: 40, reps: 15,
  }),
  ex({
    id: 'inverted_row', name: 'Inverted row', pattern: 'pull', tags: [],
    venues: ['home', 'none'], equipment: ['barbell', 'squat_rack', 'bodyweight'],
    muscles: { primary: ['upper_back', 'lats'], secondary: ['biceps', 'abs'] }, phases: ['main'],
    cue: 'Body straight, chest to the bar or table edge. Slow down.',
    form: ['Glutes tight so the body stays a rigid plank.', 'Chest touches the bar each rep.', 'Walk the feet in to make it easier, out to make it harder.'],
    videoId: 'KOaCM1HMwU0', startWeightLb: 0, reps: 10,
  }),
  ex({
    id: 'band_row', name: 'Band row', pattern: 'pull', tags: [],
    venues: ['home', 'none'], equipment: ['resistance_band'],
    muscles: { primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'] }, phases: ['main'],
    cue: 'Anchor at chest height, pull to the ribs, pause.',
    form: ['Step back until the band is already taut at the start.', 'Elbows brush past the ribs, not out wide.', 'Resist the band on the way back rather than letting it snap you forward.'],
    videoId: 'LSkyinhmA8k', startWeightLb: 0, reps: 15,
  }),
  ex({
    id: 'barbell_curl', name: 'Barbell curl', pattern: 'pull', tags: ['wrist_load'],
    venues: ['gym', 'home'], equipment: ['barbell'],
    muscles: { primary: ['biceps'], secondary: ['forearms'] }, phases: ['main'],
    cue: 'Elbows at your sides. Curl the bar, not your whole body.',
    form: ['Upper arms stay still — only the forearms move.', 'Squeeze at the top without swinging the elbows forward.', 'Lower over three seconds to a full straight arm.'],
    videoId: 'QZEqB6wUPxQ', startWeightLb: 45, reps: 10,
  }),
  ex({
    id: 'hammer_curl', name: 'Hammer curl', pattern: 'pull', tags: [],
    venues: ['gym', 'home'], equipment: ['dumbbell'],
    muscles: { primary: ['biceps', 'forearms'], secondary: [] }, phases: ['main'],
    cue: 'Thumbs up the whole way. Slow down, no swinging.',
    form: ['Neutral grip — palms face each other start to finish.', 'Elbows pinned to the ribs.', 'Full lockout at the bottom before the next rep.'],
    videoId: '8XLxfXROrTo', startWeightLb: 25, reps: 12,
  }),

  // ───────────────────────────── main: legs
  ex({
    id: 'back_squat', name: 'Back squat', pattern: 'legs', tags: ['deep_squat', 'spinal_compression'],
    venues: ['gym'], equipment: ['barbell', 'squat_rack'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower_back', 'abs', 'adductors'] }, phases: ['main'],
    cue: 'Brace, sit down between the heels, drive the floor away.',
    form: ['Big breath into the belly and brace before you unrack.', 'Knees track over the toes; do not let them cave in.', 'Hips and shoulders rise at the same rate out of the hole.'],
    videoId: 'ultWZbUMPL8', startWeightLb: 185, reps: 5,
  }),
  ex({
    id: 'front_squat', name: 'Front squat', pattern: 'legs', tags: ['deep_squat', 'spinal_compression'],
    venues: ['gym'], equipment: ['barbell', 'squat_rack'],
    muscles: { primary: ['quads'], secondary: ['glutes', 'abs', 'upper_back'] }, phases: ['main'],
    cue: 'Elbows high, torso upright. Full depth if the knees allow.',
    form: ['Bar rests on the front delts — the hands only steady it.', 'Elbows point forward and stay up all the way through.', 'Torso stays vertical; if the elbows drop, the rep is over.'],
    videoId: 'm4ytaCJZpl0', startWeightLb: 135, reps: 6,
  }),
  ex({
    id: 'goblet_squat', name: 'Goblet squat', pattern: 'legs', tags: ['deep_squat'],
    venues: ['gym', 'home'], equipment: ['dumbbell', 'kettlebell'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['abs', 'adductors'] }, phases: ['main'],
    cue: 'Elbows inside the knees at the bottom. Heels down.',
    form: ['Hold the weight at chest height, close to the body.', 'Sit straight down between the feet.', 'Use the elbows to push the knees out at the bottom.'],
    videoId: 'MeIiIdhvXT4', startWeightLb: 50, reps: 10,
  }),
  ex({
    id: 'leg_press', name: 'Leg press', pattern: 'legs', tags: [],
    venues: ['gym'], equipment: ['machine'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] }, phases: ['main'],
    cue: 'Feet mid-plate, stop before the lower back rounds. Push through the whole foot.',
    form: ['Lower back and hips stay flat against the pad.', 'Stop the descent the moment the tailbone lifts.', 'Do not lock the knees out hard at the top.'],
    videoId: 'IZxyjW7MPJQ', startWeightLb: 270, reps: 10,
  }),
  ex({
    id: 'split_squat', name: 'Split squat', pattern: 'legs', tags: ['loaded_knee_flexion'],
    venues: ALL, equipment: ['dumbbell', 'bench', 'bodyweight'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'adductors'] }, phases: ['main'],
    cue: 'Long stance, drop straight down. Front heel stays planted.',
    form: ['Feet about hip-width apart side to side, not on a tightrope.', 'Drop the back knee straight down toward the floor.', 'Front heel never lifts.'],
    videoId: '2C-uNgKwPLE', startWeightLb: 30, reps: 10,
  }),
  ex({
    id: 'walking_lunge', name: 'Walking lunge', pattern: 'legs', tags: ['loaded_knee_flexion'],
    venues: ALL, equipment: ['dumbbell', 'bodyweight'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'calves', 'abs'] }, phases: ['main'],
    cue: 'Long steps, knee tracks over the toes. Stay tall.',
    form: ['Step out far enough that the front shin stays near vertical.', 'Torso upright — resist leaning over the front leg.', 'Push through the front heel to stand.'],
    videoId: 'L8fvypPrzzs', startWeightLb: 25, reps: 12,
  }),
  ex({
    id: 'leg_extension', name: 'Leg extension', pattern: 'legs', tags: [],
    venues: ['gym'], equipment: ['machine'],
    muscles: { primary: ['quads'], secondary: [] }, phases: ['main'],
    cue: 'Squeeze hard at the top for a second. Don’t swing.',
    form: ['Set the pad just above the ankles.', 'Pause and squeeze at full extension.', 'Lower slowly — no letting the stack crash down.'],
    videoId: 'YyvSfVjQeL0', startWeightLb: 90, reps: 12,
  }),
  ex({
    id: 'leg_curl', name: 'Lying leg curl', pattern: 'legs', tags: [],
    venues: ['gym'], equipment: ['machine'],
    muscles: { primary: ['hamstrings'], secondary: ['calves', 'glutes'] }, phases: ['main'],
    cue: 'Toes pointed, curl to the glutes, three seconds down.',
    form: ['Hips stay down on the pad — do not lift them to finish a rep.', 'Curl as far as the knee comfortably allows.', 'Control the whole eccentric.'],
    videoId: 'ELOCsoDSmrg', startWeightLb: 80, reps: 12,
  }),
  ex({
    id: 'calf_raise', name: 'Standing calf raise', pattern: 'legs', tags: [],
    venues: ALL, equipment: ['bodyweight', 'dumbbell', 'machine'],
    muscles: { primary: ['calves'], secondary: [] }, phases: ['main'],
    cue: 'Full stretch at the bottom, pause at the top.',
    form: ['Work off a step so the heel can drop below the toes.', 'Pause a beat at the very top.', 'No bouncing — the stretch is the point.'],
    videoId: '-M4-G8p8fmc', startWeightLb: 0, reps: 15,
  }),
  ex({
    id: 'box_jump', name: 'Box jump', pattern: 'legs', tags: ['plyometric_jump', 'high_impact'],
    venues: ['gym'], equipment: ['plyo_box'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['calves', 'hamstrings'] }, phases: ['main'],
    cue: 'Land soft and quiet, then step down. Never jump down.',
    form: ['Pick a box you can land on with the hips above the knees.', 'Land soft, absorbing through the hips and knees.', 'Always step down — jumping down is where achilles injuries happen.'],
    videoId: 'NBY9-kTuHEk', startWeightLb: 0, reps: 5,
  }),
  ex({
    id: 'jump_squat', name: 'Jump squat', pattern: 'legs', tags: ['plyometric_jump', 'deep_squat', 'high_impact'],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['quads', 'glutes'], secondary: ['calves', 'hamstrings'] }, phases: ['main'],
    cue: 'Explode up, absorb the landing through the hips.',
    form: ['Quarter-squat, then drive up hard.', 'Land on the whole foot and immediately sink into the next rep.', 'Stop the set the moment the landings get loud.'],
    videoId: 'A-cFYWvaHr0', startWeightLb: 0, reps: 8,
  }),

  // ───────────────────────────── main: hinge
  ex({
    id: 'deadlift', name: 'Deadlift', pattern: 'hinge', tags: ['heavy_hinge', 'spinal_compression'],
    venues: ['gym'], equipment: ['barbell'],
    muscles: { primary: ['hamstrings', 'glutes', 'lower_back'], secondary: ['lats', 'traps', 'quads', 'forearms'] }, phases: ['main'],
    cue: 'Bar over mid-foot, slack out, push the floor away. Lock out with the glutes.',
    form: ['Bar over mid-foot before you bend down to it.', 'Flat back, chest up, lats engaged to hold the bar close.', 'Finish standing tall with the glutes — never lean back at the top.'],
    videoId: 'op9kVnSso6Q', startWeightLb: 225, reps: 5,
  }),
  ex({
    id: 'romanian_deadlift', name: 'Romanian deadlift', pattern: 'hinge', tags: ['heavy_hinge'],
    venues: ['gym', 'home'], equipment: ['barbell', 'dumbbell'],
    muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lower_back', 'lats'] }, phases: ['main'],
    cue: 'Hips back, bar sliding down the thighs. Stop when the hamstrings say so.',
    form: ['Soft knees, held at the same angle throughout.', 'Push the hips back — the bar goes down because the hips go back.', 'Stop at the point the back would start to round.'],
    videoId: 'JCXUYuzwNrM', startWeightLb: 135, reps: 8,
  }),
  ex({
    id: 'hip_thrust', name: 'Hip thrust', pattern: 'hinge', tags: [],
    venues: ['gym', 'home'], equipment: ['barbell', 'bench'],
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] }, phases: ['main'],
    cue: 'Chin tucked, ribs down. Squeeze the glutes at the top for a beat.',
    form: ['Bench under the shoulder blades, feet flat and shins vertical at the top.', 'Chin tucked and eyes forward through the whole rep.', 'Finish with the torso parallel to the floor — no hyperextending.'],
    videoId: 'xDmFkJxPzeM', startWeightLb: 135, reps: 10,
  }),
  ex({
    id: 'kb_swing', name: 'Kettlebell swing', pattern: 'hinge', tags: ['heavy_hinge'],
    venues: ['gym', 'home'], equipment: ['kettlebell'],
    muscles: { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'abs', 'heart_lungs', 'forearms'] }, phases: ['main'],
    cue: 'Snap the hips, arms are ropes. Bell to chest height, no higher.',
    form: ['This is a hinge, not a squat — the bell travels back between the legs.', 'Drive the hips forward hard; the arms never lift the bell.', 'Snap to a tall standing plank, glutes locked.'],
    videoId: 'YSxHifyI6s8', startWeightLb: 35, reps: 15,
  }),
  ex({
    id: 'glute_bridge', name: 'Glute bridge', pattern: 'hinge', tags: [],
    venues: ALL, equipment: ['mat'],
    muscles: { primary: ['glutes'], secondary: ['hamstrings', 'abs'] }, phases: ['main'],
    cue: 'Heels close, drive up, squeeze. Two seconds at the top.',
    form: ['Ribs down so the lift comes from the hips, not the lower back.', 'Push through the heels.', 'Hold the top for two full seconds.'],
    videoId: 'wPM8icPu6H8', startWeightLb: 0, reps: 15,
  }),

  // ───────────────────────────── main: core
  ex({
    id: 'plank', name: 'Plank', pattern: 'core', tags: ['wrist_load'],
    venues: ALL, equipment: ['mat', 'bodyweight'],
    muscles: { primary: ['abs'], secondary: ['obliques', 'glutes', 'front_delts'] }, phases: ['main'],
    cue: 'Ribs down, glutes tight. Breathe.',
    form: ['Elbows under the shoulders, forearms flat.', 'Squeeze the glutes so the hips neither sag nor pike up.', 'End the hold when the line breaks, not when the clock runs out.'],
    videoId: 'pSHjTRCQxIw', startWeightLb: 0, reps: 45,
  }),
  ex({
    id: 'dead_bug', name: 'Dead bug', pattern: 'core', tags: [],
    venues: ALL, equipment: ['mat'],
    muscles: { primary: ['abs'], secondary: ['obliques', 'hip_flexors'] }, phases: ['main'],
    cue: 'Lower back pressed to the floor the whole time. Slow opposite arm and leg.',
    form: ['Press the lower back flat into the floor and keep it there.', 'Extend opposite arm and leg slowly.', 'If the back arches, shorten the range.'],
    videoId: 'g_BYB0R-4Ws', startWeightLb: 0, reps: 10,
  }),
  ex({
    id: 'cable_crunch', name: 'Cable crunch', pattern: 'core', tags: [],
    venues: ['gym'], equipment: ['cable_machine'],
    muscles: { primary: ['abs'], secondary: ['obliques'] }, phases: ['main'],
    cue: 'Curl the spine, elbows to the knees. Hips stay still.',
    form: ['Kneel far enough back that the cable is taut at the start.', 'Curl the spine down — this is a crunch, not a hip hinge.', 'Hips stay in one place the whole set.'],
    videoId: '3qjoXDTuyOE', startWeightLb: 60, reps: 15,
  }),
  ex({
    id: 'pallof_press', name: 'Pallof press', pattern: 'core', tags: [],
    venues: ['gym', 'home'], equipment: ['cable_machine', 'resistance_band'],
    muscles: { primary: ['obliques', 'abs'], secondary: ['glutes', 'front_delts'] }, phases: ['main'],
    cue: 'Press out and hold. Don’t let the cable twist you.',
    form: ['Stand side-on to the anchor, feet shoulder-width.', 'Press straight out from the sternum and hold for a beat.', 'The whole job is resisting rotation — hips stay square.'],
    videoId: 'AH_QZLm_0-s', startWeightLb: 25, reps: 12,
  }),

  // ───────────────────────────── main: cardio
  ex({
    id: 'bike_intervals', name: 'Bike intervals', pattern: 'cardio', tags: [],
    venues: ['gym', 'home'], equipment: ['air_bike'],
    muscles: { primary: ['heart_lungs'], secondary: ['quads', 'glutes', 'lats', 'calves'] }, phases: ['main'],
    cue: 'Hard 30 s, easy 60 s. Cadence high, shoulders loose.',
    form: ['Set the seat so the knee is slightly bent at the bottom.', 'Push and pull the handles — it is a whole-body machine.', 'Keep the shoulders down and the grip relaxed.'],
    videoId: 'YJdvEpTKpXk', startWeightLb: 0, reps: 8,
  }),
  ex({
    id: 'rower', name: 'Rowing machine', pattern: 'cardio', tags: [],
    venues: ['gym'], equipment: ['rower'],
    muscles: { primary: ['heart_lungs', 'lats'], secondary: ['quads', 'glutes', 'hamstrings', 'upper_back', 'biceps'] }, phases: ['main'],
    cue: 'Legs, then back, then arms. Reverse it on the way in.',
    form: ['Drive with the legs first — most of the power is there.', 'Then swing the torso back, then pull the handle to the ribs.', 'Recover in the exact reverse order: arms, body, legs.'],
    videoId: 'H0r_ZPXJLtg', startWeightLb: 0, reps: 10,
  }),
  ex({
    id: 'incline_walk', name: 'Incline walk', pattern: 'cardio', tags: [],
    venues: ['gym'], equipment: ['treadmill'],
    muscles: { primary: ['heart_lungs', 'glutes'], secondary: ['hamstrings', 'calves', 'quads'] }, phases: ['main', 'cooldown'],
    cue: 'Steep and slow. Hands off the rails.',
    form: ['Set a steep incline and a walking pace you can hold.', 'Hands off the handrails — holding on removes most of the work.', 'Stay upright; do not lean back into the machine.'],
    videoId: 'NAsObfFJXvE', startWeightLb: 0, reps: 10,
  }),

  // ───────────────────────────── cooldowns
  ex({
    id: 'doorway_stretch', name: 'Doorway chest stretch', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['doorway', 'wall'],
    muscles: { primary: ['chest', 'front_delts'], secondary: [] }, phases: ['cooldown'],
    cue: 'Forearm on the frame, step through until the chest opens. Breathe out into it.',
    form: ['Forearm flat on the frame, elbow at about shoulder height.', 'Step through gently and rotate away.', 'Stretch, never sharp pain — back off if the shoulder pinches.'],
    videoId: 'B9uY01NoqBg', startWeightLb: 0, reps: 30, sets: 2,
  }),
  ex({
    id: 'couch_stretch', name: 'Couch stretch', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['wall', 'mat'],
    muscles: { primary: ['hip_flexors', 'quads'], secondary: ['glutes'] }, phases: ['cooldown'],
    cue: 'Back knee against the wall, squeeze the glute. Stay tall.',
    form: ['Back knee in the crease of the wall or couch, shin up the surface.', 'Squeeze the glute of the back leg — that is what makes it work.', 'Come up tall gradually; start with the torso forward if it is too intense.'],
    videoId: 'Fg-lwNBzVV8', startWeightLb: 0, reps: 30, sets: 2,
  }),
  ex({
    id: 'hamstring_stretch', name: 'Hamstring stretch', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['bodyweight'],
    muscles: { primary: ['hamstrings'], secondary: ['calves', 'lower_back'] }, phases: ['cooldown'],
    cue: 'Hinge from the hips with a long spine. Hold where it’s honest.',
    form: ['Heel of the front foot down, toes up.', 'Hinge at the hip with a flat back — do not round to reach further.', 'Hold steady; no bouncing.'],
    videoId: 'sHvur2PUEvg', startWeightLb: 0, reps: 30, sets: 2,
  }),
  ex({
    id: 'child_pose', name: 'Child’s pose', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['mat'],
    muscles: { primary: ['lower_back', 'lats'], secondary: ['glutes'] }, phases: ['cooldown'],
    cue: 'Hips to heels, arms long. Slow nose breathing for the whole hold.',
    form: ['Knees wide, big toes together, hips settling back to the heels.', 'Arms stretched long in front, forehead down.', 'Breathe into the back of the ribs.'],
    videoId: '2MJGg-dUKh0', startWeightLb: 0, reps: 45, sets: 2,
  }),
  ex({
    id: 'lat_stretch', name: 'Lat stretch', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['pull_up_bar', 'bench'],
    muscles: { primary: ['lats'], secondary: ['upper_back', 'traps'] }, phases: ['cooldown'],
    cue: 'Hang from the rack or lean on a bench. Let the ribs drop.',
    form: ['Reach one arm long and let the same-side ribs sink.', 'Slight rotation away from the stretching side deepens it.', 'Relax into it — do not pull hard against the shoulder.'],
    videoId: 'jXB-gTLFDp8', startWeightLb: 0, reps: 30, sets: 2,
  }),
  ex({
    id: 'walk_cooldown', name: 'Easy walk', pattern: 'mobility', tags: [],
    venues: ALL, equipment: ['bodyweight', 'treadmill'],
    muscles: { primary: ['heart_lungs'], secondary: ['calves', 'glutes'] }, phases: ['cooldown'],
    cue: 'Three minutes easy. Let the heart rate come down before you leave.',
    form: ['Flat, conversational pace.', 'Nose breathing if you can hold it.', 'Do not stop dead after a hard session — walk it off first.'],
    videoId: 'u6u4BKwUVF8', startWeightLb: 0, reps: 3, sets: 1,
  }),
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export function getExercise(id: string): Exercise | undefined { return BY_ID.get(id); }
export function exerciseIdSet(): Set<string> { return new Set(BY_ID.keys()); }

/** Typed seam: the library is injected where consumed so a fixture can swap it. */
export interface ExerciseLibrary {
  all(): Exercise[];
  get(id: string): Exercise | undefined;
  has(id: string): boolean;
  tagVocabulary(): readonly string[];
  muscleVocabulary(): readonly string[];
  equipmentVocabulary(): readonly string[];
}
export const exerciseLibrary: ExerciseLibrary = {
  all: () => EXERCISES,
  get: (id) => BY_ID.get(id),
  has: (id) => BY_ID.has(id),
  tagVocabulary: () => CONTRAINDICATION_TAGS,
  muscleVocabulary: () => MUSCLE_GROUPS,
  equipmentVocabulary: () => EQUIPMENT_ITEMS,
};

const LABELS: Partial<Record<MuscleGroup | EquipmentItem, string>> = {
  front_delts: 'front delts', side_delts: 'side delts', rear_delts: 'rear delts', upper_back: 'upper back',
  lower_back: 'lower back', hip_flexors: 'hip flexors', heart_lungs: 'heart & lungs',
  cable_machine: 'cable machine', pull_up_bar: 'pull-up bar', dip_bar: 'dip bar', squat_rack: 'squat rack',
  resistance_band: 'resistance band', plyo_box: 'plyo box', air_bike: 'air bike',
};
/** Human-readable label for a muscle group or equipment item. */
export const label = (v: MuscleGroup | EquipmentItem): string => LABELS[v] ?? v.replace(/_/g, ' ');
