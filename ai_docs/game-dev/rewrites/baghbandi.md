# বাঘবন্দি: rewrite design

## Core
- **Concept:** the folk board game scratched into a courtyard: two tigers against twenty goats, on our own clearly labelled rules (আমাদের নিয়ম), against a bot with twelve named steps per side.
- **Fantasy:** a winter afternoon on নানাবাড়ির উঠোন, a stick-drawn ছক, two striped pebbles for tigers and a fistful of তেঁতুলের বিচি for goats. The older cousin who always wins is the bot.
- **Core loop:** *চাপো* a piece (every legal point lights up at once), *লাফ দাও* or *ঘেরো* (move or leap), *দেখো* the bot answer a beat later.

## Progression
Two ladders, বাঘ হয়ে and ছাগল হয়ে, each three worlds × four levels (`lib/levels.ts`). Each level's start card names its one new thing. World 1 is small positions on the real board, each a forced win proved by a solver over every reply. Worlds 2 and 3 are the full game against the bot's eight existing levels, so a link's `l` is the same bot it always was.

| World | Palette | Tiger ladder (you hunt) | Goat ladder (you trap) |
|---|---|---|---|
| ১ পাঠশালা (সকাল) | pale chalk clay | ১ প্রথম লাফ (leap, 1 move) · ২ কোনাকুনি দাগ (diagonals, 1) · ৩ গাদা (a pile loses only its top; two tigers fork it, 2) · **৪ প্রথম শিকার**: the real opening, 4 goats in 30 moves vs bot 2 | ১ বাঘ বন্দি (a trap, 1 move) · ২ পেছন ঢাকো (cover the open back, 2) · ৩ দুই বাঘ (one move shuts two leaps, 2) · **৪ শেষ ঘেরাও**: two tigers, a sharp bot, 3 moves, no goat lost |
| ২ উঠোন (দুপুর) | warm clay (the card's look) | ৫–৭ full game, goats a notch sharper each · **৮ চালাক রাখাল** (bot 4) | ৫–৭ full game, the tiger jumps more each level · **৮ ডোরাকাটা** (bot 4) |
| ৩ সাঁঝের উঠোন (সন্ধ্যা) | dark clay, lamp glow | ৯–১১ · **১২ বুড়ো রাখাল** (bot 8: looks one move ahead every time) | ৯–১১ · **১২ বাঘ মামা** (bot 8: makes its own leap chances) |

**Bot target rates (asserted in `tests/rewrite.test.ts`, casual = the test's 90%-careful person):**
- প্রথম শিকার: casual ≥ 85% (measured 97%), careless ≥ 70% (84%).
- Full ladders, casual, levels 5→12:
  - tiger: 1.00 .96 .92 .88 .54 .22 .08 .02;
  - goat: .92 .80 .28 .18 .12 .08 .08 .02.
- Asserts: level 5 ≥ 80%, no level easier than the one before (0.12 slack), level 12 ≤ 15% casual, and a sharp player still beats level 12 (tiger 23%, goat 77%).
- Every lesson: shortest forced win = its par. Level 1 on both sides is one move, under ten seconds.

## Difficulty and story
- The ladder is the difficulty. Every full-game level says what the bot changed, in the player's words ("বাঘ মাঝে মাঝে সুযোগ বুঝে লাফ দেয়।").
- The side is the other choice, remembered on the phone: বাঘ হয়ে (marked "প্রথমবার? এখান থেকে" for a newcomer, the quickest first win), ছাগল হয়ে, দুজনে.
- **Story:** none. The courtyard is the world, the four piles are the opening, and the finales get names (রাখাল, ডোরাকাটা, বাঘ মামা). Panels would only delay a one-move first win.

## Screens
- **Title (start card):**
  - the three sides (numbered ১–৩), with one line for the chosen one;
  - ‹ level › with its world, then its "নতুন" or "চ্যালেঞ্জ" line;
  - the biggest thing: the level's own first position on its world's clay, which is the start button, with a **শুরু করো** ribbon;
  - the star rule under it, and সব লেভেল.
- **Choice moment:** the সব লেভেল sheet, with both ladders, three worlds, numbered levels, stars, locks, finales in red and **এটা খেলো** on the recommended one. It holds play and the clock. The side chips and level arrows sit on the start card, where nothing runs.
- **HUD (corners only):**
  - top-left (after the ⏸ in immersive): the level badge, which opens the sheet;
  - top-right: ধরা ২/৮ or বাকি ১৮, with চাল ৩৪/১২০;
  - a thin bar along the top: goats taken, or the goats' clock.
  - Finales add a slim boss row: "বাঘ মামা ▬▬ নড়ার পথ ৬", or "চালাক রাখাল ▬▬ আর ৫টা".
- **At touch:**
  - pressing your piece lights every legal point within the same frame: a green dot for a step;
  - for a leap, a red arc over the goat, a red ring on that goat and a bigger red landing;
  - dragging works too.
  - Idle hints: tigers that can leap glow, and an open goat gets a dashed red ring.
- **Captures with weight:**
  - the tiger leaps in an arc and lands with a squash;
  - the taken seed spins off to the score corner and a dust ring pops;
  - a float of +১ (or −১ in red), a swish, a thud and a growl;
  - a gentle shake when the bot takes yours.
  - A tiger with no move gets a rope ring and a creak.
- **Danger at the edge:**
  - amber when a goat is open or your tigers are nearly boxed in (or 10 moves are left);
  - a red pulse when one more capture loses, or your tigers have one move left.
  - Static in ধীরে খেলো.
- **End screen:**
  - the title ("৮টা ধরা, ৩৪ চালে", "বাঘ বন্দি!", "শেষ ঘেরাও পার!"), with StarReveal;
  - four stats that count up: তোমার চাল, ধরা ছাগল or বাঁচানো ছাগল, সময়, ফিরিয়ে আনা;
  - one kind line, and the exact next goal ("আর ২ চাল কম লাগলে ৩ তারা।");
  - the best on this phone;
  - buttons: পরের লেভেল (Enter), আবার খেলো, শেষ চালটা ফিরিয়ে আনো (a lost lesson), and এবার ছাগল হয়ে (after the tigers' first finale).
- **Card (full games and দুজনে):** unchanged layout, now on the world's clay with the new level number. Lessons have no card.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loops)
- **রাখালের বাঁশি (signature):** four flute notes on শুরু করো.
- **Steps:** a seed tick for a goat, a stone knock for a tiger.
- **The take:** a swish, a landing thud and a short growl, plus a buzz.
- **Rope:** a creak when a tiger loses its last move.
- **বাঘ বন্দি:** three drum knocks and a rising call.
- **Shared:** pick, tap and drop, levelUp, good, lose and the StarReveal chimes. Each sound has a visible twin (the arc, the rope, the float, the turn pill).

## Comfort and controls
- **ধীরে খেলো:** the bot waits 1.2 s instead of 0.65 s. It removes the leap arc, the flying seed, the shake, the pulsing edge (the border stays, still), the count-up and the confetti. Stars are untouched.
- **Touch and mouse:** tap a piece, then tap a lit point, or drag onto it. A press on your piece selects it at once. The press that brings the window back (or closes the menu) only wakes the board.
- **Keyboard:**
  - arrows walk a cursor, and Enter or Space picks and moves;
  - Z or Backspace takes back;
  - P opens the player's menu;
  - on the start card: ১/২/৩ pick a side, ←/→ change level, Enter starts.
  - On the result, only a fresh Enter after 0.4 s acts. Clicked buttons drop focus. Escape belongs to the player.
- **Take-backs:**
  - free in পাঠশালা (even the last move of a lost lesson) and between two people;
  - three per full game against the bot, shown on the button, so a deterministic bot can't be brute-forced.
- **Kept for compatibility:**
  - `/baghbandi`, its title, description and H1 text;
  - the link format `s t p m l o n`, with no new key: a full level's game is exactly `fullStart(bot)`, so old links replay and normalize unchanged;
  - the best keys `ektukhani-best-baghbandi-bagh` and `-chhagol`; no tally.
  - The old ladders `ektukhani-levels-baghbandi-bagh` and `-chhagol` (bot levels 1–8) move once to `…-v2` as levels 5–12. An old best that proves a win becomes a star on level 11. Your own open level is kept in `ektukhani-baghbandi-{bagh,chhagol}-open`, read once from the stars, and the last side in `ektukhani-baghbandi-side`.
