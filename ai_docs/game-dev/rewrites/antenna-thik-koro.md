# অ্যান্টেনা ঠিক করো: rewrite design

## Core
- **Concept:** the 90s rooftop chore. You turn the antenna on the bamboo pole, and the snowy TV downstairs clears into a picture.
- **Fantasy:** you are the kid on the roof on a holiday afternoon. Someone downstairs shouts "আরেকটু ডানে…", and the whole family is waiting for the programme.
- **Loop:** turn → listen → hold. Turn until the snow thins, follow the shout, and hold still until the picture locks. The score is the total seconds for the evening's channels.

## Progression: 3 worlds × 4 levels (the 12 level numbers and the saved stars stay)
| # | Name | The one new thing | Channels |
|---|---|---|---|
| **World 1: বিকেলের ছাদ** (blue sky, cream wall) ||||
| 1 | প্রথম চ্যানেল | Turn, and stop when the picture comes. Wide spots. First lock in about 3 s, the level in about 10 s. | 3 |
| 2 | সরু ছবি | Narrower spots, so you need the shout's ডানে/বাঁয়ে. | 4 |
| 3 | ভূতুড়ে ছবি | A ghost signal from channel ৩: faint, and it never clears. | 5 |
| 4 | **Finale: ছুটির দিনের কার্টুন** | The last channel is the cartoon. A hold meter must fill (1.4 s); slipping out drains it but doesn't reset it. | 5 |
| **World 2: সন্ধ্যার হাওয়া** (orange dusk, warm wall, a soft wind loop) ||||
| 5 | হাওয়া | The signal sways in the wind. Follow it. | 5 |
| 6 | নিচতলা চুপ | Nobody shouts. Read the snow alone. After 20 s someone comes back and points the way. | 5 |
| 7 | দমকা হাওয়া | Gusts shove the antenna. An arrow at the screen edge warns 0.9 s before. | 5 |
| 8 | **Finale: ঈদের নাটক** | Wind and gusts, then the natok's hold meter (1.8 s). | 5 |
| **World 3: কালবৈশাখীর রাত** (navy night, rain) ||||
| 9 | নড়বড়ে খুঁটি | The pole is loose. The antenna lags behind the dial and overshoots a little. | 5 |
| 10 | দুই ভূত | Two ghost signals. | 5 |
| 11 | ঝড় | Strong wind, gusts and narrow spots together. | 5 |
| 12 | **Finale: শেষ ওভার** | Everything at once, then the cricket's hold meter (2.2 s). | 5 |

Each level teaches one thing; the finale combines the world's things and adds the named hold meter.

## Difficulty and story
- **Modes (title chips, remembered on the phone):**
  - সহজ: "ছবির জায়গা চওড়া, নিচ থেকে আগেই বলে দেয়। তারা বড়জোর ২টা।"
  - সাধারণ (default): "আসল খেলা। ৩ তারা পেতে তাড়াতাড়ি করতে হবে।"
  - কঠিন: "সরু জায়গা, বেশিক্ষণ স্থির রাখতে হয়। তারার সময় বেশি পাও।"
- **Bots (asserted in tests):** a casual bot (0.35 s reaction, overshoots) and a skilled bot (0.22 s) play every level over many seeds. Every seed finishes. The casual bot clears level 1 in ≤ 10 s on the median seed. Per level, the skilled bot gets 3 stars on most seeds, and the casual bot gets 2 or more on most seeds. On কঠিন the skilled bot still gets 2 or more.
- **Story (first run only, hold to skip, never on a friend's link):**
  1. "শুক্রবার বিকেল। টিভিতে শুধু ঝিরঝির।"
  2. "নিচ থেকে আম্মু: ‘ছাদে গিয়ে অ্যান্টেনাটা একটু ঘোরাও তো!’"
  3. "তুমি ঘোরাও, নিচ থেকে বলে দেবে কোন দিকে। ছবি এলেই থামো।"
  A tap shows the next panel; holding 0.6 s skips all. It is remembered in `ektukhani-intro-antenna-thik-koro`.

## Screens
- **Title:** the biggest thing is the TV itself, drawn in code, snow on the screen and **খেলো** across it. Tap the set to start. Under it: the world and level line ("বিকেলের ছাদ · লেভেল ৩: ভূতুড়ে ছবি") with the level's one new thing, the three mode chips with the chosen one's line, and "সব লেভেল". A friend's challenge sits above the TV.
- **Level select (a choice screen, nothing running):** three worlds of four, numbered ১–১২, each with its name, its one new thing and its stars. The next unplayed level is marked **এটা খেলো**. Locked rows are dim and show a lock shape.
- **HUD (corners, above the scene):**
  - top-left: the level badge and the channel dots;
  - top-right: the clock;
  - top-centre, finale channel only: the programme's name and its hold meter (the "boss bar").
  The shout bubble sits in the sky corner, never over the TV.
- **Danger at the edges:**
  - while you hold in the sweet spot and the signal is close to slipping out, the stage edge glows amber;
  - a gust lights the edge it comes from, with an arrow and "হাওয়া".
  In slow mode both are steady borders with no pulse.
- **Lock juice:** the picture rolls once and settles (old V-hold), a soft white flash, a chime that climbs one note per channel, and the dot pops. Slow mode keeps only the chime and the dot.
- **End screen:** under the locked picture, "লেভেল ৪ পার". The stars pop in with chimes, and the time counts up over 0.8 s (instant in slow mode). Then real stats: the fastest channel, slips and gusts survived. Then the near-miss line, and three numbered choices: ১ পরের লেভেল (marked), ২ আবার খেলো, ৩ সব লেভেল. The keys 1–3, Enter and R work, but only from a fresh key press after the screen appears. Below that, "কার্ডটা দেখো ↓" scrolls inside the stage to the card.
- **Card:** the existing roof-and-set card. The thumbnail row shows as many channels as the level had, and the line names the level ("লেভেল ৪ · ছুটির দিনের কার্টুন").

## Sound (only `shared/game-sound.ts`)
1. **The static loop:** loudness follows how bad the picture is. You see it as snow.
2. **Dial ticks:** every 15°. You see them as the dial's ticks.
3. **The lock chime:** climbs one note per channel. You see the picture and the dot.
4. **The slip:** a soft drop. You see the shout shake.
5. **The gust whoosh.** You see the edge arrow.
6. **The wind loop** in worlds 2–3. You see the wind lines and the rain.

**Signature:** a five-note "ছবি এল" ident at the level clear, pitched per world. Scheduled tones only, so a pause cuts them.

## Comfort and controls
- **ধীরে খেলো:**
  - frozen snow;
  - no roll, flash, shake or pulsing edges;
  - held buttons turn at 35°/s;
  - the between-channel pause lasts 2 s.
  Stars are unchanged, because the clock doesn't run between channels and nothing in slow mode shortens a search.
- **Touch:** drag the dial anywhere (it follows the finger's angle), or hold ◀ ▶.
- **Keyboard:** hold ← → (or A D), Enter or Space to start. On the end screen, 1–3, Enter and R.
- **Mouse:** drag the dial, or use the wheel over the dial (3° a notch).
- **A11y:** a range slider.
- Pause, sound and ধীরে খেলো live in the player's menu; the game has no toggles of its own.
- **Compatibility:**
  - Links keep `#s=&t=&l=&n=`. New links add `v=2`, and `d=e|h` for a mode. A link without `v` replays the old level table exactly: level 1 and old pre-level links are the old five-channel game.
  - Results from an old-table link are compared and carded, but not recorded as stars, because the level is different.
  - `ektukhani-levels-antenna-thik-koro` stars stay. The old best time still migrates to level 1's stars once.
  - New bests live in one JSON key per mode, `ektukhani-times-antenna-thik-koro`.
  - Clearing a friend's level beyond your own unlock records its stars in `ektukhani-ahead-antenna-thik-koro`, so it doesn't open the levels in between.
  - The tally id, the URL, the title and the description stay.
