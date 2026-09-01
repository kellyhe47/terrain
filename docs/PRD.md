# Terrain — Product Requirements Document

Terrain is a holistic fitness and wellness app. Nora, its sole AI coach, prescribes and adapts a weekly plan and interprets the user's full picture — training, nutrition, sleep, recovery, activity, habits — so the user never has to decide what to do at the gym or wonder how their signals connect.

## 0 · Sources of truth

1. **`designs/Terrain App.html` and `designs/Terrain Onboarding.html`** — the clickable prototypes. They are the product. Where this document and the design disagree about layout, copy, states or interaction, the design wins.
2. `eval/golden/*.json` — the acceptance contract for behaviour the design cannot show: formulas, validation rails, context payloads.
3. This PRD — the numbered requirement index and the rules behind the screens.
4. `docs/architecture.excalidraw` — components and data flow. Generated from `docs/arch.spec.json` by `docs/gen_arch.py`.

The prototypes are Claude Design bundles: open them in a browser and use the state rail on the left to reach every state.

## 1 · Platform

Single-user **Expo React Native** app, on-device **SQLite**, deterministic domain services, and two independent model paths: **OpenRouter routed to gpt-5-mini** for all text, and a **separate, swappable vision path** for meal photos. A **seed script** produces a deterministic demo user.

**Dark only**, 390×844, orange accent on near-black, Anton display + Archivo body, tabular numerals on every measured value.

**Imperial units.** Body weight and lifts in pounds, distances in miles, hydration in liters, nutrition in grams and kcal. No unit preference.

**Deterministic:** readiness score, calendar statuses, context assembly, plan schema and injury-rail validation, meal totals, nutrition aggregation. **Probabilistic:** Nora's prose, plan content, the readiness explanation, meal itemization, nutrition-gap narration. Every model output passes schema validation and deterministic rails before touching state.

## 2 · Requirement index

| ID | Area | Fixture |
|----|------|---------|
| R1–R6c | Readiness & Today | 01, 02, 03 |
| R7–R11 | Signal logging | — |
| R12–R16 | Meal photo | 07 |
| R17–R23 | Personalized plan | 05, 10 |
| R24–R29, R77–R79 | Calendar | — |
| R30–R35, R80–R82 | Gym player | — |
| R36–R39 | Sprint player | — |
| R40–R42 | Additional activities | 05 (R42) |
| R43–R48a | Nora chat, memory, adaptation | 08, 10 |
| R49–R52 | Progress & PRs | — |
| R53–R56 | Trust & safety | 08 |
| R57–R61 | Onboarding | 05 |
| R62–R66 | Architecture | — |
| R67–R69 | Seed & demo | — |
| R70–R76 | Nutrition & supplements | 07 |

## 3 · Readiness & Today

- **R1** Today shows a readiness score 0–100 in a large colored arc gauge with the label "Readiness", the date, and a plain-language explanation naming ≥2 contributing signals. → fixture 01.
- **R2** The score is a deterministic weighted formula over today's signals plus yesterday's training load — never model-computed. Weights: sleep .25, energy .15, soreness (inverted) .15, stress (inverted) .10, training load .10, steps .10, hydration .05, protein vs target .05, weight stability .05.
  - Component scores normalize to 0–100 and **clamp at 100** — sleep beyond 8 h, steps beyond target and hydration beyond target do not earn more than a full score.
  - **Weight stability:** within 2% of the 7-day average scores 100, falling linearly to 0 at 10% deviation.
  - **Training load** is always present, never absent: no sessions yesterday scores **100** (full recovery). Each completed session subtracts **5 points**, doubled to 10 for a session the user rated 4 or 5. One moderate session yesterday therefore scores 95.
  - Exact arithmetic per fixture 01's `formula_note`.
- **R3** Bands: green ≥ 70, yellow 40–69, red < 40. The band sets the arc stroke and glow. **No emoji.**
- **R4** Missing signals **reweight proportionally** among the signals present; missing is never treated as zero. This is invisible to the user — fewer signals simply produce a score from what is there. → fixture 02.
- **R5** Fewer than 2 signals logged ⇒ insufficient-data state: the gauge reads `--` under the "Readiness" label, with *"No score yet — log a couple of signals and Nora will score your readiness."* and a **Log now** button. No score, no band. → fixture 03.
- **R6** The explanation is Nora's voice on Today, generated through the context assembler. It renders in three phases: **shimmer** → **token stream with cursor** → **done**. The score and arc render instantly from the formula and never wait on the network. On failure, a deterministic line built from the formula (*"Readiness 85 · green — top factors: sleep 7.5 h, low soreness."*, naming the two highest-weighted contributors) plus **Couldn't reach Nora — retry explanation**.
- **R6a** Below the gauge, in order: a **hero signal row** — Sleep, Steps, Weight with a weekly delta, Energy; a **Nutrition card** — protein against target and kcal against target, opening Nutrition; and a **Today's plan card** — start time, session name, and a subtitle of duration, exercise count and focus (*"45 min · 6 exercises · bench focus"*), opening the player. **The count is read from the session**, never a fixed number: session length is an output of plan generation (R18), varying with minutes available, goal and equipment.
- **R6b** Rest days score normally and replace the plan card with **"Rest — here's why"** carrying Nora's reason. No Start button.
- **R6c** Today carries **no per-signal chip row**. It answers *how ready am I, why, and what next*; a grid of nine editable values competes with that. Logging belongs to the Log ＋ tab (R7), reviewing values over time to Progress (R50).

## 4 · Signal logging

- **R7** The **Log ＋ tab is the only place signals are logged.** A grid of 10 tiles: sleep, energy, soreness, stress/mood, steps, hydration, weight, meal 📷, supplements, ad-hoc activity.
- **R8** Each numeric tile opens a sheet with one large value, its unit, `−`/`+` steppers and **Save**, confirming with *"Saved · Nora will factor it in"*. Steps: sleep ±0.5 h, the 1–5 scales ±1, steps ±500, hydration ±0.25 L, weight ±0.5 lbs.
- **R9** The Nora chat header carries **"Sees N shared signals →"**, where N is the count of signal types in the assembled context, linking to *What Nora knows*.
- **R10** Signals persist with date and value. Readiness reads only today's.
- **R11** **Targets belong to the user.** Every fitness and nutrition target — protein, hydration, steps, calories, macros — is the user's own, originating from intake and adjustable in Settings with `−`/`+` steppers. **This document specifies no target values.** Any number in the design or the seed is that demo user's setting, not a product constant.
- **R11a** Nora may **propose** a target, drawing on the user's goal, training load and logged history, but never sets one silently. A proposed target arrives as a change the user confirms, the same way a plan patch does (R43a), and the accepted value persists as the user's.
- **R11b** The readiness engine (R2) and every nutrition surface read targets as **inputs**. No target is hard-coded in a formula or a screen. Where a nutrient has no user-set target, the app may fall back to a standard reference value and must label it as such rather than presenting it as the user's goal.

## 5 · Meal photo

- **R12** The vision provider returns an **itemized** estimate: per item a name, portion estimate, calories, protein, carbs and fat, plus an overall confidence of low/medium/high. → fixture 07.
- **R12a** The vision adapter **validates the provider's response before it reaches a screen**, the same way plan output is railed (R18): every item carries all six fields with the right types; confidence is one of the three values; and each item is internally consistent — `protein×4 + carbs×4 + fat×9` within 25% of its calories, the meal within 15%. A response that fails validation is treated as a provider failure and takes R16's path. A provider that omits carbs or fat is adapted to fill them, never passed through partial. → fixture 07.
- **R13** Totals are computed by the app from the items, and the UI says so: *"Totals computed on your phone from the items above — never taken from the model."*
- **R14** Results are headed **"Estimates, not measurements"** with the confidence beside it. No precision claims.
- **R15** Each item edits in place — portion `−`/`+` in 0.25 steps with macros recomputing live — or is removed. **+ Add item** opens manual entry, which appends to the same list. Nothing auto-saves: the sheet ends in **Discard** / **Save meal**.
- **R16** The camera auto-captures (*"Hold steady — capturing automatically"*), then analyzes (*"Nora is looking at your plate…"*). Provider failure shows *"Couldn't read the photo / No estimate this time — add the meal by hand instead."* with **Retry photo** and **Enter manually**. Manual entry collects food name, kcal, protein, carbs and fat.

## 6 · Nutrition & supplements

- **R70** A **Nutrition** screen, opened from Today's nutrition card. Header: today's calories against the user's target. **Today's macros** as labelled bars — protein, carbs, fat, fiber — each `value / target`, the targets being the user's (R11).
- **R70a** A seed **nutrient reference table** — nutrient content per food, keyed by the item names the vision provider returns — supplies the micronutrients the provider does not. This is food composition data, not targets.
- **R71** **Micronutrients** estimated from logged meals — the set shown in the design, including nutrients tracked against a ceiling rather than a floor — each `value / target` with a fill, weak estimates dimmed, under *"Estimates from photo logs are rough — trends matter more than single days."* Targets follow R11b.
- **R72** **What's missing · Nora · last 14 days**: a ranked list of nutrient gaps, each a name, a stat and a plain-language note explaining cause and fix, closing with a summary line. Aggregates are deterministic; the narration is generated.
- **R72a** Macros, micronutrients, This week and Logged meals render immediately from local data. Only the gap list waits on the model: it shimmers, and on failure collapses to a deterministic ranked-shortfall line plus a retry.
- **R72b** The gap narration's context includes supplement adherence for the same 14 days, so a nutrient the user doses daily is excluded from the ranking or narrated as covered.
- **R73** **This week** on both Nutrition and the calendar week view: average protein/day, average calories/day, and the count of days meeting the user's protein target. Both surfaces use the same denominator.
- **R74** **Logged meals** grouped by day with per-day totals, each meal a card with thumbnail, name, time, kcal and protein.
- **R75** A supplement stack with name and dose/timing, each row toggling **Taken**/**Not yet** for the day, headed `N / M taken today`. Reachable from the Log grid and from Nutrition.
- **R76** Supplements are **adherence only** — no readiness weight.

## 7 · Personalized plan

- **R17** Nora prescribes a weekly plan aligned with goal, availability, minutes per session, equipment, preferences and injuries. → fixture 05.
- **R18** Plan generation returns **structured JSON validated against a schema**, then against deterministic rails: exercise IDs exist in the seed library; no exercise whose tags intersect the user's contraindicated tags; distinct calendar dates carrying a prescribed activity ≤ days available; recurring preferences honored. Violation ⇒ automatic re-prompt naming the violation. Never silently accepted.
- **R18a** **Recurring-preference activities do not consume training days.** A kept Saturday run is a standing activity, not a prescribed training day — 4 training days plus the run is 5 scheduled activities.
- **R19** Every gym session includes warm-up, main and cooldown. Warm-up and cooldown are phase-tagged entries in the same exercise list, not separate screens.
- **R20** Every exercise carries prescribed weight/sets/reps, Nora's cue, and a **Form video** button playing a demonstration from the exercise library.
- **R21** Injuries reported in chat persist as memory entries and contraindicate matching exercise tags in all future generations unless resolved or deleted, while unrelated exercises stay unchanged. → fixture 10.
- **R22** The exercise library ships as seed data: exercises with tags (including contraindication tags such as `deep_squat`, `plyometric_jump`, `overhead_press`), Nora's cue text, and a demonstration video URL per exercise.
- **R23** Weekly regeneration is user-triggered from an empty week (**Generate my week**), or proposed by Nora after material new context. Regeneration never silently overwrites: it fills empty weeks or applies as a reviewed patch (R28).

## 8 · Calendar

- **R24** Four statuses, each with a distinct icon: **completed** (green filled check), **skipped** (dashed grey ring with ✕), **pending** (grey clock ring), **now** (orange clock ring, carrying **Start**). Status is derived, in this order:
  1. A logged result wins over everything: done or partly done ⇒ **completed**; user-confirmed skip ⇒ **skipped**.
  2. Otherwise by date — today ⇒ **now**; future ⇒ **pending**; past ⇒ **pending**, carrying the log prompt (R25).

  A logged result always wins over the date rule: an activity dated today that has been logged is `completed`, not `now`.
- **R24a** Shortfalls are recorded in the activity's subtitle, not as a status — *"Completed · 2 of 3 miles logged"*, *"Completed · 6/6 exercises"*. The subtitle is required content. Counts are `done / total` for that session, never fixed.
- **R24b** Activities carry a `source`: `nora` (prescribed, counts against R18's day limit), `trainee_adhoc`, or `standing_preference` (a kept recurring activity, excluded from the count per R18a).
- **R24c** `skipped` is a user action, not only a seed state. Every past activity has exactly two resolutions — done or skipped — and neither happens without the user saying so.
- **R25** Scheduling never counts as completion, and time passing never skips an activity either — only the user resolves one (R24c, R40). A past-scheduled unlogged activity stays **pending** and shows *"This was scheduled and never logged — **log what happened** so the week reads true."*
- **R26** **+ Add activity** opens a sheet: type chips (Run, Pilates, Yoga, Pickleball, Padel, Sprint club, Other), a **Day** picker across the visible week, **Duration** `−`/`+` in 15-minute steps (minimum 15, default 45), and **Intensity** as **Easy · Moderate · Hard**. The activity appears immediately in every calendar view.
- **R26a** The button and resulting status depend on the day, because adding a past activity is logging rather than planning:
  - **Past day** → **"Log to calendar"**; lands `completed`, subtitle *"Completed · N min · Intensity"*, toast *"Logged · Nora will factor it in"*.
  - **Today or future** → **"Add to calendar"**; lands `pending`, subtitle *"Today · N min · Intensity"* or *"Planned · N min · Intensity"*, toast *"Added to calendar"*.
- **R27** Reschedule is deterministic — a date picker on the activity sheet, no model call.
- **R28** The activity sheet carries **Ask Nora to change**, opening chat. Nora's plan-change replies render a patch card; Apply routes the patch through the same schema and rail validation as plan generation before touching the calendar.
- **R29** Week states: **empty** — *"Nothing planned yet / Nora hasn't planned this week yet."* with **Generate my week**; **regenerating** — locked, *"Nora is rebuilding this week / The calendar is locked while the new plan is validated. Usually under a minute."*; **empty day** — *"Rest day / Nothing planned. Walk, stretch, sleep — Nora built the week around it."*
- **R77** Three views behind a segmented **Day · Week · Month** control, with a week strip of seven tappable day cells carrying status dots. Week view lists the week's activities with day labels; day view lists one day's, subtitled with the count.
- **R78** **Month view**: a 7-column grid with a status dot per day, a legend (Completed · Skipped · Planned), `‹ Month Year ›` navigation with **Back to today**, and a one-line detail for the selected day. Selecting a day in the current week opens Day view. Month, week and day are three projections of one activity store and must never disagree.
- **R79** The calendar carries food. Week view shows *Nutrition · this week* (R73) with a per-day dot strip. Day view shows a **Food** section listing that day's meals, offering **Snap a meal** with *"Snap a pic of a meal and it lands here as a card."* when empty.

## 9 · Gym player

- **R30** A full-bleed looping form video with content overlaid: a segmented progress bar (one segment per exercise), `{phase} · Exercise n of m`, elapsed time, exercise name, Nora's cue, and a set-count summary. Readable at arm's length mid-set.
- **R80** Interaction is gestural: **tap left 40%** = previous exercise, **tap right 60%** = next (or the end sheet on the last), **swipe up** = the set panel. A persistent hint reads *"Slide up to log sets"*. The panel scrims the video and closes on tap-out.
- **R31** The set panel lists one row per set: checkbox, `Set n`, weight `−`/`+` (±5 lbs), reps `−`/`+` (±1). Checking a set starts the **rest timer** — 90 s, shown as `Rest m:ss` with **Skip**. The panel also carries the exercise name, the **Form video** button, and **Next / Cooldown** plus **End session**.
- **R32** End-of-session sheet **"How did it go?"**: *How hard was that?* 1–5, an **Any pain?** toggle revealing *"Where? (e.g. right shoulder)"*, and *"Note for Nora (optional)"*. Ends with **Finish → marks completed**.
- **R33** Exiting mid-session opens **"Leaving mid-session"** — *"You've done N sets. Save the session? Everything you did counts as completed."* — with **Save session**, **Discard session**, **Keep training**. Save marks the activity `completed` and records the sets done. Discard returns it to `pending` and writes nothing.
- **R34** Session results — planned vs actual, difficulty, pain, notes — persist and enter Nora's adaptation context.
- **R35** The current exercise and cue dominate; set state is one swipe away; the rest timer is the only interruption.
- **R81** The video background and the explanation token-stream honour the OS reduced-motion setting.
- **R82** Sessions started from the activity sheet route by type: sprint activities open the sprint player, gym activities the gym player.

## 10 · Sprint player

- **R36** Full-screen and **color-coded by stage**: warm-up and cooldown on the app background, sprint intervals on solid orange, recoveries on deep green. Structure: warm-up **10 min** → [sprint **20 s** → recovery **90 s**] × 6 → cooldown **5 min**. N intervals ⇒ N recoveries — the recovery count always equals the interval count.
- **R37** Each stage shows its label, a large countdown, a **purpose** line and a **safety** line, plus a stage-dot strip and `Sprint session · n / m stages`.
- **R38** Timer-driven auto-advance with **Pause/Resume** and **Skip stage**. The final stage completing opens the end sheet.
- **R39** End sheet identical to gym; completed sprints land in the same adaptation history Nora uses for gym sessions.

## 11 · Additional activities

- **R40** Runs, Pilates, yoga, pickleball, padel and sprint club are scheduled **and recorded** with no guided player. Recording happens in the activity sheet:
  - A past-due unlogged activity offers **"I did it — log it"** and **"Confirm skipped"**.
  - An activity today or earlier and not yet resolved offers **"Mark done"**.
  - Done writes `completed` with *"Completed · N min · Intensity"* and toasts *"Logged · Nora will factor it in"*; skipped writes `skipped` with *"Skipped · logged"* and toasts *"Logged as skipped · Nora will adjust"*.
- **R40a** Duration and intensity come from the values the activity already carries (R26); there is no second prompt and no free-text note. Notes for Nora exist only on the guided end sheet (R32).
- **R40b** "Mark done" requires the activity to be dated today or earlier and not already completed or skipped. Future activities cannot be marked done.
- **R41** These activities contribute to calendar statuses, Nora's context, progress and the wellness picture.
- **R42** Recurring preferences shape ongoing plans and do not consume training days (R18a). → fixture 05.

## 12 · Nora chat, memory, adaptation

- **R43** Chat covers progress, injuries, pain, schedule changes, preferences and questions. The header carries **"Sees N shared signals →"** into *What Nora knows*; the composer reads *"Message Nora…"*.
- **R43a** The **patch card** has three states: **proposed** (orange, `Proposed plan change`, itemized moves, *"Checked against your plan rules before it touches the calendar."*, **Not now** / **Apply to calendar**); **applied** (green, *"Applied · Thu and Fri updated."*, **View calendar**); **declined** (grey, *"Not applied — plan unchanged."*, **Reconsider**). Applying toasts *"Patch validated · calendar updated"*.
- **R44** Model responses may include structured `memory_writes[]`, persisted as typed, dated entries visible in *What Nora knows*. → fixture 10.
- **R44a** Memory types: **injury**, **preference**, **context**. Injury entries carry `tags[]` (R61).
- **R45** Memory persists across conversations and enters planning and chat context. → fixture 10.
- **R46** Injury entries can be **Resolved** — they grey out, keep a `· resolved` suffix, and stop contraindicating. Every entry can be **Deleted**, confirming *"Removed — out of Nora's context immediately"*.
- **R47** Chat states: **error** — *"Nora couldn't reply — connection dropped."* + **Retry**; **offline** — *"You're offline. Nora will reply when you're back — logging still works."*; **empty** — Nora's intro: *"Hey — I'm Nora, your coach. I build your week, adapt it from what you log and tell me, and explain your readiness in plain language. Tell me how training's been feeling, or ask me anything about the plan."*
- **R48** All text calls use gpt-5-mini via OpenRouter with context assembled by the domain layer, never raw DB dumps.
- **R48a** **The OpenRouter upstream provider is pinned** — an explicit provider preference with fallbacks disabled, so a request reaches the chosen upstream or fails loudly. Constrained decoding is an upstream capability, and R18's rails and R12's schema both depend on schema-valid JSON. Pinned upstream and fallback flag are config.

## 13 · Progress & personal records

- **R49** A **Personal records** section: self-reported records with activity, result and date, added via **+**, which opens an entry sheet. The result field is typed by activity — weight × reps for lifts, elapsed time for runs, seconds for sprints.
- **R50** Progress shows a **readiness trend** with a 14d/30d toggle, a **Consistency** stat (sessions done vs planned), an **Avg readiness** stat, **Signal trends · 30d** sparklines for six signals — weight, sleep, steps, soreness, stress, hydration — and a **Training load** bar chart (14 bars, sessions above threshold accented). No single reductive number.
- **R51** **Workout history** → session detail: title, date, status, difficulty and pain summary, an Exercise / Planned / Actual table colouring shortfalls, and the user's note verbatim.
- **R52** Empty PR state: *"No records yet — add your first PR."*

## 14 · Trust & safety

- **R53** Nora never diagnoses, prescribes treatment, or implies medical clearance. → fixture 08.
- **R54** Concerning symptom reports get referral prose plus a **safety card** with three states: **proposed** (red, *"Pause Thursday's sprint session until you've been seen?"*, **Keep it** / **Pause it**); **paused** (*"Paused · nothing intense until you're cleared by a professional."*); **kept** (*"Kept as planned — the note stays in my memory either way."*). The report is stored as a `context` memory entry either way. → fixture 08.
- **R54a** A paused session is un-paused by the user — *"I've been seen — resume this"* — which reinstates it and writes a second dated `context` entry. Nora never asserts clearance. Regeneration does not un-pause.
- **R55** Safety behaviour is enforced as structured response properties (referral present, no diagnosis, no clearance) plus a deterministic check that safety-flagged replies carry the action card — never by asserting prose strings.
- **R56** All guidance uses plain, supportive, nonjudgmental language. Settings carries: *"Terrain offers wellness guidance, not medical advice. Nora never diagnoses or clears you to train — for anything concerning, see a qualified professional."*

## 15 · Onboarding

- **R57** A 5-step wizard, each step a tag, question and subtitle, with a 5-dot progress row and `Step n of 5`:
  1. **Goal** — *"What are you after?"* Chips: Strength · Endurance · Lean out · General fitness, plus free text.
  2. **Availability** — *"How much time?"* Days 2–6; minutes 20–90 in 5-minute steps, default 45.
  3. **Equipment** — *"What do you train with?"* Commercial gym · Home setup · No equipment, each with a sub-line.
  4. **Activities** — *"What do you enjoy?"* Seven chips, plus a **Recurring — Nora plans around these** list with **+ Add a standing activity**.
  5. **Injuries** — *"Anything to work around?"* Free text, explained as becoming hard rules reviewable in *What Nora knows*.
- **R58** **Build my plan** triggers first generation with *"Nora is building your plan… / Checking it against your knee, your 4 days, and your Saturday run before you ever see it."* → **"Your first week"** preview (summary line, day rows, and *"Every session has warm-up, main and cooldown, with a demo video per exercise. Validated against your intake before it reached you."*) → **Looks good — take me to Today** / **Ask for changes (opens chat)**.
- **R59** Generation failure ⇒ *"That didn't work / Plan generation failed on our side. Your answers are safe — try again."* with **Retry**.
- **R60** Intake persists as the profile in *What Nora knows* — Goal · Availability · Equipment · Keeps — with **Edit**. Intake injuries additionally persist as `injury` memory entries, so R46's Resolve/Delete applies to them.
- **R61** Any injury text entering the system — intake free text or a chat `memory_writes[]` injury entry — is structured into contraindicated exercise tags by the same schema-validated call against the library's tag vocabulary, routed through the context assembler.

## 16 · Architecture

- **R62** 5-tab nav: **Today · Calendar · ＋ · Nora · Progress**. Nutrition opens from Today's nutrition card. **Settings** opens from the gear on the Progress header; **What Nora knows** from Settings and from the Nora chat header, returning to whichever it was opened from.
- **R63** The **context assembler** is the single choke point for text: no code path reaches the text model except through it. It reads profile, logged signals and relevant history from SQLite and typed entries from the memory service directly — those are its inputs, not the caller's. Its five surfaces: chat, plan generation and patches, the readiness explanation, nutrition-gap narration, and intake injury→tag structuring. Any sixth text call is a defect.
- **R63a** **The vision path is separate and carries no user context.** A meal photo goes camera → meal estimator → vision adapter → provider, never through the assembler. The request contains image bytes and a fixed app-authored prompt — no profile, signals, memory or history. A vision request carrying user context is a defect.
- **R63b** The **vision adapter** is a provider-shaped seam: image bytes in, fixture 07's `meal_estimate` schema out. The provider may be a multimodal model or a dedicated food-recognition API. Swapping providers requires no change above the adapter.
- **R64** Deterministic outputs — score, arc, statuses, meal totals, nutrition aggregates — render without waiting on any network call. Model-dependent surfaces have loading and failure fallbacks (R6, R16, R47, R59, R72a).
- **R65** Two credentials via env/config: an OpenRouter key and the vision provider's. Either absent degrades only its own surface; with neither, every deterministic feature stays usable.
- **R66** Domain services take `as_of` as a parameter so fixtures run deterministically.

## 17 · Seed & demo

- **R67** Every count the design displays must equal the data behind it — a plan card reading *6 exercises* opens a session with six. The seed script creates a deterministic demo user: intake profile, **31+ days** of signals (R50 renders a 30-day sparkline), sessions covering every status including one in progress today, memory entries of all three types, meals with photos across at least 3 days, a supplement stack, and PRs. Every figure the design displays — consistency, average readiness, weekly nutrition averages, the weight delta — must be derivable from this data.
- **R68** Settings offers **reset to seeded user** and **reset to fresh (onboarding)**.
- **R69** Seed data is date-relative to install time so the demo always shows a live current week.

## 18 · Out of scope

Strava and Apple Health connections; multiple users and auth; push notifications; wearables; offline model queueing beyond retry; light mode; unit preference; supplement streaks and reminders.

## 19 · Acceptance

Every screen and state reachable from the state rails in `designs/` is reachable in the app; every fixture in `eval/golden/` holds; and the seeded demo carries the full loop — observe, understand, plan, perform, reflect, communicate, adapt.

Fixtures are reviewed by hand: there is no runner, and the `expect` blocks are prose-shaped assertions rather than executable ones.
