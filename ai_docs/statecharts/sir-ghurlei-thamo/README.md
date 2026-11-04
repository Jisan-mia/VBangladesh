# স্যার ঘুরলেই থামো: statechart before the rewrite

The model is `Chit.tla` with `Chit.cfg` and `view.ts`. It mirrors `tools/sir-ghurlei-thamo/components/chit-game.tsx` and `tools/sir-ghurlei-thamo/lib/game.ts` as they are on `games-to-the-bar`. The report and chart are in `before-fix/`. No code was changed.

TLC reached 456 states. Six of the nine rules break. The chart (`before-fix/chart.mmd`) draws 12 states and 22 arrows. It hides arrows that repeat ones already drawn (the teacher turning back, coming back to the window from the "still" states, and the resets).

## Systems modelled
- **Play phase:** ready → playing → over (the result). The chit reaching the last bench is one step; the bench count is left out.
- **The teacher:** at the board or facing the class. A held chit under a look is caught: the scolding, then back to the board. In one-tap mode the catch also lets go of the chit.
- **Pause and focus:** the tab hidden or shown (it pauses and lets go), the window focused or blurred (it lets go in hold mode only), and চালিয়ে যাও.
- **Input:** Enter as the pass key (Space and ↓ act the same during play, but only Enter acts on the result), its keyup, the keyboard's auto-repeat, and hold mode against one-tap mode (চেপে না ধরে খেলো).
- **Sound:** the chit's `loop("hum")`, made inside `press()`, against the site-wide switch (`setSoundOn` and `SoundToggle onChange={stopHum}`).
- **Time:** the setTimeout in `finish()` that plays the win sound or `levelUp` with confetti (or `good`) 300 + 260 ms × stars later.
- **Links:** a friend's link read once on mount, and one that arrives later by hashchange.
- **Left out:** `needRelease` after a catch (it only stops the chit until you lift, and no rule reads it), slow mode, saved stars (`recordLevel` keeps the max; the migration runs once because it only writes when the levels key is missing), and the class grid (it calls the same `reset()` as আবার খেলো).

## Rules
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hide the tab mid-class and the class pauses. | holds |
| PausedWhenBlurred | Click into another window mid-class and the class pauses. | **breaks** |
| InputReleasedWhenAway | Once you leave the page, the chit isn't held. | **breaks** (one-tap mode) |
| LoopOnlyWhenMeaningful | The hum plays only in a running class with sound on. | holds |
| LoopComesBack | While the chit is held in a running class with sound on, the hum is there. | **breaks** |
| ResultStaysUntilYouChoose | The result stays until you make a fresh choice. | **breaks** |
| NoDoubleResult | A class ends once. | holds |
| CelebrationOnlyOnResult | The win sound and confetti play only on the result. | **breaks** |
| FriendLinkOpensTheirClass | A friend's link opened in this tab opens their class. | **breaks** |

## Bugs

### 1. PausedWhenBlurred: "I looked at another window and the clock kept counting; in one-tap mode the teacher caught my chit" (shared)
- **Path:** (0) ready → (1) you press Enter: passing the chit → (2) you click into another window: the clock runs while you're away. The one-tap path (InputReleasedWhenAway) is (0) ready → (1) you switch to one-tap → (2) you press Enter → (3) you click into another window: the chit is still moving while you're away.
- **Why:** the `blur` handler only lets go of the chit, and only in hold mode. Nothing pauses. `useGameLoop` keeps stepping, so `game.time` (your score) and the teacher's routine both go on. In one-tap mode the chit stays held, so it keeps moving into the teacher's look.
- **Live replay, hold mode:** hold Enter for 0.6 s: clock `০.৬`, status `write`. Window `blur`: the chit is let go (`held=false`) but there's no pause. 3 s later the clock reads `৩.৬` and the teacher has moved on to `tell`.
- **Live replay, one-tap mode:** tap Enter once (clock `০.৩`, held). Window `blur`. While away the chit went bench 1 → 2 (1.0 s) → 3 (2.4 s) → 4 (3.8 s). The teacher turned (`tell`, 3.4 s), looked (`look`, 4.4 s) and caught it at 4.8 s (`scold`, the stage shook). It slid back to bench 3.
- **Fix:** pause on blur in a running class. Let go in both modes (one-tap comes back "stopped"), and resume only from চালিয়ে যাও. This is the shared blur fix. The game also needs a pause control (see gaps).

### 2. ResultStaysUntilYouChoose: "I held Enter to the last bench and the result vanished into the next class" (shared)
- **Path:** (0) ready → (1) you press Enter: passing → (2) the chit reaches the last bench: the result → (3) the held key repeats: the result is skipped.
- **Why:** during play the keydown handler ignores `event.repeat`. On the result, though, `if (event.key === "Enter") again(nextLevel || level)` runs before that check, so the first auto-repeat of a held Enter calls `again()`.
- **Live replay:** an in-page autopilot held Enter while the teacher wrote and let go on `tell` or `look`. Class 1 was cleared at 14.87 s (`ক্লাস ১ পার! ★★★ ১৩.৯ সেকেন্ড`, Enter still held). The next repeat 21 ms later left the result. The page now showed `ক্লাস ২ · মাঝে মাঝে কাশি`, status `ready`.
- **Fix:** on the result, act only on a fresh keydown (`!event.repeat`) made after the result appeared, with a short guard. This is the shared result guard.

### 3. CelebrationOnlyOnResult: "Confetti fell on the next class's blackboard" (shared)
- **Path:** the same as bug 2 (the shortest path), or the result → you press পরের ক্লাস within about 1 s.
- **Why:** `finish()` calls `window.setTimeout(...)` and never keeps the id. `reset()` doesn't clear it, and neither does unmount.
- **Live replay:** in the run above, the confetti canvas was added at 15.89 s. That is 1.0 s after the result appeared (300 + 3 × 260 ms) and 1.0 s after class 2 had opened, so it fell on the ready screen (status `ready`), not on the result.
- **Fix:** keep the timer id. Clear it in `reset()` and on unmount, as ডাংগুলি does with `timers.current`. This is the shared `later()` helper.

### 4. LoopComesBack: "I turned the sound back on and the chit went quiet" (game)
- **Path:** (0) ready → (1) you turn sound off → (2) you switch to one-tap → (3) you press Enter → (4) you let go → (5) you turn sound on: the chit moves in silence. Another path: tap with sound on, then turn sound off and on again.
- **Why:** `SoundToggle onChange={stopHum}` drops the hum when sound goes on as well as off. The hum is made again only inside `press()` (`ear.current.hum ??= loop(...)`), so a chit already moving stays silent. In one-tap mode the next press stops the chit.
- **Live replay (sawtooth oscillators counted):** one-tap, tap Enter: chit moving, 1 hum playing. Sound off: 0. Sound on: 0. 1.5 s later the chit is on bench 2, status `write`, held, sound on, still 0 hums.
- **Fix:** `<SoundToggle onChange={on => { stopHum(); if (on && holding.current && phase === "playing") ear.current.hum = loop("hum", 150); }} />`, or start the hum from `listen()` when it's missing and sound is on.

### 5. FriendLinkOpensTheirClass: "I opened my friend's link and nothing changed" (game)
- **Path:** (0) ready → (1) you open a friend's link in this tab: the link is ignored.
- **Why:** the link is read once, in the mount effect (`parseShared(window.location.hash)`). Nothing listens for `hashchange`. Pasting a link into a tab that already has the game is a same-page navigation, so the page doesn't reload.
- **Live replay:** on `/sir-ghurlei-thamo` (class 1), set the hash to `#s=777&t=300&c=0&n=rafi`. 0.8 s later there was no banner and the page still showed `ক্লাস ১ · ধীরে ধীরে লেখা`. After a reload the banner appeared (`rafi ৩০.০ সেকেন্ডে…`) on `ক্লাস ৫ · রোজকার ক্লাস`.
- **Fix:** listen for `hashchange` like ডাংগুলি and দেরি হয়ে গেল do. Ignore in-page anchors (`#result`), and don't take over a class that's under way.

## Quality-bar gaps (from a play in Orca)
1. **Pause:** there's no pause control at all: no button, no P or Esc. Only hiding the tab pauses. Blur doesn't (bug 1).
2. **Leaving the result:** holding Enter skips it, and the confetti lands on the next class (bugs 2 and 3).
3. **Danger:** the teacher's turn shows only as a status line under the stage, footsteps and the drawing. There's no edge glow as the turn starts, which is when a held chit is in danger.
4. **First screen:** the big ধরে রাখো button and the classroom art are strong. The H1 and lead above the HUD push the stage down on a phone.
5. **Choices:** the class grid is hidden in a `<details>` with no numbering. পরের ক্লাস is the primary button after a clear, which is right.
6. **Pacing:** classes 1–5 each add one thing (a cough, a dropped chalk, a peek). From class 6 up, several numbers change at once (turn speed, peeks, look length, writing length), and the last class isn't a named "boss" moment.
7. **Sound:** chalk, footsteps, cough, chalk drop, the climbing hum, the catch, and a note per bench are good and meaningful. The hum goes silent after the switch (bug 4).
8. **Ending (good):** the result shows the time, stars, catches, the near miss, this class's best and the friend comparison. The card is personal.

Screenshot: `.shots/sir-ghurlei-thamo-first-screen.png` (phone first screen: the HUD, the classroom, ধরে রাখো).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/sir-ghurlei-thamo/Chit.tla --view ai_docs/statecharts/sir-ghurlei-thamo/view.ts --out ai_docs/statecharts/sir-ghurlei-thamo/before-fix
rm ai_docs/statecharts/sir-ghurlei-thamo/before-fix/tlc*.out
```
After the fixes, update the spec to the new code and run into a fresh `after-fix/`. Every rule must hold there.
