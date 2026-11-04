# দশ ঘাটের নৌকা statechart (before the rewrite)

Spec: `Nouka.tla` / `Nouka.cfg` / `view.ts`, mirrored from `tools/dosh-ghater-nouka/components/nouka-game.tsx` (turnSpinner, onGhat, restart, and the auto-step, bot-spin, pop/speak and end-of-race effects), `tools/dosh-ghater-nouka/lib/race.ts` and `shared/kids-kit.tsx`.

- **`before-fix/`** is the current code, with the kit as of f4f75be + 23fd7c1. TLC found 328 states and 1460 steps; the chart has 22 states and 35 arrows.
- **`before-kit-fix/`** is the same game against the kit at b51e328. There, MuteMeansSilent and RestOnlyAtBreak also broke; both are fixed in the kit now.

The gate's hold timer, ShowParent and the header search are the same shared code as সৌরজগতের সফর and are modelled in full in `../sourojogot/Sourojogot.tla`; here the gate is one step. A race that begins after today's time is up (NoRoundAfterTimeIsUp) is the same shared path as sourojogot's bug 1. I left it out here to keep the chart under 500 states. It still applies: আবার খেলো and নতুন খেলা never check the limit.

## Systems modelled
- **The race:** your turn → the চরকি spins (an 800 ms `setTimeout`) → you tap the ghats → আব্বু's turn (1 s, then his spin, then he counts one ghat every 850 ms) → … → your boat at ghat 10 → 900 ms later `levels.record()`, the win sound, `atBreak()` and the end card. A turn is cut down to "spin, then count to where it stops".
- **Restarts:** ফোন চালাবে / বড়রা চালাবে (live only while playing; tapping the one already on also restarts), the সব ধাপ drawer, আবার খেলো and নতুন খেলা. `restart()` clears neither the pending spin timeout nor anything else outside `race`.
- **Away and back:** you leave (blur or hide) and come back. Nothing in the game reads visibility or focus.
- **Sound:** the site switch, and the spoken numbers (`speak()`, which needs a Bangla voice). Since b51e328, `speak()` reads `soundOn()`.
- **Daily limit and rest screen:** today's time left or up, counted only while the tab is visible and focused. `atBreak()` runs only inside the 900 ms end timer. The rest screen is a real modal.
- **Parent gate:** the share link below the game. It closes on বন্ধ করো, after one use, after 60 s, or on a hide.

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| NothingRunsWhileAway | While you're away, আব্বু's turn doesn't run on by itself. | **breaks** |
| FreshRaceStartsClean | A new race starts with no spin set; only your own spin sets one. | **breaks** |
| EveryFinishedRaceCounts | A race your boat finished is recorded, and the daily break is checked. | **breaks** |
| NoShareLinkDuringARace | The share link isn't open in front of the child during a race. | **breaks** (for up to 60 s) |
| MuteMeansSilent | With sound off, no number is spoken. | holds (broke at b51e328) |
| RestOnlyAtBreak | The rest screen appears only after a race. | holds (broke at b51e328, by Tab) |
| TypeOK, NoDeadlock | | hold |

## Bugs (current code)
I replayed these in Orca, in my own tab. The page ran in a src-less iframe with an in-memory `localStorage` shim and a controllable `document.hidden`. I counted sounds by wrapping `OscillatorNode.prototype.start`, and read positions from the `.dg-line` aria-label ("তোমার নৌকা N নম্বর ঘাটে, আব্বু M নম্বর ঘাটে"). The game code hasn't changed since these replays, so they stand for the current code.

### 1. FreshRaceStartsClean: "I pressed বড়রা চালাবে while the চরকি spun, and the new race already had a number" (game)
- **Path (3 steps):** you spin your চরকি → you tap a mode button or a ধাপ: *the last race's চরকি still spinning* → the চরকি stops: *Your turn, a spin you never made is set*.
- **Why:** `turnSpinner()` schedules `setTimeout(() => setRace(current => spin(current, value)), SPIN_MS)` without keeping the id. `restart()` doesn't clear it, so it lands on the new race. The same happens with আব্বু's spin: his botSpin value lands on your turn in the new race.
- **Live:** at the start, the dots were `[null, null]` and the spinner was active. I pressed the spinner, and 200 ms later pressed বড়রা চালাবে: new race at the jetty, dots `[null, null]`. 900 ms later: your dots read "**১ ঘাট যাবে**", the spinner was inactive, and the target was "১ নম্বর ঘাট". You never spun in that race.
- **Fix (game):** keep the spin timeout in a ref, and clear it (and `setSpinning(null)`) in `restart()` and on unmount. Better, run the spin through a race id: drop the landing if `current !== raceAtSpin`. Node test: spin, restart, land → `race.spin === null`.

### 2. EveryFinishedRaceCounts: "my boat reached ১০, I tapped a button and the race was never counted, and the rest check was skipped too" (game)
- **Path (4 steps):** spin → the চরকি stops → you tap the ghats to where it stops (your boat at the last ghat, card coming) → you tap a mode button or a ধাপ: *a finished race never counted*.
- **Why:** the end-of-race effect (`[race]` deps) waits 900 ms before `levels.record()`, `setToday()`, `atBreak()` and `setPhase("end")`. `restart()` changes `race`, so the cleanup cancels the timer. The mode buttons are live until the end card covers them.
- **Live, 900/900 s used today:** the control race (25–29 s, autopilot) ended with the end card, the rest screen, and stars `{"1":3}` saved. In the replay I tapped বড়রা চালাবে **0 ms** after the boat reached ১০. Two seconds later there was no end card, **no rest screen**, stars `none`, and a fresh race at the jetty. So a child past the limit can keep finishing races and never see the rest screen.
- **Fix (game):** record and call `atBreak()` at once when `race.over` first becomes true (in the same `setRace` path, or an effect keyed on `race.over` that doesn't re-run on restart). Delay only the card. Or disable restarts while `race.over && phase === "play"`.

### 3. NothingRunsWhileAway: "I left during আব্বু's turn, and his boat counted two ghats without me" (game)
- **Path (4 steps):** spin → stops → you tap the ghats (আব্বু's turn) → you leave (another window or tab).
- **Why:** আব্বু's spin (1 s), his landing (800 ms) and his counting (850 ms a ghat), plus the child's own predict-mode auto-count, are plain `setTimeout`s gated only on `phase`, `race` and `spinning`. Nothing reads `document.hidden` or blur. The game is about hearing every number, so a turn that counts while nobody watches loses the point. It also plays the notes, and the words if sound is on, into a hidden tab.
- **Live:** at "তোমার নৌকা ৪ নম্বর ঘাটে, আব্বু ১ নম্বর ঘাটে", I sent blur and hid the tab (iframe). **5 s later:** "আব্বু **৩** নম্বর ঘাটে", and it was your turn again with the spinner active. You came back to a turn that had already happened.
- **Fix:** use the shared game player's pause (`useGameLoop` pauses on blur since 6775639), or have each bot timer wait while `document.hidden || !document.hasFocus()` and resume on `focus`/`visibilitychange`. A turn-based kids' game needs no pause screen; holding the bot is enough.

### 4. NoShareLinkDuringARace: "the share link sat under the race after a grown-up opened it" (shared, kids kit, low)
- **Path (1 step):** a grown-up opens বড়দের জন্য (mid-race, or on the end card followed by আবার খেলো).
- **Live:** the gate opened ("ছয় আর পাঁচ যোগ করলে কত?" → ১১). The race went on to "তোমার নৌকা ১ নম্বর ঘাটে", and খেলাটার লিংক পাঠাও was still visible. The kit now closes it within 60 s (measured 61 s in সৌরজগতের সফর).
- **Fix (shared):** same as sourojogot bug 2: close the page's gate when a race starts.

### Also found (not a rule in the spec): tapping the mode that's already on wipes the race (game)
- **Live:** mid-race at "তোমার নৌকা ৬ নম্বর ঘাটে, আব্বু ৩ নম্বর ঘাটে", I tapped ফোন চালাবে, which was already pressed (`aria-pressed=true`). Result: "তোমার নৌকা শুরুর জেটিতে, আব্বু শুরুর জেটিতে". The buttons sit right under the river, in a child's reach (`.shots/dosh-ghater-nouka-race.png`).
- **Fix:** ignore a tap on the current mode, and move the mode choice before the race or behind a small confirmation. That also closes the tap path in bug 1 and bug 2.

## Kit bugs found and already fixed
- **MuteMeansSilent:** at b51e328, `speak()` ignored the sound switch, and every ghat would be spoken with sound off on a phone with a Bangla voice. **Now (live, with a stubbed bn-BD voice):** sound off gave 0 utterances and 0 tones over your turn and আব্বু's turn. Sound on gave "এক", "দুই", "এক".
- **RestOnlyAtBreak:** at b51e328, Tab from the rest screen reached সব ধাপ behind it (live: focus went from the rest screen's gate to the "সব ধাপ" summary). **Now:** the rest screen is a real modal, and Enter on the drawer did nothing under it.

## Checked live and holding
- **No network, no child data:** the game code has no fetch, XHR, beacon, `/api` or share-client (grep), and the shimmed frame logged no fetch, XHR or beacon calls during the replays. Storage holds `ektukhani-levels-dosh-ghater-nouka` only, plus the shared kids-time and sound keys. The ShowParent card shows only today's counts.
- **RestOnlyAtBreak:** a race finished past the limit shows the rest screen over the end card (`.shots/dosh-ghater-nouka-rest-after-race.png`).

## Quality-bar gaps (level 1 autoplayed to the end in Orca at 412 px, plus the code)
1. **First screen:** the চরকি and the glowing first ghat are clear, and a ghost finger shows on the very first turn and again after 6 s idle. But the top bar crowds three things into one line (ধাপ title, ধীরে খেলো, sound), and the mode switch sits inside the play area (see "Also found").
2. **Level 1 takes about 25–30 s of pure waiting:** with instant taps, আব্বু's 1 s + 0.8 s + 0.85 s per ghat dominates, so a 10-ghat race is 8–10 turns. For 3–6 year olds that is a lot of watching. A faster আব্বু once the child has heard a number a few times would help.
3. **Away and back:** the bot doesn't stop (bug 3).
4. **The camera** shows three ghats around your boat. The overview line on top is the only place the whole river shows, and it's a thin 1-px bar with small labels.
5. **Ending:** the card line "তোমার নৌকা আগে ১০ নম্বর ঘাটে পৌঁছাল!" makes the race about winning, though stars measure counting (correct by the brief). আবার খেলো and শেষ have different styles (primary vs secondary), not "equal size" as the brief asks.
6. **Sound:** a note one step higher per ghat and a tick run for the spinner, all synthesized and muted correctly. Spoken numbers depend on a Bangla voice, which Orca and most desktops don't have.
7. **Pacing:** five ধাপ (10 ghats, then 20), and predict mode on ধাপ 3 and 5 is the only new idea. There's no "যোগ করো" step between counting and predicting.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/dosh-ghater-nouka/Nouka.tla --view ai_docs/statecharts/dosh-ghater-nouka/view.ts --out ai_docs/statecharts/dosh-ghater-nouka/after-fix
rm ai_docs/statecharts/dosh-ghater-nouka/after-fix/tlc.out
```
The chart hides no steps.
