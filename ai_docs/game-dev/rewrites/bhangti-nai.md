# ভাংতি নাই!: rewrite design

## Core
- **Concept:** you keep a মুদি দোকান's counter. A customer hands over a big note and names the price. You count the change out of the cash box, chit by chit, before their patience runs out.
- **Fantasy:** you are the quick-headed kid minding the shop while দাদু has a nap. Every customer leaves happy, and nobody ever catches you counting on your fingers.
- **Loop:** দেখো (the note, the price, the customer's face) → গোনো (tap or drag chits onto the counter) → দাও (the till rings, the customer walks off happy or huffing).

## Progression: 3 shops × 10 days (30 levels)
Each shop brings one **rule**. Inside a shop, each level adds exactly one thing, shown on the start card as **নতুন** with a before → after chip. The tenth level is the shop's named finale, with a boss bar and one extra rule: **a wrong count costs the customer's patience** (2 s off the edge bar, the face turns cross).

| Shop | Rule | Levels 1–9 add, in order | Finale (10) |
|---|---|---|---|
| ১ পাড়ার দোকান (teal tin wall, yellow sign) | বিয়োগ: note minus price | ৫০-র নোট, round prices → ১০০-র নোট → খুচরা দাম (১, ২ টাকার কয়েন) → a second less → ২০০-র নোট → customers add coins to make round change ("১০০ আর ৭") → a second less → ৫০০-র নোট → two notes together ("১০০ আর ৫০") | **ঈদের আগের দিন** |
| ২ বাজারের দোকান (blue wall, green sign) | ভাংতি ফুরিয়েছে: one chit is sold out, and you rebuild the change without it | ১০ টাকার চিরকুট শেষ → ৫ টাকার → ১ টাকার কয়েন → more customers hit → ২০০-র নোট → a second less → ৫০০-র নোট → coins-for-round again → ২০/৫০-র চিরকুট শেষ too | **মাসের প্রথম বাজার** |
| ৩ হাটের দোকান (maroon wall, saffron sign) | কেজি দরে: the price is quantity × rate; work it out, then the change | ২ কেজি, round rates → up to ৩ কেজি → odd rates → up to ৫ কেজি → dearer rates and ২০০-র নোট → a second less → more customers → sold-out chits return → ৫০০-র নোট | **হাটবার** |

- Levels are data in `lib/levels.ts`. A queue is seeded (`makeRng`) and always ten customers, the first one gentle. The newest twist takes the third, sixth and ninth places, so the lesson meets you at once.
- The first time a twist customer steps up, a one-line tag names it ("নতুন: ১০ টাকার চিরকুট শেষ!").
- **Bot targets (tests/bot.ts, 300 seeds a level, asserted in tests/rewrite.test.ts):** a casual bot wins level 1's first customer within 10 s of the bell and clears level 1 ≥ 99%; it clears every shop-1 level ≥ 80% and every level ≥ 50%; a steady bot clears every level ≥ 85% (finales ≥ 70%); a strong bot gets ★★★ on every non-finale level ≥ 55% and on finales 35–85%; each finale is its shop's hardest level for the steady bot.
- **Stars (unchanged):** clear = 6 customers right on the first try, ★★ = 8, ★★★ = 10. Scores (100 + a speed bonus up to 50) are unchanged, so every old link's score is still possible.

## Difficulty and story
- **The ladder is the difficulty.** Two modes, each with its consequence on the title screen:
  - **ঝটপট** (default): the patience clock runs, the speed bonus is on, up to ★★★.
  - **সময় নিয়ে**: no clock, no speed bonus, stars stop at ★★ (the clock is what ★★★ proves). For learners and for kids at the table.
- Remembered on the phone (`bhangti-nai-relaxed`, as before).
- **Story:** none. The shop is the world; the bell on the counter is the start.

## Screens
- **Title:** the shop's counter with a big brass **ঘণ্টা বাজাও** bell, the biggest thing on screen (the first customer steps in when you ring it). Under it, small: ‹ দিন ৩ · পাড়ার দোকান ›, the **নতুন** line with chips, the facts (খদ্দের ১০ জন · প্রতিজনের ১২ সেকেন্ড), the two mode chips with their one-liner, stars, and সব দিন. Level 1 also shows the solved example (৫০ − ৩৫ = ১৫). A friend's link shows their card and claim on top.
- **Serve:** the customer from the chest up, a speech bubble with the amounts in big numerals ("১০০ দিলাম, জিনিস ৮৭ টাকার"), the notes in their hand. Below: the counter tray with your chits and your total, **দাও** beside it, and the cash box (coins ১ ২ ৫, notes ১০ ২০ ৫০ ১০০, a sold-out chit greyed with শেষ). Tap puts a chit down at once (pointerdown); drag from the box onto the counter and drop it back on the box to change your mind.
- **Face and edge:** the patience bar runs along the scene's top edge. The customer's mood reads without text: calm → in a hurry (half left) → cross (last 20%). In the last 30% the stage edge glows amber, then red; the last 3 s tick.
- **Feedback that teaches:**
  - wrong: "৫ টাকা কম দিলে!", and from the second wrong try the working shows ("৫০ − ৩৫ = ১৫", or "৩ × ১৮ = ৫৪ · ১০০ − ৫৪ = ৪৬");
  - late: the customer huffs off, the right chits appear in the tray with the working;
  - right: a happy face, "+১৪০" and "ঝটপট +৪০".
- **Choice moments, all pause play:** সব দিন (three shops, numbered levels, stars, locks, finales, **এটা খেলো** on the recommended one). The end screen has three numbered choices, the first marked **এটাই ভালো**. A sheet or the player's menu hides the customer under a shutter so a pause never buys thinking time.
- **HUD (corners):** top-left the day badge (opens সব দিন); top-centre the ten customer dots (or the finale's boss bar with its name); top-right the score and a "টানা ৩" pop. The middle stays clear.
- **Finale:** a red **শেষ দিন** badge, the boss bar ("ঈদের আগের দিন · ৭ বাকি"), the patience rule on the card, confetti on the first clear.
- **End screen (দিনের হিসাবের খাতা):** a ledger page. One line per customer: the face (happy / huffed), paid → price → change, ✓ first try / ✓ after a slip / ✗ walked off, seconds, points. The total counts up and StarReveal stamps the stars. Then real stats (প্রথমবারেই ঠিক, গড় সময়, সবচেয়ে চটপট, সেরা টানা), the exact near-miss ("আর ১ জনকে একবারে ঠিক দিলে ৩ তারা"), the best on this phone, and ১ পরের দিন · ২ আবার খেলো · ৩ সব দিন (1–3 or Enter, fresh presses only, after 0.4 s). কার্ড বানাও ↓ scrolls inside the stage.
- **Card:** the signboard card, now naming the shop and day, the stars, and a stamp on finales.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
1. **ঘণ্টা (signature opener):** a brass counter bell. Also a soft ding when a customer steps up.
2. **Coin or note:** a clink for coins, a rustle for notes, softer when you take one back.
3. **Till (signature):** the drawer slides and rings, a step higher for every first-try right in a row. You see the happy face and "+১৪০".
4. **উঁহু:** a soft low wrong. You see the shake and the line.
5. **Walk-off:** the door sliding shut. You see the customer leave.
6. **Tick:** the last three seconds. You see the number and the glowing edge.
A three-note shop ident (in the shop's key) plays on a day clear. No loops, so none can outlive a pause. Scheduled notes use `tone(…, delay)`, so the player's pause cuts them.

## Comfort and controls
- **ধীরে খেলো:** no shake, bounce, float, confetti, count-up or pulsing edge; the edge stays a still border. The clock is **unchanged** (it used to give ×1.5 time; stars are not made easier). Customers wait a little longer before leaving.
- **Touch and mouse:** pointerdown on a chit answers at once; দাও and ফেরাও are 48 px or more. A click that brings the window back only resumes.
- **Keyboard:** ১–৭ (or 1–7) put a chit down, Backspace takes the last back, Enter or Space gives, P opens the player's pause menu; on the title Enter rings the bell; on the ledger 1–3 and Enter, fresh presses only. Clicked buttons drop focus. Escape belongs to the player.
- **Pause:** the player's menu (blur, hide, Esc, ⏸, P). The shutter drops over the customer; the clock, the linger after a customer and the hand-off all freeze; resuming gives a 0.6 s breath.
- **Kept for compatibility:**
  - links `#s=&t=&r=&d=&c=&n=` still parse. A link without `v` replays the old queue and clock exactly (`lib/legacy.ts`, pinned by checksum); new links add `v=2` and `d` becomes the level (1–30);
  - saved stars stay in `ektukhani-levels-bhangti-nai` (30 slots now; the first 20 are read as before); your own open day moves to `ektukhani-bhangti-nai-open`, set once from the old unlock rule, so a friend's far-ahead link no longer opens the days between;
  - best scores: `ektukhani-best-bhangti-nai` (classic queue), `…-day-N` (a friend's old day), `…-lv-N` (the new ladder);
  - no tally; the URL `/bhangti-nai`, title, description and H1 are unchanged; the FAQ gets the new levels.
