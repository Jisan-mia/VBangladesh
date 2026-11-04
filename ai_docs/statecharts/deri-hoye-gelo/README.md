# দেরি হয়ে গেল: statechart before the rewrite

The model is `Late.tla` with `Late.cfg` and `view.ts`. It mirrors `tools/deri-hoye-gelo/components/late-game.tsx` and `tools/deri-hoye-gelo/lib/road.ts` as they are on `games-to-the-bar`. The report and chart are in `before-fix/`. No code was changed.

TLC reached 364 states. Six of the eight rules break. The chart (`before-fix/chart.mmd`) draws 12 states and 26 arrows. It hides arrows that repeat ones already drawn (pausing from the ducking states, the resets, and picking a day).

## Systems modelled
- **Play phase:** ready → playing ⇄ paused → over (a bump, or a day's gate).
- **Pause and focus:** P, Esc or থামাও, the tab hidden or shown (it pauses and lets go), the window focused or blurred, and চালিয়ে যাও.
- **Input:** the physical key (Space to jump, ↓ to duck) against what the run thinks is held (`duckHeld`). Also the keyup, and a Space held since before the bump.
- **The result:** the 600 ms before আরেকবার takes focus (one "settled" moment stands for both the 450 ms and 600 ms guards), and the click a Space keyup gives the focused button.
- **Time:** the setTimeout in `finish()` that plays the bell notes, `levelUp` or `win`, and confetti 500 ms or 1500 ms later.
- **Links:** the day and road on screen (`day` state, set by a friend's link or the day grid) against the day and road being run (`run.current`, fixed by `start()`).
- **Left out:** the jump flag (held, it only floats one jump 0.2 s longer), the pointer and the on-screen buttons (they set the same flags, and `pointercancel` lets go), slow mode, the 0.7 s resume grace, sound (no loops), and saved stars (`recordLevel` keeps the max; the migration writes only when the levels key is missing).

## Rules
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hide the tab mid-run and the run pauses. | holds |
| PausedWhenBlurred | Click into another window mid-run and the run pauses. | **breaks** |
| InputReleasedWhenAway | Once you leave the page, the kid isn't held down. | **breaks** |
| InputMatchesHand | The kid ducks only while you hold ↓. | **breaks** |
| ResultStaysUntilYouChoose | The result stays until you make a fresh choice. | **breaks** |
| NoDoubleResult | A run ends once (the `finished` ref). | holds |
| CelebrationOnlyOnResult | The bell, stars and confetti play only on the result. | **breaks** |
| ReplayIsExact | The road you run is the one on screen: yours, or your friend's under their banner. | **breaks** |

## Bugs

### 1. PausedWhenBlurred, InputReleasedWhenAway and InputMatchesHand: "I held ↓, clicked another window, and the kid ran on, ducked, into a puddle" (shared)
- **Path:** (0) ready → (1) you press Space: running → (2) you let go → (3) you hold ↓: ducking → (4) you click into another window: running ducked while you're away. Come back and the kid is still ducked with no key held. PausedWhenBlurred breaks one step sooner: (0) ready → (1) you press Space → (2) you click into another window.
- **Why:** there is no `blur` handler. The ↓ keyup goes to the other window, so `run.duckHeld` stays true, and `useGameLoop` keeps stepping the run. Only `visibilitychange` calls `pause()`.
- **Live replay:** Space started the run (2 m). Hold ↓: `duckHeld` and `ducking` true. Window `blur`: the phase was still `playing`, and `duckHeld` stayed true for all 10 s of polling. The run then ended on its own at 24 m in the first puddle (`hitKind` 0, "ছপাৎ! জুতা-মোজা কাদায় মাখামাখি।") with nobody there. (The Orca tab was a background tab at about 2 frames a second, so time ran slowly, but it ran.)
- **Fix:** on `blur`, call `pause()`, which already does `letGo()`. This is the shared blur fix.

### 2. ResultStaysUntilYouChoose: "I held Space as I bumped, let go a second later, and a new run had already started" (shared)
- **Path:** (0) ready → (1) you press Space: running → (2) the kid bumps into something: the result → (3) আরেকবার takes focus → (4) you let go: a new run starts by itself.
- **Why:** 600 ms after the bump, `again.current.focus()` moves focus to আরেকবার while Space is still down. The keyboard's auto-repeat then sends Space keydowns to the button. The window handler skips them (focus isn't on the body), so on keyup the browser clicks the button and `restart()` runs. The 450 ms guard has passed by then.
- **Live replay (trusted keys from `orca exec "keydown ' '"`):** Space down on the body started the run. The kid bumped at 24 m, and 1.5 s later focus was on `kit-primary dh-again`. A second Space keydown (what auto-repeat sends) landed on the button, then Space up, and the phase went `over → playing`: the result was gone and a new run was going. A control run with no second keydown didn't restart, since Chrome clicks a button on Space-up only if a Space keydown reached it. A real held key always gets there, because auto-repeat starts at about 0.5 s.
- **Fix:** don't move focus to আরেকবার while a key is still down. Better, accept the result's keys only from a fresh keydown made after the result appeared, through the shared result guard.

### 3. CelebrationOnlyOnResult: "The win fanfare and confetti went off in the middle of my next run" (shared)
- **Path:** (0) ready → (1) you press Space → (2) the kid reaches the gate: the result → (3) you let go → (4) you open a friend's link: the ready screen, with the old confetti still to come. The same happens when you press আরেকবার or পরের দিন soon after.
- **Why:** `finish()` calls `window.setTimeout(…, stars ? 1500 : 500)` and drops the id. `start()` and `choose()` don't clear it. `restart()` and `primary()` allow a new run from 450 ms, so a day cleared with stars leaves about a second (450–1500 ms) where the celebration lands on the next run.
- **Live replay:** on the endless road with no stored best, the first run ended at 24 m (`এই ফোনে নতুন রেকর্ড!`). আরেকবার was pressed 480 ms later and the new run started. 487 ms after the result, the confetti canvas appeared with the phase `playing`, together with `sfx.win()`.
- **Fix:** keep the timer id and clear it in `start()`, `choose()`, `readFriend()` and on unmount. This is the shared `later()` helper.

### 4. ReplayIsExact: "I opened my friend's link mid-run; the banner and the gate changed, but I was still on my own road" (game)
- **Path:** (0) ready → (1) you press Space: running → (2) you let go → (3) you open a friend's link: your road under the friend's banner.
- **Why:** `readFriend()` sets the friend, `setDay(shared.day)` and the kid, but keeps the phase while playing. The run in `run.current` stays yours, yet the HUD and `drawScene(…, gateOf(day))` now use the friend's day.
- **Live replay:** a Saturday run (`শনিবার · ৩০০ মিটারে গেট`, seed 361323359, `run.gateM` 300). Set the hash to `#s=4242&t=250&l=2&n=rafi`. The top line now reads `রবিবার · ৪০০ মিটারে গেট`, the friend banner shows, and the canvas badge reads `গেট ৩৮৯ মি` at 11 m. The run is still seed 361323359 with its gate at 300 m, so it will end 89 m before the gate on screen. Screenshot: `.shots/deri-hoye-gelo-friend-banner-mid-run.png`.
- **Fix:** when a link arrives mid-run, pause and ask before switching, or end the run and show the ready screen for the friend's day. Never change `day` under a run.

## Quality-bar gaps (from a play in Orca)
1. **Pause:** P, Esc, থামাও and hiding the tab all pause, but blur doesn't (bug 1). The pause screen is a dim overlay with one button, not a menu (no নতুন করে শুরু, কীভাবে খেলবে, শব্দ or ধীরে খেলো).
2. **Leaving the result:** a held Space restarts on release (bug 2), and the celebration can land on the next run (bug 3).
3. **First screen:** the ready overlay (চাপ দিলে লাফ, শুরু করো) is inside the stage, which is good. The H1, and on a friend's link the challenge card, sit above it and push the stage down on a phone.
4. **HUD (good):** meters, pages and the distance to the gate are small badges in the canvas corners, and the middle stays clear.
5. **Danger:** obstacles show only as themselves. Nothing at the edge warns about something fast coming in at the higher speeds of বুধবার and বৃহস্পতিবার.
6. **Choices:** the day grid and the endless road are hidden in a `<details>` with no numbering. After a cleared day, পরের দিন is the primary button, which is right.
7. **Pacing (good):** each day adds one obstacle (bike, cow, branch) and then speed. বৃহস্পতিবার is the end of the week, but the gate isn't a named finale.
8. **Sound (good):** footsteps, hop, landing, splash, bump, tiffin, a page with a rising note, and the school bell as the signature. All are one-shots, and it works on mute.

Screenshot: `.shots/deri-hoye-gelo-friend-banner-mid-run.png` (desktop, mid-run, after the friend's link: Sunday's banner and `গেট ৩৮৯ মি` over a Saturday road).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/deri-hoye-gelo/Late.tla --view ai_docs/statecharts/deri-hoye-gelo/view.ts --out ai_docs/statecharts/deri-hoye-gelo/before-fix
rm ai_docs/statecharts/deri-hoye-gelo/before-fix/tlc*.out
```
After the fixes, update the spec to the new code and run into a fresh `after-fix/`. Every rule must hold there.
