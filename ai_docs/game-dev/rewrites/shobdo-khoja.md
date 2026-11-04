# শব্দ খোঁজা: rewrite design

## Core
- **Concept:** the cheap puzzle booklet sold on the launch and the bus, one themed page at a time: find the hidden Bangla words and strike them with a ballpoint.
- **Fantasy:** a slow ferry ride with a ধাঁধার বই and a pen, and the small click of a word you were sure wasn't there.
- **Loop:** খোঁজো (scan for a letter) → টানো (drag the pen from its first letter to its last) → কাটো (the word sings, the list strikes it).

## Progression
Eight packs are eight worlds, four pages each (32 levels). Each page teaches exactly one new thing, shown on its start card as **নতুন** (or **শেষ পাতা** on a finale). The grid is a fresh seed each play, so a replay is never a memory test; level 1's first play uses a fixed teaching seed.

| World | Page | Levels | What arrives | Finale |
|---|---|---|---|---|
| ১ ফুল | ফুলের বাগান | 1–4 | → only (5×5, 3 words), then ↓, then ↘ (6×6), then a shared cell | মালি চাচার বাগান |
| ২ মাছ | মাছের হাট | 5–8 | ↗, then a 7×7 page, then ← (words backwards) | জেলে ভাইয়ের জাল |
| ৩ পিঠা | পৌষের পিঠা | 9–12 | ↑, then all eight ways, then ফাঁদ (a false start) | নানুর পিঠার থালা |
| ৪ ফল | ফলের ঝুড়ি | 13–16 | an 8×8 page, then a clue list (আ··· = first letter + cells), then a crowded 6×6 | মধুমাসের ঝুড়ি |
| ৫ পাখি | পাখির ডাক | 17–20 | backwards words read cell by cell (ক·লি·শা = শালিক), then repeated letters (ঘুঘু, টুনটুনি), then a tight clock | দাদুর বারান্দা |
| ৬ খেলা | স্কুল মাঠ | 21–24 | যুক্তাক্ষর in one cell (গো·ল্লা·ছু·ট), then rare letters first, then a backwards clue | টিফিনের ঘণ্টা |
| ৭ ঋতু | বারো মাস | 25–28 | রেফ inside its cell (ব·র্ষা), then dense conjuncts, then eight words | চৈত্র সংক্রান্তি |
| ৮ নদী | নদীর দেশ | 29–32 | long names first, then everything together | মাঝির শেষ খেয়া |

- Levels are data in `lib/levels.ts`: size, words, directions, traps, clue list, words it must include, words that must run backwards, and the star times.
- **Bot targets (tests/bot.ts, many seeds):** a steady player clears level 1 inside 10 s at least 95% of the time; a casual player earns ★★★ on most of world 1–2 and at least ★★ through world 4; finales are where three stars get rarest; every level is generated for every seed tried.

## Difficulty and story
- **The ladder is the difficulty.** Each start card says what changes in the player's words ("এবার উল্টো দিকেও: ডান থেকে বাঁয়ে").
- **নিজের মতো (free play)** keeps the old 7×7 grids, with a pack and two difficulties. The last pick is remembered:
  - **সহজ:** "পাশাপাশি, ওপর-নিচে আর কোনাকুনি, সব সোজা দিকে।"
  - **কঠিন:** "আট দিকেই লুকায়, উল্টো দিকেও।"
- **Story:** none. The booklet is the world. Each finale is a named page with one dry line that uses its real three-star time.

## Screens
- **Title (start card):** a booklet page over the stage, with:
  - the masthead "একটুখানি · শব্দ খোঁজার বই";
  - tabs for লেভেল and নিজের মতো;
  - ‹ level ›, with the world and its drawn motif;
  - the lesson line;
  - a blank grid in the world's paper with a pen;
  - the star target.

  The biggest thing is the ink stamp **খোঁজা শুরু**. The grid stays hidden until it is pressed, so nothing is found while the clock reads zero.
- **Choice moments, all of which pause the clock:**
  - **The sheet:** opened from the level badge mid-round. It shows the eight worlds with numbered levels, their stars, a lock, **এটা খেলো** on the recommended one, and finales marked.
  - **Ask before wiping:** whenever a pick in the sheet, a pack or difficulty change, or নতুন গ্রিড would throw away a started round. It shows before → after ("লেভেল ৫ · ৩/৬ শব্দ, ০:৪২ → লেভেল ৭, নতুন পাতা"). The options are ১ **এখানেই থাকো** (pre-selected, সুপারিশ) and ২ **ছেড়ে যাও**.
- **HUD (corners only):**
  - top-left: the level badge, which opens the sheet;
  - top-right: the clock, the ★★★ track with a meter until the next star drops, and the star target "★★★ ০:৪৫";
  - a thin progress bar along the top of the board;
  - the word list sits right under the board, always on screen.
- **Danger at the edge:** in the last 10 s before the three-star time, the board's frame glows amber (a static border in slow mode). There is no popup.
- **Found words sing:**
  - the ink stroke draws itself;
  - each letter of the word pops in turn while an arpeggio climbs the world's scale (one note per cell);
  - the list chip gets struck in the same ink;
  - quick finds make a run, which raises the key and shows "টানা ৩" in the corner.
- **Mistakes:** a red capsule fades with a small shake, and the line under the board says why ("এটা তালিকায় নেই").
- **Finale:** a red **শেষ পাতা** badge, a brass page edge, confetti on the first clear, and a stamp on the card.
- **End screen:**
  - StarReveal brings the stars in;
  - the stats count up: সময়, শব্দ, সেরা টানা, ভুল টান, হিন্ট;
  - the exact near-miss line ("আর ৮ সেকেন্ড কম লাগলে ৩ তারা") and the best time on this phone;
  - **পরের লেভেল** (Enter, fresh press only), আবার খেলো, কার্ড বানাও ↓.
- **Card:** the solved page in the world's paper, with each word's ink stroke, the time, the level and stars, a stamp on finales, and the kind line.

## Sound (only `shared/game-sound.ts`, no loop)
1. **Pen down (signature):** a ballpoint click on touch.
2. **Scratch:** one soft scratch per cell the stroke grows.
3. **The song:** the found word's arpeggio, one note per cell in the world's pentatonic key, a step higher per run. It is scheduled with `tone(…, delay)`, so a pause cuts it.
4. **Miss:** a soft low thud.
5. **Hint:** the shared pop.
6. **Page turn:** a paper hiss on start and next level. Then StarReveal and levelUp on the result.

Every sound has a visible twin: the letters pop with the song, the capsule turns red on a miss, the hint ring shows, and the result shows.

## Comfort and controls
- **ধীরে খেলো:** no shake, pops, draw animation, edge pulse, count-up or confetti. Stars are unchanged.
- **Touch:**
  - drag from the first letter to the last. The line snaps to the eight directions, holds its direction against a wobble, and forgives one cell of overshoot or of a late start;
  - or tap the first letter, then the last.
- **Keyboard:**
  - arrows move a cursor, and Enter or Space marks the first letter, then the last;
  - H gives a hint, P opens the player's pause menu, and Esc belongs to the player;
  - 1 and 2 answer the ask-before-wiping card;
  - Enter on the result needs a fresh press after it shows.
- **Mouse:** the same as touch. Clicked buttons drop focus, so Enter never presses them again.
- **Kept for compatibility:**
  - every old link (`#s=&t=&p=&l=&h=` with optional `d=1` and `v=1–24`) still parses and rebuilds the same 7×7 grid (checksums pinned in tests). New ladder links add `g=<1–32>`;
  - the old stars in `ektukhani-levels-shobdo-khoja` are kept and migrated once into the new ladder's open level (`ektukhani-shobdo-khoja-open`). New stars go to `ektukhani-levels-shobdo-khoja-boi`;
  - the best keys per pack and difficulty are unchanged;
  - no tally, the URL `/shobdo-khoja`, the title, and the H1 headline reworded only so it no longer promises exactly six words.
