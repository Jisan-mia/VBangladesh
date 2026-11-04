---- MODULE Roshi ----
\* রশি টানাটানি as it is today: the match phase, pause, the window, the board on screen, the beat clock,
\* the crowd loop, the site-wide sound switch, results and saved stars.
\* Mirrored from tools/roshi-tana/components/roshi-game.tsx (start, pause, resume, finish, step, toReady,
\* soloAction/onBoardDown/keys, the visibilitychange and boardInView effects, SoundToggle onChange) and
\* tools/roshi-tana/lib/rope.ts (update: the bot pulls every beat up to t; resume). useGameLoop (shared/game-kit.ts)
\* stops stepping on window blur and on hide, but the match clock is t = performance.now() - origin, so real
\* time keeps counting until pause() re-bases it. crowd() is loop("wind") in lib/sound.ts; loop() returns a
\* silent stub when sound is off (shared/game-sound.ts). Two-player mode shares every path and is left out.
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, inView, sound, hum, unseen, results, saved
vars == <<phase, paused, visible, focused, inView, sound, hum, unseen, results, saved>>

Phases == {"ready", "play", "over"}
\* hum: live.hum. "none" = null, "stub" = crowd() made while sound was off (silent, but not null), "live" = playing.
Hums == {"none", "stub", "live"}
\* The match clock runs whenever the match is on and not paused (origin-based real time).
ClockRuns == phase = "play" /\ ~paused
\* useGameLoop steps only while looping (not paused, board in view) and the window is focused and visible.
LoopSteps == ClockRuns /\ visible /\ focused /\ inView
Crowd == IF sound THEN "live" ELSE "stub"
Max(a, b) == IF a > b THEN a ELSE b

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ sound \in BOOLEAN /\ hum = "none" /\ unseen = 0 /\ results = 0 /\ saved = 0

\* start(): from the ready drum (tap, Space) or the card's buttons. stopHum(); live.hum = crowd(); a fresh clock.
YouStart == /\ phase \in {"ready", "over"} /\ visible /\ focused /\ inView
            /\ phase' = "play" /\ paused' = FALSE /\ hum' = Crowd /\ unseen' = 0 /\ results' = 0
            /\ UNCHANGED <<visible, focused, inView, sound, saved>>
\* step() → update(): the rope reaches a line or 60 beats run out → finish(): stopHum(), record stars once (live.ended).
YouWinTheMatch == /\ LoopSteps /\ unseen = 0
                  /\ phase' = "over" /\ hum' = "none" /\ results' = results + 1
                  /\ \E earned \in {1, 2}: saved' = Max(saved, earned)
                  /\ UNCHANGED <<paused, visible, focused, inView, sound, unseen>>
YouLoseTheMatch == /\ LoopSteps /\ unseen = 0
                   /\ phase' = "over" /\ hum' = "none" /\ results' = results + 1
                   /\ UNCHANGED <<paused, visible, focused, inView, sound, unseen, saved>>
\* Real time passes while the loop is frozen but the clock isn't paused: beats go by that nobody steps.
BeatGoesByUnseen == /\ ClockRuns /\ ~LoopSteps /\ unseen < 2
                    /\ unseen' = unseen + 1
                    /\ UNCHANGED <<phase, paused, visible, focused, inView, sound, hum, results, saved>>
\* The loop restarts: update(m, t) runs every missed beat at once (the bot pulls each, your beats count as missed,
\* the drum fires every missed stroke now). The match may end on this one step.
LoopCatchesUp == /\ LoopSteps /\ unseen > 0
                 /\ unseen' = 0
                 /\ UNCHANGED <<phase, paused, visible, focused, inView, sound, hum, results, saved>>
\* useGameLoop's blur listener: cancelAnimationFrame only. Nothing pauses, the crowd keeps playing.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, inView, sound, hum, unseen, results, saved>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, inView, sound, hum, unseen, results, saved>>
\* visibilitychange → hidden: pause() (only in play): pausedAt = t, stopHum().
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ paused' = (paused \/ phase = "play")
            /\ hum' = IF phase = "play" THEN "none" ELSE hum
            /\ UNCHANGED <<phase, inView, sound, unseen, results, saved>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, inView, sound, hum, unseen, results, saved>>
\* useEffect([boardInView]): scrolling the field away pauses the solo match.
ScrollAway == /\ visible /\ focused /\ inView
              /\ inView' = FALSE
              /\ paused' = (paused \/ phase = "play")
              /\ hum' = IF phase = "play" THEN "none" ELSE hum
              /\ UNCHANGED <<phase, visible, focused, sound, unseen, results, saved>>
ScrollBack == /\ visible /\ focused /\ ~inView /\ inView' = TRUE
              /\ UNCHANGED <<phase, paused, visible, focused, sound, hum, unseen, results, saved>>
\* resume(): the overlay button inside the field, or Space (needs boardInView). Re-bases origin, fresh count-in, crowd().
YouResume == /\ paused /\ visible /\ focused /\ inView
             /\ paused' = FALSE /\ hum' = Crowd
             /\ UNCHANGED <<phase, visible, focused, inView, sound, unseen, results, saved>>
\* SoundToggle: setSoundOn(false) stops every loop, then onChange sets live.hum = null.
SoundOff == /\ sound /\ visible /\ focused
            /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, inView, unseen, results, saved>>
\* onChange(true): `live.hum ??= crowd()` while playing. A stub from a sound-off start is not null, so it stays.
SoundOn == /\ ~sound /\ visible /\ focused
           /\ sound' = TRUE
           /\ hum' = IF ClockRuns /\ hum = "none" THEN "live" ELSE hum
           /\ UNCHANGED <<phase, paused, visible, focused, inView, unseen, results, saved>>
\* LevelGrid onPick → toReady(): stopHum(), a fresh idle match. Works in every phase, mid-match too.
YouPickALevel == /\ visible /\ focused
                 /\ phase' = "ready" /\ paused' = FALSE /\ hum' = "none" /\ unseen' = 0
                 /\ UNCHANGED <<visible, focused, inView, sound, results, saved>>

Next == YouStart \/ YouWinTheMatch \/ YouLoseTheMatch \/ BeatGoesByUnseen \/ LoopCatchesUp
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack \/ YouResume
        \/ SoundOff \/ SoundOn \/ YouPickALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ inView \in BOOLEAN /\ sound \in BOOLEAN /\ hum \in Hums /\ unseen \in 0..2
          /\ results \in 0..2 /\ saved \in 0..2

\* The reader's rules.
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
\* No beat of the match goes by while you can't see it or answer it.
NoProgressWhileAway == unseen = 0
OffScreenMeansPaused == (~inView /\ phase = "play") => paused
\* The crowd plays only while a match is running on a focused, visible page with sound on.
LoopOnlyWhenMeaningful == hum = "live" => (phase = "play" /\ ~paused /\ visible /\ focused /\ sound)
\* While a match runs with sound on, the crowd plays, including after you turn sound back on.
LoopComesBack == (ClockRuns /\ visible /\ focused /\ inView /\ sound) => hum = "live"
NoDoubleResult == results <= 1
StarsNeverDrop == [][saved' >= saved]_vars
====
