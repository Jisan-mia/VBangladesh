---- MODULE Golper ----
\* গল্পের মোড়: the shelf, reading a story to its মোড়, choosing a turn, the end page and "অন্যটা বেছে দেখো", the read
\* marks in localStorage (with a second tab open), the kids' daily limit and rest screen, the shelf's parent gate and
\* আব্বু-আম্মুকে দেখাও with its picture gate.
\* Mirrored from tools/golper-mor/components/golper-game.tsx (open, next, choose, done, go, the shelf / end / reader views,
\* `if (resting) return <RestScreen>`), tools/golper-mor/lib/progress.ts (readProgress, finish) and shared/kids-kit.tsx
\* (useKidsSession, RestScreen, ParentGate, ShowParent). One story with its two turns (side 0 and 1) stands in for nine.
\* The reader has no clock or timer, so pause and focus change nothing and are left out. The gate's hold timer and the
\* header search are the shared code modelled in full in ai_docs/statecharts/sourojogot/Sourojogot.tla.
\* The kit is mirrored as of f4f75be + 23fd7c1 (2026-11-04 16:47); the run against the kit at b51e328 is in before-kit-fix/.
EXTENDS Naturals
VARIABLES view, side, mem, saved, other, due, resting, late, stage, show
vars == <<view, side, mem, saved, other, due, resting, late, stage, show>>

Sides == {0, 1}
Init == /\ view = "shelf" /\ side = 0 /\ mem = {} /\ saved = {} /\ other = FALSE
        /\ due = FALSE /\ resting = FALSE /\ late = FALSE /\ stage = "closed" /\ show = FALSE

\* go(): leaving a view unmounts it, so the shelf's ParentGate and the end page's ShowParent close.
Go(v) == /\ view' = v /\ stage' = "closed" /\ show' = FALSE

\* ---- reading ----
\* open(id) from the shelf, or আবার পড়ো on the end page. late = the story started after today's time was up.
YouOpenTheStory == /\ view \in {"shelf", "end"} /\ ~resting /\ ~show
                   /\ Go("reading") /\ late' = due
                   /\ UNCHANGED <<side, mem, saved, other, due, resting>>
\* choose(side) at the মোড় panel.
YouChooseATurn == /\ view = "reading" /\ ~resting
                  /\ \E s \in Sides : side' = s
                  /\ Go("path")
                  /\ UNCHANGED <<mem, saved, other, due, resting, late>>
\* next() on the last panel → done(): finish(progress, ...) from THIS tab's in-memory progress, written over the saved
\* copy, then the end page and atBreak().
YouFinishTheStory == /\ view = "path" /\ ~resting
                     /\ mem' = mem \cup {side} /\ saved' = mem \cup {side}
                     /\ Go("end") /\ resting' = due
                     /\ UNCHANGED <<side, other, due, late>>
\* অন্যটা বেছে দেখো: back to the মোড় panel with the other turn picked.
YouTryTheOtherTurn == /\ view = "end" /\ ~resting /\ ~show
                      /\ side' = 1 - side /\ Go("reading")
                      /\ UNCHANGED <<mem, saved, other, due, resting, late>>
\* ← সব গল্প from the reader, or শেষ on the end page.
YouGoToTheShelf == /\ view # "shelf" /\ ~resting /\ ~show
                   /\ Go("shelf") /\ late' = FALSE
                   /\ UNCHANGED <<side, mem, saved, other, due, resting>>

\* ---- the saved read marks and a second tab ----
\* Another tab of গল্পের মোড়, opened before any story was read, finishes turn 1 and writes its own copy (no turn 0).
AnotherTabFinishesTurnOne == /\ ~other /\ other' = TRUE /\ saved' = {1}
                             /\ UNCHANGED <<view, side, mem, due, resting, late, stage, show>>
\* A reload reads the saved marks again and, since 23fd7c1, opens on the rest screen when today's time is up.
YouReload == /\ mem' = saved /\ Go("shelf") /\ resting' = due /\ late' = FALSE
             /\ UNCHANGED <<side, saved, other, due>>

\* ---- the daily limit ----
\* The session clock ticks only while the tab is visible and focused; atBreak() runs only in done().
TodaysTimeRunsOut == /\ ~due /\ due' = TRUE
                     /\ UNCHANGED <<view, side, mem, saved, other, resting, late, stage, show>>
\* The RestScreen replaces the whole tool; its own gate's আজ আরও ১০ মিনিট → extend(10) brings the same view back.
AGrownUpGivesTenMore == /\ resting /\ due' = FALSE /\ resting' = FALSE
                        /\ UNCHANGED <<view, side, mem, saved, other, late, stage, show>>

\* ---- the gates ----
\* The shelf's বড়দের জন্য: hold 2 s, answer the sum → খেলাটার লিংক পাঠাও and পড়ার দাগ মুছে দাও. It closes on বন্ধ করো,
\* after one use, after 60 s or when the tab hides, and opening a story unmounts it.
AGrownUpOpensTheShelfGate == /\ view = "shelf" /\ ~resting /\ stage = "closed" /\ stage' = "open"
                             /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, show>>
YouCloseTheGate == /\ stage = "open" /\ stage' = "closed"
                   /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, show>>
\* আব্বু-আম্মুকে দেখাও on the end page; ফোনে ছবি রাখো sits behind ShowParent's own ParentGate.
YouShowAGrownUp == /\ view = "end" /\ ~resting /\ ~show /\ show' = TRUE
                   /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, stage>>
YouCloseShowParent == /\ show /\ show' = FALSE
                      /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, stage>>

Next == YouOpenTheStory \/ YouChooseATurn \/ YouFinishTheStory \/ YouTryTheOtherTurn \/ YouGoToTheShelf
        \/ AnotherTabFinishesTurnOne \/ YouReload \/ TodaysTimeRunsOut \/ AGrownUpGivesTenMore
        \/ AGrownUpOpensTheShelfGate \/ YouCloseTheGate \/ YouShowAGrownUp \/ YouCloseShowParent

Spec == Init /\ [][Next]_vars

TypeOK == /\ view \in {"shelf", "reading", "path", "end"} /\ side \in Sides /\ mem \subseteq Sides /\ saved \subseteq Sides
          /\ other \in BOOLEAN /\ due \in BOOLEAN /\ resting \in BOOLEAN /\ late \in BOOLEAN
          /\ stage \in {"closed", "open"} /\ show \in BOOLEAN

\* ---- the reader's rules ----
\* Every turn read in any tab is still marked after a reload.
ReadMarksNeverVanish == (mem \cup (IF other THEN {1} ELSE {})) \subseteq saved
RestOnlyAtBreak == resting => view \in {"end", "shelf"}
NoStoryAfterTimeIsUp == ~(late /\ view \in {"reading", "path"})
ShareOnlyOnTheShelf == stage = "open" => view = "shelf"
ShowParentOnlyAtTheEnd == show => view = "end"
====
