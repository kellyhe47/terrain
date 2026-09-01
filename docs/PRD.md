# Terrain — Product Requirements Document

**Status:** Phase 7 draft, pending spec-review (Phase 9).
**Line tags:** `[source]` = from TERRAIN_RUBRIC.md or audit · `[decided]` = settled in earlier phases (encoded in fixtures/architecture/wireframes) · `[proposal]` = author's call, pending approval.

## 0 · Sources of truth (precedence order)

1. `eval/golden/*.json` — the acceptance contract. Every fixture is executable spec; when prose and fixture disagree, the fixture wins.
2. This PRD — the *why* and the numbered requirement index.
3. `docs/architecture.excalidraw` (generated from `docs/arch.spec.json`) — component/data-flow truth.
4. `docs/wireframes.html` — UI structure, states, and copy that carries meaning.
5. `TERRAIN_RUBRIC.md` — the original brief; absorbed here, kept for reference.

## 1 · Product summary

[source] Terrain is a holistic fitness + wellness app for highly health-motivated users. Nora, the sole AI coach, prescribes and adapts a personal fitness plan and interprets the user's full wellness picture (training, nutrition, sleep, recovery, activity, habits).

[decided] MVP is a single-user **Expo React Native** app with on-device **SQLite**, deterministic domain services, and **OpenAI gpt-5-mini** (text) + cheapest vision tier (meal photos) as the only external model calls. A deterministic **privacy filter** gates every LLM request. A **seed script** produces a deterministic demo user with 3 weeks of history.

### Deterministic / probabilistic boundary

[decided] Deterministic: readiness formula, calendar status rules, privacy filter, plan schema + injury-rail validation, meal totals computation. Probabilistic: Nora chat prose, plan *content* generation, readiness explanation one-liner, meal photo itemization. The boundary is enforced at the domain-service layer: every LLM output passes through schema validation and deterministic rails before touching state; every LLM input passes through the privacy filter.

## 2 · Requirement index

| ID | Area | Fixture |
|----|------|---------|
| R1–R6 | Readiness & wellness overview | 01, 02, 03 |
| R7–R11 | Signal logging & privacy | 06 |
| R12–R16 | Meal photo estimation | 07 |
| R17–R23 | Personalized plan | 05, 10 |
| R24–R29 | Fitness calendar | 04 |
| R30–R35 | Gym session player | 05 |
| R36–R39 | Sprint session player | 09 |
| R40–R42 | Additional activities | 04 |
| R43–R48 | Nora chat, memory, adaptation | 08, 10 |
| R49–R52 | Progress & PRs | — |
| R53–R56 | Trust & safety | 08 |
| R57–R61 | Onboarding | 05 |
| R62–R66 | Architecture & non-functional | — |
| R67–R69 | Seed & demo | — |

## 3 · Readiness & wellness overview (rubric §1)

- **R1** [source] Home ("Today") shows a friendly readiness score (0–100), an emoji, a color band, and a plain-language explanation naming ≥2 contributing signals. → fixture 01.
- **R2** [decided] The score is a **deterministic weighted formula** over today's signals plus yesterday's training load — never LLM-computed. Weights: sleep .25, energy .15, soreness(inv) .15, stress(inv) .10, training load .10, steps .10, hydration .05, nutrition(protein vs target) .05, weight stability .05. Exact arithmetic per fixture 01's `formula_note`.
- **R3** [decided] Bands: green ≥ 70, yellow 40–69, red < 40; emoji tracks band. [proposal] Exact emoji set: 😄 green, 😐 yellow, 😴 red.
- **R4** [decided] Missing signals **reweight proportionally** among present signals; missing is never treated as zero. UI shows which signals are unlogged and that logging improves the score. → fixture 02.
- **R5** [decided] Fewer than 2 signals logged today ⇒ explicit insufficient-data state: no score, no band, no emoji; a prompt to log. → fixture 03.
- **R6** [decided] The explanation one-liner is LLM-generated (via privacy filter); the score/band render instantly from the formula, and a formula-derived template line is the fallback when the LLM call fails (wireframe "Today — loading").

## 4 · Signal logging & privacy (rubric §1)

- **R7** [source] Loggable signals (9): sleep, energy, soreness, stress/mood, steps, hydration, weight, meals, ad-hoc activity. Quick steppers/sliders per wireframe "Log +".
- **R8** [source] Every entry carries a per-entry **private flag** (🔒). Private entries are excluded from every LLM request payload by a deterministic filter that runs before every call. → fixture 06.
- **R9** [source] The user can always see what is shared: sharing indicator in chat + "What Nora knows" screen listing profile, typed/dated memory entries (view/resolve/delete), and private-entry count.
- **R10** [decided] Signals persist to SQLite with date, value, and private flag; readiness reads only today's signals.
- **R11** [proposal] Targets used by the formula (protein g default 1.6 g/kg, hydration 2.5 L, steps 10 000) are user-editable in Settings.

## 5 · Meal photo estimation (rubric §1)

- **R12** [source] User snaps a meal photo; the vision model returns an **itemized** estimate: per item name, portion estimate, calories, protein, carbs, fat, plus overall confidence (low/medium/high). → fixture 07.
- **R13** [decided] Totals are computed by the app from items, never taken from the model.
- **R14** [source] Results are labeled "Estimates, not measurements"; no precision claims.
- **R15** [source] User can edit items/portions and add/remove items **before** saving; nothing auto-saves.
- **R16** [decided] Vision-call failure ⇒ manual entry form (wireframe), never a dead end.

## 6 · Personalized plan (rubric §2)

- **R17** [source] Nora prescribes a weekly plan aligned with goal, availability, minutes per session, equipment, preferences, and injuries from intake. → fixture 05.
- **R18** [decided] Plan generation is an LLM call returning **structured JSON validated against a schema**, then against deterministic rails: exercise IDs must exist in the seed exercise library; no exercise whose tags intersect the user's contraindicated tags; total training days ≤ days available; recurring preferences honored (e.g., exactly one 3-mile Saturday run). Validation failure ⇒ automatic re-prompt with the violation named; never silently accepted.
- **R19** [source] Every gym session includes warm-up, main, cooldown blocks (rubric §4). → fixture 05.
- **R20** [source] Every gym exercise carries prescribed weight/sets/reps, an instruction line from Nora, and a YouTube demo URL (from the exercise library, not LLM-invented). → fixture 05.
- **R21** [source] Injuries reported in chat persist as memory entries and contraindicate matching exercise tags in all future plan generations, while unrelated exercises stay unchanged (control). → fixture 10.
- **R22** [decided] The exercise library ships as seed data: exercises with tags (incl. contraindication tags like `deep_squat`, `plyometric_jump`, `overhead_press`) and curated YouTube URLs.
- **R23** [proposal] Weekly regeneration: user-triggered from an empty calendar week ("generate"), plus Nora may propose regeneration after material new context; regeneration never silently overwrites — it fills empty weeks or applies as a reviewed patch (R28).

## 7 · Fitness calendar (rubric §3)

- **R24** [source] Five distinguishable statuses: pending, completed, partial, skipped, trainee-added. → fixture 04.
- **R25** [source] Scheduling alone never counts as completion; a past-scheduled unlogged activity remains **pending** and shows "log what happened". → fixture 04 (a4).
- **R26** [source] User can add ad-hoc activities (type, duration, intensity) which land as trainee-added and feed Nora's context and wellness picture.
- **R27** [decided] Reschedule is deterministic (drag/date-picker) — no LLM call required to move an activity.
- **R28** [decided] "Ask Nora to change" opens chat; Nora's plan-change replies render a **patch card** (Apply / Not now); Apply routes the patch through the same schema + rail validation as plan generation before touching the calendar.
- **R29** [decided] Calendar states: empty week (generate CTA), regenerating (locked + spinner).

## 8 · Gym session player (rubric §4)

- **R30** [source] Player shows current phase (warm-up → main → cooldown), exercise, prescribed weight×reps per set, Nora's instruction, and a video button per exercise.
- **R31** [source] User records actual weight/reps per set (tap to edit, tap to check); a rest timer auto-starts on set check ([proposal] default 90 s).
- **R32** [source] End-of-session sheet: perceived difficulty 1–5, pain toggle (→ location + note), optional note for Nora.
- **R33** [decided] Finishing marks the calendar activity completed or partial based on what was actually done; exiting mid-session offers "Save as partial?" which records done-so-far.
- **R34** [decided] Session results (planned vs actual, difficulty, pain, notes) persist and enter Nora's adaptation context.
- **R35** [source] The experience stays usable mid-exercise: current action always prominent, "Next up" visible.

## 9 · Sprint session player (rubric §5)

- **R36** [source] Sprint sessions are structurally distinct: warm-up (≥10 min, longer than gym's 5-min default) → [sprint interval → recovery] × N → cooldown. N intervals ⇒ N recovery blocks. → fixture 09.
- **R37** [source] Each stage shows purpose/effort/safety text.
- **R38** [decided] Timer-driven auto-advance with pause and skip-stage controls.
- **R39** [source] End sheet identical to gym; completed sprint sessions land in the **same** adaptation history as gym workouts. → fixture 09.

## 10 · Additional activities (rubric §6)

- **R40** [source] Runs, Pilates, yoga, pickleball, padel, sprint club, etc. can be scheduled (by Nora or user) and recorded with a lighter flow (type, duration, intensity, optional note) — no guided player.
- **R41** [source] They still contribute to calendar statuses, Nora's context, progress, and the wellness picture.
- **R42** [source] Recurring preferences (e.g., weekly 3-mile Saturday run) shape ongoing plans so Nora avoids conflicts and over-intensity. → fixture 05.

## 11 · Nora chat, memory, adaptation (rubric §7)

- **R43** [source] Chat supports progress, injuries, pain, schedule changes, preferences, questions; substitution requests yield patch cards (R28) while Nora owns overall direction.
- **R44** [decided] LLM responses may include structured `memory_writes[]`; the memory service persists them as typed, dated entries (injury, preference, …) visible in "What Nora knows". → fixture 10.
- **R45** [source] Memory persists across conversations and is included (post privacy filter) in planning and chat context — the mechanism is inspectable, not vibes. → fixture 10.
- **R46** [decided] User can resolve/delete memory entries; deleted entries leave context immediately.
- **R47** [decided] Chat states: LLM error (retry bubble), offline notice, empty history (Nora intro).
- **R48** [decided] All chat/plan calls use gpt-5-mini with context assembled by the domain layer (profile + shared signals + memory + relevant history), never raw DB dumps.

## 12 · Progress & personal records (rubric §8)

- **R49** [source] Dedicated PR view: self-reported lifting/running/sprint records with activity, result, date, optional note; add via ➕.
- **R50** [source] Progress shows readiness trend (14/30 d), training consistency (done vs planned), and simple signal trend lines (weight, sleep, steps) — no single reductive number.
- **R51** [source] Workout history list → session detail showing planned vs actual.
- **R52** [decided] Empty states per wireframe ("No records yet — add your first PR").

## 13 · Trust & safety (rubric §9)

- **R53** [source] Nora never diagnoses, prescribes treatment, or implies medical clearance. → fixture 08.
- **R54** [source] Concerning symptom reports (e.g., chest pain + dizziness) ⇒ referral to a qualified professional **plus** a structured plan-safety action card offering to pause/downgrade upcoming intense sessions, applied only on user confirmation. The report is stored in persistent memory. → fixture 08.
- **R55** [decided] Safety behavior is asserted as structured response properties (referral present, no diagnosis, no clearance), enforced via system prompt + a deterministic check that safety-flagged replies include the action card — never by asserting prose strings.
- **R56** [source] All guidance, scores, and estimates use plain, supportive, nonjudgmental language; Settings carries the "wellness guidance, not medical advice" disclaimer.

## 14 · Onboarding (rubric §2 intake)

- **R57** [decided] 5-step wizard: goal → days/week + minutes/session → equipment → enjoyed activities + recurring preferences → injuries/limitations (free text, structured by Nora into typed constraints).
- **R58** [decided] Wizard completion triggers first plan generation (R18) with a "Nora is building your plan…" state → plan preview → "Looks good" / "Ask for changes" (opens chat).
- **R59** [decided] Plan-generation failure ⇒ retry button, never a blank screen.
- **R60** [decided] Intake persists as the profile shown/editable in "What Nora knows".
- **R61** [proposal] Injury free text is structured into contraindicated exercise tags at intake time via one LLM call whose output is schema-validated against the library's tag vocabulary.

## 15 · Architecture & non-functional

- **R62** [decided] Stack: Expo React Native, on-device SQLite, domain services per `docs/arch.spec.json` (readiness engine, plan service, calendar engine, memory service, privacy filter, meal estimator client). 5-tab nav: Today · Calendar · Log + · Nora · Progress; Settings + "What Nora knows" via Today's gear icon.
- **R63** [decided] Privacy filter is a single choke point: **no code path may call the OpenAI API except through it**. This is the invariant that must never be compromised.
- **R64** [decided] Deterministic outputs (score, statuses, totals) render without waiting on any network call; LLM-dependent surfaces have loading + failure fallbacks (R6, R16, R47, R59).
- **R65** [proposal] OpenAI key supplied via env/config; graceful "coach offline" degradation when absent — deterministic features fully usable without a key.
- **R66** [proposal] Frozen-clock seam: domain services take `as_of` as a parameter (as every fixture does) so fixtures run deterministically.

## 16 · Seed & demo

- **R67** [decided] Seed script creates a deterministic demo user with intake profile, 3 weeks of signals, sessions (all five statuses represented), memory entries, meals, and PRs.
- **R68** [decided] Settings offers "reset to seeded user" and "reset to fresh (onboarding)".
- **R69** [proposal] Seed data is date-relative to install time so the demo always shows a live-looking current week.

## 17 · Out of scope (MVP)

[source] Stretch goals deferred: Strava and Apple Health connections. [proposal] Also out: multiple users/auth, push notifications, wearable integration, offline LLM queueing beyond simple retry.

## 18 · Risks & audit caveats

- [source] Greenfield brief — no data fixtures existed to audit; golden fixtures rest on the rubric plus the readiness-formula design, not on measured data. Formula weights (R2) are a design choice validated only by fixtures 01–03.
- LLM structured-output compliance: mitigated by schema validation + re-prompt (R18); residual risk of repeated failures handled by R59-style retry UX.
- YouTube link rot in the seed library: accepted for MVP.

## 19 · Acceptance

The build is done when: all 10 fixtures in `eval/golden/` pass against the implementation; every requirement above is either implemented or explicitly re-negotiated; the walkthroughs in `docs/wireframes.html` (including every non-happy-path state noted in red) are reachable in the app; and the seeded demo supports the rubric's end-product loop: observe → understand → plan → perform → reflect → communicate → adapt.
