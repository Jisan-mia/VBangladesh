# স্যার ঘুরলেই থামো: rewrite design

## Core
- **Concept:** red-light-green-light in a Bangladeshi classroom. Pass the chit to your friend on the last bench while the teacher's back is turned.
- **Fantasy:** you are the middle row's postman. The chalk scratches, the fan turns, a note says "টিফিনে ঝালমুড়ি?", and every time the chalk stops your heart stops with it.
- **Loop:** watch → hold → freeze. Watch the chalk hand, hold to pass the chit bench to bench, let go the moment the hand comes down.

## The readable tell
One rule carries every level: **the chalk hand.** While it moves on the board, pass. When it comes down, a turn is coming; the screen edge glows orange and two footsteps sound. When the teacher faces the class, the edge goes red. Every later trick is a twist on the hand: a head that turns while the hand stays up is not a turn, and a teacher who turns back without raising the chalk is about to look again.

## Progression: 3 classes (worlds) × 4 periods (12 levels)
Each level adds exactly one thing. The 4th period of each class is its named finale: a second pair of eyes, a top-centre bar with its name, and three chances (the third catch and the chit goes to the teacher's table).

| # | Level | The one new thing | Benches |
|---|---|---|---|
| **ক্লাস থ্রি · সকালের ক্লাস** (cream walls, mint dado, sunny field in the window) ||||
| 1 | চক চললে চালাও | Hold while the chalk moves; let go when the hand comes down. Long, slow tells. Won in ~7 s. | 5 |
| 2 | খুক খুক | The cough: hand to the mouth, back still turned. Keep passing. | 6 |
| 3 | শুধু মাথা ঘোরানো | The head turns but the chalk hand stays on the board: not a turn. | 6 |
| 4 | **Finale: ক্যাপ্টেন মিলি** | The class captain on the front bench turns round to check; she straightens first. | 7 |
| **ক্লাস সিক্স · দুপুরের অঙ্ক** (peach walls, terracotta dado, white-hot sky) ||||
| 5 | চশমা মোছা | The teacher turns, but takes the glasses off to wipe them: blind. Pass until they go back on. | 7 |
| 6 | ডাস্টার | The board fills and the duster sweeps it. When the sweep ends, the turn comes quick. | 7 |
| 7 | ঘুমন্ত বন্ধু | A sleeping classmate: the chit is thrown over him, and a throw can't be stopped. Throw right after the teacher starts writing. | 8 |
| 8 | **Finale: দরজায় হেডস্যার** | Footsteps in the corridor, a shadow on the door glass, then the headmaster looks in. | 8 |
| **ক্লাস নাইন · বৃষ্টির শেষ পিরিয়ড** (blue-grey walls, rain on the window, a tube light) ||||
| 9 | লোডশেডিং | The lights go out: nobody sees in the dark. When the tube light flickers, it's coming back. | 8 |
| 10 | দুবার তাকানো | After a look, if the chalk hand doesn't rise, a second look is coming. | 8 |
| 11 | চট করে ঘোরা | The hand comes down and the turn is half as long. | 8 |
| 12 | **Finale: হেডস্যারের ক্লাস** | The headmaster takes the last period himself, with every trick of the day. | 8 |

Levels keep the things taught before them at lower rates, so each class feels like a real day.

**Stars:** reaching the last bench is 1. Every class is seeded, and two headless classmates set its times: a careful one (sees a change 0.25 s late, stops at every warning) and a daring one (holds on into each warning for as long as that class's shortest one allows, then stops). Three stars is the daring time plus 0.5 s; two stars is a slower careful classmate's (0.35 s) time plus 1 s, so every careful player earns two. A finale lost on the third catch is 0. Easy tops out at two.

**Bots (asserted in `tests/levels.test.ts`, 40 seeds a level unless noted):**
- careful at 0.25 s and 0.35 s: never caught, in every mode, on every level; the daring one is never caught either and earns 3 stars by definition; careful earns at least 2.
- casual (0.3–0.45 s, sometimes holds 0.12–0.3 s into a warning, mistakes half the peeks and glasses, throws whenever it reaches a sleeper): clears level 1 with a median of 7.6 s (asserted ≤ 10 s, worst ≤ 14 s), clears every ordinary level, wins finales at 90% or better, and averages at most 0.5 catches on an ordinary level.
- slow human (0.5 s and up, 100 seeds): wins ordinary levels at 98% or better, finales 1 and 2 at 95% and 90%, and the headmaster's class (finale 3) between 40% and 92% (74% measured).
- reckless (never lets go): wins every ordinary level, at 1.25 times the careful time or slower, earns three stars on no more than 3% of runs, and wins no more than 30% of finales (measured: 0%, 5%, 7.5%).

## Difficulty and story
- **Modes (chips on the title, remembered on the phone):**
  - সহজ: "স্যার ঘোরার আগে অনেকক্ষণ থামেন। তারা বড়জোর ২টা।" (warnings ×1.4, a longer grace)
  - সাধারণ (default): "আসল ক্লাস। ৩ তারা পেতে শেষ মুহূর্ত পর্যন্ত চালাতে হবে।" (careful play earns 2 stars; 3 asks you to ride each warning to its edge)
  - কঠিন: "ঘোরার আগে থামা ছোট, তাকানো লম্বা। তারার সময়ও সেভাবে মাপা।" (warnings ×0.85, looks ×1.15)
- **Story (first run only, never on a friend's link; tap for the next panel, hold the corner 0.6 s to skip all), drawn with the real classroom renderer:**
  1. "সকালের প্রথম পিরিয়ড। স্যার বোর্ডে লিখছেন, পুরো ক্লাস চুপ।"
  2. "সামনের বেঞ্চ থেকে চিরকুট এল: ‘টিফিনে ঝালমুড়ি?’ পৌঁছাতে হবে শেষ বেঞ্চে।"
  3. "চক চললে চিরকুট চালাও। হাত নামলেই থামো।"

## Screens
- **Title:** the biggest thing is a folded exercise-book chit, drawn in code, with **খেলো** in blue pen and the board behind it. Under it: the class and level ("ক্লাস থ্রি · লেভেল ২: খুক খুক") with its one new thing, the three mode chips with the chosen one's line, then "সব লেভেল ★ ৭/৩৬" and the one-tap chip ("এক চাপে চলা-থামা"). A friend's challenge sits above.
- **Level list (a choice screen; play is frozen behind it):** three classes of four, numbered ১–১২, each with its one new thing and its stars. The next to play is marked **এটা খেলো**; locked rows are dim with a lock shape. Keys 1–9 pick.
- **HUD (a row above the classroom, never on it, Bangla digits):** top-left the level badge and mode; top-centre on finales only the watcher's name and three chance pips; top-right the clock and a bench progress bar.
- **Danger at the edges:** a turn coming (the hand down, the captain straightening, the door shadow, the tube light flickering, the duster's last stroke) glows the classroom's edge orange, stronger as the look nears. Being watched is a red edge, thicker if the chit is moving. In ধীরে খেলো the edges are steady borders with no pulse.
- **Feel:** a press answers on the same frame (the button sinks, the chit lifts, the paper rustles); each bench rings one note higher; a stop in the last 0.35 s before a look floats a small "উফ!" beside the chit with a soft whistle; a catch is the raised eyebrow, a ruler knock, a gentle 0.2 s shake and the chit sliding back one bench.
- **Finales:** the watcher's name and pips at the top centre; the third catch ends the period ("চিরকুট গেল হেডস্যারের টেবিলে").
- **End screen (the classroom stays above, the chit opened with the friend's reply):** "লেভেল ২ পার · খুক খুক", stars pop with chimes, the time counts up over 0.8 s, then real stats: ধরা পড়েছ, অল্পের জন্য বেঁচেছ, ভুয়া ঘোরায় চালিয়েছ (levels with fakes), ছুড়ে দেওয়া (levels with sleepers), chances left (finales). Then the near-miss line, and numbered choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R work only from a fresh press after the screen appears.
- **Card:** the blackboard card with the time in chalk and the opened chit on the desk; the kicker now names the class and level.

## Sound (only `shared/game-sound.ts`)
1. **The school bell** (the signature): two clangs open each period; a quick run of clangs, then a three-note tune pitched per class, on a clear.
2. **Chalk scratch** while the hand writes. Seen as the chalk line growing.
3. **Two footsteps** as the hand comes down. Seen as the hand and the orange edge.
4. **Paper rustle and a rising note** per bench reached. Seen as the chit hopping and the bench bar filling.
5. **The chit's hum**, a soft tone that climbs while the chit moves (the only loop). Seen as the chit wobbling.
6. **The catch:** a ruler knock and a low buzz. Seen as the eyebrow, "এইদিকে তাকাও!" and the shake.

Element cues, each with a visible twin: the cough, the glasses squeak, the duster swish, a snore for the sleeper, the corridor footsteps, the power going down and the tube light's buzz. Every timed note is a scheduled `tone()` so the player's pause cuts it.

## Comfort and controls
- **ধীরে খেলো:** no shake, no edge pulse, no bobbing, no fan spin, no confetti, the count-up shows at once. The class runs at its normal speed, so stars are no easier; for more time to react, choose সহজ.
- **Touch:** hold anywhere on the classroom or the big button. One-tap mode (a title chip): one tap starts the chit, the next stops it.
- **Keyboard:** hold Space, Enter or ↓; P opens the player's pause menu. Title: Enter or Space starts. End: 1–3, Enter, R.
- **Mouse:** hold the classroom or the button.
- Pause, sound and ধীরে খেলো live in the player's menu (with সব লেভেল via `onLevels`); the game has none of its own. The big pass button fills the space under the classroom, a thumb-sized pad that names what to do and why in words as well as colour.
- **Away:** blur, hide and the menu stop the clock and the routine, let go of the chit (in one-tap mode too) and stop the hum; চালিয়ে যাও gives a 0.5 s breath before the routine moves, and the chit waits for a fresh press.
- **Kept for compatibility:**
  - Links keep `#s=&t=&c=&l=&n=`. New links add `v=2` and `d=e|h` for a mode. A link without `v` replays the old ten-class ladder exactly (the old generator is kept in `lib/legacy.ts`, fingerprint-tested), with the old 8 benches and speed. Old-ladder results are compared and carded but never recorded as stars.
  - `ektukhani-levels-sir-ghurlei-thamo` stars stay as they are (classes 1–10 carry over as levels 1–10; nothing shrinks). The one-time move of an old best time (`ektukhani-best-sir-ghurlei-thamo` opens 1–6) still runs once.
  - Bests move to one JSON key, `ektukhani-times-sir-ghurlei-thamo`, per level and mode; the old per-class best keys are left alone.
  - Clearing a friend's level beyond your own unlock records its stars in `ektukhani-ahead-sir-ghurlei-thamo` and doesn't open the levels in between.
  - The URL, the share id, the title and the H1 stay. The description changes "৮ বেঞ্চ" to the three classes and twelve levels.
