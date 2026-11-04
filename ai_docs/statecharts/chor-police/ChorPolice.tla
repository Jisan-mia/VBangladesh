---- MODULE ChorPolice ----
\* চোর-ডাকাত-পুলিশ-বাবু as it is today: the pass-the-phone flow, the folded chit, the settle guard,
\* the drumroll timer, the window, the scorecard and the saved evening.
\* Mirrors tools/chor-police/components/chit-game.tsx (dispatch, press, accuse, reveal, holdStart, the
\* blur/visibilitychange effect, the over effect, the save/restore effects) and tools/chor-police/lib/game.ts (act).
\* Abstractions: 2 players instead of 4 (turn 0..1), an evening of LIMIT = 2 rounds, "away" = blur or hidden
\* (the code treats both the same), "fresh" = less than SETTLE_MS (450 ms) since the screen last changed.
EXTENDS Naturals
CONSTANTS LIMIT
VARIABLES phase, rounds, turn, chit, fresh, rolling, drum, here, ended, skipped, cheers
vars == <<phase, rounds, turn, chit, fresh, rolling, drum, here, ended, skipped, cheers>>

Phases == {"setup", "pass", "peek", "call", "guess", "reveal", "over"}
Playing == phase \notin {"setup", "over"}

Init == /\ phase = "setup" /\ rounds = 0 /\ turn = 0 /\ chit = "plate" /\ fresh = FALSE
        /\ rolling = FALSE /\ drum = FALSE /\ here = "page" /\ ended = FALSE /\ skipped = FALSE /\ cheers = 0

\* press() on "চিরকুট তোলো" / "চালিয়ে যাও": act "start". Going straight to "over" fires the fanfare effect.
YouStart == /\ phase = "setup" /\ ~fresh
            /\ phase' = IF rounds >= LIMIT THEN "over" ELSE "pass"
            /\ cheers' = IF rounds >= LIMIT THEN cheers + 1 ELSE 0
            /\ ended' = (rounds >= LIMIT)
            /\ turn' = 0 /\ chit' = "plate" /\ fresh' = TRUE
            /\ UNCHANGED <<rounds, rolling, drum, here, skipped>>
\* "আমি …, চিরকুট তুলব": act "ready".
YouTakePhone == /\ phase = "pass" /\ ~fresh
                /\ phase' = "peek" /\ chit' = "plate" /\ fresh' = TRUE
                /\ UNCHANGED <<rounds, turn, rolling, drum, here, ended, skipped, cheers>>
\* pickChit(): guarded by the settle time, does not reset it.
YouPickChit == /\ phase = "peek" /\ chit = "plate" /\ ~fresh
               /\ chit' = "closed"
               /\ UNCHANGED <<phase, rounds, turn, fresh, rolling, drum, here, ended, skipped, cheers>>
\* holdStart / holdKey: reveal(true) opens the chit and marks it seen. Only a finger on the page can hold it.
YouHoldChit == /\ phase = "peek" /\ chit \in {"closed", "seen"} /\ here = "page"
               /\ chit' = "open"
               /\ UNCHANGED <<phase, rounds, turn, fresh, rolling, drum, here, ended, skipped, cheers>>
\* pointerup / pointercancel / lostpointercapture / keyup: reveal(false).
YouLetGo == /\ chit = "open" /\ chit' = "seen"
            /\ UNCHANGED <<phase, rounds, turn, fresh, rolling, drum, here, ended, skipped, cheers>>
\* "দেখেছি, ভাঁজ করে রাখলাম": act "done" (needs seen), next player or the call.
YouFold == /\ phase = "peek" /\ chit \in {"open", "seen"} /\ ~fresh
           /\ IF turn + 1 < 2 THEN phase' = "pass" /\ turn' = turn + 1 ELSE phase' = "call" /\ turn' = 0
           /\ chit' = "plate" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, rolling, drum, here, ended, skipped, cheers>>
\* "বাবু-পুলিশ কে, দেখাও": act "call".
YouCall == /\ phase = "call" /\ ~fresh
           /\ phase' = "guess" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, turn, chit, rolling, drum, here, ended, skipped, cheers>>
\* accuse(): drumroll() schedules 12 tones on the audio clock at once, and a 750 ms timer.
PoliceAccuses == /\ phase = "guess" /\ ~rolling /\ ~fresh
                 /\ rolling' = TRUE /\ drum' = TRUE
                 /\ UNCHANGED <<phase, rounds, turn, chit, fresh, here, ended, skipped, cheers>>
\* The timer fires: dispatch({type:"guess"}, false) scores the round and resets the settle clock.
\* The drum's last beat ends about 35 ms after this, so the model ends it here.
ChitsOpen == /\ rolling /\ phase = "guess"
             /\ rolling' = FALSE /\ drum' = FALSE /\ phase' = "reveal" /\ rounds' = rounds + 1 /\ fresh' = TRUE
             /\ UNCHANGED <<turn, chit, here, ended, skipped, cheers>>
\* After a pause or reset mid-roll, the tones already scheduled play out (about 0.78 s from the accusation).
DrumFades == /\ drum /\ ~rolling /\ drum' = FALSE
             /\ UNCHANGED <<phase, rounds, turn, chit, fresh, rolling, here, ended, skipped, cheers>>
\* 450 ms pass with no screen change.
ScreenSettles == /\ fresh /\ fresh' = FALSE
                 /\ UNCHANGED <<phase, rounds, turn, chit, rolling, drum, here, ended, skipped, cheers>>
\* "আরেক দান" / "ফল দেখো": act "next".
YouNext == /\ phase = "reveal" /\ ~fresh
           /\ phase' = IF rounds >= LIMIT THEN "over" ELSE "pass"
           /\ cheers' = IF rounds >= LIMIT THEN cheers + 1 ELSE 0
           /\ ended' = (rounds >= LIMIT)
           /\ turn' = 0 /\ chit' = "plate" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, rolling, drum, here, skipped>>
\* "এখানেই শেষ করো, স্কোরকার্ড দেখো": dispatch(end, false), no settle check.
YouEndHere == /\ phase = "reveal" /\ rounds < LIMIT /\ rounds > 0
              /\ phase' = "over" /\ cheers' = cheers + 1 /\ ended' = TRUE /\ fresh' = TRUE
              /\ UNCHANGED <<rounds, turn, chit, rolling, drum, here, skipped>>
\* "আরও ৫ দান খেলো": dispatch(more, false), no settle check. The scorecard pushes it down the page, so a
\* second tap on the end link lands elsewhere (checked live at phone width): not a stray-tap path.
YouPlayMore == /\ phase = "over" /\ rounds < LIMIT
               /\ phase' = "pass" /\ turn' = 0 /\ chit' = "plate" /\ cheers' = 0 /\ ended' = FALSE
               /\ fresh' = TRUE
               /\ UNCHANGED <<rounds, rolling, drum, here, skipped>>
\* Enter (or Space) on the scorecard, or a press on আরেকবার: press() calls again() before its settle check;
\* caught = []. The main button keeps focus from ফল দেখো, so a second Enter lands here.
YouPressAgain == /\ phase = "over"
                 /\ phase' = "pass" /\ rounds' = 0 /\ turn' = 0 /\ chit' = "plate" /\ cheers' = 0 /\ ended' = FALSE
                 /\ skipped' = (skipped \/ fresh) /\ fresh' = TRUE
                 /\ UNCHANGED <<rolling, drum, here>>
\* "থামাও": act "pause" back to setup; dispatch clears the roll timer but not the scheduled tones.
YouPause == /\ Playing
            /\ phase' = "setup" /\ rolling' = FALSE /\ turn' = 0 /\ chit' = "plate" /\ fresh' = TRUE
            /\ UNCHANGED <<rounds, drum, here, ended, skipped, cheers>>
\* "নতুন খেলা" (after the confirm): act "reset".
YouReset == /\ (rounds > 0 \/ Playing)
            /\ phase' = "setup" /\ rounds' = 0 /\ turn' = 0 /\ chit' = "plate" /\ rolling' = FALSE
            /\ ended' = FALSE /\ cheers' = 0 /\ fresh' = TRUE
            /\ UNCHANGED <<drum, here, skipped>>
\* blur or visibilitychange: setOpen(false).
YouLookAway == /\ here = "page"
               /\ here' = "away" /\ chit' = IF chit = "open" THEN "seen" ELSE chit
               /\ UNCHANGED <<phase, rounds, turn, fresh, rolling, drum, ended, skipped, cheers>>
YouComeBack == /\ here = "away" /\ here' = "page"
               /\ UNCHANGED <<phase, rounds, turn, chit, fresh, rolling, drum, ended, skipped, cheers>>
\* A reload: the save effect wrote the current game; the mount effect restores it paused only if
\* 0 < caught.length < savedLimit, else keeps only names and points.
YouReload == /\ here = "page" /\ phase' = "setup"
             /\ rounds' = IF rounds > 0 /\ rounds < LIMIT THEN rounds ELSE 0
             /\ ended' = IF rounds > 0 /\ rounds < LIMIT THEN ended ELSE FALSE
             /\ turn' = 0 /\ chit' = "plate" /\ fresh' = FALSE /\ rolling' = FALSE /\ drum' = FALSE
             /\ cheers' = 0
             /\ UNCHANGED <<here, skipped>>

Next == YouStart \/ YouTakePhone \/ YouPickChit \/ YouHoldChit \/ YouLetGo \/ YouFold \/ YouCall
        \/ PoliceAccuses \/ ChitsOpen \/ DrumFades \/ ScreenSettles \/ YouNext \/ YouEndHere
        \/ YouPlayMore \/ YouPressAgain \/ YouPause \/ YouReset \/ YouLookAway \/ YouComeBack \/ YouReload

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ rounds \in 0..LIMIT /\ turn \in 0..1
          /\ chit \in {"plate", "closed", "open", "seen"} /\ fresh \in BOOLEAN /\ rolling \in BOOLEAN
          /\ drum \in BOOLEAN /\ here \in {"page", "away"} /\ ended \in BOOLEAN /\ skipped \in BOOLEAN
          /\ cheers \in 0..2

\* The reader's rules.
ChitClosedWhenAway == chit = "open" => here = "page"
ChitOnlyWhilePeeking == chit # "plate" => phase = "peek"
NoTapPastResult == ~skipped
FinishedStaysFinished == (phase = "setup" /\ rounds > 0) => ~ended
NoRollAfterLeaving == rolling => phase = "guess"
DrumStopsWithRound == drum => phase = "guess"
NoDoubleResult == cheers <= 1
====
