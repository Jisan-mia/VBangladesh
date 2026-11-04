# গলির ব্যাডমিন্টন: rewrite design

## Core
- **Concept:** winter-evening badminton in the পাড়া, under one bare bulb, with a net tied between two windows. Three পাড়া, twelve neighbours, one shuttle with real air drag.
- **Fantasy:** the kid who wants to be পাড়ার চ্যাম্পিয়ন. Every window has someone watching; a lost point gets an "আহা" from the first floor.
- **Loop:** read → swing → place. Read the shuttle (and the rival's pose, the wind, the shadow), touch as the ring turns gold, and choose where it goes: a tap sends it high and deep, a pull down smashes, a pull towards the net drops it short.

## The shuttle and the swing
- **Real drag, deterministic.** `lib/physics.ts` integrates gravity plus quadratic drag against the moving air (terminal speed 340 u/s, so it leaves the racket fast, slows hard and falls almost straight down). A flight is integrated once, when it is struck, into a preallocated path (one point per 1/60 s step). The step only walks along it. The same seed and swings give the same match.
- **Wind is air, not a cheat.** The drag acts on the shuttle's speed relative to the air, so the wind carries a shuttle most while it is slow and high. The walls shelter the গলি: the push is full above the rooftops and small near the ground. High shots feel it most; touch shots and smashes very little.
- **The swing is judged at the touch.** Your finger touching the glass is the swing. Within 200 ms the gesture says which shot: lift (a tap), a pull down ≥ 14 px (smash), or a pull towards the net (drop). The shuttle hangs on the racket while you decide (a short hit-stop, never more than 12 steps), so a tap is never "late" for being a tap. Keys: Space/Enter/↑ lift, ↓ or S smash, → or D drop.
- **Geometry teaches the shots.** A smash comes down from overhead: off a low ball it can't clear the tape and goes into the net. A smash from the back has slowed by the time it gets there, so it's easy to return. A rival's block of your smash leaves you off balance (a tighter window, a short lift).
- **Timing grades:** gold (inside 40% of the window either side) plays the shot as meant; a little early plays it higher and shorter; a little late flatter. Outside the window it's a miss.

## Progression: 3 পাড়া × 4 neighbours (12 levels)
Each level adds exactly one new thing; each পাড়া ends with a named finale that has a দম bar at the top and a named move.

| # | Neighbour | Points | The one new thing |
|---|---|---|---|
| **আমাদের গলি** · navy night, one warm bulb, brick walls ||||
| 1 | পাশের বাসার ভাইয়া | 3 | Tap when the ring turns gold. He gets back everything for your first two hits, so a point is always a rally (no one-hit smash wins). |
| 2 | তিনতলার আপু | 5 | **Smash:** pull down on a high ball. She lifts high and can't hold a smash. |
| 3 | মোড়ের দোকানের মামা | 5 | **Drop:** he waits at the back and runs in slowly; a pull towards the net beats him. |
| 4 | **Finale: গলির ক্যাপ্টেন রনি ভাই** | 7 | **রনি ভাইয়ের ঝাঁপ:** his দম bar fills with every hit; when full he jump-smashes the next high ball. A gold-timed lift holds it. He also smashes any short ball you give him. |
| **ছাদের কোর্ট** · rooftops at dusk, water tanks, a washing line, kites ||||
| 5 | পাশের ছাদের টুটুল | 5 | **Wind:** a steady push that turns every 2 points. With it behind you a high shot goes out; against you it falls short. Flags, cloth and blowing dust show it. |
| 6 | চিলেকোঠার রুমা আপা | 5 | **Gusts:** a gust swells and fades; chevrons at the edge it blows towards come a moment before. |
| 7 | ঘুড়ি-পাগল সাজু | 5 | **Drives:** flat, fast shots that arrive low. Don't smash a low ball; lift it or drop it. |
| 8 | **Finale: ছাদের রাজা মিঠু ভাই** | 7 | **মিঠু ভাইয়ের ঘূর্ণি:** when his bar fills, a towering lob rides a gust and lands just inside or just past your back line. If its shadow goes past the chalk, leave it. |
| **বাজারের গলি** · winter fog, a sodium lamp, a tea stall ||||
| 9 | চায়ের দোকানের বল্টু | 5 | **Fog:** the shuttle hides up high and the ring shows only in the last 0.45 s. Watch its shadow on the ground. |
| 10 | কলেজের বড় ভাই | 5 | **Feints:** his pose says "high" and the shot is a drop. Trust the shuttle and the ring, not the arm. |
| 11 | ভোরের দৌড়বিদ রিয়াজ | 5 | **The runner:** he reaches almost everything. Send him back, then drop. |
| 12 | **Finale: পাড়ার চ্যাম্পিয়ন শাহীন আপা** | 7 | **শাহীন আপার তিন মার:** when her bar fills, three in a row: a deep clear, a feinted drop, a smash. Hold all three. |

- **Stars by points given away:** 3-point level: 0 → ★★★, 1 → ★★, 2 → ★. 5-point: 0–1 / 2–3 / 4. 7-point: 0–2 / 3–4 / 5–6.
- **Bots (`tests/levels.test.ts`, 40 seeds a level):** a casual player (±80 ms, 30 ms late, skips 3%, reads the wind 30% of the time), a steady one (±60 ms) and a sharp one (±45 ms), plus a masher and a smash-only player.
  - casual wins level 1 ≥ 95%, its first point by a median ≤ 10 s; every world-1 level ≥ 40%;
  - steady wins every level ≥ 60%, and the last level 50–95%;
  - sharp wins every level ≥ 90%;
  - a masher never wins; a smash-only player never wins a level-1 point with fewer than 3 hits.

## Difficulty and story
- **Modes (title chips, remembered):**
  - সহজ: "মারার সময় বেশি, ওরা ভুল করে বেশি। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। ৩ তারা পেতে প্রায় কোনো পয়েন্ট দেওয়া যাবে না।"
  - কঠিন: "মারার সময় কম, ওরা ফেরায় বেশি। তারার হিসাব একই।"
- **Story (first run only, never on a friend's link; tap for the next panel, hold the corner 0.6 s to skip):**
  1. "শীতের সন্ধ্যা। গলির বাল্বটা জ্বলল।"
  2. "দুই জানালায় দড়ি বেঁধে জাল। ভাইয়া র‍্যাকেট হাতে ডাকছে।"
  3. "শাটল এলে রিং ছোট হয়। সোনালি হলেই চাপো।"

## Screens
- **Title:** the court sits dimmed behind. The biggest thing is a code-drawn shuttlecock under the bulb, with **খেলো** across its cork; tap it to start. Under it: the পাড়া and level ("আমাদের গলি · লেভেল ৩: মোড়ের দোকানের মামা"), the one new thing, the rival's style line, the three mode chips with the chosen one's line, and "সব লেভেল ★ ৭/৩৬". A friend's challenge sits on top.
- **Level list (a choice screen; play pauses behind it):** three পাড়া of four, numbered ১–১২ (keys 1–9, 0, -, =). Each row: the neighbour, the one new thing, stars. The next to play is marked **এটা খেলো**; finales carry **শেষ খেলা**; locked rows are dim with a lock shape.
- **HUD (a row above the court, never on it):** top-left the level badge and mode; top-right the score box (তুমি ৩ · ২ মামা, with a dot per point); top-centre the rally count, or in a finale the neighbour's name and দম bar ("ঝাঁপ আসছে" when full).
- **The call line under the court** carries every word during play ("জোরালো স্ম্যাশ! মামা ধরতে পারল না।"). Nothing is written over the court; the only in-court marks are the ring at your racket, the shadow on the ground and the neighbour's small "আহা" at the window.
- **The shot strip under the call:** three drawn hints (tap: উঁচু, pull down: স্ম্যাশ, pull to the net: ড্রপ). A shot appears on the level that teaches it with a **নতুন** badge; while your finger is down, the strip lights the shot the pull has chosen.
- **Danger at the edges:** match point against you, the court's edge glows red; a full দম bar, the top edge pulses red; a gust coming, chevrons at the side it blows towards; the wind turning, the flags swing over and the HUD says "বাতাস ঘুরল". ধীরে খেলো makes them steady borders.
- **Feel:** a touch answers in the same frame (the racket whips, the shuttle stops on the strings). A gold hit flashes a ring burst and pings higher; a smash streaks, hits a 2-frame stop and shakes the court a little; a drop ticks. A point lost: a gentle shake of the score box and the neighbour at the window.
- **End screen (the court stays above):** "লেভেল ৩ পার · মোড়ের দোকানের মামা", the stars pop with chimes, the score counts up, then real stats: সোনালি মার n/N, সবচেয়ে লম্বা র‍্যালি, স্ম্যাশে পয়েন্ট, ড্রপে পয়েন্ট, ছেড়ে দেওয়া বাইরের শাটল, জালে/বাইরে, and in finales "ঝাঁপ ঠেকিয়েছ ২/৩". Then the near-miss line and numbered choices: ১ পরের লেভেল (**এটাই ভালো**), ২ আবার খেলো, ৩ সব লেভেল. A loss: "মামা জিতল ৫–৩", one exact tip from how you lost most points, ১ আবার খেলো, ২ সব লেভেল. Keys work only from a fresh press after the screen appears.
- **Card:** the cream card with the winning moment drawn in code, the পাড়া's palette, the neighbour's name and the score; the kicker names the পাড়া and level.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the racket's ping** (strings on the cork), higher on a gold hit; a smash is a crack with the ping on top; a drop a soft টুক. Seen as the racket whip and the gold burst.
2. **The rival's far ping**, softer and lower. Seen as their racket.
3. **The swish** of feathers, pitched by speed. Seen as the trail.
4. **The net's flap.** Seen as the net bulging.
5. **The window:** a quick clap on your point, the neighbour's "আহা" on theirs. Seen as the figure at the window and the call line.
6. **Wind loop** on the rooftops, louder with the push, and a whoosh before a gust. Seen as the dust, the cloth and the flags.

A four-note পাড়া tune opens each match (a different one per পাড়া); finales add a low two-note warning when the bar fills. Every note is a scheduled `tone`, so a pause cuts it. The wind loop stops on pause, the end, a hidden tab, blur and unmount, and starts fresh when sound comes back.

## Comfort and controls
- **ধীরে খেলো:** the whole match runs at 0.8×, and the timing window in game seconds shrinks by the same 0.8, so the window in real milliseconds stays the same: you get more time to see the shot, not an easier swing. No shake, no flashes, no blowing dust or moths, steady edge borders, the end screen's numbers show at once. Stars are earned the same way.
- **Touch:** touch anywhere on the court or the shot strip; tap, or pull down / towards the net. **Mouse:** the same. **Keys:** Space, Enter or ↑ lift; ↓ or S smash; → or D drop; P opens the player's pause menu; on the end screen 1–3, Enter and R. The click that brings focus back is never a swing.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - links keep `#s=&t=&r=&l=&n=`. New links add `v=2` and `d=e|h`. A link without `v` is from the old 15-level ladder: its level maps to the same place on the new one (`ceil(l × 12 / 15)`), and its score stays the friend's own claim;
  - `ektukhani-levels-golir-badminton` is migrated once to the new numbers by the same map; `ektukhani-unlock-golir-badminton` keeps this game's own unlock, so a friend's far-ahead level records its stars without opening the levels in between;
  - `ektukhani-best-golir-badminton` stays the longest rally on this phone;
  - the URL, the share id (no tally), the title, the H1 and the preview format.
