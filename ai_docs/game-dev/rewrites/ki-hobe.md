# কী হবে বলো তো?: rewrite design

## Look (unslop-ui)
- **Reference:** a printed science wall chart in a village primary school: flat gouache colour, ink outlines (#1f2d4a), small square corners, flat offset shadows, no blur and no glow.
- **Palette, one per world:** পুকুরপাড় (pond blue, deep #1c5f96), উঠান (yard green, deep #4e6b1c), আকাশ আর শব্দ (night indigo, deep #38418f). Gold (#ffcf5a) marks one thing only: the answer that happened.
- **Type:** the site's display face for the few words a child meets; Bangla at 15–20 px, line-height 1.4+.
- **First thing to do:** tap the pond (the whole title picture is the start button).
- Corners are 6–8 px on cards and buttons; only dots, badges and bubbles are round. Icons are SVG; no emoji.

## Core
- **Concept:** a predict-then-watch science game for ages 5–10. A small experiment is set up in a picture (does it float? will the magnet pull it? which falls first?). You guess by picture, the experiment plays as an animation, and the answer is shown, not written.
- **Fantasy:** you are a village-school scientist: you always think first, then you look.
- **Loop (3 verbs):** আন্দাজ করো (tap a picture) → দেখো (the experiment plays; pauses when you look away; আবার দেখো) → জানো (a tick lights the answer; → goes on).

## What was wrong, and what changed
- **Looking away let the experiment finish without the child.** The experiment's clock is now a CSS animation inside the scene and the scene freezes whenever the window is away or the pause menu is up; an end that arrives anyway waits (`waiting`) and shows when the child is back (`session.experimentEnds`, `settleWaiting`).
- **Muting right after a guess and the magnet still clicked.** The kit now cuts scheduled notes on mute; the game schedules nothing: sounds are immediate tones fired by the picture's own animation start event, so a pause or mute can never leave a note waiting.
- **Rest screen and gate.** The kit's modal rest screen and one-action gate are used as they are; `atBreak()` runs at round start, at the last guess, and at the end screen.
- **Word-only end buttons.** আবার খেলো and শেষ are 128×112 picture buttons of equal size; the answer's আবার দেখো and → are 112×96 pictures.
- **The answer screen was a wall of text.** Now: a tick or "?" badge, one match line, one result line, the right guess lit with a tick, your guess marked with a hand. The reason and the home try fold under "কেন?".
- **No way to watch again.** আবার দেখো (an eye) replays the same experiment from its start.
- **The question needed reading.** A picture strip carries the ask (a wave and an up arrow for "will it float", a falling stone, a magnet, a sprout, an ear) beside the setup scene; the text is for the grown-up. No voice anywhere.
- **No pause.** The player's menu owns pause, restart and সব লেভেল; blur and hide freeze everything.

## Progression: 3 worlds, 9 levels, 21 experiments
Each level adds one new idea; the last in each world is a named ★ finale that mixes what the world taught. All levels stay open.

| World | Levels | Finale |
|---|---|---|
| **পুকুরপাড়** | 1 ভাসে না ডোবে (2 picture choices; coconut first) · 2 দুটোই একরকম (3 choices: both float, both sink) | **3 পুকুরপাড়ের মেলা**: রোদে বরফ + 3 of the 6 pond experiments |
| **উঠান** | 4 বাতাস ঠেলে (stone/feather, paper, the Moon) · 5 কী লাগে? (seeds, two magnets) | **6 উঠানের বিজ্ঞানী**: 4 of the 6 |
| **আকাশ আর শব্দ** | 7 শব্দ কাঁপে (taut string, drum, slack string) · 8 আলো আর ছায়া (shadow, blue sky, red sunset) | **9 আকাশের মেলা**: চাঁদ + বৃষ্টি + 2 of 5 |

- Old saved stars (sets 1–4) move once: 1→1, 2→4, 3→7, 4→9 (`ektukhani-moved-ki-hobe`).
- **Stars are practice** (one more per play-through, up to three), saved at the last guess; the end screen, the saved stars and the card show the same number.
- **Quiet ease:** three missed guesses in a row take one wrong choice away from 3-choice questions; five matched bring it back. Never announced. A wrong guess is a surprise, never a loss.
- **Bots (400 seeds a level):** a random guesser finishes every level with the last guess winning; a child who knows 70% matches 72–85% on level 1 (two choices) and at least 70% on every level.

## Difficulty and story
No modes and no story: a 5-year-old can't read panels, and the brief says never announce "easy". Calm, untimed; nothing counts down. The ghost finger shows the first tap on the first question ever, and after 7 idle seconds it points at → or the first guess (never at the answer).

## Screens
- **Title:** the pond picture (a coconut bobs, a brick rests, bubbles rise, a "?" breathes) is the start button, খেলো under it. Under it, three world tiles (a picture each) and a level chip (picture, number, name, সব লেভেল), one line for the parent.
- **Level list (a choice screen):** the world's levels with picture, name, one line, stars, and "এটা খেলো" on the suggested one. Reached from the title, the end screen, and the pause menu's সব লেভেল.
- **Play:** top-left world, number, name; top-right dots (one per experiment). Middle: the ask picture, the scene, then 2–3 picture guesses. After the guess the choices stay, dimmed, with your pick dashed; three waiting dots. After the experiment: tick or "?" badge, match line, result line, the answer lit gold with a tick, a hand on a missed guess, then আবার দেখো and →, and the "কেন?" fold.
- **Danger:** none.
- **Finale:** the badge carries ★ and its name; ending it plays the world's four-note tune and a small confetti burst (not in ধীরে খেলো).
- **End screen:** stars, a tile per experiment (the answer's picture, a tick where it matched), counts that tick up (পরীক্ষা, মিলল), one line for the grown-up, then আবার খেলো and শেষ, then আব্বু-আম্মুকে দেখাও.
- **Card (ShowParent):** "আজ ৪টা পরীক্ষায় আগে ভাবলাম, তারপর দেখলাম", the findings with their pictures, the level and its stars. No name, no photo. The tool's link and saving the picture sit behind the parent gate. `#og` opens a fixed card.

## Sound (`shared/game-sound.ts`, no loops)
1. Guess: a wooden tick.
2. **Signature "ঠিক ভেবেছি":** three notes up, like a lamp lit one by one (when your guess matched).
3. A surprise: two soft notes, down then a little up (never a buzzer).
4. Experiment cues from the picture's own animation start: splash, drip, whoosh, thud, magnet click, sprout, shimmer, rumble, patter, string hum, drum tap, moon-phase chimes.
5. Next experiment: a paper swish. A finale adds the world's four-note tune.
Everything sound says is on screen; muting loses nothing.

## Comfort and controls
- ধীরে খেলো: the experiment runs at 0.6× speed, no confetti, no bounce on the lit answer, no title loops. Reduced motion: the experiment jumps to its last frame. Stars are not easier either way.
- Touch: first finger only, acts on touch. Guesses ≥ 104 px, end buttons 128×112, answer buttons 112×96. Keys: 1–3 guess, R আবার দেখো, Enter or Space → (a fresh press only) and, on the end screen, আবার খেলো. P pauses through the player.
- Away: the player pauses on blur and hide; the scene, its clock and its sounds freeze. The first tap back only wakes the game.
- Kids: `useKidsSession`. `atBreak()` at round start, at the last guess, and when the end screen shows. No network, no name, no share in the child's view.
- **Kept:** `/ki-hobe`, the title, H1 and FAQ, `ektukhani-levels-ki-hobe` (migrated once), the static share card, no tally.
