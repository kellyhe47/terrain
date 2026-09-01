// Gym player (PRD R30–R35, R80–R82): full-bleed looping video, gestural navigation, swipe-up set panel, rest timer.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { useReduceMotion } from '../hooks';
import type { Phase, SetLog } from '../../domain/types';
import { color, font } from '../../theme/tokens';
import { Display, Numeral, Semi, Tiny } from '../ui/text';
import { Btn } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { media } from '../ui/assets';

const sessionCache = new Map<string, { idx: number; done: Record<string, boolean>; vals: Record<string, { w: number; r: number }>; elapsed: number; rest: number }>();
import { EndSheet, ExitSheet, fmtClock } from './player/sheets';

const PHASE_LABEL: Record<Phase, string> = { warmup: 'Warm-up', main: 'Main', cooldown: 'Cooldown' };
const REST_SECONDS = 90;
const WEB = Platform.OS === 'web';
const key = (e: number, i: number) => `${e}-${i}`;

export function GymPlayerScreen({ activityId }: { activityId: string }) {
  const { t, bump, asOf, showToast } = useTerrain();
  const nav = useNav();
  const reduceMotion = useReduceMotion();
  const a = t.repo.getActivity(activityId);
  const exercises = useMemo(() => (a?.exercises ?? []).map((p) => ({ ...p, lib: t.library.get(p.exerciseId) })), [a, t]);

  const cached = sessionCache.get(activityId);
  const [idx, setIdx] = useState(cached?.idx ?? 0);
  const [done, setDone] = useState<Record<string, boolean>>(cached?.done ?? {});
  const [vals, setVals] = useState<Record<string, { w: number; r: number }>>(cached?.vals ?? {});
  const [rest, setRest] = useState(cached?.rest ?? 0);
  const [elapsed, setElapsed] = useState(cached?.elapsed ?? 0);
  // Keep the in-progress session in a module cache so pushing the Form video screen (which unmounts this one) never resets it (R20/R31).
  useEffect(() => { sessionCache.set(activityId, { idx, done, vals, elapsed, rest }); }, [activityId, idx, done, vals, elapsed, rest]);
  const [panel, setPanel] = useState(false);
  const [sheet, setSheet] = useState<null | 'exit' | 'end'>(null);

  // Video background (R30, R81).
  const player = useVideoPlayer(media.gymLoop, (p) => { p.loop = true; p.muted = true; p.play(); });
  useEffect(() => { try { if (reduceMotion) player.pause(); else player.play(); } catch {} }, [reduceMotion, player]);

  // Clock + rest timer tick, paused while a sheet is open (design behaviour).
  useEffect(() => {
    if (sheet) return;
    const id = setInterval(() => { setElapsed((s) => s + 1); setRest((r) => (r > 0 ? r - 1 : 0)); }, 1000);
    return () => clearInterval(id);
  }, [sheet]);

  // Panel slide + scrim.
  const anim = useRef(new Animated.Value(0)).current;
  const [panelH, setPanelH] = useState(700);
  useEffect(() => { Animated.timing(anim, { toValue: panel ? 1 : 0, duration: 180, useNativeDriver: !WEB }).start(); }, [panel, anim]);

  const count = exercises.length;
  const cur = exercises[idx];
  const doneSets = Object.values(done).filter(Boolean).length;

  const goTo = useCallback((n: number) => { setIdx(n); setRest(0); setPanel(false); }, []);
  const advance = useCallback(() => { if (idx < count - 1) goTo(idx + 1); else setSheet('end'); }, [idx, count, goTo]);
  const back = useCallback(() => { if (idx > 0) goTo(idx - 1); }, [idx, goTo]);

  // Gesture layer (R80): tap left 40% = previous, right 60% = next, swipe up = set panel.
  const layerW = useRef(390);
  const layerX = useRef(0);
  const layerRef = useRef<View>(null);
  const startX = useRef(0);
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e, g) => { const lx = e.nativeEvent.locationX; startX.current = typeof lx === 'number' && !Number.isNaN(lx) ? lx : g.x0 - layerX.current; },
    onPanResponderRelease: (_e, g) => {
      if (g.dy < -40 && Math.abs(g.dy) > Math.abs(g.dx)) { setPanel(true); return; }
      if (Math.abs(g.dx) < 12 && Math.abs(g.dy) < 12) {
        const frac = startX.current / Math.max(1, layerW.current);
        if (frac < 0.4) back(); else advance();
      }
    },
  }), [back, advance]);

  if (!a || !cur) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  const name = cur.lib?.name ?? cur.exerciseId;
  const cue = cur.lib?.cue ?? '';
  const nextIsCooldown = idx < count - 1 && exercises[idx + 1].phase === 'cooldown';
  const advanceLabel = nextIsCooldown ? 'Cooldown' : 'Next';
  const firstUndone = Array.from({ length: cur.sets }, (_, j) => j).find((j) => !done[key(idx, j)]);

  const valFor = (k: string) => vals[k] ?? { w: cur.weightLb, r: cur.reps };
  const step = (k: string, f: 'w' | 'r', d: number) => setVals((v) => { const cv = v[k] ?? { w: cur.weightLb, r: cur.reps }; const min = f === 'w' ? 0 : 1; return { ...v, [k]: { ...cv, [f]: Math.max(min, +(cv[f] + d).toFixed(1)) } }; });
  const toggle = (k: string) => { const was = !!done[k]; setDone((d) => ({ ...d, [k]: !was })); if (!was) setRest(REST_SECONDS); };

  const collectSets = (allDone = false): SetLog[] => exercises.flatMap((ex, e) => Array.from({ length: ex.sets }, (_, i) => { const k = key(e, i); const v = vals[k] ?? { w: ex.weightLb, r: ex.reps }; return { exerciseId: ex.exerciseId, setIndex: i, weightLb: v.w, reps: v.r, done: allDone || !!done[k] }; }));
  const exercisesDone = () => exercises.filter((ex, e) => Array.from({ length: ex.sets }, (_, i) => !!done[key(e, i)]).some(Boolean)).length;
  const minutes = () => Math.round(elapsed / 60);

  const savePartial = () => {
    t.calendar.saveSessionResult({ activityId, outcome: 'done', doneCount: exercisesDone(), totalCount: count, minutes: minutes(), sets: collectSets(), loggedAt: asOf() });
    sessionCache.delete(activityId); bump(); setSheet(null); showToast(`Saved · ${doneSets} ${doneSets === 1 ? 'set' : 'sets'} recorded`); nav.setTab('calendar');
  };
  const discard = () => { t.calendar.discardSession(activityId); sessionCache.delete(activityId); bump(); setSheet(null); nav.setTab('calendar'); };
  const finish = (p: { difficulty?: number; pain: boolean; painWhere?: string; note?: string }) => {
    const dc = exercisesDone();
    // Finish → marks completed (R32): with nothing ticked, every prescribed set counts as done so the detail table agrees with the calendar (R24a).
    t.calendar.saveSessionResult({ activityId, outcome: 'done', doneCount: dc > 0 ? dc : count, totalCount: count, minutes: minutes(), difficulty: p.difficulty, pain: p.pain, painWhere: p.painWhere, note: p.note, sets: collectSets(dc === 0), loggedAt: asOf() });
    sessionCache.delete(activityId); bump(); setSheet(null); showToast('Session saved · Nora will factor it in'); nav.setTab('calendar');
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [panelH + 24, 0] });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBarFake light />
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
        {!reduceMotion ? <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /> : null}

        {/* Gesture layer (R80) */}
        <View ref={layerRef} {...pan.panHandlers} onLayout={(e) => { layerW.current = e.nativeEvent.layout.width; layerRef.current?.measureInWindow?.((x) => { layerX.current = x; }); }} style={[StyleSheet.absoluteFill, { zIndex: 1 }]} accessibilityLabel="Tap left for previous exercise, right for next, swipe up to log sets" />

        {/* Top overlay (R30) */}
        <Pressable onPress={() => setPanel(true)} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2 }}>
          <LinearGradient colors={['rgba(0,0,0,0.92)', 'rgba(0,0,0,0.78)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']} locations={[0, 0.4, 0.75, 1]} style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {exercises.map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < idx ? color.orange : i === idx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.28)' }} />)}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
              <Text style={{ fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>{`${PHASE_LABEL[cur.phase]} · Exercise ${idx + 1} of ${count}`}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Numeral size={15} lh={18} c="rgba(255,255,255,0.8)">{fmtClock(elapsed)}</Numeral>
                <Pressable accessibilityRole="button" accessibilityLabel="Close session" onPress={() => setSheet('exit')} style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={15} color="#fff" />
                </Pressable>
              </View>
            </View>
            <Display size={34} lh={34 * 0.95} c="#fff" style={{ marginTop: 10 }}>{name}</Display>
            <Text style={{ marginTop: 6, fontFamily: font.body, fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.78)', maxWidth: 300 }}>
              <Text style={{ color: color.orange, fontFamily: font.bodySemi }}>Nora:</Text>{` ${cue}`}
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Numeral size={15} lh={18} c="rgba(255,255,255,0.9)">{`${doneSets} / ${cur.sets}`}</Numeral>
              <Text style={{ fontFamily: font.bodySemi, fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>sets logged</Text>
            </View>
          </LinearGradient>
        </Pressable>

        {/* Rest timer (R31) */}
        {rest > 0 ? (
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 88, zIndex: 3, backgroundColor: color.orange, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase', color: color.textOnOrange }}>Rest</Text>
            <Numeral size={26} lh={26} c={color.textOnOrange}>{fmtClock(rest)}</Numeral>
            <Pressable accessibilityRole="button" onPress={() => setRest(0)} style={{ borderWidth: 1, borderColor: 'rgba(255,246,242,0.4)', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 11 }}>
              <Semi c={color.textOnOrange} size={12}>Skip</Semi>
            </Pressable>
          </View>
        ) : null}

        {/* Bottom hint (R80) */}
        {!panel ? (
          <Pressable onPress={() => setPanel(true)} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 2 }}>
            <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']} style={{ paddingTop: 26, paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center', gap: 8 }}>
              <Icon name="chevronUp" size={18} color="rgba(255,255,255,0.85)" />
              <Text style={{ fontFamily: font.bodySemi, fontSize: 12, letterSpacing: 0.48, color: 'rgba(255,255,255,0.85)' }}>Slide up to log sets</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {/* Scrim */}
        <Animated.View pointerEvents={panel ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { zIndex: 3, backgroundColor: 'rgba(0,0,0,0.55)', opacity: anim }]}>
          <Pressable accessibilityLabel="Close set panel" onPress={() => setPanel(false)} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* Set panel (R31) */}
        <Animated.View pointerEvents={panel ? 'auto' : 'none'} onLayout={(e) => setPanelH(e.nativeEvent.layout.height)}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 4, maxHeight: '78%', backgroundColor: color.surface, borderTopWidth: 1, borderColor: color.borderStrong, borderTopLeftRadius: 14, borderTopRightRadius: 14, transform: [{ translateY }] }}>
          <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 18, gap: 10 }} showsVerticalScrollIndicator={false}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close set panel" onPress={() => setPanel(false)} style={{ alignSelf: 'center', paddingTop: 4, paddingBottom: 2, paddingHorizontal: 20 }}>
              <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: color.borderStrong }} />
            </Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Display size={18} lh={18} style={{ flex: 1 }}>{name}</Display>
              <Pressable accessibilityRole="button" onPress={() => nav.push({ name: 'formVideo', exerciseId: cur.exerciseId })} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: color.borderStrong, backgroundColor: pressed ? color.surface3 : color.surface2, borderRadius: 6, paddingVertical: 7, paddingHorizontal: 11 }]}>
                <Icon name="play" size={12} color={color.text1} />
                <Semi size={12}>Form video</Semi>
              </Pressable>
            </View>
            <View style={{ gap: 8 }}>
              {Array.from({ length: cur.sets }, (_, i) => {
                const k = key(idx, i); const isDone = !!done[k]; const active = !isDone && i === firstUndone; const v = valFor(k);
                return (
                  <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: active ? color.orange : color.border, opacity: isDone ? 0.65 : 1 }}>
                    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: isDone }} accessibilityLabel={`Set ${i + 1} done`} onPress={() => toggle(k)}
                      style={[{ width: 30, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' }, isDone ? { backgroundColor: color.green } : { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.borderStrong }]}>
                      {isDone ? <Icon name="check" size={15} color="#0B0B0B" strokeWidth={3} /> : null}
                    </Pressable>
                    <Semi size={13} style={{ width: 44 }}>{`Set ${i + 1}`}</Semi>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <Step sign="−" label="Less weight" hidden={isDone} onPress={() => step(k, 'w', -5)} />
                      <View style={{ minWidth: 58, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                        <Numeral size={18} lh={20}>{String(v.w)}</Numeral>
                        <Tiny>lbs</Tiny>
                      </View>
                      <Step sign="+" label="More weight" hidden={isDone} onPress={() => step(k, 'w', 5)} />
                      <Text style={{ color: color.text3, fontSize: 13, fontFamily: font.body, paddingHorizontal: 2 }}>×</Text>
                      <Step sign="−" label="Fewer reps" hidden={isDone} onPress={() => step(k, 'r', -1)} />
                      <Numeral size={18} lh={20} style={{ minWidth: 24, textAlign: 'center' }}>{String(v.r)}</Numeral>
                      <Step sign="+" label="More reps" hidden={isDone} onPress={() => step(k, 'r', 1)} />
                    </View>
                  </View>
                );
              })}
            </View>
            <Btn label={advanceLabel} kind="primary" size="lg" onPress={advance} />
            <Pressable accessibilityRole="button" onPress={() => setSheet('end')} style={({ pressed }) => [{ paddingVertical: 6, alignItems: 'center' }, pressed ? { opacity: 0.8 } : null]}>
              <Semi c={color.text3} size={13}>End session</Semi>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>

      <ExitSheet open={sheet === 'exit'} doneSets={doneSets} onSave={savePartial} onDiscard={discard} onKeep={() => setSheet(null)} />
      <EndSheet open={sheet === 'end'} onClose={() => setSheet(null)} onFinish={finish} />
    </View>
  );
}

function Step({ sign, onPress, hidden, label }: { sign: '−' | '+'; onPress: () => void; hidden: boolean; label: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={hidden} onPress={onPress}
      style={({ pressed }) => [{ width: 26, height: 26, borderRadius: 6, borderWidth: 1, borderColor: color.border, backgroundColor: color.surface2, alignItems: 'center', justifyContent: 'center', opacity: hidden ? 0 : 1 }, pressed ? { transform: [{ scale: 0.95 }] } : null]}>
      <Text style={{ color: color.text2, fontSize: 14, lineHeight: 16, fontFamily: font.body }}>{sign}</Text>
    </Pressable>
  );
}
