# এবিসি বাজার: rewrite design

## Core
- **Concept:** a market stall hangs a letter ("M m"). Tap the picture that matches: the mango. Later the child pairs capitals with smalls, finds a word's first letter, and tells b d p q apart.
- **Fantasy:** a morning bazaar where every stall sells one thing. Each right tap rings the shop bell and the goods land in the child's basket.
- **Loop (3 verbs):** দেখো (the letter on the sign) → বেছে নাও (tap the matching tile) → ঝুড়িতে রাখো (the picture drops into the basket, ➜ to the next stall).

## Who it is for
ছোটদের জন্য, ৪–৭ বছর. The kids' brief wins: no clock, no lives, nothing red, 2–4 tiles, ≥ 96 px targets, no reading needed for ages 3–5. **No voice anywhere** (site rule): `sayEnglish` and `SayEnglish` are gone. Every cue is a picture, a motion or a sound effect. Text is for the parent.

## Progression: 4 worlds, 9 levels, one new idea each
Level ids 1–5 keep their old meaning (saved stars stay true). Ids 6–9 are new. The list shows them in play order, ১–৯.

| # | id | World (palette) | Level | The one new thing | Tiles |
|---|---|---|---|---|---|
| ১ | 1 | **ছবির বাজার** (ভোরের বাজার: terracotta) | A থেকে M | A letter on the sign, pick its picture. A ghost finger on the first item. | 2 |
| ২ | 2 | | N থেকে Z | The second half of the alphabet. | 3 |
| ৩ | 6 | | **Finale: পুরো বাজার** | All 26 pictures, 8 stalls. | 4 |
| ৪ | 3 | **বড় আর ছোট** (দুপুরের হাট: teal) | বড় থেকে ছোট | A capital hangs, pick its small twin (b against d and p first). | 3 |
| ৫ | 7 | | **Finale: বড়-ছোটর হাট** | Both ways: small → capital too. 8 stalls. | 4 |
| ৬ | 4 | **প্রথম অক্ষর** (বিকেলের দোকান: blue) | প্রথম অক্ষর | A picture and "_ango": pick the first letter. | 3 |
| ৭ | 8 | | **Finale: মিশেল বাজার** | Pictures, capitals, smalls and first letters mixed. 8 stalls. | 4 |
| ৮ | 9 | **উল্টো অক্ষর** (আয়নার মেলা: plum) | b আর d | Only b and d: stick first or belly first? | 2 |
| ৯ | 5 | | **Grand finale: আয়নার মেলা** | b d p q together, 4 tiles. Confetti. | 4 |

Rounds are 6 items (8 in a finale), letters never repeat, in a seeded order.

## Difficulty and story
- **No modes**, and no story: a pre-reader can't read panels. The stall on the title and the ghost finger do the job.
- **Silent sweet spot:** three items in a row missed on the first try take one tile away from the next; five in a row right add one. Never outside 2–4, never more than one tile from the level's own count, and the b/d level never shows p or q.
- **A miss teaches without words:** the wrong tile wobbles and turns grey, and a badge on it shows what it really is: the picture's own letter (Boat → B), the letter's partner (l → L), the letter's own picture (N → Nest), or for b d p q the reading order 1, 2 (stick first or belly first). After two misses the right tile glows with a dashed ring. An item never takes more than three taps.
- **The finger comes back:** on a level the child has never finished, it shows on the first item, and again after 7 s of quiet on later ones (stopped by pause, blur and every tap).
- **Stars** record the round only, never spent or compared: all but one right first time → ৩, half or more → ২, any finished round → ১. ধীরে খেলো does not change them.

## Screens
- **Title (inside the stage):** the stall drawn in code (awning, hanging sign with the level's first picture and letter pair) is the start button, with a big ▶ খেলো. Under it, small: the level chip (opens the list) and one line for a parent. At the foot, বড়দের জন্য (the gate: share the plain link, and the A–Z colouring sheet).
- **Level list:** four world bands in their own colours, numbered cards with a letter mark or a b d drawing, name and stars. The next level has a gold ▶ badge and glows. Everything is open. Nothing runs under it.
- **Play (HUD in the corners):** top-left the level badge, top-right the basket strip (6 or 8 pips that fill with each stall's picture). The middle holds the sign, a bobbing arrow, the tiles, and one line for the parent.
- **After a right tap:** the sign gets a green ring, the tile turns green, the word card appears (picture, word, Bangla gloss), and a 104 px ➜ button. The child moves on when ready: no timer.
- **Finales:** the badge carries the finale's name. At the end the world's four-note tune plays and, outside ধীরে খেলো, a small confetti burst.
- **End screen:** the stage is cleared. The basket (every picture with its letters), the stars popping in with chimes, counts that tick up beside a basket icon and a finger icon, what the child can do now, a task off the screen, then two equal 112 px picture buttons, আবার খেলো (circular arrow) and শেষ (a house), and আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** the round's pictures with letters and words, what was done. No name, no stars. Saving it is behind the gate.

## Look (unslop-ui)
- **Reference:** a Bangladeshi bazaar stall: striped awning, a hand-painted signboard on two hooks, goods on a shelf. Signboards and shelves are slabs, so corners are small (6–10 px). Only the truly round things are round: the numbered badges and the "why" badge.
- **Palette per world, chosen for the hour:** morning terracotta, noon haat teal, afternoon blue, night fair plum. Ink `#2b2433`, wood `#8a5530`, green `#2e8b57` only for "right". The pictures keep their own colours.
- **Type:** the site's own display face (`--font-display`) for letters and headings, big and plain. No serif-plus-cream look: the paper tint is the stall's own backdrop.
- **Glow only to signal:** the gold ring and dashed outline on the hint tile, the green ring on a solved sign, the steady ring on the next level. No decorative shadow or gradient glow. All icons are SVG; no emoji.
- **First action:** tap the stall (the title) and then the picture that matches the sign.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick. You see the tile press.
2. **Signature, "বাজারের ঘণ্টি":** a wooden টুক then a two-note shop bell, pitched by world. You see the green tile and the word card.
3. **Miss:** a soft low boing, never a buzzer. You see the wobble and the badge.
4. **Next stall:** a paper-bag rustle. You see the new sign swing in.
5. **Stars:** chimes as scheduled tones, so the player's pause cuts them.
6. **World tune:** four notes when a finale ends.

## Motion (Emil Kowalski skills: `animate`, `choreograph`, `emil-design-eng`)
- Tokens `--ease-out: cubic-bezier(.23,1,.32,1)` and `--ease-in-out: cubic-bezier(.77,0,.175,1)`. All UI motion is 160–260 ms (stars 380 ms, a delight moment).
- The sign swings in (240 ms) once per item; the word card is the lead and the ➜ follows 80 ms later; the ➜ nudges twice after 2.6 s, then stops. The arrow bobs 3 times, the blank blinks 3 times. Nothing loops forever except the finger and the hint ring, which are the cue itself.
- Nothing starts from scale(0) (stars from .5, pops from .92). Basket pops stagger on a shrinking curve (60·√i ms). Hover motion is gated by `(hover:hover) and (pointer:fine)`. Press is a 4 px push with a shadow.
- **ধীরে খেলো and prefers-reduced-motion:** no swing, wobble, loop or pop. A 160 ms fade stays so a change still reads. The hint ring and the finger's ripple become steady.

## Comfort and controls
- **Touch:** tap a tile (the first finger only). Tiles ≥ 96 px, ➜ 104 px, 16 px gaps. **Keys:** 1–4 pick, Enter or Space = ➜ or খেলো (end: a fresh press = আবার খেলো), P pauses through the player.
- **Away:** the player pauses on blur and hide. The game has no timers, so only the finger nudge stops. The first tap back never picks a tile or presses ➜.
- **Kids:** `atBreak()` runs when a round starts and at the last right tap, which also saves the stars. `RestScreen` shows on every screen but play.
- **Kept:** `ektukhani-levels-abc-bazar` (ids 1–5 unchanged, 6–9 new), `/abc-bazar`, `?print`, the title, H1 and description, no link state and no tally.
