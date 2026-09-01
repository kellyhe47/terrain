// Progress (PRD §13 R49–R52): readiness trend, consistency, signal sparklines, training load, PRs, workout history.
// Every figure comes from the repo through src/domain/progress.ts; nothing is typed in.
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { addDays, dayOf, fmtDowMonthDay, fmtMonthDay } from '../../domain/dates';
import { avgReadiness, consistency, readinessTrend, signalTrends, trainingLoad14, workoutHistory, type SignalTrend } from '../../domain/progress';
import type { CalendarItem } from '../../domain/calendar';
import type { PRKind } from '../../domain/types';
import { color, font } from '../../theme/tokens';
import { Display, Label, Numeral, Semi, Small, Tiny } from '../ui/text';
import { Card, IconBtn, Sheet, Btn, Segmented, StepBtn } from '../ui/primitives';
import { Icon } from '../ui/icons';

const TREND_W = 320, TREND_H = 72;
const SPARK_W = 200, SPARK_H = 26;

/** Map a series onto an SVG polyline `points` string. Null values are skipped (the line joins across them). */
function polyPoints(values: Array<number | null>, w: number, h: number, yMin: number, yMax: number, padY: number): string {
  const n = values.length; if (!n) return '';
  const span = yMax - yMin || 1;
  const pts: string[] = [];
  values.forEach((v, i) => {
    if (v == null) return;
    const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
    const y = h - padY - ((v - yMin) / span) * (h - padY * 2);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  });
  return pts.join(' ');
}

const pill = (active: boolean) => ({ borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, backgroundColor: active ? color.orange : 'transparent', borderWidth: 1, borderColor: active ? color.orange : color.border });

export function ProgressScreen() {
  const { t, version, asOf, bump, showToast } = useTerrain();
  const nav = useNav();
  const today = dayOf(asOf());
  const [range, setRange] = useState<14 | 30>(14);
  const [prOpen, setPrOpen] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const trend = useMemo(() => readinessTrend(t.repo, today, range), [t, today, range, version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => ({
    cons: consistency(t.repo, today), avg: avgReadiness(t.repo, today, 14), sigs: signalTrends(t.repo, today),
    load: trainingLoad14(t.repo, today), prs: t.repo.listPRs(), history: workoutHistory(t.repo, today, 30),
  }), [t, today, version]);

  const scores = trend.map((p) => p.score).filter((v): v is number => v != null);
  const yMin = scores.length ? Math.max(0, Math.min(...scores) - 8) : 0, yMax = scores.length ? Math.min(100, Math.max(...scores) + 8) : 100;
  const trendPts = polyPoints(trend.map((p) => p.score), TREND_W, TREND_H, yMin, yMax, 6);
  const baselineY = TREND_H - 6 - ((70 - yMin) / ((yMax - yMin) || 1)) * (TREND_H - 12); // the green band threshold (R3)
  const loadMax = Math.max(0, ...data.load.map((d) => d.load));
  const loadNonZero = data.load.filter((d) => d.load > 0);
  const loadMean = loadNonZero.length ? loadNonZero.reduce((a, d) => a + d.load, 0) / loadNonZero.length : 0;
  const loadStatus = loadMax === 0 ? 'No sessions in the last 14 days' : loadMax <= 1.5 * loadMean ? 'Peaks in range — no overload risk' : 'Heavy stretch — watch recovery';

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} testID="progress">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Display size={26} lh={26}>Progress</Display>
          <IconBtn name="gear" size={36} label="Settings" onPress={() => nav.push({ name: 'settings' })} />
        </View>

        {/* Readiness trend */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Readiness trend</Label>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {([14, 30] as const).map((d) => (
                <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: range === d }} onPress={() => setRange(d)} style={pill(range === d)}>
                  <Semi c={range === d ? color.textOnOrange : color.text3} size={11} lh={14}>{d}d</Semi>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ marginTop: 10, height: TREND_H }} accessibilityLabel={`Readiness trend, last ${range} days`}>
            <Svg width="100%" height={TREND_H} viewBox={`0 0 ${TREND_W} ${TREND_H}`} preserveAspectRatio="none">
              {trendPts ? <Polyline points={trendPts} fill="none" stroke={color.orange} strokeWidth={2} /> : null}
              <Line x1={0} y1={Math.max(2, Math.min(TREND_H - 2, baselineY))} x2={TREND_W} y2={Math.max(2, Math.min(TREND_H - 2, baselineY))} stroke={color.border} strokeDasharray="3 4" />
            </Svg>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Tiny>{fmtMonthDay(trend[0]?.date ?? today)}</Tiny><Tiny>today</Tiny>
          </View>
        </Card>

        {/* Stat cards */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Card style={{ flex: 1, padding: 14 }}>
            <Label>Consistency</Label>
            <Numeral size={26} lh={30} style={{ marginTop: 6 }}>{data.cons.done}<Numeral c={color.text3} size={16}>/{data.cons.planned}</Numeral></Numeral>
            <Tiny style={{ marginTop: 2 }}>last 3 weeks</Tiny>
          </Card>
          <Card style={{ flex: 1, padding: 14 }}>
            <Label>Avg readiness</Label>
            <Numeral size={26} lh={30} style={{ marginTop: 6 }}>{data.avg == null ? '--' : String(data.avg)}</Numeral>
            <Tiny style={{ marginTop: 2 }}>last 14 days</Tiny>
          </Card>
        </View>

        {/* Signal trends */}
        <Card style={{ gap: 12 }}>
          <Label>Signal trends · 30d</Label>
          {data.sigs.map((s) => <SignalRow key={s.type} s={s} />)}
        </Card>

        {/* Training load */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Label>Training load · 14d</Label>
            <Tiny>sets × intensity, daily</Tiny>
          </View>
          <View style={{ flexDirection: 'row', gap: 3, height: 36, marginTop: 12, alignItems: 'flex-end' }} accessibilityLabel="Training load, last 14 days">
            {data.load.map((d) => {
              const h = loadMax > 0 ? Math.round((d.load / loadMax) * 36) : 0;
              const hot = loadMax > 0 && d.load >= 0.7 * loadMax;
              return <View key={d.date} style={{ flex: 1, height: h, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: hot ? color.orange : color.surface3 }} />;
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Tiny>{fmtMonthDay(data.load[0]?.date ?? today)}</Tiny>
            <Semi c={color.text2} size={11} lh={15}>{loadStatus}</Semi>
            <Tiny>today</Tiny>
          </View>
        </Card>

        {/* Personal records */}
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Personal records</Label>
            <Pressable accessibilityRole="button" accessibilityLabel="Add PR" onPress={() => setPrOpen(true)} style={({ pressed }) => [{ width: 28, height: 28, borderRadius: 6, borderWidth: 1, borderColor: color.borderStrong, backgroundColor: pressed ? color.surface3 : color.surface2, alignItems: 'center', justifyContent: 'center' }]}>
              <Semi c={color.text1} size={16} lh={18}>+</Semi>
            </Pressable>
          </View>
          {data.prs.length === 0 ? (
            <Small size={13} lh={18} style={{ paddingTop: 20, paddingBottom: 8, textAlign: 'center' }}>No records yet — add your first PR.</Small>
          ) : (
            <View style={{ marginTop: 10, gap: 8 }}>
              {data.prs.map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderColor: color.border, paddingBottom: 8 }}>
                  <Semi size={13}>{p.activity}</Semi>
                  <Numeral size={16} lh={20}>{p.result} <Tiny>{fmtMonthDay(p.date)}</Tiny></Numeral>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Workout history */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ paddingTop: 14, paddingHorizontal: 16, paddingBottom: 6 }}><Label>Workout history</Label></View>
          {data.history.length === 0 ? <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}><Small size={13} lh={18}>No sessions logged yet — start one from Today or the calendar.</Small></View> : null}
          {data.history.map((h) => (
            <Pressable key={h.activity.id} accessibilityRole="button" accessibilityLabel={`${h.activity.name}, ${fmtDowMonthDay(h.activity.date)}`} onPress={() => nav.push({ name: 'sessionDetail', activityId: h.activity.id })} style={({ pressed }) => [{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: color.border, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: pressed ? color.surface2 : 'transparent' }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Semi size={13}>{h.activity.name}</Semi>
                <Tiny>{fmtDowMonthDay(h.activity.date)} · {historyStatus(h)}</Tiny>
              </View>
              <Icon name="chevronRight" size={16} color={color.text3} />
            </Pressable>
          ))}
        </Card>
      </ScrollView>

      <PRSheet open={prOpen} today={today} onClose={() => setPrOpen(false)} onSave={(pr) => {
        t.repo.savePR({ id: 'pr_' + Date.now(), ...pr }); bump(); setPrOpen(false); showToast('PR added');
      }} />
    </View>
  );
}

/** "completed" / "skipped", with the run shortfall detail ("completed · 2/3 mi logged") derived from the calendar subtitle. */
function historyStatus(h: CalendarItem): string {
  if (h.status === 'skipped') return 'skipped';
  const m = /^Completed · (\S+) of (\S+) miles logged$/.exec(h.subtitle);
  if (m && m[1] !== m[2]) return `completed · ${m[1]}/${m[2]} mi logged`;
  return h.status === 'completed' ? 'completed' : h.status;
}

function SignalRow({ s }: { s: SignalTrend }) {
  const min = s.points.length ? Math.min(...s.points) : 0, max = s.points.length ? Math.max(...s.points) : 0;
  const pts = polyPoints(s.points, SPARK_W, SPARK_H, min, max, 4);
  const dirColor = s.tone === 'good' ? color.green : s.tone === 'bad' ? color.red : s.type === 'weight' ? color.text2 : color.text3;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Small size={12} c={color.text2} style={{ width: 56 }}>{s.label}</Small>
      <View style={{ flex: 1, height: SPARK_H }} accessibilityLabel={`${s.label} trend`}>
        <Svg width="100%" height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} preserveAspectRatio="none">
          {pts ? <Polyline points={pts} fill="none" stroke={color.text3} strokeWidth={1.5} /> : null}
        </Svg>
      </View>
      <Semi c={dirColor} size={12} lh={16} style={{ width: 70, textAlign: 'right' }}>{s.direction}</Semi>
    </View>
  );
}

// ---- PR entry sheet (R49): result field typed by kind.
const KINDS: Array<{ label: string; kind: PRKind }> = [{ label: 'Lift', kind: 'lift' }, { label: 'Run', kind: 'run' }, { label: 'Sprint', kind: 'sprint' }];
const inputStyle = { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12, color: color.text1, fontFamily: font.body, fontSize: 14 } as const;
const noOutline = { outlineStyle: 'none' } as unknown as Record<string, unknown>;

function PRSheet({ open, today, onClose, onSave }: { open: boolean; today: string; onClose: () => void; onSave: (pr: { activity: string; kind: PRKind; result: string; date: string }) => void }) {
  const [activity, setActivity] = useState('');
  const [kind, setKind] = useState<PRKind>('lift');
  const [weight, setWeight] = useState(135);
  const [reps, setReps] = useState(5);
  const [time, setTime] = useState('');
  const [seconds, setSeconds] = useState('');
  const [date, setDate] = useState(today);
  if (!open) return null;

  const timeOk = /^\d{1,3}:[0-5]\d$/.test(time.trim());
  const secs = parseFloat(seconds);
  const secOk = Number.isFinite(secs) && secs > 0;
  const result = kind === 'lift' ? `${weight} lbs × ${reps}` : kind === 'run' ? time.trim() : secOk ? `${+secs.toFixed(2)} s` : '';
  const valid = activity.trim().length > 0 && (kind === 'lift' || (kind === 'run' ? timeOk : secOk));
  const reset = () => { setActivity(''); setKind('lift'); setWeight(135); setReps(5); setTime(''); setSeconds(''); setDate(today); };
  const close = () => { reset(); onClose(); };

  return (
    <Sheet open={open} onClose={close} title="Add a PR" subtitle="Self-reported — Nora keeps the record">
      <View style={{ marginTop: 14, gap: 12 }}>
        <View>
          <Label size={10} style={{ letterSpacing: 0.8 }}>Activity</Label>
          <TextInput value={activity} onChangeText={setActivity} placeholder="e.g. Bench press" placeholderTextColor={color.text3} accessibilityLabel="Activity name" style={[inputStyle, { marginTop: 6 }, noOutline]} />
        </View>
        <View>
          <Label size={10} style={{ letterSpacing: 0.8 }}>Kind</Label>
          <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <Segmented options={KINDS.map((k) => k.label)} value={KINDS.find((k) => k.kind === kind)!.label} onChange={(v) => setKind(KINDS.find((k) => k.label === v)!.kind)} />
          </View>
        </View>
        {kind === 'lift' ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Stepper label="Weight (lbs)" value={String(weight)} onLess={() => setWeight((w) => Math.max(5, w - 5))} onMore={() => setWeight((w) => w + 5)} />
            <Stepper label="Reps" value={String(reps)} onLess={() => setReps((r) => Math.max(1, r - 1))} onMore={() => setReps((r) => r + 1)} />
          </View>
        ) : kind === 'run' ? (
          <View>
            <Label size={10} style={{ letterSpacing: 0.8 }}>Elapsed time</Label>
            <TextInput value={time} onChangeText={setTime} placeholder="mm:ss" placeholderTextColor={color.text3} keyboardType="numbers-and-punctuation" accessibilityLabel="Elapsed time" style={[inputStyle, { marginTop: 6 }, noOutline]} />
          </View>
        ) : (
          <View>
            <Label size={10} style={{ letterSpacing: 0.8 }}>Seconds</Label>
            <TextInput value={seconds} onChangeText={setSeconds} placeholder="e.g. 13.4" placeholderTextColor={color.text3} keyboardType="decimal-pad" accessibilityLabel="Seconds" style={[inputStyle, { marginTop: 6 }, noOutline]} />
          </View>
        )}
        <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Label size={10} style={{ letterSpacing: 0.8 }}>Date</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <StepBtn sign="−" size={28} onPress={() => setDate((d) => addDays(d, -1))} />
            <Numeral size={18} lh={22}>{date === today ? 'Today' : fmtDowMonthDay(date)}</Numeral>
            <StepBtn sign="+" size={28} disabled={date >= today} onPress={() => setDate((d) => (d < today ? addDays(d, 1) : d))} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Tiny>Result</Tiny>
          <Numeral size={16} lh={20} c={result ? color.text1 : color.text3}>{result || '—'}</Numeral>
        </View>
        <Btn label="Save" size="lg" disabled={!valid} onPress={() => { if (!valid) return; onSave({ activity: activity.trim(), kind, result, date }); reset(); }} />
      </View>
    </Sheet>
  );
}

function Stepper({ label, value, onLess, onMore }: { label: string; value: string; onLess: () => void; onMore: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 12 }}>
      <Label size={10} style={{ letterSpacing: 0.8 }}>{label}</Label>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <StepBtn sign="−" size={28} onPress={onLess} />
        <Numeral size={18} lh={22}>{value}</Numeral>
        <StepBtn sign="+" size={28} onPress={onMore} />
      </View>
    </View>
  );
}

