// Settings (PRD R11, R56, R62, R68): What Nora knows link, the user's own targets with steppers, demo resets and failure gates, disclaimer.
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { fmtNum } from '../../domain/dates';
import type { TargetKey } from '../../domain/types';
import { color } from '../../theme/tokens';
import { Display, Label, Body, Semi, Small, Numeral } from '../ui/text';
import { Card, Btn, IconBtn, StepBtn, Segmented } from '../ui/primitives';
import { Icon } from '../ui/icons';

const TARGET_ROWS: Array<{ key: TargetKey; label: string; step: number; fmt: (v: number) => string }> = [
  { key: 'protein_g', label: 'Protein target', step: 5, fmt: (v) => `${fmtNum(v)} g` },
  { key: 'hydration_l', label: 'Hydration target', step: 0.25, fmt: (v) => `${v.toFixed(2)} L` },
  { key: 'steps', label: 'Daily steps', step: 500, fmt: (v) => fmtNum(v) },
  { key: 'calories', label: 'Calories', step: 50, fmt: (v) => `${fmtNum(v)} kcal` },
  { key: 'carbs_g', label: 'Carbs', step: 10, fmt: (v) => `${fmtNum(v)} g` },
  { key: 'fat_g', label: 'Fat', step: 5, fmt: (v) => `${fmtNum(v)} g` },
  { key: 'fiber_g', label: 'Fiber', step: 5, fmt: (v) => `${fmtNum(v)} g` },
];

const NORA_OPTS = ['OK', 'Error', 'Offline'] as const;
const FAIL_OPTS = ['OK', 'Fail'] as const;
const toFlag = (label: string) => label.toLowerCase();
const fromFlag = (v: string) => v === 'ok' ? 'OK' : v.charAt(0).toUpperCase() + v.slice(1);

export function SettingsScreen() {
  const { t, bump, showToast } = useTerrain();
  const nav = useNav();
  const targets = t.repo.getTargets();

  const adjust = (key: TargetKey, delta: number) => {
    const next = Math.max(0, +(targets[key] + delta).toFixed(2));
    t.repo.setTarget(key, next); bump();
  };
  const resetSeeded = () => { t.resetDemo(); bump(); nav.reset({ name: 'tab', tab: 'today' }); showToast('Demo reset · seeded user'); };
  const resetFresh = () => { t.resetFresh(); bump(); nav.reset({ name: 'onboarding' }); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }} testID="settings">
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn name="chevronLeft" label="Back" onPress={() => nav.pop()} />
          <Display size={22} lh={24}>Settings</Display>
        </View>

        <Card onPress={() => nav.push({ name: 'knows' })} style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Semi size={14}>What Nora knows</Semi>
          <Icon name="chevronRight" size={16} color={color.text3} />
        </Card>

        <Card>
          <Label>Targets · used by readiness</Label>
          <View style={{ marginTop: 10, gap: 10 }}>
            {TARGET_ROWS.map((r) => (
              <View key={r.key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }} accessibilityLabel={r.label}>
                <Body size={13} lh={18}>{r.label}</Body>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <StepBtn sign="−" onPress={() => adjust(r.key, -r.step)} />
                  <Numeral size={15} lh={18} style={{ minWidth: 64, textAlign: 'center' }}>{r.fmt(targets[r.key])}</Numeral>
                  <StepBtn sign="+" onPress={() => adjust(r.key, r.step)} />
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Label>Demo</Label>
          <View style={{ marginTop: 10, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <Body size={13} lh={18} style={{ flex: 1 }}>Reset to seeded user</Body>
              <Btn label="Reset" kind="secondary" size="sm" onPress={resetSeeded} testID="reset-seeded" />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <Body size={13} lh={18} style={{ flex: 1 }}>Reset to fresh (onboarding)</Body>
              <Btn label="Reset" kind="secondary" size="sm" onPress={resetFresh} testID="reset-fresh" />
            </View>
            <View style={{ height: 1, backgroundColor: color.border, marginVertical: 2 }} />
            <View style={{ gap: 6 }}>
              <Body size={13} lh={18}>Nora replies: OK · Error · Offline</Body>
              <Segmented options={[...NORA_OPTS]} value={fromFlag(t.flags.nora)} onChange={(v) => { t.flags.nora = toFlag(v) as typeof t.flags.nora; bump(); }} />
            </View>
            <View style={{ gap: 6 }}>
              <Body size={13} lh={18}>Vision: OK · Fail</Body>
              <Segmented options={[...FAIL_OPTS]} value={fromFlag(t.flags.vision)} onChange={(v) => { t.flags.vision = toFlag(v) as typeof t.flags.vision; bump(); }} />
            </View>
            <View style={{ gap: 6 }}>
              <Body size={13} lh={18}>Plan generation: OK · Fail</Body>
              <Segmented options={[...FAIL_OPTS]} value={fromFlag(t.flags.plan)} onChange={(v) => { t.flags.plan = toFlag(v) as typeof t.flags.plan; bump(); }} />
            </View>
            <Small size={12} lh={17}>Simulates failures so every state is reachable.</Small>
            <Small size={12} lh={17}>Text model: {t.modelName} · Vision: {t.visionName}</Small>
          </View>
        </Card>

        <Small size={12} lh={18} style={{ paddingHorizontal: 4 }}>Terrain offers wellness guidance, not medical advice. Nora never diagnoses or clears you to train — for anything concerning, see a qualified professional.</Small>
      </ScrollView>
    </View>
  );
}
