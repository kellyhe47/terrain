// Fixtures 01, 02, 03 → operation: computeReadiness(inputs) over the fixture's signals_today / yesterday_sessions.
import { describe, it, expect } from 'vitest';
import { loadFixture } from './fixtures';
import { computeReadiness, type ReadinessInputs } from '../../src/domain/readiness';

function inputsFrom(given: any): ReadinessInputs {
  const s = given.signals_today ?? {};
  return {
    signals: {
      sleepHours: s.sleep_hours, energy: s.energy_1to5, soreness: s.soreness_1to5, stress: s.stress_1to5, steps: s.steps,
      hydrationL: s.hydration_liters, proteinG: s.protein_g, weightLb: s.weight_lb, weight7dAvgLb: s.weight_7day_avg_lb,
    },
    targets: { stepsTarget: s.steps_target ?? 10000, hydrationTargetL: s.hydration_target_liters ?? 2.5, proteinTargetG: s.protein_target_g ?? 120 },
    yesterdaySessions: (given.yesterday_sessions ?? []).map((y: any) => ({ completed: y.status === 'completed', difficulty: y.perceived_difficulty_1to5 })),
  };
}

describe('fixture 01 readiness_full_signals', () => {
  const f = loadFixture('01_readiness_full_signals.json');
  it('scores 85 green from the fixture signals and targets', () => {
    const r = computeReadiness(inputsFrom(f.given));
    expect(r.kind).toBe('score');
    if (r.kind !== 'score') return;
    const raw = r.components.reduce((a, c) => a + c.contribution, 0);
    expect(raw).toBeCloseTo(84.604, 2);
    expect(r.score).toBe(f.expect.score);
    expect(r.band).toBe(f.expect.band);
  });
  it('note_protein_vs_ui: 86 g protein rounds to 84, not 85', () => {
    const inp = inputsFrom(f.given); inp.signals.proteinG = 86;
    const r = computeReadiness(inp);
    expect(r.kind === 'score' && r.score).toBe(84);
  });
});

describe('fixture 02 readiness_missing_signals_reweight', () => {
  const f = loadFixture('02_readiness_missing_signals_reweight.json');
  it('reweights the present loggable signals; training load is never absent', () => {
    const r = computeReadiness(inputsFrom(f.given));
    expect(r.kind).toBe('score');
    if (r.kind !== 'score') return;
    const keys = r.components.map((c) => c.key);
    expect(keys.sort()).toEqual(['energy', 'load', 'sleep']);
    expect(r.components.find((c) => c.key === 'load')?.score).toBe(100);
    expect(r.score).toBe(f.expect.score);
    expect(r.band).toBe(f.expect.band);
  });
});

describe('fixture 03 readiness_insufficient_data', () => {
  const f = loadFixture('03_readiness_insufficient_data.json');
  it('returns insufficient_data with no score and no band', () => {
    const r = computeReadiness(inputsFrom(f.given));
    expect(r.kind).toBe('insufficient');
    expect((r as any).score).toBeUndefined();
    expect((r as any).band).toBeUndefined();
    expect(f.expect.score).toBeNull();
  });
});
