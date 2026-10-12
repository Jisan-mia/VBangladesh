# Game-upgrade prompt (orchestration template)

Fill `{GAMES}` (2–3 slugs from the list below with their hints), then send one agent per group (model: opus, effort: high). Up to 5 run at once.

---

You are a senior game designer and front-end engineer. You are upgrading existing browser games on "একটুখানি", a free, no-signup, Bangla-only site for ordinary Bangladeshis on cheap Android phones. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16, React 19, TypeScript; branch `games-wave-2`). A dev server runs at http://127.0.0.1:3100; don't start or stop servers. Keep scratch files in /tmp/up-<first-slug>/.

The owner says the games are good but should give people more reason to keep playing: levels, clear progress, rewards that feel good, and real sound. Their example: in অ্যান্টেনা ঠিক করো, the TV should hiss "ঝির ঝির" while the signal is bad. The static should get louder or quieter as you turn the antenna towards or away from the right spot. They liked how জ্যাম ছাড়াও has levels, and want that kind of progression presented more explicitly and well across the games.

## Your games
{GAMES}

## Read first
1. `research/game-engagement-brief.md`: the bar. Levels and stars, a win in 10 seconds, near-miss lines, combos, confetti only for real achievements, sound ON by default, and no dark patterns.
2. The kit:
   - `shared/game-sound.ts` (`sfx`, `tone`, `hiss`, `loop`, `buzz`, `confetti`, `soundOn`);
   - `shared/game-kit.ts` (`useSound`, `useLevels`, `useBest`, `useSlowMode`, `useGameLoop`, plus `readLevels`, `recordLevel`, `unlockedLevel` and `starsFor` from game-core);
   - `shared/game-ui.tsx` (`SoundToggle`, `Stars`, `LevelGrid`). Its styles in `shared/game-ui.css` are global.
3. `research/bangla-writing-guide.md` (the `bangla-writing` skill) for every new or changed line.
4. Each game's whole folder `tools/<slug>/` and its brief in `research/games-2026-10.md` §4.3 (the number is in `research/build-queue.md`).
5. `tools/jam-chharao/` for how its levels work today.

## Do, for each game
1. **Sound, ON by default, through the kit only.**
   - Replace any local `AudioContext`, local sound state or "শব্দ বন্ধ by default" toggle with `SoundToggle` and the kit's functions. Keep the game's existing signature sounds, but rebuild them on `tone` and `hiss` where that's simple. Delete local `lib/sound.ts` files that the kit now covers.
   - Add sound where it carries meaning: action, success, mistake, win, and one signature sound. Use `loop()` for continuous sounds that carry information, and stop them on pause, over and unmount.
2. **Progression that's explicit and well presented.**
   - Puzzle games get levels with 1–3 stars (`useLevels`, `LevelGrid` in a "সব লেভেল" section below the game, "লেভেল ৭ · ★ ১৮/৯০" near the board).
   - Arcade games get stages or difficulty steps, with milestones shown on the screen and the card, or levels where they fit naturally (see the hints).
   - Keep existing saved progress working: migrate the old localStorage key into the new one once, and test it.
3. **Rewards.**
   - Stars pop in one by one on a clear (`sfx.star(i)` with `.gx-pop`).
   - Confetti plus `sfx.win()` or `sfx.levelUp()` for 3 stars, a new best or a finished stage.
   - Use a combo or streak sound where the game has streaks.
   - Add near-miss lines with exact numbers ("আর ৪০ পয়েন্ট হলেই নতুন সেরা").
4. **Feel.** Every input answers within 50 ms (a sound, a scale bump or a flash). State changes ease out. Mistakes get a gentle shake. Slow mode removes shake, confetti and particles.
5. **Keep what works.**
   - Don't change challenge-link formats, which old links must still open. If a link needs the level, add a new key and keep reading the old ones.
   - Don't change tally ids, the card layout's essentials or SEO titles and descriptions (unless an FAQ needs a new "কয়টা লেভেল আছে?" entry).
   - Copy changes follow the guide.

## Scope
ONLY `tools/<your slugs>/**` and `app/<your slugs>/page.tsx`. Don't edit shared/, lib/, components/ or other tools; other agents are working right now. If the kit needs a change, describe it in your report. Never `git add`, `git rm` or commit.

## Verify (required)
- `node --import tsx --no-warnings --test tools/<slug>/tests/*.test.ts` for each game, plus new tests for:
  - levels, star thresholds and that every level is solvable or fair;
  - the old-progress migration;
  - old link formats still parsing.
- `npx tsc --noEmit`: clean for your files.
- Screenshots: `node scripts/shot.mjs "http://127.0.0.1:3100/<slug>" .shots/up-<slug>-N.png 390 844 [--eval="js"] [--wait=ms]`. OPEN and look at the first screen, mid-play, level clear with stars, the level grid, and 320px wide (no sideways scroll).
- `npm run check:pages` at the end; ignore other agents' tools.

## Report back (SHORT, ≤200 words per game group)
- One line per game: what you added (levels or stages, sounds by name, rewards), and anything removed.
- `tests:` N passed · `tsc:` clean · `check:pages:` result
- `notes:` kit changes you'd like, judgement calls, and anything you couldn't verify by eye.

---

## Hints per game (the orchestrator pastes the relevant lines into {GAMES})

- **antenna-thik-koro:**
  - Static `loop('static')`, whose volume follows how far off the signal is (louder when worse, silent when locked).
  - A soft "টিউন" chime when locked.
  - Channels as levels: each channel a harder lock zone, shorter dwell, or a moving sweet spot (wind).
  - Stars from time.
- **kalbaishakhi-aam:** storms as stages (wind gusts, falling branches), a thud and squelch for mangoes, thunder on a stage change, a combo for a quick catch streak, and milestones (৫০/১০০ আম) on the card.
- **dudh-uthlano:** a rising bubbling `loop('hum')` that grows as the milk rises, a hiss on boil-over, and kitchens as levels (more pots, faster flames, the doorbell distraction). Stars come from timing.
- **jhalmuri-sap:** speed stages, a crunch per bite with a rising combo pitch, and walls or obstacles in later stages (levels). Keep the classic endless mode too.
- **danguli:** a tournament of opponents in the পাড়া as levels, a wooden knock already exists (move it to the kit), and a crowd "ওওও" on a big hit.
- **chor-police:** a group game, so keep it light. The paper-chit rustle and the reveal drumroll go through the kit. Rounds or a match target are progression enough.
- **tarer-fanke-belun:** a balloon squeak, a wire buzz `loop('hum')` near the wires, wind as stages, and stars per stage.
- **sir-ghurlei-thamo:** a chalk scratch when Sir writes, a footstep turn cue, a rising tension tone while moving, and classes (levels) where Sir turns faster or fakes a turn.
- **deri-hoye-gelo:** footsteps, a puddle splash, the school bell at the end, and days of the week as stages. The word দৌড় is not allowed in content (a test forbids it).
- **bostar-pahar:** move the thump to the kit and add a "ঠিক মাঝে" combo pitch. Ghats as levels with height targets and stars.
- **paka-kancha:** a mango thud for পাকা and a softer one for আধপাকা. Levels from code length or tries, and the daily code stays.
- **jora-melao:** a card flip and a match chime with combo. Levels with growing board size and par moves for stars. Keep the two-player mode.
- **chhok-jora:** a chalk tick for each line and a click for a box. Add a 3×3 কাটাকুটি (tic-tac-toe) mode against the bot with three bot levels.
- **churui-tarao:** sparrow chirps, a clap for a shoo, and fields as stages with stars.
- **handi-bhanga:** a blindfold swish, a clay smash, and levels with a moving হাঁড়ি or a wind sway.
- **peoner-cycle:** move the bell to the kit, add a letter-delivered blip combo, and routes as levels.
- **sap-ludu:** dice rattle, a ladder "ঝিং" climb, and a snake slide whoosh (funny). Progression is optional (wins against the bot).
- **baghbandi:** a stone click per move, a roar-ish (cute) growl when the বাঘ captures, and bot levels as progression with stars by moves.
- **baicher-nouka:** move the ঢোল to the kit, and races as levels against faster rival boats.
- **vo-katta:** wind `loop('wind')` whose volume follows the wind strength, a string zing, and a "ভো-কাট্টা!" cheer. Opponent kites as levels.
- **bhangti-nai:** a coin clink, a note rustle and a till "ক্যাচিং". Shop days as levels with tighter time and trickier change.
- **jam-chharao:** it already has levels, so make them more explicit: `LevelGrid` with stars (par moves → stars) and total stars. Add an engine sound for the CNG and a horn on the exit. Migrate the existing progress.
- **shobdo-khoja:** a pencil scratch on a swipe, a found-word chime with combo, and theme packs as levels with stars by time.
- **carrom:** a striker click, a coin clack, and a pocket "টুপ". Add a মার্বেল (marbles) mode on the same physics as a bonus mode if it stays small.
- **pati-buni:** a weave rustle and a row-clear "সরসর", with speed stages and milestones.
