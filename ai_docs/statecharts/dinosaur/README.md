# ডাইনোসর খুঁজি: statechart, before the rewrite

Spec `Dinosaur.tla` / `Dinosaur.cfg`, view `view.ts`, output `before-fix/` (`report.md`, `chart.mmd`).
It mirrors the code as it stood on 2026-11-04 (branch `games-to-the-bar`):
- `tools/dinosaur/components/dino-game.tsx`: `startDig`, `begin`, `brushAt` and its 900 ms timer, `placeAt` and its 500 ms timer, `chooseDiet`, `keep`, the end and menu buttons, the সব লেভেল drawer and the ParentGate.
- `tools/dinosaur/components/sand.tsx`: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` and `stroke.current`.
- `shared/kids-kit.tsx`: `useKidsSession` (`atBreak`, `extend`), `RestScreen`, `ParentGate` and `ShareToolLink`.

TLC reached 368 states and 1968 steps. The chart has 20 states and 45 arrows. **4 rules hold and 5 break** (TypeOK and NoDeadlock also hold). All 5 broken rules reproduced live in Orca between 09:50 and 09:57 (+06) on 2026-11-04.

## Systems modelled
- **Play phase:** the dig (brushing, then bones lifting out) → build → meet ("ও কী খেত?") → the fact card → level done → the menu. One dinosaur stands for the level's two, because the second one only repeats the loop.
- **Input:** a finger on the sand canvas, `stroke.current`, and what ends a stroke: pointerup (only while the page has focus), pointercancel, and the canvas unmounting.
- **Window:** focused or blurred. The game has no blur or `visibilitychange` handler (a grep of all three games and kids-kit finds none).
- **Timers:** the 900 ms dig → build timer and the 500 ms build → meet timer. `startDig` clears both.
- **Kids' daily limit:** today's minutes run out; `atBreak()` is called in `keep()` on the last dinosaur; RestScreen; a parent gives 10 more minutes.
- **Parent gate:** বড়দের জন্য → hold → a sum written in words → খেলাটার লিংক পাঠাও. Who holds the phone.
- **Results and storage:** `levels.record` once per level, the finder's book, and nothing sent.
- **Reading:** which choices each screen offers, and whether each one has a picture (taken from the JSX).

Not modelled: the keyboard dig (Enter on the sand), slips and stars (stars come from `shared/game-core.ts`, where `recordLevel` keeps the max), the book dialog, slow mode and ShowParent's gated "ফোনে ছবি রাখো". No sound loops: every sound is a one-shot that reads `soundOn()`.

## Rules, in plain words
| Rule | In plain words | Result |
|---|---|---|
| InputReleasedWhenAway | Once you leave the window, the sand no longer counts any finger as down. | **breaks** |
| SandClearsOnlyUnderAFinger | The sand clears only while a finger (or mouse button) is really down on it. | **breaks** |
| TimersBelongToThisDig | The "bones come up" and "dinosaur stands" timers fire only in the dig they were set for. | holds |
| NoDoubleResult | A level is recorded once. | holds |
| RestOnlyAtBreak | The rest screen appears only between rounds, never with a round in play. | **breaks** |
| ParentGate | The share link is on screen only while a grown-up holds the phone. | **breaks** |
| NoNetwork | Nothing is sent. | holds |
| NoChildData | Only progress is stored: the stars and the finder's book. | holds |
| NoReadingNeeded | Where a screen offers two or more choices, each has a picture (ages 4–5 can't read). | **breaks** |
| TypeOK, NoDeadlock | | hold |

## Bugs

### 1. InputReleasedWhenAway and SandClearsOnlyUnderAFinger: "I was brushing when a message popped up. When I came back, the sand cleared wherever my mouse went, and my finger did nothing."
- **Path (report):** InputReleasedWhenAway: 0 brushing → 1 you touch the sand → 2 you click into another window (the finger is on the sand and the window has no focus). SandClearsOnlyUnderAFinger: the same two steps, then 3 you let go in the other window: "No finger, sand still listening".
- **Live replay (09:52):** I sent `pointerdown` (mouse, id 1) at sand (5, 120), well away from every bone, then a window `blur`, and no `pointerup`. Then I sent 45 hover `pointermove`s with `buttons: 0` across bone 1 at (70, 186). The tally went from **0 to 1 bone found**, with no button held. Next I sent two complete touch taps (ids 7 and 8) on bone 2 at (293, 62). The tally stayed at **1**, and the sand's alpha at bone 2's centre stayed **255** (untouched). `onPointerDown` returns early because `stroke.current` is still set.
- **Fix:** in `sand.tsx`, clear `stroke.current` on window `blur`, on `visibilitychange`, and on `lostpointercapture`. In `onPointerMove`, also require a pressed button for mouse (`event.buttons & 1`). Let a new `pointerdown` replace a stroke whose pointer is gone. **Game-specific code.** The rule itself is shared: the shared game player releases input on blur for every game that moves onto it.

### 2. RestOnlyAtBreak: "The rest screen was up, but the game behind it started a new dig."
- **Path (report, 9 steps):** play to the fact card → today's minutes run out → you press বইয়ে রাখো on the last dinosaur (RestScreen up) → you press Tab and Enter behind the rest screen: "Brushing the sand", with "Rest screen up".
- **Live replay (09:54):** I patched `Storage.prototype.getItem` in my tab so `ektukhani-kids-time` read 99999 s, and swallowed every write to the shared kids keys, so other agents were never affected. I finished a level, and `.kk-rest` showed. Then I focused আবার খেলো behind it and sent a trusted Enter. A new dig started under the rest screen ("বালুর নিচে হাড় লুকানো…", লেভেল ১), with `.kk-rest` still up and no `[inert]` anywhere. Three Tabs from the rest screen's gate button moved focus to a FAQ `<summary>` behind it (`insideRest: false`).
- **Fix (kids-kit):** make RestScreen a real modal. Use `<dialog>` with `showModal()`, or put `inert` on the game root while `resting`. Move focus into it. Also don't render the end screen's buttons while `resting`. **Shared:** the same in ki-hobe and shoman-bhag.

### 3. ParentGate: "Ammu opened বড়দের জন্য to copy the link and gave me the phone back. The share button stayed there the whole time I played."
- **Path (report):** 1 a parent opens বড়দের জন্য → 2 the parent hands the phone back: "Gate open, child holding". Every child step after that (touching the sand, picking a level) keeps the gate open.
- **Live replay (09:53):** I held the gate 2.15 s and answered "চার আর ছয় যোগ করলে কত?" with ১০, and খেলাটার লিংক পাঠাও appeared. Then I played a whole level as the child: 2 digs, 6 bones placed, 3 food choices. At the end screen the share button was **still showing**. The gate closes only on বন্ধ করো.
- **Fix (kids-kit `ParentGate`):** close the gate after one action inside it, after about 60 s, or on the next pointerdown outside it. **Shared.**

### 4. NoReadingNeeded: "At the end, I can't tell which button plays again and which one stops."
- **Path (report, 7 steps):** a full dig, build and meet → you press বইয়ে রাখো → the "Level done" screen.
- **Live check (09:51):** the end screen has 3 buttons (আবার খেলো, শেষ, আব্বু-আম্মুকে দেখাও), each 64 px tall, with **no svg or img** in any of them (`.shots/dinosaur-sc-end.png`). The parent note says "৪–৫ বছরে … পড়তে হয় না।"
- **Fix:** give each end action a picture: ↻ for আবার খেলো, a house or bed for শেষ, and two grown-ups for দেখাও. A shared `<KidsEndActions>` in kids-kit would fix every kids' game at once. **Shared pattern.**

### Checked and holding
- **NoNetwork (live):** after `load`, the only requests were 4 lazy `/_next/image` previews for the "এগুলোও ভালো লাগতে পারে" cards below the game. That held through 3 rounds, the gate and ShowParent. There was no fetch, XHR or beacon.
- **NoChildData:** the game writes `ektukhani-levels-dinosaur` and `ektukhani-dinosaur-book`, plus the shared `ektukhani-sound`, `ektukhani-slow` and `ektukhani-kids-time`.
- **Observed, not modelled (shared):** the shared `ektukhani-kids-time` rose from 490 s at 09:50 to 1330 s at about 09:57 while several agents' kids tabs were open in Orca. Orca pins `document.hidden` to false, so every tab ticks. Each visible tab adds 10 s every 10 s, so two visible windows count the day twice.

## Quality-bar gaps (game-quality-bar + kids brief)
1. **End screen (§10, brief §4):** the three actions are words only, the same size and nearly the same colour. A pre-reader can't choose. The stars and the two dinosaurs are good.
2. **Fact card for pre-readers (brief §4):** the facts are Bangla text and there is no `SpeakButton` anywhere in the game. A 4–5-year-old gets nothing from this screen without a reader. Add `<SpeakButton>` for the name and the one-line fact.
3. **Away and back (§7):** there is no pause, blur or hide handling. That's acceptable for a calm, turn-based game, except for the stuck stroke (bug 1).
4. **Pacing and a "boss" (§9):** the six levels differ only in which dinosaurs appear and how many bones (3 → 5). The way you play never changes. No level ends a set with a named moment, such as a giant skeleton across two digs. Confetti comes only at level 6.
5. **Choices (§4):** the সব লেভেল drawer shows numbers and stars but not which dinosaurs each level holds. A tiny silhouette per level would let a child pick "the T-rex one".
6. **First screen (§1):** good. The sand is the biggest thing, a ghost finger shows the first swipe, and the first bone comes up in a few seconds. The H1, lead and parent note push the board about 90 px down on a phone.
7. **Sound (§11):** good and mute-first. Soft brush hiss, pick and drop, a hum when the dinosaur stands, a win chime. There's no signature sound.
8. **Shared page frame:** under a kids' game, the related cards and the header link to adult games and tools in the child's view (brief §3: no outbound links in the child's view).

## Screenshots
- `.shots/dinosaur-sc-first.png`: Pixel 9, the dig with the ghost finger.
- `.shots/dinosaur-sc-build.png`: the build tray, with a bone picked.
- `.shots/dinosaur-sc-end.png`: the end screen, with three text-only buttons.
- `.shots/dinosaur-sc-showparent.png`: the ShowParent card (level 4). Orca's phone mode blanks part of the pane.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/dinosaur/Dinosaur.tla --view ai_docs/statecharts/dinosaur/view.ts --out ai_docs/statecharts/dinosaur/before-fix
rm -f ai_docs/statecharts/dinosaur/before-fix/tlc*.out
```
After the fixes:
- `WindowBlurs` clears `stroke`.
- `YouTabAndEnterBehindRest` is removed, because the game becomes inert while resting.
- `ParentOpensTheGate` closes on the next child action.
- The end screen's `Choices` get pictures.

Then re-run into `after-fix/`. All 9 rules must hold.
