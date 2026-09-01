// Nutrient reference table seed (PRD R70a): food composition per 100 kcal, keyed by the item names a vision provider
// tends to return. This is composition data, NOT targets (R11). Lookup is keyword-based on the item name.

export type MicroKey = 'fiber_g' | 'sodium_mg' | 'potassium_mg' | 'calcium_mg' | 'iron_mg' | 'magnesium_mg' | 'vitamin_d_ug' | 'omega3_g';
export const MICRO_KEYS: MicroKey[] = ['fiber_g', 'sodium_mg', 'potassium_mg', 'calcium_mg', 'iron_mg', 'magnesium_mg', 'vitamin_d_ug', 'omega3_g'];
export interface MicroInfo { key: MicroKey; label: string; unit: 'g' | 'mg' | 'µg'; ceiling: boolean; reference: number; }
/** Reference values used ONLY when the user has no target of their own (R11b), and labelled as reference in the UI. */
export const MICRO_INFO: MicroInfo[] = [
  { key: 'fiber_g', label: 'Fiber', unit: 'g', ceiling: false, reference: 30 },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg', ceiling: true, reference: 2300 },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg', ceiling: false, reference: 3400 },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', ceiling: false, reference: 1000 },
  { key: 'iron_mg', label: 'Iron', unit: 'mg', ceiling: false, reference: 18 },
  { key: 'magnesium_mg', label: 'Magnesium', unit: 'mg', ceiling: false, reference: 400 },
  { key: 'vitamin_d_ug', label: 'Vitamin D', unit: 'µg', ceiling: false, reference: 15 },
  { key: 'omega3_g', label: 'Omega-3', unit: 'g', ceiling: false, reference: 1.6 },
];

export type Composition = Record<MicroKey, number>; // per 100 kcal
interface RefRow { keywords: string[]; per100kcal: Composition; }
const c = (fiber: number, sodium: number, potassium: number, calcium: number, iron: number, magnesium: number, vitd: number, omega3: number): Composition =>
  ({ fiber_g: fiber, sodium_mg: sodium, potassium_mg: potassium, calcium_mg: calcium, iron_mg: iron, magnesium_mg: magnesium, vitamin_d_ug: vitd, omega3_g: omega3 });

export const NUTRIENT_REFERENCE: RefRow[] = [
  { keywords: ['chicken breast', 'grilled chicken', 'chicken', 'poultry', 'turkey'], per100kcal: c(0, 45, 200, 8, 0.5, 18, 0.1, 0.05) },
  { keywords: ['white rice', 'rice', 'jasmine', 'basmati'], per100kcal: c(0.3, 1, 27, 8, 0.15, 9, 0, 0.01) },
  { keywords: ['brown rice', 'quinoa'], per100kcal: c(1.5, 4, 70, 9, 0.7, 40, 0, 0.05) },
  { keywords: ['salmon', 'sardine', 'mackerel', 'trout', 'tuna', 'fish'], per100kcal: c(0, 30, 180, 8, 0.3, 14, 5.5, 1.1) },
  { keywords: ['greek yogurt', 'yogurt', 'skyr'], per100kcal: c(0, 55, 200, 170, 0.1, 17, 0.1, 0.03) },
  { keywords: ['berries', 'blueberr', 'strawberr', 'raspberr'], per100kcal: c(4.5, 2, 140, 12, 0.5, 12, 0, 0.1) },
  { keywords: ['oats', 'oatmeal', 'porridge', 'granola'], per100kcal: c(2.7, 1, 95, 14, 1.1, 36, 0, 0.03) },
  { keywords: ['egg'], per100kcal: c(0, 90, 90, 36, 1.2, 8, 1.3, 0.05) },
  { keywords: ['beef', 'steak', 'burger'], per100kcal: c(0, 30, 130, 6, 1.1, 9, 0.05, 0.03) },
  { keywords: ['lentil', 'chickpea', 'beans', 'bean', 'legume', 'hummus'], per100kcal: c(6.5, 2, 310, 16, 2.8, 30, 0, 0.1) },
  { keywords: ['salad', 'greens', 'spinach', 'kale', 'lettuce', 'mixed greens'], per100kcal: c(9, 150, 1500, 300, 8, 200, 0, 0.5) },
  { keywords: ['broccoli', 'vegetable', 'veggies', 'asparagus', 'green beans'], per100kcal: c(7.5, 90, 900, 130, 2, 60, 0, 0.3) },
  { keywords: ['sweet potato', 'potato'], per100kcal: c(2.5, 35, 470, 30, 0.7, 25, 0, 0.01) },
  { keywords: ['avocado'], per100kcal: c(4.2, 4, 300, 7, 0.3, 18, 0, 0.07) },
  { keywords: ['olive oil', 'oil', 'butter', 'dressing', 'sauce'], per100kcal: c(0, 60, 2, 1, 0, 0, 0, 0.08) },
  { keywords: ['bread', 'toast', 'wrap', 'tortilla', 'bagel', 'bun'], per100kcal: c(1.5, 180, 50, 40, 1.2, 12, 0, 0.02) },
  { keywords: ['pasta', 'noodle', 'spaghetti'], per100kcal: c(1.2, 2, 30, 5, 0.5, 12, 0, 0.01) },
  { keywords: ['cheese', 'feta', 'parmesan', 'mozzarella'], per100kcal: c(0, 200, 25, 200, 0.1, 8, 0.15, 0.05) },
  { keywords: ['nuts', 'almond', 'walnut', 'peanut', 'cashew'], per100kcal: c(1.7, 1, 110, 40, 0.6, 45, 0, 0.9) },
  { keywords: ['banana', 'apple', 'orange', 'fruit'], per100kcal: c(2.8, 1, 350, 8, 0.3, 30, 0, 0.03) },
  { keywords: ['milk', 'latte', 'protein shake', 'whey', 'smoothie'], per100kcal: c(0, 70, 220, 200, 0.1, 18, 1.5, 0.02) },
  { keywords: ['creamy', 'cream', 'risotto'], per100kcal: c(0.2, 90, 40, 30, 0.2, 6, 0.1, 0.03) },
];

const DEFAULT_COMPOSITION: Composition = c(0.8, 40, 90, 15, 0.4, 12, 0.05, 0.03);

export interface NutrientReference { lookup(itemName: string): { composition: Composition; matched: boolean }; }
export const nutrientReference: NutrientReference = {
  lookup(itemName: string) {
    const n = itemName.toLowerCase();
    // longest keyword wins so "greek yogurt" beats "yogurt" and "sweet potato" beats "potato"
    let best: { row: RefRow; len: number } | null = null;
    for (const row of NUTRIENT_REFERENCE) for (const k of row.keywords) if (n.includes(k) && (!best || k.length > best.len)) best = { row, len: k.length };
    return best ? { composition: best.row.per100kcal, matched: true } : { composition: DEFAULT_COMPOSITION, matched: false };
  },
};
