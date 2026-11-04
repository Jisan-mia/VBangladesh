# বাইচের নৌকা statechart (before the rewrite)

Model: `BaicherNouka.tla` / `BaicherNouka.cfg` / `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/baicher-nouka/components/baich-game.tsx`, `shared/game-kit.ts` (`useGameLoop`), `shared/game-sound.ts` (`loop`, `setSoundOn`), `shared/game-ui.tsx` (`SoundToggle`).

TLC: 464 states, 1,900 steps. **3 rules hold, 5 break.**

## Systems modelled
- **Race phase:** ready → racing → paused → result, plus তাল মেলাও (calibration).
- **Pause and focus:** P, Esc and থামাও pause, and so do a hidden tab and the river scrolling out of view (`useInView`, threshold 15%). There is no blur or focus listener. `useGameLoop` stops only while the tab is hidden.
- **Resume:** the overlay's চালিয়ে যাও or Space (both need the river in view), or the bar's চালিয়ে যাও (doesn't).
- **Start:** শুরু করো, Space or the arrows (need the river in view), or the drum and side pads below the river (don't).
- **Rush loop:** `loop("wind")` starts in `start`/`resume`, stops on any phase other than racing, and `setSoundOn(false)` stops it too. The SoundToggle `onChange` restarts it only while racing.
- **Result:** `settled()` blocks restarts for 450 ms. After that, Space/Enter (the handler, or the আরেকবার button focused at 600 ms) starts the next race. Drum beats are 1.6–2.2 s apart.
- **Friend's link:** `readFriend` during a race or তাল মেলাও only remembers the friend. Otherwise their river waits on the ready screen. `start()` reuses the waiting race when its `t` is 0 and the race number matches. `seedFor()` gives their river only when the race number is theirs.
- **Not modelled:** the 0.8 s resume grace, the 2.6 s settle of the other boats, lag values and stars (no rule needs them; `recordLevel` keeps the max).

## Rules (plain words)
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | If the tab hides mid-race, the race is paused. | holds |
| PausedWhenBlurred | If you click into another window mid-race, the race is paused. | **breaks** |
| PausedWhenScrolledAway | The race never runs while the river is scrolled out of view. | **breaks** |
| CalibWaitsWhileAway | তাল মেলাও never runs while you're in another window or the river is out of view. | **breaks** |
| LoopOnlyWhenMeaningful | The river rush plays only during a race with sound on. | holds |
| LoopComesBack | During a race with sound on, the rush is playing (also after sound comes back on, and after resume). | holds |
| ResultStaysABeat | One more drum tap right after the finish never skips your result. | **breaks** |
| ReplayIsExact | After you open a friend's link, the next race you start is their river. | **breaks** |

## Bugs
### 1. PausedWhenBlurred (shared cause: no blur handling)
- **Player's sentence:** "I clicked another window for a second and my boat kept rowing. The others passed me while I wasn't there."
- **Path:** 0 ready → 1 you tap শুরু করো → 2 you click into another window (still racing, rush on).
- **Live replay (Orca):** started with a trusted click: `t = 0.25 s`, `y = 16`. I dispatched `blur` (`document.hasFocus()` was already false). 3 s later: phase `playing`, `t = 0.65`, `y = 71`. 6 s later: `t = 1.35`, `y = 184`. My background tab ran at about 2 fps, so time was slow, but it never stopped.
- **Fix:** shared away handling: blur pauses a real-time game. Here, `pause()` on `window` blur, the same as hide (the phase effect already stops the rush).

### 2. PausedWhenScrolledAway (game-specific)
- **Player's sentence:** "I scrolled down to look at সব বাইচ and pressed চালিয়ে যাও on the bar. The race ran off-screen." Or: "I tapped the drum pad with the river scrolled up, and the race started where I couldn't see it."
- **Path (report):** 0 ready → 1 you scroll the river away → 2 you tap the drum (racing, river off-screen). The other path: racing → scroll away (pauses, which holds) → the bar's চালিয়ে যাও.
- **Live replay (Orca):** at 55 of 623 px of river visible, scrolling mid-race paused at `t = 22.02` (correct). A trusted click on the bar's চালিয়ে যাও gave `playing`. Real time: `t 22.02 → 22.28`; stepping the real `step()` for 3 s: `t → 29.70`, `y 3516 → 4678`, river still off-screen. Pad start: on the ready screen with 55 px visible, I clicked the drum pad (`ঢোলের তালে চাপো`) → `playing`, and after 4 s of steps `t = 4.23`, `y = 660`.
- **Fix:** in `start()` and `resume()`, refuse (or scroll the river into view first) when `!stageInView`. Or re-run the in-view check after the phase becomes `playing`. The pads and the bar button go through those two functions.

### 3. CalibWaitsWhileAway (game-specific)
- **Player's sentence:** "I started তাল মেলাও and scrolled a little. The beats played on their own, my taps didn't count, and it said 'ঠিকমতো ধরা গেল না'."
- **Path:** 0 ready → 1 you press তাল মেলাও → 2 you scroll the river away (still calibrating).
- **Live replay (Orca):** I started তাল মেলাও and scrolled to 55 px visible. A trusted Space was ignored (the keyboard needs the river in view). After 3 s, calibration was at `t = 3.72`, `taps = 0`. After 6 more seconds it ended by itself: phase `ready`, note "ঠিকমতো ধরা গেল না। আরেকবার চেষ্টা করো…". A blur behaves the same, because nothing listens for it.
- **Fix:** while calibrating, a blur, a hide or scrolling away should cancel (`endCalib(true)`) or restart the eight pulses, and say so.

### 4. ResultStaysABeat (game-specific)
- **Player's sentence:** "I crossed the line still drumming on Space. My next tap started the next race, and my time and stars vanished before I saw them."
- **Path:** 0 ready → 1 start → 2 you cross the finish rope → 3 time passes on the result (past 450 ms, inside one beat) → 4 you tap Space for one more beat (racing again; the result and card are gone).
- **Live replay (Orca):** finished race 1 in ৫৫.৯ সেকেন্ড, ১ম, ★★★, "এই ফোনে নতুন রেকর্ড!". At 1.85 s after the finish (focus already on পরের বাইচ), a trusted Space gave `playing`, race 2, `t = 0.38`. The result panel and card were gone.
- **Fix:** keep the restart guard for at least one beat plus a little (for example, 2.5 s for keys). Move focus to পরের বাইচ only after that guard. Ignore repeat and drum keys (ArrowUp, W) on the result. Pointer taps are already safe, because the pad is unmounted.

### 5. ReplayIsExact (game-specific)
- **Player's sentence:** "I opened Mim's link while তাল মেলাও was running. The banner said 'একই নদী', but the race I rowed wasn't Mim's river."
- **Path:** 0 ready → 1 you press তাল মেলাও → 2 a friend's link opens (only remembered) → 3 তাল মেলাও ends → 4 you tap শুরু করো (your old river). The same thing happens after a link opens mid-race: পরের বাইচ goes to a race number that isn't theirs.
- **Live replay (Orca):** the ready screen had seed 617558211, race 2. I started তাল মেলাও and set the hash to `s=424242&t=500&r=2&l=2&n=Mim`. The banner read "Mim ৫০.০ সেকেন্ডে ২য় হয়েছে। একই নদী, এবার তোমার পালা।" and the pill read "Mim ৫০.০". After বাদ দাও, the ready seed was still 617558211. After শুরু করো, the race seed was 617558211 (not 424242). See `.shots/baicher-nouka-racing.png`.
- **Fix:** when a link arrives mid-race or mid-তাল মেলাও, set a `pendingFriend` flag. On `endCalib` or after the finish, call `ready(friend.level)` with their seed. In `start()`, compare seeds as well as race numbers before reusing the waiting race.

## Quality-bar gaps (two races played in Orca: race 1 with no taps, race 2 with every beat)
1. **Race 1 needs no skill:** a boat that never tapped (0 of 28 beats, 3 patches hit) finished ১ম in 55.9 s for ★★★. Race 2 with every beat took 42.6 s. The first win takes about 45 s, not 10.
2. **Pause isn't a menu:** থামাও/P/Esc and a hidden tab work, but blur doesn't. The cover has only চালিয়ে যাও (no নতুন করে শুরু, কীভাবে খেলবে, শব্দ, সব বাইচ).
3. **Labels cover the play area:** "এখন চাপো!" sits on your boat, and the chant line sits over the top-centre of the river.
4. **Pacing:** 12 races change only the rivals' speed. No new element per race (current, narrower lanes, a boss boat), no named final race, and no music beyond the drum.
5. **No edge danger cue** for a patch ahead or a rival closing in. You see it only on the water.
6. **Phone layout:** on 412 px the stars, stats and পরের বাইচ sit below the river, at the fold (`.shots/baicher-nouka-result-phone.png`). The start button is a plain button on a dark card, not the drum art (`.shots/baicher-nouka-ready-phone.png`).
7. **The result can be skipped by accident** (bug 4), and the friend banner can claim the wrong river (bug 5).
8. **What's good:** 6 synthesized sounds plus the rush loop, which comes back after sound on and after resume. Real end stats (beats caught, patches), lag calibration, and a seeded, replayable river.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/baicher-nouka/BaicherNouka.tla --view ai_docs/statecharts/baicher-nouka/view.ts --out ai_docs/statecharts/baicher-nouka/after-fix
```
The chart hides no steps. Keep the model under 500 states, or the chart only draws bug paths.
