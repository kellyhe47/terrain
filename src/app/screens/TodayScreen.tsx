import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { readinessFor } from '../../domain/readinessLoader';
import { fallbackExplanation } from '../../domain/readiness';
import { dayMacros } from '../../domain/nutrition';
import { addDays, dayOf, DOW_LONG, dow, fmtMonthDay, fmtNum, fmtTime12 } from '../../domain/dates';
import { toItem } from '../../domain/calendar';
import { sessionSubtitle } from '../../domain/plan';
import { color, font } from '../../theme/tokens';
import { Gauge } from '../ui/gauge';
import { Display, Label, Numeral, Body, Semi, Tiny } from '../ui/text';
import { Btn, Shimmer, Bar } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { media } from '../ui/assets';
import { useReduceMotion } from '../hooks';

type Phase = 'shimmer' | 'stream' | 'done' | 'error';
const W = 'rgba(255,255,255,0.6)';

export function TodayScreen() {
  const { t, version, asOf, bump } = useTerrain();
  const nav = useNav();
  const now = asOf(); const today = dayOf(now);
  const readiness = readinessFor(t.repo, today);
  const signals = t.repo.signalsOn(today);
  const targets = t.repo.getTargets();
  const meals = t.repo.mealsOn(today); const macros = dayMacros(meals);
  const weekAgo = t.repo.signalSeries('weight', addDays(today, -7), addDays(today, -1));
  const delta = signals.weight != null && weekAgo.length ? signals.weight - weekAgo[0].value : null;
  const plans = t.repo.activitiesOn(today).filter((a) => a.source === 'nora');
  const planned = plans.find((a) => !t.repo.getResult(a.id)) ?? plans[0] ?? null; // the session still to do wins over a finished one (R6a)
  const planItem = planned ? toItem(planned, t.repo.getResult(planned.id), today) : null;
  const restReason = t.repo.getPlanWeek(addDays(today, -dow(today)))?.restReason || 'Nothing prescribed today. Walk, stretch, sleep — Nora built the week around it.';
  const reduceMotion = useReduceMotion();

  // R6: explanation phases shimmer → stream → done; deterministic fallback on failure. Score never waits on it.
  const [phase, setPhase] = useState<Phase>('shimmer');
  const [text, setText] = useState('');
  const runId = useRef(0);
  const scoreKey = readiness.kind === 'score' ? `${readiness.score}:${readiness.loggedCount}` : 'none';
  const explain = useCallback(() => {
    if (readiness.kind !== 'score') return;
    const id = ++runId.current; setPhase('shimmer'); setText('');
    let acc = ''; const started = Date.now();
    t.assembler.explainReadiness(readiness, now, (chunk) => { if (id !== runId.current) return; acc += chunk; if (!reduceMotion) { setPhase('stream'); setText(acc); } })
      .then((full) => { if (id !== runId.current) return; const wait = Math.max(0, 600 - (Date.now() - started)); setTimeout(() => { if (id !== runId.current) return; setText(full); setPhase('done'); }, reduceMotion ? wait : 0); })
      .catch(() => { if (id === runId.current) setPhase('error'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreKey, today, reduceMotion, t]);
  useEffect(() => { explain(); }, [explain, version]);

  const insufficient = readiness.kind === 'insufficient';
  const startSession = () => { if (!planned) return; nav.push(planned.type === 'sprint' ? { name: 'sprint', activityId: planned.id } : { name: 'gym', activityId: planned.id }); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <Image source={media.homeScenic} resizeMode="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} accessibilityIgnoresInvertColors />
      <LinearGradient colors={['rgba(11,11,11,0.92)', 'rgba(11,11,11,0.62)', 'rgba(11,11,11,0.55)', 'rgba(11,11,11,0.9)']} locations={[0, 0.42, 0.62, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none" />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5 }} pointerEvents="none"><StatusBarFake light /></View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 20, justifyContent: 'space-between', gap: 16 }} testID="today">
        <View>
          <Label c={W} style={{ fontFamily: font.bodyBold, letterSpacing: 1.1 }}>{DOW_LONG[dow(today)]}</Label>
          <Display c="#fff" size={26} style={{ marginTop: 4 }}>{fmtMonthDay(today)}</Display>
        </View>

        <View style={{ alignItems: 'center', paddingTop: 2 }}>
          <Gauge score={readiness.kind === 'score' ? readiness.score : null} band={readiness.kind === 'score' ? readiness.band : null} />
          <View style={{ marginTop: 14, maxWidth: 300, width: '100%', alignItems: 'center' }}>
            {insufficient ? (
              <>
                <Body c="rgba(255,255,255,0.78)" size={14} lh={22} style={{ textAlign: 'center' }}>No score yet — log a couple of signals and Nora will score your readiness.</Body>
                <Btn label="Log now" onPress={() => nav.setTab('log')} size="sm" style={{ marginTop: 12, paddingHorizontal: 22, paddingVertical: 10 }} />
              </>
            ) : phase === 'shimmer' ? (
              <View style={{ width: '100%', gap: 7, alignItems: 'center' }} accessibilityLabel="Nora is writing"><Shimmer /><Shimmer width="70%" /></View>
            ) : phase === 'error' ? (
              <>
                <Body c="rgba(255,255,255,0.78)" size={14} lh={22} style={{ textAlign: 'center' }}>{readiness.kind === 'score' ? fallbackExplanation(readiness) : ''}</Body>
                <Pressable onPress={explain} style={{ marginTop: 8 }} accessibilityRole="button"><Semi c={color.orange} size={12}>Couldn't reach Nora — retry explanation</Semi></Pressable>
              </>
            ) : (
              <Body c="rgba(255,255,255,0.78)" size={14} lh={22} style={{ textAlign: 'center' }}>
                {text}{phase === 'stream' ? <Cursor reduceMotion={reduceMotion} /> : null}
              </Body>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }} accessibilityLabel="Hero signals">
          <Hero label="Sleep" value={signals.sleep != null ? String(signals.sleep) : '--'} unit="h" />
          <Hero label="Steps" value={signals.steps != null ? fmtNum(signals.steps) : '--'} unit="" />
          <Hero label="Weight" value={signals.weight != null ? String(signals.weight) : '--'} unit="lbs" delta={delta != null ? `${delta < 0 ? '↓' : delta > 0 ? '↑' : '→'} ${Math.abs(delta).toFixed(1)} lbs this week` : undefined} />
          <Hero label="Energy" value={signals.energy != null ? String(signals.energy) : '--'} unit="/ 5" />
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Open Nutrition" onPress={() => nav.push({ name: 'nutrition' })} style={({ pressed }) => [glass, { paddingVertical: 14, paddingHorizontal: 16 }, pressed ? { transform: [{ scale: 0.99 }] } : null]}>
          <Label c="rgba(255,255,255,0.55)">Nutrition</Label>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Semi c="rgba(255,255,255,0.85)" size={12}>Protein</Semi>
                <Numeral c="#fff" size={16} lh={18}>{fmtNum(macros.proteinG)} <Tiny c="rgba(255,255,255,0.5)">/ {fmtNum(targets.protein_g)} g</Tiny></Numeral>
              </View>
              <View style={{ marginTop: 6 }}><Bar pct={(macros.proteinG / targets.protein_g) * 100} track="rgba(255,255,255,0.14)" /></View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Numeral c="#fff" size={16} lh={18}>{fmtNum(macros.kcal)} <Tiny c="rgba(255,255,255,0.5)">kcal</Tiny></Numeral>
              <Label c="rgba(255,255,255,0.5)" size={10} style={{ marginTop: 3, letterSpacing: 0.6 }}>of ~{fmtNum(targets.calories)}</Label>
            </View>
          </View>
        </Pressable>

        {planned && planItem ? (
          <View style={[glass, { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }]} accessibilityLabel="Today's plan">
            <View style={{ flex: 1, minWidth: 0 }}>
              <Label c="rgba(255,255,255,0.55)">Today's plan{planned.startTime ? ` · ${fmtTime12(planned.startTime)}` : ''}</Label>
              <Display c="#fff" size={24} lh={24} style={{ marginTop: 6 }}>{planned.name}</Display>
              <Body c="rgba(255,255,255,0.75)" size={13} lh={18} style={{ marginTop: 6 }}>{planItem.status === 'completed' || planItem.status === 'skipped' || planned.paused ? planItem.subtitle : sessionSubtitle({ minutes: planned.minutes, exercises: planned.exercises, focus: planned.focus, type: planned.type, intervals: planned.intervals })}</Body>
            </View>
            {planItem.startable ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Start session" onPress={startSession} style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 8, backgroundColor: pressed ? color.orangePress : color.orange, alignItems: 'center', justifyContent: 'center' }]}>
                <Icon name="play" size={18} color={color.textOnOrange} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={[glass, { padding: 16 }]} accessibilityLabel="Rest day">
            <Label c="rgba(255,255,255,0.55)">Today's plan</Label>
            <Display c="#fff" size={24} lh={24} style={{ marginTop: 6 }}>Rest — here's why</Display>
            <Body c="rgba(255,255,255,0.75)" size={13} lh={20} style={{ marginTop: 8 }}>{restReason}</Body>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
const glass = { backgroundColor: 'rgba(16,16,16,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 8 } as const;

function Hero({ label, value, unit, delta }: { label: string; value: string; unit: string; delta?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Label c={W} size={10} style={{ fontFamily: font.bodyBold, letterSpacing: 0.8 }}>{label}</Label>
      <Numeral c="#fff" size={22} lh={24}>{value} <Tiny c="rgba(255,255,255,0.55)" style={{ fontFamily: font.bodySemi }}>{unit}</Tiny></Numeral>
      {delta ? <Tiny c={color.orange} size={10} style={{ fontFamily: font.bodyBold }}>{delta}</Tiny> : null}
    </View>
  );
}
function Cursor({ reduceMotion }: { reduceMotion: boolean }) {
  const [on, setOn] = useState(true);
  useEffect(() => { if (reduceMotion) return; const i = setInterval(() => setOn((v) => !v), 500); return () => clearInterval(i); }, [reduceMotion]);
  return <View style={{ width: 7, height: 13, backgroundColor: color.orange, marginLeft: 2, opacity: on ? 1 : 0.45, transform: [{ translateY: 2 }] }} />;
}
