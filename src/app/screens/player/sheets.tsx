// Sheets shared by the gym and sprint players (PRD R32, R33, R39): "Leaving mid-session" and "How did it go?".
import React, { useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { color, font } from '../../../theme/tokens';
import { Display, Body, Label, Semi } from '../../ui/text';
import { Btn, Sheet } from '../../ui/primitives';

/** m:ss clock (design `fmt`). */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export interface EndPayload { difficulty?: number; pain: boolean; painWhere?: string; note?: string; }

export function ExitSheet({ open, doneSets, onSave, onDiscard, onKeep, unit = 'set' }: { open: boolean; doneSets: number; onSave: () => void; onDiscard: () => void; onKeep: () => void; unit?: 'set' | 'stage' }) {
  return (
    <Sheet open={open} onClose={onKeep}>
      <Display size={20} lh={22}>Leaving mid-session</Display>
      <Body style={{ marginTop: 8 }}>{`You've done ${doneSets} ${doneSets === 1 ? unit : unit + 's'}. Save the session? Everything you did counts as completed.`}</Body>
      <View style={{ gap: 8, marginTop: 14 }}>
        <Btn label="Save session" kind="primary" onPress={onSave} />
        <Btn label="Discard session" kind="secondary" onPress={onDiscard} />
        <Pressable accessibilityRole="button" onPress={onKeep} style={({ pressed }) => [{ paddingVertical: 10, alignItems: 'center' }, pressed ? { opacity: 0.8 } : null]}>
          <Semi c={color.text3} size={13}>Keep training</Semi>
        </Pressable>
      </View>
    </Sheet>
  );
}

const inputStyle = { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 11, paddingHorizontal: 12, color: color.text1, fontFamily: font.body, fontSize: 14, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null) };

export function EndSheet({ open, onClose, onFinish }: { open: boolean; onClose: () => void; onFinish: (p: EndPayload) => void }) {
  const [diff, setDiff] = useState(0);
  const [pain, setPain] = useState(false);
  const [painWhere, setPainWhere] = useState('');
  const [note, setNote] = useState('');
  return (
    <Sheet open={open} onClose={onClose}>
      <Display size={20} lh={22}>How did it go?</Display>
      <View style={{ marginTop: 14 }}>
        <Label>How hard was that?</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const on = diff === n;
            return (
              <Pressable key={n} accessibilityRole="button" accessibilityLabel={`Difficulty ${n}`} accessibilityState={{ selected: on }} onPress={() => setDiff(n)}
                style={[{ flex: 1, aspectRatio: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, on ? { backgroundColor: color.orange } : { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.borderStrong }]}>
                <Display size={18} lh={20} c={on ? color.textOnOrange : color.text2}>{String(n)}</Display>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: pain }} onPress={() => setPain((p) => !p)}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, marginTop: 14, borderWidth: 1 }, pain ? { backgroundColor: 'rgba(229,72,77,0.12)', borderColor: color.red } : { backgroundColor: color.surface2, borderColor: color.border }]}>
        <Semi style={{ flex: 1 }}>Any pain?</Semi>
        <View style={{ width: 36, height: 20, borderRadius: 999, borderWidth: 1, borderColor: color.borderStrong, backgroundColor: pain ? color.red : color.surface3 }} />
      </Pressable>
      {pain ? <TextInput value={painWhere} onChangeText={setPainWhere} placeholder="Where? (e.g. right shoulder)" placeholderTextColor={color.text3} style={[inputStyle, { marginTop: 8 }]} /> : null}
      <TextInput value={note} onChangeText={setNote} placeholder="Note for Nora (optional)" placeholderTextColor={color.text3} style={[inputStyle, { marginTop: 10 }]} />
      <Btn label="Finish → marks completed" kind="primary" size="lg" style={{ marginTop: 14, paddingVertical: 14 }}
        onPress={() => onFinish({ difficulty: diff || undefined, pain, painWhere: pain && painWhere.trim() ? painWhere.trim() : undefined, note: note.trim() || undefined })} />
    </Sheet>
  );
}
