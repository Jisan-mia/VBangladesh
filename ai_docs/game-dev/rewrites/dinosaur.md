# ডাইনোসর খুঁজি: rewrite design

## Look (written first, as the `unslop-ui` rule asks)
- **Reference:** a palaeontologist's field notebook and specimen drawer: kraft-paper tags with a stamped number, an ink frame round the pit, flat colour, bones drawn like museum labels. Not a cartoon dig-site poster.
- **Palette, one per world, each tied to the ground it digs:** বালুর মাঠ = golden sand with burnt-orange tags (#b4561b); জঙ্গলের মাটি = wet jungle litter with petrol-teal tags (#1f6a6f); পাহাড়ের গা = grey-blue scree with steel-blue tags (#3b5f8f). Ink is dark umber (#2b1d12). The sand colour is the subject, not a page background (marked `unslop-ignore`).
- **Type:** the site's own display and body fonts only (`--font-display`). No serif, no new font.
- **Shape:** square corners (2–4 px) on everything pressable or framed; a radius only on the truly round (the progress dots, the sun, the mouth bubble). Pressable things are blocks with a thick ink bottom edge that sinks when pressed.
- **Glow:** only to signal. The white flash ring when a bone shows, the sparkle over a bone nobody found after a quiet while, the dashed ring over the right place or food after two slips. No resting glows, no gradients in the CSS (the sand's own gradient is drawn on canvas).
- **Icons:** all SVG (↻, the house, ▶, the book, the leaf, the meat, the medal). No emoji.
- **What the child does first:** press the pit. The title *is* the pit: sand, a skull showing through, a brush sweeping.

## Core
- **Concept:** brush the sand off buried bones, put the skeleton together, watch the dinosaur stand up, and learn how big it was (beside a bus) and what it ate (from its teeth).
- **Fantasy:** you are the one with the brush on the dig. The bones are real; the sand has weight (grains fly, deep sand takes two passes, rocks don't give).
- **Loop (3 verbs):** খুঁড়ো (brush the pit) → বসাও (a bone to its place; the skeleton stands) → চেনো (the food from the teeth; the size beside a bus).

## Who it is for
ছোটদের জন্য, ৪–৯ বছর. The kids' brief wins: nothing is timed, no lives, no red, 2–4 choices, targets at least 96 px (bones, foods, ▶ and the end buttons 112), no reading needed, **no voice anywhere**. The pointer never acts without a press.

## Progression: 3 worlds, 9 levels
Ids 1–6 keep their old meaning (the same two dinosaurs, so saved stars still fit). Ids 7–9 are new: each world's finale. The list shows play order, numbered ১–৯. Everything is open.

| # | id | World | Level | The one new thing | Pit |
|---|---|---|---|---|---|
| ১ | 1 | **বালুর মাঠ** (sand) | বালু সরাও | Brush: a swipe, or a tap. A ghost finger shows it. | 3 bones, mound + crack mark each |
| ২ | 2 | | গভীর বালু | Deep sand: lift the finger and brush again. Ghost finger does two passes. | 3 bones, 2 strokes deep |
| ৩ | 7 | | **Finale: টি-রেক্সের কঙ্কাল** | One skeleton from **two pits** (3 bones each), deep sand. A name banner and the world tune when it stands. | 2 × 3 |
| ৪ | 3 | **জঙ্গলের মাটি** (jungle) | পাথরের ফাঁকে | Rocks never clear: brush round them, the brush knocks. | 4 bones, 2 rocks |
| ৫ | 4 | | সব হাড় নয় | A shell, a pebble, a leaf print: shown, not a bone. | 4 bones, 1 rock, 2 not-bones |
| ৬ | 8 | | **Finale: ব্র্যাকিওসরাসের কঙ্কাল** | Two pits, rocks and a shell. 22 m, two buses. | 2 × 3 |
| ৭ | 5 | **পাহাড়ের গা** (hill) | ছায়া দেখে বসাও | The skeleton board shows only the dinosaur's shadow, no grey bones. | 5 bones |
| ৮ | 6 | | চিহ্ন ছাড়া খোঁড়া | The sand has no mound or crack. A sparkle appears after 8 quiet seconds. | 5 bones, unmarked |
| ৯ | 9 | | **Finale: ডিপ্লোডোকাসের কঙ্কাল** | Everything: two pits, rocks, a shell, no marks, only the shadow. 26 m, three buses. | 2 × 3 |

A level is two dinosaurs (the pair that always was), each: dig → build → meet → facts. A finale is one giant. Bones per dinosaur follow a **sweet-spot pace, never announced**: three slips in a row ease the next one (one bone fewer, the right place glows); five right in a row step it up (one more, never over six). A finale is always six.

Bot targets (`tests/dig.test.ts`, a headless digger at 300 units/s, 0.35 s lifts, ±14 aim error, one scribble in seven off): every pit is always clearable; level ১ is out in ≤ 10 s 97% of the time and ≤ 7 s 90% of the time (median 4 s); every other pit in ≤ 20 s 95% of the time (unmarked pits take the full 14.6 s of a row sweep).

## Feedback that teaches
- **A bone shows:** the sand gives, the bone lifts 9 px and settles, a ring flashes once, the tray slot fills, a bright pick plays. **A not-bone** bumps and plops (lower, softer), no tray slot. **A rock** rocks and knocks.
- **A slip:** the wrong place wobbles; one line says what the bone is and where it goes. After two slips the right place gets a dashed ring. A wrong food is crossed out and one line shows the teeth. No buzzer, no red, no lives.
- **The skeleton stands:** the last bone flies in and snaps; 340 ms later the bones fade as the dinosaur settles in from 8 px low and 94%, a dust ring goes along the ground, the "গুম গুম" signature plays (a low note, then a rising one), then the mouth bubble appears.
- **Facts as pictures:** the board becomes a size picture (the dinosaur on a bar of its real length over numbered buses, a rickshaw for the small ones, to one scale). Under it the food in pictures: mouth → leaf or meat. The Bangla lines are for the parent.
- **Stars** record the round: 3 = no slip, 2 = up to two, 1 = finished. ধীরে খেলো changes nothing about stars.

## Screens
- **Title (inside the stage):** the pit with a skull showing and a brush sweeping, the whole picture is the button, **▶ খুঁড়ি** across its foot. Below, small: a chip with the next level's dinosaurs (opens the list), the finder's book, and বড়দের জন্য (the share gate).
- **Level list (a choice screen):** three world bands; numbered cards with the level's dinosaurs (in colour once found, a shadow before), its name and stars. The next to play carries ▶ and a ring.
- **HUD (corners):** top-left a tag with the level number and name; top-right dots for the level's dinosaurs and the book (found/12). The middle holds the board. Nothing can be lost, so no danger edge.
- **Dig:** the pit, then a tally of dashed slots that fill with the bones found, then one line of help. **Build:** the board (skeleton or shadow), then the tray (96 × 84 bones). **Meet:** the standing dinosaur with its mouth in a bubble, two big food blocks. **Facts:** the size board, the card (name, food, ▶ 96 px). Nothing moves on by itself except the 0.8 s beat that lets the last bone lift.
- **Finale:** a name banner while it stands, a world tune on the end screen with a medal and a confetti burst (not in ধীরে খেলো).
- **End screen:** the dinosaurs standing on the ground, the stars with chimes, real stats counting up ("৬টা হাড় · ৫টা প্রথমবারেই বসেছে"), what you can do now, a task off the screen, then two equal 112 px picture buttons: ↻ আবার খেলো and a house for শেষ (to the title, the next level ready). Under them আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** what was found (a finale shows the giant alone), the stars, the finder's book dots. No name.

## Sound (`shared/game-sound.ts` only; no loops, no voice)
Brush hiss (rate-limited, rises on a second pass) · bone found (pick + bell) · rock knock · not-bone plop · bone snap · soft miss (a low boing) · **signature: the "গুম গুম" when the dinosaur stands** · right food chime · page swish · star chimes · the world's four-note tune on a finale. All one-shots; the stars and tune are scheduled tones, so the player's pause cuts them. Every sound has a picture twin; it plays fully on mute.

## Comfort and controls
- **ধীরে খেলো / reduced motion:** no dust, no wobble, no sweeping brush or ghost finger loop, no pulses, no fly-in, no confetti. Things whose animation ended on "gone" start gone (the skeleton under the standing dinosaur, the flash ring, the banner). Stars unchanged.
- **Touch and mouse:** press and drag to brush; a tap clears a bigger patch. Only the first finger counts; hover never brushes; a press lost in another window ends the stroke. Tap a tray bone, then tap the skeleton (the nearest empty place takes it).
- **Keyboard:** Enter or Space on the sand digs at the next bone (twice in deep sand); 1–6 pick a tray bone; Tab and Enter on places and buttons; P pauses (Escape is the player's); Enter or Space gives ▶ or আবার খেলো only from a fresh press.
- **Away:** the player pauses on blur and hide; the stroke is released; the dig beat waits; the first tap back only wakes the game.
- **Kids:** `atBreak()` when a round starts and at the tap that wins the last dinosaur (stars saved in the same tap). The rest screen is the kit's modal. The share gate shuts at the next tap elsewhere or after one action.

## Kept for compatibility
`ektukhani-levels-dinosaur` (ids 1–6 unchanged), `ektukhani-dinosaur-book`, `/dinosaur`, no link state and no tally, the title, H1 and description, 10 FAQs.
