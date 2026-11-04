# শব্দ খোঁজা: statechart (before the rewrite)

Spec `ShobdoKhoja.tla`, config `ShobdoKhoja.cfg` and view `view.ts`, mirrored from `tools/shobdo-khoja/components/word-search.tsx`, `shared/game-kit.ts` (`useLevels`) and `shared/game-core.ts` (`recordLevel`, `unlockedLevel`). Results are in `before-fix/report.md` and `before-fix/chart.mmd`: 471 states, 16 chart states, 38 arrows.

**Result: 4 rules held and 4 broke. All 4 bugs reproduced live.**

## Systems modelled
- **Play phase:** ready → playing → paused → over. The clock runs exactly while the phase is `playing` (`startClock` and `stopClock`).
- **Tab and window:** the `visibilitychange` handler `hide`. It pauses only from `playing`. The game has **no blur listener**.
- **The finger on the grid:** `press.current` can be none, down on a letter, or dragging a stroke, through `onPointerDown`, `onPointerMove`, `onPointerUp` and `onPointerCancel`. Only `onPointerDown` checks the phase. `attempt()` checks nothing.
- **Time:** the fanfare `setTimeout` in `finish()`. `begin()` clears it.
- **Levels:** stars per level, the stored unlock (`unlockedLevel`), and the picker bound `Math.max(levels.unlocked, friend.stage)`. Also পরের লেভেল, আবার খেলো, picking a level, and a friend's level link (`readFriend`).

The model uses 2 words instead of 6 and 2 levels instead of 24. It leaves out free grids, hints and the first-load jump to the furthest level. The chart hides one step, "the fanfare plays", because it changes nothing the player sees in the regions.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| NoProgressWhileAway | The clock only runs while you're on the page. | **breaks** |
| PausedWhenHidden | Hiding the tab mid-hunt pauses the round. | holds |
| InputReleasedWhenAway | After you leave the page, no finger counts as on the grid. | **breaks** |
| NoStrokeUnderThePauseCard | While the pause card shows, no stroke is in flight, so no word can be struck. | **breaks** |
| FanfareOnlyOnTheResult | The fanfare only plays on the result it celebrates. | holds |
| ResultMatchesPlay | The result shows exactly when every word is struck. | holds |
| UnlockOnlyByClearing | A level opens for good only when you clear the one before it. | **breaks** |
| NoDeadlock | There's always a next step. | holds |

## Bugs

### 1. NoStrokeUnderThePauseCard: a word gets struck under the pause card (game)
- **What the player sees:** "I hid the tab mid-stroke. When I came back and finished the stroke, a word got struck while the pause card still showed."
- **Path (report):**
  0. The grid is waiting.
  1. You touch a letter.
  2. You hide the tab.

  After that, dragging and letting go calls `attempt()` with no phase check.
- **Live replay:** done in headless Chrome over CDP. Orca pins `document.hidden` to `false` with a native, non-configurable getter on every document, iframes included, so a page in Orca can't be made to see a hidden tab.
  - Pointer down on পলাশ's first cell (28): the phase goes to `playing` and the clock reads ০:০২.
  - The tab hides: the phase goes to `paused` and the clock stays at ০:০২. The tab shows again and the pause card reads "থেমে আছে, ঘড়িও থেমে আছে।".
  - Pointer moves to cells 36 and 44, then pointer up. The count goes from ১ to ২, পলাশ is marked found and the status says "পেয়েছ: পলাশ! আর ৪টা।". The phase is still `paused` and the clock still reads ০:০২.
  - If that stroke had been the last word, the round would have ended under the pause card.
- **Fix:**
  - On hide (and on blur, see bug 2), run `onPointerCancel()` and set `firstTap` to −1.
  - Guard `onPointerMove`, `onPointerUp`, `tap()` and `attempt()` with `phaseRef.current === "playing" || phaseRef.current === "ready"`.
  - Add a node test of `attempt` while paused, and repeat the replay in Orca with blur.

### 2. NoProgressWhileAway: the clock runs while another window has focus (shared)
- **What the player sees:** "I clicked into another window and the clock kept counting my time."
- **Path:**
  0. The grid is waiting.
  1. You touch a letter.
  2. You click into another window.
- **Live replay (Orca):** start the round, then dispatch `blur` on the window. The clock reads ০:০২ at the blur and ০:০৭ after 5 s away. No pause card appears and the phase stays `playing`.
- **Fix:** treat window `blur` like hiding the tab: `stopClock()`, `setPhase("paused")` and release the press. Do this in one shared away-handler so every game gets it (see the shared fixes in the carrom and পাটি বুনি READMEs). Note that the game has no pause button and no P or Esc key at all (see the gaps below).

### 3. InputReleasedWhenAway: a press survives leaving the window (shared)
- **What the player sees:** "I pressed a letter and switched windows. When I came back, just moving the mouse drew a stroke, and letting go struck a word."
- **Path:**
  0. The grid is waiting.
  1. You touch a letter.
  2. You click into another window.
- **Live replay (Orca):**
  - Pointer down on cell 28, then window `blur`, then window `focus`.
  - Pointer moves to cells 36 and 44 with no new press. The trail capsule is drawn.
  - Pointer up: পলাশ is struck and the count goes from ১ to ২.
- **Fix:** the same as bug 1. The blur handler calls `onPointerCancel()`.

### 4. UnlockOnlyByClearing: a friend's link opens every level below it, for good (shared with carrom)
- **What the player sees:** "My friend's level-20 link opened levels 2 to 20 in my picker. I cleared level 12 and now 13 levels stay open, though I never played level 1."
- **Path (7 steps):**
  1. You open a friend's level-2 link.
  2. You touch, drag and let go on a word.
  3. You touch, drag and strike the last word of level 2.

  The saved stars become {2} and the stored unlock is level 2, with level 1 never cleared.
- **Live replay (Orca):**
  - Clear storage and open `/shobdo-khoja#s=4242&t=120&p=phol&l=1&h=0&v=20&n=রাফি`.
  - The board shows "লেভেল ২০ · ফল, কঠিন" and 20 level buttons are enabled.
  - Pick level 12 and solve it (★★★, ০:০২). The `ektukhani-levels-shobdo-khoja` key now holds `{"12":3}`.
  - Reload without the link. The game opens on "লেভেল ১৩ · পাখি, কঠিন" with 13 levels enabled.
- **Fix:**
  - Only the friend's own level should open, not every level below it. Pass the friend's level to `LevelGrid` as one extra open level.
  - A level above `unlocked` shouldn't raise the stored unlock. Either keep its stars but derive `unlocked` from the run of cleared levels starting at 1, or don't record stars above `unlocked + 1`.
  - Best done once in `shared/game-core.ts` or `LevelGrid`, since carrom has the same bug.

## Quality-bar gaps (played end to end in Orca, with screenshots from headless Chrome)
1. **Pause:** there's no pause button and no P or Esc key. The round pauses only when the tab hides, never on blur. The bar asks for P, Esc, a button, hide and blur, plus a real pause menu.
2. **First screen:**
   - The H1, the lead and two rows of chips (8 packs, then সহজ/কঠিন) sit above the grid. The pack row is cut off at the phone's edge (খেলা is half hidden).
   - The start action is "touch the grid". No big start control exists, and nothing marks the first move beyond the status line.
3. **Choices reset without asking:** a pack chip, a difficulty chip, নতুন গ্রিড or the level picker wipes the round in progress at once. They aren't numbered, and none shows what it changes in one line. সহজ/কঠিন never says "উল্টো দিকেও লুকানো" by the chip itself.
4. **No star target while playing:** the clock shows the time, but the 1, 2 and 3-star cut-offs only appear after the round (`nearLine`). Carrom shows its goal chip during play; this game should too.
5. **Pacing:** the 24 levels are 3 passes over the same 8 packs. Nothing new arrives per level beyond reversed words in pass 2 and a tighter clock in pass 3. There's no named finale for a pass.
6. **HUD:** the word list sits under the grid. On a phone it's partly below the fold during the hunt, so you scroll to see what's left.
7. **Sound:** tap, pen scratch, good, rising combo, wrong and the end fanfare, all synthesized. There's no signature sound for a word strike beyond the shared `good`. The fanfare timer fires even if the tab was hidden right after the finish.
8. **Ending:** this meets the bar. You get stars, the time, the exact gap to the next star, the best on this phone, a card with your strokes, and a link that replays the same grid.

Screenshots:
- `.shots/shobdo-khoja-first.png`: the first screen in Orca on a Pixel 9.
- `.shots/shobdo-khoja-result.png`: the tutorial grid solved, with the stars on the result.
- `.shots/shobdo-khoja-card.png`: the card and the share area.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/shobdo-khoja/ShobdoKhoja.tla --view ai_docs/statecharts/shobdo-khoja/view.ts --out ai_docs/statecharts/shobdo-khoja/after-fix
rm ai_docs/statecharts/shobdo-khoja/after-fix/tlc.out
```
Before re-running, update the spec to match the fixed code. The blur and hide actions should release `press` and pause, the pointer actions should check the phase, and the picker and unlock should follow the new rule.
