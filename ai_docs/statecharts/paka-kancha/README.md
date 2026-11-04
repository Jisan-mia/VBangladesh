# পাকা-কাঁচা: statechart, before the rewrite

Spec `PakaKancha.tla` / `PakaKancha.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors `tools/paka-kancha/components/code-game.tsx` (`press`, `start`, `playLevel`, the `onKey` effect, the `guesses.length` end effect, the opened effect), `shared/game-ui.tsx` (`LevelGrid`) and `shared/game-core.ts` (`recordLevel`, `unlockedLevel`).
TLC: 498 states, 2575 steps. The chart has 12 states and 23 arrows. **4 rules hold, 2 break** (plus TypeOK and NoDeadlock). Both bugs reproduced live in Orca.

## Systems modelled
- **Play phase:** row empty → typing → four digits typed → result (found, or out of tries). The model uses 1 try per game: more tries only repeat the typing loop.
- **Input and focus:** digits typed on the keyboard (focus stays where it is), digits tapped on the pad (the key turns disabled, so focus drops to the page), মুছো (keeps focus while anything is left to erase), a level button under সব লেভেল (keeps focus), and Enter. `onKey` checks the row only when the event target is not a `button, a, summary`. Otherwise the browser clicks the focused button.
- **Timers:** the end effect's `later()` timeout (cheer, or the lose sound). `start()` clears it.
- **Levels and stars:** 2 levels, 1 or 2 stars per clear, `recordLevel` keeps the max, `unlockedLevel` = 1 + the highest level with stars, and `LevelGrid` shows `max(unlocked, level)` as open.
- **Links:** the page opens on লেভেল ১ or on a friend's level link. `parseShare` accepts any valid level, locked or not.

Not modelled: the daily code and the seeded আরেকবার code (they type and check the same way but record no stars), the "make a code" panel (its input is excluded from `onKey`), and the day-save restore (`submittedAt` guards it, and the tests cover it). No sound loops: the game only plays one-shot sounds.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| EnterChecksTheRow | With four digits typed, Enter checks the row. It never erases a digit or restarts the level instead. | **breaks** |
| LevelsOpenInOrder | A level has stars only if the level before it has stars, so levels open one by one. | **breaks** |
| NoDoubleResult | A finished game is recorded once. | holds |
| NoCheerAfterMovingOn | The cheer or the lose sound plays only while that game's result is on screen. | holds |
| StarsNeverDrop | Stars on a level never go down. | holds |
| UnlockNeverShrinks | An open level never closes. | holds |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. EnterChecksTheRow: "I typed four digits and pressed Enter, and my row was wiped (or lost a digit) instead of being checked"
- **Path (report):** 0 লেভেল ১, row empty → 1 you pick a level under সব লেভেল (focus stays on that button) → 2–3 you type digits → 4 you press Enter: the row is empty again and the level restarted. A second path ends the same way: type 3 digits, tap মুছো, type 2 more digits, then press Enter.
- **Live replay (Orca, desktop, trusted `orca click` and `orca keypress`):**
  - Level button: I opened সব লেভেল and clicked লেভেল ১ (focus `BUTTON:লেভেল ১`), then typed 1 2 3 4, and the row read `এখন: ১ ২ ৩ ৪`. I pressed Enter. The row read `এখন: খালি`, 0 rows were checked, the HUD still said `লেভেল ১ · আর ৭ বার`, and a new code had been dealt.
  - মুছো: I typed 1 2 3, clicked মুছো (row `১ ২`, focus `BUTTON:মুছো`), typed 3 4 (row `১ ২ ৩ ৪`) and pressed Enter. The row read `এখন: ১ ২ ৩`, with 0 rows checked. Enter had erased the last digit.
  - Control: after a tap on a pad digit, that key turns disabled and focus drops to `BODY`. Then 1 2 3 + Enter checked the row (`আর ৬ বার`). The model's YouTapADigit step matches this.
  - The same happens with focus on আজকের কোড or লেভেল (Enter does nothing), on ধীরে খেলো (Enter toggles slow mode) and on the sound button (Enter mutes).
- **Fix:** in `onKey`, when the row is full (`input.length === LENGTH`) and the game isn't over, take Enter as দেখো, `preventDefault()`, whatever is focused. Exclude only real text fields (as now) and the একটা কোড বানাও panel. Or blur pad, level and মুছো buttons after a pointer click (`event.currentTarget.blur()` when `event.detail > 0`), so keyboard and mouse can be mixed. Add a node test of the `onKey` decision as a pure function `(key, targetKind, input) → action`. **Shared pattern:** chhok-jora's `keyHandler` has the same `closest("button, a, summary")` escape. Any game whose window `keydown` handler skips `button` targets should check whether the game is waiting for Enter first.

### 2. LevelsOpenInOrder: "A friend sent me লেভেল ১৮, I cracked it, and now all 18 levels are open on my phone"
- **Path:** 0 the page opens from a friend's level 2 link → 1–2 you tap digits → 3 you crack the friend's level 2 code: level 2 has stars, and level 1 was never played.
- **Live replay (Orca):** with clean storage I opened `/paka-kancha#s=424242&t=1&l=18&r=pppp&n=রাফি` (made with `shareHash`). It showed the banner "রাফি লেভেল ১৮-এর কোড ১ বারে ধরেছে।", the HUD read `লেভেল ১৮ · আর ৭ বার`, and while I played, সব লেভেল already showed all **18** levels open. I typed the code 1327 and pressed Enter, and the game saved `ektukhani-levels-paka-kancha = {"18":3}`. After a reload without the hash, সব লেভেল listed লেভেল ১ … ১৭ open with no stars, plus লেভেল ১৮ with ৩ তারা. The total went ★ ০/৫৪ → ★ ৩/৫৪.
- **Fix:** in `shared/game-core.ts`, make `unlockedLevel` count the unbroken run of cleared levels from 1 (`while (stars[n]) n++`). Let a friend's locked level be playable for that visit and show its result, but either don't `record()` it or record it without it counting towards unlocks. Keep `migrateLevels` writing levels 1–9 so old players keep their skip. **Shared:** jora-melao has the same bug (see its README), and so do sudoku and switchboard (their READMEs). Fix it once in `unlockedLevel` and `LevelGrid`.

### Minor (not in the model)
- The celebration timers are cleared on every `start()`, but `dropMangoes`' `setTimeout(() => buzz(12), 60)` isn't tracked. It's harmless.
- `today` is read once when the page opens. If you play past midnight, "আজকের কোড" still shows yesterday's code, and the share caption and link call it today's.

## Quality-bar gaps (game-quality-bar)
1. **First screen (§1):** on a Pixel 9 the first screen is the hero, the mode chips, the example row and seven empty rows. The number pad, which is the start action, is below the fold, so nothing says "start here" (`.shots/paka-kancha-sc-first.png`).
2. **The example takes room on every level:** the "এভাবে বুঝবে" example and legend sit above the board on all 18 levels, which pushes the pad and the result further down after level 1.
3. **Danger (§6):** the last try looks like every other try. Only "আর ১ বার" in the top line changes. An edge glow or a different pad tint on the last try would give the tension the bar asks for.
4. **Choices (§4):** পরের লেভেল explains the next level well in one line ("লেভেল ২: সুযোগ ৬ বার।"). The সব লেভেল grid gives no such line per level, and locked levels are a bare 🔒.
5. **Pacing (§9):** each level changes one number (pad size, tries or par), which is right. But there's no named "boss" code at the end of উঠান (৯) or আমবাগান (১৮), only harder numbers.
6. **First win (§9):** level 1 takes about 3 guesses, roughly 30 s with typing. That's fine for a puzzle, but nothing celebrates the first পাকা within the first 10 seconds.
7. **Keyboard (§7):** the bug 1 family. Mixing taps and keys breaks Enter, and there's no key hint for দেখো or মুছো on desktop.
8. **Ending (§10):** good. Real stats, a near-miss line in exact tries, a card with mangoes only, and a link that replays. Nothing to fix beyond bug 2.

## Screenshots
- `.shots/paka-kancha-sc-first.png`: Pixel 9 first screen. The pad is below the fold.
- `.shots/paka-kancha-sc-result.png`: the board after a 3-try win on লেভেল ১.
- `.shots/paka-kancha-sc-over.png`: the result panel (৩ তারা, আবার খেলো / পরের লেভেল) and the start of the card. Orca's phone mode repeats the pane, so trust the top part only.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/paka-kancha/PakaKancha.tla --view ai_docs/statecharts/paka-kancha/view.ts --out ai_docs/statecharts/paka-kancha/before-fix
rm -f ai_docs/statecharts/paka-kancha/before-fix/tlc*.out
```
The cfg has `CONSTRAINT Explore` (stop past a broken Enter or a skipped level) to keep the model under 500 states. After the fixes, change `YouPressEnter` so a full row always checks, change `Unlocked` to the contiguous run, and re-run into `after-fix/`. All 8 rules must hold.
