import { describe, it, expect } from 'vitest';
import { computeReadiness, fallbackExplanation, weightStabilityScore, trainingLoadScore } from './readiness';

const T = { stepsTarget: 10000, hydrationTargetL: 2.5, proteinTargetG: 120 };
describe('readiness engine', () => {
  it('clamps component scores at 100', () => {
    const r = computeReadiness({ signals: { sleepHours: 9.5, steps: 15000, hydrationL: 4 }, targets: T, yesterdaySessions: [] });
    expect(r.kind).toBe('score');
    if (r.kind === 'score') for (const c of r.components) expect(c.score).toBeLessThanOrEqual(100);
  });
  it('weight stability is linear between 2% and 10%', () => {
    expect(weightStabilityScore(150, 150)).toBe(100);
    expect(weightStabilityScore(159, 150)).toBeCloseTo(50, 6); // 6% → halfway
    expect(weightStabilityScore(165, 150)).toBe(0);
  });
  it('training load: hard session doubles the penalty', () => {
    expect(trainingLoadScore([])).toBe(100);
    expect(trainingLoadScore([{ completed: true, difficulty: 3 }, { completed: true, difficulty: 5 }])).toBe(85);
    expect(trainingLoadScore([{ completed: false }])).toBe(100);
  });
  it('targets are inputs: different targets change the score', () => {
    const base = { signals: { sleepHours: 7.5, steps: 8500, hydrationL: 2 }, yesterdaySessions: [] };
    const a = computeReadiness({ ...base, targets: T });
    const b = computeReadiness({ ...base, targets: { ...T, stepsTarget: 8500 } });
    expect(a.kind === 'score' && b.kind === 'score' && b.score > a.score).toBe(true);
  });
  it('fallback names the two top contributors', () => {
    const r = computeReadiness({ signals: { sleepHours: 7.5, energy: 4, soreness: 2, stress: 2, steps: 8500, hydrationL: 2, proteinG: 100, weightLb: 154.5, weight7dAvgLb: 154.9 }, targets: T, yesterdaySessions: [{ completed: true, difficulty: 3 }] });
    if (r.kind !== 'score') throw new Error('expected score');
    expect(fallbackExplanation(r)).toBe('Readiness 85 · green — top factors: sleep 7.5 h, low soreness.');
  });
});
