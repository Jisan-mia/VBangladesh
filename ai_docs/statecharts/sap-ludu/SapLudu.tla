---- MODULE SapLudu ----
EXTENDS Naturals
\* সাপলুডু: the turn, the walking piece, the hidden-tab pause, window focus, the result cover, the
\* once-per-game celebration and a solo friend's link, mirrored from
\* tools/sap-ludu/components/sap-ludu-game.tsx (tapDice, pick, finishAnim, step via useGameLoop,
\* the visibilitychange effect, the `settled` effect with its 450 ms timer, again(), start(), the hashchange read())
\* and tools/sap-ludu/lib/game.ts (roll, choose). useGameLoop (shared/game-kit.ts) stops the walk
\* while the tab is hidden but keeps it running while the window is merely blurred.
\* Abstractions: one roll is "a roll" (it may walk, ask for a piece, or win); fast mode, a stuck roll and
\* ধীরে খেলো are folded into "the roll may or may not walk". Only a solo friend's link is modelled
\* (a group link deliberately gives fresh dice).
VARIABLES phase, walking, cover, paused, win, cheers, seen, friend, dice
vars == <<phase, walking, cover, paused, win, cheers, seen, friend, dice>>

Phases == {"fresh", "play", "choose", "over"}
InProgress == phase \in {"play", "choose"}       \* rolls > 0 and not over
Settled == phase = "over" /\ ~walking

Init == /\ phase = "fresh" /\ walking = FALSE /\ cover = FALSE /\ paused = FALSE /\ win = "on"
        /\ cheers = 0 /\ seen = FALSE /\ friend = FALSE /\ dice = "new"

\* A fresh game (start()): no walk, no pause, no cover, the celebration effect re-armed.
Fresh(f, d) == /\ phase' = "fresh" /\ walking' = FALSE /\ cover' = FALSE /\ paused' = FALSE
               /\ cheers' = 0 /\ seen' = FALSE /\ friend' = f /\ dice' = d

\* tapDice(): blocked while paused or on the cover; rolls only in phase "play" with nothing walking.
YouRoll == /\ win = "on" /\ ~paused /\ ~cover /\ ~walking /\ phase \in {"fresh", "play"}
           /\ \E next \in {"play", "choose", "over"}, walk \in BOOLEAN :
                 /\ phase' = next
                 /\ walking' = (walk /\ next # "choose")
           /\ UNCHANGED <<cover, paused, win, cheers, seen, friend, dice>>
\* pick(): only while choosing and not paused.
YouPick == /\ win = "on" /\ phase = "choose" /\ ~paused
           /\ \E next \in {"play", "over"}, walk \in BOOLEAN : phase' = next /\ walking' = walk
           /\ UNCHANGED <<cover, paused, win, cheers, seen, friend, dice>>
\* A tap (or চাল দ্রুত করো) while a piece walks just finishes the move.
YouSkipWalk == /\ win = "on" /\ walking /\ ~paused /\ walking' = FALSE
               /\ UNCHANGED <<phase, cover, paused, win, cheers, seen, friend, dice>>
\* step(): the walk runs on requestAnimationFrame, which stops only when the tab is hidden.
PieceLands == /\ walking /\ win # "hidden" /\ walking' = FALSE
              /\ UNCHANGED <<phase, cover, paused, win, cheers, seen, friend, dice>>
\* The `settled` effect: once per change of settled (or seed) to true: best, sound, confetti, then a 450 ms timer.
Celebrate == /\ Settled /\ ~seen /\ seen' = TRUE /\ cheers' = cheers + 1
             /\ UNCHANGED <<phase, walking, cover, paused, win, friend, dice>>
ResultShows == /\ Settled /\ seen /\ ~cover /\ cover' = TRUE
               /\ UNCHANGED <<phase, walking, paused, win, cheers, seen, friend, dice>>
\* again(): আরেকবার drops the friend and takes fresh dice; একই ছক্কায় আবার keeps both.
YouPlayAgain == /\ win = "on" /\ cover /\ Fresh(FALSE, "new") /\ UNCHANGED win
YouRaceSameDice == /\ win = "on" /\ cover /\ Fresh(friend, dice) /\ UNCHANGED win
\* নতুন খেলা: shown only while a game is in progress.
YouStartOver == /\ win = "on" /\ InProgress /\ Fresh(FALSE, "new") /\ UNCHANGED win
\* hashchange with a valid solo link: their dice, a fresh game, their card above the board.
FriendLinkOpens == /\ win = "on" /\ Fresh(TRUE, "theirs") /\ UNCHANGED win
\* visibilitychange → hidden: pause and finish the walk, only mid-game.
TabHides == /\ win # "hidden" /\ win' = "hidden"
            /\ paused' = (paused \/ InProgress)
            /\ walking' = IF InProgress THEN FALSE ELSE walking
            /\ UNCHANGED <<phase, cover, cheers, seen, friend, dice>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ UNCHANGED <<phase, walking, cover, paused, cheers, seen, friend, dice>>
\* No blur or focus listener anywhere in the game.
WindowBlurs == /\ win = "on" /\ win' = "away" /\ UNCHANGED <<phase, walking, cover, paused, cheers, seen, friend, dice>>
WindowFocuses == /\ win = "away" /\ win' = "on" /\ UNCHANGED <<phase, walking, cover, paused, cheers, seen, friend, dice>>
YouResume == /\ win = "on" /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<phase, walking, cover, win, cheers, seen, friend, dice>>

Next == YouRoll \/ YouPick \/ YouSkipWalk \/ PieceLands \/ Celebrate \/ ResultShows
        \/ YouPlayAgain \/ YouRaceSameDice \/ YouStartOver \/ FriendLinkOpens
        \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ YouResume

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ walking \in BOOLEAN /\ cover \in BOOLEAN /\ paused \in BOOLEAN
          /\ win \in {"on", "away", "hidden"} /\ cheers \in 0..2 /\ seen \in BOOLEAN
          /\ friend \in BOOLEAN /\ dice \in {"new", "theirs"}

\* The reader's rules.
PausedWhenHidden == (InProgress /\ win = "hidden") => paused
NoProgressWhileAway == walking => win # "away"   \* hidden freezes the walk; blurred must too
ChoiceFreezesPlay == phase = "choose" => ~walking
NothingMovesWhilePaused == paused => ~walking
NoDoubleResult == cheers <= 1
ResultMatchesPlay == cover => (Settled /\ cheers = 1)
OneCoverAtATime == ~(paused /\ cover)
ReplayIsExact == friend => dice = "theirs"
====
