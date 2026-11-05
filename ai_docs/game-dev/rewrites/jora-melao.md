# জোড়া মেলাও: rewrite design

## Core
- **Concept:** the old memory pairs game, played on three Bangladeshi tables: a বৈশাখী মেলা toy stall, a জ্যৈষ্ঠ fruit হাট and a বিল at dusk full of birds. The cards lie face down. Open two, keep them if they match.
- **Fantasy:** you're the sharp kid at the মেলা who remembers where every লাটিম lay, even after the birds shuffle the board behind your back.
- **Loop:** *খোলো* (tap a card, it turns at once with a papery swish) → *মনে রাখো* (a miss turns back; you note what lay where) → *মেলাও* (open the twin you saw earlier: the bell rings, higher for every match in a row).

## Progression: 3 worlds × 8 levels (24)
Every board is dealt fresh from a seed (`makeRng`). Each world has its own picture set drawn in code, its own card back, mat and palette. Each level adds exactly one thing, shown on the start card as **নতুন** with a before → after chip ("জোড়া ৪ → ৬"). The eighth level of each world is its named finale, with a boss bar.

| World (palette) | Pictures (look-alike twins) | Its twist | Levels 1–7 add, in order | Finale (8) |
|---|---|---|---|---|
| ১ বৈশাখী মেলা (teal backs, jute mat, paper bunting) | বেলুন, ঘুড়ি, লাটিম, বাঁশি, একতারা, মাটির পুতুল, টমটম, ঝুনঝুনি, চরকি, টিনের নৌকা (নীল বেলুন, চাঁদিয়াল ঘুড়ি, সবুজ লাটিম) | none: the rules | ৩ জোড়া with a pair shown face up → ৪ → ৬ → one look-alike pair → ৮ → two look-alike pairs → ১০ | **মেলার শেষ দোকান** (১২ জোড়া) |
| ২ মধুমাসের হাট (mango yellow, leaf green, a bamboo ডালা) | আম, কাঁঠাল, লিচু, জাম, কলা, পেয়ারা, আনারস, ডাব, তরমুজ, জামরুল (কাঁচা আম, কাঁচকলা, ঝুনা নারকেল) | **এক ঝলক:** every card shows face up for a few seconds at the start | the twist (৬ জোড়া, ৩ সে.) → ৮ → a shorter look (২ সে.) → a look-alike pair → ১০ → two look-alike pairs → ১.৫ সে. | **মধুমাসের ভরা হাট** (১২ জোড়া) |
| ৩ বিলের পাখি (dusk blue, reeds, still water) | দোয়েল, শালিক, মাছরাঙা, কাক, টিয়া, বক, চড়ুই, কোকিল, হাঁস, বুলবুলি (দাঁড়কাক, গাঙশালিক, কানিবক) | **উড়ে বসা:** after every few misses two face-down birds fly and swap places, in plain sight | the twist (৬ জোড়া, every ৩rd miss) → ৮ → every ২nd miss → a look-alike pair → ১০ → two look-alike pairs → four birds fly at once | **কালবৈশাখীর আগে** (১২ জোড়া) |

- Look-alike twins differ in colour **and** in shape (dots, a moon on the kite, a green leaf, a grey collar), so they stay apart without colour vision.
- A swap picks cards you have already seen when it can, and never the pair just missed. It is part of the deterministic rules, so a link replays it exactly.
- **Stars:** ★ for any clear (there is no losing), ★★ and ★★★ at the level's move counts, said on the start card ("৩ তারা ৯ চালে"). Par comes from the bots.
- **Bot targets** (`tests/bot.ts`, asserted in `tests/levels.test.ts`, 300 seeds a level): three players with a memory span, a slip rate, a peek reading speed, a chance to follow a swap and a chance to mix up look-alikes, and human tap times (casual 0.55 s, steady 0.45 s, sharp 0.35 s a card).
  - Level 1: the casual player clears it inside 10 s on ≥ 95 % of seeds.
  - Every level: the steady player gets ★★★ on ≥ 45 %, the sharp one on ≥ 85 %, the casual one ★★ or better on ≥ 60 % (world 1 before the finale ≥ 75 %).
  - From level 3 on, the casual player gets ★★★ on ≤ 70 %, so three stars mean something.
  - Each finale has its world's lowest steady ★★★ rate.

## Difficulty and story
- **The ladder is the difficulty.** No modes beyond একা and দুজনে. The start card says the one new thing in plain words ("এবার দুটো ছবি প্রায় একই রকম। নকশা দেখে চেনো।").
- **Story:** none. Each world is a table you walk up to: the toy stall, the fruit seller's ডালা, the edge of the বিল. Finales get a name and one line ("চৈত্রের শেষ বিকেল। দোকানির সব খেলনা উল্টে রাখা, ১২ জোড়া।").

## Screens
- **Title (start card):** masthead (জোড়া মেলাও · ★ total). ‹ level name › with its world and stars. Then the biggest thing: the level's own board, face down on its mat, with a hanging fair sign **কার্ড খোলো** across it (Enter). Under it: the world's twist chip, the **নতুন** line with its chips, the facts (৮ জোড়া · ৩ তারা ১১ চালে) and সব লেভেল, then the mode chips ১ একা · ২ দুজনে (two optional names for দুজনে). A friend's claim sits on top.
- **Peek (world 2):** after the start tap the cards flip up in a wave. A countdown tag sits top-right and a thin bar drains along the top. They flip down in a wave, and play begins. Pausing covers the board and stops the clock.
- **Play:** tap a card. It answers on pointerdown, lifting a little as it turns. A match pops both cards with a gold ring, "মিলেছে!" floats, and the pair settles with a hop. A miss shows both for 1 s (a tap anywhere turns them back sooner), then a gentle wobble. On a swap the two cards lift, arc to each other's place, and land.
- **Choice moments, all of which pause:** সব লেভেল (from the HUD badge, the start card or the end screen) shows the three worlds, numbered levels with stars, locks, finales in red and **এটা খেলো** on the recommended level. The end screen has numbered choices, ১ marked **এটাই ভালো**.
- **HUD (corners only):** top-left the level badge (opens the sheet), top-centre the pairs found as pips (a finale shows its boss bar with the name), top-right the moves and a three-star track showing the best you can still get. A thin bar along the top edge fills with moves against the ★★★ par. In দুজনে the top-right shows both players' pairs, the mover's raised.
- **Danger at the edge:** when the next miss would cost a star, the stage edge glows amber and the star that is at stake pulses. When a miss does cost it, that star cracks with a dull knock and the edge flashes once. A still border in ধীরে খেলো.
- **Finale:** a red **শেষ বোর্ড** badge on the start card, the boss bar ("মেলার শেষ দোকান ▬▬ বাকি ৭ জোড়া"), confetti on the first clear, a stamp on the card.
- **End screen:** the title (লেভেল ৩ শেষ / the finale's name), the finished board in small, StarReveal, stats that count up (চাল, ভুল, সেরা টানা, মনে রেখে মেলানো, সময়), the exact near miss ("আর ২ চাল কম হলে ৩ তারা।"), a record or the friend comparison, and ১ পরের লেভেল · ২ আবার খেলো · ৩ সব লেভেল. Only a fresh key 0.4 s after it shows counts. "সব লেভেল শেষ" appears only when all 24 have stars.
- **Card:** the finished board in the world's palette, the moves, the stars, a first-person line, a finale stamp; two players get both names and their pairs.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loops)
1. **Flip:** a papery swish and a tick, on pointerdown (you see the card turn).
2. **Signature, মেলার ঘণ্টা:** a bell chime for a match, a step higher for every match in a row (you see the gold ring and "মিলেছে!").
3. **Miss:** a soft wooden টুক (you see the wobble).
4. **Star at stake / star lost:** one low tick when the edge turns amber, a dull double knock when a star cracks (you see the edge and the cracked star).
5. **Swap:** a flutter of wings, or a gust in the mela (you see the cards fly).
6. **Clear:** a three-note ident in the world's key (four for ★★★ or a finale), then StarReveal's chimes. The peek's wave of ticks rides on the flip sound.

Everything is scheduled on the audio clock, so the player's pause cuts it. No loops, so nothing keeps playing behind a pause.

## Comfort and controls
- **ধীরে খেলো:** cards change face with a quick fade instead of turning, no hop, pop, float, shake, confetti or count-up; the danger edge is a still border; a missed pair stays up 1.8 s; a swap still flies (its motion is the information) but slowly and in a straight line. The peek time and the par are unchanged, so stars are earned the same way.
- **Touch and mouse:** tap a card. The tap that brings the window back, or closes the menu, only wakes the board.
- **Keyboard:** arrows walk a cursor, Enter or Space flips, P opens the player's menu. On the start card ←/→ change level, ১/২ pick the mode, Enter starts. On the end screen 1–3 and Enter, fresh presses only. Escape belongs to the player.
- **Kept for compatibility:**
  - links: old links (`s t g l m a f q n`, no `v`) still parse, replay their flips on the exact old board (`lib/legacy.ts` keeps the old deal) and open as "বন্ধুর পুরোনো বোর্ড"; their stars aren't recorded (the old boards aren't the ladder's). New links add `v=2` and `l` = the ladder level, with the same `f` flip proof, `m=2 a q` for two players;
  - stars move to `ektukhani-levels-jora-melao-v2` (the 24 levels are new boards). Your open level `ektukhani-jora-melao-open` is set once from the old stars (after the old one-time move of `ektukhani-best-jora-melao-12/16`), so a player who had reached the old ৫×৪ boards opens all of world 1. After that only your own clears open levels: a friend's far-ahead level records its stars and opens nothing in between;
  - best moves per level in `ektukhani-best-jora-melao-v2-l<N>`;
  - no tally; the URL `/jora-melao`, the title, the description and the H1 text stay; the FAQ is updated to the new levels.

## As built (final numbers)
- **Par (★★★ / ★★ moves), set by the bots in `tests/bot.ts` and asserted in `tests/levels.test.ts` (300 seeds a level):**
  - মেলা: 5/7 · 7/9 · 10/12 · 10/13 · 13/18 · 13/18 · 17/27 · 22/34 (finale)
  - হাট: 7/9 · 10/15 · 10/15 · 11/16 · 15/23 · 15/24 · 16/23 · 20/31 (finale)
  - বিল: 10/12 · 13/17 · 14/18 · 14/18 · 18/25 · 18/25 · 19/26 · 23/35 (finale)
- **Bots:** casual (span 4 cards, 15% slip, 0.55 s a card), steady (span 6, 0.45 s), sharp (span 10, 0.35 s). Rates held: sharp ★★★ ≥ 85 %, steady ≥ 45 %, casual ★★+ ≥ 75 % in the first table (≥ 60 % after), casual ★★★ ≤ 70 % from level 3, each finale the hardest of its table for the steady player, level 1 in ≤ 10 s for 95 %+ of casual deals.
- **A tap while a miss shows:** on the first two tables it turns the pair back and opens the card you tapped. On the birds' table it only turns the pair back, because the birds may fly first and the card you aimed at could move. Both are replayed the same way by a link.
- **The stars at the edge:** `atStake()` is 3 or 2 when the next miss would make that star unreachable (moves + pairs left = the par). The edge glows amber and the star pulses; a miss that does it cracks the star (`cracked`), flashes the edge once and knocks.
- **Layout:** card size comes from CSS container units of the table box (no JS measuring), so every board from 6 to 24 cards fits the stage; the start card's info takes at most 46 % of the stage, play keeps a 104 px strip (par, the birds' counter, the warning).
- **Two players** play new boards too: toys only, 6 or 8 pairs, `v=2&m=2&g=12|16`; no stars.
- **Files:** `lib/{levels,play,session,link,save,pictures,draw-card,legacy,tick.hot}.ts`, `components/{jora-game,start-info,level-sheet,finish,picture,sound}`; tests `rules`, `session`, `levels`, `rewrite`, `bot`.
