# কোনটা নেই?: rewrite design

## Core
- **Concept:** the old "what's missing?" game, played on a মুদি দোকান's shelf. You look, your eyes close, মামা takes something off the shelf, and you say what's gone.
- **Fantasy:** you are the sharp-eyed kid at the counter who catches মামা out every time.
- **Loop:** দেখো (the shelf, with a fair, visible timer) → চোখ বোজো (মামা turns and takes one) → ধরো (pick the gone thing from the pictures, quickly, then watch it come back to its place).

## Progression: 3 worlds × 10 levels, 3 shelves a level (the 30 level numbers and the saved stars stay)
Each world brings one twist. Inside a world, each level adds exactly one thing, shown on the start card as **নতুন** with a before → after chip. The tenth level of each world is its named finale: মামা takes **two** at once, and a boss bar with the finale's name sits top-centre.

| World | Twist | Levels 1–9 add, in order | Finale (10) |
|---|---|---|---|
| ১ পাড়ার দোকান (teal wall, red awning) | the place stays empty | 4 things, 4 s, 3 pictures → a picture that was never on the shelf → 5 things → 4 pictures → a second less → 6 things → look-alikes (লবণ, চিনি, গুঁড়া দুধ: all white) → 7 things → a second less | **ঈদের আগের রাত** |
| ২ বাজারের দোকান (blue wall, green awning) | the shelf closes up and two things swap places | the twist → 6 things → no name tags, pictures only → a second less → 7 things → 6 pictures → look-alikes → 8 things → a second less | **মাসের প্রথম বাজার** |
| ৩ হাটের দোকান (maroon wall, yellow awning) | a new thing takes the gone one's place (a lure) | the twist → 7 things → 6 pictures → look-alikes → 8 things → no name tags → 9 things on three planks → 10 things → a second less | **হাটবার** |

- Levels are data in `lib/levels.ts`. Shelves are seeded (`makeRng`), so a link replays the same three shelves.
- **Bot targets (tests/bot.ts, 400 seeds a level, asserted in tests/rewrite.test.ts):** a casual bot answers level 1's first shelf right within 10 s of the shutter tap on ≥ 95% of seeds and clears level 1 ≥ 99%; it clears every world-1 level ≥ 80% and every level ≥ 50%; a steady bot clears every level ≥ 85% (finales ≥ 70%); a strong bot gets ★★★ on every non-finale level ≥ 55% and on finales 40–85%; each finale is its world's hardest level for the steady bot.

## Difficulty and story
- **The ladder is the difficulty.** The start card says what changes in plain words ("নতুন: একটা ছবি তাকে ছিলই না"). No separate modes.
- **Story:** none. The shop is the world: the start card is the shop with its tin shutter down, and মামা turns his back when he takes something.

## Screens
- **Title (start card):** the shop front itself. The biggest thing is the tin shutter, painted **ঝাঁপ তোলো**; tapping it rolls it up and the look starts. Under it: ‹ লেভেল ৩ · পাড়ার দোকান ›, the **নতুন** line with its before → after chip ("জিনিস ৪ → ৫"), the facts (৫টা জিনিস · দেখার সময় ৫ সেকেন্ড · ৩টা তাক), the stars you have, and সব লেভেল. A friend's link shows their card and claim on top.
- **Look (fair):** the timer only starts once the shutter is fully up. The shelf shows every thing with its name tag. A countdown tag sits top-right and a thin bar drains along the top edge. **মনে আছে** (or Enter) ends the look early. The last 3 s tick, and the stage edge glows amber.
- **Eyes close:** two eyelids close, মামা turns his back, the shelf changes behind the lids, and they open on the question. The answer clock starts only when the lids are open.
- **Question:** "কোনটা নেই?" with a one-line twist hint. The pictures are numbered ১–৬. A thin bar along the shelf's top shows the speed bonus draining (+৫০ → +০).
- **Reveal (drama):** your pick turns green or red at once with its sound. Then মামা turns round. The gone thing drops back into its place with a bounce, the moved things slide back to where they stood, a newcomer lifts away, and "+১৪২" floats up. A right answer moves on by itself after a beat (tap to skip). A wrong one waits for পরের তাক so you can see what you missed.
- **Choice moments, all of which pause:** সব লেভেল (from the HUD badge or the start card) shows the three worlds, numbered levels with stars, locks, finales marked, and **এটা খেলো** on the recommended level. The end screen has three numbered choices with the first marked **এটাই ভালো**.
- **HUD (corners only):** top-left the level badge (opens সব লেভেল); top-centre the three shelf pips (✓ ✗), or on a finale the boss bar with its name; top-right the score and a "টানা ৩" pop. The middle of the shelf stays clear.
- **Danger at the edge:** the last 3 s of a look glow amber at the stage edge (a still border in ধীরে খেলো). There is no popup.
- **Finale:** a red **শেষ তাক** badge on the start card, two things gone on every shelf, the boss bar, confetti on the first clear, and a stamp on the card.
- **End screen (মামার ক্যাশ মেমো):** a paper cash memo. One line per shelf: the picture of what went, ✓/✗, seconds, points. The total counts up, and StarReveal stamps the stars. Then the real stats (গড় সময়, সবচেয়ে চটপট, সেরা টানা), the exact near-miss line ("আর ১৫ পয়েন্ট পেলে ৩ তারা"), the best on this phone, and ১ পরের লেভেল · ২ আবার খেলো · ৩ সব লেভেল (1–3 or Enter, fresh presses only). Below, কার্ড বানাও ↓ scrolls inside the stage to the card.
- **Card:** the level's first shelf with a "?" in the gap, the score, the stars and a line naming what slipped past; finales get a stamp.

## Sound (only `shared/game-sound.ts`)
1. **Shutter (signature opener):** the tin shutter rattling up. You see it roll up.
2. **The look hum:** a soft loop that climbs as the time runs out, with ticks in the last 3 s. You see the bar and the countdown tag.
3. **Blink:** a breath of air as the eyes close. You see the lids.
4. **The cash box ding (signature):** টুং-টাং, a step higher for every right answer in a row. You see the green ring and "+১৪২".
5. **উঁহু:** a soft low wrong. You see the red shake and the ring on what you missed.
6. **Back in place:** a wooden টুক as the gone thing lands. You see it drop in.

A three-note world ident (pitched per world) plays on a level clear. No music during the look: it is the moment to concentrate. Every loop stops on pause, hide, the end and unmount, and comes back when sound turns on mid-look.

## Comfort and controls
- **ধীরে খেলো:** no shake, bounce, float, confetti, count-up or pulsing edge; lids and reveal are instant fades; a right answer waits a little longer before moving on. The look time and the speed bonus are unchanged, so stars are earned the same way.
- **Touch and mouse:** tap the shutter to start, tap a picture to answer, tap মনে আছে or পরের তাক. A click that brings focus back only resumes.
- **Keyboard:** Enter or Space starts, ends the look (মনে আছে), and moves on; 1–6 (or ১–৬) answer; P opens the player's pause menu; on the end screen 1–3 and Enter, fresh presses only. Clicked buttons drop focus so Enter never presses them again.
- **Pause:** the player's menu (blur, hide, Esc, ⏸, P). Paused, the shutter comes down over the shelf and the pictures, so a pause never buys looking or thinking time on screen; the clock and the look time freeze; resuming gives a 0.6 s breath while the shutter rolls up.
- **Kept for compatibility:**
  - links `#s=&t=&l=&n=` still parse. A link without `v` replays the old level table and generator exactly (`lib/legacy.ts`); new links add `v=2`;
  - saved stars stay in `ektukhani-levels-konta-nei` and best scores in `ektukhani-best-konta-nei-<level>`; your own open level moves to `ektukhani-konta-nei-open`, migrated once from the old unlock rule, so a friend's far-ahead link no longer opens the levels in between;
  - no tally; the URL `/konta-nei`, the title, the description and the H1 are unchanged; the FAQ is updated to the new levels.
