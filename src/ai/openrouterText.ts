// OpenRouter text client → gpt-5-mini with a PINNED upstream provider and fallbacks disabled (PRD R48, R48a).
// Import boundary: only src/domain/contextAssembler.ts may import this module.
import { ModelUnavailableError, type TextModel, type TextRequest, type TextResponse } from './textModel';
import type { AiConfig } from './config';

const URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterTextModel implements TextModel {
  readonly name: string;
  constructor(private cfg: AiConfig, private fetchFn: typeof fetch = fetch) { this.name = `openrouter:${cfg.textModel}@${cfg.pinnedProvider}`; }

  async complete(req: TextRequest, onToken?: (chunk: string) => void): Promise<TextResponse> {
    if (!this.cfg.openrouterKey) throw new ModelUnavailableError('no OpenRouter key');
    const body: Record<string, unknown> = {
      model: this.cfg.textModel,
      messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.user }],
      provider: { order: [this.cfg.pinnedProvider], allow_fallbacks: this.cfg.allowFallbacks },
      stream: !!onToken && !req.jsonSchema,
    };
    if (req.jsonSchema) body.response_format = { type: 'json_schema', json_schema: { name: req.jsonSchema.name, strict: true, schema: req.jsonSchema.schema } };
    let res: Response;
    try {
      res = await this.fetchFn(URL, { method: 'POST', headers: { Authorization: `Bearer ${this.cfg.openrouterKey}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://terrain.app', 'X-Title': 'Terrain' }, body: JSON.stringify(body) });
    } catch (e) { throw new ModelUnavailableError(`network: ${String(e)}`); }
    if (!res.ok) throw new ModelUnavailableError(`openrouter ${res.status}: ${(await res.text()).slice(0, 200)}`);
    if (body.stream && res.body && typeof (res.body as any).getReader === 'function') {
      const text = await readSse(res, onToken!);
      return { text };
    }
    const data: any = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (onToken) for (const chunk of chunkText(content)) onToken(chunk);
    if (req.jsonSchema) {
      try { return { text: content, json: JSON.parse(content) }; } catch { throw new ModelUnavailableError('non-JSON response'); }
    }
    return { text: content };
  }
}

async function readSse(res: Response, onToken: (c: string) => void): Promise<string> {
  const reader = (res.body as any).getReader(); const dec = new TextDecoder(); let buf = '', out = '';
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim(); if (data === '[DONE]') continue;
      try { const delta = JSON.parse(data)?.choices?.[0]?.delta?.content; if (delta) { out += delta; onToken(delta); } } catch { /* keepalive */ }
    }
  }
  return out;
}
export function chunkText(s: string, n = 6): string[] { const out: string[] = []; for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n)); return out; }
