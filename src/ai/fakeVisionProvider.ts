// Fixture-backed fake vision provider (PRD: the provider is consumed before it exists). Returns a plausible itemized
// reading for any image; modes exercise the adapter's failure and normalisation paths.
import type { VisionImage, VisionProvider } from '../domain/vision/provider';
import { VisionUnavailableError } from '../domain/vision/provider';

export type FakeVisionMode = 'ok' | 'fail' | 'partial' | 'inconsistent';
export class FakeVisionProvider implements VisionProvider {
  readonly name = 'fake-vision';
  mode: FakeVisionMode = 'ok';
  delayMs = 0;
  async estimate(_image: VisionImage, _prompt: string, _schema?: Record<string, unknown>): Promise<unknown> {
    if (this.delayMs) await new Promise((r) => setTimeout(r, this.delayMs));
    if (this.mode === 'fail') throw new VisionUnavailableError('simulated provider outage');
    if (this.mode === 'partial') return { items: [{ name: 'Chicken breast', portion_estimate: '~150 g', calories_est: 248, protein_g: 46 }, { name: 'White rice', portion_estimate: '1 cup', calories_est: 205, protein_g: 4 }], confidence: 'medium' };
    if (this.mode === 'inconsistent') return { items: [{ name: 'Mystery', portion_estimate: '1 plate', calories_est: 900, protein_g: 5, carbs_g: 5, fat_g: 5 }], confidence: 'low' };
    return {
      items: [
        { name: 'Chicken breast', portion_estimate: '~150 g', calories_est: 250, protein_g: 46, carbs_g: 0, fat_g: 6 },
        { name: 'Creamy rice', portion_estimate: '~1 cup', calories_est: 320, protein_g: 6, carbs_g: 48, fat_g: 11 },
        { name: 'Pan sauce', portion_estimate: '~2 tbsp', calories_est: 70, protein_g: 0.5, carbs_g: 2, fat_g: 7 },
      ],
      confidence: 'medium',
    };
  }
}
