# গল্পের মোড় statechart (after the rewrite)

Specs, all mirrored from the new code:
- `Golper.tla` / `Golper.cfg` / `view.ts`: reading, read marks across two tabs, the daily limit and the rest screen, the gates. Mirrors `tools/golper-mor/lib/session.ts` (openStory, tryOther, nextPanel, choose, finish, toShelf, restart), `lib/progress.ts` (recordFinish) and `components/story-book.tsx` (restShows, the shelf's one-second check, the storage listener) with `shared/kids-kit.tsx`.
- `GolperFocus.tla` / `GolperFocus.cfg` / `view-focus.ts`: the player's pause menu and window focus around a story (`pause`, `resume`, `leave`, `returned`, `tapCounts`, `openStory`).
- `before-fix/` and `before-kit-fix/` are the old code's runs (the two bugs below). `after-fix/` and `after-fix-focus/` are the new code's runs; every rule holds.

One story with its two roads (side 0, 1) stands in for nine. The gate's hold timer and the header search are the shared code modelled in `../sourojogot/Sourojogot.tla`. The end page's 700 ms guard is one button's timer, proved by the node test "end page keys and buttons".

## Systems modelled
- **Reading:** shelf → reading up to the মোড় → a road picked → reading that road → গল্প শেষ (`finish()`: the limit is checked, the mark is saved, the end page shows) → অন্যটা / আবার / শেষ. The shelf button leaves from any page.
- **Read marks and a second tab:** `finish()` reads the saved copy again before it writes, so a tab opened earlier can't wipe what another saved. The `storage` event and a refresh on focus keep this tab's shelf in step.
- **Daily limit and rest screen:** the time counts only while the tab is visible and focused. `atBreak()` runs when a story starts (cover, আবার, অন্যটা) and in the very tap that finishes one. The shelf checks once a second. The rest screen covers the shelf only: the end page shows first, with its talk question, and offers only শেষ when the time is up.
- **Pause and focus:** the player's menu, blur and hide. Mid-story the first tap back only wakes the book; opening a story while away does nothing.
- **Gates:** the shelf's বড়দের জন্য unmounts when a story opens. আব্বু-আম্মুকে দেখাও exists only on the end page.
- **Left out:** sound (taps only; every note is a scheduled `tone()` the player cuts on pause, no loops) and clearing the marks (a grown-up action behind the gate).

## Rules in plain words
| Rule | Plain words | Result |
|---|---|---|
| ReadMarksNeverVanish | Every road read, in any tab, is still marked "পড়া হয়েছে" after a reload. | holds (broke before) |
| ShelfMatchesWhatIsSaved | This tab never shows a mark the phone has lost. | holds |
| NoStoryAfterTimeIsUp | Once today's time is up, no new story starts. | holds (broke before) |
| RestOnlyAtBreak | The rest screen appears only on the shelf, never inside a story. | holds |
| EndPageNeverCovered | The rest screen never hides the end page: its talk question stays until the child leaves. | holds (a gap before) |
| ShareOnlyOnTheShelf | The share link exists only on the shelf, never in a story. | holds |
| ShowParentOnlyAtTheEnd | আব্বু-আম্মুকে দেখাও appears only on the end page. | holds |
| AwayMidStoryIsAsleep | Away in the middle of a story, the book is paused or asleep, so the tap that brings focus back is not a move. | holds |
| NothingMovesWhileAway | No page turns, no road is picked and no story ends while the menu is open, the window is away or the book sleeps. | holds |
| TypeOK, NoDeadlock | | hold |

## Chart: reading, marks, limit and gates (`after-fix/chart.mmd`)
```mermaid
stateDiagram-v2
  direction LR
  state "Legend" as legend {
    lg0: play
    lg1: rest
    lg2: done
  }
  class lg0 teal
  class lg1 yellow
  class lg2 blue
  state "At the same time" as all {
    state "Story" as r0 {
      s0: Shelf
      s1: Reading up to the ম#2507;ড#2492;
      s2: Shelf, বড#2492;দ#2503;র জন#2509;য open
      s3: Reading path ১
      s4: Reading path ২
      s5: Rest screen over the shelf
      s6: End page
      s7: End page, today's time is up (only শ#2503;ষ)
      s8: আব#2509;ব#2497;-আম#2509;ম#2497;ক#2503; দ#2503;খ#2494;ও
      [*] --> s0
      s0 --> s1: you open a story or press আব#2494;র পড#2492;#2507; [when Today is Time left today]
      s0 --> s2: a grown-up opens বড#2492;দ#2503;র জন#2509;য
      s1 --> s0: you press the shelf, শ#2503;ষ or সব ল#2503;ভ#2503;ল
      s1 --> s3: you pick a path at the ম#2507;ড#2492;
      s1 --> s4: you pick a path at the ম#2507;ড#2492;
      s0 --> s5: the shelf's one-second check sees the time is up or you open a story, but today's time is up or you open or reload the page [when Today is Today's time is up]
      s2 --> s0: you press বন#2509;ধ কর#2507;
      s2 --> s1: you open a story or press আব#2494;র পড#2492;#2507; [when Today is Time left today]
      s3 --> s0: you press the shelf, শ#2503;ষ or সব ল#2503;ভ#2503;ল
      s3 --> s1: you press #8592; on the first picture of a path
      s3 --> s6: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Today is Time left today]
      s4 --> s6: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Today is Time left today]
      s4 --> s1: you press #8592; on the first picture of a path
      s4 --> s0: you press the shelf, শ#2503;ষ or সব ল#2503;ভ#2503;ল
      s1 --> s5: you open or reload the page [when Today is Today's time is up]
      s5 --> s0: a grown-up gives ১০ more minutes
      s2 --> s5: you open a story, but today's time is up or you open or reload the page or the shelf's one-second check sees the time is up [when Today is Today's time is up]
      s6 --> s1: you open a story or press আব#2494;র পড#2492;#2507; or you press অন#2509;যট#2494; [when Today is Time left today]
      s6 --> s0: you press the shelf, শ#2503;ষ or সব ল#2503;ভ#2503;ল
      s6 --> s8: you press আব#2509;ব#2497;-আম#2509;ম#2497;ক#2503; দ#2503;খ#2494;ও
      s3 --> s5: you open or reload the page [when Today is Today's time is up]
      s3 --> s7: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Today is Today's time is up]
      s4 --> s7: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Today is Today's time is up]
      s4 --> s5: you open or reload the page [when Today is Today's time is up]
      s5 --> s2: a grown-up gives ১০ more minutes
      s6 --> s5: you open a story, but today's time is up or you open or reload the page [when Today is Today's time is up]
      s7 --> s6: a grown-up gives ১০ more minutes
      s7 --> s5: you press the shelf, শ#2503;ষ or সব ল#2503;ভ#2503;ল or you open a story, but today's time is up or you open or reload the page
      s7 --> s8: you press আব#2509;ব#2497;-আম#2509;ম#2497;ক#2503; দ#2503;খ#2494;ও
      s8 --> s6: you press দ#2503;খ#2494;ন#2507; শ#2503;ষ
      s8 --> s5: you open or reload the page [when Today is Today's time is up]
      s8 --> s7: you press দ#2503;খ#2494;ন#2507; শ#2503;ষ [when Today is Today's time is up]
    }
    --
    state "Marks" as r1 {
      s9: Saved: nothing
      s10: Saved: path ২
      s11: Saved: path ১
      s12: Saved: both paths
      [*] --> s9
      s9 --> s10: in another tab you finish path ২
      s9 --> s11: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Story is Reading path ১]
      s9 --> s10: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Story is Reading path ২]
      s11 --> s12: in another tab you finish path ২
      s10 --> s12: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Story is Reading path ১]
      s11 --> s12: you press গল#2509;প শ#2503;ষ (the mark is saved now) [when Story is Reading path ২]
    }
    --
    state "Book" as r2 {
      s13: Awake
      [*] --> s13
    }
    --
    state "Today" as r3 {
      s14: Time left today
      s15: Today's time is up
      [*] --> s14
      s14 --> s15: today's time runs out
      s15 --> s14: a grown-up gives ১০ more minutes [when Story is one of End page, today's time is up (only শ#2503;ষ), Rest screen over the shelf, আব#2509;ব#2497;-আম#2509;ম#2497;ক#2503; দ#2503;খ#2494;ও]
    }
  }
  class s0 blue
  class s1 teal
  class s2 blue
  class s3 teal
  class s4 teal
  class s5 yellow
  class s6 blue
  class s7 blue
  class s8 blue
```

## Chart: pause and focus (`after-fix-focus/chart.mmd`)
```mermaid
stateDiagram-v2
  direction LR
  state "Legend" as legend {
    lg0: play
    lg1: done
  }
  class lg0 teal
  class lg1 blue
  state "At the same time" as all {
    state "Child" as r0 {
      s0: On the shelf
      s1: Reading a story
      s2: End page
      [*] --> s0
      s0 --> s1: you open a story [when Awake]
      s1 --> s0: you go to the shelf [unless Player menu open]
      s1 --> s2: you tap the book (a page, a path or গল#2509;প শ#2503;ষ#59; ignored while away) [when Awake]
      s2 --> s0: you go to the shelf [unless Player menu open]
    }
    --
    state "Book" as r1 {
      s3: Awake
      s4: Away
      s5: Player menu open
      s6: Away, the next tap only wakes the book
      s7: Next tap only wakes the book
      [*] --> s3
      s3 --> s4: you click away or hide the tab [unless Reading a story]
      s3 --> s5: the player's menu opens
      s3 --> s6: you click away or hide the tab [when Reading a story]
      s4 --> s3: you come back to the window
      s4 --> s5: the player's menu opens
      s5 --> s3: you press চ#2494;ল#2495;য#2492;#2503; য#2494;ও
      s6 --> s4: you go to the shelf
      s6 --> s7: you come back to the window
      s6 --> s5: the player's menu opens
      s7 --> s3: you go to the shelf or you tap the book (a page, a path or গল#2509;প শ#2503;ষ#59; ignored while away)
      s7 --> s6: you click away or hide the tab
      s7 --> s5: the player's menu opens
    }
  }
  class s0 blue
  class s1 teal
  class s2 blue
  class s4 blue
  class s6 teal
  class s7 teal
```

## Bugs found before the rewrite, and how each is fixed
Both were replayed live in Orca on the old code (see `before-fix/`).

### 1. ReadMarksNeverVanish: "we read the টিফিন story on the phone, my child read another one in a second tab, and the টিফিন mark was gone" (game)
- **Path (4 steps):** you open the story → you pick a road → you press গল্প শেষ (saved: road ১) → in another tab you finish road ২: *A road you read lost its mark.*
- **Why:** `done()` built the new marks from this tab's React state, loaded once on mount, and overwrote the key.
- **Fix:** `recordFinish(raw, memory, …)` in `lib/progress.ts` reads the saved text at the moment of the write and adds the new mark to that; the shelf refreshes on `storage`, focus and visibility. If storage can't be read at all, this tab's own copy is used.
- **Node test:** "bug 1: a second tab can't wipe a read mark" (also shows the old way losing it) and "recordFinish: unreadable storage…".
- **Live (new code, Orca):** the page memory had only টিফিন; I wrote `{tiffin:[0], notun:[1]}` straight into storage as "the other tab"; then I read ১০ টাকার নোট. Saved: `{"read":{"tiffin":[0],"notun":[1],"taka":[1]},"today":["tiffin","notun","taka"]}`. Nothing lost.

### 2. NoStoryAfterTimeIsUp: "the time ran out on the shelf, and my child read a whole new story" (game and kit)
- **Path (2 steps):** today's time runs out → you open a story.
- **Why:** `atBreak()` ran only in `done()` and on mount.
- **Fix:** `openStory`, `tryOther` and `restart` all ask `atBreak()` first; past the limit nothing starts and the rest screen comes. The shelf runs a one-second check, so the rest comes while the child looks at covers. No kit change was needed.
- **Node tests:** "bug 2: once today's time is up, no story starts…", "gap: the rest screen waits behind the end page…", "RestOnlyAtBreak…", and the 3000-tap random child.
- **Live (new code, Orca):** (a) on the shelf with time left I raised the stored time to 900 of 900 s: after 1.5 s the rest screen covered the shelf. (b) I started a story, raised the time to 900 s mid-story: no rest screen in the story; I finished it: the end page showed "মং পেছনে তাকাল কেন?", আব্বু-আম্মুকে দেখাও and only the শেষ button; শেষ led to the rest screen. The stored time was put back afterwards.

## Quality-bar gaps from the first run, now closed
1. **The hint finger covered the first cover:** the ghost finger is now a ring on the big play button's edge (first ever run only), and the shelf's recommended book is marked by a ring, not an overlay.
2. **The rest screen hid the last talk question:** see EndPageNeverCovered. The end page stays and offers only শেষ.
3. **Read marks could vanish:** bug 1. Marks are two ribbons on each cover, plus a lamp for each finished shelf.
4. **End buttons:** আবার and শেষ are 108 px pictures of equal size, with অন্যটা first.
5. **No voice:** every `speak()` / `SpeakButton` is gone.

## Regenerate
```sh
scripts/statechart.sh ai_docs/statecharts/golper-mor/Golper.tla --view ai_docs/statecharts/golper-mor/view.ts --out ai_docs/statecharts/golper-mor/after-fix
scripts/statechart.sh ai_docs/statecharts/golper-mor/GolperFocus.tla --view ai_docs/statecharts/golper-mor/view-focus.ts --out ai_docs/statecharts/golper-mor/after-fix-focus
rm ai_docs/statecharts/golper-mor/after-fix*/tlc.out
```
The first chart hides only reloads that land on the shelf with time left. The second hides focus changes on the shelf.
