# কার-চিহ্ন বসাও statechart (before the rewrite)

Spec: `KarChinho.tla` / `KarChinho.cfg` / `view.ts`, mirrored from `tools/kar-chinho/components/kar-game.tsx` (`Play`: `tap`, `finish`, `start`, the level button, the 1.1 s timers) and `shared/kids-kit.tsx` (`useKidsSession`, `RestScreen`, `ParentGate`, `ShareToolLink`, `speak`). TLC: 384 states, 2136 steps. Chart: `before-fix/chart.mmd` (25 states, 63 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **Play phase:** word → right sign (the 1.1 s timer is pending) → next word, or the end screen (আবার খেলো / শেষ) → level picker. Two words stand in for ten. The level button at the top opens the picker from any phase and calls `clearTimers()`.
- **Time:** the one timer that matters, `later(…, 1100)`, which runs `finish()` or `nextWord()`. The wrong-tap timer only clears a highlight and isn't modelled.
- **Sound:** the site-wide switch (`SoundToggle`), and `speak(item.word)` on every right tap. The phone is speaking while the timer is pending, because the word is shorter than 1.1 s.
- **Kids' daily limit (kit):** `useKidsSession` counts play time for the whole kids' section. `atBreak()` runs only in `finish()`. `RestScreen` is a full-screen overlay. `extend(10)` takes back 600 s.
- **Parent gates (kit):** the gate under the game (বড়দের জন্য → খেলাটার লিংক পাঠাও) and the gate on the rest screen (আজ আরও ১০ মিনিট, the daily limit). `holder` says who has the phone. A gate's ask stage is folded into one step: a parent holds for 2 s and answers the sum, or a child holds for 2 s and mashes the pad.
- **Page opens:** a reload, or opening the game from the kids' hub after another game's rest screen. `resting` starts false and the first round is on screen at once.
- **Left out:** the tab and window. There's no clock, and the kit already skips hidden time. The only effect is that the 1.1 s timer still fires in a hidden tab, so a round can end while the tab is hidden (harmless). Also left out: the `?print` sheet (static) and stars (`recordLevel` keeps the max, covered by node tests).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| RestOnlyAtBreak | The rest screen comes only between rounds, never over a word. | holds |
| SilentWhenMuted | With sound off, the game never speaks on its own. | **breaks** |
| NoNewRoundPastLimit | Once today's time is up, no new round starts without the rest screen first. | **breaks** |
| EveryFinishCounts | Every finished round counts: its stars are saved and the limit is checked. | **breaks** |
| GateNeedsAnAdult | Only a grown-up gets through a parent gate. | **breaks** |
| GateClosesWhenTheParentHandsBack | When a parent hands the phone back, every gate they opened is closed. | **breaks** |
| NoShareForKids | While the child has the phone, the share link is behind a closed gate. | **breaks** |
| OnlyParentsGiveMoreTime | While the child has the phone, "more time" is behind a closed gate. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

Replays ran in Orca (my own tab, Pixel 9) by clicking the real tiles and buttons, and reading the dots, the overlays and localStorage. Today's kids' time was already past the 15-minute default (900 s) when I started: 1,300 s, rising to 3,000+ s because other agents' kids' tabs tick the same shared counter. That made every rest-screen path reachable without faking anything. `speechSynthesis.speak` was stubbed to record calls (the phone's Bangla voice is Piya, bn-IN, local), so nothing was spoken.

### 1. GateNeedsAnAdult: "my four-year-old got through the বড়দের জন্য gate by mashing the numbers" (shared, kids-kit)
- **Path (1 step):** the child holds বড়দের জন্য and mashes the pad: *share gate opened by the child*.
- **Why:** `ParentGate.press()` keeps the last two digits and opens as soon as `Number(answer)` equals the sum, so "7", "07" and a "…07" run all count. Only a wrong *two-digit* run clears it, and the child can try forever with no lockout. Sums of 9 or less (10 of the 49 pairs) open on a single right digit.
- **Live:** 12 trials, each a 2 s hold, then random pad taps until it opened. **12 of 12 opened**, after 3, 23, 32, 76, 84, 92, 96, 150, 162, 234, 242 and 244 taps. A node simulation of the same `press()` rule (200,000 runs, random sums 3–9 + 3–9) gives a median of 94 taps, a mean of 163, 28% open within 30 taps and 49% within 90. At three taps a second, that's about half a minute.
- **Fix (kit):** ask for a sum of 10 or more (always two digits) and check only after both digits. A wrong answer closes the gate back to the 2 s hold, and three wrong holds lock it for a minute. Add a node test that mashes 10,000 times and expects almost no openings.
- **Also from reading the code (not replayed):** holding Enter or Space on the gate button fires `start()` on every key repeat, and `stop()` clears only the last timer. A half-second key hold still opens the question about 2 s later.

### 2. GateClosesWhenTheParentHandsBack (and NoShareForKids): "I shared the link and gave the phone back; the share button stayed in front of her" (shared, kids-kit)
- **Path (3 steps):** a parent takes the phone → opens বড়দের জন্য → the child takes it back: *share gate opened by a parent, the child has the phone*. NoShareForKids breaks on this path and on bug 1's.
- **Why:** `ParentGate`'s `open` stage lives until someone presses বন্ধ করো or the page reloads. Nothing closes it after its one action, on a new round, or after a while.
- **Live:** the parent opened the gate (correct sum) → আবার খেলো → three words solved. "খেলাটার লিংক পাঠাও" was **still showing** under the game. Screenshot: `.shots/kar-chinho-share-gate-left-open.png`.
- **Fix (kit):** close the gate after its action runs, on the next tap outside it, when a round starts, or after 30 s, whichever comes first.

### 3. OnlyParentsGiveMoreTime: "I set the daily limit, handed the phone back, and she gave herself ten more minutes" (shared, kids-kit)
- **Path (6 steps):** time runs out → the last word → the rest screen → the gate opens (by a parent choosing a limit, or by bug 1) → the child has the phone: *rest gate open*.
- **Why:** on the rest screen, choosing a daily limit (`choose`) only writes the limit. The gate stays open with আজ আরও ১০ মিনিট in it.
- **Live:** rest screen up (`.shots/kar-chinho-rest-screen.png`). The parent held the gate and answered "আট আর নয়" = ১৭, then tapped ১৫ মিনিট. The gate stayed open with আজ আরও ১০ মিনিট, ১০/১৫/৩০ মিনিট and সীমা নেই, and was **still open 15 s later**. The "child's" tap on আজ আরও ১০ মিনিট removed the rest screen, and today's time went from 3,890 s to 3,400 s.
- **Fix (kit):** choosing a limit closes the gate. If the new limit is above today's time (or is সীমা নেই), it also ends the rest screen.
- **Related (kit, seen live):** after extend, today's time was still 3,400 s against a 900 s limit. So "আরও ১০ মিনিট" buys exactly one more round, and the next `atBreak()` rests again. `extend` should set the time to `limit − 10 min` when it is further over than that.

### 4. NoNewRoundPastLimit: "the rest screen came, so she opened কার-চিহ্ন again and got a whole new round" (shared, kids-kit + every kids' game)
- **Path (2 steps):** today's time runs out → the page opens again (a reload, or the game from the kids' hub): *first word, started after today's time ran out*. Picking a level from the level button mid-round does the same.
- **Why:** `useKidsSession` starts with `resting = false` and checks only when a game calls `atBreak()`, which every game does only at a round's end. Each page open, and each round started from the picker, gets one full round past the limit. Going from game to game, the limit never stops play.
- **Live:** the page opened at **3,540 s** (limit 900 s) with the first word ready and no rest screen. After the level picker, a full 10-word round started at **3,670 s**. The rest screen came only at its end (3,780 s), and correctly so: RestOnlyAtBreak holds.
- **Fix (kit):** `useKidsSession` sets `resting` on mount when today's limit has passed, and games call `atBreak()` from `start()` as well as `finish()`. That's a natural break too, before any word is shown. Add a node test: over the limit, a fresh session is resting.

### 5. SilentWhenMuted: "I turned the sound off and it still read every word out loud" (shared, kids-kit `speak`)
- **Path (2 steps):** the child turns sound off → taps the right sign: *sound off, the phone says the word*.
- **Why:** `speak()` never reads `soundOn()`, and `tap()` calls `speak(item.word)` on every right answer. The brief says every game works fully silent ("some families avoid music, children play in shared rooms").
- **Live:** turned 🔊 off (`ektukhani-sound` = 0), then played a full round: **10 `speak()` calls with sound off**: হাতি, ছাতা, কলা, মাছ, বাঘ, জাহাজ, থালা, পানি, ডাব, ধান.
- **Fix (kit):** `speak()` returns early when `!soundOn()`. `SpeakButton`, an explicit tap, may pass `{ force: true }`.

### 6. EveryFinishCounts: "she got all ten words, tapped the level button, and the stars never came" (game-specific)
- **Path (4 steps):** right sign → next word → right sign on the last word → the child taps the level button within 1.1 s: *level picker, the finished round was never counted*.
- **Why:** `finish()` (record stars, `sfx.win`, `atBreak()`) runs from the 1.1 s `later()`. The level button calls `clearTimers()` first, which kills it. That also skips the daily-limit check (bug 4's door).
- **Live:** nine words solved, the tenth solved (all ten dots "got"), then the level button **300 ms later** → picker. `ektukhani-levels-kar-chinho` stayed **null**, there was no end screen, and there was no rest screen even though today's time was 3,610 s.
- **Fix:** record the stars and call `atBreak()` synchronously on the last right tap, and delay only the end screen. Or have the level button flush a pending finish before `clearTimers()`.

### Rules that hold
- **RestOnlyAtBreak:** the rest screen appeared only on the end screen, never over a word (replay 4).
- No `/api/*` request in the resource timing after play, and the share link goes out only through `navigator.share` or the clipboard (behind the gate). The card has no name.

## Quality-bar gaps (two full rounds of level 1 in Orca at Pixel 9, plus the code)
1. **First screen:** good. The picture, the word with its dotted slot and two big tiles (128×96 px) fit one screen (tiles end at 748 px of 923). A ghost finger taps the right tile on the first word. The H1 and the one-line parent note sit above. Screenshot: `.shots/kar-chinho-first-screen.png`.
2. **The level button is a trap:** it sits top-left like a title, leaves a round without asking, and loses a just-finished round (bug 6). Make the round's end immediate, or confirm leaving mid-round.
3. **Mute isn't silent:** the spoken word ignores the switch (bug 5). Every other sound (`sfx.good`, `drop`, `win`) respects it.
4. **The daily limit leaks** through reloads, other games and the picker (bug 4), and through the gates (bugs 1–3).
5. **Pacing:** every level is 10 words in the same format, and only the কার changes. The adaptive choice count (2–4) is good, but there's no named last-level moment beyond confetti on level 10.
6. **Ending:** good. আবার খেলো and শেষ are the same size. There's a one-line informational reward ("এখন তুমি আ-কার বসাতে পারো"), an off-screen task ("ঘরে একটা জিনিস খোঁজো"), and আব্বু-আম্মুকে দেখাও instead of share.
7. **Sound:** no signature sound. The win is the shared `sfx.win`, and the brief allows one soft chime per round. It also isn't on the shared game player yet (no pause menu). That matters little with no clock, but it's needed for the platform.
8. **Mistakes:** good. A gentle shake, "এটা পড়লে হয় …। আরেকবার ভাবো।", and the right tile glows after two tries.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/kar-chinho/KarChinho.tla --view ai_docs/statecharts/kar-chinho/view.ts --out ai_docs/statecharts/kar-chinho/after-fix
rm ai_docs/statecharts/kar-chinho/after-fix/tlc.out
```
After the fixes, the spec changes: `ThePageOpens` and `YouStartARound` call `atBreak()`, so `resting' = overLimit` and the round waits. Any step that leaves a gate's action, or a hand-back, closes the gate. `TheChildOpens…Gate` is gone (or needs a 2-digit answer with a lockout). `YouTapTheRightSign` with sound off doesn't speak. `YouTapTheLevelButton` records a pending finish.
