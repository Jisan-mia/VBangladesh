---- MODULE Bhangti ----
\* ভাংতি নাই! as it is today: the shop day's phase, the queue, the customer's clock, the hand-off timer (`advance`),
\* the window, the counter on screen, the "সময় নিয়ে" switch, the fanfare timer and saved stars.
\* Mirrored from tools/bhangti-nai/components/shop-game.tsx (startGame, finish, later, hand, lateNow, pause, resume,
\* restart, nextDay, pickDay, the visibilitychange/shopInView effects, the keys handler, the useGameLoop clock) and
\* tools/bhangti-nai/lib/game.ts (give, timeUp, isOver). useGameLoop (shared/game-kit.ts) runs only while
\* phase = "playing" and the clock is on, and stops when the tab hides. Ten customers are abstracted to two.
EXTENDS Naturals
CONSTANT N
VARIABLES phase, served, linger, visible, focused, inView, relaxed, results, fanfare, saved
vars == <<phase, served, linger, visible, focused, inView, relaxed, results, fanfare, saved>>

Phases == {"ready", "playing", "paused", "over"}
Max(a, b) == IF a > b THEN a ELSE b
\* The customer's clock bar runs: the loop runs while playing with the clock on, and lateNow/the bar skip while `lock`.
ClockRuns == phase = "playing" /\ visible /\ ~relaxed /\ ~linger

Init == /\ phase = "ready" /\ served = 0 /\ linger = FALSE
        /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ relaxed \in BOOLEAN /\ results = 0 /\ fanfare = FALSE /\ saved = 0

\* startGame(): শুরু করো, a chit on the ready screen, or Enter (the keys handler has no shopInView check).
\* It scrolls the counter into view only when the counter sits below the fold, so from further down the page
\* (Enter while reading the FAQ) the counter stays off screen. The model keeps inView as it was.
YouOpenShop == /\ phase = "ready" /\ visible /\ focused
               /\ phase' = "playing" /\ served' = 0 /\ linger' = FALSE
               /\ UNCHANGED <<visible, focused, inView, relaxed, results, fanfare, saved>>
\* hand() with the right change: live.lock, the customer lingers, later(850) sets the hand-off timer.
YouGiveRightChange == /\ phase = "playing" /\ visible /\ focused /\ ~linger /\ served < N
                      /\ served' = served + 1 /\ linger' = TRUE
                      /\ UNCHANGED <<phase, visible, focused, inView, relaxed, results, fanfare, saved>>
\* The clock bar runs out → lateNow(): timeUp, the customer says "থাক", later(2000).
ClockRunsOut == /\ ClockRuns /\ served < N
                /\ served' = served + 1 /\ linger' = TRUE
                /\ UNCHANGED <<phase, visible, focused, inView, relaxed, results, fanfare, saved>>
\* later()'s setTimeout fires whatever the phase: meet() the next customer...
NextCustomerStepsUp == /\ linger /\ served < N
                       /\ linger' = FALSE
                       /\ UNCHANGED <<phase, served, visible, focused, inView, relaxed, results, fanfare, saved>>
\* ...or, after the last one, finish(): go("over"), levels.record(stars), and a fanfare timer when there are stars.
ShopCloses == /\ linger /\ served = N
              /\ linger' = FALSE /\ phase' = "over" /\ results' = results + 1
              /\ \E earned \in 0..2 :
                   /\ saved' = IF earned > 0 THEN Max(saved, earned) ELSE saved
                   /\ fanfare' = (earned > 0)
              /\ UNCHANGED <<served, visible, focused, inView, relaxed>>
FanfareFires == /\ fanfare
                /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, served, linger, visible, focused, inView, relaxed, results, saved>>
\* pause(): the HUD button or P/Esc. It does not touch the hand-off timer.
YouPause == /\ phase = "playing" /\ visible /\ focused
            /\ phase' = "paused"
            /\ UNCHANGED <<served, linger, visible, focused, inView, relaxed, results, fanfare, saved>>
\* resume(): the overlay button, the HUD button, P, Esc or Enter. None of them needs the counter on screen.
YouResume == /\ phase = "paused" /\ visible /\ focused
             /\ phase' = "playing"
             /\ UNCHANGED <<served, linger, visible, focused, inView, relaxed, results, fanfare, saved>>
\* There is no blur listener.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE
               /\ UNCHANGED <<phase, served, linger, visible, inView, relaxed, results, fanfare, saved>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ UNCHANGED <<phase, served, linger, visible, inView, relaxed, results, fanfare, saved>>
\* visibilitychange → hidden: pause() from "playing".
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<served, linger, inView, relaxed, results, fanfare, saved>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, served, linger, inView, relaxed, results, fanfare, saved>>
\* useEffect([shopInView]): pause() when the counter scrolls away (only on the change to false).
ScrollAway == /\ visible /\ inView
              /\ inView' = FALSE
              /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
              /\ UNCHANGED <<served, linger, visible, focused, relaxed, results, fanfare, saved>>
ScrollBack == /\ visible /\ ~inView
              /\ inView' = TRUE
              /\ UNCHANGED <<phase, served, linger, visible, focused, relaxed, results, fanfare, saved>>
\* "সময় নিয়ে (ঘড়ি ছাড়া)": the clock loop stops or starts again.
YouSwitchTheClock == /\ visible /\ focused
                     /\ relaxed' = ~relaxed
                     /\ UNCHANGED <<phase, served, linger, visible, focused, inView, results, fanfare, saved>>
\* restart(), nextDay(), playFromCard(): startGame() clears the timers.
PlayAgain == /\ phase = "over" /\ visible /\ focused
             /\ phase' = "playing" /\ served' = 0 /\ linger' = FALSE /\ results' = 0 /\ fanfare' = FALSE
             /\ UNCHANGED <<visible, focused, inView, relaxed, saved>>
\* pickDay() from সব দিন, or a friend's link (hashchange): clearTimers(), go("ready"). Works in any phase.
YouPickADay == /\ visible /\ focused
               /\ phase' = "ready" /\ served' = 0 /\ linger' = FALSE /\ results' = 0 /\ fanfare' = FALSE
               /\ UNCHANGED <<visible, focused, inView, relaxed, saved>>

Next == YouOpenShop \/ YouGiveRightChange \/ ClockRunsOut \/ NextCustomerStepsUp \/ ShopCloses \/ FanfareFires
        \/ YouPause \/ YouResume \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack
        \/ YouSwitchTheClock \/ PlayAgain \/ YouPickADay

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ served \in 0..N /\ linger \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN /\ relaxed \in BOOLEAN
          /\ results \in 0..2 /\ fanfare \in BOOLEAN /\ saved \in 0..2

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == (visible /\ ~focused) => phase # "playing"
\* The customer's clock only runs while you can see the counter and the page has focus.
NoProgressWhileAway == ClockRuns => (focused /\ inView)
\* Game rule: "scrolling the counter away mid-game pauses it, so no clock runs off-screen" (the code's own comment).
OffScreenMeansPaused == phase = "playing" => inView
\* ChoiceFreezesPlay for the pause screen: nothing is waiting to happen on its own while the shop is paused.
NothingPendingWhilePaused == phase = "paused" => ~linger
NoDoubleResult == results <= 1
NoFanfareAfterMovingOn == fanfare => phase = "over"
\* The day only ends from play you can see, never behind the pause screen or a hidden tab.
DayEndsOnlyWhilePlaying == [][(phase' = "over" /\ phase # "over") => (phase = "playing" /\ visible)]_vars
StarsNeverDrop == [][saved' >= saved]_vars
====
