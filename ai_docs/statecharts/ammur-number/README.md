# আম্মুর নম্বর statechart (before the rewrite)

Kids' game (ছোটদের জন্য, ৪–৮). Spec: `AmmurNumber.tla` / `AmmurNumber.cfg` / `view.ts`, mirrored from `tools/ammur-number/components/number-game.tsx`, `tools/ammur-number/lib/game.ts` and `shared/kids-kit.tsx` (commits f4f75be and 23fd7c1). Output: `before-fix/report.md` and `before-fix/chart.mmd`. TLC reached 430 states. The chart draws 30 states and 67 arrows, with no steps hidden.

Three shared kids' rules are modelled once, in `ai_docs/statecharts/prithibi-ghuri/`, and break the same way here:
- the gate under the game (GateNeedsAnAdult, GateClosesBehindTheParent);
- the related cards (NoOutboundForKids: the first card here is আমার ছোটবেলা);
- NoNewRoundPastLimit.

On this page an open বড়দের জন্য also holds the number form and "নম্বর মুছে দাও", so while it stays open a child can wipe or change the number.

## Systems modelled
- **The round, at ধাপ ৩ (দেখে, তারপর লুকিয়ে):** no number → the parent sets it behind নম্বর দাও (or নমুনা নম্বরে দেখো) → the piece plays and lights → the digits hide → the child dials → a 1 s rest → the longer piece plays → … → the ring and a 1.7 s wait → the end screen (আবার খেলো / শেষ / পরের ধাপ) → ফোন রেখে দিলাম. Two pieces stand for four, and a piece is dialled in one step. Misses are left out, because they only change the stars.
- **The look:** আবার দেখাও (`peek` + `listen(next, true)`), tapped, or with Enter held and auto-repeating.
- **Switching:** আব্বু / আম্মু (`pickWho`) and the সব ধাপ grid both call `start()` mid-round.
- **The window:** there's no handler at all. Leaving is modelled while the digits play and during the 1 s rest.
- **The spoken number:** `SpeakButton` next to the rhyme line. It shows only with a Bangla voice, and `speak()` takes the first `bn` voice, whatever its `localService`.
- **The daily limit:** time runs out; `atBreak()` in the end timer; the rest screen (a modal since f4f75be); a parent's ১০ more minutes.

## Rules in plain words
| Rule | Says | Result |
|---|---|---|
| NoProgressWhileAway | The digits play and hide only while the child is on the page. | **breaks** |
| OneLookOneHelp | One look costs one help. Tapping আবার দেখাও again while the digits already show (a double tap, a held Enter) doesn't charge again. | **breaks** |
| EveryFinishCounts | A number dialled to the end is always recorded and checked against the daily limit. | **breaks** |
| NoChildData | The parent's number never leaves the phone. | **breaks** (with a network Bangla voice) |
| NoReadingNeeded | A 4–5 year old who missed the look gets it back by picture or sound, not by reading আবার দেখাও. | **breaks** |
| RestOnlyAtBreak | The rest screen comes only between rounds. | holds since f4f75be |

Two more checks, not in the spec:
- **A key held through the ring doesn't skip the end screen.** The held key is on a pad key under the `.an-over` panel, and `tap()` returns outside `"play"`.
- **The number is never stored.** Checked live, below.

## Bugs
Replays ran in Orca on 2026-11-04, 16:51–16:53 (+06), on 23fd7c1. To reach ধাপ ৩ I set this game's own key, `ektukhani-levels-ammur-number` = `{"1":3,"2":3}`, and removed it afterwards.

### 1. NoProgressWhileAway (game-specific)
- **The player's version:** "The phone buzzed, I looked away for a second, and when I looked back all the boxes were empty. I never saw the number."
- **Path:** a parent sets the number → you leave (another window or the tab hides) → the digits finish playing and hide (3 steps). Leaving in the 1 s rest does the same: the next piece plays while you're away.
- **Why:** `listen()` is a chain of `setTimeout`s, and the piece/end effect uses timers too. Nothing listens for `blur` or `visibilitychange`. At ধাপ ৩ the playback is the only look that doesn't cost a help.
- **Live replay (16:51):** demo number at ধাপ ৩, with `blur` dispatched 50 ms after the start (Orca pins `document.hidden`; the code has no handler for either). While away, boxes 0, 1 and 2 lit at 209, 589 and 971 ms, three digit notes played, and the light went out at 1617 ms. On return all three boxes were `is-hidden`, and the prompt said "লুকানো ৩টা অঙ্ক মনে থেকে চাপো।".
- **Fix:** pause the playback and the piece/end timers on blur or hide, and replay the current piece from its first digit on return. The shared player does this for games on it, so moving this game onto the player covers it.

### 2. OneLookOneHelp (game-specific)
- **The player's version:** "He tapped আবার দেখাও twice because nothing happened fast enough, and lost a star for one look."
- **Path:** a parent sets the number → you tap আবার দেখাও while the digits are playing (2 steps). Holding Enter on it charges once for every repeat.
- **Why:** `lookAgain()` calls `peek()`, which adds a help whenever anything is hidden, even while a look is already playing. Stars are `starsFor(misses + helps, 1, 4, true)`: ★★★ for at most one help.
- **Live replay (16:52):** ধাপ ৩, demo number. I tapped আবার দেখাও, then 150 ms later, while "শোনো আর দেখো…" was showing, tapped it again. Then I dialled all 11 digits with **no misses**. The end screen showed "৩টার মধ্যে ২টা তারা". The record was `{"1":3,"2":3,"3":2}`, where one look would have kept ★★★.
- **Fix:** don't charge, and don't restart, while a look is already playing (`if (lit?.show) return`). Ignore `event.repeat` on the button.

### 3. EveryFinishCounts (game-specific)
- **The player's version:** "She dialled the whole number, the phone rang, she tapped ধাপ ১ right away, and the stars for ধাপ ৪ never came."
- **Path:** set the number → dial → the next piece plays → dial the whole number → tap আব্বু or a ধাপ during the ring (5 steps).
- **Why:** the 1.7 s end timer lives in a `[round, phase]` effect. `start()` sets a new round, so the cleanup clears the timer: no `levels.record`, no `atBreak()`.
- **Live replay (16:52):** from the ধাপ ৩ end screen I tapped পরের ধাপ to reach "ধাপ ৪ পুরোটা মনে থেকে", and dialled 01700000000 to the ring. 300 ms later I tapped ধাপ ১ in সব ধাপ. 2.5 s on: no end screen, no rest screen, the page on "ধাপ ১ দেখে দেখে", and the record still `{"1":3,"2":3,"3":2}`, with no ধাপ ৪.
- **Fix:** record and run `atBreak()` the moment the last digit is dialled, and keep the ring and the 1.7 s wait for show only. Or ignore switches while ringing.

### 4. NoChildData (game-specific, through the shared `speak()`)
- **The player's version:** "The speaker reads my number aloud, and on Chrome that voice is an online one, so my number goes to a speech server."
- **Path:** a parent sets the number → you tap 🔈 on a phone whose Bangla voice is online (2 steps).
- **Why:** `SpeakButton text={rhyme(round.number, length)}` speaks the digits as words. `speak()` picks the first `bn` voice and never checks `voice.localService`. Chrome's "Google" voices are network voices.
- **Live replay (16:52):** Orca has no voices, so I stubbed one `bn-BD` voice with `localService: false` and fired `voiceschanged`. The 🔈 button appeared ("শোনো: শূন্য-এক-সাত"). One tap passed "শূন্য-এক-সাত" to `speechSynthesis.speak` with that voice (`local: false`). With a real number, later pieces read out all 11 digits.
- **Fix:** in `speak()` (or only for this game), use only voices with `localService === true`. Hide the speaker otherwise.
- **Also checked live (16:53):** I set 01712345678 through the বড়দের জন্য form. The number wasn't in `localStorage`, `sessionStorage`, the URL, `document.cookie` or `history.state`. No resource was requested in the 3 s around it. The gate closed after "খেলা শুরু করো".

### 5. NoReadingNeeded (game-specific)
- **The player's version:** "My 4-year-old can't read 'আবার দেখাও'. When she misses the look, she's stuck with empty boxes."
- **Path:** as bug 1 (3 steps): a look missed, then empty boxes. The only way back is a text-only button.
- **Why:** `<button class="an-key an-look">আবার দেখাও</button>` has no icon and no sound. The ghost finger points only to the next digit after two misses or 7 s idle. It never points to আবার দেখাও.
- **Fix:** give আবার দেখাও an eye icon, and let the ghost finger point to it when the boxes are hidden and nothing has been dialled for a few seconds.

### Rules that hold
- **RestOnlyAtBreak:** the end timer calls `atBreak()` before the end screen, and the rest screen is the shared modal. The keyboard check is in `chhorar-tal/README.md` (16:54): Tab, Enter and Space did nothing under it, but focus leaked to the বড়দের জন্য button behind it.

## Quality-bar gaps (rounds at ধাপ ১, ৩ and ৪ in Orca, desktop)
1. **The first screen needs a grown-up.** The phone art, one line, the নম্বর দাও hold-gate and a small নমুনা নম্বরে দেখো button. That's right for the subject, but the demo, which is the only thing a child can start, is the smallest control.
2. **Nothing pauses** (bug 1), and there's no pause menu. শব্দ and ধীরে sit in the top bar, which is fine.
3. **Tapping during the playback cuts the look short.** `tap()` calls `stopListening()`, so an eager child at ধাপ ৩ wipes their only free look with the first tap.
4. **The HUD is good:** ধাপ and label top-left, the number screen with grouped boxes, one prompt line, and a big pad with 96 px keys. The message line under the pad ("উঁহু, আরেকবার ভাবো।") is text only. The shake carries the meaning for pre-readers, which works.
5. **The ending:** stars, one praise line only for a clean round, আবার খেলো / শেষ / পরের ধাপ, and আব্বু-আম্মুকে দেখাও. That's good. The off-screen ending ("এবার আম্মুকে নম্বরটা মুখে বলে শোনাও") is right for the brief.
6. **Choices:** পরের ধাপ is a plain secondary button with a label. Nothing says what changes (more hidden, sound only) beyond the label.
7. **Sound:** a tone per digit, so the number becomes a tune. That's the signature, and good. The ring at the end works. Misses get a soft tone. All five work on mute through lights and shake.
8. **Desktop layout:** the game sits in a narrow left column with empty space to the right (`.shots/ammur-number-play.png`).

Screenshot: `.shots/ammur-number-play.png` (ধাপ ১ with a parent-entered number, the ghost finger on ০ and the 🔈 from the stubbed voice).

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/ammur-number/AmmurNumber.tla --view ai_docs/statecharts/ammur-number/view.ts --out ai_docs/statecharts/ammur-number/<new-folder>
rm ai_docs/statecharts/ammur-number/<new-folder>/tlc*.out
```
