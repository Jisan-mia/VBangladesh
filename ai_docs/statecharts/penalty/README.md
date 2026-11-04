# পেনাল্টি কিক statechart (before the rewrite)

Spec: `Penalty.tla` / `Penalty.cfg` / `view.ts`. They mirror `tools/penalty/components/penalty-game.tsx`, `tools/penalty/lib/sound.ts` (`murmur()`), `shared/game-kit.ts` (`useGameLoop`) and `shared/game-sound.ts`. Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 294 states, and the chart draws 50 states and 136 arrows.

The page is **not** in the shared game player. Commit 6775639 landed during this run: `useGameLoop` now freezes on blur, and the model mirrors that. Two kicks (yours, then theirs) stand for the whole shoot-out.

## Systems modelled
- **Play phase:** `live.stage`: your aim → the ball flies → lands → their whistle (`ready`) → run-up (`run`) → flies → lands → decided. It also models React's `phase` ("play" until a render shows the card). `useGameLoop` runs several `tick()`s per frame (`while (carry >= STEP)`), all before React re-renders, so ticks can happen after `finish()` and before the card.
- **Pause and focus:** the tab is visible or hidden, and the window is focused or blurred. The only pause is `hide()` (when not aiming). There is **no pause button, no P/Esc and no blur pause**.
- **Input:** your finger on the board (`live.pointer`), and Space held during their run-up (`pickSide(1)`).
- **Sound:** `live.hum` (the crowd murmur): none, a real loop, or a silent stub made while muted that `live.hum ??= murmur()` then keeps. The SoundToggle only clears it on off.
- **Choices:** the সব ম্যাচ drawer, picking a match, আবার খেলো / পরের ম্যাচ / আরেকবার, and Space on the card.
- **Result:** how many times `finish()` ran (stars, the long whistle, the win or lose sound, confetti).

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| PausedWhenHidden | Hide the tab after your kick or during theirs and it's paused when you come back. | holds |
| PausedWhenBlurred | Click into another window during their run-up and it's paused when you come back. | **breaks** |
| NoProgressWhileAway (property) | The run-up, the flight and the whistle only move while you're on the page. | holds (since 6775639) |
| InputReleasedWhenAway | After a blur or hide, no finger is still counted on the board. | **breaks** |
| MurmurOnlyInTheRunUp | The crowd murmur plays only during their run-up, unpaused, on screen, focused, sound on. | **breaks** |
| MurmurComesBack | During their run-up with sound on, the murmur plays (turning sound back on restores it). | **breaks** |
| LevelPickerFreezesPlay | With the match list open, their run-up doesn't go on. | **breaks** |
| NoDoubleResult | A match ends once: one whistle, one save, one fanfare. | **breaks** |
| CardNeedsAFreshPress (property) | The card stays until a fresh press, never because of a key held from before. | **breaks** |

## Bugs
### 1. NoDoubleResult (the match finishes 2–4 times): game-specific
- **The player's version:** "When I won, the long whistle and the win music played over themselves, and the confetti burst twice."
- **Path:** your kick → theirs → the match is decided → decided again before the card is drawn (9 steps).
- **Why:** `next()` → `finish()` leaves `live.stage` at "after" with `live.t ≥ AFTER`. Every further `tick()` before React re-renders (and the loop effect cancels rAF) calls `next()` → `finish()` again. `useGameLoop` runs several ticks per frame whenever a frame takes longer than 16.7 ms.
- **Live replay (Orca, autopilot shooting at 55–80 % power):** Orca drew at a median 48 ms per frame here (about 3 ticks per frame). `finish()` was counted by the long whistle's 3100 Hz hold and by `setItem('ektukhani-levels-penalty')`:
  - match 1, won: **4 long whistles, 4 saves** of `{"1":1}`;
  - match 2, won 4–2: **2 whistles, 2 saves**;
  - a lost match, 3–4: **3 long whistles** (and `sfx.lose` three times).
- **Fix:** have `finish()` set `live.stage` to a terminal value (or a `live.over` flag that `tick` returns on) before doing anything else. Add a node test: tick past AFTER three times in one frame, and the result is recorded once.

### 2. CardNeedsAFreshPress (held Space skips the card): shared pattern
- **The player's version:** "I held Space to dive on the last kick, and the next match started before I saw that I'd won."
- **Path:** … their run-up → hold Space to dive to the middle → they kick → decided → the card shows → Space repeats on the card.
- **Why:** `keys.current` never checks `event.repeat`. On "won" Space runs `startMatch(level + 1)`, and on "lost" `startMatch(level)`.
- **Live replay (Orca):** Space auto-repeat (`repeat: true`, every 33 ms) from each "ball landed". The won card for ম্যাচ ১ showed and **was gone after 34 ms**: "ম্যাচ ২ · পাড়ার ম্যাচ", kicks 0, aiming.
- **Fix:** accept card keys only from a keydown after the card appears, with `!e.repeat`. Ignore repeats for the dive and the kick too.

### 3. MurmurComesBack (the muted-loop stub): shared pattern
- **The player's version:** "I muted and unmuted during their run-up and the crowd went quiet for the rest of the kick."
- **Path:** … their run-up starts → sound off → sound on (7 steps). Or: sound off at their whistle → the run-up starts (silent stub) → sound on.
- **Why:** SoundToggle's `onChange` only does `live.hum = null` on off. It does nothing on on. `live.hum ??= murmur()` keeps a silent stub made while muted.
- **Live replay (Orca):**
  - A: run-up t 0.13, murmur loops 1 → off: 0 → on: **0** → +0.4 s: 0 → they kicked.
  - B: off at the whistle → run-up: `live.hum` set, loops 0 (stub) → on: **still 0** for the rest of the run-up.
- **Fix:** on sound on during the run-up, `stopHum(); live.hum = murmur()`. Never restore with `??=` (the rewrite prompt's muted-stub pattern).

### 4. PausedWhenBlurred + MurmurOnlyInTheRunUp: shared
- **The player's version:** "I clicked my other window during their run-up. It froze with the crowd still murmuring, and when I clicked back the kick came straight away. My click even picked a side for me."
- **Path:** your kick → their whistle → click into another window (5 steps).
- **Why:** there's no blur listener, so `useGameLoop` freezes but `live.paused` stays false and the murmur keeps playing. On focus the run-up resumes at once, and the click that brings you back goes to `onPointerUp` → `pickSide(by x)`.
- **Live replay (Orca):** run-up started, murmur loops 1 → blur: stage run, loops 1, paused false. It was still "run" with loops 1 after 0.7 s and after 15 s. After focus the kick came ("দাঁড়িয়েই রইলে…").
- **Fix:** shared. Move to `GamePage` / `useGamePlayer`. The menu opens on blur, `hide()`-style handling stops the murmur and pauses, and the click lands on চালিয়ে যাও.

### 5. InputReleasedWhenAway (a finger kept across a blur): game-specific, small
- **The player's version:** "I'd put my finger on the board, switched windows, and when I came back one swipe shot the ball."
- **Path:** finger on the board → click into another window (2 steps).
- **Live replay (Orca):** pointerdown while aiming → `live.pointer` 7 → blur 1.5 s: **still 7** → focus, one move and a lift: **stage fly**. `hide()` resets it to −1, but blur doesn't.
- **Fix:** on blur, clear `live.pointer`, `live.count` and a swipe aim, the same as `hide()` does.

### 6. LevelPickerFreezesPlay: shared
- **The player's version:** "I opened সব ম্যাচ during their run-up and they scored while I was looking at the list."
- **Live replay (Orca):** list opened at their whistle (t 0.08) → the run-up and kick went on → "ball landed", call "দাঁড়িয়েই রইলে, বল পাশ দিয়ে গোলে।".
- **Fix:** shared. The match list belongs in the player's pause menu, or opening it pauses.

### How the replays were run
All in **Orca** (page `b2a5ccad…`, Pixel 9). `live` was read through the React fiber (`useState(makeLive)`). Kicks were taken by an in-page autopilot (Space to start the meter, Space at 55–80 % power). `finish()` was counted through `AudioParam.setValueAtTime(3100)` (the long whistle's hold) and `Storage.setItem`. Murmur loops were counted through `AudioBufferSourceNode.start/stop` with `loop = true`. Orca's frame rate (median 48 ms) makes bug 1 more frequent than on a steady 60 Hz phone, but any dropped frame triggers it.

## Quality-bar gaps (matches 1–4 in Orca, Pixel 9)
1. **No pause at all** except the tab-hide overlay: no button, no P or Esc, and nothing on blur. The game isn't in the shared player, so there's no menu, no কীভাবে খেলবে, and the সব ম্যাচ drawer is inline.
2. **Text and the scoreboard sit above the play area:** the H1 (two lines), the level line and the score panel put the board at y≈300 on 923 px. The keeper's বাঁয়ে / মাঝে / ডানে buttons sit near the fold, with only 2.2 s (0.7 s + 1.5 s) to use them.
3. **The call banner covers the goal** after each kick ("দাঁড়িয়েই রইলে…" at the top of the board), which puts a label over the play area.
4. **No danger at the edges:** sudden death is only a small chip, and when one miss loses the match nothing glows.
5. **Pacing:** each match moves six numbers at once (keeper read and reach, the shooter's miss, corner, honesty and tell). That isn't "one new idea at a time". The semi-final and final are named, which is a good finale.
6. **The first kick is quick and taught well** ("⬆ টেনে ছাড়ো", the keeper hint on match 1). But the start isn't a distinct moment: play just begins.
7. **Sound is good** (kick thump, net swish, glove, bamboo knock, crowd, the pea whistle, the run-up murmur). There's no tune, and bug 1 doubles the whistle and fanfare.
8. **The end screen is good:** stars, the near-miss line, পরের ম্যাচ as primary, the card only on a real win, and the friend's score labelled as their phone's tally.

Screenshots: `.shots/penalty-first-screen.png` (it opens straight into the aim), `.shots/penalty-aim-meter.png` (the power bar), `.shots/penalty-keeper.png` (their run-up with the side buttons), `.shots/penalty-end.png` (a lost 3–4 match, with the call banner over the goal; Orca's phone shot after a scroll is partly blank).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/penalty/Penalty.tla --view ai_docs/statecharts/penalty/view.ts --out ai_docs/statecharts/penalty/<new-folder>
rm ai_docs/statecharts/penalty/<new-folder>/tlc*.out
```
