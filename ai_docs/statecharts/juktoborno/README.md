# যুক্তবর্ণ ভাঙি-জুড়ি: statechart (before the rewrite)

The model covers the game as it stood on 2026-11-04 (branch `games-to-the-bar`). Files: `Juktoborno.tla`, `Juktoborno.cfg` and `view.ts`. The output is in `before-fix/` (`report.md` and `chart.mmd`). TLC reached 372 states. The chart draws 20 states in 4 regions.

Live replays ran in Orca's browser at http://127.0.0.1:3100/juktoborno, 09:48–10:12 and 16:40 (+06). At 10:12 another agent changed `speak()` in `shared/kids-kit.tsx` so it checks `soundOn()`. The spec models that fixed `speak()`. The replay at 09:52 shows the old behaviour.

## Systems modelled
- **Round:** word 1 → built → পরেরটা → word 2 → built → শেষ → the round card → শেষ ("কারখানা আজকের মতো বন্ধ"). Also আবার খেলো, পরের ধাপ, নতুন খেলা and a level from "সব ধাপ". The model has 2 words; the game has 6.
- **Stars:** `useLevels.record` → `recordLevel`, which keeps the max of the old and new stars.
- **Voice:** `speak(word)` on a solved word, and the site-wide `SoundToggle`.
- **Kids' daily limit:** `useKidsSession` time passing, `atBreak()` at round end, `RestScreen`, and `extend()` behind the gate.
- **Parent gate:** the 2-second hold timers (`start`/`stop`), Enter auto-repeat, the sum pad, and closing.
- **Ways out:** the `PageFrame` header (search box, গেম / কুইজ / টুলস), "এগুলোও ভালো লাগতে পারে" and the footer.
- **Not modelled:** pause, blur and visibility. The game has no real-time play, loops or held keys (tiles act on pointerdown). The `clank()` chime timer is left out; see notes.
- **Abstractions:** a word takes about 1 s to say, so speech ends on the next step. The gate works the same on every screen, so the model uses it only on the round card and the rest screen, and leaving the card shuts it. Leaving the page unmounts the game, so the model starts fresh on return.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| RestOnlyAtBreak | The rest screen shows only between rounds, never over a round in play. | **breaks** |
| VoiceOnlyWithSound | Nothing reads aloud while sound is off. | **breaks** |
| GateNeedsAFullHold | The grown-ups' question appears only after a 2-second hold. | **breaks** |
| ChildCannotOpenGate | A child tapping at random can't open the gate. | **breaks** |
| NoWayOutWithoutGate | The child can't leave the kids' area or share without the gate. | **breaks** |
| NoDoubleResult | A round is recorded once. | holds |
| StarsNeverDrop | A level's stars never go down. | holds |
| NoNetwork | Nothing is sent: no `fetch`, tally or `share-client`. | holds |
| NoChildData | Only progress is stored: `ektukhani-levels-juktoborno`, `ektukhani-juktoborno-book`, kids' time and limit, sound and slow. | holds |

NoReadingNeeded does not apply: the game is for ages 7–10, and the rule covers ages 3–5.

## Bugs

### 1. VoiceOnlyWithSound (game: `juktoborno-game.tsx`; shared: `setSoundOn`)
- **Player's sentence:** "I turned sound off, and it still read the word aloud."
- **Path (report):** 1. you put in the last right letter → 2. you turn sound off. The word keeps playing.
- **Live replay:**
  - **09:52, old `speak()`:** sound off (`ektukhani-sound` = "0"), then solve ছক্কা. Result: `speechSynthesis.speak("ছক্কা")` was called with sound "0", and `speechSynthesis.speaking` was true.
  - **16:40, new `speak()`:** sound off, then solve: 0 utterances (fixed). Solve ড্ড, then sound off at once: `speaking` was true before the mute and still true 150 ms after it.
- **Fix:**
  - `setSoundOn(false)` (or `SoundToggle`) calls `speechSynthesis.cancel()` (shared).
  - Keep the new `soundOn()` check in `speak()`.

### 2. RestOnlyAtBreak (shared: `RestScreen` in `kids-kit.tsx`)
- **Player's sentence:** "With a keyboard, I tabbed past the rest screen and started a new round under it."
- **Path:** today's time runs out → finish the round → the rest screen shows → Tab to আবার খেলো under it → Enter.
- **Live replay (10:00):** the shared `ektukhani-kids-time` was 1010 s against a 15-minute limit, so the rest screen showed at round end. 1 Tab from the rest gate moved focus to "সব ধাপ" behind the overlay (`[inert]` count 0). 4 Shift+Tabs reached আবার খেলো, and Enter started a round: `.kk-rest` still shown, 3 tiles live, dots `is-now,,,,,`. The tiles take keyboard Enter too (`onClick` with `detail === 0`), so the child can keep playing past the limit.
- **Fix:** while `RestScreen` (and `ShowParent`) is open, set `inert` on everything else, trap focus, and focus the dialog. Better still, have the shared game player own the rest screen (shared).

### 3. GateNeedsAFullHold (shared: `ParentGate`)
- **Player's sentence:** "I held Enter on বড়দের জন্য for under a second, let go, and the question came up anyway."
- **Path:** someone holds বড়দের জন্য → Enter auto-repeats → they let go before 2 s → 2 s pass → the question shows.
- **Live replay (09:58):** one keydown, then six `repeat` keydowns 33 ms apart, then keyup at 700 ms. Straight after release: no question. At about 2.0 s: "ছয় আর তিন যোগ করলে কত?" showed. Each `keydown` calls `start()`, which overwrites `hold.current`, so `stop()` clears only the last timer.
- **Fix:** in `start()`, return early when a timer is already running or `event.repeat` is set (shared).

### 4. ChildCannotOpenGate (shared: `ParentGate`)
- **Player's sentence:** "My 4-year-old held the button and banged the numbers until it opened."
- **Path:** someone holds বড়দের জন্য → 2 s pass → a child mashes the number pad.
- **Live replay (09:59):** random taps on the pad, 10 trials, all of which opened. Taps needed: 13, 11, 256, 24, 23, 44, 14, 312, 258, 462. A simulation of the same `press()` logic (200,000 runs) opens 28 % of gates within 30 taps and 52 % within 100. Sums of 9 or less open on one digit, with no lockout.
- **Fix:**
  - Lock the pad after 2–3 wrong answers and ask a new question.
  - Ask for a two-digit answer only, or a "type the number in words" task.
  - (shared)

### 5. NoWayOutWithoutGate (shared: `PageFrame` in `site-shell.tsx`)
- **Player's sentence:** "My child tapped a picture under the game and ended up in the grown-ups' tools."
- **Path:** 1 step: the child taps a site link or the search.
- **Live check (10:20):** the page has no off-site (`http…`) links, so the strict "outbound" rule holds. The child's view still has the header search box (free text), গেম / কুইজ / টুলস, the crumbs, and related tools: `/amar-chhotobela` (the flagship, which uses `share-client` to post to `/api/share`), `/ghori-dekhi`, `/moner-rong`, `/sat-tukro` and `/tools`. None of these is behind the gate.
- **Fix:** a kids' frame for category ছোটদের জন্য with no search, no adult hubs and related tools from the kids' section only. Put anything else behind `ParentGate` (shared, site shell).

### Notes (no rule broken)
- **Chime timer:** `clank()` schedules `sfx.good()` 320 ms later and never clears it. Pressing পরেরটা within 320 ms plays the chime on the next word.
- **Ghost click:** a trusted click that solves a word did not ghost-click the পরেরটা button that replaced the tiles (desktop layout).
- **Network after load:** `PerformanceResourceTiming` showed 1 font file and 1 Next RSC fetch (`/juktoborno?_rsc=…`) after load. Both come from the site frame or dev server, not the game, and carry no child data.

## Quality-bar gaps (one full round played at 09:56; level 1 ভাঙি, 6 words, 3 stars)
1. **First screen:** the game sits under an H1, a lead and the folded parent note. In phone layout the tiles start about 460 px down. The start is the tiles, not one big piece of the game's own art.
2. **Choices:** each word shows 3 tiles, which suits the age. Level choice is hidden in a "সব ধাপ" drawer under the game, and পরের ধাপ is a small text link.
3. **HUD:** fine (ধাপ badge and 6 dots at the top), but the ধীরে খেলো pill and the sound toggle sit in the top bar with the level.
4. **No pause or menu:** there is no shared player and no কীভাবে খেলবে. Only the folded parent note and the guide below the page explain the game.
5. **Mistakes:** a soft tone, a shake and a one-line "why", which is good. The glow after 2 tries works, but the ghost finger shows only on level 1, word 1.
6. **Ending:** the card shows real stats (6 equations, a method line). আবার খেলো and শেষ are equal size, and পরের ধাপ is a third, smaller choice. Confetti plays on জুড়ি levels only.
7. **Sound:** clank, puff and chime, plus the word spoken. With no Bangla voice the 🔈 hides and the word is silent, so mute-first works.
8. **Pacing:** 8 levels, one new idea each (ভাঙি then জুড়ি per set), but no "boss" moment at the end of a set.
9. **Kids' frame:** the header search and the adult related tools sit right under the game (see bug 5).

Screenshots: `.shots/juktoborno-first.png` (Pixel 9, word 1 with the ghost finger) and `.shots/juktoborno-end.png` (the rest screen after the round; the shared kids' time was already over the limit).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/juktoborno/Juktoborno.tla --view ai_docs/statecharts/juktoborno/view.ts --out ai_docs/statecharts/juktoborno/after-fix
```
The view hides some arrows to keep the chart readable:
- leaving by a site link from mid-round or from the closed screen
- picking a level mid-round
- the gate shutting when a round starts
