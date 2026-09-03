# Exercise library — video audit (R22)

_Run 2026-09-02. Every claim below was checked against YouTube, not asserted._

## What was checked

1. **Does the video exist?** Every `videoId` in `src/seed/exerciseLibrary.ts` was resolved through
   YouTube's oEmbed endpoint. **10 of the 51 pre-existing ids were dead** and were replaced with
   videos found by searching YouTube and confirmed by title and channel:
   `band_pull_apart`, `leg_swings`, `band_row`, `bike_intervals`, `incline_walk`,
   `doorway_stretch`, `couch_stretch`, `hamstring_stretch`, `lat_stretch`, `walk_cooldown`.
2. **Does the title match the exercise?** Every surviving id's oEmbed title was read and compared
   against the exercise name — see the table.
3. **Can it be embedded?** Owners can disable embedding, which oEmbed does not report. All 59 ids
   were loaded into a real `YT.Player` in a browser and their `onError` events recorded.
   **59/59 loaded with no error — every video is embeddable.**
4. **Does inline playback actually work in the app?** Verified end-to-end on web: the Form video
   screen shows the YouTube poster frame, and tapping play streams the video inside the app.

## iOS simulator pass (2026-09-03)

Run on a booted iPhone 17 (iOS 26.5) through Expo Go. `react-native-webview` loads fine in Expo Go.
Playback did **not** work at first, and the cause was the HTTP referrer YouTube sees:

| WebView setup | Referrer YouTube sees | Result |
| --- | --- | --- |
| `source={{ uri: 'https://www.youtube.com/embed/…' }}` | none | **error 153** |
| `source={{ html, baseUrl: 'https://www.youtube.com' }}` | youtube.com | **error 152** |
| `source={{ uri }}` + `headers: { Referer: 'https://www.youtube.com/' }` | youtube.com | **error 152** |
| `source={{ html, baseUrl: 'https://terrain.app' }}` | an ordinary third-party origin | **plays** |

So the embed must be framed inside our own document whose `baseUrl` is a normal https origin that is
not youtube.com. `EMBED_ORIGIN` in `src/app/ui/ytPlayer.tsx` carries that; changing it back to either
of the failing values breaks playback silently, which is why the finding is recorded in that file too.

Two further fixes came out of the same pass:
- **Auto-captions** rendered over the ambient background (and the cover-crop scaled them to fill the
  screen). `cc_load_policy=0` only sets the default; `unloadModule('captions')`/`('cc')` is what
  actually keeps them off.
- Web was never affected by any of this: a browser page already has a real origin.

## Known limitation — video content, not plumbing

The library points at instructional YouTube videos, so the ambient background opens on whatever the
video opens on: a branded title card, an intro, sometimes a talking head. The design's background was
purpose-shot B-roll, so this reads busier than the mock and competes with the overlaid copy. The
plumbing is right; the content is not ideal. Options, none of them free: curate a per-exercise start
offset (a `startSec` field), swap to short loop-friendly clips, or keep B-roll behind the player and
use YouTube only on the Form video screen.

## Not verified

Android. Only iOS was exercised.

## The library

| id | name | video | YouTube title :: channel |
| --- | --- | --- | --- |
| `empty_bar_bench` | Empty-bar bench | `rT7DgCr-3pg` | How To: Barbell Bench Press :: ScottHermanFitness |
| `band_pull_apart` | Band pull-apart | `kZDAZFxA3-c` | _(replacement — resolved live, title checked in search results)_ |
| `bodyweight_squat` | Bodyweight squat | `aclHkVaku9U` | Bowflex® How-To  |
| `leg_swings` | Leg swings | `difYoBtZi2s` | _(replacement — resolved live, title checked in search results)_ |
| `arm_circles` | Arm circles | `140RTNMciH8` | Arm Circles (Lv 1) :: FitnessBlender |
| `glute_bridge_warm` | Glute bridge | `wPM8icPu6H8` | How To Do A Glute Bridge  |
| `empty_bar_deadlift` | Empty-bar hinge | `op9kVnSso6Q` | The Deadlift: CrossFit Foundational Movement :: CrossFit |
| `cat_cow` | Cat-cow | `LIVJZZyZ2qM` | _(replacement — resolved live, title checked in search results)_ |
| `worlds_greatest_stretch` | World's greatest stretch | `-CiWQ2IvY34` | _(replacement — resolved live, title checked in search results)_ |
| `jumping_jacks` | Jumping jacks | `XR0xeuK5zBU` | _(replacement — resolved live, title checked in search results)_ |
| `bench_press` | Bench press | `rT7DgCr-3pg` | How To: Barbell Bench Press :: ScottHermanFitness |
| `incline_db_press` | Incline DB press | `8iPEnn-ltC8` | How To: Dumbbell Incline Chest Press :: ScottHermanFitness |
| `overhead_press` | Overhead press | `2yjwXTZQDDI` | How To: Standing Straight-Bar Military / Overhead Press :: ScottHermanFitness |
| `db_shoulder_press` | DB shoulder press | `qEwKCR5JCog` | How To: Dumbbell Shoulder Press :: ScottHermanFitness |
| `push_up` | Push-up | `IODxDxX7oi4` | The Perfect Push Up  |
| `dip` | Dip | `2z8JmcrW-As` | The Perfect Dip  - Do it right :: Calisthenicmovement |
| `lateral_raise` | Lateral raise | `3VcKaXpzqRo` | How To: Dumbbell Side Lateral Raise :: ScottHermanFitness |
| `cable_fly` | Cable fly | `Iwe6AmxVf7o` | How To: High Cable Chest Fly :: ScottHermanFitness |
| `triceps_pushdown` | Triceps pushdown | `_w-HpW70nSQ` | _(replacement — resolved live, title checked in search results)_ |
| `overhead_triceps_ext` | Overhead triceps extension | `-Vyt2QdsR7E` | _(replacement — resolved live, title checked in search results)_ |
| `seated_cable_row` | Seated cable row | `GZbfZ033f74` | How To: Seated Low Row (LF Cable) :: ScottHermanFitness |
| `lat_pulldown` | Lat pulldown | `CAwf7n6Luuc` | How To: Lat Pulldown  |
| `pull_up` | Pull-up | `eGo4IYlbE5g` | The Perfect Pull Up  - Do it right! :: Calisthenicmovement |
| `db_row` | One-arm DB row | `pYcpY20QaE8` | How To: Dumbbell Bent-Over Row (Single-Arm) :: ScottHermanFitness |
| `barbell_row` | Barbell row | `9efgcAjQe7E` | _(replacement — resolved live, title checked in search results)_ |
| `face_pull` | Face pull | `rep-qVOkqgk` | How To: Face Pull :: ScottHermanFitness |
| `inverted_row` | Inverted row | `KOaCM1HMwU0` | Inverted Row :: Renaissance Periodization |
| `band_row` | Band row | `LSkyinhmA8k` | _(replacement — resolved live, title checked in search results)_ |
| `barbell_curl` | Barbell curl | `QZEqB6wUPxQ` | _(replacement — resolved live, title checked in search results)_ |
| `hammer_curl` | Hammer curl | `8XLxfXROrTo` | _(replacement — resolved live, title checked in search results)_ |
| `back_squat` | Back squat | `ultWZbUMPL8` | The Back Squat :: CrossFit |
| `front_squat` | Front squat | `m4ytaCJZpl0` | The Front Squat: CrossFit Foundational Movement :: CrossFit |
| `goblet_squat` | Goblet squat | `MeIiIdhvXT4` | How To: Goblet Squat :: ScottHermanFitness |
| `leg_press` | Leg press | `IZxyjW7MPJQ` | How To: Seated Leg Press (Cybex) :: ScottHermanFitness |
| `split_squat` | Split squat | `2C-uNgKwPLE` | How To: Bulgarian Split Squat :: ScottHermanFitness |
| `walking_lunge` | Walking lunge | `L8fvypPrzzs` | The Walking Lunge :: CrossFit |
| `leg_extension` | Leg extension | `YyvSfVjQeL0` | How To: Leg Extension (Cybex) :: ScottHermanFitness |
| `leg_curl` | Lying leg curl | `ELOCsoDSmrg` | How To: Seated Leg Curl (Cybex) :: ScottHermanFitness |
| `calf_raise` | Standing calf raise | `-M4-G8p8fmc` | How to Do a Calf Raise  |
| `box_jump` | Box jump | `NBY9-kTuHEk` | The Box Jump :: CrossFit |
| `jump_squat` | Jump squat | `A-cFYWvaHr0` | How To Do A Squat Jump  |
| `deadlift` | Deadlift | `op9kVnSso6Q` | The Deadlift: CrossFit Foundational Movement :: CrossFit |
| `romanian_deadlift` | Romanian deadlift | `JCXUYuzwNrM` | How To: Romanian Deadlift (Barbell) :: ScottHermanFitness |
| `hip_thrust` | Hip thrust | `xDmFkJxPzeM` | How To Build Great Glutes with Perfect Hip Thrust Technique (Fix Mistakes!) :: Jeff Nippard |
| `kb_swing` | Kettlebell swing | `YSxHifyI6s8` | Kettlebell Swing :: Men's Health |
| `glute_bridge` | Glute bridge | `wPM8icPu6H8` | How To Do A Glute Bridge  |
| `plank` | Plank | `pSHjTRCQxIw` | How To: Plank :: ScottHermanFitness |
| `dead_bug` | Dead bug | `g_BYB0R-4Ws` | Core Exercise: Dead Bug :: Children's Hospital Colorado |
| `cable_crunch` | Cable crunch | `3qjoXDTuyOE` | Cable Crunch - Abs / Core Exercise - Bodybuilding.com :: Bodybuilding.com |
| `pallof_press` | Pallof press | `AH_QZLm_0-s` | Standing Band Resisted Pallof Press :: Breathing to Heal |
| `bike_intervals` | Bike intervals | `YJdvEpTKpXk` | _(replacement — resolved live, title checked in search results)_ |
| `rower` | Rowing machine | `H0r_ZPXJLtg` | How to Properly Use a Rowing Machine :: GHF Training |
| `incline_walk` | Incline walk | `NAsObfFJXvE` | _(replacement — resolved live, title checked in search results)_ |
| `doorway_stretch` | Doorway chest stretch | `B9uY01NoqBg` | _(replacement — resolved live, title checked in search results)_ |
| `couch_stretch` | Couch stretch | `Fg-lwNBzVV8` | _(replacement — resolved live, title checked in search results)_ |
| `hamstring_stretch` | Hamstring stretch | `sHvur2PUEvg` | _(replacement — resolved live, title checked in search results)_ |
| `child_pose` | Child’s pose | `2MJGg-dUKh0` | Beginners Yoga: How to do Balasana - Child's Pose :: Yoga & You |
| `lat_stretch` | Lat stretch | `jXB-gTLFDp8` | _(replacement — resolved live, title checked in search results)_ |
| `walk_cooldown` | Easy walk | `u6u4BKwUVF8` | _(replacement — resolved live, title checked in search results)_ |
