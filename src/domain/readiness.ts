// Readiness engine (PRD R1–R6, fixtures 01/02/03). Deterministic, synchronous, `asOf`-parameterised by the loader.
// Targets are inputs (R11b) — nothing here is a product constant.

export interface ReadinessSignals {
  sleepHours?: number; energy?: number; soreness?: number; stress?: number;
  steps?: number; hydrationL?: number; proteinG?: number; weightLb?: number; weight7dAvgLb?: number;
}
export interface ReadinessTargets { stepsTarget: number; hydrationTargetL: number; proteinTargetG: number; }
export interface YesterdaySession { completed: boolean; difficulty?: number; }
export interface ReadinessInputs { signals: ReadinessSignals; targets: ReadinessTargets; yesterdaySessions: YesterdaySession[]; }

export type LoggableKey = 'sleep' | 'energy' | 'soreness' | 'stress' | 'steps' | 'hydration' | 'protein' | 'weight';
export type ComponentKey = LoggableKey | 'load';
export type Band = 'green' | 'yellow' | 'red';

export interface Component { key: ComponentKey; label: string; score: number; weight: number; effectiveWeight: number; contribution: number; detail: string; }
export type ReadinessResult =
  | { kind: 'score'; score: number; band: Band; components: Component[]; loggedCount: number }
  | { kind: 'insufficient'; loggedCount: number };

export const WEIGHTS: Record<ComponentKey, number> = {
  sleep: 0.25, energy: 0.15, soreness: 0.15, stress: 0.10, load: 0.10, steps: 0.10, hydration: 0.05, protein: 0.05, weight: 0.05,
};
export const LOGGABLE: LoggableKey[] = ['sleep', 'energy', 'soreness', 'stress', 'steps', 'hydration', 'protein', 'weight'];

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));
const scale5 = (v: number) => clamp100(((v - 1) / 4) * 100);
const scale5inv = (v: number) => clamp100(((5 - v) / 4) * 100);

export function bandFor(score: number): Band { return score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'; }

/** Training load: 100 with no sessions yesterday; −5 per completed session, −10 if rated 4 or 5 (R2). */
export function trainingLoadScore(sessions: YesterdaySession[]): number {
  let s = 100;
  for (const y of sessions) if (y.completed) s -= (y.difficulty ?? 0) >= 4 ? 10 : 5;
  return Math.max(0, s);
}

/** Weight stability: within 2% of the 7-day average scores 100, falling linearly to 0 at 10% (R2). */
export function weightStabilityScore(weightLb: number, avgLb: number): number {
  const dev = Math.abs(weightLb - avgLb) / avgLb;
  if (dev <= 0.02) return 100;
  if (dev >= 0.10) return 0;
  return clamp100(100 * (1 - (dev - 0.02) / 0.08));
}

function present(inp: ReadinessInputs): Array<{ key: LoggableKey; score: number; label: string; detail: string }> {
  const s = inp.signals, t = inp.targets, out: Array<{ key: LoggableKey; score: number; label: string; detail: string }> = [];
  if (s.sleepHours != null) out.push({ key: 'sleep', score: clamp100((s.sleepHours / 8) * 100), label: 'sleep', detail: `sleep ${fmt1(s.sleepHours)} h` });
  if (s.energy != null) out.push({ key: 'energy', score: scale5(s.energy), label: 'energy', detail: `energy ${s.energy}/5` });
  if (s.soreness != null) out.push({ key: 'soreness', score: scale5inv(s.soreness), label: 'soreness', detail: s.soreness <= 2 ? 'low soreness' : `soreness ${s.soreness}/5` });
  if (s.stress != null) out.push({ key: 'stress', score: scale5inv(s.stress), label: 'stress', detail: s.stress <= 2 ? 'low stress' : `stress ${s.stress}/5` });
  if (s.steps != null) out.push({ key: 'steps', score: clamp100((s.steps / t.stepsTarget) * 100), label: 'steps', detail: `${Math.round(s.steps).toLocaleString('en-US')} steps` });
  if (s.hydrationL != null) out.push({ key: 'hydration', score: clamp100((s.hydrationL / t.hydrationTargetL) * 100), label: 'hydration', detail: `${fmt1(s.hydrationL)} L water` });
  if (s.proteinG != null) out.push({ key: 'protein', score: clamp100((s.proteinG / t.proteinTargetG) * 100), label: 'protein', detail: `${Math.round(s.proteinG)} g protein` });
  if (s.weightLb != null && s.weight7dAvgLb != null) out.push({ key: 'weight', score: weightStabilityScore(s.weightLb, s.weight7dAvgLb), label: 'weight', detail: 'weight steady' });
  return out;
}
const fmt1 = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Score rule. Fewer than 2 loggable signals ⇒ insufficient (R5). Otherwise the 8 loggable weights (sum .90) are
 * renormalised among the signals present; training load keeps its fixed .10 — it is never absent and never
 * reweighted away (R2, fixture 02 prose). With all 8 present this is exactly fixture 01's arithmetic.
 */
export function computeReadiness(inp: ReadinessInputs): ReadinessResult {
  const p = present(inp);
  if (p.length < 2) return { kind: 'insufficient', loggedCount: p.length };
  const loggableTotal = LOGGABLE.reduce((a, k) => a + WEIGHTS[k], 0); // .90
  const presentTotal = p.reduce((a, c) => a + WEIGHTS[c.key], 0);
  const scale = loggableTotal / presentTotal;
  const comps: Component[] = p.map((c) => {
    const eff = WEIGHTS[c.key] * scale;
    return { key: c.key, label: c.label, score: c.score, weight: WEIGHTS[c.key], effectiveWeight: eff, contribution: eff * c.score, detail: c.detail };
  });
  const load = trainingLoadScore(inp.yesterdaySessions);
  comps.push({ key: 'load', label: 'training load', score: load, weight: WEIGHTS.load, effectiveWeight: WEIGHTS.load, contribution: WEIGHTS.load * load,
    detail: load >= 100 ? 'full recovery' : 'yesterday’s training' });
  const raw = comps.reduce((a, c) => a + c.contribution, 0);
  const score = Math.round(raw);
  return { kind: 'score', score, band: bandFor(score), components: comps, loggedCount: p.length };
}

/** Deterministic fallback line (R6): the two highest contributors by weighted contribution. */
export function fallbackExplanation(r: Extract<ReadinessResult, { kind: 'score' }>): string {
  const order: ComponentKey[] = ['sleep', 'soreness', 'energy', 'stress', 'steps', 'load', 'hydration', 'protein', 'weight'];
  const top = [...r.components].sort((a, b) => (b.contribution - a.contribution) || (order.indexOf(a.key) - order.indexOf(b.key))).slice(0, 2);
  return `Readiness ${r.score} · ${r.band} — top factors: ${top.map((c) => c.detail).join(', ')}.`;
}
