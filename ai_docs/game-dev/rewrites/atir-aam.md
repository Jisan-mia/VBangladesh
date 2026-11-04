# আঁটি থেকে আম: rewrite design

## Core
- **Concept:** a garden bed inside a bamboo fence. Swipe, and every painted clay plate slides. Two of the same plate meet and grow into the next stage, from a mango stone to a whole orchard.
- **Fantasy:** the আঁটি you threw into the yard after a জ্যৈষ্ঠের দুপুর, and the tree it became. You are the one who tends it, season after season.
- **Loop:** *টানো* (swipe the bed) → *মেলাও* (two of a kind meet) → *ফলাও* (it grows a stage). Every spawn is seeded, so a friend gets the same আঁটি in the same order and the moves in a link replay exactly.

## Stages (the growth you can see)
আঁটি → চারা → গাছ → মুকুল → গুটি আম → কাঁচা আম → পাকা আম → আমের ঝুড়ি → আমের বাগান. Nine plates, each a drawing, each a new rim colour. A thin road of the nine plates sits under the HUD: reached plates are lit, the next one is ringed, and a reached new stage pops on the road with a leaf burst on the board (petals for মুকুল, gold for পাকা আম).

## Progression: 3 seasons × 8 levels, plus খোলা বাগান
The 24 level numbers stay, so saved stars keep their meaning. Each level teaches exactly one new thing (the title's **নতুন** line). The eighth of each season is its named finale, with a boss bar (its name and the moves left) at the top centre.

| # | Name | Goal | The one new thing |
|---|---|---|---|
| **Season 1: ফাল্গুনের উঠোন** (4×4, morning green and cream) |||
| 1 | প্রথম চারা | চারা | Swipe. Two আঁটি meet and grow a চারা. Won in a swipe or two. |
| 2 | চারা থেকে গাছ | গাছ | Two চারা make a গাছ; now and then a চারা falls by itself. |
| 3 | মুকুল | মুকুল | One swipe can make two pairs: a টানা bonus. |
| 4 | গুটি আম | গুটি আম | ফেরত নাও: take a swipe back, twice a level. |
| 5 | বৃষ্টি | গুটি আম | Every 8th move it rains, and every আঁটি becomes a চারা. A cloud in the corner counts down. |
| 6 | কাঁচা আম | কাঁচা আম | A bigger goal. |
| 7 | চাল কম | কাঁচা আম | A tight move limit. The last 5 moves glow at the edge. |
| 8 | **শিলাবৃষ্টি** (finale) | পাকা আম | Hail: a red ring marks a plate two moves ahead; what sits there shrinks one stage. |
| **Season 2: বৈশাখের পুকুরপাড়** (4×4, amber afternoon, pond blue) |||
| 9 | পাথর | গুটি আম | A stone. Nothing moves or merges past it. |
| 10 | দুই পাথর | কাঁচা আম | Two stones. |
| 11 | আগাছা | কাঁচা আম | Weeds fall. Two weeds that meet are pulled out together. |
| 12 | পাথর আর আগাছা | পাকা আম | Both together. |
| 13 | দমকা হাওয়া | পাকা আম | A gust slides everything one way after every 8th move. An arrow at that edge warns two moves ahead. |
| 14 | চাল কম | পাকা আম | Tight moves with stones and gusts. |
| 15 | আমের ঝুড়ি | আমের ঝুড়ি | A bigger goal. |
| 16 | **কালবৈশাখী** (finale) | আমের ঝুড়ি | Gusts every 5th move, with stones and weeds. |
| **Season 3: জ্যৈষ্ঠের আমবাগান** (5×5, gold evening) |||
| 17 | বড় বাগান | পাকা আম | The bigger 5×5 plot. |
| 18 | কাক | পাকা আম | A crow's shadow falls on an empty plate one move ahead; fill it and the crow can't land, or it sits there 4 moves. |
| 19 | দুটো পাকা আম | পাকা আম ×২ | A count goal: grow two. |
| 20 | আমের ঝুড়ি | আমের ঝুড়ি | A bigger goal, with crows. |
| 21 | শিল আর কাক | আমের ঝুড়ি | Hail and crows together. |
| 22 | চাল কম | আমের ঝুড়ি | Tight moves. |
| 23 | আমের বাগান | আমের বাগান | The last stage. |
| 24 | **মধুমাস** (finale) | আমের বাগান | Gusts, hail and crows together. |

- **খোলা বাগান** (endless, 4×4): grow as far as you can. ★ পাকা আম, ★★ ঝুড়ি, ★★★ বাগান. Each new stage from মুকুল up opens **মালির থলে**, a numbered choice (below).
- **Stars in a level:** by moves, with the three numbers on the title ("★★★ ৩৫ চালে"). Par comes from a look-ahead bot.
- **Unlocks:** your own open level (`ektukhani-atir-aam-open`, migrated once from the old rule) rises only when you clear the furthest open level. A friend's far-ahead level records its stars and opens nothing in between.
- **Bots (`tests/bot.ts`, asserted in `tests/levels.test.ts`):**
  - a **look-ahead** bot (depth 3, sees the seeded spawns) sets par and clears every level inside ★★★;
  - a **casual** bot (one move deep, a fuzzy eye, a wrong swipe 20% of the time, no undo) and a **steady** bot (two moves deep, a wrong swipe 5% of the time) each play every level with 30 personality seeds.
  - **Asserted:** the casual bot clears level 1 every time in ≤ 3 swipes (median 2), and every season-1 level ≥ 80%. The steady bot clears every level ≥ 50%. Each finale has its season's longest par and the casual bot's lowest clear rate there. The last finale is harder than the first.
  - **Measured (casual / steady):**
    - season 1: 100/100% on levels 1–3 and 5–7, 87–100% on level 4, finale 90/100%;
    - season 2: 23–90% / 80–100%, finale 0/50%;
    - season 3: 47–90% / 100%, finale 7/97%.

## Difficulty and story
- **Modes (title chips, remembered on the phone):**
  - **সহজ:** "ফেরত ৫ বার, চাল দেড় গুণ। তারা বড়জোর ২টা।"
  - **স্বাভাবিক (default):** "ফেরত ২ বার। আসল খেলা।"
  - **কঠিন:** "ফেরত নেই, চাল কম। খোলা বাগানে আগাছাও পড়ে।"
  A level's plot, drops and weather never change with the mode, so a friend's link is the same level. Only the কঠিন garden adds weeds.
- **Story (first run only, never on a friend's link, tap for the next, hold 0.6 s to skip):**
  1. "জ্যৈষ্ঠের দুপুর। আম খেয়ে আঁটিটা উঠোনে ছুড়ে দিলাম।"
  2. "বর্ষা এল। আঁটি ফেটে দুটো কচি পাতা।"
  3. "একই রকম দুটো মেলাও, বড় হবে। আঁটি থেকে বাগান বানাও।"

## Screens
- **Title:** the biggest thing is a code-drawn clay plate holding the level's goal stage, with **খেলো** on a ribbon. It bobs gently; tap it to start. Under it: ‹ লেভেল ৫ · বৃষ্টি ›, the নতুন line, the goal and star numbers, the mode chips with the chosen one's line, and সব লেভেল ★ n/৭২ and খোলা বাগান (with this phone's best). A friend's challenge sits on top.
- **Choice moments (all pause play, all numbered):**
  - **মালির থলে** (খোলা বাগান, at each new stage from মুকুল): three cards, keys 1–3. Each has a name, one line and an exact before → after ("ফেরত ১ → ৩", "খালি ঘর ২ → ৫"). One is marked **এটা ভালো হবে**, picked from the board (few empty plates: কোদাল; no take-backs left: ফেরত). The pool: ফেরত +২, সার (the next 6 drops are চারা), কোদাল (lift the three smallest plates), বৃষ্টি (every আঁটি becomes a চারা now). A pick can't be taken back.
  - **সব লেভেল:** a sheet over the stage: three seasons of eight, numbered, with each row's name, one new thing and stars, finales marked শেষ ধাপ, locks, and **এটা খেলো** on the recommended level. Keys 1–9.
  - **End screen:** ১ পরের লেভেল (এটাই ভালো) · ২ আবার খেলো · ৩ সব লেভেল; keys 1–3 and Enter, fresh presses only.
- **HUD (corners only, the bed stays clear):** top-left the level badge (opens সব লেভেল); top-centre the goal plate with its name, or on a finale the boss bar (its name, draining with the moves left); top-right the moves "১২/৪০" in a level or the points in the garden. Under it the stage road. Events show where they apply: the rain cloud's countdown sits in the HUD corner, the hail ring and the crow's shadow sit on their plate, the gust arrow sits at its edge.
- **Danger at the edges:** the stage edge glows amber when a level has 5 moves or fewer left, or when the bed has at most two empty plates and few swipes that move. A gust lights the edge it blows towards. In ধীরে খেলো these are a still border.
- **Finales:** the boss bar, the season's event at its strongest, the season's three-note call on the clear, and confetti on the first clear.
- **End screen:** over the bed: the kicker ("লেভেল ৮ পার · শিলাবৃষ্টি", "জায়গা শেষ"), the stars popping in, the stage reached as a big plate, then real stats counting up: চাল, পয়েন্ট, জোড়া, টানা সেরা, ফেরত, সময়, and the run's best swipe ("৪২ নম্বর চালে এক টানে ৩ জোড়া"). Then the exact near-miss ("আর ৪ চাল কম হলে ৩ তারা", "আর একটা পাকা আম হলেই ঝুড়ি") and the numbered choices. **কার্ড দেখো ↓** scrolls the stage to the card.
- **Card:** the painted-plate card: the stage reached, big, with the nine-plate road under it. It now names the level ("লেভেল ৮ · শিলাবৃষ্টি") or খোলা বাগান.

## Sound (`shared/game-sound.ts` only)
1. **Rustle:** leaves brushing as the plates slide. You see the slide.
2. **Merge টুক:** a soft wooden note, a step higher with each swipe in a row that merges. You see the pop and the ring.
3. **Grow chord (signature):** a rising chord when a new stage appears, higher for each stage. You see the road plate light and the leaf burst.
4. **No-move thump:** you see the bed nudge.
5. **Weather:** a patter for rain, an icy clink for hail, a crow's কা, a whoosh for a gust. You see the cloud, the ring, the shadow and the edge arrow.
6. **Wind loop** on gust levels, swelling when a gust is due. It stops on pause, hide, the end and unmount, and comes back when sound turns on.

Each season's three-note call plays on a level clear (scheduled tones, so a pause cuts them).

## Comfort and controls
- **ধীরে খেলো:** slides take 60 ms instead of 120, with no pop, burst, petals, shake, confetti, pulsing edge or count-up. Stars and limits are unchanged.
- **Touch and mouse:** swipe anywhere on the stage; the move happens as soon as the finger has travelled 18 px, not on lift. The arrow buttons under the bed do the same.
- **Keys:** arrows or WASD swipe (no auto-repeat), U or Z takes back, P opens the player's menu, 1–3 pick in মালির থলে and on the end screen, Enter or Space starts and takes the end screen's first choice (fresh presses only).
- **Away:** blur, a hidden tab and every choice screen stop input, the wind and scheduled notes. A swipe in the first 250 ms after চালিয়ে যাও is ignored, so the click that brings focus back is never a move.
- **Kept for compatibility:**
  - old links `#s=&t=&c=&m=&n=` (the garden) and `#l=&t=&m=&n=` (a level) still parse and replay the old rules exactly (`lib/legacy.ts`, pinned by a fixture recorded from the old code). New links add `v=2`, `d=` for a mode and `p=` for the মালির থলে picks;
  - stars in `ektukhani-levels-atir-aam` keep their level numbers; the best score `ektukhani-best-atir-aam` and best stage `ektukhani-best-atir-aam-stage` stay;
  - no tally; `/atir-aam`, its title, description and H1 stay.
