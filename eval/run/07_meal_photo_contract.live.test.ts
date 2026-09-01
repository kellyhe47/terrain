// Fixture 07 (live): needs network + the vision credential. `TERRAIN_LIVE=1 VISION_API_KEY=… npm run test:live`.
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadFixture } from './fixtures';
import { estimateMealFromImage, atwater } from '../../src/domain/vision/adapter';
import { OpenRouterVisionProvider } from '../../src/ai/openrouterVision';
import { toMealItems } from '../../src/domain/mealEstimator';
import { mealTotals } from '../../src/domain/nutrition';

const f = loadFixture('07_meal_photo_contract.json');
const key = process.env.VISION_API_KEY || process.env.EXPO_PUBLIC_VISION_API_KEY || null;
const live = process.env.TERRAIN_LIVE === '1' && !!key;

describe.skipIf(!live)('fixture 07 meal_photo_contract (live provider)', () => {
  it('a real photo through the real provider satisfies the contract', async () => {
    const bytes = readFileSync(resolve(__dirname, '..', 'golden', f.given.image));
    const provider = new OpenRouterVisionProvider(key, process.env.VISION_MODEL || 'openai/gpt-5-mini');
    const r = await estimateMealFromImage(provider, { base64: bytes.toString('base64'), mime: 'image/jpeg' });
    mkdirSync(resolve(__dirname, 'recordings'), { recursive: true });
    writeFileSync(resolve(__dirname, 'recordings', '07_live_response.json'), JSON.stringify(r, null, 2));
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.estimate.items.length).toBeGreaterThanOrEqual(2); expect(r.estimate.items.length).toBeLessThanOrEqual(6);
    const t = mealTotals(toMealItems(r.estimate));
    expect(t.kcal).toBeGreaterThanOrEqual(350); expect(t.kcal).toBeLessThanOrEqual(1100);
    expect(t.proteinG).toBeGreaterThanOrEqual(25); expect(t.proteinG).toBeLessThanOrEqual(70);
    for (const it of r.estimate.items) expect(Math.abs(atwater(it) - it.calories_est) / Math.max(1, it.calories_est)).toBeLessThanOrEqual(0.25);
  }, 60000);
});
