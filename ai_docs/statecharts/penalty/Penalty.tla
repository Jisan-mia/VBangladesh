---- MODULE Penalty ----
EXTENDS Naturals
\* পেনাল্টি কিক after the rewrite: the match clock, the player's pause, going away, your finger and the tap back, the crowd
\* loop, the match list and the end card, mirrored from tools/penalty/components/penalty.tsx with tools/penalty/lib/session.ts,
\* lib/game.ts + lib/step.hot.ts (the clock), lib/crowd.ts (keepCrowd), shared/game-player-client.tsx and useGameLoop.
\* (The spec before the rewrite is in git at commit a4e1ef4: ai_docs/statecharts/penalty/Penalty.tla.)
\*
\* phase:  session.phase: "title" → "playing" ⇄ "paused" → "over" (the story is a "playing"-like phase and is left out).
\* stage:  game.stage: "aim" (your kick) → "fly" → "after" → "ready" (their whistle) → "run" (run-up) → "fly" → "after"
\*         → "over". Two kicks stand for the whole shoot-out: after the second, decided() is true. "over" is terminal:
\*         stepGame returns at once, so a slow frame's extra steps can't decide the match again.
\* finishes: how many times finish() ran (stars, whistle, fanfare). It runs on the step's Over event, and the session's
\*         finish() refuses a second call.
\* hum:    the crowd loop: "none" or "real". It is only ever made while sound is on (keepCrowd), so there's no silent stub.
\* finger: session.finger, a finger on the field. swallow: the next tap is spent (set by a blur or hide).
\* dive:   you picked a side during their run-up. key: Space is held down and auto-repeats.
VARIABLES phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive, key
vars == <<phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive, key>>

Here == visible /\ focused
\* moving(session): the clock (useGameLoop + stepGame) runs only here.
Moving == phase = "playing" /\ ~drawer /\ Here
RunUp == stage \in {"ready", "run"}
\* crowdWanted(session, soundOn()) && stage !== Over
Wanted(p, st, vis, foc, snd, dr) == p = "playing" /\ ~dr /\ vis /\ foc /\ snd /\ st # "over"

Init == /\ phase = "title" /\ stage = "aim" /\ kicks = 0 /\ finishes = 0 /\ visible = TRUE /\ focused = TRUE
        /\ finger = FALSE /\ swallow = FALSE /\ hum = "none" /\ sound = TRUE /\ drawer = FALSE /\ dive = FALSE /\ key = FALSE

\* খেলো / Enter on the title: session.start(), then kickOff() → syncCrowd().
YouPressPlay == /\ phase = "title" /\ ~drawer /\ Here /\ phase' = "playing" /\ swallow' = FALSE
                /\ hum' = IF sound THEN "real" ELSE "none"
                /\ UNCHANGED <<stage, kicks, finishes, visible, focused, finger, sound, drawer, dive, key>>
\* onPointerDown while aiming: press(session) spends a pending swallow instead of starting a swipe.
YouTouchTheField == /\ Moving /\ stage = "aim" /\ ~finger
                    /\ IF swallow THEN swallow' = FALSE /\ finger' = FALSE ELSE finger' = TRUE /\ swallow' = FALSE
                    /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, hum, sound, drawer, dive, key>>
YouSwipeAndShoot == /\ Moving /\ finger /\ stage = "aim" /\ finger' = FALSE /\ stage' = "fly"
                    /\ UNCHANGED <<phase, kicks, finishes, visible, focused, swallow, hum, sound, drawer, dive, key>>
YouLiftWithoutAShot == /\ finger /\ finger' = FALSE
                       /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, swallow, hum, sound, drawer, dive, key>>
\* A tap on a third of the field (on touch-down) during their run-up: spent if it's the tap back, else a dive.
YouTapASide == /\ Moving /\ RunUp
               /\ IF swallow THEN swallow' = FALSE /\ dive' = dive ELSE dive' = TRUE /\ swallow' = FALSE
               /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, hum, sound, drawer, key>>
\* Space held to dive to the middle: the first keydown dives (keys are deliberate, never swallowed), repeats are ignored.
YouHoldSpace == /\ Moving /\ RunUp /\ ~key /\ key' = TRUE /\ dive' = TRUE
                /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer>>
YouLetGoOfSpace == /\ key /\ key' = FALSE
                   /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive>>

\* The clock (stepGame), only while Moving.
BallLands == /\ Moving /\ stage = "fly" /\ stage' = "after" /\ kicks' = kicks + 1
             /\ UNCHANGED <<phase, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive, key>>
TheirTurn == /\ Moving /\ stage = "after" /\ kicks = 1 /\ stage' = "ready" /\ dive' = FALSE
             /\ UNCHANGED <<phase, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, key>>
RunUpStarts == /\ Moving /\ stage = "ready" /\ stage' = "run"
               /\ UNCHANGED <<phase, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive, key>>
TheyKick == /\ Moving /\ stage = "run" /\ stage' = "fly"
            /\ UNCHANGED <<phase, kicks, finishes, visible, focused, finger, swallow, hum, sound, drawer, dive, key>>
\* next(): decided → stage Over and one Over event; react() → finish(): the session goes "over", the crowd stops.
MatchDecided == /\ Moving /\ stage = "after" /\ kicks = 2
                /\ stage' = "over" /\ finishes' = finishes + 1 /\ phase' = "over" /\ hum' = "none" /\ finger' = FALSE
                /\ UNCHANGED <<kicks, visible, focused, swallow, sound, drawer, dive, key>>
\* Every step also runs syncCrowd(): keepCrowd(hum, wanted, crowdLoop). The loop steps whenever the window has focus.
CrowdStep == /\ Here
             /\ hum' = IF Wanted(phase, stage, visible, focused, sound, drawer) THEN "real" ELSE "none"
             /\ hum' # hum
             /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, sound, drawer, dive, key>>

\* Going away: the game's listener (lostFocus: let go of the finger, spend the next tap, stop the crowd), then the player's
\* pause (its menu opens: you have touched the game, so it is engaged).
WindowBlurs == /\ focused /\ focused' = FALSE /\ finger' = FALSE /\ swallow' = TRUE /\ hum' = "none" /\ key' = FALSE
               /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
               /\ UNCHANGED <<stage, kicks, finishes, visible, sound, drawer, dive>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, stage, kicks, finishes, visible, finger, swallow, hum, sound, drawer, dive, key>>
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ finger' = FALSE /\ swallow' = TRUE /\ hum' = "none" /\ key' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<stage, kicks, finishes, sound, drawer, dive>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, stage, kicks, finishes, finger, swallow, hum, sound, drawer, dive, key>>
\* ⏸, Escape or P (player.requestPause()): the player's onPause → pause(): stop the crowd, let go of the finger.
YouPause == /\ Here /\ phase = "playing" /\ phase' = "paused" /\ hum' = "none" /\ finger' = FALSE
            /\ UNCHANGED <<stage, kicks, finishes, visible, focused, swallow, sound, drawer, dive, key>>
\* চালিয়ে যাও: session.resume() (only on screen); the click was the menu's, so the swallow is cleared; syncCrowd().
YouResume == /\ Here /\ phase = "paused" /\ phase' = "playing" /\ swallow' = FALSE
             /\ hum' = IF Wanted("playing", stage, visible, focused, sound, drawer) THEN "real" ELSE "none"
             /\ UNCHANGED <<stage, kicks, finishes, visible, focused, finger, sound, drawer, dive, key>>
\* The sound switch: the settings listener drops the crowd at once on off, and brings a fresh one at once on on.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, drawer, dive, key>>
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ hum' = IF Wanted(phase, stage, visible, focused, TRUE, drawer) THEN "real" ELSE hum
           /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, drawer, dive, key>>
\* সব ম্যাচ: session.pick() opens only on the title or the card.
YouOpenMatches == /\ Here /\ ~drawer /\ phase \in {"title", "over"} /\ drawer' = TRUE
                  /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, dive, key>>
YouCloseMatches == /\ drawer /\ drawer' = FALSE
                   /\ UNCHANGED <<phase, stage, kicks, finishes, visible, focused, finger, swallow, hum, sound, dive, key>>
\* A match picked (or নতুন করে শুরু, or a friend's link): reset() → the title with a fresh match.
Fresh == /\ stage' = "aim" /\ kicks' = 0 /\ finishes' = 0 /\ finger' = FALSE /\ dive' = FALSE
YouPickAMatch == /\ drawer /\ Here /\ drawer' = FALSE /\ phase' = "title" /\ Fresh /\ hum' = "none"
                 /\ UNCHANGED <<visible, focused, swallow, sound, key>>
YouRestart == /\ phase \in {"playing", "paused"} /\ Here /\ phase' = "title" /\ Fresh /\ hum' = "none"
              /\ UNCHANGED <<visible, focused, swallow, sound, drawer, key>>
\* আবার খেলো / পরের ম্যাচ (a button after the 0.7 s guard, or a fresh Enter/Space): session.again(), kickOff().
YouPlayAgain == /\ phase = "over" /\ ~drawer /\ Here /\ ~key /\ phase' = "playing" /\ Fresh /\ swallow' = FALSE
                /\ hum' = IF sound THEN "real" ELSE "none"
                /\ UNCHANGED <<visible, focused, sound, drawer, key>>
\* Space still held when the card shows: its repeats reach again() with repeat = true (or a press from before the card), refused.
SpaceRepeatsOnTheCard == /\ phase = "over" /\ key
                         /\ UNCHANGED vars

Next == YouPressPlay \/ YouTouchTheField \/ YouSwipeAndShoot \/ YouLiftWithoutAShot \/ YouTapASide \/ YouHoldSpace \/ YouLetGoOfSpace
        \/ BallLands \/ TheirTurn \/ RunUpStarts \/ TheyKick \/ MatchDecided \/ CrowdStep
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume \/ SoundOff \/ SoundOn
        \/ YouOpenMatches \/ YouCloseMatches \/ YouPickAMatch \/ YouRestart \/ YouPlayAgain \/ SpaceRepeatsOnTheCard

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ stage \in {"aim", "fly", "after", "ready", "run", "over"}
          /\ kicks \in 0..2 /\ finishes \in 0..2 /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ finger \in BOOLEAN
          /\ swallow \in BOOLEAN /\ hum \in {"none", "real"} /\ sound \in BOOLEAN /\ drawer \in BOOLEAN /\ dive \in BOOLEAN /\ key \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == finger => Here
CrowdOnlyInPlay == hum = "real" => Wanted(phase, stage, visible, focused, sound, drawer)
CrowdComesBack == Wanted(phase, stage, visible, focused, sound, drawer) => hum = "real"
LevelPickerFreezesPlay == drawer => phase \in {"title", "over"}
NoDoubleResult == finishes <= 1
CardMatchesTheEnd == (phase = "over") <=> (stage = "over")
\* The card stays until a fresh press: never because of a key held from before.
CardNeedsAFreshPress == [][~(phase = "over" /\ phase' = "playing" /\ key)]_vars
\* The tap that brings the window back is not a move: it neither dives nor starts a swipe.
ClickBackIsNotAMove == [][(swallow /\ ~swallow' /\ phase = "playing" /\ phase' = "playing") => (dive' = dive /\ ~finger')]_vars
\* The run-up, the flight and the whistle only move while you're on the page, with no menu or list open.
Clock == BallLands \/ TheirTurn \/ RunUpStarts \/ TheyKick \/ MatchDecided
NoProgressWhileAway == [][Clock => (Here /\ phase = "playing" /\ ~drawer)]_vars
====
