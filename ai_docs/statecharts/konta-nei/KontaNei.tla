---- MODULE KontaNei ----
\* কোনটা নেই?: the shelf rounds (look, eyes close, ask, reveal), the eyelid blink timers, pause on tab hide,
\* window focus, the hum loop, the site-wide sound switch, the level drawer and the end-of-level save.
\* Mirrored from tools/konta-nei/components/konta-game.tsx (start, startLook, closeEyes, choose, nextRound, goTo,
\* resume, the visibilitychange effect, the [done] save effect, SoundToggle onChange) and shared/game-sound.ts (loop, setSoundOn).
\* A level has 3 shelves; the model uses 2 (round 1, round 2 = the last).
EXTENDS Naturals

VARIABLES phase, blink, paused, visible, focused, hum, sound, round, banked, overcharged, drawer, saved, saves
\* banked: askStart has already been added into askSpent (the tab hid during this question).
\* overcharged: this answer's clock now includes time you spent away (a ghost for the rule).
vars == <<phase, blink, paused, visible, focused, hum, sound, round, banked, overcharged, drawer, saved, saves>>

Phases == {"ready", "look", "ask", "reveal", "over"}
\* A closeEyes() timer in flight: after the look time (→ ask), after পরের তাক (→ next shelf), after আবার খেলো / পরের লেভেল (→ new level).
Blinks == {"none", "toAsk", "toNextShelf", "toNewLevel"}
Here == visible /\ focused          \* you can tap or press keys
Timed == phase \in {"look", "ask"} /\ ~paused   \* the look timer or the answer clock is running
Keep(vs) == UNCHANGED vs

Init == /\ phase = "ready" /\ blink = "none" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hum = FALSE /\ sound = TRUE /\ round = 1 /\ banked = FALSE /\ overcharged = FALSE
        /\ drawer = FALSE /\ saved = FALSE /\ saves = 0

\* start(): only from the closed shutter; startLook() starts the hum.
YouStart == /\ Here /\ phase = "ready"
            /\ phase' = "look" /\ hum' = sound
            /\ Keep(<<blink, paused, visible, focused, sound, round, banked, overcharged, drawer, saved, saves>>)
\* startLook()'s later(ms): stop the hum, closeEyes() → a 380 ms timer before the ask. Timers keep running on blur.
LookTimeEnds == /\ phase = "look" /\ ~paused /\ blink = "none"
                /\ blink' = "toAsk" /\ hum' = FALSE
                /\ Keep(<<phase, paused, visible, focused, sound, round, banked, overcharged, drawer, saved, saves>>)
\* closeEyes' then(): setPhase("ask"), the answer clock starts (askStart = now, askSpent = 0).
EyesOpenOnTheGap == /\ blink = "toAsk"
                    /\ phase' = "ask" /\ blink' = "none" /\ banked' = FALSE /\ overcharged' = FALSE
                    /\ Keep(<<paused, visible, focused, hum, sound, round, drawer, saved, saves>>)
\* choose(): ignored while paused or the lids are shut. On the last shelf the result shows, and the [done] effect
\* (same commit) records the stars once per level:seed (finished.current). The star values are shared/game-core
\* recordLevel's job (it keeps the higher), unit-tested in shared/tests/game-kit.test.ts, so they aren't modelled.
YouAnswer == /\ Here /\ phase = "ask" /\ ~paused /\ blink = "none"
             /\ phase' = IF round = 2 THEN "over" ELSE "reveal"
             /\ saved' = (saved \/ round = 2)
             /\ saves' = IF round = 2 /\ ~saved THEN saves + 1 ELSE saves
             /\ Keep(<<blink, paused, visible, focused, hum, sound, round, banked, overcharged, drawer>>)
\* nextRound(): closeEyes(() => { setRound(round + 1); startLook() }).
YouTapNextShelf == /\ Here /\ phase = "reveal" /\ blink = "none"
                   /\ blink' = "toNextShelf"
                   /\ Keep(<<phase, paused, visible, focused, hum, sound, round, banked, overcharged, drawer, saved, saves>>)
\* আবার খেলো / পরের লেভেল / আরেকবার: goTo(level, seed, go = true) → stopAll(), then closeEyes(reset).
YouPlayOn == /\ Here /\ phase = "over" /\ blink = "none"
             /\ blink' = "toNewLevel"
             /\ Keep(<<phase, paused, visible, focused, hum, sound, round, banked, overcharged, drawer, saved, saves>>)
\* The blink's timer fires: startLook() runs whatever the tab is doing; it starts the hum and the look timer.
EyesOpenOnAShelf == /\ blink \in {"toNextShelf", "toNewLevel"}
                    /\ phase' = "look" /\ blink' = "none" /\ hum' = sound /\ paused' = FALSE
                    /\ round' = IF blink = "toNewLevel" THEN 1 ELSE round + 1
                    /\ saved' = IF blink = "toNewLevel" THEN FALSE ELSE saved
                    /\ saves' = IF blink = "toNewLevel" THEN 0 ELSE saves
                    /\ Keep(<<visible, focused, sound, banked, overcharged, drawer>>)
\* The ‹ › level arrows or the drawer: goTo(next) → stopAll(), shutter down, round 1.
YouPickALevel == /\ Here
                 /\ phase' = "ready" /\ blink' = "none" /\ paused' = FALSE /\ hum' = FALSE /\ round' = 1
                 /\ banked' = FALSE /\ overcharged' = FALSE /\ saved' = FALSE /\ saves' = 0
                 /\ Keep(<<visible, focused, sound, drawer>>)
\* visibilitychange → hidden. look: stopAll() (clears every timer, the blink too) and pause.
\* ask: askSpent += now − askStart, pause. Anything else: nothing.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ IF phase = "look"
                 THEN /\ paused' = TRUE /\ hum' = FALSE /\ blink' = "none"
                      /\ Keep(<<banked, overcharged>>)
               ELSE IF phase = "ask"
                 THEN /\ paused' = TRUE /\ banked' = TRUE /\ overcharged' = (overcharged \/ banked)
                      /\ Keep(<<hum, blink>>)
               ELSE Keep(<<paused, hum, blink, banked, overcharged>>)
            /\ Keep(<<phase, sound, round, drawer, saved, saves>>)
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ Keep(<<phase, blink, paused, hum, sound, round, banked, overcharged, drawer, saved, saves>>)
\* No blur or focus listener: nothing else changes.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ Keep(<<phase, blink, paused, visible, hum, sound, round, banked, overcharged, drawer, saved, saves>>)
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ Keep(<<phase, blink, paused, visible, hum, sound, round, banked, overcharged, drawer, saved, saves>>)
\* resume(): look starts over (startLook, hum back); ask restarts the clock from now (askStart = now).
YouResume == /\ Here /\ paused
             /\ paused' = FALSE
             /\ IF phase = "look" THEN hum' = sound /\ blink' = "none" /\ Keep(banked)
                ELSE banked' = FALSE /\ Keep(<<hum, blink>>)
             /\ Keep(<<phase, visible, focused, sound, round, overcharged, drawer, saved, saves>>)
\* The switch sits in the tools row (hidden on the result). Off: stopLoops(). On: startHum() if phase is "look" and not paused.
SoundOff == /\ Here /\ phase # "over" /\ sound
            /\ sound' = FALSE /\ hum' = FALSE
            /\ Keep(<<phase, blink, paused, visible, focused, round, banked, overcharged, drawer, saved, saves>>)
SoundOn == /\ Here /\ phase # "over" /\ ~sound
           /\ sound' = TRUE /\ hum' = (hum \/ (phase = "look" /\ ~paused))
           /\ Keep(<<phase, blink, paused, visible, focused, round, banked, overcharged, drawer, saved, saves>>)
YouOpenTheLevels == /\ Here /\ ~drawer /\ drawer' = TRUE
                    /\ Keep(<<phase, blink, paused, visible, focused, hum, sound, round, banked, overcharged, saved, saves>>)
YouCloseTheLevels == /\ Here /\ drawer /\ drawer' = FALSE
                     /\ Keep(<<phase, blink, paused, visible, focused, hum, sound, round, banked, overcharged, saved, saves>>)

Next == YouStart \/ LookTimeEnds \/ EyesOpenOnTheGap \/ YouAnswer \/ YouTapNextShelf \/ YouPlayOn
        \/ EyesOpenOnAShelf \/ YouPickALevel \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ YouResume
        \/ SoundOff \/ SoundOn \/ YouOpenTheLevels \/ YouCloseTheLevels

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ blink \in Blinks /\ round \in 1..2 /\ saves \in 0..2
          /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN

\* ---- the reader's rules ----
\* The look timer and the answer clock stop when the tab hides.
PausedWhenHidden == (~visible /\ phase \in {"look", "ask"}) => paused
\* ...and when you click into another window.
PausedWhenBlurred == (visible /\ ~focused /\ phase \in {"look", "ask"}) => paused
\* Time you spent away never counts against your answer.
AwayTimeNeverCharged == ~overcharged
\* The hum means "you're looking": only while the shelf is shown and counting, never hidden, paused or muted.
HumOnlyWhileLooking == hum => (phase = "look" /\ blink = "none" /\ ~paused /\ visible /\ sound)
\* If the shelf is counting down on screen and sound is on, the hum plays.
HumComesBack == (phase = "look" /\ blink = "none" /\ ~paused /\ visible /\ sound) => hum
\* While the level list is open, the shelf doesn't count down.
LevelPickerFreezesPlay == drawer => ~Timed
\* A level is saved once.
NoDoubleResult == saves <= 1
====
