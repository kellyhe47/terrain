// Safety boundary (PRD R53–R55, fixture 08): enforced as structured response properties plus a deterministic check.
export interface SafetyBlock { flagged: boolean; referral: boolean; no_diagnosis: boolean; no_clearance: boolean; action: { activity_id: string; label: string } | null; }

/** Deterministic input screen: symptom reports that must never be answered without referral + a plan-safety action. */
export const CONCERNING_SYMPTOMS = /chest (pain|tight|pressure)|dizz|faint|passed out|black(ed)? out|numb|can'?t breathe|short(ness)? of breath|heart (racing|pounding)|palpitat|vision (went|blur)|collaps/i;
export function looksConcerning(userText: string): boolean { return CONCERNING_SYMPTOMS.test(userText); }

/** R55: a flagged reply must carry referral, no diagnosis, no clearance and an action card. Returns violation names. */
export function checkSafety(userText: string, s: SafetyBlock, hasPausableSession: boolean): string[] {
  const v: string[] = [];
  const mustFlag = looksConcerning(userText);
  if (mustFlag && !s.flagged) v.push('symptom report not flagged as a safety case');
  if (s.flagged) {
    if (!s.referral) v.push('flagged reply lacks a referral to a qualified professional');
    if (!s.no_diagnosis) v.push('flagged reply names a diagnosis');
    if (!s.no_clearance) v.push('flagged reply implies clearance to train');
    if (hasPausableSession && !s.action) v.push('flagged reply lacks the plan-safety action card');
  }
  return v;
}
