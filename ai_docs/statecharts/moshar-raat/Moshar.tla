---- MODULE Moshar ----
\* মশার রাত as it is today: the night's phase, pause, the window, the board on screen, the night clock,
\* the mosquito whine loop, the site-wide sound switch, results and saved stars.
\* Mirrored from tools/moshar-raat/components/moshar-game.tsx (startNight, begin, finish, tick, resume, retry,
\* nextNight, keys, onPointerDown, the visibilitychange effect, `useEffect(() => { if (!looping) stopWhine() })`,
\* SoundToggle onChange) and tools/moshar-raat/lib/night.ts (step: dawn or the third bite ends the night).
\* useGameLoop (shared/game-kit.ts) feeds tick() a fixed dt and stops on blur, hide and when looping is false,
\* so the night clock cannot run while away. whine() is loop("whine") in lib/sound.ts; loop() returns a silent
\* stub when sound is off (shared/game-sound.ts). Twenty nights are abstracted to "this night" and "the next".
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, inView, sound, whine, results, saved
vars == <<phase, paused, visible, focused, inView, sound, whine, results, saved>>

Phases == {"ready", "play", "won", "lost"}
\* whine: live.whine. "none" = null, "stub" = made while sound was off, "live" = whining.
Whines == {"none", "stub", "live"}
\* looping = !paused && phase === "play" && boardInView; the rAF loop also stops on blur and hide.
Looping == phase = "play" /\ ~paused /\ inView
LoopSteps == Looping /\ visible /\ focused
Made == IF sound THEN "live" ELSE "stub"
Max(a, b) == IF a > b THEN a ELSE b

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ sound \in BOOLEAN /\ whine = "none" /\ results = 0 /\ saved = 0

\* begin(): শুরু করো in the overlay, or Space (needs boardInView). lightSwitch(), phase "play".
YouStart == /\ phase = "ready" /\ visible /\ focused /\ inView
            /\ phase' = "play"
            /\ UNCHANGED <<paused, visible, focused, inView, sound, whine, results, saved>>
\* tick(), every 4th step: `live.whine ??= whine()` then set(near). The night clock moves by dt.
MosquitoesFly == /\ LoopSteps
                 /\ whine' = IF whine = "none" THEN Made ELSE whine
                 /\ UNCHANGED <<phase, paused, visible, focused, inView, sound, results, saved>>
\* step() → night.over: finish() → stopWhine(); a won night records stars once.
DawnComes == /\ LoopSteps
             /\ phase' = "won" /\ whine' = "none" /\ results' = results + 1
             /\ \E earned \in {1, 2}: saved' = Max(saved, earned)
             /\ UNCHANGED <<paused, visible, focused, inView, sound>>
ThirdBite == /\ LoopSteps
             /\ phase' = "lost" /\ whine' = "none" /\ results' = results + 1
             /\ UNCHANGED <<paused, visible, focused, inView, sound, saved>>
\* useGameLoop's blur listener: cancelAnimationFrame only. The night freezes, nothing pauses, the whine plays on.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, inView, sound, whine, results, saved>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, inView, sound, whine, results, saved>>
\* visibilitychange → hidden: stopWhine(); pause only in play.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ whine' = "none"
            /\ paused' = (paused \/ phase = "play")
            /\ UNCHANGED <<phase, inView, sound, results, saved>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, inView, sound, whine, results, saved>>
\* boardInView false → looping false → the effect stops the whine. No pause: the night just freezes.
ScrollAway == /\ visible /\ focused /\ inView
              /\ inView' = FALSE
              /\ whine' = IF Looping THEN "none" ELSE whine
              /\ UNCHANGED <<phase, paused, visible, focused, sound, results, saved>>
ScrollBack == /\ visible /\ focused /\ ~inView /\ inView' = TRUE
              /\ UNCHANGED <<phase, paused, visible, focused, sound, whine, results, saved>>
\* resume(): চালিয়ে যাও in the overlay or Space. No guard of its own.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE
             /\ UNCHANGED <<phase, visible, focused, inView, sound, whine, results, saved>>
\* SoundToggle: setSoundOn() (off stops every loop), then onChange → stopWhine() either way.
SoundOff == /\ sound /\ visible /\ focused
            /\ sound' = FALSE /\ whine' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, inView, results, saved>>
SoundOn == /\ ~sound /\ visible /\ focused
           /\ sound' = TRUE /\ whine' = "none"
           /\ UNCHANGED <<phase, paused, visible, focused, inView, results, saved>>
\* retry(): আবার খেলো / আরেকবার / Space on the lost card → startNight(level, seed, play = true).
YouPlayAgain == /\ phase \in {"won", "lost"} /\ visible /\ focused
                /\ phase' = "play" /\ paused' = FALSE /\ whine' = "none" /\ results' = 0
                /\ UNCHANGED <<visible, focused, inView, sound, saved>>
\* nextNight() (পরের রাত, Space on the won card) or the LevelGrid (any phase) → startNight(…, play = false).
YouPickANight == /\ visible /\ focused
                 /\ phase' = "ready" /\ paused' = FALSE /\ whine' = "none" /\ results' = 0
                 /\ UNCHANGED <<visible, focused, inView, sound, saved>>

Next == YouStart \/ MosquitoesFly \/ DawnComes \/ ThirdBite \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ ScrollAway \/ ScrollBack \/ YouResume \/ SoundOff \/ SoundOn \/ YouPlayAgain \/ YouPickANight

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ inView \in BOOLEAN /\ sound \in BOOLEAN /\ whine \in Whines /\ results \in 0..2 /\ saved \in 0..2

\* The reader's rules.
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
\* The whine plays only while mosquitoes fly on a focused, visible page with sound on.
LoopOnlyWhenMeaningful == whine = "live" => (Looping /\ visible /\ focused /\ sound)
\* While the night runs with sound on, the whine is never a silent stub (none is fine: the next tick makes it).
LoopComesBack == (LoopSteps /\ sound) => whine # "stub"
NoDoubleResult == results <= 1
NoWhineOnTheCard == phase \in {"won", "lost"} => whine = "none"
StarsNeverDrop == [][saved' >= saved]_vars
====
