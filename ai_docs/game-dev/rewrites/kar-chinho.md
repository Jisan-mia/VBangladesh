# কার-চিহ্ন বসাও: rewrite design

## Core
- **Concept:** a picture word is missing its কার-চিহ্ন. Tap the right sign, and it hops into the exact seat it has around its letter: left for ি, under for ু, both sides for ো.
- **Fantasy:** a slate (স্লেট) and a picture book on a calm afternoon. You are the one who finishes the words, and each finished word fills a page of the book with its picture.
- **Loop (3 verbs):** দেখো (look at the picture and say its name) → বেছে নাও (tap a sign) → বসাও (it hops into its seat, the picture comes alive, the page fills).

## Who it is for
ছোটদের জন্য, ৫–৭ বছর. The kids' brief wins over the games brief: no clock anywhere, no lives, nothing red, 2–4 choices, ≥ 96 px targets, and no reading needed: the picture, the dotted slot and the hop carry the meaning. Text is for the parent reading aloud. **No voice anywhere** (site rule): phone text-to-speech reads Bangla badly, so every cue is a picture, a motion or a sound effect.

## Progression: 4 worlds, 14 levels, grouped by where the sign sits
Level ids 1–11 keep their old meaning (saved stars and `?print=N` links stay valid). The three world finales are new ids 12–14. The list shows them in play order, numbered ১–১৪.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **পাশে বসে** (ভোরের উঠান: cream sky, terracotta) | আ-কার ◌া | A sign sits after its letter. 2 tiles, a ghost finger on the very first word. First right sign in ~2 s. |
| ২ | 2 | | ই-কার ◌ি | A sign you hear after the letter but write *before* it. |
| ৩ | 3 | | ঈ-কার ◌ী | The long ঈ on the right, beside its look-alike ি. 3 tiles. |
| ৪ | 12 | | **Finale: নদীর ধারে** | All three side signs together: pick by where it sits. Ten riverside words (নদী, মাছ, জাহাজ, ঝিনুক…). |
| ৫ | 4 | **নিচে বসে** (মাঠ: pale green, paddy green) | উ-কার ◌ু | A sign that sits under its letter. |
| ৬ | 5 | | ঊ-কার ◌ূ | The long ঊ under, beside ◌ু. |
| ৭ | 6 | | ঋ-কার ◌ৃ | The small hook under (বৃষ্টি, কৃষক). |
| ৮ | 13 | | **Finale: গ্রামের মাঠ** | The three under-signs together (কৃষক, গরু, ময়ূর, সূর্য…). |
| ৯ | 7 | **দুই পাশে** (নদী: pale blue, river blue) | এ-কার ◌ে | Before the letter, like ি. |
| ১০ | 8 | | ঐ-কার ◌ৈ | ে with a loop on top. |
| ১১ | 9 | | ও-কার ◌ো | One sign in two parts that wraps its letter. |
| ১২ | 10 | | ঔ-কার ◌ৌ | Two parts with the ৌ tail. |
| ১৩ | 14 | | **Finale: নৌকাবাইচ** | Four front-and-wrap signs together, 4 tiles (নৌকা, বৈঠা, ঢোল, ঢেউ…). |
| ১৪ | 11 | **মেলা** (pink, magenta) | **Grand finale: সব কার** | All ten signs, one word each, 4 tiles. Confetti and the whole book done. |

Every level is ten words in a seeded order, so a replay is a new order with the same words.

## Difficulty and story
- **No modes.** The kids' brief says "never announce easy mode". The sweet spot is automatic and silent:
  - three words in a row missed on the first try take one tile away from the next word;
  - five right in a row add one;
  - never outside 2–4, and never more than one tile from the level's own count.
- **A miss teaches:** the wrong sign hops into the seat, the word reads wrong in grey ("এটা পড়লে হয় মীছ"), and the sign hops back to its tile. After two misses the right tile glows with a gold ring and a dashed ring (shape, not only colour). The word can't be lost: at most three taps per word.
- **Stars** record the round only, never spent or compared: 8+ of 10 right first time → ৩, 5+ → ২, any finished round → ১.
- **Bots (asserted in tests, 2,000 seeds a level, `tests/levels.test.ts`):**
  - a *guesser* (random taps, then the glowing tile) finishes every level on every seed within 30 taps, and earns ৩ stars on ≤ 6% of seeds (measured 0–4%), so stars mean something;
  - a *five-year-old* who knows the sign 70% of the time gets ৩ stars on level ১ on ≥ 75% of seeds (measured 80%), and on each finale on 45–80% (measured 59–67%): harder, still fair;
  - a *learner* who knows it 90% of the time gets ৩ stars on every level on ≥ 90% of seeds (measured 96–99%);
  - every bot's first right sign comes within 10 s (measured ≤ 6 s), and a round takes the bots 26–42 s.
- **No story.** A pre-reader can't read panels. The slate on the title and the ghost finger do the job.

## Screens
- **Title (inside the stage):** the biggest thing is a slate drawn in code: a wooden frame, a picture of the level's first word, the word with its dashed chalk slot, and a big ▶ খেলো across the bottom. Tap anywhere on it. Under it: the level chip ("৪ · নদীর ধারে ◌া ◌ি ◌ী", opens the list) and one line for the parent ("ছবি দেখো, ঠিক চিহ্নটা বসাও।"). At the foot, small: বড়দের জন্য (the gate: share the tool's address, the print sheet).
- **Level list (a choice screen; nothing runs under it):** four world bands, each in its palette, with numbered cards ১–১৪. A card shows the sign on its dotted circle at 40 px (a pre-reader knows the shape), the name, and its stars. The next level to play is marked **এটা খেলো** and glows. Everything is open, as before: kids never meet a lock.
- **HUD (corners, above the scene):**
  - top-left (inset past the ⏸ in immersive): the level badge, the sign and its name;
  - top-right: the page strip, ten tiny seats that fill with each finished word's picture.
  - The middle holds only the picture, the word and the tiles.
- **Danger:** none. Nothing can be lost, so nothing glows at the edge.
- **Finales:** the badge carries the finale's name and the world's palette deepens. The end of a finale sounds the world's four-note tune and, outside ধীরে খেলো, a small confetti burst (the brief's "only for a whole set or world").
- **End screen:** the filled page (ten pictures with their words, in a 5 × 2 grid), the stars pop in with chimes, and the counts tick up ("১০টা শব্দ · ৮টা প্রথমবারেই"). Then the informational reward ("এখন তুমি ঈ-কার বসাতে পারো।") and the off-screen task ("এবার ঘরে একটা জিনিস খোঁজো, যার নামে ঈ-কার আছে।"). Then two 112 px picture buttons of equal size: **আবার খেলো** (a circular arrow) and **শেষ** (a closed book). শেষ goes to the title with the next level ready; nothing starts by itself. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** the page of ten finished words with pictures and the level's sign or finale name. No name, no stars. Saving it is behind the gate. The og image doesn't change.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick when a tile is touched. You see the tile press.
2. **Signature, "বসল":** a wooden টুক as the sign lands, then two rising marimba notes pitched by world. You see the sign in its seat and the word darken.
3. **Miss:** a soft low boing, never a buzzer. You see the grey wrong word and the hop back.
4. **Next page:** a paper swish. You see the next picture.
5. **Stars:** the shared star chimes, as scheduled tones so the pause cuts them. You see the stars.
6. **World tune:** four notes at a finale's end. You see the confetti or, in ধীরে খেলো, the finished page.

## Comfort and controls
- **ধীরে খেলো:** no hop (the sign fades into its seat), no wobble, no picture dance, no glow pulse (a steady ring instead), no confetti, and the next word waits 1.6 s instead of 1.1 s. Stars are unchanged: nothing here is timed.
- **Touch:** tap a tile. It acts on the first finger's pointerdown (a palm or second finger is ignored). Tiles are ≥ 96 × 96 px with 16 px gaps.
- **Keys:** 1–4 pick a tile (each shows its number small in the corner). Enter or Space on the title = খেলো, and on the end screen a fresh press = আবার খেলো. P pauses through the player. Escape belongs to the player.
- **Away:** the player pauses on blur and hide. The game freezes its timers (the next word, the end screen), and gives them back with a short breath on resume. The first tap back after a blur only resumes, never picks a tile.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the moment the last word is right (the stars are saved in the same tap, so leaving during the finish never loses them). `RestScreen` shows on any screen but play.
- **Kept for compatibility:**
  - `ektukhani-levels-kar-chinho` (stars by level id; ids 1–11 unchanged, 12–14 new);
  - `/kar-chinho`, `?print=N` (1–14, anything else = the সব কার sheet), the title, H1 and description (the level count ১১ → ১৪);
  - no link state and no tally, as before.
