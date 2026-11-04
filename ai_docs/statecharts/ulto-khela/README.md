# উল্টো খেলা: statechart (before the rewrite)

Model: `UltoKhela.tla`, `UltoKhela.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd` (335 states, 29 chart states).

The model follows the code on `games-to-the-bar` as of 2026-11-04 16:55 +06, including the kids' kit at `23fd7c1`:
- `tools/ulto-khela/components/ulto-game.tsx`
- `tools/ulto-khela/lib/game.ts`
- `shared/kids-kit.tsx`
- `shared/game-sound.ts`
- `shared/site-shell.tsx`

The game has no blur, visibilitychange or pause handling.

## Systems modelled
- **Round.** Three pictures of a bell level:
  1. a demo, never passed by চটপট;
  2. the picture after the bell, also a demo;
  3. a normal picture.

  After each picture comes the 0.7 s "next picture" timer. After the last one comes the round end: `levels.record`, `atBreak()` and the end screen. Then the closed screen (শেষ) and restart (আবার খেলো, পরের ধাপ, or a level in সব ধাপ).
- **চটপট timer.** `setTimeout(pass, 4 s)` on non-demo pictures.
- **Bell.** `bell()` and `speak("এবার …")` on a rule change.
- **Where the eyes are.** On the game, on the open সব ধাপ drawer, or away. Away covers another window or a hidden tab; nothing listens, so the two act the same.
- **Sound switch.**
- **Kids' limit and rest screen.** As in the kit: focused-tab counting, opening resting, a real modal.
- **Parent gate.** It shuts after one action, after 60 s, or on hide.
- **Ways out.** Share inside the gate; site links with no gate.
- **ShowParent.**
- **Abstractions.** The settings and the gate change at a round's start or between rounds. The model stops at the open-gate bug.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| NoProgressWhileAway | Pictures don't pass while you're away. | **breaks** |
| ChoiceFreezesPlay | While the level list is open, nothing in the game moves. | **breaks** |
| MuteMeansSilent | With sound off, nothing speaks or chimes. | holds since `b51e328` (broke before; see bug 4) |
| RestOnlyAtBreak | The rest screen comes only between rounds, or before the first tap. | holds |
| NoShareForKids, GateClosesBehindParent | A child can't share, and the gate is shut when the phone goes back. | **break** |
| ParentGate | No way off the page without the gate. | **breaks** |
| NoNetwork, NoChildData | Nothing is sent; only progress and settings are stored. | hold |
| NoReadingNeeded | Every button a 4–5 year old must press has a picture or sound cue. | **breaks** |

## Bugs
### 1. চটপট keeps going while you're away (game-specific): NoProgressWhileAway
- **What the player sees:** "I switched apps for half a minute with চটপট on, and when I came back the round was over with one star."
- **Path** (report): you press চটপট → you tap the right picture → the next picture comes (×2) → you go to another window or tab → 4 s pass and the picture passes as a miss.
- **Live replay** (Orca, 16:41, level 1, my key removed first):
  - চটপট on; the demo was tapped; then `window` `blur` and no input.
  - Done dots: 1/8 at 1 s, 2/8 at 5 s, 3/8 at 9 s, 4/8 at 13 s, 5/8 at 21 s, 6/8 at 25 s, 7/8 at 29 s.
  - At 8/8 (37 s) the end screen came, with **saved `{"1":1}`** (1★ from passes counted as misses).
  - A hidden tab can't be driven in Orca (`document.hidden` is pinned). The code has no handler for either, and timers keep firing in a hidden tab, throttled to ≥1 s.
  - Screenshot: `.shots/ulto-khela-bug-round-ends-while-away.png`.
- **Fix:** on blur or hide, stop the চটপট timer and the advance timer, and show a pause card ("চালিয়ে যাও"). The shared game player does this. Resume restarts the current picture's full time.

### 2. চটপট keeps going while the level list is open (game-specific): ChoiceFreezesPlay
- **What the player sees:** "I opened সব ধাপ to look at the levels, and pictures went by as misses."
- **Path:** you open সব ধাপ → you press চটপট → … → 4 s pass and the picture passes.
- **Live:** with চটপট on, the demo done and the drawer open (6 level buttons), 9 s later with no tap the dots went 1/8 → 3/8, and the drawer was still open. Screenshot: `.shots/ulto-khela-bug-passes-while-drawer-open.png`.
- **Fix:** while `details.uk-drawer` is open, hold the চটপট timer. Or move the level picker into a pause or menu sheet that freezes play.

### 3. Ways out without the gate, and the gate open behind the parent (shared)
These are the same two shared bugs as hat-dhui:
- **ParentGate** (`site-shell.tsx`): 21 links outside any gate, including `/amar-chhotobela`, plus the header search.
- **GateClosesBehindParent / NoShareForKids** (`kids-kit.tsx`): open for up to 60 s after hand-back. Checked live on kit `23fd7c1`: open at 30 s, shut by 62 s.

The paths, live numbers and fixes are in `../hat-dhui/README.md` (bugs 3 and 4).

### 4. The bell spoke on mute (shared: `kids-kit.tsx`): MuteMeansSilent. **Fixed in `b51e328`**
- **What the player sees:** "Sound was off, but the phone said 'এবার একই' at the bell."
- **The model found it on the code as it was read at 10:05.** `speak()` checked only for a Bangla voice, never `soundOn()`. The path was: you press the sound switch → you tap the right picture → 0.7 s later the next picture comes (with the bell).
- **Fixed at 10:13 in `b51e328`.** Since `f4f75be`, turning sound off also cancels queued speech.
- **Live check after the fix** (16:45, level 4):
  - A Bangla voice was stubbed, and `speechSynthesis.speak` was replaced to count calls.
  - Bell 1 with sound off: 0 calls. Bell 2 with sound on: 1 call, "এবার উল্টো".
  - The spec now models the fixed code and the rule holds.
- **Side note** (game, robustness): the advance timer calls `bell(); speak(…)` before `setRound(next)`. When `speak` threw (a bad stub voice in my first try), the round stuck on a finished picture for good. Put `setRound(next)` first.

### 5. Words-only end buttons (shared pattern): NoReadingNeeded
- **What the player sees:** "Pictures all the way, then four buttons of words."
- **Path:** 6 steps to the end screen.
- **Live (16:47):** the end screen has "আবার খেলো" (72 px), "শেষ" (72 px), "পরের ধাপ: রং, তারপর আকার" (**49 px**) and "আব্বু-আম্মুকে দেখাও" (64 px), all with no icon. The closed screen's "আবার খেলো" is also text only.
- **Fix:** an icon per button; পরের ধাপ at least 72 px.

## Quality-bar gaps (played in Orca, 10:20–16:55: a full level-1 round, levels 3–4 with bells, the end and rest screens)
1. **No pause at all.** চটপট is real-time but ignores blur, hide and the drawer (bugs 1 and 2).
2. **End screen.** Words only. "পরের ধাপ" is a 49 px secondary button under the pair. Stars show for every round, even level 1.
3. **Level picker lives under the game.** As a `<details>`, it stays open after a pick, and the ★ grid is the only explanation. Better: a numbered sheet, one line per level, a marked default, and play frozen while it's open.
4. **Controls row.** চটপট ৭+, ধীরে and 🔊 are 44 px pills next to the 145 px picture buttons. চটপট isn't explained on screen beyond "৭+".
5. **The rule change.** The bell and the rule badge (⇄ / =) with a demo finger are good: one new idea at a time. The bell sound is the signature. Speech is only an extra (Bangla voice only).
6. **First screen.** The ParentNote and lead sit above the game, but the rule badge, the picture and two big choices fit one screen. The first win comes within 2 s (the demo).
7. **Ways out and the store.** As in the shared bugs. After load the page also lazy-loads the related-games preview images and `/fonts/bangla.woff2`. These are static and carry no data, but they are network requests in the child's session.

Screenshots:
- `.shots/ulto-khela-first-screen.png`
- `.shots/ulto-khela-bug-round-ends-while-away.png`
- `.shots/ulto-khela-bug-passes-while-drawer-open.png`
- `.shots/ulto-khela-rest-at-end.png`

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ulto-khela/UltoKhela.tla --view ai_docs/statecharts/ulto-khela/view.ts --out ai_docs/statecharts/ulto-khela/before-fix
rm -f ai_docs/statecharts/ulto-khela/before-fix/tlc*.out
```
After the fixes, update the spec and write to `--out ai_docs/statecharts/ulto-khela/after-fix`.
