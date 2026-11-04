# জ্যাম ছাড়াও: statechart (before the rewrite)

Model: `Jam.tla`, `Jam.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/jam-chharao/components/jam-game.tsx`, `tools/jam-chharao/lib/game.ts`, `tools/jam-chharao/lib/link.ts`.

TLC: 141 states. 3 rules break and 7 hold (counting NoDeadlock).

## Systems modelled
This is a turn-based puzzle with no clock and no sound loop, so NoProgressWhileAway, PausedWhenBlurred and the loop rules don't apply.
- **Play phase:** a fresh jam → moves made (cut to 0–2, where the third move always frees the CNG) → won. `paused` is a separate flag that only the hidden tab sets.
- **Pause and focus:** the tab is visible or hidden, and the window is focused or blurred. Blur has no listener.
- **Input:** a drag in flight (`drag.current`), released by pointerup or pointercancel. The arrow buttons and keys, the hint and ফিরিয়ে আনো (button, Z, Backspace) are discrete actions.
- **Time:** the horn, the star chimes and the fanfare timers after a win (`timers.current`), cleared by `goTo()`.
- **Choices:** আরেকবার, পরের জ্যাম, আবার শুরু, ‹ ›, সব জ্যাম, Enter on the win, and a friend's link. All of them call `goTo()`.
- **Results and saved progress:** the win effect runs once per game (`finished.current`). The stars on the result and the saved stars are modelled as `stars` and `saved`.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After a blur or a hidden tab, no car stays grabbed. | **breaks** |
| PausedWhenHidden | A started jam pauses when you hide the tab. | holds |
| NothingMovesWhilePaused (property) | While the pause screen shows, no move is made or taken back. | **breaks** |
| NoDropCountsWhilePaused (property) | A drag that began before the pause doesn't land as a move behind the pause screen. | **breaks** |
| NoDoubleResult | A win is recorded once. | holds |
| NoChimeAfterMovingOn | The star chimes and the fanfare never play after you leave the win. | holds |
| ResultMatchesPlay | The stars on the result are the ones saved, or fewer than an earlier best. | holds |
| StarsNeverDrop (property) | Saved stars only go up (`recordLevel` and `recordWin` keep the better one). | holds |
| ReplayIsExact | A friend's link replays its moves from the start and opens that jam. A link that doesn't free the CNG, or claims more hints than moves, is refused. | checked live, not modelled |

## Bugs

### 1. InputReleasedWhenAway: "I was dragging the bus, clicked into another window, and when I came back the bus was still stuck to my pointer."
- **Path:** 0 fresh jam → 1 you press on a car → 2 you click into another window. The drag is still held.
- **Code:** there's no blur or visibilitychange handling for `drag.current`. Only pointerup and pointercancel clear it.
- **Live replay (Orca, tab 51b5cc96):** pointerdown on the bus (car 1, row 1). After `blur`: `drag {car: 1}` is still set. Then focus, pointermove to column 3, pointerup → moves 0 → 1, pos `5030 → 5230`. The drag carried across the blur and counted.
- **Fix:** on blur and hide, set `drag.current = null` and `kick()` (the car glides back to its cell). **Shared:** vo-katta clears its input on blur, but bhangti-nai has no blur handling at all. Use one kit "away" hook.

### 2. NothingMovesWhilePaused: "The game said 'থেমে আছে', but ফিরিয়ে আনো still worked and took my moves back behind the pause screen."
- **Path:** 0 → 1 you slide a car → 2 you hide the tab (paused) → 3 the tab shows again → 4 you press ফিরিয়ে আনো. The move count drops while paused.
- **Code:** `takeBack()` checks `moves.length` and `won`, not `paused`. The ফিরিয়ে আনো button (`disabled={!game.moves.length}`), Z and Backspace all stay live, and the overlay covers only the board.
- **Live replay:** after one move (moves 1, pos `5230`), `setPaused(true)`, which is the only thing the visibilitychange handler does. Orca pins `document.hidden` to a native `false` getter, so the handler can't run itself, and the same setter was called through React's hook queue. Overlay up, ফিরিয়ে আনো enabled, click → moves 0, pos `5030`, overlay still up.
- **Fix:** guard `takeBack` (and `goTo` from আবার শুরু if you want) with `paused`, and disable the tools row while paused. Or cover the whole control area with the overlay.

### 3. NoDropCountsWhilePaused: "I was holding a car when I switched tabs. Back on the page with the pause screen up, I let go, and it counted as a move."
- **Path:** 0 → 1 you slide a car → 2 you press on a car → 3 you hide the tab (paused, drag kept) → 4 the tab shows again → 5 you lift your finger. A move is counted while paused.
- **Code:** `onPointerDown` refuses while paused, but `onPointerMove` and `onPointerUp` don't check `paused`. They play `slide(...)` and the move counts.
- **Live replay:** resume, pointerdown on the bus, `setPaused(true)` (as above): overlay up with `drag {car: 1}`. Then pointermove and pointerup at column 3 → moves 0 → 1, pos `5030 → 5230`, overlay still up. Screenshot: `.shots/jam-chharao-move-behind-pause.png` shows চাল ১ and the bus moved behind "থেমে আছে".
- **Fix:** release the drag on hide and blur (bug 1's fix), and ignore move and up events while paused. **Game-specific**, though "pause blocks every input, not just the first one" is a shared check.

## Quality-bar gaps (played in Orca: jam 1 solved in 3 moves for ★★★, plus friend links)
1. **There's no pause.** No button, no P, and Esc only deselects. The pause screen appears only on a hidden tab, and then it doesn't block the tools under the board (bug 2).
2. **Pacing:** all five vehicle kinds and both directions appear in jam 1, and every jam after that only adds moves (3 → 40). Nothing new is introduced one at a time. Name the stages (গলি → বড় রাস্তা → মোড়), each with one new rule or piece (a bus, a blocked exit, a one-way lane), and put a named "boss" jam at the end of each.
3. **Choices:** পরের জ্যাম gives no hint of what's new. The সব জ্যাম grid lives in `<details>` below the board. The hint (সমাধান দেখাও) caps the result at 1★, but the button doesn't say so until after you win.
4. **First screen:** the board is the action, which is right for a puzzle. But the status line is a long two-clause sentence ("★ দেওয়া সবুজ CNG তোমার। গাড়ি টেনে সরাও, নয়তো…"), not one line, and there's no animated first-move demo.
5. **Sound:** good (CNG putt, horn, drop, blocked buzz, star chimes). But the SoundToggle is rendered only outside the win branch, so you can't mute during the horn, the putt and the fanfare on the win screen.
6. **Ending:** good. It shows the moves, the stars, a near line with the exact gap, a compare line for a friend's jam and a card. Links are proven by replay. Checked live: `#l=1&m=l90&n=রাফি` shows "রাফি ১ নম্বর জ্যাম ৩ চালে ছাড়িয়েছে (সেরা ৩)". `m=l9` (the CNG never gets out), `l=3&m=l90` (wrong jam) and `h=9` (more hints than moves) are refused and fall back to the unlocked jam.
7. **HUD:** the move count sits top right in a dark badge, and the jam number and best are top centre. The middle stays clear. Fine.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/jam-chharao/Jam.tla --view ai_docs/statecharts/jam-chharao/view.ts --out ai_docs/statecharts/jam-chharao/<new-folder>
```
The chart hides "the touch is cancelled" and the chime timer. They stay in the model and the rule checks.
