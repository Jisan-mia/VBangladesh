---- MODULE ChorPolice ----
\* চোর-ডাকাত-পুলিশ-বাবু after the rewrite: the pass-the-phone flow, the folded chit, the tap guard, the drumroll,
\* the shared player's pause menu, the scorecard and the saved evening.
\* Mirrors tools/chor-police/lib/game.ts (act, GUARD_MS, restore, saveOf), tools/chor-police/lib/cues.ts (hush on
\* leaving the roll, the fanfare once) and tools/chor-police/components/chit-game.tsx (send, the roll-timer effect keyed
\* on player.paused, onPause / onResume / onRestart, the blur effect, the window key handler), plus the menu in
\* shared/game-player-client.tsx (openMenu blurs, cancels the held pointer and calls silenceScheduled).
\* Abstractions: 2 players instead of 4 (turn 0..1), an evening of LIMIT = 2 rounds, "fresh" = inside the screen's tap
\* guard (450 ms; 900 ms on the reveal; 1200 ms on the scorecard), which also stands for "a key held through the change"
\* because only a keydown after the screen appeared counts.
\* The before-fix model is in before-fix-model/.
EXTENDS Naturals
CONSTANTS LIMIT
VARIABLES phase, rounds, turn, chit, fresh, drum, here, menu, ended, skipped, cheers
vars == <<phase, rounds, turn, chit, fresh, drum, here, menu, ended, skipped, cheers>>

Phases == {"setup", "pass", "peek", "call", "guess", "roll", "reveal", "over"}
Playing == phase \notin {"setup", "over"}

Init == /\ phase = "setup" /\ rounds = 0 /\ turn = 0 /\ chit = "plate" /\ fresh = FALSE
        /\ drum = FALSE /\ here = "page" /\ menu = FALSE /\ ended = FALSE /\ skipped = FALSE /\ cheers = 0

\* A tap or key on the game: only on the page, never under the menu (the game is inert and keys are stopped).
Live == here = "page" /\ ~menu

\* The থালা on the title screen: act "start".
YouStart == /\ Live /\ phase = "setup" /\ ~fresh
            /\ phase' = IF rounds >= LIMIT THEN "over" ELSE "pass"
            /\ cheers' = IF rounds >= LIMIT THEN cheers + 1 ELSE 0
            /\ ended' = (rounds >= LIMIT)
            /\ turn' = 0 /\ chit' = "plate" /\ fresh' = TRUE
            /\ UNCHANGED <<rounds, drum, here, menu, skipped>>
\* A tap on a chit in the থালা on the hand-off screen: act "pick" (the hand-off and the pick are one tap now).
YouPickChit == /\ Live /\ phase = "pass" /\ ~fresh
               /\ phase' = "peek" /\ chit' = "closed" /\ fresh' = TRUE
               /\ UNCHANGED <<rounds, turn, drum, here, menu, ended, skipped, cheers>>
\* holdStart / Space down: reveal(true), act "saw" (unguarded).
YouHoldChit == /\ Live /\ phase = "peek" /\ chit \in {"closed", "seen"}
               /\ chit' = "open"
               /\ UNCHANGED <<phase, rounds, turn, fresh, drum, here, menu, ended, skipped, cheers>>
\* pointerup / pointercancel / lostpointercapture / Space up / button blur: reveal(false).
YouLetGo == /\ chit = "open" /\ chit' = "seen"
            /\ UNCHANGED <<phase, rounds, turn, fresh, drum, here, menu, ended, skipped, cheers>>
\* "দেখেছি": act "done" (needs seen), the next player or the call.
YouFold == /\ Live /\ phase = "peek" /\ chit \in {"open", "seen"} /\ ~fresh
           /\ IF turn + 1 < 2 THEN phase' = "pass" /\ turn' = turn + 1 ELSE phase' = "call" /\ turn' = 0
           /\ chit' = "plate" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, drum, here, menu, ended, skipped, cheers>>
\* "বাবু-পুলিশ, চিরকুট খোলো": act "call".
YouCall == /\ Live /\ phase = "call" /\ ~fresh
           /\ phase' = "guess" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, turn, chit, drum, here, menu, ended, skipped, cheers>>
\* A suspect's name (or key 1/2): act "accuse" → roll; the "drum" cue schedules the beats.
PoliceAccuses == /\ Live /\ phase = "guess" /\ ~fresh
                 /\ phase' = "roll" /\ drum' = TRUE /\ fresh' = TRUE
                 /\ UNCHANGED <<rounds, turn, chit, here, menu, ended, skipped, cheers>>
\* The roll timer fires: act "open" scores the round. The timer is an effect on [phase, player.paused], so it never
\* fires under the menu. The last beat lands with the flip, so the model ends the drum here.
ChitsOpen == /\ phase = "roll" /\ ~menu
             /\ phase' = "reveal" /\ rounds' = rounds + 1 /\ fresh' = TRUE /\ drum' = FALSE
             /\ UNCHANGED <<turn, chit, here, menu, ended, skipped, cheers>>
\* The guard runs out.
ScreenSettles == /\ fresh /\ fresh' = FALSE
                 /\ UNCHANGED <<phase, rounds, turn, chit, drum, here, menu, ended, skipped, cheers>>
\* "আরেক দান" / "শেষ দান!" / "ফল দেখো": act "next".
YouNext == /\ Live /\ phase = "reveal" /\ ~fresh
           /\ phase' = IF rounds >= LIMIT THEN "over" ELSE "pass"
           /\ cheers' = IF rounds >= LIMIT THEN cheers + 1 ELSE 0
           /\ ended' = (rounds >= LIMIT)
           /\ turn' = 0 /\ chit' = "plate" /\ fresh' = TRUE
           /\ UNCHANGED <<rounds, drum, here, menu, skipped>>
\* "এখানেই শেষ করো": act "end", now guarded like every other press, and it sets done.
YouEndHere == /\ Live /\ phase = "reveal" /\ rounds < LIMIT /\ rounds > 0 /\ ~fresh
              /\ phase' = "over" /\ cheers' = cheers + 1 /\ ended' = TRUE /\ fresh' = TRUE
              /\ UNCHANGED <<rounds, turn, chit, drum, here, menu, skipped>>
\* "একই খেলায় আরও ৫ দান": act "more", guarded.
YouPlayMore == /\ Live /\ phase = "over" /\ rounds < LIMIT /\ ~fresh
               /\ phase' = "pass" /\ turn' = 0 /\ chit' = "plate" /\ cheers' = 0 /\ ended' = FALSE /\ fresh' = TRUE
               /\ UNCHANGED <<rounds, drum, here, menu, skipped>>
\* "আরেক সন্ধ্যা" or a fresh Enter on the scorecard: act "again", guarded (1.2 s), back to the title screen.
\* `skipped` records a press that wiped the scorecard inside its guard; the guard makes it impossible.
YouPressAgain == /\ Live /\ phase = "over" /\ ~fresh
                 /\ phase' = "setup" /\ rounds' = 0 /\ turn' = 0 /\ chit' = "plate" /\ cheers' = 0 /\ ended' = FALSE
                 /\ skipped' = (skipped \/ fresh) /\ fresh' = TRUE
                 /\ UNCHANGED <<drum, here, menu>>
\* The ⏸ button, Escape, or leaving immersive mode: the player opens its menu. openMenu cancels the held finger
\* (the chit folds) and calls silenceScheduled (the drum's later beats are cut).
YouPause == /\ ~menu
            /\ menu' = TRUE /\ chit' = (IF chit = "open" THEN "seen" ELSE chit) /\ drum' = FALSE
            /\ UNCHANGED <<phase, rounds, turn, fresh, here, ended, skipped, cheers>>
\* blur or visibilitychange: the player opens the menu the same way.
YouLookAway == /\ here = "page"
               /\ here' = "away" /\ menu' = TRUE /\ chit' = (IF chit = "open" THEN "seen" ELSE chit) /\ drum' = FALSE
               /\ UNCHANGED <<phase, rounds, turn, fresh, ended, skipped, cheers>>
YouComeBack == /\ here = "away" /\ here' = "page"
               /\ UNCHANGED <<phase, rounds, turn, chit, fresh, drum, menu, ended, skipped, cheers>>
\* চালিয়ে যাও: onResume sends "breath" (a fresh guard) and, in the roll, drums again from the first beat;
\* the roll timer re-arms because player.paused changed.
YouResume == /\ menu /\ here = "page"
             /\ menu' = FALSE /\ fresh' = TRUE /\ drum' = (phase = "roll")
             /\ UNCHANGED <<phase, rounds, turn, chit, here, ended, skipped, cheers>>
\* নতুন করে শুরু: onRestart sends "reset" (a new evening on the title screen; the old one kept for undo).
YouRestart == /\ menu /\ here = "page"
              /\ menu' = FALSE /\ phase' = "setup" /\ rounds' = 0 /\ turn' = 0 /\ chit' = "plate" /\ drum' = FALSE
              /\ ended' = FALSE /\ cheers' = 0 /\ fresh' = TRUE
              /\ UNCHANGED <<here, skipped>>
\* A reload: the save effect wrote saveOf(play) ({h, l, d}); restore() brings an evening back to continue only if it
\* is not done and 0 < caught.length < limit. Otherwise it keeps only names and points.
YouReload == /\ here = "page" /\ phase' = "setup"
             /\ rounds' = IF rounds > 0 /\ rounds < LIMIT /\ ~ended THEN rounds ELSE 0
             /\ ended' = IF rounds > 0 /\ rounds < LIMIT /\ ~ended THEN ended ELSE FALSE
             /\ turn' = 0 /\ chit' = "plate" /\ fresh' = FALSE /\ drum' = FALSE /\ menu' = FALSE
             /\ cheers' = 0
             /\ UNCHANGED <<here, skipped>>

Next == YouStart \/ YouPickChit \/ YouHoldChit \/ YouLetGo \/ YouFold \/ YouCall
        \/ PoliceAccuses \/ ChitsOpen \/ ScreenSettles \/ YouNext \/ YouEndHere
        \/ YouPlayMore \/ YouPressAgain \/ YouPause \/ YouLookAway \/ YouComeBack \/ YouResume \/ YouRestart \/ YouReload

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ rounds \in 0..LIMIT /\ turn \in 0..1
          /\ chit \in {"plate", "closed", "open", "seen"} /\ fresh \in BOOLEAN /\ drum \in BOOLEAN
          /\ here \in {"page", "away"} /\ menu \in BOOLEAN /\ ended \in BOOLEAN /\ skipped \in BOOLEAN
          /\ cheers \in 0..2

\* The reader's rules.
ChitClosedWhenAway == chit = "open" => (here = "page" /\ ~menu)
ChitOnlyWhilePeeking == chit # "plate" => phase = "peek"
NoTapPastResult == ~skipped
FinishedStaysFinished == (phase = "setup" /\ rounds > 0) => ~ended
DrumStopsWithRound == drum => (phase = "roll" /\ ~menu)
PausedWhenAway == here = "away" => menu
NoDoubleResult == cheers <= 1
====
