# যুক্তবর্ণ ভাঙি-জুড়ি: rewrite design

## Core
- **Concept:** a picture word has one যুক্তবর্ণ. In **ভাঙি** the factory shows it and you drop its letters into the slots in order (ক্ষ → ক, ষ). In **জুড়ি** the factory shows a "?" and you build it from the sound of the word (the slots → ক্ষ).
- **Fantasy:** a small workshop (কারখানা) where a gear turns every time two letters lock together. You are the one who runs the machine, and each finished word goes into the page of your খাতা.
- **Loop (3 verbs):** দেখো (the picture, say its name slowly) → বসাও (tap the letters into the slots, in the order you hear them) → জোড়া লাগে (the letters slide together, the gear turns, the যুক্তবর্ণ lights up).

## Who it is for
ছোটদের জন্য, ৭–১০ বছর, so the kids' brief applies: untimed, no lives, nothing red, picture-led, no network, no child data. **No voice anywhere** (site rule): every cue is a picture, a motion or a sound effect. These children can read, so the line under the picture says what to do and why a try missed, but nothing is timed and a word can't be lost.

## Progression: 4 worlds, 12 levels (ids 1–8 keep their old meaning)
Each world is a set of picture words. Inside a world, ভাঙি comes first (seeing ক্ষ and naming its parts is easier than spelling it from the sound), then জুড়ি, then a named finale that mixes both. The list shows play order ১–১২; saved stars stay under the old ids.

| # | id | World (palette) | Level | The one new thing |
|---|---|---|---|---|
| ১ | 1 | **জোড়া বর্ণ** (সকালের কারখানা: amber) | জোড়া বর্ণ ভাঙি | One letter used twice (ল + ল): a tile is never used up. 2 tiles, a ghost finger on the first word. |
| ২ | 2 | | জোড়া বর্ণ জুড়ি | The block is a "?": spell it from the sound. |
| ৩ | 9 | | **সব মিলিয়ে: রসগোল্লা থেকে চপ্পল** | ভাঙি and জুড়ি take turns, word by word. All eight words. |
| ৪ | 3 | **চেনা যুক্তবর্ণ** (পাড়ার পথ: green) | চেনা যুক্তবর্ণ ভাঙি | Two different letters, so the order matters (ষ্ট = ষ + ট). |
| ৫ | 4 | | চেনা যুক্তবর্ণ জুড়ি | Order again, from the sound only. |
| ৬ | 10 | | **সব মিলিয়ে** | All ten words, ভাঙি and জুড়ি taking turns. |
| ৭ | 5 | **কঠিন যুক্তবর্ণ** (বিজ্ঞানঘর: blue) | কঠিন যুক্তবর্ণ ভাঙি | A shape that hides its letters (ক্ষ, জ্ঞ, ঞ্জ). |
| ৮ | 6 | | কঠিন যুক্তবর্ণ জুড়ি | Build the hidden shape from the sound. |
| ৯ | 11 | | **সব মিলিয়ে** | All eight, mixed. |
| ১০ | 7 | **ফলা আর রেফ** (সন্ধ্যার মেলা: violet) | ফলা আর রেফ ভাঙি | র on top (রেফ), র or য after (ফলা), and three letters (ন্দ্র). |
| ১১ | 8 | | ফলা আর রেফ জুড়ি | Spell it from the sound. |
| ১২ | 12 | | **সব মিলিয়ে: মেলার ফলা** | All eight, mixed. The grand finale: confetti and the whole খাতা page. |

A normal level is six words from its set, in a seeded order. A finale is every word of the set (8–10). Replays change the order, never the words.

## Difficulty and story
- **No modes.** The kids' brief says never announce "easy". The sweet spot is silent: three misses in a row take one wrong tile away from the next word, five right in a row add one (1–3 wrong tiles).
- **A miss teaches:** the tried letters stay in the slots, each with a mark (a tick on a letter in the right place, a dashed hop-out on one that isn't there or is out of order), and one line says why ("ক ঠিক জায়গায়। স এই যুক্তবর্ণে নেই।" or "বর্ণ দুটো ঠিক, আগে-পরে উল্টো। যেটা আগে শোনো, সেটা আগে বসাও।"). After two misses on a word the right next tile glows (gold ring plus a dashed ring, so colour is never the only sign). No word can take more than three tries to finish.
- **Stars** are a record only: 0–1 misses in the round → ৩, up to 4 (6 words) or 6 (8–10 words) → ২, any finished round → ১.
- **Bots (tests, 2,000 seeds a level):** a *guesser* (random, then the glowing tile) always finishes within 3 tries per word and rarely earns ৩ stars; a *learner* (95% per letter) earns ৩ stars on most seeds; a *seven-year-old* (80%) finishes every level and gets ৩ stars often enough on level ১ to feel it. The first right letter comes within 10 s.
- **No story:** no panels; the factory and the ghost finger do the job.

## Screens
- **Title (inside the stage):** the biggest thing is the factory drawn in code: a gear, the level's first picture, its যুক্তবর্ণ block splitting into its slots, and a big ▶ খেলো across the bottom. Tap anywhere on it. Under it: the level chip (opens the list) and one line for what to do. At the foot, small, behind the gate: share the tool's address and the print sheet.
- **Level list (a choice screen; nothing runs under it):** four world bands in their own palettes, numbered cards ১–১২. A card shows the যুক্তবর্ণ it is about (ল্ল, ষ্ট, ক্ষ, ট্র), the mode and its stars. The next level to play says **এটা খেলো**. Everything is open. It opens from the title, the end screen or the pause menu's সব লেভেল. From a round, closing it returns to the same round; only a deliberate pick of another level starts a new one. Under the bands: the **খাতা** (every যুক্তবর্ণ made so far).
- **HUD (corners):** top-left the level badge (number, name); top-right the page strip, one seat per word that fills with its picture. The middle holds only the picture, the word, the machine and the tiles.
- **Danger:** none; nothing can be lost.
- **Finales:** the end plays the world's four-note tune and, outside ধীরে খেলো, a small confetti burst (a whole world done).
- **End screen:** the filled page (each word with its picture and equation), the stars pop in with chimes, the counts tick up ("৬টা যুক্তবর্ণ · ৫টা প্রথমবারেই"), new খাতা entries, what the child can do now, a task off the screen, then two 112 px picture buttons of equal size: **আবার খেলো** and **শেষ**. শেষ goes to the title with the next level ready. Nothing starts by itself. Under them: **আব্বু-আম্মুকে দেখাও**.
- **Card (in ShowParent):** the round's words with pictures and equations. No name, no stars. Saving it is behind the gate.

## Sound (`shared/game-sound.ts` only; no loops, no music)
1. **Tap:** a soft tick when a tile is touched. You see the tile press.
2. **Letter in:** a soft wooden drop. You see the letter land in its slot.
3. **Signature, "জোড়া লাগল":** two quick clicks as the letters lock, then a chime pitched by world. You see the gear turn and the যুক্তবর্ণ light up.
4. **Miss:** a soft low boing, never a buzzer. You see the marks on the slots.
5. **Next word:** a paper swish. You see the next picture.
6. **Stars and the world's tune:** shared star chimes as scheduled tones (so the pause cuts them), then a four-note tune at a finale.

## Comfort and controls
- **ধীরে খেলো:** no drop-in motion, no gear turn, no wobble, no glow pulse (a steady ring), no confetti. Stars are unchanged: nothing here is timed.
- **Touch:** a tile acts on the first finger's pointerdown (a palm or second finger is ignored). Tiles are at least 80 px with 16 px gaps (a six-year-old minimum; four tiles get 96+ px). Tap a filled slot to take the letter back. The next-word button is 72+ px tall and ignores a tap in its first 0.4 s, so a double-tap on a tile never skips the word you just solved.
- **Keys:** 1–5 pick a tile (each shows its number), Backspace takes the last letter back, Enter or Space after a word = next (a fresh press, never a repeat), and on the title = খেলো. P pauses through the player. Escape belongs to the player.
- **Away:** the player pauses on blur and hide. The first tap back after a blur only wakes the game. There are no timers to freeze: the game moves only when the child taps.
- **Kids:** `useKidsSession`. `atBreak()` runs when a round starts and at the tap that solves the last word (the stars are saved in that same tap, so leaving during the finish never loses them). `RestScreen` shows on any screen but play.
- **Kept for compatibility:**
  - `ektukhani-levels-juktoborno` (stars by level id; 1–8 unchanged, 9–12 new) and `ektukhani-juktoborno-book` (the খাতা);
  - `/juktoborno`, `?print` (the ten-word sheet "ভেঙে লেখো") and the new `?print=N` for one level's words, the title, H1 and description (the level count ৮ → ১২);
  - no link state and no tally, as before.
