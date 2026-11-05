# ছড়ার তালে: rewrite design

## Look (written before styling)
- **Reference:** a village-fair (মেলা) poster printed in flat inks, with a painted ঢোল as its one big object. One ink outline (`#3a2a1c`), a hard offset shadow under each button like a stack of cards, no soft blur shadows, no gradients.
- **Palette, one per world:** উঠান clay `#b4441c` on `#fff1de`; আকাশ night indigo `#3b3f9e` on `#eaecfb`; মেলা bottle green `#14705a` on `#e3f3ec`. One marigold gold `#f2b632` only for the ball, a lit dot and a ring. The rhyme threads use three inks (clay, blue, green) and are also told apart by which beads they tie.
- **Type:** the site's own display face for the words and badges, its body face elsewhere. No new font.
- **Shape:** buttons, pictures and cards have small corners (4–8 px). Round only what is round: the ball, the drum dots, the beads, the count and level badges, the play disc on the drum. Icons are SVG drawn in code, never emoji.
- **Glow only to signal:** a gold ring on a tap that landed, a dashed gold ring on the drum when it is your turn in an echo, a gold border on the ছড়া that is ready next. Nothing else glows.
- **First thing to do:** tap the drum. `devibe_scan.py` on `tools/chhorar-tal` reports no findings.

## Core
- **Concept:** a folk ছড়া's words light one by one while a ball hops along a row of drum dots; you tap the ঢোল when the ball lands. Every line adds one thing to a picture.
- **Fantasy:** you are the ঢুলি's helper at the fair, and the ছড়া draws itself when you keep time.
- **Loop (3 verbs):** দেখো (the ঢুলি's sticks and the ball show the beat) → তালি দাও (tap the drum on the ball) → ছবি জোড়ো (each line adds its drawing; two lines that end alike get tied with a thread).

## Who it is for, and no voice
A kids' page, ages 3–6. **No voice anywhere** (the owner's rule: phone text-to-speech reads Bangla badly). The old game leaned on a voice for the rhyme and on reading for the rhyme pick. Now the beat is carried by things you see and the words are shown big for a parent to read aloud:
- the ball hops dot to dot and lands exactly on each beat; the ঢুলি's two sticks swing on his beats and on yours;
- the lit word is the one under the ball; a word you tapped on the beat fills its dot gold;
- the "which picture rhymes" quiz is gone. Rhyme is shown instead: the last words of lines that end alike share an underline colour, one bead per line fills as the line ends, and a thread ties two matching beads;
- a rest (a quiet beat) is an open palm in a dashed ring; a count-in is two big numbers (২, ১) over the picture.

## Progression: 3 worlds, 8 ছড়া, one new idea each, a named finale
Ids 1–4 are the four old ছড়া (so saved stars stay), ids 5–8 are new. Everything is open; nothing locks.

| World | ছড়া (id) | The one new idea | Finale |
|---|---|---|---|
| **উঠান** (clay) | 1 হাট্টিমা টিম টিম | tap each word on the ball (ghost finger on the first run) | |
| | 5 নোটন নোটন পায়রাগুলি | a rest after each line: hand open, nobody taps | |
| | 2 আতা গাছে তোতা পাখি | on the last time round the ball goes faint: you keep the beat | **তোতা পাখির গান** |
| **আকাশ** (indigo) | 3 আয় আয় চাঁদ মামা | the first word of each breath is a big beat (a gold moon dot, a bigger thump) | |
| | 6 বৃষ্টি পড়ে টাপুর টুপুর | faster (620 ms), three times round | |
| | 7 ঘুমপাড়ানি মাসি-পিসি | echo: the ঢুলি plays a line, you answer the next; the second time round you swap | **ঘুমের গান** |
| **মেলা** (green) | 4 আগডুম বাগডুম | the parade speeds up line by line (780 → 624 ms) | |
| | 8 মেলার ঢোল (six lines from the ছড়া you know) | the last time round there is no ball and no dots: only your taps light the words | **মেলার ঢোল** |

A round is the ছড়া two times round (three for বৃষ্টি, which is only two lines): the first time the ঢুলি plays and you may join (your taps count too), the later times are yours. 17–57 seconds a round. Two beats are counted in first.
- **Stars (a record only, never spent):** one for finishing; two for a quarter of your words on the beat; three for over half. The window is ±26–30% of a beat. Three taps off the beat in a row quietly widen it by half; five on the beat in a row narrow it a little. A tap off the beat is a softer thump, never a buzzer; a tap on a rest costs nothing.
- **Bots (`tests/bots.test.ts`, 120 seeds a level):** a 3-year-old (late and loose, a third of the beats missed) earns ≥ 2 stars on ≥ 97% of rounds and 3 stars on the first two levels ≥ 60%; on the finales 20–85%. A 5-year-old earns 3 stars ≥ 90% and a 6-year-old ≥ 97% on every level. A first tap lands on a beat within 10 s on level 1 for every kind of hand.

## Difficulty and story
- **No modes, no story.** The kids' brief forbids announcing "easy mode", and a pre-reader can't read panels. The ladder above is the difficulty, and the window adapts silently.
- **Mashing wins nothing:** a beat is one hit however many times it is tapped.

## Screens
- **Title (inside the stage):** the ঢোল is the start button and the biggest thing on screen, with its sticks and a gold play disc; a ghost finger taps it on the very first run. It nudges once, 2.5 s after the screen opens, then rests for 7 s. Under it a chip shows the next ছড়া's finished picture, its name and its world (opens the list). At the foot, small: বড়দের জন্য (the gate: share the tool's plain address).
- **The list (a choice screen, nothing runs under it):** three world bands in their palettes, a card per ছড়া with its finished picture, stars and a gold "এটা খেলো" on the one ready next; finales are full width. The player's সব লেভেল opens it too.
- **A ছড়া (immersive, portrait first):** HUD in the top row only (the ছড়া badge on the left past the ⏸, whose turn it is and which time round on the right); the picture (16:10) takes the upper middle; one row of beads under it; the current line's words, each over its dot, with the ball; the ঢোল at the bottom (≥ 150 px tall, the whole width). Count-in: two numbers over the picture. Nothing else covers the play area.
- **Choice moments:** none inside play. The list pauses everything.
- **Danger:** none. Nothing can be lost, so there is no edge glow. (In an echo the drum gets a dashed gold ring on your turn.)
- **Finales:** a stamp "ফাইনাল" and the finale's name on the end screen, the world's five-note tune, a small confetti (not in ধীরে খেলো). Finishing all eight for the first time brings a bigger confetti.
- **End screen:** the finished picture, stars popping in with chimes, counts that tick up (তালি · তালে শব্দ N/M · টানা), then two 112 px picture buttons of equal size: **আবার** and **শেষ** (শেষ goes to the title with the next ছড়া ready). Under them আব্বু-আম্মুকে দেখাও. The buttons wake after 700 ms (dimmed until live), so the tap that was still drumming never lands on আবার. Past today's limit only শেষ shows, with the rest screen over the page.
- **Card (in ShowParent):** the finished picture, the ছড়ার lines with rhyme ends in colour, stars, "ঢোলে N বার তাল", no name. Saving it is behind the gate.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Signature, "মিল":** two bells on one note when a second line ends like an earlier one. Seen as the thread tying two beads.
2. **ঢুলির কাঠি:** a low ধিন and a high তিন, alternating. Seen as the sticks swinging.
3. **Your ধা:** a bright drum hit plus a bell on the word's note (a rising pentatonic ladder per line that lands home), so keeping time plays the tune. Seen as the dot filling and the gold ring.
4. **Soft thump:** a tap between beats. Seen as a small grey ring.
5. **Count and tick:** two woodblock clicks (the second higher), and a very quiet tick when nobody drums a beat. Seen as the numbers and the ball.
6. **The end:** a small roll and four notes up in the world's key (five for a finale). Seen as the stars.
Pitch follows the world (E, D, G). Every note is a scheduled `tone()` or `hiss()`, so the player's pause cuts what still rings. Works on mute: everything above is also on screen.

## Comfort and controls
- **ধীরে খেলো:** the ball doesn't arc (it steps), the sticks don't swing, the drum doesn't squash, the picture fades in without rising, no confetti, the pop on words and dots is off; the lit word is underlined so it still reads. A tap's ring only fades. **Timing and stars are exactly the same** (the FAQ says so).
- **Touch and mouse:** tap the drum. The first finger counts (a palm or second finger is ignored). The tap that brings focus back only wakes the game.
- **Keys:** Space or Enter taps the drum (at `window`, always prevented: it never presses the last clicked button and never scrolls); on the title it starts; on the end screen 1 or Enter is আবার, 2 is শেষ, a fresh press only after the guard, never `repeat`. P opens the player's pause menu; Escape is the player's.
- **Away and back:** the clock runs only while the window has focus and the player's menu is shut. On coming back the line starts again from its first word (the next line, if you were on a rest) and two beats are counted in; hits already earned stay.
- **Kids:** `atBreak()` runs when a round starts and at the very step the last beat ends, where the stars are saved too. `RestScreen` shows on every screen but play. `GamePage` has the kids frame. No network, no name, nothing in the child's view links out.
- **Kept for compatibility:** `/chhorar-tal`, the title's start and H1 ("ঢোলে তাল দাও, ছড়া বলো"), the saved key `ektukhani-levels-chhorar-tal` (ids 1–4 unchanged, 5–8 new), `#og` (a fixed result with the parent card open, nothing saved), no tally, no links, no share of results.
