# Critic pass — Terrain web build vs. design prototypes

**Summary:** 79 states walked · 3 unreachable · findings: **1 P0 · 9 P1 · 26 P2**. Driven on the web build at 390×844 (fake text/vision models) against `Terrain App.html` / `Terrain Onboarding.html` on 2026-09-01. Accepted differences from `BUILT_NOT_SHOWN.md` (real dates, 84 / 86 g / 1,060 kcal, "· ref" suffix, extra target rows, Demo card, week ‹ ›, cooldown phase, Form video screen, Ask Nora / Reschedule picker / resume button) are not reported.

Severity: **P0** broken or unreachable · **P1** wrong behaviour, wrong numbers or copy drift against a requirement · **P2** visual / copy nit.

---

## Unreachable states

| State | Why |
|---|---|
| Nora · patch card **applied** (green, *"Applied · Thu and Fri updated."*, **View calendar**) and the toast *"Patch validated · calendar updated"* | **Apply to calendar** on the seeded patch is rejected by the rail validator every time (see Nora P0). Not now → Reconsider works; Apply never lands. |
| Sprint player · **end sheet** ("How did it go?") | The final stage (Cooldown 14/14) never opens it: **Skip stage** on the last stage restarts the 5:00 cooldown instead of ending (see Sprint P1). Only a 5-minute real-time wait could reach it; not verified. |
| Calendar · activity sheet **past-due unlogged** variant (*"This was scheduled and never logged — log what happened…"* + **I did it — log it** / **Confirm skipped**) | The seed has no past, unresolved activity (every past row is already completed or skipped) and the app offers no way to create one: a past-day add lands `completed`, Reschedule only offers the visible week. The design shows this variant on the skipped Sprints row. |

Reachable only with a workaround: Nutrition **What's missing · failed / Retry** — see Nutrition P1 (cached narration; needs a page reload before the first open).

---

## Today

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Scored (seeded) | 84 / green arc, "TUESDAY · SEP 1", hero row, Nutrition card, plan card "45 min · 6 exercises · bench focus" — matches design layout and copy. Explanation streams then settles on "7.5 h of sleep and soreness nearly gone — expect steady energy today. Tonight: upper body session as planned." | Same | R1, R6a | — |
| Scored — type & arc | Explanation set ~17 px, near-white, 3 lines; arc stroke ~14 px with a wide soft glow. | Design: explanation ~15 px muted grey (#c8c8c8-ish), 4 lines; arc stroke ~9 px, tighter glow. | design | P2 |
| Shimmer → stream → done | Three phases present; stream ~12 chars/s; leaving and returning to Today replays the stream (design "Replay explanation stream"). | Same | R6 | — |
| LLM error → fallback | "Readiness 84 · green — top factors: sleep 7.5 h, low soreness." + orange "Couldn't reach Nora — retry explanation". Matches design. Retry with Error still set stays failed; with OK set the stream resumes. | Same | R6 | — |
| Rest day | After rescheduling today's Upper body to Wed: plan card reads "TODAY'S PLAN / REST — HERE'S WHY / Two hard sessions back-to-back this week. Today is for absorbing them — easy walking and sleep are the workout." No Start button. Matches design. | Same | R6b | — |
| Insufficient data (fresh) | `--` under "Readiness", the exact R5 sentence, **Log now** (→ Log tab), hero row shows `-- h`, `--`, `-- lbs`, `-- / 5`. Matches design. | Same | R5 | — |
| Partial signals (fresh + Sleep 7.5 h + Energy 3) | Score 80, green, ordinary layout, no "missing" notice; unlogged hero values stay `--`. | Same (design shows 56 / yellow with its own data) | R4 | — |
| Nutrition card after a saved meal | Protein 139 / 120 g · 1,700 kcal — agrees with Nutrition screen and calendar Day view. | Same | R73 | — |

## Nutrition

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Macros vs micronutrients | **Today's macros → Fiber "7 g / 30 g"**; **Micronutrients → Fiber "6.5 / 30 g"** on the same screen. | One value: the design shows 14 g in both rows. | R70/R71, design | **P1** |
| What's missing — narrated vs fallback | Narrated list says "Fiber · avg 14 g / 30 g"; the deterministic failure line says "Biggest gaps, last 14 days: Fiber 13 g / 30 g · Iron 9 mg / 18 mg · Calcium 565 mg / 1,000 mg." | Both derive from the same 14-day aggregate → the same number. | R72, R72a | **P1** |
| What's missing — failure / Retry reachability | With **Nora replies: Error** set in-session (before or after **Reset to seeded user**) the narrated list still renders instantly — the gap narration is cached for the session and survives a data reset. The failure state (fallback line + **Retry**) appears only if Error is set on a freshly reloaded page before the first Nutrition open. Retry then works (stays failed under Error, loads under OK). | The recipe in CRITIC_PROMPT ("Retry on failure via Nora replies: Error") must work without a reload; a data reset must drop derived narration. | R72a, R68 | **P1** |
| This week · protein days | "1 / 3 PROTEIN DAYS HIT" (denominator = elapsed days). Calendar week card shows the same "1 / 3" (consistent). | Design Nutrition shows "2 / 7" (whole week) — note the design's own calendar card shows "2 / 3", so the prototype disagrees with itself. Flagged for a decision. | R73, design | P2 |
| Header | "NUTRITION / Week of Aug 30 – Sep 5", back chevron — matches. | Same | R70 | — |
| Micronutrients, footnote, Supplements block, Logged meals (thumbnails, per-day totals) | Match the design structurally and in copy. Supplement toggles here sync with the Log sheet ("3 / 4 TAKEN TODAY"). | Same | R71, R74, R75 | — |

## Calendar

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Planned week (seeded) | Strip Aug 30–Sep 5 (all seven cells outlined, as in the design's week state), "WHOLE WEEK · 6 activities · Sun to Sat", rows Upper body ✓ 6/6 · Sprints skipped 6 × 20 s · Run ✓ 2 of 3 miles · Upper body **Today · Starts 7:00 PM · START** · Lower body Planned · Run Planned; Nutrition · this week card with dot strip. | Design has 7 rows incl. a **Pickleball Sun** standing activity (completed, no subtitle). The seed carries no `standing_preference` row in the current week. | R24b/R18a, design | P2 |
| Week row **START** pill | Tapping the orange START on the "now" row opens the activity sheet (then Start session). | Design row carries **Start** as the action itself. Minor extra tap. | R24 | P2 |
| **START** pill on non-guided row | An ad-hoc **Padel** added for today shows the START pill in the week list; its sheet has no Start session (only Mark done). | No START on activities without a guided player. | R40 | P2 |
| Single day (today) | "TUESDAY / Sep 1 · Today · 1 activity", Upper body row with START, **FOOD · Snap a meal** + two meal cards. Matches design. | Same | R77, R79 | — |
| Single day — future planned day (Thu 3) | Activity row, then FOOD section with the dashed "Snap a pic of a meal and it lands here as a card." — **no "Snap a meal" link** (only today has it). | R79: empty Food offers **Snap a meal** with that copy. | R79 | P2 |
| Empty day (Fri 4) | Order is **FOOD (empty)** first, then the **REST DAY** card ("Nothing planned. Walk, stretch, sleep — Nora built the week around it."). | Copy matches R29; the design's Day view puts activities above Food, so the Rest-day card should precede Food. | R29, design | P2 |
| Empty week (Sep 13–19) | "NOTHING PLANNED YET / Nora hasn't planned this week yet." + **Generate my week** in a dashed card. Matches design. Header reads "WEEK OF SEP 13". | Same | R29 | — |
| Regenerating | Spinner + "NORA IS REBUILDING THIS WEEK / The calendar is locked while the new plan is validated. Usually under a minute." ~1.5 s, then 5 rows. Matches design. | Same | R29, R23 | — |
| Generated week naming | Generated sprint row is titled **"Sprints ×6"**; seeded weeks title it **"Sprints"** (subtitle carries "6 × 20 s"). | One naming. | design | P2 |
| Month | 7-column grid, status dots, today highlighted, legend "Completed · Skipped · Planned", ‹ › nav, **Back to today** appears once you leave the current month, selecting a day shows "TUESDAY, SEP 8, 2026 / Planned · Sprints". Matches design. Note: the view remembers the last visited month when you switch Week → Month. | Same | R78 | — |
| Activity sheet — completed / skipped | "UPPER BODY / Sun 30 · Completed · 6/6 exercises" + Reschedule + Ask Nora. "SPRINTS / Mon 31 · Skipped · 6 × 20 s" + Reschedule + Ask Nora. | Design's skipped Sprints sheet shows the past-due notice + **Start session / I did it — log it / Confirm skipped / Reschedule**. (R24c says skipped is already resolved, so the design conflicts with the PRD — decision needed.) | design vs R24c/R40 | P2 |
| Activity sheet — now (today gym) | "Today · Starts 7:00 PM" + **Start session / Mark done / Reschedule / Ask Nora to change**. Matches design (+accepted extra). | Same | R40, R82 | — |
| Activity sheet — pending future gym (Lower body Wed 2) | Shows **Start session** (orange) + Reschedule + Ask Nora. Starting it and pressing Save session / Finish marks a **future** session `completed` today ("Lower body Wed 2 · Completed · 1/6 exercises"; next week's Sprints Tue 8 → "Completed · 6 × 20 s"). | Design's pending sheet carries only **Reschedule**; a future-dated session should not be completable today (only today-or-earlier resolves, cf. R40b). | design, R24/R40b | **P1** |
| Activity sheet — pending non-guided future (Pilates Thu 3) | Reschedule + Ask Nora only; **no Mark done**. Correct. | Same | R40b | — |
| Activity sheet — ad-hoc today (Padel) | Subtitle line reads **"Today · Today · 45 min · Easy"** (date label + subtitle both say Today). | "Today · 45 min · Easy". | R26a | P2 |
| Mark done (today Padel) | Row → "Completed · 45 min · Easy", toast "Logged · Nora will factor it in", appears in Progress history. Correct. | Same | R40, R40b | — |
| Add activity — past day | Chips, Day picker, Duration −/+ 15-min steps (min 15, default 45), Intensity; button flips to **Log to calendar**; lands "Yoga Sun 30 · Completed · 30 min · Hard", toast "Logged · Nora will factor it in". Matches design + R26a. | Same | R26, R26a | — |
| Add activity — today / future | **Add to calendar**; today → "Today · 45 min · Easy", future → "Planned · 45 min · Moderate"; toast "Added to calendar"; appears in Day and Month (dot on Sep 3, "10 activities · September"). | Same | R26, R26a | — |
| Reschedule | Inline 7-day picker + **Move**; today's Upper body → Wed 2 immediately; Today flips to Rest day. | Same (accepted) | R27 | — |
| Ask Nora to change | Opens Nora with composer prefilled "Can we change Lower body on Wednesday?". | Same (accepted) | R28 | — |
| Paused session (after Pause it) | Row "Sprints Tue 8 · Paused · until you've been seen"; sheet offers **I've been seen — resume this** → back to Planned, second `context` memory entry written. | Same | R54, R54a | — |
| Nutrition · this week (future week) | Card reads "0 g · 0 · 0 / 0 PROTEIN DAYS HIT" with seven grey dots. | An empty/future week needs an empty treatment rather than zeros. | R73 | P2 |
| Sheet close / a11y | The × close is a `div` with `aria-label="Close"` but no `role="button"`; supplement rows likewise have no role. | Interactive controls need a role. | — | P2 |

## Log

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Grid | 10 tiles in the design's order and labels ("STRESS / MOOD", "MEAL 📷"), orange + tab. Matches. | Same | R7 | — |
| Numeric sheets | SLEEP 7.5 HOURS (±0.5), ENERGY/SORENESS/STRESS "OUT OF 5" (±1), STEPS 8,500 (±500), HYDRATION 2.00 LITERS (±0.25), WEIGHT 154.5 LBS (±0.5); −/+ and **Save**. Match the design's sheets. | Same | R8 | — |
| Saved toast | "Saved · Nora will factor it in"; Today re-scores (84 → 82 after sleep 7.0). | Same | R8, R10 | — |
| Supplements sheet | "2 / 4 taken today", four rows toggling Taken / Not yet, **Done**; header updates to 3 / 4 and Nutrition agrees. Matches design. | Same | R75 | — |
| Activity tile | Jumps to Calendar with the Add activity sheet open. | Same | R7 | — |

## Meal photo

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Camera → analyzing → estimate | "Hold steady — capturing automatically" (~3 s) → "Nora is looking at your plate…" → "ESTIMATES, NOT MEASUREMENTS · confidence: medium", three items with portion/kcal/macros, **+ Add item**, MEAL TOTAL ~640 kcal · 53 g · 50 g · 24 g, the R13 sentence, **Discard / Save meal**. Matches design. | Same | R12–R14, R16 | — |
| Edit portion | Edit → inline PORTION −/+ in 0.25 steps; item and totals recompute live (313 kcal, 58 g at ×1.25; total 703). Remove drops the item and totals (633). | Same | R15 | — |
| + Add item | The MANUAL ENTRY form (Food, kcal, Protein g, Carbs g, Fat g, **Add item**) renders **above** the "Estimates, not measurements" heading, between the photo and the list. | R15: manual entry appends to the same list — the form belongs at the list's end (design shows the list uninterrupted). | R15 | P2 |
| Discard | Returns to Log; nothing written (Today still 1,060 kcal). | Same | R15 | — |
| Save meal | Toast "Meal saved · totals computed on device"; Today, Nutrition macros, This week and Day-view Food all agree (1,700 kcal / 139 g). | Same | R15, R73 | — |
| Vision failed | "Couldn't read the photo / No estimate this time — add the meal by hand instead." + **Retry photo** / **Enter manually**; Retry re-captures; Enter manually opens the same form. Matches design. | Same | R16 | — |

## Nora

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| **Apply to calendar** | Card stays **proposed**; toast: *"Patch rejected: recurring preference "run · 3 miles" on 2026-09-13 is not kept as a standing activity"*. The seeded patch (Move Sprints Tue → Fri, next week) can never be applied — the rail is checking the recurring-run rule against the wrong week/date (Sep 13 is the Sunday after the target week; the seeded run is Sat Sep 12). | Applied state: green "Applied · … updated.", **View calendar**, toast "Patch validated · calendar updated"; next week's Sprints moved to Fri. | R43a, R28, R18 | **P0** |
| Patch thread (seeded) | User bubble + Nora reply + orange PROPOSED PLAN CHANGE card with one item "→ Move Sprints from Tue to Fri", the R43a sentence, **Not now / Apply to calendar**. | Design card carries two items (Move + "⇄ Swap Back squat → Leg press on Thu"). Seed content differs. | design | P2 |
| Not now / Reconsider | Grey "PLAN CHANGE · NOT APPLIED" + "Not applied — plan unchanged." + **Reconsider**; Reconsider restores the proposed card. Correct. | Same | R43a | — |
| Safety reply | Sending the chest-pain line → referral prose (design copy verbatim) + red SAFETY CHECK card "Pause **Tuesday's sprints session** until you've been seen?" **Keep it / Pause it**. | Copy: design/PRD say "…**sprint** session". | R54, design | P2 |
| Pause it / Keep it | Paused: "SAFETY · SESSION PAUSED" + "Paused · nothing intense until you're cleared by a professional."; Kept: "Kept as planned — the note stays in my memory either way."; resume writes "Resumed — you told me you've been seen. The notes stay in my memory." A `context` memory entry lands in both cases. Matches design. | Same | R54, R54a | — |
| LLM error · retry | "Nora couldn't reply — connection dropped." in a dashed red block + **Retry**; Retry under Error stays failed. Matches design. | Same | R47 | — |
| Error state after leaving the tab | Switch to another tab and back: the error block and **Retry** vanish; the user's message ("How is my week looking?") sits with no reply and no way to retry. Retrying later under OK is impossible. | The failed turn must persist with its Retry until resolved. | R47 | **P1** |
| **Offline** | With **Nora replies: Offline** set, sending a message shows the **error** copy ("Nora couldn't reply — connection dropped." + Retry). | "You're offline. Nora will reply when you're back — logging still works." (design: single muted centred line, no Retry). | R47 | **P1** |
| Empty history · intro (fresh) | Nora's intro paragraph verbatim; header "Sees 0 shared signals →", then "Sees 2 shared signals →" after logging two. Matches design. | Same | R47, R9 | — |
| Ask for changes (from onboarding preview) | Lands in Nora with composer prefilled "I'd like to change my first week: ". | Same | R58 | — |

## What Nora knows

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| With memory (seeded) | Profile card (Goal / Availability / Equipment / Keeps + **Edit**), MEMORY list with CONTEXT / INJURY / PREFERENCE pills, newest first, Resolve on injuries, Delete on all. Layout matches design. | Same | R44a, R60 | — |
| Keeps copy | "Keeps · **3 miles run**, Saturdays"; fresh profile shows "Keeps · Running" (an *enjoyed-activity chip*, not a standing activity). | Design: "Keeps · 3-mile run, Saturdays"; Keeps should list standing activities only. | R60, design | P2 |
| Resolve | Injury greys out, date gains "· resolved", Resolve button disappears. Correct. | Same | R46 | — |
| Delete | Immediate removal + toast "Removed — out of Nora's context immediately" (no confirm dialog). Acceptable reading of R46. | Same | R46 | — |
| Empty memory (fresh) | "Nora only knows your intake profile so far." Matches design. | Same | R60 | — |
| Back navigation | From Nora header → back returns to Nora; from Settings row → back returns to Settings. Correct. | Same | R62 | — |

## Progress

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| With PRs (seeded) | Readiness trend 14d/30d, Consistency "12/15 · last 3 weeks", Avg readiness 80, six sparklines with deltas, Training load 14 bars + caption, Personal records (3), Workout history. Structure matches design. | Same | R49, R50 | — |
| Readiness trend chart | Line hugs the top ~15 % of a ~170 px box with the dashed baseline just beneath and a large empty area below. | Design: ~90 px chart with the line scaled to fill and the dashed threshold mid-chart. | design | P2 |
| Consistency vs history | "12/15" cannot be reconciled on-screen: Workout history is capped at 8 rows (Aug 24–25 sessions drop off once new ones land), and nothing states which 15 were counted. | History should cover the consistency window, or the stat should say what it counts. | R50, R51 | P2 |
| PR entry sheet | "ADD A PR / Self-reported — Nora keeps the record", Activity text, Kind LIFT/RUN/SPRINT (result typed: weight × reps / elapsed time / seconds), Date −/+, live Result, **Save** → toast "PR added", row appears. Works. | Prototype's + is dead (no design to compare). | R49 | — |
| Empty PRs (fresh) | "No records yet — add your first PR." Matches design. | Same | R52 | — |
| Session detail (seeded Upper body Sun 30) | Title, "Sun Aug 30 · completed · difficulty 3/5 · pain: right shoulder", Exercise / Planned / Actual table with amber shortfall (2 × 120 × 10), "Note to Nora: …". Matches design (plus accepted warm-up/cooldown rows). | Same | R51 | — |
| Session detail after **Finish** (today's Upper body) | Header "completed · difficulty 4/5 · pain: right shoulder", every Actual cell reads **"0 sets"** — yet Today and the calendar row read **"Completed · 6/6 exercises"**. | Counts must be done / total from the logged sets (R24a); the checked warm-up set should be recorded (see Gym player). | R24a, R34 | **P1** |
| Fresh Progress | "CONSISTENCY 0/0", sparklines "not enough data", Training load caption "Peaks in range — no overload risk" with no sessions, Workout history with no rows and no empty-state copy. | Empty treatment for history/load. | R50, R51 | P2 |

## Settings

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Layout | Back, "SETTINGS", What Nora knows row, TARGETS · USED BY READINESS (Protein 120 g, Hydration 2.50 L, Daily steps 10,000 + accepted extra rows), Demo card, disclaimer verbatim. Matches design. | Same | R11, R56, R68 | — |
| Target steppers | Protein + → 125 g propagates to Today card, Nutrition macros and readiness (84 → 83). Hydration ±0.25 L, steps ±500. | Same | R11, R11b | — |
| Demo toggles persistence | Nora / Vision / Plan-generation toggles reset to OK on a page reload (the app state itself persists). | The brief says the plan-generation flag "survives the reset"; it does not survive a reload, so failure recipes must be re-armed after any reload. | R68 (demo) | P2 |

## Gym player

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Video / overlay | Full-bleed looping video, 6-segment bar, "WARM-UP · EXERCISE 1 OF 6", elapsed, name, "Nora: …" cue, "0 / 2 SETS LOGGED", "Slide up to log sets" hint. Matches design (design has 4 exercises / black backdrop). | Same | R30, R80 | — |
| Tap left / right | Left 40 % → previous, right 60 % → next, right on the cooldown → end sheet. Works. | Same | R80 | — |
| Set panel | Name, **Form video**, rows "Set n · − 45 lbs + × − 12 +", **Next** (reads **Cooldown** on exercise 5), **End session**. Checking a set → "REST 1:30 · Skip", weight/reps freeze on the done row. Matches design. | Same | R31 | — |
| **Form video → Back** | Returning from the Form video screen restarts the session: elapsed resets to 0:00 and the checked set is lost (session detail later shows 0 sets). | Session state must survive the Form video round-trip. | R20, R31, R34 | **P1** |
| Form video screen | Two stacked status bars ("9:41" twice); the demo video area renders black in the browser. | One status bar. | design (accepted screen) | P2 |
| End sheet | "HOW DID IT GO? / HOW HARD WAS THAT? 1–5 / Any pain? (toggle → 'Where? (e.g. right shoulder)') / Note for Nora (optional) / Finish → marks completed". Matches design. Finish toasts "Session saved · Nora will factor it in". | Same | R32 | — |
| Finish → status | Today card and calendar row become "Completed · 6/6 exercises" regardless of sets logged (0 here). | "done / total … never fixed". | R24a | (see Progress P1) |
| Leaving mid-session | "LEAVING MID-SESSION / You've done N sets. Save the session? Everything you did counts as completed." + Save / Discard / Keep training. Keep returns to the player; Discard leaves the row Planned; Save → "Completed · 1/6 exercises", toast "Saved · 1 sets recorded". Matches design. | Copy nit: "1 sets". | R33 | P2 |

## Sprint player

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Structure & colours | "SPRINT SESSION · n / 14 STAGES", warm-up 10:00 (dark) → SPRINT 1/6 0:20 (orange) → RECOVERY 1:30 (deep green) … → COOLDOWN 5:00 (dark); label, big countdown, purpose + safety lines, 14-dot strip, **Pause/Resume**, **Skip stage**. Matches design and R36/R37. | Same | R36–R38 | — |
| **Final stage** | On COOLDOWN 14/14, **Skip stage** resets the countdown to 5:00 and stays on the stage; the end sheet never opens. | Completing (or skipping) the final stage opens the end sheet. | R38, R39 | **P1** |
| Exit (×) | "LEAVING MID-SESSION / You've done **13 sets**…" — stages counted as "sets". Save → "Sprints Tue 8 · Completed · 6 × 20 s" (a future session, see Calendar P1). | Wording for sprints (stages/intervals). | R33, R39 | P2 |

## Onboarding

| State | What it shows | What it should show | Req | Sev |
|---|---|---|---|---|
| Steps 1–5 | Tag / question / subtitle, 5-segment progress, "STEP n OF 5", chips, free text, days 2–6, minutes −/+ in 5-min steps (default 45), equipment cards with sub-lines, seven activity chips, Recurring list + **+ Add a standing activity** (Activity, Detail, weekday chips, Cancel/Add), injuries text + explainer. Copy matches the design throughout; Next disabled until a choice is made. | Same | R57 | — |
| Every onboarding screen | Two stacked status bars ("9:41" twice) at the top of steps 1–5, building, failed and preview. | One status bar (design). | design | P2 |
| Building | Spinner + "NORA IS BUILDING YOUR PLAN… / Checking it against your limits, your 4 days, and your preferences before you ever see it." (generalised when no injury / standing activity was given). | Same as R58 modulo data. | R58 | — |
| Generation failed → Retry | "THAT DIDN'T WORK / Plan generation failed on our side. Your answers are safe — try again." + **Retry**; Retry re-runs (fails again under Fail). Matches design. | Same | R59 | — |
| Answers after a reload | Reloading on the failed screen restarts at Step 1 with every answer cleared, contradicting "Your answers are safe". | Intake answers persist until the plan is built. | R59 | P2 |
| Plan preview | "YOUR FIRST WEEK / 4 training days." + day rows + the R58 validation sentence + **Looks good — take me to Today** / **Ask for changes (opens chat)**. | Row subtitle order differs from design: app "45 min · 6 exercises · bench focus", design "45 min · bench focus · 6 exercises". | R58, design | P2 |

---

## P0 / P1 list

1. **P0 · Nora** — Apply to calendar always rejected ("Patch rejected: recurring preference "run · 3 miles" on 2026-09-13 is not kept as a standing activity"); applied card, View calendar and the "Patch validated · calendar updated" toast are unreachable. R43a / R28.
2. **P1 · Nora** — Offline toggle renders the error copy + Retry instead of "You're offline. Nora will reply when you're back — logging still works." R47.
3. **P1 · Nora** — Leaving the chat drops the failed turn's error block and Retry; the message is left unanswered with no recovery. R47.
4. **P1 · Gym player** — Form video → Back resets the session (timer 0:00, logged set lost). R20/R31/R34.
5. **P1 · Gym / Progress** — Finish marks "Completed · 6/6 exercises" on Today and the calendar while the session detail shows "0 sets" for every exercise. R24a / R34.
6. **P1 · Sprint player** — Skip stage on the final cooldown restarts it; the end sheet never opens. R38 / R39.
7. **P1 · Calendar** — Pending future gym/sprint sessions carry Start session and can be saved/finished as `completed` today (design's pending sheet has only Reschedule). R24 / R40b spirit, design.
8. **P1 · Nutrition** — Fiber 7 g (macros) vs 6.5 g (micronutrients) on one screen. R70/R71.
9. **P1 · Nutrition** — What's-missing narration (avg 14 g fiber) disagrees with the deterministic fallback (13 g). R72/R72a.
10. **P1 · Nutrition** — Gap narration is cached for the session and survives Reset to seeded user; the failure/Retry state is unreachable by the documented recipe (needs a reload first). R72a / R68.

---

## Resolution log (builder, 2026-09-01)

| # | Finding | Resolution |
|---|---|---|
| P0 | Apply to calendar always rejected | **Fixed.** `applyPatch` derived the week with `new Date(iso).getDay()` (UTC parse → previous day in US zones), so the rail checked the standing run against the wrong week. Now uses the local `weekStart`. Regression test `planService.test.ts` applies the seeded patch on three weekdays. |
| P1 | Offline shows error copy | **Fixed.** Offline hides the error block; the notice line is the whole state. The unanswered turn regains Retry once back online. |
| P1 | Failed turn lost on leaving the tab | **Fixed.** The error block + Retry are derived from history (last message is the user's) so they persist. |
| P1 | Form video → Back reset the session | **Fixed.** In-progress gym state lives in a module cache keyed by activity until saved/discarded. |
| P1 | Finish "6/6" vs detail "0 sets" | **Fixed.** Finish with nothing ticked records every prescribed set as done; detail and calendar agree. |
| P1 | Sprint final Skip restarted cooldown | **Fixed.** Skip on the last stage opens the end sheet. |
| P1 | Future sessions startable | **Fixed.** Startable only today-or-earlier again. Reschedule now pages weeks, so a future sprint can be moved to today and started (recipe updated). |
| P1 | Fiber 7 g vs 6.5 g | **Fixed.** One gram formatter for both rows. |
| P1 | Narration 14 g vs fallback 13 g; cache survives reset | **Fixed.** The narration cache is keyed by the aggregate itself, the seed marker and the Nora demo flag — a reset or a flag change re-narrates, and both surfaces read the same aggregate. |
| P2 | Doubled status bar (onboarding, form video) | Fixed. |
| P2 | "Today · Today · 45 min" | Fixed. |
| P2 | "1 sets" / "13 sets" (sprint) | Fixed (pluralised; sprints say stages). |
| P2 | "sprints session" in the safety card | Fixed ("sprint session"). |
| P2 | Rest-day card below Food | Fixed (rest card first). |
| P2 | START pill on a non-guided row | Fixed (guided sessions only). |
| P2 | Readiness-trend line pinned to the top | Fixed (y-axis scaled to the data; dashed line = the green threshold). |
| P2 | History capped at 8 rows | Fixed (30 rows, covers the consistency window). |
| P2 | Fresh Progress history has no empty copy | Fixed. |
| P2 | "Sprints ×6" vs "Sprints" | Fixed (planner names it "Sprints"). |
| P2 | Keeps copy "3 miles run" / "Running" | Fixed ("3-mile run, Saturdays"; standing activities only). |
| P2 | Intake answers wiped on reload | Fixed (the saved intake is restored at step 5). |
| P2 | Demo toggles reset on reload | Fixed (persisted in the DB meta table). |
| P2 | Sheet close / supplement rows lack a role | Fixed for the sheet close; supplement rows carry an accessibilityLabel. |
| P2 | Empty-week nutrition card shows zeros | Fixed (dashes when no day is logged). |
| P2 | Non-today days lack "Snap a meal" | **Accepted** — the design offers it on today only (`dayFoodLoggable: calDayIdx===3`); a meal saves with today's date. |
| P2 | Manual entry renders above the list | **Accepted** — matches the design's block order (design wins over R15's "appends"; the item still appends to the list). |
| P2 | Skipped sprint sheet lacks the past-due buttons | **Accepted** — R24c: skipped is a resolution; the prototype's skipped row carrying past-due flags is a prototype data artifact. |
| P2 | Seed lacks the design's Pickleball standing activity / 2-item patch | **Accepted** — the demo user keeps one standing activity (the run, per the intake); pickleball is ad-hoc. The patch is one move because the knee rule already keeps back squats out of the plan. |
| P2 | Protein days "1 / 3" vs design "2 / 7" | **Accepted** — R73 requires the same denominator on both surfaces; the prototype disagrees with itself (2/3 on the calendar). Logged days it is. |
| P2 | Arc stroke/glow, explanation type size | **Accepted** — sizes match the design's CSS (10 px stroke, 14 px/1.55 copy); the glow is a wider translucent stroke standing in for the drop-shadow filter. |
| P2 | START pill opens the sheet first | **Accepted** — the prototype's pill is a badge inside the row button; the sheet's Start session is one tap away. |
| P2 | Preview subtitle order | **Accepted** — the two design surfaces disagree; Today's order is used everywhere. |

---

## Verification pass (round 2)

Driven on the web build at 390×844 on 2026-09-01 after the fix round, starting from Settings → Demo → Reset to seeded user. Each **Fixed** row of the Resolution log was re-run with its original recipe; the three previously unreachable states were re-walked with the updated `CRITIC_PROMPT.md` recipes. **Verified: 28 PASS · 1 FAIL.** New findings: **0 P0 · 2 P1 · 8 P2.**

| Item | Result | Evidence |
|---|---|---|
| P0 · Nora **Apply to calendar** → applied state + toast | PASS | Card flips to green "PLAN CHANGE · APPLIED / → Move Sprints from Tue to Fri / Applied · Tue and Fri updated. **View calendar**"; toast "Patch validated · calendar updated"; next week's Sprints now sits on Fri 11. (Screenshot: applied card.) |
| Sprint player **end sheet** (new recipe) | PASS | Next week → Sprints → Reschedule → ‹ → Tue 1 → Move → row "Sprints · Today · Starts 6:30 PM · START" → Start session → Skip stage ×13 → COOLDOWN 14/14 → Skip → "HOW DID IT GO?" sheet (difficulty 1–5, Any pain?, note, Finish → marks completed). Finish → row "Completed · 6 × 20 s", toast "Session saved · Nora will factor it in". (Screenshot: end sheet over the cooldown.) |
| Activity sheet **past-due unlogged** (new recipe) | PASS | Lower body Wed 2 → Reschedule → Mon 31 → Move → row "Lower body · Mon 31 · Not logged · 45 min planned"; sheet shows the orange notice "This was scheduled and never logged — **log what happened** so the week reads true." + Start session / **I did it — log it** / Confirm skipped / Reschedule / Ask Nora. I did it → "Completed · 6/6 exercises" + toast "Logged · Nora will factor it in". Run Sat 5 → Sun 30 → Confirm skipped → "Skipped · logged" + toast "Logged as skipped · Nora will adjust". (Screenshot: sheet.) |
| P1 · Offline copy | PASS | Nora replies: Offline → send "How is my week looking?" → single muted centred line at the top of the thread "You're offline. Nora will reply when you're back — logging still works."; no error block, no Retry; the message sits unanswered. Design's Offline state shows the same line (with an empty thread). |
| P1 · Error Retry persists across tabs | PASS | Error set → the unanswered turn shows "Nora couldn't reply — connection dropped." + **Retry**; Retry under Error stays failed; Today → Nora: block + Retry still there; OK set → Retry → reply lands ("Readiness is 84 today (green)…"). |
| P1 · Gym Form video round-trip | PASS | Set 1 ticked at 0:06 → Form video (single status bar, Back / Open on YouTube) → Back: "1 / 2 SETS LOGGED" kept, clock reads 0:11 a few seconds later (kept running). Note: the REST 1:30 countdown is dropped on return (P2 below). |
| P1 · Finish with no sets ticked | PASS | Start session → End session → difficulty 4 → Finish. Session detail "Tue Sep 1 · completed · difficulty 4/5 · no pain" lists every exercise with Actual = Planned (2 × 45 × 12, 3 × 135 × 8, 3 × 50 × 10, 3 × 120 × 10, 3 × 110 × 12, 2 × 0 × 30); calendar row "Completed · 6/6 exercises". |
| P1 · Future sessions not startable | PASS | Next week's Sprints (Planned) sheet shows only Reschedule + Ask Nora to change; Reschedule picker pages weeks with ‹ › (Sun 30 – Sat 5 after ‹). |
| P1 · Fiber macros vs micronutrients | PASS | Today's macros "Fiber 6.5 g / 30 g"; Micronutrients "Fiber 6.5 / 30 g". |
| P1 · Narration vs fallback number | **FAIL** | Under OK the narrated list reads "Fiber · **avg 14 g** / 30 g"; under Error the deterministic line reads "Biggest gaps, last 14 days: **Fiber 13 g** / 30 g · Iron 9 mg / 18 mg · Calcium 565 mg / 1,000 mg." Iron and calcium agree; fiber still differs by 1 g between the two surfaces (rounding of the same aggregate, or a hard-coded 14 in the fake narration). R72/R72a. |
| P1 · What's missing fails without a reload; Retry recovers | PASS | Error set in-session (after a seeded reset) → Nutrition renders the fallback line + **Retry** immediately; Retry under Error stays failed; OK set → the list re-narrates (Retry under OK also loads it). |
| P2 · Single status bar (onboarding, form video) | PASS | One "9:41" on steps 1–5, Building, Failed, Preview and on the Form video screen. |
| P2 · "Today · Today · 45 min" (sheet) | PASS (sheet) / see new finding | Padel sheet subtitle "Today · 45 min · Moderate". The **week row** still reads "Padel  Today / Today · 45 min · Moderate" (new P2). |
| P2 · "1 sets" / "13 sets" | PASS | Gym: "You've done 1 set."; sprint: "You've done 2 stages." |
| P2 · "sprint session" safety copy | not re-run | Copy-only change; not re-driven this pass. |
| P2 · Rest-day card above Food | PASS | Day view Fri 4: "REST DAY / Nothing planned. Walk, stretch, sleep — Nora built the week around it." then "FOOD / Snap a pic of a meal…". |
| P2 · No START pill on a non-guided today row | PASS | Ad-hoc Padel today: orange clock icon, no START pill; sheet offers Mark done / Reschedule / Ask Nora. (Screenshot: week list.) |
| P2 · Readiness trend line fills its box | PASS (residual nit) | Line now spans the plot's vertical range with the dashed threshold beneath the dip; ~50 px of empty space remains between the dashed line and the "Aug 19 / today" axis labels. |
| P2 · History longer than 8 rows | PASS | Seeded: 20 rows (Aug 9 – Aug 31); after two sessions today: 24 rows, CONSISTENCY 15/19. |
| P2 · Fresh Progress history empty copy | PASS | "No sessions logged yet — start one from Today or the calendar." (Training-load caption on a fresh account still reads "Peaks in range — no overload risk" with no sessions — unchanged from round 1's P2.) |
| P2 · Generated week naming "Sprints" | PASS | Onboarding preview and calendar rows read "Sprints". |
| P2 · Keeps copy | PASS | What Nora knows: "Keeps · 3-mile run, Saturdays". |
| P2 · Intake answers survive a reload | PASS | Plan generation: Fail → Reset to fresh → Strength / 4 days / Commercial gym / Running / "Left ankle — no jumping" → Build my plan → "THAT DIDN'T WORK … Retry" → reload → lands on STEP 5 OF 5 with the injury text restored; Back shows Running and 4 days still selected. |
| P2 · Demo toggles persist across reload | PASS | Vision: Fail + Plan generation: Fail set → reload → both still highlighted; Meal → "Couldn't read the photo". |
| P2 · Empty-week nutrition card | PASS (partial) | Next week: "-- g / -- / **0 / 0** PROTEIN DAYS HIT" — the protein-days cell still shows zeros. |
| Sweep · Today (seeded) | PASS | 84 / green, hero row, Nutrition 86 / 120 g · 1,060 kcal, plan card; explanation streams. |
| Sweep · Calendar week / day / month | PASS | Week strip, rows, nutrition card; Day view header "Sep 1 · Today · 3 activities"; Month "7 activities · September", first tap selects a day ("THURSDAY, SEP 10, 2026 / Planned · Lower body"), second tap opens Day view. |
| Sweep · Log sheets · Meal flow | PASS | Sleep −0.5 → Save → "Saved · Nora will factor it in"; Meal: capture → estimate (3 items, ~640 kcal) → Save meal → toast; Today reads 139 / 120 g · 1,700 kcal. |
| Sweep · Nora · What Nora knows · Settings | PASS | Patch thread, applied card, safety memory list (Resolve/Delete), Settings targets + Demo card; Reset to seeded / fresh both work. |

### New findings (round 2)

| State | Shows | Should show | Req | Sev |
|---|---|---|---|---|
| Today · plan card with two activities today | After the moved Sprints is completed, TODAY'S PLAN shows "6:30 PM / SPRINTS / Completed · 6 × 20 s" and hides the still-pending **Upper body 7:00 PM** (and later the pending Padel) — no ▶, no way to start it from Today. | The card should surface the next pending session of the day (or all of today's activities); a completed one should not mask a pending guided session. | R6 / R24 | **P1** |
| Onboarding · plan preview | "YOUR FIRST WEEK / **4 training days.**" above **three** rows (Lower body TUE, Sprints THU, Upper body FRI); the calendar week then holds 3 activities. | The count and the rows must agree (either 4 rows or "3 training days this week — 4 from next week"). | R58 | **P1** |
| Nora · applied patch → View calendar | Lands on **this week** (Aug 30 – Sep 5) although the patch changed next week. | Jump to the week the patch touched (Sep 6 – 12). | R43a | P2 |
| Nora · applied patch result | Next week now carries **Sprints Fri 11 and Upper body Fri 11** on the same day. | The rail should keep sprints and a gym session off the same day, or the card should say both land on Fri. | R18 / R43a | P2 |
| Calendar · week row for an ad-hoc today activity | "Padel  Today / **Today** · 45 min · Moderate" — date label and subtitle both say Today (the sheet fix did not reach the row). | "Padel  Today / 45 min · Moderate". | R26a | P2 |
| Calendar · confirmed-skipped row | Subtitle "Skipped · **logged**" while the seeded skipped row reads "Skipped · 6 × 20 s". | One convention (status + planned detail, e.g. "Skipped · 30 min planned"). | R24c | P2 |
| Gym player · Form video round-trip | The REST 1:30 countdown started by ticking a set is gone on return. | Rest timer continues (or resumes with the elapsed time) alongside the session clock. | R31 | P2 |
| Onboarding · Plan generation: Fail persisted | With the flag persisted, the failed onboarding can only Retry into another failure — Settings is unreachable before the plan exists, so the demo is a dead end until storage is cleared. | A way out (Retry succeeds after N failures, or a demo escape on the failed screen). | R68 (demo) | P2 |
| Nutrition · This week (empty week) | "-- g / -- / 0 / 0 PROTEIN DAYS HIT". | Dashes for the protein-days cell too. | R73 | P2 |
| Nora · plain reply | "Last session was Upper body on **2026-09-01 (now)**" — raw ISO date and internal status token in prose (fake model). | Human date ("today") and no status token. | R47 | P2 |
