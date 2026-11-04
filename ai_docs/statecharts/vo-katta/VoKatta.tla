---- MODULE VoKatta ----
\* ভো-কাট্টা as it is today: the evening's phase, the rounds, the window, the board on screen, your hand
\* (টান, the arrow keys, a drag), the wind/hum loops, the site-wide sound switch, the fanfare timer and saved stars.
\* Mirrored from tools/vo-katta/components/vo-katta-game.tsx (start, pause, resume, restart, pick, finish, the
\* blur/visibilitychange/boardInView effects, keyHandler, onBoardDown, onPullDown, SoundToggle onChange) and
\* tools/vo-katta/lib/game.ts (step → endRound/startRound). useGameLoop (shared/game-kit.ts) steps only while the
\* tab is visible; loop()/setSoundOn live in shared/game-sound.ts. Three rounds are abstracted to two.
EXTENDS Naturals
VARIABLES phase, stage, visible, focused, inView, held, wind, sound, results, fanfare, saved
vars == <<phase, stage, visible, focused, inView, held, wind, sound, results, fanfare, saved>>

Phases == {"ready", "playing", "paused", "over"}
Stages == {"r1", "break", "r2"}
\* useGameLoop runs tick() while phase is "playing"; the rAF loop itself stops when the tab hides.
Running == phase = "playing" /\ visible
Max(a, b) == IF a > b THEN a ELSE b

Init == /\ phase = "ready" /\ stage = "r1"
        /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ held = FALSE /\ wind = FALSE /\ sound \in BOOLEAN
        /\ results = 0 /\ fanfare = FALSE /\ saved = 0

\* start(): the শুরু করো button sits inside the board overlay, so the board is on screen. go("playing") → startLoops().
YouStart == /\ phase = "ready" /\ visible /\ focused /\ inView
            /\ phase' = "playing" /\ wind' = sound
            /\ UNCHANGED <<stage, visible, focused, inView, held, sound, results, fanfare, saved>>
\* টান (pointer or Space), an arrow key, or a drag on the sky: onPullDown/onBoardDown/keyHandler, all of which call start().
\* Keys need boardInView; the board and the টান button are on screen when you touch them.
YouHold == /\ phase \in {"ready", "playing"} /\ visible /\ focused /\ inView /\ ~held
           /\ held' = TRUE
           /\ phase' = "playing"
           /\ wind' = IF phase = "ready" THEN sound ELSE wind
           /\ UNCHANGED <<stage, visible, focused, inView, sound, results, fanfare, saved>>
\* onPullUp / keyup / pointerup: only arrive while the page has focus.
YouLetGo == /\ held /\ focused
            /\ held' = FALSE
            /\ UNCHANGED <<phase, stage, visible, focused, inView, wind, sound, results, fanfare, saved>>
\* window "blur" → letGo() only. No pause.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE
               /\ UNCHANGED <<phase, stage, visible, inView, wind, sound, results, fanfare, saved>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ UNCHANGED <<phase, stage, visible, inView, held, wind, sound, results, fanfare, saved>>
\* visibilitychange → hidden: pause() (only from "playing"): letGo(), go("paused") → stopLoops().
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ held' = IF phase = "playing" THEN FALSE ELSE held
            /\ wind' = IF phase = "playing" THEN FALSE ELSE wind
            /\ UNCHANGED <<stage, inView, sound, results, fanfare, saved>>
TabShows == /\ ~visible
             /\ visible' = TRUE /\ focused' = TRUE
             /\ UNCHANGED <<phase, stage, inView, held, wind, sound, results, fanfare, saved>>
\* useEffect([boardInView]): scrolling the sky away pauses (only on the change to false).
ScrollAway == /\ visible /\ inView
              /\ inView' = FALSE
              /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
              /\ held' = IF phase = "playing" THEN FALSE ELSE held
              /\ wind' = IF phase = "playing" THEN FALSE ELSE wind
              /\ UNCHANGED <<stage, visible, focused, sound, results, fanfare, saved>>
ScrollBack == /\ visible /\ ~inView
              /\ inView' = TRUE
              /\ UNCHANGED <<phase, stage, visible, focused, held, wind, sound, results, fanfare, saved>>
\* pause(): the HUD button (outside the board, so it needs no boardInView), or P/Esc with the board on screen.
YouPause == /\ phase = "playing" /\ visible /\ focused
            /\ phase' = "paused" /\ held' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<stage, visible, focused, inView, sound, results, fanfare, saved>>
\* resume(): the HUD button works with the board off screen; P/Space/the overlay button need it on screen.
YouResume == /\ phase = "paused" /\ visible /\ focused
             /\ phase' = "playing" /\ wind' = sound
             /\ UNCHANGED <<stage, visible, focused, inView, held, sound, results, fanfare, saved>>
\* step() → endRound(): round 1's clock runs out (a প্যাঁচ in flight gets overtime) → the break between roofs.
RoundEnds == /\ Running /\ stage = "r1"
             /\ stage' = "break"
             /\ UNCHANGED <<phase, visible, focused, inView, held, wind, sound, results, fanfare, saved>>
\* step() → startRound(): the next roof's first kite rises.
NextRoofStarts == /\ Running /\ stage = "break"
                  /\ stage' = "r2"
                  /\ UNCHANGED <<phase, visible, focused, inView, held, wind, sound, results, fanfare, saved>>
\* endRound() on the last round → "over" → finish(): go("over") stops the loops, letGo(), levels.record(stars) when
\* stars > 0, a fanfare timer when there are stars.
LastRoundEnds == /\ Running /\ stage = "r2"
                 /\ \E earned \in 0..2 :
                      /\ saved' = IF earned > 0 THEN Max(saved, earned) ELSE saved
                      /\ fanfare' = (earned > 0)
                 /\ phase' = "over" /\ held' = FALSE /\ wind' = FALSE
                 /\ results' = results + 1
                 /\ UNCHANGED <<stage, visible, focused, inView, sound>>
\* timers.current: sfx.levelUp()+confetti() or sfx.good after the stars chime.
FanfareFires == /\ fanfare
                /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, stage, visible, focused, inView, held, wind, sound, results, saved>>
\* SoundToggle: off → setSoundOn(false) stops every loop. On → onChange starts the loops if playing.
SoundOff == /\ sound /\ visible /\ focused
            /\ sound' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<phase, stage, visible, focused, inView, held, results, fanfare, saved>>
SoundOn == /\ ~sound /\ visible /\ focused
           /\ sound' = TRUE /\ wind' = (phase = "playing")
           /\ UNCHANGED <<phase, stage, visible, focused, inView, held, results, fanfare, saved>>
\* restart(): আবার খেলো / আরেকবার (below the board) or Space on the board → reset() clears timers, go("playing").
PlayAgain == /\ phase = "over" /\ visible /\ focused
             /\ phase' = "playing" /\ stage' = "r1" /\ held' = FALSE /\ wind' = sound
             /\ results' = 0 /\ fanfare' = FALSE
             /\ UNCHANGED <<visible, focused, inView, sound, saved>>
\* pick(level) from সব লেভেল or পরের লেভেল, playFromCard(), or a friend's link (hashchange): reset() + go("ready").
\* The level grid works in any phase, also mid-round.
YouPickALevel == /\ visible /\ focused
                 /\ phase' = "ready" /\ stage' = "r1" /\ held' = FALSE /\ wind' = FALSE
                 /\ results' = 0 /\ fanfare' = FALSE
                 /\ UNCHANGED <<visible, focused, inView, sound, saved>>

Next == YouStart \/ YouHold \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ ScrollAway \/ ScrollBack \/ YouPause \/ YouResume \/ RoundEnds \/ NextRoofStarts \/ LastRoundEnds
        \/ FanfareFires \/ SoundOff \/ SoundOn \/ PlayAgain \/ YouPickALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ stage \in Stages
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ held \in BOOLEAN /\ wind \in BOOLEAN /\ sound \in BOOLEAN
          /\ results \in 0..2 /\ fanfare \in BOOLEAN /\ saved \in 0..2

\* The reader's rules.
InputReleasedWhenAway == ~focused => ~held
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == (visible /\ ~focused) => phase # "playing"
\* The round clock, the rivals and the wind only move while you can see the sky and the page has focus.
NoProgressWhileAway == Running => (focused /\ inView)
\* Game rule: "scrolling the sky away mid-game pauses it" (the code's own comment) holds however you get back to playing.
OffScreenMeansPaused == phase = "playing" => inView
LoopOnlyWhenMeaningful == wind => (Running /\ sound)
LoopComesBack == (phase = "playing" /\ sound) => wind
NoDoubleResult == results <= 1
NoFanfareAfterMovingOn == fanfare => phase = "over"
StarsNeverDrop == [][saved' >= saved]_vars
====
