# চড়ুই তাড়াও: rewrite design

## Core
- **Concept:** নানা গেছেন হাটে, and you guard his ripe paddy until সন্ধ্যা. Birds land on the শীষ and peck. You clap them off, হুশ!
- **Fantasy:** every Bangladeshi child sent to the ক্ষেত with a কাকতাড়ুয়া for company and told "চড়ুই যেন একটা দানাও না খায়".
- **Loop:** *দেখো* where it lands (the shadow grows on the paddy, a chevron at the edge it flies in from) → *চাপো* (হুশ!) → *বাঁচাও* the grain. Each bird kind lands in a pattern you learn to read.

## Progression: 3 worlds × 4 ক্ষেত (`lib/levels.ts`, 12 level numbers; the old 10 keep their place)
Each ক্ষেত teaches one thing, named on its start card ("নতুন: …"). Each world adds one new bird and ends with a **named boss bird**: its name and hit pips sit top-centre, and সন্ধ্যা waits until it is chased off.

| # | ক্ষেত | The one new thing |
|---|---|---|
| **World 1: আমনের বিকেল** (হেমন্ত, golden hour) ||
| 1 | প্রথম চড়ুই | Sparrows from the left only, one at a time. Tap one. Dusk at 10 s. |
| 2 | দুই দিক থেকে | They come from both sides. Watch the edge chevron. |
| 3 | জোড়ায় জোড়ায় | Pairs land together, apart from each other. |
| 4 | **পালের গোদা** (boss) | A fat sparrow, 3 claps. After each it flies off and lands somewhere else, and it eats twice as fast. |
| **World 2: কুয়াশার সকাল** (অগ্রহায়ণ, pale mist) ||
| 5 | সাহসী শালিক | **New bird:** a শালিক needs two claps. The first only makes it hop aside. |
| 6 | কুয়াশা | Mist hides birds in flight. Only the growing shadow shows where they'll land. |
| 7 | দল বেঁধে | Groups of three, sparrows and শালিক mixed. |
| 8 | **ঝুঁটি শালিক** (boss) | A crested শালিক, 4 claps. After each it sits on the কাকতাড়ুয়ার মাথাল, out of reach, then drops back in. |
| **World 3: মোড়লের ক্ষেত** (dusk, rose and violet) ||
| 9 | মুনিয়ার ঝাঁক | **New bird:** মুনিয়া land in a tight flock of three. One clap in the middle gets them all. |
| 10 | বড় ঝাঁক | Flocks of five, spread wider: two claps. |
| 11 | সব রকম | Sparrows, শালিক and মুনিয়া in one afternoon. |
| 12 | **ডাকাত টিয়া** (boss) | A green parrot, 3 claps. It swoops in fast from the far side each time, with flocks around it. |

- **Stars (marks per ক্ষেত):** ★ the grain left at dusk reaches the pass mark, ★★ and ★★★ higher marks. All grain gone is a lost ক্ষেত. The grain line in the top-right has a notch at each mark.
- **Bots (`tests/levels.test.ts`, on the real `stepGame` and `clap`; `tests/bot.ts`):**
  - a **casual** bot (0.75 s reaction, ±18 unit thumb error, a clap at most every 0.55 s, watches the most urgent bird 65% of the time) wins ক্ষেত 1 every time within 10 s (about 7 s) and clears every ক্ষেত at ≥ 80%; its ★★★ gets rarer from world 1 to world 3;
  - on **সহজ** it clears every ক্ষেত at ≥ 90%; on **কঠিন** each finale is below its world's first ক্ষেত;
  - a **sharp** bot (0.45 s, ±8, aims at a flock's middle) clears every ক্ষেত at ≥ 95%;
  - an **idle** player loses every ক্ষেত.
- **Unlocks:** your own unlock (`ektukhani-unlock-churui-tarao`) rises only when you clear the furthest open ক্ষেত. A friend's far-ahead ক্ষেত records its stars but opens nothing in between.

## Difficulty and story
- **How much a peck takes (title chips, remembered):** who lands where and when never changes, so a friend's link is the same afternoon on every mode.
  - **সহজ:** "এক ঠোকরে ১% ধান যায়। শিখতে শিখতে খেলো।"
  - **স্বাভাবিক (default):** "এক ঠোকরে ২% ধান যায়।"
  - **কঠিন:** "এক ঠোকরে ৩% ধান যায়।"
  The marks are the same on every mode, so সহজ really is easier, ★★★ too.
- **Story (first run only, a tap for the next, hold 0.6 s to skip):**
  1. "হেমন্তের বিকেল। ক্ষেতে পাকা ধান।"
  2. "নানা গেছেন হাটে। পাহারায় কাকতাড়ুয়া, আর তুমি।"
  3. "চড়ুই নামলেই চাপো, হুশ! সন্ধ্যা পর্যন্ত।"
  Never on a friend's link or আবার খেলো (`ektukhani-intro-churui-tarao`).

## Screens
- **Title:** the field behind, dimmed. The biggest thing is the code-drawn কাকতাড়ুয়া with its arms out over a heavy শীষ and a sparrow taking off, labelled **মাঠে নামো** (the friend's challenge above it). Under it, small: ‹ ক্ষেত N · name ›, the "নতুন" line, the three mode chips and the chosen one's line, the star marks, **সব ক্ষেত**, and the control hint.
- **Choice moment, সব ক্ষেত:** a sheet over the stage that pauses a round in progress: three worlds of four, numbered (keys 1–9, 0, -, =), each with its one new thing and its stars, locked rows with a lock shape, **এটা খেলো** on the recommended one. The HUD badge opens it.
- **HUD, in the corners (canvas, Bangla digits):** top-left the ক্ষেত badge (opens সব ক্ষেত); top-centre the seconds to dusk with a sinking sun, and on a finale the boss's name and hit pips on a second row under it (clear of the badge and the grain); top-right the sheaf, the grain % and a thin grain line with its star notches, and "হুশ n" under it; the streak "টানা ৪" under that; the dusk line along the very top edge. The middle stays clear; pops are small and quick.
- **Danger at the edge:**
  - grain under the pass mark: the screen edge glows orange, pulsing (a steady border in ধীরে খেলো);
  - grain under 20%: the glow turns red;
  - each lost 10%: one short warm pulse along the bottom edge;
  - an arrival: a chevron at the left or right edge, at the bird's height, 0.7 s before it flies in (white for a sparrow, a dark one for a শালিক, a row of three for a flock, a big red one for the boss).
- **Finales:** the boss gets a name and pips at the top centre, its own call when it arrives and a bigger body and shadow. Each clap knocks out a pip with a thud; the dusk line stops until it is gone.
- **End:** over the dimmed field, the heading ("সন্ধ্যা নামল, ক্ষেত পার" / "পালের গোদা পালাল!" / "সব ধান খেয়ে ফেলল" / "ধান কম পড়ল"), the stars one by one, then the stats counting up: ধান %, হুশ n/N, টানা সেরা, এক তালিতে সেরা. Then the exact near-miss line ("আর ৪% ধান বাঁচলেই ২ তারা") and three numbered choices: ১ পরের ক্ষেত (এটাই ভালো), ২ আবার খেলো, ৩ সব ক্ষেত. Keys 1–3 and Enter, a fresh press only, 0.7 s after it appears. **কার্ড দেখো ↓** scrolls the stage.
- **Card:** the world's sky over the paddy, the কাকতাড়ুয়া pleased or fretting, as many of the world's birds flying off as were shooed, the grain saved big, the ক্ষেত and its name, the stars, the card's own line.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the চিক-চিক** of a sparrow landing (a শালিক's harsher ক্যাঁচ, a flock's quick triple). Visible twin: the edge chevron, then the shadow.
2. **Clap:** a dry slap over a low knock, in the pointerdown itself. Visible: the ring.
3. **Shoo:** wings beating away, a chord for a multi-shoo, the streak climbing the scale. Visible: "হুশ!", "এক তালিতে ৩টা!".
4. **Peck:** a tiny tick per peck. Visible: grains falling from the beak and the grain line.
5. **Eating loop:** a soft rustle that grows with the number of birds eating. It plays only while a bird eats in a live round with sound on, and comes back after a pause or sound off and on. Visible twin: the pecking birds and the grain line.
6. **Boss:** its call on arrival, a thud for each clap, a falling whistle as it leaves. Visible: the pips.
7. **Dusk:** crickets. Visible: the sky goes rose.
- **World call:** the world's three notes at the start (scheduled `tone()`, so a pause cuts them).

## Comfort and controls
- **ধীরে খেলো:** the whole afternoon runs at 0.7×. No flapping, sway, grain bits, shake or pulsing: birds fade in and out and the edges are steady borders. The marks stay the same; the design accepts that slow mode buys reaction time.
- **Touch and mouse:** tap the bird or its shadow. The clap happens in the pointerdown itself (drawn in the same event) and reaches every bird within 38 units. A tap that only just misses says "একটুর জন্য".
- **Keys:** arrows hop the hand to the bird they point at (as before); Space or Enter claps there. Enter or Space starts from the title and takes the end screen's first choice (fresh press only). P opens the player's menu (`requestPause`). 1–3 on the end screen, 1–9, 0, -, = in সব ক্ষেত. Escape is the player's. Game keys are ignored while paused.
- **Away:** blur, a hidden tab, scrolling away or any choice screen stops the round, the eating loop and the input. Coming back never resumes by itself; after a resume the round waits half a second. The first tap after coming back only resumes. Celebration timers carry their run number and are cleared on every new round, choice and unmount.
- **Kept for compatibility:**
  - links `#s=&t=&c=&l=&n=` (old ones, no `v`) still parse and are checked against the old afternoon (`lib/legacy.ts`); they open the same seed on the same ক্ষেত number, and the friend's score shows as their claim from the old version (no compare). New links add `v=2` and `d=0|1|2` for the mode;
  - `ektukhani-levels-churui-tarao` stars stay by number; the old single best (`ektukhani-best-churui-tarao`) still moves into ক্ষেত 1's stars once; the own unlock migrates once from the stars;
  - `ektukhani-best-churui-tarao` (ক্ষেত 1) and `-<n>` per-ক্ষেত bests, the share id, `&og=1` previews, `/churui-tarao`, its title, description and H1.
