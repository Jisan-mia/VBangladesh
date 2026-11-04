---- MODULE Badminton ----
\* গলির ব্যাডমিন্টন after the rewrite: the screen, the player's pause menu, the window and tab, the level list, a finger held
\* on the shuttle, the breath after coming back, the rooftop wind loop, the site-wide sound switch and the result keys.
\* Mirrored from tools/golir-badminton/lib/session.ts (ticking, canSwing, wantWind, syncLoops, blur/focus/hide/show,
\* pause/resume, openSheet/closeSheet, setSound, press/lift, goTo, freshResultKey, wake, step) and
\* tools/golir-badminton/components/game.tsx (begin, engaged, letGo, away/back, the player's onPause/onResume, touch/decide,
\* finish, the sound effect, the window keys). The match moves only inside step(), which advances it only while ticking and
\* after the breath; `focused` starts from document.hasFocus() and lives in the session, so remounting useGameLoop (the old
\* bug 3) changes nothing. Leaving in any way lets a held finger go as the tap it was. The player opens its menu on blur, hide
\* and the stage scrolling away once the game was touched (starting a match touches it). Modelled on a rooftop (wind) level.
VARIABLES phase, paused, visible, focused, sheet, sound, wind, held, stale, breath, fresh, skipped
vars == <<phase, paused, visible, focused, sheet, sound, wind, held, stale, breath, fresh, skipped>>

Phases == {"title", "play", "over"}
Winds == {"none", "stub", "live"}
\* session.ts ticking(): the only state in which step() runs at all.
TickingOf(ph, pz, sh, vi, fo) == ph = "play" /\ ~pz /\ ~sh /\ vi /\ fo
Ticking == TickingOf(phase, paused, sheet, visible, focused)
\* step() moves the match only after the breath.
ClockRuns == Ticking /\ ~breath
CanSwing == Ticking /\ ~breath
\* syncLoops: the wind it leaves behind for a state (a fresh loop() each time it turns on, so never a stub).
WindOf(ph, pz, sh, vi, fo, so) == IF TickingOf(ph, pz, sh, vi, fo) /\ so THEN "live" ELSE "none"

Init == /\ phase = "title" /\ paused = FALSE /\ visible = TRUE /\ focused \in BOOLEAN /\ sheet = FALSE
        /\ sound \in BOOLEAN /\ wind = "none" /\ held = FALSE /\ stale = FALSE /\ breath = FALSE /\ fresh = FALSE /\ skipped = FALSE

\* begin(): the shuttle on the title, a level picked in the list, or a choice on the end screen. A press on a window that
\* has no focus first gives it focus (engaged(), the same as WindowFocuses), so the start itself runs on a focused page.
YouStart == /\ phase \in {"title", "over"} /\ ~paused /\ visible /\ focused
            /\ phase' = "play" /\ sheet' = FALSE /\ stale' = FALSE /\ breath' = FALSE /\ held' = FALSE /\ fresh' = FALSE
            /\ wind' = WindOf("play", FALSE, FALSE, TRUE, TRUE, sound)
            /\ UNCHANGED <<paused, visible, focused, sound, skipped>>
\* touch(): a finger or key lands while the match can take a swing; the match holds the shuttle until the touch decides.
YouTouch == /\ CanSwing /\ ~held
            /\ held' = TRUE
            /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, stale, breath, fresh, skipped>>
\* decide(): the pull or the lift of the finger (or the match's own 200 ms limit) plays the shot.
YouDecide == /\ held /\ held' = FALSE
             /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, stale, breath, fresh, skipped>>
\* The breath after coming back runs out (step() counts it down only while ticking).
TheBreathEnds == /\ Ticking /\ breath /\ breath' = FALSE
                 /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, held, stale, fresh, skipped>>
\* step() → advance(): someone reaches the points → finish() → show("over") (no stepping after; the wind stops).
TheMatchEnds == /\ ClockRuns
                /\ phase' = "over" /\ fresh' = TRUE /\ wind' = "none" /\ held' = FALSE
                /\ UNCHANGED <<paused, visible, focused, sheet, sound, stale, breath, skipped>>
\* A key on the end screen: freshResultKey takes only a keydown that arrived after the screen appeared, without repeat.
\* While `fresh`, the key is the swing that was already on its way (or held through the end), and is ignored.
YouPressAKeyOnTheResult == /\ phase = "over" /\ ~paused /\ ~sheet /\ visible /\ focused
                           /\ IF fresh THEN UNCHANGED vars
                              ELSE /\ phase' = "play" /\ skipped' = (skipped \/ fresh) /\ held' = FALSE /\ stale' = FALSE /\ breath' = FALSE
                                   /\ wind' = WindOf("play", FALSE, FALSE, TRUE, TRUE, sound)
                                   /\ UNCHANGED <<paused, visible, focused, sheet, sound, fresh>>
TheResultSettles == /\ fresh /\ fresh' = FALSE
                    /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, held, stale, breath, skipped>>
\* Leaving (session away(): stale if it was ticking; letGo; syncLoops). The player opens its menu in a match.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ held' = FALSE /\ wind' = "none"
               /\ UNCHANGED <<phase, visible, sheet, sound, breath, fresh, skipped>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ held' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, sheet, sound, breath, fresh, skipped>>
YouPause == /\ phase = "play" /\ ~paused /\ visible /\ focused
            /\ paused' = TRUE /\ stale' = (stale \/ Ticking) /\ held' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, visible, focused, sheet, sound, breath, fresh, skipped>>
\* Coming back (session back(): wake gives a breath when the match may tick again after time away; syncLoops).
Wake(ph, pz, sh, vi, fo) == LET t == TickingOf(ph, pz, sh, vi, fo) IN
                            /\ stale' = (stale /\ ~t) /\ breath' = (breath \/ (stale /\ t))
                            /\ wind' = WindOf(ph, pz, sh, vi, fo, sound)
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ Wake(phase, paused, sheet, TRUE, TRUE)
                 /\ UNCHANGED <<phase, paused, visible, sheet, sound, held, fresh, skipped>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE /\ Wake(phase, paused, sheet, TRUE, TRUE)
            /\ UNCHANGED <<phase, paused, sheet, sound, held, fresh, skipped>>
\* চালিয়ে যাও (onResume), or নতুন করে শুরু, which is begin() from the menu.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ Wake(phase, FALSE, sheet, visible, focused)
             /\ UNCHANGED <<phase, visible, focused, sheet, sound, held, fresh, skipped>>
\* The level list: a choice screen. Opening stops the match and lets a finger go; closing wakes it with a breath.
\* It opens from the title and the end screen (there is no list button during play; the menu has none either).
OpenTheList == /\ ~sheet /\ ~paused /\ visible /\ focused /\ phase # "play"
               /\ sheet' = TRUE /\ stale' = (stale \/ Ticking) /\ held' = FALSE /\ wind' = "none"
               /\ UNCHANGED <<phase, paused, visible, focused, sound, breath, fresh, skipped>>
CloseTheList == /\ sheet /\ ~paused /\ visible /\ focused
                /\ sheet' = FALSE /\ Wake(phase, FALSE, FALSE, visible, focused)
                /\ UNCHANGED <<phase, paused, visible, focused, sound, held, fresh, skipped>>
\* useGameLoop's effect remounts (running flips): the session is a ref, so nothing it knows changes.
TheLoopRemounts == UNCHANGED vars
\* The site-wide switch (the menu or the desktop bar). Off: the kit stops every loop. On: syncLoops starts a fresh one.
SoundOff == /\ sound /\ sound' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, sheet, held, stale, breath, fresh, skipped>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ wind' = WindOf(phase, paused, sheet, visible, focused, TRUE)
           /\ UNCHANGED <<phase, paused, visible, focused, sheet, held, stale, breath, fresh, skipped>>

Next == YouStart \/ YouTouch \/ YouDecide \/ TheBreathEnds \/ TheMatchEnds \/ YouPressAKeyOnTheResult \/ TheResultSettles
        \/ WindowBlurs \/ TabHides \/ YouPause \/ WindowFocuses \/ TabShows \/ YouResume \/ OpenTheList \/ CloseTheList
        \/ TheLoopRemounts \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ sheet \in BOOLEAN
          /\ sound \in BOOLEAN /\ wind \in Winds /\ held \in BOOLEAN /\ stale \in BOOLEAN /\ breath \in BOOLEAN
          /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN

\* The reader's rules: the eight from before the rewrite, plus the new ones.
NoProgressWhileAway == ClockRuns => (focused /\ visible /\ ~paused)
InputReleasedWhenAway == held => (focused /\ visible /\ ~paused /\ ~sheet)
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
PauseOnlyMidMatch == (stale \/ breath) => phase = "play"
LoopOnlyWhenMeaningful == wind = "live" => (Ticking /\ sound)
LoopComesBack == (Ticking /\ sound) => wind = "live"
NeverAStub == wind # "stub"
NoTapPastResult == ~skipped
ChoiceFreezesPlay == sheet => ~ClockRuns
\* Whenever the match moves again after time away, the breath ran first: the click that brings you back is not a swing.
BreathAfterAway == Ticking => ~stale
NoClickBackSwing == held => ~breath
====
