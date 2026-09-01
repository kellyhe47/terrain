// Meal photo (PRD R12–R16): camera → analyzing → estimate | fail, plus manual entry. Nothing persists until Save meal (R15).
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { color, font } from '../../theme/tokens';
import { mealTotals, rescaleItem } from '../../domain/nutrition';
import { toMealItems } from '../../domain/mealEstimator';
import { fmtNum } from '../../domain/dates';
import type { Meal, MealItem } from '../../domain/types';
import { Display, Label, Numeral, Semi, Small, Tiny, Body, Bold } from '../ui/text';
import { Btn, IconBtn, Spinner, StepBtn } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { mealImageSource } from '../ui/assets';
import { CameraStage, FIXTURE_URI, type Capture } from './log/CameraStage';
import { ManualEntry } from './log/ManualEntry';

type Stage = 'camera' | 'analyzing' | 'estimate' | 'fail';
type Confidence = Meal['confidence'] | 'manual';
const MIN_ANALYZE_MS = 1200;

export function MealScreen() {
  const { t, asOf, bump, showToast } = useTerrain();
  const nav = useNav();
  const [stage, setStage] = useState<Stage>('camera');
  const [capture, setCapture] = useState<Capture | null>(null);
  const [items, setItems] = useState<MealItem[]>([]);
  const [confidence, setConfidence] = useState<Confidence>(null);
  const [manualOn, setManualOn] = useState(false);
  const [editIdx, setEditIdx] = useState(-1);
  const run = useRef(0);
  useEffect(() => () => { run.current++; }, []);

  const analyze = async (c: Capture) => {
    const id = ++run.current; setStage('analyzing'); setCapture(c);
    const started = Date.now();
    let result: { ok: true; items: MealItem[]; confidence: Meal['confidence'] } | { ok: false };
    try {
      const r = await t.meals.estimate({ base64: c.base64, mime: 'image/jpeg' });
      result = r.ok ? { ok: true, items: toMealItems(r.estimate), confidence: r.estimate.confidence } : { ok: false };
    } catch { result = { ok: false }; }
    const wait = Math.max(0, MIN_ANALYZE_MS - (Date.now() - started));
    setTimeout(() => {
      if (id !== run.current) return;
      if (result.ok) { setItems(result.items); setConfidence(result.confidence); setEditIdx(-1); setStage('estimate'); }
      else { setItems([]); setConfidence(null); setStage('fail'); }
    }, wait);
  };

  const retry = () => { run.current++; setManualOn(false); setEditIdx(-1); setStage('camera'); };
  const addManual = (it: MealItem) => {
    setItems((xs) => [...xs, it]); setManualOn(false);
    if (stage === 'fail') { setConfidence('manual'); setStage('estimate'); }
  };
  const setQty = (i: number, d: number) => setItems((xs) => xs.map((it, j) => (j === i ? rescaleItem(it, +(it.portionQty + d).toFixed(2)) : it)));
  const remove = (i: number) => { setItems((xs) => xs.filter((_, j) => j !== i)); setEditIdx(-1); };
  const discard = () => { run.current++; nav.pop(); };
  const save = () => {
    const conf: Meal['confidence'] = confidence === 'manual' ? null : confidence;
    t.meals.saveMeal({ items, imageUri: capture?.uri ?? FIXTURE_URI, confidence: conf }, asOf());
    bump(); showToast('Meal saved · totals computed on device'); nav.pop();
  };

  if (stage === 'camera') return <View style={{ flex: 1, backgroundColor: '#000' }}><CameraStage onCapture={analyze} onClose={discard} /></View>;

  const totals = mealTotals(items);
  const photo = capture?.uri && capture.uri !== FIXTURE_URI ? { uri: capture.uri } : mealImageSource(FIXTURE_URI);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <StatusBarFake />
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} keyboardShouldPersistTaps="handled" testID="meal">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn name="chevronLeft" label="Back" onPress={discard} />
          <Display size={22} lh={24}>Meal photo</Display>
        </View>

        <View style={{ height: 150, borderRadius: 8, borderWidth: 1, borderColor: color.border, overflow: 'hidden' }}>
          <Image source={photo} resizeMode="cover" style={{ width: '100%', height: '100%' }} accessibilityLabel="Meal photo" accessibilityIgnoresInvertColors />
          {stage === 'analyzing' ? (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.scrim, alignItems: 'center', justifyContent: 'center', gap: 10 }} accessibilityLabel="Nora is looking at your plate…">
              <Spinner size={24} border={3} />
              <Small c={color.text2}>Nora is looking at your plate…</Small>
            </View>
          ) : null}
        </View>

        {stage === 'fail' ? (
          <View style={card} testID="meal-fail">
            <Semi size={14}>Couldn't read the photo</Semi>
            <Body size={13} lh={19.5} c={color.text3} style={{ marginTop: 4 }}>No estimate this time — add the meal by hand instead.</Body>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Btn label="Retry photo" kind="secondary" size="sm" style={{ flex: 1, paddingVertical: 10 }} onPress={retry} />
              <Btn label="Enter manually" size="sm" style={{ flex: 1, paddingVertical: 10 }} onPress={() => setManualOn(true)} />
            </View>
          </View>
        ) : null}

        {manualOn && stage !== 'analyzing' ? <ManualEntry onAdd={addManual} /> : null}

        {stage === 'estimate' ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Label c={color.orange} style={{ fontFamily: font.bodyBold, letterSpacing: 0.9 }}>Estimates, not measurements</Label>
              <Tiny>confidence: <Bold size={11} lh={15} c={color.yellow}>{confidence ?? '—'}</Bold></Tiny>
            </View>
            <View style={{ gap: 8 }}>
              {items.map((m, i) => {
                const editing = editIdx === i;
                const portion = `${m.portionEstimate}${m.portionQty !== 1 ? ` ×${m.portionQty}` : ''}`;
                return (
                  <View key={`${i}-${m.name}`} style={[card, { paddingVertical: 12, paddingHorizontal: 14 }]} testID={`meal-item-${i}`}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Semi size={14}>{m.name}</Semi>
                        <Small style={{ marginTop: 2 }}>{portion} · ~{fmtNum(m.caloriesEst)} kcal</Small>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 3 }}>
                          <Pill>{fmtNum(m.proteinG)} g protein</Pill>
                          <Pill>{fmtNum(m.carbsG)} g carbs</Pill>
                          <Pill>{fmtNum(m.fatG)} g fat</Pill>
                        </View>
                      </View>
                      <Pressable accessibilityRole="button" accessibilityLabel={editing ? 'Done editing' : `Edit ${m.name}`} onPress={() => setEditIdx(editing ? -1 : i)} style={({ pressed }) => [{ borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: pressed ? color.surface2 : 'transparent' }]}>
                        <Semi size={12} lh={16} c={color.text2}>{editing ? 'Done' : 'Edit'}</Semi>
                      </Pressable>
                      <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${m.name}`} onPress={() => remove(i)} style={{ padding: 4 }}><Icon name="x" size={15} color={color.text3} /></Pressable>
                    </View>
                    {editing ? (
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: color.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Label style={{ letterSpacing: 0.66 }}>Portion</Label>
                        <StepBtn sign="−" size={30} onPress={() => setQty(i, -0.25)} disabled={m.portionQty <= 0.25} />
                        <Numeral size={16} lh={20} style={{ minWidth: 56, textAlign: 'center' }}>{portion}</Numeral>
                        <StepBtn sign="+" size={30} onPress={() => setQty(i, 0.25)} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
            {!manualOn ? (
              <Pressable accessibilityRole="button" onPress={() => setManualOn(true)} testID="meal-add-item" style={({ pressed }) => [{ borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: 8, paddingVertical: 11, alignItems: 'center', backgroundColor: pressed ? color.surface : 'transparent' }]}>
                <Semi size={13} lh={18} c={color.text2}>+ Add item</Semi>
              </Pressable>
            ) : null}
            <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 }} testID="meal-total">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Label style={{ letterSpacing: 0.9 }}>Meal total</Label>
                <Numeral size={26} lh={28}>~{fmtNum(totals.kcal)} <Small style={{ fontFamily: font.body }}>kcal</Small></Numeral>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: color.border }}>
                <TotalCol value={totals.proteinG} label="Protein" />
                <TotalCol value={totals.carbsG} label="Carbs" mid />
                <TotalCol value={totals.fatG} label="Fat" />
              </View>
              <Tiny style={{ marginTop: 10 }}>Totals computed on your phone from the items above — never taken from the model.</Tiny>
            </View>
          </>
        ) : null}
      </ScrollView>

      {stage === 'estimate' ? (
        <View style={{ backgroundColor: color.bg, paddingTop: 10, paddingBottom: 4, paddingHorizontal: 18, flexDirection: 'row', gap: 8, borderTopWidth: 1, borderColor: color.border }}>
          <Btn label="Discard" kind="secondary" style={{ flex: 1, paddingVertical: 14, backgroundColor: color.surface }} onPress={discard} testID="meal-discard" />
          <Btn label="Save meal" style={{ flex: 2, paddingVertical: 14 }} onPress={save} disabled={!items.length} testID="meal-save" />
        </View>
      ) : null}
    </View>
  );
}

const card = { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, padding: 16 } as const;

function Pill({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 }}><Tiny>{children}</Tiny></View>;
}
function TotalCol({ value, label, mid }: { value: number; label: string; mid?: boolean }) {
  return (
    <View style={[{ flex: 1, alignItems: 'center' }, mid ? { borderLeftWidth: 1, borderRightWidth: 1, borderColor: color.border } : null]}>
      <Numeral size={17} lh={20}>{fmtNum(value)} g</Numeral>
      <Label size={10} style={{ marginTop: 2, letterSpacing: 0.7 }}>{label}</Label>
    </View>
  );
}
