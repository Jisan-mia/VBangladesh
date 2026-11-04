# সুডোকু বাংলায়: rewrite design

## Core
- **Concept:** the puzzle page of a Bangla newspaper, on a phone: one grid, Bangla digits, one logical answer.
- **Fantasy:** a calm ten minutes with the paper and a ballpoint, and nobody waiting for the page.
- **Loop:** চাপো (a cell) → বসাও (a digit, or a pencil mark) → মেলাও (a row, column or box rings its bell).

## Progression
Four worlds of ten levels each (the pinned 40-level ladder; the grids behind old links don't change). Each world has its own paper and ink, and each level's start card names the one new thing it teaches. Lessons live in `lib/levels.ts` as data.

| World | Grid | Paper | Finale (level 10/20/30/40) |
|---|---|---|---|
| সহজ · সকালের কাগজ | ৪×৪, 4 → 12 blanks | newsprint, blue ballpoint, yellow highlighter | ছোট মামার ধাঁধা |
| মাঝারি · খাতার পাতা | ৬×৬ (2×3 boxes), 10 → 24 | ruled exercise book, green ink | বড় আপার ধাঁধা |
| কঠিন · রবিবারের পাতা | ৯×৯, 30 → 51 | the weekend supplement, maroon ink | নানাভাইয়ের ধাঁধা |
| ওস্তাদ · রাতের সংস্করণ | ৯×৯, 52 → 58 | the night edition: a dark sheet, gold ink | সম্পাদকের ধাঁধা |

The lessons go in this order. World 1: the row rule, then the column, the box, "fill the row with one blank first", kind mistakes, undo, same-digit highlights, the line bell, the pad's "left to place" counts. World 2: the 2×3 box, খসড়া (pencil), pencil marks clearing themselves, hidden singles, hints, naked singles from notes, the star meter, progress being kept, pairs. Worlds 3 and 4 add one scanning technique per level.

## Difficulty and daily
- **The ladder is the difficulty.** The start card says what changes in plain terms ("এবার ৬×৬: বাক্স ২ সারি × ৩ কলাম").
- **আজকের ধাঁধা** has three difficulties. The last one picked is remembered on the phone, and each chip has a one-line consequence:
  - **সহজ:** ৬×৬, about ২০ blanks, "চায়ের কাপ ঠান্ডা হওয়ার আগেই".
  - **মাঝারি:** ৯×৯, about ৩৮ blanks.
  - **কঠিন:** ৯×৯, about ৪৬ blanks. This is the original daily, so old `#s=<date>` links open it unchanged.
- **The week strip:** seven dots show which days this week you solved, with a streak count.
- **Story:** none. The paper is the world. The finales get a named relative who set the puzzle and one dry line about it.

## Screens
- **Title (start card):** a folded newspaper page covers the stage. It shows the masthead "একটুখানি · ধাঁধার পাতা", tabs for লেভেল and আজকের ধাঁধা, and ‹ level › with its world, size, lesson line and 3-star time. The biggest thing is the blue ink stamp **শুরু করো**, or **চালিয়ে যাও ০৩:১২** when a half-done grid is saved, with a small নতুন করে link. The board stays hidden until the clock runs, so nobody solves it for free.
- **Choice moment:** the সব লেভেল sheet. It shows the four worlds, numbered levels with stars, a lock on closed levels, and **এটা খেলো** on the recommended level. Opening it mid-puzzle stops the clock.
- **HUD (corners only):**
  - top-left: the level badge, which opens the sheet;
  - top-right: the clock, with a star meter (★★★ until par, then ★★) and the friend's time under it on a challenge;
  - along the top edge of the board: a thin bar of cells filled.
- **Mistakes, shown kindly:** the wrong digit turns red with a wavy underline and a small shake, and the clashing digit in its row, column or box gets a red ring, so you see why. It costs no star.
- **Danger:** no lives. Passing par only drops the star meter, at the edge.
- **Finale:** the named puzzle, with a red "শেষ ধাঁধা" badge on its start card, confetti, and a stamp on the card.
- **End screen:**
  - the solved wave runs across the grid, and StarReveal brings the stars in one by one;
  - the stats count up: সময়, নিজে ভরা ঘর, ভুল, সাহায্য;
  - the exact near-miss line, and the best time on this phone;
  - পরের লেভেল (primary), আবার খেলো, কার্ড দেখো.
- **Card:** newsprint, with a stamp on finales.

## Sound (shared/game-sound only, no loop)
- the ballpoint tick (the signature);
- the pencil scratch;
- the eraser rub;
- the line bell (scheduled with `tone(delay)`, so a pause cuts it);
- the paper unfold on শুরু করো;
- shared wrong, pop (hint), levelUp and the StarReveal chimes.

Every sound has a visible twin: red and shake, the line flash, the solved wave.

## Comfort and controls
- **ধীরে খেলো:** no shake, flash, wave or count-up, and no confetti. Stars are unchanged.
- **Touch:** tap a cell, tap a digit. খসড়া, মুছে দাও, ফিরিয়ে আনো and বলে দাও sit under the pad.
- **Keyboard:**
  - arrows move, 1–9 or ১–৯ write, and 0, Backspace or Delete erase;
  - P or N toggles pencil marks, Z undoes, H gives a hint;
  - Enter or Space starts from the start card and goes on from the result, but only on a fresh press;
  - Esc belongs to the player.
- **Buttons clicked with a finger or mouse drop focus**, so Enter never repeats an erase or an undo.
- **Kept for compatibility:**
  - links `#s=&t=&l=&h=&n=`, with `h` now taking 0 up to the blank count, and the new optional `z=e|m` for the easy and medium dailies;
  - the levels key `ektukhani-levels-sudoku` and best keys `ektukhani-best-sudoku-l<N>` and `-d<date>`;
  - your own unlock is migrated once from the stars (`ektukhani-sudoku-open`);
  - the URL `/sudoku`, the title, the H1 and the FAQ.
