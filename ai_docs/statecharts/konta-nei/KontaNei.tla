---- MODULE KontaNei ----
\* কোনটা নেই? after the rewrite: the shelf phases on one pausable phase clock, tab and window focus (and the player's
\* menu, which pauses the same way), the সব লেভেল sheet, the hum loop and the site-wide sound switch, the end-of-level
\* save, and a held Enter on the cash memo.
\* Mirrors tools/konta-nei/lib/session.ts (begin, tick, doneLooking, decided, next, pause, resume, running, looking) and
\* tools/konta-nei/components/shop-game.tsx (start, choose → finalize, nextShelf, openSheet/closeSheet, pauseFor/resumeFrom,
\* the blur and visibilitychange listeners, syncHum after every commit and on the sound switch, load, the key handler).
\* Abstractions: a level has 2 shelves (the game has 3); time is the reducer's: a timed phase moves on only while its
\* clock runs, and `elapsed` doesn't grow while paused, so "the answer clock runs" is exactly AskClockRuns below.
EXTENDS Naturals

VARIABLES phase, why, sheet, visible, focused, hum, sound, shelf, saves, recorded, held, skipped
vars == <<phase, why, sheet, visible, focused, hum, sound, shelf, saves, recorded, held, skipped>>

Phases == {"ready", "opening", "look", "closing", "ask", "reveal", "blink", "over"}
Whys == {"none", "away", "sheet"}
Here == visible /\ focused
\* session.running: a phase that moves on its own or counts, and nothing pausing it.
Running(p, w) == w = "none" /\ p \notin {"ready", "over"}
\* session.looking, and syncHum: the hum plays exactly while a look runs with sound on.
Hum(p, w, s) == p = "look" /\ w = "none" /\ s

Init == /\ phase = "ready" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hum = FALSE /\ sound = TRUE /\ shelf = 1 /\ saves = 0 /\ recorded = FALSE /\ held = FALSE /\ skipped = FALSE

\* Every commit: the new phase and pause, then syncHum.
Go(p, w) == /\ phase' = p /\ why' = w /\ hum' = Hum(p, w, sound)

\* ঝাঁপ তোলো (the shutter, or a fresh Enter): session.begin. The sheet covers the shutter while it is open.
YouStart == /\ Here /\ ~sheet /\ phase = "ready"
            /\ Go("opening", why)
            /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
\* session.tick: the shutter is up, the look time ends, the eyes open on the question.
ShutterUp == /\ phase = "opening" /\ Running(phase, why) /\ Go("look", why)
             /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
LookTimeEnds == /\ phase = "look" /\ Running(phase, why) /\ Go("closing", why)
                /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
\* মনে আছে: session.doneLooking, only while the look runs.
YouRemember == /\ Here /\ phase = "look" /\ Running(phase, why) /\ Go("closing", why)
               /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
EyesOpenOnTheGap == /\ phase = "closing" /\ Running(phase, why) /\ Go("ask", why)
                    /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
\* choose(): session.canPick (the question's clock runs). On the last shelf, finalize() records once per play.
YouAnswer == /\ Here /\ phase = "ask" /\ Running(phase, why) /\ Go("reveal", why)
             /\ IF shelf = 2 /\ ~recorded THEN saves' = saves + 1 /\ recorded' = TRUE ELSE UNCHANGED <<saves, recorded>>
             /\ UNCHANGED <<sheet, visible, focused, sound, shelf, held, skipped>>
\* পরের তাক (or a right answer's reveal running out): session.next → the next shelf's blink, or the memo.
RevealEnds == /\ phase = "reveal" /\ Running(phase, why)
              /\ Go(IF shelf = 2 THEN "over" ELSE "blink", why)
              /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>
EyesOpenOnAShelf == /\ phase = "blink" /\ Running(phase, why) /\ Go("look", why) /\ shelf' = shelf + 1
                    /\ UNCHANGED <<sheet, visible, focused, sound, saves, recorded, held, skipped>>
\* load(): পরের লেভেল / আবার খেলো on the memo (a click, or a fresh Enter), or a level picked in the sheet.
Load == /\ Go("ready", "none") /\ sheet' = FALSE /\ shelf' = 1 /\ recorded' = FALSE /\ saves' = 0
YouPlayOn == /\ Here /\ ~sheet /\ phase = "over" /\ Load
             /\ UNCHANGED <<visible, focused, sound, held, skipped>>
YouPickALevel == /\ Here /\ sheet /\ Load
                 /\ UNCHANGED <<visible, focused, sound, held, skipped>>

\* pauseFor("away"): blur, a hidden tab and the player's menu. A running clock stops; a sheet pause stays a sheet pause.
\* Blur also ends a held key (keyup never arrives).
Away == why' = IF Running(phase, why) THEN "away" ELSE why
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ Away
            /\ hum' = Hum(phase, IF Running(phase, why) THEN "away" ELSE why, sound)
            /\ UNCHANGED <<phase, sheet, sound, shelf, saves, recorded, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, hum, sound, shelf, saves, recorded, held, skipped>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ held' = FALSE /\ Away
               /\ hum' = Hum(phase, IF Running(phase, why) THEN "away" ELSE why, sound)
               /\ UNCHANGED <<phase, sheet, visible, sound, shelf, saves, recorded, skipped>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, hum, sound, shelf, saves, recorded, held, skipped>>
\* চালিয়ে যাও (the menu's, the shutter's, or a fresh Enter): resume "away" only ends an away pause.
YouResume == /\ Here /\ why = "away" /\ Go(phase, "none")
             /\ UNCHANGED <<sheet, visible, focused, sound, shelf, saves, recorded, held, skipped>>

\* openSheet(): pause("sheet") stops a running clock and outranks an away pause; closeSheet(): resume("sheet").
YouOpenTheSheet == /\ Here /\ ~sheet /\ sheet' = TRUE
                   /\ Go(phase, IF Running(phase, why) \/ why = "away" THEN "sheet" ELSE why)
                   /\ UNCHANGED <<visible, focused, sound, shelf, saves, recorded, held, skipped>>
YouCloseTheSheet == /\ Here /\ sheet /\ sheet' = FALSE
                    /\ Go(phase, IF why = "sheet" THEN "none" ELSE why)
                    /\ UNCHANGED <<visible, focused, sound, shelf, saves, recorded, held, skipped>>

\* The site-wide switch in the player's menu (or anywhere): off stops the hum; on runs syncHum.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, why, sheet, visible, focused, shelf, saves, recorded, held, skipped>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = Hum(phase, why, TRUE)
           /\ UNCHANGED <<phase, why, sheet, visible, focused, shelf, saves, recorded, held, skipped>>

\* A key held through the last answer repeats. The memo acts only on `fresh && timeStamp > overAt + 400`.
ResultActsOnRepeat == FALSE
YouHoldEnter == /\ Here /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, hum, sound, shelf, saves, recorded, skipped>>
EnterRepeats == /\ held /\ skipped' = (skipped \/ (phase = "over" /\ ResultActsOnRepeat))
                /\ UNCHANGED <<phase, why, sheet, visible, focused, hum, sound, shelf, saves, recorded, held>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, why, sheet, visible, focused, hum, sound, shelf, saves, recorded, skipped>>

Next == YouStart \/ ShutterUp \/ LookTimeEnds \/ YouRemember \/ EyesOpenOnTheGap \/ YouAnswer \/ RevealEnds
        \/ EyesOpenOnAShelf \/ YouPlayOn \/ YouPickALevel \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses
        \/ YouResume \/ YouOpenTheSheet \/ YouCloseTheSheet \/ SoundOff \/ SoundOn \/ YouHoldEnter \/ EnterRepeats \/ YouLetGo

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ why \in Whys /\ shelf \in 1..2 /\ saves \in 0..2
          /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN

\* ---- the reader's rules ----
Clock == Running(phase, why)
\* The look time, the eyelids and the reveal's pause stop when the tab hides...
PausedWhenHidden == ~visible => ~Clock
\* ...and when you click into another window.
PausedWhenBlurred == ~focused => ~Clock
\* The answer clock never runs while you are away, so away time never counts against your answer.
AwayTimeNeverCharged == (phase = "ask" /\ Clock) => Here
\* A pause covers the shelf and the pictures: no pick and no look happen under it.
NothingUnderThePause == why # "none" => ~Clock
\* The hum means "you're looking": only while the shelf shows and its time counts, never hidden, paused or muted.
HumOnlyWhileLooking == hum => (phase = "look" /\ Clock /\ visible /\ sound)
\* If the shelf is counting down on screen and sound is on, the hum plays (turning sound back on restores it).
HumComesBack == (phase = "look" /\ Clock /\ sound) => hum
\* While the level list is open, nothing counts down.
LevelPickerFreezesPlay == sheet => ~Clock
\* A level is saved once.
NoDoubleResult == saves <= 1
\* The memo shows only after the last shelf was answered and saved.
MemoMeansSaved == phase = "over" => recorded
\* A key held through the end of a level never skips the memo.
ResultNeedsFreshPress == ~skipped
====
