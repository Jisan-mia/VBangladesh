# ছবির টুকরো: rewrite design

## Core
- **Concept:** a cardboard jigsaw of a Bangladeshi village, on a phone. Lift a piece from the tray, carry it to its place, feel it click in.
- **Fantasy:** a box on top of নানুবাড়ির আলমারি. Inside are thirty village pictures নানা painted and cut into pieces: dawn at the ghat, sunset on the river, moonlight over the fields.
- **Loop:** তোলো (a piece lifts under the finger, bigger, with a shadow) → মেলাও (by colour, by knob, by the faint picture on the board) → বসাও (it slides home with a cardboard thock and a puff of dust).

## Progression: 3 worlds, 30 levels
The seeds behind old links don't change (`levelSeed`), and neither do the grid sizes or which levels have turned pieces (`planOf`). A friend's old link still opens the same cut. What changes: each level gets a name and one lesson, level 1 starts with five pieces already in, the finales are named paintings with no picture on the board, and the stars count only the pieces you place. Levels are data in `lib/levels.ts`.

| World | Size | The new thing | Levels | Finale |
|---|---|---|---|---|
| ভোর (dawn, river ghat) | ৩×৩ → ৪×৪ | the jigsaw itself, then a bigger cut | 1–10 | **খেয়াঘাটের ভোর**: a bamboo ghat, two boats, no picture on the board |
| গোধূলি (sunset) | ৪×৪ → ৫×৫ | turned pieces | 11–20 | **পাল তুলে বাড়ি ফেরা**: three red sails, no picture on the board |
| জোছনা (moonlight) | ৬×৬ | look-alike pieces (night sky, dark water): read the knobs | 21–30 | **পূর্ণিমার ফানুস**: a full moon and sky lanterns, no picture on the board |

Lessons, one per level (shown on the title and in the status line):
- **ভোর:** 1 drag four pieces into a nearly whole picture · 2 the whole ৩×৩ · 3 tap a piece, then tap its place · 4 corners and edges have flat sides · 5 ৪×৪, and more pieces wait behind the tray · 6 a run of right drops climbs in pitch · 7 the clock and the stars, and the orange edge before a star drops · 8 hold the box picture (bottom left) to see the whole painting · 9 a fainter picture on the board · 10 the finale.
- **গোধূলি:** 11 turned pieces: tap a picked piece to turn it · 12 a second finger (or R) turns the piece in your hand · 13 a turned piece dropped at home turns the cell gold: right place, turn it · 14 ৫×৫, upright again · 15 build the frame first; the frame rings when it's whole · 16 the light side of the picture · 17 fainter picture · 18 ৫×৫ with turned pieces · 19 turn before you carry · 20 the finale.
- **জোছনা:** 21 ৬×৬, the night sky looks alike: match the knobs to the outline on the board · 22 a wrong drop says whether the knobs fit · 23 stars and fireflies tell sky pieces apart · 24 the water's moon road · 25 fainter picture · 26 ৬×৬ with turned pieces · 27 corners first, turned · 28 the frame, turned · 29 the faintest picture · 30 the finale.

**Star times** (`parFor`, tuned with the bots): seconds per placed piece by world (2.5, 2.6, 3.2), plus 1 when pieces come turned. A fainter picture on the board adds up to a fifth, and a finale (no picture) adds a fifth. Three stars within it, two within twice it, one for any finished picture.

**Bot targets (tests/bot.ts, a timing model played through the real tray, drops and turns):**
- a first-timer finishes level 1 within 10 s on ≥ 95% of runs;
- a steady player earns 3★ on ≥ 85% of runs on every level (measured: 100%);
- a casual player (slower, wrong drops, misses the aim now and then) finishes every level and earns ≥ 2★ on ≥ 80% of runs;
- three stars get rarer for the casual player along each world, and rarest on its finale (measured casual 3★: level 1 100%, levels 9–10 90% / 34%, 17 and 20 68% / 59%, 25 and 30 3% / 0%).

## Difficulty and story
- **The ladder is the difficulty.** No modes: the cut size, the turned pieces and the picture on the board fading are the difficulty. The title says what's new in plain words ("এবার টুকরো ঘোরানো").
- **Story (first run only, tap for the next panel, hold to skip):**
  1. "নানুবাড়ির আলমারির ওপরে পুরোনো একটা বাক্স।"
  2. "ভেতরে নানার আঁকা গ্রামের ছবি, কেটে টুকরো করা।"
  3. "টুকরোগুলো জোড়া লাগাও। ভোর থেকে জোছনা, ৩০টা ছবি।"
  It plays once (`ektukhani-intro-chhobir-tukro`), never on a friend's link or আবার খেলো.

## Screens
- **Title:** the level's finished painting in a cardboard box lid is the start button, with **খেলো** stamped on its lower edge. Under it: ‹ লেভেল ৭ · ৪×৪ ›, the lesson (a **নতুন** tag when it brings a new idea, **শেষ ছবি** on a finale) and "৩ তারা: ৪০ সেকেন্ডের মধ্যে", then সব লেভেল · ★. A friend's card sits on top on a challenge link. খেলো breaks the picture: the pieces fly from their places into the tray (0.6 s), so you see what you'll rebuild. The clock starts when they land.
- **Choice moment:** the সব লেভেল sheet. Three worlds, numbered levels with stars, a lock on closed ones, the finale marked, **এটা খেলো** on the recommended level. Opening it pauses play and stops the clock.
- **HUD (corners only):** top-left, the level badge (number and name), which opens the sheet. Top-right, the clock, three on-track stars and "৩★ ≤ ০:৪০". The board's top edge has a thin bar of pieces placed; on a finale it is a named bar, "খেয়াঘাটের ভোর ১২/১৬". Bottom: the box picture (hold to peek), one status line, and ঘোরাও on turned levels.
- **Danger at the edge:** no lives. Five seconds before a star would drop, the board frame glows orange; when it drops, the HUD star falls. In slow mode it is a steady orange border.
- **Feel:**
  - a picked piece grows from tray size to board size with a small overshoot, lifts above the finger on touch, casts a soft shadow, and tilts with its speed;
  - a right drop slides home in 0.14 s with a squash, a dust puff and a gold flash;
  - a wrong drop glides back to its slot with a shake and a red cell (gold for "right place, turned");
  - the next waiting piece pops into the freed slot.
- **Finale:** a "শেষ ছবি" badge, the named bar, no picture on the board. When the last piece lands, a light sweeps the painting and the world's motif plays.
- **End screen:** a cardboard slip over the tray, with the painting still in view. It shows StarReveal, then সময়, ভুল, টানা (the longest run of right drops) and ঘোরানো counting up over 0.8 s. Then the exact near-miss line ("আর ৪ সেকেন্ড আগে পারলে ৩ তারা") or the friend compare, the best time on this phone, **পরের লেভেল** (Enter), আবার খেলো and কার্ড বানাও.
- **Card:** the finished painting on a dark table with its seams still showing, the headline, stars, and the human line. Finales get a "শেষ ছবি" stamp.

## Sound (`shared/game-sound.ts` only, no loops)
- **Signature:** the cardboard thock as a piece lands, timed to the slide on the audio clock. A run of right drops adds a climbing note.
- a paper lift as a piece comes off the tray;
- a dry click per quarter turn;
- a soft slide back for a wrong drop;
- the scatter rattle as the picture breaks on খেলো;
- a frame chime when the last edge piece goes in;
- the world's 4-note motif when a finale is whole.

Every sound has a visible twin: the squash and dust, the lift and shadow, the turn, the shake and red cell, the flying pieces, the frame flash, the light sweep.

## Comfort and controls
- **ধীরে খেলো:** no scatter flight, no overshoot or tilt, no shake, dust, sweep, confetti or count-up, and a steady border instead of the glow. Stars are unchanged.
- **Touch:** drag a piece from the tray. It lifts 36 px above the finger, so the finger never hides it, and snaps in within about half a cell of home. Tap a piece, then tap a cell. On turned levels, tap the picked piece again (or tap with a second finger while carrying it) to turn it.
- **Keyboard:** Tab to a tray piece and Enter picks it. R turns it. Arrows move the board cursor, and Enter or Space puts the piece there. Enter or Space starts from the title and goes on from the result, but only on a fresh press 0.4 s after it appears. P opens the player's pause menu, and Esc belongs to the player.
- **Mouse:** the same as touch, with no lift offset. A move with no button held drops a stuck piece.
- **Away:** the player's pause, blur and a hidden tab stop the clock and drop a piece in flight (it glides back). The first press after coming back only resumes.
- **Kept for compatibility:**
  - links `#s=<level seed>&t=<seconds>&l=<level>&n=<name>` parse exactly as before;
  - `ektukhani-levels-chhobir-tukro` and `ektukhani-best-chhobir-tukro-l<level>`;
  - new `ektukhani-unlock-chhobir-tukro`, your own unlock migrated once from the old rule, so nobody loses a level. A friend's link opens only its own level;
  - the URL `/chhobir-tukro`, the title, description and H1 text, and the share id.
