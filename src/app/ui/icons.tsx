// Lucide-style stroke icons ported from the design prototype, plus the four calendar status glyphs (R24).
import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Line } from 'react-native-svg';
import { color } from '../../theme/tokens';

const P: Record<string, React.ReactNode> = {
  sun: <><Circle cx="12" cy="12" r="4" /><Path d="M12 2v2" /><Path d="M12 20v2" /><Path d="m4.93 4.93 1.41 1.41" /><Path d="m17.66 17.66 1.41 1.41" /><Path d="M2 12h2" /><Path d="M20 12h2" /><Path d="m6.34 17.66-1.41 1.41" /><Path d="m19.07 4.93-1.41 1.41" /></>,
  calendar: <><Rect x="3" y="4" width="18" height="18" rx="2" /><Path d="M16 2v4" /><Path d="M8 2v4" /><Path d="M3 10h18" /></>,
  plus: <><Path d="M5 12h14" /><Path d="M12 5v14" /></>,
  chat: <Path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  trend: <><Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><Polyline points="16 7 22 7 22 13" /></>,
  moon: <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  zap: <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  soreness: <><Path d="M14.4 14.4 9.6 9.6" /><Path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" /><Path d="m21.5 21.5-1.4-1.4" /><Path d="M3.9 3.9 2.5 2.5" /><Path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" /></>,
  mood: <><Circle cx="12" cy="12" r="10" /><Path d="M8 15h8" /><Line x1="9" x2="9.01" y1="9" y2="9" /><Line x1="15" x2="15.01" y1="9" y2="9" /></>,
  steps: <><Path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" /><Path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" /></>,
  drop: <Path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
  weight: <><Circle cx="12" cy="5" r="3" /><Path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" /></>,
  camera: <><Path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><Circle cx="12" cy="13" r="3" /></>,
  pill: <><Path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" /><Path d="m8.5 8.5 7 7" /></>,
  activity: <Path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />,
  gear: <><Circle cx="12" cy="12" r="3" /><Path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /></>,
  chevronRight: <Path d="m9 18 6-6-6-6" />,
  chevronLeft: <Path d="m15 18-6-6 6-6" />,
  chevronUp: <Path d="m18 15-6-6-6 6" />,
  x: <><Path d="M18 6 6 18" /><Path d="m6 6 12 12" /></>,
  check: <Path d="M20 6 9 17l-5-5" />,
  send: <><Path d="m22 2-7 20-4-9-9-4Z" /><Path d="M22 2 11 13" /></>,
  flash: <Path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />,
  flip: <><Path d="M3 2v6h6" /><Path d="M21 12A9 9 0 0 0 6 5.3L3 8" /><Path d="M21 22v-6h-6" /><Path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" /></>,
  play: <Path d="M6 4.5v15l13-7.5z" fill="currentColor" />,
};

export function Icon({ name, size = 20, color: c = color.text2, strokeWidth = 2 }: { name: string; size?: number; color?: string; strokeWidth?: number }) {
  const body = P[name];
  if (!body) return null;
  const filled = name === 'play';
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" color={c}>{body}</Svg>;
}

/** Calendar status glyphs (R24): completed green filled check · skipped dashed grey ring ✕ · pending grey clock · now orange clock. */
export function StatusIcon({ status, size = 26 }: { status: 'completed' | 'skipped' | 'pending' | 'now'; size?: number }) {
  if (status === 'completed') return <Svg width={size} height={size} viewBox="0 0 26 26"><Circle cx="13" cy="13" r="11" fill={color.green} opacity={0.18} /><Circle cx="13" cy="13" r="11" fill="none" stroke={color.green} strokeWidth={1.6} /><Path d="M8.5 13.5l3 3 6-6.5" fill="none" stroke={color.green} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /></Svg>;
  if (status === 'skipped') return <Svg width={size} height={size} viewBox="0 0 26 26"><Circle cx="13" cy="13" r="11" fill="none" stroke={color.text3} strokeWidth={1.6} strokeDasharray="3 3" /><Path d="M9 9l8 8M17 9l-8 8" stroke={color.text3} strokeWidth={2} strokeLinecap="round" /></Svg>;
  if (status === 'now') return <Svg width={size} height={size} viewBox="0 0 26 26"><Circle cx="13" cy="13" r="11" fill={color.orange} opacity={0.18} /><Circle cx="13" cy="13" r="11" fill="none" stroke={color.orange} strokeWidth={1.8} /><Path d="M13 7.5v5.8l4 2.2" fill="none" stroke={color.orange} strokeWidth={2.1} strokeLinecap="round" /></Svg>;
  return <Svg width={size} height={size} viewBox="0 0 26 26"><Circle cx="13" cy="13" r="11" fill="none" stroke={color.text2} strokeWidth={1.8} /><Path d="M13 8v5l3.5 2" fill="none" stroke={color.text2} strokeWidth={1.8} strokeLinecap="round" /></Svg>;
}
