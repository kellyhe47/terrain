// Builds ReadinessInputs from the store for a given day (R10: readiness reads only that day's signals). Targets are inputs (R11b).
import { addDays, type ISODate } from './dates';
import { computeReadiness, type ReadinessInputs, type ReadinessResult } from './readiness';
import { dayMacros } from './nutrition';
import type { Repo } from '../db/repo';

export function readinessInputsFor(repo: Repo, date: ISODate): ReadinessInputs {
  const s = repo.signalsOn(date);
  const t = repo.getTargets();
  const meals = repo.mealsOn(date);
  const prior = repo.signalSeries('weight', addDays(date, -7), addDays(date, -1));
  const avg = prior.length ? prior.reduce((a, p) => a + p.value, 0) / prior.length : undefined;
  const yesterday = repo.activitiesOn(addDays(date, -1));
  const results = repo.resultsFor(yesterday.map((a) => a.id));
  return {
    signals: {
      sleepHours: s.sleep, energy: s.energy, soreness: s.soreness, stress: s.stress, steps: s.steps, hydrationL: s.hydration,
      proteinG: meals.length ? dayMacros(meals).proteinG : undefined,
      weightLb: s.weight, weight7dAvgLb: s.weight != null && avg != null ? avg : undefined,
    },
    targets: { stepsTarget: t.steps, hydrationTargetL: t.hydration_l, proteinTargetG: t.protein_g },
    yesterdaySessions: yesterday.map((a) => { const r = results.get(a.id); return { completed: r?.outcome === 'done', difficulty: r?.difficulty }; }),
  };
}
export function readinessFor(repo: Repo, date: ISODate): ReadinessResult { return computeReadiness(readinessInputsFor(repo, date)); }
