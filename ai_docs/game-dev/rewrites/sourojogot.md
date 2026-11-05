# সৌরজগতের সফর: rewrite design

## Core
- **Concept:** a rocket trip from the Sun out to Neptune. Tap a planet and the rocket arcs across the sky to it, leaving a puff trail; each stop teaches a name, a place in the line or a size.
- **Fantasy:** you are the little rocket's pilot on a night sky. The Sun is a huge glow in the corner, the planets hang on their orbits, and every right stop plays one bright note up a scale.
- **Loop (3 verbs):** দেখো (the sky, a porthole clue or the football Sun) → বেছে নাও (tap a planet, a place or a picture) → পৌঁছাও (the rocket flies there, the planet lights up, its name and one fact appear).

## Who it is for
ছোটদের জন্য, ৫–১১ বছর. The kids' brief wins over the games brief: no clock, no lives, nothing red, 2–4 choices, ≥ 96 px targets, no reading needed on the first levels (the picture, the glow and the rocket carry the move). **No voice anywhere**: `speak()` and `SpeakButton` are gone from this game. Every cue is a picture, a motion or a sound effect.

## Progression: 3 worlds, 11 levels, one new idea each
Level ids 1–6 keep their old meaning (saved stars stay valid); 7–11 are new. The list shows them in play order, numbered ১–১১.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **সূর্যের পাড়া** (ভেতরের চার গ্রহ; amber dusk) | সফর: সূর্য থেকে মঙ্গল | The order: tap the nearest planet, then the next. 4 taps, a ghost finger on the first. |
| ২ | 3 | | সাজাও: কাছের চার গ্রহ | The planets have swapped places. Tap the one nearest the Sun and it flies back to its orbit. |
| ৩ | 7 | | জানালা দিয়ে: কোন গ্রহ? | Looks: a porthole shows a clue (a thermometer, a ring, a red hill); pick the planet. |
| ৪ | 8 | | **Finale: সূর্যের পাড়া গড়ো** | Build it: a planet waits in the tray, tap the orbit where it belongs. |
| ৫ | 2 | **দৈত্যদের পথ** (the long way out; violet night) | সফর: সূর্য থেকে নেপচুন | Eight planets, and the four giants arrive far apart. |
| ৬ | 4 | | সাজাও: আট গ্রহ | The same swap, with eight. |
| ৭ | 9 | | জানালা দিয়ে: আট গ্রহ | Looks of all eight (the giants' bands, ring, tilt, wind). |
| ৮ | 10 | | **Finale: আট গ্রহের মেলা** | Build all eight orbits. Confetti and the world tune. |
| ৯ | 5 | **কিনারার ওপারে** (the scale; deep space blue) | ফুটবল সূর্য: কত বড়? | Size: if the Sun were a football, how big is the planet? Pick the thing it equals. |
| ১০ | 6 | | ফুটবল সূর্য: কত দূরে? | Distance: where on the school field and street would it sit? |
| ১১ | 11 | | **Grand finale: নেপচুনে পৌঁছাও** | Size and distance together, one planet at a time. The rocket reaches Neptune. |

Every round is seeded, so a replay is a new order with the same planets (the two trips keep the Sun's line in order, as that is the point).

## Difficulty and story
- **No modes.** The sweet spot is silent: three slips in a row ease the next question (fewer choices, the right one glows from the start), five right in a row step it up (one more choice). A planet stays glowing after two tries on one question.
- **A slip teaches, never scolds:** the wrong planet or picture wobbles softly and a one-line hint says which way to think ("ওটা শনি: ওর বড় বলয় আছে", "আরও ছোট ভাবো", "বুধ সূর্যের আরও কাছে"). A wrong choice is greyed out so nothing is tapped twice.
- **Stars** record the round only, never spent or compared: 0 slips → ৩, up to 2 → ২, any finished round → ১. Slow mode does not change them.
- **Honest end line (fixes "wrong guesses read as praise"):** 0 slips praises the method; 1–2 slips say only "২বার থেমে আবার ভেবেছ"; 3 or more name one thing to try with a picture strip of the planets in order, and do not say "ঠিকটা পেয়েছ".
- **No story panels.** A pre-reader can't read them. The title art and the ghost finger do the job.

## Screens
- **Title (inside the stage):** the biggest thing is the launch picture: the Sun's glow, the orbits, four planets and the rocket tilted for take-off, with a big ▶ খেলো across it. Under it: the level chip ("লেভেল ৩ · জানালা দিয়ে", opens the list) and one line for the parent. At the foot, small: বড়দের জন্য (the gate: share the tool's address, the print sheet).
- **Level list (a choice screen; nothing runs under it):** three world bands in their palettes, numbered cards ১–১১ with a small picture of what the level is (a rocket path, a porthole, orbits, the football). The next level to play glows (এটা খেলো). Everything is open.
- **HUD (corners):** top-left a world-coloured level badge; top-right a strip of little planets that fill with colour as stops are made. The middle stays clear. In immersive mode the player's own band holds the ⏸ above the stage.
- **Danger:** none. Nothing can be lost.
- **The quiz screens now fill the stage:** the football-Sun picture takes the top half. After a right size answer a **magnifier bubble** pops out from the true-size dot and shows the planet big, so the "aha" is visible. The distance picture draws the field, the street and the far houses, with the planet's marker landing at its true place. The choices are big pictures below, and a round ▶ button (96 px) goes on.
- **Ghost finger:** only on the very first question of a mode that has never been played, on the tour board at the first planet; in the quiz screens it sits *below* the choices, never on one, and goes away at the first tap.
- **Finales:** the badge shows the finale's name, the world's palette deepens, the end of a finale sounds the world's four-note tune and a small confetti burst (ধীরে খেলো: none).
- **End screen:** the planets you visited (pictures with names), the stars with chimes, the counts ticking up ("৮টা গ্রহ · ৬টা প্রথমবারেই"), what the child can do now, a task off the screen, then two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ**. শেষ goes to the title with the next level ready; nothing starts by itself. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** the planets of the round in order, what was done, one true number. No name, no stars. Saving it is behind the gate.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick. You see the planet press.
2. **Launch, the signature:** a rising airy swoosh as the rocket leaves, then on arrival one pentatonic note by planet (each planet one step higher) with a soft pop. You see the rocket land and the planet light up.
3. **Slip:** a soft low boing, never a buzzer. You see the wobble and the hint line.
4. **Next:** a paper swish. You see the next question.
5. **Stars:** the shared chimes as scheduled tones, so the pause cuts them.
6. **World tune:** four notes at a finale's end. You see the confetti or, in ধীরে খেলো, the finished screen.

## Comfort and controls
- **ধীরে খেলো:** the rocket jumps (no flight, no trail), no wobble, no pulse (a steady ring instead), no confetti. Stars are unchanged: nothing here is timed.
- **Touch:** every answer acts on the first finger's pointerdown (a palm or second finger is ignored). Planets are 79 px wide hit areas; choices and the ▶ button ≥ 96 px with 16 px gaps.
- **Keys:** 1–4 pick a choice (each shows its number small). Tab then Enter/Space picks a planet. Enter or Space on the title = খেলো; on the end screen only a fresh press = আবার খেলো. P pauses through the player.
- **Away:** the player pauses on blur and hide; the flight and the end timer stop, and come back with a short breath. The first tap back after a blur only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the moment the last answer is right (the stars are saved in the same tap, so leaving during the finish loses nothing). `RestScreen` shows on any screen but play. The share gate shuts when a round starts and on any touch outside it.
- **Kept for compatibility:** `ektukhani-levels-sourojogot` (stars by level id; 1–6 unchanged, 7–11 new), `/sourojogot`, `?print`, the title, H1 and description wording (level count updated), no link state and no tally.

## Architecture
- `lib/course.ts` levels and worlds as data, `lib/round.ts` the pure round for all seven modes (seeded, pace, hints, stars), `lib/session.ts` screens, pause, the one end timer, the rest screen and keys, `lib/flight.ts` the rocket's pure path state, `lib/board.ts` orbit layout, `lib/words.ts` every Bangla line, `lib/sound.ts` the sounds.
- `components/sky.hot.ts` the per-frame trail and rocket on a canvas (no allocation), `components/count.hot.ts` the end-screen count-up.
- Tests: bots over 2,000 seeds per level, every statechart bug replayed, the flight reaching its target, content limits.
