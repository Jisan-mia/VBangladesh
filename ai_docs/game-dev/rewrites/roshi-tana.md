# রশি টানাটানি: rewrite design

## Core
- **Concept:** the school sports-day tug-of-war, pulled on the ঢোল's beat. The beat gives the pull, not how fast you tap.
- **Fantasy:** you are the হলুদ দল's anchor. The ঢোলি beats, the মাইক calls the teams, the crowd along the chalk line gets louder as the red ribbon creeps towards a line.
- **Loop:** listen → tap → heave. Hear and see the beat, tap once on it, and your team leans back and drags the ribbon one step. Fewer beats to win means more stars.

## Progression: 3 worlds × 4 rival teams (12 levels)
Each level is one rival team and adds exactly one new thing. The world's 4th team is its named finale, with a boss bar and a surge to hold.

| # | Rival team | The one new thing |
|---|---|---|
| **World 1: সকালের মাঠ** (morning, fresh green, yellow bunting) ||
| 1 | ক্লাস থ্রি | Tap when the ring meets the drum. A slow drum and a weak team: won in under 10 s. |
| 2 | ক্লাস ফোর | **টানা:** taps on the beat in a row pull harder (the rope goes taut, the combo chip climbs). |
| 3 | ক্লাস সিক্স | **বড় ঢোল:** every 4th beat is a deep stroke with a thick gold ring. Right on it, the pull counts double. |
| 4 | **Finale: ক্লাস টেনের দল** | **হেঁইয়ো:** their দম bar fills; when full they heave for 2 beats. Land those beats right on the beat to hold the heave. |
| **World 2: বিকেলের টুর্নামেন্ট** (afternoon, warm dust, long shadows) ||
| 5 | পাশের স্কুল | **ফাঁকা তাল:** some beats are rests (a dashed ring, no stroke). Don't tap them. |
| 6 | কলেজের ভাইয়ারা | **তাল বাড়ে:** the ঢোলি speeds up mid-match; the edge says so two beats before. |
| 7 | পাড়ার ক্লাব | **মাটি কামড়ানো:** near our line they dig in and pull heavier. Keep the streak at the end. |
| 8 | **Finale: অভিভাবক দল** | Heaves, with rests and a speed-up. |
| **World 3: বাতির আলোয় ফাইনাল** (night, floodlight pools, navy sky) ||
| 9 | স্কাউট দল | **ঢোল চুপ:** the stroke and the ring fade for 4 beats in every 12. Keep counting. |
| 10 | শিক্ষকদের দল | **পিছল মাঠ:** evening dew. A tap off the beat slips twice as far, and a missed beat slips a little. |
| 11 | প্রাক্তন ছাত্ররা | **তাল বদলায়:** the drum slows, then speeds up past where it began. |
| 12 | **Finale: হেডস্যারের দল** | Everything, with longer, heavier heaves. |

## Difficulty and story
- **Modes (chips on the title, remembered on the phone):**
  - সহজ: "চাপার সময় বেশি, ওদের টান হালকা। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। ৩ তারা পেতে প্রায় প্রতি ঢোলে তালে চাপতে হবে।"
  - কঠিন: "চাপার সময় কম, ওদের টান ভারী। তারার জন্য কয়েক টান বেশি পাও।"
- **Bots (asserted in tests, 40 seeds a level):**
  - a shaky beginner (±120 ms, skips 10%) wins level 1 every time, the median in ≤ 10 s;
  - a steady player (±80 ms) wins every level of world 1 ≥ 90%, every level ≥ 50%, and the last level 50–90%;
  - a sharp player (±35 ms) wins every level and gets 3 stars on ≥ 60% of seeds;
  - a masher never gets 3 stars and does worse than the steady player.
- **Story (first run only, never on a friend's link; tap for the next panel, hold the corner 0.6 s to skip all):**
  1. "বার্ষিক ক্রীড়ার দিন। মাঠে চুনের দাগ, রশির মাঝে লাল ফিতা।"
  2. "মাইকে হেডস্যার: ‘রশি টানাটানি! হলুদ দল, মাঠে এসো।’"
  3. "ঢোল বাজলেই একবার চাপো। তালে চাপলে দল টানে, এলোপাতাড়ি চাপলে রশি ফসকায়।"

## Screens
- **Title:** the biggest thing is the ঢোল itself, drawn in code, with the rope and ribbon behind it and **খেলো** on the drumhead. Tap the drum to start. Under it: the world and level ("সকালের মাঠ · লেভেল ৩: ক্লাস সিক্স") with the level's one new thing, the three mode chips with the chosen one's line, then "সব লেভেল ★" and "দুজনে এক ফোনে". A friend's challenge sits above the drum.
- **Level list (a choice screen; nothing runs behind it):** three worlds of four, numbered ১–১২, each with the team, its one new thing and its stars. The next unplayed level is marked **এটা খেলো**. Locked rows are dim and carry a lock shape. Keys 1–9 pick.
- **HUD (corners only, in Bangla digits):**
  - top-left: the level badge and mode;
  - top-right: beats so far ("১৪ টান") and the streak chip;
  - top-centre, finales only: the team's name and its দম bar (the boss bar), flashing "হেঁইয়ো!" during a heave.
  The coaching word lives on the drum pad, never over the field.
- **Danger at the edges:**
  - the ribbon past halfway to their line: the stage edge glows red, stronger the closer it gets;
  - a heave coming: the top edge pulses red with "হেঁইয়ো আসছে";
  - a speed-up coming: an edge pill "তাল বাড়ছে".
  In slow mode these are steady borders, no pulse.
- **Feel:** a tap answers in the same frame: the drum flashes the grade's colour and shape, the team leans back, the rope snaps taut with a strain wobble, dust puffs at their feet. A slip shakes the pad gently. A perfect on a বড় ঢোল flashes the ribbon gold.
- **Rope tension:** the rope bows sideways when slack and straightens under a pull; strain ticks run along it as tension rises; a held heave shudders it.
- **Crowd:** the touchline crowd bobs harder, and its loop gets louder and brighter, as the ribbon nears either line, on a streak, and during a heave.
- **End screen (the field stays above it):** "লেভেল ৪ পার · ক্লাস টেনের দল". Stars pop with chimes, and the beat count counts up over 0.8 s. Then real stats: ঠিক তালে, চলবে, ফসকেছে, ছুটে গেছে, টানা সেরা, and on finales "হেঁইয়ো ঠেকিয়েছ ৩/৪". Then the near-miss line and three numbered choices: ১ পরের লেভেল (marked এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. On a loss: the team's name, one kind exact line, ১ আবার খেলো, ২ সব লেভেল. Keys 1–3, Enter and R work only from a fresh press after the screen appears. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the existing finish-from-the-side card; the kicker names the world and team.
- **Two on one phone:** from the title chip. The field fills the stage, each half one player's drum; both tap their half to start. The player's pause works the same.

## Sound (only `shared/game-sound.ts`)
1. **ঢোল strokes** (the signature): strong, weak, a dry rim tap for the count-in, and a deep দ্রিম on বড় ঢোল. Seen as the closing ring.
2. **হেঁইয়ো grunt** on a pull. Seen as the team leaning back.
3. **Rope creak** on a perfect pull. Seen as the rope snapping straight.
4. **Scuff** on a slip. Seen as the pad shake and a red flash.
5. **The crowd loop**, louder and higher as the ribbon nears a line. Seen as the crowd bobbing.
6. **The rival's heave call**: two low brass notes. Seen as the top-edge glow and the boss bar.

The PT whistle opens and ends each match. The win plays a short drum roll and a three-note tune pitched per world. Every note is a scheduled tone, so a pause cuts it.

## Comfort and controls
- **ধীরে খেলো:** the drum at 80% speed; no shake, flash, dust or crowd bob; steady edge borders; the count-up shows at once. The tap windows stay the same in milliseconds, so stars are no easier. For more time to tap, choose সহজ.
- **Touch:** tap anywhere on the field or the drum. Two players: each taps their own half.
- **Keyboard:** Space, Enter, ↑ or ↓ to pull; P pauses (the player's menu). Two players: A for the top, L or Enter for the bottom. Title: Enter or Space starts. End: 1–3, Enter, R.
- **Mouse:** click the field or the drum.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - Links keep `#s=&t=&l=&h=&n=`. New links add `v=2`, and `d=e|h` for a mode. A link without `v` replays the old 10-team ladder exactly (`OLD_LEVELS`), so every link already shared still plays the same team and the same pulls. Results on an old-ladder link are compared and carded but not recorded as stars.
  - `ektukhani-levels-roshi-tana` stars stay as they are (levels 1–10 carry over; no level shrinks).
  - Bests move to one JSON key per level and mode, `ektukhani-beats-roshi-tana`; the old per-level `ektukhani-best-roshi-tana-N` keys are left alone (they counted a different ladder).
  - Clearing a friend's level beyond your own unlock records its stars in `ektukhani-ahead-roshi-tana` and doesn't open the levels in between.
  - The URL, the title, the H1 and the share preview format stay. No tally.
