# গুনে দেখি: rewrite design

## Core
- **Concept:** a pond of fish, and a child who counts them with one finger. Each touched fish gets its number; the last number is the total.
- **Fantasy:** the ghat at the pond, the village fair and the fish market, as a small child sees them: a few big things, each one yours to touch.
- **Loop (3 verbs):** ছোঁও (a fish, and its number rises) → বলো (pick the total from three tiles) → দেখো (the pond cheers, the next pond comes).

## Who it is for
ছোটদের জন্য, ৩–৬ বছর. The kids' brief wins: no timer at a decision, no lives, nothing red, three choices, targets of 96 px or more, and no reading needed. A ghost finger shows the first move; text is for the parent reading aloud. **No voice anywhere.** Every cue is a picture, a motion or a sound.

## Look (unslop-ui)
- **Reference:** the picture-book water of a village pond, flat shapes with a darker outline (the old fish and mango code art stays). Not a cartoon-mascot app: no faces on numbers, no characters.
- **Palette, one per world:** পুকুরঘাট teal water and a deep teal accent; মেলার মাঠ turmeric-yellow ground with a burnt-orange accent (the fair's cloth); মাছের হাট evening indigo with a periwinkle water. Gold `#ffd166` is only the hint colour, never decoration.
- **Type:** the site's display font for numbers and names, body text only for the parent's line.
- **Shape:** soft only where it is water (ponds, 18 px); tiles and buttons are 10–12 px; circles only for what is round (number badges, dots, the sum).
- **Glow:** only one, the answer after two misses, as a crisp pulsing outline. No other glow.
- **First thing to do:** the world's own picture on the title is the start button.

## Progression: 3 worlds, 12 levels
Ids 1–9 keep their old meaning (saved stars stay valid); the finales are new ids 10–12. The list shows play order 1–12. Everything is open; the next one to play says এটা খেলো.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **পুকুরঘাট** (teal) | পাঁচ পর্যন্ত | Touch each fish once, the last number is the total. First pond is 2–3 fish, so the first win is under 10 s. |
| ২ | 2 | | দশ পর্যন্ত | More than a hand of fingers. |
| ৩ | 3 | | পনেরো পর্যন্ত | Big numbers: keep your place, the counted fish wear their number. |
| ৪ | 10 | | **বড় দিঘি** (finale) | Fifteen to twenty fish in the biggest pond. |
| ৫ | 4 | **মেলার মাঠ** (turmeric) | এক নজরে চার | See a group without counting; answers are dot rows, no numerals. |
| ৬ | 5 | | এক নজরে ছয় | The dice patterns up to six, in four looks (dots, dice, mango, fish). |
| ৭ | 6 | | দুই ভাগে | Two groups side by side with a +: adding. |
| ৮ | 11 | | **লুডুর চাল** (finale) | Two dice, six to twelve in all. |
| ৯ | 7 | **মাছের হাট** (indigo) | কোনটায় বেশি | Which of two ponds has more (a gap of two or more). |
| ১০ | 8 | | বড় মাছ, কম মাছ | Bigger fish do not mean more fish. |
| ১১ | 9 | | কতটা বেশি | Count the fish with no partner. |
| ১২ | 12 | | **পুকুর মেলানো** (finale) | Two ponds pour into one: how many in all. |

Each round is five ponds, about a minute. Three first-try misses in a row quietly ease the next pond (the lower half of the range); five first-try answers lift the ease. The ease carries across rounds and is never announced.

## Difficulty and story
- **No modes.** The difficulty is the level and the quiet ease. ধীরে খেলো removes motion only; it never makes stars easier.
- **Mistakes:** a soft low sound and a little wobble, then a hint in the picture (the last badge pulses; the pattern shows again; the fish line up in pairs), then after two tries the right answer's outline pulses. Nothing is lost.
- **Story:** none, on purpose. A wordless intro would delay the first touch for a three-year-old; the ghost finger on the first fish of each world is the intro.

## Screens
- **Title:** the world's picture (a pond with three counted fish, a die under a cover, or two ponds) is the start button, with a big খেলো. Under it, small: the level chip (opens the list) and one line for the parent. The grown-ups' share link is behind `ParentGate`.
- **Level list:** a choice screen. Three coloured bands, numbered cards with the world's picture, the name and the stars; a finale is a wider card; the recommended card says এটা খেলো. It pauses play. It opens from the title, the end screen, or the player's সব লেভেল.
- **Play, from the top of the stage:** the HUD in two corners (level badge top-left, five pond dots top-right), one question line, the pond or pattern, three answer tiles. The tiles show as dashed slots while fish are still being counted. The middle stays clear.
- **Danger:** none. There are no lives and no timer at a decision. The one timer, the 1.5 s glimpse, is replayable without limit by tapping the cover.
- **Finale of each world:** a named level with its own card, the world's four-note tune and confetti at the end.
- **End screen:** the stars, what the round did counting up (fish counted or patterns seen, and the first-try count out of five), one line for what was done, one line of praise only when earned, a task off the screen, then two 112 px picture buttons (↻ again, ✓ done) and আব্বু-আম্মুকে দেখাও. ✓ goes to the title with the next level ready.
- **The card:** only for the parent: what was done today, first person, no name, no stars. It is drawn on the phone and saved behind the gate.

## Sound (all from `shared/game-sound.ts`)
- **Signature, "গোনা":** a water plip and a marimba note one step higher for each fish, along a pentatonic climb (twenty fish still sound like a tune).
- A small bell when the last fish is counted; a two-note right in the world's key; a soft low boing for a miss, never a buzzer; a whoosh and a soft pop when the pattern shows and hides; a pour when two ponds merge; star chimes; a four-note world tune at a finale.
- No loops and no music. Every sound has a picture twin: the number on the fish, the cheer, the wobble, the pattern, the stars. It works fully on mute.

## Motion (Emil's rules)
Presses are transitions of 120–140 ms with `scale(.97)`; counting is a 220 ms hop, a 200 ms badge pop from `scale(.7)` and a 450 ms ring; the next pond is one 220 ms entrance (its fish are simply there); the badges cheer in a short wave (40 ms apart, six at most); the ponds merge by transform in 240 ms; stars pop 300 ms apart. All easing is `cubic-bezier(.23,1,.32,1)` or `(.77,0,.175,1)`. ধীরে খেলো and reduced motion switch every animation and transition off.

## Comfort and controls
- **Touch:** act on the lift of a finger that stayed within 12 px, not on the touch, so a scroll never counts. Only the first finger counts. After blur or pause the first tap only wakes the game.
- **Keyboard:** Tab and Enter on fish; 1, 2, 3 for the tiles; Enter or Space starts from the title and (fresh press only) plays again from the end screen; P pauses through the player. Escape belongs to the player.
- **Mouse:** click.
- **Pause:** the player's menu on blur, hide, ⏸, P. The pond timer and the glimpse wait; the glimpse restarts in full when you are back.

## Kept for compatibility
- The address `/gune-dekhi`, the social image, the title, headline, description and H1 rules, and 9 FAQs.
- Saved stars in `ektukhani-levels-gune-dekhi`: ids 1–9 mean what they meant; 10–12 are new.
- No challenge links, no tally, no `/api`: a kids' tool shares only its plain address behind the gate.
