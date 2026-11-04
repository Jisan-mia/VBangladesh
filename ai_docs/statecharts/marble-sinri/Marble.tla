---- MODULE Marble ----
\* মার্বেল-সিঁড়ি: the run, pause, window and tab, held sides (← → / A D, the board halves, ◀ ▶), the roll hum, and the
\* three-star chime timer, mirrored from tools/marble-sinri/components/marble-game.tsx (begin, newGame/again, finish,
\* clearedStage's window.setTimeout(sfx.levelUp, 900), tick, press/lift/release, keys.down/up, onBoardDown/onUp, holdButton,
\* the visibilitychange `hide`, the [view, paused] hum effect and the SoundToggle onChange) and from useGameLoop in
\* shared/game-kit.ts (working copy: blur cancels the frame and sets `away`, focus clears it, a remount starts with
\* away = false). `held` is what the game believes (held.current); `hand` is whether a key or finger is really down.
VARIABLES view, paused, visible, focused, away, held, hand, hum, sound, chime, chimedWrong
vars == <<view, paused, visible, focused, away, held, hand, hum, sound, chime, chimedWrong>>

Views == {"ready", "play", "over"}
Looping == view = "play" /\ ~paused
ClockRuns == Looping /\ visible /\ ~away
HumSounds == hum = "real" /\ sound
\* hum.current ??= rollHum(): keeps whatever is there, even a silent stub; a new one is a stub while sound is off.
KeepOrOpen == IF hum = "none" THEN (IF sound THEN "real" ELSE "stub") ELSE hum

Init == /\ view = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ away = FALSE
        /\ held = FALSE /\ hand = FALSE /\ hum = "none" /\ sound = TRUE /\ chime = FALSE /\ chimedWrong = FALSE

\* press() then begin(): a key, a board half or a pad. On the first screen it starts the run and opens the hum.
YouHoldSide == /\ view # "over" /\ ~paused /\ visible /\ focused /\ ~hand
               /\ hand' = TRUE /\ held' = TRUE
               /\ view' = "play" /\ hum' = KeepOrOpen /\ away' = IF view = "ready" THEN FALSE ELSE away
               /\ UNCHANGED <<paused, visible, focused, sound, chime, chimedWrong>>
\* lift(): keyup, pointerup, pointercancel, lost capture. They reach the page only while it has focus.
YouLetGo == /\ hand
            /\ hand' = FALSE /\ held' = IF focused THEN FALSE ELSE held
            /\ UNCHANGED <<view, paused, visible, focused, away, hum, sound, chime, chimedWrong>>
\* reach() crosses a floor with no chance lost: clearedStage() → window.setTimeout(sfx.levelUp, 900), never cleared.
AFloorIsCleared == /\ ClockRuns /\ ~chime
                   /\ chime' = TRUE
                   /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, hum, sound, chimedWrong>>
TheChimePlays == /\ chime
                 /\ chime' = FALSE /\ chimedWrong' = (chimedWrong \/ ~(view = "play" /\ ~paused /\ visible))
                 /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, hum, sound>>
\* The last chance is lost: finish() stops the hum, releases every side, shows the result.
TheRunEnds == /\ ClockRuns
              /\ view' = "over" /\ hum' = "none" /\ held' = FALSE /\ away' = FALSE
              /\ UNCHANGED <<paused, visible, focused, hand, sound, chime, chimedWrong>>
\* newGame(): আরেকবার, Space on the result, or a floor in সব তলা. Clears the toast timer, not the chime.
YouPlayAgain == /\ visible /\ focused /\ view # "ready"
                /\ view' = "ready" /\ paused' = FALSE /\ hum' = "none" /\ away' = FALSE
                /\ held' = IF view = "over" THEN FALSE ELSE held
                /\ UNCHANGED <<visible, focused, hand, sound, chime, chimedWrong>>
\* P, Esc or থামাও: the hum effect stops the hum. Held sides stay held.
YouPause == /\ Looping /\ visible /\ focused
            /\ paused' = TRUE /\ hum' = "none" /\ away' = FALSE
            /\ UNCHANGED <<view, visible, focused, held, hand, sound, chime, chimedWrong>>
\* চালিয়ে যাও, Space, P, a side: the hum effect runs hum.current ??= rollHum(); the loop remounts with away = false.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ away' = FALSE /\ hum' = IF view = "play" THEN KeepOrOpen ELSE hum
             /\ UNCHANGED <<view, visible, focused, held, hand, sound, chime, chimedWrong>>
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ away' = Looping
               /\ UNCHANGED <<view, paused, visible, held, hand, hum, sound, chime, chimedWrong>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ away' = FALSE
                 /\ UNCHANGED <<view, paused, visible, held, hand, hum, sound, chime, chimedWrong>>
\* hide(): release(), stopHum(), pause while playing.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ hum' = "none" /\ away' = FALSE
            /\ paused' = (paused \/ view = "play")
            /\ UNCHANGED <<view, hand, sound, chime, chimedWrong>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<view, paused, away, held, hand, hum, sound, chime, chimedWrong>>
\* The site-wide switch. Off: stopLoops(), hum.current = null. On: hum.current ??= rollHum() while playing.
SoundOff == /\ sound /\ visible /\ focused /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, chime, chimedWrong>>
SoundOn == /\ ~sound /\ visible /\ focused /\ sound' = TRUE
           /\ hum' = IF Looping THEN (IF hum = "none" THEN "real" ELSE hum) ELSE hum
           /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, chime, chimedWrong>>

Next == YouHoldSide \/ YouLetGo \/ AFloorIsCleared \/ TheChimePlays \/ TheRunEnds \/ YouPlayAgain \/ YouPause \/ YouResume
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ view \in Views /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ away \in BOOLEAN
          /\ held \in BOOLEAN /\ hand \in BOOLEAN /\ hum \in {"none", "stub", "real"} /\ sound \in BOOLEAN
          /\ chime \in BOOLEAN /\ chimedWrong \in BOOLEAN

\* The reader's rules.
NoProgressWhileAway == ClockRuns => focused
InputReleasedWhenAway == held => focused
\* The marble rolls sideways only while you really hold a side.
MarbleRollsOnlyWhenHeld == (ClockRuns /\ held) => hand
PausedWhenHidden == (~visible /\ view = "play") => paused
PausedWhenBlurred == (~focused /\ view = "play") => paused
LoopOnlyWhenMeaningful == HumSounds => (view = "play" /\ ~paused /\ visible /\ focused)
LoopComesBack == (sound /\ Looping) => hum = "real"
\* The floor-cleared chime is heard only while that run is still rolling in front of you.
NoChimeAfterLeaving == ~chimedWrong
====
