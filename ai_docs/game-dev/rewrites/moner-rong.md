# মনের রং: rewrite design

## Core
- **Concept:** a feelings picture-book for ages 4–9. Each picture shows a child in a small Bangladeshi moment (the kite is cut, the lights go out, a surprise bicycle). The child's face is a grey "?". You find the face that fits, and **that feeling's colour floods the page and the face draws itself**. Then you choose a kind thing to do.
- **Fantasy:** you are the one who paints in how somebody feels. Every feeling has its own colour, and none is wrong.
- **Loop (3 verbs):** দেখো (the picture and the grey "?" face) → বেছে নাও (tap the face that fits; the colour fills, the strokes of the face draw in) → করো (tap one of two kind things in pictures; the face settles; → goes on).

## What was wrong, and what changed
- A set played once showed 3 stars and told the parent "৯টা ছবি". The set was recorded again each time the hidden ধাপ শেষ button got an Enter. Now the win is recorded at the tap that finishes the last picture, once per round (`won()`), and the card counts only recorded rounds.
- The end buttons were words, 72 px and 49 px. Now two 112 px picture buttons of equal size (a circling arrow, a closed book), then a picture-only → for the next level.
- No pause, no how-to. Now the player's pause menu (with সব লেভেল) owns both; no toggles inside the game.
- **No voice anywhere.** `speak()`, `SpeakButton` and every `speechSynthesis` use are gone. Every cue is a picture, a motion or a sound effect: the scene drawing, the grey "?" that fills with colour, the face that wobbles on a miss, a gold ring and a dashed ring after two misses, and a ghost finger.
- The kind choices were icon plus a long sentence a parent had to read. Now each is a big picture card (icon 72 px); the sentence is a small caption.

## Progression: 3 worlds, 9 levels
Every level adds one new idea; the last in a world is a named finale that mixes what the world taught, drawn from the world's pictures by seed. All levels stay open (no locks).

| World (palette) | Levels | Finale |
|---|---|---|
| **রোদের রং** (sun) | 1 খুশি আর মন খারাপ (2 faces, ghost finger) · 2 রাগ (a third face) | **3 রোদ-বৃষ্টি** (4 of the 6 pictures, 3 faces) |
| **ঝড়ের রং** (storm) | 4 ভয় (a fourth face) · 5 অবাক আর লজ্জা (new faces; some pictures fit two) | **6 ঝড়ের রাত** (4 of 6) |
| **মেলার রং** (festival) | 7 ছয়টা মুখ (all six faces, for 6+) · 8 একসাথে দুটো মন (one picture, two true faces) | **9 মনের রংধনু** (5 of 8, six faces) |

- Level ids 1..9. Old saved stars (sets 1..6) move once: set 1→1, 2→2, 3→4, 4→5, 5→7, 6→8 (`ektukhani-moved-moner-rong`).
- **Stars are practice, nothing else:** one star per time a level was played through, up to three. The end screen, the saved stars and the parents' card all show the same number. No right or wrong is counted.
- **Quiet ease:** three misses in a row take faces away from the next picture (never fewer than the true faces plus one); five first-try fits in a row give them back. A miss wobbles, shows one clue from the picture, and after two misses the fitting face glows with a gold ring and a dashed ring.
- **Bots (400 seeds a level):** a guesser (random, then the glowing face) finishes every level in at most 3 taps a picture; a 4-year-old that knows the feeling 70% of the time finishes in at most 4 taps a picture on average; the ease turns on after 3 misses and off after 5 fits.

## Difficulty and story
No modes and no story: a 4-year-old can't read panels, and the brief says never announce "easy". Calm, untimed. The ghost finger shows the first tap on the first picture ever and comes back after 7 idle seconds (a hint, not progress; it stops while paused).

## Screens
- **Title:** the biggest thing is a ring of the six coloured faces, bobbing, with **খেলো** under it. Under that, three world tiles (a picture each) and the level chip ("২ · রাগ · সব লেভেল") with one line for the parent.
- **Level list (a choice screen):** the world's levels, each with the face it introduces, its name, one line, its stars and **এটা খেলো** on the suggested one. Reached from the title, the end screen, and the pause menu's সব লেভেল (which leaves the round unrecorded).
- **Play:** badge top-left (world, number, name), a strip of colour dots top-right (one per picture; each fills with the colour of the face found). Middle: the picture and the child. Below: the line (for the parent), then the faces, the two kind pictures, or → (96 px).
- **Danger:** none; nothing is lost.
- **Finale:** the badge carries its name; ending it plays the world's tune and a small confetti burst (not in ধীরে খেলো).
- **End screen:** the stars, a swatch per picture (the face in its colour), counts that tick up ("৪টা ছবি", "৩টা রং"), one thing to do away from the screen, then **আবার খেলো** and **শেষ** at 112 px, then আব্বু-আম্মুকে দেখাও.
- **Card (ShowParent):** "আজ ৯টা ছবিতে মনের রং চিনলাম", the faces named today in their colours, and the level with its stars (the same number as the end screen). No name, no photo. Saving it and the tool's link sit behind the parent gate.

## Sound (`shared/game-sound.ts`, no loops)
1. Tap: a soft tick on touch.
2. **Signature "রং ভরা":** a soft paint swish, then two rising marimba notes, one root per feeling (you also see the colour fill).
3. Miss: a low soft boing (you see the wobble).
4. Kind thing: a warm two-note answer.
5. Next picture: a paper swish.
6. Level done: the star chimes; a finale adds the world's four-note tune.

## Comfort and controls
- ধীরে খেলো: no fill sweep, no stroke drawing, no wobble, no confetti; the glow is a steady ring.
- Touch: first finger only, acts on touch. Faces ≥ 96 px, 16 px gaps. Keys: 1–6 pick a face (or one of the two kind pictures), Enter or Space is → and, on the end screen, আবার খেলো (a fresh press only). P pauses through the player.
- Away: the player pauses on blur and hide. The first tap back mid-round only wakes the game.
- Kids: `useKidsSession`. `atBreak()` runs when a round starts and at the tap that finishes the last picture (stars saved in the same tap). Between rounds it checks every second. No network, no name, no share in the child's view.
- **Kept:** `/moner-rong`, the title and H1, `ektukhani-levels-moner-rong` (migrated once), the static share card, no tally.
