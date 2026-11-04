# পাটি বুনি: statechart (before the rewrite)

Spec `PatiBuni.tla`, config `PatiBuni.cfg` and view `view.ts`, mirrored from `tools/pati-buni/components/pati-game.tsx` and `shared/game-kit.ts` (`useGameLoop`). Results are in `before-fix/report.md` and `before-fix/chart.mmd`: 142 states, 17 chart states, 51 arrows.

**Result: 5 rules held and 3 broke. All 3 bugs reproduced live in Orca.**

## Systems modelled
- **Play phase:** ready → playing → paused → over. After `resume()` comes a 600 ms breath and after `restart()` a 350 ms one (`live.hold`), and nothing falls during it.
- **Tab, window and scroll:**
  - `hide` on `visibilitychange` runs `pause()`.
  - The `boardInView` effect runs `pause()`, but **only when `boardInView` changes**.
  - The game has **no blur listener**.
- **Input:** a pointer holding ◀ or ▶ (`live.repeatDir`), and a pointer or key holding নামাও or ↓ (`live.soft`). A release only reaches the page while it has focus. The arrow keys use the keyboard's own repeat and hold nothing.
- **The stack:** each strip that lands either weaves a row or adds one. When the frame is full, `finish()` runs.
- **Links:** a friend's link loads the friend's seed. আরেকবার and আরেকবার খেলো reuse it.

The stack height is abstracted to 0 to 2, full at 2; the real frame has 14 rows. The model leaves out scoring, speed stages, the hard-drop tap timing and the 700 ms restart guard. The game has no sound loops, so no sound system is modelled.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-game pauses it. | holds |
| PausedWhenBlurred | Strips fall only while you're on the page to steer them. | **breaks** |
| PausedWhenScrolledAway | Strips never fall while the frame is scrolled off screen. This is the code's own stated intent. | **breaks** |
| InputReleasedWhenAway | After blur or hide, no control counts as held. | **breaks** |
| NoHoldOffThePlay | No control counts as held on the start card, the pause card or the result. | holds |
| ResultMatchesPlay | The result shows exactly when the frame is full. | holds |
| ReplayIsExact | After a friend's link, every replay deals the friend's bundle. Without a link, you get your own. | holds |
| NoDeadlock | There's always a next step. | holds |

## Bugs

### 1. PausedWhenBlurred: strips keep falling in another window (shared)
- **What the player sees:** "I clicked into another window and the strips kept falling. The frame filled up without me."
- **Path:**
  0. The start card shows.
  1. You press শুরু করো.
  2. You click into another window.
- **Live replay (Orca):** read through the game ref. Press শুরু করো, then window `blur` at t = 19.9 s. At t = 28.2 s the phase is still `playing`, a strip has landed (`pieces` 0 → 1) and a row has been woven (`rows` 1).
- **Fix:** window `blur` → `pause()`. That's the shared away-handler, the same one shobdo-khoja and carrom need.

### 2. InputReleasedWhenAway: a held control keeps acting after you leave (shared)
- **What the player sees:** "I held ◀ (or নামাও) and clicked away. The strip kept sliding into the wall, or slamming down one strip after another, while I was gone."
- **Path:**
  0. The start card shows.
  1. You press শুরু করো.
  2. You hold a control.
  3. You click into another window.
- **Live replay (Orca):**
  - Pointer down on ◀: `repeatDir` is −1 and the strip is at x = 1.
  - Window `blur`: the strip reaches x = 0 and falls from y = 2 to y = 6 in 3 s. `repeatDir` stays −1.
  - Back on the page, let go of ◀, then hold নামাও and blur again: `soft` stays true, and `pieces` goes from 2 to 8 in 4 s away.
- **Fix:** on `blur`, call `letGo()` as well as `pause()`. This is the same release that `pause()` already does on hide.

### 3. PausedWhenScrolledAway: a new game plays off screen (game)
- **What the player sees:** "On the result I'd scrolled down so only the bottom of the frame showed. I pressed আরেকবার and the new game started where I couldn't see the falling strip."
- **Path (the model's shortest):**
  0. The start card shows.
  1. You press শুরু করো.
  2. You scroll past the board: it pauses.
  3. You press চালিয়ে যাও, using the top bar's ▶ button, which stays on screen when the frame is below the fold, for example on a phone in landscape.

  The pause effect has already fired once and doesn't fire again, so play starts with the frame off screen.
- **Live replay (Orca):** the restart variant of the same root cause, because the desktop pane is too tall to push the frame below the fold.
  - Space hard drops until the frame is full: the slip reads "আর জায়গা নেই!".
  - Scroll until only the bottom 10% of the frame shows. `useInView` has a 15% threshold, so the frame now counts as out of view, while আরেকবার is still on screen.
  - Press আরেকবার: the phase is `playing` with the frame at 10%.
  - 8 s later a strip has landed and the score shows ১০, while the frame is still at 10%.
- **Fix:**
  - In `resume()` and `restart()`, either refuse to unpause while `!boardInView`, or scroll the frame into view first, as `playFromCard()` already does.
  - Or make the effect `useEffect(() => { if (!boardInView) pause(); }, [boardInView, phase])`, so going back to playing off screen pauses again at once.

## Quality-bar gaps (played end to end in Orca, with screenshots from headless Chrome)
1. **Danger:** nothing warns you when the stack nears the top. The bar asks for an edge glow or vignette, with a static border in slow mode. The game just ends on "আর জায়গা নেই!".
2. **Pause:**
   - Blur doesn't pause (bug 1).
   - The pause is an overlay with one button, not a menu with নতুন করে শুরু, কীভাবে খেলবে, শব্দ and ধীরে খেলো.
   - Enter pauses and P or Esc toggle, but nothing on screen says so.
3. **Pacing:** the only new thing as you go is speed. The named mats (ছোট আসন …) are a nice goal beside the frame. No new element arrives per stage, and there's no finale.
4. **ধীরে খেলো:** on a phone it's an icon-only snail with the text hidden. It doesn't say what it changes. The bar asks for one line saying what each choice does.
5. **First screen:** the H1 and lead sit above the HUD and frame. The শুরু করো card is big and clear, and the opening board is pre-filled so the first row comes quickly, which is good.
6. **Friend's bundle:** once a friend's link has opened, every আরেকবার deals the friend's bundle until you reload without the hash. Nothing offers a fresh bundle. This is a design choice, but say it on the card ("বন্ধুর গোছায় আবার").
7. **Sound:** rustle, nudge, knock, creak, সরসর for a woven row, plonk, a rising combo, and win/lose. There's no music, on purpose; the bar would welcome a small stage loop. Every sound meaning is also visible.
8. **Ending:** this meets the bar. The slip shows the score, rows, the near line and the best on this phone. The card draws the woven mat, and the link deals the same bundle.

Screenshots:
- `.shots/pati-buni-first.png`: the start card, with the controls in view at 390 × 844.
- `.shots/pati-buni-play.png`: play with the next bundle and the goal beside the frame.
- `.shots/pati-buni-result.png`: the "আর জায়গা নেই!" slip and the card below it.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/pati-buni/PatiBuni.tla --view ai_docs/statecharts/pati-buni/view.ts --out ai_docs/statecharts/pati-buni/after-fix
rm ai_docs/statecharts/pati-buni/after-fix/tlc.out
```
Before re-running, update the spec to match the fixed code. `WindowBlurs` should pause and let go, and `YouResume` and `YouPlayAgain` should stay paused or bring the frame back into view.
