# Manual QA — Terrain on iOS Simulator

```yaml
sha: 5db7fe0
branch: main
tree: dirty
launched: Expo Go on iPhone 17 simulator (iOS 26.5) via `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer npx expo start --ios --port 8090`, real OpenRouter models from .env
```

**Spec:** docs/PRD.md (§0 precedence: designs > fixtures > PRD). **Designs:** designs/Terrain App.html, designs/Terrain Onboarding.html (Claude Design bundles; state rail on the left).

## Flows

| # | Flow | Requirements exercised |
|---|---|---|
| F1 | Launch → Today (score, explanation streams, hero row, nutrition card, plan card) → ▶ start session | R1–R6b, R64, R81 |
| F2 | Gym session: video overlay → tap right/left → swipe up → log sets (rest timer) → Form video → back → Next through cooldown → How did it go → Finish → calendar row completed | R19, R20, R30–R35, R80–R82 |
| F3 | Gym exit mid-session: × → Leaving mid-session → Save / Discard / Keep | R33 |
| F4 | Log tab → numeric sheet (steppers, Save toast) → Today re-scores; supplements sheet | R7, R8, R10, R75 |
| F5 | Meal photo: camera → auto-capture → analyzing → estimate (edit portion, remove, add item) → Save → Today/Nutrition/Calendar agree; vision failure → manual | R12–R16, R73 |
| F6 | Calendar week → day → month → activity sheet (Start / Mark done / Reschedule / Ask Nora) → + Add activity (past vs future) | R24–R29, R40, R77–R79 |
| F7 | Nora: patch card apply → View calendar; safety message → Pause it → calendar paused → resume; error/offline; Sees N → What Nora knows → resolve/delete | R9, R43–R47, R54, R54a, R46 |
| F8 | Nutrition from Today card: macros, micros, supplements, This week, What's missing, Logged meals | R70–R76 |
| F9 | Progress: trend toggle, stats, sparklines, load, PRs (+ add), history → session detail; Settings (targets, resets, disclaimer) | R49–R52, R11, R56, R68 |
| F10 | Reset to fresh → onboarding steps 1–5 → Build my plan → preview → Today (insufficient) → log 2 signals → partial score; generation failure → Retry | R4, R5, R57–R61 |
| F11 | Sprint player: reschedule next week's Sprints to today → Start → stages, Pause/Resume, Skip → end sheet | R36–R39 |

Requirements no UI flow touches: none of the UI requirements — R48/R48a, R62–R66 are architecture-shaped and out of scope for this pass.

## Walk

Driven with `idb` (taps/swipes/typing injected into the simulator) and `simctl` screenshots; the native simulator panel could not attach because the Mac's developer directory points at CommandLineTools (needs `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`). Real OpenRouter models were active (Settings caption confirmed).

| Flow | Result | Screens |
|---|---|---|
| F1 Today | walked; explanation FAILS (see Q1) | 11, 12, 98, 99 |
| F2 Gym session | walked end to end (Form video round-trip OK, rest timer OK, Finish → calendar completed) | 20–32 |
| F3 Gym exit | walked via sprint exit sheet (Q-none) | 85 |
| F4 Log | walked (Sleep sheet, Save toast, Supplements, Today re-scores) | 50–53 |
| F5 Meal photo | walked with the real vision model (3 items, ~751 kcal, saved; Today/Nutrition/Calendar agree) | 54–57, 75–77 |
| F6 Calendar | walked (week/day/month, sheet, add activity → Today row, reschedule across weeks) | 40–45, 80 |
| F7 Nora | walked (patch applied with toast, safety card with real model, pause/resume, memory) | 60–63 |
| F8 Nutrition | walked (macros, micros, supplements, week stats, narration shimmer, meals) | 75–77 |
| F9 Progress/Settings | walked (trend, stats, sparklines, load, PRs, history, targets, resets) | 70–74 |
| F10 Onboarding | walked with real plan generation → preview → Today insufficient → 2 signals → score 80 | 90–99 |
| F11 Sprint | walked (warm-up → sprint (orange) → recovery (green), Pause, exit sheet, Save) | 82–85 |

## Findings

| # | Sev | Flow · step | Repro | Screen | Expected | Observed |
|---|---|---|---|---|---|---|
| Q1 | P0 | F1 · Today loads | Launch on device with the OpenRouter key set | 11 | R6: explanation streams shimmer → text | "Readiness 84 · green — top factors…" fallback + "Couldn't reach Nora — retry explanation" every time; Retry fails too (works in the browser) |
| Q2 | P1 | every screen | Look at any Anton heading or numeral | 11, 20, 40, 51, 70, 82, 83 | Design: glyphs fully visible | Tops of "SEP 1", "84", "UPPER BODY", "THIS WEEK", "7.5", "PROGRESS", the sprint countdown "9:57"/"0:19" are clipped (worst on the 118 px countdown, ~30% cut) |
| Q3 | P1 | F2 · swipe up | In the player, swipe up starting on "Slide up to log sets" (bottom ~80 pt) | 23 | R80: swipe up opens the set panel | Nothing happens; a swipe starting mid-screen works. Matches the user's phone report |
| Q4 | P1 | F2 · close panel | Open the set panel, tap the dimmed video to close | 25 | R80: tap-out only closes the panel | Panel closes AND the session advances to the next exercise (1 → 2, then a real tap right → 3) |
| Q5 | P1 | F7 · send | Send "I felt a sharp pain in my chest during today's sprints and got dizzy." | 62 | User bubble wraps (design: multi-line bubble) | User bubble shows one line, cut at "…my chest dur" |
| Q6 | P1 | F7 · safety card | Same as Q5 with the real model | 62 | R54 card copy "Pause Thursday's sprint session until you've been seen?" | Card body reads just "Sprints" (the model's action label is used verbatim); the reply also leaks "2026-09-09" |
| Q7 | P1 | F1 · explanation length | With the real model on web (device fails, Q1) | — | R6: plain-language explanation naming ≥2 signals, fits under the gauge | Real-model explanations run 3–5 sentences and push the hero row down; user asked for a character limit |
| Q8 | P1 | F5 · camera | First Meal photo on a device with no camera permission yet | 54 | R16: ask permission, then capture | The iOS permission prompt appears while the app has already auto-captured the bundled fallback photo and is analysing it; the answer is never used on this run |
| Q9 | P2 | F9 · signal trends | Open Progress | 70 | Text arrows "↗ +0.2 h" (design) | ↗/↘ render as blue emoji arrows on iOS |
| Q10 | P2 | F2 · Finish with one set ticked | Tick one set, tap Next through all exercises, Finish | 32, 40 | "Completed · 6/6 exercises" reads as the session done | "Completed · 1/6 exercises" — advancing past an exercise without ticking counts it as not done |
| Q11 | P2 | F10 · preview | Build a plan with the real model (45 min) | 97 | ~6 exercises per 45-min session (design/seed) | 9–10 exercises per session; the rails don't bound count |
| Q12 | P2 | F7 · reply | Any real-model reply | 62 | Short, weekday names | Long replies with raw ISO dates |

Unreached/escalations: native simulator panel (needs the `xcode-select` command above, your password); real camera capture (simulator has no camera); the user's physical-phone network path (verified the server is reachable at 100.110.131.137:8090 once running).
