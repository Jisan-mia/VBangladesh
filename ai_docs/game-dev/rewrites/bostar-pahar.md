# বস্তার পাহাড়: rewrite design

## Core
- **Concept:** a crane on a river ghat swings rice and jute sacks. You drop each one onto a truck and build a tall load that sways but doesn't fall.
- **Fantasy:** you run the crane at the ghat. The সর্দার counts sacks, the porters cheer, and the launch, the storm or the last ferry won't wait.
- **Loop:** দেখো → চাপো → সামলাও. Watch the swing and the pile's sway, drop the sack over the top one, and keep the load inside the plumb line's limits.

## The physics (pure, in `lib/`, fixed 60 Hz step)
- **Swing:** `x = pivot + amp·sin(2πt/period + phase)`, from `makeRng(seed, sack)`. The drop is straight down and lands after 0.22 s with a gravity ease.
- **Judging at landing:** the gap is measured to the top sack's position at that moment, sway included.
  - Up to 0.12 is **ঠিক মাঝে**: the sack snaps to the top one, the pile straightens by 0.1 and the sway halves.
  - Up to 0.5 the sack sits where it fell.
  - Past 0.5 it slips into the river and costs one spare sack.
- **Sway:** the pile is a damped spring. Its top displacement `sway` obeys `a = −ω²·sway − 2ζω·v`, with ω falling as the pile grows, so a tall pile sways slower and further.
  - An off-centre landing kicks the sway in proportion to the gap, more on a taller pile, and more for a heavy jute sack.
  - Gusts and the pontoon's roll push it too.
- **Tension:** `|lean + sway|`, where lean is the top sack's rest position from the plumb line.
  - Past 65% of the limit, the edge on that side glows and the pile creaks.
  - Past the limit (one sack width, ¾ on the small truck), the pile topples and the round ends.
- **Old links** (no `v`) replay the old rules exactly: no sway, the old ghat's swings, one slip ends the run.

## Progression: 3 worlds × 4 levels, plus খোলা ঘাট
| # | Name | The one new thing | Goal |
|---|---|---|---|
| **World 1: সদরঘাটের বিকেল** (blue sky, cream ghat) |||
| 1 | প্রথম ট্রাক | Watch the swing and press. The pile barely sways. The truck fills in about 7 s. | 4 |
| 2 | দুলুনি | The pile sways after an off-centre drop. Wait for it, or hit ঠিক মাঝে. | 6 |
| 3 | সরে থামা ট্রলি | The trolley stops off-centre, so the swing's middle isn't over the pile. | 7 |
| 4 | **Finale: সন্ধ্যার লঞ্চ** | The launch leaves at the horn. Fill 8 sacks before its bar runs out. | 8 |
| **World 2: মেঘনার হাওয়া** (orange dusk) |||
| 5 | পাটের বস্তা | Heavy jute sacks shake the pile more when they land. | 8 |
| 6 | দমকা হাওয়া | Gusts shove the pile. An edge arrow warns 1 s before. | 9 |
| 7 | চলন্ত ট্রলি | The trolley keeps rolling while the sack swings. | 9 |
| 8 | **Finale: কালবৈশাখী** | The storm builds: every sack makes the gusts stronger. | 10 |
| **World 3: রাতের ফেরিঘাট** (navy night, lamps) |||
| 9 | লোডশেডিং | The lights cut out now and then. Only the hook's lantern shows the swing. | 9 |
| 10 | পন্টুন | The truck stands on a pontoon that rolls with the waves. | 10 |
| 11 | ছোট ট্রাক | A small truck: the lean limit is ¾ of a sack. | 10 |
| 12 | **Finale: শেষ খেপ** | The last ferry at midnight. Pontoon, gusts and load-shedding together, with the horn's bar. | 12 |

- **খোলা ঘাট** is the endless mode, with the old game's rising swing and the new sway. It has no goal and keeps this phone's best.
- **Stars:** ★ means the truck is full. ★★ and ★★★ come from the ঠিক মাঝে count, with two numbers per level, shown on the title and the end screen.
- **Spare sacks:** সহজ gives 5, সাধারণ 3, কঠিন 2. A slip costs one, and losing the last ends the round. A topple ends it at once.

## Difficulty and story
- **Modes (title chips, remembered on the phone):**
  - সহজ: "ধীরে দোলে, পাহাড় কম দোলে আর কম হেলে পড়ে। ৫টা বাড়তি বস্তা, তারা বড়জোর ২টা।" The lean limit is 15% wider.
  - সাধারণ (default): "আসল খেলা। ৩টা বাড়তি বস্তা।"
  - কঠিন: "জোরে দোলে, পাহাড় বেশি দোলে, বাড়তি বস্তা ২টা।"
- **Bots (`tests/bot.ts`, asserted in `tests/levels.test.ts` over many seeds):**
  - **casual:** 45 ms timing spread, aims at where the top is now and ignores the sway, and waits for the sway only a little;
  - **skilled:** 22 ms spread, predicts the sway at landing, and waits when the tension is high.
  - **Targets (asserted over 120 seeds):**
    - the casual bot clears level 1 on ≥ 97% of seeds, in ≤ 10 s on the median seed;
    - on every level, the skilled bot clears ≥ 90% with ★★★ on ≥ 75%, and the casual bot clears ≥ 50% with ★★+ on ≥ 35%;
    - each finale is the hardest level of its world for the casual bot, and the last finale is harder than the first;
    - সহজ: the casual bot clears ≥ 75% of every level, never with ★★★;
    - কঠিন: the skilled bot clears ≥ 70% of every level.
  - **Measured (200 seeds, casual clear rate):** world 1 is 100 → 100 → 99 → 93%, world 2 is 94 → 87 → 84 → 82%, and world 3 is 87 → 86 → 67 → 54%. The skilled bot clears 96–100% of every level. The casual median for level 1 is 8.2 s.
- **Story (first run only, hold to skip, never on a friend's link):**
  1. "বিকেলের সদরঘাট। সন্ধ্যায় লঞ্চ ছাড়বে।"
  2. "সর্দার: ‘ট্রাকটা ভরে দাও। একটা বস্তাও যেন নদীতে না পড়ে!’"
  3. "বস্তা দুলছে। নিচের বস্তার ঠিক ওপরে এলেই চাপো।"

  A tap shows the next panel, and holding the corner button for 0.6 s skips all three. It is remembered in `ektukhani-intro-bostar-pahar`.

## Screens
- **Title:** the biggest thing is a sack hanging from the crane hook, drawn in code, with **খেলো** printed on it, swaying gently. Tap it to start. Under it:
  - the world and level line, with the level's one new thing and its star target ("★★★ ৪টা ঠিক মাঝে");
  - the three mode chips, with the chosen one's line;
  - সব লেভেল ★ n/৩৬ and খোলা ঘাট (with this phone's best).

  A friend's challenge sits on top.
- **Level list (a choice screen, nothing runs):**
  - three worlds of four, numbered ১–১২ (keys 1–9 work), plus খোলা ঘাট;
  - each row has its name, its one new thing and its stars, and finales are marked শেষ ধাপ;
  - the next unplayed level is marked এটা খেলো;
  - locked rows are dim and carry a lock shape.
- **HUD (a row above the scene, corners only):**
  - top-left: the level badge, plus the mode if it isn't সাধারণ;
  - top-centre, finale only: its name with the launch or storm bar, the boss bar;
  - top-right: the load "৫/৮" and the spare sacks as small sack icons. A "ঠিক মাঝে ×৩" chip pops beside the load.
  - A thin load line runs along the scene's top edge.
  - The shout ("ঠিক মাঝে!") rises from the top sack and fades within 0.9 s.
- **Danger at the edges:** when the tension passes 65% of the limit, the scene's edge on that side glows amber and pulses faster as it nears the limit. The pile wobbles and the dashed limit line turns red. A gust lights its edge with an arrow and "হাওয়া". In slow mode these are steady borders with no pulse.
- **Finales:** the boss bar is named in the HUD, never as a banner over the play area. Clearing one plays the world's horn, and the truck drives off.
- **End screen:**
  - the kicker ("লেভেল ৪ পার · সন্ধ্যার লঞ্চ", or "পাহাড় ভেঙে পড়ল");
  - the stars pop in with chimes;
  - the load counts up over 0.8 s (instant in slow mode);
  - real stats: ঠিক মাঝে, the longest run of them, sacks lost, seconds;
  - the near-miss line ("আর ১টা ঠিক মাঝে হলে ৩ তারা");
  - numbered choices: ১ পরের লেভেল (marked এটাই ভালো), ২ আবার খেলো, ৩ সব লেভেল. Keys 1–3, Enter and R work, but only from a fresh keydown after the screen appears.
  - "কার্ডটা দেখো ↓" scrolls inside the stage.
- **Card:** the truck-art signboard card as before, with this run's pile. It now names the level ("লেভেল ৪ · সন্ধ্যার লঞ্চ") and its stars, or খোলা ঘাট.

## Sound (only `shared/game-sound.ts`)
1. **Release:** a short rope swish. You see the hook spring up.
2. **Thump:** a low thud with burlap hiss. You see the squash and the dust.
3. **ঠিক মাঝে chime:** climbs one note per sack in a row. You see the shout, the ×n chip and a gold ring.
4. **Creak:** a wooden groan when tension crosses the danger line. You see the edge glow and the wobble.
5. **Splash / crash:** a slipped sack splashes in the river; a topple is a rumble of thuds. You see the sack fall and a spare icon pop off, or the pile fall.
6. **Wind loop** on gust levels, with a whoosh for each gust. You see the edge arrow and the wind lines.

**Signature:** the launch horn ("ভোঁ"), two low notes at every level clear, pitched per world. Scheduled tones only, so the pause cuts them. Each world opens with a 4-note motif.

## Comfort and controls
- **ধীরে খেলো:**
  - the simulation runs at 0.75× (swing, sway, gusts, roll, the finale's bar);
  - the ঠিক মাঝে window shrinks to the same milliseconds, so stars aren't easier;
  - filling the truck is a little easier, and the design accepts that;
  - no shake, squash, dust, parallax or pulsing glow.
- **Touch:** tap anywhere on the scene. It acts on pointerdown.
- **Keys:** Space, Enter or ↓ drops (never on auto-repeat). P opens the player's pause. On the title, Enter or Space starts. On the end screen, 1–3, Enter and R, from a fresh press only. Keys 1–9 work on the level list.
- **Away:**
  - blur, hide and the menu release the key, and stop the clock, the swing and the loops;
  - after চালিয়ে যাও, the first 250 ms of taps are ignored;
  - star chimes and the horn are scheduled tones, cut on pause, restart and unmount.
- **Kept for compatibility:**
  - links `#s=&t=&p=&c=&l=&n=`. Links without `v` replay the old rules exactly: the old ghat's swings, no sway, one slip ends the run. They are compared and carded, never recorded as stars.
  - New links add `v=2`, `d=e|h` for a mode, and `k=1` for খোলা ঘাট.
  - `ektukhani-levels-bostar-pahar` stars keep their level numbers, so what was open stays open. The old best still moves into level 1's stars once (`migrateBest`).
  - A friend's far level that you clear records its stars in `ektukhani-ahead-bostar-pahar` and doesn't open the levels in between.
  - খোলা ঘাট keeps its best in `ektukhani-best-bostar-pahar-khola`.
  - The tally id, `/bostar-pahar`, the title, the description and the H1 stay.
