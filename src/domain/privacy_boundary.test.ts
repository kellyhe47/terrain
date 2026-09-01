// PRD R63/R63a: mechanical check of the two model boundaries. Grep-style, so a stray import anywhere fails the build.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
function walk(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(p); }
  return out;
}
const files = walk(ROOT);
const importers = (needle: RegExp) => files.filter((f) => needle.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f));

describe('privacy boundary', () => {
  it('only the context assembler imports the OpenRouter text client', () => {
    expect(importers(/from ['"][^'"]*openrouterText['"]/).sort()).toEqual(['domain/contextAssembler.ts']);
  });
  it('only the context assembler calls a text model', () => {
    // `.complete(` on a TextModel is the outbound call; the assembler is the only domain caller.
    const callers = files.filter((f) => /\.complete\(/.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f)).filter((f) => !f.startsWith('ai/')).sort();
    expect(callers).toEqual(['domain/contextAssembler.ts']);
  });
  it('only the vision provider registry imports vision providers; only the adapter calls one', () => {
    expect(importers(/from ['"][^'"]*(openrouterVision|fakeVisionProvider)['"]/).sort()).toEqual(['domain/vision/providers.ts']);
    const callers = files.filter((f) => /provider\.estimate\(/.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f)).sort();
    expect(callers).toEqual(['domain/vision/adapter.ts']);
  });
  it('the vision adapter has no access to the store, memory or assembler', () => {
    const src = readFileSync(join(ROOT, 'domain/vision/adapter.ts'), 'utf8');
    const imports = [...src.matchAll(/from ['"]([^'"]+)['"]/g)].map((m) => m[1]).sort();
    expect(imports).toEqual(['./provider', './schema']);
  });
  it('no raw fetch to a model host outside the two clients', () => {
    const hits = files.filter((f) => /openrouter\.ai/.test(readFileSync(f, 'utf8'))).map((f) => relative(ROOT, f)).sort();
    expect(hits).toEqual(['ai/openrouterText.ts', 'ai/openrouterVision.ts']);
  });
});
