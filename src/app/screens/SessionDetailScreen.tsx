// Session detail (PRD R51): title, date/status/difficulty/pain meta, Exercise / Planned / Actual table with shortfalls coloured,
// and the trainee's note verbatim. Reads the activity and its result straight from the repo.
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { dayOf, fmtDowMonthDay } from '../../domain/dates';
import { toItem } from '../../domain/calendar';
import type { Activity, ActivityResult } from '../../domain/types';
import { color } from '../../theme/tokens';
import { Body, Bold, Display, Label, Semi, Small, Tiny } from '../ui/text';
import { Card, IconBtn } from '../ui/primitives';

interface DetailRow { key: string; name: string; plan: string; act: string; actColor: string; }
const trim = (n: number) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(1)));

export function SessionDetailScreen({ activityId }: { activityId: string }) {
  const { t, asOf } = useTerrain();
  const nav = useNav();
  const today = dayOf(asOf());
  const activity = t.repo.getActivity(activityId);
  const result = t.repo.getResult(activityId);

  const back = <IconBtn name="chevronLeft" size={32} label="Back" onPress={() => nav.pop()} />;
  if (!activity) {
    return (
      <View style={{ flex: 1, backgroundColor: color.bg, paddingTop: 8, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>{back}<Display size={22} lh={22}>Session</Display></View>
        <Body style={{ marginTop: 14 }}>This session is no longer on your calendar.</Body>
      </View>
    );
  }

  const item = toItem(activity, result, today);
  const meta = [fmtDowMonthDay(activity.date), item.status];
  if (result?.outcome === 'done') {
    if (result.difficulty != null) meta.push(`difficulty ${result.difficulty}/5`);
    meta.push(result.pain ? `pain: ${result.painWhere || 'yes'}` : 'no pain');
  }
  const rows = buildRows(activity, result, (id) => t.library.get(id)?.name ?? id);

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} testID="sessionDetail">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {back}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Display size={22} lh={22}>{activity.name}</Display>
            <Tiny style={{ marginTop: 2 }}>{meta.join(' · ')}</Tiny>
          </View>
        </View>

        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderColor: color.border }}>
            <Label size={10} lh={13} style={{ flex: 1.4 }}>Exercise</Label>
            <Label size={10} lh={13} style={{ flex: 1 }}>Planned</Label>
            <Label size={10} lh={13} style={{ flex: 1 }}>Actual</Label>
          </View>
          {rows.map((r, i) => (
            <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: i === rows.length - 1 ? 0 : 1, borderColor: color.border }}>
              <Semi size={12} lh={16} style={{ flex: 1.4 }}>{r.name}</Semi>
              <Small size={12} lh={16} style={{ flex: 1 }}>{r.plan}</Small>
              <Small size={12} lh={16} c={r.actColor} style={{ flex: 1 }}>{r.act}</Small>
            </View>
          ))}
        </Card>

        {result?.note ? (
          <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderLeftWidth: 2, borderLeftColor: color.orange, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 14 }}>
            <Body size={13} lh={19.5}><Bold size={13} lh={19.5}>Note to Nora:</Bold> {result.note}</Body>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Planned vs actual. Green = matched the prescription, yellow = short, red = nothing done. */
function buildRows(a: Activity, r: ActivityResult | null, nameOf: (id: string) => string): DetailRow[] {
  const skipped = !r || r.outcome === 'skipped';
  if (a.type === 'gym' && a.exercises?.length) {
    return a.exercises.map((e, i) => {
      const plan = `${e.sets} × ${e.weightLb} lbs × ${e.reps}`;
      if (skipped) return { key: `${e.exerciseId}-${i}`, name: nameOf(e.exerciseId), plan, act: 'Skipped', actColor: color.red };
      const done = (r.sets ?? []).filter((s) => s.exerciseId === e.exerciseId && s.done);
      if (!r.sets) {
        // No per-set log (recorded from the calendar): the session counted as done, so show the prescription as performed.
        return { key: `${e.exerciseId}-${i}`, name: nameOf(e.exerciseId), plan, act: `${e.sets} × ${e.weightLb} × ${e.reps}`, actColor: color.green };
      }
      if (!done.length) return { key: `${e.exerciseId}-${i}`, name: nameOf(e.exerciseId), plan, act: '0 sets', actColor: color.red };
      const w = Math.max(...done.map((s) => s.weightLb)), reps = Math.max(...done.map((s) => s.reps));
      const equal = done.length >= e.sets && w >= e.weightLb && reps >= e.reps;
      return { key: `${e.exerciseId}-${i}`, name: nameOf(e.exerciseId), plan, act: `${done.length} × ${trim(w)} × ${reps}`, actColor: equal ? color.green : color.yellow };
    });
  }
  let plan: string, act: string, planned: number, actual: number;
  if (a.distanceMi != null) { planned = a.distanceMi; actual = skipped ? 0 : r.distanceMi ?? a.distanceMi; plan = `${trim(planned)} mi`; act = `${trim(actual)} mi`; }
  else if (a.type === 'sprint') { planned = a.intervals ?? 0; actual = skipped ? 0 : r.doneCount ?? planned; plan = `${planned} × 20 s`; act = `${actual} × 20 s`; }
  else { planned = a.minutes; actual = skipped ? 0 : r.minutes ?? a.minutes; plan = `${planned} min`; act = `${actual} min`; }
  if (skipped) act = 'Skipped';
  const actColor = actual <= 0 ? color.red : actual < planned ? color.yellow : color.green;
  return [{ key: a.id, name: a.name, plan, act, actColor }];
}
