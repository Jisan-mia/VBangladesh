# জোড়া মেলাও: statechart, before the rewrite

Spec `JoraMelao.tla` / `JoraMelao.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors `tools/jora-melao/components/pairs-game.tsx` (`tap`, `start`, `playLevel`, `again`, `nextLevel`, `pick`, the miss effect, the end effect, the `visibilitychange` effect, the opened/`hashchange` effect), `tools/jora-melao/lib/game.ts` (`flip`, `settle`) and `shared/game-core.ts` (`recordLevel`, `unlockedLevel`).
TLC: 403 states, 1357 steps. The chart has 12 states and 22 arrows (it hides "the cheer plays"). **7 rules hold, 1 breaks** (plus TypeOK and NoDeadlock). The bug reproduced live in Orca.

## Systems modelled
- **Board phase:** fresh board (the demo pair up) → one card up → a match, or a missed pair showing → … → last pair found → the "সব জোড়া মিলেছে" panel. Abstracted to one pair a board: more pairs only repeat the flip loop.
- **Pause and tab:** a hidden tab pauses a board in play and turns a missed pair back (`settle`). চালিয়ে যাও resumes. `tap()` does nothing while paused.
- **Timers:** the miss timer (1 s, or 1.8 s in ধীরে খেলো), which waits while paused; the 650 ms panel timer; and the cheer after the stars. `start()` clears the last two.
- **Levels and stars:** 2 levels, 1 or 2 stars per clear, `recordLevel` keeps the max, `unlockedLevel` = 1 + the highest level with stars, and `LevelGrid` shows `max(unlocked, level)` as open.
- **Links:** the page opens on the level this phone left off at, or on a friend's link. `parseCard` replays the flips and accepts any level.

Not modelled: two-player mode (no stars, the same pause and timers), the 400 ms again-guard (it only filters taps), and the `migrateLevels` one-time move (it writes levels 4 and 7 on purpose, for old bests). Blur isn't handled by the code. That's acceptable for a turn-based board: the only thing that moves while you look away is the miss timer turning your own two cards back. No sound loops.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| PausedWhenHidden | A hidden tab means a paused board. | holds |
| NothingShowingWhilePaused | While paused, no missed pair is left face up. | holds |
| NoProgressWhilePaused | While paused, no card turns and no pair is found. | holds |
| NoDoubleResult | A board is recorded once. | holds |
| NoCheerAfterMovingOn | The panel and the cheer belong to a finished board, never to the next one. | holds |
| LevelsOpenInOrder | A level has stars only if the level before it has stars, so levels open one by one. | **breaks** |
| StarsNeverDrop | Stars on a level never go down. | holds |
| UnlockNeverShrinks | An open level never closes. | holds |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. LevelsOpenInOrder: "A friend sent me their লেভেল ১২ board; I finished it, and now every level is open and it says সব লেভেল শেষ!"
- **Path (report):** 0 the page opens from a friend's level 2 link → 1 you flip a card → 2 you match the last pair of the friend's level 2: level 2 has stars, and level 1 was never played.
- **Live replay (Orca):** with clean storage I opened `/jora-melao#s=777&t=10&g=20&l=12&f=016a7b9c5e2f4g3hdi8j&n=রাফি` (a verified 10-move link made with `cardHash`). The banner read "রাফি ১০ চালে পেরেছে। একই খেলা, এবার তোমার পালা।", the HUD read `লেভেল ১২ · চাল ০ · জোড়া ০/১০`, and সব লেভেল already showed **12** levels open. I flipped the 10 pairs. The panel read "সব জোড়া মিলেছে! ১০ চালে ★★★ … সব লেভেল শেষ! তারা কম থাকলে নিচে থেকে আবার খেলো।", and storage held `ektukhani-levels-jora-melao = {"12":3}`. After a reload without the hash the game opened on লেভেল ১ (`জোড়া ০/৪`), and সব লেভেল still showed all 12 levels open.
- **Fix:** the same as paka-kancha bug 2. Make `unlockedLevel` in `shared/game-core.ts` count the unbroken run of cleared levels from 1, and don't let a friend's locked level unlock anything (play it, show the comparison, don't `record()` it, or record it apart). Also, "সব লেভেল শেষ!" should depend on all levels being cleared, not on `level === LEVEL_COUNT`. Keep `migrateLevels`' levels 4 and 7 working: count them as cleared together with the levels before them, or migrate to levels 1–4 and 1–7. **Shared** with paka-kancha, sudoku and switchboard.

### Couldn't replay live
- **Tab hide:** Orca pins `document.hidden` as a non-configurable getter that returns `false`, so the pause branch of the `visibilitychange` handler can't fire live. PausedWhenHidden, NothingShowingWhilePaused and NoProgressWhilePaused hold in the model and in the code: the handler sets `paused` and runs `settle`, `tap()` returns while paused, and the miss effect waits on `paused`.

## Quality-bar gaps (game-quality-bar)
1. **Pacing, one new idea per level (§9):** levels 1–3 are all 8 cards, and levels 2 and 3 even share the 3-star par (৬ চাল). Only the 2-star line moves (8 → 7). Every world of three repeats this: 12, 16 and 20 cards, three times each. Nothing new appears inside a world, such as a toy that moves, a peek, or a timed board.
2. **No "boss" board (§9):** levels 3, 6, 9 and 12 end each size with the same panel. There's no named final board ("মেলার শেষ দোকান") and no special card.
3. **Pause (§7):** pause happens only on a tab hide. There's no pause button and no P or Esc. The cover offers only চালিয়ে যাও, with no নতুন করে শুরু, কীভাবে খেলবে or সব লেভেল.
4. **Danger (§6):** nothing shows that you're about to lose a star. The par is a line of text ("৩ তারা ৬ চালের মধ্যে"). A thin progress bar against par, or an edge warm-up on the last move before a star drops, would carry it.
5. **Choices (§4):** পরের লেভেল explains the next board in one line ("লেভেল ২: ৮টা কার্ড, ৩ তারা ৬ চালে"), which is good. The সব লেভেল grid doesn't, and locked levels are a bare 🔒.
6. **Ending on a big board (§10):** on 16- and 20-card boards the panel and the card sit below the board, likely under the fold on a phone. Scroll to the panel when it appears, or float it over the board.
7. **Sound (§11):** good. The flip swish, a match chime that climbs with the streak, a soft wooden miss, and the star chimes. No signature tune and no change per world.
8. **First screen (§1):** good. The board is the biggest thing, the demo pair is face up, and the hint line is one sentence. The first match comes within 10 seconds.

## Screenshots
- `.shots/jora-melao-sc-first.png`: Pixel 9, লেভেল ১ with the demo pair (চরকি) face up.
- `.shots/jora-melao-sc-over.png`: লেভেল ৩ cleared in 6 moves, ★★★. Orca's phone mode blanks part of the pane, so trust the board and the panel top.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/jora-melao/JoraMelao.tla --view ai_docs/statecharts/jora-melao/view.ts --out ai_docs/statecharts/jora-melao/before-fix
rm -f ai_docs/statecharts/jora-melao/before-fix/tlc*.out
```
The cfg has `CONSTRAINT Explore` (stop past a skipped level) to keep the model under 500 states. After the fix, change `Unlocked` to the contiguous run (and stop `YouFlipACard` from recording a friend's locked level), then re-run into `after-fix/`. All 10 rules must hold.
