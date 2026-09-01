// Sprint session structure (PRD R36–R38): warm-up 10 min → [sprint 20 s → recovery 90 s] × N → cooldown 5 min.
export type StageKind = 'warm' | 'sprint' | 'rec' | 'cool';
export interface SprintStage { label: string; seconds: number; purpose: string; safety: string; kind: StageKind; }

export function buildSprintStages(intervals = 6): SprintStage[] {
  const s: SprintStage[] = [{ label: 'Warm-up', seconds: 600, purpose: 'Easy jog into strides. Wake up hips and calves.', safety: 'Build gradually — nothing sharp yet.', kind: 'warm' }];
  for (let i = 1; i <= intervals; i++) {
    s.push({ label: `Sprint ${i}/${intervals}`, seconds: 20, purpose: 'Max effort, tall posture, drive the arms.', safety: 'Stop if form breaks.', kind: 'sprint' });
    s.push({ label: 'Recovery', seconds: 90, purpose: 'Walk it off. Breathe down before the next rep.', safety: 'Fully recover — quality beats quantity.', kind: 'rec' });
  }
  s.push({ label: 'Cooldown', seconds: 300, purpose: 'Easy walk or jog. Let your heart rate settle.', safety: 'Done — stretch calves and hamstrings after.', kind: 'cool' });
  return s;
}
export function sprintMinutes(intervals = 6): number { return Math.round((600 + intervals * 110 + 300) / 60); }
