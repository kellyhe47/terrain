# Terrain — implementation handoff

Build Terrain: a holistic fitness and wellness app for people deeply invested in their health. Nora, its AI coach, prescribes a weekly plan, adapts it from what the user logs and says, and explains a daily readiness score in plain language. The user logs honestly and trains; Terrain makes sure they never have to decide what to do at the gym or wonder how their signals connect.

**Read `docs/PRD.md` first.** Its §0 lists the sources of truth in precedence order and settles the conflicts between them. Decisions recorded there are closed — don't reopen them.

In short: the prototypes in `designs/` are the product — open them in a browser and use the left rail to reach every state. `eval/golden/*.json` pins the formulas and contracts no screen can show. The PRD carries the numbered requirements and the reasoning.

## What the PRD can't tell you

**The fixtures have never been run.** Each states its inputs and expected result but not the operation it calls — supply that as you implement, and let each one fail for the intended reason before making it pass. If an expectation is genuinely wrong, change it deliberately and say so; never quietly reshape one to match what you built.

**They also don't cover the product.** Seven fixtures cover the readiness formula, plan rails, the meal contract, safety shape and memory. The calendar, both session players, Progress, onboarding and nutrition have none — the designs carry those. A green suite is necessary, not sufficient.

**The privacy invariant (R63/R63a) is the one thing to never compromise**, and it breaks quietly. Grep every outbound model call: if one isn't inside the context assembler or the vision adapter, that's a defect.

**Four things the PRD requires that the designs don't yet show:** a cooldown block in the gym session (R19), a destination for the Form video button (R20), an "Ask Nora to change" entry point on the activity sheet (R28), and demo-reset rows in Settings (R68). Build them.

**Nothing external exists yet.** The exercise library (R22), nutrient reference table (R70a), vision provider (R63b), seed script (R67) and OpenRouter access (R48a) are all consumed before they're produced. Inject each as a typed seam with a fixture-backed fake rather than a `TODO`.

## QA it with a critic

Before calling it done, hand the running app to a **critic that did not build it**, with the designs and the PRD. Reading source finds what the builder intended; only driving the app finds what a user gets.

Have it walk **every state on the designs' left rail** at 390×844 — the full list, not a sample — screenshotting the built state beside the design, and report two things per state:

- **Fidelity** — what differs. Judge *closer to the reference*, never "better": these designs are approved, and a critic given free rein will redesign them.
- **Function** — what's broken, dead or contradicts the PRD. Controls that do nothing, states that can't be reached, numbers that disagree between two screens, copy that drifted.

Every finding names the state, what it shows, what it should show, and the requirement it violates. This pass is the only coverage the calendar, both session players, Progress, onboarding and nutrition get — a failing fixture still outranks any critic verdict, but on those five areas there is no fixture to disagree with it.

Record anything you built that the designs don't show, and why.

## Done when

- Every PRD requirement is implemented, or renegotiated in writing.
- Every state reachable from the designs' rails is reachable in the app.
- The fixtures pass against the real implementation, from a clean checkout, in CI.
- The critic pass comes back clean, or every finding is resolved or explicitly accepted.
- The seeded demo carries the full loop: observe, understand, plan, perform, reflect, communicate, adapt.

Keep the run resumable from disk — board, scope, criteria and commands as files, not context. A build this size loses turns to stalls, and durable state makes that cost nothing.
