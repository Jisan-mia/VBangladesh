---- MODULE SapLudu ----
EXTENDS Naturals
\* সাপলুডু after the rewrite: the title, the race (a walk in flight, a choice, a computer's turn), the shared player's
\* pause menu and the window, the breath after resuming, the level sheet, the end screen with its fresh-key rule, the
\* levels your own play opens, stars, and a friend's link. Mirrors:
\*   tools/sap-ludu/components/ludu-game.tsx  tap(), throwDie(), pickPiece(), step() (stepMotion / paceStep on the
\*     useGameLoop clock, which runs only while screen = play and the menu is shut), settle(), finish(), toTitle(),
\*     start(), the window key handler (freshPress on the end screen), onPause / onResume (breath) / onRestart, readFriend()
\*   tools/sap-ludu/lib/motion.hot.ts  stepMotion, paceStep, freshPress;  lib/save.ts openAfter;  lib/game.ts starsOf
\*   shared/game-player-client.tsx  away(): blur or hide opens the menu once you've played; useGameLoop stops on blur.
\* Abstractions: three levels; a move ends in "your turn", "a computer's turn", "a choice" or "home"; stars 1..3.
\* Ghost flags (movedAway, movedPaused, earlyMove, skipped) record a step that would break a rule; the guards keep them FALSE.
CONSTANTS Levels
VARIABLES screen, act, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice,
          movedAway, movedPaused, earlyMove, skipped
vars == <<screen, act, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice, movedAway, movedPaused, earlyMove, skipped>>

Max(a, b) == IF a > b THEN a ELSE b
LoopRuns == screen = "play" /\ menu = FALSE /\ win = "on"      \* useGameLoop running and not blurred or hidden
Ghosts == <<movedAway, movedPaused, earlyMove, skipped>>
Mark == /\ movedAway' = (movedAway \/ win # "on")
        /\ movedPaused' = (movedPaused \/ menu)
        /\ earlyMove' = (earlyMove \/ breath)
        /\ UNCHANGED skipped

Init == /\ screen = "title" /\ act = "idle" /\ seat = "you" /\ menu = FALSE /\ win = "on" /\ breath = FALSE
        /\ sheet = FALSE /\ held = FALSE /\ cheers = 0 /\ earned = 0 /\ level = 1 /\ openL = 1 /\ ownTop = 0
        /\ stars = [l \in 1..Levels |-> 0] /\ friend = FALSE /\ dice = "new"
        /\ movedAway = FALSE /\ movedPaused = FALSE /\ earlyMove = FALSE /\ skipped = FALSE

\* ---- you ----
\* tap() on the title: start() and the first roll in one tap. The die and the board answer the press.
YouStart == /\ screen = "title" /\ win = "on" /\ ~menu /\ ~sheet
            /\ screen' = "play" /\ act' = "moving" /\ seat' = "you" /\ cheers' = 0 /\ earned' = 0
            /\ UNCHANGED <<menu, win, breath, sheet, held, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* tap() on your turn: throwDie(). Ignored under the menu and during the breath.
YouRoll == /\ screen = "play" /\ act = "idle" /\ seat = "you" /\ win = "on" /\ ~menu /\ ~breath
           /\ act' = "moving"
           /\ UNCHANGED <<screen, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* A tap during a walk: finishMotion, then settle() as below.
YouHurry == /\ screen = "play" /\ act = "moving" /\ win = "on" /\ ~menu /\ ~breath
            /\ act' = "idle"
            /\ UNCHANGED <<screen, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* A card or 1/2 while choosing.
YouPick == /\ screen = "play" /\ act = "choosing" /\ seat = "you" /\ win = "on" /\ ~menu /\ ~breath
           /\ act' = "moving"
           /\ UNCHANGED <<screen, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts

\* ---- the loop's clock (step): only while LoopRuns ----
\* stepMotion reaches EV_DONE: settle() hands the turn on, opens a choice, or finish() ends the race.
MoveEnds == /\ LoopRuns /\ act = "moving" /\ ~breath
            /\ \E next \in {"you", "bot"}, what \in {"idle", "choosing"} : seat' = next /\ act' = what
            /\ UNCHANGED <<screen, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ Mark
\* finish(): stars recorded once at the moment you get home, the next level opened only by your own play (openAfter).
YouGetHome == /\ LoopRuns /\ act = "moving" /\ ~breath
              /\ \E s \in 1..3 :
                   /\ earned' = s
                   /\ stars' = [stars EXCEPT ![level] = Max(@, s)]
              /\ openL' = IF level <= openL THEN Max(openL, IF level < Levels THEN level + 1 ELSE Levels) ELSE openL
              /\ ownTop' = IF level <= openL THEN Max(ownTop, level) ELSE ownTop
              /\ cheers' = cheers + 1
              /\ screen' = "over" /\ act' = "idle"
              /\ UNCHANGED <<seat, menu, win, breath, sheet, held, level, friend, dice>> /\ Mark
\* paceStep: a computer rolls (or picks) after its beat; never during the breath.
BotRolls == /\ LoopRuns /\ act = "idle" /\ seat = "bot" /\ ~breath
            /\ act' = "moving"
            /\ UNCHANGED <<screen, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ Mark
BotPicks == /\ LoopRuns /\ act = "choosing" /\ seat = "bot" /\ ~breath
            /\ act' = "moving"
            /\ UNCHANGED <<screen, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ Mark
\* The breath after চালিয়ে যাও runs out on the loop's clock.
BreathEnds == /\ LoopRuns /\ breath /\ breath' = FALSE
              /\ UNCHANGED <<screen, act, seat, menu, win, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts

\* ---- the window and the player's menu ----
\* Blur or hide: useGameLoop stops; the player opens the menu once you've played (any race screen).
WindowBlurs == /\ win = "on" /\ win' = "away" /\ menu' = (menu \/ screen # "title")
               /\ UNCHANGED <<screen, act, seat, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ menu' = (menu \/ screen # "title")
            /\ UNCHANGED <<screen, act, seat, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
YouComeBack == /\ win # "on" /\ win' = "on"
               /\ UNCHANGED <<screen, act, seat, menu, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* P (requestPause), Escape or the ⏸ button.
YouPause == /\ win = "on" /\ screen = "play" /\ ~menu /\ menu' = TRUE
            /\ UNCHANGED <<screen, act, seat, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* চালিয়ে যাও: onResume gives the breath.
YouResume == /\ win = "on" /\ menu /\ menu' = FALSE /\ breath' = (screen = "play")
             /\ UNCHANGED <<screen, act, seat, win, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* নতুন করে শুরু: onRestart → toTitle(), the same setup.
YouRestart == /\ win = "on" /\ menu /\ menu' = FALSE /\ screen' = "title" /\ act' = "idle" /\ breath' = FALSE /\ sheet' = FALSE
              /\ UNCHANGED <<seat, win, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts

\* ---- the end screen ----
\* You were holding Space or Enter as the last move landed: the key is still down on the end screen.
KeyHeldThrough == /\ screen = "over" /\ ~held /\ held' = TRUE
                  /\ UNCHANGED <<screen, act, seat, menu, win, breath, sheet, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
KeyUp == /\ held /\ held' = FALSE
         /\ UNCHANGED <<screen, act, seat, menu, win, breath, sheet, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
\* The held key repeats: freshPress rejects it (repeat, or it began before the screen), so nothing happens.
KeyRepeats == /\ screen = "over" /\ held /\ win = "on" /\ ~menu
              /\ UNCHANGED <<screen, act, seat, menu, win, breath, sheet, held, cheers, earned, level, openL, ownTop, stars, friend, dice>>
              /\ skipped' = skipped /\ UNCHANGED <<movedAway, movedPaused, earlyMove>>
\* A fresh press, or the button: পরের লেভেল (the next start card) or আবার / একই ছক্কায় আবার (straight into a race).
YouGoNext == /\ screen = "over" /\ ~held /\ win = "on" /\ ~menu /\ ~sheet
             /\ \/ /\ screen' = "title" /\ act' = "idle" /\ level' = (IF level < openL THEN level + 1 ELSE level) /\ friend' = FALSE /\ dice' = "new"
                \/ /\ screen' = "play" /\ act' = "moving" /\ level' = level /\ friend' = FALSE /\ dice' = "new"
                \/ /\ screen' = "play" /\ act' = "moving" /\ level' = level /\ friend' = friend /\ dice' = dice
             /\ seat' = "you" /\ cheers' = 0 /\ earned' = 0
             /\ UNCHANGED <<menu, win, breath, sheet, held, openL, ownTop, stars>> /\ UNCHANGED Ghosts

\* ---- the level sheet (title and end screens only) ----
YouOpenSheet == /\ screen \in {"title", "over"} /\ ~sheet /\ win = "on" /\ ~menu /\ sheet' = TRUE
                /\ UNCHANGED <<screen, act, seat, menu, win, breath, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts
YouPickLevel == /\ sheet /\ win = "on" /\ ~menu /\ \E l \in 1..openL : level' = l
                /\ sheet' = FALSE /\ screen' = "title" /\ act' = "idle" /\ friend' = FALSE /\ dice' = "new" /\ cheers' = 0 /\ earned' = 0
                /\ UNCHANGED <<seat, menu, win, breath, held, openL, ownTop, stars>> /\ UNCHANGED Ghosts
YouCloseSheet == /\ sheet /\ sheet' = FALSE
                 /\ UNCHANGED <<screen, act, seat, menu, win, breath, held, cheers, earned, level, openL, ownTop, stars, friend, dice>> /\ UNCHANGED Ghosts

\* ---- a friend's link (hashchange → readFriend → toTitle) to the far level, the same dice ----
FriendLinkOpens == /\ win = "on" /\ screen # "play" /\ ~friend
                   /\ friend' = TRUE /\ dice' = "theirs" /\ level' = Levels /\ screen' = "title" /\ act' = "idle" /\ sheet' = FALSE /\ cheers' = 0 /\ earned' = 0
                   /\ UNCHANGED <<seat, menu, win, breath, held, openL, ownTop, stars>> /\ UNCHANGED Ghosts

Next == YouStart \/ YouRoll \/ YouHurry \/ YouPick \/ MoveEnds \/ YouGetHome \/ BotRolls \/ BotPicks \/ BreathEnds
        \/ WindowBlurs \/ TabHides \/ YouComeBack \/ YouPause \/ YouResume \/ YouRestart
        \/ KeyHeldThrough \/ KeyUp \/ KeyRepeats \/ YouGoNext \/ YouOpenSheet \/ YouPickLevel \/ YouCloseSheet \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ act \in {"idle", "moving", "choosing"} /\ seat \in {"you", "bot"}
          /\ menu \in BOOLEAN /\ win \in {"on", "away", "hidden"} /\ breath \in BOOLEAN /\ sheet \in BOOLEAN /\ held \in BOOLEAN
          /\ cheers \in 0..2 /\ earned \in 0..3 /\ level \in 1..Levels /\ openL \in 1..Levels /\ ownTop \in 0..Levels /\ friend \in BOOLEAN /\ dice \in {"new", "theirs"}

\* ---- the reader's rules ----
\* Hide the tab or click into another window mid-race: the pause menu is up.
PausedWhenAway == (screen = "play" /\ win # "on") => menu
\* No walk, computer roll or computer pick ever happens while you're away, or under the menu.
NoProgressWhileAway == ~movedAway
NothingMovesWhilePaused == ~movedPaused
\* After চালিয়ে যাও, nothing moves until the breath is over.
BreathBeforeMotion == ~earlyMove
\* The level sheet only opens off the race, so it never hides a moving piece.
SheetOffPlay == sheet => screen # "play"
\* The fanfare plays once a race; the card's stars are the stars recorded.
NoDoubleResult == cheers <= 1
ResultMatchesPlay == screen = "over" => (earned >= 1 /\ stars[level] >= earned)
\* A key held through the last move never leaves the end screen.
HeldKeyNeverSkipsResult == ~skipped
\* Only your own play opens a level: never more than one past a level you cleared while it was open.
UnlockByOwnPlay == openL <= ownTop + 1
\* A friend's far level replays their dice, and a fresh race takes new ones.
ReplayIsExact == friend => dice = "theirs"
\* The chart's scope (Chart.cfg only): one level, no hidden tab (it acts as blur), no sheet or friend, one star value.
\* The full check in SapLudu.cfg explores everything.
ChartScope == /\ win # "hidden" /\ ~sheet /\ ~friend /\ earned \in {0, 3} /\ stars[1] \in {0, 3}
====
