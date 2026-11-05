---- MODULE Handi ----
\* হাঁড়িভাঙা after the rewrite: the screens (title, story, play, end), the player's pause menu, the level list, window focus,
\* the stall scrolling away, the held ← → keys, the throw key, the finger or mouse on the stall, the breath after waking up,
\* the wind loop, the sound switch and the star chimes. Mirrors tools/handi-bhanga/lib/session.ts (every rule the session
\* decides) and components/stall.tsx (the handlers that call it, and sync() after each). The ball's flight is one step:
\* resting or flying, falling or ending the round.
CONSTANT Windy
VARIABLES screen, paused, sheet, win, inView, ball, keys, finger, thrw, wake, sound, loopOn, fanfare, slipped, skipped
vars == <<screen, paused, sheet, win, inView, ball, keys, finger, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>

Screens == {"title", "play", "over"}

\* session.ticking: the stall steps only on the play screen, menu and list shut, the tab showing, the window focused, the stall on screen.
Ticking == screen = "play" /\ ~paused /\ ~sheet /\ win = "here" /\ inView
\* session.canAct: a tap or key acts only when the stall steps and it isn't the wake-up after a pause.
CanAct == Ticking /\ ~wake
\* session.wantWind: the wind loop plays through a windy stall while it steps with sound on.
WantWind == Ticking /\ Windy /\ sound

Init == /\ screen = "title" /\ paused = FALSE /\ sheet = FALSE /\ win = "here" /\ inView = TRUE /\ ball = "resting"
        /\ keys = "up" /\ finger = "up" /\ thrw = "up" /\ wake = FALSE /\ sound = TRUE /\ loopOn = FALSE
        /\ fanfare = FALSE /\ slipped = FALSE /\ skipped = FALSE

\* begin(): a fresh round. (A held throw key keeps its state: a new screen never counts a press from before.) The list closes (closeSheet starts the wake-up breath), the cheer stops, the ball rests, the loop follows.
Begin == /\ screen' = "play" /\ ball' = "resting" /\ sheet' = FALSE /\ wake' = TRUE /\ fanfare' = FALSE
         /\ keys' = "up" /\ finger' = "up"
         /\ loopOn' = (screen' = "play" /\ ~paused /\ ~sheet' /\ win = "here" /\ inView /\ Windy /\ sound)

\* The খেলো pot on the title screen begins a round (the first run's story only comes before it).
YouTapTitlePot == /\ screen = "title" /\ win = "here" /\ ~sheet
                  /\ Begin /\ UNCHANGED <<thrw, paused, win, inView, sound, slipped, skipped>>

\* pointerdown on the stall: it takes hold (aiming a resting ball, or moving the লাঠি) only when the stall steps and isn't waking up.
YouPressStall == /\ finger = "up" /\ win = "here" /\ screen = "play"
                 /\ finger' = (IF CanAct THEN (IF ball = "resting" THEN "aim" ELSE "move") ELSE "up")
                 /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>
\* pointerup: an aim throws (only while the stall steps); a drag just lets go.
YouLiftFinger == /\ finger # "up" /\ win = "here"
                 /\ finger' = "up"
                 /\ ball' = (IF finger = "aim" /\ Ticking /\ ball = "resting" THEN "flying" ELSE ball)
                 /\ UNCHANGED <<screen, paused, sheet, win, inView, keys, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>
\* pointermove with a mouse that has no button down: the drag is over (the lost pointerup).
MouseMovesWithNoButton == /\ finger # "up" /\ finger' = "up"
                          /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>
\* ← → down: counts only while the stall steps.
YouHoldArrow == /\ keys = "up" /\ win = "here" /\ keys' = (IF Ticking THEN "held" ELSE "up")
                /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, finger, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>
YouLetGoArrow == /\ keys = "held" /\ win = "here" /\ keys' = "up"
                 /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, finger, thrw, wake, sound, loopOn, fanfare, slipped, skipped>>
\* Space, Enter or ↑ down: a fresh press throws a resting ball while the stall steps and isn't waking up.
YouPressThrowKey == /\ thrw = "up" /\ win = "here" /\ thrw' = "down"
                    /\ ball' = (IF CanAct /\ screen = "play" /\ ball = "resting" THEN "flying" ELSE ball)
                    /\ UNCHANGED <<screen, paused, sheet, win, inView, keys, finger, wake, sound, loopOn, fanfare, slipped, skipped>>
YouLetGoThrowKey == /\ thrw # "up" /\ win = "here" /\ thrw' = "up"
                    /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, finger, wake, sound, loopOn, fanfare, slipped, skipped>>

\* stepGame: a flying ball falls out and a ball in hand rests on the লাঠি. Only while the stall steps.
BallFalls == /\ Ticking /\ ball = "flying"
             /\ ball' = "resting"
             /\ slipped' = (slipped \/ win # "here" \/ ~inView \/ paused \/ sheet)
             /\ UNCHANGED <<screen, paused, sheet, win, inView, keys, finger, thrw, wake, sound, loopOn, fanfare, skipped>>
\* E_OVER → finish(): the last pot or the last ball. Stars queue scheduled chimes. Every key and finger lets go; a throw key
\* still held through the end is stale until it is released, so it can't skip the result.
RoundEnds == /\ Ticking /\ ball = "flying"
             /\ screen' = "over" /\ ball' = "resting"
             /\ fanfare' \in (IF sound THEN {fanfare, TRUE} ELSE {fanfare})
             /\ keys' = "up" /\ finger' = "up" /\ thrw' = (IF thrw = "down" THEN "stale" ELSE thrw)
             /\ loopOn' = FALSE
             /\ slipped' = (slipped \/ win # "here" \/ ~inView \/ paused \/ sheet)
             /\ UNCHANGED <<paused, sheet, win, inView, wake, sound, skipped>>
FanfarePlays == /\ fanfare /\ fanfare' = FALSE
                /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, finger, thrw, wake, sound, loopOn, slipped, skipped>>
\* The wake-up breath ends (250 ms).
WakeEnds == /\ wake /\ wake' = FALSE
            /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, finger, thrw, sound, loopOn, fanfare, slipped, skipped>>

\* The player's menu opens (⏸, P, Esc, a blur or hide it noticed): session.pause releases everything, silenceScheduled cuts the chimes, sync stops the loop.
YouPause == /\ ~paused /\ win = "here"
            /\ paused' = TRUE /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up" /\ fanfare' = FALSE
            /\ loopOn' = FALSE
            /\ UNCHANGED <<screen, sheet, win, inView, ball, wake, sound, slipped, skipped>>
\* চালিয়ে যাও: fresh hands and a breath before a tap counts; the loop comes back with sync.
YouResume == /\ paused /\ win = "here"
             /\ paused' = FALSE /\ wake' = TRUE /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up"
             /\ loopOn' = (screen = "play" /\ ~sheet /\ inView /\ Windy /\ sound)
             /\ UNCHANGED <<screen, sheet, win, inView, ball, sound, fanfare, slipped, skipped>>

\* window blur or the tab hiding (visibilitychange), and coming back: release everything; sync follows each. Coming back starts the breath.
WindowBlurs == /\ win = "here" /\ win' = "away"
               /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up" /\ paused' \in {paused, TRUE} /\ fanfare' = (IF paused' # paused THEN FALSE ELSE fanfare)
               /\ loopOn' = FALSE
               /\ UNCHANGED <<screen, sheet, inView, ball, wake, sound, slipped, skipped>>
WindowFocuses == /\ win = "away" /\ win' = "here" /\ wake' = TRUE
                 /\ loopOn' = (screen = "play" /\ ~paused /\ ~sheet /\ inView /\ Windy /\ sound)
                 /\ UNCHANGED <<screen, paused, sheet, inView, ball, keys, finger, thrw, sound, fanfare, slipped, skipped>>

\* useInView(stall) → setInView: leaving releases everything and stops the step; the loop follows.
YouScrollAway == /\ inView /\ win = "here" /\ inView' = FALSE
                 /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up" /\ loopOn' = FALSE
                 /\ UNCHANGED <<screen, paused, sheet, win, ball, wake, sound, fanfare, slipped, skipped>>
YouScrollBack == /\ ~inView /\ win = "here" /\ inView' = TRUE
                 /\ loopOn' = (screen = "play" /\ ~paused /\ ~sheet /\ Windy /\ sound)
                 /\ UNCHANGED <<screen, paused, sheet, win, ball, keys, finger, thrw, wake, sound, fanfare, slipped, skipped>>

\* The level list is a choice screen: opening it releases everything and the stall waits; closing it starts the breath.
YouOpenLevels == /\ ~sheet /\ ~paused /\ win = "here"
                 /\ sheet' = TRUE /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up" /\ fanfare' = FALSE /\ loopOn' = FALSE
                 /\ UNCHANGED <<screen, paused, win, inView, ball, wake, sound, slipped, skipped>>
YouCloseLevels == /\ sheet /\ win = "here"
                  /\ sheet' = FALSE /\ wake' = TRUE /\ keys' = "up" /\ finger' = "up" /\ thrw' = "up"
                  /\ loopOn' = (screen = "play" /\ ~paused /\ inView /\ Windy /\ sound)
                  /\ UNCHANGED <<screen, paused, win, inView, ball, sound, fanfare, slipped, skipped>>
\* pickLevel (the list, or পরের লেভেল / আবার খেলো by click): begin().
YouPickLevel == /\ win = "here" /\ ~paused /\ (sheet \/ screen = "over")
                /\ Begin /\ UNCHANGED thrw
                /\ UNCHANGED <<paused, win, inView, sound, slipped, skipped>>
\* An end-screen key (1–3, Enter, R): only a fresh, non-repeating press that arrived after the screen appeared.
YouPressResultKey == /\ screen = "over" /\ ~paused /\ ~sheet /\ win = "here" /\ thrw = "up"
                     /\ Begin /\ thrw' = "down"
                     /\ UNCHANGED <<paused, win, inView, sound, slipped, skipped>>

\* The site-wide sound switch: off already stopped every loop in the kit; on makes sync bring the loop back.
YouTurnSoundOff == /\ sound /\ sound' = FALSE /\ loopOn' = FALSE /\ fanfare' = FALSE
                   /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, finger, thrw, wake, slipped, skipped>>
YouTurnSoundOn == /\ ~sound /\ sound' = TRUE /\ loopOn' = (Ticking /\ Windy)
                  /\ UNCHANGED <<screen, paused, sheet, win, inView, ball, keys, finger, thrw, wake, fanfare, slipped, skipped>>

Next == YouTapTitlePot \/ YouPressStall \/ YouLiftFinger \/ MouseMovesWithNoButton
        \/ YouHoldArrow \/ YouLetGoArrow \/ YouPressThrowKey \/ YouLetGoThrowKey \/ BallFalls \/ RoundEnds \/ FanfarePlays \/ WakeEnds
        \/ YouPause \/ YouResume \/ WindowBlurs \/ WindowFocuses \/ YouScrollAway \/ YouScrollBack
        \/ YouOpenLevels \/ YouCloseLevels \/ YouPickLevel \/ YouPressResultKey \/ YouTurnSoundOff \/ YouTurnSoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ paused \in BOOLEAN /\ sheet \in BOOLEAN /\ win \in {"here", "away"} /\ inView \in BOOLEAN
          /\ ball \in {"resting", "flying"} /\ keys \in {"up", "held"} /\ finger \in {"up", "aim", "move"} /\ thrw \in {"up", "down", "stale"}
          /\ wake \in BOOLEAN /\ sound \in BOOLEAN /\ loopOn \in BOOLEAN /\ fanfare \in BOOLEAN
          /\ slipped \in BOOLEAN /\ skipped \in BOOLEAN

\* The reader's rules.
\* Hiding the tab is blur plus a hidden flag in session.ts (hide = blur + visible false), so one "away" covers both.
PausedWhenHiddenOrBlurred == win = "away" => ~Ticking
PausedWhenOffScreen == ~inView => ~Ticking
NoProgressWhileAway == ~slipped
InputReleasedWhenAway == (win # "here" \/ paused \/ sheet \/ ~inView \/ screen # "play") => (keys = "up" /\ finger = "up")
ChoiceFreezesPlay == (sheet \/ paused) => ~Ticking
LoopOnlyWhenMeaningful == loopOn => (Ticking /\ Windy /\ sound)
LoopComesBack == WantWind => loopOn
NoFanfareAfterMovingOn == fanfare => (screen = "over" /\ ~paused /\ sound)
WakeOnlyWakes == wake => (finger = "up" \/ ~CanAct)
ResultKeyNeedsFreshPress == screen = "over" => (thrw # "stale" \/ ~skipped)
====
