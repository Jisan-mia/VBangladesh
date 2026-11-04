# বাঘবন্দি statechart (before the rewrite)

Model: `Baghbandi.tla` / `Baghbandi.cfg` / `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd`.
Code mirrored: `tools/baghbandi/components/baghbandi-game.tsx`, `tools/baghbandi/lib/game.ts` (`isBotTurn`, `canUndo`, `undo`).

TLC: 201 states, 944 steps. **3 rules hold, 3 break**, all from one root cause: the bot's timer ignores whether you are there.

## Systems modelled
- **Who plays:** ছাগল হবো (you're the goats, the bot is the tiger), বাঘ হবো (you're the tiger; the goats move first, so the bot opens), দুজনে (no bot).
- **Play phase:** first move → mid-game → over (a move either keeps the game going or ends it). There is also the friend's card (`viewing`).
- **Bot:** the effect runs a 650 ms `setTimeout` (1200 in ধীরে খেলো). Only `paused`, `viewing` or a new game clears it. Nothing about the window does.
- **Pause and focus:** `visibilitychange` pauses only if `moves.length > 0` and the game isn't over. There is no blur or focus listener, and no pause button, P or Esc.
- **Take-back:** ফিরিয়ে আনো undoes your move and the bot's reply, and also unpauses.
- **Result:** the effect is guarded by `finished.current === game` and records the best, stars and sound once.
- **Friend's link:** `hashchange` → their card. The challenge buttons and the mode buttons with no level keep their seed. A level that isn't theirs gets a fresh seed.
- **Sound:** one-shots only (click, growl, sfx), no loops.
- **Not modelled:** board geometry, selection, the keyboard cursor, the pointer press and release pair (none of them advance play), and the per-level star ladder (`recordLevel` keeps the max, which shared tests cover).

## Rules (plain words)
| Rule | In plain words | Result |
|---|---|---|
| BotWaitsWhileHidden | While the tab is hidden, the bot doesn't move. | **breaks** |
| BotWaitsWhileBlurred | While you're in another window, the bot doesn't move. | **breaks** |
| PausedWhenHidden | Mid-game with the tab hidden, the game is paused. | **breaks** (after the bot's opening move while hidden) |
| BotOnlyAgainstYou | In দুজনে, nobody's turn belongs to a bot. | holds |
| NoDoubleResult | A game's result (stars, best, sound) is recorded once, and only when it's over. | holds |
| ReplayIsExact | When you take a friend's challenge, you play from their start. | holds |

## Bugs
### 1. BotWaitsWhileHidden + PausedWhenHidden (game-specific)
- **Player's sentence:** "I picked বাঘ হবো and switched tabs. When I came back, the goats had already moved, the game wasn't paused, and I never saw their move."
- **Path:** 0 your first move (goats) → 1 you pick বাঘ হবো (the bot opens) → 2 you hide the tab (not paused, because no move has been played yet) → 3 the bot moves (now mid-game, hidden, not paused).
- **Live replay:** partly possible. Orca pins `document.hidden` to a native getter that always returns `false`, and it can't be redefined (`configurable: false`), so no hidden tab can be produced in Orca. The parts I could check: I clicked বাঘ হবো, then dispatched `visibilitychange` and `blur` in the same tick. The board read `data-bot="true"`, status "ছাগল ভাবছে…" and clock ০. About 2 s later the clock read ১, the status read "তোমার পালা…", and there was no `.bb-overlay`. From the code, `hide()` returns early when `moves.length === 0`, and the bot's `setTimeout` keeps firing in a hidden tab (throttled to about 1 s), so the hidden case follows. Replay it with a real tab switch once the fix lands.
- **Fix:** make the bot wait for presence, not only for `paused`. Either pause on hide whenever a bot turn is pending (drop the `moves.length` condition for bot turns), or gate the bot effect on `!document.hidden && document.hasFocus()` and re-arm it on `visibilitychange`/`focus`.

### 2. BotWaitsWhileBlurred (shared cause: no blur handling)
- **Player's sentence:** "I moved a goat and glanced at another window. The tiger jumped while I wasn't looking."
- **Path:** 0 your first move → 1 you move a piece (the bot is thinking) → 2 you click into another window (the bot is still thinking, unpaused).
- **Live replay (Orca, ছাগল হবো):** I tapped the pile at (1,2), tapped (1,3), then dispatched `blur`, with `document.hasFocus()` false throughout. 2.1 s later the clock read ২ (your move plus the bot's reply), the status read "সাবধান! লাল দাগের ছাগলের পেছনটা ফাঁকা…", and there was no overlay.
- **Fix:** the shared away handling (blur → pause) from the game player, or at least hold the bot's timer while `!document.hasFocus()` and fire it about 650 ms after focus returns, so the reply is always seen.

## Quality-bar gaps (played one game as the tiger at level 1: a random-greedy tiger won ★★★ in 36 moves)
1. **No real pause:** there is no button, P or Esc. A hidden tab pauses only after the first move, and blur never does.
2. **The first screen has no single big start action:** three mode buttons of equal weight. On a phone (412 px), the status line that teaches the first move ("একটা গাদায় চাপো") is below the fold (`.shots/baghbandi-first-screen-phone.png`).
3. **Difficulty isn't explained:** there are 8 levels per side, labelled only "লেভেল ১". The bot's change is never said in the player's words, and the picker hides in a collapsed সব লেভেল.
4. **The first win is far off:** even level 1 takes 30–60 moves (1–3 minutes), not 10 seconds.
5. **Pacing:** every level is the same board, and only the bot gets sharper. No new element per level, and no named boss at the end of a ladder.
6. **No edge danger cue** when the tiger is one capture from 8, or the goats are close to a trap. Danger shows only as red marks on the board.
7. **Sound:** a click per side, a growl, and the shared sfx. There is no signature sound or music. On mute, every meaning is still visible (good).
8. **What's good:** threat and leap hints teach well, undo exists, the end screen shows real stats and stars, the card is personal, and a link replays and re-checks the moves.

Screenshots: `.shots/baghbandi-first-screen-phone.png`, `.shots/baghbandi-over.png`.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/baghbandi/Baghbandi.tla --view ai_docs/statecharts/baghbandi/view.ts --out ai_docs/statecharts/baghbandi/after-fix
```
The chart hides the celebration step and the resets that every state has. Mode, link and another game are drawn only from the calm first screen and from the result.
