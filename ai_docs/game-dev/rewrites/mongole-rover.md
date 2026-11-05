# মঙ্গলে রোভার: rewrite design

## Core
- **Concept:** a coding game for ages 6–11. Lay arrows into a queue ("প্ল্যান"), press চালাও, and the rover drives the queue one block at a time and lifts every rock sample. Mars is far, so the plan goes first and the run comes after: the same reason a real rover is programmed ahead (a Mars fact, with its source).
- **Fantasy:** you are mission control with a one-camera rover on red sand. A bad plan is not a loss, it is a bug to find: the block that bumped glows, you fix it, run again.
- **Loop (3 verbs):** সাজাও (tap arrows into the queue) → চালাও (watch the rover drive; the running block lights) → ঠিক করো (fix the lit block, or lift the last rock and win).

## Who it is for
ছোটদের জন্য, ৬–১১ বছর. The kids' brief wins: no clock, no lives, nothing red-alarm, targets ≥ 72 px (end buttons ≥ 96 px), no child data, no network. **No voice anywhere** (site rule). Every cue is a picture, a motion or a sound effect; text is one short line.

## Progression: 4 worlds, 12 levels, one new thing each (ids 1–12 unchanged, so saved stars stay true)
| # | World (light) | Level | The one new thing |
|---|---|---|---|
| 1 | **ল্যান্ডিং সাইট** (afternoon sand, rust) | এক ধাপ | One arrow, then চালাও. A ghost finger shows both taps. First win in ~5 s. |
| 2 | | দুই ধাপ | A queue of two: the blocks run in order. |
| 3 | | **Finale: প্রথম গর্ত** | The first crater: plan around it. |
| 4 | **গর্তের মাঠ** (dusty basalt, ochre) | লম্বা পথ | A longer queue, a row of craters to read. |
| 5 | | ঘুরপথ | A detour: the shortest line is blocked. |
| 6 | | **Finale: গর্তের সারি** | Two rows of craters, one gap each. |
| 7 | **পাথরের উপত্যকা** (Mars sunset, blue) | দুটো পাথর | Two samples: the order is yours. |
| 8 | | দুই কোণে | Samples in opposite corners. |
| 9 | | **Finale: তিন পাথরের ঢিবি** | Three samples and craters between. |
| 10 | **লুপের পাহাড়** (dusk ridges, plum) | লুপ: বার বার | The আরেক বার block: "৩ বার ↑" is one block. A ghost finger shows it. |
| 11 | | লুপে ঘুরপথ | Loops around craters. |
| 12 | | **Finale: কম ব্লকে পারবে?** | The fewest-blocks challenge: the target is shown first. |

"Turns" are not a concept here (arrows point to a side), so no level pretends to teach them.

- **Stars (a record, never spent or compared):** every rock → ★, within two blocks of the shortest plan → ★★, the shortest → ★★★. A bump costs nothing. ধীরে খেলো does not change them.
- **Bots (`tests/bot.ts`):** the BFS solver proves every level solvable and reports the shortest plan; a *casual* bot (adds arrows along a greedy path, sometimes picks a wrong arrow, fixes the lit block after a bump) wins level 1 in ≤ 10 s of game time and clears every level in ≥ 95% of 200 seeds within 6 runs; a *careless* bot that never fixes does not win levels 3–12 by luck more than 5% of the time (the levels are not guessable).
- **Silent sweet spot:** three runs in a row that missed show a dotted path (never harder, never announced).

## Difficulty and story
- **No modes.** Kids' brief: never announce an "easy mode". The level list is the pacing.
- **Story (first run only, tap for the next panel, hold the corner button 0.6 s to skip; `ektukhani-intro-mongole-rover`):** three panels, each a picture and one line.
  1. A small rover has landed on red sand; Earth is a blue dot above. "মঙ্গলে নেমেছে আমাদের ছোট্ট রোভার।"
  2. Glowing rocks lie around it. "ঝিকমিকে পাথরগুলো তুলতে হবে।"
  3. A dashed signal from Earth to Mars, then a plan of three arrows. "সংকেত পৌঁছাতে অনেক দেরি। তাই আগে প্ল্যান, তারপর চালাও।"
  Never on আবার খেলো or the next level.

## Screens
- **Title (inside the stage):** the Mars horizon painted in code, the rover on its hill with Earth in the sky, is the start button, with a big ▶ রোভার চালাও. Under it, small: the level chip (opens the list) and a one-line hint. At the foot, বড়দের জন্য (the gate: share the plain link).
- **Level list (a choice screen, nothing runs under it):** four world bands in their own colours, numbered cards (a mini map with the rocks and craters, the name, stars). The next to play carries a gold ▶ and a steady ring. Everything is open; a child never meets a lock. The pause menu's সব লেভেল opens it.
- **Play (HUD in the corners, the middle clear):** top-left the level badge (a finale shows its name), top-right the rock count with the rock picture. The board, one line of tip, the **queue** (numbered ticket blocks with a big arrow each; the running block lifts and glows; a bumped block turns dashed; tap a block to take it out), the arrow pad, then ⌫ মুছো, আরেক বার (loop levels) and **চালাও**. Wheel-print dots trail the rover.
- **While the rover runs:** the pad and চালাও are disabled. **থামাও** is a separate square-icon button over the pad's place (a different element, not the চালাও button), and it ignores taps for 450 ms after চালাও, so a quick second tap never cancels the run.
- **A bump:** the rover nudges back, the crater pulses once, the lit block turns dashed and one line says which number block ("৩ নম্বর ব্লকে গর্তে ঠেকল").
- **Finale:** the badge carries the finale's name. At the end of a finale the world's four-note tune plays and, outside ধীরে খেলো, a small confetti burst.
- **End screen (the stage is cleared):** a stars reveal with chimes, two counts that tick up (blocks used out of the shortest, rocks lifted) with picture icons, the method line ("সবচেয়ে ছোট প্ল্যানটা ৫ ব্লকের। খুঁজে দেখবে?"), the Mars fact with its source in the parent card, then a wide পরের লেভেল (the recommended one, 96 px tall) and two equal 112 px picture buttons: আবার খেলো (a circular arrow) and শেষ (a house); then আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** the last map with the rover's path and the plan as blocks, no name, no network. Saving it is behind the gate.

## Look (unslop-ui)
- **Reference:** a mission-control sequence sheet, the kind pinned beside a rover team's screens: numbered command strips on warm paper, with a Bangladeshi children's-science-book drawing of Mars. Strips are tickets with a small radius (6–8 px); only the wheels, the rock badge and the step numbers are round.
- **Palette per world, chosen for the light on Mars:** afternoon rust `#b8461f` on sand `#e9a06d`; basalt ochre `#8a5a1c` on `#c98f5c`; sunset blue `#2f5fb0` on `#d49a7a` (Mars sunsets are blue); dusk plum `#7a3fa0` on `#b97a72`. Ink `#2d1f1a`, glow gold `#f2a900` only for the running block and the next level.
- **Type:** the site's `--font-display`, big and plain. No serif-plus-cream look: the paper tint is the stage of the mission sheet.
- **Glow only to signal:** the lit block, the next-level ring, the hint ring on a ghost-finger target. No decorative glow, no gradient backdrops. All icons SVG; no emoji.
- **First action:** tap the hill (the title), tap an arrow, tap চালাও.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick (the arrow pressed).
2. **Signature, "রোভারের সুর":** a two-note motor hum per step, rising by world, with the wheels turning on screen.
3. **Rock:** a two-note chime (the rock lifts and the count rises).
4. **Bump:** a soft low thud, never a buzzer (the rover nudges back).
5. **Start:** a short chirp (the queue lights its first block).
6. **World tune:** four notes at a finale's end.

## Motion (Emil Kowalski skills: `animate`, `choreograph`, `emil-design-eng`, `animation-performance`)
- Tokens `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`. UI motion 120–260 ms.
- **The rover's slide** is the one real motion: `transform` on `--ease-in-out` (420 ms, 700 ms in ধীরে খেলো). **Arrow taps get no flourish** beyond a 4 px press (they are the most-repeated action); keyboard-added blocks do not pop at all. A block pops (from `scale(.9)`, 120 ms) only when added by a finger.
- **The end screen (choreograph):** the stars lead; the counts start when the card has finished its 220 ms entrance; the buttons arrive last without a stagger. One entrance per container.
- **The skip hold:** slow where the child decides (0.6 s linear fill), instant on release.
- **ধীरে খেলো and reduced motion:** gentler, not none: no slide or pop, a 120 ms fade stays; the lit block keeps a steady ring (no pulse).
- **Performance:** only `transform` and `opacity` move. The run is a clock in `lib/run.hot.ts` (no allocation per frame), advanced by one `requestAnimationFrame` loop that stops cold on pause, blur, hide and the rest screen, and gives a 350 ms breath after coming back.

## Comfort and controls
- **Touch:** tap an arrow (the first finger only, answered on pointer-down), tap a queue block to remove it, tap চালাও. Targets ≥ 72 px, end buttons ≥ 96 px, 12–16 px gaps.
- **Keyboard (new):** arrow keys add arrows; **R** is আরেক বার; Backspace removes the last block; Enter or Space is চালাও; during a run Backspace is থামাও (after 450 ms, never a repeat); P is the player's pause; Escape is the player's. On the end screen Enter or Space is the recommended next (a fresh press only). A key held through the round's end never skips the result.
- **Away:** the player pauses on blur and hide. The run clock stops with it; nothing drives, picks up or wins while away. The first tap back never adds a block, presses চালাও or stops a run.
- **Kids:** `atBreak()` runs when a level opens, at the moment the last rock is lifted (the stars are saved right there) and after a run that missed (a natural break). `RestScreen` shows on every screen but the rover driving.
- **Kept:** `ektukhani-levels-mongole-rover` (ids 1–12), `/mongole-rover`, the title, H1 and description, the card's look, `#og` (a finished level 12 with the card showing). New: `ektukhani-intro-mongole-rover` (story seen).
