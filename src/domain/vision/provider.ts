// Vision provider seam (PRD R63b): image bytes + a fixed app-authored prompt in, raw provider response out.
export interface VisionImage { base64: string; mime: 'image/jpeg' | 'image/png'; }
export interface VisionProvider {
  readonly name: string;
  /** Returns the provider's raw (unvalidated) response. Throws on transport failure. */
  estimate(image: VisionImage, prompt: string, jsonSchema: Record<string, unknown>): Promise<unknown>;
}
export class VisionUnavailableError extends Error { constructor(msg = 'vision unavailable') { super(msg); this.name = 'VisionUnavailableError'; } }
