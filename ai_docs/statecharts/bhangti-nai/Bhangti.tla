---- MODULE Bhangti ----
\* ভাংতি নাই! after the rewrite: the shift's phases on one pausable phase clock, the window (tab, focus, the counter on screen)
\* and the player's menu (which pauses the same way), the সব দিন sheet, a chit held under a finger or mouse, the end-of-day
\* save and a held Enter on the ledger.
\* Mirrors tools/bhangti-nai/lib/session.ts (begin, tick, served, pause, resume, running, decided) and
\* tools/bhangti-nai/components/shop-game.tsx (start, hand, walkOff, finalize, openSheet/closeSheet, pauseFor/resumeFrom,
\* the blur, visibilitychange and inView effects, load, the chit pointer handlers, the key handler).
\* Abstractions: a shift has N customers (the game has 10); the clock is on (সময় নিয়ে only removes PatienceRunsOut) and the stars are not modelled
\* (they are a max over recorded results, tested in game-core); time is the reducer's: a timed phase moves on only while its
\* clock runs, and `elapsed` does not grow while paused, so "the clock runs" is exactly Clock below. The right beat and the
\* walk-off are phases (not timers), so a pause holds them.
EXTENDS Naturals
CONSTANT N

VARIABLES phase, why, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped
vars == <<phase, why, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped>>

Phases == {"ready", "opening", "serve", "right", "late", "over"}
Whys == {"none", "away", "sheet"}
Here == visible /\ focused
\* session.running: a phase that moves on its own or counts, and nothing pausing it.
Running(p, w) == w = "none" /\ p \notin {"ready", "over"}
Clock == Running(phase, why)

Init == /\ phase = "ready" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ served = 0 /\ saves = 0 /\ recorded = FALSE /\ drag = FALSE /\ held = FALSE /\ skipped = FALSE

\* The last customer is decided: finalize() saves once per play, right now, not behind the beat that follows.
Decide(n) == IF n = N THEN /\ saves' = saves + 1 /\ recorded' = TRUE
             ELSE UNCHANGED <<saves, recorded>>

\* ঘণ্টা বাজাও (the bell, or a fresh Enter): start(). It needs the stage on screen and no sheet.
YouRingTheBell == /\ Here /\ inView /\ ~sheet /\ phase = "ready" /\ phase' = "opening"
                  /\ UNCHANGED <<why, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped>>
\* session.tick: the bell's beat is over and the first customer steps in.
CustomerSteps == /\ phase = "opening" /\ Clock /\ phase' = "serve"
                 /\ UNCHANGED <<why, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped>>
\* দাও with the right change: hand() → give, session.served. The clock must be running (canAct).
YouGiveRightChange == /\ Here /\ inView /\ phase = "serve" /\ Clock /\ phase' = "right" /\ served' = served + 1 /\ Decide(served + 1)
                      /\ UNCHANGED <<why, sheet, visible, focused, inView, drag, held, skipped>>
\* The customer's patience runs out: session.tick → walkOff(). Only with the clock on.
PatienceRunsOut == /\ phase = "serve" /\ Clock /\ phase' = "late" /\ served' = served + 1 /\ Decide(served + 1)
                   /\ UNCHANGED <<why, sheet, visible, focused, inView, drag, held, skipped>>
\* session.tick: the beat after a right answer or a walk-off is over; the next customer steps up, or the ledger shows.
BeatEnds == /\ phase \in {"right", "late"} /\ Clock /\ phase' = IF served = N THEN "over" ELSE "serve"
            /\ UNCHANGED <<why, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped>>
\* load(): পরের দিন / আবার খেলো on the ledger (a click, or a fresh Enter), a day picked in the sheet, or the player's নতুন করে শুরু.
Load == /\ phase' = "ready" /\ why' = "none" /\ sheet' = FALSE /\ served' = 0 /\ recorded' = FALSE /\ saves' = 0
YouPlayOn == /\ Here /\ ~sheet /\ phase = "over" /\ Load
             /\ UNCHANGED <<visible, focused, inView, drag, held, skipped>>
YouPickADay == /\ Here /\ sheet /\ Load
               /\ UNCHANGED <<visible, focused, inView, drag, held, skipped>>
YouRestart == /\ Here /\ ~sheet /\ phase \notin {"ready", "over"} /\ Load
              /\ UNCHANGED <<visible, focused, inView, drag, held, skipped>>

\* pauseFor("away"): blur, a hidden tab, the counter scrolled away and the player's menu. A running clock stops; a sheet pause stays one.
\* Blur and hide also drop a chit held down (pointerup never arrives).
Away == why' = IF Clock THEN "away" ELSE why
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ drag' = FALSE /\ Away
            /\ UNCHANGED <<phase, sheet, inView, served, saves, recorded, held, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, inView, served, saves, recorded, drag, held, skipped>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ drag' = FALSE /\ Away
               /\ UNCHANGED <<phase, sheet, visible, inView, served, saves, recorded, held, skipped>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, inView, served, saves, recorded, drag, held, skipped>>
\* useEffect([inView]): pauseFor("away") when the stage scrolls away.
ScrollAway == /\ inView /\ inView' = FALSE /\ Away
              /\ UNCHANGED <<phase, sheet, visible, focused, served, saves, recorded, drag, held, skipped>>
ScrollBack == /\ ~inView /\ inView' = TRUE
              /\ UNCHANGED <<phase, why, sheet, visible, focused, served, saves, recorded, drag, held, skipped>>
\* চালিয়ে যাও (the menu's, the cover's, or a fresh Enter): resume "away" only ends an away pause, and a "sheet" pause ends once the
\* sheet is shut. Both need the counter on screen (resumeFrom's onScreen check), so a resume from the menu with the stage
\* scrolled away leaves the cover down until you tap it back in view.
YouResume == /\ Here /\ inView /\ (why = "away" \/ (why = "sheet" /\ ~sheet)) /\ why' = "none"
             /\ UNCHANGED <<phase, sheet, visible, focused, inView, served, saves, recorded, drag, held, skipped>>

\* openSheet(): pause("sheet") stops a running clock and outranks an away pause; closeSheet(): resume("sheet").
YouOpenTheSheet == /\ Here /\ ~sheet /\ sheet' = TRUE /\ why' = IF Clock \/ why = "away" THEN "sheet" ELSE why
                   /\ UNCHANGED <<phase, visible, focused, inView, served, saves, recorded, drag, held, skipped>>
YouCloseTheSheet == /\ Here /\ sheet /\ sheet' = FALSE /\ why' = IF why = "sheet" /\ inView THEN "none" ELSE why
                    /\ UNCHANGED <<phase, visible, focused, inView, served, saves, recorded, drag, held, skipped>>

\* A chit under a finger or the mouse: put down at pointerdown, held while dragged, released by pointerup, pointercancel or blur.
YouHoldAChit == /\ Here /\ inView /\ phase = "serve" /\ Clock /\ ~drag /\ drag' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, inView, served, saves, recorded, held, skipped>>
YouLetGoOfTheChit == /\ drag /\ drag' = FALSE
                     /\ UNCHANGED <<phase, why, sheet, visible, focused, inView, served, saves, recorded, held, skipped>>

\* A key held through the last customer repeats. The ledger acts only on `fresh && timeStamp > overAt + 400`.
ResultActsOnRepeat == FALSE
YouHoldEnter == /\ Here /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, inView, served, saves, recorded, drag, skipped>>
EnterRepeats == /\ held /\ skipped' = (skipped \/ (phase = "over" /\ ResultActsOnRepeat))
                /\ UNCHANGED <<phase, why, sheet, visible, focused, inView, served, saves, recorded, drag, held>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, why, sheet, visible, focused, inView, served, saves, recorded, drag, skipped>>

Next == YouRingTheBell \/ CustomerSteps \/ YouGiveRightChange \/ PatienceRunsOut \/ BeatEnds \/ YouPlayOn \/ YouPickADay \/ YouRestart
        \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ ScrollAway \/ ScrollBack \/ YouResume \/ YouOpenTheSheet \/ YouCloseTheSheet
        \/ YouHoldAChit \/ YouLetGoOfTheChit \/ YouHoldEnter \/ EnterRepeats \/ YouLetGo

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ why \in Whys /\ served \in 0..N /\ saves \in 0..2
          /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN /\ recorded \in BOOLEAN
          /\ drag \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN

\* ---- the reader's rules ----
\* The customer's patience, the right beat and the walk-off stop when the tab hides...
PausedWhenHidden == ~visible => ~Clock
\* ...and when you click into another window (the old game had no blur listener).
PausedWhenBlurred == (visible /\ ~focused) => ~Clock
\* The customer's clock runs only while you can see the counter on a focused page.
NoProgressWhileAway == Clock => (visible /\ focused /\ inView)
\* The game's own rule: scrolling the counter away pauses it, however play starts or resumes.
OffScreenMeansPaused == (phase # "ready" /\ ~inView) => ~Clock
\* A pause covers the customer and holds everything: nothing is waiting to happen on its own while paused.
NothingPendingWhilePaused == why # "none" => ~Clock
\* While the day list is open, nothing counts down.
LevelPickerFreezesPlay == sheet => ~Clock
\* A day is saved once.
NoDoubleResult == saves <= 1
\* The ledger shows only after the last customer was decided and saved, and the save happens at the decision.
MemoMeansSaved == phase = "over" => recorded
DecidedMeansSaved == (phase \in {"right", "late"} /\ served = N) => recorded
\* No chit stays held after you leave the page.
InputReleasedWhenAway == ~Here => ~drag
\* A key held through the end of a day never skips the ledger.
ResultNeedsFreshPress == ~skipped
\* The day ends only from play you can see, never behind the pause screen or a hidden tab.
DayEndsOnlyWhilePlaying == [][(phase' = "over" /\ phase # "over") => (phase \in {"right", "late"} /\ Clock /\ visible)]_vars
====
