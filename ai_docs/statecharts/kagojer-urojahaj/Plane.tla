---- MODULE Plane ----
\* কাগজের উড়োজাহাজ: the wave, pause, window and tab, held steering (arrow keys, ◀ ▶ and the canvas drag), the wind loop,
\* and the cheer timer, mirrored from tools/kagojer-urojahaj/components/plane-game.tsx (go, start/play/again/proceed, finish,
\* later(), the keydown/keyup effect, onDown/onMove/onUp, holdDown/holdUp, the visibilitychange effect, the [paused] effect,
\* startWind/stopWind and the SoundToggle onChange) and from useGameLoop in shared/game-kit.ts (working copy: blur cancels the
\* frame and sets `away`, focus clears it, a remount starts with away = false). `held` is what the game believes
\* (game.steer or drag.current); `hand` is whether your finger or key is really down.
VARIABLES view, paused, visible, focused, away, held, hand, wind, sound, cheer
vars == <<view, paused, visible, focused, away, held, hand, wind, sound, cheer>>

Views == {"ready", "play", "end"}
Looping == view = "play" /\ ~paused
ClockRuns == Looping /\ visible /\ ~away
WindSounds == wind = "real" /\ sound
NewLoop == IF sound THEN "real" ELSE "stub"

Init == /\ view = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ away = FALSE
        /\ held = FALSE /\ hand = FALSE /\ wind = "none" /\ sound = TRUE /\ cheer = FALSE

\* go(): উড়াও, Space/Enter, a tap on the sky, or the first arrow key. startWind() opens the loop (a stub while sound is off).
YouLaunch == /\ view = "ready" /\ visible /\ focused
             /\ view' = "play" /\ wind' = NewLoop /\ away' = FALSE
             /\ UNCHANGED <<paused, visible, focused, held, hand, sound, cheer>>
\* Hold ← → (or A D), hold ◀ ▶, or put a finger on the sky and drag. Ignored while paused.
YouHoldSteer == /\ view = "play" /\ ~paused /\ visible /\ focused /\ ~hand
                /\ hand' = TRUE /\ held' = TRUE
                /\ UNCHANGED <<view, paused, visible, focused, away, wind, sound, cheer>>
\* keyup / pointerup / pointercancel. Away from the page the release never reaches it.
YouLetGo == /\ hand
            /\ hand' = FALSE /\ held' = IF focused THEN FALSE ELSE held
            /\ UNCHANGED <<view, paused, visible, focused, away, wind, sound, cheer>>
\* step() ends the wave (cleared, or wet three times): finish() stops the wind, steer(0), and on a win queues the cheer.
TheWaveEnds == /\ ClockRuns
               /\ view' = "end" /\ wind' = "none" /\ held' = FALSE /\ cheer' \in BOOLEAN
               /\ UNCHANGED <<paused, visible, focused, away, hand, sound>>
\* later(after, sfx.win / sfx.levelUp + confetti) fires.
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, wind, sound>>
\* start(): পরের লেভেল, আবার খেলো, Space on the result, or a level in সব লেভেল. Clears the timers and the drag, steer 0.
YouPlayAgain == /\ visible /\ focused /\ view # "ready"
                /\ view' = "ready" /\ paused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ cheer' = FALSE /\ away' = FALSE
                /\ UNCHANGED <<visible, focused, hand, sound>>
\* P, Esc or থামাও. The [paused] effect: stopWind(), steer(0).
YouPause == /\ Looping /\ visible /\ focused
            /\ paused' = TRUE /\ wind' = "none" /\ held' = FALSE /\ away' = FALSE
            /\ UNCHANGED <<view, visible, focused, hand, sound, cheer>>
\* চালিয়ে যাও, Space, P again, a tap on the sky. The [paused] effect reopens the wind; the loop remounts with away = false.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ away' = FALSE
             /\ wind' = IF view = "play" /\ wind = "none" THEN NewLoop ELSE wind
             /\ UNCHANGED <<view, visible, focused, held, hand, sound, cheer>>
\* useGameLoop's blur and focus. Nothing in the game itself listens.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ away' = Looping
               /\ UNCHANGED <<view, paused, visible, held, hand, wind, sound, cheer>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ away' = FALSE
                 /\ UNCHANGED <<view, paused, visible, held, hand, wind, sound, cheer>>
\* onVisibility: drag = null, steer 0, and pause while the wave is in play (the [paused] effect stops the wind).
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ away' = FALSE
            /\ paused' = (paused \/ view = "play")
            /\ wind' = IF view = "play" THEN "none" ELSE wind
            /\ UNCHANGED <<view, hand, sound, cheer>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<view, paused, away, held, hand, wind, sound, cheer>>
\* The site-wide switch. Off: stopLoops(), wind = null. On: startWind() if the wave is in play and not paused.
SoundOff == /\ sound /\ visible /\ focused /\ sound' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, cheer>>
SoundOn == /\ ~sound /\ visible /\ focused /\ sound' = TRUE
           /\ wind' = IF Looping THEN "real" ELSE wind
           /\ UNCHANGED <<view, paused, visible, focused, away, held, hand, cheer>>

Next == YouLaunch \/ YouHoldSteer \/ YouLetGo \/ TheWaveEnds \/ TheCheerPlays \/ YouPlayAgain \/ YouPause \/ YouResume
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ view \in Views /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ away \in BOOLEAN
          /\ held \in BOOLEAN /\ hand \in BOOLEAN /\ wind \in {"none", "stub", "real"} /\ sound \in BOOLEAN /\ cheer \in BOOLEAN

\* The reader's rules.
NoProgressWhileAway == ClockRuns => focused
InputReleasedWhenAway == held => focused
\* The plane moves only while you are really holding a side or dragging.
PlaneMovesOnlyWhenHeld == (ClockRuns /\ held) => hand
PausedWhenHidden == (~visible /\ view = "play") => paused
PausedWhenBlurred == (~focused /\ view = "play") => paused
LoopOnlyWhenMeaningful == WindSounds => (view = "play" /\ ~paused /\ visible /\ focused)
LoopComesBack == (sound /\ Looping) => wind = "real"
\* The cheer for a cleared wave is heard only on that wave's result.
NoCheerAfterLeaving == cheer => view = "end"
====
