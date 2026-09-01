// Activity sheet (PRD R25, R27, R28, R40, R54a, R82). Design markup lines 1406–1426, script 2024–2045.
import React, { useState } from 'react';
import { View } from 'react-native';
import { color } from '../../../theme/tokens';
import { Body, Bold, Label } from '../../ui/text';
import { Btn, Sheet } from '../../ui/primitives';
import type { CalendarItem } from '../../../domain/calendar';
import type { ISODate } from '../../../domain/dates';
import { DayPicker, dayLabel } from './shared';

export function ActivitySheet({ item, today, days, onClose, onStart, onDone, onSkipped, onMove, onAskNora, onResume }: {
  item: CalendarItem; today: ISODate; days: ISODate[]; onClose: () => void;
  onStart: () => void; onDone: () => void; onSkipped: () => void; onMove: (date: ISODate) => void; onAskNora: () => void; onResume: () => void;
}) {
  const a = item.activity;
  const [resched, setResched] = useState(false);
  const [moveTo, setMoveTo] = useState<ISODate>(days.includes(a.date) ? a.date : days[0]);
  return (
    <Sheet open onClose={onClose} title={a.name} subtitle={`${dayLabel(a.date, today)} · ${item.subtitle}`}>
      {item.pastDue ? (
        <View style={{ marginTop: 12, backgroundColor: color.orangeTint, borderWidth: 1, borderColor: color.orange, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 }}>
          <Body c={color.text1} size={13} lh={19}>This was scheduled and never logged — <Bold size={13} lh={19}>log what happened</Bold> so the week reads true.</Body>
        </View>
      ) : null}
      <View style={{ gap: 8, marginTop: 14 }}>
        {item.startable ? <Btn label="Start session" onPress={onStart} /> : null}
        {item.pastDue ? <Btn label="I did it — log it" onPress={onDone} /> : null}
        {item.pastDue ? <Btn label="Confirm skipped" kind="secondary" onPress={onSkipped} /> : null}
        {item.recordable && !a.paused ? <Btn label="Mark done" kind={item.startable ? 'secondary' : 'primary'} onPress={onDone} /> : null}
        {a.paused ? <Btn label="I've been seen — resume this" kind="secondary" onPress={onResume} /> : null}
        {resched ? (
          <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 }}>
            <Label size={10} lh={13}>Day</Label>
            <DayPicker days={days} value={moveTo} onChange={setMoveTo} />
            <Btn label="Move" style={{ marginTop: 10 }} onPress={() => onMove(moveTo)} />
          </View>
        ) : <Btn label="Reschedule" kind="secondary" onPress={() => setResched(true)} />}
        <Btn label="Ask Nora to change" kind="outline" onPress={onAskNora} />
      </View>
    </Sheet>
  );
}
