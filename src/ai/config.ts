// Credentials and pins come from env/config only (PRD R48a, R65). Either absent degrades only its own surface.
const env = (k: string): string | undefined => (typeof process !== 'undefined' && process.env ? (process.env as Record<string, string | undefined>)[k] : undefined);

export interface AiConfig {
  openrouterKey: string | null; textModel: string; pinnedProvider: string; allowFallbacks: boolean;
  visionProvider: 'fake' | 'openrouter'; visionKey: string | null; visionModel: string;
}
export function loadAiConfig(): AiConfig {
  const openrouterKey = env('EXPO_PUBLIC_OPENROUTER_API_KEY') || null;
  const visionKey = env('EXPO_PUBLIC_VISION_API_KEY') || null;
  const vp = env('EXPO_PUBLIC_VISION_PROVIDER');
  return {
    openrouterKey, textModel: env('EXPO_PUBLIC_TEXT_MODEL') || 'openai/gpt-5-mini',
    pinnedProvider: env('EXPO_PUBLIC_OPENROUTER_PROVIDER') || 'openai',
    allowFallbacks: env('EXPO_PUBLIC_OPENROUTER_ALLOW_FALLBACKS') === 'true',
    visionProvider: vp === 'openrouter' || (!vp && visionKey) ? 'openrouter' : 'fake',
    visionKey, visionModel: env('EXPO_PUBLIC_VISION_MODEL') || 'openai/gpt-5-mini',
  };
}
