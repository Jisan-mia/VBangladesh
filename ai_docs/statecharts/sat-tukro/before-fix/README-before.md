# সাত টুকরো: statechart before the rewrite

Modelled on 2026-11-04 from the code on branch `games-to-the-bar`. The game is not yet on the shared game player. Files: spec `SatTukro.tla`, config `SatTukro.cfg`, view `view.ts`, and output in `before-fix/` (`report.md`, `chart.mmd`). TLC reached 280 states, and the chart draws 14 states and 37 arrows.

## Systems modelled
- **Round:** empty shadow, half built, picture done (the 1.2 s `finish()` timer is pending), the end screen and the picture list (`phase` is `play`, `end` or `pick`). Two pieces stand for the seven.
- **Picture list:** the title button (ছবি ১/২২) and শেষ both open `LevelGrid`. Picking a tile calls `start()`, which clears the timer and builds a fresh round with a new seed.
- **Hand:** `Board`'s `drag` ref. `pointerdown` sets it, and only `pointerup` or `pointercancel` on the SVG clears it. The physical finger or button is a separate flag.
- **Window:** focused or not. The game has no `blur`, `visibilitychange` or `keyup` handler, so hide and blur act the same. A child's tap needs the page in front.
- **Daily limit:** `atBreak()` runs inside the finish timer, and `RestScreen` covers the page. A parent's "আজ আরও ১০ মিনিট" calls `extend()`. At each break, the model lets the limit be passed or not.
- **Exits:** the parent gate with `ShareToolLink` (the plain address), and every link around the game: `PageFrame`'s header, crumbs, "এগুলোও ভালো লাগতে পারে" cards and footer, plus the print link.
- **Network and storage:** no handler sends anything. Stars go to `ektukhani-levels-sat-tukro` (progress).
- **Not modelled:** sound. The game has no loop and no speech, and every `sfx` goes through `tone()`, which checks `soundOn()`.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After you leave the window, no piece stays stuck to your pointer. | **breaks** |
| ChoiceFreezesPlay | While the picture list is open, nothing behind it moves on. | **breaks** |
| FinishCounts | A finished picture always gets its stars, and the daily limit is always checked. | **breaks** |
| PickerKeepsWork | Opening the list and picking the same picture keeps the pieces you placed. | **breaks** |
| RestOnlyAtBreak | The rest screen appears only on the end screen, never in the middle of a picture. | holds |
| ParentGate | Nothing takes the child out of the game without the parent gate. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored. | holds |
| NoReadingNeeded | A 5-year-old can reach every next step by picture or sound. The game is for ages 5–12, so the 3–5 rule covers age 5. | **breaks** |

## Bugs
I replayed every bug live in my own Orca tab (Pixel 9, 412×923) at http://127.0.0.1:3100/sat-tukro between 09:58 and 10:05 +06. I used synthetic pointer events on the SVG and `.click()` on buttons. The kids' clock (`ektukhani-kids-time`) is shared with other agents and already read 2,810–3,550 s, past the 15-minute default. For replays that needed play to continue, I set the limit to 0 in my tab only by patching `Storage.prototype.getItem`; nothing was written.

### 1. FinishCounts: game code, but the same pattern as গুনে দেখি
- **The player's sentence:** "I finished the boat and quickly picked the next picture. The boat never got its stars, and the rest check was skipped."
- **Path:** place the last piece → tap the picture's name → pick another picture, all within 1.2 s (400 ms in slow mode).
- **Live, 09:58:42:** picture ২ (নৌকা) was done at 1,816 ms, and I picked ছবি ৩ at 1,940 ms. 1.5 s later the game was on ছবি ৩ and stars were still `{"1":3}`: picture ২ was never recorded.
- **Live, 10:04:18 (break check):** after a reload, with the limit long passed (3,550 s), I finished picture ২ and picked ছবি ৫ within the cheer. 1.5 s later there was no rest screen and still no stars for ২. Then I finished ছবি ৫ and left it alone: the end screen came with the rest screen, and the stars read `{"1":3,"5":3}`.
- **Fix:** in the drop that completes the picture, record the stars and call `atBreak()` at once. Leave only the switch to the end screen on the timer, and clear that timer in `start()`.

### 2. ChoiceFreezesPlay: game
- **The player's sentence:** "I finished the house and opened the picture list, and a second later the list vanished and the end screen jumped up."
- **Path:** place the last piece → tap the picture's name during the cheer.
- **Live, 09:58:30:** the seventh piece went in at 1,344 ms ("ঘর হলো।"). I tapped the title at 1,397 ms and the list opened. At 2,699 ms the page had switched to the end screen by itself, with stars `{"1":3}`.
- **Fix:** while the finish timer is pending, make the title button do nothing, or finish at once and then open the list. Clear the timer on every path that leaves `play`.

### 3. PickerKeepsWork: game
- **The player's sentence:** "I tapped the picture's name by mistake. There was no way back, and my half-built house was empty again."
- **Path:** press a piece → drop it in place → tap the picture's name → pick the same picture.
- **Live, 09:58:20:** with 2 pieces placed (`done=2`), I tapped the title. The list showed 22 number tiles and no back or close button. Tile ছবি ১ (marked `aria-current`) gave `done=0`, a fresh round.
- **Fix:** add a "ফিরে যাও" that only sets `phase` back to `play`, and make the current picture's tile do the same instead of calling `start()`.

### 4. InputReleasedWhenAway: game (Board)
- **The player's sentence:** "I was dragging the big triangle, clicked into another window and came back. The triangle followed my mouse without my holding it, and my next tap dropped it instead of picking up the piece I tapped."
- **Path:** press a piece → click into another window (the release lands there).
- **Live, 10:04:58:** `pointerdown` on the big triangle and a move put it at `translate(3.51, 3.89)`. Then a window `blur`, a `focus`, and a `pointermove` with `buttons: 0`: the triangle moved to `translate(7.24, 3.89)`. A press on the parallelogram was ignored (not held), and the release dropped the triangle at `(7.33, 5)`.
- **Caveat:** whether a real OS loses the `pointerup` depends on the platform. Windows Alt+Tab mid-drag can lose it, and a touch that ends without `pointercancel` can too. For touch it is worse: each touch has a new `pointerId`, so `move` and `up` never match the stale drag, and every piece stays dead until the board remounts.
- **Fix:** on `blur`, `visibilitychange` and `lostpointercapture`, run `cancel()`. In `down`, replace a stale drag instead of returning, and ignore moves with `buttons === 0`.

### 5. ParentGate: shared (`shared/site-shell.tsx` PageFrame)
- **The player's sentence:** "I scrolled down, tapped the picture of a lantern, and I was on a grown-ups' page."
- **Path:** one tap on any link around the game.
- **Live, 10:05:10:** the page has 22 links and none is behind a gate. The related cards start 1,320 px below the game: `/amar-chhotobela` (the adult flagship), `/nirapode-thaki`, `/gune-dekhi`, `/hat-dhui` and `/tools`, plus the header (`/`, `/games`, `/quiz`, `/tools`, search) and the crumbs. `.click()` on the flagship card went straight to `/amar-chhotobela` ("তোমার ছোটবেলার কয়টা মেলে?"), with no gate. Inside the game, "কাটার পাতা প্রিন্ট করো" (`/sat-tukro?print`) is also ungated, and it throws away the current round.
- **Fix:** give kids' pages a `PageFrame` variant: a header with only the কিডস home, no search, and the related cards limited to other kids' games. Put adult links and the print sheet behind `ParentGate`.

### 6. NoReadingNeeded: shared pattern (the end buttons) and game (the list)
- **The player's sentence:** "I'm five. Two buttons came up with words on them, and I didn't know which one plays again."
- **Path:** finish a picture (the end screen), or open the list.
- **Live, 10:04:18:** the end buttons are words only: "আবার খেলো" 152×64, "শেষ" 152×64 and "আব্বু-আম্মুকে দেখাও" 220×64, with no picture inside. The list is ১…২২ number tiles plus a text line of names, with no thumbnails, although `FigureArt` exists.
- **Fix:** a kids' end-button pair in the kit with icons (↻ and ✓ / a house) at 96 px. Give the list `FigureArt` thumbnails.

### Rules that hold, checked live
- **RestOnlyAtBreak, 10:04:18:** with the limit long passed, a piece placed mid-picture brought no rest screen; it came only with the end screen.
- **NoNetwork and NoChildData, 10:05:29:** over a whole picture, with `fetch`, XHR and `sendBeacon` wrapped, there were 0 calls and 0 new resources. The only writes were `ektukhani-levels-sat-tukro` and the kit's `ektukhani-kids-time`.

## Quality-bar gaps (judged in Orca, 10:05)
1. **"আবার খেলো" doesn't play again.** It starts the next picture (`level % 22 + 1`), and "শেষ" opens the list instead of a calm finish. The brief asks for a real replay and a real end.
2. **The picture list is a level grid of numbers.** It shows no pictures, no "ফিরে যাও", and doesn't say what the next band changes (outlines go, pieces turn).
3. **The first screen is site chrome first:** the header, search, H1 and parent note fill 269 px before the board, which spans 269–695 px of 923. It fits a Pixel 9, but on a 640 px phone the tray drops below the fold.
4. **Away and back:** no blur or hide handling. A drag survives blur (bug 4), and the 1.2 s cheer and confetti fire while away.
5. **Hints:** the spot lights up only after 3 misses with the piece held over the shadow. Drops outside the shadow never count, so a lost child gets no hint.
6. **Pacing:** 22 pictures in 4 fixed bands, all open from the start. There is no "five right steps up" or "three misses eases"; the bands are the only difficulty.
7. **Ending:** no moment marks a whole band or set ("সব ঘর-বাড়ি হলো"); confetti fires only at the band ends (ছবি ৬, ১২, ১৭, ২২), with no screen that says so.
8. **Sound:** six soft one-shot sounds (pick, good, tap, drop, win, star) and no signature. It works fully on mute ✓.
9. **Targets:** piece hit circles are 87–123 px ✓, and the end buttons are 64 px tall (under 96 px for age 5).

Screenshots: `.shots/sat-tukro-first.png` (the first screen), `.shots/sat-tukro-end.png` (the end screen, ★★☆), `.shots/sat-tukro-rest.png` (the rest screen after a normal finish).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/sat-tukro/SatTukro.tla --view ai_docs/statecharts/sat-tukro/view.ts --out ai_docs/statecharts/sat-tukro/before-fix
rm ai_docs/statecharts/sat-tukro/before-fix/tlc.out
```
The `--out` folder must be new or empty.
