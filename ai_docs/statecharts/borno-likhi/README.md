# বর্ণ লিখি statechart (before the rewrite)

A kids' game (ছোটদের জন্য, ages 4–7). Spec: `BornoLikhi.tla` / `BornoLikhi.cfg` / `view.ts`, mirrored from `tools/borno-likhi/components/likhi-game.tsx`, `tools/borno-likhi/lib/trace.ts`, `shared/kids-kit.tsx`, `shared/game-sound.ts`, `shared/game-ui.tsx` and `shared/site-shell.tsx`. Modelled against the current shared kit (commits f4f75be and 23fd7c1). TLC: 314 states, 913 steps. Chart: `before-fix/chart.mmd` (29 states, 78 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **The set:** a letter being traced, a finished letter (its picture, পরেরটা / আবার লিখি), the end card, and closed (শেষ). Also whether the letter is the set's last. Stroke outcomes are chosen freely: a stroke either finishes the letter or not.
- **The finger:** `pointer.current` (`onDown`, `onMove`, `onUp`, `onPointerCancel`) and the window (here, or another window). The game has **no blur or visibilitychange listener**.
- **Keyboard:** focus (board, পরেরটা, the sound toggle, nothing, or focus lost to `<body>`). Enter is the board's own key (`onKey → finishStroke`). Elsewhere, Enter clicks whatever button has focus.
- **Sound and speech:** the site-wide switch, and `speak(pictureOf(char).label)` when a letter finishes. In the current kit, `speak()` is silent when sound is off, and muting cancels a sentence already started (f4f75be). There's no `loop()` and no cached audio: every sound is a one-shot `tone()` that reads `soundOn()` when it plays, so the "`??=` silent stub" pattern can't happen.
- **Kids' rules:** the daily limit: `atBreak()` only in `goNext` at the set's end ("atBreak"), or the page opening past today's limit ("atOpen", 23fd7c1). `RestScreen` is a real modal (f4f75be). Also the parent gate's 2-second hold, and the related-tool cards under the game.
- **Reduction:** the gate and the voice are explored from the first screen while the rest of the page waits. They share no variable with the game, and this keeps TLC under the 500-state chart budget.
- **Left out:**
  - The tab hiding: tracing has no clock, and a touch phone sends `pointercancel` on hide, which `onUp` handles.
  - The demo hand: a silent `requestAnimationFrame` loop that the browser stops while hidden.
  - Stars: recorded once in `goNext`; `recordLevel` keeps the max; covered by tests.
- **Keyboard patterns:**
  - A key held through the end can't skip the result: the board ignores Enter once the letter is done, and goNext's button unmounts.
  - "Enter on the last-focused button" **does** happen (bug 2).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| InputReleasedWhenAway | After you leave the window, no finger counts as on the board. | **breaks** |
| EnterWritesTheStroke | Enter writes the stroke, as the board's label promises ("কিবোর্ডে Enter"), and never clicks a button instead. | **breaks** |
| FocusStaysOnTheBoard | After পরেরটা with Enter, the keyboard is still on the board. | **breaks** |
| RestOnlyAtBreak | The rest screen appears only on the end card, never mid-set. | holds (live too) |
| SilentWhenMuted | Sound off means silent, the voice included. | holds since f4f75be (was bug 4) |
| HoldMeansHold | The parent gate's question opens only after a real 2-second hold. | holds since f4f75be (was bug 5; re-checked live on সুর বানাই, same component) |
| NoWayOutWithoutGate | No way out of the kids' section without the parent gate. | **breaks** |
| NoReadingNeeded | For ages 4–5, every screen has a way on by picture or sound. | **breaks** |
| NoNetwork / NoChildData | Nothing is sent; only stars per set are stored. | holds (structural, and only `ektukhani-levels-borno-likhi` was written live) |
| TypeOK, NoDeadlock | | hold |

## Bugs
Replays ran in my own Orca tab at Pixel 9, with the same in-page instrumentation as সুর বানাই. The shared sound and kids-timer keys were stubbed in my tab only. Pointer events were dispatched along the live `.bl-now` stroke path (`getPointAtLength`), and keys were real (`orca keypress`).

### 1. InputReleasedWhenAway: "I switched windows mid-stroke; back on the page, the letter wrote itself as I moved the mouse, and my child's finger did nothing" (game)
- **Path:** you touch the board → you click into another window.
- **Live:**
  - I put the mouse down (`pointerId 1`, buttons 1) and dragged 25% of stroke ১ (fill path 130 chars long), then blurred with no pointerup, then focused again.
  - Moving with **no button pressed** (`buttons: 0`) wrote strokes ১ and ২ ("৪টা দাগের ৩ নম্বর", 2 strokes done).
  - A fresh touch (`pointerId 7`) traced all of stroke ৩ and **nothing counted**: `onDown` returns while `pointer.current !== null`, so the board stays dead until pointer 1 sends a pointerup.
- **Caveat:** whether a real browser drops the pointerup when you Cmd-Tab mid-drag depends on the platform. The code has no guard either way.
- **Fix:** on `window` blur (and `lostpointercapture`), clear `pointer.current`, `last` and the ink, and call `up()`. In `onMove`, ignore mouse moves with `event.buttons === 0`.

### 2. EnterWritesTheStroke: "I tapped the speaker, then pressed Enter to write, and the sound flipped back on" (shared pattern)
- **Path:** you tap the speaker → you press Enter to write.
- **Live:** after a click on the compact SoundToggle (focus stays on it), each trusted Enter flipped the sound: শব্দ বন্ধ → শব্দ চালু → শব্দ বন্ধ, and the stroke stayed at ১. The same happens after ধীরে or দেখাও.
- **Fix:** listen for Enter and Space on `window` while a letter is being traced (unless focus is in the drawer or the gate), or move focus back to the board after any top-row control.

### 3. FocusStaysOnTheBoard: "after পরেরটা, Enter stopped working" (game)
- **Path:** Enter on the board until the letter is done → Tab to পরেরটা → Enter.
- **Why:** the board is keyed `${game}-${round.index}`, so it remounts on every letter, and the focused button unmounts too.
- **Live:** after Enter on পরেরটা, `document.activeElement` was BODY. The next Enter did nothing (আ stayed at "৫টা দাগের ১ নম্বর", 0 strokes done). A keyboard player has to Tab back past the chips on every letter.
- **Fix:** keep the board mounted (reset its paths instead), or `board.current?.focus()` after `goNext()` and `again()`.

### 4. SilentWhenMuted: "the voice kept saying the word after I turned sound off" (shared). FIXED in the kit (f4f75be)
- **Path:** Enter on the board finishes the letter (speaks "অ-তে অজগর") → you tap the speaker.
- **Before today's kit fix**, a letter finished while muted was also spoken.
- **Live (after the fix):** finishing অ with sound on logged `speak: অ-তে অজগর`. Muting right after logged no `speechSynthesis.cancel()`. The word is short, so it had ended by the time I read it. On সুর বানাই's longer line, speech went on 1.2 s after mute.
- **Fix (shared), now done:** `setSoundOn(false)` calls `speechSynthesis.cancel()` (f4f75be). The model now holds.

### 5. HoldMeansHold: "a quick press on বড়দের জন্য opened the grown-ups' question" (shared, kids-kit ParentGate). FIXED in the kit (f4f75be)
- **Live on this page:** Enter keydown, then repeats at 500 ms and 533 ms, then keyup. The sum dialog opened 2.1 s later.
- **Fix, now done:** `start()` ignores a second start and `event.repeat`. Re-checked live: a repeat hold and a two-finger short press no longer open the sum.

### 6. NoWayOutWithoutGate: "the picture card under the game opened a grown-up page with share and photo buttons" (shared, site-shell)
- **Live:** related cards on /borno-likhi are `/amar-chhotobela`, `/kar-chinho`, `/nam-shikhi`, `/sourojogot` and `/tools`. The flagship has `ShareBar`, `PhotoPicker` and `addToTally`.
- **Fix:** see সুর বানাই bug 7.

### 7. NoReadingNeeded: "after the first letter, my 4-year-old didn't know which button goes on" (game)
- **Live:**
  - The finished-letter row has two text buttons, পরেরটা (primary) and আবার লিখি, with no icon, and no ghost finger points at পরেরটা.
  - The picture is a small canvas (about 64 px) beside the word.
  - The end card's buttons are আবার খেলো, শেষ, "পরের সেট: …" (a text link) and আব্বু-আম্মুকে দেখাও, all text.
  - Screenshot: `.shots/borno-likhi-letter-done.png`.
- **Fix:**
  - A big → picture button with the ghost finger after each letter, and a ↺ icon on আবার লিখি.
  - Picture buttons on the end card.
  - A bigger picture: the reward is the drawing.

### Rules that hold, checked live
- **Rest at opening (23fd7c1):** a kids' page opened past the limit lands on `.kk-rest` with focus in it (checked on সুর বানাই; same hook). The model treats it as a break.
- **RestOnlyAtBreak:** I played set ১ to the end by keyboard with the real over-limit kids timer. Through 6 letters no `.kk-rest` showed. It appeared on the end card ("৬টা বর্ণ লিখলে: অ আ ই ঈ উ ঊ", 3 stars). Screenshot: `.shots/borno-likhi-rest-at-end.png`.
- **NoNetwork:** there are no fetch, `/api` or share-client imports (`tests/borno-likhi.test.ts`), and only static assets loaded live.

## Quality-bar gaps (set ১ by keyboard, a letter of set ২ by finger, in Orca at Pixel 9)
1. **First screen:** the H1 (2 lines) and the parent note push the board to y=382. The board fits, but the word and দেখাও sit below the fold (`.shots/borno-likhi-first-screen.png`). The glowing ১ dot and the looping demo hand are good: you can trace within 3 s.
2. **Keyboard play is a cheat:** Enter finishes a stroke without tracing, and a full set by Enter earns 3 stars. The bar's "every choice explains itself" needs a line for keyboard players, or Enter should step along the stroke.
3. **No pause or away handling:** there's no blur, hide or pause (bug 1). It's untimed, so it's less urgent, but the input must release.
4. **Reading needed between letters:** text buttons only, and the picture reward is small (bug 7).
5. **Pacing:** a letter takes 3–5 strokes (ঋ: 5 strokes in 3.2 s for a fast finger). Sets are 3–6 letters, all with the same flow, and there's no "boss" letter or set end beyond confetti on a first clear. The pace easing (wider path after 3 misses) is never shown, which matches the brief.
6. **Sound:** a tick, a stroke ding, a chime and the word spoken (good, all synthesized). Mute now also stops the voice.
7. **HUD:** the set name and letter chips sit at the top (good), but ধীরে and the speaker take focus and swallow Enter (bug 2).
8. **Leaving the section:** the related cards and the header lead to adult tools (bug 6). The in-view print link stays in the tool (fine).

Screenshots: `.shots/borno-likhi-first-screen.png`, `.shots/borno-likhi-letter-done.png`, `.shots/borno-likhi-rest-at-end.png`.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/borno-likhi/BornoLikhi.tla --view ai_docs/statecharts/borno-likhi/view.ts --out ai_docs/statecharts/borno-likhi/after-fix
rm ai_docs/statecharts/borno-likhi/after-fix/tlc*.out
```
After the fixes, update the spec:
- `WindowBlurs` releases the pointer.
- Enter while tracing goes to the board, whatever has focus.
- `GoNext` keeps focus on the board.
- Related cards stay in the kids' section.
- The finished-letter and end screens get picture buttons.

The kit fixes (mute, gate) are already in the spec. Every rule must then hold.
