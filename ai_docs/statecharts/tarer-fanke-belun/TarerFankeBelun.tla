---- MODULE TarerFankeBelun ----
\* তারের ফাঁকে বেলুন after the rewrite: the screens, the shared player's pause, window focus, the lane on screen, the
\* level list, your finger (or Space), the run with a spare balloon, the wire hum and wind loops, and the end card's
\* scheduled chimes. The model of the shipped game is in git (TarerFankeBelun.tla before the rewrite) with its run in before-fix/.
\* Mirrored from tools/tarer-fanke-belun/components/belun-game.tsx (begin, finish, keepStars, the blur/focus/visibility
\* effect, the IntersectionObserver on the lane, the sound effect, the sheet effect, useGamePlayer's onPause/onResume/
\* onRestart), tools/tarer-fanke-belun/lib/session.ts (ticking, wantHum, wantWind, syncLoops, blur, hide, setInView,
\* pause, resume, openSheet, pointerDown, letGo), tools/tarer-fanke-belun/lib/step.hot.ts and lib/belun.ts (the first
\* press, a pop, respawn marking the hold so a finger held through the pop doesn't send the spare, the win and its glide)
\* and shared/game-player-client.tsx (blur, hide and scrolling the stage away open the menu once you've touched the game;
\* চালিয়ে যাও and নতুন করে শুরু send a focus first; pausing cuts scheduled tones).
\* A level is abstracted to one crossing and two balloons; `windy` is a street with gusts (the wind loop).
EXTENDS Naturals
CONSTANT Windy
VARIABLES phase, paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, hum, wind, sound, engaged, chime, results
vars == <<phase, paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, hum, wind, sound, engaged, chime, results>>

Phases == {"title", "ready", "fly", "pop", "glide", "over"}
Play == {"ready", "fly", "pop", "glide"}
TickingWith(p, pa, sh, fo, vi, iv) == p \in Play /\ ~pa /\ ~sh /\ fo /\ vi /\ iv
Ticking == TickingWith(phase, paused, sheet, focused, visible, inView)
\* syncLoops after every event and every step: the hum while you fly with sound on, the wind too on a windy street.
SyncLoops(p, pa, sh, fo, vi, iv, so) ==
    /\ hum' = (TickingWith(p, pa, sh, fo, vi, iv) /\ so /\ p = "fly")
    /\ wind' = (TickingWith(p, pa, sh, fo, vi, iv) /\ so /\ p = "fly" /\ Windy)
Quiet == hum' = FALSE /\ wind' = FALSE

Init == /\ phase = "title" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE /\ sheet = FALSE
        /\ held = FALSE /\ armed = FALSE /\ spare = TRUE /\ won = FALSE /\ recorded = FALSE /\ hum = FALSE /\ wind = FALSE
        /\ sound \in BOOLEAN /\ engaged = FALSE /\ chime = FALSE /\ results = 0

\* begin(): a fresh run waiting for the first press; silenceScheduled cuts the last card's chimes; goTo lets go.
Begin == /\ phase' = "ready" /\ held' = FALSE /\ armed' = FALSE /\ spare' = TRUE /\ won' = FALSE /\ recorded' = FALSE
         /\ chime' = FALSE /\ results' = 0

\* The title balloon, the list and the card all sit on the stage: you can only tap them while it is on screen.
YouTapTheBalloon == /\ phase = "title" /\ ~paused /\ ~sheet /\ visible /\ focused /\ inView
                    /\ Begin /\ engaged' = TRUE /\ Quiet
                    /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound>>
\* pointerDown or a lift key: counts only while the street ticks and nothing is held. `armed` = the press this step
\* will see (stepGame's pressed = hold && !g.hold); the first one starts the run.
YouPress == /\ Ticking /\ ~held /\ phase \in {"ready", "fly"}
            /\ held' = TRUE /\ armed' = TRUE
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, spare, won, recorded, hum, wind, sound, engaged, chime, results>>
\* The next step takes the press: a waiting balloon (the first, or a spare) flies.
StepTakesPress == /\ Ticking /\ armed
                  /\ armed' = FALSE
                  /\ phase' = IF phase = "ready" THEN "fly" ELSE phase
                  /\ SyncLoops(IF phase = "ready" THEN "fly" ELSE phase, paused, sheet, focused, visible, inView, sound)
                  /\ UNCHANGED <<paused, visible, focused, inView, sheet, held, spare, won, recorded, sound, engaged, chime, results>>
YouLetGo == /\ held /\ focused /\ held' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, armed, spare, won, recorded, hum, wind, sound, engaged, chime, results>>
\* stepGame: a wire, a crow, the mesh or the street → pop; the loops stop (the session wants none).
BalloonPops == /\ Ticking /\ phase = "fly"
               /\ phase' = "pop" /\ Quiet
               /\ UNCHANGED <<paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, sound, engaged, chime, results>>
\* POP_TIME later: a spare waits at the next gap (respawn marks the hold, so a finger still down must lift and press
\* again: armed stays FALSE), or the run is over with the lose tones (scheduled, so sound decides).
PopEnds == /\ Ticking /\ phase = "pop"
           /\ IF spare
              THEN phase' = "ready" /\ spare' = FALSE /\ armed' = FALSE /\ UNCHANGED <<results, chime, held>>
              ELSE phase' = "over" /\ results' = results + 1 /\ chime' = sound /\ held' = FALSE /\ UNCHANGED <<spare, armed>>
           /\ Quiet
           /\ UNCHANGED <<paused, visible, focused, inView, sheet, won, recorded, sound, engaged>>
\* The last crossing passed: E.WIN → keepStars records the stars now; the balloon glides up free.
LastCrossing == /\ Ticking /\ phase = "fly"
                /\ phase' = "glide" /\ won' = TRUE /\ recorded' = TRUE /\ Quiet
                /\ UNCHANGED <<paused, visible, focused, inView, sheet, held, armed, spare, sound, engaged, chime, results>>
\* END_TIME later: finish() shows the card; the star chimes and fanfare are scheduled tones.
GlideEnds == /\ Ticking /\ phase = "glide"
             /\ phase' = "over" /\ results' = results + 1 /\ chime' = sound /\ held' = FALSE /\ armed' = FALSE /\ Quiet
             /\ UNCHANGED <<paused, visible, focused, inView, sheet, spare, won, recorded, sound, engaged>>
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE /\ armed' = FALSE
               /\ paused' = (paused \/ engaged) /\ chime' = (chime /\ ~engaged) /\ Quiet
               /\ UNCHANGED <<phase, visible, inView, sheet, spare, won, recorded, sound, engaged, results>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ SyncLoops(phase, paused, sheet, TRUE, visible, inView, sound)
                 /\ UNCHANGED <<phase, paused, visible, inView, sheet, held, armed, spare, won, recorded, sound, engaged, chime, results>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ armed' = FALSE
            /\ paused' = (paused \/ engaged) /\ chime' = (chime /\ ~engaged) /\ Quiet
            /\ UNCHANGED <<phase, inView, sheet, spare, won, recorded, sound, engaged, results>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE
            /\ SyncLoops(phase, paused, sheet, TRUE, TRUE, inView, sound)
            /\ UNCHANGED <<phase, paused, inView, sheet, held, armed, spare, won, recorded, sound, engaged, chime, results>>
ScrollAway == /\ visible /\ inView
              /\ inView' = FALSE /\ held' = FALSE /\ armed' = FALSE
              /\ paused' = (paused \/ engaged) /\ chime' = (chime /\ ~engaged) /\ Quiet
              /\ UNCHANGED <<phase, visible, focused, sheet, spare, won, recorded, sound, engaged, results>>
ScrollBack == /\ visible /\ ~inView
              /\ inView' = TRUE
              /\ SyncLoops(phase, paused, sheet, focused, visible, TRUE, sound)
              /\ UNCHANGED <<phase, paused, visible, focused, sheet, held, armed, spare, won, recorded, sound, engaged, chime, results>>
\* Escape, ⏸ or P (player.requestPause): openMenu → pointercancel, a synthetic blur, silenceScheduled, onPause.
YouOpenTheMenu == /\ engaged /\ ~paused /\ visible
                  /\ paused' = TRUE /\ held' = FALSE /\ armed' = FALSE /\ chime' = FALSE /\ focused' = FALSE /\ Quiet
                  /\ UNCHANGED <<phase, visible, inView, sheet, spare, won, recorded, sound, engaged, results>>
\* চালিয়ে যাও: focus, then onResume (a breath, fresh hands) and syncLoops: the hum comes back at once.
YouResume == /\ paused /\ visible
             /\ paused' = FALSE /\ focused' = TRUE /\ held' = FALSE /\ armed' = FALSE
             /\ SyncLoops(phase, FALSE, sheet, TRUE, visible, inView, sound)
             /\ UNCHANGED <<phase, visible, inView, sheet, spare, won, recorded, sound, engaged, chime, results>>
\* নতুন করে শুরু: focus, then onRestart → begin() on the same level (and the list shuts).
YouRestart == /\ paused /\ visible /\ phase # "title"
              /\ Begin /\ paused' = FALSE /\ focused' = TRUE /\ sheet' = FALSE /\ Quiet
              /\ UNCHANGED <<visible, inView, sound, engaged>>
\* সব লেভেল on the title or the card (a choice screen: session.openSheet, nothing ticks).
YouOpenTheList == /\ phase \in {"title", "over"} /\ ~paused /\ ~sheet /\ visible /\ focused /\ inView
                  /\ sheet' = TRUE /\ held' = FALSE /\ armed' = FALSE
                  /\ UNCHANGED <<phase, paused, visible, focused, inView, spare, won, recorded, hum, wind, sound, engaged, chime, results>>
YouCloseTheList == /\ sheet /\ ~paused
                   /\ sheet' = FALSE
                   /\ UNCHANGED <<phase, paused, visible, focused, inView, held, armed, spare, won, recorded, hum, wind, sound, engaged, chime, results>>
YouPickALevel == /\ sheet /\ ~paused /\ visible /\ focused /\ inView
                 /\ Begin /\ sheet' = FALSE /\ engaged' = TRUE /\ Quiet
                 /\ UNCHANGED <<paused, visible, focused, inView, sound>>
\* The card's ১ ২ (or a fresh Enter, freshResultKey): begin() a new run.
YouPlayOn == /\ phase = "over" /\ ~paused /\ ~sheet /\ visible /\ focused /\ inView
             /\ Begin /\ Quiet
             /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound, engaged>>
ChimesEnd == chime /\ chime' = FALSE
             /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, hum, wind, sound, engaged, results>>
\* The site-wide switch: off stops every loop in the kit and cuts queued tones; on runs syncLoops at once.
SoundOff == /\ sound /\ sound' = FALSE /\ chime' = FALSE /\ Quiet
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, engaged, results>>
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ SyncLoops(phase, paused, sheet, focused, visible, inView, TRUE)
           /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, armed, spare, won, recorded, engaged, chime, results>>

Next == YouTapTheBalloon \/ YouPress \/ StepTakesPress \/ YouLetGo \/ BalloonPops \/ PopEnds \/ LastCrossing \/ GlideEnds
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack
        \/ YouOpenTheMenu \/ YouResume \/ YouRestart \/ YouOpenTheList \/ YouCloseTheList \/ YouPickALevel \/ YouPlayOn
        \/ ChimesEnd \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ sheet \in BOOLEAN /\ held \in BOOLEAN /\ armed \in BOOLEAN /\ spare \in BOOLEAN /\ won \in BOOLEAN
          /\ recorded \in BOOLEAN /\ hum \in BOOLEAN /\ wind \in BOOLEAN /\ sound \in BOOLEAN /\ engaged \in BOOLEAN
          /\ chime \in BOOLEAN /\ results \in 0..1

\* The reader's rules. The three that broke before come first.
PausedWhenBlurred == (visible /\ ~focused /\ engaged /\ phase \in Play) => paused
NoCelebrationAfterLeaving == chime => (phase = "over" /\ ~paused /\ sound)
LoopComesBack == (Ticking /\ sound /\ phase = "fly") => (hum /\ (Windy => wind))
\* The old model's rules that held, in the new variables.
PausedWhenHidden == (~visible /\ engaged /\ phase \in Play) => paused
\* Off screen nothing moves. (The player pauses on scrolling away, but its desktop bar can resume or restart with the
\* stage still off screen; the game's own observer keeps the street still until it is back.)
StillWhenOffScreen == (~inView /\ phase \in Play) => ~Ticking
LoopOnlyWhenMeaningful == (hum => (Ticking /\ sound /\ phase = "fly")) /\ (wind => (hum /\ Windy))
NoDoubleResult == results <= 1
\* New with the rewrite.
InputReleasedWhenAway == (~focused \/ ~visible \/ ~inView \/ paused \/ sheet) => (~held /\ ~armed)
ChoiceFreezesPlay == sheet => (~Ticking /\ phase \in {"title", "over"})
StarsKeptTheMomentYouWin == (phase \in {"glide", "over"} /\ won) => recorded
\* A balloon flies only after a press that came while the street ticked: the first one, and every spare.
SpareWaitsForAFreshPress == [][(phase \in {"ready"} /\ phase' = "fly") => armed]_vars
\* Something happens on the street (a press taken, a pop, the win, the glide) only while it ticks.
ProgressOnlyWhileTicking == [][(phase' # phase /\ phase \in Play /\ phase' \in Play \cup {"over"} /\ ~(paused' /\ ~paused) /\ ~YouRestart) => Ticking]_vars
\* The click that brings focus back is not a press.
TheClickBackIsNotAPress == [][(held' /\ ~held) => Ticking]_vars
====
