# মার্বেল-সিঁড়ি: statechart (before the rewrite)

Model: `Marble.tla`, `Marble.cfg` and `view.ts`. It mirrors `tools/marble-sinri/components/marble-game.tsx`: `begin`, `newGame`/`again`, `finish`, `clearedStage` and its `window.setTimeout(sfx.levelUp, 900)`, `tick`, `press`/`lift`/`release`, `keys.down`/`keys.up`, `onBoardDown`/`onUp`, `holdButton`, the `visibilitychange` handler `hide`, the `[view, paused]` hum effect and the `SoundToggle` `onChange`. It also mirrors `useGameLoop` in `shared/game-kit.ts`. That is the **working copy**: blur cancels the frame and sets `away`, focus clears it, and a remount starts with `away = false`.
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC found 336 states. The chart has 18 states and 37 arrows.

## Systems modelled
- **Play phase:** first screen → marble rolling → result (the last chance lost), with "paused" on top. Respawn waits (0.7 s) are inside "rolling".
- **Pause and focus:** tab visible or hidden, window focused or blurred, `away` in `useGameLoop`, and pause and resume (P, Esc, থামাও/চালাও, চালিয়ে যাও, Space, a side).
- **Input:** `held` is what the game believes (`held.current.sides`). `hand` is whether a key or finger is really down. Keyup, pointerup, pointercancel and lost capture reach the page only while it has focus. `hide` and `finish` call `release()`. Pause keeps sides held, which is right, because keyup still arrives while paused.
- **Sound:** the roll hum (`none`, a silent `stub`, or `real`). It is opened with `hum.current ??= rollHum()` in `begin`, in the hum effect and in the `SoundToggle` `onChange`. The site-wide switch is modelled too.
- **Time:** the three-star chime, `window.setTimeout(sfx.levelUp, 900)` in `clearedStage`. It is never cleared.
- **Not modelled:** saved stars and colours (`useLevels.record` keeps the max; the colour falls back to 0 when not open); friend links (`newGame(shared.stage, shared.seed)`; `again()` keeps the friend's seed); the toast timer (`newGame` clears it); the 150 ms `sfx.good` after a refill; a stray tap past the result (Space does nothing during play, and see the geometry note in the gaps).

## Rules (each is an INVARIANT)
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | The stairs move only while you are on the page. | holds |
| InputReleasedWhenAway | After you click away, the game doesn't think you still hold a side. | **breaks** |
| MarbleRollsOnlyWhenHeld | The marble rolls sideways only while you really hold a side. | **breaks** |
| PausedWhenHidden | A run in play is paused while the tab is hidden. | holds |
| PausedWhenBlurred | A run in play is paused while another window has focus. | **breaks** |
| LoopOnlyWhenMeaningful | The roll hum is heard only while the marble rolls in front of you. | **breaks** |
| LoopComesBack | With sound on and the run going, the hum plays. | **breaks** |
| NoChimeAfterLeaving | The floor-cleared chime plays only while that run is still going in front of you. | **breaks** |
| NoDeadlock | You can always do something. | holds |

## Bugs
The live replays ran in Orca on `/marble-sinri`. State was read from the component's `run`, `held` and `hum` refs through the React fiber. Loop starts were counted by wrapping `OscillatorNode.prototype.start/stop`; the hum is the only oscillator started with no time. The chime was found by logging `AudioParam.setValueAtTime(784)`, the first note of `sfx.levelUp`.

### 1. MarbleRollsOnlyWhenHeld and InputReleasedWhenAway: "I alt-tabbed while holding →, and when I came back the marble rolled off the ledge on its own."
- **Path** (report, MarbleRollsOnlyWhenHeld): 1 you hold a side, 2 you click into another window, 3 you let go (the keyup is lost), 4 you come back to the window. InputReleasedWhenAway breaks at step 2.
- **Cause:** `release()` runs on hide and in `finish`, never on blur. `useGameLoop` only freezes the frame, so `held.current.sides` keeps the key.
- **Live replay:** → held for 0.2 s took `x` from 167.3 to 195.8. After the blur, `x` stayed at 195.8 and the clock at 1.07 for 2 s, with 1 side still held. After focus with **no key held**, `x` was 214.8 at +0.15 s and **332** at +0.75 s. The marble rolled right across the board.
- **Fix (shared pattern, game code):** on blur, call `release()` and pause, as `hide` does. Use the shared away handler (bug 3).

### 2. LoopOnlyWhenMeaningful: "I clicked into another window and the marble's hum kept droning."
- **Path** (report, LoopOnlyWhenMeaningful): 1 you hold a side (the hum opens), 2 you click into another window.
- **Cause:** the hum effect runs on `[view, paused]`. Blur changes neither, so `stopHum()` never runs.
- **Live replay:** in the same run, 1 hum loop started, and there were **0 stops** during the 2 s away.
- **Fix (shared):** stop loops on blur. Pausing on blur does it here, because the hum effect stops the hum when paused.

### 3. PausedWhenBlurred: "I came back to the window and the stairs were already rising. There was no pause screen."
- **Path** (report, PausedWhenBlurred): 1 you hold a side, 2 you click into another window.
- **Cause:** `useGameLoop` restarts on focus by itself. The game's own pause (`setPaused`) is called only by P, Esc, থামাও and hide.
- **Live replay:** in the same run, the clock moved again at once after focus (1.07 → 1.17 in 0.15 s), and `.ms-overlay` never showed.
- **Fix (shared):** call the game's pause on blur. A shared `useAway(onAway)` hook (or an `onAway` option on `useGameLoop`) would give badminton, the plane and the marble the same behaviour.

### 4. LoopComesBack: "I turned sound off, started, turned it back on, and the marble rolled in silence."
- **Path** (report, LoopComesBack): 1 you turn sound off, 2 you hold a side (the run starts), 3 you turn sound on.
- **Cause:** with sound off, `begin()` runs `hum.current ??= rollHum()`, and `rollHum()` wraps `loop()`, which returns a silent stub. On sound on, `onChange` runs `hum.current ??= rollHum()` again, and `??=` keeps the stub. This is the "muted loop stub" pattern in `ai_docs/prompts/game-rewrite.md`.
- **Live replay:** sound off ("শব্দ বন্ধ"): 0 hum loops. Run started: a hum object exists, 0 loops. Sound on ("শব্দ চালু"), then 1.2 s of rolling with ← held: **still 0 loops**. A pause and resume brought it back (1 loop), because pause nulls the stub.
- **Fix (game):** in `onChange`, on sound on, `stopHum(); hum.current = rollHum()` while playing. Never restore a loop with `??=`. Or keep `null` while muted: only call `rollHum()` when `soundOn()`.

### 5. NoChimeAfterLeaving: "I cleared a floor and pressed pause, and the fanfare played on the pause screen."
- **Path** (report, NoChimeAfterLeaving): 1 you hold a side, 2 you clear a floor without a fall, 3 you lose the last chance, 4 the chime plays on the result. Pause, hide and "play again" within 0.9 s do the same.
- **Cause:** `clearedStage` runs `window.setTimeout(sfx.levelUp, 900)` for a three-star floor. The id isn't kept, so nothing clears it on pause, finish or newGame.
- **Live replay:** to reach a floor's end fast, every ledge row was shifted by 19, so the next landing is row 20. "ছাদ পার ★★★ নতুন মার্বেল: আকাশি" appeared with 0 hits, and থামাও was pressed **211 ms** later. The level-up fanfare's first note started **890 ms after the clear**, on the "খেলা থেমে আছে।" overlay.
- **Fix (shared pattern):** keep celebration timers in a list and clear them in `newGame`, pause, `finish` and on unmount, as the plane's `later()` and `timers` do. Better, add a shared `useTimers()` to `shared/game-kit.ts` so no game uses a bare `setTimeout` for a sound. The 150 ms `sfx.good` after a refill has the same shape.

## Quality-bar gaps (played end to end in Orca on a Pixel 9: an autopilot run from চিলেকোঠা, 13 steps and 4 marbles, three chances lost to the top stripe)
1. **Words above the game:** the H1 ("মার্বেলটা কত ধাপ নামাতে পারবে?") and the HUD line sit above the board. The first screen is good otherwise: the board shows "◀ চেপে ধরো / চেপে ধরো ▶" on its two halves, and holding either half starts (`.shots/marble-sinri-sc-first.png`).
2. **Banners over the play area:** the hurt and floor toasts ("ওপরে ঠেকে গেল। আর ১টা সুযোগ", "ছাদ পার ★★★") are a dark box at the top centre, right under the danger stripe where the marble is in trouble (`.shots/marble-sinri-sc-play.png`).
3. **Pause misses blur** (bugs 1–3), and it is a single "চালিয়ে যাও", not the shared menu.
4. **No ending:** the last floor (গলি) never ends, and no named last beat ("boss") closes the building. The bar wants a moment at the end of a world.
5. **Choices:** the start floor is picked for you (the first floor without three stars) and announced in one line. The floor grid and the unlocked marble colours sit in a closed drawer, so the colour reward ("নতুন মার্বেল: আকাশি") has nowhere to be used right away.
6. **Danger:** good. A warning stripe fades in at the top edge as the marble nears it, and the chances show as three dots top-right. There is no glow on the last chance.
7. **Ending:** real stats (13 steps, 4 marbles), the floor reached, a near-miss line ("আর ৭ ধাপ নামলে চিলেকোঠা পার।") and the stars per cleared floor (`.shots/marble-sinri-sc-over.png`). On a Pixel 9, "আরেকবার" sits at y=845, below the pads at y=742, so a held pad tap can't land on it.
8. **Sound:** the landing click, the climbing glass ting (the signature), the cactus "উফ" and the roll hum all mean something. There is no music, the hum can go missing (bug 4) and the fanfare can outlive its floor (bug 5).

Screenshots: `.shots/marble-sinri-sc-first.png` (first screen, Pixel 9), `-play.png` (a hurt toast over the play area), `-over.png` (the result).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/marble-sinri/Marble.tla --view ai_docs/statecharts/marble-sinri/view.ts --out ai_docs/statecharts/marble-sinri/after-fix
rm ai_docs/statecharts/marble-sinri/after-fix/tlc*.out
```
