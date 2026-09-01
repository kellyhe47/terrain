// Nutrition (PRD §6 R70–R76): today's macros, micronutrient estimates, supplements, this week, What's missing (Nora), logged meals.
// Everything but the gap narration renders synchronously from the repo (R72a).
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { addDays, dayOf, fmtDowMonthDay, fmtNum, fmtTime12, fmtWeekRange, weekStart } from '../../domain/dates';
import { dayMacros, gaps14, gapsFallbackLine, mealTotals, microEstimates, microTargets, weekStats, type Gaps14, type MicroEstimate, type MicroTarget } from '../../domain/nutrition';
import { MICRO_INFO, type MicroInfo } from '../../seed/nutrientReference';
import type { GapsNarration } from '../../domain/chatSchema';
import type { Meal } from '../../domain/types';
import { color } from '../../theme/tokens';
import { Display, Label, Numeral, Semi, Small, Tiny, Bold } from '../ui/text';
import { Bar, Card, IconBtn, Shimmer } from '../ui/primitives';
import { mealImageSource } from '../ui/assets';

const FILL = 'rgba(255,255,255,0.75)', FILL_WEAK = 'rgba(255,255,255,0.4)', DOT_DIM = 'rgba(255,255,255,0.4)';
const WEAK = 0.6; // matchedShare below this ⇒ weak estimate (R71)

// Module-level narration cache keyed by today + the meals it was computed from, so re-renders never re-call the model.
let gapsCache: { key: string; narration: GapsNarration } | null = null;
type GapsPhase = { kind: 'pending' } | { kind: 'ok'; narration: GapsNarration } | { kind: 'error' };

export function NutritionScreen() {
  const { t, version, asOf, bump } = useTerrain();
  const nav = useNav();
  const today = dayOf(asOf());
  const ws = weekStart(today);
  const targets = t.repo.getTargets();
  const hasTarget = (k: 'fiber_g') => t.repo.hasTarget(k);

  const todayMeals = t.repo.mealsOn(today);
  const macros = dayMacros(todayMeals);
  const micros = microEstimates(todayMeals, t.nutrientRef);
  const mTargets = microTargets(targets, hasTarget);
  const fiber = micros.find((m) => m.key === 'fiber_g')!;
  const fiberWeak = fiber.matchedShare < WEAK;
  const supps = t.repo.listSupplements();
  const taken = t.repo.takenOn(today);
  const week = weekStats(t.repo, ws, today, targets);
  const meals14 = t.repo.mealsBetween(addDays(today, -13), today);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gaps = useMemo(() => gaps14(t.repo, today, targets, t.nutrientRef, hasTarget), [t, today, version]);
  const gapsKey = `${today}|${t.repo.getMeta('seeded_at') ?? ''}|${t.flags.nora}|${gaps.ranked.map((g) => `${g.key}:${g.avgPerDay.toFixed(2)}`).join(',')}|${gaps.onTrack.map((g) => g.key).join(',')}`;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} testID="nutrition">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn name="chevronLeft" size={32} label="Back" onPress={() => nav.pop()} />
          <View>
            <Display size={26} lh={26}>Nutrition</Display>
            <Tiny style={{ marginTop: 2 }}>Week of {fmtWeekRange(ws)}</Tiny>
          </View>
        </View>

        {/* Today's macros (R70) */}
        <Card style={{ paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>Today's macros</Label>
            <Numeral size={16} lh={20}>{fmtNum(macros.kcal)} <Tiny>/ ~{fmtNum(targets.calories)} kcal</Tiny></Numeral>
          </View>
          <View style={{ marginTop: 12, gap: 12 }}>
            <MacroRow label="Protein" value={macros.proteinG} target={targets.protein_g} fill={FILL} />
            <MacroRow label="Carbs" value={macros.carbsG} target={targets.carbs_g} fill={FILL} />
            <MacroRow label="Fat" value={macros.fatG} target={targets.fat_g} fill={FILL} />
            <MacroRow label="Fiber" value={fiber.value} target={targets.fiber_g} fill={fiberWeak ? FILL_WEAK : FILL} />
          </View>
        </Card>

        {/* Micronutrients (R71, R11b) */}
        <Card style={{ paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Micronutrients</Label>
            <Label size={10} style={{ letterSpacing: 0.6 }}>Est. from your log</Label>
          </View>
          <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 12 }}>
            {MICRO_INFO.map((info) => {
              const est = micros.find((m) => m.key === info.key)!; const tg = mTargets.find((m) => m.key === info.key)!;
              return <MicroCell key={info.key} info={info} est={est} tg={tg} />;
            })}
          </View>
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderColor: color.border }}>
            <Tiny lh={16.5}>Estimates from photo logs are rough — trends matter more than single days.</Tiny>
          </View>
        </Card>

        {/* Supplements (R75) */}
        <Card style={{ paddingVertical: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Supplements</Label>
            <Label size={10} style={{ letterSpacing: 0.6 }}>{supps.filter((s) => taken.has(s.id)).length} / {supps.length} taken today</Label>
          </View>
          <View style={{ marginTop: 10 }}>
            {supps.map((s) => <SupplementRow key={s.id} name={s.name} dose={s.dose} on={taken.has(s.id)} onToggle={() => toggleSupp(s.id, !taken.has(s.id))} />)}
          </View>
          <Tiny lh={16.5} style={{ marginTop: 10 }}>Tap to mark taken. Streaks and reminders can come later.</Tiny>
        </Card>

        {/* This week (R73) */}
        <Card style={{ paddingVertical: 14 }}>
          <Label>This week</Label>
          <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Stat value={fmtNum(week.avgProteinG)} unit="g" label="Avg protein / day" />
            <Stat value={fmtNum(week.avgKcal)} unit="kcal" label="Avg kcal / day" />
            <Stat value={String(week.proteinDaysHit)} unit={`/ ${week.loggedDays}`} unitSize={13} label="Protein days hit" />
          </View>
        </Card>

        {/* What's missing (R72) */}
        <GapsCard gaps={gaps} cacheKey={gapsKey} />

        {/* Logged meals (R74) */}
        <MealLog meals={meals14} today={today} />
      </ScrollView>
    </View>
  );

  function toggleSupp(id: string, on: boolean) { t.repo.setTaken(id, today, on); bump(); }
}

/** Grams: one decimal under 10 (matches the micronutrient rows), whole numbers above. */
const fmtG = (n: number) => (n < 10 ? (+n.toFixed(1)).toLocaleString('en-US') : fmtNum(n));

function MacroRow({ label, value, target, fill }: { label: string; value: number; target: number; fill: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Semi size={12}>{label}</Semi>
        <Numeral size={15} lh={19}>{fmtG(value)} g <Tiny>/ {fmtG(target)} g</Tiny></Numeral>
      </View>
      <View style={{ marginTop: 6 }}><Bar pct={target > 0 ? (value / target) * 100 : 0} fill={fill} /></View>
    </View>
  );
}

/** "14 / 30 g", "1.8 / <2.3 g", "820 / 1,000 mg", "6 / 15 µg", "0.4 / 1.6 g" — mg converts to g when the target is ≥ 1,000 mg. */
function fmtMicro(value: number, target: number, info: MicroInfo, ceiling: boolean): string {
  let unit: string = info.unit, v = value, tg = target;
  if (info.unit === 'mg' && target >= 1000) { unit = 'g'; v = value / 1000; tg = target / 1000; }
  const f = (n: number) => (unit === 'g' && n < 10 ? (+n.toFixed(1)).toLocaleString('en-US') : fmtNum(n));
  return `${f(v)} / ${ceiling ? '<' : ''}${f(tg)} ${unit}`;
}

function MicroCell({ info, est, tg }: { info: MicroInfo; est: MicroEstimate; tg: MicroTarget }) {
  const weak = est.matchedShare < WEAK;
  return (
    <View style={{ width: '46%', flexGrow: 1 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Semi size={12} numberOfLines={1} style={{ flexShrink: 1 }}>{info.label}</Semi>
        <Tiny numberOfLines={1} style={{ fontVariant: ['tabular-nums'], flexShrink: 0, marginLeft: 6 }}>{fmtMicro(est.value, tg.target, info, tg.ceiling)}{tg.fromUser ? '' : <Tiny size={9}> ref</Tiny>}</Tiny>
      </View>
      <View style={{ marginTop: 6 }}><Bar pct={tg.target > 0 ? (est.value / tg.target) * 100 : 0} fill={weak ? FILL_WEAK : FILL} height={3} /></View>
    </View>
  );
}

function SupplementRow({ name, dose, on, onToggle }: { name: string; dose: string; on: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${name}, ${on ? 'taken' : 'not yet'}`} onPress={onToggle} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: color.border }, pressed ? { transform: [{ scale: 0.99 }] } : null]}>
      <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? color.orange : 'transparent', borderWidth: on ? 0 : 1, borderColor: color.borderStrong }}>
        {on ? <Bold c={color.textOnOrange} size={12} lh={14}>✓</Bold> : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Semi size={13} lh={18}>{name}</Semi>
        <Tiny style={{ marginTop: 1 }}>{dose}</Tiny>
      </View>
      <Semi c={on ? color.text2 : color.text3} size={11} lh={15}>{on ? 'Taken' : 'Not yet'}</Semi>
    </Pressable>
  );
}

function Stat({ value, unit, unitSize = 11, label }: { value: string; unit: string; unitSize?: number; label: string }) {
  return (
    <View>
      <Numeral size={22} lh={22}>{value} <Tiny size={unitSize}>{unit}</Tiny></Numeral>
      <Label size={10} style={{ letterSpacing: 0.6, marginTop: 4 }}>{label}</Label>
    </View>
  );
}

function GapsCard({ gaps, cacheKey }: { gaps: Gaps14; cacheKey: string }) {
  const { t, asOf } = useTerrain();
  const [phase, setPhase] = useState<GapsPhase>(() => (gapsCache?.key === cacheKey ? { kind: 'ok', narration: gapsCache.narration } : { kind: 'pending' }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (gapsCache?.key === cacheKey) { setPhase({ kind: 'ok', narration: gapsCache.narration }); return; }
    let live = true; setPhase({ kind: 'pending' });
    t.assembler.narrateGaps(gaps, asOf())
      .then((narration) => { gapsCache = { key: cacheKey, narration }; if (live) setPhase({ kind: 'ok', narration }); })
      .catch(() => { if (live) setPhase({ kind: 'error' }); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, attempt, t]);

  return (
    <Card style={{ paddingVertical: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>What's missing</Label>
        <Label size={10} style={{ letterSpacing: 0.6 }}>Nora · last 14 days</Label>
      </View>
      {phase.kind === 'pending' ? (
        <View style={{ marginTop: 12, gap: 12 }} accessibilityLabel="Nora is writing"><Shimmer /><Shimmer width="85%" /><Shimmer width="60%" /></View>
      ) : phase.kind === 'error' ? (
        <View style={{ marginTop: 12 }}>
          <Small size={12} lh={18} c={color.text2}>{gapsFallbackLine(gaps)}</Small>
          <Pressable accessibilityRole="button" onPress={() => setAttempt((n) => n + 1)} style={{ marginTop: 8, alignSelf: 'flex-start' }}><Semi c={color.orange} size={12}>Retry</Semi></Pressable>
        </View>
      ) : (
        <>
          <View style={{ marginTop: 12, gap: 12 }}>
            {phase.narration.items.map((g, i) => (
              <View key={`${g.key}-${i}`} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: i < 2 ? color.orange : DOT_DIM }} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Semi size={13} lh={18}>{g.name}</Semi>
                    <Tiny style={{ fontVariant: ['tabular-nums'] }}>{g.stat}</Tiny>
                  </View>
                  <Small size={12} lh={18} c={color.text2} style={{ marginTop: 2 }}>{g.note}</Small>
                </View>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: color.border }}>
            <Small size={12} lh={18} c={color.text2}>{phase.narration.summary}</Small>
          </View>
        </>
      )}
    </Card>
  );
}

function MealLog({ meals, today }: { meals: Meal[]; today: string }) {
  const days = useMemo(() => {
    const by = new Map<string, Meal[]>();
    for (const m of meals) { const l = by.get(m.date) ?? []; l.push(m); by.set(m.date, l); }
    return [...by.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([date, list]) => ({ date, list: [...list].sort((a, b) => (a.time < b.time ? -1 : 1)), totals: dayMacros(list) }));
  }, [meals]);
  const yesterday = addDays(today, -1);
  const dayLabel = (d: string) => (d === today ? `Today · ${fmtDowMonthDay(d)}` : d === yesterday ? `Yesterday · ${fmtDowMonthDay(d)}` : fmtDowMonthDay(d));
  return (
    <View style={{ gap: 10 }}>
      <Label>Logged meals</Label>
      {days.length === 0 ? <Small size={13} lh={18}>No meals logged in the last 14 days.</Small> : null}
      {days.map((d) => (
        <View key={d.date} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Semi size={12}>{dayLabel(d.date)}</Semi>
            <Tiny style={{ fontVariant: ['tabular-nums'] }}>{fmtNum(d.totals.kcal)} kcal · {fmtNum(d.totals.proteinG)} g protein</Tiny>
          </View>
          {d.list.map((m) => {
            const tot = mealTotals(m.items); const src = mealImageSource(m.imageUri);
            return (
              <Card key={m.id} style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {src ? <Image source={src} resizeMode="cover" style={{ width: 52, height: 52, borderRadius: 6, backgroundColor: color.surface2 }} accessibilityIgnoresInvertColors /> : <View style={{ width: 52, height: 52, borderRadius: 6, backgroundColor: color.surface2 }} />}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Semi size={14} numberOfLines={1}>{m.name}</Semi>
                  <Tiny style={{ marginTop: 2 }}>{fmtTime12(m.time)}</Tiny>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Numeral size={16} lh={20}>{fmtNum(tot.kcal)} <Tiny>kcal</Tiny></Numeral>
                  <Tiny style={{ marginTop: 2 }}>{fmtNum(tot.proteinG)} g protein</Tiny>
                </View>
              </Card>
            );
          })}
        </View>
      ))}
    </View>
  );
}
