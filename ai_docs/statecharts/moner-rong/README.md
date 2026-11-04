# মনের রং: statechart (before the rewrite)

The model covers the game as it stood on 2026-11-04 (branch `games-to-the-bar`). Files: `MonerRong.tla`, `MonerRong.cfg` and `view.ts`. The output is in `before-fix/`. TLC reached 336 states. The chart draws 22 states in 4 regions.

Live replays ran in Orca at http://127.0.0.1:3100/moner-rong, 10:03–10:12 (+06). At 10:12 another agent made `speak()` check `soundOn()`. The spec models that fixed `speak()`. The replay at 10:05 shows the old behaviour.

## Systems modelled
- **Set:** per scene, name the feeling (faces) → pick a kind thing (icons) → talk about it → পরের ছবি; ধাপ শেষ on the last scene; the card → শেষ. Also আবার খেলো, পরের ধাপ and "সব ধাপ". The model has 2 scenes per set.
- **Practice stars:** `practised()` adds 1 per play-through, up to 3, through `recordLevel`.
- **Voice:** `speak()` on a fitting face, a kind choice and the next scene, plus the site-wide sound switch.
- **The card:** `.mr-over` (z-index 5) covers the last scene, whose ধাপ শেষ stays in the DOM.
- **Pre-reader cues per screen.**
- **Kids' daily limit and rest screen.**
- **Parent gate.**
- **Ways out:** the site frame.
- **Not modelled:** the 7 s idle timer that brings back the ghost finger (a hint, not progress) and the quiet ease.
- **Abstractions:**
  - a set is played through once (a second set can start but not finish)
  - speech ends on the next step
  - the gate is used only on the card and the rest screen

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| NoDoubleResult | A set is recorded once. | **breaks** |
| StarsMatchPlays | The stars ("times played") equal the times the set was really played. | **breaks** |
| VoiceOnlyWithSound | Nothing reads aloud while sound is off. | **breaks** |
| NoReadingNeeded | For ages 4–5, every screen can be used by picture or sound. | **breaks** (the card) |
| RestOnlyAtBreak | The rest screen shows only between sets. | **breaks** |
| GateNeedsAFullHold | The question appears only after a 2-second hold. | **breaks** |
| ChildCannotOpenGate | Random tapping can't open the gate. | **breaks** |
| NoWayOutWithoutGate | No leaving the kids' area or sharing without the gate. | **breaks** |
| StarsNeverDrop | Stars never go down. | holds |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored (`ektukhani-levels-moner-rong`, kids' time and limit, sound, slow). | holds |

## Bugs

### 1. NoDoubleResult and StarsMatchPlays (game: `moner-game.tsx`)
- **Player's sentence:** "We played the set once, but it shows three stars, and the card for my parents says 9 pictures."
- **Path (report):** face → kind → পরের ছবি → face → kind → ধাপ শেষ → Tab to the hidden ধাপ শেষ → Enter.
- **Why:**
  - `nextScene()` returns null on the last scene, so `round` never changes.
  - The ধাপ শেষ button stays under the card.
  - `press()` runs on `click` with `detail === 0`, which is what keyboard Enter sends.
  - So `onNext()` records `practised()` again, adds the set to today's card again, plays the win again and calls `atBreak()` again.
- **Live replay (10:04):** one play-through of set 1 (3 scenes), then 3 Enters on the focused hidden ধাপ শেষ. `ektukhani-levels-moner-rong` went `{"1":1}` → `{"1":2}` → `{"1":3}`, and the card's stars went ১ → ২ → ৩. Win fanfares (523 Hz) counted 1, 2, 3. The আব্বু-আম্মুকে দেখাও card then read "আজ ৯টা ছবিতে মনের রং চেনা হলো।" for 3 scenes (`.shots/moner-rong-showparent-tripled.png`).
- **Fix:**
  - Guard `onNext()` with the phase (`phase !== "play"` → return).
  - Hide the step's buttons once the phase is `end`, or put `inert` under the card.
  - (game)

### 2. VoiceOnlyWithSound (shared: `speak` / `setSoundOn`)
- **Player's sentence:** "I turned sound off, and it still read the line aloud."
- **Path:** you tap a face that fits → you turn sound off. The line keeps playing.
- **Live replay (10:05, old `speak()`):** sound off, then tap খুশি. `speak("নুসরাত খুশি।")` was called with sound "0", and `speechSynthesis.speaking` was true.
- **Since 10:12:** muting first is fixed (checked on juktoborno at 16:40: 0 utterances). Muting during a line still lets it finish (`speaking` true 150 ms after the mute).
- **Fix:** `speechSynthesis.cancel()` on sound off (shared).

### 3. NoReadingNeeded (game, and shared with every kids' end card)
- **Player's sentence:** "My 4-year-old can't tell আবার খেলো from শেষ."
- **Path:** a set to the end → the card.
- **Live check (10:10):** the card's buttons are "আবার খেলো" (72 px), "শেষ" (72 px) and "পরের ধাপ: রাগ" (49 px, under the 96 px target for ages 3–5), with 0 svg or img. The play screens do give picture cues: faces with words, icons on kind choices, and an arrow plus a ghost finger after 7 s on পরের ছবি.
- **Fix:** icon plus word buttons (↻ আবার খেলো, ✓ শেষ, → পরের ধাপ) at 96 px, and a 🔈 on the end line when a voice exists (shared kids' end card).

### 4. RestOnlyAtBreak (shared: `RestScreen`)
- **Player's sentence:** "The rest screen came up, but Enter started a new set under it."
- **Live replay (10:11, real shared limit, `ektukhani-kids-time` 5350 s against a 15-minute limit):** the set ended and the rest screen showed. Focus on আবার খেলো (set by script; the Tab route is shown in juktoborno) and a trusted Enter started a new set under it: `.kk-rest` still shown, faces খুশি / মন খারাপ / রাগ live, dots `now,,`.
- **Fix:** `inert` and a focus trap (shared).

### 5–6. GateNeedsAFullHold and ChildCannotOpenGate (shared: `ParentGate`)
The component is the same as in juktoborno, replayed there. Enter auto-repeat opened the question after a 0.7 s hold. Random taps opened 10 of 10 gates, in 11–462 taps. A simulation opens 28 % of gates within 30 taps.

### 7. NoWayOutWithoutGate (shared: `PageFrame`)
- **Live (10:03):** related tools: `/amar-chhotobela`, `/sat-tukro`, `/nirapode-thaki`, `/gune-dekhi`, `/tools`. Also the header search input and গেম / কুইজ / টুলস. There are no off-site links.
- **Fix:** a kids' frame (shared).

## Quality-bar gaps (set 1 played end to end at 10:04, and set 2 at 10:11)
1. **First screen:** a calm scene with a big "?" face and two big face buttons, plus a ghost finger on the right face. Good, but it sits under the H1 and parent note.
2. **Choices:** 2–3 faces per scene, with ease after misses, which fits the brief. The kind choices are icon plus long text, which a parent must read.
3. **The scene line and question are text;** the 🔈 shows only with a Bangla voice. Reading by the parent is intended (the note says so), so it's fine for co-play but not for solo play.
4. **Ending:** a stars-as-practice card and a mirror prompt, which is good. The buttons need icons (bug 3), and the stars can be inflated (bug 1).
5. **No pause or menu,** and no কীভাবে খেলবে. Instructions live in the page guide.
6. **Sound:** good, a note per kind choice and win. Speech on every step could be long for shared rooms; it's mute-first after the fix.
7. **Pacing:** 6 sets, adding one feeling each, which is good. There's no closing moment for the whole set of feelings beyond confetti on set 6.

Screenshots in `.shots/`:
- `moner-rong-first.png`
- `moner-rong-end.png`
- `moner-rong-showparent-tripled.png`

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/moner-rong/MonerRong.tla --view ai_docs/statecharts/moner-rong/view.ts --out ai_docs/statecharts/moner-rong/after-fix
```
The view hides the gate-shutting arrows on set start and শেষ.
