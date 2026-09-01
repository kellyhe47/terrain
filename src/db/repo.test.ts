import { describe, it, expect } from 'vitest';
import { testRepo } from './testDb';
describe('Repo', () => {
  it('round-trips signals, activities, results, meals, memory', async () => {
    const r = await testRepo();
    r.upsertSignal({ date: '2026-08-12', type: 'sleep', value: 7.5, loggedAt: 'x' });
    r.upsertSignal({ date: '2026-08-12', type: 'sleep', value: 8, loggedAt: 'y' });
    expect(r.signalsOn('2026-08-12')).toEqual({ sleep: 8 });
    r.saveActivity({ id: 'a1', date: '2026-08-12', type: 'gym', name: 'Upper body', source: 'nora', minutes: 45, intensity: 'Moderate', startTime: '19:00', paused: false, createdAt: 'x', exercises: [{ exerciseId: 'bench', phase: 'main', sets: 3, reps: 8, weightLb: 135 }] });
    expect(r.getActivity('a1')?.exercises?.[0].exerciseId).toBe('bench');
    r.saveResult({ activityId: 'a1', outcome: 'done', doneCount: 6, totalCount: 6, loggedAt: 'x' });
    expect(r.resultsFor(['a1']).get('a1')?.doneCount).toBe(6);
    r.saveMeal({ id: 'm1', date: '2026-08-12', time: '13:05', name: 'Chicken & rice', imageUri: null, confidence: 'medium', items: [], createdAt: 'x' });
    expect(r.mealsOn('2026-08-12')).toHaveLength(1);
    r.saveMemory({ id: 'mm1', type: 'injury', text: 't', date: '2026-08-19', tags: ['overhead_press'], resolved: false, createdAt: 'x' });
    expect(r.listMemory()[0].tags).toEqual(['overhead_press']);
    expect(r.getTargets().protein_g).toBe(120);
    r.setTarget('protein_g', 130);
    expect(r.getTargets().protein_g).toBe(130);
  });
});
