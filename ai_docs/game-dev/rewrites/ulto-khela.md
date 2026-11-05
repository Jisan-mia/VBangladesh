# উল্টো খেলা: rewrite design

## Core
- **Concept:** a picture comes (a sun, a cat, a full glass); tap its opposite. When the bell rings the rule flips to "same", and in the last world the child sorts red flowers and blue boats by colour, then by shape.
- **Fantasy:** a little village (উল্টো পাড়া) where every thing has an opposite: day and night live side by side, and a bell hangs on the tree between them.
- **Loop (3 verbs):** দেখো (the picture and the sign) → বেছে নাও (tap one of two big cards) → মেলাও (the card lights, the next picture comes).

## Who it is for
ছোটদের জন্য, ৪–৮ বছর. The kids' brief wins over the games brief: nothing is timed unless a child of 7+ picks চটপট; no lives, nothing red, two choices, targets ≥ 96 px, no reading needed (the picture, the ⇄ / = sign, the ghost finger and the bell carry the move). **No voice anywhere**: `speak()` and `SpeakButton` are gone from this game. Words under the pictures are for the parent to read aloud.

## Look (unslop-ui)
- **Reference:** a Bangla picture-book flash card, a flat picture with a thick outline on paper. Hard print-style offset shadows instead of blur; the only glow is the ring that marks the right card after two tries (a lit lamp, a real signal).
- **Palette, one per world** (the site's own terracotta `#c4511f` is world 1; the rule colours are the others): উল্টো পাড়া terracotta on warm paper, ঘণ্টার গ্রাম green `#2f7d4a` (the "same" colour), রং আর আকার violet `#6a3fb0`. Ink `#3a2a1a`. Kept from the old game on purpose.
- **Type:** the site's own display and body fonts. Bangla never gets letter-spacing.
- **Radius:** 10 px on cards (they are cards), circles only where the thing is a circle (the sign, the dots, the number badge). No pill buttons.
- **Icons:** all SVG, drawn in `components/pics.tsx`. No emoji.
- **What the player does first:** tap the big launch picture (day and night under a bell).

## Progression: 3 worlds, 11 levels, one new thing each
Level ids 1–6 keep their old meaning (saved stars stay valid); 7–11 are new. Play order is shown as ১–১১. Nothing is locked.

| # | id | World | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **উল্টো পাড়া** (terracotta) | সূর্য এলে চাঁদ | Tap the opposite: sun/moon, day/night. A ghost finger shows the first tap. |
| ২ | 7 | | বিড়াল আর ইঁদুর | New pictures: cat/mouse, big/small. |
| ৩ | 2 | | সব উল্টো | Seven pairs (cold/hot, full/empty, open/shut join). |
| ৪ | 8 | | **Finale: উল্টো মেলা** | All seven pairs, twelve pictures in a row. Tune and confetti. |
| ৫ | 10 | **ঘণ্টার গ্রাম** (green) | ঘণ্টা একবার | The bell rings once: the rule becomes "same". |
| ৬ | 3 | | ঘণ্টা বাজলে একই | The bell comes again and again, in both directions. |
| ৭ | 4 | | ঘণ্টা বারবার | Bells close together, five pairs. |
| ৮ | 9 | | **Finale: ঘণ্টাঘর** | Seven pairs, bells every two or three pictures. |
| ৯ | 5 | **রং আর আকার** (violet) | রং, তারপর আকার | Cards: match by colour, then (after the bell) by shape. |
| ১০ | 6 | | রং না আকার? | The rule flips often. |
| ১১ | 11 | | **Finale: ঝুড়ির মেলা** | Sixteen cards, fast flips. |

Every round is seeded, so a replay is a new order. The first picture and the first after every bell are demos: the ghost finger shows the tap and they don't count.

## Difficulty and story
- **Two paces, chosen on the title** (not remembered, so a child always starts calm):
  - **আরামে** (default): "কোনো তাড়া নেই, চাপলে তবেই পরের ছবি।"
  - **চটপট ৭+**: "প্রতিটা ছবি কয়েক সেকেন্ড থাকে, তারপর সরে যায়।" A bar drains under the picture; a passed picture counts as a miss and lights the right card. The clock runs only while the game is live: it stops on blur, hide, the pause menu and the level list, and a picture gets its full time again when play resumes.
- **The sweet spot is silent:** three missed pictures in a row ease the next ones (longer runs between bells, at most three pairs), five clean answers step it up. Demos never move it. Stars don't change with it.
- **A slip teaches, never scolds:** the card wobbles and dims, the sign pulses, and one line names the rule and asks ("এখন নিয়ম ‘উল্টো’। চাঁদ এসেছে, তার উল্টো কী?"). After two tries on a picture the right card gets the lit ring.
- **Stars** record the round only: up to one miss → ৩, up to three → ২, else ১. Slow mode never changes them. Passes count as misses and never as stars.
- **Honest end line:** 0–1 slips praise the method, 2 say "২বার থেমে আবার ভেবেছ", 3+ give a tip and no praise.
- **No story panels.** A pre-reader can't read them: the title art and the ghost finger do the job.

## Screens
- **Title (inside the stage):** the launch picture is the start button and the biggest thing on screen. Under it: two pace chips (আরামে / চটপট), one line for the chosen pace, the level chip (opens the list), and at the foot the small বড়দের জন্য gate (share the tool's address only).
- **Level list (a choice screen; nothing runs under it):** three world bands in their colours, numbered cards ১–১১ with a small sign (⇄, a bell, colour drops), the name and the stars. The next level to play has a heavy outline and says এটা খেলো.
- **HUD (corners):** top-left a world-coloured level badge; top-right the progress dots. The middle stays clear. In immersive mode the player's own band holds the ⏸.
- **Danger:** none. Nothing can be lost.
- **The round:** the picture on top (the biggest thing), then the rule sign (⇄ উল্টো, = একই, drops রং, outlines আকার), one line, two cards. On a bell the sign flips, the bell swings twice with the two strikes, and the line says "ঘণ্টা বাজল!".
- **Ghost finger:** below the right card, never on it; on a demo, after 7 s of waiting, and with the lit ring.
- **Finales:** the badge shows the finale's name; its end plays the world's four-note tune and a small confetti burst (ধীরে খেলো: none).
- **End screen:** the pairs met (little pictures; the two baskets for the sort), the stars with chimes, the counts ticking up ("১০টা ছবি · ৮টা প্রথমবারেই · ১ বার ঘণ্টা"), the honest line, "এখন তুমি … পারো", a task off the screen, then two 112 px picture buttons of equal size: **আবার খেলো** (↻) and **শেষ** (a setting sun). শেষ goes to the title with the next level ready; nothing starts by itself. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** a sun and a moon facing each other and today's lines ("আজ ২০টা ছবিতে উল্টো খেললাম"). No name, no stars. Saving it is behind the gate. `#og` shows a fixed one.

## Motion (Emil skills)
| Element | Role | Starts | Duration | Motion | Why |
|---|---|---|---|---|---|
| New picture | lead | 0 | 160 ms | scale .94 → 1 + fade, ease-out | state indication; seen often, so short |
| Card press | feedback | tap | 140 ms | translateY 3 px, shadow shrinks | the UI heard the finger |
| Right card | feedback | tap | 160 ms | pop + check badge | confirms; the sound is the same instant |
| Wrong card | feedback | tap | 300 ms | wobble ±5 px, dim | soft, never red |
| Rule sign | support | tap (wrong) | 240 ms | icon scale 1.08 | points the eye back at the rule |
| Bell + sign flip | lead | at the bell | 300 ms flip, 2 × 280 ms swing | rotateX 90° → 0, bell ±16° | rare; the swings land on the two strikes |
| Progress dot | decoration | right tap | 200 ms | scale in | state indication |
| End screen | stars, counts | 350 ms | stars 350/650/950 ms, count-up 900 ms from 450 ms | pop and rAF count | the pairs (40 ms stagger, capped at 5) and the buttons are there at once: nothing blocks a tap |
| চটপট bar | state | picture start | 3–5 s | linear scaleX | constant motion; it is the clock, so slow mode keeps it |
| Title bell | decoration | 2 s, then every 6 s | 600 ms | small sway | attention loop, rare |

Only `transform`, `opacity` and `box-shadow` on small elements; no `transition: all`; `:hover` only behind `(hover:hover) and (pointer:fine)`. ধীरে খেলো and `prefers-reduced-motion` remove every animation but the চটপট bar.

## Sound (`shared/game-sound.ts` only; no loops, no music, no voice)
1. **Tap:** a soft tick (title buttons, start).
2. **Right:** that pair's note on a pentatonic scale plus a soft overtone. You see the card light up.
3. **Slip:** a soft low boing, never a buzzer. You see the wobble and the line.
4. **Bell, the signature:** two soft strikes 0.28 s apart. You see the bell swing twice and the sign flip.
5. **Next:** a quiet swish.
6. **Stars and world tune:** chimes as scheduled tones (the player's pause cuts them); a four-note tune at a finale's end.

## Comfort and controls
- **ধীরে খেলো / reduced motion:** nothing flips, swings, wobbles or pulses; the lit ring is steady; no confetti; no count-up. Stars are unchanged.
- **Touch:** every answer acts on the first finger's pointerdown (a palm or second finger is ignored). Cards ≥ 120–150 px, end buttons 112 px, chips 64 px, gaps 16 px.
- **Keys:** 1/2 or ←/→ pick a card. Enter/Space on the title = খেলো; on the end screen only a fresh press = আবার খেলো. Tab then Enter/Space picks a focused card. P pauses through the player.
- **Away:** the player pauses on blur and hide; our own handlers also stop both timers; they come back with a 0.5 s breath. The first tap back only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the moment the last picture is done (stars saved in the same moment). `RestScreen` shows on any screen but play. The share gate lives on the title and shuts when a round starts and on any touch outside it.
- **Kept for compatibility:** `ektukhani-levels-ulto-khela` (stars by level id; 1–6 same kind of level), `/ulto-khela`, the title, H1 and description wording, no link state and no tally (`share.normalize` stays `null`).

## Architecture
- `lib/course.ts` worlds and levels as data; `lib/pairs.ts` the pictures, pairs, cards and rules; `lib/round.ts` the pure round (seeded, pace, bells, stars, results); `lib/session.ts` screens, the two timers, pause and away, the rest screen and keys; `lib/words.ts` every Bangla line; `lib/sound.ts`; `lib/today.ts` and `lib/draw-card.ts` the parent card.
- `components/pics.tsx` all art (SVG), `components/count.hot.ts` the end-screen count-up (allocation-free), thin React in `game.tsx`, `title.tsx`, `level-list.tsx`, `end-screen.tsx`, `og-card.tsx`.
- Tests: bots (a guesser, a five-year-old, a learner) over 2,000 seeds per level for finish rate, star rates and time; every statechart bug replayed; the source checks.
