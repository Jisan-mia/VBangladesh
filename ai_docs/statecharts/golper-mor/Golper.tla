---- MODULE Golper ----
\* গল্পের মোড় after the rewrite: the shelf, reading a story to its মোড়, choosing a path, the end page and অন্যটা বেছে দেখো /
\* আবার পড়ো, the read marks in localStorage (with a second tab open), the kids' daily limit and rest screen,
\* the shelf's parent gate and আব্বু-আম্মুকে দেখাও with its picture gate.
\* Mirrored from tools/golper-mor/lib/session.ts (openStory, tryOther, nextPanel, choose, finish, toShelf, restart, pause, leave,
\* tapCounts), tools/golper-mor/lib/progress.ts (recordFinish: the saved copy is read again before every write) and
\* tools/golper-mor/components/story-book.tsx (restShows, the shelf's one-second limit check, the storage listener), plus
\* shared/kids-kit.tsx (useKidsSession, RestScreen, ParentGate, ShowParent). One story with its two paths (side 0 and 1)
\* stands in for nine. Pause and focus are in GolperFocus.tla. The gate's hold timer and the header search are the shared code modelled in
\* ai_docs/statecharts/sourojogot/Sourojogot.tla. The end page's 700 ms guard is a timer on one button; the node test
\* "end page keys and buttons" proves it, so it is left out here.
EXTENDS Naturals
VARIABLES view, side, mem, saved, other, due, resting, late, stage, show
vars == <<view, side, mem, saved, other, due, resting, late, stage, show>>

Sides == {0, 1}
Init == /\ view = "shelf" /\ side = 0 /\ mem = {} /\ saved = {} /\ other = FALSE
        /\ due = FALSE /\ resting = FALSE /\ late = FALSE /\ stage = "closed" /\ show = FALSE

\* The rest screen covers the shelf only. The end page always shows first (restShows in session.ts).
Covered == resting /\ view = "shelf"


\* Leaving a view unmounts it, so the shelf's ParentGate and the end page's ShowParent close.
Go(v) == /\ view' = v /\ stage' = "closed" /\ show' = FALSE

\* ---- reading ----
\* openStory() from a cover, or আবার পড়ো on the end page: atBreak() is asked first. Past the limit nothing starts and the
\* rest screen comes (over the shelf). late = the story started after today's time was up.
YouOpenTheStory == /\ view \in {"shelf", "end"} /\ ~Covered /\ ~show /\ ~due
                   /\ Go("reading") /\ late' = due
                   /\ UNCHANGED <<side, mem, saved, other, due, resting>>
YouOpenItPastTheLimit == /\ view \in {"shelf", "end"} /\ ~Covered /\ ~show /\ due
                         /\ Go("shelf") /\ resting' = TRUE
                         /\ UNCHANGED <<side, mem, saved, other, due, late>>
\* → on the pictures up to the মোড় changes nothing the rules look at, so it is one step with choose().
\* choose(side) at the মোড় panel.
YouChooseAPath == /\ view = "reading" 
                  /\ \E s \in Sides : side' = s
                  /\ Go("path")
                  /\ UNCHANGED <<mem, saved, other, due, resting, late>>
\* ← from the first picture of a path: the মোড় again, the path unpicked.
YouGoBackToTheTurn == /\ view = "path"  /\ Go("reading")
                      /\ UNCHANGED <<side, mem, saved, other, due, resting, late>>
\* গল্প শেষ on the last picture: finish() runs atBreak(), then recordFinish() reads the saved copy again and adds this
\* path; the storage listener keeps this tab's copy in step. All in the same tap, never in a timer.
YouFinishTheStory == /\ view = "path" 
                     /\ saved' = saved \cup {side} /\ mem' = saved \cup {side}
                     /\ Go("end") /\ resting' = due
                     /\ UNCHANGED <<side, other, due, late>>
\* অন্যটা বেছে দেখো: back at the মোড়, asked about the limit first.
YouTryTheOtherPath == /\ view = "end" /\ ~show /\ ~due
                      /\ Go("reading") /\ late' = due
                      /\ UNCHANGED <<side, mem, saved, other, due, resting>>
\* ← সব গল্প from a story, শেষ on the end page, or সব লেভেল in the player's menu.
YouGoToTheShelf == /\ view # "shelf" /\ ~show
                   /\ Go("shelf") /\ late' = FALSE
                   /\ UNCHANGED <<side, mem, saved, other, due, resting>>

\* ---- the saved read marks and a second tab ----
\* Another tab of গল্পের মোড়, opened earlier, finishes path 1: it too reads the saved copy and adds to it. This tab's
\* storage listener (and its focus refresh) pick the new marks up.
AnotherTabFinishesPathOne == /\ ~other /\ other' = TRUE /\ saved' = saved \cup {1} /\ mem' = saved \cup {1}
                             /\ UNCHANGED <<view, side, due, resting, late, stage, show>>
\* A reload reads the saved marks again and, past the limit, opens on the rest screen.
YouReload == /\ mem' = saved /\ Go("shelf") /\ resting' = due /\ late' = FALSE
             /\ UNCHANGED <<side, saved, other, due>>

\* ---- the daily limit ----
\* The session clock ticks only while the tab is visible and focused.
TodaysTimeRunsOut == /\ ~due /\ due' = TRUE
                     /\ UNCHANGED <<view, side, mem, saved, other, resting, late, stage, show>>
\* On the shelf a one-second check calls atBreak(), so the rest screen comes while the child looks at covers. Never in a story.
TheShelfNoticesTheTime == /\ view = "shelf" /\ due /\ ~resting /\ resting' = TRUE
                          /\ UNCHANGED <<view, side, mem, saved, other, due, late, stage, show>>
\* The RestScreen covers the shelf; its own gate's আজ আরও ১০ মিনিট → extend(10) brings the shelf back.
AGrownUpGivesTenMore == /\ resting /\ due' = FALSE /\ resting' = FALSE
                        /\ UNCHANGED <<view, side, mem, saved, other, late, stage, show>>

\* ---- the gates ----
\* The shelf's বড়দের জন্য: hold 2 s, answer the sum → খেলাটার লিংক পাঠাও and পড়ার দাগ মুছে দাও. It closes on বন্ধ করো,
\* after one use, after 60 s or when the tab hides, and opening a story unmounts it.
AGrownUpOpensTheShelfGate == /\ view = "shelf" /\ ~Covered /\ stage = "closed" /\ stage' = "open"
                             /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, show>>
YouCloseTheGate == /\ stage = "open" /\ stage' = "closed"
                   /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, show>>
\* আব্বু-আম্মুকে দেখাও on the end page; ফোনে ছবি রাখো sits behind ShowParent's own ParentGate.
YouShowAGrownUp == /\ view = "end" /\ ~show /\ show' = TRUE
                   /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, stage>>
YouCloseShowParent == /\ show /\ show' = FALSE
                      /\ UNCHANGED <<view, side, mem, saved, other, due, resting, late, stage>>

Next == YouOpenTheStory \/ YouOpenItPastTheLimit \/ YouChooseAPath \/ YouGoBackToTheTurn \/ YouFinishTheStory
        \/ YouTryTheOtherPath \/ YouGoToTheShelf
        \/ AnotherTabFinishesPathOne \/ YouReload \/ TodaysTimeRunsOut \/ TheShelfNoticesTheTime \/ AGrownUpGivesTenMore
        \/ AGrownUpOpensTheShelfGate \/ YouCloseTheGate \/ YouShowAGrownUp \/ YouCloseShowParent

Spec == Init /\ [][Next]_vars

TypeOK == /\ view \in {"shelf", "reading", "path", "end"} /\ side \in Sides /\ mem \subseteq Sides /\ saved \subseteq Sides
          /\ other \in BOOLEAN /\ due \in BOOLEAN /\ resting \in BOOLEAN /\ late \in BOOLEAN
          /\ stage \in {"closed", "open"} /\ show \in BOOLEAN

\* ---- the reader's rules ----
\* Every path read in any tab is still marked after a reload.
ReadMarksNeverVanish == (mem \cup (IF other THEN {1} ELSE {})) \subseteq saved
\* This tab's marks are always among the saved ones, so the shelf never shows a mark the phone has lost.
ShelfMatchesWhatIsSaved == mem \subseteq saved
RestOnlyAtBreak == resting => view \in {"end", "shelf"}
\* The rest screen never covers the end page: its talk question and আব্বু-আম্মুকে দেখাও stay until the child leaves.
EndPageNeverCovered == view = "end" => ~Covered
NoStoryAfterTimeIsUp == ~(late /\ view \in {"reading", "path"})
ShareOnlyOnTheShelf == stage = "open" => view = "shelf"
ShowParentOnlyAtTheEnd == show => view = "end"
====
