# নাম শিখি statechart (before the rewrite)

Spec: `NamShikhi.tla` / `NamShikhi.cfg` / `view.ts`, mirrored from `tools/nam-shikhi/components/nam-game.tsx` (`NamGame`: `choose`, `next`, `finish`, `start`, `pickPack`, the hashchange effect) and `shared/kids-kit.tsx` (`useKidsSession`, `RestScreen`, `ParentGate`, `ShareToolLink`, `speak`). TLC: 420 states, 2808 steps. Chart: `before-fix/chart.mmd` (24 states, 55 arrows). Report: `before-fix/report.md`.

## Systems modelled
- **Play phase:** picture → right picture (পরেরটা shows) → next picture, or দেখো কী শিখলে → the done screen (আবার খেলো / শেষ) → idle (pack tiles). Two pictures stand in for a round of six.
- **Choices outside the round:** the pack tiles and the level grid sit under the game *during* play (`.ns-more`), and either one starts a fresh round at once. A `#p=` link does the same on `hashchange`, even under the rest screen.
- **Sound:** the site-wide switch, and `speak(learnedLine(...).main)` on every right tap. The line is short, so it ends when you leave the solved picture.
- **Kids' daily limit (kit):** `atBreak()` runs only in `finish()`. `RestScreen` is a full-screen overlay. `extend(10)`.
- **Parent gates (kit):** the share-link gate under the game and the rest screen's gate. `holder` says who has the phone. The ask stage is folded as in কার-চিহ্ন.
- **Page opens:** a reload, or arriving from the kids' hub. `resting` starts false.
- **Left out:** the tab and window (no clock, no timers), wrong taps (they only mark a picture), and stars (`recordLevel` keeps the max).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| RestOnlyAtBreak | The rest screen never covers a round in progress. | holds |
| SilentWhenMuted | With sound off, the game never speaks on its own. | **breaks** |
| NoNewRoundPastLimit | Once today's time is up, no new round starts without the rest screen first. | **breaks** |
| GateNeedsAnAdult | Only a grown-up gets through a parent gate. | **breaks** |
| GateClosesWhenTheParentHandsBack | When a parent hands the phone back, every gate they opened is closed. | **breaks** |
| NoShareForKids | While the child has the phone, the share link is behind a closed gate. | **breaks** |
| OnlyParentsGiveMoreTime | While the child has the phone, "more time" is behind a closed gate. | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

Replays ran in Orca (my own tab) by clicking the real choices (`[data-ok="1"]`), পরেরটা and the pack tiles, and reading the dots, the overlays and localStorage. Today's kids' time was already far past the limit (4,030 s against 900 s). `speechSynthesis.speak` was stubbed to record calls.

### 1. NoNewRoundPastLimit: "time was up, but she tapped ফল and got a fresh round" (shared, kids-kit + this game's tiles)
- **Path (2 steps):** today's time runs out → a new round starts without a break: a pack tile or level under the game mid-round, a reload, or a `#p=` link. The report shows the link variant; all three are the same `start()` with no `atBreak()`.
- **Why:** `atBreak()` runs only in `finish()`. Here the pack tiles and level grid stay on screen during play, so a child who keeps switching never reaches a break, and a reload resets `resting`.
- **Live:** one picture solved, then পরেরটা ("on now - - - -"), then the ফল tile **mid-round at 4,030 s** → "ফল · লেভেল ১", a fresh round ("now - - - - -"), no rest screen. The rest screen came only after দেখো কী শিখলে (4,050 s), which is right. A reload at 4,180 s showed a playable round with 3 choices and no rest screen.
- **Fix (kit, shared with কার-চিহ্ন):** `useKidsSession` starts resting when today's limit has passed, and `start()` calls `atBreak()`. Here, also hide the pack tiles and level grid during a round (show them on the done or idle screen).

### 2. SilentWhenMuted: "sound off, and it still said ছাগল out loud" (shared, kids-kit `speak`)
- **Path (2 steps):** the child turns sound off → taps the right picture: *sound off, the phone says the name*.
- **Live:** with 🔊 off, one round played: **7 `speak()` calls**: ছাগল, তরমুজ, নারকেল, পেয়ারা, আম, পেঁপে, লিচু.
- **Fix:** as in কার-চিহ্ন: `speak()` checks `soundOn()`, and `SpeakButton` forces.

### 3–5. GateNeedsAnAdult, GateClosesWhenTheParentHandsBack / NoShareForKids, OnlyParentsGiveMoreTime (shared, kids-kit)
These are the same `ParentGate` component and the same `RestScreen`, so the paths and fixes match `ai_docs/statecharts/kar-chinho/README.md` bugs 1–3:
- the pad opens to mashing (12 of 12 live trials, median 94 taps);
- an open gate stays open after the parent hands the phone back;
- the rest screen's gate stays open after a limit is chosen.

The model reaches each here by the same paths (1, 3 and 6 steps). I replayed them live once, in কার-চিহ্ন, since the component and its state are identical. The gate here sits at the bottom of `.ns-more` (`.ns-gate`).

### Rules that hold
- **RestOnlyAtBreak:** the rest screen came on the done screen only. A `#p=` link under the rest screen starts a fresh, untouched round behind it, which the rule allows.

## Quality-bar gaps (one full round of ফল and part of পশুপাখি in Orca at Pixel 9, plus the code)
1. **First screen:** good. The big word (হাতি), "কোনটা?" and three large pictures (choices end at 611 px of 923). The code adds a ghost finger on the first tap, but my screenshot did not show it: check it in the rewrite. Screenshot: `.shots/nam-shikhi-first-screen.png`.
2. **Choices during play:** the pack tiles and level grid sit right under the round and start a new one with no question. That's the door for bug 1, and a toddler's stray tap throws away the round. Show them only on the done or idle screen.
3. **Ending:** আবার খেলো is a filled primary button and শেষ an outline secondary. The brief asks for equal size *and* weight. Otherwise good: the six learned pictures with names, "আজ কোন ফলটা খেতে ইচ্ছা করছে? নামটা ইংরেজিতে বলো।", and আব্বু-আম্মুকে দেখাও. Screenshot: `.shots/nam-shikhi-done-screen.png`.
4. **Mute isn't silent** (bug 2).
5. **Pacing:** six packs × three levels (Bangla name, English name, name from the picture). Each level is one new idea, which is good. The choice count adapts (`choiceCount(missRun, rightRun)`). There's no ending moment for a whole pack beyond confetti.
6. **Mistakes:** good. A soft tone, a shake, "আরেকবার ভাবো।", and the right picture lights after two misses.
7. **Sound:** a two-tone wrong cue, `sfx.good`/`win` and speech. No signature sound. It isn't on the shared game player yet.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/nam-shikhi/NamShikhi.tla --view ai_docs/statecharts/nam-shikhi/view.ts --out ai_docs/statecharts/nam-shikhi/after-fix
rm ai_docs/statecharts/nam-shikhi/after-fix/tlc.out
```
After the fixes, `YouPickAPackOrLevel` is enabled only on done or idle, every round start runs `atBreak()`, speech needs `sound`, and the gate steps change as in কার-চিহ্ন.
