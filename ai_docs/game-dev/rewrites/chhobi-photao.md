# ছবি ফোটাও: rewrite design

## Core
- **Concept:** a nonogram on a phone where every solved grid blooms into a stitched Bangladeshi picture. The cloth is নানির কাঁথা, the numbers are her instructions.
- **Fantasy:** নানির কাঁথা has thirty empty patches. Each patch is a picture she never finished: a window, a mango, a kite, the ইলিশ. You are the one with the needle now.
- **Loop:** পড়ো (read the numbers on a row and a column) → ফোঁড় দাও (tap or drag a stitch; it answers on pointerdown) → ফোটাও (the lines match, the numbers fade, the picture blooms).

## Progression: 3 worlds, 30 levels
Pictures, grid sizes and `levelSeed` do not change, so a friend's old link opens the same picture. What is new: each level gets a name and one lesson (`lib/levels.ts`), tools arrive one at a time, bigger boards start with some stitches already in, and each world ends on a named finale.

| World | Levels | Size | What arrives | Finale |
|---|---|---|---|---|
| ১ উঠান (cream cloth, terracotta) | 1–10 | 5×5, 6×6 | ফোঁড় (L1) → ফিরিয়ে আনো (L2) → ভুল ঘর, সুতো ছেঁড়ে (L3) → খালি দাগ ✕ (L4) → হিন্ট (L5) → ৬×৬ with নানির ফোঁড় (L6) → the sound of a matched line (L7) → middle cells of a long run (L8) → a clue that fits exactly (L9) | **কলসি**, no help |
| ২ পুকুরপাড় (pond green) | 11–20 | 7×7, 8×8 | সংখ্যায় চাপলে কেটে যায় (L11) → ০ মানে ফাঁকা (L12) → mirrored pictures (L13) → three-number clues (L14) → one spare cell (L15) → ৮×৮ with নানির ফোঁড় (L16) → alternating row and column (L19) | **বিড়াল**, no help |
| ৩ নদী আর শহর (dusk blue) | 21–30 | 9×9, 10×10 | ৯×৯ with নানির ফোঁড় (L21) → three loops of logic (L22) → a clue with one spare cell (L24) → empty edge columns (L25) → ১০×১০ with নানির ফোঁড় (L26) → a clue that reveals nothing (L29) | **ইলিশ**, no help |

- **Tools by level:** undo from 2, ✕ from 4, হিন্ট from 5, tap-a-clue-to-strike from 11. A friend's link to level 12 has all of them.
- **নানির ফোঁড়:** gold, locked stitches that are already part of the picture. L6 has 6, L7 3, L11 8, L12 4, L16 10, L17 5, L21 12, L22 6, L26 15, L27 8. Finales and all other levels have none. The cells come from `makeRng(levelSeed)`, so they never change.
- **Stars (unchanged, so old cards and links agree):** 0 mistakes = ★★★, 1–2 = ★★, 3 or more = ★. A hint caps the result at ★★. Time never changes stars. It is the number on the card.
- **A wrong stitch is caught at once.** A fill on a cell outside the picture, or a ✕ on a cell inside it, is refused: the cell shakes red and stays empty, the thread snaps (the stroke ends there), the edge of the board flashes, and the mistake is counted once for that cell. So the board never holds a wrong cell, and a swipe costs at most one mistake.
- **Tests prove it:** every picture is solvable by line logic alone with a unique answer (as before); every level has a lesson, the finales and tool levels are where this table says; the bots below.
- **Bot targets (`tests/bot.ts`, asserted in `tests/rewrite.test.ts`):** the bot reads the board like a person (only cells line logic proves), makes one drag per span along a row or column (1.2 s each for a steady player), and slips onto a wrong cell with a set chance per stitch (first-timer 4 %, steady 1 %, careful 0.3 %).
  - Level 1: a steady player wins in every run, inside 10 s in at least 85 % (median about 7 s), and gets ★★★ in at least 75 %.
  - Levels 1–5: a first-timer gets ★★ or better in at least 95 % and ★★★ in 25–75 %. Levels 6–20: ★★ in at least 75 %. Levels 21–30: ★★ in at least 45 %.
  - Every level: a steady player gets ★★ or better in at least 80 %, and a first-timer always wins. A finale's ★★★ rate is no higher than its world's first level (plus 3 points). The careful bot gets ★★★ in at least 70 % on the 10×10 levels.

## Difficulty and story
- **No difficulty modes.** The ladder is the difficulty. The title says in plain words what is new.
- **Story (first run only, tap for the next, hold to skip):**
  1. "নানির কাঁথা এখনো আধখানা। ত্রিশটা ঘর খালি পড়ে আছে।"
  2. "প্রতিটা সংখ্যা বলে দেয়, কয়টা ঘরে ফোঁড় দিতে হবে।"
  3. "ফোঁড়ে ফোঁড়ে ছবি ফোটাও। উঠান থেকে নদীর ঘাট।"
  It plays once (`ektukhani-intro-chhobi-photao`), never on a friend's link or আবার খেলো.

## Screens
- **Title:** a kantha patch drawn in code is the start button, with **ফোটাও** stamped on its lower edge. An unfinished level shows the pale grid and a needle with a thread; a cleared level shows its finished picture. Under it: ‹ লেভেল ৭ · ৬×৬ ›, the lesson (a **নতুন** tag when it brings something, **শেষ ছবি** on a finale), "নানির ফোঁড় ৩টা" when there are some, and সব লেভেল · ★. A friend's card sits on top on a challenge link.
- **Choice moment:** the সব লেভেল sheet. Three worlds, numbered levels, a lock on closed ones, cleared ones wear their picture, the finale marked, **এটা খেলো** on the recommended level. Opening it (from the badge, the title, or the pause menu's সব লেভেল) stops the clock.
- **HUD (corners only):** top-left the level badge (opens the sheet); top-right the clock and a star track (★★★ → falls to ★★ on the first mistake, ★ on the third) with "আর ২টা ভুলে ১ তারা" in small type; a thin bar along the top edge for lines matched; on a finale the bar is named, "কলসি ৮/১২". The status line under the board gives one lesson, then "৬/১০টা লাইন মিলেছে". The clock waits for the first stitch.
- **Feedback:**
  - a stitch pops in 0.14 s and a thread-pull sound whose pitch climbs along the stroke;
  - while dragging, a small number floats at the finger: how many cells this stroke has so far, so "৩" is easy to match;
  - a matched line fades its number and flashes it; matches in a row climb in pitch;
  - a refused stitch: red shake on the cell, a thread-snap, a flash round the board, and a star falls when stars drop.
- **Danger at the edge:** no popups. When one more mistake would cost a star, the board frame glows amber, steadily (a still border in ধীরে খেলো).
- **Finale:** a "শেষ ছবি" badge, the named bar, no নানির ফোঁড়, and when it blooms a light sweeps the cloth and the world's motif plays. Confetti on the first clear.
- **End screen:** the whole stage turns into a framed page: the finished stitched picture, StarReveal, then সময়, ভুল, ফোঁড় and লম্বা টান counting up over 0.8 s. Then the exact near-miss line or the friend compare, the best time on this phone, **পরের লেভেল** (Enter), আবার খেলো and কার্ড বানাও.
- **Card:** the same stitched picture (cross-stitch cells on cloth, a running stitch round the edge), the headline, stars, the time line, and a "শেষ ছবি" stamp on finales.

## Layout
The stage is HUD, board, bar. The board takes the middle row and `fitBoard` picks the biggest cell (16–56 px) that lets the clues and the cells fit it: a 10×10 board has 23 px cells at 360×640 and 19 px at 320×568, where modes, undo (icon only) and হিন্ট share one row to give the board room.

## Art
Everything is drawn in code (`lib/art.ts`): one `drawPatch` renders a picture as cross-stitch on cloth for the end screen, the sheet's thumbnails, the title and the card, so they agree. Canvases are drawn once per size at DPR up to 2 and cached. One look per world (cloth, ink, tint) as CSS variables.

## Sound (`lib/sound.ts` on `shared/game-sound.ts`, no loops)
- **Signature:** the needle going in, a pierce and a short thread-pull, rising along a stroke.
- ✕: a small tick. Refused stitch: a thread-snap, a low pluck. Matched line: a note that climbs with the run. Undo: a soft drop. Hint: a glint.
- Bloom: a run of notes following the ripple (everything scheduled on the audio clock, so the pause cuts it), then StarReveal's chimes. A finale adds the world's 4-note motif.

Every sound has a visible twin: the pop, the ✕, the shake and flash, the flashing number, the ripple, the stars.

## Comfort and controls
- **ধীরে খেলো:** no pop, shake, flash, ripple, sweep, confetti or count-up; the danger edge is a still border. Stars are unchanged.
- **Touch:** tap a cell; drag along a row or column to fill a run; ভরাট / খালি দাগ switch; ফিরিয়ে আনো; হিন্ট.
- **Mouse:** left button fills, right button puts ✕; a move with no button held ends a stroke.
- **Keyboard:** arrows move, Space or Enter fills, X puts ✕, Backspace wipes, Z undoes, H hints, P opens the player's pause menu, Enter on the result goes on (a fresh press only). Esc belongs to the player.
- **Away:** blur, a hidden tab, the player's menu and the sheet stop the clock and let go of a drag. The first press after coming back only resumes.
- **Kept for compatibility:**
  - links `#s=<level seed>&t=<seconds>&l=<level>&m=<mistakes>&h=1&n=<name>` parse exactly as before;
  - `ektukhani-levels-chhobi-photao` and `ektukhani-best-chhobi-photao-l<level>`;
  - new `ektukhani-unlock-chhobi-photao`, your own unlock migrated once from the old rule, so nobody loses a level. A friend's far-ahead level records stars but opens nothing between;
  - the URL `/chhobi-photao`, the title, the H1 text and the share id.
