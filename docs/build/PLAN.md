# Terrain build plan (durable state — resume from here)

Last updated: 2026-09-01. Owner session: Claude Code. Board: `docs/build/BOARD.md`.
Sources of truth in precedence order: PRD §0 (designs > fixtures > PRD > arch diagram). Decisions there are closed.

## Stack (decided)
- Expo SDK 54, TypeScript, React Native + react-native-web (browser QA at 390×844). No expo-router: a small in-app stack navigator (`src/app/nav`) so "return to whichever it was opened from" (R62) is trivial.
- SQLite behind a sync `SqlDriver` seam (`src/db/driver.ts`): `expo-sqlite` on iOS/Android, `sql.js` (asm build, no wasm file) on web + node tests. Web persists the DB image to localStorage.
- zod schemas for every model output (plan, patch, chat, meal estimate, injury tags). vitest for domain tests + fixture runner. GitHub Actions CI.
- Fonts: Anton (display) + Archivo (body) via @expo-google-fonts. Dark only. Tokens copied from the design's `:root` (`src/theme/tokens.ts`).
- Text model: OpenRouter → `openai/gpt-5-mini`, pinned upstream provider + `allow_fallbacks:false` from config (R48a). Reached ONLY via `src/domain/contextAssembler.ts`. Fixture-backed `FakeTextModel` when no key (deterministic template planner, keyword safety, canned prose).
- Vision: `VisionProvider` seam (`src/domain/vision/adapter.ts`), providers `fake` (fixture 07 estimate) and `openrouter` multimodal; adapter validates (R12a). Never sees user context (R63a).
- Time: every domain service takes `asOf` (R66). App clock = real now; seed is date-relative to install (R69), so the demo's "today" is the real today, not the design's Aug 12.

## Layout
```
src/theme        tokens, typography
src/db           driver seam, schema, repositories (sync)
src/domain       readiness, calendar, plan (schema+rails), nutrition, memory, meal, sprint, progress, safety, contextAssembler
src/ai           openrouter text client (imported only by contextAssembler), fake text model, vision providers
src/seed         exercise library, nutrient reference, demo seed, fresh reset
src/app          nav, screens, components, hooks
eval/run         fixture runner tests (reads eval/golden/*.json)
docs/build       this plan, board, critic findings, built-not-shown record
```

## Commands
- `npm install` · `npm run typecheck` · `npm test` (vitest: unit + fixtures) · `npm run web` (Expo web on :8090) · `npm run ci` (typecheck + test).
- Live fixture 07: `VISION_PROVIDER=openrouter VISION_API_KEY=… npm run test:live`.

## Invariants to enforce mechanically
- Privacy boundary test (`src/domain/__tests__/privacy_boundary.test.ts`): the only importer of `src/ai/openrouterText.ts` is the context assembler; the only importer of vision providers is the vision adapter; the vision request builder never receives profile/signals/memory.
- Fixtures 01,02,03,05,08,10 run offline against the real code with the fake model; 07 runs offline against the fake provider (arithmetic/structure) and live when credentials exist.

## Resume procedure
1. `cat docs/build/BOARD.md` — find the first ticket not DONE. 2. `npm run ci` — confirm the baseline. 3. Continue that ticket; update BOARD.md status as you go. 4. Critic pass last (`docs/build/CRITIC.md`), resolve findings, re-run.
