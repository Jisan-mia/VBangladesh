# তারের ফাঁকে বেলুন: statechart (before the rewrite)

Model: `TarerFankeBelun.tla` / `TarerFankeBelun.cfg` / `view.ts`. It mirrors `tools/tarer-fanke-belun/components/balloon-game.tsx`: press, begin, again/choose/primary with `AGAIN_GUARD_MS`, `finish` and its `setTimeout`s, the pop and over handling in `step`, `stopLoops`, the visibilitychange and inView effects, and `SoundToggle onChange={stopLoops}`. It also mirrors `tools/tarer-fanke-belun/lib/game.ts`: `puff` and `stepRun`.
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC found 216 states. The chart has 20 states and 33 arrows.

## Systems modelled
- **Play phase:** ready → playing → pop → over, or playing → over (level cleared). Street 0 is the endless street. Street 1 is a level that one crossing clears.
- **Pause and focus:** the window can be on the page, blurred, hidden, or scrolled out of view. Hiding the tab and scrolling the stage away pause the run and stop the loops. Blur does nothing.
- **Input:** a puff from a tap on the stage or Space, Enter or ↑. Both need the stage on screen. A puff while paused resumes the run.
- **Sound:** the wire-hum loop (`ear.hum ??= loop("hum")`) starts only inside a puff. `stopLoops()` runs on pop, finish, pause and begin, and on every flip of the sound switch. While sound is off, `loop()` returns a silent stub.
- **Time:** the result guard (`AGAIN_GUARD_MS`, 400 ms) and the celebration timeouts in `finish()`: 300 + stars × 260 ms after a clear, and 650 ms after a new endless best.
- **Choices:** আরেকবার / পরের লেভেল (guarded) and the level grid (no guard, open in any phase).
- Not modelled: the wind loop, which behaves exactly like the hum. Saved stars aren't modelled either: they go through the shared `useLevels`/`recordLevel` (maximum only), and `migrateLevels` runs only while no level store exists. Friend links aren't modelled: `parseCard` checks them.

## Rules (each is an INVARIANT)
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-flight pauses the run. | holds |
| PausedWhenOffScreen | Scrolling the game out of view mid-flight pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-flight pauses it. | **breaks** |
| LoopOnlyWhenMeaningful | The wire hum plays only while you fly, unpaused, with sound on, never on the result. | holds |
| LoopComesBack | While you fly with sound on, the hum is playing. | **breaks** (low) |
| NoCelebrationAfterLeaving | A fanfare or confetti never fires after you've left the result. | **breaks** |
| NoTapPastResult | A tap already on its way when the balloon pops can't skip the result. | holds (AGAIN_GUARD_MS) |
| NoDoubleResult | The result fires its sounds once per run. | holds |
| NoDeadlock | You can always do something. | holds |

## Bugs

### 1. PausedWhenBlurred: "I clicked into another window for a second and came back to ফটাস!"
- **Path** (report, PausedWhenBlurred): 1 "you tap (puff)", 2 "you click into another window", and the run goes on.
- **Cause:** there is no `blur` handler, and `useGameLoop` stops only while the tab is hidden. In a real-time game with gravity, that means a fall.
- **Live replay (Orca):** one puff, then `blur` 100 ms later. Before the blur: playing, y 176, dist 12. After 2 s away: over, y 342, dist 136, `popped: "wire"`. No pause cover appeared, only the result cover.
- **Fix (shared):** pause on `blur` in `useGameLoop` or the shared player, and stop the loops. The same fix covers bostar-pahar and antenna-thik-koro.

### 2. NoCelebrationAfterLeaving: "I pressed আরেকবার right after a new best, and the fanfare and confetti went off over my next run."
- **Path** (report, NoCelebrationAfterLeaving, shortest): 1 "you tap (puff)", 2 "the last crossing is passed", 3 "you pick যত দূর পারো" (or a level) while the fanfare is still waiting. The everyday path is the same with "you press আরেকবার / পরের লেভেল" after the 400 ms guard and before the timeout.
- **Cause:** `finish()` calls `window.setTimeout(...)` and never keeps or clears the ids. `begin()` clears the loops but not these timeouts. The guard (400 ms) is shorter than every timeout (650 ms for a best; 820 ms or 1080 ms for 2 or 3 stars).
- **Live replays:**
  - Endless street, a first run (a new best): আরেকবার was pressed 432 ms after the result. 177 ms later, on the new run's ready screen, 4 fanfare tones and a confetti canvas fired.
  - Level 1 cleared with 2 stars: "পরের লেভেল" was pressed at 461 ms. 352 ms later, on level 2's ready screen, `sfx.good` played (2 tones).
- **Fix (shared):** keep celebration timeouts in a ref and clear them in `begin()`, as bostar-pahar's `timers` does. Better, add a shared `useTimers()` (later, clearAll on reset and unmount) to `shared/game-kit.ts`, so no game can leak one.

### 3. LoopComesBack (low): "After চালিয়ে যাও, or after turning sound back on, the wires stay silent until my next tap."
- **Path** (report, LoopComesBack): 1 "you tap (puff)", 2 "you turn sound on" (from off). Resuming after a pause does the same.
- **Cause:** the loops start only inside `press()`'s puff branch. The paused branch returns before it, and the sound switch only stops the loops.
- **Live replay:** while flying with the hum live (1 loop), the switch went off and on: 0 loops, and the hum came back 602 ms later at the next puff. After scrolling away (paused, 0 loops) and pressing চালিয়ে যাও: 0 loops, and the hum came back 413 ms later at the next puff.
- **Fix (game):** start the loops in the resume branch too, and use `SoundToggle onChange={on => { stopLoops(); if (on && playing) startLoops(); }}`. The skill's "Sound switch" fix describes the same thing. Low severity, because players puff about twice a second.

## Quality-bar gaps (played in Orca: levels 1–2 and the endless street with a simple autopilot, plus pops)
1. **Pause:** there is no pause button and no P or Esc. You can pause only by hiding the tab or scrolling away, and blur doesn't pause (bug 1).
2. **HUD in the middle:** the big outlined score ("২/৮") sits top-centre over the play area. The wind label sits on the stage. Corners and a thin progress bar would keep the middle clear.
3. **Difficulty step:** our autopilot cleared level 1 (6 crossings) on its first try. On level 2, where the gusts start, it popped at 3/8. Two changes arrive at once: gusts and more crossings. The bar asks for one new idea per level.
4. **Danger:** a near-wire moment is heard (the hum rises) but not seen. Add an edge glow or a balloon outline flash, so the meaning the sound carries is also visible (§7).
5. **Celebrations leak** into the next run (bug 2).
6. **Words above the game:** the H1 and lead sit above the stage and push it down on a phone.
7. **End screen (good):** the cover shows the stars, the crossings, grazes, a near-miss line ("আর ১টা ঘষা কম হলেই ৩ তারা।") and the friend's score. Keep it.
8. **Sound (good):** puff, squeak, pop, a climbing streak note and a hum that follows the clearance. There is no stage tune.

Screenshots: `.shots/tarer-fanke-belun-sc-first.png`, `-play.png` (level 2, score over the middle), `-over.png` (popped result cover).

## Live-replay notes
- Orca throttles requestAnimationFrame in a tab that isn't on screen. The replays used a 16 ms `setTimeout` shim, with the game code unchanged.
- Orca makes `document.hidden` non-configurable, so hiding was not faked. The scroll-away pause stood in for it, and it held live.
- Loops were counted by instrumenting `AudioScheduledSourceNode.start()`/`stop()` (a no-argument start is `loop()`). Tones were counted by instrumenting `OscillatorNode.start()` with a `when` argument. Confetti was counted as `<canvas aria-hidden>` elements added to `body`.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/tarer-fanke-belun/TarerFankeBelun.tla --view ai_docs/statecharts/tarer-fanke-belun/view.ts --out ai_docs/statecharts/tarer-fanke-belun/after-fix
rm ai_docs/statecharts/tarer-fanke-belun/after-fix/tlc*.out
```
The chart shows a pick from সব লেভেল only from the result. The model keeps every pick.
