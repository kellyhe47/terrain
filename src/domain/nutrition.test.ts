import { describe, it, expect } from 'vitest';
import { testRepo } from '../db/testDb';
import { mealTotals, microEstimates, weekStats, gaps14, rescaleItem } from './nutrition';
import { nutrientReference } from '../seed/nutrientReference';
import type { Meal } from './types';

const meal = (date: string, items: Meal['items']): Meal => ({ id: date + Math.random(), date, time: '12:00', name: 'm', imageUri: null, confidence: null, items, createdAt: date });
const it1 = { name: 'Chicken breast', portionEstimate: '~150 g', portionQty: 1, caloriesEst: 250, proteinG: 46, carbsG: 0, fatG: 6 };
const it2 = { name: 'White rice', portionEstimate: '1 cup', portionQty: 1, caloriesEst: 200, proteinG: 4, carbsG: 44, fatG: 0.5 };

describe('nutrition aggregator', () => {
  it('totals are exact sums and portion edits rescale proportionally', () => {
    expect(mealTotals([it1, it2])).toEqual({ kcal: 450, proteinG: 50, carbsG: 44, fatG: 6.5 });
    const half = rescaleItem(it1, 0.5); expect(half.caloriesEst).toBe(125); expect(half.proteinG).toBe(23);
    expect(rescaleItem(it1, 0).portionQty).toBe(0.25);
  });
  it('micros come from the reference table scaled by calories; unmatched items weaken the estimate', () => {
    const m = microEstimates([meal('2026-08-12', [it1, it2])], nutrientReference);
    const potassium = m.find((x) => x.key === 'potassium_mg')!;
    expect(potassium.value).toBeCloseTo(2.5 * 200 + 2 * 27, 1);
    expect(potassium.matchedShare).toBe(1);
    const weak = microEstimates([meal('2026-08-12', [{ ...it1, name: 'Zorblat' }])], nutrientReference);
    expect(weak[0].matchedShare).toBe(0);
  });
  it('week stats use logged days as the denominator; gaps exclude supplement-covered nutrients', async () => {
    const repo = await testRepo();
    repo.saveMeal(meal('2026-08-10', [it1, it1, it1])); repo.saveMeal(meal('2026-08-11', [it2]));
    const t = repo.getTargets();
    const ws = weekStats(repo, '2026-08-09', '2026-08-12', t);
    expect(ws.loggedDays).toBe(2); expect(ws.proteinDaysHit).toBe(1); expect(ws.avgProteinG).toBe((138 + 4) / 2);
    repo.saveSupplement({ id: 's', name: 'Vitamin D3', dose: 'daily', nutrientKey: 'vitamin_d_ug', sort: 0 });
    for (let i = 0; i < 14; i++) repo.setTaken('s', `2026-08-${String(12 - i).padStart(2, '0')}`.replace('2026-08-00', '2026-07-31').replace('2026-08--1', '2026-07-30'), true);
    const g = gaps14(repo, '2026-08-12', t, nutrientReference, () => false);
    expect(g.ranked.map((r) => r.key)).not.toContain('vitamin_d_ug');
    expect(g.ranked.map((r) => r.key)).toContain('fiber_g');
  });
});
