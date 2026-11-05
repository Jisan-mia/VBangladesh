# সাত টুকরো: rewrite design

## Core
- **Concept:** a wooden tangram on a village windowsill. Seven painted pieces, one dark shadow of a Bangladeshi thing (ঘর, নৌকা, রিকশা, ঘুড়ি). Fill the shadow.
- **Fantasy:** the box dadu keeps on the shelf. Each piece clacks into the shadow like a tile on a ludo board.
- **Loop:** তোলো (a piece lifts under the finger, bigger, with a soft shadow) → ঘোরাও (a quarter-eighth turn, a dry click) → বসাও (it slides home with a wooden thock, a puff of dust and a note that climbs as the picture fills).
- Ages 5–12. No reading is needed to play: every cue is a picture, a motion or a sound. There is no voice anywhere.

## Progression: 4 worlds, 22 pictures, `lib/levels.ts`
The 22 pictures and their saved stars keep their level numbers' meaning ("level N cleared"), so nobody loses progress; the order inside the list is new. **Everything stays open**: a child never meets a lock. The list marks the next picture without stars (এটা খেলো) and each world's last picture (শেষ ছবি). Each level changes one thing from the one before it.

| World | The idea | Levels |
|---|---|---|
| ভোর | follow the coloured lines: each shadow spot is tinted in its piece's colour | 1–5 |
| দুপুর | turn the pieces: plain white lines, pieces that start turned | 6–10 |
| বিকেল | shadow only: the lines go, the pieces start the right way up | 11–16 |
| রাত | everything: no lines, every piece turned, the parallelogram mirrored | 17–22 |

- **ভোর:** 1 ঘর: five pieces are in, drag the last two · 2 মাছ: tap a piece, then tap its place (no dragging needed) · 3 বিড়াল: five pieces to place · 4 রকেট: all seven · 5 **নৌকা (শেষ ছবি)**: the coloured tint goes, white lines only.
- **দুপুর:** 6 পিরামিড: one piece comes turned, tap it to turn · 7 খরগোশ: all three still to place come turned · 8 লঞ্চ: five to place, all turned · 9 তিমি: the parallelogram is mirrored, ⇋ উল্টাও · 10 **চায়ের কেটলি (শেষ ছবি)**: all seven, the lines turn faint.
- **বিকেল:** 11 কচ্ছপ: no lines, only the shadow (two pieces to place) · 12 হাঁস: four to place · 13 পেঙ্গুইন: six · 14 মানুষ নাচছে: all seven · 15 পান পাতা: one piece turned · 16 **ঘুড়ি (শেষ ছবি)**: three turned.
- **রাত:** 17 হাতি: all turned, four to place · 18 হরিণ: all seven · 19 বক: mirrored parallelogram · 20 মোমবাতি · 21 মানুষ দৌড়াচ্ছে · 22 **রিকশা (শেষ ছবি)**: the last shadow.

Silhouettes of Bangladeshi things: ঘর, নৌকা, মাছ, রিকশা, লঞ্চ, পান পাতা, চায়ের কেটলি, হাঁস, ঘুড়ি, হরিণ, বক, মোমবাতি (the world's other pictures are friendly animals). Three of the four finales are Bangladeshi.

## Difficulty and story
- **No modes.** The ladder is the difficulty, and nothing is announced as "easy".
- **Quiet easing:** after a round with six or more wrong tries, the next round starts with one more piece already in and the hint comes after 2 misses instead of 3. Never announced. A round that was fine changes nothing; stepping up is the ladder.
- **Hints:** 3 wrong drops in a row (2 when eased), or 4 drops that land nowhere, or 10 seconds of doing nothing, make the right spot glow and show a ghost finger. Wrong drops never buzz: the piece glides home with a soft shake.
- **Stars** are a record only: ≤2 wrong tries 3★, ≤5 2★, else 1★. They never come from time, and ধীরে খেলো does not change them.
- **No story.** The worlds are times of day (ভোর, দুপুর, বিকেল, রাত), each with its own palette. A ghost finger shows the first move on level 1 (a drag) and level 2 (tap, tap).

## Screens
- **Title (inside the player's stage):** the level's finished picture, in its seven colours on a wooden board, is the start button, with **▶ খেলো** stamped under it. Under it, small: a chip (the picture's thumbnail, ছবি ৭ · পিরামিড, world name) that opens the picture list, and one line for the lesson with a **নতুন** tag. A grown-up row (বড়দের জন্য) holds the print sheet and the plain share link behind the parent gate.
- **Play:** one canvas fills the stage: the shadow on top, the tray below. HUD in the corners as HTML: top-left the picture badge, top-right seven dots (the pieces in), a thin bar of pieces placed along the very top. Below the board, only on levels with turning: two 80 px buttons, ↻ ঘোরাও and ⇋ উল্টাও (the second only for the parallelogram).
- **Choice moment:** the picture list. It opens from the title chip, the end screen, or সব লেভেল in the player's menu; opening it pauses play and keeps the half-built picture. Four world bands, picture thumbnails (coloured when done, a dark shadow when not), stars, the finale spanning two cells, এটা খেলো on the next one. A big ← **ফিরে যাও** (64 px) closes it without changing anything; the current picture's cell also just closes.
- **Danger:** none. A wrong drop is a soft shake and a glide home, never red.
- **Finale:** a "শেষ ছবি" tag on the title and the badge; on finishing, the world's four-note tune, confetti, and the end screen shows the whole world's pictures in a row ("সব ঘর-বাড়ি হলো" style line for the world).
- **End screen:** the finished picture bobs, three stars pop one by one, then **পিস বসিয়েছ**, **ভুল চেষ্টা** and **ঘোরানো** count up. One line of what you can do now, one task off screen ("ছবিতে ত্রিভুজ কয়টা?"). **আবার খেলো** (↻) replays the same picture with a fresh tray; **শেষ** (✓) goes back to the title. Both are pictures, 112 px, with the words under them. Below them আব্বু-আম্মুকে দেখাও.
- **Card:** only for a parent, behind the gate: the pictures built today in their colours. No name, no stars.

## Sound (`shared/game-sound.ts` only, no loops, no music)
- **Signature:** the wooden thock as a piece lands, plus a note that climbs with the piece count (one note per piece).
- a paper lift when a piece comes off the tray · a dry click per turn · a soft glide-back for a wrong drop · a pat for a piece put down loose · the picture-done jingle · three star chimes (scheduled, so pause cuts them) · the world's four-note tune on a finale.
- Every sound has a visible twin: the lift and shadow, the turn, the shake, the settle, the dust and gold flash, the sweep of light, the stars.

## Comfort and controls
- **ধীরে খেলো:** no overshoot, tilt, shake, dust, sweep, ghost animation or confetti; pieces still glide, quickly. Stars are unchanged.
- **Touch and mouse:** drag a piece (it rides 0.9 unit above the finger on touch), or tap it, then tap the spot. Tap the held piece again, or tap with a second finger while carrying it, to turn it. The pick area is at least 44 px around a piece. Snapping reaches 1.25 units, so a near miss still clicks in. The first press after coming back from away only wakes the game.
- **Keyboard:** 1–7 pick a piece, R turns it, F flips, the arrows move it (Shift: bigger steps), Enter or Space puts it down. Keys answer at once, with no easing delay. P opens the player's pause; Esc belongs to the player. Result and title keys count only as a fresh press (`!e.repeat`, after the screen appeared).
- **Away:** the player's pause, window blur, a hidden tab and lost pointer capture all drop a carried piece (it glides back) and stop the frames, the cheer timer and the idle hint.
- **Kept for compatibility:** `ektukhani-levels-sat-tukro` (stars by level number, 1–22), the `?print` sheet, the URL, title, description and H1, no link state (kids' pages carry nothing about a child) and no tally.

## Look (unslop-ui)
Reference: the painted, cut-wood tangram box. Hard-edged polygons in seven flat colours on a cardboard-brown board. Radius 3–8 px only (the sun, the selection ring and nothing else is round), offset shadows, no ambient glow (light only signals: the hint spot, the ring on the next picture). One palette per world: ভোর teal, দুপুর ochre, বিকেল rose, রাত indigo. Type is the site's own Bangla display face; icons are SVG. `devibe_scan.py` on the folder: 0 findings.

## Motion (Emil skills)
Piece snap 160 ms with a strong ease-out and a small squash; keyboard moves answer at once (`quick`); the finishing wave of hops speeds up and starts after the last piece lands; HUD dot and bar answer at the landing; the ghost finger waits 0.9 s and rests between runs; CSS uses `cubic-bezier(0.23,1,0.32,1)`, press scale .97, gated hover, transforms and opacity only. ধীরে খেলো and the phone's reduced-motion setting both switch the canvas to calm mode.
