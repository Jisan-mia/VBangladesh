# পাটি বুনি: rewrite design

## Core
- **Concept:** a শীতলপাটি frame on the উঠান. Cane strips come down one at a time. Set them into the gaps, and every full row weaves itself, blooms a নকশা and rolls away.
- **Fantasy:** sitting beside নানু on the দাওয়া, getting the frame for the first time. You start on a half-woven mat, then mend an old one, then weave the big নকশা by হারিকেন light.
- **Loop:** *সরাও* the strip → *ঘোরাও* it to fit → *বসাও* it (drop). Full rows weave and bloom. Every level is seeded, so a friend gets the same strips in the same order.

## Progression: 3 worlds × 4 পাটি, plus খোলা পাটি (`lib/levels.ts`)
Each পাটি has a row goal and teaches exactly one new thing, named on its title ("নতুন: …"). Each world ends with a **named নকশা**: its rows bloom that motif, and a named bar sits at the top.

| # | পাটি | Goal | The one new thing |
|---|---|---|---|
| **World 1: উঠানের পাটি** (afternoon sun, natural cane on a লেপা floor; motif: বরফি) ||||
| 1 | প্রথম সারি | ৩ সারি | Move and drop. The frame is half woven. Three strips each finish a row, so you can win in 10 s. |
| 2 | ঘোরাও | ৫ সারি | Turning. The first gap is upright, so the strip must stand. |
| 3 | লম্বা ফালি | ৮ সারি | The 4-long strip, and several rows at once (২ সারি = ২৫, ৩ = ৪৫, ৪ = ৭০). |
| 4 | **বরফি নকশা** (finale) | ১২ সারি | All six strips, and the fall quickens as the mat grows. Rows bloom বরফি diamonds. |
| **World 2: পুরোনো পাটি** (dusk, মেহেদি and খয়েরি; motif: লতাপাতা) ||||
| 5 | পুরোনো সারি | ৬ সারি | An old, torn mat fills the bottom of the frame. Mend its holes first. |
| 6 | ঠেলে ওঠা সারি | ১০ সারি | Every 8 strips an old row pushes up from below. A count by the frame's foot says when. |
| 7 | ভেজা বেত | ১০ সারি | Wet strips (drops on them) don't turn. Place them as they come. |
| 8 | **লতাপাতা** (finale) | ১৪ সারি | Old rows, rising rows and wet cane together. Rows bloom লতাপাতা. |
| **World 3: চাঁদনি রাত** (indigo night, হারিকেন glow; motif: শাপলা) ||||
| 9 | সোনালি বেত | ১০ সারি | Golden strips: a row they finish pays double. |
| 10 | সুই | ১২ সারি | Every 9 strips comes a সুই. It slips down through the weave into the deepest hole of its column. |
| 11 | ডালা ফালি | ১২ সারি | The 5-cell ডালা strip, with a hollow to fill later. |
| 12 | **শাপলা নকশা** (finale) | ১৬ সারি | Everything at night speed. Rows bloom শাপলা. |
| ∞ | খোলা পাটি | none | The original endless game, bit for bit: the speed rises every 10 rows, with the named mats on the way (ছোট আসন … উঠানজোড়া পাটি). Always open, and old links open it. |

- **Stars:** reach the row goal for ★. Points decide ★★ and ★★★, so weaving several rows at once and gold rows earn them. The HUD lights each star's pip as the points pass it.
- **Unlocks:** your own unlock (`ektukhani-unlock-pati-buni`) rises only when you clear the furthest open পাটি. A friend's far-ahead পাটি records its stars but opens nothing in between.
- **Bot targets (`tests/levels.test.ts`, 24 fixed seeds per পাটি; measured on 40):** three headless thumbs play the real `tick()`. A **casual** one acts every 0.34 s, picks a worse spot 30% of the time, lands a column off 10% of the time and never drops straight. A **careful** one acts every 0.2 s and takes the best spot. A **planner** keeps a well open for several rows at once.
  - Casual on স্বাভাবিক: পাটি 1–3 100/100/95%; world 2–3 non-finales 78–100%; finales বরফি 85%, লতাপাতা 50%, শাপলা 53%. Asserted: world 1 ≥ 90%, later ≥ 65%, finales 35–97%.
  - সহজ really is easier: the finales go to 100/65/72% on সহজ and 70/30/23% on কঠিন. Asserted as সহজ ≥ স্বাভাবিক ≥ কঠিন, and কঠিন ≥ 15%.
  - Careful on কঠিন clears every পাটি (97–100%). Asserted ≥ 90%.
  - Stars: পাটি 1 is ★★★ for everyone. The planner averages ★★ (1.3–2.3), and the casual thumb ★ (0.65–1.3). ★★★ needs several multi-row weaves. Asserted: planner 1.1–3.

## Difficulty and story
- **গোটানো (title chips, remembered):** when the frame fills, the bottom four rows roll up and play goes on. The strips never change, so a friend's link is the same পাটি on every mode.
  - **সহজ:** "৩ বার গোটানো যাবে। ফ্রেম ভরলেও খেলা চলে।"
  - **স্বাভাবিক (default):** "১ বার গোটানো যাবে। দ্বিতীয়বার ভরলে শেষ।"
  - **কঠিন:** "গোটানো নেই। ফ্রেম ভরলেই শেষ।"
  Rolled rows score nothing, so সহজ makes finishing easier, not ★★★.
- **Story (first run of পাটি 1 only, tap for the next line, hold 0.6 s to skip):** three lines over the frame:
  1. "বিকেলের উঠান। নানু মুর্তা বেত চিরে ফালি করেছেন।"
  2. "আজ ফ্রেমটা তোমার হাতে।"
  3. "ফালি ফাঁকে বসাও। সারি ভরলেই বোনা।"
  It never shows on a friend's link or on আবার খেলো (`ektukhani-intro-pati-buni`).

## Screens
- **Title:** the frame waits behind, dimmed. The biggest thing is a code-drawn rolled শীতলপাটি, tied with twine, labelled **বোনা শুরু**. Under it, small: ‹ পাটি N · name ›, the "নতুন: …" line, the three গোটানো chips with the chosen one's line, the star targets, and **সব পাটি**.
- **Choice moment, সব পাটি:** a sheet that pauses play: three worlds of four, numbered ১–১২ (keys 1–9, 0, -, =), plus খোলা পাটি (key O). Each row shows its name, its one new thing and its stars. Locked rows show a lock. The recommended one wears **এটা খেলো**. The HUD's badge opens it.
- **HUD (corners only, above the frame):** top-left the পাটি badge with "৭/১২ সারি" (it opens সব পাটি); top-right the points with three star pips, the গোটানো left as little rolls, and the next strip as a tied bundle under "এরপর". A thin line along the top edge fills with rows woven. In a finale it becomes a thicker red named bar, and the badge turns red with the নকশা's name.
- **Aim without a shadow piece:** the warp threads under the falling strip glow down to the stack, so you see its columns.
- **Danger at the edge:** once the stack is 10 rows high the frame's edge glows orange, and at 12 it pulses red, with a soft heartbeat. ধীরে খেলো shows a steady border. When the rows rise, the frame's foot shows the count, and the bottom bamboo glows one strip ahead.
- **Bloom:** a full row threads its weft, then each cell opens a motif (the world's বরফি, লতা or শাপলা), gold for a gold row, and cane chips fly up. Then the row rolls away. Several rows at once bloom bigger, and the "+৪৫" rises with "তিন সারি একসাথে".
- **End screen:** over the dimmed frame, the heading ("ঘোরাও বোনা হলো" / "বরফি নকশা পুরো হলো" / "ফ্রেম ভরে গেল"), the stars one by one, then the stats counting up: সারি N/M, পয়েন্ট, একসাথে সেরা, ফালি. Then the exact near-miss line ("আর ২০ পয়েন্ট হলেই ★★" / "আর ২ সারি বাকি ছিল"), and পরের পাটি / আবার খেলো. Their keys need a fresh press 0.7 s after the screen appears. **কার্ড বানাও ↓** scrolls the stage to the card.
- **Card:** the existing woven-mat card, with the পাটি's name and stars added.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
1. **Signature:** a bamboo knock and a dry সরসর, then the world's three-note call (scheduled with `tone`'s delay, so a pause cuts it).
2. Move: a light tap of cane, or a dull knock at a wall. Turn: a short creak. A wet strip that won't turn: a damp thud.
3. Drop: a soft thump. Lock: a dry rustle.
4. Weave: one সরসর swish per row, rising with the count. A gold row adds a chime, and a streak of weaving strips climbs the scale.
5. A row rising: a low rumble. The সুই: a high "টিং". Rolling up: a long whoosh.
6. Danger: a soft heartbeat tick every 0.8 s while the stack is high (a `tone`, not a loop).

There are no sound loops. Every sound has a visible twin: the strip moving, the knock's shake, the bloom, the "+N", the rising row, the edge glow.

## Comfort and controls
- **ধীরে খেলো:** the fall is 1.6× slower (never under 520 ms a row), and the lock wait and the weave run longer. There's no shake, no frame bump, no chips and no pulse; the danger edge is a steady border. Star targets stay the same. A slower fall does make ★★★ a little easier, and the design accepts that, the same as before the rewrite.
- **Touch:**
  - the four big buttons under the frame: ◀ and ▶ (hold to slide), ঘোরাও, and নামাও (tap to drop straight, hold to fall fast);
  - on the frame itself: drag sideways to slide the strip column by column, tap to turn, flick down to drop.
  - All act on touch-down. In পাটি 1 and 2 the button you need next glows.
- **Keys:** ← → or A D slide (our own repeat: 150 ms, then every 45 ms). ↑, W or X turns, ↓ or S falls fast, and Space drops. Enter starts and takes the end screen's main choice (fresh press only). P opens the player's menu (`requestPause`). 1–9, 0, -, = and O work in সব পাটি. Escape belongs to the player. Game keys are ignored while paused and released on blur.
- **Away:** blur, a hidden tab, the frame scrolled off, or any choice screen stops the fall and lets go of every key and finger. After a resume the frame waits half a second, and the first tap only resumes. Celebration timers are cleared on every new run, choice and unmount.
- **Kept for compatibility:**
  - old links `s t r p n` open খোলা পাটি with the same seed and replay the same strips in the same order (the endless rules are kept exactly, and a test pins them against the old code). New links add `l=1..12`;
  - `ektukhani-best-pati-buni` stays as খোলা পাটি's best. It migrates once into your own unlock: any old best opens পাটি 2, and a best of 150 or more opens all of world 1;
  - the share id `pati-buni` (no tally);
  - `/pati-buni`, its title, description and H1.
