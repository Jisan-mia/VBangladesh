# পেনাল্টি কিক: rewrite design

## Core
- **Concept:** a পাড়ার দল's penalty shoot-outs, from the school field to the national stadium. You take every kick and you keep every kick.
- **Fantasy:** the kid everyone on the boundary wall is watching. You read the keeper, you read the kicker, and the whole পাড়া roars.
- **Loop:** read → swipe (or dive) → roar. Read the tell, act on it, hear the crowd answer.

## Progression: 4 cups (worlds) × 3 rounds = 12 matches
Each cup is a tournament: প্রথম রাউন্ড, সেমিফাইনাল, ফাইনাল. Each match teaches exactly one new thing, and each cup ends in a named final.

| # | Name | Opponent | Format | The one new thing |
|---|---|---|---|---|
| **পাড়ার কাপ** · school field, afternoon (cream sky, kids on the wall) |||||
| 1 | প্রথম শট | আমতলা একাদশ | you take 3 | Swipe from the ball towards the goal. A sleepy keeper. 1 goal clears, 3 goals = 3 stars. |
| 2 | এবার তুমি কিপার | পুকুরপাড় সংঘ | they take 3 | Keeping: the kicker leans early, and always the way he shoots. Stop 1 to clear. |
| 3 | **ফাইনাল: পাড়ার ফাইনাল** | কলপাড় একাদশ | 3 each, then sudden death | Taking turns: a real (short) shoot-out. |
| **থানা কাপ** · thana ground at dusk (orange sky, tin roofs, a bank of people) |||||
| 4 | পাঁচ শটের টাইব্রেকার | বটতলা কিশোর সংঘ | 5 each | The full five kicks each. |
| 5 | কিপারের ঝোঁক | হাটখোলা ক্লাব | 5 each | Their keeper leans the way he means to dive. Shoot the other way. |
| 6 | **ফাইনাল: থানার ফাইনাল** | রেলগেট একাদশ | 5 each | The kicker's lean comes late, just before the kick. |
| **জেলা কাপ** · district stadium under floodlights (indigo night, concrete stands) |||||
| 7 | ধোঁকা | ইটভাটা সংঘ | 5 each | The shoulders can lie. The planted foot never does, and it shows a beat before the kick. |
| 8 | নদীর বাতাস | নদীপাড় ক্রীড়াচক্র | 5 each | Wind. The corner flag shows it; it pushes a soft shot more than a hard one. |
| 9 | **ফাইনাল: জেলার ফাইনাল** | জেলা স্কুল একাদশ | 5 each | লম্বা কিপার: a tall keeper who reaches everything but the corners. |
| **জাতীয় কাপ** · national stadium (green night, packed stands, flags) |||||
| 10 | রেফারির তাড়া | বন্দর একাদশ | 5 each | A shot clock: 5 seconds to kick, the edge glows as it runs out; at zero you scuff it. |
| 11 | জাতীয় সেমিফাইনাল | চরপাড়া একাদশ | 5 each | The kicker watches you. Move before his lean shows and he shoots the other way. |
| 12 | **ফাইনাল: জাতীয় ফাইনাল** | সাগরপাড় একাদশ | 5 each | Everything at once: a leaning keeper, late lies, wind, the clock, a watching kicker. |

**Stars:** a 3-kick drill gives a star per goal (or per kick kept out). A shoot-out gives stars by margin: 1 goal → 1, 2 → 2, 3 → 3.
**Bots (tests):** a casual bot (0.3 s reactions, wide aim, ignores the keeper and the foot, picks early sometimes) and a strong bot (reads every tell after 0.25 s, aims at corners, allows for wind). Targets: casual clears match 1 ≥ 97 % and every পাড়ার কাপ match ≥ 85 %; each later final 25–85 % casual; strong ≥ 80 % on every match.

## Difficulty and story
- **The ladder is the difficulty.** One comfort mode in the player's menu:
  - **স্বাভাবিক:** the run-up takes 1.6 s, the clock gives 5 s.
  - **ধীরে খেলো:** everything runs at 0.6× (a 2.7 s run-up, the meter swings slower, the clock gives 8 s), no shake, no slow-motion, no flashing. Stars stay the same rules. By design ধীরে খেলো does make reading tells easier: it's an access setting, and the card never says which mode was used.
- **Story (first run only, hold to skip):**
  1. "বিকেলের স্কুলমাঠ। বাঁশের গোলপোস্ট, মাছ ধরার জাল।"
  2. "পাড়ার দলের কিপার জ্বরে কাবু। শট নেবে তুমি, ঠেকাবেও তুমি।"
  3. "পাড়ার কাপ থেকে জাতীয় কাপ। দেয়ালে বসা সবাই তোমাকে দেখছে।"
  A tap shows the next panel; holding 0.6 s skips all three. It plays once (`ektukhani-intro-penalty`), never on a friend's link.

## Screens
- **Title:** the field sits dimmed behind. The biggest thing is the canvas-drawn ball on the chalk spot in front of the bamboo goal, labelled **খেলো**. Under it: the match chip ("৫ · কিপারের ঝোঁক"), one line saying the cup, the round, the opponent and the new thing, and "সব ম্যাচ · ★ ১৪/৩৬". A friend's challenge sits on top.
- **Match list (a pause-style choice screen):** four cup tabs (←/→), three numbered rows each (keys 1–3). Each row: the name, the one new thing, the stars. The next match to play is marked **এটা খেলো**. Locked rows are dimmed and carry a lock shape.
- **HUD (a row above the field, never on it):** top-left, the match badge; top-right, the score box (our dots ✓/✕, the score, their dots), with "সাডেন ডেথ" under it when it starts. The ⏸ band in immersive mode sits above the stage, so nothing is under it.
- **The call:** one line under the field ("কিপারের আঙুল ছুঁয়ে গোল!"), with the instruction in the same slot before a kick. Nothing is ever drawn over the goal.
- **Danger at the edges:** an orange rim on the field when the next kick can lose the match (match point against you, every sudden-death kick), and as the shot clock runs out. In ধীরে খেলো it's a steady border.
- **Finals:** the badge says "ফাইনাল", the crowd is packed, their keeper or kicker has the final's trait drawn on him (the tall keeper, the watching eyes). Winning a final plays the cup fanfare and confetti.
- **End screen:** a scoreboard slip over the field: the heading, the stars, the score counting up, then তোমার গোল x/y, ঠেকানো x/y, বাঁশে লাগা n, সবচেয়ে জোরের শট p%, counting up over 0.7 s (instant in ধীরে খেলো). Then the near-miss line, and big আবার খেলো / পরের ম্যাচ buttons (live after 0.7 s, keys only from a fresh press). "কার্ড বানাও" opens the card panel inside the stage.
- **Card:** the same cream card (the winning kick in the top corner, their keeper flat), with the new cup and round in the label.

## Sound (`shared/game-sound.ts` only)
- kick thump (boot on leather), net swish, glove save, bamboo knock, the crowd's cheer and its "ওওও";
- **the crowd loop:** a murmur under every kick that swells through the run-up and on a decisive kick, and stops on pause, the end, a hidden tab and unmount; it comes back when sound comes back;
- **signature:** the referee's pea whistle (a trill), and a long whistle at the end;
- **cup motif:** four notes per cup at the first whistle (`tone` with a delay, so a pause cuts them);
- the shot clock's last three seconds tick.

Every sound has a visible twin: the ball's path, the net ripple, the keeper's gloves, the post wobble, the crowd on the wall jumping, the call line, the clock bar.

## Comfort and controls
- **Touch:** swipe from anywhere (the end point is the aim, the last 120 ms is the power, a bow is curl); or tap a spot on the goal, then tap again when the meter is right. Keeping: tap the left, middle or right of the field, or the three big buttons, on touch-down.
- **Keys:** arrows aim; Space or Enter starts the meter, then kicks; keeping: ← ↓ → (or A S D). Space and Enter on the end screen take only a fresh press after it appears. P opens the player's pause menu; Escape belongs to the player.
- **Mouse:** the same as touch.
- **Away:** the player's pause freezes the run-up, the flight, the clock and the story; a blur releases a finger; the first tap after coming back only resumes, and never shoots or dives.

**Kept for compatibility:**
- links `s`, `t`, `a`, `n` and the old `l` (matches 1–8 of the old ladder, mapped to the same team: 1→3, 2→4, 3→6, 4→5, 5→8, 6→7, 7→11, 8→12, checked by the old five-kick rules). New links add `m` (the match, 1–12);
- `ektukhani-levels-penalty` is migrated once to the new numbers (the same map), and `ektukhani-unlock-penalty` keeps this game's own unlock, so a friend's far-ahead final records its stars without opening the matches in between;
- the share id, `/penalty`, the title and H1; the description changes "৮টা ম্যাচ" to "চারটা কাপ, ১২টা ম্যাচ".
