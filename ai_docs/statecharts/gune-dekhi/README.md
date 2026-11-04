# গুনে দেখি: statechart before the rewrite

Modelled on 2026-11-04 from the code on branch `games-to-the-bar`. The game is not yet on the shared game player. Files: spec `GuneDekhi.tla`, config `GuneDekhi.cfg`, view `view.ts`, and output in `before-fix/` (`report.md`, `chart.mmd`). TLC reached 262 states, and the chart draws 14 states and 43 arrows.

## Systems modelled
- **Round:** five ponds a round (two in the model), each asked and then right. The 1.1 s effect after a right answer brings the next pond, or after the last one records the stars, calls `atBreak()` and shows the end card. `phase` is `play`, `end` or `closed` (after শেষ).
- **Modes and steps:** the three mode buttons are always on screen (two modes in the model: গুনি and এক নজরে), and the "সব ধাপ" drawer is always there too. Both call `restart()`, which drops the pending 1.1 s timer.
- **Glimpse (এক নজরে):** the pattern shows for 1.5 s on each new pond, again on "আবার দেখাও", and again after a miss.
- **Window:** focused or not. There is no `blur` or `visibilitychange` handler, so hide and blur act the same. A tap needs the page in front.
- **Sound and speech:** the site switch. `tone()` and `sfx` check `soundOn()`; `speak()` doesn't. The model gives the phone a Bangla voice, as many Android phones have.
- **Daily limit:** `atBreak()` runs at the round end, `RestScreen` covers the page, and a parent can extend.
- **Exits:** the parent gate with `ShareToolLink`, and the `PageFrame` links around the game.
- **Network and storage:** nothing is sent. Stars go to `ektukhani-levels-gune-dekhi`; the today card lives in memory only.

The ghost flags `dropped` and `spokeMuted` are true only in the state right after the step that caused them. This keeps the model under 500 states.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| FinishCounts | A round you finished always gets its stars, and the daily limit is always checked. | **breaks** |
| GlimpseOnlyWhileWatching | The 1.5 s pattern never runs out while you're looking away. | **breaks** |
| SilentWhenMuted | With sound off, nothing makes a sound, speech included. | **breaks** |
| RestOnlyAtBreak | The rest screen appears only on the end card, never in the middle of a round. | holds |
| ParentGate | Nothing takes the child out of the game without the parent gate. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored. | holds |
| NoReadingNeeded | A 3–5-year-old can reach every next step by picture or sound. | **breaks** |

## Bugs
I replayed every bug live in my own Orca tab (Pixel 9, 412×923) at http://127.0.0.1:3100/gune-dekhi between 10:06 and 10:07 +06. I used synthetic `pointerdown` (the game acts on pointerdown) and `.click()`. The Orca browser has no Bangla voice, so in my tab only I replaced `SpeechSynthesisUtterance` and `speechSynthesis.getVoices`/`speak` with a recorder holding one `bn-BD` voice, and I counted `OscillatorNode.start` calls to measure real sound. I also turned the limit off (or set it to 1 minute) in my tab only by patching `getItem`.

### 1. FinishCounts: game code, but the same pattern as সাত টুকরো
- **The player's sentence:** "I counted the fifth pond and tapped the dice right away. The three stars never came, and the rest check was skipped."
- **Path:** answer the last pond right → tap a mode button (or a step in the drawer) within 1.1 s.
- **Live, 10:06:49:** with the limit set to 1 minute and the clock at 3,960 s, all five dots were done at 6,249 ms. I tapped এক নজরে 0.4 s later. 1.4 s after that there was no end card, no rest screen, and stars were `null`. The same round left alone gave the end card ("৫টা পুকুরে মোট ১৭টা মাছ গুনলে।"), the rest screen, and `{"1":3}`.
- **Fix:** record the stars, add to today and call `atBreak()` in `onAnswer` when the fifth answer is right. Keep only the end card on the timer. Or make mode buttons and the drawer do nothing while `stage === "done"`.

### 2. SilentWhenMuted: shared (`shared/kids-kit.tsx` `speak()`)
- **The player's sentence:** "My mother turned the sound off so I wouldn't wake my sister, and the phone still said 'এক, দুই, তিন' out loud."
- **Path:** turn sound off → tap a fish (or answer right).
- **Live, 10:06:24:** after the toggle ("শব্দ বন্ধ", `ektukhani-sound` = `0`), I counted 4 fish and answered. That gave 0 oscillator starts and 5 speech calls: এক, দুই, তিন, চার, চার, every one with sound = 0.
- **Fix:** in `speak()`, return at once when `!soundOn()`. Also `speechSynthesis.cancel()` when the switch turns off. `SpeakButton` may stay, since it is the child's own request.

### 3. GlimpseOnlyWhileWatching: game
- **The player's sentence:** "I opened এক নজরে, looked at my brother for a second, and the dice was already hidden."
- **Path:** tap এক নজরে → look away (another window or tab).
- **Live, 10:06:33:** at 83 ms the pattern was showing, and then a window `blur` fired. At 1,785 ms, still away, the pattern was hidden; it stayed hidden when I came back. Orca pins `document.hidden` to false, so I used `blur`. The game has no handler for either, so hiding the tab behaves the same.
- **Fix:** start the 1.5 s glimpse only while the page is visible and focused. On blur or hide, cancel it and show the pattern again on return.

### 4. ParentGate: shared (`shared/site-shell.tsx` PageFrame)
- **The player's sentence:** "I scrolled down and tapped a picture, and I was on a grown-ups' page."
- **Live, 10:07:** the page has 21 links and none is behind a gate. The related cards start 1,475 px below the game: `/amar-chhotobela` (adult), `/hat-dhui`, `/abc-bazar`, `/ulto-khela` and `/tools`, plus the header with search, the crumbs and the footer. The same tap replayed on সাত টুকরো opened `/amar-chhotobela` directly.
- **Fix:** as in সাত টুকরো, use a kids' `PageFrame` with no adult links in the child's view.

### 5. NoReadingNeeded: shared pattern (the end buttons)
- **The player's sentence:** "I'm four. Three buttons came up with words on them, and I pressed the small one by mistake."
- **Path:** finish a round (the end card).
- **Live, 10:07:** the end card's buttons are words only: "আবার খেলো" 158×72, "শেষ" 158×72 and "পরের ধাপ: ১–১০" 140×49, plus "আব্বু-আম্মুকে দেখাও". None has a picture, and all are under the 96 px target for ages 3–5. The mode buttons are fine: a fish with ১, a dice, two ponds, 119×96. With no Bangla voice, the switch from "কোন পুকুরে মাছ বেশি?" to "কয়টা মাছ বেশি?" in step 3 is written only, though the ghost finger helps after two tries.
- **Fix:** the same kit end-button pair as সাত টুকরো (↻, ✓, and → for the next step, each with a picture), at 96 px.

### Rules that hold, checked live
- **RestOnlyAtBreak, 10:06:49:** with the limit set to 1 minute and passed, ten ponds were played with no rest screen; it came only with the end card.
- **NoNetwork and NoChildData, 10:06–10:07:** over two rounds, with `fetch`, XHR and `sendBeacon` wrapped, there were 0 calls and 0 new resources. The only writes were `ektukhani-levels-gune-dekhi`, `ektukhani-kids-time` and `ektukhani-sound`.

## Quality-bar gaps (judged in Orca, 10:06–10:08)
1. **Acting on `pointerdown`:** a 3-year-old who scrolls with a finger on the pond counts a fish or answers a tile. The scroll itself becomes a move. Act on `pointerup` within a small distance instead.
2. **One stray tap restarts the round:** the mode buttons and the drawer sit right above and below the pond and restart with no question asked (and they cause bug 1).
3. **Site chrome before play:** the play area starts at 347 px of 923 (38 % of the screen), under the header, search, H1, parent note and modes.
4. **No away handling:** the glimpse, the 7 s idle ghost and the 1.1 s next-pond timer all run while away.
5. **The end card has too many words:** three text buttons, the "পরের ধাপ" one smaller than the rest. It could be one picture row (↻ / ✓ / →).
6. **Speech ignores mute** (bug 2). Mute-first is a brief rule.
7. **Good, keep it:** the ease carries across rounds and lifts after five clean answers; the answer glows and the ghost finger shows after two tries; the wrong tone is soft; confetti comes only at step 3; শেষ gives a calm "মাছগুলো পুকুরেই রইল।"

Screenshots: `.shots/gune-dekhi-first.png` (the first screen, গুনি), `.shots/gune-dekhi-beshi.png` (কোনটায় বেশি after two misses: the right pond glows).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/gune-dekhi/GuneDekhi.tla --view ai_docs/statecharts/gune-dekhi/view.ts --out ai_docs/statecharts/gune-dekhi/before-fix
rm ai_docs/statecharts/gune-dekhi/before-fix/tlc.out
```
The `--out` folder must be new or empty.
