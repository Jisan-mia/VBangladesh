---- MODULE Cycle ----
\* পিয়নের সাইকেল: the ride, pause, window focus, scrolling the road away, the সব রুট list, পরের রুট / আবার খেলো /
\* আরেকবার খেলো, the star chimes and cheer, a friend's link, and the result card's comparison line,
\* mirrored from tools/peoner-cycle/components/cycle-game.tsx. Input is one tap per lane change (nothing is held);
\* there is no sound loop.
VARIABLES phase, win, inView, fanfare, picker, link, lvl, rode, card
vars == <<phase, win, inView, fanfare, picker, link, lvl, rode, card>>

Phases == {"ready", "playing", "paused", "over"}
\* lvl: the route on screen (label, goal line, star marks) is the friend's route ("theirs") or another ("other").
\* rode: the route the ride in progress was started on (its seed and road). card: whose route the result card is from.
Routes == {"theirs", "other"}

Init == /\ phase = "ready" /\ win = "here" /\ inView = TRUE /\ fanfare = FALSE /\ picker = FALSE
        \* Opening the page from a friend's link is FriendLinkOpens from this first state.
        /\ link = "none" /\ lvl = "other" /\ rode = "other" /\ card = "none"

\* useGameLoop runs while playing; rAF keeps firing in a blurred window and stops only when the tab hides.
Ticking == phase = "playing" /\ win # "hidden"

\* start(): a tap on the road, a lane button, an arrow, Space or শুরু করো. Clears timers and the card.
YouStart == /\ phase = "ready" /\ win = "here"
            /\ phase' = "playing" /\ rode' = lvl /\ fanfare' = FALSE /\ card' = "none"
            /\ UNCHANGED <<win, inView, picker, link, lvl>>
\* stepRun() rolls the road every frame while Ticking (not a separate step here). finish(): a bump. Stars > 0 queue star chimes and sfx.good / sfx.win + confetti in timers.current.
YouBump == /\ Ticking
           /\ phase' = "over" /\ card' = rode
           /\ fanfare' \in {fanfare, TRUE}
           /\ UNCHANGED <<win, inView, picker, link, lvl, rode>>
FanfarePlays == /\ fanfare /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, win, inView, picker, link, lvl, rode, card>>
\* pause(): P, Esc or থামাও.
YouPause == /\ phase = "playing" /\ win = "here"
            /\ phase' = "paused"
            /\ UNCHANGED <<win, inView, fanfare, picker, link, lvl, rode, card>>
\* resume(): চালিয়ে যাও or Space (the road waits 0.6 s).
YouResume == /\ phase = "paused" /\ win = "here"
             /\ phase' = "playing"
             /\ UNCHANGED <<win, inView, fanfare, picker, link, lvl, rode, card>>
\* visibilitychange: pause().
TabHides == /\ win # "hidden"
            /\ win' = "hidden"
            /\ phase' = (IF phase = "playing" THEN "paused" ELSE phase)
            /\ UNCHANGED <<inView, fanfare, picker, link, lvl, rode, card>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<phase, inView, fanfare, picker, link, lvl, rode, card>>
\* No blur or focus listener in the game.
WindowBlurs == /\ win = "here" /\ win' = "away"
               /\ UNCHANGED <<phase, inView, fanfare, picker, link, lvl, rode, card>>
WindowFocuses == /\ win = "away" /\ win' = "here"
                 /\ UNCHANGED <<phase, inView, fanfare, picker, link, lvl, rode, card>>
\* useInView(stage) → pause() when the road scrolls away.
YouScrollAway == /\ inView /\ win = "here"
                 /\ inView' = FALSE
                 /\ phase' = (IF phase = "playing" THEN "paused" ELSE phase)
                 /\ UNCHANGED <<win, fanfare, picker, link, lvl, rode, card>>
YouScrollBack == /\ ~inView /\ win = "here" /\ inView' = TRUE
                 /\ UNCHANGED <<phase, win, fanfare, picker, link, lvl, rode, card>>
\* <details className="pc-levels">: opening it does nothing to the ride.
YouOpenRoutes == /\ ~picker /\ win = "here" /\ picker' = TRUE
                 /\ UNCHANGED <<phase, win, inView, fanfare, link, lvl, rode, card>>
YouCloseRoutes == /\ picker /\ win = "here" /\ picker' = FALSE
                  /\ UNCHANGED <<phase, win, inView, fanfare, link, lvl, rode, card>>
\* pickRoute(): choose(), setResult(null), ready, and scrolls the road into view. It does not clear timers.current.
PickRoute == /\ phase' = "ready" /\ card' = "none" /\ inView' = TRUE
             /\ lvl' = "other"   \* back to the friend's route is the link again (FriendLinkOpens)
             /\ UNCHANGED <<win, fanfare, picker, link, rode>>
\* From the সব রুট list, in any phase.
YouPickRoute == picker /\ win = "here" /\ PickRoute
\* পরের রুট under the bump card (shown after a pass; the model lets it show after any bump).
YouGoNextRoute == phase = "over" /\ win = "here" /\ PickRoute
\* restart(): আবার খেলো / আরেকবার under the bump card, 450 ms after the bump → start(). No scroll.
YouRideAgain == /\ phase = "over" /\ win = "here"
                /\ phase' = "playing" /\ rode' = lvl /\ fanfare' = FALSE /\ card' = "none"
                /\ UNCHANGED <<win, inView, picker, link, lvl>>
\* playFromCard(): আরেকবার খেলো on the result card → ready and scroll the road into view; keeps the card and timers.
YouPlayFromCard == /\ card # "none" /\ phase # "playing" /\ win = "here"
                   /\ phase' = "ready" /\ inView' = TRUE
                   /\ UNCHANGED <<win, fanfare, picker, link, lvl, rode, card>>
\* hashchange → readFriend(): choose(shared.level) in any phase; the phase goes to ready unless playing.
\* Also opening the same link again after picking another route.
FriendLinkOpens == /\ (link = "none" \/ lvl = "other") /\ win = "here"
                   /\ link' = "friend" /\ lvl' = "theirs"
                   /\ phase' = (IF phase = "playing" THEN "playing" ELSE "ready")
                   /\ UNCHANGED <<win, inView, fanfare, picker, rode, card>>

Next == YouStart \/ YouBump \/ FanfarePlays \/ YouPause \/ YouResume \/ TabHides \/ TabShows
        \/ WindowBlurs \/ WindowFocuses \/ YouScrollAway \/ YouScrollBack \/ YouOpenRoutes \/ YouCloseRoutes
        \/ YouPickRoute \/ YouGoNextRoute \/ YouRideAgain \/ YouPlayFromCard \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ win \in {"here", "away", "hidden"} /\ inView \in BOOLEAN
          /\ fanfare \in BOOLEAN /\ picker \in BOOLEAN /\ link \in {"none", "friend"} /\ lvl \in Routes
          /\ rode \in Routes /\ card \in {"none"} \cup Routes

\* The result card's head: `friend ? compareLine(card.score, friend.score) : humanLine(...)`.
CardCompares == link = "friend" /\ card # "none"

\* The reader's rules.
PausedWhenHidden == win = "hidden" => phase # "playing"
PausedWhenBlurred == win = "away" => phase # "playing"
PausedWhenOffScreen == ~inView => phase # "playing"
\* stepRun() rolls the road (meters, cows, a bump) on every frame while Ticking; to keep the model under the chart budget
\* this rule is written on the state rather than with a history variable: the road can roll here while you're away.
NoProgressWhileAway == ~(Ticking /\ win = "away")
ChoiceFreezesPlay == picker => phase # "playing"
NoFanfareAfterMovingOn == fanfare => phase = "over"
RouteMatchesRide == phase \in {"playing", "paused"} => lvl = rode
CompareOnlySameRoad == CardCompares => card = "theirs"
====
