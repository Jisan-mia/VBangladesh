# নিরাপদে থাকি: rewrite design

## Core
- **Concept:** a child stands in a picture: at the kerb, on the pond steps, in the kitchen, on the roof, at the fair, in a storm. A "?" bubble floats over the child. Tap the picture of the safe thing to do, and it lands in the bubble.
- **Fantasy:** you are the one who knows what to do, so the child in the picture is safe.
- **Loop (3 verbs):** দেখো (look at the picture) → বেছে নাও (tap the safe picture) → দেখো কেন (the ring lights what matters, the safe picture lands in the bubble).

## Who it is for
ছোটদের জন্য, ৬–১০ বছর (and a younger sibling who only looks at the pictures). The kids' brief wins: no clock, no lives, nothing red, 2–4 choices, ≥ 96 px targets, no harm in any picture, and **no reading or listening needed**. There is **no voice anywhere** (site rule). The scene carries the situation, each choice is a picture alone, and one small line of Bangla under the scene is for a parent or an older child.

## The look (written before styling)
- **Reference:** a printed picture flashcard, in the style the art already has: flat fills, one ink outline (`#2f2a3a`, 2.2 px), no gradients. The UI wears the same ink: a 3 px world-coloured border and a hard offset shadow under each card, like a stack of cards, and no soft blur shadows.
- **Palette, one per world:** পথে is a signal blue (`#2459a8` on `#e8f1fb`), ঘরে আর ছাদে is a terracotta (`#b5541b` on `#fff1d6`), পানি আর আকাশ is a pond teal (`#1f6f8b` on `#e7f3f8`). Green (`#2e9e44`) means "found it" and amber (`#d99a00`) means "look here", both also told apart by shape (a solid ring, a dashed ring).
- **Type:** the site's own display face for the few words on screen; no new font.
- **Corners:** small and by role (cards 10–12 px, chips 5–8 px); round only what is round (the "?" bubble, the tick).
- **Glow:** only to signal: the safe picture after two misses, and the level that is ready next.
- **First thing to do:** tap the postcard. Icons are SVG drawn in code, never emoji.

## Progression: 3 worlds, 9 levels
Level ids 1–6 keep their old meaning (the six scenes, so saved stars stay valid, and `#s=<scene>` links still open that scene). The three finales are new ids 7–9. The list shows them in play order, numbered ১–৯. Every scene has five questions, each adding one rule, in the order a child meets it. A finale has six: three from each scene of its world, alternating between the two pictures, so the child must read the new picture, not remember an order.

| # | id | World (palette) | Level | The one new idea |
|---|---|---|---|---|
| ১ | 1 | **পথে** (sunny blue) | রাস্তা পার | Look the right way, wait, use the zebra. First question has two pictures and a ghost finger. |
| ২ | 5 | | মেলায় হারিয়ে গেলে | Crowds: hold a hand, stay put, ask a mother or a shopkeeper. |
| ৩ | 7 | | **Finale: মেলার পথে** | Road and fair rules, mixed. |
| ৪ | 3 | **ঘরে আর ছাদে** (warm kitchen) | চুলা আর গরম জিনিস | Hot things are for grown-ups. |
| ৫ | 4 | | ঘুড়ি আর তার | Wires and kites. |
| ৬ | 8 | | **Finale: ছুটির দুপুর** | Kitchen and roof rules, mixed. |
| ৭ | 2 | **পানি আর আকাশ** (teal and storm grey) | পুকুরঘাট | Stay on the bank: shout, reach, throw. |
| ৮ | 6 | | ঝড়-বজ্রপাত | Cloud sounds mean: go in. |
| ৯ | 9 | | **Finale: বর্ষার বিকেল** | Water and storm rules, mixed. |

## Difficulty and story
- **No modes.** The kids' brief says never announce easy mode. The sweet spot is automatic and silent, and it now **carries over from one round to the next** (it used to reset, so "five right in a row" could never happen inside five questions):
  - three questions in a row missed on the first tap take one picture away from the next question;
  - five in a row right add one;
  - never fewer than 2 or more than 4, and never more than one from the level's own count (3, or 2 for the very first question of level ১). Every question has at least three wrong pictures so a fourth can always appear.
- **A miss is kind:** the picture wobbles, the ring lights the part of the scene that matters (the oncoming side of the road, the water, the steam), and the "?" stays. After two misses the safe picture glows (a gold ring and a dashed ring, so colour is not the only sign). A question takes at most three taps. Nothing red, nothing lost.
- **A right answer shows why:** the ring lights the part of the scene that matters, the safe picture lands in the bubble, and the one-line reason appears. A big ➜ picture button (112 px) moves on; nothing runs on a timer.
- **Motion** follows the Emil rules: transform and opacity only, `cubic-bezier(0.23, 1, 0.32, 1)`, nothing over 280 ms, a 120 ms press (`scale(.97)`) on every tappable picture, tiles stagger by 35 ms while staying tappable, key-driven answers skip the ceremony, exits are instant, and ধীরে খেলো or reduced motion turns every loop, wobble and landing off.
- **Stars** record the round only: first-tap rights of five → ৪+ is ৩, ৩+ is ২, any finished round ১ (a finale of six: ৫+ is ৩).
- **Bots (asserted in tests, 2,000 seeds a level):** a *guesser* finishes every level in ≤ 3 taps a question and earns ৩ stars on ≤ 10% of seeds; a *five-year-old* who knows it 70% of the time gets ৩ stars on level ১ on ≥ 75% and on each finale on 45–80%; a *learner* (90%) gets ৩ on every level on ≥ 90%. First right tap comes within 10 s for each.
- **No story panels.** A pre-reader can't read them. The postcard on the title and the ghost finger do the job.

## Screens
- **Title (inside the stage):** the biggest thing is a postcard: the level's own scene with the child in it, and a ▶ খেলো across the bottom. Under it: the level chip (name and world, opens the list) and one line for the parent. At the foot, small: বড়দের জন্য (the gate: share the tool's plain address).
- **Level list (a choice screen; nothing runs under it):** three world bands in their palettes, numbered cards ১–৯ with the scene's picture, name and stars. The next level to play is marked **এটা খেলো**. Everything is open; a child never meets a lock. The scene tiles are no longer under the game during play.
- **HUD (corners):** top-left (inset past the ⏸): the level badge, picture and name; top-right: a strip of five (six) dots that fill with each finished question's safe picture. The middle holds the scene and the pictures.
- **Danger:** none. Nothing can be lost.
- **Finales:** the badge carries the finale's name. Its end plays the world's four-note tune and, outside ধীরে খেলো, a small confetti. Confetti for the whole set stays as before: when all nine are done, a bigger burst.
- **End screen:** the safe pictures of the round as a row of ticked tiles, stars popping in with chimes, counts that tick up ("৫টা নিয়ম · ৪টা প্রথমবারেই"), the line "আজ … নিয়ম শিখলাম", the off-screen task, then two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ**. শেষ goes to the title with the next level ready. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** the rules learned today, one picture and one line each, no name. Saving it is behind the gate. The og image doesn't change.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick (the tile presses).
2. **Signature, "ঠিক":** two rising marimba notes pitched by world (the picture lands in the bubble).
3. **Miss:** a soft low boing, never a buzzer (the wobble and the ring).
4. **Next:** a paper swish (the next scene).
5. **Stars:** the shared chimes as scheduled tones, so the pause cuts them.
6. **World tune:** four notes at a finale's end.

## Comfort and controls
- **ধীরে খেলো:** no wobble, no landing bounce, no ring pulse (a steady ring), no confetti. Stars unchanged: nothing is timed.
- **Touch:** tap a picture. It acts on the first finger's pointerdown; a palm or second finger is ignored. Pictures are ≥ 96 × 96 px with 16 px gaps.
- **Keys:** 1–4 pick a picture, Enter or Space = ➜ (a fresh press after the answer shows, never a repeat) and খেলো on the title. P pauses through the player. Escape belongs to the player.
- **Away:** the game has no timers that move the round, so a pause freezes only the small wobble and the count-up. The first tap back after a blur only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the tap that answers the last question (the stars are saved in that same tap). `RestScreen` shows on every screen but play. `GamePage` has the kids frame: nothing in the child's view links to grown-up pages.
- **Kept for compatibility:** `ektukhani-levels-nirapode-thaki` (stars by id; 1–6 unchanged, 7–9 new); `#s=rasta|pukur|chula|ghuri|mela|jhor` still opens that scene on load (it is no longer written); `/nirapode-thaki`, the share id, title, description and H1; no network and no link state, as before.
