---- MODULE Handi ----
\* হাঁড়িভাঙা: the round and the ball, pause, window focus, scrolling the stall away, the held ← → keys, the finger
\* drag on the stall, the সব লেভেল list, পরের লেভেল / আবার খেলো and the celebration timer,
\* mirrored from tools/handi-bhanga/components/handi-game.tsx. No sound loop: every sound is a one-shot.
VARIABLES phase, win, inView, ball, keys, drag, droppedAway, fanfare, picker
vars == <<phase, win, inView, ball, keys, drag, droppedAway, fanfare, picker>>

Phases == {"ready", "playing", "paused", "over"}

Init == /\ phase = "ready" /\ win = "here" /\ inView = TRUE /\ ball = "resting" /\ keys = FALSE /\ drag = FALSE
        /\ droppedAway = FALSE /\ fanfare = FALSE /\ picker = FALSE

\* tick() moves the ball while playing; rAF keeps firing in a blurred window and stops only when the tab hides.
Ticking == phase = "playing" /\ win # "hidden"

\* throwBall() from the ready screen: শুরু করো, a still tap on the stall or on the "চাপো" pad under it, or Space.
\* The pad sits below the board, so it can be tapped while the board itself is scrolled out of view.
YouStart == /\ phase = "ready" /\ win = "here"
            /\ phase' = "playing" /\ ball' = "flying"
            /\ UNCHANGED <<win, inView, keys, drag, droppedAway, fanfare, picker>>
\* throwBall() mid-round: a resting ball goes up again.
YouThrow == /\ phase = "playing" /\ ball = "resting" /\ win = "here"
            /\ ball' = "flying"
            /\ UNCHANGED <<phase, win, inView, keys, drag, droppedAway, fanfare, picker>>
\* onEvent("lost") with chances left: the ball rests on the stick. Records whether it fell while another window had focus.
BallFalls == /\ Ticking /\ ball = "flying"
             /\ ball' = "resting"
             /\ droppedAway' = (droppedAway \/ win = "away")
             /\ UNCHANGED <<phase, win, inView, keys, drag, fanfare, picker>>
\* finish(): the last chance falls or the stall is cleared. Stars > 0 queue sfx.good / levelUp+confetti in timers.current.
RoundEnds == /\ Ticking /\ ball = "flying"
             /\ phase' = "over" /\ ball' = "resting"
             /\ fanfare' \in {fanfare, TRUE}
             /\ droppedAway' = (droppedAway \/ win = "away")
             /\ UNCHANGED <<win, inView, keys, drag, picker>>
FanfarePlays == /\ fanfare /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, win, inView, ball, keys, drag, droppedAway, picker>>
\* pause(): P, Esc or the ⏸ button. Clears only the ◀ ▶ button hold.
YouPause == /\ phase = "playing" /\ win = "here"
            /\ phase' = "paused"
            /\ UNCHANGED <<win, inView, ball, keys, drag, droppedAway, fanfare, picker>>
\* resume(): চালিয়ে যাও, P, Space.
YouResume == /\ phase = "paused" /\ win = "here" /\ inView
             /\ phase' = "playing"
             /\ UNCHANGED <<win, inView, ball, keys, drag, droppedAway, fanfare, picker>>
\* keydown ← → sets held.left/right in any phase; keyup reaches the page only while it has focus.
YouHoldArrow == /\ ~keys /\ win = "here" /\ keys' = TRUE
                /\ UNCHANGED <<phase, win, inView, ball, drag, droppedAway, fanfare, picker>>
YouLetGoArrow == /\ keys /\ win = "here" /\ keys' = FALSE
                 /\ UNCHANGED <<phase, win, inView, ball, drag, droppedAway, fanfare, picker>>
\* onPointerDown on the stall: gesture.id is set while ready or playing; pointerup / pointercancel clear it.
YouPressStall == /\ ~drag /\ win = "here" /\ phase \in {"ready", "playing"}
                 /\ drag' = TRUE
                 /\ UNCHANGED <<phase, win, inView, ball, keys, droppedAway, fanfare, picker>>
YouLiftFinger == /\ drag /\ win = "here" /\ drag' = FALSE
                 /\ UNCHANGED <<phase, win, inView, ball, keys, droppedAway, fanfare, picker>>
\* visibilitychange: letGo() (keys and the ◀ ▶ hold, not the drag) and pause().
TabHides == /\ win # "hidden"
            /\ win' = "hidden" /\ keys' = FALSE
            /\ phase' = (IF phase = "playing" THEN "paused" ELSE phase)
            /\ UNCHANGED <<inView, ball, drag, droppedAway, fanfare, picker>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<phase, inView, ball, keys, drag, droppedAway, fanfare, picker>>
\* window blur: letGo() only. No pause, and the drag gesture stays.
WindowBlurs == /\ win = "here" /\ win' = "away" /\ keys' = FALSE
               /\ UNCHANGED <<phase, inView, ball, drag, droppedAway, fanfare, picker>>
WindowFocuses == /\ win = "away" /\ win' = "here"
                 /\ UNCHANGED <<phase, inView, ball, keys, drag, droppedAway, fanfare, picker>>
\* useInView(board) → pause() when the stall scrolls away.
YouScrollAway == /\ inView /\ win = "here"
                 /\ inView' = FALSE
                 /\ phase' = (IF phase = "playing" THEN "paused" ELSE phase)
                 /\ UNCHANGED <<win, ball, keys, drag, droppedAway, fanfare, picker>>
YouScrollBack == /\ ~inView /\ win = "here" /\ inView' = TRUE
                 /\ UNCHANGED <<phase, win, ball, keys, drag, droppedAway, fanfare, picker>>
\* <details className="hb-levels">: opening it does nothing to the game.
YouOpenLevels == /\ ~picker /\ win = "here" /\ picker' = TRUE
                 /\ UNCHANGED <<phase, win, inView, ball, keys, drag, droppedAway, fanfare>>
YouCloseLevels == /\ picker /\ win = "here" /\ picker' = FALSE
                  /\ UNCHANGED <<phase, win, inView, ball, keys, drag, droppedAway, fanfare>>
\* pick() and পরের লেভেল: reset() clears timers, the new stall waits on the ready screen.
YouPickLevel == /\ win = "here" /\ (picker \/ phase = "over")
                /\ phase' = "ready" /\ ball' = "resting" /\ fanfare' = FALSE
                /\ UNCHANGED <<win, inView, keys, drag, droppedAway, picker>>
\* restart(): আবার খেলো (after the 700 ms guard) resets, which clears timers, and plays at once.
YouPlayAgain == /\ phase = "over" /\ win = "here"
                /\ phase' = "playing" /\ ball' = "resting" /\ fanfare' = FALSE
                /\ UNCHANGED <<win, inView, keys, drag, droppedAway, picker>>

Next == YouStart \/ YouThrow \/ BallFalls \/ RoundEnds \/ FanfarePlays \/ YouPause \/ YouResume
        \/ YouHoldArrow \/ YouLetGoArrow \/ YouPressStall \/ YouLiftFinger \/ TabHides \/ TabShows
        \/ WindowBlurs \/ WindowFocuses \/ YouScrollAway \/ YouScrollBack \/ YouOpenLevels \/ YouCloseLevels
        \/ YouPickLevel \/ YouPlayAgain

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ win \in {"here", "away", "hidden"} /\ inView \in BOOLEAN /\ ball \in {"resting", "flying"}
          /\ keys \in BOOLEAN /\ drag \in BOOLEAN /\ droppedAway \in BOOLEAN /\ fanfare \in BOOLEAN /\ picker \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == win = "hidden" => phase # "playing"
PausedWhenBlurred == win = "away" => phase # "playing"
PausedWhenOffScreen == ~inView => phase # "playing"
NoProgressWhileAway == ~droppedAway
InputReleasedWhenAway == win # "here" => (~keys /\ ~drag)
ChoiceFreezesPlay == picker => phase # "playing"
NoFanfareAfterMovingOn == fanfare => phase = "over"
====
