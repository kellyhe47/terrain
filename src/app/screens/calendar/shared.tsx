// Shared bits for the calendar screen and its sheets (PRD R24, R77–R78).
import React from 'react';
import { Pressable, View } from 'react-native';
import { color, font } from '../../../theme/tokens';
import { Numeral, Semi } from '../../ui/text';
import { DOW_LETTER, dow, fmtDowNum, parseISODate, type ISODate } from '../../../domain/dates';
import type { DotKind } from '../../../domain/calendar';
import type { ActivityStatus } from '../../../domain/types';

/** Status dot colours (design `monthVals` / `weekStrip`). */
export const DOT_COLOR: Record<DotKind, string> = { today: color.orange, completed: color.green, skipped: color.text3, planned: color.text2, none: 'transparent' };
/** Subtitle colour by status (design `seedActs.c`). */
export const STATUS_COLOR: Record<ActivityStatus, string> = { completed: color.green, skipped: color.text3, now: color.orange, pending: color.text2 };

export function dayLabel(date: ISODate, today: ISODate): string { return date === today ? 'Today' : fmtDowNum(date); }
export function dayNum(date: ISODate): number { return parseISODate(date).getDate(); }

/** 7-cell day picker used by the Add sheet (R26) and the Reschedule picker (R27). Design `addDays`. */
export function DayPicker({ days, value, onChange }: { days: ISODate[]; value: ISODate; onChange: (d: ISODate) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 5, marginTop: 6 }}>
      {days.map((d) => {
        const on = d === value;
        return (
          <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={fmtDowNum(d)} onPress={() => onChange(d)}
            style={({ pressed }) => [{ flex: 1, borderRadius: 6, paddingVertical: 6, alignItems: 'center', borderWidth: 1 }, on ? { backgroundColor: color.orange, borderColor: color.orange } : { backgroundColor: color.surface2, borderColor: color.border }, pressed ? { transform: [{ scale: 0.97 }] } : null]}>
            <Semi c={on ? color.textOnOrange : color.text2} size={9} lh={12} style={{ letterSpacing: 0.54 }}>{DOW_LETTER[dow(d)]}</Semi>
            <Numeral c={on ? color.textOnOrange : color.text2} size={15} lh={17} style={{ marginTop: 1, fontFamily: font.display }}>{dayNum(d)}</Numeral>
          </Pressable>
        );
      })}
    </View>
  );
}
