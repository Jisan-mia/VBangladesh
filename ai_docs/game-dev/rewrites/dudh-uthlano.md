# দুধ উথলানোর আগে: rewrite design

## Core
- **Concept:** milk is heating on the stove and the foam climbs. Take the pot off just before it boils over. The closer to the rim, the more points; over the rim is zero.
- **Fantasy:** আম্মু has gone to the next room ("দুধটা দেখিস!"). You hold the kitchen. The gas hisses, a bubble pops, the bell rings, and the foam keeps climbing.
- **Loop:** দেখো → ধরো → নামাও. Watch the foam, hold to heat, let go (or tap again) the moment before the rim.

## The look (decided before styling)
- **Reference:** a real Bangladeshi kitchen, three times of day. A mint-tiled flat with a glass-top gas stove and a steel ডেকচি (morning); a mud kitchen with a মাটির হাঁড়ি on a clay stove, painted potter's rings and a string of chillies (dusk); the same flat in a load-shedding night, lit only by the burner.
- **Palette per world, from the objects:** morning mint wall #dcefe8, steel greys and a brown counter; dusk clay #e3b47f, terracotta pot #b8552e and fire orange; night navy #2c3b5e with the flame blue. The game's one accent is the pot-handle red-brown #b6462b, which colours every button; only danger turns red (#e5383b) and the warning amber (#f08a00).
- **Type:** the site's own Display face for numbers and names, and Bangla for text. No serif, no new font.
- **Shape:** corners are small (6–10 px); only the bubbles, the pot and the dots are round. Glow appears only as the danger edge and the night's pool of light round the burner. Icons are drawn in SVG or canvas, never emoji.
- **First thing the player does:** tap the pot. The pot is the start button, the hold button is the biggest control on the play screen.

## The readable tell
One rule carries every level: **the foam against the rim.** It has four layers, so colour is never the only cue:
1. the foam itself, and the % gauge beside the pot (a bar and a number);
2. the bubbles: bigger and faster as the foam climbs, a mound at the middle past 50%;
3. steam and the stove's hum, both swelling;
4. the **screen edge**: an orange border from 80%, a red pulsing one from 92% (a steady border in slow mode).

Every later element is a twist on that rule and has its own tell, shown before it matters.

## Progression: 3 kitchens-worlds × 4 levels (12 levels)
Each level adds exactly one thing. The 4th level of each world is its named finale: the last pot is the **boss pot** (counts double, a red bar with its name at the top centre).

| # | Level | The one new thing (and its tell) | Pots |
|---|---|---|---|
| **আম্মুর রান্নাঘর** (mint tiles, gas, morning) ||||
| 1 | প্রথম পাতিল | Hold, let go before the rim. Slow, calm foam. Won in about 10 s. | 2 |
| 2 | ফেনার ঢেউ | The foam ripples up and down. Judge where it is when you let go. Tell: bubbles. | 3 |
| 3 | কলিং বেল | The doorbell rings mid-boil (a bell icon at the corner). It is only a distraction. | 4 |
| 4 | **Finale: আম্মুর বড় ডেকচি** | The second boil: the foam peaks, collapses, then climbs again, faster. Tell: a heave, a pop, a puff of steam. | 4 |
| **নানুবাড়ি** (terracotta, clay stove, dusk) ||||
| 5 | কাঠের আঁচ | The fire breathes: the foam speeds up and slows with the flame's height. | 3 |
| 6 | ঢাকনা | A lid hides the foam. It rattles harder and lifts as the foam climbs; the % is hidden. | 4 |
| 7 | দমকা আঁচ | The flame leaps (with a hiss, 0.6 s before) and the foam surges for 1.5 s. | 4 |
| 8 | **Finale: নানির মাটির হাঁড়ি** | The boss pot has lid, fire and a surge together. | 5 |
| **মেজবানের রাত** (navy night, gas, big dekchi) ||||
| 9 | লোডশেডিং | The lights go. The stove's glow is the only light; the gauge stays lit. | 3 |
| 10 | বুদবুদ ফাটা | A big bubble swells, bursts, and the foam drops 10–16%. Don't lift thinking it is the top. | 4 |
| 11 | ছোট পাতিল | Some pots hold little milk (a small পাতিল) and climb in about 2.8 s. | 4 |
| 12 | **Finale: মেজবানের ডেকচি** | The boss dekchi in the dark: second boil and bursting bubbles. | 5 |

Elements stack inside a world and reset at the next. A world's first level introduces its world.

## Scoring and stars
- A pot scores the foam's % of the rim when lifted (0–99); a spill is 0. The level's score is the average, the boss pot counted twice.
- ★ at 60%, ★★ at 80%, ★★★ at 92%. Under 60% is "এবার হলো না" and nothing is recorded.
- Next level opens on ★. Friend links never open the levels in between (`ahead`).

## Difficulty, comfort and story
- **Modes (title chips, remembered):**
  - সহজ: "ফেনা ধীরে ওঠে। তারা বড়জোর ২টা।" (clock ×0.8)
  - সাধারণ: "আসল রান্নাঘর।" (default)
  - কঠিন: "ফেনা তাড়াতাড়ি ওঠে, ঢেউ বেশি।" (clock ×1.15, ripples ×1.2)
- **ধীরে খেলো** (the player's menu): the clock runs at 0.6, ripples halve, no shake, no pulse. It is easier, so **stars cap at 2**, like সহজ, and the card says so. It never earns 3.
- **Story** (first run only, hold to skip, never on a friend's link):
  1. "সকালের রান্নাঘর। আম্মু চুলায় দুধ বসিয়ে বললেন, ‘দুধটা দেখিস!’"
  2. "ফেনা উঠছে। উথলে পড়লে চুলা ভেসে যাবে।"
  3. "চেপে ধরো। কিনারার ঠিক আগে ছেড়ে দাও।"

## Screens
- **Title:** the biggest thing is the pot itself on the stove (drawn in code, steaming, খেলো on its belly). Tap it to start. Under it: the world and level line with its one new thing, the three mode chips with the chosen one's line, সব লেভেল ★ n/৩৬. A friend's challenge sits on top.
- **Level list (pauses, numbered 1–9 keys, 12 rows):** name, the one new thing, stars; finales marked শেষ ধাপ; the next unplayed marked এটা খেলো; locked rows carry a lock shape.
- **HUD (corners only):** top-left the level badge (and mode); top-centre only on a finale, the boss bar with its name and the pot's red foam bar; top-right the pot dots (n of N) and a bell when one rings. The top-left 50 px stays empty in immersive mode.
- **Danger:** the edge glow above. A flare lights the stove's edge; a lid rattles. Slow mode: steady borders.
- **Controls:** hold the big button (or anywhere on the stove, or Space/Enter) to heat; let go to lift. A short tap lights and the next tap lifts (no setting).
- **End screen:** kicker, stars popping with chimes, the average counting up over 0.8 s (instant in slow mode), real stats (best pot, closest to the rim, spilled, the pots strip), the near-miss ("আর ৪% হলে ৩ তারা"), numbered choices ১ পরের লেভেল (এটাই ভালো) · ২ আবার খেলো · ৩ সব লেভেল. Keys only from a fresh keydown. "কার্ডটা দেখো ↓".
- **Card:** the tiled kitchen with the average, the big pot, the pots on the counter with their marks, the level name. A friend's old-kitchen link still draws.

## Motion
- The press: the button scales to 0.97 in 120 ms (strong ease-out) and its lip changes at once; the lift answers in the same event, the next frame shows it.
- The danger edge is an overlay that changes only `opacity` (160 ms in, a 0.35 s pulse in the last 8%; steady in slow mode). The boss bar and the count-up write a `transform` and a text node, never React state per frame.
- Entrances (list, end screen, voice, score) are 200–220 ms ease-out from 6–10 px or scale 0.92; nothing starts from scale 0. Hold-to-skip fills in 600 ms linear and snaps back in 160 ms. The spill shake is 220 ms and skipped for reduced motion and slow mode.
- The canvas draws cached sprites; the night is one cached overlay; no blur, no shadowBlur.

## Sound
`shared/game-sound.ts` only. Signature: **the doorbell**. Ignite (gas catches), a bubble blip that rises in pitch and rate with the foam, a ticking alarm above 90% (also shown by the edge), the pot set down, the boil-over sizzle, the flare's ফোঁস, the lid's rattle, the burst-bubble pop. One loop: the stove hum, swelling with the foam, restored on sound-on and on resume. World tune: three notes at the clear, pitched per world. Every loop stops on pause, the end, hide and unmount.

## Compatibility
- Old challenge links (no `v`) replay the old kitchen's pots draw for draw (`lib/legacy.ts`); the friend plays that kitchen by the new rules and no stars are recorded.
- New links carry `v=2&l=<1..12>`, `m=e|h` when not সাধারণ, `d=1` for slow (as before), `p` the pot marks. Total is recomputed (boss twice) and checked.
- Saved progress: the old per-kitchen stars become one star each up to the old furthest kitchen, once (`ektukhani-v-dudh-uthlano`). The original best-average key still migrates first.
- Tally ids, SEO URL, `/api/share` state unchanged.
