// Log ＋ tab (PRD R7/R8/R75): the only place signals are logged.
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { addDays, dayOf } from '../../domain/dates';
import { color } from '../../theme/tokens';
import { Display, Label } from '../ui/text';
import { Icon } from '../ui/icons';
import { LOG_TILES, type LogTile, type NumericTile } from './log/signals';
import { LogSheet } from './log/LogSheet';
import { SupplementsSheet } from './log/SupplementsSheet';

type SheetState = { kind: 'none' } | { kind: 'log'; tile: NumericTile; initial: number } | { kind: 'supps' };

export function LogScreen() {
  const { t, asOf, bump, showToast } = useTerrain();
  const nav = useNav();
  const today = dayOf(asOf());
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });

  /** Initial value: today's logged value → most recent logged value → the tile's default. */
  const initialFor = (tile: NumericTile): number => {
    const todays = t.repo.signalsOn(today)[tile.type];
    if (todays != null) return todays;
    const recent = t.repo.signalSeries(tile.type, addDays(today, -365), today);
    if (recent.length) return recent[recent.length - 1].value;
    return tile.fallback;
  };

  const onTile = (tile: LogTile) => {
    if (tile.kind === 'signal') setSheet({ kind: 'log', tile, initial: initialFor(tile) });
    else if (tile.kind === 'supps') setSheet({ kind: 'supps' });
    else if (tile.kind === 'activity') { (globalThis as any).__terrainOpenAdd = true; nav.setTab('calendar'); }
    else nav.push({ name: 'meal' });
  };

  const saveSignal = (tile: NumericTile, value: number) => {
    const now = asOf();
    t.repo.upsertSignal({ date: dayOf(now), type: tile.type, value, loggedAt: now });
    bump(); setSheet({ kind: 'none' }); showToast('Saved · Nora will factor it in');
  };

  const rows: LogTile[][] = [];
  for (let i = 0; i < LOG_TILES.length; i += 3) rows.push(LOG_TILES.slice(i, i + 3));

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} testID="log">
        <Display size={26} lh={26 * 0.95}>Log</Display>
        <View style={{ gap: 8 }}>
          {rows.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map((tile) => (
                <Pressable key={tile.label} accessibilityRole="button" accessibilityLabel={tile.label} onPress={() => onTile(tile)}
                  style={({ pressed }) => [{ flex: 1, backgroundColor: pressed ? color.surface2 : color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 8 }, pressed ? { transform: [{ scale: 0.98 }] } : null]}>
                  <Icon name={tile.icon} size={20} color={tile.kind === 'meal' ? color.orange : color.text2} />
                  <Label c={color.text2} style={{ letterSpacing: 0.55, textAlign: 'center' }}>{tile.label}</Label>
                </Pressable>
              ))}
              {row.length < 3 ? Array.from({ length: 3 - row.length }).map((_, i) => <View key={`sp${i}`} style={{ flex: 1 }} />) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {sheet.kind === 'log' ? (
        <LogSheet key={sheet.tile.type} tile={sheet.tile} initial={sheet.initial} onSave={(v) => saveSignal(sheet.tile, v)} onClose={() => setSheet({ kind: 'none' })} />
      ) : null}
      {sheet.kind === 'supps' ? (
        <SupplementsSheet
          supplements={t.repo.listSupplements()}
          taken={t.repo.takenOn(today)}
          onToggle={(id, next) => { t.repo.setTaken(id, today, next); bump(); }}
          onDone={() => { setSheet({ kind: 'none' }); showToast('Supplements logged'); }}
          onClose={() => setSheet({ kind: 'none' })}
        />
      ) : null}
    </View>
  );
}
