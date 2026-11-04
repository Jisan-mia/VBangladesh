# ১৫ ঘরের ধাঁধা: rewrite design

## Core
- **Concept:** the mela's tin sliding plate, on a phone. Push ঘুঁটি into the one empty cell until they read ১ to the end, or until the picture is whole.
- **Fantasy:** নানা bought you the red tin plate at the বৈশাখী মেলা and said he could do it in a minute. You have four plates to get through, from a river ghat to the fair at night.
- **Loop:** ঠেলো (drag or tap a ঘুঁটি, the whole line follows the finger) → বসাও (it lands with a tin clink) → মেলাও (a row turns brass, the picture joins up).

## Progression: 4 worlds, 30 levels
The 30 plates behind old links don't change (same seeds, same par). What changes is how they're grouped, what each one teaches, and how the ঘুঁটি look. Levels are data in `lib/levels.ts`; the plates themselves are generated into `lib/plates.ts`.

| World (tin) | Size | Picture | Levels | Finale |
|---|---|---|---|---|
| নদীর ঘাট (red enamel) | ৩×৩ | নৌকা | 1–10, par 2 → 21 | **মাঝির নৌকা**: picture only |
| শহরের রাস্তা (blue enamel) | ৪×৪ | রিকশা | 11–18, par 8 → 48 | **মামার রিকশা**: picture only |
| পুরান ঢাকার ছাদ (green enamel) | ৪×৪ | সাকরাইনের ঘুড়ি | 19–25, par 58 → 110 | **সাকরাইনের আকাশ**: picture only |
| রাতের মেলা (night, gold trim) | ৫×৫ | নাগরদোলা | 26–30, par 40 → 180 | **মেলার নাগরদোলা**: picture only |

Each level names one new thing (shown on the title and in the status line under the plate). In each world the ঘুঁটি go **digits → picture with a corner digit → faint digit → picture only**, so the finale is the same plate you have been learning, without the crutch. Lessons in order:
- **World 1:** tap the ঘুঁটি next to the gap · drag it with a finger · a far tap slides the whole line · pushing back undoes a move · a finished row turns brass · the star meter and the orange edge · picture ঘুঁটি · top row first · faint digits · the finale.
- **World 2:** the real ৪×৪ · the hint and what it costs · the last two of a row go in as a pair · picture ঘুঁটি · the second row the same way · the left column in pairs · faint digits · the finale.
- **World 3:** bring a far ঘুঁটি column first, then row · bring the gap in front before you push · cycle three ঘুঁটি in a ২×২ box · faint digits · the last ৩×৩ is a small plate · picture only · the finale.
- **World 4:** ৫×৫ · outer row and column first, then it's a ৪×৪ · picture ঘুঁটি · faint digits · the finale.

**Star targets** build on the layered method's own moves on each plate (pinned as `METHOD` in `lib/plates.ts`, proven equal to the solver). On ৩×৩ that is the true shortest, so world 1 is unchanged. On bigger plates par is often just the shuffle undone, which only a lucky eye finds: the old targets made level 14 (par 20, 3★ at ≤ 24) the hardest ৪×৪ to three-star, while 22–25 were easy. The bots found it.

**Bot targets (tests):** the strong bot (true shortest on ৩×৩, the layered solver on bigger plates) earns 3★ on all 30. A casual bot (the row-by-row method, one push in 8 a random way, then carrying on from there) finishes every level, earns ≥ 2★ on ≥ 80% of world-1 runs and ≥ 90% of sampled runs in worlds 2–4, and earns 3★ on at most half of levels 6–10 (three stars take thought). A first-timer (greedy by eye, one push in 5 at random, happy to push back) solves level 1 within 10 pushes on ≥ 95% of seeds.

## Difficulty and story
- **The ladder is the difficulty.** No modes: a sliding plate has one rule, and the size and the hidden digits are the difficulty. The title line says what's new in plain words ("এবার ৪×৪, ১ থেকে ১৫").
- **Hints have a price, said before you pay it:** the button reads "একটা চাল · ★৩→২". The first hint caps the plate at 2 stars, a second at 1. (Before: one hint, one star, said only afterwards.)
- **Story (first run only, tap for next, hold to skip):**
  1. "বৈশাখী মেলা। টিনের খেলনার দোকানে ঝুলছে লাল একটা প্লেট।"
  2. "নানা কিনে দিলেন। বললেন, ‘আমি এক মিনিটে মেলাতাম।’"
  3. "ঘুঁটিগুলো এলোমেলো। ১ থেকে সাজাও, ফাঁকা ঘর থাকবে শেষ কোণে।"
  It plays once (`ektukhani-intro-ponero-ghor`), never on a friend's link, never on আবার খেলো.

## Screens
- **Title:** the world's solved plate, drawn in code, is the start button, with a stamp-like **খেলো** on its lower rim. Under it: ‹ লেভেল ৭ · ৩×৩ ›, one line (name, the new thing, "৩ তারা: ১৪ চালের মধ্যে"), then "সব লেভেল · ★ ১২/৯০". A friend's card and line sit above it. Tapping খেলো rattles the plate: the ঘুঁটি fly from solved to the level's start (0.5 s), so you see the plate was mixed, not born that way.
- **Choice moment:** the সব লেভেল sheet. Four worlds, numbered levels with stars, a lock shape on closed ones, the finale marked, **এটা খেলো** on the recommended level. Opening it pauses play (the clock stat stops).
- **HUD (corners only, outside the plate):**
  - top-left: the level badge (number + name), which opens the sheet;
  - top-right: moves in Bangla digits, three on-track stars and "৩★ ≤ ১৪"; a friend's count under it on a challenge;
  - the plate's top edge: a thin bar of ঘুঁটি at home. On a finale it carries the plate's name and "৫/৮", like a boss bar;
  - bottom: the goal picture (picture levels), ফিরিয়ে নাও, and the hint with its price.
- **Danger at the edge:** no lives. Two moves before a star would drop, the plate's rim glows orange; when it drops, the HUD star falls. In slow mode it's a steady orange border.
- **Finale:** a "শেষ প্লেট" badge and the name over the bar. When the last ঘুঁটি lands, the missing corner piece drops in, the picture is whole, a light sweeps the tin, and the world motif plays.
- **End screen (a tin slip rising over the controls, the plate stays visible):** the heading, StarReveal, then চাল, সময়, সাহায্য, ফেরানো counting up over 0.8 s (instant in slow mode). The exact near-miss line ("আর ৩ চাল কম হলে ৩ তারা"), the best on this phone, then **পরের লেভেল** (Enter), আবার খেলো, কার্ড বানাও.
- **Card:** the world's enamel colour behind the tin plate as the friend will meet it (picture slices on picture levels, with the finished picture inset), the headline in the world's ink, stars and the human line.

## Sound (`shared/game-sound.ts` only, no loops)
- **Signature:** the pressed-tin clink as a ঘুঁটি lands, one per ঘুঁটি in the line, scheduled on the audio clock so it lands with the slide.
- tin scrape as a drag lifts a line;
- the dull টং of a ঘুঁটি that can't move (with a small shake);
- a rising chord per finished row;
- the shuffle rattle on খেলো;
- a 4-note world motif when a finale is solved (`tone` with a delay, so a pause cuts it).

Every sound has a visible twin: the landing squash, the lift shadow, the shake and "শুধু ফাঁকা ঘরের সারি বা কলামের ঘুঁটি সরে", the brass row, the flying ঘুঁটি, the light sweep.

## Comfort and controls
- **ধীরে খেলো:** no shuffle flight, no overshoot on landing, no shake, no light sweep, no confetti, no count-up, and a steady border instead of the glow. Stars are unchanged.
- **Touch:** drag a ঘুঁটি in the gap's row or column; the line follows the finger and lands past halfway (or on a flick). Tap to slide the whole line. A swipe elsewhere on the plate moves the ঘুঁটি next to the gap.
- **Keyboard:** arrows or WASD move the ঘুঁটি next to the gap that way; Z or Backspace undoes; H is a hint; Enter or Space starts and goes on from the result (fresh press only, 0.4 s after it appears); P opens the player's pause menu. Escape belongs to the player.
- **Mouse:** click or drag, the same as touch. Clicked buttons drop focus, so Enter never repeats them.
- **Away:** the player's pause, blur and a hidden tab stop the clock stat and drop a drag in flight (the line springs back). The first tap after coming back only resumes.
- **Kept for compatibility:**
  - links `#l=&t=&m=&h=&n=` parse and replay exactly as before;
  - `ektukhani-levels-ponero-ghor` and `ektukhani-best-ponero-ghor-<level>`;
  - new `ektukhani-unlock-ponero-ghor`: your own unlock, migrated once from the old rule, so nobody loses a level; a friend's link opens only its own level;
  - the URL `/ponero-ghor`, the title, description and H1 text, the share id.
