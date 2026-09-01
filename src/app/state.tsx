import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Terrain } from './services';

interface Ctx { t: Terrain; version: number; bump(): void; asOf(): string; toast: string | null; showToast(msg: string, ms?: number): void; }
const C = createContext<Ctx | null>(null);

export function TerrainProvider({ t, children }: { t: Terrain; children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bump = useCallback(() => { t.repo.db.persist(); setVersion((v) => v + 1); }, [t]);
  const showToast = useCallback((msg: string, ms = 1800) => { setToast(msg); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setToast(null), ms); }, []);
  const value = useMemo<Ctx>(() => ({ t, version, bump, asOf: () => t.now(), toast, showToast }), [t, version, bump, toast, showToast]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useTerrain(): Ctx { const c = useContext(C); if (!c) throw new Error('TerrainProvider missing'); return c; }
