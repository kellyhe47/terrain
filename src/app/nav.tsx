// Minimal stack + tab navigator (PRD R62). A pushed screen remembers what pushed it, so "back" returns there.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Tab = 'today' | 'calendar' | 'log' | 'nora' | 'progress';
export type Route =
  | { name: 'tab'; tab: Tab }
  | { name: 'nutrition' } | { name: 'settings' } | { name: 'knows' } | { name: 'sessionDetail'; activityId: string }
  | { name: 'meal' } | { name: 'gym'; activityId: string } | { name: 'sprint'; activityId: string }
  | { name: 'formVideo'; exerciseId: string } | { name: 'onboarding' };

interface Nav { stack: Route[]; current: Route; tab: Tab; push(r: Route): void; pop(): void; replace(r: Route): void; setTab(t: Tab): void; reset(r: Route): void; }
const C = createContext<Nav | null>(null);

export function NavProvider({ initial, children }: { initial: Route; children: React.ReactNode }) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const [tab, setTabState] = useState<Tab>(initial.name === 'tab' ? initial.tab : 'today');
  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const replace = useCallback((r: Route) => setStack((s) => [...s.slice(0, -1), r]), []);
  const reset = useCallback((r: Route) => { setStack([r]); if (r.name === 'tab') setTabState(r.tab); }, []);
  const setTab = useCallback((t: Tab) => { setTabState(t); setStack([{ name: 'tab', tab: t }]); }, []);
  const value = useMemo<Nav>(() => ({ stack, current: stack[stack.length - 1], tab, push, pop, replace, setTab, reset }), [stack, tab, push, pop, replace, setTab, reset]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useNav(): Nav { const c = useContext(C); if (!c) throw new Error('NavProvider missing'); return c; }
