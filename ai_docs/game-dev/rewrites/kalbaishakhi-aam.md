# কালবৈশাখী আম: rewrite design

## Core
- **Concept:** a বোশেখের বিকেল. The কালবৈশাখী hits the old mango tree in নানির উঠান, and you run out with a bamboo ডালা to catch what falls.
- **Fantasy:** every Bangladeshi child who ever ran out under the first gust (and was called back inside). The game is the safe version of that run.
- **Loop:** *সরাও* the ডালা → *ধরো* the mango → *এড়াও* the twig. Every storm is seeded, so a friend gets the same mangoes in the same places.

## Progression: 3 worlds × 4 storms (`lib/levels.ts`)
Each storm teaches exactly one new thing, named on its start card ("নতুন: …"). Each world ends with a **named storm** that has its own move and a named bar at the top.

| # | Storm | Time | The one new thing |
|---|---|---|---|
| **World 1: বিকেলের উঠান** (amber sky, slate clouds) ||||
| 1 | প্রথম ঝাপটা | ১০ সে | Slide the ডালা. Mangoes only, falling slowly near the middle. You can win in 10 s. |
| 2 | দমকা হাওয়া | ২০ সে | Gusts push mangoes sideways. Before each gust, the tree leans and an arrow shows at the edge. |
| 3 | শুকনো ডাল | ২৫ সে | Dry twigs fall. A twig in the ডালা costs one জান. |
| 4 | **কালবৈশাখী** (finale) | ৩৫ সে | **ঝাঁকুনি:** three times, the whole tree shakes and drops a shower of five mangoes across one band. |
| **World 2: মেঘলা সন্ধ্যা** (dusk: rose and violet sky) ||||
| 5 | সোনালি আম | ৩০ সে | A rare golden mango (+২৫) that falls fast. |
| 6 | শিল | ৩০ সে | Hail falls in short volleys. A shadow on the ground marks each pellet. Hail in the ডালা knocks the top mango out. |
| 7 | পাল্টা হাওয়া | ৩৫ সে | Gusts swing back halfway through. |
| 8 | **শিলাবৃষ্টি** (finale) | ৪৫ সে | **Hail sweeps** cross the yard from one side to the other, with twigs between them. |
| **World 3: রাতের ঝড়** (indigo night; lightning lights the yard) ||||
| 9 | আঁধার | ৩৫ সে | The dark canopy hides the shake before a drop. You see a mango only once it falls. |
| 10 | ভাঙা ডাল | ৪০ সে | A big broken branch, twice as wide, cracks first and throws a long shadow. |
| 11 | টানা হাওয়া | ৪০ সে | A steady wind blows from one side all storm, with gusts on top. |
| 12 | **বোশেখের শেষ ঝড়** (finale) | ৫০ সে | Shakes, hail sweeps and big branches together. |

- **Stars:** survive the storm with ৪০% of its mangoes for ★, ৬০% for ★★, ৮০% for ★★★. The thin line along the top edge fills as you catch, with a notch at each star.
- **Fairness, proven in tests:** in every storm a thumb at 230 u/s can reach every mango on a path no hazard ever touches, so ★★★ is always possible.
- **Bot targets (`tests/levels.test.ts`, 40 seeds a storm):**
  - a **casual** bot (0.45 s reaction, ±34 aim, misreads 70% of the wind's push, a 210 u/s thumb, ignores 18% of hazards and never looks at 16% of mangoes) clears every storm at ≥ 90% (measured 95–100%). Its ★★★ falls from ≥ 60% on storm 1 (80%) to ≤ 40% on the last (23%);
  - the same bot on **কঠিন** (1 জান) clears storm 1 every time, and each finale at 40–85% (68%, 65%, 43%), always below its world's first storm;
  - a **sharp** bot (0.25 s, ±8, 380 u/s) on কঠিন clears every storm at ≥ 70% (73–100%).
- **Unlocks:** your own unlock (`ektukhani-unlock-kalbaishakhi-aam`) rises only when you clear the furthest open storm. A friend's far-ahead storm records its stars but opens nothing in between.

## Difficulty and story
- **জান (title chips, remembered):** the storm itself never changes, so a friend's link stays the same storm.
  - **সহজ:** "৫টা জান। ডাল লাগলেও ঝড় পার হওয়া যায়।"
  - **স্বাভাবিক (default):** "৩টা জান। তিনটা ডালে ঝড় শেষ।"
  - **কঠিন:** "১টা জান। একটা ডালেই শেষ।"
  Stars count mangoes only, so সহজ makes surviving easier, not ★★★.
- **Story (first run only, tap for the next, hold 0.6 s to skip):** three lines over the live yard:
  1. "বোশেখের বিকেল। আকাশ হঠাৎ কালো।"
  2. "নানির উঠানে বুড়ো আমগাছটা দুলছে।"
  3. "ডালা নিয়ে দৌড়াও! আম ধরো, শুকনো ডাল না।"
  It is never shown on a friend's link or on আবার খেলো (`ektukhani-intro-kalbaishakhi-aam`).

## Screens
- **Title:** the storm gathers behind, dimmed. The biggest thing is a code-drawn ডালা heaped with mangoes, labelled **ঝড় শুরু** (or the friend's challenge line above it). Under it, small: ‹ storm N · name ›, the "নতুন: …" line, the three জান chips with the chosen one's consequence, the star targets, and **সব ঝড়**.
- **Choice moment, সব ঝড়:** a sheet over the stage that pauses a storm in progress. It shows three worlds of four, numbered ১–১২ (keys 1–9 and 0, -, =). Each row has its name, its one new thing in a line, and its stars. Locked rows show a lock shape. The recommended storm wears **এটা খেলো**. The HUD's storm badge opens it.
- **HUD, in the corners:**
  - top-left: the storm badge;
  - top-centre: the seconds left, or a finale's named bar ("কালবৈশাখী", draining as the storm passes);
  - top-right: the points and the জান hearts, with a small "টানা ৬" under them;
  - top edge: the catch line with its star notches.
  The middle stays clear. The "+১০" pops sit just above the ডালা, small and quick.
- **Danger at the edge:**
  - one জান left: the screen edge glows orange, pulsing, or a steady border in ধীরে খেলো;
  - a hit: one short red edge pulse;
  - a gust: chevrons at the edge it blows towards;
  - a hazard coming: its shadow on the ground under where it will land.
- **Finales:** the named bar sits top-centre. Each shake or sweep is announced at the edge one second ahead (the tree creaks, or the hail sounds from that side), never with a banner.
- **End:** over the dimmed yard, the heading ("ঝড় থামল" / "তিনটা ডাল পড়ল ডালায়" / "আম কম পড়ল"), the stars one by one, then the stats counting up: আম N/M, পয়েন্ট, টানা সেরা, পাকা আর সোনালি, জান বাকি. Then the exact near-miss line ("আর ৩টা আম হলেই ★★") and পরের ঝড় / আবার খেলো (keys need a fresh press 0.7 s after it appears). **ছবি বানাও ↓** scrolls the stage to the card.
- **Card:** the existing ডালা-heap card, with the storm's name and stars. The badge names the new storms ("ঝড় ৬ · শিল").

## Sound (`shared/game-sound.ts` only)
1. **Signature:** the কালবৈশাখী's first roll, low thunder under a rising wind, with the world's three-note call after it (`tone` with a delay, so a pause cuts it).
2. Catch: a wooden ঠক for green, a soft squelch for ripe, a bright chime for golden. Streaks climb the scale.
3. Twig crack, and the big branch's creak and thud.
4. Hail: an icy clink on the ডালা, a high tick for a pellet in the dirt.
5. The tree's shake: a leafy rush.
6. **Wind loop:** steered by the wind. It stops on pause, the end, a hidden tab and unmount, and comes back when sound turns on mid-storm.

Every sound has a visible twin: the pop, the pile, the hearts, the edge pulse, the shadow, the edge chevrons.

## Comfort and controls
- **ধীরে খেলো:** the whole storm and the ডালা run at 0.8× together, so only reaction time gets easier (the design accepts that). There's no rain, no drifting leaves, no lightning, no shake and no pulse; the danger edge is a steady border. Stars and targets stay the same.
- **Touch:** drag anywhere (the ডালা follows the finger's movement, so the thumb never hides it), or tap or hold the left or right half.
- **Keys:** ← → or A D. Space or Enter starts and takes the end screen's main choice (fresh press only). P opens the player's menu (`requestPause`). 1–9, 0, -, = work in সব ঝড়. Escape is the player's. Game keys are ignored while paused and released on blur.
- **Mouse:** the same as touch.
- **Away:** blur, a hidden tab, scrolling away, or any choice screen stops the storm, the wind and the input. After resuming, the storm waits half a second. The first tap after coming back only resumes. Celebration timers are cleared on every new run, choice and unmount.
- **Kept for compatibility:**
  - old links `s t a n` (the original storm) and `l=1..8` still parse and replay the exact old storm, by the old generator, kept bit for bit as `lib/legacy.ts` (a fingerprint test pins it). New links add `w=1..12` for the new storms;
  - the old 8-storm stars in `ektukhani-levels-kalbaishakhi-aam`, and the even older best score, migrate once into the new ladder (`ektukhani-levels-kalbaishakhi-aam-ladder`). Nobody loses a storm they could already play;
  - `ektukhani-best-kalbaishakhi-aam`, the all-time mango tally `ektukhani-kalbaishakhi-aam-total` and its milestones, and the share id;
  - `/kalbaishakhi-aam`, its title, description and H1.
