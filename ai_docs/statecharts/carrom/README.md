# ক্যারম: statechart (before the rewrite)

Spec `Carrom.tla`, config `Carrom.cfg` and view `view.ts`, mirrored from `tools/carrom/components/carrom-game.tsx`, `shared/game-kit.ts` (`useGameLoop`, `useLevels`), `shared/game-sound.ts` (`loop`, `setSoundOn`), `shared/game-ui.tsx` (`SoundToggle`) and `shared/game-core.ts`. Results are in `before-fix/report.md` and `before-fix/chart.mmd`: 492 states, 21 chart states, 60 arrows.

**Result: 5 rules held and 5 broke. All 5 bugs reproduced live in Orca.**

## Systems modelled
- **Play phase:** ready → playing → paused → over. The strike is either aiming or rolling (`g.phase` is `aim` or `moving`).
- **Tab, window and scroll:**
  - `hide` on `visibilitychange` runs `pause()` and then `letGo()`.
  - Window `blur` runs `letGo()` only. It doesn't pause.
  - `boardInView` from `useInView` gates the game loop when phase is ready, and gates every arrow and Space key, **keyup included**.
- **Input:**
  - A finger pulling on the board or holding মারো. Both end on `pointerup`, which pointer capture always delivers.
  - Space held from the keyboard, which fires on `keyup`.
- **Sound:**
  - The pull's `loop("hum")`. `tick()` starts it while pulling or charging and stops it otherwise. It only exists while `useGameLoop` runs.
  - The site switch: `SoundToggle onChange={stopHum}`. While sound is off, `loop()` returns a silent stub.
- **Striker size:** `toggleBig()` calls `setStrikerSize` at any moment, rolling included.
- **Boards:** stars, the stored unlock, the picker bound `Math.max(levels.unlocked, level)`, আবার খেলো, পরের বোর্ড, picking a board, and a friend's board link.

The model is smaller than the game in these ways:
- One strike per board instead of 10. Each strike is the same aim → roll → stop loop.
- 2 boards instead of 10. A board counts as passed when the strike pockets something.
- The saved stars are reduced to none, board 1 passed, or only board 2 passed.
- A held ← or → follows the same keyup rule as Space and is left out.
- Duo mode, the turn banner and the confirm dialog are left out.
- Scrolling is modelled only while aiming, and a reset brings the board back on screen.
- A `CONSTRAINT StopAtResize` stops exploring past a resized striker, to stay under the 500-state chart budget.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-game pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-game pauses it. | **breaks** |
| InputReleasedWhenAway | After blur or hide, nothing counts as held. | holds |
| KeysOnlyWhileBoardShows | A key only counts as held while the board is on screen, because only then does its release count. | **breaks** |
| LoopOnlyWhenMeaningful | The hum plays only while you pull and the board answers. | **breaks** |
| LoopComesBack | If you're pulling, the board answers and sound is on, the hum plays. Turning sound back on brings it back. | holds |
| NoHumOffThePlay | No hum on the pause card or the result. | holds |
| ShotFixedOnceFired | Once the striker leaves your finger, its size doesn't change until the discs stop. | **breaks** |
| UnlockOnlyByClearing | A board opens for good only when you pass the one before it. | **breaks** |
| NoDeadlock | There's always a next step. | holds |

## Bugs

### 1. KeysOnlyWhileBoardShows: Space gets stuck when the board scrolls away (game)
- **What the player sees:** "I held Space, scrolled the page and let go. মারো stayed charged, the hum never stopped, and the board ignored my finger."
- **Path:**
  0. The board is waiting.
  1. You hold Space.
  2. You scroll past the board.

  After that, `keyup` returns early because `!boardInView`.
- **Live replay (Orca):**
  - `keydown " "`: মারো reads "ছাড়লেই টোকা" with `data-on=true`, and one hum oscillator is live.
  - Scroll to the rules section: the board shows 0%, and the hum oscillator is still live.
  - `keyup " "`: মারো is still charged and the hum is still live.
  - Scroll back so the board shows 100%. Pull back on the board and let go: no strike (চাল is still ১/১০) and the hint doesn't change. `onBoardDown` refuses while `live.charging` is set.
  - 3 s later it's still charged, with the hum still live.
- **Fix:**
  - Always honour the `keyup` of a hold that `keydown` started, whatever the target or `boardInView`. A held Space or arrow should end on its own keyup.
  - Also call `letGo()` when `boardInView` turns false.

### 2. LoopOnlyWhenMeaningful: the hum drones with the board off screen (game)
- **What the player sees:** "I held মারো and scrolled the board away before my first strike. The hum kept droning at one pitch, and letting go fired a strike I couldn't see."
- **Path:**
  0. The board is waiting.
  1. You pull back or hold মারো.
  2. You scroll past the board.

  `useGameLoop` stops while the phase is ready and the board is out of view, so `tick()` never runs `stopHum()`.
- **Live replay (Orca):**
  - Pointer down on মারো: one hum oscillator is live.
  - Scroll away so the board shows 0%. The oscillator is still live, and still live 4 s later.
  - Pointer up: a strike fires off screen. The phase is `playing`, the hint says "গুটি গড়াচ্ছে…" and the hum stops only then.
- **Fix:** when the board leaves view, `letGo()`. That stops the hum and cancels the hold. Pause from playing too, the way পাটি বুনি does. Or keep the loop running while a hold exists.

### 3. PausedWhenBlurred: the discs roll while another window has focus (shared)
- **What the player sees:** "I clicked into another window mid-roll, and when I came back the strike had already finished."
- **Path:**
  0. The board is waiting.
  1. You hold Space.
  2. You let go and the striker flies.
  3. You click into another window.
- **Live replay (Orca):** fire with মারো at power 0.6, then window `blur`. 6 s later the strike has settled: চাল goes from ১ to ২ and the hint reads "এবার ঢুকল না। পরের চালে হবে।". No pause card appears.
- **Harm:** small, because the outcome is fixed at release. But the bar asks every game to pause on blur, and you miss watching your own shot.
- **Fix:** the `blur` listener should call `pause()` before `letGo()`. Use the shared away-handler, the same one shobdo-khoja and পাটি বুনি need.

### 4. ShotFixedOnceFired: বড় স্ট্রাইকার resizes a rolling striker (game)
- **What the player sees:** "I tapped বড় স্ট্রাইকার while my striker was rolling, and it grew in the middle of the shot."
- **Path:**
  0. The board is waiting.
  1. You hold Space.
  2. You let go and the striker flies.
  3. You tap বড় স্ট্রাইকার.
- **Live replay (Orca):** read through the game ref. Press মারো with a keyboard click (power 0.6): `g.phase` is `moving` at striker speed 1632 and radius 21. Tap বড় স্ট্রাইকার: the radius is now 25 while the striker is still moving at speed 1314.
- **Fix:** disable the toggle while `g.phase === "moving"`. Or keep the choice and apply `setStrikerSize` only in `settle()` and `newGame()`.

### 5. UnlockOnlyByClearing: a friend's board link opens every board, for good (shared with shobdo-khoja)
- **What the player sees:** "My friend's board-10 link opened all ten boards in my picker. I passed board 4 and now five boards stay open, though I never played boards 1 to 3."
- **Path (4 steps):**
  1. You open a friend's board-2 link.
  2. You hold Space.
  3. You let go and the striker flies.
  4. The discs stop and board 2 is passed.

  The saved stars now mean only board 2 is passed, and board 2 is open for good.
- **Live replay (Orca):**
  - Clear storage and open `/carrom#s=513530&t=8&l=10&n=রাফি`. The board shows "বোর্ড ১০ · টুর্নামেন্টের ফাইনাল" and 10 boards are enabled.
  - Pick board 4 and take 10 strikes with মারো. To skip aiming ten real shots, 6 coins were marked pocketed through the game ref before the last strike.
  - The slip reads "বোর্ড ৪ পার! ★★" and `ektukhani-levels-carrom` holds `{"4":2}`.
  - Reload without the link. The game opens on "বোর্ড ৫ · নানাবাড়ির বারান্দা" with 5 boards enabled.
- **Fix:** shared with shobdo-khoja bug 4. Open only the friend's own board, and don't let a board above `unlocked` raise the stored unlock.

## Quality-bar gaps (played end to end in Orca, with screenshots from headless Chrome)
1. **First win in 10 s:** board 1 needs 1 point. Ten straight মারো presses at the default aim scored 0 ("একটাও না"). A new player has no first shot set up to hit a coin. Aim the opening striker at a sure pocket, or have the ghost finger aim at one.
2. **First screen:** the H1 and lead sit above the board. On a 390 × 844 phone the bottom of মারো is at 851 px, just below the fold, and smaller phones lose the whole control row. The pause button is greyed until the first strike.
3. **Pause:** this gap is partly met. P, Esc and the button work, and hiding the tab pauses. Blur doesn't pause, and the pause is an overlay, not a menu with নতুন করে শুরু, কীভাবে খেলবে, শব্দ and সব বোর্ড.
4. **Choices:**
   - সব বোর্ড sits in a collapsed `<details>` under the board.
   - Picking a board mid-game in solo throws away the strikes in progress without asking (duo asks).
   - The একা/দুজনে switch resets at once.
   - Nothing is numbered, and no default is marked.
5. **Middle of the screen:** in duo, the "সাদার পালা" turn banner covers the board centre for 1.5 s after each change of turn. In solo the "টেনে ছাড়ো" pill sits over the striker lane at the start, which is acceptable as onboarding.
6. **Pacing:** the 10 boards differ only in their scatter seed and point thresholds. No board brings a new element. The "finale" is a name only, with no named boss moment.
7. **Settings:** the game has its own toggles (নিশানা রেখা, বড় স্ট্রাইকার) next to the shared ones. They're fine as assists, but বড় স্ট্রাইকার must not act mid-roll (bug 4), and neither says what it changes.
8. **Ending and sound:** this meets the bar.
   - The slip has stars, points, the coins, the exact gap to the next star and the best on this board.
   - The card replays the same scatter.
   - Sounds: a wooden click, clack, টুপ, cushion thump, coin, rising combo and the pull hum. The hum has the scroll bug above.

Screenshots:
- `.shots/carrom-first.png`: the first screen at 390 × 844, with মারো cut off at the bottom.
- `.shots/carrom-result.png`: the slip after ten straight strikes, 0 points.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/carrom/Carrom.tla --view ai_docs/statecharts/carrom/view.ts --out ai_docs/statecharts/carrom/after-fix
rm ai_docs/statecharts/carrom/after-fix/tlc.out
```
Before re-running, update the spec to match the fixed code:
- `WindowBlurs` pauses.
- A scroll away lets go and pauses.
- The Space keyup is always honoured.
- `YouToggleBigStriker` is disabled while rolling.
- The picker and unlock follow the new rule.

Keep `CONSTRAINT StopAtResize` only while the resize bug exists.
