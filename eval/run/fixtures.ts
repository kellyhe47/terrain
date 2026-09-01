import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export function loadFixture<T = any>(file: string): T {
  return JSON.parse(readFileSync(resolve(__dirname, '..', 'golden', file), 'utf8')) as T;
}
