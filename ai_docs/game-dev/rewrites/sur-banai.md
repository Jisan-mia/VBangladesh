# সুর বানাই: rewrite design

## Core
- **Concept:** a painted toy xylophone laid out as a note grid: five coloured rows (সা রে গা পা ধা), six beats across. Tap a cell and it sounds and lights. Press play and a light walks along the beats.
- **Fantasy:** you are the one who makes the music. Any tune you tap sounds right, because the five notes never clash.
- **Loop (3 verbs):** শোনো (a tune plays and lights) → বসাও (tap cells) → বাজাও (hear your tune, watch it light).

## Who it is for
ছোটদের জন্য, ৩–১২ (the free grid is for the youngest, the levels for ৬+). The kids' brief wins: no clock, no lives, nothing red, ≥ 96 px for what a 3-year-old must press and ≥ 72 px for the rest, no reading needed, **no voice anywhere**. Every note that sounds is also a lit cell, so the game works fully silent. The one line under the grid is for a parent or an older child.

## The look (written before styling)
- **Reference:** a child's painted wooden xylophone: flat poster paint, one dark ink outline, each key a bar of its own colour, a hard offset shadow under it like a bar sitting on its frame. No gradients, no soft blur shadows, no glow except a lit note.
- **Notes keep one colour everywhere** (সা red-orange, রে amber, গা green, পা blue, ধা violet), so a child learns "colour = pitch". Only the *frame* changes with the world, with a deliberate palette each:
  - বাঁশির বন: deep forest green `#1f7a5a` on `#e6f4ec` (ink `#20302a`);
  - ঢোলের মাঠ: terracotta `#b8431f` on `#fdece2`;
  - ঘণ্টার ঘর: brass `#8a5f00` on `#fff4d6`;
  - গানের নৌকা: river blue `#2d5fa8` on `#e8f0fb`.
- **Type:** the site's display face for the few words; no new font. Corners: 5–8 px on keys and cards, round only the note dot and the ✓ badge. Icons are SVG drawn in code, never emoji.
- **First thing to do:** tap the big card (the world's own instrument over a little grid). On a level the ear button pulses with a ghost finger.

## Progression: 4 worlds, 16 levels (ids 1–10 keep their old tunes)
Everything is open: a child never meets a lock. The level list shows them in play order, numbered ১–১৬; the next one to play says এটা খেলো. Stars: ৩ for a first-check match, ২ for the second, ১ after. Listening is always free. After two misses the missing notes glow.

| # | id | World | Level | The one new idea |
|---|---|---|---|---|
| ১ | 1 | **বাঁশির বন** · শুনে মেলাও (বাঁশি) | সিঁড়ি ওঠা | Listen to the lights, then copy them. 4 notes in a run. |
| ২ | 2 | | সিঁড়ি নামা | Tunes go down too. |
| ৩ | 4 | | দুই দুই | The same note twice in a row. |
| ৪ | 3 | | পাহাড় | Up, and back down to where you began. |
| ৫ | 6 | | **ফাইনাল: বনের গান** | Six different beats, no rests. |
| ৬ | 7 | **ঢোলের মাঠ** · একসাথে দুটো (ঢোল) | জোড়ায় জোড়ায় | Two notes in one beat are two lit cells in one column. |
| ৭ | 8 | | জোড়া আর একা | Pairs among single notes. |
| ৮ | 9 | | দুই মুড়ো | A pair far apart: the top and the bottom row together. |
| ৯ | 10 | | **ফাইনাল: ঢেউ** | Pairs that rise and fall like a wave. |
| ১০ | 5 | **ঘণ্টার ঘর** · ফাঁক ভরো (টুং) | একই তিন, দুবার | A tune repeats, and the last note is missing. |
| ১১ | 11 | | দুটো ফাঁক | Two gaps in a row: the repeat tells you both. |
| ১২ | 12 | | আয়নার সুর | The way back mirrors the way up: one gap in the middle. |
| ১৩ | 13 | | **ফাইনাল: ফাঁকের গান** | Two gaps with the repeat on both sides. |
| ১৪ | 14 | **গানের নৌকা** · নিজে বানাও (your pick) | সিঁড়ি বানাও | Make a tune that only climbs. Any climb is right. |
| ১৫ | 15 | | পাহাড় বানাও | Climb, then come down. |
| ১৬ | 16 | | **ফাইনাল: নিজের গান** | Make any tune with six notes and three different ones. It is kept on the shelf. |

- **Gap levels:** the ear plays the tune with the gaps silent. The given notes are locked, the gaps are dashed boxes in their columns, and the child fills the gaps only. The pattern repeats, so the answer can be worked out.
- **Make levels:** a rule checks the tune (rising, hill, six notes with three different), not a target. A small row of dots shows how many notes are needed and fills as notes go on.
- **Free play, আমার সুর:** the old free grid, kept. It is the start for a 3-year-old: tap, ▶, ♥. A draft is saved on every tap, so closing the page never loses the tune.

## Difficulty and story
- **No modes:** the kids' brief says never announce easy mode. ধীরে খেলো makes the beat slower (at least 600 ms); nothing is timed, so it can't make stars easier.
- **A miss is kind:** extra cells wobble, the line says how many matched, and the ear stays free. After two misses the missing cells glow with a gold dashed ring (shape as well as colour).
- **No story panels:** a pre-reader can't read them. The title art and the ghost finger do the job.
- **Bots (asserted in tests, 2,000 seeds a level):** a *guesser* who taps wrong but follows the glow always finishes in ≤ 3 checks and gets 3 stars on 0% of seeds (the test allows ≤ 8%). A *five-year-old* (remembers 80% of the notes; each note not remembered goes in a wrong cell of the same beat) gets 3 stars on 44% of seeds on level ১, 17–35% in the copy worlds, 67–83% in the gap and make worlds. A *learner* (95%) gets 66–96%. The first check of level ১ comes within 7 s of play, so the first win is inside 10 s. After two misses the glow shows the missing cells, or one example tune for a make level (the finale's example is six notes, five different).

## Screens
- **Title (in the stage):** the biggest thing is the card: the world's instrument over a small grid, with a ▶ খেলো bar across the bottom. Under it two 72 px picture chips: আমার সুর (blank grid) and সব লেভেল (a list). At the foot, small: বড়দের জন্য (the gate: share the tool's plain address, clear kept tunes).
- **Level list (a choice screen; nothing runs under it):** four world bands in their palettes, numbered cards with the instrument, name and stars. Next = এটা খেলো.
- **Play:** HUD in the corners (the level badge top-left, the note dots top-right); the grid; one line; the control row: **শোনো** (ear), **বাজাও** (mine), **✓ মেলাও**, **মুছো**, all pictures with a word, ≥ 72 px.
- **A win:** at the ✓ tap the stars are saved and `atBreak()` runs. The grid cells ring and the tune plays through, lit. A big ➜ (star on the last) waits; nothing runs on a timer.
- **End screen:** the tune as a picture (cells pop in, left to right), stars popping in with chimes, counts ticking up ("৬টা নোট · ২ বারে"), then two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ**. Under them: আব্বু-আম্মুকে দেখাও.
- **Free play end ("রাখা হলো"):** the kept tune as a picture, the same two buttons.
- **Danger:** none. Nothing can be lost.
- **Card (in ShowParent):** the tune picture, what was made or matched today, no name. Saving it is behind the gate. The og image doesn't change.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **A cell:** the note on the world's instrument (বাঁশি, ঢোল, টুং). The sound is the tap.
2. **Off:** a soft tick when a cell is cleared.
3. **Miss:** a soft low boing, never a buzzer.
4. **Signature, "মিলেছে":** the child's own tune plays through, lit, ending on a high chime.
5. **Stars:** chimes as scheduled tones, so the player's pause cuts them.
6. **World tune:** four notes at a finale's end.

## Comfort and controls
- **ধীরে খেলো:** the beat is at least 600 ms, no ring, no pop, no pulse, no confetti.
- **Touch:** a cell acts on the first finger's pointerdown (a palm or second finger is ignored). Cells are ≥ 48 px with 6 px gaps, controls ≥ 72 px, end buttons 112 px.
- **Keys:** Enter or Space plays or stops on the free grid; on a level they press ✓. P pauses through the player; Escape belongs to the player.
- **Away:** blur, hide and the pause menu stop the beat and keep the tune; the first tap back only wakes the game.
- **Kids:** `atBreak()` runs when a round starts and at the tap that keeps a tune or wins a level. Stopping the tune is never a break. `RestScreen` shows only on the title, the end screens and the level list: never over the grid.
- **Kept for compatibility:** `ektukhani-sur-banai-tunes` (kept tunes), `ektukhani-levels-sur-banai` (stars by id; 1–10 unchanged, 11–16 new), the slug, the share id (links are never made), the title, description and H1; no network. New local key: `ektukhani-sur-banai-draft` (the tune on the free grid).
