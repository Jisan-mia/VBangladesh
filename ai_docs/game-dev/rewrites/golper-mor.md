# গল্পের মোড়: rewrite design

## Look (written before styling)
- **Reference:** a Bangladeshi school exercise book (খাতা) on its shelf: flat printed covers, a paper label with the title, a wooden plank. Not a glossy app.
- **Palette, per shelf (its own ink):** স্কুলে chalk blue `#25608a` on `#eef5fb`; বাড়িতে clay `#9a4b12` on `#fff3e4`; পাড়ায় grass `#3a7a42` on `#eef7e6`; one gold `#f2b632` only for a ribbon, a ring or a lit lamp. Each book keeps its own cover colour (the story's `color`).
- **Type:** the site's own display face for titles and questions, its body face for the words, no new font.
- **Shape:** pages, pictures and buttons have square-ish corners (2–6 px) like card and paper. Only things that are round are round: the play button, the dots, the lamps, the ১ / ২ badges and the portrait. Icons are SVG, no emoji.
- **Glow only to signal:** the lamp glows when its shelf is lit, and a gold ring marks the road not yet read. Nothing else glows.
- **First thing to do:** press the big book. `devibe_scan.py` on `tools/golper-mor` reports no findings.

## Core
- **Concept:** a shelf of nine picture stories, each with one turn (মোড়) the child chooses.
- **Fantasy:** you are sitting with a picture book and a grown-up. At the turn you decide, see how the other child feels, then go back and try the other road.
- **Loop (3 verbs):** পড়ো (turn the pictures) → বেছে নাও (pick one of two roads at the মোড়) → ভাবো (the other child's face, one question, then the other road).

## Who it is for
A kids' page, ages 5–10 (the pictures carry it for the youngest). **No voice anywhere** (the owner's rule: phone text-to-speech reads Bangla badly): every `speak()` and `SpeakButton` call is gone. What the voice used to give, pictures now give:
- the other child's feeling is a small picture over their head (sun, raindrop, cloud, burst, heart) in the story and again beside their face on the end page, so shape and colour both say it;
- every button is a picture (arrow, shelf, fork, circling arrow, closed book) with a word beside it for those who read;
- the text under each picture is for a grown-up to read aloud.

## Progression: 3 shelves × 3 stories (all open, nothing locks)
Each story brings one new everyday question. The third story of a shelf is its finale (the longest or the heaviest), marked with a gold bookmark.

| Shelf (palette) | Stories (the one new thing) | Finale |
|---|---|---|
| **স্কুলে** (chalk blue) | 1 পড়ে যাওয়া টিফিন (share what you have) · 2 নতুন ছেলে মং (include the new one) · 3 ১০ টাকার নোট (found money, a stranger's loss) | **১০ টাকার নোট** |
| **বাড়িতে** (warm clay) | 1 লাল ঘুড়ি (a turn on the reel) · 2 একটা পাকা আম (a fair share) · 3 নানুর কাপ (own up) | **নানুর কাপ** |
| **পাড়ায়** (grass green) | 1 খালার বাজারের ব্যাগ (a small help) · 2 ব্যাটের কোনা (say what only you know) · 3 দৌড়ের দিন (a medal or a friend) | **দৌড়ের দিন** |

Reading all three stories of a shelf (either road) lights its lamp, once, with the shelf's four-note tune and a small confetti burst (not in ধীরে খেলো). Lamps are a record only: no score, no streak, nothing lost by skipping a day.
The ids (`tiffin`, `notun`, `taka`, `ghuri`, `aam`, `cup`, `bajar`, `cricket`, `dour`) are what old saved marks use, so they never change.

## Difficulty and story
- **No modes, no intro.** The stories are the panels. Both roads are always allowed and neither is "wrong". No number, star or tick that judges.
- **First win inside 10 seconds:** the big book on the shelf starts the first story, and the মোড় comes on the third picture (3 taps).
- **Bots (tests):**
  - a *tapper* reaches the end of all 9 stories × 2 roads in ≤ 8 taps each;
  - a *random child* (3000 taps over 60 seeds: open, next, back, pick, shelf, blur, pause, restart, limit flipping) breaks no rule.
- **Marks that never vanish:** a finished story is saved by reading the stored copy again and adding to it, so a second tab (or an older open page) can't wipe a mark. The shelf listens to the `storage` event and refreshes on focus.

## Screens
- **Shelf (the first screen):** the next story to read is one big book on top (its scene, its title, a 76 px round play button, a ghost finger on the very first run). Under it, three wooden shelves with three books each. A book is a colour-edged cover with a drawn scene, the title, and two ribbons that turn gold when each road is read. The recommended book has a gold ring and nudges now and then. Lamps for the three shelves and "N/9" sit in the top corners. বড়দের জন্য (share link, clear marks) sits behind the parent gate at the foot.
- **A story:** one picture takes the middle (4:3 with extra sky, breathing, blinking, clouds or dust drifting, and the other child's feeling over their head), the words below, and a 88 px ← / পরের ছবি → bar. The shelf button is top-left, the picture dots top-centre, the title top-right. On the last picture the button is গল্প শেষ.
- **The মোড় (a choice screen: nothing moves in the story, only the cards come in):** one line (a fork sign and "নুসরাত কী করবে?") and two big picture cards, numbered ১ and ২. A road already read shows a green tick; the other glows after the first read. ← goes back a picture.
- **Danger:** none. Nothing can be lost, so nothing glows at the edge.
- **End page:** the other child's face with their feeling as a picture, one question to talk about, a lamp line when a shelf just lit, and counts that tick up (আজ N টা · ৯টার মধ্যে N টা · দুই মোড়ই N টা). Three picture buttons of at least 108 px: **অন্যটা** (fork, the biggest, the other road), **আবার** (circling arrow), **শেষ** (closed book, the shelf). Under them আব্বু-আম্মুকে দেখাও. Nothing starts on its own. Past today's limit the page still shows with its question, and only শেষ is offered; the rest screen comes when the child leaves.
- **Card (ShowParent):** unchanged: today's stories, no name, no score. The card and the tool's plain link sit behind the parent gate.

## Motion (the Emil rules)
One entrance per screen and nothing on a key press:
- **A new picture:** the picture comes first (fade and 12 px slide from the side you are going: forward from the right, back from the left, 220 ms), the words follow 70 ms later (200 ms, 6 px), at the মোড় the question follows at 110 ms and the two cards at 130 ms and 190 ms. The other child's feeling pops in last (260 ms, from 0.6). The nav bar never moves.
- **End page:** items rise in a 60 ms stagger (240 ms); no container entrance.
- **Press:** every button scales to 0.97 on press (140 ms, `cubic-bezier(.23,1,.32,1)`).
- **A key press never animates** (`data-input="key"`), since keys are the repeat path.
- **Always-on motion** is only in the story picture (breath, blink, clouds, dust, kite). Covers and thumbnails stay still, so a shelf has no moving figures. Everything pauses under the player's menu and stops in ধীরে খেলো. Reduced motion keeps a 150 ms fade only.
- **Attention:** the recommended book nudges once, 2.5 s after the shelf opens, then rests for 7 s.

## Sound (`shared/game-sound.ts`, no loops, no music)
1. **Page turn:** a soft paper swish. You see the picture slide.
2. **Signature, "মোড়":** a wooden signpost tick and two bell notes that rise like a question, when the story reaches its turn. You see the fork sign and the two cards.
3. **Pick:** a soft low marimba note that settles. You see the card press.
4. **The end:** three notes down that land home, like a lullaby. You see the face and its feeling.
5. **Lamp:** four notes up and a high bell, only when a shelf lights. You see the lamp glow.
Pitch follows the shelf (C, D, E). Every note is a scheduled `tone()`/`hiss()`, so the player's pause cuts what still rings.

## Comfort and controls
- **ধীরে খেলো:** no breath, blink, drift, slide or confetti; pictures appear at once. Nothing is timed, so nothing else changes.
- **Touch:** every target ≥ 56 px, the main ones 88–108 px, 16 px gaps. Only the first finger counts through `tapCounts`; the first tap after blur or hide only wakes the book.
- **Keys:** on the shelf Enter or Space opens the recommended story and 1–9 open a story. In a story → or Enter or Space turn the page, ← goes back, 1 and 2 pick at the মোড়, P opens the player's pause. On the end page 1 (অন্যটা), 2 (আবার) and 3 (শেষ), or Enter for the main button; a fresh press only, after the 700 ms guard, never `repeat`. Escape is the player's.
- **Away:** the player pauses on blur and hide. Nothing in the reader moves on its own, so nothing runs away.
- **Kids:** `atBreak()` runs when a story starts (shelf, আবার, অন্যটা) and at the very tap that finishes one, where the mark is saved too. Past the limit nothing starts, and the shelf checks every second so the rest comes while the child looks at covers. The rest screen never covers a story or the end page. No network, no name, nothing to share in the child's view.
- **Kept for compatibility:** `/golper-mor`, the title, H1 and description, the static card, the saved key `ektukhani-golper-mor` and its shape (`read`, `day`, `today`), the nine story ids, no tally and no links.
