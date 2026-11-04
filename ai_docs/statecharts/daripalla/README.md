# দাঁড়িপাল্লা: statechart, before the rewrite

Kids' game (ছোটদের জন্য, ages 6–11), so NoReadingNeeded (ages 3–5) doesn't apply.

Spec `Daripalla.tla` / `Daripalla.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).

The spec models the code as of 2026-11-04 16:50:
- `tools/daripalla/components/balance-game.tsx` and `lib/game.ts`, unchanged during this work;
- `shared/kids-kit.tsx` at commit **23fd7c1**;
- `shared/game-kit.ts` (`useGameLoop`).

**Results:** TLC reached 496 states and 1665 steps. The chart has 13 states and 25 arrows. **9 rules hold and 3 break** (counts include TypeOK, NoDeadlock and the two action properties).

The shared parent gate is modelled once, in `../chhaya-melao/KidsGate.tla`.

## Systems modelled
- **Play phase:** a pan tipped → level (fill: done; find: "what does the fruit weigh?" → the right number → done) → পরের পাল্লা → … → the last pan rests for 1800 ms → the end screen (আবার খেলো, পরের ধাপ, শেষ) → দোকান বন্ধ.
  - The model has 2 levels (a fill level and a find level) and 2 pans per round (the code has 5).
  - Stars are 3 for a clean round and 1 otherwise.
- **Input:** `press()` acts on the first pointerdown, or on a click with `detail 0`, so the following mouse click is ignored. পরের পাল্লা has a plain `onClick` and replaces the tray under the finger. The model has one atomic step: "on a phone, you tap the weight that levels the pan".
- **Away:** `useGameLoop` pauses the beam spring on blur and hide (visual only). Nothing pauses the round-end timer.
- **Time:** the round-end effect's 1800 ms timer (900 in slow mode), which is dropped whenever `round` changes. The idle ghost-finger timer was left out, because it changes nothing the child must do.
- **Sound:** one-shot sounds only (clink, thunk, soft, `sfx.win`, confetti on levels 3 and 7). There are no loops.
- **Levels and stars:** the সব ধাপ drawer (`restart(level)`, always live), `levels.record`, `unlockedLevel`.
- **Kids' limit:** `atBreak()` at round end; the past-the-limit mount check; RestScreen as a modal; a grown-up's "আরও ১০ মিনিট"; reload. A `touched` flag tells a fresh round from one in play.

Not modelled: `#og` (OgCard), the pace and quiet-ease logic (`miss` and `finish` in `lib/game.ts`, which are pure and tested), and the ShowParent card.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| YouSeeEveryPanBalance | The tap that levels a pan never also presses পরের পাল্লা; you see each pan balance. | **breaks** |
| EveryFinishedRoundCounts | A round you finished is always recorded, even if you pick a level in the moment before the stars. | **breaks** |
| NoProgressWhileAway | The round doesn't end, and no win chime plays, while you look away. | **breaks** |
| NoDoubleResult | A round is recorded once. | holds |
| RestOnlyAtBreak | The rest screen is only over the end screen, the closed shop or an untouched round. | holds (broke on the earlier kit) |
| RestStaysUntilAGrownUp | After the rest screen, no round is played until a grown-up gives more time. | holds (broke on the earlier kit) |
| NoNetwork / NoChildData | Nothing is sent; only stars and play time are written. | holds |
| StarsNeverDrop / UnlockNeverShrinks | | hold |

**Key held through the round's end:** the end screen comes from a timer, not a key. A held Enter on a tray weight repeats additions until the pan levels. Then the tray unmounts and focus falls to `<body>`, so the end screen isn't skipped. **Enter on the last-focused button:** a tap on a weight focuses that weight, not the drawer, so a stray Enter only adds that weight. Both patterns hold.

## Bugs (current code)

### 1. YouSeeEveryPanBalance: "On my phone, the moment the pan levelled the next pan was already there; I never saw it balance or heard what I'd made" (game)
- **Path:** 0 first pan tipped → 1 on a phone, you tap the weight that levels the pan: straight to the next pan.
- **Why:** `press()` acts on `pointerdown`, which levels the pan and swaps the tray for পরের পাল্লা (one full-width column). Chrome sends a touch tap's click to the element under the finger when the tap ends, and পরের পাল্লা has a plain `onClick`. The `detail === 0` guard protects the weights and numbers, but not this button.
- **Live replay (headless Chrome over CDP, `Input.synthesizeTapGesture`, touch emulation, 412×915, 16:5x):** Orca can't make a trusted touch tap that produces a click. Its `tap` sends touch events to `<html>` and no click, and `click` is a mouse even in phone mode. So this one replay ran in headless Chrome with a fresh profile. 3 trials out of 3:
  - **Trial 1:** the pan was ৮ vs ১ + ৫, and I tapped the ২ weight. Events: `pointerdown:touch`, then `click:touch:kit-primary`. The dots went `now,-,-,-,-` → `done,now,-,-,-`. The next pan (১০ vs ৭) was already up, and the "পাল্লা সমান: …" line had been wiped by `goNext()`.
  - **Trials 2 and 3:** the same on the next two pans.
- **Fix:** don't put a plain-click button where the finger is. Show পরের পাল্লা after the clink (about 600 ms), or give it `press()` with the same pointerdown guard, or ignore clicks on it for 400 ms after it mounts. **Game** (tap-through after a pointerdown re-render is a shared pattern to lint for).

### 2. EveryFinishedRoundCounts: "I finished all five pans, tapped ধাপ ১ in সব ধাপ, and my stars never came" (game)
- **Path:** 0 → 1 you tap a weight (level) → 2 you press পরের পাল্লা → 3 you tap a weight (the last pan levels; 1.8 s to the stars) → 4 you pick a level in সব ধাপ: a fresh round, and nothing recorded.
- **Live replay (Orca, 16:5x):**
  - I cleared `ektukhani-levels-daripalla` and played ধাপ ১ to the last pan ("পাল্লা সমান: ২ + ৫ + ২ = ৯", dots all `done`).
  - With the drawer open, I tapped ধাপ ১ 0.4 s later, and the dots were `now,-,-,-,-`.
  - 2.5 s later there was no end screen and the stars key was still `null`. Today's card still counted the five pans.
- **Fix:** record the stars in `apply()` when the last pan is done, and keep the 1.8 s pause only for the end screen. Or make `restart()` flush a pending finish first. **Game.**

### 3. NoProgressWhileAway: "I levelled the last pan and switched away; the win chime played and the stars were saved while I was gone" (game)
- **Path:** 0 → 1 tap (level) → 2 পরের পাল্লা → 3 tap (last pan level) → 4 you look away → 5 the end screen comes.
- **Live replay (Orca, 16:44):** I played ধাপ ১ to the last pan, levelled it, and dispatched `blur` at once. 2.3 s later, still away:
  - `.dp-over` showed "৫বার পাল্লা সমান করলে।";
  - the stars key was `{"1":3}`;
  - `sfx.win` and the star chimes (6 oscillator starts) had played. That day was over the limit, so the rest screen came up too.
  - The beam spring did pause (`useGameLoop`), and the round timer didn't.
- **Fix:** gate the round-end timer on being here. Clear it on blur or hide and start it again on return, through the shared away hook. **Shared pattern** (all three of my games).

## Found on the earlier kit, fixed by f4f75be and 23fd7c1
- **RestOnlyAtBreak:**
  - **Then:** behind the rest screen, Tab reached আবার খেলো, শেষ and পরের ধাপ (steps 11–13). A dev-server reload interrupted this before Enter. The full path, Enter starting play under the rest screen, was replayed on ছায়া মেলাও and মঙ্গলে রোভার with the same kit.
  - **Now (16:46):** after a round with the rest screen up, Tab, Tab, Shift+Tab, Enter and Space did nothing. A scripted `focus()` and `click()` on আবার খেলো, a drawer level click and a pointerdown were all blocked, and `activeElement` went back to `.kk-rest`. **Holds.**
- **RestStaysUntilAGrownUp:**
  - **Then:** a dev-server reload dropped the rest screen and the game was playable at once.
  - **Now:** I set the time key to 1000 s and reloaded. The page opened on `.kk-rest` with focus inside, and Tab moved only to its gate button. I then restored the key to its earlier value plus the elapsed ticks. **Holds.**

## Quality-bar gaps (game-quality-bar), played end to end in Orca (an autopilot read the round from React state and cleared all 7 levels in 35 s)
1. **Phone tap-through (§4, "never rush"):** the balanced moment, which is the game's point, is skipped on phones (bug 1).
2. **Stray restart:** সব ধাপ restarts the round at once, with no "এই দানটা ছেড়ে দেবে?". It can also swallow a finished round (bug 2).
3. **Pause and away (§7):** there's no pause, and the round-end timer runs while away (bug 3).
4. **Pace leaks across levels:** `restart(level)` passes `round.pace`, so a child eased on ধাপ ২ starts ধাপ ৩ eased too, and a brisk one starts brisk. It's never announced, so it's minor, but the brief says easing is per item.
5. **First screen (§1):** the game starts straight into the first pan, with no start action. For 6–11 that's fine, but the ParentNote sits inside `#tool` above the scale and pushes the tray down on a phone.
6. **Ending (§10):** good. Real counts ("৫টা ফলের ওজন বের করলে।"), a method line only when earned, পরের ধাপ named by its label, and আব্বু-আম্মুকে দেখাও.
7. **Pacing (§9):** good. Fill to 10, fill to 20, fruits, an unknown fruit, an unknown plus a weight, two unknowns, then ★ equations: one new idea per level. The last level has no finale.
8. **Sound (§11):** the brass clink is a real signature, with a soft thunk for a tip and no buzzer. The game works on mute.

## Screenshots
- `.shots/daripalla-level4.png`: ধাপ ৪, the hidden-weight pineapple, the ghost finger on ৫ and the equation `? > ০`.
- `.shots/daripalla-end7.png`: the end of ধাপ ৭.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/daripalla/Daripalla.tla --view ai_docs/statecharts/daripalla/view.ts --out ai_docs/statecharts/daripalla/before-fix
rm -f ai_docs/statecharts/daripalla/before-fix/tlc*.out
```
The `--out` folder must be new or empty. `Daripalla.cfg` has `CONSTRAINT Explore`: it stops past a broken history rule, and explores level 2 and the over-the-limit part only with clean rounds, which keeps it at 496 states. After the fixes:
- make `YouTapTheLastWeightOnAPhone` land on nothing;
- record the stars in `YouPutOnAPiece` and `YouChooseAWeight` when the last pan is done, so `Restart` never loses one;
- gate `TheRoundEnds` on `~away`;
- re-run into `after-fix/`.
