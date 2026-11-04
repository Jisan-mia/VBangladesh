# ছিপ ফেলো: rewrite design

## Core
- **Concept:** a bamboo rod, a শোলার ফাতনা and four waters, from নানাবাড়ির পুকুর to a monsoon হাওর. Each water has one fish nobody has landed.
- **Fantasy:** গরমের ছুটি. নানা hands you his ছিপ on the ঘাট and tells you about the old রুই that has lived in the pond for thirty years.
- **Loop:** ফেলো → টানো → গোটাও. Cast to the bubbles, strike when the float goes fully under, then keep the line's tension in the green until the fish reaches the bank.

## The feel
- **Cast:** hold the finger down. A dashed ring travels out across the water along the bubbles' line and comes back (a 1.6 s swing). Let go and the float flies. The ring turns gold over the bubbles and red over a lily pad.
- **The bite you feel:** nibbles twitch the float a little with a faint tick. The real bite pulls the float fully under with a deep "গুপ", a big ring and a short buzz.
- **The reel:** hold to reel in, lift to give line. The tension meter sits on the pond's right edge (green band, red top), and the rod bends with the tension. The pond's border glows red while the line is in the red (a snap is coming) and blue while it lies slack. The fish's shadow swims towards the bank as progress fills the thin line along the bottom edge.
- **Hits:** the strike gives a short hit-stop and a splash. A catch lifts the fish out of the water on the line, swings it, and drops it into the খালুই, with its name and weight popping beside it. A snap whips the line back.

## Fish with personalities (`lib/species.ts`)
Each of the 20 fish (the old album, same ids and order) has one or two traits, named on its album card and on the tag that shows when it is hooked.
| Trait | What it does | The tell |
|---|---|---|
| শান্ত (calm) | a steady pull | none |
| ঠোকরায় (nibbler) | tastes the bait first | the float twitches without going under |
| ঘাই মারে (surger) | runs away hard for 0.75 s | the water boils at its shadow, an amber edge, 0.55 s ahead: lift your finger |
| লাফায় (jumper) | leaps; a tight line snaps | its shadow rises and grows, 0.6 s ahead: give line |
| পিচ্ছিল (slippery) | slips off a slack line in 0.8 s, not 2.5 s | the blue slack edge lights at once |
| ছুটে আসে (rusher) | swims at you, so the line goes slack | its shadow turns, an arrow on the bottom edge: reel hard |
| নরম মুখ (soft mouth) | tears free lower on the meter | the red zone on the meter is bigger |
Heavy fish narrow the green band and take longer to bring in.

## Progression: 4 waters × 4 levels (16 numbers; old stars keep their numbers)
| # | Name | The one new thing |
|---|---|---|
| **World 1: নানাবাড়ির পুকুর** (afternoon, greens) ||
| 1 | প্রথম ছিপ | Cast near the bubbles, strike on the dip, hold to reel. 2 fish; an early tap only gets a word. |
| 2 | ঠোকর | Nibbles before the real dip. |
| 3 | ঘাই | A surging fish (টাকি first): lift when the water boils. |
| 4 | **বুড়ো রুই** (finale) | A named boss with 3 notches of দম; each notch you break makes it surge. |
| **World 2: শাপলার বিল** (golden, lily pads) ||
| 5 | শাপলা পাতা | A cast onto a lily pad snags and costs the bait. |
| 6 | পিচ্ছিল মাছ | বাইম first: never let the line go slack. |
| 7 | লাফ | গজার first: give line before it leaps. |
| 8 | **রাক্ষুসে বোয়াল** (finale) | 3 notches; it leaps and surges. |
| **World 3: নদীর ঘাট** (blue evening, a current) ||
| 9 | স্রোত | The current pulls the line by itself: lift more often. |
| 10 | নরম মুখ | ইলিশ first: the red zone is bigger. |
| 11 | ছুটে আসা | আইড় first: when it rushes, reel hard. |
| 12 | **কুঁজো চিতল** (finale) | 4 notches; it rushes and surges in the current. |
| **World 4: বর্ষার হাওর** (grey teal, rain) ||
| 13 | ঢেউ | Waves rock the float; no "!" marker over the dip any more. |
| 14 | সন্ধ্যা | Dark water: only the float's lit tip and the rings show. |
| 15 | সব একসাথে | Waves, dusk and every kind of fish. |
| 16 | **হাওরের রাজা আইড়** (finale) | 4 notches and every trick. |

- **A level** is "land N fish" with N plus 2 spare baits (টোপ). It ends when N are in the basket (cleared) or the baits run out. A finale's last bite is always its boss. The boss keeps broken notches if it gets away, and it bites again on the next cast.
- **Stars:** no bait lost ৩, one lost ২, more ১. Weight is a stat, a phone record per level, and the friend comparison.
- **Bots** (`tests/levels.test.ts`, 30 seeds a level):
  - a **casual** bot (0.33 s reaction, ±0.07 aim, a fuzzy band, misses 35% of tells) clears level 1 with a median under 10 s, every World 1 level at ≥ 90% and every level at ≥ 60%;
  - a **skilled** bot (0.22 s, ±0.02, reads every tell) clears every level at ≥ 95% and gets 3 stars at ≥ 70%;
  - a **holder** (holds the whole reel) fails from level 3 on, and an idle player never clears a level;
  - on সহজ the casual bot clears every level at ≥ 95%; on কঠিন the skilled bot clears every level at ≥ 85%.

## Difficulty and story
- **Modes** (title chips, remembered as `ektukhani-mode-chhip-felo`):
  - **সহজ:** "ফাতনা বেশিক্ষণ ডোবে, সবুজ ঘর চওড়া, হাতে ৪টা বাড়তি টোপ। তারা বড়জোর ২টা।"
  - **স্বাভাবিক** (default): "হাতে ২টা বাড়তি টোপ। একটাও না হারালে ৩ তারা।"
  - **কঠিন:** "ফাতনা কম সময় ডোবে, সংকেত আসে দেরিতে। হাতে ১টা বাড়তি টোপ।"
- **Story** (first run only, a tap shows the next panel, holding 0.6 s skips all; never on a friend's link; `ektukhani-intro-chhip-felo`):
  1. "গরমের ছুটি। নানাবাড়ির পুকুরঘাট।"
  2. "নানা বাঁশের ছিপটা দিলেন: ‘ফাতনা পুরো ডুবলে তবেই টান।’"
  3. "‘আর এই পুকুরে একটা বুড়ো রুই আছে। কেউ তুলতে পারেনি।’"

## Screens
- **Title:** the world's water drawn big with a giant ফাতনা in its rings and **ছিপ ফেলো** on a bamboo plank: the whole picture is the start button. Under it, small: the world and level with its one new thing, the three mode chips with the chosen one's line, then **সব লেভেল** and **মাছের অ্যালবাম**. A friend's challenge sits on top.
- **Choice screens** (play stops behind them): **সব লেভেল** shows four waters of four, numbered (keys 1–9), each with its one new thing, its stars and a lock shape when closed, and **এটা খেলো** on the recommended one. **মাছের অ্যালবাম** shows 20 fish with their traits and heaviest weights, plus the four bosses.
- **HUD** (a row above the pond):
  - top-left: the level badge and the baits as little hook-and-worm shapes (a lost bait is only an outline);
  - top-centre: one ring per fish to land, or on a finale the boss's name and its notches of দম;
  - top-right: the basket's weight and the count.
  The pond's middle stays clear. Before the first cast, a small card at the top names the level's one new thing.
- **Danger at the edges:** red pulse while the line is in the red; a blue edge while it's slack; amber on the side of a coming surge; an arrow on the bottom edge for a rush. In ধীরে খেলো these are steady borders.
- **Finale:** the boss arrives with a huge shadow and its name tag. Its bar sits top-centre, a notch cracks with a pop, and it lands with confetti and its own line.
- **End** (slides up over the pond): "লেভেল ৪ পার · বুড়ো রুই", stars pop with chimes, the weight counts up, then real stats: fish N/M, the biggest, casts, baits lost, the quickest reel, surges and leaps ridden. A near-miss line, the phone record, then ১ পরের লেভেল (এটাই ভালো) · ২ আবার খেলো · ৩ সব লেভেল (on a loss: ১ আবার খেলো · ২ সহজে খেলো · ৩ সব লেভেল). Keys 1–3, Enter and R work from a fresh press only. **কার্ডটা দেখো ↓** scrolls inside the stage.
- **Card:** the existing water card with the biggest fish held up, now in the world's palette, plus the boss's name when one was landed.

## Sound (`shared/game-sound.ts` only)
1. The swish and the plop: you see the rod whip and the ripple.
2. The nibble tick: you see the float twitch.
3. The deep "গুপ" of the dip: you see the float go under and the big ring.
4. The reel hum loop, whose pitch follows the tension: you see the needle and the rod bend.
5. The tell, a water swirl: you see the boiling ring and the edge.
6. Snap or slip: you see the line whip and the red flash.

**Signature:** the catch, a splash and a bright open chord ("ধরা পড়ল"). **World motif:** four notes at each level start, pitched per water (scheduled tones, so a pause cuts them).

## Comfort and controls
- **ধীরে খেলো:** the whole water runs at 0.65× speed, so only reaction time gets easier (the design accepts that). There's no shake, no hit-stop, and steady edge borders. Stars follow the same rule. Every clock is game time, so turning it on or off mid-cast never loses a fish.
- **Touch and mouse:** press and hold on the pond = aim (let go to cast) or reel (lift to give line); a tap = strike.
- **Keyboard:** hold Space or Enter for the same. Enter or Space on the title starts. 1–3, Enter and R on the end screen (fresh press only), 1–9 in the level list. P opens the player's menu; Escape is the player's.
- The pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Kept for compatibility:**
  - old links `#s=&t=&l=&c=&b=&n=` (levels 1–15) still parse by the old rules (`lib/legacy.ts`) and open the same seed on the same level number. The friend's weight shows as their claim from the old game. New links add `v=2`, `d=e|h` and `k` (baits lost);
  - `ektukhani-levels-chhip-felo` keeps stars by level number. The first visit migrates the old unlock once into `ektukhani-unlock-chhip-felo`; after that, only clearing your furthest open level opens the next, so a friend's far level keeps its stars and opens nothing in between;
  - `ektukhani-album-chhip-felo` (the heaviest of each fish) and the per-level records `ektukhani-best-chhip-felo-l<N>` are kept. Bosses go in `ektukhani-trophies-chhip-felo`;
  - the share id `chhip-felo`, `/chhip-felo`, the title and the H1 stay. The description changes only to say 16 levels and four waters.
