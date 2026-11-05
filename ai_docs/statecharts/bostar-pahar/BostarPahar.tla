---- MODULE BostarPahar ----
\* বস্তার পাহাড় after the rewrite: the screen, the shared player's menu, the window, the drop key (and its auto-repeat),
\* the wake-up guard after চালিয়ে যাও, the result's key guard, the wind loop and the star chimes.
\* Mirrors tools/bostar-pahar/components/crane-game.tsx (begin, finish, the keydown/keyup effect, onStage, the blur/focus/
\* visibility effect, the sound effect, useGamePlayer's onPause/onResume), tools/bostar-pahar/lib/session.ts (ticking,
\* canDrop, keyDown, keyUp, freshResultKey, wantWind, syncLoops, blur, hide, pause, resume) and lib/step.hot.ts (tap, land,
\* the end of a round). shared/game-player-client.tsx: blur and hide open the menu once you've touched the game; the menu
\* stops keydown reaching the game; pausing cuts scheduled tones (silenceScheduled).
\* Abstractions: the level is a gusty one (so the wind loop is in play); "fresh" = the end screen appeared under 450 ms ago;
\* "guard" = চালিয়ে যাও was pressed under 250 ms ago; "held" = Space/Enter/↓ is physically down.
EXTENDS Naturals
VARIABLES screen, phase, paused, here, held, fresh, guard, sound, wind, chimes, cheers, repeatDrop, skipped, wakeDrop
vars == <<screen, phase, paused, here, held, fresh, guard, sound, wind, chimes, cheers, repeatDrop, skipped, wakeDrop>>

Ticking == screen = "play" /\ ~paused /\ here = "page"
\* syncLoops runs after every event: the wind plays exactly when wantWind holds in the state the event leaves.
WindNext == wind' = (screen' = "play" /\ ~paused' /\ here' = "page" /\ sound' /\ phase' # "end")

Init == /\ screen = "title" /\ phase = "swing" /\ paused = FALSE /\ here = "page" /\ held = FALSE /\ fresh = FALSE
        /\ guard = FALSE /\ sound = TRUE /\ wind = FALSE /\ chimes = FALSE /\ cheers = 0
        /\ repeatDrop = FALSE /\ skipped = FALSE /\ wakeDrop = FALSE

\* begin(): a fresh round; silenceScheduled cuts any chimes still queued.
Begin == /\ screen' = "play" /\ phase' = "swing" /\ fresh' = FALSE /\ chimes' = FALSE /\ cheers' = 0

\* keydown Space/Enter/↓ at window. The menu's capture listener stops it while paused.
\* session.keyDown: a drop only from a fresh press (no repeat, not already held) while ticking and not in the wake-up guard.
YouPressKey == /\ here = "page" /\ ~paused /\ ~held /\ held' = TRUE
               /\ IF screen = "play" THEN
                    /\ phase' = IF phase = "swing" /\ ~guard THEN "drop" ELSE phase
                    /\ wakeDrop' = (wakeDrop \/ (guard /\ phase = "swing" /\ phase' = "drop"))
                    /\ UNCHANGED <<screen, fresh, chimes, cheers, skipped>>
                  ELSE IF screen = "title" THEN Begin /\ UNCHANGED <<skipped, wakeDrop>>
                  \* the end screen: freshResultKey needs the 450 ms to have passed
                  ELSE IF ~fresh THEN Begin /\ skipped' = (skipped \/ fresh) /\ UNCHANGED wakeDrop
                  ELSE UNCHANGED <<screen, phase, fresh, chimes, cheers, skipped, wakeDrop>>
               /\ UNCHANGED <<paused, here, guard, sound, repeatDrop>> /\ WindNext
\* The browser's auto-repeat keydown while the key stays down: keyDown sees repeat (and held), so it never drops;
\* freshResultKey refuses repeats.
KeyRepeats == /\ here = "page" /\ ~paused /\ held
              /\ LET drops == FALSE IN
                 /\ phase' = IF drops THEN "drop" ELSE phase
                 /\ repeatDrop' = (repeatDrop \/ drops)
              /\ UNCHANGED <<screen, paused, here, held, fresh, guard, sound, chimes, cheers, skipped, wakeDrop>> /\ WindNext
YouReleaseKey == /\ held /\ held' = FALSE
                 /\ UNCHANGED <<screen, phase, paused, here, fresh, guard, sound, wind, chimes, cheers, repeatDrop, skipped, wakeDrop>>
\* pointerdown on the scene: canDrop needs ticking and the wake-up guard passed.
YouTap == /\ screen = "play" /\ here = "page" /\ ~paused
          /\ phase' = IF phase = "swing" /\ ~guard THEN "drop" ELSE phase
          /\ wakeDrop' = (wakeDrop \/ (guard /\ phase = "swing" /\ phase' = "drop"))
          /\ UNCHANGED <<screen, paused, here, held, fresh, guard, sound, chimes, cheers, repeatDrop, skipped>> /\ WindNext
\* A click on পরের লেভেল / আবার খেলো / সব লেভেল's pick (buttons blur after a click).
YouPickChoice == /\ screen = "over" /\ here = "page" /\ ~paused /\ Begin
                 /\ UNCHANGED <<paused, here, held, guard, sound, repeatDrop, skipped, wakeDrop>> /\ WindNext
\* P, ⏸ or Esc: the player's menu (pause cuts scheduled tones and lets go of every key).
YouOpenTheMenu == /\ screen # "title" /\ ~paused /\ paused' = TRUE /\ held' = FALSE /\ chimes' = FALSE
                  /\ UNCHANGED <<screen, phase, here, fresh, guard, sound, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
\* চালিয়ে যাও: resume() starts the wake-up guard.
YouResume == /\ paused /\ here = "page" /\ paused' = FALSE /\ guard' = TRUE /\ held' = FALSE
             /\ UNCHANGED <<screen, phase, here, fresh, sound, chimes, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
GuardPasses == /\ guard /\ guard' = FALSE
               /\ UNCHANGED <<screen, phase, paused, here, held, fresh, sound, wind, chimes, cheers, repeatDrop, skipped, wakeDrop>>
\* step(): only while ticking (useGameLoop stops on blur and hide; step() returns unless session.ticking).
SackLands == /\ Ticking /\ phase = "drop" /\ phase' \in {"swing", "end"}
             /\ UNCHANGED <<screen, paused, here, held, fresh, guard, sound, chimes, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
\* finish(): once per round; star chimes are scheduled tones.
RoundEnds == /\ Ticking /\ phase = "end" /\ screen' = "over" /\ fresh' = TRUE /\ chimes' = TRUE /\ cheers' = cheers + 1
             /\ UNCHANGED <<phase, paused, here, held, guard, sound, repeatDrop, skipped, wakeDrop>> /\ WindNext
MomentPasses == /\ fresh /\ fresh' = FALSE
                /\ UNCHANGED <<screen, phase, paused, here, held, guard, sound, wind, chimes, cheers, repeatDrop, skipped, wakeDrop>>
ChimesEnd == /\ chimes /\ chimes' = FALSE
             /\ UNCHANGED <<screen, phase, paused, here, held, fresh, guard, sound, wind, cheers, repeatDrop, skipped, wakeDrop>>
\* The site-wide switch: off cuts scheduled chimes too; the sound effect runs syncLoops at once.
SoundToggles == /\ sound' = ~sound /\ chimes' = (chimes /\ sound')
                /\ UNCHANGED <<screen, phase, paused, here, held, fresh, guard, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
\* blur: session.blur lets go of the key; the player opens its menu (the game has been touched once it left the title).
WindowBlurs == /\ here = "page" /\ here' = "blurred" /\ held' = FALSE
               /\ paused' = (paused \/ screen # "title") /\ chimes' = (chimes /\ ~paused')
               /\ UNCHANGED <<screen, phase, fresh, guard, sound, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
WindowFocuses == /\ here = "blurred" /\ here' = "page"
                 /\ UNCHANGED <<screen, phase, paused, held, fresh, guard, sound, chimes, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
TabHides == /\ here # "hidden" /\ here' = "hidden" /\ held' = FALSE
            /\ paused' = (paused \/ screen # "title") /\ chimes' = (chimes /\ ~paused')
            /\ UNCHANGED <<screen, phase, fresh, guard, sound, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext
TabShows == /\ here = "hidden" /\ here' = "page"
            /\ UNCHANGED <<screen, phase, paused, held, fresh, guard, sound, chimes, cheers, repeatDrop, skipped, wakeDrop>> /\ WindNext

Next == YouPressKey \/ KeyRepeats \/ YouReleaseKey \/ YouTap \/ YouPickChoice \/ YouOpenTheMenu \/ YouResume \/ GuardPasses
        \/ SackLands \/ RoundEnds \/ MomentPasses \/ ChimesEnd \/ SoundToggles
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ phase \in {"swing", "drop", "end"} /\ paused \in BOOLEAN
          /\ here \in {"page", "blurred", "hidden"} /\ held \in BOOLEAN /\ fresh \in BOOLEAN /\ guard \in BOOLEAN
          /\ sound \in BOOLEAN /\ wind \in BOOLEAN /\ chimes \in BOOLEAN /\ cheers \in 0..1
          /\ repeatDrop \in BOOLEAN /\ skipped \in BOOLEAN /\ wakeDrop \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == (here = "hidden" /\ screen = "play") => paused
PausedWhenBlurred == (here = "blurred" /\ screen = "play") => paused
EveryDropIsATap == ~repeatDrop
NoTapPastResult == ~skipped
FocusClickIsNotADrop == ~wakeDrop
InputReleasedWhenAway == (here # "page" \/ paused) => ~held
LoopOnlyWhenMeaningful == wind => (Ticking /\ sound /\ phase # "end")
LoopComesBack == (Ticking /\ sound /\ phase # "end") => wind
NoChimeAfterLeaving == chimes => (screen = "over" /\ ~paused)
NoDoubleResult == cheers <= 1
====
