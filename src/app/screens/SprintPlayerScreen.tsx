// Sprint player (PRD R36–R39): colour-coded stages, large countdown, auto-advance with Pause/Resume and Skip stage.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { buildSprintStages, type StageKind } from '../../domain/sprint';
import { color, font } from '../../theme/tokens';
import { Display, Numeral } from '../ui/text';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';
import { EndSheet, ExitSheet, fmtClock } from './player/sheets';

const BG_INDEX: Record<StageKind, number> = { warm: 0, cool: 0, sprint: 1, rec: 2 };

export function SprintPlayerScreen({ activityId }: { activityId: string }) {
  const { t, bump, asOf, showToast } = useTerrain();
  const nav = useNav();
  const a = t.repo.getActivity(activityId);
  const intervals = a?.intervals ?? 6;
  const stages = useMemo(() => buildSprintStages(intervals), [intervals]);

  const [idx, setIdx] = useState(0);
  const [remain, setRemain] = useState(stages[0].seconds);
  const [running, setRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [sheet, setSheet] = useState<null | 'exit' | 'end'>(null);
  const idxRef = useRef(idx); idxRef.current = idx;
  const remainRef = useRef(remain); remainRef.current = remain;

  // Timer-driven auto-advance (R38); paused while a sheet is open.
  useEffect(() => {
    if (!running || sheet) return;
    const id = setInterval(() => {
      const r = remainRef.current, i = idxRef.current;
      setElapsed((s) => s + 1);
      if (r > 1) setRemain(r - 1);
      else if (i < stages.length - 1) { setIdx(i + 1); setRemain(stages[i + 1].seconds); }
      else { setRunning(false); setSheet('end'); }
    }, 1000);
    return () => clearInterval(id);
  }, [running, sheet, stages]);

  // Stage colour (R36): warm/cool → bg, sprint → orange, recovery → deep green.
  const stage = stages[idx];
  const bgAnim = useRef(new Animated.Value(BG_INDEX[stage.kind])).current;
  useEffect(() => { Animated.timing(bgAnim, { toValue: BG_INDEX[stage.kind], duration: 300, useNativeDriver: false }).start(); }, [stage.kind, bgAnim]);
  const bg = bgAnim.interpolate({ inputRange: [0, 1, 2], outputRange: [color.bg, color.orange, color.recoveryGreen] });

  const skip = useCallback(() => { const n = Math.min(idx + 1, stages.length - 1); setIdx(n); setRemain(stages[n].seconds); }, [idx, stages]);

  const sprintsDone = stages.slice(0, idx).filter((s) => s.kind === 'sprint').length;
  const minutes = () => Math.round(elapsed / 60);
  const savePartial = () => {
    t.calendar.saveSessionResult({ activityId, outcome: 'done', doneCount: sprintsDone, totalCount: intervals, minutes: minutes(), loggedAt: asOf() });
    bump(); setSheet(null); showToast(`Saved · ${idx} sets recorded`); nav.setTab('calendar');
  };
  const discard = () => { t.calendar.discardSession(activityId); bump(); setSheet(null); nav.setTab('calendar'); };
  const finish = (p: { difficulty?: number; pain: boolean; painWhere?: string; note?: string }) => {
    t.calendar.saveSessionResult({ activityId, outcome: 'done', doneCount: intervals, totalCount: intervals, minutes: minutes(), difficulty: p.difficulty, pain: p.pain, painWhere: p.painWhere, note: p.note, loggedAt: asOf() });
    bump(); setSheet(null); showToast('Session saved · Nora will factor it in'); nav.setTab('calendar');
  };

  if (!a) return <View style={{ flex: 1, backgroundColor: color.bg }} />;

  return (
    <Animated.View style={{ flex: 1, backgroundColor: bg }}>
      <StatusBarFake light />
      <View style={{ paddingVertical: 8, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Exit session" onPress={() => setSheet('exit')} style={{ width: 32, height: 32, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="x" size={16} color="#fff" />
        </Pressable>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>{`Sprint session · ${idx + 1} / ${stages.length} stages`}</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 6 }}>
        <Display size={26} lh={26} c="rgba(255,255,255,0.85)" style={{ textAlign: 'center' }}>{stage.label}</Display>
        <Numeral size={118} lh={118 * 0.95} c="#fff" style={{ textAlign: 'center' }}>{fmtClock(remain)}</Numeral>
        <Text style={{ maxWidth: 290, fontFamily: font.bodySemi, fontSize: 17, lineHeight: 17 * 1.45, color: 'rgba(255,255,255,0.92)', textAlign: 'center' }}>{stage.purpose}</Text>
        <Text style={{ fontFamily: font.body, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.65)', marginTop: 2, textAlign: 'center' }}>{stage.safety}</Text>
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', gap: 4 }}>
        {stages.map((_, i) => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < idx ? 'rgba(255,255,255,0.9)' : i === idx ? '#fff' : 'rgba(255,255,255,0.25)' }} />)}
      </View>
      <View style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 24, flexDirection: 'row', gap: 10 }}>
        <SprintBtn label={running ? 'Pause' : 'Resume'} onPress={() => setRunning((r) => !r)} />
        <SprintBtn label="Skip stage" onPress={skip} />
      </View>

      <ExitSheet open={sheet === 'exit'} doneSets={idx} onSave={savePartial} onDiscard={discard} onKeep={() => setSheet(null)} />
      <EndSheet open={sheet === 'end'} onClose={() => setSheet(null)} onFinish={finish} />
    </Animated.View>
  );
}

function SprintBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 6, paddingVertical: 16, alignItems: 'center' }, pressed ? { opacity: 0.85 } : null]}>
      <Text style={{ fontFamily: font.bodyBold, fontSize: 16, color: '#fff' }}>{label}</Text>
    </Pressable>
  );
}
