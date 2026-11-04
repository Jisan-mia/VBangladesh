# ভো-কাট্টা: statechart (before the rewrite)

Model: `VoKatta.tla`, `VoKatta.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/vo-katta/components/vo-katta-game.tsx`, `tools/vo-katta/lib/game.ts`, `shared/game-kit.ts` (useGameLoop), `shared/game-sound.ts` (loop, setSoundOn), `shared/game-ui.tsx` (SoundToggle).

TLC: 294 states. 3 rules break and 9 hold (counting NoDeadlock).

## Systems modelled
- **Play phase:** ready → playing → paused → over. The three rounds are cut to two, with the break between roofs (`stage`: r1, break, r2).
- **Pause and focus:** the tab is visible or hidden, the window is focused or blurred, and the sky is on screen or not (`boardInView`, the IntersectionObserver).
- **Input:** টান (pointer or Space), the arrow keys and a drag on the sky, merged as `held`. Each is released by keyup, pointerup, blur, pause or the round's end.
- **Time:** the round clock runs only inside useGameLoop, while the phase is playing and the tab is visible. The fanfare timer (`timers.current`) fires after the stars chime.
- **Sound:** the wind and hum loops (one `wind` flag) and the site-wide sound switch.
- **Choices:** আবার খেলো, পরের লেভেল and the level grid. The grid works in every phase. A friend's link (hashchange) does the same `reset()` and `go("ready")`.
- **Results and saved progress:** results recorded per run, saved stars (0–2), and the fanfare.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After a blur or a hidden tab, nothing counts as held. | holds |
| PausedWhenHidden | Hiding the tab pauses the round. | holds |
| PausedWhenBlurred | Clicking into another window pauses the round. | **breaks** |
| NoProgressWhileAway | The clock, the rivals and the wind move only while you can see the sky on a focused page. | **breaks** |
| OffScreenMeansPaused | The game's own rule ("scrolling the sky away mid-game pauses it") holds however you get back to playing. | **breaks** |
| LoopOnlyWhenMeaningful | The wind loop plays only while the round runs with sound on. It stops when paused, hidden, muted or on the card. | holds |
| LoopComesBack | When the round runs with sound on, the wind plays. Turning sound back on restores it. | holds |
| NoDoubleResult | An evening ends once, so the stars are recorded once. | holds |
| NoFanfareAfterMovingOn | The fanfare never plays after you leave the card. | holds |
| StarsNeverDrop (property) | Saved stars only go up. | holds |
| ReplayIsExact | A friend's link replays the same seed and level. An invalid link falls back to a fresh game. | checked live (below), not modelled |

Checked by reading the code, not modelled: the unlock never shrinks (`unlockedLevel` reads saved stars only), the old best migrates once (`migrateBest` returns 0 once stars exist), and the stars on the card are the stars recorded (`finish()` uses one `starsOf()` value for both).

## Bugs

### 1. PausedWhenBlurred / NoProgressWhileAway: "I clicked into another window and the evening kept going. The rivals cut my kite while I was away."
- **Path (report):** 0 waiting on the roof → 1 you hold টান (round 1) → 2 you click into another window. The round is still flying.
- **Code:** `window.addEventListener("blur", letGo)` releases the hand but never calls `pause()`. useGameLoop stops only on `visibilitychange`, so the round clock and the rivals keep running in a visible but blurred window. The wind loop keeps playing too.
- **Live replay (Orca, tab 98508f53):** tap শুরু করো, press টান (pointerdown), then `window.dispatchEvent(new Event("blur"))`. Sequence: phase `playing`, clock 0.63 s, `pulling: true` → at blur `pulling: false` (letGo works), phase still `playing`, wind on → +4 s: clock 4.65 → +12 s: clock 12.65 → +22 s: clock 30.02, break between roofs → +32 s: round 2, hooked, `lost: 1` → +52 s: round 3, `lost: 5`. While away, the second roof cut your kite 5 times and the 30 s round ran out.
- **Fix:** on window `blur`, call `pause()` (it already does letGo and stopLoops), the same as on hide. **Shared:** jam-chharao and bhangti-nai have the same gap. Put the handling in one kit hook (blur and hide release input and pause real-time play) and use it in every game.

### 2. OffScreenMeansPaused: "The sky was scrolled off my screen, I tapped play on the bar above it, and the round ran where I couldn't see it."
- **Path (report):** 0 waiting → 1 you hold টান → 2 you scroll the sky away (paused) → 3 you press চালিয়ে যাও. The round runs with the sky scrolled away.
- **Code:** `useEffect(() => { if (!boardInView) pause(); }, [boardInView])` fires only when `boardInView` changes. The HUD pause button (`.vk-pause`, above the board, outside `.vk-board`) calls `resume()` with no `boardInView` check. The keys check it, the button doesn't. `restart()` from the আবার খেলো button under the board has the same hole.
- **Live replay:** viewport 915×380 (a phone in landscape). The sky starts at y=355, so 6% of it shows and `boardInView` is false. The game was paused and the HUD was on screen. Click the HUD ▶ → phase `playing`, clock 2.30 → 2.58 → 7.58 s after 5 s, with 6% of the sky on screen. Screenshot: `.shots/vo-katta-offscreen-resume.png` (the HUD shows ॥, so the round is running, and the sky is below the fold).
- **Fix:** have `resume()`/`restart()` scroll the sky into view first (`play.current.scrollIntoView`), or refuse while `!boardInView`. Also re-check `boardInView` inside `go("playing")`. **Shared** with bhangti-nai, which has the same useInView pattern.

### Bugs that did not appear
- The sound switch restores the wind (LoopComesBack holds). `SoundToggle onChange` calls `startLoops()` while playing, and `resume()` restarts the loops.
- Hide → `pause()` → `letGo()` + `stopLoops()`: holds. In Orca, `document.hidden` is a native getter pinned to `false`, so the hidden path could not be faked live. The model and the code agree.

### ReplayIsExact, live
- `#s=862479917&t=18&n=রাফি`: banner "রাফি ১৮টা ঘুড়ি কেটেছে…", level 1, windBase −0.1819, first rival home (237.66, 180.9). The same values come back with or without a name.
- `#s=0&t=999` and `#s=…&l=11`: no banner, a fresh seed on the unlocked level (2).

## Quality-bar gaps (played end to end in Orca, level 1, autopilot via the real pointer handlers)
1. **First screen:** শুরু করো is a plain kit button low in the sky overlay, not the game's own art (a নাটাই or the kite). On a 915×380 landscape phone the sky starts below the fold and only 6% of it shows.
2. **Difficulty and pacing:** level 1 is too easy. A naive bot that taps just past the rival kite cut 18 kites with 0 lost (3★ needs 7). Round 1's rivals never attack, and nothing in level 1 can hurt you. Easy should be easy, but the first win should come in 10 seconds and level 1 should still have one danger.
3. **Pause:** it isn't a real menu, only চালিয়ে যাও. There is no নতুন করে শুরু, no কীভাবে খেলবে and no সব লেভেল. It doesn't pause on blur (bug 1), and you can resume with the sky off screen (bug 2).
4. **Middle of the screen:** the round-break card ("রাউন্ড ২ · লাল বাড়ির ছাদ"), the "ভো-কাট্টা!/কেটে গেল!" pop and the result slip all sit in the centre of the sky. The break card covers kites that are still flying.
5. **Danger at the edges:** when the rival is winning a প্যাঁচ, the only sign is the small tug bar at the top centre. There is no edge glow when the tug passes −0.5, and losing your kite shows as a pop in the middle of the screen.
6. **Ending:** the over screen shows only the cuts and the near line. Kites lost, the best streak and a per-roof breakdown are tracked (`g.lost`, `live.streak`) but never shown. The card and the link work.
7. **Sound:** good sounds (wind/hum loops, zing, cheer, call, combo), but no short Sakrain tune per round. Bug 1 keeps the loops playing while you're in another window.
8. **Story:** there is no 2–3 panel Sakrain intro (the evening, the roofs, the ওস্তাদ). A world this specific suits one, played only on the first run.
9. **Choices:** the level grid in `<details>` keeps play running when you open it mid-round, and picking a level throws the round away without asking.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/vo-katta/VoKatta.tla --view ai_docs/statecharts/vo-katta/view.ts --out ai_docs/statecharts/vo-katta/<new-folder>
```
The chart hides "you turn sound on/off", "you pick a level" and the fanfare timer. Those steps are in the model and in the report's rule checks.

Replay harness note: Orca throttles rAF in a background tab to about 1 frame a second, so before each replay the page's `requestAnimationFrame` was swapped for a 60 Hz MessageChannel pump. Game logic and handlers are untouched. Game state was read from React's hook list (the `game` ref and the `live` object).
