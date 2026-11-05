# বর্ণ লিখি: rewrite design

## Look (written before any styling, per `unslop-ui`)
- **Reference:** a Bangladeshi school exercise book (খাতা): a coloured cardboard cover with a white label, ruled paper inside. The cover's colour is the world. Nothing here is a software default: the corners are square on paper and buttons (hard, printed edges with a flat offset shadow like the book's thickness); only dots and discs are round.
- **Palette, one per world (notebook-cover colours):** স্বরবর্ণ blue `#1f4e9c`, ব্যঞ্জনবর্ণ green `#2b7a4b`, কঠিন গড়ন maroon `#8f2a3a`, সংখ্যা mustard `#9a6a08`, each with a pale tint for the stage. Three signals never share a colour: the **start dot** is vermilion `#d6431f` and numbered, the **moving dot** is amber `#f08a00` with a trail, the **ink** is the cover colour.
- **Type:** the site's own display and Bengali faces. The faint guide letter is drawn in the Noto face the site already ships, so the letter being traced is the letter a child will read.
- **What the player does first:** touch the glowing ১ dot and pull along the dotted path.

## Core
- **Concept:** trace a Bangla letter along numbered, dotted strokes; when its last stroke is down, the letter turns into a big picture (অ-তে অজগর).
- **Fantasy:** the child is the one writing in the first খাতা, and every letter they write comes alive.
- **Loop (3 verbs):** দেখো (a moving dot shows the stroke's order and direction) → টানো (ink follows the finger along the path) → ছবি (the letter turns into its picture).

## Who it is for
ছোটদের জন্য, ৪–৭ বছর. The kids' brief wins: no clock, no lives, nothing red, ≥ 96 px buttons, no reading needed (a dot, an arrow, a hand and a picture carry every step), no voice anywhere (the site's rule), no network, no child data.

## Progression: 4 worlds, 17 sets
Ids 1–13 keep their old meaning (saved stars and `?print=N` links stay valid); finales are new ids 14–17. The list shows them in play order, numbered ১–১৭.

| # | id | World | Set | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **স্বরবর্ণ** (blue) | অ আ ই ঈ উ ঊ | Start at the numbered dot, follow the arrow; the মাত্রা comes last. A ghost hand rides the dot on the very first stroke. |
| ২ | 2 | | ঋ এ ঐ ও ঔ | Letters without a full মাত্রা: the last stroke is a bend. |
| ৩ | 14 | | **Finale: স্বরের আসর** (ই ঊ ঋ ঐ ঔ) | The world's five trickiest, one after another. |
| ৪–৮ | 3–7 | **ব্যঞ্জনবর্ণ** (green) | ক-বর্গ … প-বর্গ | Curve first, stem next, bar last; loops and closed bends. |
| ৯ | 15 | | **Finale: ব্যঞ্জনের হাট** (ঘ ছ ঝ ঠ ভ) | |
| ১০–১৩ | 8–11 | **কঠিন গড়ন** (maroon) | য র ল · শ ষ স হ · ড় ঢ় য় ৎ · ং ঃ ঁ | Slanting paths, twisted middles, a dot to touch (র, ড়, ঢ়, য়), marks that sit on a letter. |
| ১৪ | 16 | | **Finale: কঠিনের মেলা** (ষ হ ঢ় ৎ ঁ) | |
| ১৫–১৬ | 12–13 | **সংখ্যা** (mustard) | ০–৪ · ৫–৯ | One-stroke numbers, no মাত্রা; each turns into that many dots. |
| ১৭ | 17 | | **Finale: সংখ্যার মালা** (৩ ৫ ৬ ৮ ৯) | |

In a finale the moving dot plays once per stroke and does not loop by itself (দেখাও still shows it). A finale ends with the world's four-note tune and a small confetti burst (outside ধীরে খেলো).

## Difficulty and story
- **No modes** (the brief: never announce "easy"). The path's width adapts silently: three tries that go nowhere replay the stroke and widen the path; five clean strokes in a row narrow it a little. ধীরে খেলো changes motion only, never how easy the stars are.
- **Honest tracing:**
  - no key writes a stroke: Enter and Space only replay the moving dot;
  - progress counts only after the finger has followed the path for a few events in a row, so lucky scattered touches roll back;
  - a jump across the board is not filled in and adds at most 3 samples;
  - the keyboard writes with the **arrow keys**: a pen that has to follow the path like a finger (about 40 presses a stroke).
- **Stars** record the set only: 3 when the dot had to come back at most once and the finger stayed near the path three moves in four; 2 up to three replays and half the moves; else 1. Never spent or compared.
- **Bots, asserted in `tests/levels.test.ts` (40 seeds × 17 sets):**
  - a careful finger clears every set, 3 stars on ≥ 95% (measured 99%);
  - a shaky 4-year-old clears every set, 2+ stars on ≥ 95% (99%), 3 stars on ≥ 85% (96%);
  - a toddler banging near the path gets through ≥ 99% of sets (100%), with fewer 3-star sets (67%);
  - a scribbler needs about 5× the touches and never earns more than 1 star;
  - tracing backwards never writes a stroke; the first stroke of set ১ is written within a second or two of finger time.
- **No story.** A pre-reader can't read panels; the cover, the moving dot and the picture do the work.

## Screens
- **Cover (title, inside the stage):** a notebook cover in the set's colour. Its white label holds the set's first letter in dotted strokes with a dot that draws it again and again. A big ▶ খেলো strip sits across the bottom. The whole cover is the start button. Under it, small: the set chip (number, name, world; opens the list) and one line ("ডট ধরে আঙুল টানো।"). At the foot: বড়দের জন্য (the kit's gate: share the tool's address, the print sheet).
- **Set list (a choice screen; nothing runs under it):** four world bands in their colours, numbered cards ১–১৭ showing the letters themselves and the stars. The next set to play is marked **এটা খেলো**. Everything is open. It also opens from the player's menu (সব লেভেল) while a letter is on the board; ← returns to the same letter.
- **HUD (corners):** top-left the set number (a finale adds its name), top-right the letter chips (done = filled, now = outlined). The middle holds the page only.
- **The board:** a ruled page, square, sized from the stage (`lib/layout.ts` is the one formula for CSS and canvas). Ink grows along the path as you touch; a pen nib sits at its head. Under it, three 96 px slots: **দেখাও** (replays the moving dot; a drawing of a dotted arc), the letter's name, and a faint grey teaser of the picture it will turn into.
- **The reward:** when the last stroke is down, a page covers the board (the letter small in its corner) and the picture pops in at **180–300 px** with its word under it ("অ-তে অজগর", for a parent). The row under it becomes two 96 px picture buttons: **↺ আবার লিখি** and a wide **→ পরেরটা** (on the last letter, **শেষ**). → nudges gently three times; nothing starts by itself.
- **Danger:** none; nothing can be lost.
- **End screen:** the filled page (every letter with the picture it turned into), the stars with chimes, counts ticking up ("৬টা বর্ণ · ২৪টা দাগ"), what was written, a task off the screen ("এবার খাতায় পেনসিলে একবার করে লেখো।"), then two 112 px picture buttons of equal size, **আবার খেলো** and **শেষ**, and আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** unchanged: the letters written today on a খাতা page. No name, no stars; saving it is behind the gate. The og image doesn't change.

## Sound (`shared/game-sound.ts` only; no loops, no music, no voice)
1. **Touch:** a soft tick when a finger lands. You see the nib appear.
2. **Ink:** a tick that climbs as the stroke fills. You see the ink grow.
3. **Stroke written, with a world-pitched note:** a wooden টুক and one bright triangle note. You see the next dot light.
4. **Signature, the letter turns into its picture:** two rising bell notes. You see the picture pop in.
5. **Tap:** on every button.
6. **Stars:** one chime each, scheduled tones so a pause cuts them. **Finale tune:** four notes. You see the stars and the confetti.

## Comfort and controls
- **ধীরে খেলো (and `prefers-reduced-motion`):** the moving dot does not travel (the whole stroke lights up and the dot rests on the start for 2.5 s), no easing on the ink, no glow, nudge, pop or wiggle, no confetti, the picture appears at once. Stars are unchanged.
- **Touch:** act on the first finger only (a palm or second finger is ignored). Pointer capture, coalesced events for smooth ink. The page never scrolls under the finger.
- **Keys (at `window`, never by focus):** arrow keys move the pen; Enter or Space on the board replays the dot; on a picture, a fresh Enter or Space is →; on the end card, a fresh press is আবার খেলো; P pauses through the player; Escape belongs to the player.
- **Away:** blur, hide and the player's menu all release the finger and stop the frame loop. The first tap back only wakes the game; resuming gives a fresh hand.
- **Kids:** `useKidsSession`. `atBreak()` runs when a set starts and at the moment the last letter's last stroke is written (the stars are saved in the same touch, so leaving during the picture never loses them). `RestScreen` shows on any screen but play.
- **Kept for compatibility:**
  - `ektukhani-levels-borno-likhi` (stars by id; 1–13 unchanged, 14–17 new);
  - `/borno-likhi`, `?print=N` (now 1–17; anything else is set ১), `#og`;
  - the title, H1 and description; the card; no link state and no tally.
