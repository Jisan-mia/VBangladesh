# পিয়নের সাইকেল: statechart (before the rewrite)

Model: `Cycle.tla`, `Cycle.cfg` and `view.ts`. These mirror `tools/peoner-cycle/components/cycle-game.tsx` as it was on `games-to-the-bar` (commit a5fb4f1).
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC checked 392 states. The chart draws 20 states and 54 arrows.

## Systems modelled
- **Play phase:** ready → playing → paused → over (the bump). Also `start()`, `pause()`, `resume()` (with its 0.6 s grace) and `restart()`.
- **Pause and focus:** the window is on the page, another window has focus, or the tab is hidden. Only `visibilitychange` pauses (line 181). There is no blur listener.
- **Scrolling:** `useInView(stage)` → `pause()`, but only on a change (line 191).
- **Time:** `stepRun()` rolls the road on every frame while playing and the tab shows. To stay under the 500-state chart budget, NoProgressWhileAway is written on the state ("the road can roll here while you're away") rather than with a history variable.
- **Choices:** the সব রুট `<details>`, `pickRoute()` from the list, পরের রুট, আবার খেলো / আরেকবার, and আরেকবার খেলো on the card (`playFromCard`).
- **Timers:** the star chimes and the sfx.good / win and confetti that `finish()` queues. `start()` clears them. `pickRoute()`, `playFromCard()` and `readFriend()` don't.
- **Links and the card:** a friend's link (on load or by hashchange). `lvl` is the route on screen (label, goal line, star marks). `rode` is the route whose road you're riding. `card` is the road the result card came from.
- **Not modelled:** held input (lanes change one tap at a time) and sound loops (none). Stars and migration are covered by `tests/ride.test.ts`.

## Rules (plain words)
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-ride pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-ride pauses it. | **breaks** |
| NoProgressWhileAway | The road never rolls while you're in another window. | **breaks** |
| PausedWhenOffScreen | The road never rolls while it's scrolled off screen. | **breaks** |
| ChoiceFreezesPlay | While the সব রুট list is open, the road doesn't roll. | **breaks** |
| NoFanfareAfterMovingOn | The star chimes and the cheer only play while the bump result shows. | **breaks** |
| RouteMatchesRide | While you ride, the route on screen (and the stars you earn) is the route you're riding. | **breaks** |
| CompareOnlySameRoad | The result card compares you with a friend only when you rode the friend's road. | **breaks** |
| NoDeadlock | Every state has a way out. | holds |

## Bugs
### 1. PausedWhenBlurred and NoProgressWhileAway (shared)
- **Player's sentence:** "I clicked into another window and my পিয়ন rode straight into the mud."
- **Path:** (0) ready → (1) you tap the road → (2) you click into another window, still riding.
- **Live replay (Orca):** শুরু করো, then `blur`. 2.6 s later the ride had gone 3 → 26 m and bumped ("ছপাৎ! কাদায় চাকা পিছলে গেল।"), and the phase was `over`.
- **Fix:** add a `blur` listener that calls `pause()` (the 0.6 s resume grace already covers the return). This is the same shared hook as in the other games.

### 2. PausedWhenOffScreen (game)
- **Player's sentence:** "I scrolled a little, tapped বাঁয়ে, and the ride started where I couldn't see the road."
- **Path:** (0) ready → (1) you scroll the road away → (2) you tap a lane button. The lane pad sits below the road, so it is still on screen.
- **Live replay:** I scrolled until 6% of the road showed. The বাঁয়ে button was fully visible at y=48. One pointerdown on it set the phase to `playing`. 3.0 s later the ride had bumped at 26 m, unseen. আবার খেলো under the bump does the same, since it doesn't scroll.
- **Fix:** `side()` and `start()` should not start while `!stageInView`. Scroll the road into view and wait instead, or include `stageInView` in the loop's `running`.

### 3. ChoiceFreezesPlay (shared)
- **Player's sentence:** "I opened সব রুট to see the next route and crashed while reading it."
- **Path:** (0) ready → (1) you open সব রুট → (2) you tap the road, and the ride runs with the list open.
- **Live replay:** mid-ride, with the list open (`open: true`) and the road still on screen: 2.5 s later the ride had bumped at 26 m.
- **Fix:** pause when the `<details>` opens, or move the route grid into a pause menu.

### 4. NoFanfareAfterMovingOn (shared pattern)
- **Player's sentence:** "I pressed পরের রুট straight after the bump and heard the star chimes on the next route's start screen."
- **Path:** (0) ready → (1) you tap the road → (2) you bump past a star mark (chimes queued at 0.30 s, 0.58 s, …) → (3) you press পরের রুট, with chimes still to come on the ready screen. আরেকবার খেলো on the card and a friend's link do the same.
- **Live replay:** the ride was moved on to 330 m, then bumped at t=5076 ms with 2 stars (382 m on route 3). পরের রুট was pressed at 5332 ms, and the phase became `ready` with the label "রুট ৪ · খেয়াঘাট". Oscillators then started at 5362, 5642 and 5922 ms (×2): both star chimes and sfx.good, all on route 4's start screen.
- **Fix:** clear `timers.current` in `pickRoute()`, `playFromCard()` and `readFriend()`, or use one shared `useTimers()` that every reset clears.

### 5. RouteMatchesRide (game)
- **Player's sentence:** "A friend's link opened while I was riding route 1. The label jumped to route 2, and I got route 2's star (and route 3 opened) without riding route 2's road."
- **Path:** (0) ready → (1) you tap the road → (2) a friend's link opens, and the label shows the friend's route while you ride another.
- **Live replay:** I was riding route 1 (seed 676121069, `boost` 0) when `location.hash` was set to a route-2 link (`s=12345&t=300&m=300&c=0&l=2&n=Rafi`). The label became "রুট ২ · হাটখোলা" on the same run, with the same seed and boost 0. I moved the ride on to 125 m, which is past route 2's 120 m goal and still route 1's road. Stored levels went `null` → `{"2":1}`, and the bump said "হাটখোলার চিঠি পৌঁছে গেছে।"
- **Fix:** in `readFriend()`, don't call `choose()` while playing or paused (keep the friend for after the ride, as চড়ুই তাড়াও does). Also keep the route on the run (a `rideLevel` ref set in `start()`; `Run` has no level field today), and have `step()` and `finish()` use it, not the `level` state.

### 6. CompareOnlySameRoad (game)
- **Player's sentence:** "I opened Rafi's route-2 link, rode route 1 instead, and the card told me Rafi was 274 ahead 'on the same road'."
- **Path (the report's shortest):** (0) ready → (1) you tap the road → (2) you bump → (3) a friend's link opens, and the card now compares with a different road. The common path is: link opens → you pick another route → you ride → you bump.
- **Live replay:** I opened `#s=12345&t=300&m=300&c=0&l=2&n=Rafi` and picked route 1 from সব রুট. The ride had seed 77341388 (Rafi's is 12345) and bumped at 26 m. The bump panel correctly showed no versus line. The card head said "Rafi এবার ২৭৪ এগিয়ে। একই রাস্তায় আরেকবার?"
- **Fix:** line 355 should use `rival && rival.seed === card.seed` (as হাঁড়িভাঙা and চড়ুই তাড়াও do), not `friend`.

## Quality-bar gaps (played once end to end, Pixel 9, a lane-picking autopilot)
1. **First screen:** "বাঁয়ে-ডানে চাপো" plus a plain শুরু করো panel over the road. The পিয়ন on the bike isn't the start, and there is no difficulty choice beyond ধীরে খেলো.
2. **Banners over the play area:** "১০০ মিটার!" and "টানা N চিঠি" appear in the middle of the road during the ride. The bar says no label over the play area during play.
3. **Pause is not a real menu:** one চালিয়ে যাও button. It doesn't pause on blur or when the list opens.
4. **Danger:** a cow or cart coming in your lane has no edge cue. The only warning is seeing it.
5. **Level design:** routes differ by speed boost, goal and star marks. Cows, carts, goats and puddles all appear from route 1. There is no new idea per route and no named final route moment.
6. **Ending:** good. A bump line in words, stars, an exact near-miss in metres and পরের রুট pre-focused after 600 ms. But the card's compare line can be wrong (bug 6).
7. **HUD:** letters top-left, score top-centre and metres top-right. This meets the bar.
8. **Sound:** the ক্রিং-ক্রিং bell is a strong signature, with letter, splash, thud and star chimes. No route tune.

Screenshots: `.shots/peoner-cycle-sc-ready.png` (start screen), `.shots/peoner-cycle-sc-ride.png` (mid-ride with the "১০০ মিটার!" banner over the road), `.shots/peoner-cycle-sc-over.png` (bump, 426 m).

Testing note: another agent's tab on the same origin cleared `localStorage` during the run (route 2–3 stars and other games' keys vanished between rides). `record()` merges with what is stored, so this was not this game's bug.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/peoner-cycle/Cycle.tla --view ai_docs/statecharts/peoner-cycle/view.ts --out ai_docs/statecharts/peoner-cycle/after-fix
```
