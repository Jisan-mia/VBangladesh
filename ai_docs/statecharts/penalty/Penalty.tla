---- MODULE Penalty ----
EXTENDS Naturals
\* পেনাল্টি কিক: one kick each (the match), the opponent's run-up and the crowd murmur, pause on hide, focus, your swipe,
\* the match list, and how many times the match is finished, mirrored from tools/penalty/components/penalty-game.tsx
\* (with tools/penalty/lib/sound.ts murmur(), shared/game-kit.ts useGameLoop and shared/game-sound.ts loop()).
\* The page is not inside the shared game player (tools/penalty/page.tsx).
\*
\* stage:  live.stage: "aim" (your kick) → "fly" → "after" → "ready" (their whistle) → "run" (run-up) → "fly" → "after".
\* kicks:  kicks taken (0..2). Two kicks stand for the whole shoot-out: after the second, decided() is true.
\* shown:  React's phase: "play" until a render after finish() shows the card ("over"). The loop runs while shown = "play":
\*         useGameLoop calls tick() several times in one frame (while carry >= STEP), all before React re-renders.
\* hum:    live.hum: "none", "real" (a murmur with sound on), or "stub" (murmur() made while sound was off: a silent stub
\*         that `live.hum ??= murmur()` then keeps).
\* finishes: how many times finish() ran for this match (records stars, whistle, win sound, confetti).
\* key:    Space is held down and its auto-repeat reaches the page (a blur or hide ends the stream).
VARIABLES stage, kicks, shown, paused, visible, focused, pointer, hum, sound, drawer, finishes, key
vars == <<stage, kicks, shown, paused, visible, focused, pointer, hum, sound, drawer, finishes, key>>

Here == visible /\ focused
\* looping = !paused && phase === "play" && boardInView. Since 6775639 (Nov 4) useGameLoop also freezes rAF on window blur
\* and on hide, and restarts on focus / show. tick() returns early while live.paused.
Loop == visible /\ focused /\ ~paused /\ shown = "play"
RunUp == stage \in {"ready", "run"}
Fresh(h) == IF h = "none" THEN (IF sound THEN "real" ELSE "stub") ELSE h

Init == /\ stage = "aim" /\ kicks = 0 /\ shown = "play" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ pointer = FALSE /\ hum = "none" /\ sound = TRUE /\ drawer = FALSE /\ finishes = 0 /\ key = FALSE

\* onPointerDown on the board (refused while paused or after the match).
YouTouchTheBoard == /\ Here /\ shown = "play" /\ ~paused /\ ~pointer /\ stage = "aim" /\ pointer' = TRUE
                    /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, hum, sound, drawer, finishes, key>>
\* onPointerUp → swipeShot → shoot(): the ball flies.
YouSwipeAndShoot == /\ Here /\ pointer /\ stage = "aim" /\ ~paused
                    /\ pointer' = FALSE /\ stage' = "fly"
                    /\ UNCHANGED <<kicks, shown, paused, visible, focused, hum, sound, drawer, finishes, key>>
YouLiftWithoutAShot == /\ Here /\ pointer /\ pointer' = FALSE
                       /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, hum, sound, drawer, finishes, key>>
\* tick "fly": p >= 1 → land().
BallLands == /\ Loop /\ stage = "fly" /\ stage' = "after" /\ kicks' = kicks + 1
             /\ UNCHANGED <<shown, paused, visible, focused, pointer, hum, sound, drawer, finishes, key>>
\* tick "after": t >= AFTER → next(): toKeep() (their turn), or finish() when decided. finish() leaves live.stage at
\* "after", so the next tick in the same frame calls next() → finish() again.
TheirTurn == /\ Loop /\ stage = "after" /\ kicks = 1 /\ stage' = "ready"
             /\ UNCHANGED <<kicks, shown, paused, visible, focused, pointer, hum, sound, drawer, finishes, key>>
MatchDecided == /\ Loop /\ stage = "after" /\ kicks = 2 /\ finishes < 2
                /\ finishes' = finishes + 1 /\ hum' = "none"
                /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, sound, drawer, key>>
\* React renders the card: phase won/lost, the loop stops.
CardShows == /\ finishes > 0 /\ shown = "play" /\ shown' = "over"
             /\ UNCHANGED <<stage, kicks, paused, visible, focused, pointer, hum, sound, drawer, finishes, key>>
\* tick "ready": t >= READY → "run", live.hum ??= murmur().
RunUpStarts == /\ Loop /\ stage = "ready" /\ stage' = "run" /\ hum' = Fresh(hum)
               /\ UNCHANGED <<kicks, shown, paused, visible, focused, pointer, sound, drawer, finishes, key>>
\* tick "run": t >= RUN → stopHum(), they kick (your dive, picked or not, is resolved).
TheyKick == /\ Loop /\ stage = "run" /\ stage' = "fly" /\ hum' = "none"
            /\ UNCHANGED <<kicks, shown, paused, visible, focused, pointer, sound, drawer, finishes, key>>
\* The game has no blur or focus listener; only useGameLoop's freezes the clock.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ key' = FALSE /\ UNCHANGED <<stage, kicks, shown, paused, visible, pointer, hum, sound, drawer, finishes>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<stage, kicks, shown, paused, visible, pointer, hum, sound, drawer, finishes, key>>
\* hide(): stopHum, drop the pointer, pause unless aiming.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ hum' = "none" /\ pointer' = FALSE
            /\ paused' = (paused \/ (stage # "aim" /\ shown = "play"))
            /\ key' = FALSE /\ UNCHANGED <<stage, kicks, shown, sound, drawer, finishes>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<stage, kicks, shown, paused, pointer, hum, sound, drawer, finishes, key>>
\* resume() (চালিয়ে যাও, Space): live.hum ??= murmur() during the run-up.
YouResume == /\ Here /\ paused /\ paused' = FALSE
             /\ hum' = IF stage = "run" THEN Fresh(hum) ELSE hum
             /\ UNCHANGED <<stage, kicks, shown, visible, focused, pointer, sound, drawer, finishes, key>>
\* SoundToggle: off → stopLoops() and live.hum = null; on → nothing.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, drawer, finishes, key>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, hum, drawer, finishes, key>>
\* <details> সব ম্যাচ: opening it does nothing to the match.
YouOpenMatches == /\ Here /\ ~drawer /\ drawer' = TRUE
                  /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, hum, sound, finishes, key>>
YouCloseMatches == /\ Here /\ drawer /\ drawer' = FALSE
                   /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, hum, sound, finishes, key>>
\* startMatch(): from the list, পরের ম্যাচ, আবার খেলো / আরেকবার, or a friend's link.
NewMatch == /\ stage' = "aim" /\ kicks' = 0 /\ shown' = "play" /\ paused' = FALSE /\ pointer' = FALSE
            /\ hum' = "none" /\ finishes' = 0 /\ UNCHANGED <<visible, focused, sound, drawer, key>>
YouPickAMatch == /\ Here /\ drawer /\ NewMatch
YouPlayAgain == /\ Here /\ shown = "over" /\ NewMatch

\* keys.current: Space during their run-up dives to the middle; on the card it starts a match (won: the next one,
\* lost: the same one). No event.repeat check anywhere, so Space held through the last kick skips the card.
YouHoldSpaceToDiveMiddle == /\ Here /\ shown = "play" /\ RunUp /\ ~paused /\ ~key /\ key' = TRUE
                            /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, hum, sound, drawer, finishes>>
SpaceRepeatsOnTheCard == /\ Here /\ key /\ shown = "over" /\ NewMatch
YouLetGoOfSpace == /\ focused /\ key /\ key' = FALSE
                   /\ UNCHANGED <<stage, kicks, shown, paused, visible, focused, pointer, hum, sound, drawer, finishes>>

Next == YouTouchTheBoard \/ YouSwipeAndShoot \/ YouLiftWithoutAShot \/ BallLands \/ TheirTurn \/ MatchDecided \/ CardShows
        \/ RunUpStarts \/ TheyKick \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ SoundOff \/ SoundOn \/ YouOpenMatches \/ YouCloseMatches \/ YouPickAMatch \/ YouPlayAgain
        \/ YouHoldSpaceToDiveMiddle \/ SpaceRepeatsOnTheCard \/ YouLetGoOfSpace

Spec == Init /\ [][Next]_vars

TypeOK == /\ stage \in {"aim", "fly", "after", "ready", "run"} /\ kicks \in 0..2 /\ shown \in {"play", "over"}
          /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ pointer \in BOOLEAN
          /\ hum \in {"none", "real", "stub"} /\ sound \in BOOLEAN /\ drawer \in BOOLEAN /\ finishes \in 0..2
          /\ key \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == (~visible /\ shown = "play" /\ stage # "aim") => paused
\* Scoped to their run-up, where the clock runs your dive out without you.
PausedWhenBlurred == (~focused /\ shown = "play" /\ RunUp) => paused
InputReleasedWhenAway == pointer => (visible /\ focused)
MurmurOnlyInTheRunUp == hum = "real" => (stage = "run" /\ ~paused /\ visible /\ focused /\ sound)
MurmurComesBack == (stage = "run" /\ shown = "play" /\ ~paused /\ visible /\ sound) => hum = "real"
LevelPickerFreezesPlay == (drawer /\ shown = "play" /\ RunUp) => paused
NoDoubleResult == finishes <= 1
\* The card stays until you press a key fresh (or tap a button).
CardNeedsAFreshPress == [][~(shown = "over" /\ shown' = "play" /\ key /\ key')]_vars
\* The run-up, the flight and the whistle only move while you're on the page.
Clock == BallLands \/ TheirTurn \/ MatchDecided \/ RunUpStarts \/ TheyKick
NoProgressWhileAway == [][Clock => (visible /\ focused)]_vars
====
