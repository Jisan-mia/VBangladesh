# সৌরজগতের সফর statechart (before the rewrite)

Spec: `Sourojogot.tla` / `Sourojogot.cfg` / `view.ts`, mirrored from `tools/sourojogot/components/solar-game.tsx`, `tools/sourojogot/lib/levels.ts`, `shared/kids-kit.tsx` (ParentGate, ShowParent, useKidsSession, RestScreen), `shared/game-kit.ts` (useLevels) and `shared/site-shell.tsx` with `components/header-search.tsx`.

- **`before-fix/`** is the current code: the game, plus the kids' kit as of f4f75be + 23fd7c1 (2026-11-04 16:47). TLC found 144 states and 725 steps; the chart has 18 states and 42 arrows.
- **`before-kit-fix/`** is the same game against the kit at b51e328, which I checked live this morning before the kit changed. TLC found 476 states, and the chart there has 19 states and 35 arrows. Its three kit bugs are fixed now (see "Kit bugs found and already fixed").

This spec is the one place where the shared kit is modelled in full: the gate's hold timer, ShowParent's picture gate, and the header search. The দশ ঘাটের নৌকা and গল্পের মোড় specs point here.

## Systems modelled
- **Play phase:** a new round with nothing tapped yet → playing → finished (end card) → level menu. A round is cut down to its last right tap (tour, sort) or its last "শেষ দেখো" (size, far). Slips, stars and the gentle pace are pure functions with node tests, so they add no states here.
- **Daily limit:** today's time left or up. `atBreak()` runs at round end, and since 23fd7c1 also when the game opens. `begin()` never checks it. `extend(10)` sits behind the rest screen's own gate.
- **Rest screen:** a real modal since f4f75be. Nothing behind it hears a key, tap or focus.
- **Parent gate (বড়দের জন্য):** hold 2 s → a two-digit sum → open (share link and print link). It closes on থাক or বন্ধ করো, after two misses, after one use, after 60 s, or when the tab hides. `begin()` leaves it as it is.
- **আব্বু-আম্মুকে দেখাও:** shows only on the end card. ফোনে ছবি রাখো sits behind its own ParentGate.
- **Header search:** the site-wide free-text box. Focusing it loads the search code, and typing loads tile pictures.
- **Left out:** pause and focus. There is no clock, timer or loop in the game, so nothing advances while you're away (checked: no setTimeout or loop in `solar-game.tsx` apart from StarReveal, which cleans up on unmount). Also left out: sound (no loops; `sfx` reads `soundOn()`, and SpeakButton speaks only when tapped). Network and child data were checked live rather than modelled (below).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| NoRoundAfterTimeIsUp | Once today's time is up, no new round begins. | **breaks** |
| ShareNeverLeftOpenForTheChild | A share link a grown-up opened isn't still open when the child's next round starts. | **breaks** (for up to 60 s) |
| NoFreeTextForKids | There is no box the child can type into. | **breaks** (site shell) |
| NothingLoadsAfterStart | After the page loads, nothing more is fetched. | **breaks** (site shell) |
| RestOnlyAtBreak | The rest screen appears only between rounds, or as the game opens. | holds (broke at b51e328) |
| GateAsksOnlyAfterAFullHold | The sum appears only after a real 2-second hold. | holds (broke at b51e328) |
| RestNeverHidesBehindShowParent | The rest screen and আব্বু-আম্মুকে দেখাও never stack. | holds |
| SaveOnlyBehindTheGate | ফোনে ছবি রাখো exists only behind ছবিটা রাখো, on the end card. | holds |
| TypeOK, NoDeadlock | | hold |

## Bugs (current code)
All replays ran in my own Orca tab. The game ran inside a src-less iframe filled with the page's HTML, where a shim swapped `localStorage` for an in-memory store, so no test data reached the real browser storage. Orca pins `document.hidden`, and the shim also let me control it. Every number below is from the real page.

### 1. NoRoundAfterTimeIsUp: "the time was up, but আবার খেলো gave another whole round" (shared, kids kit)
- **Path (2 steps):** today's time runs out → you press আবার খেলো or pick a level: *Playing a round after today's time is up*.
- **Why:** `atBreak()` runs only in `finish()` and on mount. If the limit passes while the end card, the level menu or a round is on screen, `begin()` starts a new round without checking it.
- **Live (current kit):** with 600 s used, round 1 ended with no rest screen. The stored time then reached 900/900 s while the end card showed. আবার খেলো started a fresh round (0 of 4 planets done) with no rest screen. The rest screen came only after that whole second round. The same happens with the সব লেভেল drawer mid-round.
- **Fixed already:** opening the game past the limit now starts on the rest screen (live: `rest at once = true` with 900/900 s used). At b51e328, a reload gave a whole new round every time: level 1, then level 2 with 8 planets, both with no rest until the end.
- **Fix (shared):** make starting a round a break too. Export the kit's `pastLimit()` (or have `atBreak()` run before a round begins), and in `begin()` show `RestScreen` instead of the new round when it returns true. Every kids' game has the same আবার খেলো / level-pick path. Node test: limit passes on the end card → আবার খেলো → resting.

### 2. ShareNeverLeftOpenForTheChild: "the share link stayed open while my child started the next round" (shared, kids kit, low)
- **Path (4 steps):** you hold বড়দের জন্য → 2 s pass → a grown-up answers the sum → you press আবার খেলো: *Share link left open for the child*.
- **Why:** the page's ParentGate sits outside the game, so `begin()` doesn't touch it. It now closes after one use, 60 s, or a tab hide, but if the grown-up opens it and hands the phone back without using it, it stays open.
- **Live (current kit):** the gate opened ("চার আর সাত যোগ করলে কত?" → ১১). The child finished the round and pressed আবার খেলো 1.5 s later, and খেলাটার লিংক পাঠাও and the print link were still visible. The gate closed by itself **61 s** after opening. At b51e328 it never closed: it was still open mid-way through the next round.
- **Fix (shared):** let a game close its gates when a round begins. For example, give `ParentGate` a `closeKey` prop that closes it on change, and pass the round number. Or put the gate in an element that `begin()` re-keys.

### 3. NoFreeTextForKids and NothingLoadsAfterStart: "my child typed লুডু in the search and got the grown-ups' games" (shared, site shell)
- **Path (1 step):** you type in the site search.
- **Live:** the `<input type=search>` in the header ("গেম খোঁজো: ক্যারম, ludu…") is on every kids' page. Focusing and typing লুডু fetched `/_next/static/chunks/…js`, `/tiles/sap-ludu.webp` and `/previews/cholo-kheli.webp` after the page had loaded. The results offered সাপলুডু (an adult game) and চলো খেলি. Nothing about the child was in any request; they are same-origin static files. Even so, the brief says "no free-text input for the child" and "no network calls after the page loads". The "এগুলোও ভালো লাগতে পারে" grid also links the child's view to the flagship `/amar-chhotobela` and other non-kids tools.
- **Fix (shared):** `PageFrame` for category ছোটদের জন্য should show a kids' header with no search, and related tiles drawn only from kids' tools. Or move both below a ParentGate.

## Kit bugs found and already fixed (b51e328 → f4f75be / 23fd7c1)
These broke in `before-kit-fix/`. I replayed them live this morning, and they hold now. I checked again live at 16:5x.
- **GateAsksOnlyAfterAFullHold, "a short press opened the grown-ups' question":** holding Enter for 976 ms with 3 auto-repeats, then letting go, opened the sum at 2.68 s. A control press of 1.0 s did not. Two fingers lifted at 0.5 s also opened it at 2.2 s, because `start()` stacked timers and `stop()` cleared only the newest. **Now:** both cases give `question = false`.
- **The gate fell to random tapping:** with random pad taps after each hold, 12 of 16 openings passed within 400 taps (median 122, and 4 within 20 taps). One-digit sums (6–9) opened on a single right tap, with unlimited retries. **Now:** 25 holds, each followed by random taps until the gate shut, opened it 0 times. Sums are two-digit, and two misses close the gate.
- **RestOnlyAtBreak, "Tab got past the rest screen":** with trusted keys in Orca, Shift+Tab ×2 from the rest screen reached সব লেভেল, Enter opened it, and Enter on ১ started a fresh level-1 round (0 planets done) behind the rest screen. **Now:** the rest screen blocks keys and focus. In দশ ঘাটের নৌকা, Enter on the drawer no longer opens it under the rest screen.
- **The rest screen skipped by a reload:** see bug 1. It is fixed by the rest screen now showing on mount.

## Checked live and holding
- **No network, no child data:** a full run of all six levels, the end card and আব্বু-আম্মুকে দেখাও made no fetch, XHR or beacon, and loaded no resource after load. Storage held only `ektukhani-levels-sourojogot` (`{"1":3,…,"6":1}`), plus the shared kids-time and sound keys. Share sends `location.origin + pathname` only.
- **SaveOnlyBehindTheGate:** আব্বু-আম্মুকে দেখাও shows the card and a ছবিটা রাখো hold button. ফোনে ছবি রাখো is not in the DOM until that gate opens.
- **The ending:** আবার খেলো and শেষ are the same size (64 px). শেষ opens the level menu, and the next level never starts by itself.

## Quality-bar gaps (all six levels played in Orca at 412 px, plus reading the code)
1. **First screen:** good for a kids' game. The board, with a ghost finger on বুধ, is the biggest thing, and level 1 is won in 4 taps (`.shots/sourojogot-level1.png`). On a phone, the H1, lead and parent note push the board down by about 226 px.
2. **The ghost finger covers the middle choice:** in ফুটবল সূর্য: কত বড়?, the finger sits on "সরিষার দানা" until the first tap (`.shots/sourojogot-size-quiz.png`). Point it at an edge, or fade it after 2 s.
3. **The quiz screens are half empty:** below three choices sits a tall blank area, and the revealed planet is a dot under 1 px next to the football. Show a zoomed inset after a right answer so the "aha" is visible.
4. **Wrong guesses read as praise:** guessing at random (10–11 slips) still ends with "১০বার আবার ভেবেছ, তারপর ঠিকটা পেয়েছ।" and 1 star. After many slips, name one thing to try ("সূর্য থেকে গুনে দেখো") instead.
5. **Pacing:** six levels with four mechanics, and each level is 4 or 8 identical steps. There's no mid-level change and no final "build the whole system" round, and confetti only on level 6.
6. **Sound:** each planet plays a note one step higher on the pentatonic scale (good), a soft 330 Hz tone on a slip, and the win chimes. Mute silences all of them, and speech needs a tap.
7. **No outbound or adult links in the child's view:** fails because of the site shell (bug 3).
8. **Level select:** the drawer lets the child jump levels mid-round, with no confirmation, and that drops the round silently.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/sourojogot/Sourojogot.tla --view ai_docs/statecharts/sourojogot/view.ts --out ai_docs/statecharts/sourojogot/after-fix
rm ai_docs/statecharts/sourojogot/after-fix/tlc.out
```
The chart hides only reloads that land on a new round with time left (a reset from every state). Reloads onto the rest screen stay drawn.
