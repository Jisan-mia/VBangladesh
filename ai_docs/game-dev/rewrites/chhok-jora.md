# ছক-জোড়া: rewrite design

## Core
- **Concept:** the dots-and-boxes game from the back page of a school খাতা, sewn on a নকশিকাঁথা. Every gap is a stitch, every closed box blooms into a kantha motif.
- **Fantasy:** a winter afternoon on the উঠোন with নানু's half-finished কাঁথা across your knees. The neighbours sew beside you, and every one of them wants the most flowers on the cloth.
- **Core loop:** *চাপো* a gap (the stitch shows, and warns you if it hands over a box), *সেলাই দাও* (let go: it sews), *ফুল ফোটাও* (close the fourth side, the motif blooms, and you sew again).

## Progression
A ladder of three worlds × four levels (`lib/levels.ts`). Each level's start card names its one new thing. The levels are data: the cloth size, the gold boxes, the opening stitches (fixed for lessons, seeded for full games), who sews first and the bot. Levels 5 and 8 are exactly the old সহজ বট and কঠিন বট, so old links (`l=1`, `l=2`) open on them unchanged.

| World (palette, motif) | Twist | Levels |
|---|---|---|
| ১ উঠোন (morning, cream cloth, ফুল) | the rules, on small cloths | ১ **প্রথম ফুল** (২×২, close the fourth side and sew again) · ২ **তিন নম্বর ফোঁড়** (৩×২, a third side hands the box over: the warning) · ৩ **ছোট সারি আগে** (৩×২, no safe stitch left: give the short chain) · ৪ **প্রথম কাঁথা** (finale, ৩×৩ against টুনি) |
| ২ পুকুরঘাট (afternoon, pale green cloth, মাছ ও নৌকা) | the full ৪×৪ cloth, where chains decide | ৫ **চার-চার ঘর** (the old সহজ বট) · ৬ **সারি গোনা** (the bot opens the shortest chain too) · ৭ **দুটো ছেড়ে দাও** (a lesson: hand back two to keep control) · ৮ **মিনু খালা** (finale, the old কঠিন বট: she hands back two) |
| ৩ হারিকেনের রাত (night, lamp-lit cloth, চাঁদ ও তারা) | জরির ঘর: gold boxes worth two flowers | ৯ **জরির ঘর** (৪×৪, two gold boxes) · ১০ **পাঁচ-পাঁচ ঘর** (৫×৫) · ১১ **খালা আগে** (মিনু খালা sews first) · ১২ **নানুর নকশিকাঁথা** (finale, ৫×৫, three gold, নানু never misses a chain) |

- **Stars:** ★ win (more flowers), ★★ and ★★★ at the level's flower counts, said on the start card ("৯টায় ৭টা ফুল পেলে ৩ তারা"). Lessons: ★★★ is the solver's best against any reply.
- **Bot targets (asserted in `tests/levels.test.ts`):** lessons 1–3 and 7 are forced wins at their ★★★ count against every reply (a full solver); level 1 takes three stitches. The headless players are a beginner (takes a box 3 times in 4, heeds the warning 4 in 5, heeds the second tap at the end half the time), casual, careful (never misses, no double-deal) and sharp (the old কঠিন bot's play). Measured win rates, beginner · casual · careful · sharp:
  - ৪ প্রথম কাঁথা .87 · .88 · .94 · .95 (asserted: beginner ≥ .78, casual ≥ .85);
  - ৫ .23 · .53 · .87 · .86 · ৬ .19 · .41 · .77 · .77 · ৮ মিনু খালা .07 · .17 · .32 · .43;
  - ৯ .12 · .19 · .46 · .64 · ১০ .06 · .13 · .42 · .60 · ১১ .04 · .14 · .34 · .57 · ১২ নানু .05 · .10 · .33 · .50.
  - Asserted: no level easier than the one before for a casual player (0.12 slack), level 5 ≥ .4 casual, নানু ≤ .15 casual and ≥ .3 sharp.

## Difficulty and story
- **The ladder is the difficulty.** Each bot is a named neighbour, and each start card says what changed in the player's words: টুনি "ঘর পেলে প্রায়ই নেয়, মাঝে মাঝে ভুল ফোঁড় দেয়", the সহজ বট "তৃতীয় ফোঁড় দেয় না, শেষে এলোমেলো", মিনু খালা "শেষে দুটো ঘর ছেড়ে দিয়ে বড় সারিটা নেয়", নানু "জরির ঘর চেনে, কোনো সারি ছাড়ে না".
- **Modes on the start card:** ১ একা (the ladder), ২ দুজনে (pass the phone, ৩×৩ / ৪×৪ / ৫×৫), ৩ কাটাকুটি (the 3×3 side game, kept). The choice is remembered.
- **Story:** none. The cloth is the world, the finales get names. A panel would only delay a three-stitch first win.

## Screens
- **Title (start card):** the mode chips (numbered), one line for the chosen mode; ‹ level › with its world and its "নতুন" line; the biggest thing is the level's own cloth with its opening stitches and a needle, which is the start button, with a **সেলাই শুরু** ribbon. The star rule and সব লেভেল sit under it. In দুজনে: the cloth size chips and two optional names.
- **Choice moment:** সব লেভেল, a sheet with three worlds, numbered levels, stars, locks, finales in red and **এটা খেলো** on the recommended level. It holds play and the clock.
- **HUD (corners only):** top-left the level badge (opens the sheet); top-right the two flower counts, the mover's lifted; a thin bar along the top for the cloth filled. A finale adds a slim boss row: "মিনু খালা ▬▬ জিততে আর ৪টা".
- **At touch:** a press shows the stitch at once in the mover's thread. If it would give a box its third side, the stitch turns red-dashed, the boxes the other side could then take get a red tint, and the line under the board says "এই ফোঁড়ে বট ৩টা ঘর পাবে". A stitch that gives away more than the least you must is **armed, not sewn**: the second tap sews it. The hint stitch pulses on a fresh cloth.
- **Juice:** a stitch pulls in from one hole to the next; a closed box tints, the motif blooms with a ring, "+১" (or "+২" on জরি) floats to the score, and a chain climbs in pitch. A chain of three or more taken from you shakes the board gently.
- **Danger at the edge:** amber while your armed or held stitch gives boxes away; a red pulse when no safe stitch is left on your turn ("যেকোনো ফোঁড়ে ঘর যাবে, ছোট সারিটা দাও"). Static in ধীরে খেলো.
- **Pass the phone (দুজনে):** when the turn passes, the edge takes the next player's thread colour, the line says "ফোনটা মিমকে দাও", and taps are ignored for 0.35 s so the passer's second tap never sews for the next player.
- **End screen:** the title ("৬–৩, কাঁথা তোমার!", "প্রথম কাঁথা পার!", "এবার টুনি জিতল"), StarReveal, four stats that count up (তোমার ফুল, এক টানে সেরা, ছেড়ে দেওয়া ঘর, সময়), one kind line, the exact next goal ("আর ১টা ফুল পেলে ৩ তারা"), then পরের লেভেল (Enter), আবার খেলো and কার্ড বানাও. Two people: both names' flowers and the longest run.
- **Card (full games and দুজনে):** the finished quilt on its world's palette and motifs, the score line in the two thread colours, the level's bot name, and the kind line.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loops)
1. **Stitch:** a thread hiss and the needle's tick, lower for the bot.
2. **Bloom:** a click and a chime that climbs with each box in the same turn; জরি adds a high shimmer.
3. **Warning:** a soft low knock when a stitch is armed.
4. **Hand-off:** two quick notes when the phone changes hands.
5. **Signature, কাঁথার সুর:** four notes like a lullaby when sewing starts.
6. **The end:** a rising fanfare for a win, a gentle falling one for a loss, scheduled on the audio clock so a fresh cloth (`silenceScheduled`) cuts it.

Every sound has a visible twin: the stitch drawing in, the bloom and float, the red ghost and line, the edge colour and the end screen.

## Comfort and controls
- **ধীরে খেলো:** the bot waits 1.1 s (0.7 s while taking a chain) instead of 0.52 s (0.3 s). No bloom spin, no stitch pull, no float, no shake, no pulsing edge (the border stays, still), no count-up and no confetti. The warnings and the second tap stay. Stars are untouched.
- **Touch and mouse:** press a gap to see the stitch, slide to another, let go to sew. A mouse shows the stitch on hover. The press that brings the window back, or closes the menu, only wakes the cloth.
- **Keyboard:** the arrows walk a cursor (they also drop focus from any button), Enter or Space sews (twice for an armed stitch), Z or Backspace takes back, P opens the player's menu. On the start card ১/২/৩ pick a mode, ←/→ change the level, Enter starts. On the result only a fresh Enter after 0.4 s goes on. Clicked buttons drop focus, so Enter never presses ফিরিয়ে আনো. Escape belongs to the player.
- **Take-backs:** free in lessons and for two people; three per quilt against a bot, shown on the button.
- **Kept for compatibility:**
  - `/chhok-jora`, its title, description and H1 text;
  - the link format `s t l m o n` (4×4, `l` 0/1/2) still parses and replays exactly; new keys are `q` (the ladder level) and `z` (the cloth size for two people). The move alphabet grows from 40 to 62 characters with the old 40 as its start;
  - the old best keys `ektukhani-best-chhok-jora-sohoj` / `-kothin` move once into stars on levels 5 and 8 (`ektukhani-levels-chhok-jora`); your own open level is `ektukhani-chhok-jora-open`, read once from the stars; the mode in `ektukhani-chhok-jora-mode`;
  - কাটাকুটি keeps `ektukhani-levels-chhok-jora-katakuti`; no tally.
