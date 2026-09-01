import { describe, it, expect } from 'vitest';
import { testRepo } from '../db/testDb';
import { CalendarService, deriveStatus, subtitleFor, toItem } from './calendar';
import type { Activity } from './types';

const T = '2026-08-12'; const AS_OF = '2026-08-12T10:00:00-05:00';
const act = (over: Partial<Activity>): Activity => ({ id: 'a', date: T, type: 'run', name: 'Run 3 mi', source: 'nora', minutes: 30, intensity: 'Moderate', paused: false, createdAt: AS_OF, ...over });

describe('calendar status rules (R24–R26a, R40)', () => {
  it('a logged result wins over the date rule', () => {
    expect(deriveStatus(act({}), { activityId: 'a', outcome: 'done', loggedAt: AS_OF }, T)).toBe('completed');
    expect(deriveStatus(act({}), { activityId: 'a', outcome: 'skipped', loggedAt: AS_OF }, T)).toBe('skipped');
    expect(deriveStatus(act({}), null, T)).toBe('now');
    expect(deriveStatus(act({ date: '2026-08-13' }), null, T)).toBe('pending');
    expect(deriveStatus(act({ date: '2026-08-10' }), null, T)).toBe('pending'); // time passing never skips (R25)
  });
  it('subtitles carry shortfalls, never a status', () => {
    const a = act({ distanceMi: 3 });
    expect(subtitleFor(a, { activityId: 'a', outcome: 'done', distanceMi: 2, loggedAt: AS_OF }, 'completed', T)).toBe('Completed · 2 of 3 miles logged');
    const g = act({ type: 'gym', name: 'Upper body', exercises: Array(6).fill({ exerciseId: 'x', phase: 'main', sets: 3, reps: 8, weightLb: 100 }) });
    expect(subtitleFor(g, { activityId: 'a', outcome: 'done', doneCount: 6, totalCount: 6, loggedAt: AS_OF }, 'completed', T)).toBe('Completed · 6/6 exercises');
    expect(subtitleFor(act({ startTime: '19:00' }), null, 'now', T)).toBe('Starts 7:00 PM');
    expect(subtitleFor(act({ date: '2026-08-14', source: 'trainee_adhoc', minutes: 45 }), null, 'pending', T)).toBe('Planned · 45 min · Moderate');
  });
  it('past-due offers log/skip; today offers Mark done; future cannot be marked done (R40b)', async () => {
    const repo = await testRepo(); const cal = new CalendarService(repo);
    repo.saveActivity(act({ id: 'p', date: '2026-08-10' })); repo.saveActivity(act({ id: 'f', date: '2026-08-14' })); repo.saveActivity(act({ id: 't' }));
    expect(toItem(repo.getActivity('p')!, null, T).pastDue).toBe(true);
    expect(toItem(repo.getActivity('t')!, null, T).recordable).toBe(true);
    expect(cal.logDone('f', AS_OF).ok).toBe(false);
    expect(cal.logDone('p', AS_OF)).toEqual({ ok: true, toast: 'Logged · Nora will factor it in' });
    expect(cal.item('p', T)?.subtitle).toBe('Completed · 30 min · Moderate');
    expect(cal.logSkipped('t', AS_OF)).toEqual({ ok: true, toast: 'Logged as skipped · Nora will adjust' });
    expect(cal.item('t', T)?.subtitle).toBe('Skipped · logged');
    expect(cal.logDone('t', AS_OF).ok).toBe(false); // already resolved
  });
  it('adding a past activity logs it; today/future plans it (R26a)', async () => {
    const repo = await testRepo(); const cal = new CalendarService(repo);
    const past = cal.addActivity({ type: 'pilates', name: 'Pilates', date: '2026-08-11', minutes: 45, intensity: 'Easy' }, AS_OF);
    expect(past.toast).toBe('Logged · Nora will factor it in'); expect(cal.item(past.activity.id, T)?.subtitle).toBe('Completed · 45 min · Easy');
    const fut = cal.addActivity({ type: 'yoga', name: 'Yoga', date: '2026-08-14', minutes: 60, intensity: 'Moderate' }, AS_OF);
    expect(fut.toast).toBe('Added to calendar'); expect(cal.item(fut.activity.id, T)?.status).toBe('pending');
    const tod = cal.addActivity({ type: 'run', name: 'Run', date: T, minutes: 30, intensity: 'Hard' }, AS_OF);
    expect(cal.item(tod.activity.id, T)?.subtitle).toBe('Today · 30 min · Hard');
    expect(past.activity.source).toBe('trainee_adhoc');
  });
  it('reschedule is deterministic and month/week/day agree', async () => {
    const repo = await testRepo(); const cal = new CalendarService(repo);
    repo.saveActivity(act({ id: 'r', date: '2026-08-13' }));
    expect(cal.reschedule('r', '2026-08-15')).toBe(true);
    expect(cal.day('2026-08-15', T).map((i) => i.activity.id)).toEqual(['r']);
    expect(cal.week('2026-08-09', T).map((i) => i.activity.id)).toEqual(['r']);
    expect(cal.month(2026, 7, T).get('2026-08-15')?.[0].activity.id).toBe('r');
  });
});
