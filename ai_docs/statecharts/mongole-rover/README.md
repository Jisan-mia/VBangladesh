# মঙ্গলে রোভার: statechart, before the rewrite

Kids' game (ছোটদের জন্য, ages 6–11), so NoReadingNeeded (ages 3–5) doesn't apply.

Spec `Rover.tla` / `Rover.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).

The spec models the code as of 2026-11-04 16:50:
- `tools/mongole-rover/components/rover-game.tsx` and `lib/rover.ts`, unchanged during this work;
- `shared/kids-kit.tsx` at commit **23fd7c1**.

**Results:** TLC reached 288 states and 1053 steps. The chart has 13 states and 30 arrows. **9 rules hold and 2 break** (counts include TypeOK, NoDeadlock and the two action properties).

The shared parent gate is modelled once, in `../chhaya-melao/KidsGate.tla`; see that README.

## Systems modelled
- **Play phase:** no arrows → planning → run starting → rover driving → bump (back to planning with the bad block lit) or the last rock → won → পরের লেভেল, আবার খেলো or শেষ (idle). The model has 2 levels and 2 rover steps per run. A plan is empty, bad, long (1 star) or shortest (3 stars).
- **Away:** there is no blur, visibility or pause handler, so away is one flag.
- **Input:** চালাও and থামাও are the two arms of one JSX ternary in the same slot, so React keeps one `<button>`. The button under your finger, and in focus, turns into থামাও the moment the run starts (`spot`).
- **Time:** the step timeouts (520 ms, or 850 in slow mode, after a 300 ms lead) and the final win or stop timeout.
- **Sound:** one-shot sounds only (start chirp, motor, rock chime, bump, win or level-up with confetti). There are no loops.
- **Levels and stars:** `levels.record` and `unlockedLevel`; the সব লেভেল drawer, which is live while planning, running and on the won screen; the idle LevelGrid.
- **Kids' limit:** `atBreak()` on a win; the past-the-limit mount check; RestScreen as a modal; a grown-up's "আরও ১০ মিনিট"; reload.

Not modelled:
- `#og`.
- The loop block's counts (`repeatLast`) and the hint path after 3 misses (pure functions with tests).
- SpeakButton, which appears only when the phone has a Bangla voice.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | The rover doesn't drive, and the level doesn't end, while you look away. | **breaks** |
| OneTapOneRun | One tap on চালাও is one run: a quick second tap, or Enter on the focused button, never cancels it before it moves. | **breaks** |
| NoDoubleResult | A level is won and recorded once per try. | holds |
| RestOnlyAtBreak | The rest screen is only over a won level, the idle screen or an untouched level. | holds (broke on the earlier kit) |
| RestStaysUntilAGrownUp | After the rest screen, no run starts until a grown-up gives more time. | holds (broke on the earlier kit) |
| NoNetwork / NoChildData | Nothing is sent; only stars and play time are written. | holds (live: no `fetch`, XHR or beacon, and no new resource requests after load in a full 12-level run) |
| StarsNeverDrop / UnlockNeverShrinks | Best stars only go up; unlocked levels never close. | hold |

**Key held through the round's end:** the result has no key path. On a win the board and buttons unmount and focus falls to `<body>`. A held Enter on চালাও doesn't skip the result; it toggles the run on and off (bug 2).

## Bugs (current code)

### 1. OneTapOneRun: "I tapped চালাও twice, like I always do, and the rover didn't move" (game)
- **Path:** 0 no arrows → 1 you add arrows → 2 you tap চালাও (the run starts and the button now says থামাও) → 3 you tap চালাও again quickly: back to planning, and the rover never moved.
- **Live replay (Orca, 10:2x):**
  - On level 1 I added → and tapped চালাও. The button read `থামাও`.
  - 150 ms later, `document.querySelector('.mr-go')` was **the same element** (`sameButtonElement: true`). A second tap on it called `halt()`.
  - The rover stayed at `translate(100%, 200%)` and 1.5 s later the level was still not won. One tap alone wins in about 0.8 s.
  - Because focus stays on that one button, Enter (or a held Enter's auto-repeat) toggles run and stop the same way.
- **Fix:** give থামাও its own place, or a `key`, so it is a different element. Ignore a second tap on the same spot for about 400 ms after চালাও. Blur the button when the run starts. **Game.** The "same slot changes meaning" pattern is worth a lint check across games.

### 2. NoProgressWhileAway: "I pressed চালাও and picked up my mum's call; when I came back the level was done and I'd missed the rover's drive" (game)
- **Path:** 0 → 1 you add arrows → 2 you tap চালাও → 3 you look away → 4 the rover moves a square. It goes on to the last rock and the won screen.
- **Live replay (Orca, 16:4x; blur and `visibilitychange` dispatched; the game listens to neither):**
  - With the level key cleared, I added → on level 1, tapped চালাও and went away at once (`hasFocus` false in the replays).
  - 1.5 s later, still away, `.mr-done` showed, `ektukhani-levels-mongole-rover` was `{"1":3}`, and 7 oscillator starts (motor, rock chime, win) had played to an empty room.
  - On level 3 (→ ↑ ↑) the rover went from `translate(100%,300%)` to `translate(200%,200%)` within 0.9 s of going away, and won by 2.5 s.
- **Fix:** keep the step timers as a run that can pause. On blur or hide, stop scheduling, remember the next step, and resume on return. Or let the shared player's away hook pause it. **Shared pattern** (all three of my games advance their timers while away).

## Found on the earlier kit, fixed by f4f75be and 23fd7c1
- **RestOnlyAtBreak:** "behind the rest screen I built a plan and drove the rover."
  - **Then (10:2x):** after winning level 2 with the rest screen up, Tab reached ধীরে, শব্দ, the Mars fact, পরের লেভেল, আবার খেলো, শেষ and আব্বু-আম্মুকে দেখাও, then "সব লেভেল". Enter opened the drawer, and Tab and Enter on লেভেল ৩ opened level 3 under the rest screen (`rest:true, board:true`).
  - I then built ↑ ↑ → by keyboard and pressed Enter on চালাও. The run went ahead behind the rest screen and bumped the crater ("এখানে গর্ত! …", rover at `translate(100%,300%)`).
  - **Now:** the same keys, focus and clicks are blocked by the modal (re-checked on দাঁড়িপাল্লা with the same kit). **Holds.**
- **RestStaysUntilAGrownUp:**
  - **Then:** after a dev-server reload with today's time already over the limit, the page opened on level 2 with no rest screen. I won it (↑ →) before the rest screen came back.
  - **Now:** past the limit, the page opens on the rest screen. **Holds.**

## Quality-bar gaps (game-quality-bar), played end to end in Orca (an in-page BFS autopilot played all 12 levels)
1. **Story (§3):** the skill names this game as one that should have a 2–4 panel intro ("why is the rover on Mars, what are the rocks"). There's none.
2. **Pause and away (§7):** there's no pause, and a run drives on while you're away (bug 2). There's no P or Esc.
3. **Controls:** চালাও and থামাও share one spot (bug 1). On a desktop, the arrow keys don't add arrows, although the game is all about arrows.
4. **Rest at a break:** `atBreak()` runs only on a win. A child stuck on a hard level who fails run after run never reaches a rest. A failed run is also a natural break, so call it in `stopped()` too.
5. **Pacing (§9):** good. One new idea per stage (short plans, long plans, several rocks, loops, fewest blocks). Optimal play of levels 2–12 took about 60 s in all: 1.7 s for level 2, 10 s for level 12. There's no named finale at level 12 beyond confetti.
6. **Ending (§10):** good. Stars, "৬ ব্লকের প্ল্যানে সব পাথর তোলা হলো", an exact method line ("সবচেয়ে ছোট প্ল্যানটা ৫ ব্লকের। খুঁজে দেখবে?") and a Mars fact with its source.
7. **HUD (§5):** the level and rock count sit top-left and top-right, and the board stays clear. That's good. The plan strip and the pad push চালাও below the board, and on a 412 px phone they still fit.
8. **Sound (§11):** a chirp, motor, rock chime, bump and win. The game works on mute.

## Screenshots
- `.shots/mongole-rover-first.png`: the first screen, with the ghost finger on →.
- `.shots/mongole-rover-won12.png`: level 12 won, 2 stars, the method line and the Mars fact.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/mongole-rover/Rover.tla --view ai_docs/statecharts/mongole-rover/view.ts --out ai_docs/statecharts/mongole-rover/before-fix
rm -f ai_docs/statecharts/mongole-rover/before-fix/tlc*.out
```
The `--out` folder must be new or empty. `Rover.cfg` has `CONSTRAINT Explore`: it stops past a broken history rule, and explores level 2 only with an empty or shortest plan, to stay under 500 states. After the fixes:
- remove `YouTapTheSameSpotAgain`, or make it a no-op;
- gate `TheRoverMoves`, `TheRoverStops` and `TheRoverWins` on `~away`;
- re-run into `after-fix/`.
