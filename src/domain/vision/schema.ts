import { z } from 'zod';
// Fixture 07's meal_estimate contract.
export const MealItemEstimateSchema = z.object({
  name: z.string().min(1), portion_estimate: z.string().min(1),
  calories_est: z.number().min(0), protein_g: z.number().min(0), carbs_g: z.number().min(0), fat_g: z.number().min(0),
});
export const MealEstimateSchema = z.object({ items: z.array(MealItemEstimateSchema).min(1), confidence: z.enum(['low', 'medium', 'high']) });
export type MealEstimate = z.infer<typeof MealEstimateSchema>;
export type MealItemEstimate = z.infer<typeof MealItemEstimateSchema>;
export const MEAL_ESTIMATE_JSON_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['items', 'confidence'],
  properties: {
    items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'portion_estimate', 'calories_est', 'protein_g', 'carbs_g', 'fat_g'],
      properties: { name: { type: 'string' }, portion_estimate: { type: 'string' }, calories_est: { type: 'number' }, protein_g: { type: 'number' }, carbs_g: { type: 'number' }, fat_g: { type: 'number' } } } },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
} as const;
