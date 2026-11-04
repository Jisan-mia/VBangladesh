---- MODULE Latim ----
EXTENDS Naturals
\* লাটিম: the throw, the spin, pause and focus, the hand (hold-to-wind or a pull), the hum loop, the level drawer
\* and the cheer timer, mirrored from tools/latim/components/latim-game.tsx (with shared/game-kit.ts useGameLoop and
\* shared/game-sound.ts loop()). The page is not inside the shared game player (tools/latim/page.tsx).
\*
\* phase: "ready" (in the hand), "spin" (spinning, pick not open), "low" (spinning slowly: হাতে তোলো shows),
\*        "settle" (falling or on the palm, the loop draws it down), "over" (the card).
\* hand:  "none", "hold" (Space/Enter or the main button held: hold.current.active), "swipe" (a pull on the canvas in flight).
\* hum:   a real "hum" loop is sounding (startHum() with sound on; a stub when sound is off counts as silent).
VARIABLES phase, paused, visible, focused, hand, hum, sound, drawer, cheer, saves
vars == <<phase, paused, visible, focused, hand, hum, sound, drawer, cheer, saves>>

Spinning == phase \in {"spin", "low"}
\* useGameLoop runs when !paused && (spin || settle || holding). Since 6775639 (Nov 4) it also freezes rAF on window blur
\* and on hide, and restarts on focus / show: the clock stands still while you're away, but the game itself is not paused.
Loop == visible /\ focused /\ ~paused
Here == visible /\ focused          \* key and pointer events reach the page

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ hand = "none"
        /\ hum = FALSE /\ sound = TRUE /\ drawer = FALSE /\ cheer = FALSE /\ saves = 0

\* beginHold(): Space/Enter keydown or pointerdown on the main button, only in the hand.
YouHoldToWind == /\ Here /\ phase = "ready" /\ hand = "none" /\ hand' = "hold"
                 /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, drawer, cheer, saves>>
\* endHold() → throwIt() → startHum(): keyup / pointerup arrive only while the page has focus.
YouLetGoAndThrow == /\ Here /\ hand = "hold" /\ phase = "ready"
                    /\ hand' = "none" /\ phase' = "spin" /\ hum' = sound
                    /\ UNCHANGED <<paused, visible, focused, sound, drawer, cheer, saves>>
\* onDown on the canvas in the hand: a pull starts (swipe.current).
YouStartAPull == /\ Here /\ phase = "ready" /\ hand = "none" /\ hand' = "swipe"
                 /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, drawer, cheer, saves>>
\* onUp: swipeThrow() → throwIt().
YouFlick == /\ Here /\ hand = "swipe" /\ phase = "ready"
            /\ hand' = "none" /\ phase' = "spin" /\ hum' = sound
            /\ UNCHANGED <<paused, visible, focused, sound, drawer, cheer, saves>>
\* The spin slows below PICK_SPIN: canPick() turns true and হাতে তোলো appears.
SpinSlows == /\ Loop /\ phase = "spin" /\ phase' = "low"
             /\ UNCHANGED <<paused, visible, focused, hand, hum, sound, drawer, cheer, saves>>
\* step() → fallen: stopHum(), sceneFall, setView("settle").
TopFalls == /\ Loop /\ Spinning /\ phase' = "settle" /\ hum' = FALSE
            /\ UNCHANGED <<paused, visible, focused, hand, sound, drawer, cheer, saves>>
\* The হাতে তোলো button: rendered whenever pickable && view === "spin", and its onPointerDown calls tryPick()
\* with no paused check (the ↑/H key does check !paused).
YouPickItUp == /\ Here /\ phase = "low" /\ phase' = "settle" /\ hum' = FALSE
               /\ UNCHANGED <<paused, visible, focused, hand, sound, drawer, cheer, saves>>
\* The loop: isOver && view === "settle" && sceneSettled → finish() (once: done.current), which queues the cheer.
TopComesToRest == /\ Loop /\ phase = "settle"
                  /\ phase' = "over" /\ cheer' = TRUE /\ saves' = saves + 1
                  /\ UNCHANGED <<paused, visible, focused, hand, hum, sound, drawer>>
\* later(after, sfx.win + confetti): fires on whatever is on screen then.
CheerFires == /\ cheer /\ cheer' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, hand, hum, sound, drawer, saves>>
\* P / Esc / থামাও (only while spinning); the [paused] effect stops the hum.
YouPause == /\ Here /\ Spinning /\ ~paused /\ paused' = TRUE /\ hum' = FALSE
            /\ UNCHANGED <<phase, visible, focused, hand, sound, drawer, cheer, saves>>
\* চালিয়ে যাও, Space, a tap: the [paused] effect startHum()s if game.phase is still "spin".
YouResume == /\ Here /\ paused /\ paused' = FALSE /\ hum' = (Spinning /\ sound)
             /\ UNCHANGED <<phase, visible, focused, hand, sound, drawer, cheer, saves>>
\* The game has no blur or focus listener; only useGameLoop's freezes the clock.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, hand, hum, sound, drawer, cheer, saves>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, hand, hum, sound, drawer, cheer, saves>>
\* onVisibility: release the hold (not the pull), pause while spinning; the [paused] effect stops the hum.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ hand' = IF hand = "hold" THEN "none" ELSE hand
            /\ paused' = (paused \/ Spinning)
            /\ hum' = IF Spinning THEN FALSE ELSE hum
            /\ UNCHANGED <<phase, sound, drawer, cheer, saves>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, hand, hum, sound, drawer, cheer, saves>>
\* onPointerCancel on the canvas.
PullCancelled == /\ hand = "swipe" /\ hand' = "none"
                 /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, drawer, cheer, saves>>
\* SoundToggle: off → stopLoops(); on → startHum() if game.phase === "spin" && !paused.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, hand, drawer, cheer, saves>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE /\ hum' = (hum \/ (Spinning /\ ~paused))
           /\ UNCHANGED <<phase, paused, visible, focused, hand, drawer, cheer, saves>>
\* <details> সব লেভেল আর পদক: opening it does nothing to the round.
YouOpenLevels == /\ Here /\ ~drawer /\ drawer' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, focused, hand, hum, sound, cheer, saves>>
YouCloseLevels == /\ Here /\ drawer /\ drawer' = FALSE
                  /\ UNCHANGED <<phase, paused, visible, focused, hand, hum, sound, cheer, saves>>
\* start(): stopHum, clear timers (the cheer too), fresh game in the hand. From the drawer, পরের লেভেল or আবার খেলো.
Fresh == /\ phase' = "ready" /\ paused' = FALSE /\ hand' = "none" /\ hum' = FALSE /\ cheer' = FALSE /\ saves' = 0
         /\ UNCHANGED <<visible, focused, sound, drawer>>
YouPickALevel == /\ Here /\ drawer /\ Fresh
YouPlayAgain == /\ Here /\ phase = "over" /\ Fresh

Next == YouHoldToWind \/ YouLetGoAndThrow \/ YouStartAPull \/ YouFlick \/ SpinSlows \/ TopFalls \/ YouPickItUp
        \/ TopComesToRest \/ CheerFires \/ YouPause \/ YouResume \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ PullCancelled \/ SoundOff \/ SoundOn \/ YouOpenLevels \/ YouCloseLevels \/ YouPickALevel \/ YouPlayAgain

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "spin", "low", "settle", "over"} /\ paused \in BOOLEAN /\ visible \in BOOLEAN
          /\ focused \in BOOLEAN /\ hand \in {"none", "hold", "swipe"} /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ drawer \in BOOLEAN /\ cheer \in BOOLEAN /\ saves \in 0..2

\* The reader's rules.
PausedWhenHidden == (~visible /\ Spinning) => paused
PausedWhenBlurred == (~focused /\ Spinning) => paused
InputReleasedWhenAway == ~(visible /\ focused) => hand = "none"
HumOnlyWhileSpinning == hum => (Spinning /\ ~paused /\ visible /\ focused /\ sound)
HumComesBack == (Spinning /\ ~paused /\ visible /\ sound) => hum
NothingMovesWhilePaused == paused => Spinning
LevelPickerFreezesPlay == (drawer /\ Spinning) => paused
NoDoubleResult == saves <= 1
CheerOnlyOnTheCard == cheer => phase = "over"
\* The clock (spin, fall, coming to rest) only moves while you're on the page.
Clock == SpinSlows \/ TopFalls \/ TopComesToRest
NoProgressWhileAway == [][Clock => (visible /\ focused)]_vars
====
