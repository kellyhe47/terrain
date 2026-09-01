// R75: supplement stack, each row toggling Taken / Not yet for the day (design sheet 1383–1404).
import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { color, font } from '../../../theme/tokens';
import { Sheet, Btn } from '../../ui/primitives';
import { Semi, Tiny } from '../../ui/text';
import type { Supplement } from '../../../domain/types';

export function SupplementsSheet({ supplements, taken, onToggle, onDone, onClose }: { supplements: Supplement[]; taken: Set<string>; onToggle: (id: string, next: boolean) => void; onDone: () => void; onClose: () => void }) {
  const n = supplements.filter((s) => taken.has(s.id)).length;
  return (
    <Sheet open onClose={onClose} title="Supplements" subtitle={`${n} / ${supplements.length} taken today`}>
      <View style={{ marginTop: 8 }}>
        {supplements.map((s) => {
          const on = taken.has(s.id);
          return (
            <Pressable key={s.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${s.name}, ${on ? 'Taken' : 'Not yet'}`} onPress={() => onToggle(s.id, !on)}
              style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: color.border }, pressed ? { transform: [{ scale: 0.99 }] } : null]}>
              <View style={[{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, on ? { backgroundColor: color.orange } : { borderWidth: 1, borderColor: color.borderStrong }]}>
                {on ? <Text style={{ fontFamily: font.bodyBold, fontSize: 12, lineHeight: 14, color: color.textOnOrange }}>✓</Text> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Semi size={13} lh={17}>{s.name}</Semi>
                <Tiny style={{ marginTop: 1 }}>{s.dose}</Tiny>
              </View>
              <Semi size={11} lh={14} c={on ? color.text2 : color.text3}>{on ? 'Taken' : 'Not yet'}</Semi>
            </Pressable>
          );
        })}
      </View>
      <Btn label="Done" size="lg" style={{ marginTop: 16, width: '100%', paddingVertical: 14 }} onPress={onDone} testID="supps-done" />
    </Sheet>
  );
}
