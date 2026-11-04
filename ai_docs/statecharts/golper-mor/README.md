# গল্পের মোড় statechart (before the rewrite)

Spec: `Golper.tla` / `Golper.cfg` / `view.ts`, mirrored from `tools/golper-mor/components/golper-game.tsx` (open, next, choose, done, go, the shelf, end and reader views, and `if (resting) return <RestScreen>`), `tools/golper-mor/lib/progress.ts` (readProgress, finish) and `shared/kids-kit.tsx`.

- **`before-fix/`** is the current code, with the kit as of f4f75be + 23fd7c1. TLC found 357 states and 1433 steps; the chart has 22 states and 62 arrows.
- **`before-kit-fix/`** is the kit at b51e328. The only difference there: a reload after the limit gave a whole new story.

One story with its two turns (side 0, 1) stands in for nine. The gate's hold timer and the header search are the shared code modelled in `../sourojogot/Sourojogot.tla`.

## Systems modelled
- **Reading:** shelf → reading up to the মোড় → a turn chosen → reading that turn → গল্প শেষ (`done()`: save, end page, `atBreak()`) → অন্যটা বেছে দেখো / আবার পড়ো / শেষ. ← সব গল্প leaves from any page.
- **Read marks and a second tab:** `done()` writes `finish(progress, …)`, built from this tab's in-memory progress, over the saved copy. A second tab, opened before any reading, finishes turn ২ of the story and writes its own copy. A reload reads the saved marks.
- **Daily limit and rest screen:** the time counts only while the tab is visible and focused. `atBreak()` runs only in `done()`, and on mount since 23fd7c1. The rest screen replaces the whole tool, and extend brings back the same page.
- **Gates:** the shelf's বড়দের জন্য (share link, পড়ার দাগ মুছে দাও) unmounts when a story opens. আব্বু-আম্মুকে দেখাও exists only on the end page, with ফোনে ছবি রাখো behind its own gate.
- **Left out:** pause and focus. The reader has no clock, timer or loop, so nothing moves while you're away. Also left out: sound (taps only, `sfx` reads `soundOn()`, speech needs a tap) and clearing the marks (a grown-up action behind the gate).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| ReadMarksNeverVanish | Every turn read, in any tab, is still marked "পড়া হয়েছে" after a reload. | **breaks** |
| NoStoryAfterTimeIsUp | Once today's time is up, no new story starts. | **breaks** |
| RestOnlyAtBreak | The rest screen appears only on the end page or as the tool opens. | holds |
| ShareOnlyOnTheShelf | The share link exists only on the shelf, never in a story. | holds |
| ShowParentOnlyAtTheEnd | আব্বু-আম্মুকে দেখাও appears only on the end page. | holds |
| TypeOK, NoDeadlock | | hold |

## Bugs (current code)
I replayed these in Orca, in my own tab. Each tab of the game ran in its own src-less iframe, and both frames shared one in-memory `localStorage` shim (the real storage was never touched).

### 1. ReadMarksNeverVanish: "we read the টিফিন story on the phone, my child read another one in a second tab, and the টিফিন mark was gone" (game)
- **Path (4 steps):** you open the story → you pick a turn at the মোড় → you press গল্প শেষ (saved: turn ১) → in another tab you finish turn ২: *A turn you read lost its mark. Saved: turn ২, this tab shows turn ১*.
- **Why:** `done()` builds the new progress from this tab's React state, loaded once on mount, and overwrites the key. Any tab that loaded earlier wipes what other tabs saved since. (`useLevels.record()` in the other games re-reads storage before writing, so it doesn't have this bug.)
- **Live:** frame A and frame B both opened on an empty shelf. A read "পড়ে যাওয়া টিফিন", turn ১, to the end, and saved `{"read":{"tiffin":[0]}, "today":["tiffin"]}`. B read "নতুন ছেলে মং", turn ১, and saved `{"read":{"notun":[0]}, "today":["notun"]}`. **A's shelf before reload:** "৯টার মধ্যে ১টা পড়া হয়েছে", mark on book 1. **After reload:** "৯টার মধ্যে ১টা পড়া হয়েছে", mark on **book 2 only**. The টিফিন mark and its "today" entry for the parent card are gone.
- **Fix (game):** in `done()` and `clear()`, read the saved value (`readProgress(localStorage.getItem(PROGRESS_KEY))`), apply `finish()` to that, write it, then `setProgress`. Also listen to the `storage` event to refresh the shelf. Node test: two progress copies finishing different stories in turn → both kept.

### 2. NoStoryAfterTimeIsUp: "the time ran out on the shelf, and my child read a whole new story" (shared, kids kit)
- **Path (2 steps):** today's time runs out → you open the story.
- **Why:** `atBreak()` runs only in `done()` and on mount. `open()` and আবার পড়ো don't check it. This is the same path as সৌরজগতের সফর bug 1.
- **Live (current kit):** with 600 s used, I opened the shelf, and the stored time then reached 900/900 s. I opened "পড়ে যাওয়া টিফিন": no rest screen. I read 2 panels to the মোড়, chose a turn and read 4 panels in all. The rest screen appeared only after গল্প শেষ. Opening the tool past the limit is fixed: it starts on the rest screen (`rest at once = true`, no shelf; `.shots/golper-mor-rest.png`).
- **Fix (shared):** check the limit when a story opens (`open()`, আবার পড়ো, অন্যটা বেছে দেখো), with the same kit helper as sourojogot's fix.

## Checked live and holding
- **RestOnlyAtBreak:** the rest screen replaces the whole tool after গল্প শেষ. Nothing of the story stays behind it.
- **ShareOnlyOnTheShelf:** opening a story unmounts the shelf's gate, so the share link can't follow the child into a story. This is the contrast with the other two games, where the page gate outlives the round.
- **No network, no child data:** the game code has no fetch, XHR, beacon or `/api` (grep). The only key saved is `ektukhani-golper-mor`: story ids, sides and today's date, with no name.

## Quality-bar gaps (one story read both ways in Orca at 412 px, plus the code)
1. **First screen:** the shelf of nine book covers is the first thing, with a hint finger on the first unread book. The finger is drawn as a large white circle that covers the people on the টিফিন cover (`.shots/golper-mor-shelf.png`). Make it smaller, or put it on the cover's edge.
2. **The choice is clear:** "নুসরাত কী করবে?" with two picture buttons, and both turns are allowed (`.shots/golper-mor-turn.png`). It's good that neither path is "wrong". But the question panel puts text, a speaker button and choices on one screen, with ← আগের ছবি as a full-width button competing with them.
3. **Ending:** the end page asks one talk question ("তানিম বাটিটা ধুয়ে আনল কেন?") and offers অন্যটা বেছে দেখো first (good). আবার পড়ো and শেষ are equal size. Past the limit, though, the rest screen replaces the end page at once, so the talk question and আব্বু-আম্মুকে দেখাও never show for the last story of the day.
4. **Progress:** "৯টার মধ্যে Nটা পড়া হয়েছে" counts a story read once, and "দুই মোড়ই পড়া হয়েছে" shows on covers. Both can vanish (bug 1).
5. **Pacing:** each story is 3 intro panels plus 2 per turn, so a story is about 1 minute, which fits ages 5–10. There's no animation between panels other than the fade.
6. **Sound:** only taps and a soft "good". Speech is optional and hidden when there's no Bangla voice (correct).
7. **Header search and adult links:** the same site-shell finding as সৌরজগতের সফর bug 3.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/golper-mor/Golper.tla --view ai_docs/statecharts/golper-mor/view.ts --out ai_docs/statecharts/golper-mor/after-fix
rm ai_docs/statecharts/golper-mor/after-fix/tlc.out
```
The chart hides only reloads that land on the shelf with time left (back to the shelf from every page).
