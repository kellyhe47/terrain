// Bundled media. Meals reference images by `asset:<key>` so the seed never carries a file path.
export const media = {
  homeScenic: require('../../../assets/media/home-scenic.jpg'),
  gymLoop: require('../../../assets/media/gym-loop.mp4'),
  'meal-chicken-rice': require('../../../assets/media/meal-chicken-rice.jpg'),
  'meal-yogurt-berries': require('../../../assets/media/meal-yogurt-berries.jpg'),
  'meal-chicken-salad': require('../../../assets/media/meal-chicken-salad.jpg'),
} as const;
export function mealImageSource(uri: string | null): any {
  if (!uri) return null;
  if (uri.startsWith('asset:')) return (media as Record<string, any>)[uri.slice(6)] ?? null;
  return { uri };
}
