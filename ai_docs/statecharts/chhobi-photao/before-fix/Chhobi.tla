---- MODULE Chhobi ----
\* ছবি ফোটাও: the picture, its clock, pause and focus, the drag stroke, the level drawers, the celebration timers and a
\* friend's link, mirrored from tools/chhobi-photao/components/picture-game.tsx and tools/chhobi-photao/lib/game.ts.
\* Two levels stand in for thirty. "ticking" is the clock running (clock.since !== null).
EXTENDS Naturals
VARIABLES phase, ticking, paused, visible, focused, stroke, drawer, cheer, level, friend, linked
vars == <<phase, ticking, paused, visible, focused, stroke, drawer, cheer, level, friend, linked>>

Here == visible /\ focused

Init == /\ phase = "fresh" /\ ticking = FALSE /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ stroke = FALSE /\ drawer = FALSE /\ cheer = FALSE /\ level = 1 /\ friend = 0 /\ linked = FALSE

\* apply(next): the first paint starts the clock; a paint that solves the picture runs celebrate():
\* stopClock(), record the stars once, then the win sound, star chimes and confetti on timers.
\* A paint may also change nothing (paint() returns null), which is a stutter and not modelled.
Paint == \/ /\ phase' = "solving" /\ ticking' = (ticking \/ phase = "fresh") /\ UNCHANGED cheer
         \/ /\ phase' = "solved" /\ ticking' = FALSE /\ cheer' = TRUE

\* goLevel(next): clears timers, the stroke, the clock and pause.
GoLevel(l) == /\ level' = l /\ phase' = "fresh" /\ ticking' = FALSE /\ paused' = FALSE /\ stroke' = FALSE /\ cheer' = FALSE

\* onDown: not while paused or solved; starts a stroke and paints the first cell.
YouStartAStroke == /\ Here /\ ~paused /\ phase # "solved" /\ ~stroke
                   /\ stroke' = TRUE /\ Paint
                   /\ UNCHANGED <<paused, visible, focused, drawer, level, friend, linked>>
\* onMove: only checks that this pointer owns the stroke; no pause or focus check. paint() refuses once solved.
YouDragOn == /\ stroke /\ phase # "solved" /\ Paint
             /\ UNCHANGED <<paused, visible, focused, stroke, drawer, level, friend, linked>>
\* onUp / onPointerCancel / onLostPointerCapture reach the page while it has focus.
YouLetGo == /\ stroke /\ focused /\ stroke' = FALSE
            /\ UNCHANGED <<phase, ticking, paused, visible, focused, drawer, cheer, level, friend, linked>>
\* Keyboard Space/X on a cell (tapCell checks paused) and হিন্ট (showOne checks paused).
YouFillWithKeysOrHint == /\ Here /\ ~paused /\ phase # "solved" /\ Paint
                         /\ UNCHANGED <<paused, visible, focused, stroke, drawer, level, friend, linked>>

WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, ticking, paused, visible, stroke, drawer, cheer, level, friend, linked>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, ticking, paused, visible, stroke, drawer, cheer, level, friend, linked>>
\* hide(): drops the stroke; if the clock is running on an unsolved picture, stopClock() and pause.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ stroke' = FALSE
            /\ IF ticking /\ phase = "solving" THEN ticking' = FALSE /\ paused' = TRUE ELSE UNCHANGED <<ticking, paused>>
            /\ UNCHANGED <<phase, drawer, cheer, level, friend, linked>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, ticking, paused, stroke, drawer, cheer, level, friend, linked>>
\* resume(): restarts the clock if it had started and the picture isn't solved.
YouResume == /\ paused /\ Here /\ paused' = FALSE /\ ticking' = (phase = "solving")
             /\ UNCHANGED <<phase, visible, focused, stroke, drawer, cheer, level, friend, linked>>
\* The অ্যালবাম or সব লেভেল drawer (a <details>): opening it changes nothing in the game.
YouOpenADrawer == /\ Here /\ ~drawer /\ drawer' = TRUE
                  /\ UNCHANGED <<phase, ticking, paused, visible, focused, stroke, cheer, level, friend, linked>>
YouCloseTheDrawer == /\ Here /\ drawer /\ drawer' = FALSE
                     /\ UNCHANGED <<phase, ticking, paused, visible, focused, stroke, cheer, level, friend, linked>>
\* A level or a picture in the drawer: goLevel.
YouPickALevel == /\ Here /\ drawer /\ \E l \in 1..2 : GoLevel(l)
                 /\ linked' = FALSE /\ UNCHANGED <<visible, focused, drawer, friend>>
\* শুরু থেকে (mid-picture), পরের লেভেল or আবার খেলো (after it's solved): goLevel.
YouStartAgain == /\ Here /\ phase # "fresh" /\ \E l \in 1..2 : GoLevel(l)
                 /\ linked' = FALSE /\ UNCHANGED <<visible, focused, drawer, friend>>
\* The win sound, the star chimes and the confetti fire from their timers.
CheerPlays == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, ticking, paused, visible, focused, stroke, drawer, level, friend, linked>>
\* readFriend() on load or hashchange: a valid link sets the friend and goLevel(link level).
AFriendsLinkOpens == /\ Here /\ \E f \in 1..2 : (friend' = f /\ GoLevel(f))
                     /\ linked' = TRUE /\ UNCHANGED <<visible, focused, drawer>>

Next == YouStartAStroke \/ YouDragOn \/ YouLetGo \/ YouFillWithKeysOrHint \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouResume \/ YouOpenADrawer \/ YouCloseTheDrawer \/ YouPickALevel
        \/ YouStartAgain \/ CheerPlays \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"fresh", "solving", "solved"} /\ ticking \in BOOLEAN /\ paused \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ stroke \in BOOLEAN /\ drawer \in BOOLEAN
          /\ cheer \in BOOLEAN /\ level \in 1..2 /\ friend \in 0..2 /\ linked \in BOOLEAN

\* The reader's rules.
\* The clock only counts while you're on the page.
ClockStillWhileAway == ticking => Here
\* A picture you've started is paused while its tab is hidden.
PausedWhenHidden == (~visible /\ phase = "solving") => paused
\* After blur or hide, no drag counts as held.
InputReleasedWhenAway == stroke => focused
\* While you look through the levels or the album, the clock doesn't count.
ChoiceFreezesPlay == drawer => ~ticking
\* Paused means the clock is stopped and nothing is being drawn.
PausedMeansStill == paused => (~ticking /\ ~stroke)
\* Once the picture is solved, the clock has stopped for good.
ClockStopsOnTheCard == phase = "solved" => ~ticking
\* The win sound and confetti belong to this picture only: never after you've moved on.
CheerOnlyForThisPicture == cheer => phase = "solved"
\* A friend's link opens exactly the friend's picture.
ReplayIsExact == linked => level = friend
====
