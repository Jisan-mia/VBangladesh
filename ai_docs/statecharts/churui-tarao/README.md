# চড়ুই তাড়াও: statechart (before the rewrite)

Model: `Churui.tla`, `Churui.cfg` and `view.ts`. These mirror `tools/churui-tarao/components/churui-game.tsx` as it was on `games-to-the-bar` (commit a5fb4f1).
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC checked 304 states. The chart draws 17 states and 43 arrows.

## Systems modelled
- **Play phase:** ready → playing → paused → over. `start()`, `pause()`, the চালিয়ে যাও overlay and button, P, Esc and Space.
- **Pause and focus:** the window is on the page, another window has focus, or the tab is hidden. The game listens only to `visibilitychange` (line 167). There is no blur or focus listener.
- **Time:** the game loop steps while playing and the tab shows. rAF keeps running in a blurred window. `ateAway` records grain eaten while another window had focus.
- **Choices:** the সব লেভেল `<details>` (open or closed), picking a level, পরের লেভেল and আবার খেলো / আরেকবার.
- **Timers:** the celebration that `finish()` queues in `timers.current` (sfx.good, or levelUp and confetti). `setUp()` clears it. `start()` and `readFriend()` don't.
- **Links:** a friend's link on load or by hashchange. Mid-round, only the banner changes. Otherwise the friend's field waits on the ready screen. `lvl` and `seed` track whether the field on screen is the friend's.
- **Not modelled:** held input (every clap is one tap or key press, so nothing can stay held) and sound loops (the game has none, only one-shots). Saved stars aren't modelled either: `recordLevel` keeps the max, and the migration runs only while the levels key is empty. Both are covered by `tests/churui.test.ts`.

## Rules (plain words)
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab mid-round pauses it. | holds |
| PausedWhenBlurred | Clicking into another window mid-round pauses it. | **breaks** |
| NoProgressWhileAway | Sparrows don't eat grain while you're in another window. | **breaks** |
| ChoiceFreezesPlay | While the সব লেভেল list is open, the afternoon doesn't move on. | **breaks** |
| NoFanfareAfterMovingOn | The win cheer and confetti only happen while the result card shows. | **breaks** |
| ReplayIsExact | On the friend's level, the ready screen always has the friend's field (same seed). | holds |
| NoDeadlock | Every state has a way out. | holds |

## Bugs
### 1. PausedWhenBlurred and NoProgressWhileAway (shared)
- **Player's sentence:** "I clicked into another window for a moment and came back to sparrows eating my paddy."
- **Path:** (0) ready → (1) you tap the field → (2) you click into another window, still playing → (3) a sparrow nibbles.
- **Live replay (Orca):** `start`, then `window.dispatchEvent(new Event('blur'))`, then wait 6 s. The phase stayed `playing`. The clock went 0.47 s → 3.90 s and grain went 100% → 96%. `document.hasFocus()` was false the whole time. (Orca throttles rAF in a background pane to about 1 frame a second, so the clock moved slower than real time. It still moved.)
- **Fix:** add a `blur` listener that calls `pause()`, next to the `visibilitychange` one. Better still, move the game onto the shared game player or a shared `usePauseWhenAway(pause)` hook in `shared/game-kit.ts`.

### 2. ChoiceFreezesPlay (shared)
- **Player's sentence:** "I opened সব লেভেল to look at the stars and the field kept getting eaten."
- **Path:** (0) ready → (1) you open সব লেভেল → (2) you tap the field, and the round runs with the list open. The same happens if you open the list mid-round.
- **Live replay:** mid-round, `summary.click()` opened the list (`open: true`). After 6 s the phase was still `playing`, the clock had gone −0.38 s → 1.53 s and grain 100% → 99%.
- **Fix:** pause on the `<details>` `toggle` event when it opens (`onToggle={e => e.currentTarget.open && pause()}`). Or put the level grid inside the pause menu. Churui also has no in-view pause, unlike হাঁড়িভাঙা and পিয়নের সাইকেল: scroll the field away and the sparrows keep eating. Add `useInView(stage)` → `pause()` too.

### 3. NoFanfareAfterMovingOn (shared pattern)
- **Player's sentence:** "I pressed আবার খেলো right after winning and the confetti and fanfare went off over my new round."
- **Path:** (0) ready → (1) you tap the field → (2) dusk falls and the field is passed (the cheer is queued for (stars+1)×260 ms) → (3) you press আবার খেলো, and the new round runs with the cheer still to come. A friend's link opening on the card does the same (`readFriend` doesn't clear timers).
- **Live replay:** the field was untouched with the clock at 44.7 s. The card showed at t=2047 ms (100% ধান). আবার খেলো was pressed at 2252 ms and the phase became `playing`. Confetti appeared at 3010 ms, 758 ms into the new round.
- **Fix:** clear `timers.current` inside `start()` (and in `readFriend`), the way `setUp()` does. Better, add one shared `useTimers()` to the kit that clears on reset, unmount and pause.

### Smaller things noticed in the code (not separate rules)
- After you resume with the bar's চালিয়ে যাও button, focus stays on that button. The next Space then presses the button and pauses again instead of clapping. P doesn't resume. Only Space (with focus on the page) or a click does.

## Quality-bar gaps (played once end to end, Pixel 9, autopilot)
1. **First screen:** the start action is a plain green শুরু করো button in a dark panel over the middle of the field. It isn't the game's own art (for example, the কাকতাড়ুয়া clapping or a sparrow to tap), and there is no difficulty choice beyond ধীরে খেলো.
2. **Pause is not a real menu:** "খেলা থেমে আছে" plus one button. It has no নতুন করে শুরু, কীভাবে খেলবে, শব্দ or সব লেভেল. It doesn't pause on blur, on scrolling away, or on opening the level list.
3. **Level design:** ten fields that differ only in numbers (gap, ramp, nibble speed, flight speed). There is no new idea per level (a crow, a bold sparrow that needs two claps, wind) and no named "boss" field at the end. মোড়লের ক্ষেত is just more sparrows.
4. **Danger:** losing grain has no edge glow or vignette. The grain bar only shrinks in the top pill.
5. **HUD:** the grain bar, sparrow count and clock sit in a top strip, which is good. But the ready and result panels cover the middle of the field.
6. **Sound:** the chirp, clap, flutter and peck are good one-shots. There is no stage tune, and on mute nothing shows a sparrow landing off to one side (no edge pointer).
7. **Ending:** real stats and an exact near-miss line ("আর ২% ধান বাঁচলেই ৩ তারা"), with পরের লেভেল pre-focused. This meets the bar.
8. **Pacing:** within a level, the singles → pairs → groups ramp works. Across levels, the change is barely felt.

Screenshots: `.shots/churui-tarao-sc-ready.png` (ready screen, level 2), `.shots/churui-tarao-sc-play.png` (mid-round), `.shots/churui-tarao-sc-over.png` (result, 88%, 2 stars).

Testing note: every agent's Orca tab shares the 127.0.0.1:3100 origin. During this run, another tab cleared `localStorage` (the level-1 stars vanished between two of my rounds, and other games' keys went too). The game's `record()` merges with what is stored, so this was not a game bug.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/churui-tarao/Churui.tla --view ai_docs/statecharts/churui-tarao/view.ts --out ai_docs/statecharts/churui-tarao/after-fix
```
