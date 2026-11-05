# মুখে মুখে হিসাব: rewrite design

## Core
- **Concept:** a one-minute sprint of mental sums, from a child's slate to the shopkeeper's ledger to the bazaar list. You give the answer before the clock runs out, the way a দোকানদার adds up a ফর্দ without a calculator.
- **Fantasy:** you are the quick one at the counter. The customer is still reading the list and you have already said the total.
- **Loop:** দেখো (the sum, big, in the middle) → বলো (tap one of four numbered answers, or type it on the pad) → মেলাও (the cash box rings, the streak climbs; a miss shows the right answer and *how* to get it, and costs seconds).

## Progression: 3 worlds × 10 levels (the 30 level numbers, their sums and the saved stars stay)
Each world brings one twist. Inside a world each level adds one thing, shown on the start card as **নতুন** with a before → after chip. The tenth level of each world is its named finale: a mix of everything the world taught, a red **শেষ পাতা** badge, and a boss bar with its name.

| World | Surface (palette) | Twist | Levels 1–9 add, in order | Finale (10) |
|---|---|---|---|---|
| ১ ছোটদের হিসাব | a kid's slate: chalk on green-black, a wooden frame | pick from 4 numbered answers | sums to 10 → one-digit sums (make ten) → take away within 10 → take away within 20 → both signs → two-digit + one-digit → the 2–5 tables → both signs to 50 → tables to 9 | **টিফিনের ঘণ্টা** (+, −, ×) |
| ২ দোকানের খাতা | the red-bound ledger: blue ink on cream, a red margin | you write the answer yourself on the pad | typed sums → two-digit + two-digit → two-digit − one-digit → two-digit − two-digit → typed tables → tens and hundreds → two-digit × one-digit → division (a new sign) → all four signs | **হালখাতা** (three-number running totals: জের + বিক্রি − খরচ) |
| ৩ বাজারের ফর্দ | a kraft-paper list in green ink | word problems with prices | so many of one thing → হালি and ডজন → two prices → by the kilo → আধা, দেড়, আড়াই → a fair share → two things by the kilo → three things or a dozen of হালি → the change | **চাঁদরাতের বাজার** (the whole bazaar) |

- Levels are data in `lib/levels.ts`. Sums are seeded (`makeRng`), generated lazily as the round goes, so a fast player never runs out (the old crash at sum 120). The first 120 sums of every level and seed are exactly the old ones, so every old link replays the same sums.
- **The clock:** 60 s. A right answer moves on at once with combo points (10, then 20 from five in a row, 30 from ten, 40 from fifteen). A wrong answer costs **৩ সেকেন্ড, পরপর ভুলে ৬, তারপর ৯**: random tapping no longer earns stars (the old game gave a masher 3 stars on every four-answer level).
- **Stars:** right answers in one round, three thresholds a level. The star track along the top fills as you go and each star pops the moment you earn it, so level 1's first star lands within 10 s.
- **Bot targets (tests/bot.ts, 300 seeds a level, asserted in tests/rewrite.test.ts):**
  - a casual player earns level 1's first star within 10 s on ≥ 90% of seeds, clears every world-1 level ≥ 90%, and clears every level ≥ 60%;
  - a steady player clears every level ≥ 90%;
  - a strong player gets ★★★ on every non-finale level ≥ 50%;
  - each finale is its world's hardest level for ★★★ (steady);
  - a masher (random taps as fast as it can) clears level 1 ≤ 35% and never gets ★★.

## Difficulty and story
- **The ladder is the difficulty.** No separate modes. Each start card says what changes in plain words ("নতুন: এবার বিয়োগ, দশের মধ্যে").
- **Story:** none needed. Each world is a surface (slate, ledger, ফর্দ) and each finale has one dry line ("টিফিনের ঘণ্টা পড়ার আগে খাতা শেষ।").

## Screens
- **Title (start card):** the world's surface fills the middle. The biggest thing is the brass cash box (ক্যাশবাক্স) drawn in code, its drawer painted **শুরু করো**; tapping it slides the drawer out with the signature ching, and the clock starts once it is open. Under it: ‹ লেভেল ৩ · দশের মধ্যে বিয়োগ ›, the **নতুন** line and chip, the star targets (★ ৪ · ★★ ১০ · ★★★ ১৫টা ঠিক), the stars you have, and সব লেভেল. A friend's link shows their card and claim on top.
- **Play:** the sum sits big in the middle of the surface, with the answer slots under it. Below: four numbered answers (১–৪, keys 1–4) or the pad (০–৯, মুছো, ঠিক আছে).
- **Feedback that teaches:** a right answer rings and moves on in the same frame; "+২০" floats in the score corner. A wrong one strikes your answer in red, writes the right one in green, and adds one line on *how* ("৮ + ২ = ১০, আর ৫ = ১৫"; "১৩৫ থেকে ২০০: ৫ আর ৬০, ফেরত ৬৫"). The clock holds while that line shows (1.1 s, 2.2 s in ধীরে খেলো), and "−৩ সে." flies out of the clock.
- **Choice moments, all of which pause:** সব লেভেল (from the level badge or the start card): three worlds, numbered levels with stars, locks, finales marked, **এটা খেলো** on the recommended level. The end screen has three numbered choices with the first marked **এটাই ভালো**.
- **HUD (corners only):** top-left the level badge (opens সব লেভেল); top-centre the star track (three pips on a thin bar), or on a finale the boss bar with its name; top-right the seconds and the score with the combo (×২). A thin bar along the very top drains with the clock.
- **Danger at the edge:** the last 10 s glow amber around the stage edge, the last 5 s red with a tick a second. Static in ধীরে খেলো. No popup.
- **Finale:** the **শেষ পাতা** badge, the named boss bar, a world ident and confetti on the first clear, and a stamp on the card.
- **End screen (খাতার পাতা):** the title (লেভেল ৩ পার / টিফিনের ঘণ্টা পার / আরেকবার?), StarReveal, and real stats that count up: ঠিক, ভুল, সেরা টানা, গড় সময় (per right answer), পয়েন্ট. Then the line (a friend comparison, a new record, or a dry human line), the exact near-miss ("আর ৩টা মিললে ৩ তারা"), up to three sums you missed with their how-lines, the best on this phone, and ১ পরের লেভেল · ২ আবার খেলো · ৩ সব লেভেল (1–3 or Enter, fresh presses only). কার্ড বানাও ↓ scrolls inside the stage to the card.
- **Card:** a page of the world's surface with the round's first six sums, each marked as it really went: a red tick for right, a teacher's cross and the right answer for wrong, blank if not reached. The score, the stars, a human line, and a stamp on finales. An old link without marks draws the sums with no marks at all.

## Sound (only `shared/game-sound.ts`, no loop)
1. **Ching (signature):** the cash box drawer and bell on every right answer, a step higher with each answer in a row. You see the floating points and the combo.
2. **উঁহু:** a soft low wrong. You see the red strike and "−৩ সে.".
3. **Drawer:** the cash box sliding open on শুরু করো. You see the drawer move.
4. **Star chime:** a star earned mid-round. You see its pip pop.
5. **Tick:** each of the last 5 seconds. You see the red edge and the seconds.
6. **Bell:** time's up. You see the end screen. A three-note world ident follows a clear.

## Comfort and controls
- **ধীরে খেলো:** no shake, floats, drawer slide, pulsing edge (a still border instead), count-up or confetti; the how-line stays 2.2 s. The clock stays 60 s and the stars mean the same, so ধীরে খেলো never makes them easier.
- **Touch and mouse:** answers and pad keys act on pointerdown (under 50 ms). The tap that brings focus back only resumes.
- **Keyboard:** Enter or Space starts and resumes; 1–4 (or ১–৪) answer on four-answer levels; digits type on the pad, Backspace erases, Enter submits; P opens the player's pause menu (Esc belongs to the player); on the end screen 1–3 and Enter, fresh presses only, 0.4 s after it shows. Clicked buttons drop focus, so Enter never presses them again.
- **Pause:** the player's menu (blur, hide, Esc, ⏸, P). Paused, a cover hides the sum and the answers, so a pause never buys thinking time; the clock and the how-line freeze; resuming gives a 0.6 s breath. A second hide while paused changes nothing.
- **Kept for compatibility:**
  - links `#s=&t=&l=&r=&n=` still parse and replay the same sums; new links add `k` (how the first six sums went, for the card). A right count above 120 is now possible and accepted;
  - saved stars stay in `ektukhani-levels-mukhe-mukhe-hisab` and best scores in `ektukhani-best-mukhe-mukhe-hisab-<level>`; your own open level moves to `ektukhani-mukhe-mukhe-hisab-open`, migrated once from the old unlock rule, so a friend's far-ahead link no longer opens the levels in between;
  - no tally; the URL `/mukhe-mukhe-hisab`, the title, the description and the H1 are unchanged; the FAQ is updated to the new rules.
