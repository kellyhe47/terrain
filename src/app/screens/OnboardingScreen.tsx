// Onboarding (PRD §15, R57–R61). Design: designs/Terrain Onboarding.html — wizard (5 steps) → building → preview | failed.
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { DOW_LONG, DOW_SHORT, dow } from '../../domain/dates';
import { sessionSubtitle } from '../../domain/plan';
import type { Activity, Equipment, Goal, Profile, RecurringPreference } from '../../domain/types';
import { color, font, radius } from '../../theme/tokens';
import { Display, Label, Body, Semi, Small, Tiny } from '../ui/text';
import { Btn, Card, Chip, Spinner, StepBtn } from '../ui/primitives';
import { Icon } from '../ui/icons';
import { StatusBarFake } from '../ui/frame';

type Phase = 'wizard' | 'building' | 'preview' | 'failed';
type FirstWeek = { weekStart: string; activities: Activity[]; summary: string };

const STEPS = [
  { title: 'What are you after?', sub: 'Pick the closest, then say it in your own words — Nora reads both.', tag: 'Goal' },
  { title: 'How much time?', sub: "Be honest — a plan you can keep beats an ambitious one you can't.", tag: 'Availability' },
  { title: 'What do you train with?', sub: 'The plan only prescribes what you can actually do.', tag: 'Equipment' },
  { title: 'What do you enjoy?', sub: 'Nora protects the things you love and plans around them.', tag: 'Activities' },
  { title: 'Anything to work around?', sub: 'Injuries or limits, in plain words. These become hard rules.', tag: 'Injuries' },
];
const GOALS: Goal[] = ['Strength', 'Endurance', 'Lean out', 'General fitness'];
const DAY_OPTIONS = [2, 3, 4, 5, 6];
const MIN_MIN = 20, MAX_MIN = 90, MIN_STEP = 5;
const EQUIPMENT: { label: Equipment; sub: string }[] = [
  { label: 'Commercial gym', sub: 'Full racks, machines, cables' },
  { label: 'Home setup', sub: 'Dumbbells, bands, a bench' },
  { label: 'No equipment', sub: 'Bodyweight only' },
];
const ACTIVITIES = ['Running', 'Pilates', 'Yoga', 'Pickleball', 'Padel', 'Sprint club', 'Swimming'];
const BODY_PARTS = ['knee', 'shoulder', 'back', 'hip', 'ankle', 'wrist', 'elbow', 'neck', 'hamstring', 'calf', 'quad', 'groin', 'foot', 'achilles', 'spine', 'lower back', 'glute', 'hand', 'arm', 'leg'];

/** First body-part word in the injury text, else "limits" (building caption). */
function injuryShortName(text: string): string {
  const lower = text.toLowerCase();
  let best: { idx: number; part: string } | null = null;
  for (const part of BODY_PARTS) { const i = lower.indexOf(part); if (i >= 0 && (!best || i < best.idx)) best = { idx: i, part }; }
  return best ? best.part : 'limits';
}

export function OnboardingScreen() {
  const { t, asOf, bump } = useTerrain();
  const nav = useNav();

  const [phase, setPhase] = useState<Phase>('wizard');
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [goalText, setGoalText] = useState('');
  const [days, setDays] = useState(4);
  const [minutes, setMinutes] = useState(45);
  const [equip, setEquip] = useState<Equipment | null>(null);
  const [acts, setActs] = useState<string[]>([]);
  const [recurring, setRecurring] = useState<RecurringPreference[]>([]);
  const [injuries, setInjuries] = useState('');
  const [result, setResult] = useState<FirstWeek | null>(null);
  const runId = useRef(0);

  const canNext = step === 1 ? goal != null : step === 3 ? equip != null : true;

  const profile = useCallback((onboarded: boolean): Profile => ({
    goal: goal ?? 'General fitness', goalText: goalText.trim(), daysPerWeek: days, minutesPerSession: minutes, equipment: equip ?? 'No equipment',
    activities: acts, recurring, injuriesText: injuries.trim(), onboarded, installedAt: t.repo.getProfile()?.installedAt ?? asOf(),
  }), [goal, goalText, days, minutes, equip, acts, recurring, injuries, t, asOf]);

  /** R58: generate the first week (keeps the spinner ≥ 1.5 s). Retry re-runs generation only. */
  const generate = useCallback(async () => {
    const id = ++runId.current; setPhase('building');
    const started = Date.now();
    try {
      const r = await t.plans.generateFirstWeeks(asOf());
      if (id !== runId.current) return;
      bump();
      const wait = Math.max(0, 1500 - (Date.now() - started));
      setTimeout(() => { if (id !== runId.current) return; setResult(r); setPhase('preview'); }, wait);
    } catch {
      if (id !== runId.current) return;
      const wait = Math.max(0, 1500 - (Date.now() - started));
      setTimeout(() => { if (id === runId.current) setPhase('failed'); }, wait);
    }
  }, [t, asOf, bump]);

  /** R58/R60/R61: persist the intake, structure injuries into memory, then generate. */
  const buildPlan = useCallback(async () => {
    const id = ++runId.current; setPhase('building');
    const started = Date.now();
    try {
      const now = asOf();
      t.repo.saveProfile(profile(false));
      const injuryText = injuries.trim();
      if (injuryText) { const tags = await t.assembler.structureInjury(injuryText); t.memory.add('injury', injuryText, now, tags); }
      for (const r of recurring) t.memory.add('preference', `${r.detail} ${r.activity}, ${DOW_LONG[r.preferredDay]}s — keep it`, now);
      bump();
    } catch {
      if (id !== runId.current) return;
      const wait = Math.max(0, 1500 - (Date.now() - started));
      setTimeout(() => { if (id === runId.current) setPhase('failed'); }, wait);
      return;
    }
    if (id !== runId.current) return;
    await generate();
  }, [t, asOf, bump, profile, injuries, recurring, generate]);

  const finish = (tab: 'today' | 'nora') => {
    t.repo.saveProfile(profile(true)); bump();
    if (tab === 'nora') (globalThis as unknown as { __terrainDraft?: string }).__terrainDraft = "I'd like to change my first week: ";
    nav.reset({ name: 'tab', tab });
  };

  const next = () => { if (!canNext) return; if (step < 5) setStep(step + 1); else void buildPlan(); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <StatusBarFake />
      {phase === 'wizard' ? (
        <Wizard step={step} canNext={canNext} onBack={() => setStep(step - 1)} onNext={next}>
          {step === 1 ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {GOALS.map((g) => <Chip key={g} label={g} active={goal === g} onPress={() => setGoal(g)} />)}
              </View>
              <Area value={goalText} onChange={setGoalText} placeholder="In your own words — what does 'in shape' mean for you?" minHeight={96} />
            </>
          ) : step === 2 ? (
            <>
              <Card>
                <Label>Days per week</Label>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  {DAY_OPTIONS.map((n) => (
                    <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n} days per week`} accessibilityState={{ selected: days === n }} onPress={() => setDays(n)}
                      style={[{ flex: 1, aspectRatio: 1, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' }, days === n ? { backgroundColor: color.orange } : { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.borderStrong }]}>
                      <Display c={days === n ? color.textOnOrange : color.text2} size={18} lh={20}>{String(n)}</Display>
                    </Pressable>
                  ))}
                </View>
              </Card>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Label>Minutes per session</Label>
                  <Display size={24} lh={26}>{String(minutes)}</Display>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 12 }}>
                  <StepBtn sign="−" size={44} disabled={minutes <= MIN_MIN} onPress={() => setMinutes((m) => Math.max(MIN_MIN, m - MIN_STEP))} />
                  <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: color.surface3, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.round(((minutes - MIN_MIN) / (MAX_MIN - MIN_MIN)) * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: color.orange }} />
                  </View>
                  <StepBtn sign="+" size={44} disabled={minutes >= MAX_MIN} onPress={() => setMinutes((m) => Math.min(MAX_MIN, m + MIN_STEP))} />
                </View>
              </Card>
            </>
          ) : step === 3 ? (
            <View style={{ gap: 8 }}>
              {EQUIPMENT.map((e) => (
                <Pressable key={e.label} accessibilityRole="button" accessibilityState={{ selected: equip === e.label }} onPress={() => setEquip(e.label)}
                  style={[{ borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1 }, equip === e.label ? { backgroundColor: color.orangeTint, borderColor: color.orange } : { backgroundColor: color.surface, borderColor: color.border }]}>
                  <Semi size={15}>{e.label}</Semi>
                  <Small style={{ marginTop: 2 }}>{e.sub}</Small>
                </Pressable>
              ))}
            </View>
          ) : step === 4 ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ACTIVITIES.map((a) => <Chip key={a} label={a} active={acts.includes(a)} onPress={() => setActs((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]))} />)}
              </View>
              <Recurring items={recurring} onAdd={(r) => setRecurring((s) => [...s, r])} onRemove={(i) => setRecurring((s) => s.filter((_, j) => j !== i))} />
            </>
          ) : (
            <>
              <Area value={injuries} onChange={setInjuries} placeholder="e.g. right knee — no deep squatting or jumping" minHeight={120} />
              <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 }}>
                <Small lh={18}>Say it plainly — Nora turns this into hard rules (e.g. no deep-squat or jump exercises will ever be prescribed). You can review them in "What Nora knows".</Small>
              </View>
            </>
          )}
        </Wizard>
      ) : phase === 'building' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 32 }} accessibilityLabel="Nora is building your plan">
          <Spinner size={44} border={4} />
          <Display size={26} lh={26} style={{ textAlign: 'center' }}>Nora is building your plan…</Display>
          <Small size={13} lh={21} style={{ textAlign: 'center' }}>{buildingCaption(injuries, days, recurring)}</Small>
        </View>
      ) : phase === 'failed' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(229,72,77,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={22} color={color.red} />
          </View>
          <Display size={24} lh={24} style={{ textAlign: 'center' }}>That didn't work</Display>
          <Small size={13} lh={21} style={{ textAlign: 'center' }}>Plan generation failed on our side. Your answers are safe — try again.</Small>
          <Btn label="Retry" size="lg" style={{ paddingVertical: 13, paddingHorizontal: 32 }} onPress={() => void generate()} />
        </View>
      ) : (
        <Preview result={result} onToday={() => finish('today')} onChat={() => finish('nora')} />
      )}
    </View>
  );
}

function buildingCaption(injuries: string, days: number, recurring: RecurringPreference[]): string {
  const part = injuryShortName(injuries.trim());
  const r = recurring[0];
  return r
    ? `Checking it against your ${part}, your ${days} days, and your ${DOW_LONG[r.preferredDay]} ${r.activity} before you ever see it.`
    : `Checking it against your ${part}, your ${days} days, and your preferences before you ever see it.`;
}

// ---------- wizard chrome
function Wizard({ step, canNext, onBack, onNext, children }: { step: number; canNext: boolean; onBack: () => void; onNext: () => void; children: React.ReactNode }) {
  const s = STEPS[step - 1];
  return (
    <>
      <View style={{ paddingTop: 8, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>Step {step} of 5</Label>
          <Tiny>{s.tag}</Tiny>
        </View>
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 10 }} accessibilityLabel={`Step ${step} of 5`}>
          {[1, 2, 3, 4, 5].map((n) => <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n <= step ? color.orange : color.surface3 }} />)}
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 24, paddingHorizontal: 20, gap: 16 }} keyboardShouldPersistTaps="handled" testID={`onboarding-step-${step}`}>
        <Display size={30} lh={29}>{s.title}</Display>
        <Body>{s.sub}</Body>
        {children}
      </ScrollView>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28, flexDirection: 'row', gap: 10 }}>
        {step > 1 ? <Btn label="Back" kind="outline" size="lg" style={{ flex: 1 }} onPress={onBack} /> : null}
        <Btn label={step < 5 ? 'Next' : 'Build my plan'} size="lg" style={{ flex: 2 }} disabled={!canNext} onPress={onNext} testID="onboarding-next" />
      </View>
    </>
  );
}

function Area({ value, onChange, placeholder, minHeight }: { value: string; onChange: (v: string) => void; placeholder: string; minHeight: number }) {
  return (
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={color.text3} multiline textAlignVertical="top" accessibilityLabel={placeholder}
      style={{ minHeight, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, color: color.text1, fontFamily: font.body, fontSize: 14, lineHeight: 21 }} />
  );
}

// ---------- step 4 recurring list + inline add form
function Recurring({ items, onAdd, onRemove }: { items: RecurringPreference[]; onAdd: (r: RecurringPreference) => void; onRemove: (i: number) => void }) {
  const [adding, setAdding] = useState(false);
  const [activity, setActivity] = useState('');
  const [detail, setDetail] = useState('');
  const [day, setDay] = useState<number | null>(null);
  const valid = activity.trim().length > 0 && day != null;
  const add = () => { if (!valid || day == null) return; onAdd({ activity: activity.trim(), detail: detail.trim(), frequency: 'weekly', preferredDay: day }); setActivity(''); setDetail(''); setDay(null); setAdding(false); };
  const input = { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 9, paddingHorizontal: 12, color: color.text1, fontFamily: font.body, fontSize: 13 } as const;
  return (
    <Card style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
      <Label>Recurring — Nora plans around these</Label>
      {items.map((r, i) => (
        <View key={`${r.activity}-${r.preferredDay}-${i}`} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12, gap: 10 }}>
          <Body c={color.text1} size={13} lh={18} style={{ flex: 1 }}>{r.detail ? `${r.detail} ${r.activity}` : r.activity} · <Bold>{DOW_LONG[r.preferredDay]}s</Bold></Body>
          <Label c={color.orange} style={{ fontFamily: font.bodyBold, letterSpacing: 0.66 }}>Weekly</Label>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${r.activity}`} onPress={() => onRemove(i)} style={{ padding: 2 }}><Icon name="x" size={14} color={color.text3} /></Pressable>
        </View>
      ))}
      {adding ? (
        <View style={{ marginTop: 10, gap: 8, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, padding: 12 }}>
          <TextInput value={activity} onChangeText={setActivity} placeholder="Activity (e.g. run)" placeholderTextColor={color.text3} accessibilityLabel="Activity" style={input} />
          <TextInput value={detail} onChangeText={setDetail} placeholder="Detail (e.g. 3 miles)" placeholderTextColor={color.text3} accessibilityLabel="Detail" style={input} />
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {DOW_SHORT.map((d, i) => (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={DOW_LONG[i]} accessibilityState={{ selected: day === i }} onPress={() => setDay(i)}
                style={[{ flex: 1, paddingVertical: 7, borderRadius: radius.pill, alignItems: 'center', borderWidth: 1 }, day === i ? { backgroundColor: color.orange, borderColor: color.orange } : { backgroundColor: color.surface2, borderColor: color.border }]}>
                <Semi c={day === i ? color.textOnOrange : color.text2} size={11}>{d}</Semi>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Btn label="Cancel" kind="outline" size="sm" style={{ flex: 1 }} onPress={() => setAdding(false)} />
            <Btn label="Add" size="sm" style={{ flex: 2 }} disabled={!valid} onPress={add} />
          </View>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setAdding(true)} style={{ marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: radius.md, paddingVertical: 9, alignItems: 'center' }}>
          <Semi c={color.text2} size={12}>+ Add a standing activity</Semi>
        </Pressable>
      )}
    </Card>
  );
}
function Bold({ children }: { children: React.ReactNode }) { return <Body c={color.text1} size={13} lh={18} style={{ fontFamily: font.bodyBold }}>{children}</Body>; }

// ---------- preview (R58)
function previewSub(a: Activity): string {
  if (a.source === 'standing_preference') return `Your ${DOW_LONG[dow(a.date)]} staple — kept`;
  if (a.type === 'sprint') return `Track · ${a.intervals ?? 6} × 20 s · long warm-up, full recoveries`;
  return sessionSubtitle({ minutes: a.minutes, exercises: a.exercises, focus: a.focus, type: a.type, intervals: a.intervals });
}

function Preview({ result, onToday, onChat }: { result: FirstWeek | null; onToday: () => void; onChat: () => void }) {
  const rows = [...(result?.activities ?? [])].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 20, gap: 14 }} testID="onboarding-preview">
        <Display size={28} lh={27}>Your first week</Display>
        {result?.summary ? <Body size={13} lh={20}>{result.summary}</Body> : null}
        <View style={{ gap: 8 }}>
          {rows.length === 0 ? (
            <Card style={{ paddingVertical: 12, paddingHorizontal: 14 }}><Small lh={18}>Your week starts Sunday — nothing left to schedule this week.</Small></Card>
          ) : rows.map((a) => (
            <Card key={a.id} style={{ paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Semi>{a.name}</Semi>
                <Small>{previewSub(a)}</Small>
              </View>
              <Label style={{ letterSpacing: 0.66 }}>{DOW_SHORT[dow(a.date)]}</Label>
            </Card>
          ))}
        </View>
        <View style={{ backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Small lh={18}>Every session has warm-up, main and cooldown, with a demo video per exercise. Validated against your intake before it reached you.</Small>
        </View>
      </ScrollView>
      <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 28, gap: 8 }}>
        <Btn label="Looks good — take me to Today" size="lg" onPress={onToday} testID="onboarding-today" />
        <Btn label="Ask for changes (opens chat)" kind="outline" size="md" onPress={onChat} />
      </View>
    </>
  );
}
