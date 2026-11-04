# ছড়ার তালে statechart (before the rewrite)

Kids' game (ছোটদের জন্য, ৩–৬). Spec: `ChhorarTal.tla` / `ChhorarTal.cfg` / `view.ts`, mirrored from `tools/chhorar-tal/components/chhorar-game.tsx`, `shared/game-kit.ts` (`useGameLoop`), `shared/kids-kit.tsx` and `shared/game-sound.ts` (commits f4f75be and 23fd7c1). Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 456 states. The chart draws 25 states and 42 arrows, with no steps hidden.

Three shared kids' rules are modelled once, in `ai_docs/statecharts/prithibi-ghuri/`, and break the same way on this page:
- the parent gate (GateNeedsAnAdult, GateClosesBehindTheParent);
- the related-tool cards (NoOutboundForKids: the first card here is আমার ছোটবেলা);
- NoNewRoundPastLimit.

Adding them here would take the model past 500 states.

## Systems modelled
- **The round:** drum waiting → the ছড়া plays (two beat steps stand for two passes) → the rhyme pick → right picture (1.8 s timer) → done screen (আবার খেলো / শেষ) → আজকের মতো হলো. The ছড়া grid under the game starts a ছড়া at any time.
- **The beat loop and the window:** `useGameLoop(…, phase === "beat")` runs only while the window has focus and the tab shows. Blur and hide are one "away" step, because the loop treats them the same and nothing else here listens for them. Leaving is modelled during the beat and during the 1.8 s wait.
- **Keys:** where Space or Enter lands during the beat: on the drum (its `onKeyDown` taps), on a focused ছড়া button (Chrome leaves focus on a clicked button), or on nothing (the page scrolls).
- **The voice:** `speak(the whole ছড়া)` on the right picture, and only when the phone has a Bangla voice. A phone with no Bangla voice is explored up to the rhyme pick, using a CONSTRAINT.
- **Sound:** the site-wide switch. Since f4f75be, off also cancels speech.
- **The daily limit:** time runs out; `atBreak()` in `finish()`; the rest screen (a real modal); a parent's ১০ more minutes.

Not modelled: stars (taps count, but `recordLevel` keeps the higher value), wrong pictures, and the beat's tones (one-shot `tone()` calls that check the switch on every call).

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| PausedWhenAway | The beat stops while you're in another window or tab. | holds (checked live) |
| SpaceNeverRestarts | Space or Enter during the ছড়া plays the drum and never starts the ছড়া over. | **breaks** |
| SpaceReachesTheDrum | Space during the ছড়া never just scrolls the page. | **breaks** |
| VoiceOnlyOnTheResult | The voice reads the ছড়া only on the result, with sound on, while you're on the page: not into the next ছড়া, not after mute, not while away. | **breaks** (the mute part is fixed since f4f75be) |
| EveryFinishCounts | A round you finished is always recorded and checked against the daily limit. | **breaks** |
| NoReadingNeeded | A 3–5 year old can do the rhyme pick by picture and sound. | **breaks** |
| RestOnlyAtBreak | The rest screen comes only between rounds. | holds since f4f75be (checked live) |

## Bugs
Replays ran in Orca on 2026-11-04. Two ran before f4f75be (16:41–16:44): SpaceNeverRestarts and SpaceReachesTheDrum are game code, which f4f75be didn't touch. The others were re-run on the new kit (16:54–16:58). The voice replays use a stub: Orca has 0 voices, so I replaced `speechSynthesis.getVoices` with one fake `bn-BD` voice and `SpeechSynthesisUtterance` with a plain class. I then counted `speechSynthesis.speak` and `speechSynthesis.cancel` calls. Nothing was audible.

### 1. SpaceNeverRestarts (game-specific)
- **The player's version:** "I tapped ছড়া ১, then pressed Space to play the drum, and the ছড়া started over from the beginning."
- **Path:** tap a ছড়া number → press Space (2 steps).
- **Why:** keys reach the drum only through its own `onKeyDown`. A mouse click leaves focus on the ছড়া button in the `LevelGrid`, and Space on a focused button clicks it: `pickLevel` → `start()`. Each press starts the ছড়া over.
- **Live replay (16:41):** a trusted click on ছড়া ১ left `document.activeElement` = "ছড়া ১". After 9 s the beat was on line 2, "তারা মাঠে পাড়ে ডিম,", with one line past. After a trusted Space, it was back on line 1, "হাট্টিমা টিম টিম,", with no line past and the count-in running again. 1.2 s later "হাট্টিমা" lit.
- **Fix:** listen for Space and Enter on `window` during the beat and call `preventDefault()`, so the focused button never sees them. Or move focus to the drum when the beat starts. On the shared player, keys belong to the player, not to the last-clicked button.

### 2. SpaceReachesTheDrum (game-specific)
- **The player's version:** "After আবার খেলো, Space just scrolled the page down and the drum didn't play."
- **Path:** a ছড়া ends → done screen → tap আবার খেলো → press Space (7 steps). A fresh page does the same: nothing is focused until the drum is tapped.
- **Why:** আবার খেলো unmounts, so focus falls to `<body>`, and there's no window key listener.
- **Live replay:**
  - On the ready screen (16:39), Space scrolled the page from `scrollY` 140 to 1313.
  - During a beat with nothing focused (16:44), Space scrolled it from 300 to 1473. Only the beat's own tones started (4 oscillators in 3.5 s). No drum-tap tone played.
- **Fix:** the same window listener as bug 1.

### 3. VoiceOnlyOnTheResult (game-specific; the mute part was shared and is fixed)
- **The player's version:** "I found the rhyme and tapped the next ছড়া straight away. The voice kept reading the old ছড়া over the new drum."
- **Path:** tap a ছড়া number → the beat moves on → the ছড়া ends → tap the right picture → tap a ছড়া number (5 steps). Leaving during the 1.8 s wait does the same, because nothing listens for visibility.
- **Why:** `start()` never calls `speechSynthesis.cancel()`. Before f4f75be, muting didn't either.
- **Live replay:**
  - **16:42 (old kit):** the right picture gave one `speak()` with the whole ছড়া ("হাট্টিমা টিম টিম, তারা মাঠে পাড়ে ডিম, …") and 1 `cancel()`, the one inside `speak()`. After tapping ছড়া ১ 0.5 s later: 0 more `cancel()` calls, and the new beat on screen.
  - **16:55 (new kit):** muting during the wait now calls `cancel()` once. That part holds.
  - **16:58 (new kit):** picking a ছড়া 0.4 s after the right picture still gave 0 `cancel()` calls, and the new beat ran.
- **Fix:** cancel speech in `start()`, in `pickLevel`, on unmount and on `visibilitychange` hidden. A shared `stopSpeech()` in the kit, called by the player on leave, would cover every kids' game.

### 4. EveryFinishCounts (game-specific)
- **The player's version:** "She found the rhyme, tapped the next ছড়া right away, and the first one never got its stars. And the rest screen never came."
- **Path:** as bug 3: right picture, then a ছড়া number within 1.8 s (5 steps).
- **Why:** `start()` calls `clearTimeout(timer.current)`, and that timer is the one that runs `finish()`, which calls `levels.record` and `atBreak()`.
- **Live replay (16:42):** kids-time was 123240 s, far past the limit. I tapped the right picture, then ছড়া ১ 0.5 s later. 2.5 s on there was no done screen and **no rest screen**, `ektukhani-levels-chhorar-tal` was still `null`, and the beat was running. With the same setup (16:43), a round left alone showed the done screen, saved `{"1":2}` and showed the rest screen.
- **Fix:** while a finish is pending, run `finish()` at once instead of dropping it when a new ছড়া starts (record, then start), or disable the grid for those 1.8 s. The same pattern appears in `ammur-number` and `kar-chinho`.

### 5. NoReadingNeeded (game-specific)
- **The player's version:** "My 4-year-old can't read. On our phone nothing ever says the words. The ছড়া lights up word by word, then she has to pick which picture rhymes with ডিম, which is written as a word."
- **Path:** tap the drum → the beat moves on → the ছড়া ends, on a phone with no Bangla voice (3 steps).
- **Why:** the words of the ছড়া are only ever shown as text. `speak()` is the only path to sound, and it runs only after the right answer, and only with a Bangla voice. Most cheap Android phones, and Orca, have no Bangla voice. The pick is "কোনটা মেলে **ডিম**-এর সাথে?", with a text label on each picture.
- **Live check (16:39):** `speechSynthesis.getVoices()` returned 0 voices. Through a whole round, the only sounds were the beat's thumps and taps.
- **Fix:** recorded words are ruled out (no audio files), so give the words pictures instead. The lit word shows its picture (হাট্টিমা's horns, a ডিম above the word), so the rhyme pick uses pictures the child saw during the beat. Or say plainly in the parent note that a grown-up reads along, and drop the "পড়তে হয় না" claim.

### Rules that hold, checked live
- **PausedWhenAway:** I dispatched `blur` mid-beat (Orca pins `document.hidden`, so blur stands in for both). Orca's background tab ran rAF at about 2 frames a second, so the beat was slow throughout, but the counts compare.

  | 8 s window | Beat tones | Position |
  |---|---|---|
  | on the page | 1 | moved |
  | blurred | **0** | stayed on "টিম," |
  | after `focus` | 1 | moved on |
- **RestOnlyAtBreak:** the old kit broke this. At 16:43, Tab to ছড়া ২ under the rest screen, then Enter, started ছড়া ২ under it ("আতা গাছে তোতা পাখি," and 9 beat tones in 4 s). On f4f75be/23fd7c1 the rest screen is a modal. At 16:54 the page opened straight onto it (kids-time 980 s). Tab ×3, Enter and Space started nothing, and a trusted drum click was refused as covered. Focus did move to the বড়দের জন্য button under the rest screen (`.ct-gate`). Keys there are swallowed, but it's a focus-trap leak (shared, minor).

## Quality-bar gaps (two full rounds in Orca, desktop)
1. **Keyboard play is broken** (bugs 1 and 2). The drum is the start action and the game, but only a focused drum hears keys.
2. **No pause and no "away" cue.** Blur freezes the beat silently. On return it carries on mid-line with no count-in, so the child loses the beat.
3. **The first screen** is a cue line and the drum. It's good, but the ghost finger shows only when no ছড়া has any star, and the game sits in a narrow column under the H1 and lead.
4. **The middle is text.** Lines of Bangla words light one by one. For 3–5 year olds without a Bangla voice there's no picture or sound per word (bug 5).
5. **No feedback on the beat for mute play** beyond the drum's pulse and the ring. The ring flashes on every tap, on the beat or not, and differs only in colour (on beat vs off), with no change of shape.
6. **The ending:** stars, one method line, আবার খেলো / শেষ at equal size and আব্বু-আম্মুকে দেখাও. That's good, but a finished ছড়া never plays back the child's own taps, which is the natural "tune you made" reward from the brief.
7. **Pacing:** four ছড়া. Each changes the tempo slightly (900 → 780 ms) and the number of pictures (2 → 3). There's no new idea per ছড়া (call and response, a clap pattern).
8. **Sound:** a soft thump, a brighter hit, an off-beat tap and a soft miss. That's fitting, with no music, as the brief asks.

Screenshot: `.shots/chhorar-tal-beat.png` (the beat with "তারা" lit, the drum, and the ছড়া grid under it).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/chhorar-tal/ChhorarTal.tla --view ai_docs/statecharts/chhorar-tal/view.ts --out ai_docs/statecharts/chhorar-tal/<new-folder>
rm ai_docs/statecharts/chhorar-tal/<new-folder>/tlc*.out
```
