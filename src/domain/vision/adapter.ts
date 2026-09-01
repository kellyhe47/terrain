// Vision adapter (PRD R12, R12a, R63a): the only code that talks to a vision provider. The request carries image bytes and
// this fixed prompt — no profile, signals, memory or history can reach it because nothing here has access to them.
import { MealEstimateSchema, MEAL_ESTIMATE_JSON_SCHEMA, type MealEstimate } from './schema';
import type { VisionImage, VisionProvider } from './provider';

export const FIXED_MEAL_PROMPT = 'Identify the distinct food items on this plate. For each item give a short name, a portion estimate (e.g. "~150 g", "1 cup"), estimated calories, protein grams, carbohydrate grams and fat grams. Give an overall confidence of low, medium or high. Respond with JSON only.';

export type AdapterResult = { ok: true; estimate: MealEstimate; provider: string } | { ok: false; reason: string; provider: string };

/** Fill fields a provider omitted (R12a): derive carbs/fat from the calorie remainder rather than pass partial data through. */
export function normalizeRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const r = raw as Record<string, unknown>;
  const items = Array.isArray(r.items) ? r.items : [];
  const fixed = items.map((it) => {
    if (!it || typeof it !== 'object') return it;
    const o = { ...(it as Record<string, unknown>) };
    const kcal = num(o.calories_est ?? o.calories ?? o.kcal), p = num(o.protein_g ?? o.protein);
    let c = num(o.carbs_g ?? o.carbs ?? o.carbohydrates_g), f = num(o.fat_g ?? o.fat);
    if (kcal != null && p != null) {
      const rest = Math.max(0, kcal - p * 4);
      if (c == null && f == null) { f = Math.round((rest * 0.3) / 9); c = Math.round((rest - f * 9) / 4); }
      else if (c == null && f != null) c = Math.max(0, Math.round((rest - f * 9) / 4));
      else if (f == null && c != null) f = Math.max(0, Math.round((rest - c * 4) / 9));
    }
    return { name: o.name, portion_estimate: o.portion_estimate ?? o.portion ?? o.serving, calories_est: kcal, protein_g: p, carbs_g: c, fat_g: f };
  });
  const conf = typeof r.confidence === 'string' ? r.confidence.toLowerCase() : r.confidence;
  return { items: fixed, confidence: conf };
}
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined);

export function atwater(i: { protein_g: number; carbs_g: number; fat_g: number }): number { return i.protein_g * 4 + i.carbs_g * 4 + i.fat_g * 9; }
/** R12a consistency rails: each item within 25% of its calories, the meal within 15%. */
export function consistencyViolations(e: MealEstimate): string[] {
  const v: string[] = [];
  for (const it of e.items) {
    const a = atwater(it);
    if (it.calories_est > 0 && Math.abs(a - it.calories_est) / it.calories_est > 0.25) v.push(`item "${it.name}" macros (${Math.round(a)} kcal) disagree with ${Math.round(it.calories_est)} kcal by more than 25%`);
    if (it.calories_est === 0 && it.protein_g === 0 && it.carbs_g === 0 && it.fat_g === 0) v.push(`item "${it.name}" has no nutrition at all`);
  }
  const total = e.items.reduce((s, i) => s + i.calories_est, 0), ta = e.items.reduce((s, i) => s + atwater(i), 0);
  if (total > 0 && Math.abs(ta - total) / total > 0.15) v.push(`meal macros (${Math.round(ta)} kcal) disagree with ${Math.round(total)} kcal by more than 15%`);
  return v;
}

export async function estimateMealFromImage(provider: VisionProvider, image: VisionImage): Promise<AdapterResult> {
  let raw: unknown;
  try { raw = await provider.estimate(image, FIXED_MEAL_PROMPT, MEAL_ESTIMATE_JSON_SCHEMA as unknown as Record<string, unknown>); }
  catch (e) { return { ok: false, reason: `provider failed: ${(e as Error).message}`, provider: provider.name }; }
  const parsed = MealEstimateSchema.safeParse(normalizeRaw(raw));
  if (!parsed.success) return { ok: false, reason: 'response failed schema validation: ' + parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; '), provider: provider.name };
  const v = consistencyViolations(parsed.data);
  if (v.length) return { ok: false, reason: v.join('; '), provider: provider.name };
  return { ok: true, estimate: parsed.data, provider: provider.name };
}
