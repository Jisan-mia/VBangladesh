# কাগজের উড়োজাহাজ: rewrite design

## Core
- **Concept:** a paper plane torn from the back page of an exercise book. You throw it across the classroom, over the city's roofs on kite day, and across the river at dusk, and you land it on the red ring.
- **Fantasy:** every Bangladeshi child who ever folded a plane in the last period while স্যার wrote on the board. Here it flies as far as you always wanted it to.
- **Loop:** *ছোড়ো* (throw) → *ভাসাও* (feather the nose: hold to climb, let go to dive) → *নামাও* (land on the ring). Every flight is seeded, so a friend gets the same candies and the same wind.
- **The flight (`lib/physics.ts`, `lib/step.hot.ts`):** deterministic. The nose eases towards +0.42 rad while held and −0.32 while let go. Speed follows gravity along the path, with drag ∝ v², a paper drag and induced drag ∝ 1/v². Holding trades speed for height. Holding too long stalls the plane, and a stall drops the nose hard. The longest glide comes from feathering near 85 u/s. Doing nothing dives short (640 u from the throw); holding all the time stalls (514 u); feathering goes 1,600 u. That gap is the skill.
- **Wind you can see:** every wind zone draws its own streaks, moving the way it pushes. Rising orange waves are warm air. Down-arrows hang under a fan, and they turn red when the bell makes the fan blow harder. Dashes blow across in a gust. Slanted lines with a dark curtain are rain. A gust or a bell shows faint streaks one second before it starts.

## Progression: 3 worlds × 4 flights (`lib/levels.ts`)
Each flight teaches one new thing, shown on its start card and in the list, and named under পরের লেভেল on the end screen. Each world ends in a named finale with its own beat and a named bar at the top.

| # | Flight | The one new thing |
|---|---|---|
| **ক্লাসঘর** (chalk-cream walls, green board, wooden benches; no updrafts, so every flight is one good throw) |||
| 1 | প্রথম ছোড়া | Hold to lift the nose, let go to dive. Land on স্যারের টেবিল. A 7–9 s flight. |
| 2 | বেঞ্চের সারি | Benches and the steel আলমারি, to fly over. |
| 3 | ফ্যানের নিচে | Ceiling fans push down (arrows); their blades are solid. |
| 4 | **টিফিনের ঘণ্টা** | Finale: the bell rings every 4 s, and each ring makes every fan blow harder (red arrows). Fly through between rings. |
| **ছাদের ওপর** (golden afternoon, Old Dhaka roofs, black water tanks) |||
| 5 | গরম হাওয়া | Warm air rising off tin roofs lifts the plane. Gaps between roofs are the street. |
| 6 | কাটা ঘুড়ি | Cut kites drift with their strings hanging below. Go over the kite or under the tail. |
| 7 | দমকা হাওয়া | Gusts come and go: a headwind shortens the glide, a tailwind stretches it. |
| 8 | **ঘুড়ি কাটাকাটি** | Finale (সাকরাইন): kites swing wide, and each "ভোকাট্টা" brings a gust. |
| **নদীর ঘাট** (monsoon dusk, boats with bamboo ছই, herons) |||
| 9 | নদীর ওপর | The river: water is a crash. Smoke from a boat's stove lifts you. |
| 10 | ঝুম বৃষ্টি | Rain curtains soak the paper: heavier, it sinks until it dries. |
| 11 | বকের ঝাঁক | Herons fly figure-eights over the water. Read their loop. |
| 12 | **শেষ খেয়া** | Finale: the last ferry sounds its ভেঁপু and pulls away, so the landing place moves. |

- **Stars:** landing ★; enough candies ★ (the goal is on the start card); landing on the red ring ★. The number of pages never changes the stars.
- **Checkpoints:** a dashed ring marks where the next page is thrown from after a fall. Candies flown past can be caught again from there.
- **Bot targets (`tests/levels.test.ts`, 12 seeds a flight).** The casual bot reacts in 0.32 s, holds sloppily, guesses 12% of the time and looks 1.1 s ahead. The sharp bot reacts in 0.2 s and looks 1.2 s ahead.
  - **স্বাভাবিক:** the casual bot lands every flight ≥ 85% (measured 100% on all 12), and lands level 1 inside 10 s (about 9 s).
  - **কঠিন, casual:** level 1 every time. The finales must land 35–90% and below their world's opening flight: measured 50% (টিফিনের ঘণ্টা), 67% (ঘুড়ি কাটাকাটি) and 42% (শেষ খেয়া), against 100%, 83% and 75%.
  - **কঠিন, sharp:** ≥ 70% on every flight (measured 75–100%).
  - **Solver proofs:** a beam-search pilot lands on the ring with one page on three seeds of every flight, and gets ★★★ (the ring plus the candy goal) on two seeds of every flight. The candy goals are set from what it can carry on a bullseye flight.
- **Unlocks:** the game's own unlock (`ektukhani-unlock-kagojer-urojahaj`) rises only when you land the furthest open flight. A friend's far-ahead flight records its stars and opens nothing in between.

## Difficulty and story
- **পাতা (chips on the title, remembered):** the flight never changes, so a friend's link is the same flight.
  - সহজ: "৫টা পাতা। পড়ে গেলে পাশের বন্ধু নতুন প্লেন ছোড়ে।"
  - স্বাভাবিক (default): "৩টা পাতা। তিনবার পড়লে এই উড়ান শেষ।"
  - কঠিন: "১টা পাতা। একবার পড়লেই শেষ।"
- **Story (first run only; tap for the next panel, hold 0.6 s to skip), on ruled-paper panels over the live classroom:**
  1. "শেষ পিরিয়ড, অঙ্ক ক্লাস। স্যার বোর্ডে লিখছেন।"
  2. "খাতার শেষ পাতাটা ছিঁড়ে চুপচাপ ভাঁজ দিলে।"
  3. "চেপে ধরলে নাক ওঠে, ছাড়লে নামে। স্যারের টেবিলে নামাও!"
  Never on a friend's link (`ektukhani-intro-kagojer-urojahaj`).

## Screens
- **Title:** the scene is dimmed behind. The biggest thing is the code-drawn plane on its dotted throw line, labelled **ছোড়ো**. Under it, small: ‹ লেভেল N · name ›, the "নতুন …" line, the three পাতা chips with the chosen one's consequence, "★ নামলে · ★ Nটা লজেন্সে · ★ লাল দাগে নামলে", and সব লেভেল. A friend's card and claim sit on top.
- **Choice, সব লেভেল:** a sheet that pauses a flight in progress. Three worlds of four, keyed 1–9, 0, -, =, each with its name, its one new thing and its stars. Locked rows show a lock; the recommended one wears **এটা খেলো**. The HUD badge opens it.
- **HUD (corners only):**
  - top-left: the level badge;
  - top-right: the candies "৩/৮" and the pages left as small folded sheets;
  - the very top edge: the flight line filling to the landing place;
  - right edge: a red pointer to the landing place with "১২ মি." while it is off screen;
  - a finale's named bar in the second row, top centre, flashing amber a second before each beat.
  The middle stays clear. The "+১০" pops are small and quick.
- **Danger at the edges:** the plane's line is probed 0.6 s ahead. The edge it would hit glows orange, stronger the sooner: bottom for the floor, street or water; right for anything ahead; top for a fan or a stall. The last page gives a soft orange rim all round. A crash flashes red at the bottom edge. In ধীরে খেলো it is a steady glow, and nothing flashes or shakes.
- **End:** over the dimmed scene: the heading ("প্লেন নামল", "ঠিক মাঝখানে!", "টিফিনের ঘণ্টা পার!", "পাতা ফুরিয়ে গেল"), the stars one by one, then the stats counting up (দূরত্ব N/M মি., লজেন্স c/n, সময়, পাতা বাকি). Then the exact near-miss line ("আর ১টা লজেন্স হলেই আরেকটা তারা।", "মাঝখানের দাগ থেকে মাত্র ২ বিঘত দূরে নামল।"), পরের লেভেল / আবার খেলো (keys only from a fresh press, 0.7 s after it appears), and "পরের লেভেলে নতুন …". **ছবি বানাও ↓** scrolls the stage to the card.
- **Card:** the world's sky, the big ruled plane coming down a dotted line onto the red ring, the candies, and a ruled-paper panel with the points, the headline and the level.

## Sound (`shared/game-sound.ts` only)
1. **Signature:** a paper flick and the throw's whoosh, then the world's three-note call (`tone` with a delay, so a pause cuts it).
2. A candy's tink, climbing the scale with the streak.
3. Into the air: warm air breathes up, a fan whirs, a gust rushes, rain patters.
4. A crash crumples paper (a splash on the river); a stall flutters; the ceiling or the far wall knocks.
5. Touchdown: a paper tap and a chime, and on the ring the school bell's টিং.
6. Finale beats a second ahead: the school bell, the ভোকাট্টা whistle, the ferry's ভেঁপু.
7. **Wind loop:** its loudness and pitch follow the speed. It stops on pause, a crash, the end, a hidden tab and unmount, and a new loop starts when sound turns back on.

Every sound has a visible twin: sparks and the "+১০", streaks, the crumpled ball, the landing glow, the amber bar.

## Comfort and controls
- **ধীরে খেলো:** the whole flight runs at 0.75×. There is no shake, no flash, no bob and no slide animation, and the danger edge is a steady glow. Targets and stars stay the same. The design accepts that slower time makes reacting easier: it is an access setting, and the card never says which mode was used.
- **Touch and mouse:** press anywhere on the scene to hold the nose up; release to let it dive. The first press after a pause only resumes.
- **Keys:** Space, ↑ or W hold. Enter or Space throws, and takes the end screen's main choice (fresh press only). P opens the player's menu (`requestPause`). In সব লেভেল, 1–9, 0, - and = pick a level. Escape belongs to the player.
- **Away:** blur, a hidden tab, the player's menu, the level list or the story all stop the flight, the wind loop and the hold. After a resume there is a 0.45 s breath. Celebration timers are dropped on every new run, choice and unmount.
- **Kept for compatibility:**
  - old links `s t l c r h n` (the cloud-popping game) still parse, checked against the old sky by the old generator, kept bit for bit in `lib/legacy.ts` (a fingerprint test pins it). They open the same place in the new ladder (wave L → flight ⌈0.6 L⌉) and keep their old preview words. New links are `s t w c m n`, and the points must equal exactly what those candies, that landing and some distance make;
  - the old 20-wave stars (`ektukhani-levels-kagojer-urojahaj`) migrate once into the new ladder (`ektukhani-levels-kagojer-urojahaj-udan`): waves 1..K cleared open flights 1..⌊0.6K⌋ with their stars;
  - the share id `kagojer-urojahaj`, `/kagojer-urojahaj`, the title's "প্লেন গেম" opening and its rules (≤ 45 characters, a 120–160 character description).
