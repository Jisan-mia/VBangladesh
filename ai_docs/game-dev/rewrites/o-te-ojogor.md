# অ-তে অজগর: rewrite design

## Core
- **Concept:** the বর্ণ পরিচয় grows on a tree. Each letter is a ripe fruit. Pick the right next one and it drops into a cane basket, then the picture word shows: অ-তে অজগর.
- **Fantasy:** a calm afternoon under a big tree with a friendly green অজগর curled at its foot. You fill a basket with the whole alphabet, then words, then numbers.
- **Loop:** look (the এবার card shows the letter) → pick (tap the fruit) → see and hear (the picture word, a bell).

## Who it is for, and the big change
The page is a kids' page (৪–৮ বছর). Before, letters fell in real time, a "ভুল ২" counter sat in the HUD while you played, and mistakes cost stars. The kids' brief says there's no clock for 3–5, timers only in an optional challenge for 7+, no lost lives, and nothing red. So:
- **গাছতলা** (the default, for everyone): the fruits hang and wait. Tap the right one and it drops into the basket. There's no clock, nothing falls by itself, and nothing can be lost.
- **ঝড়ো হাওয়া** (optional, "৭ বছর থেকে"): the old game. The wind shakes the fruit loose and you catch the right one in the basket. The same 22 levels at the same speeds.
- **No mistake counter anywhere.** A star counts letters you picked right first time. A wrong pick only rocks the basket. A dropped fruit in ঝড়ো হাওয়া costs nothing; it comes back.
- **Helping without saying so:** after two wrong picks on one letter, the right fruit glows (a gold ring plus a dashed ring, so colour isn't the only sign). Three wrong picks in a row and the next round quietly hangs one fewer fruit. Five right in a row and it hangs one more, never more than 4.

## Progression: 4 worlds, 22 levels (numbers, sets and star rules kept)
| World (palette) | Levels | One new thing each |
|---|---|---|
| **স্বরবর্ণ**: ভোরের গাছ (pale dawn sky) | 1 অ–ঊ (the first two fruits hang alone, so a ghost finger shows the first tap) · 2 ঋ–ঔ (a wrong fruit appears beside it) · **3 finale "এগারোটা স্বরবর্ণ"**: all eleven, three fruits at a time |
| **ব্যঞ্জনবর্ণ**: দুপুরের গাছ (blue noon) | 4 ক–ঙ · 5 চ–ঞ (three at once) · 6 ট–ণ · 7 ত–ন · 8 প–ম · 9 য–হ (four at once) · 10 ড়–ঁ (the marks) · 11 ক–ন run · **12 finale "পুরো বর্ণমালা"** |
| **শব্দ**: বিকেলের গাছ (gold) | 13 আম, বই (letters make a word) · 14 কার joined (ফু) · 15 চন্দ্রবিন্দু (হাঁ) · 16 four words · 17 four fruits · **18 finale "বাজারের ঝুড়ি"** (রিকশা, টমেটো, তরমুজ) |
| **সংখ্যা**: সন্ধ্যার গাছ (dusk, a moon) | 19 ১–১০ (dots under the digit) · 20 ১১–২০ · 21 even numbers · **22 finale "উল্টো গোনা"** |

## Difficulty and story
- **গাছতলা:** "বর্ণ ঝুলে থাকে, যত সময় লাগে নাও।" The level sets how many fruits hang (2–4).
- **ঝড়ো হাওয়া:** "বাতাসে বর্ণ নিজেই পড়ে, ঝুড়ি সরিয়ে ধরো।" The level sets fall speed and how many fall together.
- **Bots:** a child who knows the next letter 80% of the time and otherwise taps at random finishes every level in গাছতলা, and earns 3 stars on level 1 on ≥ 60% of seeds. In ঝড়ো হাওয়া a careful bot (0.45 s reaction) clears every level with 3 stars on every seed. A careless bot (0.35 s reaction, aim error, 3% wild moves, never dodges) gets 3 stars on level 1 on ≥ 90% of seeds. A bot that notices 70% of the wrong fruit gets 3 stars on level 1 on ≥ 95% of seeds and on the last finale on 40–90%.
- **No story.** The tree is the world, and a pre-reader can't read panels. The first fruit of level 1 has a ghost finger instead.

## Screens
- **Title (inside the stage):** the biggest thing is a canvas-drawn basket of অ আ ই fruit with the অজগর peeking over the rim, labelled **খেলো**. Under it: two mode chips (গাছতলা / ঝড়ো হাওয়া), one line for the chosen mode, and the level chip "লেভেল ৪ · ক থেকে ঙ", which opens the level list.
- **Level list (choice screen; nothing moves):** four worlds, numbered 1–22, with stars. The next level to play is marked **এটা খেলো**. Locked levels are dim and show a lock shape.
- **HUD (above the board, outside the play area):** level badge top-left (inset past the ⏸ in immersive mode), stars top-right. The এবার card on the right shows the letter at 56 px (word units are underlined in the word). The picture word appears beside it after each catch. A strip of the level's letters fills in as you go. In ঝড়ো হাওয়া, ◀ ▶ sit under the board.
- **Danger (ঝড়ো হাওয়া only):** when the right fruit will land on the grass away from the basket, the board's edge glows amber. In ধীরে খেলো it's a steady border.
- **Finales:** the badge carries the finale's name. Confetti only when a finale is cleared, the end of a world.
- **End screen:** stars pop in, then one picture line ("অ থেকে ঊ ঝুড়িতে। অজগর লেজ দোলাচ্ছে।"), then counts that tick up (৬টা বর্ণ ঝুড়িতে · ৫টা প্রথমবারেই). Then two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ**. শেষ goes to the title with the next level ready, and nothing starts by itself. **আব্বু-আম্মুকে দেখাও** opens the card for a grown-up, with "ফোনে ছবি রাখো" and "খেলাটার লিংক পাঠাও" behind the parent gate.
- **Card:** the primer page (the level's letters on fruit, or its words with pictures), with no name, plus "৬টা বর্ণ · ৫টা প্রথমবারেই". The footer says "গাছ থেকে বর্ণ পাড়ো, ঝুড়িতে ভরো"; there's no challenge.

## Sound (`shared/game-sound.ts`, no loops, no music)
- a pop when a fruit lands in the basket;
- **the signature,** a two-note brass bell as the picture word appears (no voice anywhere: the picture, the word and the motion carry every cue);
- a soft rustle when a fruit leaves its branch;
- a springy boing for a wrong pick, never a buzzer;
- a soft টুপ for a dropped fruit (ঝড়ো হাওয়া);
- the shared star chimes, and level-up for a finale.

Each sound has a visible twin: the picture word, the basket rock and the ring, the fruit on the grass, the stars.

## Comfort and controls
- **ধীরে খেলো:** ঝড়ো হাওয়া falls at 0.6×; nothing sways, shakes or pulses; the basket leans instead of rocking; no confetti. Stars stay the same. In ঝড়ো হাওয়া that makes dodging easier, and the design accepts it: গাছতলা already gives the same stars with no clock at all.
- **Touch:** গাছতলা: tap a fruit, or anywhere in its column (each column is at least 80 px wide and the full board tall). ঝড়ো হাওয়া: drag on the board, or hold ◀ ▶.
- **Keys:** ← → move the basket (গাছতলা: fruit to fruit; ঝড়ো হাওয়া: hold). Space, Enter or ↓ picks the fruit above the basket. On the title, Space or Enter = খেলো. On the end screen, a fresh press of Space or Enter = আবার খেলো. Escape belongs to the player.
- **Away:** the player's pause, window blur and tab hide all release a held arrow or drag and stop the clock. The first tap back is swallowed, and is never a move.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and when it is won, and `RestScreen` covers the stage. Nothing a child does leaves the phone.

**Kept for compatibility:**
- old links `#s=…&t=…&l=…(&n=…)` still open that level with that seed (the same tree). The name is ignored and removed from the address bar. No new link carries anything: `share.normalize` returns null, and an old short link's preview no longer shows a name;
- `ektukhani-levels-o-te-ojogor` (stars). New: `ektukhani-unlock-o-te-ojogor` (this game's own unlock, migrated once from the stars), `ektukhani-links-o-te-ojogor` (levels an old link opened, so a second link never locks them) and `ektukhani-mode-o-te-ojogor`;
- `/o-te-ojogor`, the share id, title, description and H1.
