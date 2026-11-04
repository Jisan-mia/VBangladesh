# পৃথিবী ঘুরি statechart (before the rewrite)

Kids' game (ছোটদের জন্য, ৬–১২). Spec: `PrithibiGhuri.tla` / `PrithibiGhuri.cfg` / `view.ts`, mirrored from `tools/prithibi-ghuri/components/ghuri-game.tsx`, `shared/kids-kit.tsx` (commits f4f75be and 23fd7c1) and `shared/site-shell.tsx`. Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 329 states. The chart draws 23 states and 49 arrows.

The chart hides some steps:
- the trip-number grid mid-trip (it resets from every state, like আবার খেলো);
- the reload from every state except the map, the rest screen and the আমার ছোটবেলা page;
- the flagship card from every state except the map.

This spec also holds the shared kids' rules that are the same code on every kids' page: the parent gate, the related-tool cards, and "a new round after time ran out". The `chhorar-tal` and `ammur-number` specs leave these rules out to stay under 500 states and point here. The live replays ran on all three pages.

## Systems modelled
- **The trip:** map → plane flying → postcards → stamp question → right picture (700 ms timer) → stamp page → done screen (আবার খেলো / শেষ) → আজকের মতো হলো. One country stands for a trip's three, and two postcards stand for five. A wrong pick changes nothing that the model tracks.
- **Keys:** Enter held on পরেরটা, and its auto-repeat. Focus stays on পরেরটা, because one button serves every card. It falls to the page when the question or the stamp page replaces it.
- **The trip grid** under the game (startTrip, at any time).
- **The daily limit:** time runs out (the 10 s tick); `atBreak()` at the end of a trip; the rest screen (a real modal since f4f75be); a parent's ১০ more minutes. Since 23fd7c1, a page that opens past the limit opens on the rest screen.
- **The parent gate** under the game: a parent opens it and hands the phone back; a child mashes it; it closes on বন্ধ করো, after 60 s, when the tab hides (f4f75be), or after one grown-up action inside it (23fd7c1).
- **Leaving:** the related-tool cards under the game, and a reload or coming back.

Not modelled:
- **Window focus and tab visibility.** The game has no clock. The flight is a 1.8 s animation that rAF freezes in a hidden tab, and the 700 ms stamp timer firing while away changes nothing that the player sees.
- **Sound.** There are only one-shot `sfx` sounds, with no loops. `SpeakButton` appears only with a Bangla voice.
- **Star values.** `recordLevel` keeps the higher value (`shared/tests/game-kit.test.ts`).

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| PostcardsAreNotSkipped | Every postcard stays on screen until the child chooses to move on. A held key never flips past one. | **breaks** |
| HeldKeyNeverActsOnTheCard | A key held through the end of a trip never acts on the done screen. | holds |
| NoDoubleResult | A trip is recorded once. | holds (checked live) |
| RestOnlyAtBreak | The rest screen comes only between trips: on the fresh map, the done screen or আজকের মতো হলো. | holds (checked live) |
| NoNewRoundPastLimit | Once today's time is up, no new trip starts before the rest screen. | **breaks** (shared) |
| GateNeedsAnAdult | Only a grown-up opens বড়দের জন্য. | **breaks**, much narrower since f4f75be (shared) |
| GateClosesBehindTheParent | When the parent hands the phone back, the share link is behind a closed gate. | **breaks** for up to 60 s (shared) |
| NoOutboundForKids | Nothing leads from the kids' page to a grown-up tool with share buttons without the gate. | **breaks** (shared) |
| NoNetwork / NoChildData | Nothing is sent and nothing about the child is stored beyond progress. | holds (from the code; not in the spec, see below) |
| NoReadingNeeded | Ages 3–5 only. This game is for 6–12. | not applicable |

## Bugs
Replays ran in Orca on 2026-11-04 between 16:49 and 16:59 (+06), against the code as of 23fd7c1.

### 1. PostcardsAreNotSkipped (game-specific)
- **The player's version:** "I held Enter and the postcards flew past, then it asked me which place I saw in India."
- **Path:** tap a country → the plane lands → hold Enter on পরেরটা → the held key repeats (4 steps).
- **Why:** `nextCard()` is the click handler of one পরেরটা button for all five cards. That button keeps focus, so every repeated Enter keydown clicks it again. No guard against key repeat, and no minimum time per card.
- **Live replay (Orca, 16:49):** trip 1, ভারত. I focused পরেরটা and sent trusted Enter presses. One press moved হ্যালো বলো → খাবার. Four more quick presses moved দেখার জায়গা (35302 ms) → প্রাণী (35962) → আমাদের মতোই (36613) → the question "ভারতে কোন জায়গাটা দেখলে?" (37131). Three cards went past in 1.8 s, with the gap set by the CLI's speed. A real auto-repeat at about 30 Hz is faster. Orca's `keydown` alone (without `keypress`) doesn't activate a button, so the replay used rapid full presses to stand in for auto-repeat.
- **Fix:** ignore `event.repeat` on পরেরটা (`onKeyDown` that calls `preventDefault` on a repeat), and ignore a click within about 400 ms of a card change. The rewrite on the shared player should route Enter through the player, not through whichever button has focus.

### 2. NoNewRoundPastLimit (shared, kids-kit)
- **The player's version:** "Her time was up while she sat on the map, and she still played a whole trip before the rest screen came."
- **Path:** today's time runs out → tap a trip number (2 steps). আবার খেলো on a done screen reached before the limit does the same.
- **Why:** `atBreak()` runs only in `finish()`. Since 23fd7c1, opening a page past the limit shows the rest screen, so the reload path is closed. Starting a trip still never checks.
- **Live replay (16:59):** I loaded the page with kids-time = 0 and no rest screen. Then I set `ektukhani-kids-time` to 1000 s (limit 900 s) to stand for time running out on the map, and tapped trip ১. The trip started with no rest screen. I flew to ভারত, নেপাল and ভুটান (each landing 2149–2151 ms) and took three stamps. The rest screen came only on the done screen.
- **Fix:** call `atBreak()` at the start of each trip too (`startTrip`, আবার খেলো, the trip grid). The rewrite prompt (1191cab) already asks for this.

### 3. GateNeedsAnAdult (shared, kids-kit)
- **The player's version:** "My son held the বড়দের জন্য button and tapped numbers until it opened."
- **Path:** the child keeps holding বড়দের জন্য and mashing the pad (1 step).
- **Why:** since f4f75be the sum is 10–18 and two misses close the gate, so one random two-digit answer is right about 1 time in 100. Every answer starts with ১, so a child who learns that is right 1 time in 10. The hold can be repeated as often as the child likes.
- **Live replay (16:51):** a scripted child repeated hold 2 s, random digit taps, hold again. Run 1 opened the gate after **4 holds and 16 taps (9 s)**. That was a lucky draw: the expected rate is about 50 holds, or 2 minutes. A second, longer run was cut off by a page reload (HMR from another agent's edit) before it finished.
- **Fix:** after two closed attempts, lock the gate for a minute. Better still, use a gate a child can't brute-force: a hold, then a question with no visible pad, such as dragging a number to a spot named in words.

### 4. GateClosesBehindTheParent (shared, kids-kit)
- **The player's version:** "I opened the gate to read it, gave the phone back, and the share button was still there."
- **Path:** a parent opens বড়দের জন্য and hands the phone back without touching anything inside (1 step).
- **Why:** since 23fd7c1 the gate shuts after one action inside it. With no action, it stays open until বন্ধ করো, the 60 s timer, or the tab hiding.
- **Live replay (16:50):** I held the gate 2 s and answered "আট আর সাত যোগ করলে কত?" with ১৫. It opened and showed "খেলাটার লিংক পাঠাও". It was still open at 30 s, and closed by 62 s.
- **Fix:** close the gate when anything outside it is touched (a capture `pointerdown` outside the open gate), not only on a timer.

### 5. NoOutboundForKids (shared, site-shell)
- **The player's version:** "Under the game there's a card for আমার ছোটবেলা. She tapped it and landed on a grown-up's quiz with share buttons."
- **Path:** tap the আমার ছোটবেলা card under the game (1 step).
- **Why:** `PageFrame` always puts the flagship first in "এগুলোও ভালো লাগতে পারে", including on kids' pages.
- **Live check (16:59):** the related cards on `/prithibi-ghuri` link to `/amar-chhotobela`, `/chhorar-tal` and `/ammur-number`. On `/chhorar-tal` they link to `/amar-chhotobela`, `/ammur-number` and `/sur-banai`. On `/ammur-number` they link to `/amar-chhotobela`, `/sur-banai` and `/borno-likhi`. `/amar-chhotobela` has three "লিংক পাঠাও" share controls.
- **Fix:** on a ছোটদের জন্য page, show only kids' tools in the related grid, and put links to grown-up tools behind the gate or in the parent note.

### Rules that hold
- **RestOnlyAtBreak:** at the end of the 16:59 trip, the rest screen covered the done screen. In the same session on `/chhorar-tal` (16:54, same shared `RestScreen`), Tab, Tab, Tab, Enter and Space started nothing. A trusted click on the drum was refused, because the rest screen covered it. One small leak: after Tab, `document.activeElement` was the বড়দের জন্য button **under** the rest screen (`.ct-gate`). Its keys are swallowed, so nothing happens, but a screen reader would follow focus there (shared).
- **NoDoubleResult:** the trip saved `ektukhani-levels-prithibi-ghuri` = `{"1":3}` once, with ★★★ and "আজ ৩টা দেশ ঘুরলাম।".
- **NoNetwork / NoChildData (from the code, not replayed here):** pictures and flags load as `data:` SVG URLs, and fonts come from the site's own fonts through `document.fonts.load`. There's no `fetch`, tally or `/api` call. The share link is the plain address behind the gate. The only stored value is the stars. This rule isn't in the spec: no action of this game sends anything, so a variable for it would never change.

## Quality-bar gaps (one full trip in Orca, desktop width)
1. **First screen.** The map and three country cards fill the game box, with the ghost finger on ভারত. That's good. But on desktop the box is a narrow column, and the H1, lead and parent note sit above it. The start isn't the biggest thing on the page.
2. **No pause or menu.** No pause button, P or Esc. That matters little here, with no clock, but the bar wants one place for শব্দ, ধীরে খেলো and সব সফর.
3. **One tap drops a trip.** The trip grid under the game restarts at once, mid-visit, with no confirm and no "continue where you were".
4. **The postcards read like a slideshow.** Five cards, one "পরেরটা" each, and nothing to do on them. A child who can't read waits for an adult. Sound adds nothing: no greeting is spoken unless the phone has a Bangla voice.
5. **The choice is not numbered,** and has no keyboard path besides Tab. After the question replaces পরেরটা, focus falls to the page, and Enter does nothing until you Tab through the header.
6. **The ending.** The done screen shows ★★★, three mini stamps with the hello word, আবার খেলো / শেষ at equal size and আব্বু-আম্মুকে দেখাও. That's good, but confetti is saved for the full set and there's no named finale for the last trip (আমেরিকা).
7. **Sound:** whoosh, drop, tap, pick, good and thud are one-shots. No signature sound and no gentle loop for the flight.
8. **Pacing:** six trips of three countries each. The only new idea after trip 3 is a fourth picture. The ask types (food, place, animal, flag) rotate, but no trip has its own twist.

Screenshots: `.shots/prithibi-ghuri-first-screen.png` (the map, trip 1, ghost finger) and `.shots/prithibi-ghuri-rest.png` (the rest screen after the trip past the limit).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/prithibi-ghuri/PrithibiGhuri.tla --view ai_docs/statecharts/prithibi-ghuri/view.ts --out ai_docs/statecharts/prithibi-ghuri/<new-folder>
rm ai_docs/statecharts/prithibi-ghuri/<new-folder>/tlc*.out
```
