# মার্বেল-সিঁড়ি: rewrite design

## Core
- **Concept:** a glass marble rolls down a Dhaka building, from the roof to the alley, ledge by ledge, while the stairs rise towards a striped awning at the top.
- **Fantasy:** the marble you found on the roof on a holiday afternoon. Your friends are playing marbles in the alley below. You get it down to them, one floor at a time.
- **Loop:** *হেলাও* (hold a side and the marble leans and gathers speed) → *গড়াও* (it rolls off the edge with its own weight) → *নামো* (land on the next ledge before the stairs carry you up).

## Physics: real weight, deterministic (`lib/step.hot.ts`)
- The marble has momentum. Holding a side accelerates it (1150 u/s² on a ledge, 750 in the air) up to 190 u/s. Letting go, grip slows it (950 u/s²), so it stops in about 20 units. In the air it keeps its speed.
- Gravity is 1500 u/s², falls are capped at 620 u/s. A landing squashes the marble and bounces it visibly in proportion to the impact; the bounce is drawn, the collision stays exact.
- The roll angle follows the distance rolled, so the swirl inside the glass turns at the right speed.
- Ledge surfaces add their own forces: a wet step barely grips, a rail slopes, a round bamboo pole pushes the marble off its crown, and a gust pushes in the air.
- Same seed, same level, same inputs → the same run on every phone (`makeRng` only, fixed 60 Hz step).
- **Fairness, by simulation:** every ledge the generator places is checked with the real step function. From the worst spots on the ledge above (each end and the middle of every safe stretch), a marble that sets off at once, at full speed or a careful half speed, must land on a safe part of the new ledge and be able to stop there before the ledge has risen one row. The check keeps 0.18 s of slack for a human hand. A floor with a row that fails is drawn again from the next random stream, so every phone still gets the same stairs. So a player who keeps pace is never trapped.

## Progression: 3 worlds × 4 floors (`lib/levels.ts`)
Each floor is a fixed number of steps ending on a full-width landing (its door mat). The landing ends the floor. Each floor teaches exactly one new thing, named on its title as "নতুন: …". Each world ends with a named finale that has its own move, its name in a bar at the top centre.

| # | Floor | Steps | Rise | The one new thing |
|---|---|---|---|---|
| **World 1: ছাদ** (afternoon sky, brick parapets) |||||
| 1 | কার্নিশ | ৬ | 44 | Hold a side, roll off the edge onto the ledge below. Won in under 10 s. |
| 2 | কুড়ানো মার্বেল | ১০ | 50 | Small marbles on the ledges. Every 5th gives back a lost chance. |
| 3 | ক্যাকটাসের টব | ১২ | 54 | Clay cactus pots at a ledge's end: that end is closed, roll the other way. |
| 4 | **দমকা হাওয়া** (finale) | ১৬ | 58 | Laundry on a ledge flaps the way the next drop will drift. Gusts push the falling marble. |
| **World 2: সিঁড়িঘর** (warm plaster, a barred window) |||||
| 5 | মোছা সিঁড়ি | ১৪ | 64 | Freshly mopped steps: the marble slides on after you let go. |
| 6 | রেলিং | ১৪ | 68 | Sloping rails: the marble rolls downhill on its own. |
| 7 | ভাঙা ধাপ | ১৬ | 72 | Cracked steps shake and fall a second after you land. |
| 8 | **লোডশেডিং** (finale) | ২০ | 76 | The lights go out. A হারিকেন glow around the marble lights the next ledges. |
| **World 3: বাঁশের ভারা** (dusk scaffolding, then the alley at night) |||||
| 9 | গোল বাঁশ | ১৬ | 74 | Round bamboo poles: the marble won't sit still on the crown. |
| 10 | বাঁশের ফাঁক | ১৮ | 74 | Gaps between planks: a quick way down, if you aim. |
| 11 | তাড়া | ২০ | 74 | Three-row stretches where the stairs rise 1.25× faster, on shorter ledges. The awning flashes before each one. |
| 12 | **গলির গর্ত** (finale) | ২৬ | 76 | All of the scaffolding at once, then the alley. The marble rolls into the friends' marble hole. The building is done. |

- **Stars:** reach the landing with no chance lost for ★★★, one lost for ★★, more for ★. The mode changes only how many chances you have, never the stars.
- **Colours:** nine glass marbles. Floors 1, 3, 4, 6, 7, 9, 10 and 12 each open one on their first clear. The finish screen shows the new marble, already in hand, and the title's swatch row switches between open ones.
- **Bot targets (`tests/levels.test.ts`, 40 seeds a floor; `tests/bot.ts` plays the real step):**
  - a **perfect** planner (the fairness probe, no reaction time) clears every floor, with ★★★ on at least 90% of runs;
  - a **casual** bot (0.4 s reaction, ±12 aim error in the air, a wrong-side slip on 12% of drops and a 0.7 s dawdle on 20%) clears floor 1 every time in under 10 s (6.9 s on average) and every floor at least 85% (measured 95–100%). Its ★★★ falls from at least 80% on floor 1 (100%) to at most 65% on floor 12 (58–63%);
  - the same bot on **কঠিন** clears each finale at 35–85% (72%, 50%, 60%), always below its world's first floor (100%, 78%, 88%);
  - a **sharp** bot (0.22 s, ±4) on কঠিন clears every floor at least 60% (measured 65–100%).
- **The camera follows a quick way down:** a marble that drops faster than the stairs rise pulls the view down with it, so it stays at most 45% down the board. Diving is rewarded with time, and the awning is the only edge that bites.
- **Unlocks:** your own unlock (`ektukhani-unlock-marble-sinri`) rises only when you clear the furthest open floor. A friend's far-ahead floor records its stars and opens nothing in between.

## Difficulty and story
- **সুযোগ (title chips, remembered):** the floor itself never changes, so a friend's link is the same stairs on every mode.
  - **সহজ:** "৫টা সুযোগ। কয়েকবার পড়লেও তলা পার হওয়া যায়।"
  - **স্বাভাবিক** (default): "৩টা সুযোগ। তিনবার পড়লে আবার শুরু।"
  - **কঠিন:** "১টা সুযোগ। একবার পড়লেই শেষ।"
- **Story (first run only, tap for the next panel, hold 0.6 s to skip):** three lines over the live roof:
  1. "ছুটির দুপুর। ছাদের কার্নিশে একটা কাচের মার্বেল।"
  2. "নিচে গলিতে বন্ধুরা মার্বেল খেলছে, গর্ত খোঁড়া হয়ে গেছে।"
  3. "ছাদ থেকে গলি পর্যন্ত গড়িয়ে নামাও। ওপরের সামিয়ানায় ঠেকো না।"
  It never shows on a friend's link or on আবার (`ektukhani-intro-marble-sinri`).

## Screens
- **Title:** the floor's top ledges are drawn behind, dimmed. The biggest thing is a code-drawn glass marble on a step with **গড়াও** under it. Under it, small:
  - ‹ floor N · name › and its "নতুন: …" line;
  - the three সুযোগ chips, with the chosen one's line;
  - the open marbles as swatches;
  - **সব তলা ★ n/৩৬**.
  A friend's challenge sits on top.
- **Choice moment, সব তলা:** a sheet over the stage that pauses a floor in progress. It shows three worlds of four, numbered ১–১২ (keys 1–9, 0, -, =). Each row has its name, its one new thing and its stars. Locked rows show a lock shape. The recommended floor wears **এটা খেলো**. The HUD's floor badge opens it.
- **HUD, in the corners (drawn on the canvas, except the badge):**
  - top-left: the floor badge (it opens সব তলা);
  - top-centre: a finale's named bar, filling as you go down;
  - top-right: the chances as glass dots, the picked marbles under them, and "টানা ৩" when a streak runs;
  - the top edge: a thin line filling with the steps;
  - the bottom edge: a pointer to the landing, "নিচে: দরজা · ৪ ধাপ", once it is close.
  The middle stays clear. A "+১" pop sits beside a picked marble for half a second.
- **Danger at the edge:**
  - near the awning: a red wash fades in under it as the marble gets close;
  - the last chance: the whole border glows orange, pulsing (a steady border in ধীরে খেলো);
  - a lost chance: one short red edge pulse and a gentle shake;
  - a gust: chevrons at the edge it blows towards, and the laundry flaps;
  - a surge: the awning's stripes flash amber a second ahead.
- **Finales:** the named bar sits top-centre. The finale's move is announced at the edge (chevrons, the flicker before the lights go out, the awning's flash), never with a banner.
- **End:**
  - over the dimmed board: the heading ("চিলেকোঠা পার" / "তিনটা সুযোগই শেষ"), then the stars one by one;
  - the stats counting up: ধাপ N/M, সময়, মার্বেল কুড়ানো, পড়েছ;
  - the exact near-miss line ("একবারও না পড়লে ★★★", "আর ৩ ধাপ নামলেই দরজা");
  - a new marble, when one opened;
  - numbered choices: ১ পরের তলা (এটাই ভালো), ২ আবার, ৩ সব তলা. Keys need a fresh press 0.7 s after it appears.
  - **ছবি বানাও ↓** scrolls the stage to the card.
  The last floor ends with the alley: the marble rolls into the hole, and the heading reads "ছাদ থেকে গলি, পুরো বাড়ি পার". Its stats are for the whole building: তারা n/৩৬ and the floors with ★★★.
- **Card:** the stairs in the floor's world colours, the marble mid-roll in your colour, the floor's name and stars, the time, and the line "তুমি কত তাড়াতাড়ি নামবে?". An old link's card keeps the old steps format.

## Sound (`shared/game-sound.ts` only)
1. **Signature:** glass touching glass, a ting that climbs with each marble picked in a row.
2. Landing: a dry টক, lower and louder the harder the marble lands (the weight you hear).
3. The roll: a hum loop whose pitch and volume follow the marble's speed. It stops on pause, the end, a hidden tab and unmount. It comes back as a new loop when sound turns on, never a muted stub.
4. Cactus: a little "উফ" and a thud. The awning: a flat buzz.
5. World sounds: a gust's whoosh, a cracked step's crack, the lights' click, and the surge's whistle.
6. Floor clear: the landing's door bell, then the world's three-note call. All are scheduled `tone()`s, so a pause cuts them.

Every sound has a visible twin: the squash, the "+১" pop, the streak badge, the edge pulse, the chevrons, the cracks, the awning flash.

## Comfort and controls
- **ধীরে খেলো:** the stairs and the marble run at 0.75× together. There is no shake, flicker, pulse, bob or confetti; the danger edge is a steady border; the count-up shows at once. This makes ★★★ easier for players who need it, and the design accepts that, as কালবৈশাখী আম does.
- **Touch:** hold the left or right half of the stage (sliding across the middle switches). The bottom strip shows two big ◀ ▶ zones.
- **Keys:** ← → or A D. Space or Enter starts and takes the end screen's ১ (fresh press only). 1–3 on the end screen. 1–9, 0, -, = in সব তলা. P opens the player's menu (`requestPause`). Escape belongs to the player.
- **Mouse:** the same as touch.
- **Away:** blur, a hidden tab, scrolling away, or any choice screen stops the stairs, the hum and the input. The marble waits half a second after a resume. The first tap after coming back only resumes. Celebration timers clear on every new run, choice and unmount.
- **Kept for compatibility:**
  - Old links `s t l m c n` (an endless staircase from old stage 1–8) still parse. They replay the exact old staircase from the old generator, kept bit for bit in `lib/legacy.ts` (a fingerprint test pins it). They play with the old instant feel until the chances run out, and they compare steps. New links add `v=2` and `w=1..12` (the floor), with `t` as tenths of a second, plus `h` (falls).
  - The old 8-stage stars in `ektukhani-levels-marble-sinri` migrate once into the 12-floor ladder (`ektukhani-levels-marble-sinri-floors`), and nobody loses an open floor or colour. `ektukhani-marble-sinri-colour` and the old per-stage bests (used by old links) stay.
  - `/marble-sinri`, the share id (no tally), the title, the description and the H1 stay.
