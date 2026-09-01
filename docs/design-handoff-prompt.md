# Design handoff — Terrain (Phase 8)

You are designing the high-fidelity, clickable prototype for **Terrain**, a mobile fitness + wellness app. Turn the low-fi skeleton into a real design; do not restate or re-derive the spec — read it.

## Product context (one paragraph)

Terrain is for people deeply invested in their health who want one guided view of training, nutrition, sleep, recovery, and daily life. Nora, the AI coach, prescribes a weekly plan, adapts it from what the user logs and says, and explains a daily readiness score in plain language. The user's job is to log honestly and train; Terrain's job is that they never have to decide what to do at the gym or wonder how their signals connect.

## Where to look (sources of truth, in order)

1. `eval/golden/*.json` — acceptance fixtures; use their numbers as realistic content (readiness 85/56, the 5-status calendar week, the chicken-and-rice meal estimate). **No lorem ipsum** — fixture data is what breaks layouts.
2. `docs/PRD.md` — numbered requirements; R-numbers are how you cite anything.
3. `docs/wireframes.html` — every screen and every state, including the red-noted error/empty/loading states. All of them must exist in the prototype.
4. `docs/architecture.excalidraw` — context only.

## Copy that carries meaning — fixed, do not rewrite

- "Estimates, not measurements" (meal results)
- "Log a couple of signals to see your readiness" (insufficient-data state)
- "log what happened" (past-due pending activity)
- Referral language pattern in safety replies: recommends a qualified professional, never a diagnosis (R53–R55)
- "Private entries (🔒) are never sent to Nora" (What Nora knows)
- "wellness guidance, not medical advice" (Settings disclaimer)
- Tab labels: Today · Calendar · Log + · Nora · Progress

## What each surface must communicate at a glance

- **Today:** how ready am I, why, and the one thing to do next (start session / log signals / rest).
- **Calendar:** which of the 5 statuses each activity has, instantly distinguishable without reading (pending vs completed vs partial vs skipped vs trainee-added).
- **Gym/Sprint players:** the current action only — designed for a sweaty person mid-set; next set / stage countdown dominant, everything else recedes.
- **Nora chat:** what's a message vs an actionable card (patch card, safety pause card) — cards must read as decisions awaiting the user.
- **What Nora knows:** exactly what the coach can see, and that the user controls it.
- **Progress:** trend direction over time, not a single number.

## Hardest design problems (named)

1. **Today with 9 signal chips + score + plan + Nora note** without becoming a debug dashboard — hierarchy is the whole job here.
2. **Five calendar statuses legible at once** in a week list, colorblind-safe, without a legend.
3. **Patch/safety cards in chat**: proposed vs applied vs declined states must be unambiguous, and Apply must feel consequential but not scary.
4. **Deterministic-now, LLM-later rendering** (R6, R64): score renders instantly, explanation streams in — design the shimmer/fallback so it never looks broken.
5. **Sprint player at arm's length outdoors**: countdown + stage purpose readable in sunlight, mid-effort.

## Visual direction

Supportive and warm, not clinical or gamified-juvenile. Density: information-rich but calm — closer to Whoop/Rise than to Strava's feed. Light and dark modes, dark-first (gym + track use). Reference: Whoop (readiness framing), MacroFactor (meal editing), Linear (card/action clarity). Emoji bands per R3: 😄 / 😐 / 😴.

## Every state, not just the happy path

The wireframes' red notes are requirements: empty week, regenerating-locked calendar, insufficient-data Today, LLM error/retry, offline, vision-fail → manual entry, mid-session exit "Save as partial?", empty PRs, empty memory. A screen without its non-happy states is incomplete.

## Ground rules

**Design past the spec where the product clearly needs it.** You will spot gaps the PRD missed, and those are valuable — that is part of why this step exists.

**But label every addition.** For anything you add that the spec doesn't cover, note what you added, what it does, and why the flow needed it — in a single `docs/design-additions.md`. Additions are welcome; *silent* additions are not.

Target viewport: iPhone-class, 390×844. Deliverable: clickable prototype covering every screen-state above, plus the additions log.
