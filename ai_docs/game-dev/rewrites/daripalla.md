# দাঁড়িপাল্লা: rewrite design

## Core
- **Concept:** a shop balance. The left pan holds what the shop gives; the child puts weights, fruit or numbers on the right pan until both sides are level.
- **Fantasy:** you are the one the দোকানদার lets work the scale: a মুদির দোকান, then a ফলের বাজার, then a ঠোঙার হাট at dusk.
- **Loop (3 verbs):** চাপাও (tap a weight, it flies onto the pan and lands) → দেখো (the beam tips, wobbles, and settles level) → বলো (a fruit's weight, or what ★ is).

## Who it is for
ছোটদের জন্য, ৬–১১ বছর. The kids' brief wins: no clock, no lives, nothing red, hands of 72 px or more, nothing a child types, no network. **No voice anywhere:** every cue is a picture, a motion or a sound effect. Stars record how cleanly a round went, never who is better; ধীরে খেলো does not change them.

## The look (written before styling)
- **Reference:** a hand-painted Bangladeshi shop sign and the flat colour of rickshaw art: one thick dark outline (3 px, a warm near-black per world), flat fills, and a hard offset shadow under every pressable object, like a sticker with weight. No gradients except the soft tint on a finale card.
- **Palette per world (each says where the child is):**
  - **মুদির দোকান:** turmeric wall `#f4dba6`, brass `#d9a21b`, wood `#9a6a2c`, sindoor red `#b3402a`, ink `#3a2410`.
  - **ফলের বাজার:** mint wall `#cfe9d8`, a green-and-cream awning, leaf green `#1f7a5a`, ink `#123f33`.
  - **ঠোঙার হাট:** dusk indigo wall `#4a3d85`, lamp yellow `#ffd166`, berry pink `#c2306c`, ink `#1c1433`.
- **Type:** the site's own display font for every number and label (`--font-display`); the body font for lines. No new fonts.
- **Shape:** a small radius (5–10 px) only on cards and buttons that are objects; circles only for what is round (the brass hub, the number coin, the pan plate). The only glow is the gold ring when a pan comes level, and the gold answer after two wrong tries.
- **What the child does first:** tap the biggest thing on the title (the shop with the scale, খেলো), then the first weight: a white ghost finger shows it.

## Progression: 3 worlds, 11 levels (each level adds one thing)
Ids 1–7 keep their old meaning (saved stars stay valid); 8–11 are new. The list shows them in play order ১–১১.

| # | id | World | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **মুদির দোকান** | ১০-এর মধ্যে | Tap a weight and it lands. The first pan is one tap (a win in about 3 s). |
| ২ | 2 | | ২০-এর মধ্যে | The ১০ weight; sums up to 20. |
| ৩ | 3 | | ফল দিয়ে মেলাও | Fruit with a weight tag instead of weights. |
| ৪ | 8 | | **মুদির বড় অর্ডার** (finale) | The given side is two weights (৭ + ৬), one already on your pan. |
| ৫ | 4 | **ফলের বাজার** | কলাটার ওজন কত? | An unknown fruit: balance it with weights, then say what it weighs. |
| ৬ | 5 | | ফল আর বাটখারা | The fruit comes with a weight beside it. |
| ৭ | 6 | | দুটো একই ফল | Two of the same fruit: one weighs half. |
| ৮ | 9 | | **ফলওয়ালার ঝুড়ি** (finale) | Two fruit and a weight together. |
| ৯ | 10 | **ঠোঙার হাট** | একটা ★ | ★ is a hidden number in a paper bag: ★ + ৩ = ৮. |
| ১০ | 7 | | ছবির অঙ্ক | Two ★. |
| ১১ | 11 | | **তিন ঠোঙার হিসাব** (finale) | Three ★. |

Five pans a round. A quiet ease (three misses in a row make the next pans of that round smaller) and a quiet step up (five clean pans in a row) are never announced and **reset every round**.

## Difficulty and story
- **Modes:** none to choose. One pace, eased or stepped inside a round by how it goes. ধীরে খেলো: nothing flies, drops or pulses; the beam jumps straight to its tilt. The stars are the same.
- **Story:** none. The shop is the story; each world's finale ends with its own tune and confetti.

## Screens
- **Title:** the shop (the world's wall, the balance leaning toward its weights) is one big button, খেলো on it. Under it, small: the level chip (number, name, world), which opens the list; the parent gate and share link.
- **Play (portrait, no page scroll):** HUD in the top corners only: level badge left, five pan dots right. Then the balance filling the stage, a chalkboard with the sum (`৭ > ৪ + ২`), one calm line (a why or the question), and the tray at the bottom: weights (≥ 84 px), or three numbers, or পরের পাল্লা (96 px).
- **The balanced moment:** the needle and hub turn gold, a ring opens once, the chalkboard `=` lights, the dot fills, the beam wobbles (pan sway and a dip from the landing) and the brass টুং rings. It **holds 0.9 s** before পরের পাল্লা appears; for a fruit question the numbers wait 0.6 s. The next button does not exist at the moment of the tap, so a phone's tap-through click can never press it.
- **Choice moments (pause, numbered, before → after, RECOMMENDED):** the level list is the one choice screen: nothing runs under it, cards are numbered ১–১১, show the stars, and the next one to play says এটা খেলো. Opened from the pause menu in the middle of a touched round, picking a level asks first with two picture buttons (থাকি, চলো).
- **Danger signals:** none; there is no danger. A heavy pan tips and says why in one line.
- **Finales:** a named card on the HUD badge, confetti and a four-note tune of the world's key at the end.
- **End:** the level balance in a picture (gold), three stars one by one, two counts that tick up (পাল্লা, প্রথমবারেই ঠিক), what the child can do now, one task off the screen, then আবার খেলো and শেষ at 112 px as picture buttons, then আব্বু-আম্মুকে দেখাও. The card has no name and no stars.

## Sound (shared/game-sound.ts only; mute-first)
`take` (a pluck as a weight leaves the tray), `land` (a wooden thud, lower for a bigger weight), `heavy` (two thuds, never a buzzer), `level` (the signature: a brass টুং and two echoes), `right`, `again` (a soft low boing), `drop` (the next pan's weights), `ready`, `stars`, each world's `tune` at its finale. Each has a picture twin: the flight and dip, the gold gauge, the dots, the chalkboard.

## Comfort and controls
- **Touch:** first pointer only, acts on pointerdown (50 ms); the first tap after coming back only wakes the game. **Keyboard:** Tab and Enter press the tray; 1–9 put the nth weight on; 1–3 pick the nth number; Backspace lifts the last piece; Enter or Space presses পরের পাল্লা when nothing is focused; P pauses; Escape belongs to the player.
- **Pause:** the player's menu; blur, hide and the menu stop the fixed-step clock, so the beam, the hold and the end page's wait simply stop. সব লেভেল opens the list.
- **Kept for compatibility:** the slug, the SEO title, description and H1; `ektukhani-levels-daripalla` with ids 1–7 meaning what they did; no links, no network, no child data.
