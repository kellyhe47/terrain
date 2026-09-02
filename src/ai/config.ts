// Credentials and pins come from env/config only (PRD R48a, R65). Either absent degrades only its own surface.
// Expo inlines `process.env.EXPO_PUBLIC_*` at bundle time ONLY for static member references — keep these literal.
export interface AiConfig {
  openrouterKey: string | null; textModel: string; pinnedProvider: string; allowFallbacks: boolean;
  visionProvider: 'fake' | 'openrouter'; visionKey: string | null; visionModel: string;
}
const clean = (v: string | undefined): string | null => { const s = (v ?? '').trim(); return s ? s : null; };
export function loadAiConfig(): AiConfig {
  const openrouterKey = clean(process.env.EXPO_PUBLIC_OPENROUTER_API_KEY);
  const visionKey = clean(process.env.EXPO_PUBLIC_VISION_API_KEY) ?? openrouterKey;
  const vp = clean(process.env.EXPO_PUBLIC_VISION_PROVIDER);
  return {
    openrouterKey,
    textModel: clean(process.env.EXPO_PUBLIC_TEXT_MODEL) ?? 'openai/gpt-5-mini',
    pinnedProvider: clean(process.env.EXPO_PUBLIC_OPENROUTER_PROVIDER) ?? 'openai',
    allowFallbacks: clean(process.env.EXPO_PUBLIC_OPENROUTER_ALLOW_FALLBACKS) === 'true',
    visionProvider: vp === 'openrouter' || (!vp && visionKey) ? 'openrouter' : 'fake',
    visionKey,
    visionModel: clean(process.env.EXPO_PUBLIC_VISION_MODEL) ?? 'openai/gpt-5-mini',
  };
}
