# লাটিম: rewrite design

## Look (decided before styling)
- **Reference:** a hand-painted wooden village toy on a mud, red-oxide or tin surface: matte flat colour, hard shadows, the top's own painted rings (red, yellow, green, blue) as the only bright accent. Nothing glossy, no gradients on controls.
- **Palette per world:** মাটির উঠান earth `#c9895a` / mud wall `#8a5a36` / sky `#9fd3ea`; পাকা মেঝে red oxide `#9b3427` / cream wall `#e8dcc0` / lamp `#f6d27a`; টিনের চাল tin grey `#8f9aa5` / sky `#8cc6e8`. UI ink `#2b1d12`, accent `#b5441b` (the same rust as the card), gold `#ffd166` for stars and the chosen chip.
- **Type:** the site's own `--font-display` and Bengali face only. No new font.
- **Shape:** a small radius scale by role (boards 10 px, pads and buttons 8, chips 4); only the top, dots and the string are round. Icons are SVG (`components/icons.tsx`), never emoji. Glow appears only as the danger edge and the safe-lift rim.
- **First thing to do:** the top itself on the board খেলো. Everything else is small.

## Core
- **Concept:** the old উঠানের খেলা. Wind the string, throw the top, then keep it spinning as long as you can, or lift it onto your palm for a bonus. Twelve courtyards in three places.
- **Fantasy:** the kid whose লাটিম is still humming when everyone else's has fallen over, on a mud উঠান, a red-oxide floor and a tin roof in the wind.
- **Loop:** wind → throw → steady (পেঁচাও → ছোড়ো → সামলাও), and at the end of a spin, lift or let it run (তোলো).

## The throw and the spin
- **Two ways to throw, one result** `{ power, straight }`:
  - **Pull** (touch): put a finger on the stage and pull down. Speed is power, how straight the line is is straight. The top lowers with your finger and the string pays out; a tick for each turn of string.
  - **Wind** (button, Space or Enter): hold and the string winds round the top, one tick per turn, rising in pitch; the bar fills and slips back (ping-pong). Let go to throw. Letting go at the very top of the bar is the best throw (power 1, straight 1); the tap way throws a little less straight (0.8 + 0.2 × power).
- **Physics** (`lib/step.hot.ts`, deterministic, 60 steps a second, no `Math.random`):
  - spin `ω` drains by friction and by wobble; wobble `w` grows faster as `ω` falls (a slower top is less stable) and the lean swings faster too (precession quickens as the top slows);
  - the top falls when `w ≥ 1` (wobble) or `ω ≤ 0.02` (slow) or after 90 s;
  - a nudge at the edge of the lean steadies it (×0.5), mid-swing a little (×0.85), at the centre it knocks it (+0.12). Each touch costs a little spin. Taps closer than 0.22 s count once.
- **Lift:** once `ω < 0.32` the লাটিম can be taken onto the palm for +৫ সেকেন্ড, but only while the wobble is under 0.6. Above that it slips and falls. This is the decision: lift now (safe, ends the run) or keep going for more seconds and risk the fall.
- **Score** is tenths of a second plus the lift bonus. Stars are seconds per level.

## The courtyards: 3 × 4 levels (12; old saved stars stay)
Each level adds exactly one thing. Things on the floor are **seen coming** for 1.1 s: they slide in from the side with a pointer at the screen edge, or scroll down the floor towards the ring. A good or fair nudge in the 0.3 s before one lands braces the top, and the hit counts for a third (সামলেছ).

| # | Place | The one new thing |
|---|---|---|
| **মাটির উঠান** · afternoon, mango tree, hens |||
| 1 | উঠানের মাঝখান | Throw and steady. Nothing on the ground. First win in ~4 s. |
| 2 | শুকনো পাতা | **Leaves** blow in from the side. A small knock each. |
| 3 | নুড়ি পাথর | **Pebbles** roll in. Bigger knocks. |
| 4 | **Finale: মুরগির দৌড়** | A flock of hens dashes through in a line, three knocks in a second, again and again. |
| **পাকা মেঝে** · red-oxide floor, a lamp, evening |||
| 5 | লাল মেঝে | **Slippery:** it spins longer but wobbles faster. |
| 6 | মোছা মেঝে | **Wet patches** scroll in and drag the spin down. |
| 7 | মেঝের ফাটল | **Cracks** that jolt hard. |
| 8 | **Finale: ঝাড়ুর টান** | Grandma's broom sweeps through from alternate sides: one big knock. |
| **টিনের চাল** · morning, tin ridges, kites |||
| 9 | টিনের চাল | **Ridges:** a knock to a steady beat. Learn the beat. |
| 10 | চালে বাতাস | **Wind** pushes the wobble; chevrons at the edge show the push. |
| 11 | ঢালু চাল | **A slope:** the lean favours one side, so the green only shows on the downhill side. |
| 12 | **Finale: কালবৈশাখী** | Ridges, leaves, strong gusts and a rain of leaves in bursts. |

- **Stars:** seconds for 1 (clears), 2 and 3 stars per level in `lib/levels.ts`.
- **Bots (`tests/levels.test.ts`, 60 seeds a level):** casual (timing ±65 ms, skips one window in ten, rarely reads the pointers), steady (±40 ms, reads most), sharp (±22 ms, reads nearly all), a top nobody touches, and a masher (taps every 0.1–0.3 s without looking). All lift after a human pause when it is safe.
  - casual clears level 1 ≥ 97% (it is a 4-second mark), every world-1 level ≥ 90% and every level ≥ 85%;
  - steady clears every level ≥ 95% and sharp ≥ 98%, with 3 stars on ≥ 40% of seeds on every level and a median of ≥ 75% across levels; the last level gives the sharp bot 3 stars about half the time;
  - each finale is harder for casual (3-star rate) than its place's first level;
  - touching at the green beats not touching by ≥ 3 s on every level; an untouched top clears level 1 but ≤ 20% of the finales;
  - the masher never gets 3 stars, trails the steady bot by ≥ 8 s, and clears ≤ 20% from level 9 on (the early marks are short on purpose: a first win in four seconds);
  - easy never reaches a third star; hard stays ≥ 95% clearable for the sharp bot; ধীরে খেলো keeps the 3-star rate within 0.2 (the window shrinks with the speed).

## Difficulty and story
- **Modes (title chips, remembered):**
  - সহজ: "সবুজ দাগ চওড়া, টলমল ধীরে বাড়ে। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। সবুজ মাথায় টোকা দিতে হবে।"
  - কঠিন: "সবুজ দাগ সরু, টলমল তাড়াতাড়ি বাড়ে। তারার হিসাব একই।"
- **Story (first run only, never on a friend's link; tap for the next, hold the corner 0.6 s to skip):**
  1. "ছুটির দুপুর। উঠানে রোদ, হাতে লাটিম।"
  2. "সুতা পেঁচাও, ছোড়ো। ঘুরতে শুরু করবে।"
  3. "টলে গেলে বিন্দুটা সবুজ মাথায় আসার সময় টোকা দাও।"

## Screens
- **Title:** the courtyard dimmed behind; the biggest thing is a code-drawn লাটিম with its string on the wooden board **খেলো** (the whole picture is the button). Under it: place and level, the one new thing, the three mode chips with the chosen line, "সব লেভেল ★ n/৩৬". A friend's challenge sits on top.
- **Level list (a choice screen; play pauses behind it):** three places of four, numbered ১–১২ (keys 1–9, 0, -, =). Each row: name, the one new thing, seconds to clear, stars. The next to play is **এটা খেলো**; finales carry **শেষ খেলা**; locked rows are dim with a lock.
- **HUD (a row above the stage):** top-left the level badge and mode (and the finale's name); top-centre a thin star track with three ★ marks and the time to clear; top-right the seconds, big. In the stage there is only the lean gauge along the bottom edge.
- **The call line under the stage** carries the words (one line); the **pad** under it says what a touch does: **চেপে ধরো, ছেড়ে দাও** before the throw, **টোকা দাও** while it spins, and a separate **হাতে তোলো** button when lifting opens (its label tells you if it is safe).
- **Edges:** the whole stage border warms with the wobble (amber from 0.55, red and pulsing from 0.8); a green-gold rim while lifting is safe; things coming show as a pointer at the edge they come from with the icon; wind shows as chevrons at the edge it blows towards. ধীরে খেলো makes them steady borders.
- **Feel:** the pull answers the same frame (the top drops with the finger); the throw whooshes, the top drops and clacks on the ground with a puff of dust; a good nudge flashes a ring and chimes higher in a streak; a knock shakes a little and ticks; the fall tips over and rattles; the palm rises under it. Every sound has its picture.
- **End screen (the stage stays above):** "লেভেল ৩ পার · নুড়ি পাথর", stars pop with chimes, the seconds count up, then real stats: ছোড়া (জোর/সোজা), ঠিক টোকা n/m, সবচেয়ে টানা, সামলেছ n/m, and in finales the move ("মুরগির দৌড় সামলেছ ৪/৬"). Near-miss line, then numbered choices: ১ পরের লেভেল (**এটাই ভালো**), ২ আবার খেলো, ৩ সব লেভেল. Keys only from a fresh press after the screen appears.
- **Card:** the old card kept (seconds big, stage, milestones), now on the courtyard's own backdrop.

## Motion (Emil's rules)
- Frequent things barely move: the call line is a 140 ms opacity nudge; the pad and buttons press to `scale(.97–.98)` in 120 ms with `cubic-bezier(.23,1,.32,1)`; nothing animates on a key press.
- Occasional things enter once: the level list rises 14 px over 220 ms (`cubic-bezier(.32,.72,0,1)`); the lift button pops from `scale(.95)` in 180 ms; the edge rims fade by opacity (never an animated shadow).
- The end screen has one lead (stars pop and the count-up settle with an ease-out over 0.8 s) and the stat chips follow it with shrinking delays (60 → 175 ms). Numbers are written straight to the node, with no re-render per frame.
- Hover lift only on `(hover:hover) and (pointer:fine)`. ধীরে খেলো drops every pulse, rise and pop; reduced motion keeps quick fades and colour changes only.
- The canvas is allocation-free: dust, pops, the lean dot and the edge pointers are drawn from preallocated typed arrays and cached strings; the backdrop and sprites are pre-rendered once per size.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the hum.** A loop whose pitch follows the spin and flutters with the wobble; it drops as the top slows. Seen as the spot blur and the lean.
2. **The string:** a tick per turn as it winds (pitch rising), a zip as it is thrown. Seen as the turns on the top.
3. **The clack:** the top lands. Seen as the dust.
4. **The nudge:** a chime that climbs with the streak; a plain tap for "চলবে"; a dull knock for a miss. Seen as the ring and the pop text.
5. **The knock:** a tick for a pebble or leaf, a tonk for a ridge, a clatter for hens, a crack for the floor. Seen as the thing arriving.
6. **The fall:** the rattle. The lift: a soft chime.

A four-note tune per place opens each round; the win plays it an octave up with a chime per star (scheduled `tone`s, so a pause cuts them). The hum and wind loops stop on pause, the end, a hidden tab, blur and unmount, and a fresh one starts when sound comes back.

## Comfort and controls
- **ধীরে খেলো:** the top runs at 0.8× and the green window narrows by the same 0.8, so it lasts the same real milliseconds: more time to see, not an easier catch. Stars are by game seconds, so a star takes 1.25× as long on the clock and is no easier. No shake, flashes, dust or particles; steady edge borders; the end numbers show at once.
- **Touch / mouse:** pull on the stage or hold the pad, tap anywhere on the stage or pad to nudge. **Keys:** Space or Enter (hold to wind, release to throw; tap to nudge; fresh presses only), ↑ or H to lift, P opens the player's menu. On the end screen 1–3, Enter and R. The click that brings focus back is never a throw or a nudge.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - links keep `#s=&t=&l=&p=&b=&n=`; new links add `v=2` and `d=e|h`. A link without `v` is from the old nine-level ladder: its level maps to the same place on the new one (`round(l × 12 / 9)`), its score stays the friend's own claim, and it re-serialises in its old form;
  - `ektukhani-levels-latim` is migrated once to the new numbers by the same map; `ektukhani-best-latim-<n>` bests move once into one map; `ektukhani-badges-latim` is kept as is; `ektukhani-unlock-latim` is this game's own unlock, so a friend's far-ahead level records its stars without opening the levels between;
  - the URL, the share id (`latim`), the title, the H1 and the card format.
