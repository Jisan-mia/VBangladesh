---- MODULE BostarPahar ----
\* বস্তার পাহাড় as it is today: the run, pause, the window, the drop key (and its auto-repeat),
\* the result and the star chimes that play after it.
\* Mirrors tools/bostar-pahar/components/bostar-game.tsx (press, start/play/again/proceed, finish and its timers,
\* the keydown effect, the visibilitychange effect, the pause button, useGameLoop) and tools/bostar-pahar/lib/game.ts
\* (tap, step, land). The shared loop (shared/game-kit.ts useGameLoop) stops only while the tab is hidden.
\* Abstractions: one sack fills the truck (sacks 0..1), "fresh" = the result appeared a moment ago (under ~0.4 s),
\* "held" = Space/Enter/↓ is physically down, so the browser sends repeat keydowns while the page has focus.
EXTENDS Naturals
VARIABLES phase, sacks, paused, here, held, fresh, chimes, skipped, repeatDrop, cheers
vars == <<phase, sacks, paused, here, held, fresh, chimes, skipped, repeatDrop, cheers>>

Phases == {"ready", "swing", "drop", "settle", "fall", "over"}
Active == {"swing", "drop", "settle", "fall"}       \* the phases the visibility handler pauses
Running == ~paused /\ here # "hidden"                  \* rAF runs; blur does not stop it

Init == /\ phase = "ready" /\ sacks = 0 /\ paused = FALSE /\ here = "page" /\ held = FALSE
        /\ fresh = FALSE /\ chimes = FALSE /\ skipped = FALSE /\ repeatDrop = FALSE /\ cheers = 0

\* start(): a new run; clears the chime timers and the pause.
\* byKey: the press came from the keyboard, which lands on the result at once; a finger lands elsewhere, because
\* the result pushes the buttons to a new spot (checked live).
Restart(byKey) == /\ phase' = "ready" /\ sacks' = 0 /\ paused' = FALSE /\ chimes' = FALSE /\ cheers' = 0
                  /\ skipped' = (skipped \/ (fresh /\ byKey)) /\ fresh' = FALSE
\* press(): a paused game resumes; otherwise tap() drops the sack while it swings.
Press(byRepeat) ==
  IF phase = "over" THEN Restart(TRUE) /\ UNCHANGED <<repeatDrop>>  \* the key handler calls proceed()
  ELSE IF paused THEN paused' = FALSE /\ UNCHANGED <<phase, sacks, chimes, skipped, fresh, cheers, repeatDrop>>
  ELSE IF phase \in {"ready", "swing"} THEN /\ phase' = "drop" /\ repeatDrop' = (repeatDrop \/ byRepeat)
                                            /\ UNCHANGED <<sacks, paused, chimes, skipped, fresh, cheers>>
  ELSE UNCHANGED <<phase, sacks, paused, chimes, skipped, fresh, cheers, repeatDrop>>

\* keydown Space/Enter/↓ (no event.repeat check).
YouPressKey == /\ here = "page" /\ ~held /\ held' = TRUE /\ Press(FALSE) /\ UNCHANGED <<here>>
\* The browser's auto-repeat keydown while the key stays down and the page has focus.
KeyRepeats == /\ here = "page" /\ held /\ Press(TRUE) /\ UNCHANGED <<here, held>>
YouReleaseKey == /\ held /\ held' = FALSE
                 /\ UNCHANGED <<phase, sacks, paused, here, fresh, chimes, skipped, repeatDrop, cheers>>
\* pointerdown on the stage or the বস্তা ফেলো button (both ignore the result screen).
YouTap == /\ here = "page" /\ phase # "over" /\ Press(FALSE) /\ UNCHANGED <<here, held>>
\* পরের ঘাট / আবার খেলো / আরেকবার on the result: play() at once, no guard.
YouPlayAgain == /\ here = "page" /\ phase = "over" /\ Restart(FALSE) /\ UNCHANGED <<here, held, repeatDrop>>
\* থামাও/চালাও (shown after the first drop) or P/Esc (any time before the result).
YouTogglePause == /\ here = "page" /\ phase # "over" /\ paused' = ~paused
                  /\ UNCHANGED <<phase, sacks, here, held, fresh, chimes, skipped, repeatDrop, cheers>>
\* step(): the drop lands (sits or slips), the next sack comes, the slipped sack falls and the result shows.
SackSits == /\ Running /\ phase = "drop" /\ phase' = "settle" /\ sacks' = 1
            /\ UNCHANGED <<paused, here, held, fresh, chimes, skipped, repeatDrop, cheers>>
SackSlips == /\ Running /\ phase = "drop" /\ phase' = "fall"
             /\ UNCHANGED <<sacks, paused, here, held, fresh, chimes, skipped, repeatDrop, cheers>>
NextSack == /\ Running /\ phase = "settle" /\ phase' = "swing"
            /\ UNCHANGED <<sacks, paused, here, held, fresh, chimes, skipped, repeatDrop, cheers>>
\* finish(): best, record, and setTimeout star chimes / fanfare when stars were won.
PileFalls == /\ Running /\ phase = "fall" /\ phase' = "over" /\ fresh' = TRUE /\ chimes' = (sacks > 0)
             /\ cheers' = cheers + 1
             /\ UNCHANGED <<sacks, paused, here, held, skipped, repeatDrop>>
MomentPasses == /\ fresh /\ fresh' = FALSE
                /\ UNCHANGED <<phase, sacks, paused, here, held, chimes, skipped, repeatDrop, cheers>>
ChimesPlay == /\ chimes /\ chimes' = FALSE
              /\ UNCHANGED <<phase, sacks, paused, here, held, fresh, skipped, repeatDrop, cheers>>
\* No blur handler: the run goes on. Repeat keydowns stop going to the page.
WindowBlurs == /\ here = "page" /\ here' = "blurred" /\ held' = FALSE
               /\ UNCHANGED <<phase, sacks, paused, fresh, chimes, skipped, repeatDrop, cheers>>
WindowFocuses == /\ here = "blurred" /\ here' = "page"
                 /\ UNCHANGED <<phase, sacks, paused, held, fresh, chimes, skipped, repeatDrop, cheers>>
\* visibilitychange → hidden: pause only in the Active phases; rAF stops.
TabHides == /\ here # "hidden" /\ here' = "hidden" /\ held' = FALSE
            /\ paused' = (paused \/ phase \in Active)
            /\ UNCHANGED <<phase, sacks, fresh, chimes, skipped, repeatDrop, cheers>>
TabShows == /\ here = "hidden" /\ here' = "page"
            /\ UNCHANGED <<phase, sacks, paused, held, fresh, chimes, skipped, repeatDrop, cheers>>

Next == YouPressKey \/ KeyRepeats \/ YouReleaseKey \/ YouTap \/ YouPlayAgain \/ YouTogglePause
        \/ SackSits \/ SackSlips \/ NextSack \/ PileFalls \/ MomentPasses \/ ChimesPlay
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ sacks \in 0..1 /\ paused \in BOOLEAN /\ here \in {"page", "blurred", "hidden"}
          /\ held \in BOOLEAN /\ fresh \in BOOLEAN /\ chimes \in BOOLEAN /\ skipped \in BOOLEAN
          /\ repeatDrop \in BOOLEAN /\ cheers \in 0..2

\* The reader's rules.
PausedWhenHidden == (here = "hidden" /\ phase \in Active) => paused
PausedWhenBlurred == (here = "blurred" /\ phase \in Active) => paused
EveryDropIsATap == ~repeatDrop
NoTapPastResult == ~skipped
NoChimeAfterLeaving == chimes => phase = "over"
NoDoubleResult == cheers <= 1
====
