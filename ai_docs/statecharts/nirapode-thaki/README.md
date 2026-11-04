# নিরাপদে থাকি: statechart before the rewrite

Modelled on 2026-11-04 from the code on branch `games-to-the-bar`. The game is not yet on the shared game player. Files: spec `NirapodeThaki.tla`, config `NirapodeThaki.cfg`, view `view.ts`, and output in `before-fix/` (`report.md`, `chart.mmd`). TLC reached 492 states, and the chart draws 13 states and 36 arrows.

## Systems modelled
- **Opening:** the page opens on a `#s=<scene>` link, on a broken link, or with no link. The mount effect plays the linked scene, or else the first scene without stars.
- **Round:** five questions (two in the model). A wrong pick gives "আরেকবার ভাবো"; the safe pick shows why. পরেরটা moves on, and on the last question "দেখো কী শিখলে" runs `finish()`, which records the stars, plays confetti or the win sound, shows the done screen and calls `atBreak()`. `phase` is `play`, `done` or `idle` (after শেষ).
- **Scene tiles:** shown under the game while you play, and on the idle screen. A tap calls `pickSet()` → `start()`, even for the scene you're in.
- **Sound and speech:** the site switch. `tone()` and `sfx` check `soundOn()`; `speak(question.rule)` on the safe pick doesn't. The model gives the phone a Bangla voice.
- **Daily limit:** `atBreak()` runs in `finish()`, `RestScreen` covers the page, and a parent can extend.
- **Exits:** the parent gate with `ShareToolLink`, and the `PageFrame` links around the game.
- **Network and storage:** nothing is sent; the parent card's icons are `data:` URLs. Stars go to `ektukhani-levels-nirapode-thaki`.
- **Not modelled:** window focus. Nothing in this game runs on a timer, so there's nothing to pause.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| LinkOpensItsScene | A `#s=chula` link opens চুলা; a broken link opens the first scene without stars. | holds |
| SilentWhenMuted | With sound off, nothing makes a sound, speech included. | **breaks** |
| SceneTileKeepsRound | Tapping the scene you're already in doesn't throw your answers away. | **breaks** |
| RestOnlyAtBreak | The rest screen appears only on the done screen, never in the middle of a scene. | holds |
| ParentGate | Nothing takes the child out of the game without the parent gate. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored. | holds |
| AnswersArePictures | Every answer has a picture. This is the 6+ form of NoReadingNeeded: the game is for ages 6–10, so the 3–5 rule doesn't apply. | holds |

## Bugs
I replayed every bug live in my own Orca tab (Pixel 9, 412×923) at http://127.0.0.1:3100/nirapode-thaki between 10:08 and 10:09 +06, using `.click()`. The Orca browser has no Bangla voice, so in my tab only I replaced `SpeechSynthesisUtterance` and `speechSynthesis` with a recorder holding one `bn-BD` voice, and I counted `OscillatorNode.start` calls.

### 1. SilentWhenMuted: shared (`shared/kids-kit.tsx` `speak()`)
- **The player's sentence:** "The sound was off, and when I picked the right answer the phone still read the rule out loud."
- **Path:** turn sound off → pick the safe one.
- **Live, 10:08:09:** after the toggle ("শব্দ বন্ধ", `ektukhani-sound` = `0`), I made one wrong pick and then the safe one. That gave 0 oscillator starts and 1 speech call: "আগে ডানে তাকাই" with sound = 0. I turned sound back on afterwards.
- **Fix:** in `speak()`, return when `!soundOn()`, and cancel speech when the switch turns off. This is the same fix as গুনে দেখি.

### 2. SceneTileKeepsRound: game
- **The player's sentence:** "I was on the third road question. I tapped the road picture below, which was already lit, and I was back on question one."
- **Path:** answer a question (or miss one) → tap the current scene's tile.
- **Live, 10:08:19:** I answered two questions (রাস্তা পার ৩/৫). The রাস্তা পার tile (`aria-pressed="true"`, 119×112) sits 72 px below the game board. One tap gave রাস্তা পার ১/৫ and `#s=rasta`.
- **Fix:** make the current scene's tile do nothing while a round is in progress. Better, hide the tiles while playing, as the idle screen already shows them.

### 3. ParentGate: shared (`shared/site-shell.tsx` PageFrame)
- **The player's sentence:** "Under the game there were more pictures, I tapped one, and I was on a grown-ups' page."
- **Live, 10:08:38:** the page has 21 links and none is behind a gate. The related cards start 2,560 px below the game: `/amar-chhotobela` (adult), `/gune-dekhi`, `/hat-dhui`, `/abc-bazar` and `/tools`, plus the header with search, the crumbs and the footer. The same tap on সাত টুকরো opened `/amar-chhotobela` directly.
- **Fix:** use a kids' `PageFrame` with no adult links in the child's view.

### Rules that hold, checked live
- **LinkOpensItsScene, 10:08:38:** `#s=chula` opened "চুলা আর গরম জিনিস ১/৫", and `#s=junk` fell back to "রাস্তা পার ১/৫".
- **NoNetwork and NoChildData:** over a whole set, with `fetch`, XHR and `sendBeacon` wrapped, there were 0 calls and 0 new resources. The only write was `ektukhani-levels-nirapode-thaki` = `{"1":1}`.

## Quality-bar gaps (judged in Orca, 10:08–10:09)
1. **The ease never steps up:** three first-tap misses in a row did cut the next question to 2 choices (3,3,3,2,3 over the set). But `missRun` and `rightRun` reset every round, and a set has five questions, so "five right in a row → 4 choices" can't happen until a sixth question.
2. **Scene tiles under the game during play** invite a stray restart (bug 2) and make the page long. The related cards sit 2,560 px down.
3. **Reading:** each question is text, and the 🔈 button appears only with a Bangla voice. The parent note says a parent reads aloud for ages 6–7. Without a voice, nothing on screen carries the question.
4. **End screen:** "আবার খেলো" and "শেষ" are equal (164×60) ✓, but they are words only and under the 72 px target for ages 6–8.
5. **Speech ignores mute** (bug 1).
6. **Good, keep it:** no harm pictures; "আরেকবার ভাবো" plus a hint; the safe answer glows after two misses; one line of why; the done screen lists the five rules and an off-screen task; confetti only after all six scenes; parent facts with sources.

Screenshots: `.shots/nirapode-thaki-first.png` (the first screen, রাস্তা পার), `.shots/nirapode-thaki-done.png` (the done screen).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/nirapode-thaki/NirapodeThaki.tla --view ai_docs/statecharts/nirapode-thaki/view.ts --out ai_docs/statecharts/nirapode-thaki/before-fix
rm ai_docs/statecharts/nirapode-thaki/before-fix/tlc.out
```
The `--out` folder must be new or empty.
