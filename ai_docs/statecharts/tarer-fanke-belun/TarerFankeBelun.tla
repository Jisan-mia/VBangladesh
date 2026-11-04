---- MODULE TarerFankeBelun ----
\* তারের ফাঁকে বেলুন as it is today: the run, pause, the window and the scrolled-away stage, the wire-hum loop,
\* the site-wide sound switch, the result and the celebration timers set when it shows.
\* Mirrors tools/tarer-fanke-belun/components/balloon-game.tsx (press, begin, again/choose/primary and AGAIN_GUARD_MS,
\* finish and its setTimeouts, step's pop/over handling, stopLoops, the visibilitychange and inView effects,
\* SoundToggle onChange={stopLoops}) and tools/tarer-fanke-belun/lib/game.ts (puff, stepRun).
\* The shared loop (shared/game-kit.ts useGameLoop) stops only while the tab is hidden; loop() in
\* shared/game-sound.ts returns a silent stub while sound is off, and stopLoops() resets it, so "hum" = a real loop.
\* Abstractions: stage 0 is the endless street, stage 1 a level that one crossing clears; "fresh" = under
\* AGAIN_GUARD_MS (400 ms) since the result appeared; "party" = a pending sfx/confetti setTimeout from finish().
EXTENDS Naturals
VARIABLES phase, stage, cleared, paused, here, hum, sound, party, fresh, skipped, cheers
vars == <<phase, stage, cleared, paused, here, hum, sound, party, fresh, skipped, cheers>>

Phases == {"ready", "playing", "pop", "over"}
Running == ~paused /\ here # "hidden"

Init == /\ phase = "ready" /\ stage \in {0, 1} /\ cleared = FALSE /\ paused = FALSE /\ here = "page"
        /\ hum = FALSE /\ sound \in BOOLEAN /\ party = FALSE /\ fresh = FALSE /\ skipped = FALSE /\ cheers = 0

\* begin(): a fresh run; stopLoops(); paused false. The finish() timers are not cleared.
Begin(to) == /\ phase' = "ready" /\ stage' = to /\ cleared' = FALSE /\ paused' = FALSE /\ hum' = FALSE
             /\ fresh' = FALSE /\ cheers' = 0

\* press() from a tap on the stage or Space/Enter/↑ (both need the stage on screen):
\* a paused run resumes without restarting the loops; otherwise puff() and `ear.hum ??= loop("hum")`.
YouPuff == /\ here = "page" /\ phase \in {"ready", "playing"}
           /\ IF paused THEN paused' = FALSE /\ UNCHANGED <<phase, hum>>
              ELSE phase' = "playing" /\ hum' = (hum \/ sound) /\ UNCHANGED <<paused>>
           /\ UNCHANGED <<stage, cleared, here, sound, party, fresh, skipped, cheers>>
\* stepRun(): the last crossing of a level is behind the balloon → over; finish() records stars,
\* stopLoops(), and sets a timeout for the fanfare/confetti (300 + stars × 260 ms).
CrossingCleared == /\ Running /\ phase = "playing" /\ stage = 1
                   /\ phase' = "over" /\ cleared' = TRUE /\ hum' = FALSE /\ party' = TRUE /\ fresh' = TRUE
                   /\ cheers' = cheers + 1
                   /\ UNCHANGED <<stage, paused, here, sound, skipped>>
\* stepRun(): a wire or the street → pop; step() stops the loops.
BalloonPops == /\ Running /\ phase = "playing" /\ phase' = "pop" /\ hum' = FALSE
               /\ UNCHANGED <<stage, cleared, paused, here, sound, party, fresh, skipped, cheers>>
\* POP_SECONDS later → over; on the endless street a new best sets a 650 ms fanfare timeout.
PopEnds == /\ here # "hidden" /\ phase = "pop"
           /\ phase' = "over" /\ fresh' = TRUE /\ cheers' = cheers + 1
           /\ UNCHANGED <<stage, cleared, paused, here, hum, sound, party, skipped>>
PopEndsWithBest == /\ here # "hidden" /\ phase = "pop" /\ stage = 0
                   /\ phase' = "over" /\ fresh' = TRUE /\ cheers' = cheers + 1 /\ party' = TRUE
                   /\ UNCHANGED <<stage, cleared, paused, here, hum, sound, skipped>>
GuardPasses == /\ fresh /\ fresh' = FALSE
               /\ UNCHANGED <<phase, stage, cleared, paused, here, hum, sound, party, skipped, cheers>>
PartyFires == /\ party /\ party' = FALSE
              /\ UNCHANGED <<phase, stage, cleared, paused, here, hum, sound, fresh, skipped, cheers>>
\* আরেকবার / পরের লেভেল / Space on the result: again() and primary() return early inside AGAIN_GUARD_MS.
YouPlayAgain == /\ here = "page" /\ phase = "over" /\ ~fresh
                /\ skipped' = (skipped \/ fresh) /\ Begin(stage)
                /\ UNCHANGED <<here, sound, party>>
\* A level (or যত দূর পারো) from the grid, any time: choose() → begin(), no guard.
YouChooseLevel == /\ here = "page" /\ \E to \in {0, 1} : Begin(to)
                  /\ UNCHANGED <<here, sound, party, skipped>>
\* No blur handler: the balloon keeps falling.
WindowBlurs == /\ here = "page" /\ here' = "blurred"
               /\ UNCHANGED <<phase, stage, cleared, paused, hum, sound, party, fresh, skipped, cheers>>
WindowFocuses == /\ here = "blurred" /\ here' = "page"
                 /\ UNCHANGED <<phase, stage, cleared, paused, hum, sound, party, fresh, skipped, cheers>>
\* visibilitychange → hidden / the stage scrolls out of view: while playing, stopLoops() and pause.
TabHides == /\ here # "hidden" /\ here' = "hidden"
            /\ paused' = (paused \/ phase = "playing") /\ hum' = (hum /\ phase # "playing")
            /\ UNCHANGED <<phase, stage, cleared, sound, party, fresh, skipped, cheers>>
TabShows == /\ here = "hidden" /\ here' = "page"
            /\ UNCHANGED <<phase, stage, cleared, paused, hum, sound, party, fresh, skipped, cheers>>
ScrollAway == /\ here = "page" /\ here' = "scrolled"
              /\ paused' = (paused \/ phase = "playing") /\ hum' = (hum /\ phase # "playing")
              /\ UNCHANGED <<phase, stage, cleared, sound, party, fresh, skipped, cheers>>
ScrollBack == /\ here = "scrolled" /\ here' = "page"
              /\ UNCHANGED <<phase, stage, cleared, paused, hum, sound, party, fresh, skipped, cheers>>
\* SoundToggle: setSoundOn() stops every loop when off; onChange={stopLoops} drops the loop either way.
SoundOff == /\ here = "page" /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, stage, cleared, paused, here, party, fresh, skipped, cheers>>
SoundOn == /\ here = "page" /\ ~sound /\ sound' = TRUE /\ hum' = FALSE
           /\ UNCHANGED <<phase, stage, cleared, paused, here, party, fresh, skipped, cheers>>

Next == YouPuff \/ CrossingCleared \/ BalloonPops \/ PopEnds \/ PopEndsWithBest \/ GuardPasses \/ PartyFires
        \/ YouPlayAgain \/ YouChooseLevel \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ ScrollAway \/ ScrollBack \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ stage \in {0, 1} /\ cleared \in BOOLEAN /\ paused \in BOOLEAN
          /\ here \in {"page", "blurred", "hidden", "scrolled"} /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ party \in BOOLEAN /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN /\ cheers \in 0..2

\* The reader's rules.
PausedWhenHidden == (here = "hidden" /\ phase = "playing") => paused
PausedWhenOffScreen == (here = "scrolled" /\ phase = "playing") => paused
PausedWhenBlurred == (here = "blurred" /\ phase = "playing") => paused
LoopOnlyWhenMeaningful == hum => (phase = "playing" /\ ~paused /\ sound /\ here \in {"page", "blurred"})
LoopComesBack == (phase = "playing" /\ ~paused /\ here = "page" /\ sound) => hum
NoCelebrationAfterLeaving == party => phase = "over"
NoTapPastResult == ~skipped
NoDoubleResult == cheers <= 1
====
