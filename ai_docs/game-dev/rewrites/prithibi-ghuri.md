# পৃথিবী ঘুরি: rewrite design

## Core
- **Concept:** fly a plane from Dhaka over a real map to countries, read each country's postcards (a greeting, a food, a place, an animal, how it is like home), and answer a picture question to get its stamp in the passport.
- **Fantasy:** you are the traveller, and the passport fills with stamps you earned by noticing.
- **Loop (3 verbs):** উড়ো (tap a country, the plane flies the dotted route) → দেখো (turn the postcards) → বেছে নাও (tap the picture you saw; the stamp lands).

## Who it is for
ছোটদের জন্য, ৬–১২ years. The kids' brief wins: no clock, no lives, nothing red, 2–4 pictures, ≥ 96 px targets, nothing a child types, no network, no link to grown-up pages. **No voice anywhere** (site rule: phone text-to-speech reads Bangla badly). A postcard says its fact with a picture first (a speech bubble with the greeting and a waving hand, a big drawing of the food, place or animal with its name, a drawing for how the country is like home); the one line of text under it is for a parent or a younger sibling's reader.

## The look (written before styling)
- **Reference:** a paper airmail envelope (red and blue diagonal stripes) and a passport stamp book: flat fills, one ink outline (`#2b2433`, 1.8 px) in the art, 3 px world-coloured borders and a hard offset shadow under each card, like a stack of cards. No blur shadows.
- **Palette, one per world:** paddy green (`#2f7d3a` on `#eef6e6`) for কাছের এশিয়া, desert ochre (`#b4571c` on `#fbefd9`) for দূর পুব আর মরুভূমি, sea blue (`#1d4f91` on `#eaf1fa`) for সাগরের ওপারে. Green (`#2e9e44`) means "found it" and gold (`#d99a00`) means "look here", and each also differs in shape (a solid ring, a dashed ring). Country stamps keep each country's own ink.
- **Type:** the site's own display face; no new font.
- **Corners:** square-ish (8–12 px) by role; round only what is round (stamps, the passport slots, the speech bubble, the plane window).
- **Glow:** only the hint after two misses (gold, dashed) and the next level in the list.
- **First thing to do:** tap the big envelope (it is the map with the plane crossing it). Icons are SVG drawn in code, never emoji.

## Progression: 3 worlds, 9 levels
Level ids 1–6 keep their old meaning (the six trips, so saved stars stay valid). The three passport checks are new ids 7–9. The list shows them in play order, numbered ১–৯. Each level adds one idea; a passport check mixes its world's ideas and adds *recall*.

| # | id | World (palette) | Level | The one new idea |
|---|---|---|---|---|
| ১ | 1 | **কাছের এশিয়া** (paddy green) | পাশের দেশে: ভারত, নেপাল, ভুটান | Pictures: three postcards a stop (greeting, the thing asked, like); the first question has two pictures and a ghost finger. |
| ২ | 2 | | পুবের পথে: মিয়ানমার, মালয়েশিয়া, সিঙ্গাপুর | Flags: a flag question, and five postcards a stop. |
| ৩ | 7 | | **পাসপোর্ট চেক: ধানের দেশ** | Recall: visit three countries first, then the passport asks about each (asked a different way from the trip: নেপালের জায়গা, মিয়ানমারের প্রাণী, সিঙ্গাপুরের পতাকা). |
| ৪ | 3 | **দূর পুব আর মরুভূমি** (desert ochre) | আরও পুবে: চীন, জাপান, অস্ট্রেলিয়া | Four pictures. |
| ৫ | 4 | | মরুভূমির দেশে: সৌদি আরব, আমিরাত, মিসর | Near mix-ups: the wrong pictures are the other countries on this map, the ones you just visited. |
| ৬ | 8 | | **পাসপোর্ট চেক: বালি আর সাগর** | Recall + four pictures + near mix-ups (অস্ট্রেলিয়ার জায়গা, আমিরাতের প্রাণী, মিসরের খাবার). |
| ৭ | 5 | **সাগরের ওপারে** (sea blue) | আফ্রিকা থেকে ইউরোপ: কেনিয়া, ইতালি, যুক্তরাজ্য | "Who says this hello?": a question that shows a word in a speech bubble; the pictures are countries' flags or animals with their names. |
| ৮ | 6 | | সাগর পেরিয়ে আমেরিকা: কানাডা, যুক্তরাষ্ট্র, ব্রাজিল | Two stamps at every country (six questions). |
| ৯ | 9 | | **পাসপোর্ট চেক: সাগরের ওপারে** | Recall + hello + four pictures (কানাডার খাবার, যুক্তরাজ্যের হ্যালো, ব্রাজিলের প্রাণী). |

Every level's first right answer comes within about 10 s for a child who looks at the pictures (tap a country, a 1.1–1.8 s flight, three postcards, one tap); a flag question only offers flags we can draw exactly.

## Difficulty and story
- **No modes.** The kids' brief says never announce easy mode. The sweet spot is automatic and silent, and it **carries over from one trip to the next**: three questions in a row missed on the first tap take one picture away from the next question; five in a row right add one. Never fewer than 2 or more than 4, and never more than one from the level's own count.
- **A miss is kind:** the picture wobbles and a line says what it really was ("এটা মিসরের ফেনেক শিয়াল। আরেকবার ভাবো।"). After two different wrong taps (one on a two-picture question) the right picture glows with a gold dashed ring. A question takes at most three taps. Nothing red, nothing lost.
- **A right answer lands a stamp** (country's ink, its animal, a soft thud). A ➜ picture button (128 × 104 px) moves on; nothing runs on a timer.
- **Stars** record the trip only: all questions right on the first tap → ৩, two thirds → ২, any finished trip → ১ (six questions allow one slip for ৩). Never spent or compared.
- **Bots (asserted in tests, 1,000 seeds a level):** a *guesser* finishes every level in ≤ 3 taps a question and earns ৩ stars on ≤ 10% of seeds (level ১) or ≤ 6% (the rest); a *six-year-old* who knows it 70% of the time gets ৩ stars on 35–68% and ≥ ২ on ≥ 80%; a *learner* (90%) gets ৩ on ≥ 72% (≥ 88% on the six-question level).
- **No story panels.** A pre-reader can't read them. The envelope on the title, the ghost finger and the flight do the job.

## Screens
- **Title (inside the stage):** the biggest thing is the airmail envelope with the level's map on it and the plane crossing it now and then, and a green উড়াল দাও pill across its bottom. Under it, small: the level chip (opens the list), the passport chip (opens the stamps) and one line. At the foot: বড়দের জন্য (the gate: share the tool's plain address).
- **Map (choice moment):** the map in a rounded plane window with Dhaka and three coloured pins, and three big buttons (≥ 112 px tall, pin colour, flag or animal, name) that match the pins; the pins are tappable too. Numbered 1–3 for the keyboard.
- **Flight:** the dotted route draws itself behind the plane (eased in and out, 1.1–1.8 s), the destination's pin pings and its name appears on landing.
- **Postcards:** the country on top (flag, name, continent, capital), one postcard with a stamp corner, progress dots, and a big ➜. Keys: Enter or Space (a fresh press only).
- **Question:** a dashed "?" stamp (or, for the hello question, the word in a speech bubble), a short line, and 2–4 picture buttons numbered 1–4. The right one lands as a stamp. The country's flag never shows on a flag question, nor its animal on an animal question.
- **HUD (corners):** top-left the level badge, top-right three passport slots that fill with stamps. The middle stays clear.
- **Level list (a choice screen):** three world bands, numbered cards ১–৯, stars, the next one marked এটা খেলো; everything is open. Opened from the pause menu mid-trip it freezes the trip, says "সফর চলছে। ফিরে যাবে?" and ফিরে যাও gives the trip back as it was.
- **Passport:** all 18 countries as stamps; the ones from finished trips are filled.
- **End screen:** the country stamps pop in, then stars with chimes, counts that tick up ("৩টা দেশ · ২টা প্রথমবারেই"), the line "আজ ৩টা দেশ ঘুরলাম", a task off the screen ("এবার আম্মুকে শোনাও, ভুটানে কীভাবে হ্যালো বলে।"), then আবার খেলো and শেষ as two equal 112 px picture buttons, and আব্বু-আম্মুকে দেখাও. A passport check ends with the world's four-note tune and a small confetti; finishing all nine for the first time is a bigger burst.
- **Card (in ShowParent):** the passport page with the trip's stamps, flags and greetings, no name. Saving it is behind the gate. The og image is unchanged (`#og` shows trip ৪, ৩ stars).

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Take-off:** an airy rising whoosh (the plane).
2. **Landing:** a soft low thud and a tiny buzz.
3. **Page:** a paper swish (a postcard turns, a question follows).
4. **Signature, the stamp:** a wooden টুক then two rising marimba notes pitched by world (paddy, desert, sea).
5. **Miss:** a soft low boing, never a buzzer.
6. **Stars and world tune:** the shared chimes as scheduled tones, so the pause cuts them; a four-note tune after a passport check.

## Comfort and controls
- **ধীরে খেলো:** the plane does not move (the route shows, the landing follows after a beat), no wave, no pings, no landing bounce, no wobble, no confetti. Stars unchanged: nothing is timed.
- **Touch:** tap a pin, a button or a picture. It acts on the first finger's pointerdown; a palm or second finger is ignored. ➜ ignores a second tap within 180 ms (a double tap never flips past a card).
- **Keys:** 1–3 pick a country, 1–4 pick a picture, Enter or Space = ➜ and উড়াল দাও (a fresh press only, never a repeat), P pauses through the player. Escape belongs to the player.
- **Away:** the plane is a Web Animation the game holds in the air while the pause menu, a blurred window or a list is over it; resuming flies it on from where it stopped. The first tap back after a blur only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a trip starts and at the tap that answers the last question (the stars are saved in that same tap). `RestScreen` shows on every screen but play. `GamePage kids` has the kids' frame: nothing in the child's view links to grown-up pages.
- **Kept for compatibility:** `ektukhani-levels-prithibi-ghuri` (stars by id; 1–6 unchanged, 7–9 new); `/prithibi-ghuri`, the share id, title, description and H1; `#og`; no network and no link state, as before.
