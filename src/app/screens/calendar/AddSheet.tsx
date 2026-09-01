// + Add activity sheet (PRD R26 / R26a). Design markup lines 1428–1463, script 2046–2061.
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { color } from '../../../theme/tokens';
import { Label, Numeral, Semi } from '../../ui/text';
import { Btn, Chip, Sheet, StepBtn } from '../../ui/primitives';
import { ADD_TYPES } from '../../../domain/calendar';
import type { ActivityType, Intensity } from '../../../domain/types';
import type { ISODate } from '../../../domain/dates';
import { DayPicker } from './shared';

const INTENSITIES: Intensity[] = ['Easy', 'Moderate', 'Hard'];

export function AddSheet({ days, today, onClose, onSave }: { days: ISODate[]; today: ISODate; onClose: () => void; onSave: (v: { type: ActivityType; name: string; date: ISODate; minutes: number; intensity: Intensity }) => void }) {
  const [type, setType] = useState(ADD_TYPES[0]);
  const [date, setDate] = useState<ISODate>(days.includes(today) ? today : days[0]);
  const [minutes, setMinutes] = useState(45);
  const [intensity, setIntensity] = useState<Intensity>('Moderate');
  const past = date < today;
  return (
    <Sheet open onClose={onClose} title="Add activity">
      <View style={{ marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ADD_TYPES.map((t) => <Chip key={t.type} label={t.label} active={t.type === type.type} onPress={() => setType(t)} />)}
      </View>
      <View style={{ marginTop: 14 }}>
        <Label size={10} lh={13}>Day</Label>
        <DayPicker days={days} value={date} onChange={setDate} />
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Label size={10} lh={13}>Duration</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <StepBtn sign="−" size={28} disabled={minutes <= 15} onPress={() => setMinutes((m) => Math.max(15, m - 15))} />
            <Numeral size={18} lh={22}>{minutes} min</Numeral>
            <StepBtn sign="+" size={28} onPress={() => setMinutes((m) => m + 15)} />
          </View>
        </View>
      </View>
      <View style={{ marginTop: 12 }}>
        <Label size={10} lh={13}>Intensity</Label>
        <View style={{ marginTop: 6, flexDirection: 'row', gap: 6 }}>
          {INTENSITIES.map((i) => {
            const on = i === intensity;
            return (
              <Pressable key={i} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setIntensity(i)}
                style={[{ flex: 1, borderRadius: 6, paddingVertical: 10, alignItems: 'center', borderWidth: 1 }, on ? { backgroundColor: color.orange, borderColor: color.orange } : { backgroundColor: color.surface2, borderColor: color.border }]}>
                <Semi c={on ? color.textOnOrange : color.text2} size={13}>{i}</Semi>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Btn label={past ? 'Log to calendar' : 'Add to calendar'} size="lg" style={{ marginTop: 16, paddingVertical: 14 }} onPress={() => onSave({ type: type.type, name: type.label, date, minutes, intensity })} />
    </Sheet>
  );
}
