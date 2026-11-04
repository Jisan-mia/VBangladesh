# চোর-ডাকাত-পুলিশ-বাবু: rewrite design

## Core
- **Concept:** the paper-chit game every Bangladeshi family played on a শীতলপাটি, on one phone passed hand to hand.
- **Fantasy:** you are at নানাবাড়ি after dinner, the brass থালা is in the middle, and you are trying very hard not to smile because you are the চোর.
- **Core loop:** *tap* a chit, *hold* it to read, *point* at the thief. The phone keeps the score.

## Progression
A party game has no campaign; the "world" is one evening and its "levels" are its rounds. The rules never change mid-evening (families know them by heart), so each early round teaches one thing the screen shows, not a new rule.

| Evening (`lib/levels.ts`) | Rounds | Time | Note |
|---|---|---|---|
| ঝটপট | ৫ | প্রায় ৭ মিনিট | **RECOMMENDED** for a first evening |
| জমজমাট | ১০ | প্রায় ১৫ মিনিট | |
| সারা সন্ধ্যা | ১৫ | প্রায় ২০ মিনিট | |

- **Round 1:** tap, hold, read. Each chit carries one line of advice for its role ("মুখ গম্ভীর রাখো").
- **Round 2 onwards:** the swap rule shows itself the first time the police misses ("ভুলের দাম: পুলিশের ৮০০ এবার চোরের ঘরে"). The leader's badge turns brass.
- **Finale, "শেষ দান":** the last round is named on the hand-off screen and in the HUD, the stage gets a brass edge, the drum rolls longer and the two suspects' chits flip one by one. Then the scorecard.
- **Bot targets (tests):** every seat wins about a quarter of evenings; the last round can still change the winner in at least 28% of ৫-দান evenings (measured about 32%), 17% of ১০-দান and 13% of ১৫-দান, with both a coin-flip police and a sharp one (65%). So the finale matters.

## Difficulty and story
- No difficulty modes: the police's eye is the difficulty, and the family supplies it. The choice the setup offers is the evening's length, each with its real cost in minutes.
- No intro panels: the title screen is the থালা itself, and the first chit is in your hand within 3 seconds of খেলো.

## Screens
- **Title:** the brass থালা with four folded chits is the start button ("চিরকুট তোলো" on it), the biggest thing on screen. Under it, small: four name fields, the three evening chips (each with "প্রায় ৭ মিনিট", ঝটপট marked সুপারিশ), and the points. A paused evening shows "চালিয়ে যাও · ৩য় দান" on the plate instead.
- **Hand-off:** dark, so the last chit never shows. "ফোনটা রাফিকে দাও", closed eyes, and the থালা with the chits still left. Tapping a chit is the "I'm here".
- **Chit in hand:** one big folded chit, hold to open, let go to fold. "দেখেছি" names who gets the phone next.
- **Choice moment (the police):** the বাবু and পুলিশ chits flip open one after the other. Two big suspect buttons, keyed ১ and ২. The drumroll gives the room a beat to shout.
- **HUD:** four small score badges along the top, the round ("২য় দান · ৫") under them on the right. The middle is the chit.
- **Danger at the edge:** the drumroll pulses a red border round the stage; the শেষ দান has a brass border. Slow mode keeps the borders still.
- **Reveal:** the accused's chit flips first, then the other, then the news line, then each badge counts up its points.
- **End:** "খেলা শেষ", the winner, the four totals counting up, then real stats: চোর ধরা পড়েছে ক' বার, পালিয়েছে ক' বার, কে সবচেয়ে বেশি বার বাবু হয়েছে, সেরা পুলিশ। The card and share bar sit below, inside the stage.
- **Card:** unchanged (brass থালা, the scoreboard chit, no roles).

## Sound (`components/sound.ts`, only `shared/game-sound.ts`)
1. **ঠুং (signature):** a brass-plate clink when the evening starts.
2. **Rustle:** picking or folding a chit; the same for every role, so sound never gives a chit away.
3. **Flip:** each chit that opens on the table.
4. **Drumroll:** 12 table taps that speed up; all scheduled with `tone(…, delay)`, cut by `silenceScheduled()` on pause, reset and any screen change.
5. **Caught / whiff:** a bright two-note catch, or a falling whistle on a miss. Both are also written on screen.
6. **Fanfare:** once per scorecard (a bigger one for a new record), with confetti outside slow mode.

## Comfort and controls
- **ধীরে খেলো:** no confetti, no drum wobble, no flip animation, no pulsing edge (borders stay static). Timings that guard taps stay the same; scoring is untouched.
- **Touch:** tap a chit, hold the big chit, tap the buttons. Every target is at least 44 px.
- **Keyboard:** 1–4 picks a chit, Space held opens it, Enter is the main button, 1/2 name a suspect. Game keys are handled on `window` with `preventDefault`. Keys count only as a fresh keydown after the screen appeared, never a repeat. On the scorecard no window key acts: you Tab to a button. Escape is the player's.
- **Mouse:** the same as touch.
- **Kept for compatibility:** `/chor-police`, its title, description and H1 text; the link format (`s t g p v o`, unchanged); the save key `chor-police-game` (`{h, l}` plus a new `d: 1` for a finished evening; old saves still load); the best score (`useBest("chor-police")`); no tally.
