# Deliberate fixture changes

Per the handoff: expectations are only changed deliberately, with the reason recorded here and in the fixture's `revision` field.

## 02_readiness_missing_signals_reweight — `expect.score` 56 → 61 (2026-09-01)
The fixture's prose says training load is "never absent" and "never reweighted away", and PRD R2 says it is "always present"; fixture 01 carries it at .10. But the fixture's arithmetic (`.625*75 + .375*25`) renormalised the two present loggable weights to sum to 1 and dropped the load term entirely, so the number contradicted the words. Implemented rule (`src/domain/readiness.ts`): the 8 user-loggable weights (.90 total) renormalise among the signals present; load keeps its fixed .10. Full-signal days reproduce fixture 01 exactly (84.604 → 85). Partial day: `.5625*75 + .3375*25 + .10*100 = 60.625 → 61`, still yellow. The alternative readings were 56 (drop load — contradicts prose/PRD) and 65 (load also absorbs missing weight — contradicts "reweighting spans the 8 user-loggable signals").
