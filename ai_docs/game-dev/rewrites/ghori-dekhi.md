# ঘড়ি দেখি: rewrite design

## Core
- **Concept:** a child's day on a clock face. A picture of the day's job (the sky and one object) sits beside a small picture clock. Turn the big clock's hands to match it, or read the big clock and pick the matching one.
- **Fantasy:** the wall clock at home. You are the one who knows what the hands mean: where the sun is, what the pie of the hour looks like.
- **Loop (3 verbs):** দেখো (the sky, the job and the small clock) → ঘোরাও (drag or tap a hand, it follows and clicks into place) → মেলাও (✓: the pie fills and the hour rings).

## Who it is for
ছোটদের জন্য, ৫–৯ বছর. The kids' brief wins: no clock-against-the-child, no lives, nothing red, 2–4 choices, targets ≥ 72 px (the ✓, ▶ and end buttons ≥ 96 px), and no reading needed in the first three worlds. **No voice anywhere** (site rule): every cue is a picture, a motion or a sound effect. The words (সাড়ে ৮টা) always show too, for the parent and for the 7–9 year old who is learning to read them.

## Progression: 4 worlds, 11 levels
Ids 1–5 keep their old meaning (saved stars). Ids 6–11 are new. The list shows play order, numbered ১–১১.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **ঘণ্টা** (ভোর: orange) | ঠিক ঘণ্টা | The short hand tells the hour. The long hand is locked at 12, so a 5-year-old drags one hand. Ghost finger on the first item. |
| ২ | 6 | | **Finale: স্কুলের ঘণ্টা** | Both hands free; the long hand must come home to 12 (it starts away). 8 items. |
| ৩ | 2 | **সাড়ে** (দুপুর: green) | সাড়ে | The long hand at 6, the short hand halfway. The half pie fills. |
| ৪ | 7 | | দেড়টা, আড়াইটা | 1:30 and 2:30 have their own words. |
| ৫ | 8 | | **Finale: দুপুরের ছুটি** | ঘণ্টা and সাড়ে mixed. 8 items. |
| ৬ | 3 | **সোয়া, পৌনে** (বিকেল: blue) | সোয়া | The long hand at 3: a quarter of the pie. |
| ৭ | 9 | | পৌনে | The long hand at 9; a quarter is left. The short hand sits just before the next number. |
| ৮ | 10 | | **Finale: বিকেলের মাঠ** | ঘণ্টা, সোয়া, সাড়ে, পৌনে mixed. 8 items. |
| ৯ | 4 | **মিনিট** (সন্ধ্যা: plum) | ৫ মিনিট করে | Count by fives round the dial; the pie shows the minutes. |
| ১০ | 5 | | সকাল না সন্ধ্যা? | The sky says the part of the day. |
| ১১ | 11 | | **Grand finale: সারা দিনের ঘড়ি** | Everything, with the part of the day. 8 items. |

A round is the child's day in order (wake-up … bed), 6 items (8 in a finale). Items alternate by seed between *set* (turn the hands) and *read* (pick the matching clock). The activities and times differ every round.

## The target is always a picture
- **Set item:** a card beside the sky shows the target as a small clock (hands drawn), the words, and the sky (the sun's place). In worlds 1–3 the small clock is always on; in world 4 it appears after the first slip (the words and the sky are always there).
- **Read item:** the big clock shows the time. Each choice card shows its own small clock and its words. In world 4 the cards are words only; a wrong pick reveals that card's small clock, so a miss teaches ("that is what *that* time looks like").

## Feedback that teaches
- **Pie:** from 12 to the long hand, a tinted wedge with the minutes inside (১৫, ৩০, ৪৫). সোয়া is a quarter, সাড়ে is a half, পৌনে leaves a dashed quarter. It fills on a right answer and follows the hand in worlds 1–3.
- **A slip (set):** the wrong hand wobbles and the number it should point to rings (the long hand first, since it decides the words). One line of text for readers. After two slips the target hands show as ghosts on the dial.
- **A slip (read):** the wrong card wobbles and shows its own small clock; after two slips the right card glows with a ring (shape, not only colour).
- No buzzer, no ✕, no lives. At most three tries on an item.
- **Sweet spot, never announced:** three slips in a row ease the next item (2 choices, ghost hands from the start); five right in a row step it up (4 choices).
- **Stars** record the round: 3 = all but one item right first time, 2 = at least half, 1 = finished. ধীরে খেলো changes nothing about stars (nothing is timed).

## Clock hands
- Drag grabs the nearer hand and it follows the finger smoothly (not in clicks). A dot marks the click spot it will take, a soft tick sounds each time it passes one, and on release it eases into the click (it jumps in ধীরে খেলো).
- Tap a number to send the chosen hand there; the picture chips (short hand / long hand) choose. In level ১ there is one hand, so no chips.
- Keys: arrows turn the chosen hand one click, Enter or Space is ✓ (then ▶), 1–4 pick a card.
- A hand moves only under a finger or the mouse button: a press lost in another window ends the drag, hover does nothing, a new item resets it.

## Screens
- **Title (inside the stage):** the biggest thing is a clock face drawn in code with its hands slowly turning and a sun at its shoulder, and **▶ খেলো** across the bottom. Under it, the level chip and one line for the parent. At the foot, small: বড়দের জন্য (the gate: share the address, the print sheet).
- **Level list (a choice screen, nothing runs under it):** four world bands, numbered cards with a small clock at a typical time, the name and the stars. The next to play is marked **এটা খেলো**. Everything is open.
- **HUD:** top-left (inset past ⏸ in immersive): level badge with the small clock; top-right: six or eight seats that fill. The middle holds the card, the clock and the controls. No danger edge: nothing can be lost.
- **Item flow:** ✓ (a 96 px picture button) checks. A right answer rings, fills the pie and shows the words (সাড়ে ৮টা · নাশতা খাওয়া); ▶ (96 px) goes on. Nothing moves on by itself.
- **Finales:** the badge shows the finale's name; the end plays the world's four-note tune and a small confetti burst (not in ধীরে খেলো).
- **End screen:** the day's times as small clocks (3 × 2 or 4 × 2), the stars with chimes, counts that tick up ("৬টা সময় · ৫টা প্রথমবারেই"), what the child can do now, a task off the screen, then two 112 px picture buttons of equal size: **আবার খেলো** (a circling arrow) and **শেষ** (a closed book, back to the title with the next level ready). Under them **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** unchanged in layout: a clock at the last time, the day's times in order, the stars, no name.

## Sound (`shared/game-sound.ts` only; no loops)
1. **Tap / grab:** a soft tick. 2. **Click-in:** a tiny tick as a hand crosses each click. 3. **Signature "ঢং":** a bell as the answer is right, two bell notes (the hour's note) pitched by world. 4. **Miss:** a soft low boing. 5. **Next:** a paper swish. 6. **Stars:** the star chimes; a finale adds the world's four-note tune. Each sound has a picture twin on screen.

## Comfort and controls
- **ধীরে খেলো:** no easing, no wobble, no sweeping title hands, no confetti, steady rings instead of pulses. Stars are unchanged.
- **Away:** the player pauses on blur and hide. Drags are released (they snap and stop), the first tap back only wakes the game.
- **Kids:** `useKidsSession`; `atBreak()` runs when a round starts and at the tap that solves the last item, where the stars are saved too. `RestScreen` shows on any screen but play. No network, no child data, no voice.

## Kept for compatibility
`ektukhani-levels-ghori-dekhi` (stars by level id, ids 1–5 unchanged), `/ghori-dekhi`, `/ghori-dekhi?print`, no link state and no tally, the title, H1 and description.
