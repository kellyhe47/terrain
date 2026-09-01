// Fixture-backed fake text model (PRD: nothing external exists yet). Deterministic outputs for all five assembler surfaces,
// produced ONLY from the request payload — it never touches the store. Also drives the demo when no key is configured.
import type { TextModel, TextRequest, TextResponse } from './textModel';
import { ModelUnavailableError } from './textModel';
import type { PlanPayload, ChatPayload, ExplanationPayload, GapsPayload, InjuryPayload, LibraryRow } from '../domain/contextPayloads';
import { addDays, DOW_LONG, dow } from '../domain/dates';

export type FakeMode = 'ok' | 'error' | 'offline';
export interface FakeOptions { streamDelayMs?: number; /** Simulated latency for non-streamed structured calls (plan, gaps), so locked/loading states are observable in the demo. */ latencyMs?: number; }

export class FakeTextModel implements TextModel {
  readonly name = 'fake';
  mode: FakeMode = 'ok';
  /** Test hook: when set, the next plan response is this object (e.g. a rail violator). */
  nextPlanOverride: unknown | null = null;
  constructor(private opts: FakeOptions = {}) {}

  async complete(req: TextRequest, onToken?: (chunk: string) => void): Promise<TextResponse> {
    if (this.mode !== 'ok') throw new ModelUnavailableError(this.mode);
    if (this.opts.latencyMs && (req.surface === 'plan' || req.surface === 'nutrition_gaps')) await new Promise((r) => setTimeout(r, this.opts.latencyMs));
    const p = req.payload ?? {};
    let json: unknown; let text = '';
    switch (req.surface) {
      case 'plan': json = this.nextPlanOverride ?? fakePlan(p as unknown as PlanPayload); this.nextPlanOverride = null; text = JSON.stringify(json); break;
      case 'chat': json = fakeChat(p as unknown as ChatPayload); text = JSON.stringify(json); break;
      case 'explanation': text = fakeExplanation(p as unknown as ExplanationPayload); break;
      case 'nutrition_gaps': json = fakeGaps(p as unknown as GapsPayload); text = JSON.stringify(json); break;
      case 'injury_tags': json = { tags: injuryTags(p as unknown as InjuryPayload) }; text = JSON.stringify(json); break;
    }
    if (onToken) {
      const delay = this.opts.streamDelayMs ?? 0;
      for (let i = 0; i < text.length; i += 5) { onToken(text.slice(i, i + 5)); if (delay) await new Promise((r) => setTimeout(r, delay)); }
    }
    return { text, json };
  }
}

// ---------- injury → tags (R61). Explicit phrases win; otherwise body-part defaults.
export function injuryTags(p: InjuryPayload): string[] {
  const t = p.text.toLowerCase(); const out = new Set<string>(); const vocab = new Set(p.vocabulary);
  const add = (...tags: string[]) => tags.forEach((x) => vocab.has(x) && out.add(x));
  if (/deep squat|squatting|squat/.test(t)) add('deep_squat');
  if (/jump|plyo|hop|bound/.test(t)) add('plyometric_jump');
  if (/overhead|pressing overhead|press(ing)? (up|over)/.test(t)) add('overhead_press');
  if (/bench/.test(t)) add('bench_press');
  if (/pull-?up|chin-?up/.test(t)) add('pull_up');
  if (/deadlift|hinge/.test(t)) add('heavy_hinge');
  if (/run(ning)?|jog/.test(t) && /no|avoid|can't|cannot|hurts|pain/.test(t)) add('running', 'high_impact');
  if (out.size) return [...out];
  if (/knee/.test(t)) add('deep_squat', 'plyometric_jump', 'loaded_knee_flexion');
  if (/shoulder|rotator/.test(t)) add('overhead_press');
  if (/lower back|back|spine|disc/.test(t)) add('heavy_hinge', 'spinal_compression');
  if (/ankle|achilles|shin/.test(t)) add('plyometric_jump', 'high_impact', 'running');
  if (/wrist|hand/.test(t)) add('wrist_load');
  if (/neck/.test(t)) add('neck_load', 'overhead_press');
  if (/elbow/.test(t)) add('pull_up', 'bench_press');
  if (/hip/.test(t)) add('deep_squat', 'heavy_hinge');
  return [...out];
}

// ---------- plan (deterministic template planner)
const TIER: Record<string, string> = { 'Commercial gym': 'gym', 'Home setup': 'home', 'No equipment': 'none' };
const DAY_ORDER = [1, 2, 4, 5, 3, 6, 0];
interface Template { name: string; focus: string; patterns: string[]; cooldown: string[]; warm: string[]; }
function templates(goal: string, sprintDay: boolean): Template[] {
  const upperA: Template = { name: 'Upper body', focus: 'bench focus', patterns: ['push', 'push', 'pull', 'pull', 'push', 'pull', 'core', 'push'], warm: ['empty_bar_bench', 'band_pull_apart', 'arm_circles'], cooldown: ['doorway_stretch', 'lat_stretch'] };
  const upperB: Template = { name: 'Upper body', focus: 'pull emphasis', patterns: ['pull', 'pull', 'push', 'pull', 'push', 'core', 'pull', 'push'], warm: ['band_pull_apart', 'arm_circles', 'empty_bar_bench'], cooldown: ['lat_stretch', 'doorway_stretch'] };
  const lower: Template = { name: 'Lower body', focus: 'legs & hinge', patterns: ['legs', 'hinge', 'legs', 'legs', 'hinge', 'core', 'legs', 'core'], warm: ['glute_bridge_warm', 'leg_swings', 'bodyweight_squat', 'empty_bar_deadlift'], cooldown: ['couch_stretch', 'hamstring_stretch'] };
  const full: Template = { name: 'Full body', focus: 'compound focus', patterns: ['legs', 'push', 'pull', 'hinge', 'core', 'push', 'legs', 'pull'], warm: ['leg_swings', 'arm_circles', 'glute_bridge_warm'], cooldown: ['child_pose', 'hamstring_stretch'] };
  const cond: Template = { name: 'Conditioning', focus: 'engine work', patterns: ['cardio', 'legs', 'core', 'cardio', 'hinge', 'pull', 'core', 'cardio'], warm: ['leg_swings', 'glute_bridge_warm', 'arm_circles'], cooldown: ['walk_cooldown', 'hamstring_stretch'] };
  const sprint: Template = { name: 'Sprints', focus: 'sprint', patterns: [], warm: [], cooldown: [] };
  switch (goal) {
    case 'Endurance': return [cond, full, sprintDay ? sprint : cond, lower, upperA, cond];
    case 'Lean out': return [full, cond, sprintDay ? sprint : full, upperA, lower, cond];
    case 'General fitness': return [full, cond, sprintDay ? sprint : upperA, lower, full, cond];
    default: return [upperA, lower, sprintDay ? sprint : full, upperB, lower, full]; // Strength
  }
}
export function fakePlan(p: PlanPayload): unknown {
  const intake = p.intake!; const tier = TIER[intake.equipment] ?? 'gym';
  const bad = new Set(p.contraindicated_tags);
  const eligible = p.library.filter((e) => e.equipment.includes(tier) && !e.tags.some((t) => bad.has(t)));
  const recurringDays = new Set(intake.recurring.map((r) => r.preferred_day));
  const days = DAY_ORDER.filter((d) => !recurringDays.has(d)).slice(0, intake.days_per_week);
  const sprintDay = intake.days_per_week >= 3 && intake.activities.some((a) => /sprint|running/i.test(a)) && intake.goal !== 'Endurance';
  const tpls = templates(intake.goal, sprintDay);
  const mainCount = Math.max(2, Math.min(8, Math.round((intake.minutes_per_session - 15) / 7.5)));
  const used = new Set<string>();
  const pick = (pattern: string, phase: string): LibraryRow | undefined => {
    const c = eligible.find((e) => e.pattern === pattern && e.phases.includes(phase) && !used.has(e.id)) ?? eligible.find((e) => e.phases.includes(phase) && !used.has(e.id));
    if (c) used.add(c.id); return c;
  };
  const scale = intake.goal === 'Strength' ? 1 : 0.85;
  const sessions = days.map((d, i) => {
    const t = tpls[i % tpls.length]; const date = addDays(p.week_start, d);
    if (t.focus === 'sprint') return { date, type: 'sprint', name: 'Sprints', focus: 'track', minutes: 27, start_time: '18:30', exercises: [], intervals: 6 };
    used.clear();
    const exs: unknown[] = [];
    const nWarm = intake.minutes_per_session >= 60 ? 2 : 1;
    for (const id of t.warm) { if (exs.length >= nWarm) break; const e = eligible.find((x) => x.id === id); if (e) { used.add(id); exs.push({ exercise_id: id, phase: 'warmup', sets: e.sets, reps: e.reps, weight_lb: e.start_weight_lb }); } }
    while (exs.length < nWarm) { const e = pick('mobility', 'warmup'); if (!e) break; exs.push({ exercise_id: e.id, phase: 'warmup', sets: e.sets, reps: e.reps, weight_lb: e.start_weight_lb }); }
    for (let k = 0; k < mainCount; k++) { const e = pick(t.patterns[k % t.patterns.length], 'main'); if (!e) break; exs.push({ exercise_id: e.id, phase: 'main', sets: e.sets, reps: e.reps, weight_lb: Math.round((e.start_weight_lb * scale) / 5) * 5 }); }
    const cd = t.cooldown.map((id) => eligible.find((x) => x.id === id)).find(Boolean) ?? pick('mobility', 'cooldown');
    if (cd) exs.push({ exercise_id: cd.id, phase: 'cooldown', sets: cd.sets, reps: cd.reps, weight_lb: 0 });
    return { date, type: 'gym', name: t.name, focus: t.focus, minutes: intake.minutes_per_session, start_time: '19:00', exercises: exs, intervals: null };
  });
  const standing = intake.recurring.map((r) => {
    const miles = /(\d+(\.\d+)?)\s*(mi|mile)/i.exec(r.detail); const type = /run/i.test(r.activity) ? 'run' : /pilates/i.test(r.activity) ? 'pilates' : /yoga/i.test(r.activity) ? 'yoga' : /pickle/i.test(r.activity) ? 'pickleball' : /padel/i.test(r.activity) ? 'padel' : /sprint/i.test(r.activity) ? 'sprint_club' : 'other';
    return { date: addDays(p.week_start, r.preferred_day), type, name: type === 'run' && miles ? `Run ${miles[1]} mi` : cap(r.activity), detail: r.detail, minutes: type === 'run' && miles ? Math.round(Number(miles[1]) * 10) : 45, intensity: 'Moderate', distance_mi: miles ? Number(miles[1]) : null };
  });
  const injuryPhrase = bad.size ? ` · nothing that ${[...bad].includes('deep_squat') || [...bad].includes('plyometric_jump') ? 'loads a bent knee under depth' : [...bad].includes('overhead_press') ? 'presses overhead' : 'loads the injury'}` : '';
  const kept = intake.recurring.length ? ` · ${intake.recurring.map((r) => `${DOW_LONG[r.preferred_day]} ${r.activity.toLowerCase()} kept`).join(', ')}` : '';
  return { week_start: p.week_start, summary: `${days.length} training days${kept}${injuryPhrase}.`, rest_reason: 'Two hard sessions back-to-back this week. Today is for absorbing them — easy walking and sleep are the workout.', sessions, standing };
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- chat
const SYMPTOM = /chest (pain|tight|pressure)|dizz|faint|passed out|black(ed)? out|numb|can'?t breathe|short(ness)? of breath|heart (racing|pounding)|palpitat|vision (went|blur)|collaps/i;
export function fakeChat(p: ChatPayload): unknown {
  const m = p.message; const low = m.toLowerCase();
  const safeOff = { flagged: false, referral: false, no_diagnosis: true, no_clearance: true, action: null };
  if (SYMPTOM.test(m)) {
    const nx = p.next_intense_session;
    const what = /chest/i.test(m) ? 'Chest pain' : /dizz|faint/i.test(m) ? 'Dizziness' : 'Concerning symptoms';
    const extra = /dizz/i.test(m) && /chest/i.test(m) ? ' + dizziness' : '';
    const during = /sprint/i.test(m) ? ' during sprints' : /run/i.test(m) ? ' during a run' : /session|lift|gym/i.test(m) ? ' during a session' : '';
    return {
      reply: `That's worth taking seriously — please get it checked by a qualified medical professional before your next hard session. I can't tell you what it is, and I won't guess. I've noted it so we both remember.`,
      memory_writes: [{ type: 'context', text: `${what}${extra}${during} — advised to see a professional`, tags: [] }],
      plan_patch: null,
      safety: { flagged: true, referral: true, no_diagnosis: true, no_clearance: true, action: nx ? { activity_id: nx.id, label: `Pause ${nx.weekday}'s ${nx.type === 'sprint' ? 'sprint' : nx.name.toLowerCase()} session until you've been seen?` } : null },
    };
  }
  if (/been seen|got checked|doctor (said|cleared)|cleared me|resume/i.test(m)) {
    return { reply: `Glad you got it looked at. I've logged that you've been seen — use "I've been seen — resume this" on the paused session to reinstate it. I'll keep the note either way.`, memory_writes: [{ type: 'context', text: 'Reports having been seen by a professional', tags: [] }], plan_patch: null, safety: safeOff };
  }
  // schedule change → patch
  const dayMatch = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i.exec(low);
  const wantsMove = /move|swap|reschedule|shift|off (mon|tue|wed|thu|fri|sat|sun)|instead of|can we do|change/i.test(low);
  if (wantsMove && p.week_plan.length) {
    const target = p.week_plan.find((w) => low.includes(w.name.toLowerCase().split(' ')[0]) && w.status !== 'completed' && w.status !== 'skipped')
      ?? p.week_plan.find((w) => w.type === 'sprint' && w.status !== 'completed') ?? p.week_plan.find((w) => w.status === 'pending' || w.status === 'now');
    if (target) {
      const occupied = new Set(p.week_plan.filter((w) => w.id !== target.id).map((w) => w.date));
      const fromDow = dow(target.date);
      const candidates = [1, 2, 3, 4, 5, 6, 0].map((d) => addDays(p.today.slice(0, 10) && weekStartOf(target.date), d)).filter((d) => d !== target.date && d >= p.today && !occupied.has(d) && dow(d) !== fromDow);
      const toDate = candidates.find((d) => d > target.date) ?? candidates[0];
      if (toDate) {
        const items = [`Move ${target.name} from ${DOW_LONG[fromDow].slice(0, 3)} to ${DOW_LONG[dow(toDate)].slice(0, 3)}`];
        const ops: unknown[] = [{ op: 'move', activity_id: target.id, to_date: toDate }];
        const knees = /knee/.test(low);
        const legDay = p.week_plan.find((w) => w.type === 'gym' && w.exercise_ids.includes('back_squat') && w.status !== 'completed');
        if (knees && legDay) { items.push(`Swap Back squat → Leg press on ${DOW_LONG[dow(legDay.date)].slice(0, 3)}`); ops.push({ op: 'swap_exercise', activity_id: legDay.id, from_exercise_id: 'back_squat', to_exercise_id: 'leg_press' }); }
        const memory_writes = knees ? [{ type: 'context', text: 'Knees feeling beat up this week — keep max-effort work off them', tags: [] }] : [];
        return { reply: `Good call — ${knees ? 'sore knees and max-effort sprints don\'t mix' : 'that fits the week fine'}. Here's what I'd change; nothing moves until you apply it.`, memory_writes, plan_patch: { summary: items.join('; '), items, ops }, safety: safeOff };
      }
    }
  }
  // injury report → injury memory (tags are structured by the assembler's injury_tags surface)
  const part = /(shoulder|knee|lower back|back|ankle|wrist|elbow|hip|neck|hamstring|calf|achilles)/i.exec(low);
  if (part && /pain|hurt|sore|tweak|pinch|ache|strain/.test(low)) {
    const side = /right/.test(low) ? 'right ' : /left/.test(low) ? 'left ' : '';
    const during = /overhead/.test(low) ? 'overhead pressing painful' : /bench/.test(low) ? 'bench pressing painful' : /squat/.test(low) ? 'squatting painful' : /run/.test(low) ? 'running painful' : 'painful under load';
    return { reply: `Noted — ${side}${part[1]}, ${during}. I've written it into your memory as a hard rule, so the next plan won't prescribe anything that loads it. Tell me when it's settled and I'll resolve it. If it sharpens or lingers, get it looked at.`, memory_writes: [{ type: 'injury', text: `${cap(side + part[1])}, ${during}`, tags: [] }], plan_patch: null, safety: safeOff };
  }
  if (/keep|love|prefer|always|every (saturday|sunday|monday|tuesday|wednesday|thursday|friday)/.test(low) && dayMatch) {
    return { reply: `Got it — I'll plan around ${m.replace(/[.!?]+$/, '')}. It's saved as a preference, so future weeks respect it without you asking again.`, memory_writes: [{ type: 'preference', text: m.replace(/^(i |i'd |please )+/i, '').replace(/[.!?]+$/, '') + ' — keep it', tags: [] }], plan_patch: null, safety: safeOff };
  }
  const r = p.readiness; const last = p.recent_sessions[0];
  const readinessLine = r?.score != null ? `Readiness is ${r.score} today (${r.band})` : 'No readiness score yet today — log a couple of signals';
  const lastLine = last ? ` Last session was ${last.name} on ${last.date} (${last.status}${last.difficulty ? `, difficulty ${last.difficulty}/5` : ''}).` : '';
  return { reply: `${readinessLine}.${lastLine} ${/how|what|why|should/.test(low) ? 'Short answer: follow the plan as written, and tell me anything that changes — pain, schedule, sleep.' : 'Noted. Keep logging honestly and I\'ll adapt the week from it.'}`, memory_writes: [], plan_patch: null, safety: safeOff };
}
function weekStartOf(date: string): string { return addDays(date, -dow(date)); }

// ---------- readiness explanation
export function fakeExplanation(p: ExplanationPayload): string {
  const r = p.readiness; if (!r || r.score == null) return 'Log a couple of signals and I\'ll score your readiness.';
  const comps = r.components;
  const pref = ['sleep', 'soreness', 'energy', 'stress', 'steps', 'hydration', 'protein', 'weight'];
  const strong = comps.filter((c) => c.score >= 75 && c.key !== 'load').sort((a, b) => pref.indexOf(a.key) - pref.indexOf(b.key));
  const weak = comps.filter((c) => c.score < 70 && c.key !== 'load').sort((a, b) => a.score - b.score);
  const phrase: Record<string, (c: { detail: string; score: number }) => string> = {
    sleep: (c) => c.score >= 75 ? `${c.detail.replace('sleep ', '')} of sleep` : `only ${c.detail.replace('sleep ', '')} of sleep`,
    soreness: (c) => c.score >= 75 ? 'soreness nearly gone' : 'soreness still high',
    energy: (c) => c.score >= 75 ? 'energy up' : 'low energy',
    stress: (c) => c.score >= 75 ? 'stress low' : 'stress running high',
    steps: (c) => c.score >= 75 ? 'steps on pace' : 'steps behind',
    hydration: (c) => c.score >= 75 ? 'water on track' : 'water running behind',
    protein: (c) => c.score >= 75 ? 'protein on track' : 'protein behind',
    weight: () => 'weight steady',
  };
  const say = (c: { key: string; detail: string; score: number }) => (phrase[c.key] ?? (() => c.detail))(c);
  const top = strong.slice(0, 2).map(say); const low = weak.slice(0, 2).map(say);
  let s = '';
  if (top.length >= 2) s += `${cap(top[0])} and ${top[1]} — `; else if (top.length === 1) s += `${cap(top[0])} — `;
  s += r.score >= 70 ? 'expect steady energy today.' : r.score >= 40 ? 'keep today easy.' : 'today is for recovery.';
  if (low.length) s += ` ${cap(low.join(' and '))}, so ${low.some((x) => /protein|water/.test(x)) ? 'front-load ' + (low.length > 1 ? 'both' : 'it') : 'fix that first'}`;
  if (p.rest_day) s += `${low.length ? ' — ' : ' '}Rest day — bank it.`;
  else if (p.plan_today) s += `${low.length ? ' before ' : ' '}${low.length ? 'tonight\'s' : 'Tonight:'} ${p.plan_today.name.toLowerCase()} session${low.length ? '' : ' as planned'}.`;
  else if (low.length) s += '.';
  return s.replace(/\s+/g, ' ').trim();
}

// ---------- nutrition gaps
export function fakeGaps(p: GapsPayload): unknown {
  const notes: Record<string, string> = {
    fiber_g: 'Consistently under target — most days have no vegetables before dinner. Add greens or oats to your first two meals.',
    omega3_g: 'Almost no fatty fish logged in two weeks. Two servings of salmon or sardines a week would cover it.',
    iron_mg: 'Red meat and legumes are rare in your log. Worth watching given your training volume — pair plant iron with vitamin C.',
    vitamin_d_ug: 'Little from food, as expected — sun or a supplement does the work here.',
    magnesium_mg: 'Nuts, seeds and leafy greens are thin in the log. A handful of almonds a day closes most of it.',
    calcium_mg: 'Dairy or fortified alternatives are light. Yogurt at breakfast covers a third of the day.',
    potassium_mg: 'Fruit and potatoes are rare in the log. A banana and a sweet potato a day would close it.',
    sodium_mg: 'Running over the ceiling — sauces and bread are the usual culprits. Cook plainer on rest days.',
    protein_g: 'Under target on most logged days. A protein-led breakfast is the easiest fix.',
    calories: 'Averaging well under target for your training load. Add a real lunch on training days.',
  };
  const items = p.gaps.ranked.slice(0, 3).map((g) => ({ key: g.key, name: g.label, stat: g.key === 'omega3_g' ? `${(g.avg_per_day / 1.1).toFixed(1).replace(/\.0$/, '')} serving / wk` : `avg ${fmt(g.avg_per_day, g.unit)} / ${fmt(g.target, g.unit)}`, note: notes[g.key] ?? 'Below target in the last two weeks.' }));
  const covered = p.gaps.supplements.filter((s) => s.adherence >= 0.7 && s.nutrient_key).map((s) => s.name);
  const summary = items.length
    ? `Protein and calories are ${p.gaps.on_track.includes('protein_g') && p.gaps.on_track.includes('calories') ? 'broadly on track on training days' : 'part of the picture'} — the gaps above are the highest-leverage fixes.${covered.length ? ` ${covered.join(' and ')} ${covered.length > 1 ? 'are covering their nutrients' : 'is covering its nutrient'}.` : ''}`
    : 'Nothing stands out in the last 14 days — keep logging meals and I\'ll flag drift early.';
  return { items, summary };
}
const fmt = (v: number, unit: string) => `${unit === 'g' && v < 10 ? +v.toFixed(1) : Math.round(v).toLocaleString('en-US')} ${unit}`;
