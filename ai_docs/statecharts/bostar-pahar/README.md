# বস্তার পাহাড়: statechart (before the rewrite)

Model: `BostarPahar.tla` / `BostarPahar.cfg` / `view.ts`. It mirrors `tools/bostar-pahar/components/bostar-game.tsx`: press, start/play/again/proceed, `finish` and its chime timers, the keydown effect, the visibilitychange effect, the pause button, and `useGameLoop`. It also mirrors `tools/bostar-pahar/lib/game.ts`: `tap`, `step` and `land`.
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC found 296 states. The chart has 19 states and 47 arrows.

## Systems modelled
- **Play phase:** ready → swing → drop → settle → swing … → (slip) fall → over. One sack fills the truck in the model (`sacks` 0..1, which means stars were won).
- **Pause and focus:** the window can be on the page, blurred or hidden. `paused` comes from the থামাও/চালাও button, P or Esc, and the visibility handler. The visibility handler pauses only swing, drop, settle and fall. `useGameLoop` stops only while the tab is hidden, and nothing handles blur.
- **Input:** a press of Space, Enter or ↓, a tap on the stage or the বস্তা ফেলো button, and the browser's **auto-repeat keydown** while a key stays down. The handler has no `event.repeat` check.
- **Time:** drop, settle and fall progress only while the loop runs. The star chimes and fanfare are `setTimeout`s in `timers`.
- **Results:** `finish()` runs once per run. On the result, the keyboard calls `proceed()`, which means the next ghat or again, with no guard.
- Not modelled: saved stars and unlocks. They go through the shared `useLevels`/`recordLevel`, which keeps the maximum, and `migrateBest` returns 0 once any stars exist. Friend links aren't modelled either: `parseCard` checks the level and the counts.

## Rules (each is an INVARIANT)
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-run pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-run pauses it. | **breaks** |
| EveryDropIsATap | Every sack drops because you pressed, never on its own. | **breaks** |
| NoTapPastResult | The result is never skipped by a press already on its way. | **breaks** |
| NoChimeAfterLeaving | Star chimes and the fanfare never play after you leave the result. | holds (`start()` clears `timers`) |
| NoDoubleResult | The result fires its sounds once per run. | holds |
| NoDeadlock | You can always do something. | holds |

## Bugs

### 1. EveryDropIsATap: "I held Space and the game kept dropping sacks and restarting by itself."
- **Path** (report, EveryDropIsATap): 1 "you press থামাও / চালাও (or P)", 2 "you press Space" (this resumes), 3 "the held key repeats" drops a sack. The plain case also breaks: press Space and keep holding, and the next sack drops on a repeat.
- **Cause:** the keydown handler has no `if (event.repeat) return`. `tap()` blocks only the first 0.15 s of a swing (MIN_SWING), so each repeat drops the next sack the moment it may.
- **Live replay (Orca):** one keydown, then a repeat keydown every 33 ms for 5 s, which is what Chrome sends while a key is held. Results appeared at 1108, 2357, 3600 and 4844 ms. Each was replaced 35–40 ms later by a new run, whose first sack the repeats dropped again. That is 4 runs in 5 s, all with "০টা বস্তা".
- **Fix (game):** ignore `event.repeat`, as tarer-fanke-belun and chor-police already do. Add a node test: repeats never call `tap()`.

### 2. NoTapPastResult: "The pile fell, I pressed Space once more and the result vanished before I could read it."
- **Path** (report, NoTapPastResult): 1 "you press Space", 2 "the sack slips off", 3 "the result shows", 4 "the held key repeats" (a single press does the same).
- **Cause:** on the result, the keydown handler calls `proceed()` at once (`if (over) proceed()`). There is no guard like tarer-fanke-belun's `AGAIN_GUARD_MS`. When the ghat is cleared, `proceed()` jumps straight to the next ghat.
- **Live replay:** one Space, then the result after 1093 ms. One more Space 150 ms later: no result shown, the score back to "০টা বস্তা", and the hint "দোলটা একবার দেখে নাও…".
- **Not reproduced (model fixed):** a finger. The result block replaces the বস্তা ফেলো button and moves things, so the old button's spot showed the result's stars ("★"). The button path in the model gives no stray-press mark.
- **Fix (shared):** use the shared result guard (see chor-police): ignore presses for about 400–500 ms after the result appears. Show the result for at least that long before "পরের ঘাট" accepts Space.

### 3. PausedWhenBlurred: "I dropped a sack and clicked into another window; when I came back the run was already over."
- **Path** (report, PausedWhenBlurred): 1 "you press Space", 2 "you click into another window", and the sack keeps dropping.
- **Cause:** the game has no `blur` handler, and `useGameLoop` stops only on `visibilitychange`.
- **Live replay:** one Space, then a `blur` 50 ms later. Over the next 1.5 s, 82 frames ran, the pile tipped and the result showed, all while the window had no focus. No চালিয়ে যাও appeared.
- **Severity:** low here. A swinging sack never drops by itself, so you lose only the sack already in the air. It is still the bar's rule (§7), and it is the same bug as in antenna-thik-koro and tarer-fanke-belun.
- **Fix (shared):** pause on `blur` in `useGameLoop`, or in the shared player, and resume through চালিয়ে যাও.

## Quality-bar gaps (played in Orca: a careful autopilot to 37 sacks, and runs ending in a slip)
1. **Difficulty and pacing:** ghat 1 never ends for a decent player. An autopilot that missed the centre by up to a quarter of a sack never slipped: 5 sacks (truck full) at 4.9 s, 20 sacks (3 stars) at about 28 s, 37 sacks at 60 s, and still going. Faster swings and a sliding trolley are the only new idea per ghat. There is no new element and no named end moment at ghat 10.
2. **Danger at the edges:** the lean shows only as hint text under the canvas ("পাহাড় ডানে হেলে আছে…"). There is no edge glow or wobble on the pile when one more lean would topple it.
3. **Pause:** a chip under the game, plus P and Esc. Blur does not pause (bug 3). The cover shows one button, with no menu (restart, how to play, ghats).
4. **Result:** the result replaces the button under the canvas, and the card sits further down. A stray Space skips it (bug 2). Holding Space loops runs forever (bug 1).
5. **Words above the game:** the H1 and lead sit above the stage. On a phone the crane starts about 330 px down.
6. **HUD:** the count and goal sit above the canvas rather than in its corners. The "সেরা ০" badge showed a best of 0, which came from runs restarted by the repeat bug.
7. **Sound:** release, thump, slide, a combo that climbs and star chimes are all good. But there is no stage tune and nothing that changes per ghat.
8. **Choices:** the ghats sit inside a closed `<details>`. Nothing tells you what the next ghat changes ("আরও জোরে দোলে, ট্রলি সরে").

Screenshots: `.shots/bostar-pahar-sc-first.png` (first screen), `-play.png`, `-tall.png` (37 sacks, ঠিক মাঝে ×২, ★★★), `-over.png`.

## Live-replay notes
- Orca throttles requestAnimationFrame to about 3 frames a second in a tab that isn't on screen. The replays used a shim, `requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), 16)`, which gave 60 frames a second. The game code was unchanged.
- Orca defines `document.hidden` as non-configurable `false`. So "you hide the tab" could not be faked live, and PausedWhenHidden is checked by the model and by reading the code only.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/bostar-pahar/BostarPahar.tla --view ai_docs/statecharts/bostar-pahar/view.ts --out ai_docs/statecharts/bostar-pahar/after-fix
rm ai_docs/statecharts/bostar-pahar/after-fix/tlc*.out
```
