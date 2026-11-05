# আম্মুর নম্বর: rewrite design

## Core
- **Concept:** a toy phone with a small screen and a pad of big round keys. The parent's mobile number lights up on the screen in pieces; the child dials the same digits. The number is the same every round, so it sticks.
- **Fantasy:** you are the one who knows Ammu's number, so when you are lost at the মেলা, you can ring home.
- **Loop (3 verbs):** দেখো (the digits light up, each with its own note) → মনে রাখো (they hide) → চাপো (dial them; the phone rings when it is whole).

## Who it is for
ছোটদের জন্য, ৪–৮. The kids' brief wins: no clock, no lives, nothing red, big targets, **no reading or listening needed**, and **no voice anywhere** (site rule: phone text-to-speech reads Bangla badly). Every cue is a picture, a motion or a note: an eye on the screen's corner while the digits play, a finger when it is your turn, a tick when a piece is in.

**Privacy (the point of the game):** the number never leaves the phone. No network, no share, no link or card carrying it, no log. It lives in page memory. A parent can tick "এই ফোনে রেখে দাও" behind the gate to keep it in this phone's storage (one key, `ektukhani-ammur-number-saved`), and clears it behind the gate with "নম্বর মুছে দাও". The tick is off by default.

## The look (written before styling)
- **Reference:** a chunky push-button phone for children, not a real maker's body: dark case, a small green-grey LCD, cream rubber keys that sink. Same idea as the sibling kids' games: a hard offset shadow under each key, no soft blur shadows.
- **Palette, one per world:** বাসায় is the site's pine green (`#0f7a5a` on `#e6f3ed`, case `#0d3b2e`), মেলায় is a fair-bunting maroon (`#a8325e`, case `#5e1a36`), ঈদের বাজারে is a market-awning indigo (`#3b4aa8`, case `#232b6b`). The LCD stays one real LCD green (`#cfe2bd`) in every world. The only gold (`#ffd166`) means "look here" or "this digit is lit", always also told by shape (a dashed ring, a lifted box).
- **Type:** the site's display face for the digits and the few words on screen; no new font.
- **Corners:** the case is round (a phone body), the keys are round (a keypad); everything else is 3–10 px.
- **Glow:** only to signal: the lit digit, the key that is right after two misses, the next level in the list.
- **First thing to do:** tap the phone. Icons and faces are SVG drawn in code, never emoji. Each world has a flat backdrop (rooftops, bunting and a wheel, awnings).

## Progression: 3 worlds, 9 levels
Ids 1–4 keep the old ধাপ meaning (1 copy, 2 the old piece hides, 3 look then hide, 4 whole number from memory), so saved stars stay true. Ids 5–9 are new. Everything is open: a child never meets a lock. The number grows in pieces (০১৭ → ০১৭১২ → ০১৭১২৩৪৫ → all 11), and each piece is dialled again from the start.

| # | id | World | Level | The one new idea | Pieces · hides · eyes |
|---|---|---|---|---|---|
| ১ | 1 | **বাসায়** | দেখে দেখে | The pad and the chunks; every digit shows | 3·5·8·11 · none · ∞ |
| ২ | 5 | | বড় টুকরো | Longer chunks | 5·11 · none · ∞ |
| ৩ | 6 | | **ফাইনাল: বাসার ফোন** | The whole number in one go | 11 · none · ∞ |
| ৪ | 2 | **মেলায়** | আগেরটুকু মনে রেখে | The piece you just dialled hides | 3·5·8·11 · old · ∞ |
| ৫ | 3 | | দেখে, তারপর লুকিয়ে | The digits play once, then all hide | 3·5·8·11 · all · ∞ |
| ৬ | 7 | | **ফাইনাল: মেলার ফোন** | Longer chunks, hidden | 5·11 · all · ∞ |
| ৭ | 8 | **ঈদের বাজারে** | তিনটা চোখ | Looks are counted | 5·11 · all · 3 |
| ৮ | 9 | | দুটো চোখ | Fewer looks | 11 · all · 2 |
| ৯ | 4 | | **ফাইনাল: ঈদের বাজারের ফোন** | No opening look, one eye | 11 · all · 1 |

## Difficulty and story
- **No modes.** The sweet spot is automatic and silent: three misses in a row ease the next piece (it hides one notch less); five right in a row lift it again. It carries from round to round.
- **A miss is kind:** a soft low boing and a gentle wobble of the key; the digit never goes in. After two misses on one digit the right key glows (a dashed gold ring). Nothing red, nothing lost.
- **The eye:** where nothing hides it replays the tune for free. Where something hides, it costs one look. In the last world the round has a few (3, 2, 1) drawn as eyes that close; when they run out the key sleeps, and the glow after two misses still carries the child through.
- **Stars** record the round only: a miss or a look is a slip; up to 1 slip ★★★, up to 4 ★★, else ★. A free tune and the look that opens a piece never count. ধীরে খেলো changes nothing here: it only slows the look.
- **No story panels.** A pre-reader can't read them; the phone and the ghost finger do the job.

## Bots (asserted in tests, 300 seeds a level)
- A **guesser** (random keys, taps the glowing one) finishes every level in ≤ 3 taps a digit and earns ★★★ on ≤ 2% of seeds.
- A **five-year-old** (copies 96%, remembers hidden digits 60%, uses the eye half the time when stuck) gets ★★★ on level ১ ≥ 55%, on ২ ≥ 70%, on ৩ ≥ 80%, and finishes every level.
- A **learner** (99.5% / 90%) gets ★★★ on the copying world ≥ 90% and on the hidden levels 25–85%.
- Level ১: the first piece is in within 10 s for ≥ 99% of five-year-olds. A round is about 25 s (learner) to 70 s (five-year-old).

## Screens
- **Title (inside the stage):** the toy phone, the biggest thing, with খেলো across its foot, and a very small nudge every 7 s. Under it: two faces (আম্মু, আব্বু) when both numbers are set, the level chip (opens the list), one line for the parent, and the grown-up gate: the number form and the link to the tool.
- **Level list (a choice screen; nothing runs under it):** three world bands in their palettes with numbered cards ১–৯. Each card draws what it asks (11 dots; hollow dots are hidden; eyes are the looks), the name and the stars. The next to play says এটা খেলো. The player's pause menu has সব লেভেল too.
- **The round:** top-left (past the ⏸) the level badge; top-right pieces as dots and, in the last world, the eyes. The middle is the phone: a screen with eleven boxes in the 5-3-3 rhythm, a corner cue (eye, finger, tick) and a face, then one short line for a parent, then the pad. Keys are as big as the stage lets them (up to 100 px, never under 72 px); the eye is the bottom-left key, the handset (not a key) lights and rings at the end.
- **The finale of each world:** named on the badge; at its end the world's four-note tune and, outside ধীরে খেলো, a small confetti. Confetti for the whole set stays for when all nine are done.
- **End screen:** the call connects (the face in a ring with the green handset), stars popping in with chimes, counts ticking up ("২৭টা অঙ্ক · ২৪টা প্রথমবারেই"), one line (praise only for a clean round), the off-screen task ("এবার আম্মুকে নম্বরটা মুখে বলে শোনাও"), two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ** (back to the title with the next level ready), then আব্বু-আম্মুকে দেখাও.
- **Card (in ShowParent):** unchanged: the phone with eleven dots, blank keys, "আজ আম্মুর নম্বর মুখস্থ করলাম". No digit, no name, no stars. The og image doesn't change; `#og` still opens the card with the demo number and saves nothing.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Key:** a small plastic tick, then the digit's own note (the signature: a number is a tune).
2. **The look:** each digit's note as its box lights.
3. **Miss:** a soft low boing, never a buzzer.
4. **Eye:** two quick notes.
5. **Piece done:** the shared "good" chime. **The ring:** four pips in two pairs.
6. **Stars and the finale tune:** scheduled tones, so the player's pause cuts them.
Every one has a picture twin (the key sinking, the box lighting, the wobble, the handset ringing), so the game works fully on mute.

## Comfort and controls
- **ধীরে খেলো:** the look runs slower (about 1.5×), no wobble, no loops, no confetti, no count-up, the lit box is outlined instead of lifted. Stars unchanged.
- **Touch:** tap a key. It acts on the first finger's pointerdown; a palm or second finger is ignored. During the look the keys dim and taps are ignored.
- **Keys:** 0–9 dial, Space (or Enter) is the eye, Enter or Space starts and replays (a fresh press only), P pauses through the player. Escape belongs to the player.
- **Away:** blur, hide and the pause menu clear every timed beat; coming back replays the look from its first digit, free. The first tap back only wakes the game.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the last digit (the stars are saved in that same tap). `RestScreen` shows on every screen but the round. `GamePage` has the kids frame; nothing in the child's view links to grown-up pages.
- **Kept for compatibility:** `ektukhani-levels-ammur-number` (stars by id; 1–4 unchanged, 5–9 new); the share id, title, description limits and the H1; no network and no link state, as before.
