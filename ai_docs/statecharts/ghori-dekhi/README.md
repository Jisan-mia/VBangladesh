# ঘড়ি দেখি: statechart (before the rewrite)

The model covers the game as it stood on 2026-11-04 (branch `games-to-the-bar`). Files: `Ghori.tla`, `Ghori.cfg` and `view.ts`. The output is in `before-fix/`. TLC reached 364 states. The chart draws 26 states in 4 regions.

Constants: `Voice = FALSE` (no Bangla voice, as on many cheap phones) and `Level = 2` (সাড়ে, the last level the parent note calls enough for 5–6 year olds).

Live replays ran in Orca at http://127.0.0.1:3100/ghori-dekhi, 10:00–10:40 (+06).

## Systems modelled
- **Round:** set → read → set (the game has 6 items: set, read, set, read, set, read), then শেষ দেখো → the card (`done`) → শেষ → the level menu. Also আবার খেলো and "সব লেভেল".
- **Clock drag:** `clock.tsx` down / move / up / cancel, the `gesture` ref, pointer capture and window focus. Nothing in the game listens for blur or visibility.
- **Pre-reader cues:**
  - the ghost finger (item 1 only)
  - the 🔈 (only with a Bangla voice)
  - the glowing hands (after 2 slips)
  - read-mode choices, which are words
- **The card:** it covers the last item, which stays in the DOM with its শেষ দেখো button.
- **Kids' daily limit and rest screen.**
- **Parent gate.**
- **Ways out:** the site frame.
- **Not modelled:**
  - stars: the same shared `recordLevel` is checked in the juktoborno model, and StarsNeverDrop holds there
  - sound: no loops, and speech only through the 🔈 tap
- **Abstractions:**
  - the window blurs only while a clock is being set, the only place focus matters
  - the gate is used only on the card and the rest screen
  - leaving the page resets the round

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| NoReadingNeeded | For ages 5 (3–5 band), each item can be done by picture or sound, without reading. | **breaks** |
| InputReleasedWhenAway | After you switch windows, no finger counts as holding a hand. | **breaks** |
| HandMovesOnlyUnderAFinger | A clock hand moves only while a finger or button is down on it. | **breaks** |
| NoDoubleResult | A round ends and is recorded once (one win sound, one `atBreak`). | **breaks** |
| RestOnlyAtBreak | The rest screen shows only between rounds. | **breaks** |
| GateNeedsAFullHold | The question appears only after a 2-second hold. | **breaks** |
| ChildCannotOpenGate | Random tapping can't open the gate. | **breaks** |
| NoWayOutWithoutGate | No leaving the kids' area or sharing without the gate. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored (`ektukhani-levels-ghori-dekhi`, kids' time and limit, sound, slow). | holds |

Share and print are behind the gate here, so the share path itself is safe.

## Bugs

### 1. NoDoubleResult (game: `ghori-game.tsx`)
- **Player's sentence:** "On the end card I pressed Enter again and the win tune played again, and again."
- **Path (report):** right → পরেরটা → right → পরেরটা → right → শেষ দেখো → Tab to the hidden শেষ দেখো → Enter.
- **Why:**
  - `finish()` sets `index = ROUND` but leaves `solved` true.
  - `item = items[min(index, 5)]` keeps the last item drawn.
  - The শেষ দেখো button stays under `.gd-end`. The card has z-index 3 and is 96 % opaque, and the button shows faintly in `.shots/ghori-dekhi-end.png`.
  - The button is not `inert`, so Enter calls `next()` → `finish()` again.
- **Live replay (10:06):** after one real round, focus stayed on শেষ দেখো. Each Enter wrote `ektukhani-levels-ghori-dekhi` again (9 writes from one real round) and replayed the win fanfare: tones 1100 (tap), then 523, 659, 784, 1047 per press, with 2 presses giving 2 full fanfares. From the level menu it also flips back to the card. `atBreak()` runs each time, and on level 5 confetti fires each time.
- **Fix:**
  - Guard `finish()` with a `finished` flag.
  - Don't render the item's buttons once the phase is `done` or `menu`, or put `inert` on the stage under the card.
  - (game; the shared player's result screen should own this)

### 2. InputReleasedWhenAway and HandMovesOnlyUnderAFinger (game: `clock.tsx`)
- **Player's sentence:** "I was turning the big hand, switched windows, and when I came back the hand followed my mouse without my pressing, and tapping did nothing."
- **Path:** you press on the clock → you click into another window → you let go in another window.
- **Live replay (10:08), with synthetic `PointerEvent`s:** `pointerdown` at 12, drag to 60° (12:15). After `window blur` the gesture stays. Then `pointermove` with `buttons: 0` (a hover) turned the minute hand: 12:15 → 12:30 → 12:45. A new tap at ৩ (pointerId 8) was ignored, because `down()` returns while `gesture.current` is set. The ClockFace stays mounted across items and rounds, so the stale gesture carries over.
- **Real-world trigger:** the pointerup must be lost (mouse released outside the window after Alt-Tab, or a lost capture with no `lostpointercapture`). On Android, an app switch normally sends `pointercancel`, which the code handles.
- **Fix:**
  - On `blur` / `visibilitychange`, clear `gesture.current`.
  - In `move()`, ignore events with `buttons === 0`.
  - Reset the gesture when the item changes.
  - (game, and the shared player's blur handling)

### 3. NoReadingNeeded (game: `ghori-game.tsx`, `day.ts`)
- **Player's sentence:** "My 5-year-old can't read 'সাড়ে ৮টা', and there's no picture or sound to show what time to make."
- **Paths:** right → পরেরটা → item 2 (read, level 2). Also item 3 (set, no voice), and the card.
- **Live check (10:20, `speechSynthesis.getVoices` stubbed to `[]` to stand in for a phone with no Bangla voice):**
  - Level 2, item 2: the choices were "সাড়ে ৫টা", "সাড়ে ৭টা" and "সাড়ে ৮টা", with no svg or img and 0 🔈. Choices such as "৭টা" vs "সাড়ে ৭টা" differ only by a word.
  - Item 3: the target "সকাল ৮টা" was text only, with no ghost finger, 0 🔈 and 0 ghost hands until 2 slips.
  - The card: আবার খেলো and শেষ are two words, both 72 px, with no icon.
  - The ghost finger shows only on item 1 of an untouched round.
- **Fix:**
  - Show the target as a small picture clock or the hands as ghosts at half opacity for ages 5–6 (levels 1–2), or replay the ghost finger on every set item.
  - Give read choices a mini clock face each.
  - Use icons on the card's buttons (↻ and ✓).
  - (game; the card icons are shared with every kids' game)

### 4. RestOnlyAtBreak (shared: `RestScreen`)
- **Player's sentence:** "The rest screen came up, but the game kept going underneath."
- **Live (10:10):** the rest screen showed (shared kids' time over the limit). The autopilot's programmatic click on আবার খেলো under it, the same as keyboard Enter, started a round. The autopilot then played to item 3 (dots `on,on,now`) while `.kk-rest` stayed on screen.
- See juktoborno bug 2 for the Tab replay. **Fix:** `inert` and a focus trap (shared).

### 5–6. GateNeedsAFullHold and ChildCannotOpenGate (shared: `ParentGate`)
The component is the same as in juktoborno, replayed there at 09:58–09:59: Enter auto-repeat opened the question after a 0.7 s hold, and random tapping opened 10 of 10 gates (median about 34 taps live, 94 in simulation). The fix is the same.

### 7. NoWayOutWithoutGate (shared: `PageFrame`)
- **Live (10:20):** related tools: `/amar-chhotobela` (flagship, shares through `/api/share`), `/moner-rong`, `/sat-tukro`, `/nirapode-thaki`, `/tools`. Also the header search box and গেম / কুইজ / টুলস. There are no off-site links.
- **Fix:** a kids' frame (shared).

## Quality-bar gaps (full rounds played at 10:06 on level 1 and 10:40 on level 2; 6 items, 3 stars each)
1. **First screen:** the clock is big and the ghost finger shows the first move. It sits under the H1, lead and parent note, and the target is a line of text.
2. **Set items:** hands are dragged or tapped after picking ছোট কাঁটা / বড় কাঁটা. There's no snap feedback beyond the tick, and for 5-year-olds the two-chip mode switch is a lot.
3. **Read items:** 3 text choices; the digits hold the meaning, and there's no 🔈 (see bug 3).
4. **HUD:** level title and 6 dots, fine. But the "said" panel below the stage and the controls (ধীরে খেলো, sound, সব লেভেল) push the page past one phone screen.
5. **No pause or menu,** and no blur handling (bug 2).
6. **Ending:** the card shows stars and a method line. It covers the stage but not the said-panel. শেষ leads to a level menu, which is good, but the card has no icons (bug 3).
7. **Pacing:** 5 levels with one idea each. The fixed rhythm (set, read, set, read) and the same day order make the 2nd round feel the same as the 1st.
8. **Sound:** tick, pick, good and win only. Speech needs a 🔈 tap, and none shows without a Bangla voice.

Screenshots in `.shots/`:
- `ghori-dekhi-first.png`
- `ghori-dekhi-level2-read.png`
- `ghori-dekhi-no-voice-item3.png`
- `ghori-dekhi-end.png` (the hidden শেষ দেখো visible through the card)

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ghori-dekhi/Ghori.tla --view ai_docs/statecharts/ghori-dekhi/view.ts --out ai_docs/statecharts/ghori-dekhi/after-fix
```
The view hides the gate-shutting arrows on round start and শেষ.
