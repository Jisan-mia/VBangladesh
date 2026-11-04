# হাত ধুই, দাঁত মাজি: statechart (before the rewrite)

Model: `HatDhui.tla`, `HatDhui.cfg`, `view.ts`. Report and chart: `before-fix/report.md`, `before-fix/chart.mmd` (346 states, 27 chart states).

The model follows the code on branch `games-to-the-bar` as of 2026-11-04 16:55 +06, including the kids' kit at `23fd7c1`:
- `tools/hat-dhui/components/{hat-dhui-game,routine,quiz}.tsx`
- `shared/game-kit.ts` `useGameLoop`
- `shared/kids-kit.tsx`
- `shared/site-shell.tsx` `PageFrame`

The game does not use the shared game player yet.

## Systems modelled
- **Play phase.** Three tabs: হাত ধোয়া, দাঁত মাজা and কখন ধোব.
  - Routine: ready → run ⇄ pause → end. One "the ring fills" step stands for the 6 wash steps and the 7 brush zones.
  - Quiz: asking → answered → done.
  - Done → idle (শেষ).
- **The 700 ms finish timer.** `setTimeout(() => done.current(), 700)` in `routine.tsx`. Nothing ever clears it.
- **Window.** Blur and hide. `useGameLoop` cancels its frame on both. The Routine's own state stays `"run"`.
- **Wake lock.** Taken on start and resume. Released on pause, end, hide and unmount. Taken back on show while running.
- **Kids' daily limit.** `useKidsSession`:
  - It counts only a focused, visible tab.
  - Past the limit, the game opens on the rest screen.
  - `atBreak()` is called in `finish()`.
  - `RestScreen` is a real modal.
  - "আজ আরও ১০ মিনিট" sits behind the gate.
- **Parent gate.** States: closed, open with a parent holding the phone, or still open after the phone goes back. Since `23fd7c1` it shuts after one grown-up action, after 60 s, or when the tab hides.
- **Ways out.** Share and saving the picture sit inside the gate. The site frame's header, search, related-tools grid and footer have no gate.
- **"আব্বু-আম্মুকে দেখাও".** `ShowParent`.
- **Not modelled.** Stars (shared `recordLevel` keeps the max) and the slow toggle. Sound is not modelled either: every tone goes through `soundOn()`, and `say()` and the quiz's `speak()` check `soundOn()`.

Timing assumptions, stated in the spec:
- During the 0.7 s finish window, only a tab tap or শুরু করো is fast enough to happen (`Calm`).
- A routine lasts at least 20 s, so an older finish timer has always fired before a new routine can end.

## Rules
| Rule | In plain words | Result |
|---|---|---|
| RestOnlyAtBreak | The rest screen comes only between rounds, or before a round starts. It never cuts a routine. | **breaks** |
| ResultMatchesPlay | The done screen is for the routine you just finished. | **breaks** |
| PausedWhenHidden | If the tab hides mid-wash, the routine is paused, not just frozen. | **breaks** |
| PausedWhenBlurred | The same when you click into another window. | **breaks** |
| NoProgressWhileAway | The ring doesn't fill while you're away. | holds |
| ScreenAwakeOnlyWhileRunning / ScreenAwakeWhileRunning | The wake lock is held exactly while a routine runs on a visible tab. | hold |
| NoShareForKids | A child can't share. | **breaks** |
| GateClosesBehindParent | When the parent hands the phone back, the gate is shut. | **breaks** |
| ParentGate | No way off the page without the gate. | **breaks** |
| NoNetwork | Nothing is sent after load. | holds (live: no data requests) |
| NoChildData | Only progress and settings are stored. | holds |
| NoReadingNeeded | Every button a 3–5 year old must press has a picture or a sound cue. | **breaks** |

## Bugs
### 1. Stale finish timer (game-specific): ResultMatchesPlay and RestOnlyAtBreak
- **What the player sees:** "The wash ended, I tapped দাঁত মাজা straight away, and the brushing jumped to 'আজ ২ মিনিট ধরে দাঁত মাজলাম' and the rest screen. I never brushed."
- **Path** (report, RestOnlyAtBreak): 0 → today's time runs out → you press শুরু করো → the ring fills → you tap a tab → 0.7 s later the finish timer fires → "Done screen for a routine you never finished", plus the rest screen. ResultMatchesPlay takes the same path without step 1.
- **Live replay** (Orca, own tab):
  - Run at 10:15 and again at 16:54, the second on kit `23fd7c1`.
  - Today's time was set past the limit in my tab only: `Storage.prototype.getItem` was patched for `ektukhani-kids-time`, and writes to it were dropped.
  - At t=20 027 ms the wash showed "হয়ে গেছে". At 20 031 ms the script tapped দাঁত মাজা, and the brush "press শুরু" screen showed.
  - 1.2 s later:
    - h2 = **"আজ ২ মিনিট ধরে দাঁত মাজলাম"**.
    - The দাঁত মাজা tab was pressed.
    - **The rest screen was up.**
    - The saved levels were `{"1":3}`: the hand-wash star went to the done screen of the brush.
  - The ShowParent card would show the same false "২ মিনিট দাঁত মাজলাম".
  - Screenshots: `.shots/hat-dhui-bug-stale-finish-rest.png`, `.shots/hat-dhui-bug-stale-finish-card.png`.
- **Fix:**
  - Keep the timeout id in `Routine` and clear it in the unmount cleanup.
  - Better: have `finish()` take the mode it finishes, and ignore the call when `mode`/`round` has moved on (pass `round` into `onDone` and compare).
  - Add a node test: finish arrives after `open(other)` and changes nothing.

### 2. Away freezes the ring but doesn't pause (game, with the shared loop): PausedWhenHidden and PausedWhenBlurred
- **What the player sees:** "I clicked away mid-wash. The ring stopped, but it still said একটু থামাও. When I came back it carried on by itself."
- **Path:** you press শুরু করো → you click into another window, or the tab hides.
- **Live replay** (16:40):
  - 3 s in, the ring offset was 517.3.
  - On `blur` it stayed at 517.3, and 4 s later it was still 517.3. The button still said "একটু থামাও", and `.paused` was false.
  - On `focus`, with no tap, it read 460.7 two seconds later and the step had moved to "হাতের পিঠ ঘষো".
  - Orca pins `document.hidden` to false, in iframes too (`Cannot redefine property: hidden`). So the hide path was not driven live. In code it is the same path: `useGameLoop.restart` cancels the frame, and `Routine` has no hide handler beyond retaking the wake lock.
- **Fix:** on blur or hide, `Routine` calls `pause()`, which shows "আবার চালাও" and the elapsed seconds. Or the game moves onto the shared game player, which pauses on blur and hide. Resume should take a tap.

### 3. Ways out without the gate (shared: `site-shell.tsx`): ParentGate
- **What the player sees:** "My 4-year-old tapped a picture under the game and landed on আমার ছোটবেলা."
- **Path:** 1 step: the child taps a link in the header or the related games.
- **Live check** (10:28):
  - 21 visible links outside any gate: `/`, `/games`, `/chhotoder`, `/quiz`, `/tools`, `/amar-chhotobela` (the adult flagship, first in the related grid), `/abc-bazar`, the guide, privacy and others.
  - The header has a free-text search input ("গেম খোঁজো").
- **Fix (shared):** kids' pages get a kids frame:
  - The header has only the logo and ছোটদের খেলাঘর.
  - There is no search box.
  - The related grid shows kids' tools only, and adult links move behind the gate or into the parent note.

### 4. The gate stays open after the phone goes back (shared: `kids-kit.tsx`): GateClosesBehindParent and NoShareForKids
- **What the player sees:** "I opened বড়দের জন্য, changed my mind and gave the phone back. My child tapped খেলাটার লিংক পাঠাও."
- **Path:** a parent opens বড়দের জন্য → the parent hands the phone back. NoShareForKids adds: → someone shares.
- **Live:**
  - At 10:25 (old kit) the gate was open and the share button live 30 s later.
  - On kit `23fd7c1`, checked on abc-bazar at 16:50: still open at 30 s, shut by 62 s.
  - So the kit fix narrows the window to 60 s, but the rule still breaks inside it. Inside that window the child could also press "আজ আরও ১০ মিনিট" on the rest screen.
- **Fix (shared):** shut the gate after about 10 s with no action inside it. Or ask for the sum again just before the action.

### 5. Words-only buttons (shared pattern): NoReadingNeeded
- **What the player sees:** "My 3-year-old can't tell একটু থামাও from আবার খেলো."
- **Path:** 1 step (you press শুরু করো); the run screen has the text-only pause button.
- **Live DOM check:**
  - Text-only: "একটু থামাও" / "আবার চালাও", "আবার খেলো", "শেষ" and "আব্বু-আম্মুকে দেখাও" (the kit's `ShowParentButton`).
  - With a cue: the tab icons, "▶ শুরু করো" with the ghost finger, the quiz pictures and "পরেরটা →".
- **Fix:** give each its own icon: ⏸/▶ for pause, ↻ for আবার খেলো, a house or moon for শেষ, and an adult-and-child icon in `ShowParentButton` (shared).

## Quality-bar gaps (played end to end in Orca, 10:15–16:55)
1. **Leaving mid-routine.** The ring freezes silently. There is no pause screen and no "চালিয়ে যাও" (bug 2).
2. **Pause.** "একটু থামাও" is text only and 44–49 px tall, under the 96 px target for ages 3–5. ধীরে and 🔊 are 44 px pills.
3. **Ending.** "আবার খেলো" is primary while "শেষ" is secondary (equal size, unequal weight). Every end button is words only.
4. **কখন ধোব for 3–5 needs reading.** The question is text. The 🔈 button appears only with a Bangla voice, which is missing on most phones. The "why" line after a right pick is text only.
5. **One routine, one pace.** The 2-minute brush has no variety beyond the zone picture. A small mid-way cue (a germ that runs, "অর্ধেক হলো") would keep a 4-year-old at the sink.
6. **First screen.** The hero, lead and parent note come before the board. On a phone the ring is below the first screen until you press শুরু (it then scrolls itself into view).
7. **Ways out.** The site header search and the adult flagship sit in the child's view (bug 3).
8. **Sound.** A soft tune per beat, germ pops and a start chime: good, and it works on mute. The end has no signature sound distinct from `sfx.win`.
9. **Store.** No data requests after load. The only keys are `ektukhani-levels-hat-dhui` and `ektukhani-kids-time`, plus the shared settings.

Screenshots:
- `.shots/hat-dhui-bug-stale-finish-rest.png`: rest screen after the false finish.
- `.shots/hat-dhui-bug-stale-finish-card.png`: the brush done screen with nothing brushed.
- `.shots/hat-dhui-opens-on-rest.png`: opening past today's limit.
- `.shots/hat-dhui-quiz-done.png`: the quiz end.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/hat-dhui/HatDhui.tla --view ai_docs/statecharts/hat-dhui/view.ts --out ai_docs/statecharts/hat-dhui/before-fix
rm -f ai_docs/statecharts/hat-dhui/before-fix/tlc*.out
```
After the fixes, update the spec and write to `--out ai_docs/statecharts/hat-dhui/after-fix`.
