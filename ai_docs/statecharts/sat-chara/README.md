# সাত চাড়া: statechart, before the rewrite

Two specs, because together they reached 2,994 states and the chart budget is 500:
- `SatChara.tla` / `SatChara.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`): the play. TLC: 106 states, 462 steps. The chart has 12 states and 22 arrows.
- `SatCharaLevels.tla` / `SatCharaLevels.cfg`, view `view-levels.ts`, output `before-fix/levels/`: saved levels and friend links. TLC: 51 states, 176 steps. The chart has 13 states and 31 arrows.

Both mirror `tools/sat-chara/components/sat-chara-game.tsx` (every handler and effect), `shared/game-kit.ts` (`useGameLoop`, `useLevels`), `shared/game-core.ts` (`unlockedLevel`), `shared/game-sound.ts` (`loop`, `setSoundOn`) and `tools/sat-chara/lib/sound.ts` (`stretch`).
**5 rules hold and 5 break.** The breaks come from 4 bugs, because one bug breaks two rules.

**The code changed under this run.** Commit `6775639` (the shared game player) changed `useGameLoop` so it also stops on window blur and restarts on focus. The spec models the code after that commit. Under the old loop, a ball in the air kept flying and the throw ended while you were in another window. That rule (NoProgressWhileAway) now holds, and the live check below confirms it.

## Systems modelled
- **Play phase:** `aim → flying → aim` (stones still standing, balls left), `→ clear` (all seven down) or `→ fail` (the third ball is gone). The three balls are abstracted to "not the last" and "the last".
- **Aim:** `sweep` (the direction swings), `power` (the direction is fixed and the power swings; the arrow-key `keys` aim acts the same way) and `drag` (you hold the ball back). `tap()` moves sweep → power → throw. A pull past `TAP_SLOP` is `drag`, and letting go throws.
- **Pause and focus:** tab visible or hidden, window focused or blurred. `hide()` (visibilitychange) stops the hum, drops the pull and pauses only a ball in the air, which shows the "থেমে আছে" overlay. The game has no blur handler of its own. Since `6775639`, the shared loop stops stepping on blur, without an overlay.
- **Input:** the pointer pull, and Space or Enter held down. The window keydown handler never checks `event.repeat`.
- **Sound:** the stretch hum (`loop("hum")`) while you pull, and the site-wide switch (`SoundToggle`, whose `onChange` sets `live.hum = null` on off and does nothing on on).
- **Levels (second spec):** three levels, `cleared` per level, a friend's link for level 3 (`readFriend → startLevel(3)`), the সব লেভেল grid up to `max(unlocked, friend.level)`, পরের লেভেল and আবার খেলো.

Not modelled: the physics, which is deterministic and covered by `tests/sat-chara.test.ts`. Also left out are star counts (`recordLevel` keeps the max, which is pure) and the scroll-out-of-view stop (`boardInView` only gates the aim sweep). There are no timers of our own: `StarReveal` clears its own chimes on unmount.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | When the tab hides, a ball in the air stops and the pause overlay shows. | holds |
| NoProgressWhileAway | A ball in the air doesn't fly on, and the throw doesn't end, while you're in another window. | holds (since `6775639`) |
| InputReleasedWhenAway | Once you leave the window, you're no longer holding the ball. | **breaks** |
| PausedMeansFrozen | The pause overlay covers only a ball in the air, with nothing held and no hum behind it. | holds |
| HumOnlyWhilePulling (LoopOnlyWhenMeaningful) | The stretch hum plays only while you pull on the page with sound on. | **breaks** |
| HumComesBack (LoopComesBack) | While you pull with sound on, you hear the hum. | **breaks** |
| OnePressOneThrow | Only a press you meant throws a ball, never a held key's repeat. | **breaks** |
| NothingHeldOnTheResult | The stars screen and the "তিনটা বলই শেষ" screen never sit over a held ball or a hum. | holds |
| LevelIsOpen (levels) | The level you play is one you can open. | holds |
| OpenLevelsAreEarned (levels) | On this phone, a level opens only after you clear every level before it. A friend's level is playable for that visit only. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. InputReleasedWhenAway + HumOnlyWhilePulling: "I was pulling the ball back when a message came up in another window, and the hum kept droning until I came back"
- **Path (report):** 0 aiming → 1 you pull the ball back (hum on) → 2 you click into another window (still pulling, hum still on).
- **Live replay (Orca, level 1):** I counted the hum by wrapping `OscillatorNode.prototype.start/stop` for the 90 Hz sawtooth. Then I sent a pointerdown and two pointermoves (60 px back), which gave `humStart` at t = 40 911 ms. I sent `blur` at 41 113. At 43 114, 2 s later, the hum hadn't stopped, the status still read "ছেড়ে দিলেই বল যাবে।", and a pointermove sent while away still re-aimed the ball. A pointerup while away threw it (`aim → flying`, balls ৩ → ২). The hum stopped only then (`humStop` at 43 167). Because the shared loop is now stopped by the blur, the thrown ball then hung in the hand (`world.steps` 0, `ball = 1`) until the window got focus again, while the status said "দেখো কয়টা পড়ে।".
- **Fix:** give the game a `blur` handler that does what `hide()` does: `stopHum()`, `live.pull.id = -1`, `drag → sweep` and release pointer capture. A ball in the air should also show the থেমে আছে overlay (`live.paused = true; setPaused(true)`), so leaving the window looks like leaving the tab. **Shared:** the shared loop now freezes on blur, but each game's own input, loops and overlay don't hear it. A shared `useAway(onAway)` in `shared/game-kit.ts` (blur plus hidden) would let every game drop held input and stop its loops in one place. Moving to the shared game player gives the same result.

### 2. HumComesBack: "I muted and unmuted while pulling, and the pull went silent"
- **Path:** 0 → 1 you turn sound off → 2 you pull the ball back (silent, which is right) → 3 you turn sound on, but the pull stays silent.
- **Live replay:** I pulled with sound on (1 hum start) and clicked the সাউন্ড toggle off. `live.hum` became `null` and the hum stopped. I clicked it back on and pulled 5 more moves. The hum starts stayed at **1**, `live.hum` stayed `null`, and the toggle showed `aria-pressed="true"`. From the model's own path (sound off before the pull), `loop()` returns a silent stub that `live.hum ??= stretch()` keeps for the whole pull.
- **Fix:** in `onPointerMove`, create the hum whenever `p.moved && !live.hum && soundOn()`, and drop a stub. Or pass `SoundToggle onChange={on => on ? (live.aim === "drag" && (live.hum = stretch())) : (live.hum = null)}`. This is low severity, since you need a second hand to toggle mid-pull. **Shared pattern:** it's the same LoopComesBack gap that antenna's model found.

### 3. OnePressOneThrow: "I held Enter a moment too long on the stars, and the next level's ball flew before I aimed"
- **Path:** 0 → 1 you press Enter → 2 you keep holding Enter: the ball is in the air. From the result screen, the same press first moves to the next level.
- **Live replay:** on লেভেল ৩'s stars, I dispatched one Enter keydown, then repeats (`repeat: true`) every 33 ms, the way a held key sends them. Enter: `startLevel(4)`. Repeat 1 (+536 ms): লেভেল ৪, aim `power`, so the direction was fixed. Repeat 2 (+572 ms): `flying`, with balls ৩ → ২. The ball was gone 0.6 s after one long press, with no aim at all.
- **Fix:** add `if (event.repeat && (key === " " || key === "Enter")) return;` in the keydown handler, and keep repeats for the arrow keys. **Game**, but it's a pattern: 54 games handle Enter or Space and only 22 read `event.repeat`.

### 4. OpenLevelsAreEarned: "I beat a friend's level 3 on a new phone, and now levels 2 and 4 are open though I never played 1 or 2"
- **Path (levels report):** 0 a fresh phone, levels 1–1 open → 1 you open a friend's level-3 link → 2 you knock all seven down: level 3 open, and level 1 never played.
- **Live replay:** with `ektukhani-levels-sat-chara` removed, I opened `/sat-chara#s=24757&t=2&l=3&n=Rafi`. The banner read "Rafi লেভেল ৩-এর সাত চাড়া ২ বলে ফেলেছে।" and the game opened on লেভেল ৩. I cleared it with one ball ("Rafi-এর চেয়ে ১ বল কম লাগল!"), which saved `{"3":3}`. After a reload without the hash, the game opened on **লেভেল ৪**. The সব লেভেল grid showed **4 open**: লেভেল ১, ২, ৩ (৩ তারা) and ৪, with ৫ and up বন্ধ.
- **Fix:** make `unlockedLevel` in `shared/game-core.ts` count the unbroken run of cleared levels from 1, and keep a friend's level playable for that visit only (it's already in the grid through `unlockedOrFriend`). **Shared** with sudoku (its bug 5), switchboard and every game whose link carries a level.

### Checked and fine
- **PausedWhenHidden** (Orca pins `document.hidden`, so I applied `hide()`'s effects directly: `live.pull.id = -1; live.paused = true; setPaused(true)`): during a flight, `world.steps` stayed at 18 for 1.5 s under "থেমে আছে। বল মাঝপথে ঝুলে আছে।", and চালিয়ে যাও resumed it (18 → 41 in 0.4 s).
- **NoProgressWhileAway** after `6775639`: I threw with two taps, then sent `blur`. `world.steps` held at 15 for 3 s, then ran 56 → 98 → clear after `focus`. No overlay appeared, so the ball just hangs.

### Minor (not in the model)
- Blur freezes the ball silently: the status still says "দেখো কয়টা পড়ে।" and nothing says it's paused.
- Space or Enter resumes, and throws, only while the board is in view (`boardInView`), and there's no P or Esc.
- `useGameLoop` (shared) starts each new effect with `away = false`. If `running` flips while the window is blurred, the new loop runs although you're away. In this game `running` flips only from actions on the page or from `hide()`, so I couldn't reach it, but other games with timers may.
- Replaying a level for fewer stars shows the near-miss line ("আর ৩টা পড়লে ৩ তারা হতো") even when that level already has 3 stars.

## Quality-bar gaps (game-quality-bar)
1. **Pause isn't a real menu (§7):** the game isn't in the shared game player. There's no pause button and no P or Esc. A hidden tab shows a one-line overlay, while blur freezes the game with no sign (bug 1). The overlay offers only চালিয়ে যাও.
2. **Easy is too easy, and the curve wobbles (§2, §9):** a random-throw autopilot cleared levels 1–9 in about 60 s with one fail, then 10–15 in about another minute. Over a 23 × 18 grid of angle and power, the share of throws that clear in one ball was L1 40%, L2 49%, L3 44%, L4 29%, **L5 60%**, L6 14%, L7 31%, **L8 50%**, L9 18%, L10 6%, then L11–18 13–26%, L19 4%, L20 1%, L21–30 0–11% (L27 0%). Levels 5 and 8 are easier than the levels before them, and a dead-weak 5° roll at 0.2 power clears levels 1, 2, 3, 5 and 8 with one ball.
3. **No "boss" moment at the end of a world (§9):** levels 10, 20 and 30 get one line ("গলির সব সাজানো শেষ। এবার স্কুলের মাঠে।") and confetti on a first clear, but no named final pile and no special card.
4. **The first screen puts words over the game (§1, §12):** the H1 and a two-line lead sit above the board, and the hint chip "⟵ টেনে ছাড়ো" sits on the play area. On desktop the board is 480 px wide in a 1,120 px column, with empty space on the right. The biggest control is the plain "দিক ঠিক করো" button rather than the ball itself.
5. **No danger cue (§6):** the last ball is marked only by "শেষ বল।" in the status line. There's no edge glow and no change to the ball chips beyond one dot left.
6. **Choices (§4):** পরের লেভেল is the clear default, which is good. But সব লেভেল hides in a `<details>` drawer, and neither the grid nor পরের লেভেল says what the next level adds (a brick, a step, two piles).
7. **HUD (§5):** good. The level and stars are top-left, the balls and the `০/৭` count top-right, and the status line sits under the board. The middle stays clear except for the first-run hint chip.
8. **Sound (§11):** good. There are 6 sounds (the clatter signature, thwack, bounce, the far dog, the stretch hum, release) plus shared combo, good and lose sounds. The dog joke is also written in text ("দূরে একটা কুকুর ডেকে উঠল।"). There's no music, which fits.
9. **Ending (§10):** good. The result has real stats and an exact near-miss line, and the card, the friend banner and the compare line all work. Friends' scores are labelled "নিজের ফোনের হিসাব".

## Screenshots
- `.shots/sat-chara-desktop-top.png`: desktop, a fresh phone. The H1 and lead sit above the board, with the hint chip on the canvas.
- `.shots/sat-chara-desktop-first-screen.png`: the player scrolled to the top, level 1 with its dotted aim path.
- `.shots/sat-chara-desktop-midplay.png`: level 6 mid-flight under the autopilot (two piles, "বল যাচ্ছে").
- `.shots/sat-chara-desktop-result.png`: level 1 cleared in 2 balls (★★☆, the near-miss line, পরের লেভেল / আবার খেলো) with the card below.
- No phone capture: the shared dev build broke mid-run (another agent's antenna rewrite: "Export ROUNDS doesn't exist"), and every route rendered blank after that.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/sat-chara/SatChara.tla --view ai_docs/statecharts/sat-chara/view.ts --out ai_docs/statecharts/sat-chara/before-fix
scripts/statechart.sh ai_docs/statecharts/sat-chara/SatCharaLevels.tla --view ai_docs/statecharts/sat-chara/view-levels.ts --out ai_docs/statecharts/sat-chara/before-fix/levels
rm -f ai_docs/statecharts/sat-chara/before-fix/tlc*.out ai_docs/statecharts/sat-chara/before-fix/levels/tlc*.out
```
The script needs an empty `--out` folder, so run the play spec first and the levels spec second, or use fresh folders. After the fixes, update the specs: in `WindowBlurs`, drop the pull and the hum and pause a flying ball; in `SoundOn`, restart the hum while pulling; ignore repeats in `EnterRepeats`; in the levels spec, use the unbroken run for `Unlocked`. Then re-run into `after-fix/` and `after-fix/levels/`. Every rule must hold.

Note for testers: Orca's pane was occluded, so `requestAnimationFrame` ran at about 1 fps. I swapped it for a 16 ms `setTimeout` from the console, then waited for the old frame to fire rather than dispatching `visibilitychange`. Dispatching it starts a second loop chain that a blur can't cancel, and that makes a throw look like it flies on while you're away.
