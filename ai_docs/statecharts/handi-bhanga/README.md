# হাঁড়িভাঙা: statechart (before the rewrite)

Model: `Handi.tla`, `Handi.cfg` and `view.ts`. These mirror `tools/handi-bhanga/components/handi-game.tsx` as it was on `games-to-the-bar` (commit a5fb4f1).
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC checked 416 states. The chart draws 19 states and 38 arrows.

## Systems modelled
- **Play phase and ball:** ready → playing (ball on the stick, or in the air) → paused → over. Also `throwBall()`, `pause()`, `resume()` and `restart()`.
- **Pause and focus:** the window is on the page, another window has focus, or the tab is hidden. `visibilitychange` calls `letGo()` and `pause()`. `blur` only calls `letGo()` (lines 360–363).
- **Scrolling:** `useInView(board)` → `pause()` when the stall scrolls away (line 369). The effect fires only on a change.
- **Input:** held ← / → keys (`live.held`) and the finger or mouse drag on the stall (`live.gesture.id`). Keyup and pointerup are counted only while the page has focus.
- **Time:** the loop moves the ball while playing and the tab shows. `droppedAway` records a chance lost while another window had focus.
- **Choices:** the সব লেভেল `<details>`, picking a level, পরের লেভেল and আবার খেলো.
- **Timers:** the celebration `finish()` queues. `reset()` clears it on every path, so this rule holds here.
- **Not modelled:** the 700 ms `restartReady` guard and the 900 ms `settling` loop, both of which are correct. The friend's link is also left out: `readFriend()` resets to the ready screen in any phase, including mid-round, so opening a link in the same tab drops the round in play. That is unlike the other two games, which keep the round. No sound loops (one-shots only). Stars and migration are covered by `tests/handi.test.ts`.

## Rules (plain words)
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-round pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-round pauses it. | **breaks** |
| PausedWhenOffScreen | The ball never flies while the stall is off screen. | **breaks** |
| NoProgressWhileAway | You never lose a chance while you're in another window. | **breaks** |
| InputReleasedWhenAway | After you leave the window or the tab, no key, finger or mouse still counts as held. | **breaks** (the drag) |
| ChoiceFreezesPlay | While the সব লেভেল list is open, the ball doesn't move. | **breaks** |
| NoFanfareAfterMovingOn | The win cheer only plays while the result shows. | holds |
| NoDeadlock | Every state has a way out. | holds |

## Bugs
### 1. PausedWhenBlurred and NoProgressWhileAway (shared)
- **Player's sentence:** "I clicked into another window and lost a chance without seeing the ball fall."
- **Path:** (0) ready → (1) you press শুরু করো → (2) you click into another window, ball in the air → (3) the ball falls, a chance is lost.
- **Live replay (Orca):** `শুরু করো`, then `blur`. Within 2 s the phase was still `playing` and chances went 3 → 2. The hint now read "২টা চান্স বাকি".
- **Fix:** `blur` should call `pause()` as well as `letGo()` (line 363). Shared: one `usePauseWhenAway` in the kit.

### 2. PausedWhenOffScreen (game)
- **Player's sentence:** "I scrolled down a little, tapped the চাপো pad, and my ball flew and fell where I couldn't see it."
- **Path:** (0) ready → (1) you scroll the stall away → (2) you press the চাপো pad, and the ball flies with the stall off screen. আবার খেলো under the stall does the same, and so does a page that loads with its scroll restored.
- **Live replay:** I scrolled until 8% of the board showed. The pad was fully visible at y=53. A tap on the pad (pointerdown and pointerup on `.hb-pad`) set the phase to `playing` and the ball in the air. 4 s later it was still `playing`, chances had gone 3 → 2 and the score was 0. A second check: after a reload that restored the scroll (board top at −1667 px), শুরু করো played on. The in-view effect only reacts to a change, so a round that starts off screen is never paused.
- **Fix:** in `throwBall()` and `restart()`, refuse to start, or scroll the board into view first, when `!boardInView`. Or make the loop's `running` include `boardInView`.

### 3. InputReleasedWhenAway (game): the drag
- **Player's sentence:** "I was dragging the stick, switched windows, came back, and the stick followed my mouse with no button held."
- **Path:** (0) ready → (1) you press on the stall → (2) you hide the tab (or blur), and the drag still counts.
- **Live replay:** pointerdown at x+200, then a 30 px move: the stick went 180 → 212 and `gesture.id` became 1. A blur left `gesture.id` at 1 (the keys were cleared). Back on the page, a pointermove with `buttons: 0` moved the stick 212 → 94. This needs the pointerup to be lost (released outside the window, or a system dialog), so it is rarer than the others. The code has no guard for it.
- **Fix:** `letGo()` should also set `live.gesture.id = -1`, and `onPointerMove` should ignore moves where `event.buttons === 0` for a mouse.

### 4. ChoiceFreezesPlay (shared)
- **Player's sentence:** "I opened সব লেভেল mid-round and lost a ball while reading it."
- **Path:** (0) ready → (1) you open সব লেভেল → (2) you press শুরু করো, and the ball flies with the list open. The same happens if you open it mid-round.
- **Live replay:** mid-round, with the list open (`open: true`) and the board still on screen: after 4 s the phase was still `playing` and chances had gone 3 → 2.
- **Fix:** pause on the `<details>` opening, or move the grid into a pause menu.

## Quality-bar gaps (played once end to end, Pixel 9, a key-holding autopilot)
1. **First screen:** the start is a small শুরু করো in a note at the bottom of the stall. In a 625 px pane it sat below the fold, under the pots. The ball and লাঠি themselves aren't the start action, and there is no difficulty choice.
2. **Pacing at the end:** with a near-perfect bot, the last 5 pots took about 50 s (score 300 → 340). Clearing the last pots is a grind with nothing new. There is no magnet, no closing-in rope and no "শেষ হাঁড়ি" moment.
3. **Level design:** the levels add tough pots, rope sway and wind, which is good, one idea at a time. But there is no named final stall.
4. **Pause is not a real menu:** one চালিয়ে যাও button. It doesn't pause on blur or when the list opens.
5. **Danger:** the last chance shows only as text ("শেষ চান্স!"). There is no edge glow.
6. **HUD:** the score, chances and buttons sit in a strip above the board, outside the canvas, so the middle stays clear in play. The ready and result notes cover the pots.
7. **Ending:** good. "দোকান সাফ!", stars, an exact tally ("৩৫টার ৩৫টা, ৩ চান্সই বাকি") and the points.
8. **Sound:** a good set (swish, tock, ring, smash, combo). No tune.

Screenshots: `.shots/handi-bhanga-sc-ready.png` (ready screen; the start is below the visible pane), `.shots/handi-bhanga-sc-play.png` (mid-round), `.shots/handi-bhanga-sc-over.png` (stall cleared, 3 stars, 500 points).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/handi-bhanga/Handi.tla --view ai_docs/statecharts/handi-bhanga/view.ts --out ai_docs/statecharts/handi-bhanga/after-fix
```
