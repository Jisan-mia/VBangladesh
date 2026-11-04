# ভিমরুলের চাক: statechart (before the rewrite)

Model: `Orchard.tla`, `Orchard.cfg` and `view.ts`, mirrored from `tools/bhimruler-chak/components/orchard-game.tsx`, plus `shared/game-core.ts` (`recordLevel`, `unlockedLevel`) and `shared/game-kit.ts` (`useLevels`).
Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 356 states, and the chart draws 15 states and 32 arrows.

## Systems modelled
- **Round and clock.** The states are ready, a friend's board with the clock not started, playing with the clock running, paused, won and lost. The clock starts on the first move (`startClock`) and stops on the end or a pause.
- **Pause and focus.** The window can be on the page, blurred, or the tab hidden. `hide()` pauses only on `visibilitychange`. The component has no blur or focus listener.
- **Input.** The touch long press (the 420 ms timer in `onDown`) ties a গামছা. `onUp`, a finger move and `pointercancel` clear it, and `hide()` calls `cancelPress()`.
- **Choices.** `goLevel` is reached from LevelGrid, আবার খেলো, পরের লেভেল, আরেকবার and Enter.
- **Links.** A valid friend link to level 3 (read on load or on hashchange) lays the friend's board with their first cell open.
- **Saved progress.** `unl` is unlockedLevel and `c1` records whether level 1 has stars. Stars are recorded once per round.

The board is not modelled cell by cell. Sound has no loop that lasts (the swarm hum is 1.3 s and `goLevel` stops it), so the sound switch is left out.

The chart hides two kinds of step, both of which reset the round: opening a link mid-round, and starting a level mid-round. The same arrows from "Waiting for your first tap" and from the end states show what they do.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| ClockStillWhileAway | The star clock never runs while you're in another window or tab (NoProgressWhileAway, PausedWhenBlurred). | **breaks** |
| PausedWhenHidden | Hiding the tab pauses the round and stops the clock. | holds |
| InputReleasedWhenAway | Once you leave, no finger counts as held, so no গামছা is tied behind your back. | **breaks** |
| NoDoubleResult | A round records its stars once. | holds |
| ReplayIsExact | The friend's level always gives the friend's orchard, never a fresh one. | holds |
| LinkOpensOnlyItsLevel | A friend's link opens its own level, not the levels before it. Level 2 opens only after you clear level 1. | **breaks** (shared) |
| SavedUnlockIsEarned | The progress saved on this phone opens level 2 or 3 only after you clear level 1. | **breaks** (shared) |
| UnlockNeverShrinks | Unlocked levels never close again (and stars never drop, as far as unlocking reads them). | holds |

4 rules held and 4 broke. TypeOK and NoDeadlock also hold.

## Bugs

### 1. ClockStillWhileAway: "I clicked into another window and the clock kept counting against my stars" (shared)
- **Path:** (0) Waiting for your first tap → (1) you clear a bush → (2) you click into another window. The game is still "Playing, clock running".
- **Live replay (Orca, desktop):** I tapped bush 14 and the clock read ০০:০১. I dispatched `blur` and waited 5 s. The clock read **০০:০৬** and no pause card showed. On `focus` it was still ০০:০৬, and it kept counting.
- **Control (PausedWhenHidden holds):** In headless Chrome, the clock read ০০:০২ before I hid the tab for 3 s. It still read **০০:০২** when the tab came back, with the pause card shown, and moved on to ০০:০৩ 1.1 s after চালিয়ে যাও.
- **Fix:** Pause on `blur`, using the same code as `hide()`: `stopClock()`, `setPaused(true)`, `cancelPress()`. Better still, use a shared `useAway()` hook in `shared/game-kit.ts` that every game calls on blur and on hide. Add a node test that replays the path against the clock logic.

### 2. InputReleasedWhenAway: "I held a bush, a notification took focus, and a গামছা got tied by itself" (shared pattern)
- **Path:** (0) Waiting for your first tap → (1) you press and hold a bush → (2) you click into another window. The finger still counts as held, and then the long press ties a গামছা. On a friend's board this also starts the clock, because `mark()` calls `startClock()`.
- **Live replay (Orca):** I sent a touch `pointerdown` on covered bush 31 (with 4 গামছা left), then `blur` 100 ms later, and sent no `pointerup`. 700 ms later bush 31 was **marked** and the count read **৩**.
- **Fix:** Call `cancelPress()` on blur, as `hide()` already does. In the timer, check `document.hasFocus()` and read `paused` and `over` through refs, not through the closure from the render.

### 3. LinkOpensOnlyItsLevel and SavedUnlockIsEarned: "a friend's link to level 3 opened level 2 for me, and after I cleared it, levels 2–4 stayed open for good" (shared)
- **Path:** (0) No friend link → (1) you open a friend's link to level 3, and levels 2–3 are open with level 1 not cleared → (2) you clear level 2 or 3 before level 1. Levels 2–3 are then saved open, and level 1 was never cleared.
- **Live replay (Orca):** With empty storage, I opened `/bhimruler-chak#s=4242&t=300&l=3&f=0`. LevelGrid showed levels 1, 2 and 3 open and level 4 locked, before I had cleared anything. I cleared level 3 with 9 hints (H). Storage read `{"3":1}`. I reloaded without the hash, and LevelGrid showed **levels 1, 2, 3 (১ তারা) and 4 open** and 5 locked, though levels 1 and 2 had never been played.
- **Cause:** `unlockedOrFriend = Math.max(levels.unlocked, friend.level)` opens every level up to the friend's, and `unlockedLevel` is 1 + the highest level with stars, so a single cleared friend level unlocks everything below it for good. The same two lines are in churir-bazar (line 109), mukhe-mukhe-hisab (line 68), and more games (`grep -rn "friend?.level ?? 1" tools`).
- **Fix (shared):** Make `unlockedLevel` one past the longest unbroken run of cleared levels starting at 1. Pass the friend's level to `LevelGrid` as one extra open level, not as a new ceiling. Add a test in `shared/tests` with `{3: 1}`, which should give unlocked 1 plus the friend's level 3 only.

## Quality-bar gaps (from playing levels 1–3 end to end in Orca)
1. **Pause isn't a menu.** There is no pause button and no P or Esc. The only pause is the tab hiding, and focus loss doesn't pause (bug 1). The overlay offers only চালিয়ে যাও.
2. **The first screen leads with words.** The H1 and the lead paragraph sit above the board, and the first action is "tap any bush" in small status text under the board. Nothing big says "start here" (the lesson's step 1 is easy to miss on a phone).
3. **Choices are hidden.** Levels live in a closed "সব লেভেল" drawer. There is no numbered choice, no default marked, and no line saying what the next level changes (it only grows a row or adds one nest).
4. **Pacing has no new ideas.** All 30 levels add a row, a column or a nest. The three worlds only change the name: no new element per world and no named "boss" orchard at the end of a world.
5. **No danger signal.** Nothing at the edge warns that you're about to lose, and the loss is a sudden swarm with a "ভোঁওও… পালাও!" banner over the middle of the board.
6. **Keyboard keys are invisible.** M (mode), H (hint), G or F (mark) and the arrows aren't shown anywhere on screen.
7. **The hint cost is clear but blunt.** One hint caps the level at 2 stars, and the text says so only after you take it.

What works: the HUD sits in the corners (level top-left, nests and clock top-right) with Bangla digits. The level 1 lesson walks you through 3 steps. The result says the exact distance to the next star, and the friend link replays the same orchard.

Screenshots: `.shots/bhimruler-chak-first-screen.png` (the phone's first screen), `.shots/bhimruler-chak-win.png` (a cleared board on the phone) and `.shots/bhimruler-chak-clear.png` (the result box on desktop, 3 stars).

## How the replays were done
- In Orca, `blur` and `focus` were dispatched on `window`, touch presses as `PointerEvent('pointerdown', {pointerType: 'touch'})`, and hints as `keydown` H. Each replay saved and cleared the game's localStorage keys afterwards.
- Orca can't hide a tab. It pins `document.hidden` and `document.visibilityState` as non-configurable own getters that always say "visible", in every frame. So the only hide step (the PausedWhenHidden control) ran in headless Chrome over CDP, with `Object.defineProperty(document, 'hidden', …)` and a `visibilitychange` event.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/bhimruler-chak/Orchard.tla --view ai_docs/statecharts/bhimruler-chak/view.ts --out ai_docs/statecharts/bhimruler-chak/after-fix
rm ai_docs/statecharts/bhimruler-chak/after-fix/tlc.out
```
After the fix, update the spec to the fixed code (blur pauses and releases the press; unlocking follows clears) and every rule must hold.
