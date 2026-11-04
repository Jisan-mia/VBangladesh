---- MODULE ChhokJora ----
EXTENDS Naturals
\* ছক-জোড়া after the rewrite: the screen (start card, quilt, result, কাটাকুটি), one person or two, the bot's beat on both
\* boards, the player's pause menu, window focus and a hidden tab, the level sheet, the finger on the cloth, the second tap,
\* the come-back and hand-off guards, the result-key guard, the cheer and the once-per-game result. Mirrored from:
\*  - tools/chhok-jora/lib/flow.ts (running, kataRunning, held, start, kata, toTitle, finish, menu, away, sheet, handOff,
\*    awake, takesTap, takesResultKey; the cheer flag);
\*  - tools/chhok-jora/lib/input.ts (press, lift, release, ghostOf, attempt, keyAct);
\*  - tools/chhok-jora/components/chhok-game.tsx (load, startPlay, the bot effect armed on running && botTurn, apply and
\*    finishGame (stars and the cheer in the same step), tryStitch, takeBack, the pointer handlers, the window key handler
\*    with dropFocus, the blur/focus/visibility effect, useGamePlayer onPause/onResume/onRestart, openSheet/closeSheet);
\*  - tools/chhok-jora/components/kata.tsx (the bot effect armed on live && botTurn, fresh, onHome);
\*  - shared/game-player-client.tsx (the menu opens on blur and hide once the game has been touched).
\* Abstractions: a stitch keeps the quilt going or ends it; a কাটাকুটি round is "your mark / its mark / over". The board,
\* the keyboard cursor's position and the score are left out (they never advance play on their own).
\* Full = TRUE (ChhokJoraFull.cfg) checks everything; Full = FALSE (ChhokJora.cfg) draws the chart: one person, a game already
\* touched, so the picture stays under the chart budget. Every rule holds in both.
CONSTANT Full
VARIABLES screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, armed,
          tapOnBack, tapOnHand, skipped, enterUndid
vars == <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, armed,
          tapOnBack, tapOnHand, skipped, enterUndid>>

Held == menu \/ win # "on" \/ sheet                  \* flow.held
Running == screen = "play" /\ ~Held                  \* flow.running: the quilt's clock counts, its bot may sew
KataRunning == screen = "kata" /\ ~Held              \* flow.kataRunning
BotArmed == Running /\ turn = "bot"                  \* the quilt's bot timer exists only then
KataBotArmed == KataRunning /\ kturn = "bot"         \* কাটাকুটি's bot timer exists only then
Awake == ~guard                                      \* flow.awake
TakesTap == Running /\ Awake /\ ~hand /\ turn = "you" \* flow.takesTap, and not on the bot's turn
Ghost == finger = "down" /\ Running /\ turn = "you"  \* input.ghostOf: the pale stitch on screen

Modes == IF Full THEN {"solo", "pair"} ELSE {"solo"}

Init == /\ screen = "title" /\ mode = "solo" /\ turn = "you" /\ kturn = "you" /\ menu = FALSE /\ win = "on" /\ sheet = FALSE
        /\ engaged = ~Full /\ guard = FALSE /\ hand = FALSE /\ fresh = FALSE /\ cheer = FALSE /\ cheers = 0
        /\ finger = "no" /\ armed = FALSE /\ tapOnBack = FALSE /\ tapOnHand = FALSE /\ skipped = FALSE /\ enterUndid = FALSE

\* load(): a start card. silenceScheduled() and flow.toTitle drop the cheer; the finger, the arming and the sheet go.
\* Level 11 lets the bot sew first, so a solo quilt may open on the bot's turn.
Load(m) == /\ screen' = "title" /\ mode' = m /\ turn' \in (IF m = "solo" THEN {"you", "bot"} ELSE {"you"})
           /\ cheer' = FALSE /\ cheers' = 0 /\ fresh' = FALSE /\ armed' = FALSE /\ finger' = "no" /\ hand' = FALSE /\ sheet' = FALSE
\* apply → finishGame: the result, stars and cheer in the same step, and the result guard.
Ends == /\ screen' = "over" /\ cheer' = TRUE /\ cheers' = 1 /\ fresh' = TRUE /\ armed' = FALSE
\* A stitch that doesn't end the quilt: against the bot the turn passes; two people hand the phone over (flow.handOff).
Passes == /\ IF mode = "solo" THEN turn' = "bot" /\ UNCHANGED hand ELSE turn' = "you" /\ hand' = TRUE
          /\ armed' = FALSE /\ UNCHANGED <<screen, cheer, cheers, fresh>>
Sews == \/ Passes
        \/ Ends /\ UNCHANGED <<turn, hand>>

\* ---- the start card (`guarded` buttons: nothing under the menu, away, or right after coming back) ----
YouPickMode == /\ screen = "title" /\ ~Held /\ Awake /\ \E m \in Modes : Load(m)
               /\ UNCHANGED <<kturn, menu, win, engaged, guard, tapOnBack, tapOnHand, skipped, enterUndid>>
YouStart == /\ screen = "title" /\ ~Held /\ Awake /\ screen' = "play" /\ engaged' = TRUE
            /\ UNCHANGED <<mode, turn, kturn, menu, win, sheet, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouOpenKatakuti == /\ screen = "title" /\ ~Held /\ Awake /\ screen' = "kata" /\ kturn' = "you" /\ engaged' = TRUE
                   /\ UNCHANGED <<mode, turn, menu, win, sheet, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- the finger on the cloth ----
\* onPointerDown: only flow.takesTap. tapOnBack / tapOnHand record a press inside the come-back or hand-off guard.
YouPressTheCloth == /\ TakesTap /\ finger = "no" /\ finger' = "down" /\ tapOnBack' = guard /\ tapOnHand' = hand
                    /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, armed, skipped, enterUndid>>
\* onPointerUp: lift, then tryStitch → attempt: arm a stitch that gives away more than it must, or sew.
YouLiftAndArm == /\ finger = "down" /\ Running /\ turn = "you" /\ ~armed /\ finger' = "no" /\ armed' = TRUE
                 /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, tapOnBack, tapOnHand, skipped, enterUndid>>
YouLiftAndSew == /\ finger = "down" /\ Running /\ turn = "you" /\ finger' = "no" /\ Sews
                 /\ UNCHANGED <<mode, kturn, menu, win, sheet, engaged, guard, tapOnBack, tapOnHand, skipped, enterUndid>>
\* onPointerCancel / lost capture.
TheTouchIsCancelled == /\ finger = "down" /\ finger' = "no"
                       /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, armed, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- keys (input.keyAct): with the cursor out, Enter sews whatever button is focused; it is never ফিরিয়ে আনো ----
YouPressEnterOnTheCursor == /\ Running /\ turn = "you" /\ finger = "no" /\ Sews /\ enterUndid' = FALSE
                            /\ UNCHANGED <<mode, kturn, menu, win, sheet, engaged, guard, finger, tapOnBack, tapOnHand, skipped>>
\* ফিরিয়ে আনো (a click, Z or Backspace), mid-game against the bot, also while it thinks.
YouTakeBack == /\ Running /\ Awake /\ mode = "solo" /\ turn' = "you" /\ armed' = FALSE
               /\ UNCHANGED <<screen, mode, kturn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- the bots ----
TheBotSews == /\ BotArmed /\ \/ turn' = "you" /\ UNCHANGED <<screen, cheer, cheers, fresh, armed>>
                             \/ turn' = "bot" /\ UNCHANGED <<screen, cheer, cheers, fresh, armed>>   \* it closed a box: again
                             \/ Ends /\ UNCHANGED turn
              /\ UNCHANGED <<mode, kturn, menu, win, sheet, engaged, guard, hand, finger, tapOnBack, tapOnHand, skipped, enterUndid>>
YouMarkACell == /\ KataRunning /\ kturn = "you" /\ kturn' \in {"bot", "over"}
                /\ UNCHANGED <<screen, mode, turn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
TheKatakutiBotMarks == /\ KataBotArmed /\ kturn' \in {"you", "over"}
                       /\ UNCHANGED <<screen, mode, turn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouPlayAnotherRound == /\ KataRunning /\ kturn = "over" /\ kturn' \in {"you", "bot"}
                       /\ UNCHANGED <<screen, mode, turn, menu, win, sheet, engaged, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouLeaveKatakuti == /\ KataRunning /\ Awake /\ Load("solo")
                    /\ UNCHANGED <<kturn, menu, win, engaged, guard, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- time passing ----
GuardEnds == /\ guard /\ guard' = FALSE
             /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
HandGuardEnds == /\ hand /\ hand' = FALSE
                 /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
ResultSettles == /\ fresh /\ fresh' = FALSE
                 /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, sheet, engaged, guard, hand, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- the result: a fresh Enter (flow.takesResultKey) or a guarded button. skipped records leaving inside the guard. ----
YouGoOn == /\ screen = "over" /\ ~Held /\ ~fresh /\ Awake /\ skipped' = fresh /\ Load(mode)
           /\ UNCHANGED <<kturn, menu, win, engaged, guard, tapOnBack, tapOnHand, enterUndid>>

\* ---- the level sheet holds play; picking a level loads its start card ----
YouOpenTheSheet == /\ screen \in {"title", "play"} /\ ~Held /\ Awake /\ mode = "solo" /\ sheet' = TRUE /\ finger' = "no"
                   /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, engaged, guard, hand, fresh, cheer, cheers, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouCloseTheSheet == /\ sheet /\ ~menu /\ win = "on" /\ sheet' = FALSE
                    /\ UNCHANGED <<screen, mode, turn, kturn, menu, win, engaged, guard, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouPickFromTheSheet == /\ sheet /\ ~menu /\ win = "on" /\ Load("solo")
                       /\ UNCHANGED <<kturn, menu, win, engaged, guard, tapOnBack, tapOnHand, skipped, enterUndid>>

\* ---- the window: blur and hide release the finger; the player opens its menu once the game has been touched ----
WindowBlurs == /\ win = "on" /\ win' = "blurred" /\ menu' = (menu \/ engaged) /\ finger' = "no"
               /\ UNCHANGED <<screen, mode, turn, kturn, sheet, engaged, guard, hand, fresh, cheer, cheers, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ menu' = (menu \/ engaged) /\ finger' = "no"
            /\ UNCHANGED <<screen, mode, turn, kturn, sheet, engaged, guard, hand, fresh, cheer, cheers, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
WindowFocuses == /\ win = "blurred" /\ win' = "on" /\ guard' = TRUE
                 /\ UNCHANGED <<screen, mode, turn, kturn, menu, sheet, engaged, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ guard' = TRUE
            /\ UNCHANGED <<screen, mode, turn, kturn, menu, sheet, engaged, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
\* ⏸, P (player.requestPause) or Escape: onPause releases the finger.
YouPause == /\ win = "on" /\ ~menu /\ menu' = TRUE /\ engaged' = TRUE /\ finger' = "no"
            /\ UNCHANGED <<screen, mode, turn, kturn, win, sheet, guard, hand, fresh, cheer, cheers, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
YouResume == /\ menu /\ win = "on" /\ menu' = FALSE /\ guard' = TRUE
             /\ UNCHANGED <<screen, mode, turn, kturn, win, sheet, engaged, hand, fresh, cheer, cheers, finger, armed, tapOnBack, tapOnHand, skipped, enterUndid>>
\* নতুন করে শুরু: the quilt goes back to its start card; কাটাকুটি starts a fresh round.
YouRestart == /\ menu /\ win = "on" /\ menu' = FALSE /\ guard' = TRUE
              /\ IF screen = "kata" THEN kturn' = "you" /\ UNCHANGED <<screen, mode, turn, cheer, cheers, fresh, armed, finger, hand, sheet>>
                 ELSE Load(mode) /\ UNCHANGED kturn
              /\ UNCHANGED <<win, engaged, tapOnBack, tapOnHand, skipped, enterUndid>>

Next == YouPickMode \/ YouStart \/ YouOpenKatakuti \/ YouPressTheCloth \/ YouLiftAndArm \/ YouLiftAndSew \/ TheTouchIsCancelled
        \/ YouPressEnterOnTheCursor \/ YouTakeBack \/ TheBotSews \/ YouMarkACell \/ TheKatakutiBotMarks \/ YouPlayAnotherRound
        \/ YouLeaveKatakuti \/ GuardEnds \/ HandGuardEnds \/ ResultSettles \/ YouGoOn \/ YouOpenTheSheet \/ YouCloseTheSheet
        \/ YouPickFromTheSheet \/ WindowBlurs \/ TabHides \/ WindowFocuses \/ TabShows \/ YouPause \/ YouResume \/ YouRestart

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over", "kata"} /\ mode \in {"solo", "pair"} /\ turn \in {"you", "bot"}
          /\ kturn \in {"you", "bot", "over"} /\ menu \in BOOLEAN /\ win \in {"on", "blurred", "hidden"} /\ sheet \in BOOLEAN
          /\ engaged \in BOOLEAN /\ guard \in BOOLEAN /\ hand \in BOOLEAN /\ fresh \in BOOLEAN /\ cheer \in BOOLEAN
          /\ cheers \in 0..1 /\ finger \in {"no", "down"} /\ armed \in BOOLEAN /\ tapOnBack \in BOOLEAN /\ tapOnHand \in BOOLEAN
          /\ skipped \in BOOLEAN /\ enterUndid \in BOOLEAN

\* The reader's rules.
BotsWaitWhileAway == (BotArmed \/ KataBotArmed) => (win = "on" /\ ~menu)
QuiltWaitsOffScreen == screen = "kata" => ~BotArmed
QuiltFrozenUnderKatakuti == [][(screen = "kata" /\ screen' = "kata") => (turn' = turn /\ cheers' = cheers)]_vars
PausedWhenAway == (engaged /\ screen \in {"play", "kata"} /\ win # "on") => menu
InputReleasedWhenAway == (win # "on" \/ menu \/ sheet) => finger = "no"
GhostOnlyUnderAFinger == Ghost => (finger = "down" /\ win = "on" /\ ~menu)
NoCheerAfterMovingOn == cheer => screen = "over"
ResultStaysABeat == ~skipped
NoDoubleResult == cheers <= 1 /\ (cheers = 1 <=> screen = "over")
EnterNeverUndoes == ~enterUndid
ComeBackIsNotAMove == ~tapOnBack
HandOffIsNotAMove == ~tapOnHand
ChoiceFreezesPlay == sheet => ~Running
BotOnlyAgainstYou == turn = "bot" => mode = "solo"
====
