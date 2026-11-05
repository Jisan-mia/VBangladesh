# নদী পার: rewrite design

## Core
- **Concept:** ছুটির দিন, ব্যাগ কাঁধে নানুবাড়ি যাচ্ছ। পথে সেতু নেই, আছে স্রোতে ভাসা ভেলা, নৌকা আর কচুরিপানা। লাফিয়ে ওপারের ঘাটে ওঠো, ঘণ্টা বাজাও।
- **Fantasy:** every child who crossed a খাল on a banana-trunk ভেলা and was told "পানিতে পড়লে গামছা ভিজবে".
- **Loop:** *দেখো* what drifts (ripples trail behind it, an arrow at the edge the current exits) → *লাফ দাও* (tap, 50 ms) → *পৌঁছাও* the ghat (the bell).

## Progression: 3 worlds × 10 rivers (`lib/levels.ts`; the 30 rivers and their seeds are unchanged, so old stars, bests and links keep their meaning)
Each river teaches one thing, said on its start card ("নতুন: …"). The world changes light, water and ground; the river 10, 20 and 30 are named finales.

| World | Look | New in the world | Finale |
|---|---|---|---|
| **১ · গ্রামের খাল** (rivers 1–10) | শরতের সকাল, green banks, clear canal | ভেলা → নৌকা → কচুরিপানা → দুটো আম → কিনারা → পাশে-পিছনে লাফ | **১০ · খালের মোড়:** seven rows, the widest canal |
| **২ · বড় নদী** (11–20) | দুপুর, dusty banks, brown-green river, sand চর | চর, then ফেরি (horn plus an edge chevron), then its ঢেউ that sinks the কচুরিপানা | **২০ · ফেরিঘাটের ঢেউ:** ten rows, ferry and wake together |
| **৩ · বর্ষার নদী** (21–30) | grey rain, fast brown water | বর্ষা, then two চর, ঢেউ on both sides of the ferry, a fourth আম, small কচুরিপানা | **৩০ · নানুবাড়ির ঘাট:** twelve rows, the longest river |

A finale shows its name and a thin progress bar (rows crossed) top-centre, and ends with a bigger bell and a world line on the end screen.

- **Stars:** ★ reaching the far ghat, ★★ inside the river's time (`PAR`, unchanged), ★★★ every আম. A splash costs time only.
- **Bots (`tests/bot.ts`, `tests/levels.test.ts`, on the real `stepRun`/`act`):**
  - a **casual** bot (0.30 s reaction, 8% misread hops, stands where it lands) crosses river 1 every time within 10 s (about 3 s) and every river in ≥ 90% of 40 seeds-of-start-time;
  - on **সহজ** it earns the time star more often than on **কঠিন** on every world's finale;
  - a **sharp** bot (0.18 s, 2% misreads) holds ★★ on ≥ 80% of rivers 1–10 and earns less in world 3 than world 1;
  - the careful solver (`lib/solve.ts`) still proves every river crossable from every bank at any moment.
- **Unlocks:** your own unlock (`ektukhani-unlock-nodi-par`) rises only when you clear the furthest open river. A friend's far-ahead river records its stars but opens nothing in between.

## Difficulty and story
- **Mode (title chips, remembered):** the river never changes, so a friend's link is the same crossing on every mode; the time star is the same. Only the foot differs:
  - **সহজ:** "পা রাখার জায়গা বেশি, পড়লে চটপট উঠে আসো।"
  - **স্বাভাবিক (default):** "ঠিক যেমন ছিল।"
  - **কঠিন:** "ভেলার কিনারা ছুঁলে পড়বে, ঘাটে ফিরতে দেরি লাগে।"
- **Story (first run, a tap for the next, hold 0.6 s to skip):** 1. "ছুটির দিন। কাঁধে ব্যাগ, যাবে নানুবাড়ি।" 2. "সেতু নেই। আছে ভেলা, নৌকা, কচুরিপানা।" 3. "লাফ দাও। ওপারের ঘাটে ঘণ্টা বাজবে।" Never on a friend's link or আবার খেলো (`ektukhani-intro-nodi-par`).

## Screens
- **Title:** the river behind, dimmed. The biggest thing is a code-drawn scene of the boy on the ghat steps with a dotted arc to a ভেলা, labelled **লাফ দাও**. Under it, small: ‹ নদী N · ওপারে place ›, the "নতুন" line, three mode chips and the chosen one's line, the star marks (time, আম), **সব নদী**, controls hint. A friend's banner sits above.
- **Choice moment, সব নদী:** a sheet over the stage that pauses a round: three world tabs, ten numbered rows (keys 1–9, 0), each with its one new thing, best time and stars, locked rows with a lock, **এটা খেলো** on the recommended one. The HUD badge opens it.
- **HUD (canvas, corners, Bangla digits):** top-left the river badge (opens সব নদী); top-centre the clock, gold while inside the time star (a notch for the par) and on a finale the name plus progress bar on a second row; top-right the আম count; the middle stays clear. Pops are small.
- **Danger at the edge:** carried within 1.6 s of the screen edge the current runs to: that side glows red and grows (a steady border in ধীরে খেলো); standing on a sinking কচুরিপানা: the bottom edge glows amber; the ferry: a chevron at the edge it will enter from, 4 s ahead, in its row. Faint arrows at each lane's exit edge show the current.
- **Platforms read instantly:** a pale rim and shadow on every floater, a short white wake trailing it, current-direction shading per lane, the first ভেলা in front of the boy pulses on river 1–2.
- **End:** over the dimmed river: heading ("ঢং! নদী ৭ পার"; a finale names itself), stars one by one, then stats counting up: সময়, আম a/n, ছপাৎ, লাফ (and টানা সেরা on the card line); the exact near-miss line; three numbered choices ১ পরের নদী (এটাই ভালো), ২ আবার খেলো, ৩ সব নদী (keys 1–3, Enter; a fresh press only, 0.7 s after it appears). **কার্ড দেখো ↓** scrolls the stage.
- **Card:** the world's water and light, the boy mid-hop, the time big, stars, আম and splashes, the kind line; the finale's name on a finale.

## Sound (`shared/game-sound.ts` only)
1. **Signature: the ghat bell** (inharmonic brass partials). Visible twin: the bell swings.
2. **Hop:** টক on wood, a leafy swish on কচুরিপানা, a thud on land, rising with quick hops; played in the pointer event itself.
3. **ছপাৎ:** splash plus a low drop. Visible: rings, shake.
4. **Mango:** a coin chime. Visible: the count.
5. **Ferry:** ভোঁ when it comes in. Visible: the chevron, then the ferry.
6. **Edge tick:** a soft low tick when danger starts. Visible: the red edge.
- **Water loop:** follows the current under the boy; plays only in a live crossing with sound on; stopped on pause, blur, the end, the list and unmount; replaced (never reused) when sound comes back.
- **World call:** three scheduled notes at the start of a river.

## Motion (Emil's rules: `emil-design-eng`, `animate`, `choreograph`, `animation-performance`)
- **The hop:** the one motion that is seen hundreds of times, so it gets no flourish: 0.12 s, ease-out on the way, the first fifth of it already in the frame the tap is drawn (the tap is answered in the pointer event, measured 9 ms with the frame drawn). The ghost arc and pulse are only on rivers 1 and 2.
- **Screens:** the title only fades (160 ms; it comes back after every river picked, often by key, so no slide). The story panel and সব নদী pop in at 200–220 ms from `scale(.96)`, never from 0. All of them use one curve, `cubic-bezier(.23,1,.32,1)`.
- **Press feedback:** every button scales to `.97` on `:active` over 140 ms; the big start button also sinks 3 px. No hover motion (touch first).
- **The end, cause then effect (choreograph):** the bell swings first; the card follows 320 ms later, 280 ms ease-out with no overshoot; the stats count up (700 ms) and the stars (`StarReveal`) and the cheer start when the card is shown, not before. One entrance per container: the card moves, its children don't stagger.
- **Skip hold:** slow where the player decides (0.6 s linear fill), instant on release.
- **Performance:** everything in the stage is `transform` and `opacity` on the DOM side; the river is one canvas drawn from pre-painted sprites (`*.hot.ts`, no allocation); the HUD is hidden under the title, story and card.
- **ধীরে খেলো and reduced motion:** gentler, not none: the screens only fade (120 ms), no slide, no press scale, the card without its wait, a steady glow instead of a pulse.

## Comfort and controls
- **ধীরে খেলো:** the river and its clock run at 0.6×, so times and stars read the same; the design accepts that slow mode buys reaction time. No shake, no splash drops, no bobbing, no pulsing edge (a steady border), no rain motion.
- **Touch:** a tap hops forward at once (pointerdown; a finger already moving within 40 ms is a swipe: sideways or back). Four big pad keys under the river answer on touch-down. **Mouse:** click forward, pad for sideways. **Keys:** arrows/WASD (fresh presses), Space/Enter forward, P opens the player's menu (`requestPause`), 1–3 on the end screen, 1–9, 0 in সব নদী; Escape is the player's. Game keys are ignored while paused.
- **Away:** blur, a hidden tab, scrolling away or any choice screen stops the river, the water loop and input. Coming back never resumes by itself; after a resume the river waits half a second; the tap that returns only resumes.
- **Kept for compatibility:**
  - links `#s=&t=&l=&a=&p=&n=` parse as before; the new optional `d=0|2` carries a non-default mode, so old links round-trip byte for byte;
  - `ektukhani-levels-nodi-par` stars by river number, `ektukhani-best-nodi-par-<n>` bests; the own unlock migrates once from the stars;
  - the share id, `&og=1` previews, `/nodi-par`, title, description and H1.
