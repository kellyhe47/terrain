// OpenRouter multimodal vision provider. Uses the VISION credential, never the text client (PRD R63a, R65).
// Import boundary: only src/domain/vision/providers.ts may import this module.
import type { VisionImage, VisionProvider } from '../domain/vision/provider';
import { VisionUnavailableError } from '../domain/vision/provider';

export class OpenRouterVisionProvider implements VisionProvider {
  readonly name: string;
  constructor(private key: string | null, private model: string, private fetchFn: typeof fetch = (input, init) => fetch(input, init)) { this.name = `openrouter-vision:${model}`; }
  async estimate(image: VisionImage, prompt: string, jsonSchema: Record<string, unknown>): Promise<unknown> {
    if (!this.key) throw new VisionUnavailableError('no vision key');
    const body = {
      model: this.model,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.base64}` } }] }],
      response_format: { type: 'json_schema', json_schema: { name: 'meal_estimate', strict: true, schema: jsonSchema } },
    };
    let res: Response;
    try { res = await this.fetchFn('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${this.key}`, 'Content-Type': 'application/json', 'X-Title': 'Terrain' }, body: JSON.stringify(body) }); }
    catch (e) { throw new VisionUnavailableError(`network: ${String(e)}`); }
    if (!res.ok) throw new VisionUnavailableError(`vision ${res.status}`);
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    try { return JSON.parse(content); } catch { throw new VisionUnavailableError('non-JSON vision response'); }
  }
}
