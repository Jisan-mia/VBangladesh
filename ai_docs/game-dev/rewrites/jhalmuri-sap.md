# ঝালমুড়ি সাপ: rewrite design

## Core
- **Concept:** the old phone snake game, played on a ঝালমুড়িওয়ালা's tin tray. You steer, and the snake eats what comes out of the ঠোঙা.
- **Fantasy:** a hungry little snake living in a ঠোঙা, eating its way from a newspaper tray to a station platform to a fair at night.
- **Loop:** turn → eat → grow. Every bite makes the next turn tighter.

## Progression: 3 worlds × 4 levels (the 12 old level numbers, goals and star rules stay)
| # | Name | The one new thing | Goal |
|---|---|---|---|
| **World 1: ঠোঙার মাঠ** (newsprint, cream and tin) |||
| 1 | প্রথম কামড় | Turning. The food lands within 3 cells of the head, so the first clear comes in about 5 s. | 5 |
| 2 | সোনালি মরিচ | The golden chilli's ring runs down. Catch it for stars. | 9 |
| 3 | টিনের বেড়া | Tin walls on the board. | 10 |
| 4 | **Finale: কাকের হানা** | A crow walks up and down a row. Touch it and the run ends. | 10 |
| **World 2: ইস্টিশন** (concrete platform, green tin, a yellow edge line) |||
| 5 | সরু গলি | Narrow lanes between walls. | 12 |
| 6 | সুড়ঙ্গ | Two pipe holes. In one, out the other. | 12 |
| 7 | কাঁচা মরিচের ঝাল | A green chilli makes the snake run fast for 10 moves. | 13 |
| 8 | **Finale: রেলগেট** | A gate across the middle shuts for 8 moves out of every 24. Its lamp blinks for 4 moves first. | 14 |
| **World 3: রাতের মেলা** (indigo night, string lights) |||
| 9 | তেঁতুলের টক | Tamarind shortens the tail by 2 cells: a breather. | 15 |
| 10 | দুই কাক | Two crows at once. | 16 |
| 11 | লোডশেডিং | The lights go out. Only the হারিকেন glow round the head shows the walls; food glows faintly. | 18 |
| 12 | **Finale: নাগরদোলার রাত** | Everything at once: crows, the pipes, the green chilli. | 20 |

**ক্লাসিক** stays exactly as it was: no walls, endless, a speed step every 5 bites, the same food from the same seed.

## Difficulty and story
- **Modes (title chips):** লেভেল: "১২টা ধাপ, প্রতিটায় নতুন একটা জিনিস।" ক্লাসিক: "যত খুশি লম্বা হও, এই ফোনের সেরা স্কোর ভাঙো।"
- **ধীরে খেলো** (the player's menu): the snake moves at most one cell in 240 ms, the green chilli's burst is milder, and there's no shake, no flicker, no pulsing glow. Stars stay the same, because the chilli ring counts moves, not seconds. Only your reaction time gets easier, and the design accepts that.
- **Bots:** the strong bot clears every level on ≥ 90% of seeds. The casual bot reacts one move late and picks a random safe turn 8% of the time. It clears level 1 on ≥ 95% of seeds and each finale on 30–95%.
- **Story (first run only, hold to skip):**
  1. "বিকেলের ইস্টিশন। ঝালমুড়িওয়ালা ঠোঙা ভরছে।"
  2. "মুড়ির ভেতর থেকে উঁকি দিল একটা ছোট্ট সাপ।"
  3. "সব খাবে সে। শুধু টিনে আর নিজের লেজে ধাক্কা নয়।"
  A tap shows the next panel. Holding for 0.6 s skips all three. It plays once (`ektukhani-intro-jhalmuri-sap`), never on a friend's link, and never on আবার খেলো.

## Screens
- **Title:** the board sits dimmed behind. The biggest thing is a canvas-drawn ঠোঙা with the snake peeking out, labelled **খেলো**. Under it: the লেভেল N / ক্লাসিক chips, then one line naming the level and its new thing ("৪ · কাকের হানা: কাক এদিক-ওদিক হাঁটে…"), then "সব লেভেল". A friend's challenge line sits on top.
- **Level select (a pause-style choice screen):** three worlds of four levels, numbered 1–12 (the 1–9 keys work). Each row has the name, the one new thing and its stars. The next unplayed level is marked **এটা খেলো**. Locked rows are dim, with a lock shape (not only colour).
- **HUD (corners, outside the field):**
  - top-left: the level badge, "৩ · টিনের বেড়া" or "ক্লাসিক · গতি ২";
  - top-right: the score, with a "+১০" pop beside it;
  - a thin progress line along the board's top edge (bites/goal);
  - a chilli count next to the score, and "ঝাল!" while the burst lasts.
- **Danger:** when the next move would hit tin, a crow, a shut gate or the tail, the board's border glows orange. In slow mode it's a steady border, with no pulse.
- **Finales:** the level badge carries the finale's name. The crow and the gate are drawn on the board, never as a banner.
- **End screen:** a torn ঠোঙা slip over the board. The heading is followed by the stars, then score, bites, chillies, length and seconds, counting up over 0.7 s (instant in slow mode). Then the near-miss line ("আর ২টা খেলেই পার") and big আবার খেলো / পরের লেভেল buttons. "কার্ড বানাও" opens the card panel, which scrolls inside the stage. It holds the canvas card, a name field, feed or story, and share.
- **Card:** the existing mustard card (snake rising out of the ঠোঙা, the score in chilli red, stars for a level). Unchanged.

## Sound (`shared/game-sound.ts` only, no loops)
- crunch (bite, the pitch climbs with the combo)
- coin (golden chilli)
- tin clang (crash)
- caw (a crow, when it turns within 3 cells of the head)
- bell (the gate lamp starts blinking)
- whoosh (a pipe)
- **Signature:** the ঝালমুড়িওয়ালা's tin shaker, "ঝাঁক-ঝাঁক-ঝাঁক", on start and on a clear.
- **World motif:** each world opens with a 4-note motif (`tone` with a delay, so a pause cuts it).

Every sound has a visible twin: particles and the score pop, the gold ring, a red head and a shake, the crow's turn, the gate lamp.

## Comfort and controls
- **Touch:** swipe anywhere, tap the left or right half of the board, or the two turn buttons at the bottom (they act on touch-down).
- **Keys:** arrows or WASD; Enter or Space starts and picks the end-screen choice (only on a fresh press, 0.7 s after the screen appears); 1–9 on the level list; P opens the player's pause menu. Escape belongs to the player.
- **Mouse:** click the halves or the buttons.
- **Away:** the player's pause stops the clock, frames and story timer. It releases a swipe in progress, and every celebration timer is cleared on reset. No key acts while paused.

**Kept for compatibility:**
- links `s`, `t`, `n` (classic) and `l`, `g` (levels), with the same goals per level so old links parse;
- `ektukhani-best-jhalmuri-sap` and `ektukhani-levels-jhalmuri-sap`;
- the share id, `/jhalmuri-sap`, the title, description and H1;
- the card.

**New:** `ektukhani-unlock-jhalmuri-sap` holds this game's own unlock. It is migrated once from the old rule, so nobody loses a level, and a friend's far-ahead clear records its stars without opening the levels in between.
