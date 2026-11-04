# আল ধরে হাঁটি: statechart (before the rewrite)

Model: `AlDhore.tla`, `AlDhore.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/al-dhore-hati/components/al-game.tsx`, `tools/al-dhore-hati/lib/walk.ts` (step: walk → slip → walk, done, fell), `tools/al-dhore-hati/lib/sound.ts` (windLoop), `shared/game-kit.ts` (useGameLoop), `shared/game-sound.ts` (loop, setSoundOn), `shared/game-ui.tsx` (SoundToggle).

TLC: 114 states. 4 rules break and 5 hold (counting NoDeadlock).

## Systems modelled
- **Play phase:** ready → walk (walk.ts's walk and slip together; hide pauses both) → won or fell. `results` counts how many times the field ended.
- **Pause and focus:** the tab is visible or hidden, and the window is focused or blurred. Hide runs `stopWind()`, `clearInput()` and pause. Blur only stops useGameLoop's rAF. (Scroll-away works like moshar-raat: it freezes the walk and stops the wind, with no pause. It isn't modelled.)
- **Input:** a held side (←/→, A/D, a finger on half the field or on a pad), merged as `held`. Keyup and pointerup reach the page only while it has focus. Hide, finish and a new level call `clearInput()`.
- **Time:** the walk is `step(game, dt)` from useGameLoop's fixed steps, so it can't advance while the loop is stopped.
- **Sound:** the wind loop `live.wind` (none, stub or live) on a windy field (level 11+), plus the site-wide switch. `tick()` recreates it with `??=`.
- **Choices and links:** a friend's link (their seed on the ready screen), আরেকবার on the fell card (keeps the friend's seed), আবার খেলো on the won card (always a new seed), and পরের লেভেল / the level grid (a new field, straight into the walk).

## Rules
| Rule | In plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After a blur or a hidden tab, no side counts as held. | **breaks** |
| PausedWhenHidden | Hiding the tab pauses the walk. | holds |
| PausedWhenBlurred | Clicking into another window pauses the walk. | **breaks** |
| LoopOnlyWhenMeaningful | The wind plays only while you walk on a focused, visible page with sound on. | **breaks** |
| LoopComesBack | While you walk with sound on, the wind is never a silent stub. onChange nulls it, and the next tick makes a real one. | holds |
| NoDoubleResult | A field ends once (`done`/`fell` events fire once, then phase ≠ walk). | holds |
| ReplayIsExact (property) | Replaying a friend's field from either card keeps the friend's field, so the compare line still means something. | **breaks** |
| NoProgressWhileAway | The walk doesn't move while you're away. | holds by construction (dt-based), confirmed live |

Checked by reading, not modelled: saved stars only go up (`recordLevel` keeps the max), and the unlocked level is derived from stars, so it never shrinks.

## Bugs

### 1. InputReleasedWhenAway / PausedWhenBlurred: "I was holding ← when a message popped up. I clicked into it, and when I came back my man walked straight into the mud."
- **Path (report):** 0 standing at the ridge → 1 you pick a level (the walk starts at once) → 2 you hold ← or → → 3 you click into another window.
- **Code:** the keyup for ← goes to the other window, so `live.keys.left` stays true and `game.dir` stays −1. Blur doesn't call `clearInput()` and doesn't pause. Only `visibilitychange` does. On focus, useGameLoop restarts and `step()` keeps steering left.
- **Live replay (Orca, level 1):** Space to start. At t=1.47 s: 4.5 m, x 180. Then keydown ArrowLeft. 150 ms later: x 174.1, dir −1, vel −59.2. Then `window.dispatchEvent(new Event("blur"))`. Three seconds later the walk is frozen (clock 1.87 s) but `keys.left: true`, dir −1, and there is no overlay. Then `focus`, and within 0.5 s: **x 174.1 → 145.5, phase `slip`, slips 0 → 1 (mud)**, though no key had been pressed since you came back. After the slip `live.keys.left` is still true. By the code, a later → press sums to 0 (`updateHold`) until ← is pressed and released again. This was read in the code; the field ended before it could be checked live.
- **Fix:** on window `blur`, run the same steps as `hide`: `stopWind(); clearInput();` and pause in walk or slip. **Shared:** the same kit hook as roshi-tana and moshar-raat. Never keep `live.keys` across a blur.

### 2. LoopOnlyWhenMeaningful: "On the windy fields the wind kept blowing while I was in another window."
- **Path (report):** 0 standing → 1 you pick a level → 2 the wind starts to blow → 3 you click into another window.
- **Code:** `stopWind()` runs on hide, on `!looping`, on finish and in the slip phase, but not on blur.
- **Live replay:** a friend link to level 11 (`#s=99&t=1&m=50&l=11`), then Space and the steering autopilot for 2 s. At clock 3.23 s, 12 m: the wind is live (1 loop started, 0 stopped). Then `blur`. Four seconds later: **clock still 3.23 s, and the wind loop still running** (0 stopped).
- **Fix:** part of bug 1's fix (`stopWind()` on blur). **Shared.**

### 3. ReplayIsExact: "I matched my friend's dry walk and pressed আবার খেলো to do it again, and got a different field. The comparison with my friend was gone."
- **Path (report):** 0 standing → 1 you open a friend's link → 2 you tap শুরু করো → 3 you reach the end of the field → 4 you press আবার খেলো, on a fresh field.
- **Code:** the fell card's আরেকবার is `startLevel(level, rival ? seed : newSeed())`, but the won card's আবার খেলো (and Space on the last level) is `pickLevel(level)`, which is `startLevel(level)` with a new seed. moshar-raat's `retry()` keeps the rival's seed on both cards.
- **Live replay:** `#s=4242&t=0&m=30&l=1&n=Rafi` gives the banner "Rafi লেভেল ১-এর ৩০ মিটার আল একবারও না পিছলে পার হয়েছে।" and `field.seed` 4242. The autopilot walks it dry in 9.7 s, and the card reads "সমান সমান! Rafiও একবারও পিছলায়নি।" Then আবার খেলো: **`field.seed` 4242 → 226242739**, the walk starts at once, and `rival` is null.
- **Fix:** on the won card, use `startLevel(level, rival ? seed : newSeed())` like the fell card. **Game-specific.**

### Seen while playing, not a rule
- পরের লেভেল, আবার খেলো and the level grid all go straight into the walk (`startLevel(…, play = true)`). The ready screen is skipped, so its one-line news (`newThing()`: "আলে পানি জমেছে…" at 4, the goats at 7, the wind at 11) never shows when you go up level by level. From the grid, the walk starts while `toTop()` is still smooth-scrolling.

## Quality-bar gaps (played end to end in Orca: level 1, a steering autopilot through real keydown/keyup, a dry 3★ crossing in 9.7 s; level 11 checked for the wind)
1. **Pacing and onboarding:** each new obstacle's one-line intro is skipped when you go up level by level (above). Show the ready screen, or a short banner that pauses, for every level that adds something.
2. **Pause:** there is no pause button and no P/Esc. Blur doesn't pause (bug 1). The overlay is just চালিয়ে যাও.
3. **First screen:** শুরু করো is a plain wide button under the board. The field says "চাপলেই হাঁটা শুরু", but the walker or the আল itself isn't the start target.
4. **Danger at the edges:** after the second slip nothing warns you except the feet dots under the board. When the feet near the ridge's edge, only the "একটুর জন্য" call appears, mid-field. Add an edge glow near the mud and on the last life.
5. **HUD:** the progress bar, feet dots and metres sit under the board, out of the eye line. The wind chip is top-right (good). Calls (`al-call`) appear over the play area.
6. **Choices:** the level grid works mid-walk, throws the walk away without asking, and starts the next one at once.
7. **Ending:** good. It shows slips, the longest dry stretch, a near-miss line and the card. The fell card shows metres left.
8. **Sound:** a good set (footsteps that follow the pace, squelch, bleat, egrets, step-up, wind), but the wind plays on while you're away (bug 2). There is no short tune per scene (সকাল → সন্ধ্যা), though four scenes suit one.
9. **Story:** no intro (who is walking, and where to: হাট, বাড়ি, the school). The scenes already tell a day.

Screenshots: `.shots/al-dhore-hati-ready.png` (the ready field), `.shots/al-dhore-hati-play.png` (mid-walk at 16 m), `.shots/al-dhore-hati-over.png` (the 3★ card on the friend's field).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/al-dhore-hati/AlDhore.tla --view ai_docs/statecharts/al-dhore-hati/view.ts --out ai_docs/statecharts/al-dhore-hati/<new-folder>
```
The chart hides "you turn sound on/off". Those steps are in the model and the rule checks. The ReplayIsExact counterexample is in `report.md`. Its `tlc-ReplayIsExact.out` was deleted with the other TLC logs.

Replay harness note: same as roshi-tana. rAF was swapped for a 60 Hz MessageChannel pump, state was read from the `live` object in React's hook list, and loops were counted by wrapping `AudioBufferSourceNode.start` (`loop = true`). Keys were dispatched on `window` as the game listens there. `document.hidden` is pinned in Orca, so the hide path was checked against the code. Test data was removed afterwards.
