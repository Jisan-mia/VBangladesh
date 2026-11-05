# গোলকধাঁধা: rewrite design

## Core
- **Concept:** the pencil maze on the last page of a children's magazine, played with a finger. You walk from home to the জিলাপির দোকান.
- **Fantasy:** আম্মু sent you for hot জিলাপি. Between you and the shop lie the lanes of পুরান ঢাকা, the village আল, the Sundarbans canals, a load-shedding night and the চাঁদরাত bazaar.
- **Loop:** swipe → walk → choose. One swipe walks to the next turn on its own, and at the turn you pick the next way. The score is your time; the pencil line behind you is the story of the run.

## Progression: 5 worlds × 6 levels (the 30 level numbers and the saved stars stay)
Every maze is generated from a fixed seed (`lib/gen.ts`) and pinned by a checksum test. A solver proves each one solvable, free of traps, and inside its star targets.

| # | Name | The one new thing |
|---|---|---|
| **World 1: পুরান ঢাকার গলি** (brick and cream) ||
| 1 | প্রথম মোড় | Swipe; the walker goes to the turn. 5×5, two turns. Won in about 5 s. |
| 2 | কানাগলি | Dead ends. Swipe back and the pencil line rubs itself out. |
| 3 | সোজা গলি | Tap any cell down a straight lane to walk there. |
| 4 | দুই রাস্তা | Loops: two ways to the shop, the shorter earns the stars. |
| 5 | আগেই টানো | Many turns: swipe before the turn and the walker never stops. |
| 6 | **Finale: চকবাজারের জট** | A 10×10 knot of loops and dead ends. |
| **World 2: গ্রামের মেঠোপথ** (paddy green) ||
| 7 | চাবি আর ঝাঁপ | A bamboo gate; its key lies on the way. |
| 8 | ঘুরপথে চাবি | The key sits down a side lane. |
| 9 | দুই চাবি | Two gates, two keys: colour and shape match. |
| 10 | ঝাঁপের ওপারে চাবি | The second key is behind the first gate. |
| 11 | চাবির শর্টকাট | A gated short way, or the long way round without the key. |
| 12 | **Finale: জমিদারবাড়ির তালা** | Two gates, two keys, loops. |
| **World 3: সুন্দরবনের খাল** (mangrove teal) ||
| 13 | স্রোত | One-way water: the boat goes only downstream. |
| 14 | উল্টো স্রোত | The current blocks the obvious way; go round. |
| 15 | স্রোতের শর্টকাট | A one-way short cut. |
| 16 | স্রোত আর চাবি | Currents and a gate. |
| 17 | ভাটার টান | Many currents, both ways. |
| 18 | **Finale: মোহনার জট** | Currents, a gate and loops at the river mouth. |
| **World 4: লোডশেডিংয়ের রাত** (navy, a হারিকেন glow) ||
| 19 | লোডশেডিং | Darkness. Only the lantern lights the lanes; the shop's lamp always shows. |
| 20 | মনে রাখো | A smaller lantern; lanes you've seen stay faintly lit. |
| 21 | অন্ধকারে দুই রাস্তা | Loops in the dark. |
| 22 | অন্ধকারে চাবি | A gate and its key in the dark (the key glints). |
| 23 | অন্ধকারে স্রোত | One-way lanes in the dark. |
| 24 | **Finale: নিভু নিভু হারিকেন** | The smallest lantern, a gate and one-way lanes. |
| **World 5: চাঁদরাতের বাজার** (festive purple, string lights) ||
| 25 | রিকশা | A রিকশা stand: step on it, ride to the other stand. The only way across. |
| 26 | দুই রিকশা | Two rides in a row. |
| 27 | রিকশা আর চাবি | A ride and a gate. |
| 28 | একমুখী রাস্তা | Rides and one-way streets. |
| 29 | বাজারে লোডশেডিং | Rides in the dark. |
| 30 | **Finale: ঈদের আগের রাত** | Everything: rides, keys, one-way streets and loops. |

**আজকের ধাঁধা:** a 12×12 maze per Dhaka date, with the mechanic of world `(date % 5) + 1`. The old plain daily replays for old links.

## Difficulty and story
- **Modes (title chips, remembered):**
  - সহজ: "মোড়ে থামলে ঠিক দিকটা জ্বলে ওঠে। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। ৩ তারা পেতে মোড়ে বেশি থামা চলবে না।"
  - কঠিন: "সব ধাঁধা লোডশেডিংয়ে, হাতে শুধু হারিকেন। তারার সময় একটু বেশি।"
- **Stars:** time against a par from the solver's best walk: the walk itself, a thinking allowance per turn, each ride, and a first look. The walk speed and par are fixed when the run starts.
- **Bots (`tests/bot.ts`, asserted in `tests/levels.test.ts`):** a skilled bot that knows the way (0.25–0.4 s a turn) and a casual bot that takes the right turn 75% of the time (60% in the dark) and needs 0.5–0.9 s a turn. Every run of both bots reaches the shop. The casual bot finishes level 1 inside 10 s. On every level the skilled bot earns 3 stars on at least 80% of runs, the casual bot at least 2 stars on 70%, and 3 stars on at most 60%, so 3 stars is a real target.
- **Story (first run only, hold to skip, never on a friend's link):**
  1. "বিকেলে আম্মু বললেন, ‘মোড়ের দোকান থেকে গরম জিলাপি নিয়ে এসো তো।’"
  2. "কিন্তু পুরান ঢাকার গলি মানেই গোলকধাঁধা। মোড়ের পরে মোড়।"
  3. "আঙুল টানো, মোড় পর্যন্ত নিজেই হাঁটবে। জিলাপি ঠান্ডা হওয়ার আগে পৌঁছাও।"
  A tap shows the next panel; holding 0.6 s skips all. Remembered in `ektukhani-intro-golokdhadha`.

## Screens
- **Title:** the biggest thing is the level's own maze, drawn in its world's colours, with home, the shop, the walker, and **খেলো** on a paper banner. Tap it to start. Under it: "পুরান ঢাকার গলি · লেভেল ৩: সোজা গলি" with the one new thing, the three mode chips with the chosen one's line, then সব লেভেল and আজকের ধাঁধা. A friend's challenge sits on top.
- **Level list (a choice screen; nothing runs):** five worlds of six, numbered, each with its name, the one new thing and its stars. The next unplayed level is marked **এটা খেলো**. Locked rows are dim with a lock shape. 1–9 pick.
- **HUD (corners, above the board):** top-left the level badge and the keys you hold; top-centre the finale's name on finales; top-right the clock with the 3-star time under it, or a friend's time. A thin line along the board's top edge shows how close you are to the shop.
- **Danger at the edges:** in the last 1.5 s before the 3-star time passes, the board's edge glows amber; a steady border in slow mode. An edge pointer shows the shop when the board pans.
- **Juice:** the walker squashes into a wall on a bump, the gate swings open, the key flies to its HUD slot, the rickshaw dashes along a dotted arc, the camera eases. Slow mode drops the squash, shake and flight.
- **Finale:** a named maze. Its badge sits top-centre and its end screen names it ("চকবাজারের জট পার").
- **End screen (under the board, the route still drawn):** "লেভেল ৬ পার · চকবাজারের জট", the stars pop in with chimes, the time counts up over 0.8 s. Real stats: ঘর হাঁটলে (and the shortest), মোড়, কানাগলি, plus চাবি and রিকশা where the level has them. Then the exact near-miss line and three numbered choices, ১ পরের লেভেল (marked এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. The keys 1–3, Enter and R count only from a fresh press after the screen appears. Enter always runs choice ১, the same as the marked button.
- **Card:** the maze in the world's colours, your rubbed-out wrong turns in grey and the first stretch of your pencil line fading out ("বাকিটা তুমি খোঁজো"), so it tells your run without giving the way away. Then the time, stars and the line.

## Sound (`shared/game-sound.ts` only, no loops)
1. Footsteps: two soft alternating ticks per cell (the walker's legs move).
2. Bump: a low thud (the walker squashes, a note under the board).
3. Key: a bright টিং (the key flies to the HUD).
4. Gate: a bamboo creak (the gate swings open).
5. Rickshaw bell: ক্রিং ক্রিং (the dotted ride arc).
6. Water: a soft ছলাৎ through a current (the arrow on the lane).
- **Signature:** the sweet shop's টুং-টাং bell on arrival, then star chimes, all scheduled `tone()`s, so a pause cuts them.
- **World motif:** four notes on a level's first move, pitched per world.

## Comfort and controls
- **ধীরে খেলো:** the walker walks 7 cells a second instead of 14, and the par adds exactly the extra walking time, so stars are neither easier nor harder. A change applies from the next run, never mid-run. No squash, shake, flight, confetti or pulsing edge; the end screen shows numbers at once.
- **Touch:** swipe anywhere on the board (a long drag keeps steering), tap a cell down a straight lane, or the four arrows under the board, which act on touch-down. Swiping back mid-lane turns round at once.
- **Keys:** arrows or WASD; Enter or Space starts; 1–3, Enter and R on the end screen; 1–9 in the level list; P opens the player's pause menu; Escape belongs to the player.
- **Mouse:** drag on the board, or click a straight-lane cell.
- **Away:** the player's pause, a blur or a hidden tab stops the clock and the walker, drops the finger and any buffered turn, and the first click back only wakes the game. Sound, pause and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - Links keep `#s=&t=&l=&r=&c=&n=`. New links add `v=2`, `d=e|h` for a mode and `w=1` for slow mode. A link without `v` replays the old plain maze for its level (or the old daily) with the old checks; it is compared and carded, but its stars are not recorded, because the maze is different.
  - `ektukhani-levels-golokdhadha` stars stay, and old progress opens exactly what it opened. `ektukhani-best-golokdhadha-l<N>` and `-d<date>` stay as the normal-mode bests.
  - Clearing a friend's level beyond your own unlock records its stars in `ektukhani-ahead-golokdhadha`, so it doesn't open the levels in between.
  - The share id, `/golokdhadha`, the title, the description and the H1 stay.
