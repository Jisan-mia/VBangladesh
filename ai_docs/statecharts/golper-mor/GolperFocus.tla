---- MODULE GolperFocus ----
\* গল্পের মোড়: the player's pause menu and the window's focus around a story. Mirrored from tools/golper-mor/lib/session.ts
\* (pause, resume, leave, returned, tapCounts, nextPanel, choose, finish) and the component's blur / focus / visibilitychange
\* listeners. The story is reduced to where the child is: the shelf, a story being read, or the end page. The reader has no
\* clock, timer or loop, so what "stays still while away" means is: no page turns, no path picked, no story finished.
EXTENDS Naturals
VARIABLES where, paused, away, swallow, moves
vars == <<where, paused, away, swallow, moves>>

Init == /\ where = "shelf" /\ paused = FALSE /\ away = FALSE /\ swallow = FALSE /\ moves = 0

YouOpenAStory == /\ where = "shelf" /\ ~paused /\ ~away /\ where' = "read" /\ UNCHANGED <<paused, away, swallow, moves>>
\* A tap or key on a story: tapCounts() says "ignored" under the menu or while away, "woke" for the first tap back, and
\* only then "counts": a page turns, a path is picked, or গল্প শেষ ends the story. `moves` counts only those.
YouTapTheBook == /\ where = "read"
                 /\ IF paused \/ away THEN UNCHANGED vars
                    ELSE IF swallow THEN swallow' = FALSE /\ UNCHANGED <<where, paused, away, moves>>
                    ELSE moves' = (moves + 1) % 3 /\ \E w \in {"read", "end"} : where' = w
                         /\ UNCHANGED <<paused, away, swallow>>
YouGoToTheShelf == /\ where # "shelf" /\ ~paused /\ where' = "shelf" /\ swallow' = FALSE /\ UNCHANGED <<paused, away, moves>>

PlayerPauses == /\ ~paused /\ paused' = TRUE /\ UNCHANGED <<where, away, swallow, moves>>
\* চালিয়ে যাও: the menu took the click that came back, so nothing is swallowed.
PlayerResumes == /\ paused /\ ~away /\ paused' = FALSE /\ swallow' = FALSE /\ UNCHANGED <<where, away, moves>>
\* Blur or a hidden tab: mid-story the tap that brings focus back must not turn a page or pick a path.
WindowBlurs == /\ ~away /\ away' = TRUE /\ swallow' = (swallow \/ where = "read") /\ UNCHANGED <<where, paused, moves>>
WindowFocuses == /\ away /\ away' = FALSE /\ UNCHANGED <<where, paused, swallow, moves>>
Next == YouOpenAStory \/ YouTapTheBook \/ YouGoToTheShelf \/ PlayerPauses \/ PlayerResumes
        \/ WindowBlurs \/ WindowFocuses

Spec == Init /\ [][Next]_vars

TypeOK == /\ where \in {"shelf", "read", "end"} /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ swallow \in BOOLEAN /\ moves \in 0..2

\* Away mid-story, the book is paused or asleep: the tap that brings focus back is not a move.
AwayMidStoryIsAsleep == (away /\ where = "read") => (swallow \/ paused)
\* Nothing moves while the menu is open, the window is away, or the book still sleeps.
NothingMovesWhileAway == [][(moves' # moves) => (~paused /\ ~away /\ ~swallow)]_vars
====
