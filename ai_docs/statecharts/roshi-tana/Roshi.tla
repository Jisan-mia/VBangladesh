---- MODULE Roshi ----
\* রশি টানাটানি after the rewrite: the screen, the player's pause menu, the window, the level list, the match clock,
\* the fresh count-in after any time away, the crowd loop, the site-wide sound switch, results and saved stars.
\* Mirrored from tools/roshi-tana/lib/session.ts (ticking, canTap, wantCrowd, syncLoops, blur/focus/hide/show,
\* pause/resume, openSheet/closeSheet, setSound, goTo, tick, wake) and tools/roshi-tana/components/game.tsx
\* (begin, step, finish, wakeUp, the player's onPause/onResume, the sound effect). The match clock only moves inside
\* step(), and step() runs only while ticking (screen play, menu shut, list shut, tab visible, window focused); a single
\* step never moves it more than MAX_GAP. The shared player opens its menu on blur, hide and scrolling the stage away once
\* the game was touched (starting a match touches it). The crowd is started only by syncLoops when wantCrowd holds,
\* so it is never a stub made while muted. Two-player mode shares every path and is left out.
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, inView, sheet, sound, hum, unseen, stale, results, saved
vars == <<phase, paused, visible, focused, inView, sheet, sound, hum, unseen, stale, results, saved>>

Phases == {"title", "play", "over"}
Hums == {"none", "stub", "live"}
\* session.ts ticking(): the only state in which step() moves the clock.
Ticking == phase = "play" /\ ~paused /\ ~sheet /\ visible /\ focused /\ inView
\* The match clock is S.tick() inside step(): it runs exactly when the loop steps.
ClockRuns == Ticking
\* syncLoops: the crowd it leaves behind for a state.
Crowd(ph, pz, sh, vi, fo, iv, so) == IF ph = "play" /\ ~pz /\ ~sh /\ vi /\ fo /\ iv /\ so THEN "live" ELSE "none"
Max(a, b) == IF a > b THEN a ELSE b

Init == /\ phase = "title" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE /\ sheet = FALSE
        /\ sound \in BOOLEAN /\ hum = "none" /\ unseen = 0 /\ stale = FALSE /\ results = 0 /\ saved = 0

\* begin(): the title drum, a level picked in the list, or a choice on the card. A fresh clock with its own ৩-২-১.
YouStart == /\ phase \in {"title", "over"} /\ ~paused /\ visible /\ focused /\ inView
            /\ phase' = "play" /\ sheet' = FALSE /\ stale' = FALSE /\ unseen' = 0 /\ results' = 0
            /\ hum' = Crowd("play", FALSE, FALSE, TRUE, TRUE, TRUE, sound)
            /\ UNCHANGED <<paused, visible, focused, inView, sound, saved>>
\* step() → advance(): the ribbon reaches a line or the 60 beats run out → finish() once (goTo over stops ticking).
YouWinTheMatch == /\ Ticking /\ unseen = 0
                  /\ phase' = "over" /\ hum' = "none" /\ results' = results + 1
                  /\ \E earned \in {1, 2}: saved' = Max(saved, earned)
                  /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound, unseen, stale>>
YouLoseTheMatch == /\ Ticking /\ unseen = 0
                   /\ phase' = "over" /\ hum' = "none" /\ results' = results + 1
                   /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound, unseen, stale, saved>>
\* A beat would go by unseen only if the clock ran while the loop wasn't stepping. It can't: the clock is the step.
BeatGoesByUnseen == /\ ClockRuns /\ ~Ticking /\ unseen < 2
                    /\ unseen' = unseen + 1
                    /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, sound, hum, stale, results, saved>>
\* Leaving: session.blur/hide (stale if it was ticking), syncLoops stops the crowd, the player opens its menu in play.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ hum' = "none"
               /\ UNCHANGED <<phase, visible, inView, sheet, sound, unseen, results, saved>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ hum' = "none"
            /\ UNCHANGED <<phase, inView, sheet, sound, unseen, results, saved>>
ScrollAway == /\ visible /\ focused /\ inView
              /\ inView' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ hum' = "none"
              /\ UNCHANGED <<phase, visible, focused, sheet, sound, unseen, results, saved>>
\* Coming back: wake() re-bases the clock and runs a fresh count-in if the match may tick again; otherwise nothing yet.
Back(fo, vi, iv) == /\ focused' = fo /\ visible' = vi /\ inView' = iv
                    /\ LET t == phase = "play" /\ ~paused /\ ~sheet /\ vi /\ fo /\ iv
                       IN /\ stale' = (stale /\ ~t)
                          /\ hum' = Crowd(phase, paused, sheet, vi, fo, iv, sound)
WindowFocuses == /\ visible /\ ~focused /\ Back(TRUE, TRUE, inView)
                 /\ UNCHANGED <<phase, paused, sheet, sound, unseen, results, saved>>
TabShows == /\ ~visible /\ Back(TRUE, TRUE, inView)
            /\ UNCHANGED <<phase, paused, sheet, sound, unseen, results, saved>>
ScrollBack == /\ visible /\ focused /\ ~inView /\ Back(focused, visible, TRUE)
              /\ UNCHANGED <<phase, paused, sheet, sound, unseen, results, saved>>
\* The player's ⏸ or the game's own P key (requestPause).
YouPause == /\ phase = "play" /\ ~paused /\ visible /\ focused
            /\ paused' = TRUE /\ stale' = (stale \/ Ticking) /\ hum' = "none"
            /\ UNCHANGED <<phase, visible, focused, inView, sheet, sound, unseen, results, saved>>
\* চালিয়ে যাও: onResume → S.resume, wakeUp (fresh count-in), syncLoops (a fresh crowd if sound is on).
YouResume == /\ paused /\ visible /\ focused /\ inView
             /\ paused' = FALSE
             /\ stale' = (stale /\ ~(phase = "play" /\ ~sheet))
             /\ hum' = Crowd(phase, FALSE, sheet, visible, focused, inView, sound)
             /\ UNCHANGED <<phase, visible, focused, inView, sheet, sound, unseen, results, saved>>
\* The level list: a choice screen. Opening it stops the clock and the crowd; closing it wakes the match.
OpenTheList == /\ ~sheet /\ ~paused /\ visible /\ focused
               /\ sheet' = TRUE /\ stale' = (stale \/ Ticking) /\ hum' = "none"
               /\ UNCHANGED <<phase, paused, visible, focused, inView, sound, unseen, results, saved>>
CloseTheList == /\ sheet /\ ~paused /\ visible /\ focused
                /\ sheet' = FALSE
                /\ stale' = (stale /\ ~(phase = "play" /\ inView))
                /\ hum' = Crowd(phase, FALSE, FALSE, visible, focused, inView, sound)
                /\ UNCHANGED <<phase, paused, visible, focused, inView, sound, unseen, results, saved>>
\* The site-wide switch (the menu or the desktop bar). Off: the kit stops every loop. On: syncLoops starts a fresh one.
SoundOff == /\ sound
            /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, unseen, stale, results, saved>>
SoundOn == /\ ~sound
           /\ sound' = TRUE /\ hum' = Crowd(phase, paused, sheet, visible, focused, inView, TRUE)
           /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, unseen, stale, results, saved>>

Next == YouStart \/ YouWinTheMatch \/ YouLoseTheMatch \/ BeatGoesByUnseen
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack \/ YouPause \/ YouResume
        \/ OpenTheList \/ CloseTheList \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ sheet \in BOOLEAN /\ sound \in BOOLEAN /\ hum \in Hums /\ unseen \in 0..2 /\ stale \in BOOLEAN
          /\ results \in 0..2 /\ saved \in 0..2

\* The reader's rules (the same ones that broke before, plus the new choice and count-in rules).
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
NoProgressWhileAway == unseen = 0
OffScreenMeansPaused == (~inView /\ phase = "play") => paused
LoopOnlyWhenMeaningful == hum = "live" => (Ticking /\ sound)
LoopComesBack == (Ticking /\ sound) => hum = "live"
NeverAStub == hum # "stub"
ChoiceFreezesPlay == sheet => ~Ticking
\* Whenever the match ticks again after time away, the count-in has been re-run (the click back is not a move).
FreshCountInOnReturn == Ticking => ~stale
NoDoubleResult == results <= 1
StarsNeverDrop == [][saved' >= saved]_vars
====
