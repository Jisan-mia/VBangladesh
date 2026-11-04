# ঘণ্টার সুর statechart (before the rewrite)

Spec: `Ghontar.tla` / `Ghontar.cfg` / `view.ts`, mirrored from `tools/ghontar-sur/components/pot-game.tsx` and `tools/ghontar-sur/lib/game.ts`. TLC: 240 states, 976 steps. Chart: `before-fix/chart.mmd` (13 states, 35 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **Play phase:** ready → listen (the tune plays) → play (your turn) → listen … → over. Each tap's outcome is chosen freely by the model (repeat the tune or slip once, finish a level's last tune, slip the third time), so there are no counters.
- **Timers:** what fires next (`pending`): the tune and its hand-over (`playTune`), the 900 / 1700 ms gap before the next tune, and the 300 ms before the level-clear screen. The finish timers on the result (count-up, win/lose sound) are left out.
- **Level-clear screen:** `cleared`, and `owed` (a cleared level whose screen hasn't shown yet).
- **Pause and focus:** tab visible or hidden, window focused or blurred, the pause overlay, চালিয়ে যাও.
- **Choices:** the সব লেভেল list (a `<details>`), picking a level (`setUp(seed, level)`), পরের লেভেল.
- **Links:** a friend's link (`#s=…&t=…`) and the level the sender started from.
- Left out: sound loops (the game has none; every sound is a one-shot `tone`), the daily tune (same paths as free play), kids' rules (not a kids' game).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| PausedWhenHidden | A run in progress is paused while its tab is hidden. | holds |
| PausedWhenBlurred | It is also paused while you're in another window, so the tune doesn't play to an empty room. | **breaks** |
| PausedMeansSilent | While paused, nothing is scheduled: no tune, no gap, no clear screen coming. | **breaks** |
| NoProgressWhileAway | The tune only plays while you're on the page. | **breaks** (same path as PausedWhenBlurred) |
| ChoiceFreezesPlay | While the level list is open, the tune doesn't play on its own. | **breaks** |
| EveryClearIsShown | Every level you clear gets its clear screen: the bell, the stars, পরের লেভেল. | **breaks** |
| NothingAfterTheCard | The result has nothing left to play. | holds |
| ReplayIsExact | A friend's link starts you where the friend started. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

Replays ran in Orca (my own tab) by reading the component's real React state (`PotGame` hooks: `game`, `cleared`, `paused`), counting `OscillatorNode.start` calls (each pot note is 2 oscillators), and tapping pots with `pointerdown` events.

**Orca limitation for hide/show:** Orca pins `document.hidden` to `false` (a non-configurable own property on every loaded document), so `visibilitychange` can't be faked on the page itself. For every hide step, the game ran inside a src-less iframe (which Orca doesn't patch), filled with the page's own HTML through `document.write`. It hydrated normally, and I controlled its `document.hidden`. Blur and focus were plain `window` events on the real page.

### 1. PausedMeansSilent: "the tune plays under the pause screen" (game-specific)
- **Path (report, 7 steps):** start → the tune ends → you finish a level's last tune → the clear screen shows → you hide the tab → you come back → you press পরের লেভেল: *Paused, but the tune plays*.
- **Why:** when the tab hides on the clear screen, the phase is already `listen`, so `hide()` pauses, and both overlays show. The clear screen sits on top (later in the DOM, same z-index). Its পরের লেভেল calls `nextLevel()` → `setCleared(null); playTune()` and never touches `paused`.
- **Live (level 1 cleared, 3 stars):** clear screen up `{phase: listen, round: 6, paused: false, cleared: true}` → hide → `{paused: true, overlays: [pause, clear]}` → show (same) → পরের লেভেল → `{paused: true, cleared: false}` → after 5.1 s: **12 oscillator starts (all 6 notes of round 6) under "থেমে আছে"**, phase `play`, and the status reads "এবার তুমি বাজাও · ০/৬" below the pause overlay. Tapping the right first pot is ignored (`at` stays 0). চালিয়ে যাও replays the whole tune again. Screenshot: `.shots/ghontar-sur-paused-but-your-turn.png`.
- **Fix:** `nextLevel()` returns early while `paused` (or calls `resume()`), and `hide()` drops the clear screen when it pauses (`setCleared(null)` and keep the stars), so only one overlay shows. Better still: one overlay state (`"none" | "paused" | "cleared"`).

### 2. EveryClearIsShown: "you cleared the level, but the clear screen never came" (game-specific)
- **Path (4 steps):** start → the tune ends → you finish a level's last tune → you hide the tab: *Paused, clear screen skipped*.
- **Why:** the "level" outcome saves the stars at once, but shows the clear screen from a 300 ms `later()`. `hide()` sees phase `listen` and calls `clearTimers()`, which kills that timer. `resume()` then starts the next tune.
- **Live:** autopilot repeated 5 tunes. On the last tap of the 5th, the tab hid at once: `{phase: listen, round: 6, score: 5, paused: true, cleared: null}`. Storage already had `{"1":3}`. Back on the tab, চালিয়ে যাও → `{paused: false, cleared: null}`. The HUD jumps to "লেভেল ২ · বাঁশির দোকান" with no bell, no stars and no পরের লেভেল.
- **Fix:** set `cleared` synchronously in `hitPot` (delay only the bell and the star chimes), or have `hide()` turn a pending clear into `setCleared(...)` before it clears timers.

### 3. PausedWhenBlurred / NoProgressWhileAway: "the tune played while I was in another window" (shared)
- **Path (2 steps):** start → you click into another window: *The tune plays, you're away*.
- **Why:** the game listens only to `visibilitychange`. A blur doesn't pause, and the tune timers keep firing.
- **Live:** started round 1 and blurred at once. 1.6 s later: 2 oscillator starts (the round's note), phase `listen` → `play`, status "এবার তুমি বাজাও · ০/১", no overlay. On longer rounds (6+ notes at level 2), a whole tune plays to nobody.
- **Fix (shared):** the shared player's blur/hide handler pauses real-time play. Here that means `window` `blur` → `clearTimers(); setPaused(true)` during `listen` (during `play` nothing runs on its own, so it's optional).

### 4. ChoiceFreezesPlay: "the tune played while I was picking a level" (shared)
- **Path (2 steps):** you open সব লেভেল → you press শুরু করো: *The tune plays, level list open*. You can also open the list while the tune plays.
- **Live:** `details.gs-levels` open, শুরু করো, 1.6 s later: phase `play`, 2 oscillator starts, list still open.
- **Fix (shared):** the level list belongs in the shared pause menu (সব লেভেল). Opening it pauses, like any other choice.

### 5. ReplayIsExact: "my friend started at level 2, but the link started me at level 1" (game-specific)
- **Path (1 step):** a friend's link opens: *Friend's tune ready, from level ১*.
- **Why:** the link is `#s=<seed>&t=<score>&n=<name>`. It doesn't carry `from`, and `setUp(found.seed)` always starts at level 1. A run started from the level list (round 6, 11, …) can be shared, and the friend must then play every round below it under the same 3-mistake budget.
- **Live:** picked level 2 (`from: 2, round: 6`), repeated rounds 6 and 7, then slipped 3 times → `{from: 2, score: 7, seed: 241554142}`. Opened `/ghontar-sur#s=241554142&t=7` → `{mode: friend, from: 1, round: 1}`, HUD "লেভেল ১ · মেলার গেট", banner "এক বন্ধু ৭টা সুর মনে রেখে বাজিয়েছে।". The same gap shows on this phone: the result said "তোমার সেরা ৭" for a level-1 run, though the 7 came from a run that started at round 6.
- **Fix:** add `f=<from>` to the link (`challengeHash` `extra`) and to `Shared`. `parseShared` reads it (1..10), and `setUp(seed, from)`. Also keep the best per start level, or only count runs from level 1.

### Rules that hold, checked live
- **PausedWhenHidden:** hiding during `listen` → `{paused: true}` with the overlay "থেমে আছে। চালিয়ে গেলে সুরটা আবার শুনবে।" (in the iframe).
- **NothingAfterTheCard:** the 3rd slip leads to `over` with no tune pending. আরেকবার starts a fresh `begin()`.

## Quality-bar gaps (a run through level 1 into level 2 and to the result, in Orca at Pixel 9)
1. **First screen:** the shelf is big and tapping a pot starts the game (good), but শুরু করো is a plain full-width button under the shelf, with the H1 and a 3-line HUD above the play area. Screenshot: `.shots/ghontar-sur-first-screen.png`.
2. **Pause is not a menu:** there's no pause button, P or Esc. It pauses only on tab hide (not blur), and the overlay has one button. The bar asks for চালিয়ে যাও / নতুন করে শুরু / কীভাবে খেলবে / শব্দ / ধীরে খেলো / সব লেভেল.
3. **Two overlays can stack** (bug 1), and the clear screen covers the whole shelf. The bar wants the middle clear during play. The clear screen is a choice moment, so that part is fine.
4. **Pacing:** level 1 takes about 20 s of listening before its first clear. Each level adds nothing new: the beat is 40 ms faster and the tune one note longer. The bar asks for one new idea per level and a named "boss" moment at the end of a world (for example, the last tune of a level played on the fair bell, or a pot that swaps place).
5. **Danger:** the third mistake has no warning. After two slips, only the small ভুল dots fill. The bar asks for an edge glow (static in slow mode).
6. **HUD on the result is stale:** after losing at round 6 it still says "লেভেল ২ · বাঁশির দোকান" and "সুর ৬টা · ১০টায় লেভেল ২ পার", while the result says "৫টা সুর · লেভেল ১ পার". Screenshot: `.shots/ghontar-sur-result.png`.
7. **Choices:** the level list doesn't pause (bug 4). It isn't numbered and has no recommended start, and starting from a later level isn't explained on the card or in the link (bug 5).
8. **Sound:** the signature টুং, a combo note per round, the fair bell and win/lose are all synthesized. No looping tune per stage, which the bar welcomes for staged games. Every sound is also shown as a light, so mute works.
9. **Ending:** real stats (notes, levels cleared, the right pot), a near-miss line and a card. Good. The friend comparison is unfair when the sender started later (bug 5).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ghontar-sur/Ghontar.tla --view ai_docs/statecharts/ghontar-sur/view.ts --out ai_docs/statecharts/ghontar-sur/after-fix
rm ai_docs/statecharts/ghontar-sur/after-fix/tlc.out
```
The chart hides these steps: picking a level from the list (the same reset from every state); friend links opened mid-run; and চালিয়ে যাও, পরের লেভেল, the next tune and "you come back" when they carry an already-open list or an already-away window into a tune (the chart shows how you get there instead: by opening the list or leaving).
