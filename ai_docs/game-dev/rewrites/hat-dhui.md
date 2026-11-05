# হাত ধুই, দাঁত মাজি: rewrite design

## Core
- **Concept:** a routine to follow at the sink. The phone leans by the basin, a ring fills, and the picture shows exactly what the hands (or the brush) do now. Suds grow, germs pop, and the child can pop the bubbles too.
- **Fantasy:** you are the one who sends the germs away. Each step pops two of them, and the count in the corner goes up.
- **Loop (3 verbs):** ধরো (soap and brush in hand, tap ▶) → ঘষো (copy the picture while the ring fills) → ধোও (the picture turns clean, then rinse and dry).

## Who it is for
ছোটদের জন্য, ৩–৮ বছর. The kids' brief wins over the games brief: no clock numbers, no lives, nothing red, 2–4 choices, ≥ 96 px targets, no reading needed. Text is for the parent reading aloud. **No voice anywhere** (site rule): every cue is a picture, a motion or a sound effect.

## Progression: 1 world (বেসিন), 3 levels, ids unchanged
| id | Level | The one new thing | Length |
|---|---|---|---|
| 1 | **হাত ধোয়া** | follow six hand moves (WHO), a part glows and its two germs pop | 20 s |
| 2 | **দাঁত মাজা** | the brush travels the mouth: upper, lower, then tongue; at the halfway mark a cheer ("অর্ধেক হলো": a half-moon badge with a star, three notes) so a four-year-old stays at the sink | 2 min |
| 3 | **কখন ধোব** | pictures only: which moment needs soap? Six moments, a wrong pick wobbles and hints, after two the right one glows | about 1 min |

Level 3 is the set's finale: finishing all three for the first time fires confetti once (the brief: confetti for a whole set only).

## Difficulty and story
- **No modes and no story.** A pre-reader can't read panels, and the brief says never announce easy mode.
- **Quiet sweet spot (কখন ধোব only):** three questions in a row missed on the first tap take a picture away (3 → 2); five right in a row add one (3 → 4).
- **Stars are a record only:** a finished routine is 3 stars. কখন ধোব: 5–6 right first time = 3, 3–4 = 2, else 1. ধীরে খেলো changes no star.
- **Bots (asserted in tests):** a guesser finishes the quiz on every seed in ≤ 3 taps a question and earns 3 stars on ≤ 10% of seeds; a learner (90%) earns 3 stars on ≥ 90%; a five-year-old (70%) earns at least 2 stars on ≥ 80%. A routine always takes exactly its length of *shown* time, whatever the pauses and blurs.

## Screens
- **Title (inside the stage):** the biggest thing is the activity's own picture in a round pool (wet hands and soap; the brush with a pea of paste; the soap-and-hands with a question bubble) with a ▶ খেলো pill. Under it, three picture chips (hands, tooth, clock), each ≥ 96 px, with its stars; the chosen one is pressed. One small line for the parent. At the foot, small: বড়দের জন্য (the gate: share the tool's address).
- **Routine (play):**
  - the stage is the pool with a ring around it, the hands or mouth in the middle, the suds on top (tap a bubble to pop it);
  - top-left corner (inset past the ⏸ band by the player): a row of dots, one per step; top-right: a germ with the count that has gone;
  - under the pool: the step line and, for the brush, a tooth drawing of which side;
  - there are no buttons: ⏸ is the player's;
  - **the middle stays clear** and nothing flashes;
  - the halfway badge sits over the lower pool for 2 s.
- **Quiz (play):** the question is a picture (soap, hands and a "?" bubble), then 2–4 cards of picture plus a caption. A right pick: the card goes green with a bubble burst, the "why" shows beside a rinse picture, and a round → button (≥ 96 px) waits. Nothing moves on its own.
- **Danger:** none. Nothing can be lost.
- **End screen:** a clean picture (hands with sparkles, a smile, or the six moments), stars popping in, then counts ticking up (ধাপ · জীবাণু পালাল · সেকেন্ড; or সময় · প্রথমবারেই). Then what to do next (rinse and dry pictures, the pea of paste, the mishti tip, the bedtime star). Two 112 px picture buttons of equal weight: **আবার খেলো** (circular arrow) and **শেষ** (a house). শেষ goes to the title with the next level ready. Under them: আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** unchanged: the steps or zones as tiles, no name, no stars on the og image; saving it is behind the gate.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Start chime** as the ring begins.
2. **Beat:** a soft pentatonic note every half second while washing; a brush swish every 0.6 s while brushing. You see the hands or brush move.
3. **Germ pop:** two rising notes at every step. You see the germs burst.
4. **Halfway:** three rising notes. You see the half-moon badge.
5. **Signature, "পরিষ্কার":** a bright four-note run with a shimmer when the ring closes. You see the clean picture.
6. **Bubble:** a tiny pop when you tap a bubble. You see it vanish.
7. Soft miss in the quiz (never a buzzer), the shared good chime for a right pick, the shared star chimes.

## Comfort and controls
- **ধীরে খেলো:** no wiggle, no rub (hands hold still, the glow stays steady), half as many bubbles and they drift slowly, no confetti. The routine's length and the stars are unchanged: the ring is the honest clock.
- **Touch:** one pointer; tap a bubble to pop it; tap a chip, ▶, a card or an end button. All ≥ 96 px with 16 px gaps. No double tap, no drag, no long press (that's the gate's).
- **Keys:** Enter or Space on the title = খেলো, 1–3 choose a chip; in the quiz 1–4 pick a card and Enter/Space goes on; at the end a fresh Enter = আবার খেলো. P pauses through the player. Escape belongs to the player.
- **Away:** the player pauses on blur and hide; the ring, the beat, the finish timer and the wake lock all stop and come back with চালিয়ে যাও. The first tap back only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the moment it is won: the instant the ring closes, or the last right card. The stars are saved in the same step. `RestScreen` shows on every screen but play.
- **Kept for compatibility:** `ektukhani-levels-hat-dhui` (ids 1–3), `#m=hat|dat|kokhon` links (read once on load; the address is updated with `replaceState`, never `location.hash`), the title, H1, description, FAQ, the card, and no link state or tally.
