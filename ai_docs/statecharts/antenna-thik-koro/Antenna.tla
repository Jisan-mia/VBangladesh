---- MODULE Antenna ----
\* অ্যান্টেনা ঠিক করো: the round, pause, window focus, the held turn key, and the static loop,
\* mirrored from tools/antenna-thik-koro/components/antenna-game.tsx.
VARIABLES phase, paused, visible, focused, held, hiss, sound
vars == <<phase, paused, visible, focused, held, hiss, sound>>

Phases == {"ready", "search", "locked", "over"}
Running == ~paused /\ phase # "over"          \* the game loop steps

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ held = FALSE /\ hiss = FALSE /\ sound = TRUE

\* press(): only while playable; starts the static unless the round is over.
YouHoldTurn == /\ Running /\ focused /\ ~held
               /\ held' = TRUE
               /\ hiss' = (hiss \/ sound)
               /\ phase' = IF phase = "ready" THEN "search" ELSE phase
               /\ UNCHANGED <<paused, visible, focused, sound>>
\* keyup reaches the page only while it has focus.
YouLetGo == /\ held /\ focused /\ held' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, hiss, sound>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ UNCHANGED <<phase, paused, visible, held, hiss, sound>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE /\ UNCHANGED <<phase, paused, visible, held, hiss, sound>>
\* visibilitychange → hidden: stopHiss(); pause only while React's phase is "playing" (search or locked).
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ hiss' = FALSE
            /\ paused' = (paused \/ phase \in {"search", "locked"})
            /\ UNCHANGED <<phase, held, sound>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE /\ UNCHANGED <<phase, paused, held, hiss, sound>>
\* resume(): clears input, unpauses, startHiss().
YouResume == /\ paused /\ visible
             /\ paused' = FALSE /\ held' = FALSE
             /\ hiss' = (hiss \/ (sound /\ phase # "over"))
             /\ UNCHANGED <<phase, visible, focused, sound>>
SignalLocks == /\ Running /\ phase = "search" /\ phase' = "locked" /\ UNCHANGED <<paused, visible, focused, held, hiss, sound>>
NextChannel == /\ Running /\ phase = "locked" /\ phase' = "search" /\ UNCHANGED <<paused, visible, focused, held, hiss, sound>>
\* finish(): stopHiss() and show the card.
LastChannel == /\ Running /\ phase = "locked" /\ phase' = "over" /\ hiss' = FALSE /\ UNCHANGED <<paused, visible, focused, held, sound>>
\* The site-wide switch: off stops every loop; on starts nothing by itself.
SoundOff == /\ sound /\ sound' = FALSE /\ hiss' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, held>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ UNCHANGED <<phase, paused, visible, focused, held, hiss>>
\* reset(): a fresh round with input cleared and the static stopped.
PlayAgain == /\ phase = "over" /\ visible
             /\ phase' = "ready" /\ paused' = FALSE /\ held' = FALSE /\ hiss' = FALSE
             /\ UNCHANGED <<visible, focused, sound>>

Next == YouHoldTurn \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ SignalLocks \/ NextChannel \/ LastChannel \/ SoundOff \/ SoundOn \/ PlayAgain

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ held \in BOOLEAN /\ hiss \in BOOLEAN /\ sound \in BOOLEAN

\* The reader's rules.
DialStillWhileAway == (held /\ Running) => focused
StaticOnlyWhileListening == (hiss /\ phase = "search") => (visible /\ ~paused /\ sound)
StaticWhileSearching == (phase = "search" /\ Running /\ visible /\ sound) => hiss
HiddenMeansPaused == (~visible /\ phase \in {"search", "locked"}) => paused
NoStaticOnTheCard == phase = "over" => ~hiss
====
