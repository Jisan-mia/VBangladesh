# সাপলুডু: rewrite design

## Core
- **Concept:** the printed back of the ludo board, on a phone: a physical die, a piece that hops square by square, and ladders and snakes that change the race in one roll.
- **Fantasy:** a load-shedding evening at নানাবাড়ি with the board on the bed, a হারিকেন beside it, and everyone shouting when মিনু আপা lands on the long snake.
- **Core loop:** *চাপো* (the die) → *হাঁটো* (the piece walks, one tick a square) → *ওঠো বা নামো* (a ladder or a snake).

## Progression
Two ways in, chosen on the title screen. **একা** is a ladder of 12 boards in three worlds; **সবাই মিলে** is the classic 100-square board on one phone for 2–4 seats, where any seat can be the computer.

Each level adds exactly one thing, and its start card says what it is in one line. The boards, rules and rivals are data in `lib/levels.ts`.

| World (palette) | Board | Level | New thing |
|---|---|---|---|
| ১ · উঠান (chalk on the red clay floor) | ৫×৫ | ১ প্রথম চাল | roll and walk; one ladder; any roll past ২৫ still gets home |
| | | ২ প্রথম সাপ | one snake |
| | | ৩ মিনু আপা | the first rival, who rolls by herself |
| | | ৪ **উঠানের দাঁড়াশ** (finale) | a long boss snake one square before home |
| ২ · ছাদ (kites on a blue afternoon) | ৭×৭ | ৫ ঠিক দান | you must land exactly on ৪৯ |
| | | ৬ দুই গুটি | two pieces each: pick which one walks |
| | | ৭ ছোট মামাও খেলবে | two rivals |
| | | ৮ **কাটা ঘুড়ি** (finale) | the boss snake on ৪৭ |
| ৩ · লুডু বোর্ড (the printed rainbow board) | ১০×১০ | ৯ বড় বোর্ড | the classic 100 squares and its captions |
| | | ১০ নানুও বসল | three rivals |
| | | ১১ তিন ছক্কা | three sixes in a row lose the turn (a house rule) |
| | | ১২ **লোডশেডিং** (finale) | two pieces, three rivals, the ৯৩ snake announced as the boss |

- **Stars (the same three everywhere, said on the start card):** ★ ঘরে ফেরো (reach home) · ★ সবার আগে (first home) · ★ within the level's চাল par. Clearing a level means getting home, so every level can be cleared, but the second and third stars are earned. On levels 1–2 there's no rival, so "সবার আগে" comes with getting home.
- **The race goes on** after a rival gets home ("মিনু আপা ঘরে! তুমি চালিয়ে যাও"), until your piece is home.
- **Bot targets (tests, 4000 seeded races each):** level 1 finishes within 10 s of play time in at least 60 % of races (median ≤ 9 s), with ★★★ in 40–80 %. Each rival level: the player wins (★★ or more) at about a fair share or better (1 rival ≥ 48 %, 2 rivals ≥ 30 %, 3 rivals ≥ 22 %), and the two-piece levels reward the sensible pick (the RECOMMENDED pick wins more often than random picks). ★★★ on each finale lands at 8–35 %. Every level ends within 400 rolls on every seed.

## Difficulty and story
- **No difficulty modes.** The ladder is the difficulty and the die is the die. ধীরে খেলো slows the motion only.
- **No intro panels.** The world is the board; each finale has a named boss snake and one line on its start card ("উঠানের দাঁড়াশ ঘুমায় ২৪ নম্বরে। ঘরের ঠিক আগে।").
- **Rivals:** মিনু আপা (careful: always the safest pick), ছোট মামা (brings up the rear piece first), নানু (never skips a ladder). They differ only in how they pick a piece; the die is the same for everyone.

## Screens
- **Title:** the board fills the stage, dimmed, and a big physical die sits on it with **ছক্কা চাপো** under it, the biggest thing on screen. Under it, small: two chips (একা · লেভেল ৩ / সবাই মিলে), then for একা the level card (‹ name ›, the one new thing, the three stars) and সব লেভেল; for সবাই মিলে the seat chips (২/৩/৪ জন), each seat's মানুষ/কম্পিউটার switch, names (optional), and দুই গুটি. Each choice explains itself in one line.
- **HUD (corners only):** top-left the level badge (or "সবাই মিলে"), top-right the roll count; one thin row of seat chips (shape + colour + square) under them, the current seat lit. The middle is the board.
- **Turns:** the die sits in a tray under the board in the colour of whoever's turn it is. A person's turn reads "রাফির চাল · চাপো"; with more than one person, the first roll of each new person also says "ফোনটা রাফিকে দাও". A computer turn reads "মিনু আপা চালছে…", the die rolls itself after a short beat, and a tap only hurries the walk.
- **Choice moment (two pieces):** play stops. The tray turns into two numbered cards (১, ২), each with before → after and what's there ("৪২ → ৪৬ · সিঁড়ি! ৬৭-তে"); the sensible one is marked সুপারিশ. Ghost pieces with the same numbers sit on the board. Keys 1 and 2.
- **Danger at the edge:** when a snake's head is within one roll of your lead piece, the stage edge glows red and those heads get a red dashed ring. On a bite, the board shakes and the edge flashes; on a ladder, gold sparks climb with the piece. ধীরে খেলো keeps a still border, no shake, no flash.
- **Finale:** the boss snake is named on the start card, drawn bigger, and its head always wears the ring.
- **End screen:** the place (১ম/২য়…) and stars come in, then the stats count up: চাল, ছক্কা, সিঁড়িতে +ঘর, সাপে −ঘর, the best ladder and the worst bite by their captions. Then পরের লেভেল (primary), আবার, and কার্ড দেখো. In সবাই মিলে: the winner, every seat's square and bites, and আরেক দান.
- **Card:** the board with everyone where they finished, the place or winner, the চাল, and the best ladder and worst bite.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
1. **Signature, the die:** a cupped-hand rattle on the tap, a wooden ঠক as it lands (scheduled on the audio clock, so a pause cuts it).
2. **Hop:** one soft tick per square, rising a little each hop.
3. **Ladder:** a rising arpeggio, one note per rung.
4. **Snake:** a hiss, then a falling slide whistle.
5. **Six:** a bright two-note "আরেকবার".
6. **Home:** the win fanfare for first home; a softer chime for later places.

Every sound has a visible twin: the die's face, the hop, the gold sparks, the red flash and shake, the "ছক্কা" badge, the end screen. No loops.

## Comfort and controls
- **ধীরে খেলো:** the die shows its face at once, the piece jumps square to square with a longer hold on each landing, no shake, no flash, no sparks, no confetti, and no count-up. Stars and rules are unchanged.
- **Touch:** tap the die (or the board) to roll; tap during a walk to finish it; tap a card or a ghost to pick a piece.
- **Keyboard:** Space or Enter rolls and finishes a walk; 1 and 2 pick; P pauses (the player's menu); on the end screen Enter goes on only with a fresh press. Game keys live on `window` with `preventDefault`; buttons drop focus after a click.
- **Kept for compatibility:** the URL `/sap-ludu`, its title, description and H1; old links `s t n` (solo race) and `s t p g c n2 n3 n4` (group) parse and replay unchanged; new keys `l` (level) and `b` (computer seats); the best `ektukhani-best-sap-ludu` (solo race on the big board); a phone with that best opens world ৩ once (`ektukhani-sap-ludu-open`); no tally.
