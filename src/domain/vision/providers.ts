import type { AiConfig } from '../../ai/config';
import type { VisionProvider } from './provider';
import { FakeVisionProvider } from '../../ai/fakeVisionProvider';
import { OpenRouterVisionProvider } from '../../ai/openrouterVision';
/** Swapping providers requires no change above the adapter (R63b). */
export function buildVisionProvider(cfg: AiConfig): VisionProvider {
  if (cfg.visionProvider === 'openrouter') return new OpenRouterVisionProvider(cfg.visionKey, cfg.visionModel);
  return new FakeVisionProvider();
}
