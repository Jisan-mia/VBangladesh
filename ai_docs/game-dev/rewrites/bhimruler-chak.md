# ভিমরুলের চাক: rewrite design

## Core
- **Concept:** the hidden-hazard number puzzle, set in a Bangladeshi mango orchard. The bushes hide hornet nests. A cleared bush's number says how many nests are around it. Tie a red-and-white গামছা on every nest you're sure of and clear the rest.
- **Fantasy:** you're the one at নানাবাড়ি who knows where the ভিমরুল live. You walk the gardener's path into three orchards: the one behind the house, a রাজশাহী orchard in mango season, and the big চাঁপাইনবাবগঞ্জ orchards by the কানসাট হাট.
- **Loop:** *ঢোকো* (the path's bushes rustle open in a wave) → *পড়ো* (read the numbers; one of them gives a nest away) → *বাঁধো / সাফ করো* (hold a bush to tie a গামছা, tap a number to clear around it; the last bush brings the basket chord).

## Progression: 3 worlds × 10 levels (the 30 level numbers and the saved stars stay)
Orchards are laid fresh from a seed every time (`lib/orchard.ts`): nests never sit on the path's bush or its ring, and an orchard is kept only when the solver clears it by logic alone from the path, leaves real work after the entry, places every mango and post the level asks for, and (on a world's first level) shows the new kind in the first opening. Levels are data in `lib/levels.ts`.

| World | Palette | New kind of bush | Levels add, one at a time | Finale (10) |
|---|---|---|---|---|
| ১ বাড়ির পেছনে | green morning | none: numbers and the গামছা | the first nest (5×5, 2) → hold to tie → tap a number to clear around it → "২ মানে দুটো" → two numbers together → stings and the two the hornets forgive → counting the nests left → the hint → the star clock | **বুড়ো আমগাছ** (8×11, 16 nests) |
| ২ রাজশাহী | gold noon | **ঝরা আম:** a fallen mango hides its bush's number; the bush is safe but says nothing | 2 mangoes (shown in the first opening) → mangoes lie beside nests → 8×10 → 4 mangoes → 15 nests → 9 wide → 5 → 12 rows → 7 | **ফজলির বাগান** (9×12, 20, 8 mangoes) |
| ৩ চাঁপাইনবাবগঞ্জ | dusk | **বাঁশের খুঁটি:** a post's number counts only up, down, left and right | 2 posts (in the first opening) → a post's 0 → a post beside a plain 1 → 4 posts → mangoes return → 9 wide → 5 posts → 12 rows → 20 nests | **কানসাটের বড় বাগান** (9×13, 22, 6 posts, 4 mangoes) |

**Finales:** a red **শেষ বাগান** badge on the start card, a boss row under the HUD (name + a red bar of bushes left), the hornets forgive one sting instead of two, confetti on the first clear, the world's total on the end screen, a stamp on the card.

**Bot targets** (`tests/bot.ts`, asserted in `tests/levels.test.ts`): three players who read one deduction at a time, with thinking time by step (single number, two numbers, the count), a tap time, and a careless-tap rate (casual 3 %, steady 1.2 %, sharp 0).
- Level 1: a steady player wins inside 10 s on ≥ 95 % of seeds, a casual one on ≥ 70 % (median 9 s).
- Every level: the casual player clears ≥ 80 % (≥ 94 % in world 1 before the finale) and gets ★★ or better ≥ 78 %.
- ★★★ is a real target: steady ≥ 70 %, sharp ≥ 95 %, casual ≤ 80 % from level 4.
- Each finale is its world's lowest casual clear rate (90 %, 93 %, 86 %).

## Difficulty and story
- **The ladder is the difficulty.** No modes: the start card says the one new thing in plain words, and stings are the forgiveness (two per orchard, one on a finale).
- **Stars:** ★★★ within par, ★★ within twice par, ★ for any clear. Each hint and each sting lowers the ceiling one star. Pars come from the bots (20 s on level 1 to 115 s on level 30).
- **Story:** no panels. Each world is an orchard with its own light, and its finale has a name and one line ("নানার লাগানো গাছটার চারপাশে ১৬টা চাক।").

## Screens
- **Title (start card):** masthead (ভিমরুলের চাক · ★ total), ‹ level name › with its world and stars, then the biggest thing: the level's own orchard, every bush covered, with a hanging wooden sign **বাগানে ঢোকো** across it. Under it: the world's new-kind chip (with its icon), the **নতুন** line, and the size, nest count and 3-star time, with সব লেভেল. A friend's claim sits on top.
- **Choice moments, all of which pause:** সব লেভেল (from the HUD badge, the start card or the end screen): three worlds of ten, numbered, named, stars, locks, finales in red, **এটা খেলো** on the recommended level; 1–9 pick. The end screen has numbered choices, ১ marked **এটাই ভালো**.
- **HUD (corners only):** top-left the level badge (opens the sheet); top-right the wake meter (one small hornet per forgiven sting, plus the one that brings the swarm, ringed red), the nests-left chip, and the clock with its three-star track under it; a thin bar along the bottom of the HUD shows bushes cleared. Finales add the boss row. The middle stays clear.
- **During play:** one status line (the lesson step, the hint's reason, a sting warning, or the 3-star time), then the big mode switch **ঝোপ সাফ / গামছা** and **হিন্ট**. The hint opens a proven-safe bush, rings the numbers that prove it, and says why in one line.
- **Danger at the edge:** after a sting the stage edge glows amber, and red (pulsing) when one more mistake brings the swarm; a still border in ধীরে খেলো. The hornets' hum plays under it.
- **Juice:** clears ripple outward ring by ring from the tapped bush; a held bush shrinks as a red ring closes around it; a stung nest jolts and three hornets fly off; the swarm sends seven.
- **End screen:** the title (লেভেল ৩ সাফ / the finale's name / ভোঁওও… সবাই দৌড়!), StarReveal, stats counting up (সময়, সাফ ঝোপ, গামছা, ভুল, আম কুড়ালে, হিন্ট), the clear line, the exact near-miss ("আর ১২ সেকেন্ড আগে হলে ৩ তারা।"), a record or a friend comparison, the world's total on a finale, then ১ পরের লেভেল · ২ আবার খেলো · ৩ সব লেভেল. Only a fresh key 0.4 s after it appears counts.
- **Card:** the mango tree with its tied nest in the world's light, the time, the stars, a first-person line ("ভিমরুল একবার জেগেছিল, তবু বাগান সাফ।"), and a finale stamp.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, later notes on the audio clock)
1. **Rustle:** leaves on a clear; a big opening climbs a few notes (you see the ripple).
2. **Gate:** a bamboo creak and a wave of rustles on বাগানে ঢোকো (you see the path open).
3. **গামছা:** a soft buzz and the cloth's flap; untie is a short swish (you see the cloth).
4. **Sting:** an angry buzz and a thump (you see the red nest, the hornets, the edge and the wake meter).
5. **Basket (win):** mangoes thunk into the basket, then a chord pitched per world (you see the stars).
- **Signature:** the swarm, buzzes wobbling up and fading as everyone runs.
- **Loop:** the hornets' hum, only after a sting on a live orchard with sound on. It stops on pause, blur, hide, the end and unmount, and a fresh loop starts on resume or when sound comes back.

## Comfort and controls
- **ধীরে খেলো:** no ripple, shake, hornet flight, pulse, count-up or confetti; the danger edge is still; the long press is 560 ms instead of 400 ms. Stars are earned exactly the same way.
- **Touch:** tap clears (on lift, so a scroll never counts); hold 0.4 s ties or unties; a finger that travels cancels. The mode switch makes a tap tie instead. The tap that brings the window back, or closes the menu, only wakes the orchard.
- **Mouse:** left button clears on press, right button ties.
- **Keyboard:** arrows walk a cursor, Enter or Space clears (a number: clears around it), G or F ties, M switches mode, H hints, P opens the player's menu; on the start card ←/→ change level and Enter enters; on the end screen 1–3 and Enter. Escape belongs to the player.
- **Kept for compatibility:**
  - `/bhimruler-chak`, its title, description and H1 (kicker added); no tally; at least 6 FAQs (10 now).
  - Old links `#s=&t=&l=&f=&h=&n=` (no `v`) still parse and rebuild the old orchard exactly with the untouched old generator (`lib/board.ts`, `lib/legacy.ts`), opened as "বন্ধুর বাগান"; its stars aren't recorded (the ladder's orchard differs) and its best stays under the old key. New links add `v=2` and `x` (stings), and drop `f`.
  - Stars stay in `ektukhani-levels-bhimruler-chak`. Your own open level `ektukhani-bhimruler-chak-open` is set once from them, then only your own clears open the next level. Bests move to `ektukhani-best-bhimruler-chak-v2-l<N>`.
