# জ্যাম ছাড়াও: rewrite design

## Core
- **Concept:** a Dhaka street jam as a sliding-block puzzle, on a phone. Slide the vehicles along their own lanes until your green CNG can drive out through the gap in the top footpath.
- **Fantasy:** office has just closed and every road is stuck. Your CNG is at the bottom. You know which rickshaw to nudge, which bus to back up. Four streets, from a lane in the afternoon to the night before Eid.
- **Loop:** টানো (a vehicle follows the finger, heavier ones later) → বসাও (it lands in its cell with a wobble that suits its weight) → বের করো (the CNG goes out, putt-putt and a horn).

## Progression: 4 streets, 32 jams
Every jam is a position of a random jam explored whole by `scripts/make-levels.ts`, so its fewest moves is known exactly and the tests re-solve every one. A slot of the ladder asks for a par, a crowd and what the shortest solution must show; `tests/levels.test.ts` proves each teach line true.

| Street | Adds | Jams | Par | Finale |
|---|---|---|---|---|
| ১ গলির মুখ | রিকশা আর ভ্যান (2 cells) | 1–8 | 2 → 7 | **গলির মুখের জ্যাম** |
| ২ বড় রাস্তা | বাস আর ট্রাক (3 cells) | 9–16 | 3 → 10 | **অফিস ছুটির মোড়** |
| ৩ রাস্তা খোঁড়া | ইটের স্তূপ আর বেড়া: they never move | 17–24 | 3 → 12 | **ওয়াসার খোঁড়া রাস্তা** |
| ৪ ঈদের আগের রাত | a second (blue) CNG: both must get out; one that leaves is gone | 25–32 | 4 → 14 | **ঈদের আগের রাত** |

Lessons in order (shown on the title and under the street):
- **Street 1:** drag one blocker · two blockers · a blocker that is itself pinned (think ahead) · an up-and-down vehicle blocks a sideways one · the same vehicle twice · lots of vehicles · take-back and the star count · the finale.
- **Street 2:** a bus is 3 cells · a truck needs room beside it · long vehicles can't go everywhere · bus and truck both move · a big one moves twice · small vehicles make room for big ones · patience · the finale.
- **Street 3:** a brick pile doesn't move (it really costs moves) · the lane with a wall is short · two piles · barricades do the same · the straight way is closed · three piles · mistakes cost more · the finale.
- **Street 4:** the blue CNG is yours too · a CNG that leaves frees its cells · which first · one vehicle blocks both · a crowded night · piles and two CNGs · the last turn · the finale.

**Stars** (unchanged for old links): 3★ at par, 2★ within `par + max(2, ⌈par/4⌉)`, 1★ otherwise. A hint now costs a star's worth: the first caps the jam at 2★, the second at 1★ (an old jam from a friend's link keeps the old rule: any hint, 1★). The hint button says the price before you press it.

**Bot targets (`tests/levels.test.ts`, 60 seeds a jam):** a sharp player (the solver) gets 3★ everywhere; a first-timer (half the turns random) clears jam 1 inside ten turns on ≥ 95% of seeds and gets out of every jam ≥ 85% (patience 40 turns); a casual player (one turn in five random, then carrying on) gets 3★ on jam 1 ≥ 85%, always gets out, earns ≥ 2★ on ≥ 70% of runs on every jam, and 3★ on at most half of each finale (measured 35 / 37 / 18 / 27%).

## Difficulty and story
- **The ladder is the difficulty,** no modes. Each title line says what is new in plain words.
- **Hints teach.** The first press shows a gold ghost where the vehicle should go, an arrow, and one line: which vehicle, which way, how far, why ("ট্রাকটা সবুজ CNG-র পথ আটকে আছে" or "…সরাও। তাহলে বাসটা সরার জায়গা পাবে"), and how many moves are left. The second press plays it.
- **Story (first run only, tap for the next, hold 0.6 s to skip):** 1 "অফিস ছুটির সময়। মোড়ে মোড়ে জ্যাম।" 2 "তোমার সবুজ CNG আটকা। ওপরের ফাঁকটাই বেরোনোর পথ।" 3 "গাড়ি শুধু নিজের লাইনে চলে। টেনে সরাও, পথ করে দাও।" Never on a friend's link or আরেকবার.

## Screens
- **Title:** the jam itself, drawn in code in its street's colours, is the start button, with a yellow number-plate stamp **খেলো** across its foot. Under it: ‹ জ্যাম ১২ ★★★ ›, the name, "নতুন: …" on a street's first jam, the one-line lesson, "৩ তারা: ৬ চালের মধ্যে", and সব জ্যাম. A friend's card sits above on a link. খেলো makes the vehicles drive in from the edges.
- **Choice moment:** the সব জ্যাম sheet (also in the player's menu): four streets with what each adds, numbered jams with stars, locks, a dashed finale, **এটা খেলো** on the recommended jam. Opening it pauses the clock.
- **HUD (corners only):** top-left the jam badge (opens the sheet); top-right চাল, three stars and "≤ ৬"; a thin line along the very top edge for how clear the street is. A finale shows a named bar at the top centre: "নাম বাধা ৩" or "নাম CNG ০/২".
- **Danger at the edge:** once a jam of 5+ par is one move from losing a star, the street's rim glows orange (a steady border in slow mode); the HUD star falls.
- **End screen:** a slip under the street (the street stays visible): the heading ("অফিস ছুটির মোড় পার" on a first finale), StarReveal, then চাল, সময়, হিন্ট, ফেরানো counting up over 0.8 s, the exact near-miss line, the best on this phone, and পরের জ্যাম (Enter), আরেকবার, কার্ড বানাও.
- **Card:** the jam's start in its street's colours, a round "শেষ জ্যাম" stamp on finales, the headline, stars and the human line.

## Feel
A vehicle follows the finger one to one along its lane, lifted and shadowed, heavier ones later (spring mass: rickshaw 0.8, van 1.1, bus 1.8, truck 2.3). Past a stop it gives at most 0.3 of a cell like a rubber band; the vehicle in the way shivers and a clunk (or a clank for bricks) plays once. Let go: it lands in the nearest cell (a quick flick carries on one more) with a small overshoot. Your CNG, when the road is clear, leaves with a tap.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loops)
- **Signature:** the CNG's two-stroke ভটভট, plus a pip-pip horn as it leaves.
- a rickshaw's bell, a van's chirp, a bus's low honk and a truck's air horn when lifted;
- a soft thunk as a vehicle lands (lower for heavier);
- a dull clunk against another vehicle, a clank against bricks;
- the jam building up on খেলো;
- a four-note motif for each finale, scheduled with `tone`'s delay so a pause cuts it.

Every sound has a visible twin: the lift and shadow, the rubber band and shiver, the landing wobble, the ghost, the CNG driving off.

## Comfort and controls
- **ধীরে খেলো:** the jam is in place at once (no driving in), no lift, no wobble (critically damped springs), no danger pulse, no confetti or count-up. Stars unchanged.
- **Touch and mouse:** drag a vehicle along its lane; tap your CNG when its road is clear to drive it out; tap another vehicle to pick it for the two arrow buttons. The press that brings the window back only wakes the jam.
- **Keyboard:** Enter picks the next vehicle, arrows along its lane slide it one cell (arrows across pick another), Z or Backspace take back, H hint (again to play it), P the player's menu; on the title ←/→ change jam and Enter starts; on the result only a fresh Enter 0.4 s after it appears goes on. Clicked buttons drop focus. Escape belongs to the player.
- **Away:** the player's menu, blur, hide and the sheet stop the clock, drop a drag in flight (the vehicle glides home) and ignore every input.
- **Kept for compatibility:**
  - links `#l=&m=&h=&n=` without `v` replay on the 40 old jams (`lib/legacy.ts`, pinned by `tests/link.test.ts`) and open as "পুরোনো জ্যাম" outside the ladder; new links add `v=2`;
  - old keys `ektukhani-levels-jam-chharao` and `ektukhani-jam-chharao-progress` stay untouched; the ladder's stars and bests live under `jam-chharao-v2`; your own unlock `ektukhani-unlock-jam-chharao-v2` is migrated once from the old stars by share (20 of 40 open → 17 of 32);
  - the URL `/jam-chharao`, the title and H1 text, no tally, the share id.
