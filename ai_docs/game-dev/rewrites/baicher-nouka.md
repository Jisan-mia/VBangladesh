# বাইচের নৌকা: rewrite design

## Core
- **Concept:** a নৌকাবাইচ seen from above. Your long racing boat rows up a five-lane river against three rivals. The ঢোল sets the stroke, so the speed comes from the beat, not from tapping fast.
- **Fantasy:** you are the মাঝি at the starting rope, the banks packed with people, the drummer in front of you. Twelve races in three rivers, each ending with a named champion.
- **Loop:** শোনো, টানো, সরো. Hear and see the ring close on the ঢোল, tap on it so the oars bite, and slide a lane left or right to miss the কচুরিপানা.

## The rowing (deterministic, `lib/rowing.ts`, `lib/step.hot.ts`)
- **Stroke:** the catch window is ±0.25 s, a perfect (দারুণ) one ±0.09 s. A caught beat adds a burst that fades over 1.2 s; the burst is sized by the beat's gap, so every tempo adds the same average speed (about 60 units a second over cruise). A run of beats (ছন্দ) adds a little more, up to six. A tap far off the beat makes the oars fumble (a short slowdown and the run breaks); a second tap on a caught beat does nothing, so mashing never pays.
- **Feel:** a tap counts at its own timestamp, not at the frame's. The drum strokes are handed to the audio clock 90 ms ahead, so the sound lands on the ring. A catch bites the oars wider, flashes the pad's drum and puffs a word (তালে, দারুণ, বড় টান, আগে, পরে).
- **Water:** a boat that hits a patch drops to 35% of its speed and recovers over 1.2 s, and loses its burst and run. Boats have weight (they reach their speed at 4 a second) and a boat behind another waits there, so passing takes a lane change.
- **Rivals have one readable style each,** by colour in every race: red bolts then tires, green holds one pace, yellow closes at the end. Which one is quickest changes with the seed. The finale's black boat is the champion: it never misses a patch, drifts into your lane while you are close behind, and has a flagged last pull.
- **Fairness:** the course is laid out for the fastest anyone can row. From every open lane of a row an open lane of the next is within reach, in every race, with a roomier gap after a gust and a single blocked lane in a narrow stretch.

## Progression: 3 rivers × 4 races (12; old saved stars stay)
| # | Race | The one new thing | Length |
|---|---|---|---|
| **ভোরের নদী** (mist, pale water, bright banks) |||
| 1 | প্রথম টান | The ঢোল's ring. Open water, no patches. Won in about 9 s. | 1950 |
| 2 | পানার ঘাট | কচুরিপানা: tap left or right to slide a lane. | 3000 |
| 3 | সারির টান | Every 4th beat is big; right on it the pull is 1.6 times. | 3400 |
| 4 | **পাকা মাঝির বাইচ** | A black champion boat that blocks and has a last pull (top-edge flag). | 4200 |
| **ভরা বর্ষা** (olive water, brown banks) |||
| 5 | স্রোতের টান | A fast lane with a current (white arrows): 1.3 times the speed in it. | 4200 |
| 6 | সরু খাল | Reed beds close the two edge lanes for a stretch (amber edges warn first). | 4400 |
| 7 | দ্রুত ঢোল | The drum quickens half way (a double rim tap and a gold edge two beats before). | 4400 |
| 8 | **বর্ষার সর্দার** | Champion, current and a quicker drum together. | 5200 |
| **রাতের বাইচ** (night, torches, a lantern's light) |||
| 9 | মশালের আলো | Dark: patches show late; pointers on the top edge give the lanes. | 4600 |
| 10 | ঝড়ো হাওয়া | A crosswind shoves you a lane over (a blue edge and a rush first). | 4800 |
| 11 | সব একসাথে | Current, narrow stretches and gusts in the dark. | 5200 |
| 12 | **গাঁয়ের ওস্তাদ** | The champion with three last pulls, under all of it. | 6000 |

## Difficulty and story
- **Modes (chips on the title, remembered on the phone):**
  - সহজ: "চাপার সময় বেশি, ওদের নৌকা ধীরে চলে। তারা বড়জোর ২টা।" (window ×1.3, rivals 8% slower)
  - সাধারণ: "আসল বাইচ। ১ম হলে ৩ তারা, তার জন্য প্রায় প্রতি তালে চাপতে হবে।"
  - কঠিন: "চাপার সময় কম, ওদের নৌকা জোরে চলে। ১ম হওয়া কঠিন, তারা একই।" (window ×0.8, rivals 4% faster)
- **Stars:** 1st three, 2nd two, 3rd one; 4th none and the next race stays shut.
- **Bots (asserted in `tests/bots.test.ts`, 40 seeds a race, rates measured in brackets):**
  - *shaky* (taps ±110 ms, skips 12%, 0.38 s to react): race 1 placed ≥ 95% [100%], won ≥ 60% [95%], median ≤ 10 s [9.7 s].
  - *steady* (±70 ms, skips 5%, 0.32 s): wins race 1 ≥ 85% [98%], places ≥ 88% in the first river and ≥ 60% everywhere [≥ 95%], wins the last race ≤ 45% [25%].
  - *sharp* (±35 ms, 0.24 s): places ≥ 88% everywhere [≥ 90%], wins ≥ 40% everywhere [43 to 100%], the last race 35 to 75% [45%].
  - Never tapping or only mashing never wins any race (never tapping places 3rd or better in under 5% of races). Never steering, with perfect taps, wins the champions' races ≤ 15% [0%].
  - Each river is harder than the one before: the first-place rate of the shaky and the steady bot falls river by river.
  - সহজ: the steady bot wins 95% of races against 55% on সাধারণ and 25% on কঠিন. Slow mode: 57% against 55%, asserted within 12 points.
- **Story (first run only, hold to skip, never on a friend's link), remembered in `ektukhani-intro-baicher-nouka`:**
  1. "ভাদ্রের নদী। দুই পাড়ে মানুষ, মাঝনদীতে লম্বা বাইচের নৌকা."
  2. "ঢোল বাজলে একসাথে বৈঠা। ঠিক তালে চাপলে নৌকা ছোটে."
  3. "কচুরিপানা দেখলে সরে যাও। ঘাটে সবার আগে পৌঁছাও."

## Screens
- **Title:** the biggest thing is the ঢোল itself between two long boats, with **খেলো** on its head. Tap it to start. Under it: the river and race ("ভোরের নদী · বাইচ ৩: সারির টান") with its one new thing, who you race (red, green, yellow, and the black champion on finales), the three mode chips with the chosen one's line, সব বাইচ ★ and তাল মেলাও. A friend's challenge sits on top.
- **Race list (a choice screen; nothing runs behind it):** three rivers of four, numbered, each with its one new thing and stars; the next unplayed race is marked **এটা খেলো**; locked rows are dim with a lock shape. Keys 1 to 9 pick.
- **HUD (corners only, Bangla digits):** top-left the race and mode, top-right the time and "এখন ২য়", top-centre a thin course line with four dots (and the champion's name above it on finales). A run chip (ছন্দ ×৪) sits in the bottom-left corner of the river. The count-in (৩, ২, ১, চলো) and the coaching word live on the drum pad, never over the river.
- **Controls:** the pad row below the river: বাঁয়ে, the ঢোল, ডানে. The river takes taps too (left third left, right third right, middle the drum). The first race's pad says চাপো until the first catch.
- **Danger at the edges (steady borders in slow mode):**
  - a patch in your lane within a second: the top edge glows red;
  - the champion's pull coming: the top edge, a red pill and two brass notes;
  - a crosswind: the side it comes from glows blue, with a rush;
  - the banks closing: both sides amber, with two reed knocks;
  - the drum about to quicken: the right edge gold, with a double rim tap;
  - a boat closing from behind: the bottom edge gold; last place for two seconds: a quiet red bottom border.
  - Rivals out of view get a coloured pointer on the top or bottom edge; in the dark, so do the lanes of rows you can't see yet.
- **End screen (the river stays above it):** "ভোরের নদী · বাইচ ৩: সারির টান", stars popping with chimes, the time counting up over 0.8 s, then real stats: তাল ধরেছ ৬/৭, ঠিক তালে, সেরা ছন্দ, পানায় আটকেছ or পানা ছোঁয়নি, and on finales whether you passed the champion. Then the near-miss line and numbered choices: ১ পরের বাইচ (এটাই ভালো), ২ আবার খেলো, ৩ সব বাইচ. After a loss: ১ আবার খেলো, ২ সহজে খেলো, ৩ সব বাইচ, with one exact kind line ("৮টা তালের ২টা ধরেছ"). Keys 1 to 4, Enter, R and Space work only from a fresh press at least 2 s after the screen appears, longer than a beat, so a rower still drumming never skips the result. Buttons answer at once.
- **Card:** the boat breaking the finish rope on the world's water, with the time, the place and the stars; the kicker names the river and race.

## Sound (only `shared/game-sound.ts`)
1. **ঢোল strokes** (the signature): strong, weak, a deep boom on the big stroke, a dry rim tap for the count-in. Seen as the closing ring and the pad.
2. **হেঁই** on a catch: two low grunts and the blades in the water, brighter on a perfect, long on the big stroke. Seen as the oars biting wider and the pad's flash.
3. **Fumble** on a tap off the beat. Seen as the red cross on the drum.
4. **ছপ** into a patch. Seen as the shake, the pop "পানায় আটকালে" and the scattered patch.
5. **The river rush** (loop), louder and higher the faster you row. Seen as the wakes and the course line.
6. **Warnings:** the champion's brass pair, the crosswind's rush, the reed knocks. Each is also a lit edge.
The start horn ends the count-in; a placing plays a drum roll and a tune pitched for the river. Every note is a scheduled tone, so a pause cuts it. The rush stops on pause, blur, hide, the finish, the race list and unmount, and a fresh one starts when sound or play comes back.

## Comfort and controls
- **ধীরে খেলো:** the whole race at 80% speed; no shake, flash, wakes, ripples, floating words or pulsing edges (steady borders instead); the count-up shows at once. The tap windows stay the same in milliseconds, so the beat is no easier. It does give more time to read the river, which is its job, and the test shows the cost to stars is small.
- **Touch:** thumb on the pad, or tap the river. **Keyboard:** ← → or A D to change lane, Space, Enter, ↑ or W for the drum, P pauses (the player's menu), 1 to 4, Enter, R on the result. **Mouse:** click the pads or the river.
- **তাল মেলাও** measures a phone's touch lag from eight pulses and the stroke compensates. Leaving the window mid-way voids the pulses and says so.
- Pause, sound and ধীরে খেলো live in the player's menu, with সব লেভেল opening the race list. The game has no toggles of its own.
- **Kept for compatibility:**
  - Links keep `#s=&t=&r=&l=&n=`. New links add `v=2` and `d=e|h`. A link without `v` replays the old long course (9000 units, the old twelve paces, the same river and drum and rivals drawn from the seed in the old order); results on one are compared and carded but record no stars. A link with no `l` is the old race 7.
  - `ektukhani-levels-baicher-nouka` (stars per race) stays as it is.
  - `ektukhani-baicher-nouka-lag` stays.
  - `ektukhani-best-baicher-nouka` counted the old long course, so it is left alone. Best times are now one JSON key per race and mode, `ektukhani-times-baicher-nouka`.
  - A friend's far-ahead race records its stars in `ektukhani-ahead-baicher-nouka` and opens nothing in between.
  - The URL, the title, the H1, the description limits, the share preview format and the tally ids stay.
