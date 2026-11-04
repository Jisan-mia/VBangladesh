# সুইচবোর্ড: rewrite design

## Core
- **Concept:** the wooden switchboard on a Bangladeshi wall, with round brass switches and pear-shaped bulbs. One switch flips its own bulb and the four next to it. Light every bulb in as few presses as you can.
- **Fantasy:** the power has just come back after load-shedding. You're the one in the house who knows the board, and three houses need their lights back: নানাবাড়ির বারান্দা, the মেসের ঘর and a বিয়েবাড়ির প্যান্ডেল.
- **Loop:** *চাপো* (a switch clacks and its bulbs bloom or die) → *দেখো* (count the dark ones, read the wiring) → *মেলাও* (the last bulb lights, the fan spins up).

## Progression
Three worlds of ten (`lib/levels.ts`, as data). Each world brings **one new rule**, each level **one new thing** (on its start card), and the tenth level is a named finale. Every board is built from all-lit by pressing `par` switches, and is kept only when the solver proves `par` is the fewest presses (and that the new rule is really needed).

| World | Palette | New rule | Levels | Finale |
|---|---|---|---|---|
| ১ নানাবাড়ির বারান্দা | afternoon: whitewash, teak, brass | সোজা তার: a switch flips its bulb and the 4 beside it | 3×3 (1–6), 4×4 (7–10); par 1 1 2 2 3 3 3 4 5 6 | **নানার বোর্ড** (4×4, 6) |
| ২ মেসের ঘর | evening: green distemper, plywood, tube light | কসটেপ: a taped switch can't be pressed; reach its bulb from the side | 4×4 (11–14), 5×5 (15–20); par 2 3 3 4 4 5 6 6 7 8 | **পরীক্ষার আগের রাত** (5×5, 8, six tapes) |
| ৩ বিয়েবাড়ির প্যান্ডেল | night: indigo cloth, marigold, fairy lights | মরিচবাতির লাইন: a long switch at a row's or column's head flips that whole line | 5×5 + lines; par 1 2 3 4 5 5 6 7 8 9 | **বরযাত্রী আসছে** (lines + tapes, 9) |

The lessons in order:
- **World 1:** the middle switch, a corner, an edge, lit bulbs flip too, order doesn't matter, take-back, 4×4, chase the lights row by row, the hint.
- **World 2:** one tape, a taped corner, two side by side, four corners, 5×5, a taped row, a taped edge, scattered tapes, par is truly the fewest.
- **World 3:** a row line, a column line, a line or small switches, two row lines, tapes come back, a line darkens lit bulbs too, rows and columns, crossing lines flip their corner twice, three lines and three tapes.

**Bot targets** (`tests/rewrite.test.ts`, a casual player who sees the right switch half the time, else plays the most-lighting switch or a random one):
- level 1: ★★★ in every run;
- every level is cleared within the 2-star limit by a casual player at least 30% of the time;
- each world's finale is the hardest of its world for ★★★;
- a sharp player (the solver) gets ★★★ everywhere.

## Difficulty and story
- **The ladder is the difficulty.** The start card says what's new in plain words ("কসটেপ মারা সুইচ চাপা যায় না…").
- **Stars:** ★★★ at par, ★★ within `par + max(2, ⌈par/2⌉)`, ★ for any clear. A hint caps it at ★★. Unchanged, so old links keep their stars.
- **Story:** no panels. Each world is a house, the start card names the house's rule, and the finales have names and one dry line ("নানা বলতেন, এই বোর্ড তিনি ছয় চালে মেলাতেন।").

## Screens
- **Title (start card):**
  - the masthead (সুইচবোর্ড · total stars);
  - ‹ level › with its name, world and stars;
  - the house's rule chip (W2, W3), then the **নতুন** line;
  - the biggest thing: the level's own board, unpowered, with a brass **শুরু করো** main switch across it. Pressing it clacks and the bulbs flicker on into the start state.
  - Under it: the star rule ("সেরা ৪ চাল · ৬ পর্যন্ত ★★"), and সব লেভেল.
- **Choice moments:** the সব লেভেল sheet (three houses, numbered levels, stars, locks, red finales, **এটা খেলো** on the recommended one). It holds play and the clock. On the result, পরের লেভেল is the default (Enter).
- **HUD (corners only):**
  - top-left: the level badge, which opens the sheet;
  - top-right: চাল ৩ · সেরা ৫, and a three-star meter that drops as the presses pass each limit;
  - a thin bar along the top edge: bulbs lit.
  - Finales add a slim boss row: "নানার বোর্ড ▬▬ নেভা ৭টা".
- **At touch:** the switch plate sinks and the lever snaps over with an overshoot. Its bulb blooms first, then the neighbours 40 ms later, as if the current ran down the wire. A line switch's bulbs bloom one after another down the string. A taped switch only wiggles its tape.
- **Hint that teaches:** the switch on a shortest path that lights the most. It shows its footprint (a gold ring on bulbs that will light, a dashed ring on ones that will go out) and one line: why this switch, what it does, and how many presses remain ("কোণের নেভা বাতিতে পৌঁছায় শুধু এই সুইচ। তারপর আর ৩ চাল।").
- **Danger at the edge:** the stage frame turns amber once ★★★ is gone, red once ★★ is. It's static in ধীরে খেলো.
- **End screen:**
  - a light ripple runs out from the last switch, the ceiling fan spins up, and StarReveal brings the stars in;
  - four stats count up: চাল, সেরা, সময়, ফিরিয়ে আনা / হিন্ট;
  - the house's clear line and the exact near-miss ("আর ২ চাল কম হলে ৩ তারা।"), the best on this phone, and on a finale the house's total ("বারান্দার ১০টা বোর্ড: ★ ২৪/৩০");
  - পরের লেভেল (Enter), আবার খেলো, কার্ড বানাও ↓.
- **Card:** the same wooden board with every bulb lit, now with the level's tapes and lines, in the house's palette, with a finale stamp.

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
- **টক্‌ (signature):** a hard bakelite click, a wooden knock and a tiny low thump, plus a 6 ms buzz. A small rising chirp when the press lit more than it darkened, a falling one when it darkened more.
- **The hum (loop):** the filament hum, louder as more bulbs light. It plays only while a board is live, on screen, unpaused and unmuted. It comes back on resume and when sound is turned on (a fresh loop, never the muted stub), follows take-backs, and stops on pause, the end, hide and unmount.
- **Line switch:** a longer clack and a zip down the string.
- **Tape:** a dull thup.
- **Main switch:** a heavy clunk and a flicker buzz on শুরু করো.
- **Fan chord (all lit):** a ceiling fan spinning up under a warm chord.
- **Shared:** drop (take-back), pick (hint), and the StarReveal chimes.

Every sound has a visible twin: the lever, the bloom, the tape wiggle, the ripple and fan, the meter.

## Comfort and controls
- **ধীরে খেলো:** no bloom stagger, ripple, fan spin, lever overshoot, pulse, count-up or confetti. The danger frame is static. Stars are unchanged.
- **Touch and mouse:** a press acts on pointerdown (under 50 ms). The press that brings the window back, or closes the menu, only wakes the board.
- **Keyboard:**
  - arrows walk a cursor over the switches, line switches included;
  - Enter or Space presses the switch under the cursor;
  - Z or Backspace takes back, H gives a hint, P opens the player's menu;
  - on the start card, ←/→ change level and Enter starts;
  - on the result, only a fresh Enter after 0.4 s goes on. Clicked buttons drop focus. Escape belongs to the player.
- **Kept for compatibility:**
  - `/switchboard`, its title, the H1 text (kicker + headline), and no tally;
  - old links `#s=&t=&l=&m=&h=&n=` replay on the old board (`lib/legacy.ts`, pinned by checksum) and open it as the friend's board, outside the ladder;
  - new links add `v=2` and use 36 switch characters (line switches);
  - the old stars `ektukhani-levels-switchboard` stay untouched. The new ladder keeps `ektukhani-levels-switchboard-v2`, and your own open level `ektukhani-switchboard-open` is set once from the old stars, so every level you had open stays open.
  - Best presses per level: `ektukhani-best-switchboard-v2-l<N>`, and the old `switchboard-l<N>` for an old friend board.
