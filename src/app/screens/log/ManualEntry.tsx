// R16 manual entry: food name, kcal, protein, carbs, fat → appends a MealItem (template.html 940–950).
import React, { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { color, font } from '../../../theme/tokens';
import { Label, Semi } from '../../ui/text';
import type { MealItem } from '../../../domain/types';

function Field({ style, ...rest }: TextInputProps) {
  return <TextInput placeholderTextColor={color.text3} {...rest} style={[{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, color: color.text1, fontFamily: font.body, fontSize: 14, minWidth: 0 }, style]} />;
}
const num = (s: string) => { const n = parseFloat(s.replace(/,/g, '')); return Number.isFinite(n) && n >= 0 ? n : 0; };

export function ManualEntry({ onAdd }: { onAdd: (item: MealItem) => void }) {
  const [name, setName] = useState(''); const [kcal, setKcal] = useState(''); const [p, setP] = useState(''); const [c, setC] = useState(''); const [f, setF] = useState('');
  const add = () => {
    const n = name.trim(); if (!n) return;
    onAdd({ name: n, portionEstimate: '1 serving', portionQty: 1, caloriesEst: num(kcal), proteinG: num(p), carbsG: num(c), fatG: num(f) });
    setName(''); setKcal(''); setP(''); setC(''); setF('');
  };
  return (
    <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, padding: 16, gap: 10 }} testID="meal-manual">
      <Label style={{ letterSpacing: 0.9 }}>Manual entry</Label>
      <Field placeholder="Food (e.g. chicken breast)" value={name} onChangeText={setName} accessibilityLabel="Food" />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field placeholder="kcal" value={kcal} onChangeText={setKcal} keyboardType="numeric" accessibilityLabel="kcal" style={{ flex: 1 }} />
        <Field placeholder="Protein g" value={p} onChangeText={setP} keyboardType="numeric" accessibilityLabel="Protein g" style={{ flex: 1 }} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Field placeholder="Carbs g" value={c} onChangeText={setC} keyboardType="numeric" accessibilityLabel="Carbs g" style={{ flex: 1 }} />
        <Field placeholder="Fat g" value={f} onChangeText={setF} keyboardType="numeric" accessibilityLabel="Fat g" style={{ flex: 1 }} />
      </View>
      <Pressable accessibilityRole="button" onPress={add} disabled={!name.trim()} testID="meal-manual-add" style={({ pressed }) => [{ borderWidth: 1, borderColor: color.borderStrong, backgroundColor: color.surface2, borderRadius: 6, paddingVertical: 10, alignItems: 'center', opacity: name.trim() ? 1 : 0.5 }, pressed ? { transform: [{ scale: 0.98 }] } : null]}>
        <Semi size={13} lh={18}>Add item</Semi>
      </Pressable>
    </View>
  );
}
