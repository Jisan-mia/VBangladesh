# আল ধরে হাঁটি: rewrite design

## Look (decided before styling)
- **Reference:** a village হাট signboard: hand-painted ochre boards on bamboo poles, dark soil ink, hard offset shadows, small corner radii, like a board cut from wood. The field itself is the picture; the UI is the sign beside it.
- **Palette:** one per world from the art (`lib/art.ts` PALETTES: morning green, noon blue-green, afternoon straw, evening amber). Panels use the clay ridge's own colours (`--paper #ead6ab`, `--paper-edge #c9ae7c`), ink is dark soil `#2a1d10`, the accent is the paddy green `#3d6b21`, the board ochre is `#e8b23a`. No cream-and-sage default, no purple.
- **Type:** the site's own Bangla display face for names and numbers, the body face for lines. No serif added.
- **Shape and glow:** radii only small (4–8 px) except what is truly round (the slip dots, the hold dial). The only glows signal something: the edge's amber/red danger glow, the blue gust edge, the lit lamp and the fireflies. Shadows are hard offsets.
- **Icons:** drawn in SVG (`components/icons.tsx`): star, cross, arrow. No emoji.
- **What the player does first:** tap the signboard (চলো). Everything else on the title is small chips under it.

## Motion (Emil skills)
- **Gate:** frequent things stay still. Keyboard-driven screens appear without travel; press feedback is `scale(.97)` in 160 ms; entrances are `opacity + translateY(12px)` at 200–300 ms on `cubic-bezier(.23,1,.32,1)`; exits are instant.
- **Properties:** transform and opacity only (the danger glow animates the opacity of a static pseudo-element; the boss bar is `scaleX`; the end count-up writes text straight into the numbers, no React render per frame).
- **End screen choreography:** the panel is the lead (rise, 300 ms); the numbers start counting 120 ms later and settle over 800 ms with ease-out; stars pop one after another with chimes (rare, celebratory). Chips and rows don't stagger: one entrance per container.
- **Calm:** ধীরে খেলো and `prefers-reduced-motion` remove the sway, the pulse, the flap, the shake, the rise and the count-up; the streak chip becomes a plain fade.
- **Canvas:** layers (sky, paddy tile, the lantern's dark) are painted once; per frame there are no allocations and no gradients made (the lamp at the yard is two discs).

## Core
- **Concept:** you carry a tiffin of pitha to নানুবাড়ি, across twenty paddy fields on the narrow clay আল. Mud lies on both sides.
- **Fantasy:** a walk through one village day, সকাল to সন্ধ্যা. The reward at the end is a lit hurricane lamp in the yard and a plate of rice already served.
- **Loop:** দেখো → টানো → সামলাও. Read the bend, puddle or goat ahead, steer the feet to the dry lane, and steady the wobble when they drift to the edge.

## The walk (pure, in `lib/`, fixed 60 Hz step, `makeRng` only)
- The field scrolls down at the level's pace; the walker stays at one height and moves sideways only. Same seed and same input give the same walk on every phone.
- **Steering:** hold a side (half of the field, the two pads, ← → or A D) or drag a finger.
  - A press answers on the next step: the feet get a 36 px/s kick at once and reach full speed (80 px/s) in 0.08 s. A test checks that 3 steps (50 ms) after a press the feet have moved at least 2 px. The walker's lean shows the press in the same frame.
  - A drag chases the finger at up to 300 px/s.
- **Wobble (the balance):** with the feet beyond 65% of the ridge's half-width, the body tilts and the arms flap, in proportion. From level 3 the edge also pulls: a sideways push of up to `pull` px/s growing with the square of the distance past 65%. Hold the other way to recover. A near miss is the feet reaching 80% and coming back to 40% without a slip.
- **Slip:** feet past the edge, in a puddle, against a goat, or off the bamboo bridge. The man tips into the mud for 0.9 s, then stands on the dry side with 2 m of grace. Slips left: 3 (সহজ 5, কঠিন 2); the last one ends the field.
- **Old links** (no `v`) replay the old field exactly (the old ridge, puddles, goats and wind), with the old three lives and the old stars. They are compared and carded, never recorded as stars.

## Progression: 4 worlds × 5 fields (`lib/levels.ts`)
Each level adds exactly one thing and shows its intro the first time you reach it; each world ends in a named finale with a bar at the top.

| # | Name | The one new thing |
|---|---|---|
| **World 1: সকালের সবুজ খেত** (green, low sun) |||
| 1 | প্রথম আল | Hold a side or drag; keep the feet on the ridge. Wide, nearly straight. Done in about 8 s. |
| 2 | আঁকাবাঁকা আল | The ridge bends. Move before the bend. |
| 3 | কিনারের টান | The edge pulls. The wobble and the glow warn you. |
| 4 | জমা পানি | Puddles on one side. Go round on the dry side. |
| 5 | **ভোরের কাদাপথ** | Four puddles on a long ridge. |
| **World 2: পুকুরপাড়ের খেত** (noon, ponds) |||
| 6 | সরু আল | The ridge is narrower. |
| 7 | পথের ছাগল | A goat stands on the ridge. "ব্যা" warns before you see it. |
| 8 | দুপুরের তাড়া | A faster pace. |
| 9 | বাঁশের সাঁকো | A bamboo bridge over a ditch: only the middle is safe. |
| 10 | **ছাগলের পাল** | Three goats, puddles and the bridge. |
| **World 3: বাতাসের বিকাল** (gold, wind) |||
| 11 | বাতাস | A steady wind pushes sideways; streaks and a chip show which way. |
| 12 | দমকা হাওয়া | Sudden gusts. A blue arrow lights the edge 1 s before. |
| 13 | ঝিরিঝিরি বৃষ্টি | Rain: the ridge is slick, the feet slide on after you let go. |
| 14 | সাপের মতো আল | Sharp winding bends. |
| 15 | **ঝোড়ো বিকাল** | Rain, gusts, goats and puddles together. |
| **World 4: সন্ধ্যার পাকা ধান** (dusk, ripe gold) |||
| 16 | সন্ধ্যা নামছে | The dark closes in. Only the hurricane lamp lights a circle ahead. |
| 17 | ক্লান্ত পা | The feet get heavier as the field goes on (steering slows by up to 30%). |
| 18 | জোনাকির পথ | Fireflies glow over the dry lane before each puddle, goat or bridge. |
| 19 | সন্ধ্যার তাড়া | The fastest pace. |
| 20 | **শেষ আল** | Dark, tired feet, bridge, goats, puddles and gusts, to the lit yard. |

- **Stars (সাধারণ):** a dry crossing ★★★, one slip ★★, two slips ★. A field that ends on the third slip gives none. The fell card says how many metres were left and one tip from how the last slip happened.
- **Bots** (`tests/bot.ts`, asserted in `tests/levels.test.ts` over many seeds):
  - **casual:** sees its own feet 0.28 s late, aims off by up to a quarter of the ridge, picks the wrong side of one obstacle in eight;
  - **skilled:** 0.12 s late, aims within a tenth, always the right side.
  - **Targets:** the casual bot clears level 1 on at least 97% of seeds in 10 s or less; every level at least 50% (finales the hardest of their world); the skilled bot clears every level at least 90% with ★★★ at least 60%. An untouched walk clears level 1 but loses every level from 4. Holding one side always loses every level.

## Difficulty and story
- **Modes** (title chips, remembered on the phone; a friend's link plays in the friend's mode):
  - **সহজ:** "আল চওড়া, হাঁটা ধীর, কিনারের টান কম। ৫ বার পিছলানো চলে, তারা বড়জোর ২টা।"
  - **সাধারণ** (default): "আসল খেলা। ৩ বার পিছলালে খেত শেষ।"
  - **কঠিন:** "আল সরু, হাঁটা জোরে, ২ বার পিছলালেই শেষ।"
- **Story** (first run only, tap for next, hold the corner button 0.6 s to skip, never on a friend's link, remembered in `ektukhani-intro-al-dhore-hati`):
  1. "সকাল। নানুবাড়ি মাঠের ওপারে। হাতে পিঠার টিফিন।"
  2. "সোজা পথ নেই, আছে শুধু সরু আল। দুপাশে কাদা।"
  3. "আঙুল টেনে পা রাখো আলের মাঝখানে।"
- **Level intro:** reaching a level by পরের লেভেল or the list (not by the title or আবার খেলো) shows a ready card with its name, its one new thing and a small picture of it. Nothing moves until চলো. Seen intros are remembered in `ektukhani-seen-al-dhore-hati`.

## Screens
- **Title:** the biggest thing is the game's own picture: the walker from behind on the ridge, a bamboo signpost saying **চলো**. It is the start button and it sways. Under it: world · level and its one new thing, three mode chips with the chosen one's line, সব লেভেল ★ n/৬০ and the longest dry walk on this phone. A friend's challenge sits on top.
- **Level list** (a choice screen, play paused): four worlds of five, numbered ১–২০ (keys 1–9 work), name, one new thing and stars on each row, finales marked শেষ ধাপ, the next unplayed field marked এটা খেলো, locked rows dim with a lock. Opened from the title, the pause menu or the end screen.
- **HUD** (a row above the field, corners only): top-left level badge and name (the mode if not সাধারণ); top-centre on a finale its name with a bar that drains as you near the yard; top-right the metres "১২/৪০" and the slips left as small feet. A thin progress line runs along the field's top edge. The wind chip sits in the field's top-left corner.
- **Danger at the edges:** when the feet pass 65% of the ridge, that side of the field glows amber and then red, pulsing faster the nearer the mud; the walker wobbles and flaps; a creak plays. On the last slip a thin red border stays. A coming gust lights its edge blue with an arrow and "হাওয়া". In ধীরে খেলো these are steady borders with no pulse or flap.
- **Finales:** the finale's name sits in the HUD bar, never over the field. Clearing one plays the world's motif and the lamp or the yard comes into view.
- **End screen:** the kicker ("লেভেল ৫ পার · ভোরের কাদাপথ" or "তিনবার কাদায় পা পড়ল"), stars popping with chimes, the metres count up over 0.8 s, then real stats: slips, longest dry stretch, close calls, puddles and goats passed, seconds. A near-miss line ("একবারও না পিছলালে ৩ তারা"), the friend comparison, and numbered choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল; after a fall ১ আবার খেলো, ২ সহজে খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R, only from a fresh press after the screen appears. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the level's own field and light with the walker mid-ridge, the metres, the slips, the stars and the world name.

## Sound (only `shared/game-sound.ts`)
1. **Footsteps** in the walking rhythm, two feet differing. You see the stride.
2. **Squelch** (the signature): a wet ছপ and a suck. You see the mud splash and the lost foot.
3. **Creak** when the feet pass 80% of the ridge. You see the glow and the wobble.
4. **Bleat** 130 px before a goat. You see the goat arrive at the edge of the view.
5. **Whoosh** for a gust, with the wind loop on windy fields. You see the arrow and the streaks.
6. **Chimes:** a rising note every 20 dry metres; stars on the end screen. You see the "টানা ২০ মিটার" chip.

Each world opens with a 4-note motif at its own pitch (scheduled tones, so the pause cuts them). Loops stop on pause, blur, hide, the end and unmount, and are rebuilt (not kept as a muted stub) when sound or play returns.

## Comfort and controls
- **ধীরে খেলো:** the walk, the wind, the gusts and the pull run at 0.6×; the feet stay quick; no shake, flap, pulse or confetti. This does make fields easier, and the design accepts that: it is for comfort, and stars follow the same slip rule.
- **Touch:** press and hold the left or right half of the field, or drag. The pads below are gone; the whole field is the control.
- **Keys:** ← → or A D steer; Space or Enter starts and goes on (never on auto-repeat); P opens the player's pause; Escape belongs to the player. On the end screen 1–3, Enter and R, from a fresh keydown only. Keys 1–9 work on the level list.
- **Away:** blur, hide and the menu release held sides and drags, stop the clock and the loops; after চালিয়ে যাও the first 250 ms of presses only wake the game.
- **Kept for compatibility:**
  - links `#s=&t=&m=&l=&n=`; new links add `v=2` and `d=e|h`; links without `v` replay the old field;
  - saved stars `ektukhani-levels-al-dhore-hati` keep their level numbers, so what was open stays open; no migration is needed;
  - a friend's far level that you clear records its stars in `ektukhani-ahead-al-dhore-hati` and opens nothing in between;
  - the longest-dry-walk best stays in `ektukhani-best-al-dhore-hati`;
  - the tally id, `/al-dhore-hati`, the title and the H1 stay.
