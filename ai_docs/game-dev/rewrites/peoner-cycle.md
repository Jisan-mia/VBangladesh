# পিয়নের সাইকেল: rewrite design

## Core
- **Concept:** a village পিয়ন on an old black roadster rides a three-lane মেঠো পথ from dawn to a stormy dusk, handing letters to people who wait at their gates.
- **Fantasy:** the পিয়ন everyone in the village waits for. A hand goes up at a gate, your bell rings, the letter flies out of the ঝোলা into that hand. Nobody's letter is late.
- **Loop:** *সরো* (change lanes) → *বাঁচাও* (slip past puddles, goats, carts, a van) → *বিলি করো* (ride the lane beside a waiting gate and the letter flies over). Every route is seeded, so a friend's link is the same road.
- **The ride (`lib/step.hot.ts`):** deterministic, fixed 60 steps a second, in world units (360 wide, 24 u a মিটার). A tap moves the target lane at once and the bike slides there in 0.12 s (0.3 s in mud), so every press shows on the next 16 ms step. Speed ramps from the route's start speed to its top: 225 u/s (9.4 m/s) on route 1, up to 480 u/s on the storm, so each world is faster than the last. A bump costs a letter (it flutters out of the bag), halves the speed for 1.2 s and counts against the mode's allowance. A late dodge rings the bell (ক্রিং, +৫).
- **The road (`lib/course.ts`):** laid out from the seed and the route only, never the real speed. Rows are timed for the fastest the bike can be there, so from any lane an open lane is in reach (0.36 s to see it plus 0.12 s a lane); where the time is too short for a two-lane row the row blocks one lane or none. A single thing stands in the middle lane 45% of the time, so waiting where you start never works. The camera shows at least 640 units tall with the front wheel 150 from the bottom, so the rider always sees 490+ units (more than a second) ahead.

## Progression: 3 worlds × 4 routes (`lib/levels.ts`)
Each route adds exactly one new thing (its `line`, on the title, in the list and under পরের লেভেল). Each world ends in a named finale whose bar sits top-centre. Every route ends at a named place (the old routes' names).

| # | Route → place | The one new thing |
|---|---|---|
| **ভোরের গ্রাম** (pink-gold dawn, dusty road, palms, mustard) |||
| 1 | প্রথম চিঠি → বটতলা | Tap left or right to change lanes. Ride the lane beside a waiting gate and the letter is delivered. Puddles only. About 9 s. |
| 2 | পথে পড়া চিঠি → হাটখোলা | Letters lying on the road. Pick them up: a bump costs one from the bag, and these are spares. |
| 3 | ঠেলাগাড়ির সারি → স্কুলপাড়া | Rows that block two lanes at once. Find the one open lane early. |
| 4 | **হাটবার** → হাট | Finale: the হাট stretch, gates on both sides one after another. The bar "হাটবার" fills a notch per gate. |
| **দুপুরের নদীপাড়** (white noon, river verge, bamboo, jute) |||
| 5 | উল্টো দিকের ভ্যান → খেয়াঘাট | A ভ্যান comes towards you, fast. A red pointer at the top edge shows its lane a second ahead. |
| 6 | কাদা রাস্তা → মিয়াবাড়ি | Mud: a lane change takes much longer. Move early. |
| 7 | ছাগল পার হয় → কলেজ রোড | A goat walks into the next lane. An arrow over it shows where. |
| 8 | **গরুর পাল** → বড় বাজার | Finale: a herd crosses the road, cow after cow. The bar "গরুর পাল" fills a notch per cow passed. |
| **বর্ষার সন্ধ্যা** (blue dusk, wet road, lanterns) |||
| 9 | সন্ধ্যা নামল → রেলস্টেশন | The light fades: you see less of the road ahead. Lanterns mark the gates. |
| 10 | পেছনে কুকুর → থানা সদর | A dog chases from behind in your lane. A pointer at the bottom edge; change lanes before it reaches you. |
| 11 | দমকা হাওয়া → নদীর ঘাট | A gust shoves the bike one lane over. Arrows at the side edge a second before; steer back. |
| 12 | **কালবৈশাখী** → উপজেলা সদর | Finale: the storm's three big gusts in rain and dark. The bar "কালবৈশাখী" flashes amber before each. |

- **Length:** each route is laid out near its planned length (tests allow +16%, route 1 +27%); riding time with a careful rider: 8.6 s, 14, 16, 22 | 19, 17, 23, 23 | 20, 33, 35, 35 s. Route 1 is reached in under 10 s on every seed.
- **Stars:** reaching the place ★; delivering at least the route's goal ★★; every gate gets its letter ★★★. A bump loses a letter, so ★★★ means no bump, or spare letters picked up.
- **Unlocks:** the game's own unlock (`ektukhani-unlock-peoner-cycle`) rises only when you reach the place on the furthest open route. A friend's far-ahead route records its stars and opens nothing in between.
- **Bots (`tests/bot.ts`, tested in `tests/levels.test.ts`, 14 fixed seeds a route).** A rider sees only what a phone shows (400 units; less at dusk), notices a thing a reaction time after it appears (and sometimes a half-second later: a *lapse*), taps one lane at a time with a thumb's pause, and may miss a gate or pick a wrong lane.
  - **careful** (perfect reading, no lapse): reaches every route on every seed with every letter (★★★ ≥ 95%, bumps ≤ 0.1): the proof each route is fair.
  - **sharp** (0.18 s, lapses 4%): reaches ≥ 95% on every route, ★★★ ≥ 60%.
  - **casual** (0.3 s, 18% lapses of 0.5 s, thumb pause 0.24 s, 10% wrong lane, misses 15% of gates): স্বাভাবিক reaches route 1 every time inside 10 s, ≥ 90% on routes 2–4, ≥ 70% on routes 5–12. It is not too easy: mean bumps from the river on ≥ 0.25 and ≥ 0.8 in the storm. Measured over 30 seeds: reaches 100% on routes 1–7, then 93, 100, 93, 80, 87% (the storm's routes bite most).
  - **সহজ** casual ≥ 95% everywhere. **কঠিন** (one bump): casual reaches route 1 every time; each finale 20–90% and below its world's first route (measured 90%, 48%, 23%); sharp ≥ 85%.
  - **idle** (never taps) never delivers a letter (no ★★), and from route 2 reaches the place ≤ 30% of the time.
  - The slow clock (0.75×) is only the clock: the road, the targets and a perfect rider's stars are the same.

## Difficulty and story
- **ধাক্কা (chips on the title, remembered):** the road never changes, so a friend's link is the same road.
  - সহজ: "৫টা ধাক্কা পর্যন্ত চলবে। ধীরে শেখো।"
  - স্বাভাবিক (default): "তৃতীয় ধাক্কায় সাইকেল থামবে।"
  - কঠিন: "একটা ধাক্কা খেলেই শেষ।"
- **Story (first run only; tap for the next panel, hold 0.6 s to skip):**
  1. "ভোর পাঁচটা। ডাকঘরে চিঠির বস্তা খোলা হলো।"
  2. "ঝোলায় চিঠি, হ্যান্ডেলে বেল। পিয়ন রওনা দিল।"
  3. "বাঁয়ে-ডানে চাপো। গেটের পাশের লেন দিয়ে গেলেই চিঠি পৌঁছাবে।"
  Never on a friend's link (`ektukhani-intro-peoner-cycle`).

## Screens
- **Title:** the dimmed road behind. The biggest thing is the code-drawn পিয়ন on his bike with **রওনা দাও** under it. Small under that: ‹ লেভেল N · name ›, "নতুন …", the place and its মিটার, the three ধাক্কা chips with the chosen one's line, "★ পৌঁছালে · ★ Nটা চিঠিতে · ★ সব চিঠিতে", সব লেভেল. A friend's card on top.
- **Choice, সব লেভেল:** a sheet that pauses a ride in progress. Three worlds of four, keyed 1–9, 0, -, =, with name, one new thing and stars; locked rows show a lock; the recommended one wears **এটা খেলো**.
- **HUD (corners only, drawn on the canvas, the badge in HTML):** top-left the level badge (opens the list); top-right "✉ ২/৫" delivered and the ধাক্কা left as small wheels; bottom-left the letters in the ঝোলা; top-centre the score; the very top edge a progress line to the place; a finale's named bar in the second row. Nothing over the road.
- **Signals at the edges:** an envelope pointer on the left or right edge for a gate coming up; a red pointer on the top edge in a ভ্যান's lane; a dog pointer on the bottom edge; chevrons on a side edge before a gust.
- **Danger at the edges:** something in your lane within 0.6 s lights the top edge orange, stronger the closer; a dog behind lights the bottom edge; the last allowed bump gives a soft orange rim all round. A bump flashes the bottom edge red. In ধীরে খেলো it is a steady border; nothing flashes or shakes.
- **Juice:** a delivery throws the letter in an arc from the bag to the raised hand, the hand holds it, the bell rings, "+১০" rises small. A missed gate's hand drops. A pickup whisks into the bag. A bump wobbles the bike and a letter flutters off. Reaching the place rolls the bike under the place's banner.
- **End:** over the dimmed road: the heading ("বটতলা পৌঁছে গেলে", "সব চিঠি পৌঁছেছে!", "হাটবার পার!", "সাইকেল থামল"), the stars one by one, then the stats counting up (চিঠি d/N, দূরত্ব, ক্রিং, সময়). Then the exact near-miss line ("আর ১টা চিঠি হলেই আরেকটা তারা।", "আর ৩২ মিটার গেলেই বটতলা।"), পরের লেভেল / আবার খেলো (keys from a fresh press only, 0.7 s after it appears), and "পরের লেভেলে নতুন …". **ছবি বানাও ↓** scrolls the stage to the card.
- **Card:** the world's road and light, the bike handing a letter to a raised hand at a gate, letters in the air, an envelope with the score, the route, the stars and the stats line.

## Sound (`shared/game-sound.ts` only)
1. **Signature:** the ক্রিং-ক্রিং bell, on রওনা দাও and every late dodge (the rings drawn by the handlebar).
2. **Delivery:** a paper flick and a chime that climbs with the delivery streak (the flying letter, "+১০").
3. **Pickup:** a short paper whisk (the letter flies into the bag).
4. **Bump:** a splash for puddles and mud, a thud otherwise (the wobble, the red bottom edge).
5. **Warnings:** the ভ্যান's two-tone horn, a dog's bark, a gust's rush (each with its edge pointer).
6. **Road loop:** a soft tyre-and-air hiss that follows the speed. It stops on pause, the end, a hidden tab and unmount, and a fresh loop starts when sound comes back.
- **World call:** three notes per world after the bell at the start, as scheduled tones, so the pause cuts them. Arrival: the bell twice and a rising run.

## Comfort and controls
- **ধীরে খেলো:** the whole ride at 0.75×. No shake, no wobble, no flashing; the danger edge is a steady glow. Stars stay the same: the design accepts that slower time helps reaction (an access setting).
- **Touch and mouse:** tap the left or right half of the road. The first tap after a pause only resumes. **Keys:** ← → or A D; Enter or Space starts, and takes the end screen's main choice (fresh press only); P opens the player's menu; 1–9, 0, -, = in the list.
- **Away:** blur, a hidden tab, scrolling the stage away, the player's menu, the list or the story all stop the ride and the road loop. A 0.45 s breath follows a resume. Celebration timers are dropped on every new run, choice and unmount.
- **Kept for compatibility:**
  - old links `s t m c l n` still parse and open the matching new route (old route r → ⌈1.2 r⌉ capped at 12), with the old preview words; the friend's number shows as their old-game claim, with no comparison. New links add `v=2`, `d` delivered, `b` bumps and `k` mode (`e`/`h`), and the points must add up to মিটার + 10 × delivered + 5 × picked + 5 × bells.
  - the 10 old routes' stars (`ektukhani-levels-peoner-cycle`, or before that the one-road best) migrate once into the new ladder (`ektukhani-levels-peoner-cycle-dak`): old route r cleared opens new routes 1..⌊1.2 r⌋ with that old route's stars.
  - the share id `peoner-cycle`, `/peoner-cycle`, the title's "সাইকেল গেম" opening and its length rules, the H1.
