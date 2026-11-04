# মশার রাত: statechart (before the rewrite)

Model: `Moshar.tla`, `Moshar.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/moshar-raat/components/moshar-game.tsx`, `tools/moshar-raat/lib/night.ts` (step, swing), `tools/moshar-raat/lib/sound.ts` (whine), `shared/game-kit.ts` (useGameLoop), `shared/game-sound.ts` (loop, setSoundOn), `shared/game-ui.tsx` (SoundToggle).

TLC: 168 states. 2 rules break and 7 hold (counting NoDeadlock and the StarsNeverDrop property).

## Systems modelled
- **Play phase:** ready (lights on, শুরু করো) → play → won (dawn) or lost (the third bite). `results` counts how many times the night ended.
- **Pause and focus:** the tab is visible or hidden, the window is focused or blurred, and the room is on screen or scrolled away. Hide pauses. Scroll-away only makes `looping` false, which freezes the night and stops the whine. Blur only stops useGameLoop's rAF.
- **Time:** the night clock is `n.t += dt`, fed only by useGameLoop's fixed steps. It cannot run while the loop is stopped, so nothing advances while you're away (checked live: t stayed at 4.63 s through a 5 s blur).
- **Input:** taps and Space swing at once; the arrows nudge an aim ring one press at a time. Nothing is held.
- **Sound:** the whine loop `live.whine` is none, a stub (made while muted) or live, plus the site-wide switch. `tick()` recreates it with `??=` every 4th step.
- **Choices:** আবার খেলো / আরেকবার / Space on the lost card (`retry`, straight into play), পরের রাত / Space on the won card and the level grid (`startNight`, to ready).
- **Saved progress:** saved stars (0–2) on a won night.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hiding the tab pauses the night. | holds |
| PausedWhenBlurred | Clicking into another window pauses the night. | **breaks** |
| LoopOnlyWhenMeaningful | The পিন-পিন plays only while mosquitoes fly on a focused, visible page with sound on. | **breaks** |
| LoopComesBack | While the night runs with sound on, the whine is never a silent stub. Turning sound on stops the stub, and the next tick makes a real loop. | holds |
| NoDoubleResult | A night ends once, so stars, confetti and the win sound happen once. `finish()` runs from `tick` and then phase ≠ play. | holds |
| NoWhineOnTheCard | No whine on the won or lost card. | holds |
| StarsNeverDrop (property) | Saved stars only go up. | holds |
| NoProgressWhileAway | The clock and the mosquitoes don't move while you're away. | holds by construction (dt-based), confirmed live |
| ReplayIsExact | A friend's link replays the same night and seed. An invalid link falls back. | checked live (below), not modelled |

## Bugs

### 1. LoopOnlyWhenMeaningful / PausedWhenBlurred: "I clicked into another window and the mosquito kept whining in my ear, though nothing in the room moved. When I clicked back, the mosquitoes were already diving and there was no pause screen."
- **Path (report):** 0 lights on, waiting → 1 you tap শুরু করো → 2 a mosquito flies near (the whine starts) → 3 you click into another window.
- **Code:** useGameLoop's `blur` listener cancels the rAF, so `tick()` stops and the whine is frozen at its last loudness. `stopWhine()` runs on hide, on `!looping` (paused, not play, or out of view), on `finish` and on the sound switch, but `looping` doesn't include focus, so blur stops nothing. `live.paused` is never set on blur, so focus resumes the night at once.
- **Live replay (Orca, night 1, sound on):** click শুরু করো. At t=3.45 s two mosquitoes fly and the whine is live (1 loop started, 0 stopped). Then `window.dispatchEvent(new Event("blur"))` at t=4.63 s. Five seconds later: **t still 4.63 s, no overlay, and the whine loop still running** (0 loops stopped). Then `focus`, and one second later: t=5.62 s, 3 mosquitoes flying, `paused: false`. Play resumed the moment the window came back.
- **Fix:** on window `blur`, do what `hide` does: `stopWhine()` and, in play, `live.paused = true; setPaused(true)`. **Shared:** the same kit hook as roshi-tana and al-dhore-hati.

### Seen while playing, not a rule
- When a night ends, the loop stops on the frame that ended it, so the canvas behind the card keeps the bat and the "টানা ৫ / টানা ৬" pops frozen in the room (see `.shots/moshar-raat-over.png`). Draw one clean frame in `finish()`, or let the pops finish.
- Scrolling the room away freezes the night without a pause overlay. Scrolling it back resumes at once. It holds no rule, but it's the same "resume with no warning" feel as bug 1.

### ReplayIsExact, live
- `#s=777&t=5&l=2&b=1&n=Rafi`: the banner reads "Rafi রাত ২-এ ৫টা মশা মেরেছে।", with `night.seed` 777, level 2, and the first mosquito at 0.500 s, hover x 151.4.
- `#s=777&t=50&l=2&b=1` (zaps + bites > count): no banner, and a fresh night at the unlocked night (2).

## Quality-bar gaps (played end to end in Orca: night 1 with an autopilot that swings at the most dangerous mosquito every 450 ms through the real pointer handler, a 6/8 zap, 2-bite, 2★ dawn at 19 s; then night 2's start screen)
1. **First screen:** শুরু করো is a plain kit button on a dimmed room, not the game's own art (the bat, or the light switch). The news line ("আজ দরজা দিয়েও ঢুকবে।") is good, one new thing per night.
2. **Pause:** there is no pause button and no P/Esc. Only hiding the tab pauses (bug 1). The overlay is just চালিয়ে যাও.
3. **Danger at the edges:** at 2 of 3 bites nothing changes at the screen edge. "পিন-পিন" sits over the mosquito, and the status line under the room reads it out. Add an edge glow for a close dive and for the last bite.
4. **HUD:** good corners (মশা n/N, কামড় n/৩, the dawn bar along the top). But there is no seconds-to-dawn readout during play, and `toDawn` is shown only on the lost card.
5. **Ending:** the won card shows zaps, bites and stars. The best streak (`bestCombo`) is tracked but never shown. The frozen pops stay behind the card (above).
6. **First win:** the first zap comes within about 2 s, but a night lasts 20 s or more, so the first finished round comes after 20 s. Night 1 could be shorter (12–15 s) to land a first dawn sooner.
7. **Keyboard:** each arrow press moves the aim ring 12 units, and holding an arrow relies on key repeat. It's slow on a 360-unit room, so keyboard players can't keep up from night 5 on.
8. **Sound:** a good set (whine, crackle with per-hit ticks, swish, উঁহু, the switch), but the whine keeps going while you're away (bug 1). The win has no dawn cue, such as a rooster or morning birds.
9. **Story:** no intro panel (the power cut, the মশারি). It would suit the world and play once.

Screenshots: `.shots/moshar-raat-ready.png` (night 2's start overlay), `.shots/moshar-raat-over.png` (the night 1 won card, with frozen pops behind it). `.shots/moshar-raat-play.png` is the same frame as `-over`, because the background tab painted late.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/moshar-raat/Moshar.tla --view ai_docs/statecharts/moshar-raat/view.ts --out ai_docs/statecharts/moshar-raat/<new-folder>
```
The chart hides "you pick a night". It is in the model and the rule checks.

Replay harness note: same as roshi-tana. rAF was swapped for a 60 Hz MessageChannel pump, state was read from the `live` object in React's hook list, and loops were counted by wrapping `OscillatorNode.start` (the whine is the only argument-less sawtooth start). `document.hidden` is pinned in Orca, so the hide path was checked against the code. Test data was removed afterwards.
