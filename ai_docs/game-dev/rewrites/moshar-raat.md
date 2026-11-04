# মশার রাত: rewrite design

## Core
- **Concept:** লোডশেডিংয়ের রাত. The fan has stopped, the room is dark, your little brother sleeps, and you guard his pillow with an electric bat until dawn.
- **Fantasy:** every Bangladeshi summer night with a চার্জার ব্যাট in hand, listening for the পিন-পিন and waiting for the crackle.
- **Loop:** *শোনো* the whine → *দেখো* the flight → *চাপো* (চট!). Each mosquito kind flies a pattern you learn to read, and the whine's pitch says how close the nearest one is to the pillow.

## Progression: 4 nights × 5 রাত (`lib/levels.ts`, 20 level numbers as before)
Each রাত teaches one thing, named on its start card ("নতুন: …"). Each world adds one new kind of mosquito and ends with a **named boss mosquito**: a bar at the top centre with its hit pips, and the dawn waits until it falls.

| # | রাত | The one new thing |
|---|---|---|
| **World 1: লোডশেডিংয়ের রাত** (navy room, a হারিকেন's amber glow) ||
| 1 | প্রথম মশা | 4 slow mosquitoes from the window. Tap one. Dawn at 10 s. |
| 2 | দরজা খোলা | They come through the door too. |
| 3 | ঘুলঘুলি | And through the vent, two in the air at once. |
| 4 | মুখে চড় না | A bat that lands on the sleeping face, hitting nothing, is a slap: it counts as a bite. |
| 5 | **পালোয়ান মশা** (boss) | A fat mosquito that takes 3 hits. After each hit it backs off to the ceiling and comes again. |
| **World 2: বৃষ্টির রাত** (teal, rain on the tin roof) ||
| 6 | চটপটে মশা | **New kind:** stops, then darts. Hit it while it stops; a red flash means it will dive. |
| 7 | মশারি | The মশারি is up: mosquitoes head for its one hole. |
| 8 | দুই ফুটো | Two holes, far apart. |
| 9 | ঝমঝম বৃষ্টি | More চটপটে, shorter waits before the dive. |
| 10 | **বিজলি মশা** (boss) | A চটপটে boss, 3 hits: it darts three times, then dives. |
| **World 3: গুমোট রাত** (plum, a full moon, no breeze) ||
| 11 | ঝাপসা মশা | **New kind:** fades into the dark, blinks now and then, shows itself when it dives. Listen. |
| 12 | ঝাপসা আর চটপটে | Both kinds together. |
| 13 | ফুটোয় ঝাপসা | The মশারি again, with ঝাপসা মশা. |
| 14 | লম্বা রাত | A longer night: 34 s. |
| 15 | **ভূতুড়ে মশা** (boss) | A ঝাপসা boss, 3 hits: visible only in blinks and dives. |
| **World 4: কুয়াশার রাত** (slate green, the first cold) ||
| 16 | ঝাঁক | **New kind:** a tight swarm sweeping across. One tap in its middle gets several. |
| 17 | মশারিতে ঝাঁক | Swarms at the মশারি. |
| 18 | সব রকম | Every kind in one night. |
| 19 | ভোরের আগে | Faster dives, bigger swarms. |
| 20 | **মশার রাজা** (boss) | The king, 4 hits, with swarms around him. |

- **Stars (as before):** ★ dawn before the bites run out, ★ three in four mosquitoes zapped, ★ not one bite. A boss counts as one mosquito.
- **Bots (`tests/levels.test.ts`, 40 seeds a রাত, all on the real `stepGame` and `swing`):**
  - a **casual** bot (0.45 s reaction, ±20 thumb error, a tap at most every 0.6 s, watches the most urgent mosquito only 60% of the time, can't see a faded ঝাপসা মশা) wins রাত 1 every time in about 7 s, and clears every রাত at ≥ 80% (measured 85–100%). Its ★★★ falls from 100% in World 1 to 45–75% in World 4;
  - on **কঠিন** (one bite) each finale is below its world's first রাত (95/100, 57/90, 38/70, 45/100%);
  - on **সহজ** the casual bot clears every রাত at ≥ 90% (measured 93–100%); a **sharp** bot (0.25 s, ±7) clears every রাত at ≥ 95% (100%);
  - an **idle** player loses every রাত, and a **pillow camper** tapping the face loses every রাত from 4 on.
- **Unlocks:** your own unlock (`ektukhani-unlock-moshar-raat`) rises only when you clear the furthest open রাত. A friend's far-ahead রাত records its stars but opens nothing in between.

## Difficulty and story
- **Bites you can take (title chips, remembered):** the night itself never changes, so a friend's link is the same night on every mode.
  - **সহজ:** "৫টা কামড়ে ঘুম ভাঙে। শিখতে শিখতে খেলো।"
  - **স্বাভাবিক (default):** "৩টা কামড়ে ঘুম ভাঙে।"
  - **কঠিন:** "একটা কামড়েই ঘুম ভাঙে।"
  Stars are the same rules on every mode, so সহজ makes dawn easier, not ★★★.
- **Story (first run only, a tap for the next, hold 0.6 s to skip):**
  1. "লোডশেডিং। ফ্যান থেমে গেছে, ঘর অন্ধকার।"
  2. "ছোট ভাইটা ঘুমিয়ে পড়েছে। কানের কাছে পিন-পিন।"
  3. "ব্যাট হাতে পাহারা দাও। মশার ওপর চাপো, ভোর পর্যন্ত।"
  Never on a friend's link or আবার খেলো (`ektukhani-intro-moshar-raat`).

## Screens
- **Title:** the dark room behind, dimmed. The biggest thing is the code-drawn electric bat, its mesh crackling, labelled **রাত শুরু** (the friend's challenge above it). Under it, small: ‹ রাত N · name ›, the "নতুন" line, the three mode chips and the chosen one's line, the star targets, **সব রাত**, and the control hint.
- **Choice moment, সব রাত:** a sheet over the stage that pauses a night in progress: four worlds of five, numbered (1–9, 0 for the first ten; arrows and Enter for the rest), each with its one new thing and its stars, locked rows with a lock shape, **এটা খেলো** on the recommended one. The HUD badge opens it.
- **HUD, in the corners (canvas, Bangla digits):** top-left the রাত badge (opens সব রাত); top-centre the seconds to dawn in a small pill, or on a finale the boss's name and hit pips; top-right মশা n/N and the bite drops (●●○); the streak "টানা ৪" under them; the dawn line along the very top edge. The middle stays clear; pops are small and quick.
- **Danger at the edge:**
  - one bite left: the screen edge glows orange, pulsing (a steady border in ধীরে খেলো);
  - a bite or a slap: one short red pulse;
  - a mosquito diving close to the pillow: the bottom edge warms and a ring pulses around the pillow, stronger as it nears (the whine's visible twin);
  - an arrival: a small chevron at the window, door or vent 0.6 s before a mosquito comes in.
- **Finales:** the boss gets a name and pips at the top centre, its own low hum and a darker body. Each hit knocks it back with a thud and a pip goes out; the dawn line stops at full until it falls.
- **End:** over the dimmed room, the heading ("ভোর হলো" / "পালোয়ান কাত, ভোরও হলো" / "৩টা কামড়, ঘুম ভেঙে গেল"), stars one by one, then the stats counting up: মশা n/N, কামড়, টানা সেরা, এক চাপে সেরা. Then the exact near-miss line ("আর ২টা মশা মারলে আরেকটা তারা") and three numbered choices: ১ পরের রাত (এটাই ভালো), ২ আবার খেলো, ৩ সব রাত (on a loss ১ আবার খেলো). Keys 1–3 and Enter, a fresh press only, 0.7 s after it appears. **কার্ড দেখো ↓** scrolls the stage.
- **Card:** the bat crackling over two falling mosquitoes in this world's room, the count, the রাত and its name, the stars.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the পিন-পিন loop.** It follows the mosquito nearest its target: louder and higher as it closes in (430 → 760 Hz). Visible twin: the pillow ring and the warm bottom edge.
2. **Zap:** a crackle with a tick per mosquito, a chord for a multi-hit, the streak climbing the scale. Visible: sparks and "চট!".
3. **Miss:** a soft swish; "একটুর জন্য" for a near miss.
4. **Bite / slap:** the sleeper's "উঁহু" (never a scream), a dull "ঠাস" for a slap. Visible: the red edge and the drop going out.
5. **Boss:** its own low hum while it flies, a thud for each hit. Visible: the pips.
6. **Dawn:** a rooster's call and two bird chirps. Visible: the window brightens.
- **World call:** the light switch, then the world's three notes at the start (scheduled `tone()`, so a pause cuts them).

## Comfort and controls
- **ধীরে খেলো:** the whole night runs at 0.7×. No sparks, no shake, no pulsing: the edges are steady borders. Stars and targets stay the same; the design accepts that slow mode buys reaction time.
- **Touch and mouse:** tap a mosquito. The swing happens in the pointerdown itself (drawn on the next frame), and checks the bat head (radius 34) against where each mosquito is now *and* where it was a step ago, so a fast one is never missed by a frame. A tap that only just misses says "একটুর জন্য".
- **Keys:** arrows or WASD move the aim ring (held, smooth, 300 units/s); Space or Enter swings. Enter or Space starts from the title and takes the end screen's first choice (fresh press only). P opens the player's menu (`requestPause`). 1–3 on the end screen, 1–9 and 0 in সব রাত. Escape is the player's. Held keys are released on blur and ignored while paused.
- **Away:** blur, a hidden tab, scrolling away or any choice screen stops the night, the whine and the input. Coming back never resumes by itself; after a resume the night waits half a second. The first tap after coming back only resumes. Celebration timers carry their run number and are cleared on every new night, choice and unmount.
- **Kept for compatibility:**
  - links `#s=&t=&l=&b=&n=` (old ones, no `v`) still parse with the old rules and open the same seed on the same রাত number; the friend's count shows as their claim from the old version (no compare). New links add `v=2` and `d=0|1|2` for the mode, and are checked against that রাত's count and mode;
  - `ektukhani-levels-moshar-raat` stars stay by রাত number (the stars mean the same three things); the new own unlock migrates once from them;
  - `ektukhani-best-moshar-raat-<n>` per-night bests, the share id, `&og=1` previews, `/moshar-raat`, its title, description and H1.
