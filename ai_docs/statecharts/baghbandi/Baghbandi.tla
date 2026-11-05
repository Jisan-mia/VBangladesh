---- MODULE Baghbandi ----
EXTENDS Naturals, FiniteSets
\* বাঘবন্দি after the rewrite: the screen (title, play, result), who plays, the bot's beat, the player's pause menu,
\* window focus and a hidden tab, the level sheet, the come-back guard, the result-key guard, the once-per-game
\* result, the ladder's own open level and a friend's far-ahead link. Mirrored from:
\*  - tools/baghbandi/lib/flow.ts (running, held, start, finish, reopen, menu, away, sheet, awake, takesTap, takesResultKey);
\*  - tools/baghbandi/lib/save.ts (openAfter) and lib/game.ts (isBotTurn, canUndo);
\*  - tools/baghbandi/components/bagh-game.tsx (load, pickMode, startPlay, the bot effect armed on running && botTurn,
\*    apply/finishGame, takeBack, the blur/focus/visibility effect, useGamePlayer onPause/onResume/onRestart, the window
\*    key handler, `guarded` on every start-card and result button, openFriend);
\*  - shared/game-player-client.tsx (the menu opens on blur and hide once the game has been touched).
\* Abstractions: a move either keeps the game going or ends it, won or lost; three levels (3 is the friend's, far ahead);
\* the board, selection, drag and keyboard cursor are left out (they never advance play on their own).
\* Full = TRUE checks everything (BaghbandiFull.cfg). Full = FALSE (Baghbandi.cfg) draws the chart: the tiger's side, one level,
\* no link, and a game already touched, so the picture stays under the chart budget. Every rule holds in both.
CONSTANT Full
VARIABLES screen, mode, turn, menu, win, sheet, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped
vars == <<screen, mode, turn, menu, win, sheet, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>

Modes == IF Full THEN {"goat", "tiger", "pair"} ELSE {"tiger"}   \* ছাগল হয়ে, বাঘ হয়ে, দুজনে
Levels == IF Full THEN 1..3 ELSE 1..1
FriendLevel == 3
Held == menu \/ win # "on" \/ sheet           \* flow.held
Running == screen = "play" /\ ~Held           \* flow.running: the clock counts, the bot may move
BotArmed == Running /\ turn = "bot"           \* the bot effect's timer exists only then
Awake == ~guard                               \* flow.awake: not within BACK_GUARD_MS of coming back
\* As the tiger on the full board the goats (the bot) open; in a lesson you move first. Two people and the goats: you.
FirstTurns(m) == IF m = "tiger" THEN {"bot", "you"} ELSE {"you"}
\* load(): a friend's own level keeps their seed; anything else gets a fresh one.
SeedFor(l) == IF friend /\ l = FriendLevel THEN "theirs" ELSE "new"
Reach(l) == l <= open \/ l = visit

Init == /\ screen = "title" /\ mode = "tiger" /\ turn = "you" /\ menu = FALSE /\ win = "on" /\ sheet = FALSE
        /\ engaged = ~Full /\ guard = FALSE /\ fresh = FALSE /\ cheers = 0 /\ outcome = "none" /\ friend = FALSE
        /\ seed = "new" /\ lv = 1 /\ open = 1 /\ stars = {} /\ visit = 0 /\ tapOnBack = FALSE /\ skipped = FALSE

\* load(m, l): the start card for a level. Holds other than the sheet stay; the result is gone.
Load(m, l) == /\ screen' = "title" /\ mode' = m /\ lv' = l /\ seed' = SeedFor(l) /\ sheet' = FALSE
              /\ turn' \in FirstTurns(m) /\ cheers' = 0 /\ fresh' = FALSE /\ outcome' = "none"

\* The move that ends a game records it at once (finishGame inside apply): stars, your own open level, the result guard.
Ends(won) == /\ screen' = "over" /\ cheers' = 1 /\ fresh' = TRUE /\ outcome' = IF won THEN "won" ELSE "lost"
             /\ stars' = IF won /\ mode # "pair" THEN stars \cup {lv} ELSE stars
             /\ open' = IF won /\ mode # "pair" /\ lv = open /\ open < Cardinality(Levels) THEN open + 1 ELSE open

\* Start-card buttons are `guarded`: nothing happens under the menu, away, or right after coming back.
YouPickSide == /\ screen = "title" /\ ~Held /\ Awake
               /\ \E m \in Modes : Load(m, IF m = "pair" THEN 1 ELSE IF friend THEN FriendLevel ELSE 1)
               /\ UNCHANGED <<menu, win, engaged, guard, friend, open, stars, visit, tapOnBack, skipped>>
YouPickLevel == /\ screen = "title" /\ ~Held /\ Awake /\ mode # "pair"
                /\ \E l \in Levels : Reach(l) /\ Load(mode, l)
                /\ UNCHANGED <<menu, win, engaged, guard, friend, open, stars, visit, tapOnBack, skipped>>
YouStart == /\ screen = "title" /\ ~Held /\ Awake /\ screen' = "play" /\ engaged' = TRUE
            /\ UNCHANGED <<mode, turn, menu, win, sheet, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>

\* A press on the board: flow.takesTap (running and awake). tapOnBack records a move made by the come-back press.
YouMove == /\ Running /\ turn = "you" /\ Awake /\ tapOnBack' = guard
           /\ \/ /\ turn' = IF mode = "pair" THEN "you" ELSE "bot"
                 /\ UNCHANGED <<screen, cheers, fresh, outcome, stars, open>>
              \/ \E won \in BOOLEAN : Ends(won) /\ UNCHANGED turn
           /\ UNCHANGED <<mode, menu, win, sheet, engaged, guard, friend, seed, lv, visit, skipped>>
\* The bot effect: its timer fires BOT_MS after being armed; any hold clears it.
BotMoves == /\ BotArmed
            /\ \/ /\ turn' = "you" /\ UNCHANGED <<screen, cheers, fresh, outcome, stars, open>>
               \/ \E won \in BOOLEAN : Ends(won) /\ UNCHANGED turn
            /\ UNCHANGED <<mode, menu, win, sheet, engaged, guard, friend, seed, lv, visit, tapOnBack, skipped>>
\* ফিরিয়ে আনো mid-game (also while the bot thinks): back to your move.
YouTakeBack == /\ Running /\ Awake /\ mode # "pair" /\ turn' = "you"
               /\ UNCHANGED <<screen, mode, menu, win, sheet, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
\* A lost lesson: শেষ চালটা ফিরিয়ে আনো reopens play (flow.reopen).
YouReopen == /\ screen = "over" /\ outcome = "lost" /\ mode # "pair" /\ ~Held /\ Awake
             /\ screen' = "play" /\ turn' = "you" /\ cheers' = 0 /\ fresh' = FALSE /\ outcome' = "none"
             /\ UNCHANGED <<mode, menu, win, sheet, engaged, guard, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>

\* Time passing: the come-back guard and the result guard run out.
GuardEnds == /\ guard /\ guard' = FALSE
             /\ UNCHANGED <<screen, mode, turn, menu, win, sheet, engaged, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
ResultSettles == /\ fresh /\ fresh' = FALSE
                 /\ UNCHANGED <<screen, mode, turn, menu, win, sheet, engaged, guard, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>

\* On the result: a fresh Enter (flow.takesResultKey) or a guarded button: পরের লেভেল / আবার খেলো load a start card.
\* skipped records leaving the result inside its guard.
YouGoOn == /\ screen = "over" /\ ~Held /\ ~fresh /\ Awake /\ skipped' = fresh
           /\ \E l \in Levels : Reach(l) /\ Load(mode, l)
           /\ UNCHANGED <<menu, win, engaged, guard, friend, open, stars, visit, tapOnBack>>

\* The level sheet (the HUD badge or সব লেভেল): it holds play; picking a level loads its start card.
YouOpenSheet == /\ screen \in {"title", "play"} /\ ~Held /\ Awake /\ mode # "pair" /\ sheet' = TRUE
                /\ UNCHANGED <<screen, mode, turn, menu, win, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
YouCloseSheet == /\ sheet /\ ~menu /\ win = "on" /\ sheet' = FALSE
                 /\ UNCHANGED <<screen, mode, turn, menu, win, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
YouPickFromSheet == /\ sheet /\ ~menu /\ win = "on" /\ mode # "pair"
                    /\ \E l \in Levels : Reach(l) /\ Load(mode, l)
                    /\ UNCHANGED <<menu, win, engaged, guard, friend, open, stars, visit, tapOnBack, skipped>>

\* The window. The player opens its menu on blur and on hide once the game has been touched (engaged).
WindowBlurs == /\ win = "on" /\ win' = "blurred" /\ menu' = (menu \/ engaged)
               /\ UNCHANGED <<screen, mode, turn, sheet, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ menu' = (menu \/ engaged)
            /\ UNCHANGED <<screen, mode, turn, sheet, engaged, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
\* Coming back (focus or visible): flow.away(false) starts the come-back guard.
WindowFocuses == /\ win = "blurred" /\ win' = "on" /\ guard' = TRUE
                 /\ UNCHANGED <<screen, mode, turn, menu, sheet, engaged, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ guard' = TRUE
            /\ UNCHANGED <<screen, mode, turn, menu, sheet, engaged, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
\* ⏸, P (player.requestPause) or Escape.
YouPause == /\ win = "on" /\ ~menu /\ menu' = TRUE /\ engaged' = TRUE
            /\ UNCHANGED <<screen, mode, turn, win, sheet, guard, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
\* চালিয়ে যাও: onResume → flow.menu(false), which starts the come-back guard.
YouResume == /\ menu /\ win = "on" /\ menu' = FALSE /\ guard' = TRUE
             /\ UNCHANGED <<screen, mode, turn, win, sheet, engaged, fresh, cheers, outcome, friend, seed, lv, open, stars, visit, tapOnBack, skipped>>
\* নতুন করে শুরু: onRestart → the same level's start card.
YouRestart == /\ menu /\ win = "on" /\ menu' = FALSE /\ guard' = TRUE /\ Load(mode, lv)
              /\ UNCHANGED <<win, engaged, friend, open, stars, visit, tapOnBack, skipped>>

\* A friend's link (boot or hashchange): their side, their level and seed, which you may visit though it's far ahead.
FriendLinkOpens == /\ Full /\ friend' = TRUE /\ visit' = FriendLevel /\ screen' = "title" /\ mode' \in {"tiger", "goat"}
                   /\ lv' = FriendLevel /\ seed' = "theirs" /\ sheet' = FALSE /\ cheers' = 0 /\ fresh' = FALSE /\ outcome' = "none"
                   /\ turn' \in FirstTurns(mode')
                   /\ UNCHANGED <<menu, win, engaged, guard, open, stars, tapOnBack, skipped>>

Next == YouPickSide \/ YouPickLevel \/ YouStart \/ YouMove \/ BotMoves \/ YouTakeBack \/ YouReopen \/ GuardEnds \/ ResultSettles
        \/ YouGoOn \/ YouOpenSheet \/ YouCloseSheet \/ YouPickFromSheet \/ WindowBlurs \/ TabHides \/ WindowFocuses \/ TabShows
        \/ YouPause \/ YouResume \/ YouRestart \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ mode \in Modes /\ turn \in {"you", "bot"} /\ menu \in BOOLEAN
          /\ win \in {"on", "blurred", "hidden"} /\ sheet \in BOOLEAN /\ engaged \in BOOLEAN /\ guard \in BOOLEAN
          /\ fresh \in BOOLEAN /\ cheers \in 0..1 /\ outcome \in {"none", "won", "lost"} /\ friend \in BOOLEAN
          /\ seed \in {"new", "theirs"} /\ lv \in 1..3 /\ open \in 1..3 /\ stars \subseteq Levels /\ visit \in {0, FriendLevel}
          /\ tapOnBack \in BOOLEAN /\ skipped \in BOOLEAN

\* The reader's rules.
BotWaitsWhileHidden == BotArmed => win # "hidden"
BotWaitsWhileBlurred == BotArmed => win # "blurred"
NoProgressWhileAway == Running => win = "on"
PausedWhenAway == (engaged /\ screen = "play" /\ win # "on") => menu
ChoiceFreezesPlay == sheet => ~Running
ComeBackIsNotAMove == ~tapOnBack
ResultNeedsFreshPress == ~skipped
NoDoubleResult == cheers <= 1 /\ (cheers = 1 <=> screen = "over")
BotOnlyAgainstYou == turn = "bot" => mode # "pair"
ReplayIsExact == (friend /\ lv = FriendLevel /\ mode # "pair") => seed = "theirs"
OpenLevelsAreEarned == \A k \in 2..open : (k - 1) \in stars
====
