# সুর বানাই statechart (before the rewrite)

A kids' game (ছোটদের জন্য, ages 3–12). Spec: `SurBanai.tla` / `SurBanai.cfg` / `view.ts`, mirrored from `tools/sur-banai/components/sur-game.tsx`, `tools/sur-banai/lib/sound.ts`, `shared/game-sound.ts`, `shared/kids-kit.tsx` and `shared/site-shell.tsx`. Modelled against the current shared kit (commits f4f75be and 23fd7c1). TLC: 249 states, 964 steps. Chart: `before-fix/chart.mmd` (33 states, 137 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **Screen:** the free grid (আমার সুর), the match grid (সুরটা মেলাও), the saved card, the won card, and idle (শেষ). Mode and phase are folded into one variable.
- **The beat loop:** `startPlay`'s `setTimeout` chain plays either your tune (it loops) or the tune to copy (it ends, then `heard`). `stopPlay` ends it.
- **Your tune:** whether the free grid holds notes that aren't kept yet (`unsaved`).
- **Choices:** the সব সুর drawer (`<details>`) and picking a tune from it (`openLevel`).
- **Away and back:** on the page, another window (blur), tab hidden. The code has only `visibilitychange → stopPlay()`, and no blur listener.
- **Sound:** the site-wide switch, and whether the last beat made a sound. There is no `loop()` and no cached audio node: every beat calls `playBeat → tone()`, which reads `soundOn()` there and then. So the "`??=` keeps a silent stub" pattern can't happen, and the model proves the next beat after sound-on is heard.
- **Speech:** `<SpeakButton>` and `speak()`.
- **Kids' rules:** the daily limit: `resting` is "atBreak" when `atBreak()` fires at a round's end, or "atOpen" when the page opens past today's limit (23fd7c1). `RestScreen` is a real modal (f4f75be). Also the parent gate's 2-second hold, and leaving the kids' section through the related-tool cards under the game.
- **Reduction:** the gate and the voice share no variable with the game. Each is explored from the first screen while the rest of the page waits, which keeps TLC under the 500-state chart budget. No rule mixes them with the game.
- **Left out:** stars. `check()` computes them once and `levels.record` keeps the higher count (`shared/game-core.ts:69`). `tests/sur-banai.test.ts` covers "stars are a record of checks". It's a kids' game with no real-time play, so there's no P, Esc or pause menu to model.
- **Keyboard patterns:** the game has no key handler. Enter only clicks the focused button. Live: Enter on মিলিয়ে দেখো gave the won card with focus on BODY. A held key can't skip the result, and Enter can't hit a stale button. Both patterns hold.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| SilentWhenHidden | The tune stops when the tab hides. | holds |
| NoProgressWhileAway | Nothing plays on its own while you're in another window. | **breaks** |
| BeatOnlyWithSound | When you turn sound off, nothing keeps ringing. | holds since f4f75be (was bug 4) |
| LoopComesBack | Turn sound back on and the next beat is heard. | holds (live too) |
| ChoiceFreezesPlay | While the সব সুর list is open, the tune doesn't play on. | **breaks** |
| RestOnlyAtBreak | A rest screen that comes during play comes only after a tune is kept or matched (the FAQ promises "মাঝপথে নয়"). Opening the page past the limit is a break too. | **breaks** |
| RestKeepsYourTune | The rest screen never covers a tune that isn't kept yet. | **breaks** |
| QuietUnderRest | Nothing plays or reacts under the rest screen. | holds (live: taps and Enter behind it did nothing) |
| SilentWhenMuted | Sound off means silent, the voice included. | holds since f4f75be (was bug 3) |
| HoldMeansHold | The parent gate's question opens only after a real 2-second hold. | holds since f4f75be (was bug 6; re-checked live) |
| NoWayOutWithoutGate | No way out of the kids' section without the parent gate (ParentGate / NoShareForKids). | **breaks** |
| NoReadingNeeded | For ages 3–5, every screen has a way on by picture or sound. | **breaks** |
| NoNetwork / NoChildData | Nothing is sent and nothing but tunes and stars is stored. | holds (structural: no fetch, no `/api`, `share.normalize` returns null; checked live) |
| TypeOK, NoDeadlock | | hold |

## Bugs
Replays ran in my own Orca tab at Pixel 9. In-page instrumentation counted `OscillatorNode.start`, logged `OscillatorNode.stop` offsets and `speechSynthesis.speak/cancel`, and read the playhead from `.sb-cell.head`. The shared keys `ektukhani-sound` and `ektukhani-kids-time` were stubbed **in my tab only**, so other agents' storage was never written. Today's real kids timer read 5,020 s, over the 15-minute limit, so `atBreak()` returned true with no stubbing at all. Blur and focus were plain `window` events; no hide-dependent bug needed a hidden tab.

### 1. RestOnlyAtBreak + RestKeepsYourTune: "I pressed থামাও and the rest screen took my tune" (game)
- **Path:** বাজাও → (tap a cell) → থামাও: *Rest screen*, over a tune never kept.
- **Why:** `playFree()` calls `atBreak()` when it stops. Stopping playback is midway, not a break, and the FAQ says rest comes "সুর রাখা বা মেলানো শেষ হলে, মাঝপথে নয়".
- **Live, re-checked on the current kit (f4f75be + 23fd7c1):** 2 notes on the grid and `ektukhani-sur-banai-tunes` was null. Pressing থামাও showed `.kk-rest` ("আজ এটুকুই, কাল আবার।") over the grid, which still held 2 unsaved notes. Closing the page loses them. The new modal blocked taps on the cells, বাজাও and Enter behind it (still 2 notes, nothing playing), and focus moved into `.kk-rest`. Screenshot: `.shots/sur-banai-rest-mid-tune.png`.
- **Fix:** drop `atBreak()` from `playFree()`. Call it only in `save()` and in `check()` on a match (both already do). If the limit is up while a tune is unsaved, keep it in the saved shelf before resting.

### 2. NoProgressWhileAway: "the tune kept playing while I was in another window" (shared)
- **Path:** বাজাও → you click into another window.
- **Live:** with a 2-note tune playing, after blur the playhead went 2→3→4→5→0→1 over 2.7 s, there were 2 more oscillator starts, and the button still read থামাও ■.
- **Fix (shared):** the shared game player's blur and hide handling (`stopPlay()` on blur). For a music toy, at least stop on blur and keep the tune.

### 3. SilentWhenMuted: "I turned sound off and the voice kept talking" (shared). FIXED in the kit (f4f75be)
- **Path:** you tap the speaker → you turn sound off.
- **Before today's kit fix**, a tap while muted also spoke. Live: `aria-pressed=false`, then `speak("যেকোনো ঘরে চাপো…")` and `speechSynthesis.speaking = true` (voice Piya bn-IN).
- **After the fix** (`speak()` returns early when sound is off, kids-kit.tsx:171), a muted tap is silent (re-checked live: no speak, not speaking). Still broken: speak, then mute, and the voice kept talking 1.2 s after mute, with no `cancel()` logged.
- **Fix (shared), now done:** `setSoundOn(false)` calls `speechSynthesis.cancel()` (f4f75be). The model now holds.

### 4. BeatOnlyWithSound: "after I turned sound off, the last bell note still rang" (shared, minor). FIXED in the kit (f4f75be)
- **Path:** বাজাও → you turn sound off.
- **Why:** `setSoundOn(false)` only calls `stopLoops()`. It doesn't call `silenceScheduled()`, so notes already started play out.
- **Live (টুং, 6 notes, মাঝারি):** each bell note is scheduled to stop at +0.73 s. At mute, no extra `stop()` was issued (no +0.03 s stop), so the ringing note played out. While muted there were 0 oscillator starts; after sound-on, 5 starts in 1 s (LoopComesBack holds).
- **Fix (shared), now done:** `setSoundOn(false)` → `silenceScheduled()` (f4f75be). The model now holds.

### 5. ChoiceFreezesPlay: "I opened সব সুর and the tune finished without me" (shared)
- **Path:** সুরটা মেলাও → শোনো → open সব সুর.
- **Live:** with the list open, the playhead ran 1→5 with 6 oscillator starts. The tune ended, `heard` became true, the button turned আবার শোনো, and মিলিয়ে দেখো was enabled. Screenshot: `.shots/sur-banai-drawer-open-tune-plays.png`.
- **Fix (shared):** the level list moves into the shared player's pause menu (সব লেভেল), and opening it calls `stopPlay()`.

### 6. HoldMeansHold: "a quick press on বড়দের জন্য opened the grown-ups' question" (shared, kids-kit ParentGate). FIXED in the kit (f4f75be)
- **Path:** hold বড়দের জন্য → hold again (Enter's key repeat, or a second finger) → let go.
- **Why:** `start()` overwrites `hold.current` without clearing the earlier timer, and `stop()` clears only the latest one.
- **Live:** in the control, Enter held 600 ms with no repeat, the sum stayed closed. With repeat (keydown, then 2 repeats at 500 ms and 533 ms, keyup at 575 ms), "সাত আর আট যোগ করলে কত?" opened 2 s after the first press. The sum still guards the link. This affects RestScreen's own gate too.
- **Fix, now done:** `start()` returns while a timer is set, and `event.repeat` is ignored (f4f75be).
- **Re-checked live on the current kit:**
  - The same repeat hold (keydown; repeats at 500 ms and 533 ms; keyup at 566 ms) did not open the sum.
  - A two-finger 300 ms press did not open it either.
  - A single 2 s hold did ("সাত আর পাঁচ যোগ করলে কত?").

### 7. NoWayOutWithoutGate: "the big picture under the game took my child to a grown-up page with share and photo buttons" (shared, site-shell)
- **Path:** you tap a card under the game.
- **Live:** the related cards on /sur-banai are `/amar-chhotobela` (with a picture), `/borno-likhi`, `/kar-chinho`, `/nam-shikhi` and `/tools`. `PageFrame` always puts the flagship first. Its page has `ShareBar`, `PhotoPicker` and `addToTally` (network), all with no gate. The header nav and search also lead out.
- **Fix (shared):** for the ছোটদের জন্য category, `PageFrame` shows only kids' tools in related cards (no flagship, no `/tools`). Put links that leave the section behind `ParentGate`.

### 8. NoReadingNeeded: "after রাখো, my 3-year-old didn't know which button plays again" (game)
- **Path:** tap a cell → রাখো: *saved card*.
- **Live:** the saved card's buttons are আবার খেলো, শেষ and আব্বু-আম্মুকে দেখাও, none with an icon or picture. The idle screen is one line of text and a text button. The won card has only পরের সুর → (an arrow glyph) and text buttons. The mode switch (আমার সুর / সুরটা মেলাও) is text only.
- **Fix:** picture buttons with a ghost finger on the end screens (▶ with the tune's mini picture to play again; a home icon for শেষ), and icons on the two mode buttons.

### Rules that hold, checked live
- **Rest at opening (23fd7c1):** with the timer key set past the limit (then restored at once), a reload opened straight on `.kk-rest`, with focus in it. That's a break, allowed by RestOnlyAtBreak.
- **NoNetwork:** after load there were only same-origin static requests (fonts, chunks, two `/_next/image` previews for the related cards); no `/api`, fetch or beacon.
- **NoChildData:** only `ektukhani-sur-banai-tunes`, `ektukhani-levels-sur-banai`, the sound switch and the kids timer were written.
- **LoopComesBack:** the next beat after sound-on is heard.
- **SilentWhenHidden:** hide calls `stopPlay()` (in the code; Orca pins `document.hidden`).
- **QuietUnderRest:** every `atBreak()` call follows `stopPlay()`.

## Quality-bar gaps (one free tune, then levels 1–3 of সুরটা মেলাও, in Orca at Pixel 9)
1. **First screen:** the H1 and parent note push the grid to y=272. The start action is a 6×5 grid with a ghost finger (good), but বাজাও sits below the fold on a phone (`.shots/sur-banai-first-screen.png`).
2. **End cards below the fold:** on the won card, stars, title and mini tune fill the screen. পরের সুর, আবার খেলো and শেষ need a scroll (`.shots/sur-banai-won.png`).
3. **Reading needed:** mode buttons and end-screen buttons are text only (bug 8). For 3–5, the bar's "start action is the game's own art" isn't met after the first screen.
4. **Pause:** there's no pause at all. Blur doesn't stop the tune (bug 2), and the level list doesn't freeze it (bug 5). The shared player's pause menu would fix both.
5. **Choices:** the সব সুর list sits at the bottom inside a `<details>`, unnumbered, with no recommended next tune on the won card beyond পরের সুর.
6. **Pacing and level design:** levels 1–6 are the same idea (a longer line of single notes). Pairs only arrive at 7, and there's no "boss" tune or world end. Listening is free (good), but the hint glows only after 2 checks with no in-between cue.
7. **Sound:** three synthesized instruments plus the shared sfx (good, mute-first works visually, and mute now cuts notes and speech). There's no signature sound for a match beyond `sfx.win`.
8. **Rest timing:** the rest screen can cut a tune midway (bug 1), against the brief's "natural end" rule.
9. **Leaving the section:** related cards and the header take a child to adult tools (bug 7).

Screenshots: `.shots/sur-banai-first-screen.png` (first screen), `.shots/sur-banai-rest-mid-tune.png` (bug 1), `.shots/sur-banai-drawer-open-tune-plays.png` (bug 5), `.shots/sur-banai-won.png` (won card).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/sur-banai/SurBanai.tla --view ai_docs/statecharts/sur-banai/view.ts --out ai_docs/statecharts/sur-banai/after-fix
rm ai_docs/statecharts/sur-banai/after-fix/tlc*.out
```
After the game fixes, update the spec:
- `YouPressStop` no longer sets `resting`.
- Blur stops play.
- Opening the drawer stops play.
- Related cards stay in the kids' section.
- End screens get picture buttons.

The kit fixes (mute, gate) are already in the spec. Every rule must then hold.
