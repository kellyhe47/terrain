// Meal estimator (R12–R16): camera → estimator → vision adapter → provider. Nothing persists until the user saves.
import { estimateMealFromImage, type AdapterResult } from './vision/adapter';
import type { VisionImage, VisionProvider } from './vision/provider';
import type { MealEstimate } from './vision/schema';
import type { Meal, MealItem } from './types';
import { newId, type Repo } from '../db/repo';
import { dayOf } from './dates';

export function toMealItems(e: MealEstimate): MealItem[] {
  return e.items.map((i) => ({ name: i.name, portionEstimate: i.portion_estimate, portionQty: 1, caloriesEst: i.calories_est, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g }));
}
export class MealEstimator {
  constructor(private repo: Repo, private provider: VisionProvider) {}
  get providerName() { return this.provider.name; }
  /** The vision call. This class has a repo for saving only; the image request never sees it. */
  estimate(image: VisionImage): Promise<AdapterResult> { return estimateMealFromImage(this.provider, image); }
  /** R15: save happens only on the user's explicit Save meal. */
  saveMeal(input: { items: MealItem[]; imageUri: string | null; confidence: Meal['confidence']; name?: string }, asOf: string): Meal {
    const time = asOf.slice(11, 16);
    const name = input.name ?? input.items.slice(0, 2).map((i) => i.name).join(' & ');
    const meal: Meal = { id: newId('meal'), date: dayOf(asOf), time, name, imageUri: input.imageUri, confidence: input.confidence, items: input.items, createdAt: asOf };
    this.repo.saveMeal(meal); return meal;
  }
}
