# এবিসি বাজার: statechart (before the rewrite)

Model: `AbcBazar.tla`, `AbcBazar.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd` (395 states, 23 chart states).

The model follows the code on `games-to-the-bar` as of 2026-11-04 16:55 +06, including the kids' kit at `23fd7c1`:
- `tools/abc-bazar/components/abc-game.tsx`
- `tools/abc-bazar/lib/round.ts`
- `shared/game-core.ts` `recordLevel`
- `shared/kids-kit.tsx`
- `shared/site-shell.tsx`

The game has no timers of its own and no blur, visibility or pause handling. Nothing moves unless the child taps.

## Systems modelled
- **Round.** Two items stand for the six:
  - right tap → solved (the word is spoken only if `soundOn()`);
  - wrong tap → slip;
  - পরেরটা, then শেষ দেখো → `finish()`, which does `levels.record`, then confetti or a win sound, then the done screen, then `atBreak()`.
- **After the round.** আবার খেলো, শেষ → the menu's LevelGrid, and the সব লেভেল drawer (begin).
- **Stars.** Shown (3 with no slip, 2 with a slip) and the saved best (max).
- **Sound switch.**
- **Window.** Away and back.
- **Kids' limit and rest screen.**
- **Parent gate.** Shuts after one action, 60 s or hide.
- **Ways out.** Share and the print link inside the gate. Site links and the guide's "A–Z রং করার পাতা" link have no gate.
- **ShowParent.**

## Rules
| Rule | In plain words | Result |
|---|---|---|
| RestOnlyAtBreak | The rest screen comes only between rounds, or before the first tap. | holds (live: the rest screen came after শেষ দেখো) |
| ResultMatchesPlay | The stars on the done screen are this round's, and the saved best is at least that. | holds (live: 1 slip → ★★ shown, `{"1":2}` saved) |
| StarsNeverDrop | A worse round never lowers saved stars. | holds |
| NoProgressWhileAway | Nothing moves while you're away. | holds (no timers) |
| MuteMeansSilent | With sound off, nothing speaks by itself. | holds (the 🔈 শোনো button speaks only when tapped) |
| NoShareForKids, GateClosesBehindParent | A child can't share; the gate is shut when the phone goes back. | **break** |
| ParentGate | No way off the page without the gate. | **breaks** |
| NoNetwork, NoChildData | Nothing is sent; only progress and settings are stored. | hold |
| NoReadingNeeded | Every button a 4–5 year old must press has a picture or a sound cue. | **breaks** |

The game's own logic held every rule. All the breaks are shared.

## Bugs
### 1. The gate stays open after the phone goes back (shared: `kids-kit.tsx`): GateClosesBehindParent and NoShareForKids
- **What the player sees:** "I gave the phone back with বড়দের জন্য still open, and my child could share the link, or give herself ১০ মিনিট more on the rest screen."
- **Path** (report): starting on the rest screen (opened past the limit): a parent opens বড়দের জন্য → the parent hands the phone back. NoShareForKids adds: → someone shares.
- **Live** (16:50, this page, kit `23fd7c1`):
  - Gate opened ("নয় আর চার" → ১৩).
  - Still open with "খেলাটার লিংক পাঠাও" live at 30 s; shut by 62 s.
- **Fix:** as in `../hat-dhui/README.md`, bug 4.

### 2. Ways out without the gate (shared: `site-shell.tsx`, plus one link of the game's own): ParentGate
- **What the player sees:** "She tapped the A–Z link under the game, then a picture of আমার ছোটবেলা."
- **Path:** 1 step: the child taps a link in the header, the guide or the related games.
- **Live (16:52):** 22 visible links outside any gate, including `/amar-chhotobela` and `/abc-bazar?print` (the guide's print link right below the game), plus the header's free-text search.
- **Fix:** the shared kids frame (see hat-dhui, bug 3). Keep the print link only inside the gate, where it already is too.

### 3. Words-only end buttons (shared pattern): NoReadingNeeded
- **What the player sees:** "After the pictures, my 4-year-old faced three buttons of words."
- **Path:** 4 steps to the done screen.
- **Live:**
  - The done screen has "আবার খেলো" and "শেষ" (72 px) and "আব্বু-আম্মুকে দেখাও" (64 px), with no icon.
  - The menu shows Bangla digits only. "সব লেভেল" is text.
  - The picture choices and "পরেরটা →" are fine.
- **Fix:** an icon per button.

## Quality-bar gaps (played a full level-1 round in Orca at 16:52; earlier screens of levels 3–5, the print sheet and the rest screen are in `.shots/abc-bazar-*.png`)
1. **The prompt is text only.** "কোন ছবির নাম D দিয়ে শুরু?" has no speak button, and the ghost finger shows only the first tap. A 4–5 year old needs a grown-up to read the question once.
2. **A wrong tap's "why" is a text line** ("ওটা Boat (নৌকা), শুরু B দিয়ে।"). That is right for 6–7, but for 4–5 the glow after two tries is the only picture cue.
3. **End screen.** Words only (bug 3). The end card sits over the stage with four choice tiles still faintly visible under it. Clear the stage instead.
4. **The level drawer and print link sit in the child's view.** "সব লেভেল" opens a numeric grid. The A–Z print link is a plain link below the game.
5. **Controls.** ধীরে খেলো and 🔊 are 44–48 px pills, under the 72–96 px targets.
6. **Pacing.** The rounds are short: six items, about a minute for a child (5 s for the autopilot). Each level brings exactly one new idea (pictures, then small letters, then first letters, then b d p q): good.
7. **Sound.** A soft tone on a slip, `sfx.good`, and the English word spoken with an English voice. There is no signature sound for the bazar. It works on mute.
8. **Network.** After load only `/fonts/bangla.woff2`. No data requests. Keys are `ektukhani-levels-abc-bazar` and `ektukhani-kids-time`, plus settings.

Screenshots:
- `.shots/abc-bazar-first-screen.png`: the first screen with the ghost finger.
- `.shots/abc-bazar-end.png`: the end with ★★ after one slip.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/abc-bazar/AbcBazar.tla --view ai_docs/statecharts/abc-bazar/view.ts --out ai_docs/statecharts/abc-bazar/before-fix
rm -f ai_docs/statecharts/abc-bazar/before-fix/tlc*.out
```
After the fixes, update the spec and write to `--out ai_docs/statecharts/abc-bazar/after-fix`.
