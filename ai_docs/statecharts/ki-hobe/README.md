# কী হবে বলো তো?: statechart, before the rewrite

Spec `KiHobe.tla` / `KiHobe.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors the code as it stood on 2026-11-04 (branch `games-to-the-bar`):
- `tools/ki-hobe/components/ki-hobe-game.tsx`: `choose`, the `SCENE_MS` reveal timer, `sceneSound`, `goNext`, `restart`, the end and closed screens, the সব ধাপ drawer and the ParentGate.
- `tools/ki-hobe/lib/game.ts`: `predict`, `next` and `done`.
- `shared/game-sound.ts`: `tone()` and `hiss()` schedule notes ahead on the audio clock, and `setSoundOn(false)` runs only `stopLoops()`.
- `shared/kids-kit.tsx`: `useKidsSession`, `RestScreen` and `ParentGate`.

TLC reached 416 states and 1768 steps. The chart has 17 states and 29 arrows. **3 rules hold and 5 break** (TypeOK and NoDeadlock also hold). All 5 broken rules reproduced live in Orca between 10:04 and 10:08 (+06) on 2026-11-04.

## Systems modelled
- **Play phase:** guess → the experiment plays (the CSS scene plus the reveal timer, 2.4–4.4 s) → what happened and why → the end screen → the closed screen (আজকের পরীক্ষাগার বন্ধ). One question stands for the round's 4–5.
- **Away:** one flag for a hidden tab or another window. The code handles neither.
- **Sound:** the site-wide switch, and a scene note scheduled ahead on the audio clock (the pond splash at +0.75 s, the phone ring at +0.2 s and +1.2 s, the magnet click at +0.55 s).
- **Kids' daily limit:** `atBreak()` in `goNext` after the last question, RestScreen, and extend.
- **Parent gate:** who holds the phone.
- **Results and storage:** `levels.record` once a round, and nothing sent.
- **Reading:** the choices on each screen, and whether each has a picture.

Not modelled: levels and stars (shared `recordLevel` keeps the max, and finishing always gives ≥1 star, so পরের ধাপ only opens unlocked levels), the quiet ease to two choices, slow mode, and the `#og` card. The answer happens on `pointerdown`, which the model treats as a tap.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway (property) | The experiment doesn't run out while you're away. | **breaks** |
| SilentWhenMuted | With sound off, no note is left waiting to play. | **breaks** |
| NoDoubleResult | A round is recorded once. | holds |
| RestOnlyAtBreak | The rest screen appears only between rounds. | **breaks** |
| ParentGate | The share link is on screen only while a grown-up holds the phone. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress (stars per ধাপ) is stored. | holds |
| NoReadingNeeded | Where a screen offers two or more choices, each has a picture. The game is for ages 5–10, so this applies to the 5-year-olds. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. NoProgressWhileAway: "I tapped my guess, Ammu called me, and when I came back the experiment was already over. I only saw the answer."
- **Path (report):** 1 you tap a guess → 2 you switch to another app or window → 3 the experiment ends and the answer shows, while you're away.
- **Live replay (10:05):** I tapped a guess on "একই উঁচু থেকে পাথর আর পালক ছাড়লে কোনটা আগে মাটিতে পড়বে?" and then dispatched a window `blur`. A hide couldn't be replayed: Orca pins `document.hidden` ("Cannot redefine property: hidden"), and the game has no `visibilitychange` or `blur` handler (grep), so a hide changes nothing either. 4.6 s later, still away, the answer showed ("যা ভেবেছিলে, তা-ই হলো।"). Of the scene's 3 animations, 2 were **finished**, 1 was running and **0 were paused**. Nothing lets you watch it again.
- **Fix:** pause while away. Set a `data-away` attribute that sets `animation-play-state: paused` on the scene, and hold the reveal timer (keep the remaining ms). Or add "আবার দেখো", which replays the scene by bumping the SceneView key. **Game-specific.** The shared game player's blur and hide pause covers it if ki-hobe moves onto it.

### 2. SilentWhenMuted: "I turned the sound off right after I guessed, and the magnet still clicked."
- **Path (report):** 1 you tap a guess (a note is scheduled) → 2 you turn sound off: "Sound off, a note still coming".
- **Live replay (10:04):** I instrumented `start` and `stop` on `AudioScheduledSourceNode`, `AudioBufferSourceNode` and `OscillatorNode`. On "চুম্বক কাছে আনলে কোনটা লেগে যাবে?" the guess scheduled an oscillator at audio time **6.454 s**, scheduled at 5.904 s (+0.55 s). I turned sound off 30 ms after the guess. The only `stop()` on that note was its own, at 6.534 s, so nothing cut it. It sounds about 0.52 s after you mute.
- **Fix:** in `shared/game-sound.ts`, make `setSoundOn(false)` call `silenceScheduled()` as well as `stopLoops()`. **Shared:** it affects every scheduled tail, including dinosaur's two-note hum (+0.22 s), `sfx.win` and every `tone(..., delay)` in other games.

### 3. RestOnlyAtBreak: "The rest screen was up, but a new question had started behind it."
- **Path (report, 5 steps):** today's minutes run out → you tap a guess → the answer shows → you tap শেষ under the last answer (RestScreen up) → you press Tab and Enter behind the rest screen: "Guess what will happen", with "Rest screen up".
- **Live replay (10:07):** I set the kids timer to 99999 s in-tab only (reads patched, writes swallowed) and finished a round, and `.kk-rest` showed. Then I focused আবার খেলো behind it and sent a trusted Enter. A new round started with 2 choices ("উঠানে একটা খুঁটি। কখন তার ছায়া বেশি লম্বা হবে?"), with `.kk-rest` still up.
- **Fix:** RestScreen as a real modal (`<dialog>.showModal()` or `inert` on the game), in kids-kit. **Shared.**

### 4. ParentGate: "The share button stayed out after Abbu gave the phone back."
- **Path (report):** 1 a parent opens বড়দের জন্য → 2 you tap a guess: "Gate open, child holding".
- **Live replay (10:08):** I passed the gate ("পাঁচ আর সাত যোগ করলে কত?" → ১২) and played a full 5-question round (17 s). খেলাটার লিংক পাঠাও was still showing on the end screen.
- **Fix:** ParentGate closes itself after one action, a timeout, or the next outside tap. **Shared.**

### 5. NoReadingNeeded: "At the end there are four buttons, and they are all words."
- **Path (report, 3 steps):** a guess → the answer → শেষ: the end screen.
- **Live check (10:06):** আবার খেলো (72 px), শেষ (72 px), পরের ধাপ: আকাশ আর শব্দ (a **44 px** text link) and আব্বু-আম্মুকে দেখাও (64 px). None has a picture (`.shots/ki-hobe-sc-end.png`). The পরের ধাপ link is also below the brief's 72 px target for ages 6–8.
- **Fix:** picture end actions (a shared `<KidsEndActions>`), with পরের ধাপ as a full-size button that shows the next ধাপ's picture. **Shared pattern.**

### Checked and holding
- **NoNetwork (live, 10:08):** zero resource entries after `load` through the gate and a full round.
- **NoDoubleResult:** `goNext` records only when `done(moved)`, and the button unmounts with `revealed = false`.

## Quality-bar gaps (game-quality-bar + kids brief)
1. **The answer screen is a wall of text (§ "one line at a time"):** after each experiment, four paragraphs (match line, result, why, বাসায় করে দেখো) sit above পরেরটা. Show the match line and one result line, and fold the rest under "কেন?".
2. **The question needs reading (brief §4):** for a 5-year-old the ask is text. `SpeakButton` appears only when the phone has a Bangla voice (Orca has Piya, bn-IN; many cheap phones have none). The scene shows the setup, which helps.
3. **No replay of the experiment:** the scene is the lesson. An "আবার দেখো" button would cover a missed scene (bug 1) and curiosity alike.
4. **End screen:** text-only actions, and the 44 px পরের ধাপ link (bug 5).
5. **Pause (§7):** none, and no blur or hide handling.
6. **Sound (§11):** good per-scene sounds (splash, ring, click, whoosh) and a soft two-tone for a miss, and it is fully playable muted. There's no signature sound. Scheduled notes survive mute (bug 2).
7. **Pacing (§9):** each ধাপ is a topic set (pond and sun; falling, shadow and seeds; sky and sound; then a mix), so one new idea per ধাপ holds. A round takes about 1–2 minutes, which fits. Nothing marks the mix ধাপ as the "big" one.
8. **First screen (§1):** the scene and 2–3 picture choices with a ghost finger, good. On desktop the play box is a narrow column under a long hero.

## Screenshots
- `.shots/ki-hobe-sc-first.png`: Pixel 9, a question with its picture choices.
- `.shots/ki-hobe-sc-end.png`: desktop, the end screen with four text-only actions.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ki-hobe/KiHobe.tla --view ai_docs/statecharts/ki-hobe/view.ts --out ai_docs/statecharts/ki-hobe/before-fix
rm -f ai_docs/statecharts/ki-hobe/before-fix/tlc*.out
```
After the fixes:
- `TheExperimentEnds` needs `~away`, because the scene pauses.
- `SoundOff` sets `pending' = FALSE`.
- `YouTabAndEnterBehindRest` is removed.
- The gate closes on the next child action.
- The end screen's `Choices` get pictures.

Then re-run into `after-fix/`. All 8 rules must hold.
