# Terrain

Holistic fitness and wellness app with Nora, its AI coach. Expo React Native (iOS/Android/web), on-device SQLite, deterministic domain services, OpenRouter → gpt-5-mini for text, a swappable vision path for meal photos.

- Product truth: `docs/PRD.md` (§0 precedence), `designs/*.html` (open in a browser), `eval/golden/*.json`.
- Build state: `docs/build/` (plan, board, critic findings, fixture changes, built-but-not-shown).

## Run
```bash
npm install
npm run web        # http://localhost:8090 — 390×844 phone frame
npm run ios        # Expo Go / simulator
npm run ci         # typecheck + unit tests + fixture runner
```
First launch seeds the demo user (date-relative). Settings → Demo resets to the seeded user or to a fresh install (onboarding).

## Credentials (optional — every deterministic feature works without them)
```
EXPO_PUBLIC_OPENROUTER_API_KEY=…        # text: chat, plans, explanations, nutrition gaps, injury tags
EXPO_PUBLIC_OPENROUTER_PROVIDER=openai  # pinned upstream (R48a); fallbacks disabled unless EXPO_PUBLIC_OPENROUTER_ALLOW_FALLBACKS=true
EXPO_PUBLIC_VISION_PROVIDER=openrouter  # or fake (default when no key)
EXPO_PUBLIC_VISION_API_KEY=…
EXPO_PUBLIC_VISION_MODEL=openai/gpt-5-mini
```
Without a key the fake, fixture-backed model/provider are used and Settings → Demo can force the failure states.

## Fixtures
`npm test` runs `eval/run/*.test.ts` against the real implementation (01, 02, 03, 05, 07-offline, 08, 10). `npm run test:live` runs fixture 07 against the live vision provider (needs `TERRAIN_LIVE=1` and `VISION_API_KEY`).
