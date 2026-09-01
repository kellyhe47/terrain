// What Nora knows (PRD R9, R44–R46, R60): the intake profile with Edit, and the typed, dated memory with Resolve / Delete.
import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { DOW_LONG, fmtMonthDay } from '../../domain/dates';
import type { Equipment, Goal, MemoryEntry, Profile } from '../../domain/types';
import { color, font, radius } from '../../theme/tokens';
import { Display, Label, Body, Semi, Small, Tiny, Numeral } from '../ui/text';
import { Card, Btn, IconBtn, Chip, StepBtn, Sheet } from '../ui/primitives';

const GOALS: Goal[] = ['Strength', 'Endurance', 'Lean out', 'General fitness'];
const EQUIPMENT: Equipment[] = ['Commercial gym', 'Home setup', 'No equipment'];

export function KnowsScreen() {
  const { t, bump, showToast } = useTerrain();
  const nav = useNav();
  const profile = t.repo.getProfile();
  const memory = t.memory.list();
  const [editing, setEditing] = useState(false);

  const keeps = profile
    ? profile.recurring.length
      ? profile.recurring.map((r) => `${r.detail} ${r.activity}, ${DOW_LONG[r.preferredDay]}s`).join(' · ')
      : profile.activities.length ? profile.activities.join(', ') : 'None yet'
    : '—';

  const resolve = (m: MemoryEntry) => { t.memory.resolve(m.id); bump(); };
  const del = (m: MemoryEntry) => { t.memory.delete(m.id); bump(); showToast("Removed — out of Nora's context immediately"); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }} testID="knows">
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBtn name="chevronLeft" label="Back" onPress={() => nav.pop()} />
          <Display size={22} lh={24}>What Nora knows</Display>
        </View>

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Label>Profile · from intake</Label>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit profile" disabled={!profile} onPress={() => setEditing(true)} style={({ pressed }) => [{ borderWidth: 1, borderColor: color.border, borderRadius: radius.sm, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: pressed ? color.surface2 : 'transparent', opacity: profile ? 1 : 0.5 }]}>
              <Semi c={color.text2} size={12} lh={14}>Edit</Semi>
            </Pressable>
          </View>
          <View style={{ marginTop: 10, gap: 6 }}>
            <ProfileRow k="Goal" v={profile ? (profile.goalText || profile.goal) : '—'} />
            <ProfileRow k="Availability" v={profile ? `${profile.daysPerWeek} days/wk · ${profile.minutesPerSession} min` : '—'} />
            <ProfileRow k="Equipment" v={profile ? profile.equipment : '—'} />
            <ProfileRow k="Keeps" v={keeps} />
          </View>
        </Card>

        <Card>
          <Label>Memory</Label>
          {memory.length === 0 ? (
            <Body c={color.text3} size={13} lh={18} style={{ paddingTop: 16, paddingBottom: 4, textAlign: 'center' }}>Nora only knows your intake profile so far.</Body>
          ) : (
            <View style={{ marginTop: 10, gap: 10 }}>
              {memory.map((m) => <MemoryRow key={m.id} m={m} onResolve={() => resolve(m)} onDelete={() => del(m)} />)}
            </View>
          )}
        </Card>
      </ScrollView>

      {profile ? <EditSheet open={editing} profile={profile} onClose={() => setEditing(false)} onSave={(p) => { t.repo.saveProfile(p); bump(); setEditing(false); }} /> : null}
    </View>
  );
}

function ProfileRow({ k, v }: { k: string; v: string }) {
  return <Body size={13} lh={18}><Body c={color.text3} size={13} lh={18}>{k}</Body> · {v}</Body>;
}

function MemoryRow({ m, onResolve, onDelete }: { m: MemoryEntry; onResolve: () => void; onDelete: () => void }) {
  const badge = m.type === 'injury' ? { bg: 'rgba(229,72,77,0.15)', c: color.red } : m.type === 'preference' ? { bg: color.orangeTint, c: color.orange } : { bg: color.surface3, c: color.text2 };
  return (
    <View style={{ borderWidth: 1, borderColor: color.border, borderRadius: radius.md, paddingVertical: 11, paddingHorizontal: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start', opacity: m.resolved ? 0.5 : 1 }} accessibilityLabel={`${m.type} memory`}>
      <View style={{ backgroundColor: badge.bg, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: 7, marginTop: 1 }}>
        <Tiny c={badge.c} size={9} lh={11} style={{ fontFamily: font.bodyBold, letterSpacing: 0.72, textTransform: 'uppercase' }}>{m.type}</Tiny>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Body c={color.text1} size={13} lh={18}>{m.text}</Body>
        <Tiny c={color.text3} size={11} lh={15}>{fmtMonthDay(m.date)}{m.resolved ? ' · resolved' : ''}</Tiny>
      </View>
      {!m.resolved ? (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {m.type === 'injury' ? <Pressable accessibilityRole="button" accessibilityLabel="Resolve" onPress={onResolve} style={{ padding: 2 }}><Semi c={color.orange} size={12} lh={16}>Resolve</Semi></Pressable> : null}
          <Pressable accessibilityRole="button" accessibilityLabel="Delete" onPress={onDelete} style={{ padding: 2 }}><Semi c={color.text3} size={12} lh={16}>Delete</Semi></Pressable>
        </View>
      ) : null}
    </View>
  );
}

/** Inline editor for the intake profile (R60 Edit). Keeps text edits the free-form activities list; recurring entries stay as intake set them. */
function EditSheet({ open, profile, onClose, onSave }: { open: boolean; profile: Profile; onClose: () => void; onSave: (p: Profile) => void }) {
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [goalText, setGoalText] = useState(profile.goalText);
  const [days, setDays] = useState(profile.daysPerWeek);
  const [minutes, setMinutes] = useState(profile.minutesPerSession);
  const [equipment, setEquipment] = useState<Equipment>(profile.equipment);
  const [keeps, setKeeps] = useState(profile.activities.join(', '));
  const save = () => onSave({ ...profile, goal, goalText: goalText.trim(), daysPerWeek: days, minutesPerSession: minutes, equipment, activities: keeps.split(',').map((s) => s.trim()).filter(Boolean) });
  const input = { backgroundColor: color.surface2, borderWidth: 1, borderColor: color.border, borderRadius: radius.sm, paddingVertical: 10, paddingHorizontal: 12, color: color.text1, fontFamily: font.body, fontSize: 14 } as const;
  return (
    <Sheet open={open} onClose={onClose} title="Edit profile" subtitle="Nora plans from this">
      <ScrollView style={{ marginTop: 14 }} contentContainerStyle={{ gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 8 }}>
          <Label>Goal</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{GOALS.map((g) => <Chip key={g} label={g} active={g === goal} onPress={() => setGoal(g)} />)}</View>
          <TextInput value={goalText} onChangeText={setGoalText} placeholder="In your words" placeholderTextColor={color.text3} accessibilityLabel="Goal in your words" style={input} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Days per week</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StepBtn sign="−" disabled={days <= 2} onPress={() => setDays((d) => Math.max(2, d - 1))} />
            <Numeral size={15} lh={18} style={{ minWidth: 64, textAlign: 'center' }}>{days} days</Numeral>
            <StepBtn sign="+" disabled={days >= 6} onPress={() => setDays((d) => Math.min(6, d + 1))} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Minutes per session</Label>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StepBtn sign="−" disabled={minutes <= 20} onPress={() => setMinutes((m) => Math.max(20, m - 5))} />
            <Numeral size={15} lh={18} style={{ minWidth: 64, textAlign: 'center' }}>{minutes} min</Numeral>
            <StepBtn sign="+" disabled={minutes >= 90} onPress={() => setMinutes((m) => Math.min(90, m + 5))} />
          </View>
        </View>
        <View style={{ gap: 8 }}>
          <Label>Equipment</Label>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{EQUIPMENT.map((e) => <Chip key={e} label={e} active={e === equipment} onPress={() => setEquipment(e)} />)}</View>
        </View>
        <View style={{ gap: 8 }}>
          <Label>Keeps</Label>
          <TextInput value={keeps} onChangeText={setKeeps} placeholder="Activities you want to keep, comma-separated" placeholderTextColor={color.text3} accessibilityLabel="Keeps" style={input} />
          <Small size={11} lh={15}>Standing sessions from intake stay on the calendar.</Small>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Btn label="Cancel" kind="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Btn label="Save" kind="primary" onPress={save} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </Sheet>
  );
}
