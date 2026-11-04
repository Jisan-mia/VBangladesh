# ছায়া মেলাও: statechart, before the rewrite

Kids' game (ছোটদের জন্য, ages 3–6).

Specs:
- `Chhaya.tla` / `Chhaya.cfg` with `view.ts`, output in `before-fix/`.
- `KidsGate.tla` / `KidsGate.cfg` with `gate-view.ts`, output in `gate-before-fix/`. This is the kids' kit parent gate, shared by every kids' game. It has its own spec because it is independent of the round and would double the state count.

Both specs model the code as of 2026-11-04 16:50:
- `tools/chhaya-melao/components/chhaya-game.tsx`, unchanged during this work.
- `shared/kids-kit.tsx` at commit **23fd7c1**. The kit changed twice while I worked (f4f75be at 16:45 and 23fd7c1 at 16:47). See "Found on the earlier kit" below.

**Results:**
- **Chhaya:** TLC reached 228 states and 672 steps; the chart has 13 states and 27 arrows. **9 rules hold and 2 break** (counts include TypeOK, NoDeadlock and StarsNeverDrop).
- **KidsGate:** 42 states. **4 rules hold and 2 break.** Both breaks are the residual chance that a child guesses the sum.

## Systems modelled
- **Play phase:** lamp off → shadow on the wall → right picture (a 1500 ms `NEXT_MS` timer is pending) → next shadow → round over → শেষ (idle). The model uses 2 shadows per round (the code has 6).
- **Away:** there is no blur, visibility or pause handler, so "another window" and "hidden tab" are modelled as one flag.
- **Input and focus:** LevelGrid is on screen in every phase. Focus stays on a level button after you tap it, and moves to a picture when you tap one. The model has an Enter on the last-focused button.
- **Time:** the `NEXT_MS` timer, and the kit's 10 s tick (now only while the tab is focused and visible).
- **Sound:** one-shot sounds only (lamp click, soft miss, `sfx.good`, `sfx.win` or confetti, StarReveal chimes). There are no loops.
- **Results and stars:** `finish()` → `levels.record` (keeps the better result).
- **Kids' limit:** `atBreak()` at round end; the mount check that opens on the rest screen past the limit (23fd7c1); RestScreen as a real modal (f4f75be); a grown-up's "আজ আরও ১০ মিনিট"; reload.
- **Parent gate (KidsGate.tla):**
  - hold start and stop, the 2 s timer, key repeat and blur;
  - the two-digit sum, with two wrong answers closing the gate;
  - one action, then the gate shuts; it also shuts after 60 s, on hide and on pagehide.

Not modelled:
- `#og`, the preview image, which saves nothing.
- Slow mode and the quiet-ease choice count (`choiceCount`, a pure function).
- ShowParent's saved picture. It sits behind the same gate.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | Nothing moves on while you look away: no next shadow, no round end, no chime to an empty room. | **breaks** |
| NoReadingNeeded | For 3–6, every control the child needs to go on is a picture or a number, not a word. | **breaks** |
| KeyNeverWipesTheRound | A stray Enter never throws away a round in progress (the last-focused-button pattern). | holds |
| NoDoubleResult | A round ends and is recorded once. | holds |
| RestOnlyAtBreak | The rest screen is only ever over a finished round or an empty wall, never over a round in play. | holds (broke on the earlier kit) |
| RestStaysUntilAGrownUp | Once the rest screen has come today, no new round starts until a grown-up gives more time. | holds (broke on the earlier kit) |
| NoNetwork / NoChildData | Nothing is sent; only stars and play time are written. | holds |
| StarsNeverDrop | A level's best only goes up. | holds |
| KidsGate: AskNeedsAHold | The sum is asked only after a real 2 s hold. | holds (broke on the earlier kit) |
| KidsGate: TwoTriesPerHold | A child tapping at random gets at most two tries per 2 s hold. | holds (new) |
| KidsGate: ShutsAfterOneAction | The open gate never stays open after its one action. | holds (new) |
| KidsGate: OnlyAGrownUpOpensIt / NoShareForKids | The grown-ups' side opens only for a grown-up. | **breaks by chance**: residual, measured below |

**Key held through the round's end:** there is no game key. A held Enter only repeats a click on the focused element, and at round end focus is on `<body>` (the picked picture unmounts). Live: after a tap on ধাপ ২ and then a picture, `activeElement` was `BODY` and Enter changed nothing. Both patterns hold.

## Bugs (current code)

### 1. NoProgressWhileAway: "I matched the last shadow and switched apps; when I came back the round was over, the stars were saved and the chime had already played" (game)
- **Path:**
  - 0: lamp off
  - 1: you press the switch
  - 2: you tap the right picture
  - 3: you look away
  - 4: a moment later the next shadow comes
  - The round-end version is the same with the last shadow.
- **Live replay (Orca, 10:05, trusted Orca tab; blur and `visibilitychange` were dispatched; the game listens to neither, so the replay is exact even though Orca pins `document.hidden`):**
  - (a) I tapped the right picture at t = 17 548 ms and went away at once. At 19 000 ms (+1452 ms) the next shadow was up (`dots done,now,…`), and the lamp click (2 oscillators) played while away.
  - (b) On the 6th shadow I tapped the right picture and went away. At +1473 ms `finish()` ran while away:
    - `ektukhani-levels-chhaya-melao` became `{"1":3}`;
    - `sfx.win` (4 oscillators) and three StarReveal chimes (at +260, +520 and +780 ms) played;
    - `.cm-done` showed. With that day over the limit, the rest screen came up too.
- **Fix:** keep the `NEXT_MS` id. On blur or `visibilitychange → hidden`, clear it and remember that it was pending. On return, run it again after the same 1.5 s, so the child sees the object reveal and the result. The shared game player's away hook should do this for every game. **Shared pattern** (all three of my games).

### 2. NoReadingNeeded: "My 4-year-old finished six shadows and then didn't know which button meant 'again'" (game)
- **Path:** 0 → 1 switch → 2 right → 3 next shadow → 4 right → 5 round ends. The done screen offers আবার খেলো, শেষ and আব্বু-আম্মুকে দেখাও, all words only.
- **Live (Orca, Pixel 9, 16:5x):** the buttons read `["আবার খেলো","শেষ","আব্বু-আম্মুকে দেখাও"]` and none has an icon. On a phone they sit below the fold under the six found pictures (`.shots/chhaya-melao-done-phone.png`).
- **Fix:** give each button a picture: ↻ or the lamp switch for আবার খেলো, a closed door or a moon for শেষ, two adult faces for আব্বু-আম্মুকে দেখাও. Show the found pictures smaller, or after the buttons, so the next action is on the first screen. **Game** (the kit's `ShowParentButton` is word-only too, so that part is shared).

## Found on the earlier kit, fixed by f4f75be and 23fd7c1 (re-checked live)
These broke in my first run (10:04–10:13). The kit was then changed, and I re-checked them on the current kit at 16:46–16:50.

- **RestOnlyAtBreak:** "behind the rest screen, my child pressed Tab and Enter and was playing again."
  - **Then:** Tab from `<body>` reached the header (1–12), then ধীরে, শব্দ, আবার খেলো, শেষ and আব্বু-আম্মুকে দেখাও, and at step 19 `ধাপ ১`. Enter started a round under the rest screen (`rest:true, dots now, 2 choices`). Shift+Tab and Enter on the right picture matched it (`dots done`, শাপলা).
  - **Now (দাঁড়িপাল্লা, same kit):** Tab, Tab, Shift+Tab, Enter and Space changed nothing. A scripted `focus()` and `click()` on আবার খেলো, and a level click in সব ধাপ, were blocked, and focus went back to `.kk-rest`. On a fresh rest screen, Tab moved only to the gate inside it. **Holds.**
- **RestStaysUntilAGrownUp:** "after the rest screen, a reload gave a whole new round."
  - **Then:** with 3830 s played today (limit 15 min), a reload showed no rest screen, and the switch started a round.
  - **Now:** I set the time key to 1000 s, reloaded, and the page opened on `.kk-rest` with focus inside it. I restored the key afterwards. **Holds.**
- **Gate, AskNeedsAHold:** "two fingers for a moment, or a short Enter, and the sum came up."
  - **Then:** two touch pointers held for 200 ms opened the question 2.0 s later. Enter held 581 ms (2 repeats) opened it 1.5 s after release. One finger for 200 ms did not.
  - **Now:** the same two-finger and Enter-with-repeats inputs give no question at 2.2 s, and one finger for 2.1 s asks. **Holds.**
- **Gate, child mashing:**
  - **Then:** wrong answers only cleared the pad. In 20 trials of random taps, the median was **136 taps** to open (min 5, five trials under 40), because sums of 6–9 took one digit.
  - **Now:** sums are 10–18, the gate closes after 2 wrong answers, and each try needs a new 2 s hold. 80 s of random play gave 39 holds, 156 taps and **2 opens** (each session closed after 4 taps). That is about 1 open per 20 holds.

## Residual (current kit)
- **OnlyAGrownUpOpensIt / NoShareForKids (KidsGate):** a child who keeps up 2 s holds and taps at random still gets in about once per 20 holds (≈ 1 in 100 per try). Once in, one action (the share) runs, and then the gate shuts. **Shared.** If this is too high:
  - keep `misses` across openings, for example locking the gate for 1 minute after 2 failed holds; or
  - ask for the digits in order on a shuffled pad.
- **Shared page frame, observed and not modelled:** the child's view shows the site header with a free-text search box and links to গেম, কুইজ and টুলস. "এগুলোও ভালো লাগতে পারে" links to adult tools (আমার ছোটবেলা). The kids' brief says no free-text input and no outbound links in the child's view. `PageFrame` should take a kids variant: logo, ছোটদের খেলাঘর, and related kids' games only.

## Quality-bar gaps (game-quality-bar), played end to end in Orca (desktop and Pixel 9)
1. **First screen (§1):** good. The switch is the game's own art and the largest thing on the wall. The ghost finger shows on the first visit.
2. **Ending (§10):** the next action is below the fold on a phone, and in words only (bug 2). The method line ("প্রথমবারেই সবগুলো…") is good.
3. **Choices (§4, §2):** the five levels are bare numbers. Nothing says what ধাপ ৪ (same family) or ধাপ ৫ (turned shadows, 6+) changes. Show a small picture of the change on each chip.
4. **Stray taps:** LevelGrid is live under the wall during play, so a single tap on a number restarts the round with no warning. Hide it or dim it while a round is on.
5. **Pause and away (§7):** there's no pause, and the timer runs on while away (bug 1).
6. **Pacing (§9):** 5 levels × 6 shadows with one new idea each. That's good. Level 5's turns jump to age 6+ with no bridge (a 90° turn first, then flips).
7. **Sound (§11):** a lamp click, a soft miss, the good and win sounds, and star chimes. The game works on mute. There's no signature sound.
8. **Celebration:** confetti appears only when every level has its first star, which follows the brief.

## Screenshots
- `.shots/chhaya-melao-rest.png`: the rest screen covering the page (earlier kit; it looks the same now).
- `.shots/chhaya-melao-first-phone.png`: the Pixel 9 first screen, with the header search and adult nav visible above the game.
- `.shots/chhaya-melao-done-phone.png`: the Pixel 9 done screen, with the buttons below the fold.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/chhaya-melao/Chhaya.tla --view ai_docs/statecharts/chhaya-melao/view.ts --out ai_docs/statecharts/chhaya-melao/before-fix
scripts/statechart.sh ai_docs/statecharts/chhaya-melao/KidsGate.tla --view ai_docs/statecharts/chhaya-melao/gate-view.ts --out ai_docs/statecharts/chhaya-melao/gate-before-fix
rm -f ai_docs/statecharts/chhaya-melao/*before-fix/tlc*.out
```
Each `--out` folder must be new or empty. `Chhaya.cfg` has `CONSTRAINT Explore`, which stops past a broken history rule to stay under 500 states. After the fix, gate `NextShadowComes` and `RoundEnds` on `~away`, add the picture set to `Pictured`, and re-run into `after-fix/`.
