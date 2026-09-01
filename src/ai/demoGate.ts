// Demo gate: lets Settings force the failure/offline states the designs' rails show (R6, R16, R47, R59, R72a) so QA can
// reach them without pulling the network cable. Wraps the seams; never changes what the models see.
import type { TextModel, TextRequest, TextResponse } from './textModel';
import { ModelUnavailableError } from './textModel';
import type { VisionImage, VisionProvider } from '../domain/vision/provider';
import { VisionUnavailableError } from '../domain/vision/provider';

export interface DemoFlags { nora: 'ok' | 'error' | 'offline'; vision: 'ok' | 'fail'; plan: 'ok' | 'fail'; }
export const defaultFlags: DemoFlags = { nora: 'ok', vision: 'ok', plan: 'ok' };

export class GatedTextModel implements TextModel {
  constructor(private inner: TextModel, private flags: () => DemoFlags) {}
  get name() { return this.inner.name; }
  complete(req: TextRequest, onToken?: (c: string) => void): Promise<TextResponse> {
    const f = this.flags();
    if (f.nora === 'offline') return Promise.reject(new ModelUnavailableError('offline'));
    if (f.nora === 'error') return Promise.reject(new ModelUnavailableError('simulated model error'));
    if (req.surface === 'plan' && f.plan === 'fail') return Promise.reject(new ModelUnavailableError('simulated plan failure'));
    return this.inner.complete(req, onToken);
  }
}
export class GatedVisionProvider implements VisionProvider {
  constructor(private inner: VisionProvider, private flags: () => DemoFlags) {}
  get name() { return this.inner.name; }
  estimate(image: VisionImage, prompt: string, schema: Record<string, unknown>): Promise<unknown> {
    if (this.flags().vision === 'fail') return Promise.reject(new VisionUnavailableError('simulated vision failure'));
    return this.inner.estimate(image, prompt, schema);
  }
}
