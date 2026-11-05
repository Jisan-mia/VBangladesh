# ভুল কোথায়?: rewrite design

## Core
- **Concept:** the last page of a children's magazine, on a phone: two drawn Bangladeshi scenes that are almost the same, and a red ballpoint to ring what differs.
- **Fantasy:** a slow afternoon with the newspaper's ছোটদের পাতা and a pen, and the small jolt when you see that the cat has turned round.
- **Loop:** মেলাও (compare the two pictures) → চাপো (tap where they differ, on either one) → গোল দাগ (the pen rings it on both, a note climbs).

## Progression
Six worlds of five levels (30, as before). Each level teaches exactly one new thing, shown on its start card as **নতুন: …** with a small drawing of that kind; the fifth of each world is a named finale. Levels are data in `lib/levels.ts` (scene, sky, how many differences, which kinds and how often, the kind it must teach, size bias, movers, dark, colour boldness, star times). Every replay deals fresh pictures from a new seed, so a replay is never a memory test; level 1's first play uses a fixed teaching pair.

| World (ink) | Levels | What arrives | Finale |
|---|---|---|---|
| ১ সকালের বাজার (red) | 1–5 | নেই (3 big things) → রং → কম → five at once | **হাটবার** (6) |
| ২ গ্রামের দুপুর (green) | 6–10 | উল্টো → ছোট → সরে গেছে → six | **নানাবাড়ির উঠান** (7) |
| ৩ নদীর ঘাট (blue) | 11–15 | things move (boats bob, ducks drift, kites and clothes swing) → differences on moving things → স্থির (one side swings, the other is still) → small things | **খেয়াঘাট** (7) |
| ৪ শহরের বিকেল (orange) | 16–20 | বাঁকা (tilted) → লেখা (a signboard word changes: রহিম ফল বিতান → করিম ফল বিতান, ৳৪০ → ৳৬০) → six → small things | **রিকশার জ্যাম** (7) |
| ৫ গোধূলি (violet) | 21–25 | হালকা রং (a shade lighter or darker) → shades on moving things → small → seven | **সন্ধ্যার হাট** (7) |
| ৬ লোডশেডিং (amber on night) | 26–30 | the dark: a হারিকেন's light; tap outside it to carry it, drag it, find inside it → text → shade → moving | **পুরো পাড়া অন্ধকার** (7; the lights come back when you finish) |

- **Fairness, proven in tests:** every change is visible at 320 px (at least 10 units long and 60 square units), mostly not hidden behind other things, sits wholly inside its tap region, and regions never overlap; no stray change anywhere else; regions are at least 48 units (47 px on a phone) and hold a moving thing's whole swing; words never flip or tilt.
- **Bot targets (`tests/levels.test.ts`):** a casual bot (one place at a time, 0.35 s reaction, ±6 aim, a false tap after about every fourth find) wins level 1's teaching pair inside 10 s at least 85 % of the time (median ≤ 7.5 s) and gets ★★★ there ≥ 95 %; on every later level it gets ★★ ≥ 92 % and ★★★ in 30–80 %; a sharp bot gets ★★★ ≥ 75 %; each finale's ★★★ rate is no higher than its world's first level's. The bot reads each difference's `effort` (seconds a casual eye needs, from its kind, size, colour distance, motion and the dark).

## Difficulty and story
- **No difficulty modes.** The ladder is the difficulty, said in the player's words on each start card.
- **No intro panels.** The magazine page is the world. Level 1's first play has a free teaching finger: if nothing is found in 6 s, a soft ring pulses on the plainest difference.

## Screens
- **Title (start card):** a magazine page with the masthead "একটুখানি · ভুল কোথায়?", ‹ level ›, the world and place, the lesson with its kind icon, and the ★★★ target ("০:৩৫-এর মধ্যে, ভুল চাপ বড়জোর ২টা"). The biggest thing is the start itself, drawn as the game's art: the first picture under a magnifier, ringed in red, labelled **খোঁজা শুরু**. The second picture stays hidden until the clock runs. A friend's banner sits here, not above the game.
- **Choice moments (all pause the clock):** সব লেভেল, from the HUD badge or the button: six worlds of five, numbered, with kind icons, stars, locks, finales marked, and **এটা খেলো** on the recommended one. Leaving a started level asks first, before → after ("লেভেল ৩ · সবজির বাজার · ২/৪, ০:১২ → লেভেল ৭, নতুন ছবি"), with ১ **এখানেই থাকো** (default, সুপারিশ) and ২ **ছেড়ে যাও**.
- **HUD (corners):** top-left the level badge (opens সব লেভেল); top-right the clock, the ★★★ track, a meter until the next star drops, "★★★ ০:৩৫ পর্যন্ত · ভুল ০/২", and the friend's time on their link. One row of progress dots under it; each fills with its kind's icon when found. The middle is the two pictures.
- **Feedback:** a find rings both pictures in red ink and floats the thing's name for a second; a miss draws a red ✕ where you tapped, a dashed echo at the same spot on the other picture, and a small shake; the line under the pictures names the find and its kind ("পেয়েছ: ঘুড়ি, উল্টো। আর ৩টা।"). Every tap answers on pointerdown (5–10 ms measured).
- **Danger at the edge:** in the last 10 s before a star drops, both picture frames glow amber (a still border in ধীরে খেলো). The third wrong tap says plainly that ★★★ is gone.
- **The hint teaches:** it says its cost on the button (+১০ সে.). The first press circles the area around the hardest difference left (offset, so it narrows without giving it away) and names its kind ("এই গোলের ভেতরে একটা জিনিস হেলে আছে।"); a second press shows the exact spot. In the dark it carries the lamp to the circle, then to the spot.
- **Finale:** a red **শেষ ছবি** badge, a gold page edge, a named boss bar at the top ("হাটবার" with its dots and a red bar draining as you find them), confetti on the first clear, and a stamp on the card.
- **End screen:** both ringed pictures side by side, small; the stars pop in; the stats count up (সময়, অমিল, ভুল চাপ, টানা সেরা, হিন্ট); "সবচেয়ে দেরি: ঘুড়ি, ১৪ সেকেন্ড"; the place's line, or on a finale's first clear "বাজারের পাঁচ ছবি শেষ। এবার গ্রামের দুপুর: উল্টো, ছোট, সরে যাওয়া।"; the exact near miss; the best on this phone; **পরের লেভেল** (Enter, a fresh press only), আবার খেলো, কার্ড বানাও ↓.
- **Card:** the magazine page with both pictures (no answers ringed, so friends can spot them on the card), the world's ink, stars, the time line, and a finale stamp in the margin.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`, no loops)
1. **Signature:** the pen ringing a find, a quick scratch and a note in the world's key that climbs with each find in a row.
2. Miss: a soft low thud.
3. Hint: a magnifier's glint.
4. Start: a page turn, then the world's three-note call.
5. Finish: a rising run (bigger for ★★★, a record or a finale's first clear), then StarReveal's chimes.
6. The dark: a soft hiss as the lamp moves, and the lights coming back.

All of it is scheduled on the audio clock, so the player's pause cuts it. Every sound has a visible twin (the ring and the name, the ✕ and the shake, the hint circle, the stars, the lights).

## Comfort and controls
- **ধীরে খেলো:** no shake, pulse, pop, draw-on or confetti, no count-up, a still danger border; moving things move at half speed, which the design accepts as a comfort (it can make a moving difference a little easier to see). Star times are unchanged.
- **Touch:** tap either picture where they differ; in the dark, tap outside the light to carry it there, or drag it.
- **Keyboard:** Enter or Space starts; arrows move a cursor on a picture, Tab switches picture, Enter taps; H hints; P opens the player's pause menu; 1 and 2 answer the ask card; Enter on the result needs a fresh press after it shows. Esc belongs to the player.
- **Away:** blur, a hidden tab, the player's menu and every sheet stop the clock, let go of the finger, and cover both pictures (a stopped clock can't be used to study them). Moving things are drawn at the session clock, so they freeze too.
- **Kept for compatibility:**
  - old links (`s` = the level's fixed seed, `t l w`, `h=1`, `n`) still parse and replay the exact old pictures through the frozen old generator (`lib/legacy.ts`, pinned by a hash of every level's differences and drawing), with their old star rule; they share back in the old format. New links add `v=2`, any seed, and `h=<hint steps>`;
  - the old stars in `ektukhani-levels-bhul-kothay` are kept and read once: they open the same levels of the new ladder (`ektukhani-unlock-bhul-kothay`), and new stars go to `ektukhani-levels-bhul-kothay-ladder`. After that, only your own clears open levels; a friend's far-ahead level records stars but opens nothing between;
  - best times: old links keep `ektukhani-best-bhul-kothay-l<N>`; ladder levels use `…-g<N>`;
  - no tally; the URL `/bhul-kothay`, its title, and a reworded H1 and description (the game now has 3–7 differences and more than markets).
