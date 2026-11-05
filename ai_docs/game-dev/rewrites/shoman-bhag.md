# সমান ভাগ: rewrite design

## Core
- **Concept:** guests sit on a woven mat with a plate each. Lift a piece out of the basket and put it on a plate until nobody has less than anybody else. Later: cut the last রুটি into equal pieces, decide who gets the last piece, and name a piece (½, ⅓, ¼).
- **Fantasy:** laying the floor mat for guests at home. Every face tells you how the table is doing: sad for less, surprised for more, smiling when it is fair.
- **Loop (3 verbs):** তোলো (lift a piece, by tap or drag) → দাও (put it on a plate) → হাসাও (everyone equal, every face smiles, ➜ brings the next guests).

## Who it is for
ছোটদের জন্য, ৫–১০ বছর. The kids' brief wins: no clock, no lives, nothing red, 2–4 choices, ≥ 96 px targets, no reading needed for the youngest. **No voice anywhere** (site rule): `speak()` and `SpeakButton` are gone. Every cue is a picture, a motion or a sound effect; the Bangla line under the board is for the parent.

## Progression: 4 worlds, 10 levels, one new idea each
Level ids 1–5 keep their old meaning, so saved stars stay true. Ids 6–10 are new. The list shows them in play order ১–১০.

| # | id | World (cloth) | Level | The one new thing | Servings |
|---|---|---|---|---|---|
| ১ | 1 | **অর্ধেক** (হলুদ চাদর: turmeric) | দুজনের ভাগ | Two plates, equal. A ghost finger on the first piece; the first serving is one piece each, so the first win takes 4 touches. | 4 |
| ২ | 6 | | **Finale: দুজনের দাওয়াত** | The last রুটি cut in two, mixed with plain sharing. | 6 |
| ৩ | 2 | **তিন ভাগ** (নীল পাটি: indigo) | তিনজনের ভাগ | Three plates. | 4 |
| ৪ | 7 | | **Finale: তিনজনের দাওয়াত** | Cut a রুটি in three. | 6 |
| ৫ | 3 | **চার ভাগ** (লাল পাড়: saree red) | চারজনের ভাগ | Four plates. | 4 |
| ৬ | 4 | | রুটি কাটা | Any of 2, 3 or 4: match the knife to the guests. | 4 |
| ৭ | 8 | | **Finale: চারজনের ভোজ** | Cutting into quarters, mixed. | 6 |
| ৮ | 9 | **শেষ টুকরো** (গোলাপি মেলা: magenta) | শেষটা কে পাবে? | One piece left over: break it, give it to the little one, keep it for আম্মু, or give it to a guest. No answer is wrong. | 4 |
| ৯ | 5 | | ভাগের নাম | Name the shaded piece: ½, ⅓ or ¼. Then which রুটি is cut fairly? | 4 |
| ১০ | 10 | | **Grand finale: সমান ভাগের মেলা** | Naming, fairness, a last piece and a cut, together. Confetti. | 6 |

The leftover piece used to sit inside the sharing steps. It is now its own level, so levels ১–৭ are clean fair sharing and the last-piece idea has its own world.

## Difficulty and story
- **No modes and no story:** a pre-reader cannot read panels. The mat on the title and the ghost finger do the job.
- **Silent sweet spot:** three servings in a row missed take pieces away from the next one (1–2 each, halves and quarters only, two answers on a naming card); five first-try servings in a row lift it. The ease carries between rounds and is never announced.
- **A miss teaches in pictures, never words alone, never a buzzer:**
  - *a plate over its share:* the guest turns surprised, the extra piece glows, an arrow out of the plate says "take one back";
  - *a wrong cut:* a row of heads (the guests) over a row of pieces; a head with no piece, or a piece with no head, is drawn dashed;
  - *a wrong name:* the wedges get numbers 1, 2, 3 so the child counts them;
  - *a wrong "fair" pick:* a ≠ badge on the unequal roti.
  After two misses the right choice glows with a dashed ring and the finger points at it.
- **The finger comes back:** on a level the child has never finished (first serving), and after 7 s of quiet on any level. It stops under pause and blur and on every touch.
- **Stars** record the round only, never spent or compared: all but one serving first time → ৩, half or more → ২, else ১. The last-piece choice never changes them. ধীরে খেলো does not touch them.

## Screens
- **Title (inside the stage):** the laid mat is the start button: a basket of পিঠা, the level's guests (happy faces) over their plates, and a big ▶ খেলো. Under it, small: the level chip (opens the list) and one line for a parent. At the foot, বড়দের জন্য (the gate: share the plain link).
- **Level list:** four world bands on their own cloth colours, numbered cards with the roti cut the way the level cuts it (a covered dish with a heart for the last-piece level), the name and the stars. The next level has a gold ▶ badge. Everything is open. The pause menu's সব লেভেল opens it.
- **Play (HUD in the corners):** top-left the level badge, top-right the served strip (4 or 6 boxes that fill with each serving's food). The middle holds the mat: basket, guests, plates. One Bangla line for the parent sits under it. The top 50 px stays free for the player's ⏸.
- **The touch:** tap the basket (or a plate) to lift a piece, tap a plate to put it down; or press and drag it. The lifted piece follows the finger a little above it, the plate under it lights up, and it flies in with a small arc and a thud. Let go in the air and it goes back.
- **The last piece:** three picture buttons (112 px): a piece broken over three plates, the little guest with the piece, a covered dish with a heart. Or tap a plate to give it to one guest.
- **Served:** every face smiles one after another, the seats turn green, the signature sound plays, and a 104 px ➜ rises. Nothing moves on until it is pressed.
- **End screen:** the stage is cleared. One round tile per serving (its food), the stars popping in with chimes, counts that tick up beside a plate icon and a finger icon, what the child can do now, a task off the screen, then two equal 112 px picture buttons: আবার খেলো (circular arrow) and শেষ (a house), and আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** what was done today: guests served, রুটি cut into which fractions, pieces named, and the last table as a sum (৬ ÷ ৩ = ২টা করে পিঠা). No name, no stars, nothing about who got the last piece. Saving it is behind the gate.

## Look (unslop-ui)
- **Reference:** a Bangladeshi dining mat, শীতলপাটি, laid on the floor: woven stripes, melamine plates, a cane basket with a handle. The mat is a woven background, so the board is rectangular with small corners (8 px). Only things that are round in life are round: plates, faces, the numbered badges.
- **Palette per world, chosen for the cloth:** turmeric, indigo, saree red, magenta. Ink `#2b2433`, basket wood `#8a5530`, green `#2e8b57` only for "served" and "right", gold `#f2a900` only for hints. The food and faces keep their own colours. No cream-plus-serif-plus-sage: the paper tint is the mat's own weave.
- **Type:** the site's own display face (`--font-display`) for headings and numbers. Names and lines at 16–20 px, Bangla line-height ≥ 1.5.
- **Glow only to signal:** the gold ring and dashed outline on the hint, the glow on a piece in the hand or an extra piece, the green of a served seat. No decorative shadow or gradient glow. All icons are SVG; no emoji.
- **First action:** tap the mat, then the basket, then a plate.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Lift:** a soft rising pop. You see the piece rise.
2. **Drop:** a wooden thud pitched higher for each piece already on the plate, so the child hears the count. You see the piece land and the plate squash.
3. **Signature, "থালার ঠুং":** two plate clinks and a rising bell, in the key of the world, when everyone is served. You see the smiles.
4. **Over / wrong:** a soft low boing, never a buzzer. You see the arrow, the wobble, the grey dashed tile.
5. **Cut:** a whoosh and a knock. You see the lines draw across the roti.
6. **Next guests:** a cloth rustle. **Stars:** chimes as scheduled tones, so the player's pause cuts them. **World tune:** four notes when a finale is done.

## Motion (Emil Kowalski skills: `animate`, `choreograph`, `emil-design-eng`, `animation-performance`)
- Tokens `--ease-out: cubic-bezier(.23,1,.32,1)` and `--ease-in-out: cubic-bezier(.77,0,.175,1)`. UI motion is 100–260 ms; stars 380 ms (a delight moment).
- **One entrance per container:** the mat rises in (220 ms) once per serving; its faces and plates are already there. The cheer on a served table is a stagger of `60 ms × i`, each seat a 7 px hop, on `transform` only. The ➜ follows the cheer by 120 ms and nudges twice after 2.6 s, then stops.
- **The flying piece** is a FLIP on the landed piece itself (WAAPI, `transform` only, no clone): from where the finger let go (150 ms) or from where it was lifted (260 ms), through an arc, then the plate squashes (200 ms). Drag moves one element's `transform` per pointermove in `drag.hot.ts`.
- Nothing starts from scale(0) (pops from .92, stars from .5). Hover motion is gated by `(hover:hover) and (pointer:fine)`. Press is a small push.
- The hint ring pulses `opacity` on a pseudo-element, not a box-shadow; the finger's ripple scales a circle. They loop because they are the cue.
- **ধীরে খেলো and prefers-reduced-motion:** no fly, hop, wobble, pop or loop; a 160 ms fade stays so a change still reads; the hint ring and the ripple become steady. The count-up jumps to its end.

## Comfort and controls
- **Touch:** tap or drag; first pointer only. Plates ≥ 118 px, knives and choices ≥ 104 px, ➜ 104 px, 12–16 px gaps. **Keys:** Space lifts from the basket (or presses what is focused), 1–4 press the Nth choice or plate, Enter or Space = ➜ or খেলো (end: a fresh press = আবার খেলো), P pauses through the player, Escape is the player's.
- **Away:** the player pauses on blur and hide. The game has no clock; a held piece goes back, a drag stops following, and the 7 s finger nudge stops. Back from a blur with no menu, the first touch only wakes the game.
- **Kids:** `atBreak()` runs when a round starts and at the last piece of the last serving, which also saves the stars. `RestScreen` shows on every screen but play.
- **Kept:** `ektukhani-levels-shoman-bhag` (ids 1–5 unchanged, 6–10 new), `/shoman-bhag`, the title, H1 and description, no link state and no tally, no network.
