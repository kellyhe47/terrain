// Deterministic demo seed (PRD R67–R69). Date-relative to `installedAt`, so the demo always shows a live current week.
// Every figure the UI displays is derived from this data — nothing is typed into a screen.
import { addDays, dayOf, weekStart, type ISODate } from '../domain/dates';
import type { Repo } from '../db/repo';
import { wipe } from '../db/schema';
import type { Activity, ActivityResult, ExercisePrescription, Meal, MealItem, SetLog } from '../domain/types';
import { getExercise } from './exerciseLibrary';

function rng(seed: number) { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const r1 = (v: number) => Math.round(v * 10) / 10;

const UPPER_A: ExercisePrescription[] = [
  { exerciseId: 'empty_bar_bench', phase: 'warmup', sets: 2, reps: 12, weightLb: 45 },
  { exerciseId: 'bench_press', phase: 'main', sets: 3, reps: 8, weightLb: 135 },
  { exerciseId: 'incline_db_press', phase: 'main', sets: 3, reps: 10, weightLb: 50 },
  { exerciseId: 'seated_cable_row', phase: 'main', sets: 3, reps: 10, weightLb: 120 },
  { exerciseId: 'lat_pulldown', phase: 'main', sets: 3, reps: 12, weightLb: 110 },
  { exerciseId: 'doorway_stretch', phase: 'cooldown', sets: 2, reps: 30, weightLb: 0 },
];
const UPPER_B: ExercisePrescription[] = [
  { exerciseId: 'band_pull_apart', phase: 'warmup', sets: 2, reps: 15, weightLb: 0 },
  { exerciseId: 'seated_cable_row', phase: 'main', sets: 3, reps: 10, weightLb: 120 },
  { exerciseId: 'lat_pulldown', phase: 'main', sets: 3, reps: 12, weightLb: 110 },
  { exerciseId: 'incline_db_press', phase: 'main', sets: 3, reps: 10, weightLb: 50 },
  { exerciseId: 'face_pull', phase: 'main', sets: 3, reps: 15, weightLb: 40 },
  { exerciseId: 'lat_stretch', phase: 'cooldown', sets: 2, reps: 30, weightLb: 0 },
];
const LOWER: ExercisePrescription[] = [
  { exerciseId: 'glute_bridge_warm', phase: 'warmup', sets: 2, reps: 12, weightLb: 0 },
  { exerciseId: 'leg_press', phase: 'main', sets: 3, reps: 10, weightLb: 270 },
  { exerciseId: 'romanian_deadlift', phase: 'main', sets: 3, reps: 8, weightLb: 135 },
  { exerciseId: 'leg_curl', phase: 'main', sets: 3, reps: 12, weightLb: 80 },
  { exerciseId: 'hip_thrust', phase: 'main', sets: 3, reps: 10, weightLb: 135 },
  { exerciseId: 'couch_stretch', phase: 'cooldown', sets: 2, reps: 30, weightLb: 0 },
];

interface MenuItem { name: string; image: string | null; items: MealItem[]; }
const M = (name: string, portion: string, kcal: number, p: number, c: number, f: number): MealItem => ({ name, portionEstimate: portion, portionQty: 1, caloriesEst: kcal, proteinG: p, carbsG: c, fatG: f });
const MENU: Record<string, MenuItem> = {
  yogurt: { name: 'Greek yogurt & berries', image: 'asset:meal-yogurt-berries', items: [M('Greek yogurt', '~200 g', 260, 24, 10, 13), M('Berries', '~1 cup', 90, 1, 21, 0.5), M('Granola', '~2 tbsp', 70, 5, 8, 2.5)] },
  chickenRice: { name: 'Chicken & rice', image: 'asset:meal-chicken-rice', items: [M('Chicken breast', '~180 g', 300, 52, 0, 8), M('Creamy rice', '~1 cup', 300, 4, 48, 9), M('Pan sauce', '~2 tbsp', 40, 0, 2, 3.5)] },
  chickenSalad: { name: 'Chicken salad bowl', image: 'asset:meal-chicken-salad', items: [M('Grilled chicken', '~120 g', 200, 36, 0, 5), M('Mixed greens', '~2 cups', 60, 3, 8, 1), M('Avocado', '½', 120, 1, 6, 11), M('Dressing', '~1 tbsp', 180, 0, 2, 20)] },
  oats: { name: 'Oatmeal & banana', image: null, items: [M('Oatmeal', '~1 cup cooked', 160, 6, 27, 3), M('Banana', '1 medium', 105, 1, 27, 0.4), M('Peanut butter', '~1 tbsp', 95, 4, 3, 8)] },
  salmon: { name: 'Salmon & sweet potato', image: null, items: [M('Salmon', '~150 g', 310, 34, 0, 18), M('Sweet potato', '1 medium', 110, 2, 26, 0), M('Broccoli', '~1 cup', 55, 4, 10, 0.5)] },
  eggs: { name: 'Eggs & toast', image: null, items: [M('Eggs', '3 scrambled', 240, 18, 2, 17), M('Toast', '2 slices', 160, 6, 30, 2), M('Butter', '~1 tsp', 35, 0, 0, 4)] },
  beef: { name: 'Beef & potatoes', image: null, items: [M('Beef', '~170 g', 380, 42, 0, 22), M('Potato', '~200 g', 180, 4, 40, 0.3)] },
  pasta: { name: 'Chicken pasta', image: null, items: [M('Pasta', '~1.5 cups', 330, 12, 64, 2), M('Chicken', '~120 g', 200, 36, 0, 5), M('Sauce', '~½ cup', 80, 2, 10, 4)] },
  shake: { name: 'Protein shake', image: null, items: [M('Whey protein', '1 scoop', 120, 24, 3, 1.5), M('Milk', '~1 cup', 120, 8, 12, 5)] },
};

export function seedDemo(repo: Repo, installedAt: string): void {
  const today = dayOf(installedAt);
  const rand = rng(20260812);
  const ws = weekStart(today);
  repo.transaction(() => {
    wipe(repo.db);
    repo.setMeta('seeded_at', installedAt); repo.setMeta('mode', 'demo');
    repo.saveProfile({ goal: 'Strength', goalText: 'Build strength, stay lean', daysPerWeek: 4, minutesPerSession: 45, equipment: 'Commercial gym', activities: ['Running', 'Pickleball'],
      recurring: [{ activity: 'run', detail: '3 miles', frequency: 'weekly', preferredDay: 6 }], injuriesText: 'Right knee — no deep squatting or jumping', onboarded: true, installedAt });
    for (const [k, v] of Object.entries({ protein_g: 120, hydration_l: 2.5, steps: 10000, calories: 2200, carbs_g: 240, fat_g: 70, fiber_g: 30 })) repo.setTarget(k as any, v);

    // ---- memory (all three types)
    repo.saveMemory({ id: 'mem_knee', type: 'injury', text: 'Right knee — no deep squatting or jumping', date: addDays(today, -27), tags: ['deep_squat', 'plyometric_jump'], resolved: false, createdAt: installedAt });
    repo.saveMemory({ id: 'mem_run', type: 'preference', text: '3-mile run, Saturdays — keep it', date: addDays(today, -27), tags: [], resolved: false, createdAt: installedAt });
    repo.saveMemory({ id: 'mem_shoulder', type: 'injury', text: 'Right shoulder — overhead pressing painful', date: addDays(today, -6), tags: ['overhead_press'], resolved: false, createdAt: installedAt });
    repo.saveMemory({ id: 'mem_chest', type: 'context', text: 'Chest pain + dizziness during sprints — advised to see a professional', date: addDays(today, -16), tags: [], resolved: false, createdAt: installedAt });
    repo.saveMemory({ id: 'mem_seen', type: 'context', text: 'User reports having been seen — Sprints resumed at their request', date: addDays(today, -13), tags: [], resolved: false, createdAt: installedAt });

    // ---- signals: 35 days, weight trending 156.4 → 154.5 (≈ −0.9 lbs over the last week)
    for (let i = 34; i >= 0; i--) {
      const d = addDays(today, -i); const t = `${d}T07:30:00`;
      const w = 154.5 + (i / 34) * 1.9 + (rand() - 0.5) * 0.6;
      const day = { sleep: r1(6.2 + rand() * 2.2), energy: 2 + Math.floor(rand() * 4), soreness: 1 + Math.floor(rand() * 4), stress: 1 + Math.floor(rand() * 4), steps: 5000 + Math.round(rand() * 15) * 500, hydration: r1(1.5 + rand() * 1.5), weight: r1(w) };
      if (i === 0) Object.assign(day, { sleep: 7.5, energy: 4, soreness: 2, stress: 2, steps: 8500, hydration: 2.0, weight: 154.5 });
      if (i === 1) Object.assign(day, { sleep: 6.5, energy: 3, soreness: 3, stress: 2, steps: 11000, hydration: 2.5, weight: 154.8 });
      const skipSome = i > 2 && rand() < 0.12; // a few days with partial logging
      for (const [type, value] of Object.entries(day)) { if (skipSome && (type === 'hydration' || type === 'stress')) continue; repo.upsertSignal({ date: d, type: type as any, value: value as number, loggedAt: t }); }
    }

    // ---- activities: 3 past weeks + current + next
    let n = 0; const id = (p: string) => `act_${p}_${++n}`;
    const gym = (date: ISODate, name: string, focus: string, ex: ExercisePrescription[], time = '19:00'): Activity => ({ id: id('gym'), date, type: 'gym', name, source: 'nora', minutes: 45, intensity: 'Moderate', startTime: time, focus, exercises: ex, paused: false, createdAt: installedAt });
    const sprint = (date: ISODate): Activity => ({ id: id('spr'), date, type: 'sprint', name: 'Sprints', source: 'nora', minutes: 27, intensity: 'Hard', startTime: '18:30', intervals: 6, detail: '6 × 20 s', paused: false, createdAt: installedAt });
    const run = (date: ISODate, source: Activity['source'] = 'standing_preference'): Activity => ({ id: id('run'), date, type: 'run', name: 'Run 3 mi', source, minutes: 30, intensity: 'Moderate', detail: '3 miles', distanceMi: 3, paused: false, createdAt: installedAt });
    const pickle = (date: ISODate): Activity => ({ id: id('pb'), date, type: 'pickleball', name: 'Pickleball', source: 'trainee_adhoc', minutes: 60, intensity: 'Moderate', paused: false, createdAt: installedAt });
    const done = (a: Activity, extra: Partial<ActivityResult> = {}): ActivityResult => ({ activityId: a.id, outcome: 'done', minutes: a.minutes, loggedAt: `${a.date}T20:30:00`, ...extra });
    const gymDone = (a: Activity, difficulty: number, shortSets: number, note?: string, pain?: string): ActivityResult => {
      const sets: SetLog[] = []; let skipped = shortSets;
      for (const e of a.exercises!) for (let s = 0; s < e.sets; s++) { const skip = e.phase === 'main' && skipped > 0 && s === e.sets - 1 && e.exerciseId === 'seated_cable_row'; if (skip) skipped--; sets.push({ exerciseId: e.exerciseId, setIndex: s, weightLb: e.weightLb, reps: e.reps, done: !skip }); }
      const totalEx = a.exercises!.length; const doneEx = new Set(sets.filter((s) => s.done).map((s) => s.exerciseId)).size;
      return done(a, { doneCount: doneEx, totalCount: totalEx, difficulty, pain: !!pain, painWhere: pain, note, sets });
    };
    const save = (a: Activity, res?: ActivityResult) => { repo.saveActivity(a); if (res) repo.saveResult(res); };

    for (let w = 3; w >= 1; w--) {
      const s = addDays(ws, -7 * w);
      const mon = gym(addDays(s, 1), 'Upper body', 'bench focus', UPPER_A); save(mon, gymDone(mon, 3, w === 1 ? 1 : 0, w === 1 ? 'last bench set felt heavy on the shoulder' : undefined, w === 1 ? 'right shoulder' : undefined));
      const tue = sprint(addDays(s, 2)); save(tue, w === 2 ? { activityId: tue.id, outcome: 'skipped', subtitleNote: '6 × 20 s', loggedAt: `${tue.date}T21:00:00` } : done(tue, { doneCount: 6, totalCount: 6, difficulty: 4 }));
      const wed = gym(addDays(s, 3), 'Upper body', 'pull emphasis', UPPER_B); save(wed, gymDone(wed, 3, 0));
      const thu = gym(addDays(s, 4), 'Lower body', 'legs & hinge', LOWER); save(thu, w === 3 ? { activityId: thu.id, outcome: 'skipped', loggedAt: `${thu.date}T22:00:00` } : gymDone(thu, 4, 0));
      const sat = run(addDays(s, 6)); save(sat, done(sat, { distanceMi: 3 }));
      if (w !== 2) { const sun = pickle(s); save(sun, done(sun)); }
    }
    // current week, placed RELATIVE TO TODAY so every status is visible whatever weekday the demo opens on (R69):
    // today = Upper body (now) · yesterday-ish = adhoc run 2/3 + sprints skipped · day before = Upper body 6/6 · before that = pickleball
    // · tomorrow = Lower body · Saturday = standing run. Days that fall before Sunday are covered by the previous week's history.
    const weekEnd = addDays(ws, 6);
    const pastDays = [addDays(today, -1), addDays(today, -2), addDays(today, -3)];
    const sprintDay = pastDays.find((d) => new Date(d + 'T12:00').getDay() !== 6) ?? pastDays[0];
    const upperDoneDay = pastDays.find((d) => d !== sprintDay)!;
    const pickleDay = pastDays.find((d) => d !== sprintDay && d !== upperDoneDay)!;
    const cur: Activity[] = [gym(today, 'Upper body', 'bench focus', UPPER_A)];
    if (sprintDay >= ws) cur.push(run(sprintDay, 'trainee_adhoc'), sprint(sprintDay));
    if (upperDoneDay >= ws) cur.push(gym(upperDoneDay, 'Upper body', 'bench focus', UPPER_A));
    if (pickleDay >= ws) cur.push(pickle(pickleDay));
    const tomorrow = addDays(today, 1);
    if (tomorrow <= weekEnd) cur.push(gym(tomorrow, 'Lower body', 'legs & hinge', LOWER));
    cur.push(run(weekEnd));
    for (const a of cur) {
      let res: ActivityResult | undefined;
      if (a.date < today) {
        if (a.type === 'pickleball') res = done(a);
        else if (a.type === 'gym') res = gymDone(a, 3, 1, 'last bench set felt heavy on the shoulder', 'right shoulder');
        else if (a.type === 'run') res = done(a, { distanceMi: 2 });
        else if (a.type === 'sprint') res = { activityId: a.id, outcome: 'skipped', subtitleNote: '6 × 20 s', loggedAt: `${a.date}T21:00:00` };
      }
      save(a, res);
    }
    repo.savePlanWeek({ weekStart: ws, status: 'planned', summary: '4 training days · Saturday run kept · nothing that loads a bent knee under depth.', generatedAt: installedAt });
    // next week: pending plan
    const nx = addDays(ws, 7);
    const nextSprint = sprint(addDays(nx, 2));
    for (const a of [gym(addDays(nx, 1), 'Upper body', 'bench focus', UPPER_A), nextSprint, gym(addDays(nx, 4), 'Lower body', 'legs & hinge', LOWER), gym(addDays(nx, 5), 'Upper body', 'pull emphasis', UPPER_B), run(addDays(nx, 6))]) save(a);
    repo.savePlanWeek({ weekStart: nx, status: 'planned', summary: '4 training days · Saturday run kept.', generatedAt: installedAt });

    // ---- meals: 14 days incl. today (2 so far) — names key into the nutrient reference
    const plan: Array<[number, string, string][]> = [];
    const menus = [['08:10', 'yogurt'], ['13:05', 'chickenRice']] as [string, string][];
    plan[0] = menus.map(([t, k]) => [0, t, k]);
    const days: string[][] = [
      ['yogurt', 'chickenSalad', 'chickenRice'], ['oats', 'chickenSalad', 'beef'], ['eggs', 'chickenRice', 'pasta'], ['yogurt', 'shake', 'chickenRice'], ['oats', 'chickenSalad', 'salmon'],
      ['eggs', 'chickenRice', 'pasta'], ['yogurt', 'chickenSalad', 'beef'], ['oats', 'shake', 'chickenRice'], ['eggs', 'chickenSalad', 'pasta'], ['yogurt', 'chickenRice', 'beef'],
      ['oats', 'chickenSalad', 'chickenRice'], ['eggs', 'shake', 'pasta'], ['yogurt', 'chickenSalad', 'chickenRice'],
    ];
    const times = ['08:30', '12:40', '19:20'];
    let mealN = 0;
    const saveMeal = (date: ISODate, time: string, key: string) => { const m = MENU[key]; const meal: Meal = { id: `meal_${++mealN}`, date, time, name: m.name, imageUri: m.image, confidence: m.image ? 'medium' : null, items: m.items.map((i) => ({ ...i })), createdAt: `${date}T${time}:00` }; repo.saveMeal(meal); };
    for (const [, t, k] of plan[0]) saveMeal(today, t, k);
    days.forEach((ks, i) => { const d = addDays(today, -(i + 1)); ks.forEach((k, j) => saveMeal(d, times[j], k)); });

    // ---- supplements + 14 days of adherence
    const supps = [
      { id: 'sup_creatine', name: 'Creatine monohydrate', dose: '5 g · daily, any time', sort: 0, adherence: 0.9, today: true },
      { id: 'sup_vitd', name: 'Vitamin D3', dose: '2,000 IU · with a meal', nutrientKey: 'vitamin_d_ug', sort: 1, adherence: 0.85, today: true },
      { id: 'sup_omega', name: 'Fish oil', dose: '1 g EPA+DHA · with dinner', nutrientKey: 'omega3_g', sort: 2, adherence: 0.3, today: false },
      { id: 'sup_mag', name: 'Magnesium glycinate', dose: '300 mg · before bed', nutrientKey: 'magnesium_mg', sort: 3, adherence: 0.5, today: false },
    ];
    for (const s of supps) {
      repo.saveSupplement({ id: s.id, name: s.name, dose: s.dose, nutrientKey: s.nutrientKey, sort: s.sort });
      for (let i = 1; i <= 13; i++) repo.setTaken(s.id, addDays(today, -i), rand() < s.adherence);
      repo.setTaken(s.id, today, s.today);
    }

    // ---- PRs
    repo.savePR({ id: 'pr_bench', activity: 'Bench press', kind: 'lift', result: '175 lbs × 5', date: addDays(today, -10) });
    repo.savePR({ id: 'pr_5k', activity: '5k run', kind: 'run', result: '24:10', date: addDays(today, -15) });
    repo.savePR({ id: 'pr_100', activity: '100 m sprint', kind: 'sprint', result: '13.4 s', date: addDays(today, -31) });

    // ---- chat: the communicate step — a schedule request with a proposed (unapplied) patch for next week's sprints
    const t0 = `${addDays(today, -1)}T21:10:00`;
    repo.saveChat({ id: 'chat_1', role: 'user', text: 'Can we move sprints off Tuesday next week? My knees are a bit beat up this week.', card: null, createdAt: t0 });
    repo.saveChat({ id: 'chat_2', role: 'nora', text: "Good call — sore knees and max-effort sprints don't mix. Here's what I'd change; nothing moves until you apply it.", createdAt: `${addDays(today, -1)}T21:10:20`,
      card: { kind: 'patch', state: 'proposed', title: 'Proposed plan change', items: ['Move Sprints from Tue to Fri'], ops: [{ op: 'move', activity_id: nextSprint.id, to_date: addDays(nx, 5) }] } });
    repo.saveMemory({ id: 'mem_knees_week', type: 'context', text: 'Knees feeling beat up this week — keep max-effort work off them', date: addDays(today, -1), tags: [], resolved: false, createdAt: t0 });
  });
  void getExercise;
}

/** R68: reset to a fresh install — onboarding runs next launch. */
export function resetFresh(repo: Repo, installedAt: string): void {
  repo.transaction(() => { wipe(repo.db); repo.setMeta('mode', 'fresh'); repo.setMeta('installed_at', installedAt); });
}
