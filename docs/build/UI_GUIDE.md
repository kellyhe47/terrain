# Terrain UI guide (for screen builders)

Read this fully before writing a screen. The design is the product (PRD §0): match the prototype's layout, copy, spacing and colours — closer to the reference, never "better".

## Where things are
- Design prototype source (already unpacked): `/private/tmp/claude-501/-Users-kellyhe-Documents-gauntlet-terrain/f123cd11-7bc6-4efa-9685-9072ec1d7af5/scratchpad/design_app/template.html`
  - markup lines 449–1508 (each screen is an `<sc-if value="{{ isX }}">` block; sheets 1363–1499; toast 1501), behaviour script lines 1509–2081 (`renderVals()` gives every string/colour/style used). Onboarding: `.../scratchpad/design_onb/template.html` lines 444–642.
  - `{{ var }}` placeholders are filled from `renderVals()`; `style="…"` attributes are literal CSS — copy sizes/colours/paddings exactly. `var(--x)` tokens → `color.*` in `src/theme/tokens.ts`. `font:600 13px var(--font-body)` → `Archivo_600SemiBold` 13px; `var(--font-display)` → Anton (uppercase).
- PRD: `docs/PRD.md` (numbered requirements; the section for your area is named in your task).
- Reference screen already built to the same standard: `src/app/screens/TodayScreen.tsx` — copy its patterns.

## Runtime
- `useTerrain()` → `{ t, version, bump, asOf, showToast }`. `t` is the composition root (`src/app/services.ts`): `t.repo` (all reads/writes, `src/db/repo.ts`), `t.calendar` (`src/domain/calendar.ts`), `t.chat` (`src/domain/chatService.ts`), `t.plans` (`src/domain/planService.ts`), `t.memory`, `t.assembler` (`src/domain/contextAssembler.ts` — `explainReadiness`, `narrateGaps`, `sharedSignalCount(asOf)`), `t.meals` (`src/domain/mealEstimator.ts`), `t.library` (exercise library), `t.nutrientRef`, `t.flags` (demo gate), `t.resetDemo()`, `t.resetFresh()`.
  - Reads are synchronous. **After any write, call `bump()`** so every screen re-renders (and the web DB persists). `asOf()` returns the current ISO datetime; `dayOf(asOf())` is today.
  - `showToast('…')` shows the design's toast (green check) for ~1.8 s. Use the exact toast copy from the PRD.
- `useNav()` → `{ current, push, pop, replace, setTab, reset }`. Routes: `{name:'tab',tab}` (today|calendar|log|nora|progress), `nutrition`, `settings`, `knows`, `sessionDetail:{activityId}`, `meal`, `gym:{activityId}`, `sprint:{activityId}`, `formVideo:{exerciseId}`, `onboarding`. `pop()` returns to whatever pushed you (R62).
- Dates: `src/domain/dates.ts` (`dayOf, addDays, weekStart, weekDays, dow, DOW_SHORT/LONG/LETTER, fmtMonthDay, fmtDowMonthDay, fmtWeekRange, fmtTime12, fmtNum, MONTH_LONG`). All dates are `YYYY-MM-DD` strings.
- Domain helpers you will need: `toItem`/`CalendarItem` (status, subtitle, startable, pastDue, recordable), `dotFor`, `ADD_TYPES` (calendar); `dayMacros, mealTotals, microEstimates, microTargets, weekStats, gaps14, gapsFallbackLine, rescaleItem, fmtAmt` (nutrition); `readinessTrend, avgReadiness, consistency, signalTrends, trainingLoad14, workoutHistory` (progress); `buildSprintStages` (sprint); `sessionSubtitle` (plan); `MICRO_INFO` (nutrient reference); `NORA_INTRO` (chat).
- Types: `src/domain/types.ts`.

## UI kit (`src/app/ui/`)
- `text.tsx`: `Display` (Anton uppercase), `Numeral` (Anton tabular), `Label` (11px semibold uppercase tracked, text3), `Body` (14 body text2), `Semi` (14 semibold text1), `Bold`, `Small` (12 text3), `Tiny` (11 text3). Props: `c` colour, `size`, `lh` line-height, `style`.
- `primitives.tsx`: `Card` (surface card, `dashed`, `onPress`), `Btn` (`kind`: primary|secondary|outline|ghost|link; `size` sm|md|lg), `IconBtn`, `StepBtn` (`−`/`+`), `Chip` (pill), `Segmented`, `Bar` (progress), `Divider`, `Sheet` (bottom sheet with scrim, `title`/`subtitle`, closes on scrim tap), `Toast` (already mounted by the shell), `Shimmer`, `Spinner`, `Row`.
- `icons.tsx`: `Icon name=` sun, calendar, plus, chat, trend, moon, zap, soreness, mood, steps, drop, weight, camera, pill, activity, gear, chevronRight/Left/Up, x, check, send, flash, flip, play. `StatusIcon status=` completed|skipped|pending|now (the four R24 glyphs).
- `assets.ts`: `media` (homeScenic, gymLoop mp4, meal images) and `mealImageSource(uri)` for meal thumbnails (`asset:meal-…` keys).
- `frame.tsx`: the shell already renders the status bar and tab bar; a screen renders only its own content. Screens that are pushed (nutrition, knows, settings, sessionDetail, meal) include the design's back button row at the top (see the design markup).
- Layout defaults from the design: content padding `8px 20px 24px`, cards gap 14, card padding 14–16, radius 8, hairline borders `color.border`.
- Screens scroll with `ScrollView`; sheets are `Sheet` components rendered inside the screen (they position absolutely within the phone frame).

## Rules
- Do not edit files outside your assignment (no shared-file edits; if you need a helper, define it in your own file).
- Do not run the dev server or any browser tool — the integrator does visual QA. Verify with `npx tsc --noEmit` only.
- Every string the PRD quotes must appear verbatim. Every number displayed must come from data (`t.repo`…), never typed in.
- Accessibility labels on icon-only controls. Tabular numerals via `Numeral`.
- Model calls: never call anything but `t.assembler.*`, `t.chat.*`, `t.plans.*`, `t.meals.*`. Handle their rejections with the PRD's failure copy.
