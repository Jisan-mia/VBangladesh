# সাত চাড়া: rewrite design

## Core
- **Concept:** the গলি's seven-stone game on a phone: pull the red ball back, let go, and the pile goes খটাখট.
- **Fantasy:** you're the kid with the best throw in the পাড়া. From the alley to the school field to নানুবাড়ির উঠান, every place has someone's pile to beat, and in the courtyard the other side fights back: টুনি stacks the fallen pieces again and মিঠু jumps to catch your ball.
- **Loop:** টানো → ছাড়ো → খটাখট. Pull back to aim (the dots show the path), let go, and watch the pile answer.

## The physics (pure, `lib/`, fixed 60 Hz in four substeps)
- The same tuned topple model as before, moved to `lib/physics.hot.ts` with no allocation. A standing stone never moves until something knocks it or its support goes; a knocked stone flies as a spinning box with its own weight; a stone that comes to rest is frozen flat. The same throw on the same pile always ends the same way.
- **Weight:** every stone has a mass. A ভারী চাড়া (a thick piece of a কলসির কানা) is twice as heavy: it needs a harder ball to knock, it flies shorter and it lands with a thud. A stone that loses its footing tips over the open edge, faster the higher it sat.
- **New pieces in the lane:** কাদা (a muddy stretch that stops a rolling ball dead), দড়ি (a clothesline that catches a high lob), জলচৌকি (a stool the pile sits on, so pieces fall off both sides), and the courtyard cousins:
  - **টুনি সাজায়:** after a ball settles, টুনি waits 0.9 s, then puts one fallen piece back every 0.75 s, bottom first, until you throw. Throw sooner and less goes back.
  - **মিঠুর পাহারা:** মিঠু stands in front of the pile and hops every 1.6 s. A ball that meets him is caught (in real সাত চাড়া a catch puts the thrower out): that ball is gone.
- The world keeps one clock that runs while you aim too, so মিঠু's hop and টুনি's stacking are part of the deterministic simulation: the same throw at the same moment ends the same way.

## Progression: 3 worlds × 5 levels
Each level teaches one new thing; each world ends in a named finale with a rival's record.

| # | World · level | The one new thing |
|---|---|---|
| **গলির মোড়** · afternoon alley (cream wall, brick lane) |||
| 1 | প্রথম চাড়া | Pull back, let go. A near-ish pile that a flat throw takes whole. Won inside 10 s. |
| 2 | গোড়ায় লাগাও | The pile is close: a hard straight throw hits the top, so aim at the base. |
| 3 | পিরামিড | A wide pyramid: hit the bottom row, because a high hit takes only the top. |
| 4 | দুই ঢিবি | Two piles: a low, hard roll through the first reaches the second. |
| 5 | **বল্টু ভাইয়ের চাড়া** (finale) | Three small piles down the lane, the last at the very end. বল্টু ভাই's record is 2 balls. |
| **স্কুলের মাঠ** · tiffin break (blue sky, green field) |||
| 6 | বারান্দার সিঁড়ি | The pile on the veranda step: aim higher. |
| 7 | বৃষ্টির কাদা | Mud before the pile: a rolling ball stops. Hit it on the fly. |
| 8 | ইটের আড়াল | A brick in front: lob over it. |
| 9 | কলসির কানা | Heavy pieces at the bottom: throw hard. |
| 10 | **দপ্তরি চাচার বারান্দা** (finale) | A tall brick, the step and a heavy base, before the bell. His record is 2 balls. |
| **নানুবাড়ির উঠান** · dusk courtyard (warm clay, tin roof) |||
| 11 | দড়ির গামছা | The clothesline catches a high lob: throw flatter, under it. |
| 12 | টুনি সাজায় | টুনি stacks fallen pieces back while you aim. Throw sooner. |
| 13 | জলচৌকি | The pile on a stool: pieces fall off both sides. |
| 14 | মিঠুর পাহারা | মিঠু hops in front and catches. Throw while he's down. |
| 15 | **ঈদের বিকেল** (finale) | টুনি and মিঠু together, under the clothesline. Their record is 2 balls. |

**Stars:** all seven down with 1 ball ★★★, with 2 ★★, with 3 ★. A finale's ★★★ beats the rival's record.

**Bots (`tests/bot.ts`, asserted in `tests/levels.test.ts`):** a person aims at the bottom of the nearest standing piece and picks an arc that clears what's in the way; then their hand adds an error.
- **random:** any angle 0–60°, any power. It stands for "throwing without aiming".
- **casual:** takes the flattest clear arc; 2° and 5% hand error; 2.4 s to aim.
- **skilled:** tries the clear arcs it knows and picks the best one; 1° and 2.5% error; 1.6 s to aim, less where টুনি stacks.
- **Targets (asserted):**
  - level 1: casual ≥ 95%, ★★★ on at least 60% of runs, median under 10 s; even random throws clear it ≥ 30% of the time;
  - random throws clear no later level more than 35% of the time, and a finale at most 15%;
  - skilled clears every level ≥ 80% and earns at least the casual stars; casual clears every non-finale level ≥ 75%, a finale 45–90%;
  - each finale is its world's hardest level for the casual bot, and the stars inside a world never jump back up by more than 0.35;
  - সহজ is really easier for the casual bot than ওস্তাদ, world by world.

## Difficulty and story
The difficulty is how much of the path the dots show. Stars follow the same rules everywhere; the end screen and the card name it.
- **সহজ:** "পুরো পথ দেখায়, কোথায় লাগবে তাও।" The dots run to where the ball first lands or meets something.
- **মাঝারি (default):** "পথের প্রথম অর্ধেক দেখায়।"
- **ওস্তাদ:** "শুধু শুরুর কয়েকটা ফোঁটা।"

**Story:** no panels. The first pile should fall within 10 seconds; the three places and the named finales carry the story. Each world opens with its one-line scene on the title.

## Screens
- **Title:** the place sits behind. The biggest thing is the pile of seven চাড়া with the red ball, drawn in code, with **খেলো** on it. Under it, small: "গলির মোড় · লেভেল ৩: পিরামিড", the level's one new thing, "★★★ এক বলে", the difficulty chips (১ সহজ · ২ মাঝারি · ৩ ওস্তাদ) with the chosen one's line, and সব লেভেল ★ n/৪৫. A finale shows its rival and record. A friend's challenge sits on top.
- **Level list (a choice screen, play paused):** three worlds of five, numbered, each row with its name, its one new thing and its stars; finales marked শেষ ধাপ; the next level to play marked এটা খেলো; locked rows dim with a lock. Keys 1–9.
- **HUD (a row above the lane, never on it):** top-left the level badge; top-centre in a finale the rival's record ("বল্টু ভাই · ২ বল"), or টুনি's stacking bar while she works; top-right the balls left as ball icons and the pieces down ("৫/৭"). A thin line along the lane's top edge fills with pieces down.
- **Danger at the edges:** the last ball lights the lane's edge orange (a still border in ধীরে খেলো). While টুনি stacks, the lane's right edge glows.
- **Juice:** dust where a piece lands, the pile shivers when a ball just grazes it, the counter pops, a short hit-stop on the first knock, a shake that grows with the pieces in one ball, and "সাতটাই!" rising from the pile when all seven go in one ball. ধীরে খেলো drops the shake, hit-stop and shiver.
- **Finale:** the rival's name and record in the HUD, the badge says শেষ ধাপ, and a ★★★ plays the world's horn line and confetti.
- **End screen:** a slip rises over the lane.
  - The kicker ("লেভেল ৩ পার · পিরামিড", or "তিনটা বলই শেষ") and the one-line scene.
  - The stars pop in with chimes (scheduled tones).
  - Stats count up over 0.8 s (instant in ধীরে খেলো): বল, প্রথম বলে পড়ল ক/৭, সবচেয়ে দূরে ছিটকাল ন হাত, plus মিঠু ধরেছে and টুনি সাজিয়েছে where they appear.
  - The near-miss line, then numbered choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. Enter, R and 1–3 work from a fresh press only.
  - "কার্ড বানাও ↓" scrolls inside the stage to the card.
- **Card:** the place after the throw, the seven pieces scattered, "৭টা চাড়া এক বলে ★★★", the level's name, and the difficulty if it isn't মাঝারি.

## Sound (only `shared/game-sound.ts`)
1. **খট (signature):** clay pieces clattering, a dry click that shifts pitch per piece; a heavy piece lands as a low thud.
2. **Thwack:** the rubber ball meeting clay.
3. **Bounce / ধপ:** the ball on the ground, a dull ধপ in mud.
4. **The pull's hum:** a loop that rises with the power. It plays only while you pull on the lane with sound on, and stops on let go, pause, blur, hide, the end and unmount. Turning sound on mid-pull brings it back.
5. **Catch:** a palm's slap when মিঠু catches; **টুক** for each piece টুনি puts back.
6. **The miss:** a far-off dog, also written in the line under the lane.
Plus the kit's combo notes as pieces fall, the stars' chimes, and a short horn line on a finale clear. Every sound has a picture: the dust, the counter, the ball icons, the caught ball held up, the stone lifting back, the line.

## Comfort and controls
- **ধীরে খেলো:** the same fixed steps, fewer each second (0.55×), so a throw ends exactly the same. The direction sweep and power meter of the tap path, মিঠু's hop and টুনি's stacking slow down with it, as an access setting; stars keep the same rules. No shake, hit-stop, shiver, confetti or pulsing edge.
- **Touch and mouse:** pull back anywhere on the lane and let go (bring it back near the start to cancel). A still tap is the two-tap path: the first tap fixes the sweeping direction, the second throws at the swinging power. The press acts on pointer-down; the first tap after a pause only wakes the game.
- **Keyboard:** ↑↓ direction, ←→ power, Space or Enter throws (a fresh press, never a held key's repeat). P opens the player's pause. On the title, Enter starts and 1–3 pick the difficulty. On the end screen, 1–3, Enter and R from a fresh press only. Escape belongs to the player.
- **Away:** blur, hide and the menu drop the pull and the hum, freeze the flight, the clock, মিঠু and টুনি. Opening সব লেভেল pauses too.
- **Kept for compatibility:**
  - `/sat-chara`, its title, H1 and description wording rules; no tally.
  - Old links `#s=&t=&l=&n=` (30 old levels, `s` = that level's seed) still parse and open the friend's exact old pile as a one-off round; it's compared and carded, never recorded as stars. New links add `v=2`, `c` (the level, 1–15) and `d` (difficulty, when not মাঝারি).
  - `ektukhani-levels-sat-chara` is migrated once to the new numbers (old 1–2 → 1, 3–4 → 2, … 29–30 → 15, best stars kept), marked by `ektukhani-sat-chara-v2`.
  - A new own-unlock key `ektukhani-sat-chara-open`, migrated once from the unbroken run of cleared levels, so a friend's far level cleared out of order records its stars without opening the levels in between.
  - The difficulty is kept in `ektukhani-sat-chara-hand`.
