---- MODULE Baghbandi ----
EXTENDS Naturals
\* বাঘবন্দি: who plays (goats, tiger or two people), the turn, the bot's 650 ms reply, the hidden-tab pause,
\* window focus, take-back, the once-per-game result and a friend's challenge link, mirrored from
\* tools/baghbandi/components/baghbandi-game.tsx (fresh, move, tap, takeBack, the bot effect, the result effect,
\* the hashchange/visibilitychange effect, primary) and tools/baghbandi/lib/game.ts (isBotTurn, canUndo, undo).
\* Abstractions: a move either keeps the game going or ends it; levels collapse to "the friend's level or not";
\* the board, selection and keyboard cursor are left out (they never advance play on their own).
VARIABLES mode, stage, turn, paused, win, cheers, friend, seed, fromLink
vars == <<mode, stage, turn, paused, win, cheers, friend, seed, fromLink>>

Modes == {"goat", "tiger", "pair"}       \* ছাগল হবো, বাঘ হবো, দুজনে
Live == stage \in {"ready", "mid"}       \* a game on the board, not the friend's card, not over
\* The goats move first, so as the tiger the bot opens.
FirstTurn(m) == IF m = "tiger" THEN "bot" ELSE "you"
BotThinks == Live /\ turn = "bot" /\ ~paused

Init == /\ mode = "goat" /\ stage = "ready" /\ turn = "you" /\ paused = FALSE /\ win = "on"
        /\ cheers = 0 /\ friend = FALSE /\ seed = "new" /\ fromLink = FALSE

\* fresh(m, level): a new game, unpaused. Without a level a friend's game keeps their seed;
\* with a level, only the friend's own level does.
Fresh(m, s, link) == /\ mode' = m /\ stage' = "ready" /\ turn' = FirstTurn(m) /\ paused' = FALSE
                     /\ cheers' = 0 /\ seed' = s /\ fromLink' = link /\ UNCHANGED friend

\* tap() → move(): only when canPlay (not paused, not the bot's turn, not over, not the friend's card).
YouMove == /\ win = "on" /\ Live /\ turn = "you" /\ ~paused
           /\ \E ends \in BOOLEAN :
                 /\ stage' = IF ends THEN "over" ELSE "mid"
                 /\ turn' = IF ends \/ mode = "pair" THEN "you" ELSE "bot"
           /\ UNCHANGED <<mode, paused, win, cheers, friend, seed, fromLink>>
\* The bot effect: a setTimeout of 650 ms (1200 in ধীরে খেলো), cleared only by pause, the friend's card or a new game.
\* Nothing about the window: it fires while blurred, and while hidden (throttled to about a second).
BotMoves == /\ BotThinks
            /\ \E ends \in BOOLEAN : stage' = (IF ends THEN "over" ELSE "mid") /\ turn' = "you"
            /\ UNCHANGED <<mode, paused, win, cheers, friend, seed, fromLink>>
\* The result effect, guarded by finished.current === game.
Celebrate == /\ stage = "over" /\ cheers = 0 /\ cheers' = 1
             /\ UNCHANGED <<mode, stage, turn, paused, win, friend, seed, fromLink>>
\* takeBack(): canUndo needs a move by you and a game not over; it also unpauses.
YouTakeBack == /\ win = "on" /\ stage = "mid"
               /\ \E back \in IF mode = "tiger" THEN {"mid"} ELSE {"ready", "mid"} : stage' = back
               /\ turn' = "you" /\ paused' = FALSE
               /\ UNCHANGED <<mode, win, cheers, friend, seed, fromLink>>
\* The mode buttons (and, on the first screen, tapping a tiger): fresh(m) with no level.
YouPickMode == /\ win = "on" /\ stage # "friend"
               /\ \E m \in Modes : Fresh(m, IF friend THEN "theirs" ELSE "new", FALSE)
               /\ UNCHANGED win
\* On the friend's card: এবার তুমি বাঘ হও / ছাগল হয়ে খেলো, fresh(1) or fresh(2) on their seed.
YouTakeTheChallenge == /\ win = "on" /\ stage = "friend"
                       /\ \E m \in {"tiger", "goat"} : Fresh(m, "theirs", TRUE)
                       /\ UNCHANGED win
\* After a game: পরের লেভেল / আরেকবার / আবার খেলো, or a level from সব লেভেল: fresh(mode, level).
YouPlayAgain == /\ win = "on" /\ stage \in {"over", "ready", "mid"} /\ (stage = "over" \/ mode # "pair")
                /\ \E s \in IF friend THEN {"theirs", "new"} ELSE {"new"} : Fresh(mode, s, FALSE)
                /\ UNCHANGED win
\* hashchange with a valid link: their card, a viewing game, unpaused.
FriendLinkOpens == /\ win = "on" /\ stage' = "friend" /\ mode' = "tiger" /\ turn' = "bot" /\ paused' = FALSE
                   /\ cheers' = 0 /\ friend' = TRUE /\ seed' = "theirs" /\ fromLink' = FALSE /\ UNCHANGED win
\* visibilitychange → hidden: pause only once a move has been played and the game isn't over.
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ paused' = (paused \/ stage = "mid")
            /\ UNCHANGED <<mode, stage, turn, cheers, friend, seed, fromLink>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ UNCHANGED <<mode, stage, turn, paused, cheers, friend, seed, fromLink>>
WindowBlurs == /\ win = "on" /\ win' = "away" /\ UNCHANGED <<mode, stage, turn, paused, cheers, friend, seed, fromLink>>
WindowFocuses == /\ win = "away" /\ win' = "on" /\ UNCHANGED <<mode, stage, turn, paused, cheers, friend, seed, fromLink>>
YouResume == /\ win = "on" /\ paused /\ paused' = FALSE /\ UNCHANGED <<mode, stage, turn, win, cheers, friend, seed, fromLink>>

Next == YouMove \/ BotMoves \/ Celebrate \/ YouTakeBack \/ YouPickMode \/ YouTakeTheChallenge \/ YouPlayAgain
        \/ FriendLinkOpens \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ YouResume

Spec == Init /\ [][Next]_vars

TypeOK == /\ mode \in Modes /\ stage \in {"friend", "ready", "mid", "over"} /\ turn \in {"you", "bot"}
          /\ paused \in BOOLEAN /\ win \in {"on", "away", "hidden"} /\ cheers \in 0..1
          /\ friend \in BOOLEAN /\ seed \in {"new", "theirs"} /\ fromLink \in BOOLEAN

\* The reader's rules.
BotWaitsWhileHidden == BotThinks => win # "hidden"
BotWaitsWhileBlurred == BotThinks => win # "away"
PausedWhenHidden == (stage = "mid" /\ win = "hidden") => paused
BotOnlyAgainstYou == turn = "bot" => mode # "pair"
NoDoubleResult == cheers <= 1 /\ (cheers = 1 => stage = "over")
ReplayIsExact == fromLink => (seed = "theirs" /\ friend)
====
