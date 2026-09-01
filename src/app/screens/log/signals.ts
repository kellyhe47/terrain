// Log grid definitions (PRD R7/R8): tiles, step sizes, units and value formatting.
import type { SignalType } from '../../../domain/types';
import { fmtNum } from '../../../domain/dates';

export interface NumericTile { kind: 'signal'; type: SignalType; label: string; icon: string; unit: string; step: number; fallback: number; min: number; max?: number; decimals: number }
export interface ActionTile { kind: 'meal' | 'supps' | 'activity'; label: string; icon: string }
export type LogTile = NumericTile | ActionTile;

const sig = (type: SignalType, label: string, icon: string, unit: string, step: number, fallback: number, decimals: number, min = 0, max?: number): NumericTile =>
  ({ kind: 'signal', type, label, icon, unit, step, fallback, decimals, min, max });

/** Order and copy match the design's logDefs (template.html 1767–1778). */
export const LOG_TILES: LogTile[] = [
  sig('sleep', 'Sleep', 'moon', 'hours', 0.5, 7.5, 1),
  sig('energy', 'Energy', 'zap', 'out of 5', 1, 3, 0, 1, 5),
  sig('soreness', 'Soreness', 'soreness', 'out of 5', 1, 2, 0, 1, 5),
  sig('stress', 'Stress / mood', 'mood', 'out of 5', 1, 2, 0, 1, 5),
  sig('steps', 'Steps', 'steps', 'steps', 500, 8000, 0),
  sig('hydration', 'Hydration', 'drop', 'liters', 0.25, 2.0, 2),
  sig('weight', 'Weight', 'weight', 'lbs', 0.5, 150, 1),
  { kind: 'meal', label: 'Meal 📷', icon: 'camera' },
  { kind: 'supps', label: 'Supplements', icon: 'pill' },
  { kind: 'activity', label: 'Activity', icon: 'activity' },
];

export function fmtSignal(tile: NumericTile, v: number): string {
  if (tile.type === 'steps') return fmtNum(v);
  return v.toFixed(tile.decimals);
}
export function stepValue(tile: NumericTile, v: number, dir: 1 | -1): number {
  let next = +(v + dir * tile.step).toFixed(2);
  if (next < tile.min) next = tile.min;
  if (tile.max != null && next > tile.max) next = tile.max;
  return next;
}
