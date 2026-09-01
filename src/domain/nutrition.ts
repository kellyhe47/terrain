// Nutrition aggregator (PRD R13, R70–R74). Deterministic. Totals are computed from items; the provider's totals are never read.
import { addDays, type ISODate } from './dates';
import type { Meal, MealItem, Targets } from './types';
import { MICRO_INFO, MICRO_KEYS, type MicroKey, type NutrientReference } from '../seed/nutrientReference';
import type { Repo } from '../db/repo';

export interface Macros { kcal: number; proteinG: number; carbsG: number; fatG: number; }
export function mealTotals(items: MealItem[]): Macros {
  return items.reduce((a, i) => ({ kcal: a.kcal + i.caloriesEst, proteinG: a.proteinG + i.proteinG, carbsG: a.carbsG + i.carbsG, fatG: a.fatG + i.fatG }), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}
export function dayMacros(meals: Meal[]): Macros { return mealTotals(meals.flatMap((m) => m.items)); }

export interface MicroEstimate { key: MicroKey; value: number; matchedShare: number; }
/** Micronutrients from the reference table (R70a/R71): composition per 100 kcal × item calories. matchedShare < .6 ⇒ weak estimate. */
export function microEstimates(meals: Meal[], ref: NutrientReference): MicroEstimate[] {
  const sums: Record<MicroKey, number> = Object.fromEntries(MICRO_KEYS.map((k) => [k, 0])) as Record<MicroKey, number>;
  let kcalAll = 0, kcalMatched = 0;
  for (const m of meals) for (const it of m.items) {
    const { composition, matched } = ref.lookup(it.name);
    kcalAll += it.caloriesEst; if (matched) kcalMatched += it.caloriesEst;
    for (const k of MICRO_KEYS) sums[k] += (composition[k] * it.caloriesEst) / 100;
  }
  const share = kcalAll > 0 ? kcalMatched / kcalAll : 0;
  return MICRO_KEYS.map((k) => ({ key: k, value: sums[k], matchedShare: share }));
}

export interface MicroTarget { key: MicroKey; target: number; fromUser: boolean; ceiling: boolean; }
/** R11b: a user target when set, otherwise the reference value labelled as such. Fiber has a user target key. */
export function microTargets(targets: Targets, hasUserTarget: (k: 'fiber_g') => boolean): MicroTarget[] {
  return MICRO_INFO.map((mi) => mi.key === 'fiber_g' ? { key: mi.key, target: targets.fiber_g, fromUser: hasUserTarget('fiber_g'), ceiling: false } : { key: mi.key, target: mi.reference, fromUser: false, ceiling: mi.ceiling });
}

export interface WeekStats { avgProteinG: number; avgKcal: number; proteinDaysHit: number; loggedDays: number; perDay: Array<{ date: ISODate; proteinG: number; kcal: number; logged: boolean; hit: boolean }>; }
/** R73: same denominator on Nutrition and the calendar — days in the week (up to today) with at least one meal logged. */
export function weekStats(repo: Repo, weekStart: ISODate, today: ISODate, targets: Targets): WeekStats {
  const perDay: WeekStats['perDay'] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(weekStart, i);
    const meals = d <= today ? repo.mealsOn(d) : [];
    const m = dayMacros(meals);
    perDay.push({ date: d, proteinG: m.proteinG, kcal: m.kcal, logged: meals.length > 0, hit: meals.length > 0 && m.proteinG >= targets.protein_g });
  }
  const logged = perDay.filter((p) => p.logged);
  const n = logged.length || 1;
  return {
    avgProteinG: logged.reduce((a, p) => a + p.proteinG, 0) / n, avgKcal: logged.reduce((a, p) => a + p.kcal, 0) / n,
    proteinDaysHit: logged.filter((p) => p.hit).length, loggedDays: logged.length, perDay,
  };
}

export interface GapAggregate { key: MicroKey | 'protein_g' | 'calories'; label: string; unit: string; avgPerDay: number; target: number; ratio: number; ceiling: boolean; coveredBySupplement: boolean; }
export interface Gaps14 { days: number; loggedDays: number; ranked: GapAggregate[]; onTrack: GapAggregate[]; supplementCoverage: Array<{ name: string; nutrientKey?: string; adherence: number }>; }
/** R72/R72b: deterministic 14-day shortfall ranking. Supplements dosed on ≥ 70% of days cover their nutrient. */
export function gaps14(repo: Repo, today: ISODate, targets: Targets, ref: NutrientReference, hasUserTarget: (k: 'fiber_g') => boolean): Gaps14 {
  const from = addDays(today, -13);
  const meals = repo.mealsBetween(from, today);
  const loggedDays = new Set(meals.map((m) => m.date)).size;
  const n = loggedDays || 1;
  const micros = microEstimates(meals, ref);
  const mt = microTargets(targets, hasUserTarget);
  const supps = repo.listSupplements();
  const takes = repo.takesBetween(from, today);
  const coverage = supps.map((s) => ({ name: s.name, nutrientKey: s.nutrientKey, adherence: takes.filter((t) => t.supplementId === s.id).length / 14 }));
  const covered = new Set(coverage.filter((c) => c.nutrientKey && c.adherence >= 0.7).map((c) => c.nutrientKey!));
  const rows: GapAggregate[] = micros.map((m) => {
    const t = mt.find((x) => x.key === m.key)!; const info = MICRO_INFO.find((x) => x.key === m.key)!;
    const avg = m.value / n;
    return { key: m.key, label: info.label, unit: info.unit, avgPerDay: avg, target: t.target, ratio: t.target > 0 ? avg / t.target : 1, ceiling: t.ceiling, coveredBySupplement: covered.has(m.key) };
  });
  const macros = dayMacros(meals);
  rows.push({ key: 'protein_g', label: 'Protein', unit: 'g', avgPerDay: macros.proteinG / n, target: targets.protein_g, ratio: (macros.proteinG / n) / targets.protein_g, ceiling: false, coveredBySupplement: false });
  rows.push({ key: 'calories', label: 'Calories', unit: 'kcal', avgPerDay: macros.kcal / n, target: targets.calories, ratio: (macros.kcal / n) / targets.calories, ceiling: false, coveredBySupplement: false });
  const shortfalls = rows.filter((r) => !r.coveredBySupplement && (r.ceiling ? r.ratio > 1 : r.ratio < 0.8)).sort((a, b) => (a.ceiling ? 2 - a.ratio : a.ratio) - (b.ceiling ? 2 - b.ratio : b.ratio));
  const onTrack = rows.filter((r) => r.coveredBySupplement || (r.ceiling ? r.ratio <= 1 : r.ratio >= 0.8));
  return { days: 14, loggedDays, ranked: shortfalls, onTrack, supplementCoverage: coverage };
}
/** R72a fallback: deterministic ranked-shortfall line. */
export function gapsFallbackLine(g: Gaps14): string {
  if (!g.ranked.length) return 'No clear gaps in the last 14 days — keep logging.';
  return 'Biggest gaps, last 14 days: ' + g.ranked.slice(0, 3).map((r) => `${r.label} ${fmtAmt(r.avgPerDay, r.unit)} / ${fmtAmt(r.target, r.unit)}`).join(' · ') + '.';
}
export function fmtAmt(v: number, unit: string): string { const n = unit === 'g' && v < 10 ? +v.toFixed(1) : Math.round(v); return `${n.toLocaleString('en-US')} ${unit}`; }

export function rescaleItem(it: MealItem, newQty: number): MealItem {
  const q = Math.max(0.25, newQty), f = q / (it.portionQty || 1);
  return { ...it, portionQty: q, caloriesEst: it.caloriesEst * f, proteinG: it.proteinG * f, carbsG: it.carbsG * f, fatG: it.fatG * f };
}
