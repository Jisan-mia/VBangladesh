---- MODULE Ponero ----
\* ১৫ ঘরের ধাঁধা: the plate, pause and focus, the finger on the plate, the star chimes, levels and a friend's link,
\* mirrored from tools/ponero-ghor/components/ponero-game.tsx (handlers and effects) and tools/ponero-ghor/lib/game.ts.
\* Two levels stand in for thirty; "friend" is the level a friend's link opened (0 = no link).
\* There is no game clock: a move only happens when you make one.
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, press, chime, level, unlocked, friend, opened, linked
vars == <<phase, paused, visible, focused, press, chime, level, unlocked, friend, opened, linked>>

Levels == 1..2
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
\* const open = Math.max(levels.unlocked, friend?.level ?? 1): what the level grid and the → button let you open.
Open(u, f) == Max(u, f)
Here == visible /\ focused

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ press = FALSE /\ chime = FALSE
        /\ level = 1 /\ unlocked = 1 /\ friend = 0 /\ opened = 1 /\ linked = FALSE

\* A move from any input (tapCell / slideToward / showHint → commit): blocked when won or paused. It may solve the plate.
\* The won effect: levels.record(level, earned) (unlocked = one past the highest cleared), then star chimes and confetti on timers.
Move == \/ /\ phase' = "playing" /\ UNCHANGED <<chime, unlocked, opened>>
        \/ /\ phase' = "won" /\ chime' = TRUE
           /\ unlocked' = Min(2, Max(unlocked, level + 1))
           /\ opened' = Max(opened, Open(unlocked', friend))

\* onPointerDown: only while not won and not paused; remembers the press.
YouPutAFingerDown == /\ Here /\ phase # "won" /\ ~paused /\ ~press
                     /\ press' = TRUE
                     /\ UNCHANGED <<phase, paused, visible, focused, chime, level, unlocked, friend, opened, linked>>
\* onPointerUp reaches the page while it has focus: clears the press, then tapCell (which checks won and paused).
YouLiftIt == /\ press /\ focused
             /\ press' = FALSE
             /\ IF phase # "won" /\ ~paused THEN Move ELSE UNCHANGED <<phase, chime, unlocked, opened>>
             /\ UNCHANGED <<paused, visible, focused, level, friend, linked>>
\* onPointerCancel clears the press (a phone's system gesture).
TheTouchIsCancelled == /\ press /\ press' = FALSE
                       /\ UNCHANGED <<phase, paused, visible, focused, chime, level, unlocked, friend, opened, linked>>
\* Arrow keys, H, or a keyboard click on a ঘুঁটি: the same commit, same guards.
YouSlideWithKeys == /\ Here /\ phase # "won" /\ ~paused /\ Move
                    /\ UNCHANGED <<paused, visible, focused, press, level, friend, linked>>

WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, press, chime, level, unlocked, friend, opened, linked>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, press, chime, level, unlocked, friend, opened, linked>>
\* hide(): pauses only when moves were made and the plate isn't won. The press is left as it was.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ paused' = (paused \/ phase = "playing")
            /\ UNCHANGED <<phase, press, chime, level, unlocked, friend, opened, linked>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, press, chime, level, unlocked, friend, opened, linked>>
\* চালিয়ে যাও, or Space/Enter: setPaused(false).
YouResume == /\ paused /\ Here /\ paused' = FALSE
             /\ UNCHANGED <<phase, visible, focused, press, chime, level, unlocked, friend, opened, linked>>
\* The star chimes and the win sound fire from their timers.
ChimesPlay == /\ chime /\ chime' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, press, level, unlocked, friend, opened, linked>>
\* goTo(next): আরেকবার, পরের লেভেল, the ← → buttons, আবার শুরু, the level grid. Clears timers, unpauses; the press stays.
YouGoToALevel == /\ Here
                 /\ \E next \in 1..Open(unlocked, friend) :
                      /\ level' = next /\ phase' = "ready" /\ paused' = FALSE /\ chime' = FALSE /\ linked' = FALSE
                 /\ UNCHANGED <<visible, focused, press, unlocked, friend, opened>>
\* hashchange → readFriend(): a valid link sets the friend and goTo(link level).
AFriendsLinkOpens == /\ Here
                     /\ \E f \in Levels :
                          /\ friend' = f /\ level' = f /\ phase' = "ready" /\ paused' = FALSE /\ chime' = FALSE /\ linked' = TRUE
                          /\ opened' = Max(opened, Open(unlocked, f))
                     /\ UNCHANGED <<visible, focused, press, unlocked>>

Next == YouPutAFingerDown \/ YouLiftIt \/ TheTouchIsCancelled \/ YouSlideWithKeys \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouResume \/ ChimesPlay \/ YouGoToALevel \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "won"} /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ press \in BOOLEAN /\ chime \in BOOLEAN /\ level \in Levels /\ unlocked \in Levels /\ friend \in 0..2
          /\ opened \in Levels /\ linked \in BOOLEAN

\* The reader's rules.
\* After blur or hide, no finger counts as on the plate.
InputReleasedWhenAway == press => focused
\* A plate you've started is paused while its tab is hidden.
PausedWhenHidden == (~visible /\ phase = "playing") => paused
\* Paused means nothing moves: no moves were possible, and won plates never pause.
PausedOnlyMidPlate == paused => phase = "playing"
\* The chimes and confetti belong to this win only: never after you've moved on.
ChimesOnlyForThisWin == chime => phase = "won"
\* A level you could open stays open.
UnlockNeverShrinks == Open(unlocked, friend) >= opened
\* A friend's link opens exactly the friend's level, fresh.
ReplayIsExact == linked => level = friend
====
