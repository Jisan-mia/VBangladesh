# Game rewrite prompt (orchestration template)

Fill `{SLUG}` and `{NAME}`, then send one agent per game (model: opus, effort: high). Many run at once.

---

You are a senior game designer and game engineer. You are rewriting one game of "একটুখানি", a free Bangla games platform for Bangladesh on cheap Android phones. Repo: /Users/jisanmia/Developer/VBangladesh (Next.js 16.4.5, React 19, TypeScript; branch `games-to-the-bar`). A dev server runs at http://127.0.0.1:3100; don't start or stop it. AGENTS.md may say this Next.js differs from your training data, so check node_modules/next/dist/docs/ for unfamiliar APIs.

The owner's bar is **tibo.dog** (poteto's browser game): "this game is literally the bar… everything, every level… the international bar, that's how it needs to be made." Your game must feel like it came from a studio at that level, in its own small Bangladeshi way. It must also be easy to understand in 5 seconds, fun in 10, and still fun after 5 minutes.

## Your game: `{SLUG}` · {NAME}

## Read first, in this order
1. **`.claude/skills/game-quality-bar/SKILL.md`: the bar, section by section.** Then `ai_docs/game-dev/tibo-dog-playthrough.md`, and look at `ai_docs/reference/tibo-dog/*.jpg|png`.
2. **`ai_docs/statecharts/{SLUG}/README.md`:** this game's systems, the bugs found (with live replays) and the quality-bar gaps. Fix every bug and close every gap.
3. **`.claude/skills/game-engineering/SKILL.md`:** deterministic `lib/`, `*.hot.ts`, levels as data, bot-tuned difficulty, lint, budget.
4. **`.claude/skills/game-statechart/SKILL.md`:** update the model to the new code and prove every rule (`after-fix/`).
5. **`ai_docs/game-dev/game-player.md`:** the shared Poki-style player (`GamePage`, `useGamePlayer`, immersive mode, pause, stage size). Your game must live in it.
6. **`.claude/skills/play-test-orca/SKILL.md`:** all verification happens in the Orca browser.
7. **Words:** `research/bangla-writing-guide.md` (the `bangla-writing` skill). For kids' tools (category ছোটদের জন্য) also read `research/kids/kids-brief.md` and use `shared/kids-kit.tsx`.
8. **The current code:** `tools/{SLUG}/**`. Keep what is good; rewrite what isn't.

## Write the design first: `ai_docs/game-dev/rewrites/{SLUG}.md`
One page:
- **Core:** the concept in one line, the fantasy, and the core loop in 3 verbs.
- **Progression:** worlds and levels, with each level teaching exactly one new thing.
- **Difficulty and story:** difficulty modes, each with a one-line consequence. A tiny optional story or intro (2–4 panels, hold to skip) if the game has a world.
- **Screens:** the title screen (the start action is the biggest thing, the game's own art), choice moments (pause, numbered, before → after, RECOMMENDED), the HUD layout (corners only), danger signals (edge), the finale or "boss" of each world, the end screen with real stats, and the card.
- **Sound:** 3–6 sounds plus a signature, and a short world tune if it fits.
- **Comfort and controls:** how ধীরে খেলো changes things, the controls for touch, keyboard and mouse, and a list of what you keep for compatibility: links, saved progress, SEO.

Then build it.

## Build: must haves
1. **The player:** the page uses `GamePage`, and the game reads `useGamePlayer()` for pause and resume, restart and stage size. The game fills the stage in immersive mode on a phone (portrait first, no page scroll while playing). Remove in-game sound or slow toggles that duplicate the player's menu.
2. **Architecture:**
   - a pure, deterministic simulation in `lib/` (`makeRng` only);
   - per-frame code in `*.hot.ts` with no allocation;
   - levels in `lib/levels.ts` with tests proving each solvable or bot-clearable at its target rate;
   - thin React.
3. **Every statechart bug fixed** and replayed as a node test. The updated spec in `ai_docs/statecharts/{SLUG}/` has `after-fix/` with every rule holding. Put the chart in the README.
4. **Feel:**
   - every input answers within 50 ms;
   - eased transitions;
   - hits and juice in proportion;
   - danger at the edges;
   - choice moments pause;
   - the end screen counts up its stats.
   
   Art is drawn in code, pre-rendered, crisp at DPR 2, with one palette per world.
5. **Difficulty and pacing:** win within 10 s on level 1. Add one new element per level and a named finale per world. Tune with headless bots and assert the target rates in tests.
6. **Sound:** only `shared/game-sound.ts`. Every meaning sound carries is also visible. Every loop stops on pause, the end, being hidden and unmount.
7. **Compatibility:** old challenge links still parse (add new keys, never break old ones), old saved progress migrates once, and the tally ids and SEO URL are unchanged. Keep the title, description and H1 within the existing rules; improve the wording if needed and keep them unique. At least 6 FAQs.
8. **Kids' tools:** every rule in `research/kids/kids-brief.md` still holds: no child data, no network, the parent gate, `RestScreen` only at a break, and no reading needed for ages 3–5.
9. **Lint and budget:** `npm run lint:games` reports no new violations for your files. Keep the game's JS lean.

## Known shared patterns (from the statechart runs; fix them in your game)
- **Pause on window blur, not only on a hidden tab.** The player broadcasts the pause; make sure your loop, clock and spawns stop.
- **Release held keys and drags on blur**, and ignore game keys while paused.
- **Clear celebration and star-chime timeouts** on reset, next level and unmount.
- **Bring sound loops back** when sound turns on or play resumes (`SoundToggle onChange`, or check `soundOn()` in the step). Don't restore a loop with `??=`: a loop created while muted is a silent stub, so replace it when sound comes back.
- **Friend links:**
  - `shared/game-core.ts` `unlockedLevel` opens everything below the highest recorded level, on purpose, because migrations rely on it.
  - When a player clears a friend's far-ahead level, don't let that open the levels in between; record the stars, but keep your own unlock rule.
  - Never change `unlockedLevel` itself.
- **The click that brings focus back is not a move.** After blur or pause, the first pointerdown only resumes (or the pause menu takes it); it never hops, picks a side or knocks the piece.
- **Opening a level list or any drawer pauses play,** and so does every choice screen.
- **Result keys need a fresh press.** A key held through the end of a round (Space, Enter) must not skip the result or start the next run. Accept result-screen keys only from a keydown that arrives after the screen appears, with `!e.repeat`.
- **Enter and Space go to the game, not to the last focused button.** Blur the button after a click, or handle the game keys at `window` with `preventDefault`, so one Enter never wipes a board or undoes a move.
- **Kids' games:**
  - Record the stars and check `atBreak()` at the moment the round is won, not inside a delay timer that a quick tap can cancel.
  - The end buttons (আবার খেলো, শেষ) are pictures at least 96 px.
  - `GamePage` gives the kids-only header and rails; nothing in the child's view links to grown-up pages.
  - The kit now handles these, so don't duplicate them:
    - `speak()` is silent when sound is off, and sound-off cuts speech and scheduled notes;
    - `ParentGate` resists banging and auto-repeat, and closes itself;
    - `RestScreen` is a real modal that blocks input behind it;
    - the daily timer counts only the focused tab.
  - Hide `SpeakButton` when sound is off, or make it turn sound on.
- **ধীরে খেলো must not make stars easier to earn,** unless the design says so explicitly.

## Scope
ONLY:
- `tools/{SLUG}/**` and `app/{SLUG}/page.tsx`;
- `ai_docs/statecharts/{SLUG}/**`;
- `ai_docs/game-dev/rewrites/{SLUG}.md`;
- `.shots/`.

**Keep the dev build compiling at every save.** One compile error in any tool makes the dev server return 500 on every route and blocks every other agent:
- write new modules as new files;
- keep old exports until the component switches over;
- switch the imports in one edit;
- check `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3100/carrom` after each big change.

Don't edit `shared/`, `lib/`, `components/` or other tools. Many agents are working right now. Put shared needs in your report. Never `git add` or commit. Keep scratch files (autopilots, helpers) in a private subfolder named after your slug, because other agents share the scratchpad.

## Verify (required)
- `node --import tsx --no-warnings --test tools/{SLUG}/tests/*.test.ts` and `npx tsc --noEmit`, clean for your files. Run `npm run lint:games` (look only at your files).
- **In Orca:**
  1. Play the game end to end: every level of the first world, plus samples from later worlds, through the finale and end screen. Use an autopilot if you need to.
  2. On a phone (Pixel 9 emulation): the launch card, tap খেলো, immersive play, pause on blur and hide, resume, restart, the end screen and the card.
  3. On desktop: the stage and rails.
  4. Check for console errors.
  5. Save screenshots to `.shots/{SLUG}-*.png` and look at them.
- **320 px:** check no sideways scroll with `scripts/shot.mjs`.
- **`npm run check:pages`:** if it stops on another agent's tool, check your routes alone.

## Report (≤250 words)
- `design:` one line
- `levels:` worlds × levels, what each teaches, and the bot target rates
- `bugs fixed:` one line each, with its test name
- `statechart:` rules (all hold), plus the path to `after-fix/chart.mmd`
- `feel:` 3 lines on what changed most
- `catalog:` description (≤90 chars) | action (2–3 words), if the description should change
- `og:` the same format as before, if the card changed (with a quick `#og` demo or reveal JS that finishes within ~15 s)
- `tests:` N passed · `tsc:` clean · `lint:` your file counts
- `shots:` paths
- `shared needs:` anything for the orchestrator
