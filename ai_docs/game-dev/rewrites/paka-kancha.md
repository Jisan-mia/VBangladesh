# পাকা-কাঁচা: rewrite design

## Core
- **Concept:** a hidden four-digit code, and a mango for every digit you try. পাকা (a whole mango with a leaf) is the right digit in the right place, আধপাকা (a mango cut in half) is in the code but somewhere else, কাঁচা (a small hollow raw one) is not in the code. Crack the lock in as few tries as you can.
- **Fantasy:** mango season at nana's place. The locks are nana's: the old brass lock of his সিন্দুক, the মালির গুদাম, the big lock of the হাট's আড়ত. Every code is a lock somebody wants opened before the mangoes spoil.
- **Loop:** *ভাবো* (read the mangoes of every try so far) → *বসাও* (four digits on the pad) → *দেখো* (the mangoes fall, row by row, with a ধপ).

## Progression
Three worlds of six (`lib/levels.ts`, as data). Each world adds **one twist to the rules**, each level **one new thing** (its `line`, on the start card), and the sixth level of a world is its named boss code. Every level is proved fair: `carefulTries` in `lib/solver.ts` plays every possible code (24 on level 1, 3,024 on the last) the way a careful person would (every guess could still be the code, the one leaving the fewest codes in the worst case) and the test asserts the worst case fits the level's tries.

| World | Palette | Twist | Levels (pad keys) | Boss |
|---|---|---|---|---|
| ১ উঠান | morning on whitewash, leaf green | none: a mango beside every digit | 4, 5, 6, 6, 7, 8 | **নানার সিন্দুক**, 8 keys, 6 tries |
| ২ আমবাগান | noon under the trees, deeper green, dappled gold | জোড়া অঙ্ক: every code hides at least one pair, and the pad takes a digit twice | 4, 5, 6, 6, 7, 8 | **মালির গুদাম**, 8 keys, 7 tries |
| ৩ আমের হাট | the market at dusk, lantern orange on dark teal | ঝুড়ির হিসাব: mangoes fall in a basket, not beside a digit; only the count of পাকা and আধপাকা shows | 4, 5, 6, 7, 8, 9 | **হাটের বড় তালা**, 9 keys, 7 tries |

What each level teaches (in order):
- **উঠান:** the four keys are the four digits (only the order is hidden) → a spare key that is not in the code, and its কাঁচা → little mangoes on the pad keys (the best a digit has earned) → the "this can't be the code" line under a full row → the last-try red edge → the boss.
- **আমবাগান:** a pair in the code → give the same digit two places → one digit, two keys: only one mango is পাকা → six tries → open with four different digits (a probe, since no code is all different) → the boss.
- **আমের হাট:** the basket → change one digit at a time → swap two places and read পাকা up or down → an empty basket proves four digits are out → eight keys → the boss.

**Bot targets** (`tests/rewrite.test.ts`, `tests/bot.ts`; fixed seeds, so exact):
- *sharp* (reads every row, plays the minimax guess), *steady* (reads every row, plays any code that fits) and *casual* (remembers only the last three rows, one try in twelve a slip) are people-shaped: they think 1–3 s a try and tap at 0.3 s a key.
- sharp and steady clear every level at ≥ 97%; casual clears ≥ 88% in উঠান, ≥ 70% in আমবাগান, ≥ 58% in আমের হাট.
- Level 1: everyone clears; sharp wins inside 10 s in at least 55% of games (median 8 s); ★★★ in at least 90%.
- ★★★ is always reachable (sharp ≥ 35%, a careful solver ≥ 20% of codes), and a boss's ★★★ rate is no easier than its world's average.
- ★★★ at 3 tries on all of উঠান, at 3 then 4 in আমবাগান, at 4 then 5 in আমের হাট as the pad grows; ★★ is one or two tries more (`three`/`two` in `lib/levels.ts`).

## Difficulty and story
- **The ladder is the difficulty.** No difficulty chips: the start card says the world's twist in a line and the level's new thing in another, and the foot says "★★★ ৩ বারে · ★★ ৪ পর্যন্ত".
- **আজকের কোড** is the old daily: ten digits, seven tries, four different digits, a mango beside every digit, one code for everyone each day (Dhaka midnight). **আরেকবার** gives a seeded code of the same kind. **বন্ধুর জন্য কোড বানাও** is unchanged. These keep the tries-to-beat "best on this phone" instead of stars.
- The last mode (লেভেল or আজকের কোড) is remembered on the phone.
- **Story:** no panels. The world is the setting; each boss has a name and one dry line when it opens ("সিন্দুক খুলল। ভেতরে আমসত্ত্ব, আর নানার চিরকুট: ‘পাকা হাত।’") or holds ("সিন্দুকটা আজ টিকে গেল।").

## Screens
- **Title (start card):**
  - the masthead (পাকা-কাঁচা, total stars) and the mode switch (লেভেল / আজকের কোড);
  - ‹ level › with its name, world and stars; a red "শেষ কোড" badge on a boss;
  - the world's twist chip (worlds 2 and 3) and the **নতুন** line;
  - on level 1 the example row "৫২৮১ → পাকা, আধপাকা, কাঁচা, কাঁচা" with its legend; the legend on every other level;
  - **the biggest thing:** the level's own picture, a woven basket with one mango of each kind, or the boss's brass lock with four pins, and the green শুরু করো pill across it (**চালিয়ে যাও** with a saved day).
  - Under it: the star rule, সব লেভেল and বন্ধুর জন্য কোড বানাও.
- **Choice moments:** সব লেভেল (the sheet: three worlds, numbered levels with stars and names, locks, red bosses, **এটা খেলো** on the recommended level). It holds play and the clock. The pause menu's সব লেভেল opens it too. On the result, the primary button (Enter after 0.4 s) is the default.
- **HUD (corners only):**
  - top-left: the level badge, which opens the sheet;
  - top-right: আর ৫ বার, seven pips (used ones dim, this one gold) and the stars you would earn if the next try cracks it;
  - **the number pad is always on screen** under the board, with its stage-sized keys; মুছো and দেখো carry their key hint on a desktop.
  - A boss adds one slim row under the HUD: "নানার সিন্দুক ▬▬ খোলা পিন ২/৪" (the most পাকা any try has earned). The middle of the screen stays the board.
- **Danger at the edge** (from level 5): the stage frame turns amber with two tries left, red with one, and the last try starts with two low beats. It is static in ধীরে খেলো.
- **Aids come in with the level that teaches them:** little mangoes on the pad from level 3, the "can't be the code" line from level 4 (it never blocks a try: a probe can be clever). It says what the rows already said ("২ নম্বর ঘরে ১ পাকা ছিল।").
- **End screen:**
  - the code is shown, StarReveal brings the stars in one by one, and a boss that opens for the first time says its name ("নানার সিন্দুক খুলল!");
  - four stats count up: চেষ্টা, সুযোগ, পাকা আম, সময়;
  - one line from the level's world, the exact near-miss ("আর ১ বার কম লাগলে ৩ তারা।"), on a boss the world's total ("উঠান: ★ ১৬/১৮।") and the next level's new thing;
  - পরের লেভেল (Enter), আবার খেলো, কার্ড বানাও ↓. Off the ladder: আরেকবার and লেভেল খেলো.
- **Card:** mangoes only, no digit of any try or of the code, in the world's palette; a boss's name after the level; stars on a level.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loop)
- **ধপ (signature):** every mango of a new row falls 120 ms apart, in step with its CSS pop: a full thump and a leaf rustle for পাকা, a soft one for আধপাকা, a dry tick for কাঁচা.
- the wooden knock on দেখো, the key tap, the মুছো tick;
- a bright brass pin click for each new pin on a boss's lock;
- two low beats when the last try begins;
- the bolt and a warm chord when a boss opens;
- shared wrong (a refused key), lose, good, levelUp and the StarReveal chimes.

Later notes use `tone(…, delay)`, so the player's pause cuts them. The delayed cheer is a `setTimeout` cleared on pause, away, a new game and unmount. Every sound has a visible twin: the falling mango, the key's dip, the lifted pin, the glowing edge.

## Comfort and controls
- **ধীরে খেলো:** no pop, hop, edge pulse, count-up or confetti; the danger edge stays, still. The stars are unchanged.
- **Touch:** tap a key, tap দেখো. Every key answers on the click, with `touch-action: manipulation`. The tap that brings the window back, or closes the menu, only wakes the game (350 ms).
- **Keyboard:**
  - 0–9 or ০–৯ type, Backspace erases, **Enter checks the row** whichever pad key last held focus (a pointer click leaves no focused button behind);
  - P opens the player's menu, Esc belongs to the player;
  - on the start card Enter or Space starts and ←/→ change level;
  - on the result only a fresh Enter, 0.4 s after it appears, goes on.
- **Nothing gets stuck:** the pad's keys are buttons for Tab too; Enter on a focused non-pad button does its own job.
- **Kept for compatibility:**
  - links `#d=` (a day) · `#s=&t=&r=` (a seeded code) · `#c=` (a friend's code, in plain digits) · `#s=&t=&l=&r=` **without `v`** (a level of the old ladder: it opens the old pad and tries, as "বন্ধুর কোড · পুরোনো লেভেল N", and records no stars); new level links add `v=2`. `&n=` is the name. Every row is re-checked against the level's rules, a basket row must be sorted, and `t` must match the rows;
  - the daily's saved game `paka-kancha-day`, the daily best `ektukhani-best-paka-kancha` and the old stars `ektukhani-levels-paka-kancha` (left untouched);
  - the new ladder's stars `ektukhani-levels-paka-kancha-v2`, and your own open level `ektukhani-paka-kancha-open`, set once from what the old ladder (or an old best) had opened, so every level you had open stays open; the last mode `ektukhani-paka-kancha-mode`;
  - `/paka-kancha`, the title, the H1 text (kicker + headline), the description (reworded, 134 characters) and the FAQ (now 11 questions).
