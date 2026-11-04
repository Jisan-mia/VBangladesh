# আঁটি থেকে আম statechart (before the rewrite)

Spec: `AtirAam.tla` / `AtirAam.cfg` / `view.ts`, mirrored from `tools/atir-aam/components/mango-game.tsx` and `tools/atir-aam/lib/game.ts`. Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 262 states. The chart draws 21 states and 35 arrows. It hides one step, "you start a fresh plot" (আরেকবার, আবার খেলো, পরের লেভেল, the mode buttons, the level arrows or list, a friend's link), because that step resets from every state.

## Systems modelled
- **Run phase:** fresh plot → swiping → paused (tab hidden after the first move) → run over and card. A run ends when the plot is full, the level's goal is reached, the level runs out of moves, or you press এখানেই থামো.
- **The board, by its top stage:** below পাকা আম, or পাকা আম on the board. পাকা আম (TOP − 2) is the first stage that sets off `sfx.levelUp()` and confetti while it beats this phone's best stage.
- **ফেরত নাও (undo):** one step back, and what it would restore.
- **Timers:** the new-stage toast (fades after 1.7 s) and the 200 ms levelUp + confetti timer. `begin()` clears them; `takeBack()` doesn't.
- **Pause:** `visibilitychange` pauses once a move is made. Swipes, keys and the pad are ignored while paused.
- **Saved progress:** the `[game]` effect saves once per Game object (`finished.current`).

Not modelled:
- **Window focus and held input.** The game is turn-based and nothing moves unless you swipe. A press is read only on `pointerup`, and every `pointerdown` replaces it.
- **Sound loops.** There are none.
- **Star values.** `recordLevel` keeps the higher, unit-tested in shared tests.
- **ReplayIsExact.** `replay()` re-plays every move of a link and rejects one that doesn't move or doesn't reach the goal (`tools/atir-aam/tests`).

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-run pauses it. | holds (checked live) |
| CheerOncePerRun | The পাকা আম confetti comes once a run. | **breaks** |
| CelebrationMatchesBoard | The "new stage" banner and the confetti only celebrate a stage that's on the board. | **breaks** |
| NoDoubleResult | A run is saved once. | holds |

## Bugs
### 1. CheerOncePerRun: game-specific
- **The player's version:** "I took my move back and made it again, and the confetti and the fanfare went off a second time, then a third."
- **Path:** grow a পাকা আম → the confetti falls → ফেরত নাও → grow it again (4 steps).
- **Why:** `go()` celebrates when `next.top > current.top` and `next.top > bestStage`. `bestStage` is saved only when the run ends, and undo puts `current.top` back down, so every redo counts as new.
- **Live replay (Orca):** free garden, seed 12345, loaded fresh through a one-move friend link (`#s=12345&t=0&c=1&m=A`). 68 look-ahead-bot moves were sent as arrow keys: 445 points, top stage 6, confetti 0. Then:
  - ← grows পাকা আম: 545 points, top 7, **confetti 1**.
  - `u`: 445, top 6.
  - ← again: 545, top 7, **confetti 2**.
  - Later in the session, **confetti 3**.
  - The confetti count is the full-screen confetti `<canvas>` elements added to `body`.
- **Fix:** celebrate a stage once per run. Keep `celebrated = max top this run` in a ref that undo doesn't lower, or compare against `max(bestStage, runBest)`.

### 2. CelebrationMatchesBoard: game-specific
- **The player's version:** "I took the move back, and the banner still said a পাকা আম had landed, then confetti fell on a board without one."
- **Path:** grow a পাকা আম → ফেরত নাও (2 steps).
- **Why:** `takeBack()` doesn't clear the timers (`later(120, grow)`, `later(200, levelUp + confetti)`, `later(1700, hide toast)`) or the toast.
- **Live replay (Orca):** same session.
  - ← grows পাকা আম: 545 points, top 7, toast "পাকা আম নামল। জ্যৈষ্ঠের দুপুর জমে গেল।".
  - `u` 50 ms later: 445 points, **top 6**, toast still showing.
  - +0.5 s: confetti count 2 → **3**, top 6, toast still "পাকা আম নামল…".
  - In the earlier undo (100 ms after the grow), the toast also stayed with top 6 until it timed out.
- **Fix:** in `takeBack()`, `clearTimers()` and `setToast(null)`. Add a node or DOM test: grow → undo → no confetti and no toast.

### Rules that hold, checked live
- **PausedWhenHidden** (headless Chrome, because Orca pins `document.hidden`, see `konta-nei/README.md`): after two swipes (2 points), hiding the tab showed the overlay and disabled the pad. A → while hidden did nothing (still 2). Show, then Enter: unpaused.
- **NoDoubleResult / ResultMatchesPlay:** level 1 cleared in 2 moves showed ★★★ and saved `ektukhani-levels-atir-aam` = `{"1":3}`.

## Quality-bar gaps (a free run to the end, plus level 1, in Orca)
1. **No pause menu.** There's no pause button, P or Esc, and the hide-pause note is the only menu. For a turn-based game that matters less, but the bar still wants চালিয়ে যাও / নতুন করে শুরু / কীভাবে খেলবে / শব্দ / ধীরে খেলো / সব লেভেল in one place.
2. **Mode and level switches drop a run without asking.** খোলা খেলা / লেভেল, the ‹ › arrows and the level list call `begin()` straight away. A 400-move garden is gone with one tap.
3. **Undo is a free reroll of celebrations** (bugs 1 and 2). Undo also has no limit beyond "one in a row": you can undo every other move forever, which the stars don't account for in the free garden.
4. **The first screen** is the board with two আঁটি and a one-line hint. That's good, but the mode toggle and the 9-stage road sit above the board, and the lead text is above the play area.
5. **Danger doesn't show at the edges.** As the plot fills there's no edge cue. "জায়গা শেষ" arrives with no warning, and in level mode the চাল count turns no colour near the limit.
6. **The end of the free garden is flat.** Reaching পাকা আম and then filling up gives ★ "জায়গা শেষ · পাকা আম", 816 points. Nothing marks the run's best moment or how close the next stage was, beyond one line ("আর একটা পাকা আম হলেই আমের ঝুড়ি।").
7. **Sound:** rustle, combo notes, the grow chord, a thump and levelUp, but no music. The grow chord also fires again on redo.
8. **Pacing in level mode:** the targets climb one stage every 1–2 levels across 24 levels, with stones (9–16) and a 5×5 plot (17–24) as the only new ideas. There's no named finale at 8, 16 or 24.

Screenshots: `.shots/atir-aam-first-screen.png` (phone, fresh garden), `.shots/atir-aam-undone-toast.png` (two কাঁচা আম after the undo), `.shots/atir-aam-free-over.png` (the end of the free run), `.shots/atir-aam-level-over.png` (level 1 cleared).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/atir-aam/AtirAam.tla --view ai_docs/statecharts/atir-aam/view.ts --out ai_docs/statecharts/atir-aam/<new-folder>
rm ai_docs/statecharts/atir-aam/<new-folder>/tlc*.out
```
