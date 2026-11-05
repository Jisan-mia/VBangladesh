---
name: game-statechart
description: Model and verify a একটুখানি game's state machines with TLA+ and the statechart skill, then replay every bug against the real code and fix it. Use for every game and kids' game whenever it is built, rewritten, upgraded or reviewed, and whenever a change touches play phases, pause or focus, levels and unlocks, sound loops, timers, choices, links or the kids' rest screen. Output goes in ai_docs/statecharts/<slug>/.
---

# Game statecharts

tibo.dog's author modelled each system (the story, cutscenes, pause and focus, the level-up offer) in TLA+ and drew it as a chart in the player's words. The model found real bugs that play-testing missed, such as "the auto-pick picked while you looked away". Do the same for every game here.

The first model, `ai_docs/statecharts/antenna-thik-koro/`, found two real bugs in a shipped game within one run:
- **DialStillWhileAway:** hold ←, click another window, and the dial spins on its own, because keyup never arrives and blur doesn't pause.
- **StaticWhileSearching:** turn sound off, start, turn it back on, and the static stays silent.

Both reproduced live in the Orca browser.

## Where things go
- `ai_docs/statecharts/<slug>/<Name>.tla`, `<Name>.cfg` and `view.ts`.
- `ai_docs/statecharts/<slug>/before-fix/` and `after-fix/`: the generated `report.md` and `chart.mmd` (delete `tlc.out`).
- `ai_docs/statecharts/<slug>/README.md`: the systems, each rule in plain words, the bugs found with the reader's sentence and path, how each was replayed, the fix, and the commands to regenerate.
- Run with `scripts/statechart.sh <spec>.tla --view <view>.ts --out <new folder>`. It wires in TLC and Java. Use a fresh `--out` folder each run.

## What to model (every game has most of these)
Model each as variables in one spec, and keep the values few: abstract counts, a level count of 2–3, a round count of 2.

1. **Play phase:** ready → playing → (paused) → round over → result. Add levels or stages where they exist (locked, open, cleared, stars).
2. **Pause and focus:** tab visible or hidden, window focused or blurred, the pause menu, resume.
3. **Input:** a held key, pointer or finger, what releases it (keyup, pointerup, pointercancel, blur, visibility), and drags in flight.
4. **Time:** the game clock, countdowns, timers that fire later (setTimeout for star chimes, auto-advance, demos).
5. **Sound:** each `loop()` (on or off), the site-wide switch, which states may play it.
6. **Choices:** level-up or power-up offers, level select, "পরের লেভেল", "আবার খেলো".
7. **Links and results:** friend link loaded, replay check, card shown, share. For kids: no share, the parent gate, ShowParent.
8. **Kids' daily limit:** `atBreak()` is called only at round end, and `RestScreen` never appears mid-round.
9. **Saved progress:** stars only go up, unlocked never shrinks, and migration from old keys runs once.

## Rule library (write each the reader agrees to as an INVARIANT)
- **NoProgressWhileAway:** the clock, spawns and auto-moves don't advance while the tab is hidden or the window is blurred.
- **InputReleasedWhenAway:** after blur or hide, no key or pointer counts as held.
- **PausedWhenHidden** and **PausedWhenBlurred**, for anything with real-time play.
- **LoopOnlyWhenMeaningful:** each sound loop plays only in the states where it means something (the whine only while a mosquito flies; static only while searching), never while paused, hidden, muted, or on the result.
- **LoopComesBack:** if the loop should be playing and sound is on, it is playing; turning sound back on restores it.
- **ChoiceFreezesPlay:** while an offer or level picker is open, nothing in the game advances.
- **NoDoubleResult:** a round ends once; stars are recorded once; the confetti and win sound fire once.
- **ResultMatchesPlay:** the stars on the card equal the stars recorded.
- **StarsNeverDrop** and **UnlockNeverShrinks.**
- **RestOnlyAtBreak:** the kids' rest screen appears only between rounds.
- **NoShareForKids:** no share path without the parent gate.
- **ReplayIsExact:** a friend link replays the same seed and level, and an invalid link falls back to a fresh game.

Never weaken a rule to make it hold. If the model lacks a variable the rule needs, add it.

## Writing the spec
- Mirror the real code, one action per handler or effect, and cite the file in a comment at the top.
- Write `Next` as a disjunction of named actions written as the player sees them: `YouHoldTurn \/ WindowBlurs \/ ...`.
- Add a `Done` stutter for true end states only if one deadlocks.
- The view exports `state(v)` as regions (`{ Game, Window, Hand, Sound }`) with labels the player would say. `step()` returns plain sentences ("you click into another window"). Keep it to about 20 arrows; merge labels that act the same.

## After the run
1. **Report every broken rule:** the rule, its plain sentence, and the numbered path.
2. **Replay each path against the real game in the Orca browser** (`play-test-orca`), one step per action, and record the numbers (for example "dial 34° → 186° → 368° after blur").
   - If a bug does not reproduce, assume the model is wrong until you show otherwise.
3. **Fix it in the game, or in the shared kit when many games share it.** Add a node test that replays the path against the pure logic, plus a live check in Orca.
4. **Update the spec to the fixed code and re-run into `after-fix/`.** Every rule must hold.
5. **Show the user the `after-fix/chart.mmd` as a mermaid block** and list each bug in one line.

## Common fixes (shared first)
- **Blur and hide:** release all input, pause real-time play, stop loops. The shared game player does this for every game. Inside a game, never keep `held` state across blur.
- **Sound switch:** use `<SoundToggle onChange={on => on && shouldLoop() && startLoop()} />`, or read `soundOn()` in the game step to restart loops.
- **Timers:** keep `setTimeout` ids and clear them on reset, unmount and pause. Celebrations shouldn't fire after you've moved on.
