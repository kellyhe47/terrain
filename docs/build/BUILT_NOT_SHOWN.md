# Built but not shown in the designs — and why

The designs are the product (PRD §0). Everything below is something the app has that the prototypes don't draw, each with the requirement that forced it. Nothing here changes a designed screen's layout or copy.

| What | Where | Why |
|---|---|---|
| Cooldown exercise as the last phase-tagged entry of every gym session | Gym player, session detail, seed, planner | R19 — the prototype's exercise list stopped at the main block. |
| **Form video** destination: a screen with the bundled demo loop, Nora's cue and an "Open on YouTube" link | `FormVideoScreen` | R20/R22 — the prototype's button was dead. |
| **Ask Nora to change** as the last button on the activity sheet, prefilling the chat composer | Calendar activity sheet → Nora | R28 — not on the prototype's sheet. |
| **Reschedule** as an inline 7-day picker + Move (the prototype's button only dismissed) | Calendar activity sheet | R27 — deterministic, no model call. |
| **I've been seen — resume this** on a paused activity | Calendar activity sheet | R54a. |
| **Demo** card in Settings: reset to seeded user, reset to fresh (onboarding), and failure toggles (Nora reply: OK/Error/Offline · Vision: OK/Fail · Plan generation: OK/Fail) | `SettingsScreen` | R68 for the resets; the toggles exist so every failure state on the prototype's rails (R6, R16, R47, R59, R72a) is reachable by a user or a critic without cutting the network. They gate the seams; the models never see them. |
| Extra target rows (Calories, Carbs, Fat, Fiber) under the prototype's three | Settings | R11 — every fitness and nutrition target is the user's and adjustable. |
| " · ref" suffix on a micronutrient whose target is a reference value, not the user's | Nutrition | R11b — a fallback must be labelled as such. |
| Week ‹ › navigation on the calendar strip | Calendar | R29 — an empty future week (and "Generate my week") must be reachable. |
| Camera fallback: when no camera is available (browser QA, simulator), the viewfinder shows the bundled plate photo and auto-captures it | Meal photo | R16 needs a capture to analyse; the fixture-07 photo keeps the demo and the fixture agreeing. |
| Fake, fixture-backed text model and vision provider used automatically when no credential is configured | `src/ai/fakeTextModel.ts`, `src/ai/fakeVisionProvider.ts` | Handoff: nothing external exists yet; R65 says either credential absent degrades only its own surface. The fake planner produces schema-valid plans through the same rails. |
| The demo's Today shows readiness **84** and **86 g / 1,060 kcal**, not the prototype's 85 / 1,450 | Seed | R67: every figure must derive from data; fixture 01's note says the prototype's 85 and 86 g cannot both come from one dataset. The seed carries the 86 g the card shows; the formula yields 84. |
| Dates are the real today, not "Wednesday Aug 12"; the current week's activities are placed relative to today | Seed | R69 — date-relative seed, live current week. |
| SQLite via sql.js on web (and in tests), expo-sqlite on device | `src/db` | PRD §1 wants on-device SQLite; the critic drives the web build, so the same SQL runs there. |
| Fixture 02 expected score revised 56 → 61 | `eval/golden/02…json`, `docs/build/FIXTURE_CHANGES.md` | Its arithmetic contradicted its own prose and R2. Recorded deliberately. |
| **Proposed target change** card in chat (Not now / Set target) | Nora chat | R11a — a proposed target arrives as a change the user confirms, like a plan patch. |
| Reschedule picker pages weeks (‹ ›) | Calendar activity sheet | R27 — any date, deterministic; also how a future guided session is brought to today and started. |
| Demo failure toggles persist across reloads and reset with the demo resets | Settings | So a QA recipe survives a page reload without dead-ending onboarding. |
