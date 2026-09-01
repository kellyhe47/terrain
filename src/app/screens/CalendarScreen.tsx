// Calendar (PRD §8 R24–R29, R77–R79; §11 R40–R40b). Day / week / month are projections of one activity store — every
// count and dot here is re-read from `t` on render. Design markup lines 581–743, script 1586–1630 / 1701–1721 / 1880–1915.
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useTerrain } from '../state';
import { useNav } from '../nav';
import { addDays, dayOf, dow, weekDays, weekStart, DOW_LETTER, DOW_LONG, MONTH_LONG, MONTH_SHORT, fmtMonthDay, fmtNum, fmtTime12, fmtWeekRange, parseISODate, toISODate, type ISODate } from '../../domain/dates';
import { dotFor, type CalendarItem } from '../../domain/calendar';
import { mealTotals, weekStats } from '../../domain/nutrition';
import { color, font } from '../../theme/tokens';
import { Body, Display, Label, Numeral, Semi, Small, Tiny } from '../ui/text';
import { Btn, IconBtn, Segmented, Spinner } from '../ui/primitives';
import { Icon, StatusIcon } from '../ui/icons';
import { mealImageSource } from '../ui/assets';
import { ActivitySheet } from './calendar/ActivitySheet';
import { AddSheet } from './calendar/AddSheet';
import { DOT_COLOR, STATUS_COLOR, dayLabel, dayNum } from './calendar/shared';

type ViewMode = 'Day' | 'Week' | 'Month';
type SheetState = { kind: 'activity'; id: string } | { kind: 'add' } | null;
const plural = (n: number) => `${n} ${n === 1 ? 'activity' : 'activities'}`;

export function CalendarScreen() {
  const { t, version, bump, asOf, showToast } = useTerrain();
  const nav = useNav();
  void version; // every read below is re-run on bump()
  const today = dayOf(asOf());
  const curWs = weekStart(today);
  const [view, setView] = useState<ViewMode>('Week');
  const [ws, setWs] = useState<ISODate>(curWs);
  const [selDay, setSelDay] = useState<ISODate>(today);
  const [month, setMonth] = useState(() => { const d = parseISODate(today); return { y: d.getFullYear(), m: d.getMonth() }; });
  const [monthSel, setMonthSel] = useState<ISODate | null>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  // Log grid's Activity tile (R7) lands here with the Add sheet open.
  useEffect(() => { const g = globalThis as { __terrainOpenAdd?: boolean }; if (g.__terrainOpenAdd) { delete g.__terrainOpenAdd; setSheet({ kind: 'add' }); } }, []);
  const [generating, setGenerating] = useState(false);

  const targets = t.repo.getTargets();
  const days = weekDays(ws);
  const weekItems = t.calendar.week(ws, today);
  const dots = t.calendar.weekDots(ws, today);
  const dayItems = weekItems.filter((i) => i.activity.date === selDay);
  const state = generating ? 'regenerating' : t.calendar.weekState(ws);
  const planned = state === 'planned';
  const monthMap = t.calendar.month(month.y, month.m, today);
  const monthCount = Array.from(monthMap.values()).reduce((n, v) => n + v.length, 0);
  const meals = t.repo.mealsOn(selDay);
  const stats = weekStats(t.repo, ws, today, targets);
  const isMonth = view === 'Month';
  const isDay = view === 'Day';
  const monthIsCurrent = toISODate(new Date(month.y, month.m, 1)) === toISODate(new Date(parseISODate(today).getFullYear(), parseISODate(today).getMonth(), 1));

  const moveWeek = (n: number) => { const next = addDays(ws, 7 * n); setWs(next); setSelDay(next === curWs ? today : next); };
  const openDay = (d: ISODate) => { setSelDay(d); setView('Day'); };
  const weekOffset = Math.round((parseISODate(ws).getTime() - parseISODate(curWs).getTime()) / (7 * 86400000));
  const headTitle = isMonth ? 'Calendar' : weekOffset === 0 ? 'This week' : weekOffset === 1 ? 'Next week' : weekOffset === -1 ? 'Last week' : `Week of ${fmtMonthDay(ws)}`;
  const viewTitle = isMonth ? 'Month' : isDay ? DOW_LONG[dow(selDay)] : 'Whole week';
  const viewSub = isMonth ? `${plural(monthCount)} · ${MONTH_LONG[month.m]}`
    : isDay ? `${fmtMonthDay(selDay)}${selDay === today ? ' · Today' : ''} · ${dayItems.length ? plural(dayItems.length) : 'nothing planned'}`
    : `${plural(weekItems.length)} · Sun to Sat`;

  const generate = async () => {
    setGenerating(true);
    try { await t.plans.generateWeek(ws, asOf()); }
    catch { showToast('Plan generation failed — try again'); }
    finally { setGenerating(false); bump(); }
  };
  const closeSheet = () => setSheet(null);
  const sheetItem = sheet?.kind === 'activity' ? t.calendar.item(sheet.id, today) : null;

  const onMonthTap = (d: ISODate) => {
    if (weekStart(d) === curWs) { setWs(curWs); setMonthSel(null); openDay(d); } else setMonthSel(d);
  };
  const shiftMonth = (n: number) => { const d = new Date(month.y, month.m + n, 1); setMonth({ y: d.getFullYear(), m: d.getMonth() }); setMonthSel(null); };

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 24, gap: 14 }} testID="calendar">
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            {isMonth ? <Label>Any week, past or future</Label> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <IconBtn name="chevronLeft" size={20} label="Previous week" onPress={() => moveWeek(-1)} />
                <Label>{fmtWeekRange(ws)}</Label>
                <IconBtn name="chevronRight" size={20} label="Next week" onPress={() => moveWeek(1)} />
              </View>
            )}
            <Display size={26} lh={25} style={{ marginTop: 4 }}>{headTitle}</Display>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setSheet({ kind: 'add' })} style={({ pressed }) => [{ borderWidth: 1, borderColor: color.borderStrong, backgroundColor: pressed ? color.surface2 : color.surface, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14 }]}>
            <Semi size={13}>+ Add activity</Semi>
          </Pressable>
        </View>

        {/* Week strip (R77) */}
        {!isMonth ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {days.map((d) => {
              const sel = !isDay || d === selDay; const isToday = d === today;
              return (
                <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${DOW_LONG[dow(d)]} ${dayNum(d)}`} accessibilityState={{ selected: sel }} onPress={() => openDay(d)}
                  style={({ pressed }) => [{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 6, borderRadius: 8, borderWidth: 1 },
                    sel ? { backgroundColor: color.orangeTint, borderColor: color.orange } : { backgroundColor: color.surface, borderColor: isToday ? color.borderStrong : color.border },
                    pressed ? { transform: [{ scale: 0.97 }] } : null]}>
                  <Semi c={sel ? color.orange : color.text3} size={10} lh={13} style={{ letterSpacing: 0.6 }}>{DOW_LETTER[dow(d)]}</Semi>
                  <Numeral size={16} lh={19} style={{ marginTop: 2 }}>{dayNum(d)}</Numeral>
                  <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 5, backgroundColor: DOT_COLOR[dots[d]] }} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {/* View title + segmented */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Display size={16} lh={16}>{viewTitle}</Display>
            <Tiny style={{ marginTop: 3 }}>{viewSub}</Tiny>
          </View>
          <Segmented options={['Day', 'Week', 'Month']} value={view} onChange={(v) => setView(v as ViewMode)} />
        </View>

        {/* Month view (R78) */}
        {isMonth ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <IconBtn name="chevronLeft" size={34} label="Previous month" onPress={() => shiftMonth(-1)} />
              <View style={{ alignItems: 'center' }}>
                <Display size={18} lh={18}>{MONTH_LONG[month.m]} {month.y}</Display>
                {!monthIsCurrent ? (
                  <Pressable accessibilityRole="button" onPress={() => { const d = parseISODate(today); setMonth({ y: d.getFullYear(), m: d.getMonth() }); setMonthSel(null); }} style={{ marginTop: 4 }}>
                    <Semi c={color.orange} size={11} lh={14}>Back to today</Semi>
                  </Pressable>
                ) : null}
              </View>
              <IconBtn name="chevronRight" size={34} label="Next month" onPress={() => shiftMonth(1)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {DOW_LETTER.map((l, i) => <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}><Semi c={color.text3} size={10} lh={13} style={{ fontFamily: font.bodyBold, letterSpacing: 0.6 }}>{l}</Semi></View>)}
            </View>
            <MonthGrid y={month.y} m={month.m} today={today} sel={monthSel} map={monthMap} onTap={onMonthTap} />
            {monthSel ? <MonthDetail date={monthSel} items={monthMap.get(monthSel) ?? []} today={today} /> : null}
            <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
              {([['Completed', color.green], ['Skipped', color.text3], ['Planned', color.text2]] as const).map(([l, c]) => (
                <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c }} /><Tiny>{l}</Tiny></View>
              ))}
            </View>
          </>
        ) : null}

        {/* Week states (R29) */}
        {!isMonth && state === 'regenerating' ? (
          <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 32, paddingHorizontal: 20, alignItems: 'center' }} accessibilityLabel="Nora is rebuilding this week">
            <Spinner />
            <Display size={18} lh={19} style={{ marginTop: 14, textAlign: 'center' }}>Nora is rebuilding this week</Display>
            <Small size={13} lh={20} style={{ marginTop: 6, textAlign: 'center' }}>The calendar is locked while the new plan is validated. Usually under a minute.</Small>
          </View>
        ) : null}
        {!isMonth && state === 'empty' ? (
          <View style={{ backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: 8, paddingVertical: 36, paddingHorizontal: 20, alignItems: 'center' }}>
            <Display size={20} lh={22} style={{ textAlign: 'center' }}>Nothing planned yet</Display>
            <Body size={14} lh={21} style={{ marginTop: 8, textAlign: 'center' }}>Nora hasn't planned this week yet.</Body>
            <Btn label="Generate my week" onPress={generate} style={{ marginTop: 16, paddingVertical: 11, paddingHorizontal: 24 }} />
          </View>
        ) : null}

        {/* Activity list (R77) */}
        {!isMonth && planned ? (
          <View style={{ gap: 8 }}>
            {(isDay ? dayItems : weekItems).map((it) => <ActivityRow key={it.activity.id} item={it} today={today} onPress={() => setSheet({ kind: 'activity', id: it.activity.id })} />)}
          </View>
        ) : null}

        {/* Week food (R79 / R73) */}
        {!isMonth && planned && !isDay ? (
          <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 }} accessibilityLabel="Nutrition this week">
            <Label>Nutrition · this week</Label>
            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Stat value={fmtNum(stats.avgProteinG)} unit="g" label="Avg protein / day" />
              <Stat value={fmtNum(stats.avgKcal)} label="Avg kcal / day" />
              <Stat value={String(stats.proteinDaysHit)} unit={`/ ${stats.loggedDays}`} unitSize={13} label="Protein days hit" />
            </View>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: color.border, flexDirection: 'row', justifyContent: 'space-between' }}>
              {stats.perDay.map((p) => {
                const c = p.date === today ? color.yellow : p.logged ? (p.hit ? color.green : color.text3) : color.surface3;
                return (
                  <View key={p.date} style={{ alignItems: 'center', gap: 5 }}>
                    <Semi c={color.text3} size={10} lh={13}>{DOW_LETTER[dow(p.date)]}</Semi>
                    <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: c }} />
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Day food (R79) */}
        {!isMonth && planned && isDay ? (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <Label>Food</Label>
              {selDay === today ? (
                <Pressable accessibilityRole="button" onPress={() => nav.push({ name: 'meal' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="camera" size={14} color={color.orange} /><Semi c={color.orange} size={12} lh={16}>Snap a meal</Semi>
                </Pressable>
              ) : null}
            </View>
            {meals.map((m) => {
              const tot = mealTotals(m.items); const src = mealImageSource(m.imageUri);
              return (
                <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12 }}>
                  <View style={{ width: 52, height: 52, borderRadius: 6, borderWidth: 1, borderColor: color.borderStrong, backgroundColor: color.surface2, overflow: 'hidden' }}>
                    {src ? <Image source={src} resizeMode="cover" style={{ width: '100%', height: '100%' }} accessibilityIgnoresInvertColors /> : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Semi size={14}>{m.name}</Semi>
                    <Tiny style={{ marginTop: 2 }}>{fmtTime12(m.time)}</Tiny>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Numeral size={16} lh={18}>{fmtNum(tot.kcal)} <Tiny>kcal</Tiny></Numeral>
                    <Tiny style={{ marginTop: 2 }}>{fmtNum(tot.proteinG)} g protein</Tiny>
                  </View>
                </View>
              );
            })}
            {meals.length === 0 ? (
              <View style={{ backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: 8, padding: 16 }}>
                <Small size={13} lh={18} style={{ textAlign: 'center' }}>Snap a pic of a meal and it lands here as a card.</Small>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Empty day (R29) */}
        {!isMonth && planned && isDay && dayItems.length === 0 ? (
          <View style={{ backgroundColor: color.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: color.borderStrong, borderRadius: 8, paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' }} accessibilityLabel="Rest day">
            <Display size={18} lh={19} style={{ textAlign: 'center' }}>Rest day</Display>
            <Small size={13} lh={20} style={{ marginTop: 6, textAlign: 'center' }}>Nothing planned. Walk, stretch, sleep — Nora built the week around it.</Small>
          </View>
        ) : null}
      </ScrollView>

      {sheet?.kind === 'add' ? (
        <AddSheet days={days} today={today} onClose={closeSheet} onSave={(v) => {
          const r = t.calendar.addActivity(v, asOf()); showToast(r.toast); bump(); closeSheet(); setView('Week');
        }} />
      ) : null}
      {sheetItem ? (
        <ActivitySheet key={sheetItem.activity.id} item={sheetItem} today={today} days={days} onClose={closeSheet}
          onStart={() => { closeSheet(); nav.push(sheetItem.activity.type === 'sprint' ? { name: 'sprint', activityId: sheetItem.activity.id } : { name: 'gym', activityId: sheetItem.activity.id }); }}
          onDone={() => { const r = t.calendar.logDone(sheetItem.activity.id, asOf()); showToast(r.toast); bump(); closeSheet(); }}
          onSkipped={() => { const r = t.calendar.logSkipped(sheetItem.activity.id, asOf()); showToast(r.toast); bump(); closeSheet(); }}
          onMove={(d) => { t.calendar.reschedule(sheetItem.activity.id, d); bump(); closeSheet(); }}
          onResume={() => { t.chat.resumeSession(sheetItem.activity.id, asOf()); bump(); closeSheet(); }}
          onAskNora={() => { (globalThis as any).__terrainDraft = `Can we change ${sheetItem.activity.name} on ${DOW_LONG[dow(sheetItem.activity.date)]}?`; closeSheet(); nav.setTab('nora'); }} />
      ) : null}
    </View>
  );
}

function ActivityRow({ item, today, onPress }: { item: CalendarItem; today: ISODate; onPress: () => void }) {
  const now = item.status === 'now';
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${item.activity.name}, ${item.subtitle}`} onPress={onPress}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: pressed ? color.surface2 : color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 13, paddingHorizontal: 14 }]}>
      <View style={{ width: 26, height: 26, alignItems: 'center', justifyContent: 'center' }}><StatusIcon status={item.status} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Semi size={14}>{item.activity.name}</Semi>
          <Tiny>{dayLabel(item.activity.date, today)}</Tiny>
        </View>
        <Small c={STATUS_COLOR[item.status]} size={12} lh={16} style={{ marginTop: 2 }}>{item.subtitle}</Small>
      </View>
      {now ? (
        <View style={{ backgroundColor: color.orange, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 }}>
          <Semi c={color.textOnOrange} size={11} lh={14} style={{ letterSpacing: 0.66, textTransform: 'uppercase' }}>Start</Semi>
        </View>
      ) : <Icon name="chevronRight" size={16} color={color.text3} />}
    </Pressable>
  );
}

function Stat({ value, unit, unitSize = 11, label }: { value: string; unit?: string; unitSize?: number; label: string }) {
  return (
    <View>
      <Numeral size={22} lh={22}>{value}{unit ? <Tiny size={unitSize}> {unit}</Tiny> : null}</Numeral>
      <Label size={10} lh={13} style={{ marginTop: 4, letterSpacing: 0.6 }}>{label}</Label>
    </View>
  );
}

function MonthGrid({ y, m, today, sel, map, onTap }: { y: number; m: number; today: ISODate; sel: ISODate | null; map: Map<ISODate, CalendarItem[]>; onTap: (d: ISODate) => void }) {
  const lead = new Date(y, m, 1).getDay(); const dim = new Date(y, m + 1, 0).getDate();
  const cells: Array<ISODate | null> = [...Array.from({ length: lead }, () => null), ...Array.from({ length: dim }, (_, i) => toISODate(new Date(y, m, i + 1)))];
  while (cells.length % 7) cells.push(null);
  const rows: Array<Array<ISODate | null>> = []; for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return (
    <View style={{ gap: 4, marginTop: -6 }}>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 4 }}>
          {row.map((d, ci) => {
            if (!d) return <View key={ci} style={{ flex: 1 }} />;
            const isToday = d === today; const isSel = d === sel; const kind = dotFor(map.get(d) ?? [], d, today);
            return (
              <Pressable key={d} accessibilityRole="button" accessibilityLabel={`${MONTH_SHORT[m]} ${dayNum(d)}`} accessibilityState={{ selected: isSel }} onPress={() => onTap(d)}
                style={({ pressed }) => [{ flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 4, borderRadius: 8, borderWidth: 1, borderColor: isSel ? color.orange : 'transparent', backgroundColor: isSel ? color.orangeTint : isToday ? color.surface2 : 'transparent' }, pressed ? { transform: [{ scale: 0.96 }] } : null]}>
                <Numeral c={isToday ? color.orange : color.text1} size={15} lh={18}>{dayNum(d)}</Numeral>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, marginTop: 4, backgroundColor: DOT_COLOR[kind] }} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function MonthDetail({ date, items, today }: { date: ISODate; items: CalendarItem[]; today: ISODate }) {
  const d = parseISODate(date);
  const title = `${DOW_LONG[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  let line = 'Rest day — nothing planned'; let c: string = color.text3;
  if (items.length) {
    const kind = dotFor(items, date, today);
    const names = items.map((i) => i.activity.name).join(' · ');
    if (kind === 'completed') { line = `Completed · ${names}`; c = color.green; }
    else if (kind === 'skipped') { line = `Skipped · ${names}`; c = color.text3; }
    else { line = `Planned · ${names}`; c = color.text2; }
  }
  return (
    <View style={{ backgroundColor: color.surface, borderWidth: 1, borderColor: color.border, borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16 }}>
      <Label>{title}</Label>
      <Semi c={c} size={14} style={{ marginTop: 5 }}>{line}</Semi>
    </View>
  );
}
