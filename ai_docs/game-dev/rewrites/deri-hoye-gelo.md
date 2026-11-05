# দেরি হয়ে গেল!: rewrite design

## Core
- **Concept:** a school kid wakes up late and runs side-on along the way to school, from the village lane to the bazaar to a rainy road, to reach the gate before the bell.
- **Fantasy:** every Bangladeshi child who ever ran with a bouncing satchel, the tiffin box rattling and the bell already in their ears. The bell is the enemy. Puddles, cows, signboards and rolling tyres are the obstacles.
- **Loop:** লাফ দাও → মাথা নোয়াও → গেটে পৌঁছাও (jump, duck, arrive). One thumb: a tap jumps (hold it to go higher and longer), and a swipe down or the ↓ pad ducks.

## The run (deterministic, by touch)
- The physics stay the same as the shipped game, so the endless road stays exact. A jump answers on the next 16 ms step (`JUMP_V 620`, `GRAVITY 2000`). Holding past 0.08 s floats it up to 0.2 s longer. A jump pressed 0.15 s before landing still happens. Ducking in the air pulls the kid down 3.2× faster. A quick duck tap stays low for 0.45 s.
- **The bell clock replaces "one bump and it's over".** Every level has a bell time: the time a clean run needs, plus slack from the mode. A bump is a **হোঁচট (stumble)**: the kid trips, stops for 0.45 s and gets up over 0.5 s (about 0.7 s lost), and nothing can hit her for 1.1 s. If the bell rings before the gate, you are late: "দেরি হয়ে গেল!".
- The road is laid by distance from the seed alone, never by the real speed. The clock in ধীরে খেলো runs at 0.7×, so a friend's link gives the same road on every phone.
- **Rolling tyres** (চাকা) move toward the kid in game time. Each one is placed so that it meets the kid where a still thing would, so the gaps stay fair.

## Progression: 3 worlds × 4 levels, plus যত দূর পারো (`lib/levels.ts`)
| # | Place · title | The one new thing |
|---|---|---|
| **World 1: গ্রামের পথ · ভোর** (gold dawn, brick lane, paddy) |||
| 1 | উঠান পার · প্রথম লাফ | Tap to jump over puddles. Gate at 90 m, about 9 s. |
| 2 | পুকুরপাড় · সবজির ঝাঁকা | Taller baskets: jump a little earlier. |
| 3 | বাঁশঝাড় · দড়ির গামছা | Duck under a গামছা on a rope. |
| 4 | **Finale: ধানখেতের আল · গরুর পাল** | Five long sitting cows in a row before the gate. A bar "গরুর পাল" loses a notch at each. |
| **World 2: বাজারের গলি · সকাল** (warm bazaar, shop shutters, rickshaws behind) |||
| 5 | বাজারের মোড় · সাইকেলের সারি | Wide parked bicycles: time the jump, or hold it. |
| 6 | চায়ের দোকান · ঝুলন্ত সাইনবোর্ড | A long hanging signboard: stay ducked longer. |
| 7 | রিকশা স্ট্যান্ড · গড়ানো চাকা | A tyre rolls at you. A wheel pointer at the right edge warns before it enters. |
| 8 | **Finale: কাঁচাবাজার · চাকার মিছিল** | Six tyres back to back. The bar "চাকার মিছিল" loses a notch at each. |
| **World 3: বর্ষার সকাল** (grey-blue rain, wet road) |||
| 9 | খালপাড় · বড় কাদা | Wide mud: jump and hold for the long float. |
| 10 | আমবাগান · ডাল, তারপর কাদা | A low branch straight into mud: duck, then jump. |
| 11 | স্কুলের রাস্তা · সব একসাথে | Everything at once, faster. |
| 12 | **Finale: স্কুলের গেট · গেট বন্ধ হচ্ছে!** | The last 150 m speed up (a sprint) through seven mixed things. The bar "গেট বন্ধ হচ্ছে" counts them down while the দারোয়ান pulls the gate. |
| ∞ | যত দূর পারো | The original endless road, piece for piece. One bump ends the run, and a tiffin box saves one. |

- **Stars (three separate jobs):** ★ for reaching the gate before the bell, ★ for no হোঁচট, ★ for all three খাতার পাতা. The end screen ticks each one. The near-miss line gives the exact number ("আর ১টা পাতা কুড়ালেই ৩ তারা").
- **Unlocks:** clearing a level opens the next. A friend's far-ahead level keeps its stars in `ektukhani-ahead-deri-hoye-gelo` and opens nothing in between.
- **The bell is exact:** the bell is a clean run's time plus the mode's stumbles at about 0.7 s each (0.45 s stopped, then a half-second climb back to speed) plus 0.6 s. `tests/levels.test.ts` proves the promise: with exactly 5 (সহজ), 2 (সাধারণ) or 1 (কঠিন) stumbles the skilled bot still arrives, with 4 more on the last level it is late.
- **Bots (`tests/levels.test.ts`, 40 seeds a level):**
  - **casual** (0.06 s timing error, sees pointers late, misses 4% of things): level 1 wins in under 10 s; World 1 ≥ 90%; every level ≥ 60%; each finale is the hardest in its world.
  - **skilled** (exact timing, goes for every page): ≥ 95% everywhere, ★★★ ≥ 60%.
  - never pressing loses every level in সাধারণ and কঠিন (in সহজ the first level has only a few puddles, and five stumbles are allowed, so even that arrives). সহজ: casual ≥ 95% everywhere. কঠিন: skilled ≥ 90%.
  - The endless road keeps its old fairness tests: a steady thumb passes 1000 m on every seed, full speed and slow.

## Difficulty and story
- **Modes** change only the bell, never the road or the stars. They are title chips, remembered on the phone, and a friend's link plays in the friend's mode.
  - **সহজ:** "ঘণ্টা দেরিতে পড়ে। ৫ বার হোঁচট খেলেও সময়মতো।"
  - **সাধারণ** (default): "২ বার হোঁচট খেলেও সময়মতো পৌঁছাবে।"
  - **কঠিন:** "ঘণ্টা প্রায় পড়ো-পড়ো। একবার হোঁচটের সময় আছে।"
- **Story** (first run only, tap for the next panel, hold 0.6 s to skip, never on a friend's link):
  1. "ঘড়িতে সাতটা চল্লিশ! ঘুম ভাঙল দেরিতে।"
  2. "ব্যাগ কাঁধে, টিফিন হাতে, এক ছুটে বাইরে।"
  3. "চাপ দিলে লাফ, নিচে টানলে মাথা নিচু। ঘণ্টার আগে গেটে!"

## Screens
- **Title:** the biggest thing is a round sun badge with the kid mid-leap over a puddle, the world's lane behind, and **চলো!** on a ribbon. Under it: world · level and its one new thing, the three mode chips and the chosen one's promise, then সব লেভেল ★ n/36. A friend's challenge sits on top with নিজের মতো খেলো.
- **Ready:** the kid at the start line, the level's one new thing in a small card at the top, and "চাপ দাও: রওনা" with the pulsing finger at the bottom. The first press starts the run and the bell clock.
- **Choices (all pause, all numbered):** সব লেভেল is a sheet over a stopped game: three worlds of four, keyed 1–9, 0, -, =, each with its one new thing and its stars. The next unplayed level wears **এটা খেলো**, and locked rows show a lock shape. The end screen's choices are numbered 1–3, and the first is marked এটাই ভালো.
- **HUD (corners):** top-left the level badge and three page icons (filled or outline); top-centre the bell clock (a bell and the seconds left) or the finale's named bar with notches; top-right "গেট ১২০ মি" and the হোঁচট count. A thin line along the top edge fills to the gate. The middle stays clear.
- **Danger at the edges:**
  - running late (the gate can't be reached, counting the road's own speed-up, with 1.2 s spare): the frame glows orange, pulsing, the clock turns red and rings, and it ticks each second. It never lights on a clean run (a test checks every level and mode);
  - a stumble: one red edge pulse;
  - **edge pointers:** a thing arriving within 0.7 s shows a chip at the right edge at its height: ▲ for a ground thing, ▼ for a hanging one, a wheel for a tyre;
  - in ধীরে খেলো these are steady borders and steady chips.
- **Juice:** a press squashes and stretches the kid, with dust at the takeoff and the landing; a puddle hit splashes; a stumble sits the kid in the dust with two stars and gives a short shake; a page flies up to its HUD slot; the finale bar's notch pops; at the gate the kid runs through, the gate swings shut behind her and the bell swings and rings.
- **End screen:** "লেভেল ৪ পার · গরুর পাল", or "দেরি হয়ে গেল!" with what tripped you. The stars pop with chimes, and the metres count up. Then come the three star jobs, ticked or crossed by shape, and real stats: time, seconds to spare, jumps, ducks, things cleared and the best clean streak. Then a near-miss line and the choices: ১ পরের লেভেল (এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. On a loss: ১ আবার খেলো, ২ সহজে খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R work only from a fresh press. "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the world's lane and light, the kid mid-leap over that world's obstacle, the metres, the level and its title, the stars on the road above one line of words and one stats line. `&og=1` on a challenge link opens that friend's finished card for the preview images.

## Sound (only `shared/game-sound.ts`)
1. **Footsteps** each stride on the ground (the running legs).
2. **Hop and land** (the stretch, the dust).
3. **ছপাৎ** for a puddle or mud hit, and a **thud** for anything else (the trip, the red edge).
4. **Page:** a pick note that climbs with each page (the page flies to its slot).
5. **Tick** each second while you're late (the orange edge), and a **whoosh** when a tyre's pointer shows.
- **Signature:** the brass school bell, three bright rings at the gate, or two slow, heavy ones when you're late.
- **World tune:** a four-note motif at each level start, pitched per world, as scheduled tones so the pause cuts them.

## Comfort and controls
- **ধীরে খেলো:** the whole clock runs at 0.7×. That gives the same road and the same bell, only slower. There is no shake, no dust, no rain, no parallax, no bell swing, and the edges and chips stay steady. Stars keep the same rule. The design accepts that slow mode buys reaction time, and the card and link say it was played slowly.
- **Touch:** tap anywhere on the road to jump (hold for higher), swipe down to duck, or use the two big pads at the bottom: ↓ নিচু হও on the left, ↑ লাফ দাও on the right. **Keyboard:** Space, ↑ or W jumps; ↓ or S ducks; P opens the player's pause menu; Enter or Space starts from the title; 1–3, Enter and R work on the end screen (fresh press only); 1–9, 0, -, = work in the level list. **Mouse:** click to jump.
- Pause, sound and ধীরে খেলো live in the player's menu. The old in-game ধীরে খেলো, থামাও and sound toggle are gone.
- **Kept for compatibility:**
  - Links keep `#s=&t=&n=` (the endless road, still compared exactly) and `l=1–6` (an old day, written back in its old form). An old day link opens level 2d−1 with the friend's seed, and their metres show as a claim from the old game, never compared. New links add `v=2`, `l` (0–12), `m=e|h`, `k` হোঁচট, `p` pages, `c` tenths of a second and `d=1` for slow.
  - `ektukhani-levels-deri-hoye-gelo` (the six days) migrates once into the 12-level ladder `ektukhani-levels-deri-hoye-gelo-ladder`: day d opens levels 2d−1 and 2d with its stars. The older endless-best migration still runs first.
  - `ektukhani-best-deri-hoye-gelo` stays the যত দূর পারো best. The new keys are `ektukhani-mode-…`, `ektukhani-intro-…` and `ektukhani-ahead-…`.
  - The share id, `/deri-hoye-gelo`, the title, H1, tally and social image stay the same. The description and FAQ now talk about the bell and the 12 levels.

## Motion (checked against the Emil skills: emil-design-eng, animate, animation-performance, improve-animations)
- **No motion on keyboard or touch input.** A jump or duck answers on the next 16 ms step with no easing in the UI; the pads press instantly (`:active`, no transition). The pads and keys are used hundreds of times a run.
- **Curves:** `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for pops, the intro card and the edge fade (160–240 ms); `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for the end panel (300 ms); the list fades up 8 px in 180 ms. Nothing uses `ease-in`, `transition: all` or `scale(0)`. Hover only on `(hover: hover) and (pointer: fine)`.
- **Only `transform` and `opacity` animate.** The edge glow is a static inset shadow on a pseudo-element whose `opacity` pulses (it used to animate `box-shadow`); the clock's colour tick and the finger's background pulse are gone. The roads are pre-rendered sprites stamped per frame; the top progress line is a `scaleX` written from the loop; the end count-up writes the number's text node from one rAF loop (no React state per frame).
- **Canvas easing:** takeoff stretch and landing squash decay with a squared ease-out (no snap back); the popped word rises on an ease-out; the school gate swings shut on a smoothstep; pages fly on a quadratic ease-out.
- **Reduced motion and ধীরে খেলো:** every CSS animation stops (`prefers-reduced-motion`, `[data-slow]`), the edges stay as steady borders, and the canvas drops shake, dust, drops, rain and parallax.
