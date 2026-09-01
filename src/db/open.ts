import { Platform } from 'react-native';
import type { SqlDriver } from './driver';

const LS_KEY = 'terrain.db.v1';

function toB64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(s);
}
function fromB64(b64: string): Uint8Array {
  const s = atob(b64); const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** Open the app database for the current platform. Web keeps the image in localStorage. */
export async function openAppDatabase(): Promise<SqlDriver> {
  if (Platform.OS === 'web') {
    const { openSqlJs } = await import('./sqljsDriver');
    let image: Uint8Array | null = null;
    try { const b = globalThis.localStorage?.getItem(LS_KEY); if (b) image = fromB64(b); } catch { image = null; }
    return openSqlJs({ image, onPersist: (img) => { try { globalThis.localStorage?.setItem(LS_KEY, toB64(img)); } catch { /* quota */ } } });
  }
  const { openExpoSqlite } = await import('./expoDriver');
  return openExpoSqlite();
}

export function wipeWebImage() { try { globalThis.localStorage?.removeItem(LS_KEY); } catch { /* ignore */ } }
