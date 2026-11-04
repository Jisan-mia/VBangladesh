# ডাংগুলি: statechart before the rewrite

The model is `Danguli.tla` with `Danguli.cfg` and `view.ts`. It mirrors `tools/danguli/components/danguli-game.tsx` and `tools/danguli/lib/game.ts` as they are on `games-to-the-bar`. The report and chart are in `before-fix/`. No code was changed.

TLC reached 279 states. Four of the eight rules break. The chart (`before-fix/chart.mmd`) draws 12 states and 22 arrows. It hides the resets that every state has, plus arrows that repeat ones already drawn.

## Systems modelled
- **Play phase:** a round of hits, `aim → pop → fly → rest`, then the result card (`over`). The game has three hits; the model has one, because at two hits TLC finds the same breaks in 504 states, too many for the chart.
- **Pause and focus:** the থামাও button and P/Esc toggle, the tab hidden or shown, and the window focused or blurred.
- **Input:** the play key (Space, Enter or ↑), its keyup, and the keyboard's auto-repeat while it is held. A canvas tap is the same `press()` with no key held.
- **Time:** step() lets the কাঠি fall, a hit fly and settle, and the rest after a hit end. finish() also sets setTimeout timers for the star chimes and confetti.
- **Choices:** proceed() on the card (পরের লেভেল when a level is won, otherwise আবার খেলো), the level grid, and নতুন মাঠে খেলো.
- **Links:** a friend's challenge link loaded at start or by hashchange, and whether the field you're on is theirs.
- **Left out:** saved stars (`recordLevel` keeps the max, so they can't drop), slow mode (it only scales time), and the name and card format. There is no sound loop: every sound is a one-shot.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | Hide the tab while the কাঠি is up and the game pauses. | holds |
| PausedWhenBlurred | Click into another window while the কাঠি is up and the game pauses. | **breaks** |
| InputReleasedWhenAway | Nothing counts as held after you leave the page. | holds (the game keeps no held state) |
| HeldKeyActsOnce | One press does one thing. Holding the key never flicks, swings or skips on its own. | **breaks** |
| ResultStaysUntilYouChoose | The result card stays until you make a fresh choice. | **breaks** |
| NoDoubleResult | A round ends once (one finish(), one set of stars). | holds |
| CelebrationOnlyOnResult | Star chimes and confetti play only on the result card. | holds (start() clears the timers) |
| ReplayIsExact | While a friend's challenge is up and you're on their level, you play their field. | **breaks** |

## Bugs

### 1. PausedWhenBlurred: "I flicked the কাঠি, glanced at another window, and came back to a miss" (shared)
- **Path:** (0) ready to flick → (1) you press Space: the কাঠি is in the air → (2) you click into another window: it's still in the air and the game is still running.
- **Why:** the only pause effect is `visibilitychange`, and nothing listens for `blur`. `useGameLoop` keeps stepping while the window is blurred, so `step()` lets the কাঠি fall and records `strike(…, 0)`, a ground miss.
- **Live replay (Orca tab, synthetic events):** Space keydown and keyup → button `মারো!`, hits `—|—|—`. Window `blur` → no change, no pause overlay. 2.5 s later, still away → button `পরের মার`, hits `ফসকে|—|—`. The first of the three hits was lost while away. The Orca tab itself had no focus (`document.hasFocus()` false) and the game still ran.
- **Fix:** pause on `blur` the same way as on hide (in pop, fly or rest), and resume only from চালিয়ে যাও. This belongs in the shared player or a shared `usePauseWhenAway()` in `shared/game-kit.ts`, so every game gets it.

### 2. HeldKeyActsOnce: "I held Space a moment too long and the batter swung on his own" (shared)
- **Path:** (0) ready → (1) you press Space: the কাঠি is in the air → (2) the held key repeats: the swing happens without a second press.
- **Why:** `onKey` never checks `event.repeat`, so every auto-repeat of Space, Enter or ↑ calls `press()`.
- **Live replay:** one keydown of Space, then repeat keydowns every 33 ms from 0.5 s on (like a held key). At 540 ms the repeat swung on the rise: hits `ফসকে|—|—`. After that it skipped the rest (947 ms), flicked again (981 ms), swung (1155 ms) and so on. Holding the key played the whole round as misses.
- **Fix:** ignore `event.repeat` in `onKey`, as স্যার ঘুরলেই থামো already does during play. Shared: one key helper for every game.

### 3. ResultStaysUntilYouChoose: "I held Space and the result flashed past; a new round started" (shared)
- **Path:** (0) ready → (1) you press Space → (2) the কাঠি lands untouched → (3) the held key repeats: it plays by itself → (4) the held key repeats: the card is skipped.
- **Why:** on the card, Space, Enter or ↑ calls `proceed()`, and a repeat counts as a press. A key held from the last hit goes straight past the card into পরের লেভেল or আবার খেলো.
- **Live replay:** in the same held-Space run, the card appeared at 2112 ms and was gone at 2147 ms, about one repeat later, with a fresh round on `কাঠি তোলো`. In 10.8 s of holding, the game played six rounds by itself, and each card lasted about 35 ms. Each one still recorded a best (here 0 ডাং).
- **Fix:** on the card, act only on a keydown with `!event.repeat` that started after the card appeared. Keep the 450–600 ms guard that দেরি হয়ে গেল uses. Shared: a `useResultGuard()` that every game's card uses.

### 4. ReplayIsExact: "My friend's banner says 'একই মাঠ', but I'm on a new field" (game)
- **Path:** (0) ready to flick on the friend's field → (1) you pick a level from the grid: the challenge is still up, on a new field.
- **Why:** `LevelGrid onPick={next => play(next)}` calls `play(next, seed = newSeed())`, even for the friend's own level. `again()` keeps the friend's seed, but only while they are already the rival.
- **Live replay:** open `/danguli#s=12345&t=30&h=10-12-8&n=rafi`. The HUD reads `মোট ০ ডাং · লক্ষ্য ৩০` and the banner reads `rafi ৩০ ডাং মেরেছে। একই মাঠ, এবার তোমার পালা।`. Open সব লেভেল and press লেভেল ১. The HUD now reads `মোট ০ ডাং` (the target is gone, so `rival` is null and the seed is new), and the banner still promises the same field.
- **Fix:** in `onPick`, use the friend's seed when `friend.level === next`, as `again()` does.
- **Side finding:** in the first attempt the HUD still showed `লক্ষ্য ৩০` after the pick, until the next render. `start()` replaces `game.current` (a ref), and every `setState` it calls sets the value already there, so React skips the render. The HUD can show the previous field's target until something else re-renders. The rewrite should keep the field in state, or force a render on `start()`.

## Quality-bar gaps (from a play in Orca, phone and desktop)
1. **First screen:** the H1, the lead and the level line sit above the stage. The start action (কাঠি তোলো) is an ordinary button under the canvas, below the fold on a 412×915 phone. It is not the biggest thing on screen.
2. **Pause:** থামাও is a toggle with no menu (no নতুন করে শুরু, কীভাবে খেলবে, শব্দ or ধীরে খেলো inside it). Blur doesn't pause (bug 1). Hiding pauses only while the কাঠি is up.
3. **Input:** a held key plays the game by itself and skips the result (bugs 2 and 3).
4. **The middle of the screen:** the two-line tutorial card sits in the sky over the play area, and "ক্যাচ! আউট!" draws inside the field. The hit chips and total are fine at the top.
5. **Pacing:** each level changes wind, pop height and (from level 4) the fielders together, so there's more than one new idea per level. Level 10 (ওস্তাদ রহিম চাচা) is only a bigger number, not a named moment.
6. **Choices:** the level grid is hidden in a `<details>` under the toggles, with no numbering or keys. The default after a win (পরের লেভেল as primary) is right.
7. **Danger:** nothing warns as the কাঠি nears the ground. The yellow band is the only timing cue, and it is easy to miss on a phone.
8. **Sound:** flick, knock (pitch by quality), crowd, splash, thud, star chimes and win make enough meaningful sounds. There's no signature tune.
9. **Ending (good):** the card shows real stats: stars, ডাং, the gap to the next star, this phone's best, and the versus line. The share card and link work.

Screenshots: `.shots/danguli-first-screen.png` (phone first screen; the stage starts halfway down), `.shots/danguli-third-hit.png` (the third hit caught), `.shots/danguli-result.png` (the result: 1 star, 14 ডাং, পরের লেভেল).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/danguli/Danguli.tla --view ai_docs/statecharts/danguli/view.ts --out ai_docs/statecharts/danguli/before-fix
rm ai_docs/statecharts/danguli/before-fix/tlc*.out
```
After the fixes, update the spec to the new code and run into a fresh `after-fix/`. Every rule must hold there.
