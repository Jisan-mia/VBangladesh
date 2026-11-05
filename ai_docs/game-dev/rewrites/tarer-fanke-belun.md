# তারের ফাঁকে বেলুন: rewrite design

## Core
- **Concept:** a বেলুনওয়ালা মামা's red balloon gets loose in পুরান ঢাকা and drifts across the city under Dhaka's tangled overhead wires. You keep it alive, one gap at a time.
- **Fantasy:** you are the balloon's breath. The city's wires, its crows and its storms all want it. Every crossing you slip through is a small "আহ্, বাঁচলাম".
- **Loop:** ওঠো → ভাসো → গলে যাও (rise, float, slip through). One finger: hold to rise, let go to sink.

## The balloon (deterministic, floaty, by touch)
- **Hold to rise, let go to sink.** A balloon is all drag: it reaches its speed in about a third of a second (`DRAG = 3`). Holding gives a steady climb (160 u/s at most), letting go a gentle sink (130 u/s at most). The moment a finger lands, the balloon gets a small kick upwards and squashes, so every press answers on the next 16 ms step. A quick tap is a little hop; a long hold is a smooth climb.
- The street scrolls at the level's own steady speed, and the balloon stays at one spot across the screen. The sim runs at a fixed 60 steps a second in world units (360 wide, 520 high), so the same seed and the same presses give the same run on every phone.
- **Edges are wires too:** the mesh of cables over the lane (the top) and the street (the bottom) pop the balloon, so holding or idling never wins.
- **Scrapes:** passing within a hair of a wire squeaks and counts as a ঘষা. Fewer ঘষা means more stars.

## Progression: 3 পাড়া × 4 levels, plus যত দূর পারো (`lib/levels.ts`)
Each world adds one element, each level one new thing, and each world ends with a named finale with a bar at the top centre.

| # | Where | The one new thing |
|---|---|---|
| **World 1: পুরান ঢাকা · বিকেল** (amber haze, the তার) |||
| 1 | লালবাগ · প্রথম ফাঁক | Hold to rise, let go to sink. Four wide gaps at one height. Cleared in about 8 s. |
| 2 | চকবাজার · উঁচু-নিচু | Gaps climb and drop; start moving early. |
| 3 | আরমানিটোলা · জোড়া ফাঁক | Two crossings close together, one high and one low (an S-bend). |
| 4 | **Finale: বংশালের মহাজট** | Six knots back to back. The bar "মহাজট" loses a notch at each knot. |
| **World 2: মিরপুর · সন্ধ্যা** (rose dusk, shop lights, the কাক) |||
| 5 | মিরপুর ১০ · উড়ন্ত কাক | A crow flies in from the right at one height. An edge pointer with a crow shows where, 0.9 s ahead. |
| 6 | পল্লবী · কাকের ঝাঁক | Three crows at once; go through the hole between two. |
| 7 | কাজীপাড়া · ছোঁ মারা কাক | This crow dives at where you are when it launches. Move just before. |
| 8 | **Finale: শেওড়াপাড়ার গোদা কাক** | A big named crow swoops three times. The bar "গোদা কাক" loses a notch at each miss. |
| **World 3: মতিঝিল · ঝড়ের রাত** (navy night, rain, lightning, the হাওয়া) |||
| 9 | দিলকুশা · দমকা হাওয়া | Gusts push up or down. Chevrons at the top or bottom edge warn 0.9 s ahead. |
| 10 | আরামবাগ · দোলা তার | The storm swings the wires; each gap rises and falls. |
| 11 | ফকিরাপুল · সব একসাথে | Crows, gusts and swinging wires together. |
| 12 | **Finale: শাপলা চত্বরে রাতের ঝড়** | Three huge gusts (ঝাপটা), each named on the bar, among swinging wires. |
| ∞ | যত দূর পারো | No end. Gaps tighten; crows from the 8th crossing, gusts from the 16th, swings from the 30th. |

- **Stars:** cleared ★; with no balloon lost ★★; and with at most one scrape per six crossings ★★★. The near-miss line says the exact number.
- **Unlocks:** clearing a level opens the next. A friend's far-ahead level keeps its stars in `ektukhani-ahead-…` and opens nothing in between (same rule as ভো-কাট্টা).
- **Bots (asserted in `tests/levels.test.ts`, 40 seeds a level):** the bots see their own balloon late (a person's eye and thumb), aim a little off the middle, and notice a crow only a reaction time after its pointer.
  - **casual** (0.18 s lag, ±14 aim, misses 30% of crows): level 1 in 8.1 s (median), every World 1 level ≥ 90% (measured 95–100%), every level ≥ 60% (World 2: 63–85%, World 3: 63–85%). Each finale is the hardest of its world.
  - **skilled** (0.1 s lag, ±5 aim, misses 3%): every level ≥ 95% (98–100%), ★★★ ≥ 75% (80–100%).
  - holding all the time and never touching both lose every level; সহজ: casual ≥ 90% everywhere, never ★★★; কঠিন: skilled ≥ 80%.
  - a beam-search solver flies every level without a pop on 4 seeds in সাধারণ, 2 in কঠিন and 1 in সহজ.

## Difficulty and story
- **Modes** (title chips, remembered on the phone; a friend's link plays in the friend's mode):
  - **সহজ:** "ফাঁক বড়, সংকেত আগে, হাতে ৩টা বেলুন। তারা বড়জোর ২টা।" (gaps +26, warnings ×1.4, slower and smaller crows, softer gusts)
  - **সাধারণ** (default): "হাতে ২টা বেলুন। না ফাটিয়ে পার হলে ২ তারা, তারে কম ঘষলে ৩।"
  - **কঠিন:** "ফাঁক সরু, সংকেত দেরিতে, হাতে একটাই বেলুন।"
- A popped balloon with spares left: the street rolls back to just after the last crossing passed, a fresh balloon waits, and the next press sends it on.
- **Story** (first run only, tap for next, hold 0.6 s to skip, never on a friend's link): 1 "লালবাগের গলি। মামার বাঁশে লাল-নীল বেলুন।" 2 "দমকা হাওয়া! লাল বেলুনটা উড়ে গেল।" 3 "চেপে রাখলে ওঠে, ছাড়লে নামে। তারে যেন না লাগে।"

## Screens
- **Title:** the red balloon itself, big, with **ওড়াও** on its rubber, bobbing over the world's lane. Under it: world · level and its one new thing, the three mode chips and the chosen one's promise, then সব লেভেল ★ n/36. A friend's challenge sits on top.
- **Choices (pause, numbered):** সব লেভেল is a sheet over a stopped game: three পাড়া of four, numbered ১–১২ (keys 1–9, 0, -, =), each with its one new thing and its stars; the next unplayed one wears **এটা খেলো**; locked rows show a lock shape; যত দূর পারো sits under them. The end screen's choices are numbered too.
- **HUD (corners):** top-left the level badge and the balloons left (drawn balloons, an empty outline when lost); top-centre one dot per crossing, or the finale's named bar; top-right the crossings count and the ঘষা count. A thin progress line runs along the very top of the lane. The middle stays clear.
- **Danger at the edges:** the lane's border glows orange when the balloon is close to a wire, red along the bottom when it is falling onto the street, and stays tinted on the last balloon. Crows show as edge pointers on the right edge at their height. Gusts light the top edge (it will push down) or the bottom edge (it will push up) with chevrons. In ধীরে খেলো these are steady borders, no pulse.
- **Juice:** a press squashes the balloon and puffs air under the knot; a scrape shivers the wire and throws a rubber spark; a clean crossing rings a note that climbs with the streak; ফটাস is a burst of rubber, a short shake and the string dropping; a crow you miss flaps off with a "কা"; the last crossing lets the balloon float up free over the roofs before the end screen.
- **End screen:** "লেভেল ৪ পার · বংশাল", the stars pop with chimes, the crossings count up, then real stats: time, balloons lost, ঘষা, best clean streak, crows dodged, gusts ridden. A near-miss line. Choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল; on a loss ১ আবার খেলো, ২ সহজে খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R, from a fresh press only. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the level's own lane and light, the balloon slipping through a crossing, the count, the পাড়া, the stars and the stats line.

## Sound (only `shared/game-sound.ts`)
1. **ফুঁ:** a breath of air on each press (the squash and the puff under the knot).
2. **Wire hum loop:** louder and higher as the balloon nears a wire (the orange edge).
3. **Squeak** on a scrape (the shivering wire, the ঘষা count).
4. **ফটাস:** the pop (the burst, the shake).
5. **কা-কা** when a crow is coming (the edge pointer), and a flap when it passes.
6. **Wind loop** in a gust (the edge chevrons, the slanting rain and streaks).
- **Signature:** the বেলুনওয়ালা's squeaky three-note twist, on the title and every cleared level. **World tune:** a four-note motif at each level start, pitched per পাড়া, as scheduled tones so the pause cuts them.

## Comfort and controls
- **ধীরে খেলো:** the whole street runs at 0.7× (the same course, only slower), no shake, no lightning, no rain, still parallax, steady edge borders. Stars keep the same rule: the design accepts that slow mode buys reaction time, and the card and link say it was played slowly.
- **Touch:** hold anywhere on the lane to rise, lift to sink. **Keyboard:** hold Space, ↑ or W. Enter or Space starts from the title; 1–3, Enter and R on the end screen (fresh press only); 1–9, 0, -, = in the level list; P opens the player's pause menu. **Mouse:** hold the button.
- Pause, sound and ধীরে খেলো live in the player's menu; the old in-game toggles (sound, ধীরে খেলো, বড় ফাঁক) are gone. বড় ফাঁক is now সহজ.
- **Kept for compatibility:**
  - Links keep `#s=&t=&n=&b=&d=&l=`. New links add `v=2`, `m=e|h` for a mode, `k` balloons lost, `g` scrapes and `c` tenths of a second; `l=0` is যত দূর পারো. A link without `v` is an old one: it opens the same seed (no `l` → যত দূর পারো, `l=1–10` → that level number; `b=1` → সহজ), and the friend's count shows as their claim from the old game, without a comparison.
  - `ektukhani-levels-tarer-fanke-belun` keeps its stars by level number; the old endless best still migrates once into the first levels' stars, and stays the যত দূর পারো best.
  - New keys: `ektukhani-mode-…`, `ektukhani-intro-…`, `ektukhani-ahead-…`.
  - The share id, `/tarer-fanke-belun`, the title, H1 and tally stay; the description and FAQ say "hold" instead of "tap".
