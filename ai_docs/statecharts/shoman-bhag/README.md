# সমান ভাগ: statechart, before the rewrite

Spec `ShomanBhag.tla` / `ShomanBhag.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors the code as it stood at 10:08 on 2026-11-04 (branch `games-to-the-bar`):
- `tools/shoman-bhag/components/bhag-game.tsx`: `apply` and its `speak()` calls, the "a finished serving rests, then the next guests come" effect with its 1.7 s / 2.8 s timer, `restart`, the end and closed screens, the সব ধাপ drawer and the ParentGate.
- `tools/shoman-bhag/lib/game.ts`: `tapBasket`, `tapPlate`, `settle`, `decide`, `cut`, `complete` and `nextItem`.
- `shared/kids-kit.tsx`: `speak()`, `useKidsSession`, `RestScreen` and `ParentGate`.

TLC reached 472 states and 2016 steps. The chart has 19 states and 43 arrows. **3 rules hold and 5 break** (TypeOK and NoDeadlock also hold). All 5 broken rules reproduced live in Orca between 10:07 and 10:10 (+06).

**Since then:** `speak()` in `shared/kids-kit.tsx` now returns early when `!soundOn()`, a fix made after my replay. I re-checked it live at 16:40 (bug 1 below). The `before-fix/` model still shows the code as found.

## Systems modelled
- **Play phase:** two kinds of step stand for the five.
  - A sharing step (ধাপ ১–৩): a plain serving, then the serving with one left over and "শেষ …টা কে পাবে?".
  - The cutting step (ধাপ ৪): cut the last রুটি, then give each guest a piece.

  Each serving ends in "everyone served", which rests on screen. Then the next guests come, or the round ends. After the round: আবার খেলো, পরের ধাপ, শেষ, and the closed screen.
- **Away:** one flag for a hidden tab or another window. The code handles neither.
- **Sound and voice:** the site-wide switch. On a right cut (and on the naming step's answers) `apply` calls `speak()` with the fraction's word.
- **Kids' daily limit:** `atBreak()` in the round-end effect, RestScreen, and extend.
- **Parent gate:** who holds the phone.
- **Results and storage:** `levels.record` once a round, and nothing sent.
- **Reading:** the choices on each screen, and whether each has a picture.

Not modelled: misses and the quiet ease (they only add tries and glows), the naming step (ধাপ ৫, the same speak and the same timers), the idle ghost finger, and the `#og` card. Answers happen on `pointerdown`, which the model treats as a tap.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway (property) | A served table, and the faces after the last-piece choice, wait for you while you're away. | **breaks** |
| SilentWhenMuted (property) | With sound off nothing makes a sound, the voice included. | **breaks** (fixed since) |
| NoDoubleResult | A round is recorded once. | holds |
| RestOnlyAtBreak | The rest screen appears only between rounds. | **breaks** |
| ParentGate | The share link is on screen only while a grown-up holds the phone. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress (stars per ধাপ) is stored. | holds |
| NoReadingNeeded | Where a screen offers two or more choices, each has a picture. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. SilentWhenMuted: "I turned the sound off, and the phone still said 'অর্ধেক' out loud."
- **Path (report):** 1 you pick a step in সব ধাপ (রুটি কাটা) → 2 you turn sound off → 3 you cut the রুটি right: a step that speaks with sound off.
- **Live replay (10:08):** Orca has a Bangla voice (Piya, bn-IN), so `useBanglaVoice` is true. I turned the switch off (`aria-pressed="false"`), wrapped `speechSynthesis.speak`, and played ধাপ ৪ and ৫. It logged **7 `speak` calls** ("অর্ধেক", "চার ভাগের এক ভাগ", "তিন ভাগের এক ভাগ", …), every one with the switch off.
- **Fix:** `speak()` returns when `!soundOn()`. **Landed in `shared/kids-kit.tsx` after this replay.** I re-checked at 16:40: ধাপ ৪ played to the end with sound off made **0 `speak` calls**. **Shared:** it covers every kids' game that calls `speak()` itself. Still open:
  - `SpeakButton` stays visible when sound is off, and now does nothing when tapped. Hide it while muted, or let an explicit tap speak.
  - Turning sound off doesn't `speechSynthesis.cancel()` a word that is already being spoken.

### 2. NoProgressWhileAway: "I gave the last মোয়া to everyone and looked away. When I came back, the happy faces were gone and new guests were waiting."
- **Path (report):** 1 you give everyone the same (the table is served) → 2 you switch to another app or window → 3 the next guests sit down, while you're away.
- **Live replay (10:09):** I chose ধাপ ১ from সব ধাপ and played to "শেষ মোয়াটা কে পাবে?". I tapped ভেঙে সবাইকে দিই and dispatched a window `blur` 50 ms later. A hide can't be replayed, because Orca pins `document.hidden`, and the code has no handler for it either.
  - At the choice: the faces read "অর্পিতা, খুব খুশি" and "প্রিয়াংকা, খুব খুশি", and the dots read done, done, done, –.
  - 3 s later, still away: the prompt read "৬টা জিলাপি, দুজন মেহমান। সবাইকে সমান দাও।", the faces read "অপেক্ষা করছে", and the dots read …, now.

  The 2.8 s that the code keeps "to see the faces" ran out with nobody watching. The round end (record, `sfx.win`, `atBreak`) fires away too.
- **Fix:** hold the serving timer while away (pause on blur or hide, keep the remaining ms), or move on with a tap ("পরের মেহমান"). **Game-specific.** The shared game player's pause covers it if the game moves onto it.

### 3. RestOnlyAtBreak: "The rest screen was up, but new guests had come to the table behind it."
- **Path (report, 5 steps):** today's minutes run out → you pick রুটি কাটা → you cut it right → the round ends (RestScreen up) → you press Tab and Enter behind the rest screen: "রুটি কাটা: how many pieces?", with "Rest screen up".
- **Live replay (10:10):** I set the kids timer to 99999 s in-tab only (reads patched, writes swallowed) and finished ধাপ ২, and `.kk-rest` showed. Then I focused আবার খেলো behind it and sent a trusted Enter. A new round started ("৯টা আম, তিনজন মেহমান। সবাইকে সমান দাও।"), with `.kk-rest` still up.
- **Fix:** RestScreen as a real modal (`<dialog>.showModal()` or `inert` on the game), in kids-kit. **Shared.**

### 4. ParentGate: "The share button stayed out after Ammu gave the phone back."
- **Path (report):** 1 a parent opens বড়দের জন্য → 2 you give everyone the same: "Gate open, child holding".
- **Live replay:** this is the same `ParentGate` code, which I replayed in dinosaur (09:53) and ki-hobe (10:08). In both, the share button stayed open through a whole round. I didn't replay it separately here.
- **Fix:** the gate closes after one action, a timeout, or the next outside tap. **Shared.**

### 5. NoReadingNeeded: "Who gets the last one? I can't read the three buttons."
- **Path (report, 3 steps):** the first table served → the next guests sit down → you give everyone the same: "Last table: who gets the last one?".
- **Live check (10:09):** the leftover choices ভেঙে সবাইকে দিই, ছোটজনকে দিই and আম্মুর জন্য রাখি are three 72 px buttons with **no picture** (`.shots/shoman-bhag-sc-leftover.png`). Only "give it to one guest" has a picture route (tap a plate). The end screen's আবার খেলো, শেষ, পরের ধাপ and আব্বু-আম্মুকে দেখাও are text-only too.
- **Fix:** draw each leftover choice: the piece broken over every plate, the piece by the smallest guest, and the piece under a covered plate for আম্মু. Picture end actions are shared. **Game-specific (leftover) and shared (end screen).**

### Checked and holding
- **NoDoubleResult:** the end effect returns once `phase !== "play"`, and `restart` drops a pending timer through the effect's cleanup.
- **NoNetwork and NoChildData:** no fetch, share-client or `/api` in the game (also its tests), and only `ektukhani-levels-shoman-bhag` is written.

## Quality-bar gaps (game-quality-bar + kids brief)
1. **The leftover choice is words (brief §4):** the game's most interesting moment, "শেষটা কে পাবে?", can't be read by the 5-year-olds it's for (bug 5).
2. **End screen:** four text-only actions.
3. **Servings move on by themselves (brief §2, "never hurry"):** 1.7 s after the last plate, or 2.8 s after the leftover choice, the next guests sit down, even while you're away. A calm tap to continue would let the child look at the faces.
4. **Pause (§7):** none, and no blur or hide handling.
5. **Hints are text (brief §1):** "একজনের প্লেটে বেশি হয়ে গেল। ওই প্লেট থেকে একটা তুলে নাও।" The surprised face and the glowing extra piece carry it visually, which is good. A short spoken hint would serve the youngest.
6. **Pacing (§9):** good. Each ধাপ adds one idea (2 → 3 → 4 plates, then cutting, then naming), a miss eases quietly, and a round takes about 1 minute. Confetti comes only after ধাপ ৫.
7. **Sound (§11):** good. Pick, drop and a soft wrong tone with a gentle shake, a whoosh on the cut, and fraction words spoken where a Bangla voice exists. It plays fully muted.
8. **First screen (§1):** the basket and plates fill the board, a ghost finger shows the first tap, and the first fair share is about 8 taps away. Good.

## Screenshots
- `.shots/shoman-bhag-sc-first.png`: Pixel 9, ধাপ ১ with the basket, two plates and the ghost finger.
- `.shots/shoman-bhag-sc-leftover.png`: ধাপ ২, "শেষ জিলাপিটা কে পাবে?" with the three text-only choices.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/shoman-bhag/ShomanBhag.tla --view ai_docs/statecharts/shoman-bhag/view.ts --out ai_docs/statecharts/shoman-bhag/before-fix
rm -f ai_docs/statecharts/shoman-bhag/before-fix/tlc*.out
```
After the fixes:
- `YouCutItRight` speaks only when `sound` (already true in the code).
- `NextGuestsCome` and `TheRoundEnds` need `~away`.
- `YouTabAndEnterBehindRest` is removed.
- The gate closes on the next child action.
- The leftover and end `Choices` get pictures.

Then re-run into `after-fix/`. All 8 rules must hold.
