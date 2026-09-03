# Requirement checklist (PRD §2 index → implementation)

Status: ✅ implemented · ⚠️ implemented with a recorded decision · ❌ renegotiated (see note). Fixture column names the runner test.

| Req | Where | Status | Fixture / note |
|---|---|---|---|
| R1–R3 | `domain/readiness.ts`, `app/ui/gauge.tsx`, `TodayScreen` | ✅ | 01 |
| R4 | `readiness.ts` reweighting | ⚠️ | 02 — expected 56 → 61, see FIXTURE_CHANGES.md |
| R5 | `readiness.ts` insufficient, Today copy + Log now | ✅ | 03 |
| R6 | `contextAssembler.explainReadiness`, Today phases + fallback | ✅ | 01 explanation_properties |
| R6a–R6c | Today hero row / nutrition card / plan card (count read from the session) / rest card; no chip row | ✅ | |
| R7–R8 | `LogScreen`, `log/LogSheet.tsx` steps and units | ✅ | |
| R9 | `assembler.sharedSignalCount` → Nora header | ✅ | |
| R10 | `repo.signals` keyed by (date, type); loader reads today only | ✅ | |
| R11–R11b | targets table, Settings steppers, formula/nutrition read targets; reference fallback labelled "ref" | ✅ | 01 note_targets |
| R11a | Nora target proposals as a confirmable card | ✅ | `chatSchema.target_proposal`, `ChatCard kind 'target'` (see Nora screen) |
| R12–R12a | `domain/vision/adapter.ts` validation + normalisation | ✅ | 07 |
| R13–R15 | `MealScreen` totals line, "Estimates, not measurements", edit/remove/add, Discard/Save | ✅ | 07 invariants |
| R16 | camera auto-capture, analyzing, failure copy, manual entry | ⚠️ | camera fallback to the bundled plate when no camera (BUILT_NOT_SHOWN) |
| R17–R18 | `domain/plan.ts` schema + rails, `planService.generateValidated` re-prompt | ✅ | 05 |
| R18a | standing activities excluded from the day count | ✅ | 05 counts |
| R19 | cooldown phase in every gym session (planner, seed, player) | ✅ | 05 must_include |
| R20 | Form video button → `FormVideoScreen` (YouTube plays inline on open, cue, targets, equipment, form points) | ✅ | |
| R21 | injury memory → contraindicated tags in every generation | ✅ | 10 |
| R22 | `seed/exerciseLibrary.ts` — 59 exercises: contraindication tags, muscle groups, equipment, venues, cues, form points, YouTube ids | ✅ | `exerciseLibrary.test.ts`; all 59 videos audited (see `.qa/exercise-library.md`) |
| R23 | Generate my week on an empty week; patches via chat | ✅ | Nora-initiated proposals arrive as patch cards in reply to context |
| R24–R24c | `domain/calendar.ts` status derivation, subtitles, sources, skip as a user action | ✅ | `calendar.test.ts` |
| R25 | past unlogged stays pending with the log prompt | ✅ | |
| R26–R26a | Add activity sheet; past ⇒ logged, today/future ⇒ planned; toasts | ✅ | |
| R27 | Reschedule = date picker, no model call | ✅ | |
| R28 | Ask Nora to change → chat; Apply through the rails | ✅ | `planService.test.ts` |
| R29 | empty / regenerating / empty-day copy | ✅ | |
| R30–R35, R80–R82 | `GymPlayerScreen` (per-exercise YouTube background loop — muted, cover-cropped, graded per design; bundled loop as the offline fallback — gestures, set panel, rest 90 s, end/exit sheets, results) | ✅ | iOS simulator pass, `.qa/exercise-library.md` |
| R36–R39 | `domain/sprint.ts`, `SprintPlayerScreen` | ✅ | |
| R40–R42 | activity sheet Mark done / I did it / Confirm skipped; contributes to statuses, context, progress | ✅ | |
| R43–R43a | `NoraScreen`, patch card states | ✅ | |
| R44–R46 | `domain/memory.ts`, What Nora knows resolve/delete | ✅ | 10 |
| R47 | error / offline / empty chat states | ✅ | |
| R48–R48a | `ai/openrouterText.ts` (gpt-5-mini, pinned provider, fallbacks off from config) | ✅ | not exercised live in CI (needs a key) |
| R49–R52 | `ProgressScreen`, PR sheet, session detail, empty PR copy | ✅ | |
| R53–R55 | `domain/safety.ts` structured check + re-prompt; safety card | ✅ | 08 |
| R54a | resume writes a second context entry; Nora never asserts clearance | ✅ | 08 |
| R56 | Settings disclaimer | ✅ | |
| R57–R59 | `OnboardingScreen` | ✅ | |
| R60–R61 | intake → profile + injury memory via `structureInjury` | ✅ | 10 |
| R62 | 5-tab nav, Nutrition/Settings/Knows routing with return | ✅ | |
| R63–R63b | assembler choke point, vision path without context, provider seam | ✅ | `privacy_boundary.test.ts`, 07 invariants |
| R64 | deterministic surfaces render before any network call | ✅ | |
| R65 | two credentials, each degrades only its own surface | ✅ | `ai/config.ts` |
| R66 | `asOf` on every domain service | ✅ | |
| R67–R69 | `seed/demoSeed.ts`, Settings resets, date-relative | ✅ | `demoSeed.test.ts` |
| R70–R76 | `NutritionScreen`, `domain/nutrition.ts`, `seed/nutrientReference.ts`, supplements | ✅ | 07 (totals) |
| R77–R79 | Day/Week/Month, month grid, calendar food | ✅ | |
