---- MODULE Golokdhadha ----
\* গোলকধাঁধা: the run, pause and focus, the finger on the board, ধীরে খেলো
\* and the result card's keys. Mirrored from tools/golokdhadha/components/maze-game.tsx
\* (go, walkTo, begin, step, finish, the [maze, round] reset effect, the visibilitychange `hide` handler,
\* resume, keyHandler, onPointerDown/Move/Up/Cancel) and shared/game-kit.ts (useGameLoop stops while hidden,
\* useLevels.record keeps the higher stars). The sound has no loops: footsteps, bump and the bell are one-shot tones.
\* Left out to keep the chart under 500 states (both hold in code; see README): the star-chime timeouts, which the
\* [maze, round] effect clears, and the saved stars, which recordLevel only raises (shared/tests/game-kit.test.ts).
VARIABLES phase, walking, window, hand, slow, walkedFast, generous, kind, went
vars == <<phase, walking, window, hand, slow, walkedFast, generous, kind, went>>

\* useGameLoop runs step() while React's phase is "playing" and the tab is visible; blur does not stop it.
Running == phase = "playing" /\ window # "hidden"
\* go()/walkTo()/onPointerDown return while paused or over.
CanSteer == phase \in {"ready", "playing"} /\ window = "focused"

Init == /\ phase = "ready" /\ walking = FALSE /\ window = "focused" /\ hand = "off"
        /\ slow = FALSE /\ walkedFast = FALSE /\ generous = FALSE 
        /\ kind = "level" /\ went = "none"

\* go(dir) with an open lane: queue the run, begin() starts the clock; a run already going just sets `pending`.
Walk == /\ walking' = TRUE
        /\ phase' = "playing"
        /\ walkedFast' = (walkedFast \/ ~slow)
        /\ went' = "none"
\* An arrow key, a pad arrow or a tap on a straight lane.
YouPressArrow == /\ CanSteer /\ Walk
                 /\ UNCHANGED <<window, hand, slow, generous, kind>>
\* onPointerDown: remembers the pointer in `drag`.
YouPutFingerDown == /\ CanSteer /\ hand = "off" /\ hand' = "down"
                    /\ UNCHANGED <<phase, walking, window, slow, walkedFast, generous, kind, went>>
\* onPointerMove past the threshold: go() in the drag's direction.
YouSwipe == /\ CanSteer /\ hand = "down" /\ Walk
            /\ UNCHANGED <<window, hand, slow, generous, kind>>
\* onPointerMove only checks pointerId, never `buttons`, so a plain mouse move steers while `drag` is still set.
MouseDriftsWithNoButton == /\ CanSteer /\ hand = "ghost" /\ Walk
                           /\ UNCHANGED <<window, hand, slow, generous, kind>>
\* onPointerUp on the page clears `drag`.
YouLiftFinger == /\ hand # "off" /\ window = "focused" /\ hand' = "off"
                 /\ UNCHANGED <<phase, walking, window, slow, walkedFast, generous, kind, went>>
\* The button comes up in another window: the page gets no pointerup, and nothing clears `drag` on blur or hide.
YouLetGoElsewhere == /\ hand = "down" /\ window # "focused" /\ hand' = "ghost"
                     /\ UNCHANGED <<phase, walking, window, slow, walkedFast, generous, kind, went>>
\* onPointerCancel (a touch the phone takes over).
BrowserCancelsTouch == /\ hand # "off" /\ hand' = "off"
                       /\ UNCHANGED <<phase, walking, window, slow, walkedFast, generous, kind, went>>

\* step(): the queue empties at a junction (the clock keeps running).
WalkerStopsAtJunction == /\ Running /\ walking /\ walking' = FALSE
                         /\ UNCHANGED <<phase, window, hand, slow, walkedFast, generous, kind, went>>
\* arrive(exit) → finish(): grade against par for the CURRENT speed, record the stars.
WalkerReachesShop == /\ Running /\ walking
                     /\ phase' = "over" /\ walking' = FALSE
                     /\ walkedFast' = (walkedFast \/ ~slow)
                     /\ generous' = (slow /\ walkedFast)
                     /\ UNCHANGED <<window, hand, slow, kind, went>>

WindowBlurs == /\ window = "focused" /\ window' = "blurred"
               /\ UNCHANGED <<phase, walking, hand, slow, walkedFast, generous, kind, went>>
WindowFocuses == /\ window = "blurred" /\ window' = "focused"
                 /\ UNCHANGED <<phase, walking, hand, slow, walkedFast, generous, kind, went>>
\* hide(): pauses only a run that is playing.
TabHides == /\ window # "hidden" /\ window' = "hidden"
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<walking, hand, slow, walkedFast, generous, kind, went>>
TabShows == /\ window = "hidden" /\ window' = "focused"
            /\ UNCHANGED <<phase, walking, hand, slow, walkedFast, generous, kind, went>>
\* resume(): the overlay button or Enter/Space.
YouResume == /\ phase = "paused" /\ window = "focused" /\ phase' = "playing"
             /\ UNCHANGED <<walking, window, hand, slow, walkedFast, generous, kind, went>>

\* The ধীরে খেলো button works in every phase and does not restart the run; `par` follows it at once.
YouToggleSlow == /\ window = "focused" /\ slow' = ~slow
                 /\ UNCHANGED <<phase, walking, window, hand, walkedFast, generous, kind, went>>

\* The [maze, round] effect: clear the timeouts, a fresh walk and clock, phase "ready".
Reset(k, w) == /\ phase' = "ready" /\ walking' = FALSE /\ walkedFast' = FALSE /\ generous' = FALSE
               /\ kind' = k /\ went' = w
               /\ UNCHANGED <<window, hand, slow>>
\* আবার শুরু (disabled while ready) or আবার খেলো.
YouPlayAgain == /\ phase # "ready" /\ window = "focused" /\ Reset(kind, "none")
\* The আজকের ধাঁধা tool button, or a level from the bar or the level list.
YouPickDaily == /\ window = "focused" /\ ~(kind = "daily" /\ phase = "ready") /\ Reset("daily", "none")
YouPickLevel == /\ window = "focused" /\ ~(kind = "level" /\ phase = "ready") /\ Reset("level", "none")
\* The card's gold button: পরের লেভেল on a level, লেভেলে ফেরো on the daily maze.
YouPressCardButton == /\ phase = "over" /\ window = "focused" /\ Reset("level", "asSaid")
\* keyHandler on Enter/Space while over: next level on a level, but `again()` (the same daily maze) on the daily.
YouPressEnterOnCard == /\ phase = "over" /\ window = "focused"
                       /\ IF kind = "level" THEN Reset("level", "asSaid") ELSE Reset("daily", "otherwise")

Next == YouPressArrow \/ YouPutFingerDown \/ YouSwipe \/ MouseDriftsWithNoButton \/ YouLiftFinger
        \/ YouLetGoElsewhere \/ BrowserCancelsTouch \/ WalkerStopsAtJunction \/ WalkerReachesShop
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ YouToggleSlow
        \/ YouPlayAgain \/ YouPickDaily \/ YouPickLevel \/ YouPressCardButton \/ YouPressEnterOnCard

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ walking \in BOOLEAN
          /\ window \in {"focused", "blurred", "hidden"} /\ hand \in {"off", "down", "ghost"}
          /\ slow \in BOOLEAN /\ walkedFast \in BOOLEAN /\ generous \in BOOLEAN
          /\ kind \in {"level", "daily"} /\ went \in {"none", "asSaid", "otherwise"}

\* The reader's rules.
NoProgressWhileAway == Running => window = "focused"
PausedWhenHidden == window = "hidden" => phase # "playing"
PausedWhenBlurred == window = "blurred" => phase # "playing"
InputReleasedWhenAway == window # "focused" => hand = "off"
NoSteeringWithoutAPress == hand # "ghost"
WalkerStillUnlessPlaying == walking => phase \in {"playing", "paused"}
StarsMatchYourSpeed == phase = "over" => ~generous
EnterDoesWhatTheButtonSays == went # "otherwise"
====
