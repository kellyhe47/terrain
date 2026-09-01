// R8: one large value, its unit, −/+ steppers and Save (design sheet 1367–1381).
import React, { useState } from 'react';
import { View } from 'react-native';
import { Sheet, StepBtn, Btn } from '../../ui/primitives';
import { Numeral, Label } from '../../ui/text';
import { fmtSignal, stepValue, type NumericTile } from './signals';

export function LogSheet({ tile, initial, onSave, onClose }: { tile: NumericTile; initial: number; onSave: (v: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(initial);
  return (
    <Sheet open onClose={onClose} title={tile.label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingVertical: 26 }}>
        <StepBtn sign="−" size={52} onPress={() => setVal((v) => stepValue(tile, v, -1))} />
        <View style={{ alignItems: 'center', minWidth: 110 }}>
          <Numeral size={52} lh={52} accessibilityLabel={`${fmtSignal(tile, val)} ${tile.unit}`}>{fmtSignal(tile, val)}</Numeral>
          <Label style={{ marginTop: 4, letterSpacing: 0.9 }}>{tile.unit}</Label>
        </View>
        <StepBtn sign="+" size={52} onPress={() => setVal((v) => stepValue(tile, v, 1))} />
      </View>
      <Btn label="Save" size="lg" style={{ marginTop: 12, width: '100%', paddingVertical: 14 }} onPress={() => onSave(val)} testID="log-save" />
    </Sheet>
  );
}
