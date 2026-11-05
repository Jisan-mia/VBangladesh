# নাম শিখি: rewrite design

## Core
- **Concept:** a picture-name book (নামের খাতা). Each round fills one page with six stickers. Each sticker you place gets its name tag: **বিড়াল · Cat**.
- **Fantasy:** a sticker book on the bed on a rainy afternoon. You are the one who finishes the page, and every finished page is yours to show আব্বু-আম্মু.
- **Loop (3 verbs):** দেখো (the big card shows a clue) → বেছে নাও (tap one of 2–4 stickers) → বসাও (it flies onto the card, wiggles, and its name tag pops up). Then → takes you to the next card, and the page strip fills.

## Who it is for, and the big change
This is a kids' page for ages ৩–৭. Before, every level asked the child to read: a big word (হাতি) with three pictures, and on every right tap the phone spoke the name. Now there's **no voice anywhere** (the owner's rule: phone text-to-speech reads Bangla badly). A 3-year-old can't read, so the old game was really a parent's game. The rewrite:
- **The clue is a picture for ages 3–5:** a faint printed sticker place, a bush with something peeking out, a home, a grey drawing to paint, or a round lens over part of the body. The name comes as the reward, and a parent reads it aloud.
- **Word levels come later and still need no reading:** the big word sits on the card and every sticker carries its own name. So a pre-reader matches the word's shape, letter for letter. That is a real pre-reading skill: বিড়াল, বানর and বাঘ all start with ব.
- **Feedback teaches:** a wrong sticker wobbles and shows *its* name ("এটা বানর"), so even a miss teaches a name. After two misses the right sticker glows with a gold ring and a dashed ring, so colour is never the only sign. In the body word levels the lens picture appears after the first miss.
- No clock, no lives, nothing red, 2–4 choices, picture targets ≥ 96 px.

## Progression: 6 worlds (one page each), 31 levels
Each world teaches one new kind of clue per level and ends with a named finale: every kind of clue mixed, with 4 stickers. All levels stay open (a child never meets a lock), and the list marks **এটা খেলো**.

| World (palette) | Levels (one new thing each) | Finale |
|---|---|---|
| **পশুপাখি** (উঠান: cream, leaf green) | 1 মিলিয়ে বসাও (faint picture, 2 stickers, ghost finger) · 2 উঁকি (only the top shows over a bush) · 3 কে কোথায় থাকে (a home shown, find who lives there) · 4 বাংলা নাম · 5 ইংরেজি নাম | **6 চিড়িয়াখানা** |
| **ফল** (মধুমাস: mango yellow) | 7 মিলিয়ে বসাও · 8 উঁকি · 9 বাংলা নাম · 10 ইংরেজি নাম | **11 মধুমাসের ঝুড়ি** |
| **সবজি** (বাগান: soil, chilli green) | 12 মিলিয়ে বসাও · 13 উঁকি · 14 বাংলা নাম · 15 ইংরেজি নাম | **16 কাঁচাবাজার** |
| **শরীর** (sky blue) | 17 মুখে খোঁজো (the lens shows a part of the face, tap it on the face) · 18 গায়ে খোঁজো (the whole child) · 19 বাংলা নাম (word, tap the figure; the lens comes after a miss) · 20 ইংরেজি নাম | **21 মাথা থেকে পা** (head to toe, in order) |
| **রং** (paint box: white, primaries) | 22 রং করো (a grey drawing, tap the paint and it colours in) · 23 রঙের জিনিস (a paint splat, find the thing of that colour) · 24 বাংলা নাম · 25 ইংরেজি নাম | **26 রঙের বাক্স** |
| **দেশের প্রতীক** (লাল-সবুজ) | 27 মিলিয়ে বসাও · 28 বাংলা নাম · 29 জাতীয় কী (জাতীয় ফুল → শাপলা; for readers) · 30 ইংরেজি নাম | **31 লাল-সবুজ** |

Each round has six cards (five for গায়ে খোঁজো, which has five parts). The choices change silently: three missed cards in a row take one sticker away, and five right in a row add one. The count stays within 2–4, and never more than one away from the level's own count.

## Difficulty and story
- **No modes, no story.** A pre-reader can't read panels or mode chips, and the brief says never announce "easy". The sticker book is the world. The ghost finger shows the first tap.
- **Stars** are a record only: 3 for all but one card right first time, 2 for at least half, 1 for finishing.
- **Bots (tests, 400 seeds per level):**
  - a *guesser* (random, then the glowing sticker) finishes every level, at most 3 taps per card;
  - a *3-year-old* (knows the picture clue 80% of the time) gets ≥ 2 stars on level 1 on ≥ 90% of seeds;
  - a *4-year-old* matching word shapes 65% of the time gets ≥ 2 stars on the বাংলা নাম levels on ≥ 75% of seeds;
  - a *reader* (95%) gets 3 stars on every finale on ≥ 75% of seeds.
  - Level 1's first card is a 2-sticker card with the ghost finger: right within 10 s.

## Screens
- **Title (inside the stage):** the biggest thing is the open name book drawn in code: two pages, three of the world's stickers with their name tags, and **খেলো** across the bottom. Under it are six picture tiles, one per world (পশুপাখি, ফল, …). Then the level chip ("২ · উঁকি · সব লেভেল") and one line for the parent saying what the level does.
- **Level list (a choice screen; nothing runs under it):** the world's levels, numbered. Each shows a picture of its clue kind, the name, one line ("ঝোপের আড়াল থেকে মাথাটা দেখা যায়"), its stars, and **এটা খেলো** on the recommended one. World tiles and the list exist only on the title, never mid-round.
- **HUD:** the level badge top-left (below the player's band), the page strip top-right (six small seats that fill with each placed sticker). The middle holds only the clue card and the stickers.
- **Danger:** none. Nothing can be lost, so nothing glows at the edge.
- **Finales:** the badge carries the finale's name. Finishing a finale (the world's page) plays the world's four-note tune and a small confetti burst (not in ধীরে খেলো). Ordinary levels get a two-note chime only.
- **End screen:** the full page (six stickers with names, 3 × 2), the stars, and counts that tick up ("৬টা নাম খাতায় · ৫টা প্রথমবারেই"). Then the off-screen task ("ঘরে একটা লাল জিনিস খুঁজে আম্মুকে দেখাও।"). Then two 112 px picture buttons of equal size: **আবার খেলো** (a circling arrow) and **শেষ** (a closed book), which goes to the title with the next level ready. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (ShowParent):** the finished page with names in Bangla and English, the level and the stars. No name of the child. Saving it, and the tool's plain link, sit behind the parent gate. The og image is unchanged.

## Sound (`shared/game-sound.ts`, no loops, no music)
1. **Tap:** a soft tick when a sticker is touched. You see it press.
2. **Signature, "চট":** a paper pat as the sticker lands, then two rising marimba notes pitched by world. You see the sticker land and the name tag pop.
3. **Miss:** a soft low boing, never a buzzer. You see the wobble and the wrong sticker's own name.
4. **Next card:** a paper swish. You see the card slide in.
5. **Page full:** the shared star chimes. A finale adds the world's four-note tune. You see the stars and the full page.

## Comfort and controls
- **ধীরে খেলো:** no fly, wiggle, slide or confetti; the sticker fades in; the glow is a steady ring. Stars don't change, since nothing is timed.
- **Touch:** tap a sticker (≥ 104 px, 16 px gaps), or a place on the figure (taps go to the nearest part). Only the first finger counts. The → button and the solved card both go on.
- **Keys:** 1–4 pick a sticker (each shows its number). Enter or Space: খেলো on the title, → on a solved card, and আবার খেলো on the end screen (a fresh press only). Tab reaches the body parts. P pauses through the player; Escape is the player's.
- **Away:** the player pauses on blur and hide. The first tap back only wakes the game. Nothing is timed, so nothing is lost.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the tap that places the last sticker; the stars are saved in that same tap. Between rounds it checks every second. `RestScreen` shows on any screen but play. No network, no name, no share in the child's view.
- **Kept for compatibility:**
  - `#p=<pack>` links (pashu, fol, sobji, shorir, rong, protik) open that world's title;
  - old stars (`ektukhani-levels-nam-shikhi-<pack>`) move once into `ektukhani-levels-nam-shikhi` (bn → বাংলা নাম, en → ইংরেজি নাম, home → কে কোথায় থাকে, thing → রং করো, role → জাতীয় কী, read → বাংলা নাম). The old keys stay as they are;
  - `/nam-shikhi`, the title and H1, the static share card, and no tally.
