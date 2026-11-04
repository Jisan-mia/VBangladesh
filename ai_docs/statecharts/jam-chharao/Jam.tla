---- MODULE Jam ----
\* জ্যাম ছাড়াও as it is today: one jam being solved (moves, won), the pause the hidden tab sets, the window, a drag
\* in flight, the win effect (save once, star chimes and fanfare timers) and saved stars.
\* Mirrored from tools/jam-chharao/components/jam-game.tsx (onPointerDown/Move/Up/Cancel, nudge, showHint, takeBack,
\* goTo, the keyHandler, the visibilitychange effect, the win useEffect with finished.current) and
\* tools/jam-chharao/lib/game.ts (slide, undo, starsOf, recordWin). It is a turn-based puzzle: no clock, no loops.
\* The move count is abstracted to 0..2; a third move always frees the CNG.
EXTENDS Naturals
VARIABLES moves, won, paused, visible, focused, drag, results, chimes, stars, saved
vars == <<moves, won, paused, visible, focused, drag, results, chimes, stars, saved>>

Max(a, b) == IF a > b THEN a ELSE b

Init == /\ moves = 0 /\ won = FALSE /\ paused = FALSE
        /\ visible = TRUE /\ focused = TRUE /\ drag = FALSE
        /\ results = 0 /\ chimes = FALSE /\ stars = 0 /\ saved = 0

\* A move: slide() the picked car one step further, or the solver's next move. It may free the CNG; then the win
\* useEffect runs once (finished.current): recordWin + levels.record(level, earned), horn, star and fanfare timers.
Win == /\ won' = TRUE /\ results' = results + 1 /\ chimes' = TRUE
       /\ \E e \in 1..2 : (stars' = e /\ saved' = Max(saved, e))
Move == \/ /\ moves < 2
           /\ moves' = moves + 1
           /\ \/ (won' = FALSE /\ UNCHANGED <<results, chimes, stars, saved>>)
              \/ Win
        \/ /\ moves = 2
           /\ moves' = 2
           /\ Win

\* onPointerDown: not when won or paused. setPointerCapture; the drag lives in drag.current.
YouGrabACar == /\ ~won /\ ~paused /\ visible /\ focused /\ ~drag
               /\ drag' = TRUE
               /\ UNCHANGED <<moves, won, paused, visible, focused, results, chimes, stars, saved>>
\* onPointerUp: no paused check; play(slide(...)) counts the drop as a move.
YouDropIt == /\ drag /\ visible
             /\ drag' = FALSE
             /\ Move
             /\ UNCHANGED <<paused, visible, focused>>
\* onPointerCancel: the drag ends without a move.
TheDragCancels == /\ drag
                  /\ drag' = FALSE
                  /\ UNCHANGED <<moves, won, paused, visible, focused, results, chimes, stars, saved>>
\* nudge() from the arrow buttons or keys, or showHint() (H, সমাধান দেখাও): both refuse while paused or won.
YouSlideACar == /\ ~won /\ ~paused /\ visible /\ focused /\ ~drag
                /\ Move
                /\ UNCHANGED <<paused, visible, focused, drag>>
\* takeBack(): ফিরিয়ে আনো, Z or Backspace. It checks moves and won, not paused; the button sits outside the overlay.
YouTakeBack == /\ moves > 0 /\ ~won /\ visible /\ focused /\ ~drag
               /\ moves' = moves - 1
               /\ UNCHANGED <<won, paused, visible, focused, drag, results, chimes, stars, saved>>
\* The overlay's চালিয়ে যাও, or Enter/Space.
YouResume == /\ paused /\ ~won /\ visible /\ focused
             /\ paused' = FALSE
             /\ UNCHANGED <<moves, won, visible, focused, drag, results, chimes, stars, saved>>
\* There is no blur listener; a drag stays in drag.current.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE
               /\ UNCHANGED <<moves, won, paused, visible, drag, results, chimes, stars, saved>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ UNCHANGED <<moves, won, paused, visible, drag, results, chimes, stars, saved>>
\* visibilitychange → hidden: setPaused(true) once a move has been made and the jam isn't solved. The drag is kept.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ paused' = (paused \/ (moves > 0 /\ ~won))
            /\ UNCHANGED <<moves, won, drag, results, chimes, stars, saved>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<moves, won, paused, drag, results, chimes, stars, saved>>
\* The star chimes and the fanfare (timers.current) play out.
ChimesPlay == /\ chimes
              /\ chimes' = FALSE
              /\ UNCHANGED <<moves, won, paused, visible, focused, drag, results, stars, saved>>
\* goTo(): আরেকবার, পরের জ্যাম, আবার শুরু, the ‹ › arrows, সব জ্যাম, Enter on the win, or a friend's link.
\* It clears the timers and the pause.
YouStartAJam == /\ visible /\ focused /\ ~drag
                /\ moves' = 0 /\ won' = FALSE /\ paused' = FALSE /\ results' = 0 /\ chimes' = FALSE /\ stars' = 0
                /\ UNCHANGED <<visible, focused, drag, saved>>

Next == YouGrabACar \/ YouDropIt \/ TheDragCancels \/ YouSlideACar \/ YouTakeBack \/ YouResume
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ChimesPlay \/ YouStartAJam

Spec == Init /\ [][Next]_vars

TypeOK == /\ moves \in 0..2 /\ won \in BOOLEAN /\ paused \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ drag \in BOOLEAN
          /\ results \in 0..2 /\ chimes \in BOOLEAN /\ stars \in 0..2 /\ saved \in 0..2

\* The reader's rules.
InputReleasedWhenAway == ~focused => ~drag
\* A jam you've started pauses when you hide the tab (the code's own rule; there's no clock, so blur needn't pause).
PausedWhenHidden == (~visible /\ moves > 0 /\ ~won) => paused
\* ChoiceFreezesPlay for the pause screen: while it shows, no move is made or taken back.
NothingMovesWhilePaused == [][(paused /\ paused') => (moves' = moves /\ won' = won)]_vars
\* A drag that began before the pause doesn't land as a move behind the pause screen.
NoDropCountsWhilePaused == [][(paused /\ drag /\ ~drag') => (moves' = moves /\ won' = won)]_vars
NoDoubleResult == results <= 1
NoChimeAfterMovingOn == chimes => won
\* The stars on the result equal the stars this phone keeps (saved is the best, so at least these).
ResultMatchesPlay == won => (stars \in 1..2 /\ saved >= stars)
StarsNeverDrop == [][saved' >= saved]_vars
====
