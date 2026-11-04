# ঝালমুড়ি সাপ: statechart (before the rewrite)

Model: `Snake.tla` / `Snake.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
Mirrors `tools/jhalmuri-sap/components/snake-game.tsx` (`start`, `pause`, `resume`, `restart`, `choose`, `press`, `side`, `finish`, `tick`, the `visibilitychange`, `hashchange` and in-view effects, the keydown handler) and `shared/game-kit.ts` (`useGameLoop` at commit a5fb4f1: stops on a hidden tab, not on blur).
TLC: 264 states, 1210 steps. The chart draws 16 states and 36 arrows as parallel regions.

**Note, code in flux:** while this ran, another agent wrapped the page in the new shared game player (`shared/game-player*.tsx`, `useGamePlayer({ onPause, onResume, onRestart })` added to `snake-game.tsx` at 09:23) and changed `useGameLoop` to stop on blur (09:36). The model is of the game's own handlers; the live replays below ran between 09:29 and 09:34 against what the dev server served then. Re-run the model once the player lands: it should fix bug 1 if its blur pause reaches `pause()`, and bug 2 only if it also pauses a run that *starts* while the stage is already off-screen (see the fix note).

## Systems modelled
| Region | Values | Code |
|---|---|---|
| Game | Ready screen, Snake moving, Paused, Card shows | `phaseRef`, `go()` |
| Window | on the page, another window has focus, tab hidden | `visibilitychange` → `pause()`; **no `blur` listener** |
| Board | on screen, scrolled away | `useInView(board)` (IntersectionObserver, threshold 0.15) → `pause()` only when it *changes* to false |
| Guard | card buttons wait 0.7 s, ready | `setRestartReady(false)` + `setTimeout(…, 700)` in `finish()` |
| Celebration | queued, nothing queued | the `window.setTimeout` in `finish()` (0.15–1.1 s, never cleared) |
| Link | none, friend's ঠোঙা on the board, friend's level with another ঠোঙা, another level | `hashchange` → `readFriend()`, `restart()`, `choose()` |

Turns are discrete (swipe, key, tap), so nothing is ever "held"; the snake moves on its own every step. Left out: the snake's rules and level ladder (pure, covered by `tests/snake.test.ts`, `tests/levels.test.ts`), sound (no loops, only one-shots), stars and best (`recordLevel` keeps the max). Timing fact built into the model: a run can't end within 0.7 s of the previous crash (the fastest crash after a start is about 0.6 s of moves, plus picking and starting), so the old card's 0.7 s timer, which is never cleared either, has always fired before a new card appears. An earlier run without that fact flagged a stale guard; it can't happen at human speed, so it is not a bug.

## Rules (plain words)
- **PausedWhenHidden** (holds): the snake never moves while the tab is hidden.
- **PausedWhenBlurred** (breaks): the snake never moves while another window has focus.
- **PausedWhenScrolledAway** (breaks): the snake never moves while the board is scrolled off the screen.
- **CelebrationOnItsOwnCard** (breaks): the stars' notes, confetti or win sound only play while their own card shows.
- **ReplayIsExact** (holds): when the friend's level is picked, the friend's ঠোঙা is on the board.

## Bugs
### 1. PausedWhenBlurred: "I clicked into another window and when I came back the snake had already crashed."
Shared bug (kalbaishakhi, dudh; same family as antenna's DialStillWhileAway).
- Path (report): ready → শুরু করো → you click into another window.
- Live replay (Orca, own tab): level 1, শুরু করো at head (5, 11) → `blur` → 3 s later: **11 moves, head (5, 0), crashed into the top fence**, card "ঝাল লেগে গেল!", while the window was still away.
- Fix (shared): pause on `window` `blur` like on hide (`window.addEventListener("blur", pause)` next to the `visibilitychange` listener), or let the shared player's blur pause call `pause()`.

### 2. PausedWhenScrolledAway: "I scrolled down to the buttons, pressed আরেকবার, and the snake ran and crashed off-screen."
Game-specific (the in-view effect only reacts to a *change*; a run started while the board is already off-screen never pauses).
- Path (report): you scroll the board away → you press শুরু করো → Snake moving, board scrolled away. The live path uses the card's আরেকবার, which sits just under the board.
- Live replay: crash, wait 0.8 s, scroll so **9%** of the board shows (under the 15% threshold) and the controls sit at the top of the screen → press আরেকবার → `playing`, still 9% visible → 1.5 s later 2 moves → **4.1 s later crashed (11 moves)** with no pause. The turn buttons that replace আরেকবার are on screen, so a player steers blind.
- Fix: in `start()`, `resume()` and `restart()`, refuse to run (or pause straight away) when `boardInView` is false, and scroll the board into view first (`board.current.scrollIntoView({ block: "center" })`), as `choose()` already does.

### 3. CelebrationOnItsOwnCard: "I pressed পরের লেভেল as soon as it lit up, and the clear chime played over my new run."
Shared pattern (kalbaishakhi, dudh).
- Path (report): শুরু করো → the run ends with stars → you pick another level or ক্লাসিক (celebration still queued). The more common path in play: the card's buttons unlock at 0.7 s, the celebration fires at 1.1 s, so any press of আবার খেলো / পরের লেভেল in between carries it into the next run.
- Live replay: level 1 cleared (5 bites, 59 moves, 1 star) at +0 ms → পরের লেভেল at **+764 ms** (enabled) → level 2 playing → at **+1101 ms** two oscillators (`sfx.good`) during level 2's run. With three stars or a new classic best it is `sfx.levelUp`/`sfx.win` plus confetti.
- Fix: keep both timer ids (the celebration and the 0.7 s guard) and clear them in `reset()`; or raise the guard to 1.2 s so the celebration always plays on its own card.

## Quality-bar gaps (played end to end in Orca; `.shots/jhalmuri-sap-ready.png`, `-play.png`, `-card.png`; the bot cleared levels 1 and 2 with ★★★ on level 2, 150 points)
1. **First screen:** before the player wrapper, the start action was a plain শুরু করো in a note on the board; the mode chips (লেভেল / ক্লাসিক) don't say what each changes ("যত খুশি লম্বা হও" shows only once chosen).
2. **Story:** the bar names ঝালমুড়ি সাপ for an optional 2–4 panel intro (the ঝালমুড়িওয়ালা, the ঠোঙা); there is none.
3. **Choices:** the level list is a collapsed `<details>` ("সব লেভেল"), unnumbered beyond the digits, no one-line effect per level (walls from level 3 are only in the paragraph), no default marked.
4. **Pause:** the game's own pause is "থেমে আছে। তৈরি হলে চাপো।" + চালিয়ে যাও only; the shared player's menu is being added. Blur and a run started off-screen don't pause (bugs 1, 2).
5. **Danger:** nothing at the edge when the head is one cell from a wall or the tail; the crash is the first warning.
6. **HUD:** score, খাওয়া and সোনালি sit in a row above the board (good); the `+১০` / `গতি` floats appear at the head, in the middle of the play area (small, but the bar says no labels over play).
7. **Sound:** three one-shots plus the combo climb; no signature tune and nothing changes between levels or speeds.
8. **End:** good: real stats, stars, the line about chillies, near-miss, friend compare, card and seeded link; the 0.7 s guard against crash taps works (but see bug 3).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/jhalmuri-sap/Snake.tla --view ai_docs/statecharts/jhalmuri-sap/view.ts --out ai_docs/statecharts/jhalmuri-sap/<new-folder>
```
After the fix, update the spec to the fixed code (including the shared player) and run into `after-fix/`; every rule must hold.
