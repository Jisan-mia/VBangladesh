# ছায়া মেলাও: rewrite design

## Look (written first, for unslop-ui)
- **Reference:** an evening room lit by one হারিকেন. The lamp hangs from a beam, the wall is a plain plastered wall, and the toys stand on a low wooden তাক (shelf). Not a screen with cards: a place.
- **Palette, one per world** (the wall is lit by the lamp, so each wall is its own colour and each shadow is that wall's own dark):
  - ঘরের বাতি: warm lime-wash `#f1d9a8`, shadow `#4a3150` (plum, the site accent).
  - অনেক ছায়া: moonlit courtyard `#bfe0da`, shadow `#1f4a50`.
  - একই রকম: brick-red wall `#f0b79d`, shadow `#552b2b`.
  - ঘোরানো ছায়া: night indigo wall `#c9cff2`, shadow `#262853`, with a lantern that turns.
- **Type:** the site's own display and body fonts only. Numbers in Bangla digits. Almost no words in play: pictures carry it.
- **First thing the player does:** tap the big lamp on the title; then drag a toy onto its shadow.
- **Shapes:** a radius only where an object is really round or soft (the lamp glass, the toys). Wall, shelf and beam are square-cut. Glow only where the lamp is lit. No emoji; every icon is SVG.

## Core
- **Concept:** a shadow lands on the wall; find the toy that cast it and put it there.
- **Fantasy:** you are the one holding the toy in front of the lamp.
- **Loop (3 verbs):** দেখো (the shadow on the wall) → টানো (drag the toy, or tap it then tap the shadow) → মেলাও (it clicks into the shadow and lights up).

## Who it is for
ছোটদের জন্য, ৩–৬ বছর. The kids' brief wins: no timer, no lives, no red, 2–4 toys on the shelf, touch targets ≥ 96 px (the end buttons 112 px), tap-then-tap beside every drag, snap generously, no reading needed, **no voice anywhere**.

## Progression: 4 worlds, 11 levels
Ids 1–5 keep their meaning (saved stars): 1 two toys, 2 three, 3 four, 4 look-alikes, 5 turned. Ids 6–11 are new. The list shows play order ১–১১.

| # | id | World | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **ঘরের বাতি** (lime-wash) | দুইটা ছবি | One shadow, two toys. Ghost finger drags the first one. |
| ২ | 2 | | তিনটা ছবি | Three toys on the shelf. |
| ৩ | 3 | | **Finale: বাতির ঘর** | Four toys, 8 shadows. |
| ৪ | 6 | **অনেক ছায়া** (moonlit) | দুই ছায়া | Two shadows at once, two toys: you choose which goes where. |
| ৫ | 7 | | তিন ছায়া | Three shadows, three toys. |
| ৬ | 8 | | **Finale: ছায়ার মেলা** | Three shadows and a toy too many. 9 toys in all. |
| ৭ | 4 | **একই রকম** (brick) | একই দলের | The toys are all from one family (animals together, birds together): look at the outline. |
| ৮ | 9 | | **Finale: চিড়িয়াখানা** | Two shadows, three animals or birds. |
| ৯ | 10 | **ঘোরানো ছায়া** (indigo) | একটু কাত | The shadow leans (25–40 degrees): the bridge to turning. |
| ১০ | 5 | | উল্টো-পাল্টা | Sideways, upside down or flipped. |
| ১১ | 11 | | **Finale: ঘুরন্ত বাতি** | Two turned shadows at once. |

A round is 6 matches (8 or 9 in a finale). Every level is open, in any order; a child never meets a lock. Each toy appears once per round.

## Difficulty, said in pictures
Each level card on the list shows a tiny wall: the shadows on top and the toys below, so one look says "one shadow, two toys" or "two shadows". There is no easy/hard switch. Quietly: three misses in a row take one spare toy off the shelf (never fewer than the shadows); five right in a row put one on (up to four). Never announced.

## Feedback that teaches
- **A slip:** the toy comes home with a spring, the shadow it was dropped on shakes its head once, and a soft low note plays. No buzzer, no red, no lives, nothing lost.
- **After two slips:** the right toy and its shadow get a ring together (a dashed ring, so it is a shape and not only a colour).
- **A match:** the toy lands with a small overshoot and a little squash, the shadow behind it goes, a ring spreads on the wall, a wooden knock and a two-note bell sound. The toy's name shows under it for a parent to read.
- **Stars** record the round: 3 = all but one matched first time, 2 = at least half, 1 = finished. ধীরে খেলো changes nothing about stars.

## Weight (the drag)
- The toy follows the finger on a spring, a little behind it, leaning into the move like a hanging cut-out; it is lifted 28 px above the fingertip so the finger never hides it.
- It grows to the shadow's size as it nears it (a toy near the lamp throws a big shadow). A shadow within reach glows a little: the magnet.
- Let go near the right shadow (a generous reach of 0.75 × its size): it springs in with overshoot. Let go anywhere else: it springs home.
- Turned shadows: when the toy lands it turns to fit (and flips, if it must), so the child sees how it fits.
- ধীরে খেলো: no lean, no overshoot, no ring spreading; the toy glides in and stops.

## Controls
- **Touch / mouse:** drag a toy; or tap a toy, then tap a shadow. With only one open shadow, a tap on a toy sends it there. First pointer only; a press lost in another window ends the drag.
- **Keyboard:** 1–4 pick a toy (with one open shadow it goes at once); with several, ← → choose the shadow and Enter or Space puts it. Tab reaches the toys and shadows. P pauses. Enter or Space on the title starts.
- **Away:** the player pauses on blur and hide. A toy in the hand goes home. The first tap back only wakes the game.

## Screens
- **Title:** the biggest thing is the unlit lamp on its beam, in the world's wall colour, with a toy's shadow half in view behind. Tap it and the lamp lights. First visit: a ghost finger on the lamp. Under it, small: the level chip (a mini wall + the level's name, opens the list), a one-line for the parent, and বড়দের জন্য (the gate: share the address).
- **Level list (a choice screen; nothing runs under it):** four world bands in their wall colours, numbered cards with the mini wall, the name and the stars. The next one to play carries a gold arrow. Opened from the title chip, the end screen or the pause menu's সব লেভেল. It is the only place a level can be chosen, so a stray tap can never restart a round.
- **HUD (corners):** top-left a badge with the level number and name (inset past ⏸ in immersive), top-right the row of matches (seats that fill). The middle stays clear; no banners in play.
- **Danger:** none. Nothing can be lost.
- **Between boards:** after the last shadow of a board is matched the picture holds for 1.5 s (2.2 s in ধীরে খেলো), the lamp flicks, and the next board comes. The hold stops while the player is paused or away and picks up where it was. No tap is needed to go on.
- **Finale:** the badge shows the finale's name; its end plays the world's four-note tune and a small confetti burst (not in ধীরে খেলো).
- **End screen:** the matched toys in a row, the stars with chimes, two counts that tick up (matches, first time), what is new, one task off the screen, then two 112 px picture buttons of equal size: **আবার খেলো** (a circling arrow) and **শেষ** (a closed door). Under them আব্বু-আম্মুকে দেখাও. Everything is on the first screen on a phone.
- **Card (ShowParent):** unchanged layout: the round's shadows beside their toys, the stars, no name.

## Sound (shared/game-sound.ts only; no loops)
1. **Lift:** a soft tick. 2. **Signature "ঠক-ঢং":** a wooden knock as the toy lands and a two-note bell pitched by world. 3. **Miss:** a low soft boing. 4. **Lamp flick:** the old lamp click as a new board comes. 5. **Stars:** a chime each, scheduled with `tone()` so a pause cuts them. 6. **World tune** at a finale. Each sound has a picture twin on screen.

## Comfort
ধীরে খেলো: no lean, no overshoot, no flicker, no confetti, a longer hold. It never changes stars. Away and pause stop the hold, the flight and every scheduled sound.

## Kids
`useKidsSession`: `atBreak()` when a round starts and at the match that finishes the round, where the stars are saved too. `RestScreen` shows on every screen but play. No network, no child data, no voice.

## Kept for compatibility
`ektukhani-levels-chhaya-melao` (stars by level id, ids 1–5 meaning unchanged), `/chhaya-melao`, `#og` (the card demo), no link state and no tally, the title, H1 and description.
