// Fixture 07 (offline) → operation: estimateMealFromImage(provider, image) through the vision adapter with the
// fixture-backed fake provider, plus the app-side arithmetic (mealTotals, rescaleItem). The live provider run is
// 07_meal_photo_contract.live.test.ts.
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadFixture } from './fixtures';
import { estimateMealFromImage, FIXED_MEAL_PROMPT, atwater } from '../../src/domain/vision/adapter';
import { FakeVisionProvider } from '../../src/ai/fakeVisionProvider';
import type { VisionImage, VisionProvider } from '../../src/domain/vision/provider';
import { toMealItems, MealEstimator } from '../../src/domain/mealEstimator';
import { mealTotals, rescaleItem } from '../../src/domain/nutrition';
import { testRepo } from '../../src/db/testDb';

const f = loadFixture('07_meal_photo_contract.json');
const bytes = readFileSync(resolve(__dirname, '..', 'golden', f.given.image));
const image: VisionImage = { base64: bytes.toString('base64'), mime: 'image/jpeg' };

describe('fixture 07 meal_photo_contract (offline, fake provider)', () => {
  it('uses the exact fixture photo', () => { expect(createHash('sha256').update(bytes).digest('hex')).toBe(f.given.image_sha256); expect(bytes.length).toBe(61758); });

  it('structure: 1..6 items, six typed fields each, confidence enum', async () => {
    const r = await estimateMealFromImage(new FakeVisionProvider(), image);
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.estimate.items.length).toBeGreaterThanOrEqual(2); expect(r.estimate.items.length).toBeLessThanOrEqual(6);
    for (const it of r.estimate.items) { expect(it.name).toBeTruthy(); expect(it.portion_estimate).toBeTruthy(); for (const k of ['calories_est', 'protein_g', 'carbs_g', 'fat_g'] as const) expect(it[k]).toBeGreaterThanOrEqual(0); }
    expect(['low', 'medium', 'high']).toContain(r.estimate.confidence);
  });
  it('arithmetic: totals are the exact sum of items; Atwater within 25% per item and 15% per meal; portion edits rescale proportionally', async () => {
    const r = await estimateMealFromImage(new FakeVisionProvider(), image); if (!r.ok) throw new Error(r.reason);
    const items = toMealItems(r.estimate); const t = mealTotals(items);
    expect(t.kcal).toBe(items.reduce((a, i) => a + i.caloriesEst, 0)); expect(t.proteinG).toBe(items.reduce((a, i) => a + i.proteinG, 0));
    for (const it of r.estimate.items) expect(Math.abs(atwater(it) - it.calories_est) / it.calories_est).toBeLessThanOrEqual(0.25);
    const ta = r.estimate.items.reduce((a, i) => a + atwater(i), 0); expect(Math.abs(ta - t.kcal) / t.kcal).toBeLessThanOrEqual(0.15);
    const doubled = rescaleItem(items[0], 2); expect(doubled.caloriesEst).toBeCloseTo(items[0].caloriesEst * 2); expect(doubled.fatG).toBeCloseTo(items[0].fatG * 2);
    const t2 = mealTotals([doubled, ...items.slice(1)]); expect(t2.kcal).toBeCloseTo(t.kcal + items[0].caloriesEst);
  });
  it('plausibility for a single plated main', async () => {
    const r = await estimateMealFromImage(new FakeVisionProvider(), image); if (!r.ok) throw new Error(r.reason);
    const t = mealTotals(toMealItems(r.estimate));
    expect(t.kcal).toBeGreaterThanOrEqual(350); expect(t.kcal).toBeLessThanOrEqual(1100);
    expect(t.proteinG).toBeGreaterThanOrEqual(25); expect(t.proteinG).toBeLessThanOrEqual(70);
    for (const it of r.estimate.items) expect(it.calories_est + it.protein_g + it.carbs_g + it.fat_g).toBeGreaterThan(0);
  });
  it('R12a: a provider that omits carbs or fat is adapted to fill them; inconsistent macros are a provider failure', async () => {
    const p = new FakeVisionProvider(); p.mode = 'partial';
    const r = await estimateMealFromImage(p, image); expect(r.ok).toBe(true); if (!r.ok) return;
    for (const it of r.estimate.items) { expect(it.carbs_g).toBeGreaterThanOrEqual(0); expect(it.fat_g).toBeGreaterThanOrEqual(0); expect(Math.abs(atwater(it) - it.calories_est) / it.calories_est).toBeLessThanOrEqual(0.25); }
    p.mode = 'inconsistent'; const bad = await estimateMealFromImage(p, image); expect(bad.ok).toBe(false);
    p.mode = 'fail'; const down = await estimateMealFromImage(p, image); expect(down.ok).toBe(false);
  });
  it('invariant R63a: the request carries only the image bytes and the fixed app prompt', async () => {
    const seen: unknown[][] = [];
    const spy: VisionProvider = { name: 'spy', async estimate(img, prompt, schema) { seen.push([img, prompt, schema]); return new FakeVisionProvider().estimate(img, prompt, schema); } };
    await estimateMealFromImage(spy, image);
    expect(seen).toHaveLength(1);
    const [img, prompt] = seen[0] as [VisionImage, string];
    expect(img).toEqual(image); expect(prompt).toBe(FIXED_MEAL_PROMPT);
    expect(prompt).not.toMatch(/profile|readiness|memory|history|target/i);
  });
  it('invariant: nothing persists until the user saves', async () => {
    const repo = await testRepo(); const est = new MealEstimator(repo, new FakeVisionProvider());
    const r = await est.estimate(image); expect(r.ok).toBe(true);
    expect(repo.mealsOn('2026-08-17')).toHaveLength(0);
    if (r.ok) est.saveMeal({ items: toMealItems(r.estimate), imageUri: null, confidence: r.estimate.confidence }, f.given.as_of);
    expect(repo.mealsOn('2026-08-17')).toHaveLength(1);
  });
});
