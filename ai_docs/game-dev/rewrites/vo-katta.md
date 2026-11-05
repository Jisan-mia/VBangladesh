# ভো-কাট্টা: rewrite design

## Core
- **Concept:** Old Dhaka's সাকরাইন. You fly your ঘুড়ি from your own roof and cut the other roofs' kites, one প্যাঁচ at a time.
- **Fantasy:** you are the kid with the নাটাই on a পুরান ঢাকার ছাদ on the last day of পৌষ. Every roof yells "ভো-কাট্টা!" when a kite falls, and by night the পাড়ার ওস্তাদ comes out.
- **Loop:** fly → hook → pull (ওড়াও → প্যাঁচ → টান). Put your string across theirs, then keep the tension in the green until their string gives.

## The kite (real wind, tension you feel)
- **One thumb.** A finger on the sky is টান: the string tightens and the kite flies where you slide (it travels a little further than the thumb, so it is never under it). Lift the finger and it is ঢিল: the string slackens, the kite sags and the wind carries it. A still tap is a short tug towards that spot.
- **Physics** (`lib/step.hot.ts`): a taut kite answers fast and climbs; a slack one is lazy, sinks and drifts downwind. The string is a curve that sags and leans with the wind and straightens as you pull. Speed, response and drift all come from the tension, so the kite feels heavy when slack and lively when taut.
- **The প্যাঁচ:** when the strings cross they hook. Your string saws hardest with the needle in the green (ঠিক টান), a little when slack (ঢিল), barely when too tight (বেশি). Moving your kite while taut rubs the strings and saws more. The tug bar along the bottom shows who is winning.
- **Feel:** the string hums higher as you pull (a loop), the string visibly straightens and shivers in the red, and the phone gives a short buzz at the hook.

## Rivals with personalities (`lib/levels.ts`, `RIVALS`)
Each has its own kite, its own rhythm and one tell you can read.
| Rival | Personality | The tell |
|---|---|---|
| **পিচ্চি** | a beginner. Floats lazily, pulls weakly, never attacks. | a small plain kite that wobbles |
| **হামলাবাজ** | comes to hook you. | it shimmies and a red arrow lights the edge on its side ("আসছে") 0.8 s before it dives |
| **ঝটকাবাজ** | yanks hard inside a প্যাঁচ. | its string glows amber 0.65 s before the yank. Give ঢিল and the yank comes to nothing. Stay tight and your string loses a big chunk. |
| **পালাই** | flies away when you come close. | it darts off; catch the low part of its string near the roof |
| **ওস্তাদ (finales)** | a named champion with a bar of সুতার জোর (3–4 notches). Each প্যাঁচ you win breaks a notch; it backs off and comes again. | its name and notches at the top centre, like a boss bar |

## Progression: 3 evenings × 4 levels (12 level numbers; old saved stars stay)
| # | পাড়া | The one new thing | Rivals |
|---|---|---|---|
| **World 1: পৌষের বিকেল** (pale blue to gold sky, pigeons, a light lean of wind) ||||
| 1 | সূত্রাপুর · প্রথম প্যাঁচ | Fly over their string, keep the needle green. First cut in about 4 s, the level in about 10 s. | পিচ্চি ×2 |
| 2 | লক্ষ্মীবাজার · হাওয়ার ঝোঁক | A steady side wind. A slack kite drifts away; hold it with টান. | পিচ্চি ×3 |
| 3 | বংশাল · হামলাবাজ | A rival that comes to hook you, with the edge arrow. | পিচ্চি, হামলাবাজ ×2 |
| 4 | **Finale: গেণ্ডারিয়া · পাশের ছাদের বল্টু** | A champion with 3 notches who charges. | পিচ্চি, হামলাবাজ, বল্টু |
| **World 2: কুয়াশার সন্ধ্যা** (purple to orange dusk, drifting fog) ||||
| 5 | তাঁতীবাজার · ঝটকা | The yank, and giving ঢিল to meet it. | হামলাবাজ, ঝটকাবাজ ×3 |
| 6 | ফরাশগঞ্জ · দমকা হাওয়া | Gusts shove your kite and jerk the string. An edge arrow warns 0.9 s before. | mixed ×4 |
| 7 | বাংলাবাজার · জোড়া ঘুড়ি | Two rival kites in the sky at once. | mixed ×4, two at a time |
| 8 | **Finale: লালবাগ · লাল বাড়ির মিনু আপা** | A champion who charges and yanks, with gusts. | ঝটকাবাজ, হামলাবাজ, মিনু আপা |
| **World 3: সাকরাইনের রাত** (navy night, stars, string lights, fireworks) ||||
| 9 | নারিন্দা · পালাই | A rival that runs; catch its string low. | পালাই ×3, হামলাবাজ |
| 10 | কলতাবাজার · ফানুস | Lanterns drift up. Touch one with your string and it tangles: no টান for a moment. | mixed ×4 |
| 11 | ওয়ারী · সব একসাথে | Two at a time, gusts and lanterns together. | mixed ×5 |
| 12 | **Finale: শাঁখারীবাজার · ওস্তাদ কালু মিয়া** | The পাড়ার ওস্তাদ: 4 notches, charges, yanks and runs, under fireworks. | পালাই, ঝটকাবাজ, কালু মিয়া |

A level ends when every rival on its list is cut (cleared) or your নাটাই runs out of kites (try again).

## Difficulty and story
- **Stars are kites kept:** none lost ৩ তারা, one lost ২, more ১. Time is a stat and the friend tie-break.
- **Modes (title chips, remembered on the phone):**
  - সহজ: "ওদের টান কম, সংকেত আসে আগে, হাতে পাঁচটা ঘুড়ি। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল সাকরাইন। একটাও ঘুড়ি না হারালে ৩ তারা।"
  - কঠিন: "ওদের হাত শক্ত, সংকেত আসে দেরিতে। হাতে তিনটা ঘুড়ি।"
- **Bots (asserted in `tests/levels.test.ts`):** a casual bot (0.33 s reaction, a wide and noisy feel for the green, misses a third of the tells) and a skilled bot (0.22 s, a tight green, reads every tell). The casual bot clears level 1 in ≤ 10 s on the median seed, clears every World 1 level on ≥ 90% of seeds and every level on ≥ 60%. The skilled bot clears every level on ≥ 95% and gets 3 stars on most. A player who never touches never clears a level; holding টান non-stop does worse than feathering everywhere and fails from the first charger on (level 3). World 3 keeps fewer casual 3-star runs than World 2, and World 2 fewer than World 1.
- **Story (first run only, hold to skip, never on a friend's link):**
  1. "পৌষের শেষ দিন। পুরান ঢাকার ছাদে ছাদে ঘুড়ি।"
  2. "পাশের ছাদ থেকে ডাক: ‘প্যাঁচ খেলবা নাকি?’"
  3. "আঙুল রাখলে টান, তুললে ঢিল। ওদের সুতার ওপর দিয়ে নিলেই প্যাঁচ।"
  A tap shows the next panel; holding 0.6 s skips all. Remembered in `ektukhani-intro-vo-katta`.

## Screens
- **Title:** your kite, drawn big on the evening's sky with its string down to the নাটাই, with **খেলো** on the paper. Tap the kite to start. Under it: the evening and level line with the level's one new thing, the three mode chips with the chosen one's line, and সব লেভেল. A friend's challenge sits on top.
- **Level select** (a choice screen, play paused): three evenings of four, numbered ১–১২ (keys 1–9), each with its name, its one new thing and its stars. The next unplayed level is marked **এটা খেলো**; locked rows are dim with a lock shape.
- **HUD (corners, a row above the sky):** top-left the level badge and your spare kites; top-centre the boss bar on a finale, otherwise one dot per rival on the list; top-right the cuts and the clock. Inside the sky only the bottom edge carries the tension meter and the tug bar, over the roofs.
- **Danger at the edges:** the sky's border glows red while a প্যাঁচ goes against you (tug below −0.4), and stays tinted on your last kite. A charge lights the edge on the rival's side with an arrow; a gust lights the edge it blows from. In slow mode these are steady borders, no pulse.
- **ভো-কাট্টা!:** a short hit-stop (the sky runs at 30% for a quarter second), the cut string snaps and both halves whip away, the rival kite tumbles downwind trailing its string, the roofs' people jump with their arms up, a pop rises from the hook, a gentle shake. A boss notch gets a smaller version. Losing your kite: it spins down, a red flash on the edge, a sad slide.
- **End screen** (slides up over the roofs): "লেভেল ৪ পার · গেণ্ডারিয়া", stars pop with chimes, the cuts count up, then real stats: time, kites lost, the quickest প্যাঁচ, the best streak, yanks met with ঢিল, gusts ridden. A near-miss line ("একটাও না হারালে ৩ তারা"). Three numbered choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল; on a loss ১ আবার খেলো comes first. Keys 1–3, Enter and R, from a fresh press only. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the rooftop card in the evening's own sky: your kite high on its string, the kites you cut tumbling, the count, the পাড়া and the stars.

## Sound (only `shared/game-sound.ts`)
1. **Wind loop:** loudness and pitch follow the wind; louder in a gust. You see the flag on your roof and the fog.
2. **String hum loop** while hooked: its pitch follows your tension. You see the meter needle and the string.
3. **Zing** at the hook. You see the ring at the crossing.
4. **Snap and the roofs' cheer** at a cut, the streak climbing in pitch. You see the snapped string and the jumping people.
5. **The tell:** a whip-crack tick for a yank or a charge. You see the amber string or the red edge arrow.
6. **Lose:** a falling slide. You see your kite spinning down and the red edge.

**Signature:** the "ভো-কাট্টা!" call, a long rising note and two short ones, on every cut and the title. **World tune:** a four-note pentatonic motif at the level start, pitched per evening (scheduled tones, so a pause cuts them).

## Comfort and controls
- **ধীরে খেলো:** the sky runs at 0.7×, the wind is calmer, no shake, no hit-stop, no flashing fireworks and steady edge borders. Stars are unchanged and still count kites kept. The design accepts that slow mode only buys reaction time, so the tells and yanks are easier to meet for someone who needs it.
- **Touch:** finger on the sky = টান and steer; lift = ঢিল; a still tap = a short tug there.
- **Keyboard:** arrows or WASD steer, hold Space for টান, Enter or Space starts from the title, 1–3 / Enter / R on the end screen (fresh press only), 1–9 in the level list, P opens the player's pause menu. Escape belongs to the player.
- **Mouse:** press and drag on the sky.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own (the old এক চাপে টান is replaced by the tap tug).
- **Kept for compatibility:**
  - Links keep `#s=&t=&n=&p=&c=&l=`. New links add `v=2`, `d=e|h` for a mode, `k` for kites lost and `m` for tenths of a second. A link without `v` is an old one: it opens the same seed on the same level number, and the friend's count shows as their claim from the old game (no compare, no stars recorded from it).
  - `ektukhani-levels-vo-katta` stars stay by level number. The old one-evening best (`ektukhani-best-vo-katta`) still migrates to level 1's stars once.
  - New: `ektukhani-times-vo-katta` (best tenths per level and mode), `ektukhani-mode-vo-katta`, `ektukhani-intro-vo-katta`, and `ektukhani-ahead-vo-katta`, so clearing a friend's far-ahead level keeps its stars without opening the levels in between.
  - The share id, `/vo-katta`, the title, description and H1 stay.
