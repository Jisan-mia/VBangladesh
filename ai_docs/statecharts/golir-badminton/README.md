# গলির ব্যাডমিন্টন: statechart (before the rewrite)

Model: `Badminton.tla`, `Badminton.cfg` and `view.ts`. It mirrors `tools/golir-badminton/components/badminton-game.tsx`: `begin`, `raise`, `hit`, `keys.down`/`keys.up`, `onPointerDown`/`Up`/`Cancel`, `resume`, `startLevel`/`pickLevel`, `finish`, the `windLoop` in `tick`, the `!looping` effect, the `visibilitychange` handler `hide` and the `SoundToggle` `onChange`. It also mirrors `useGameLoop` in `shared/game-kit.ts`. That is the **working copy**: blur cancels the frame and sets `away`, focus clears it, and each remount of the loop effect starts with `away = false`.
Run: `before-fix/report.md` and `before-fix/chart.mmd`. TLC found 268 states. The chart has 16 states and 42 arrows.

## Systems modelled
- **Play phase:** first screen → match → result (won or lost), with "paused" on top. The model uses a wind night (levels 2, 5, 8, 11 and 14), because only those nights have a loop. A point that does not end the match changes nothing in the model, so only the match point is an action.
- **Pause and focus:** tab visible or hidden; window focused or blurred; the `away` flag in `useGameLoop`; the "খেলা থেমে আছে" overlay; resume with the button or Space/Enter/↑.
- **Input:** the raised racket (`live.cocked`). It goes up on pointerdown or keydown and swings on pointerup or keyup. Only hide and pointercancel clear it.
- **Scrolling:** the board's `useInView`. `looping = !paused && phase === "play" && boardInView`, so a scroll remounts the loop effect. A trackpad or wheel scrolls a background window without focusing it, so the model lets you scroll while away.
- **Sound:** the wind loop (`none`, a silent `stub`, or `real`) and the site-wide switch.
- **Results:** the result screen, a "fresh" moment just after it appears, and the Space/Enter/↑ handler on the result.
- **Not modelled:** saved stars (`useLevels.record` keeps the max, and game-core tests cover it); friend links (`readFriend` → `startLevel(level, seed, false)`; "আরেকবার" keeps the friend's seed); the sigh and confetti (one-shot sounds that `finish` starts once).

## Rules (each is an INVARIANT)
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | The match clock moves only while you are on the page. | **breaks** |
| InputReleasedWhenAway | After you click away, the game doesn't think your racket is still up. | **breaks** |
| PausedWhenHidden | A match in play is paused while the tab is hidden. | holds |
| PausedWhenBlurred | A match in play is paused while another window has focus. | **breaks** |
| PauseOnlyMidMatch | "খেলা থেমে আছে" shows only in a match that has started. | **breaks** |
| LoopOnlyWhenMeaningful | The wind is heard only while the match runs in front of you. | **breaks** |
| LoopComesBack | With sound on, the wind is never stuck as a silent stub. | holds |
| NoTapPastResult | A key that lands as the result appears does not throw the result away. | **breaks** |
| NoDeadlock | You can always do something. | holds |

## Bugs
The live replays ran in Orca (page `golir-badminton#s=12345&t=2&r=5&l=2`, a friend link that opens level 2, a wind night). State was read from the component's own `live` object through the React fiber. Audio was counted by wrapping `AudioBufferSourceNode.prototype.start/stop`. Orca pins `document.hidden`, so the hide replay ran in headless Chrome over CDP, with the same steps.

### 1. LoopOnlyWhenMeaningful: "I clicked into another window and the wind kept howling."
- **Path** (report, LoopOnlyWhenMeaningful): 1 you pick a level, 2 the next shuttle flies (the wind loop opens), 3 you click into another window.
- **Cause:** blur reaches only `useGameLoop`, which cancels the frame. `looping` stays true, so the `!looping` effect never calls `stopWind()`. The loop keeps sounding at its last level.
- **Live replay:** wind loop `6hybj` started. After the blur, the clock stayed at 2.35 for 2.5 s, but there were **0 loop stops** during that time. `live.wind` was still set and no overlay showed.
- **Fix (shared):** treat blur like hide. Stop every loop, release input and pause. The cleanest home is the shared game player, or an `onAway` callback on `useGameLoop` that every game passes its own hide handler to.

### 2. PausedWhenBlurred: "I came back to the window and the shuttle was already on me. There was no pause screen."
- **Path** (report, PausedWhenBlurred): 1 you pick a level, 2 you click into another window. The match is in play and not paused. Focus resumes it at once.
- **Cause:** `useGameLoop` freezes the clock on blur and restarts it on focus. The game shows no pause and never asks.
- **Live replay:** the shuttle was in flight towards you at clock 2.35, score 0–0. After blur and 2.5 s away the clock was still 2.35. **1.5 s after focus** the clock read 3.37 and the score was **0–1**. The point was lost while you found the window again. The click that brings the window back also lands on the court as pointerdown/up, so it raises and swings the racket.
- **Fix (shared):** on blur, set `paused` and show the overlay. The same `onAway` as bug 1 does this.

### 3. NoProgressWhileAway: "I scrolled the page while another window was in front, and the game played on without me."
- **Path** (report, NoProgressWhileAway): 1 the court scrolls off screen, 2 you pick a level, 3 you click into another window, 4 the court scrolls back. The window is still away and the shuttle is moving.
- **Cause:** `boardInView` is part of `looping`. A scroll out and back unmounts and remounts the `useGameLoop` effect, and the new effect starts with `away = false` while the window has no focus. macOS and Windows both scroll a background window under the pointer.
- **Live replay:** after the blur the clock stayed at 2.87 (score 0–1) for 1 s and while the court was off screen. Then the court scrolled back with **no focus event**. 3 s later the clock read **6.03** (from 3.03) and the score was **0–2**.
- **Fix (shared):** in `useGameLoop`, start `away` from `!document.hasFocus()` at mount, not `false`. Keep the blur state outside the effect (a module-level or ref flag) so remounts don't reset it. Add a node test: blur, change `running` false → true, and assert that no step runs.

### 4. InputReleasedWhenAway: "I alt-tabbed while holding Space, and when I came back the racket was still up."
- **Path** (report, InputReleasedWhenAway): 1 you pick a level, 2 you press and hold, 3 you click into another window.
- **Cause:** only `hide` and `pointercancel` clear `live.cocked`. The keyup never reaches the page after a blur.
- **Live replay:** after Space keydown, `cocked` was true. After the blur, the 2.5 s away and the focus, `cocked` was **still true** 1.5 s later. The racket is drawn raised, and the next stray pointerup on the court swings.
- **Fix (shared pattern, game code):** clear `cocked` in the same away handler as bugs 1–2.

### 5. NoTapPastResult: "I swung a beat too late at match point, the loss screen flashed, and a new match had already started."
- **Path** (report, NoTapPastResult): 1 you pick a level, 2 someone reaches five points, 3 you press Space while the result has just appeared.
- **Cause:** `keys.down` sends Space/Enter/↑ on the result straight to `startLevel` (won → the next level, lost → the same level), with no settle time. Space is also the swing key, so a late swing that lands just after the last point skips the screen. The loss screen holds the only "longest rally on this phone" note.
- **Live replay:** a match at 0–3 with the shuttle in flight. Set to 0–4, then the opponent scored. "ভাইয়া জিতল ৫–০" appeared, and a Space keydown came **150 ms** later. 450 ms after the result appeared, the loss screen was gone, the score was 0–0 and the button read "মারো". A new match was running.
- **Fix (shared):** use one result guard (for example `useSettle()` in `shared/game-kit.ts`, as chor-police needs too). Ignore Space/Enter/↑ on the result for about 600 ms, or until the key has been released once after the result appeared. Add a node test: done → an immediate keydown is a no-op.

### 6. PauseOnlyMidMatch: "I switched tabs before I started, and when I came back the first screen said the game was paused."
- **Path** (report, PauseOnlyMidMatch): 1 you hide the tab, on the first screen.
- **Cause:** `hide` pauses whenever `live.game.phase !== "done"`, and the rally's phase is `"gap"` on the first screen too.
- **Replay (headless Chrome, CDP):** first screen: no overlay, the button "শুরু করো" enabled. After hide: the overlay "খেলা থেমে আছে। চালিয়ে যাও", and **"শুরু করো" disabled**. After show and focus, both were unchanged. You need two taps to start (`.shots/golir-badminton-sc-paused-first.png`).
- **Fix (game):** in `hide`, pause only when `phase === "play"` (React state, through a ref).

## Quality-bar gaps (played end to end in Orca: level 1 won 5–0 by autopilot, a level 2 wind night lost, the card)
1. **No pause menu:** there is no P or Esc and no pause button. Only hiding the tab pauses (and blur, after the fix). The bar wants P, Esc, a button and the shared menu (চালিয়ে যাও, নতুন করে শুরু, কীভাবে খেলবে, শব্দ, ধীরে খেলো, সব লেভেল).
2. **Words above the game:** the H1 ("বাল্বের নিচে পাড়ার চ্যাম্পিয়নকে হারাতে পারবে?") and the level line sit above the court. "শুরু করো" sits under the court at y≈755 of 923 on a Pixel 9 (`.shots/golir-badminton-sc-first.png`). The start isn't the biggest thing, though tapping the court also starts.
3. **Level 1 is too easy, and the first rallies are one hit long:** 5 perfect smashes won 5–0 in under 30 s, each point a single hit, because the bot rarely returns a smash at skill 0.35. After one lost match (best saved as 0), the win screen read "নতুন রেকর্ড: এক র‍্যালিতে ১ বার!", which celebrates a 1-hit rally. Teach the rally (long, easy returns) before the smash ends points.
4. **Choices:** the night type (শান্ত, বাতাস, কুয়াশা) is shown only as a line above the court. "পরের লেভেল" doesn't say what changes ("বাতাসে শাটল বেঁকে যাবে"). The level picker is a closed drawer.
5. **HUD:** the scoreboard bar is good and sits in a corner strip. But the call text ("ভাইয়া জালে মারল। পয়েন্ট তোমার।") is a banner at the top centre of the court during play (`.shots/golir-badminton-sc-play.png`).
6. **Danger:** match point has no edge cue. A lost point gives a neighbour's "আহা" at a window and a scoreboard shake, which is charming but small.
7. **Ending:** stars, the score line and a personal card are good (`.shots/golir-badminton-sc-won.png`, `-card.png`). A stray Space throws it away (bug 5). The loss screen has no "how close" line beyond the tip.
8. **Sound:** the ping, the far ping, the swish, the net flap, the sigh and the wind loop are distinct and meaningful. There is no music, and the wind leaks on blur (bug 1).

Screenshots: `.shots/golir-badminton-sc-first.png` (first screen, Pixel 9), `-play.png` (a point in play, the call banner over the court), `-won.png` (3 stars, 5–0), `-card.png` (the share card), `-paused-first.png` (the first screen paused after a hide, headless Chrome).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/golir-badminton/Badminton.tla --view ai_docs/statecharts/golir-badminton/view.ts --out ai_docs/statecharts/golir-badminton/after-fix
rm ai_docs/statecharts/golir-badminton/after-fix/tlc*.out
```
The chart hides the sound switch, and "you pick a level or play again" during a match. The model and the report keep both.
