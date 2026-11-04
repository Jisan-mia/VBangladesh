---- MODULE VoKatta ----
\* ভো-কাট্টা after the rewrite: the screens, the shared player's pause, window focus, the sky on screen, the level list,
\* your finger on the sky, the প্যাঁচ, the wind and hum loops and the end card's scheduled chimes. Saved stars and the
\* unlock (with a friend's far link) are a second small spec, unlock/Unlock.tla, so each chart stays under 500 states.
\* Mirrored from tools/vo-katta/components/vo-katta.tsx (begin, finish, the blur/focus/visibility effect, the
\* IntersectionObserver on the sky, the sound effect, the sheet effect, useGamePlayer's onPause/onResume/onRestart),
\* tools/vo-katta/lib/session.ts (ticking, wantWind, wantHum, syncLoops, blur, hide, setInView, pause, resume,
\* openSheet, pointerDown, letGo, freshResultKey), tools/vo-katta/lib/step.hot.ts (hook, cut, lost, the end) and
\* shared/game-player-client.tsx (blur, hide and scrolling away open the menu once you've touched the game;
\* চালিয়ে যাও and নতুন করে শুরু send a focus first; pausing cuts scheduled tones).
\* An evening is abstracted to two rivals to cut and two kites on the নাটাই. The old model is in before-fix/ (and git).
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, inView, sheet, held, hooked, left, kites, wind, hum, sound, engaged, chime, results
vars == <<phase, paused, visible, focused, inView, sheet, held, hooked, left, kites, wind, hum, sound, engaged, chime, results>>

Phases == {"title", "ready", "fly", "over"}
Play == {"ready", "fly"}
\* session.ticking: the play screen, the menu and the list shut, the tab showing, the window focused, the sky on screen.
TickingWith(p, pa, sh, fo, vi, iv) == p \in Play /\ ~pa /\ ~sh /\ fo /\ vi /\ iv
Ticking == TickingWith(phase, paused, sheet, focused, visible, inView)
\* syncLoops after every event and every step: the wind while the sky ticks with sound on, the hum only while hooked too.
SyncLoops(p, pa, sh, fo, vi, iv, so, ho) ==
    /\ wind' = (TickingWith(p, pa, sh, fo, vi, iv) /\ so)
    /\ hum' = (TickingWith(p, pa, sh, fo, vi, iv) /\ so /\ ho)

Init == /\ phase = "title" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE /\ sheet = FALSE
        /\ held = FALSE /\ hooked = FALSE /\ left = 2 /\ kites = 2 /\ wind = FALSE /\ hum = FALSE
        /\ sound \in BOOLEAN /\ engaged = FALSE /\ chime = FALSE /\ results = 0

\* begin(): a fresh evening on the play screen, waiting for the first touch. silenceScheduled cuts the last card's chimes.
Begin == /\ phase' = "ready" /\ held' = FALSE /\ hooked' = FALSE /\ left' = 2 /\ kites' = 2 /\ chime' = FALSE /\ results' = 0

\* Tap the title kite (or Enter): begin().
YouTapTheKite == /\ phase = "title" /\ ~paused /\ ~sheet /\ visible /\ focused
                 /\ Begin /\ engaged' = TRUE
                 /\ SyncLoops("ready", paused, sheet, focused, visible, inView, sound, FALSE)
                 /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound>>
\* pointerDown (or Space): counts only while the sky ticks; the first touch starts the clock.
YouTouchTheSky == /\ Ticking /\ ~held
                  /\ held' = TRUE
                  /\ phase' = "fly"
                  /\ SyncLoops("fly", paused, sheet, focused, visible, inView, sound, hooked)
                  /\ UNCHANGED <<paused, visible, focused, inView, sheet, hooked, left, kites, sound, engaged, chime, results>>
\* pointerup or keyup arrive only while the page has focus.
YouLetGo == /\ held /\ focused /\ held' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, hooked, left, kites, wind, hum, sound, engaged, chime, results>>
\* stepGame → tryHook: the strings cross.
StringsCross == /\ Ticking /\ phase = "fly" /\ ~hooked
                /\ hooked' = TRUE
                /\ SyncLoops(phase, paused, sheet, focused, visible, inView, sound, TRUE)
                /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, left, kites, sound, engaged, chime, results>>
\* stepGame → tug ≥ 1: theirs gives. The last one ends the evening (after END_TIME): finish() records the stars
\* (kites kept: 3, 2, 1; modelled in unlock/Unlock.tla) and schedules the star chimes and fanfare as tones.
YouCutOne == /\ Ticking /\ hooked
             /\ hooked' = FALSE /\ left' = left - 1
             /\ IF left = 1
                THEN /\ phase' = "over" /\ held' = FALSE /\ results' = results + 1 /\ chime' = sound
                     /\ wind' = FALSE /\ hum' = FALSE
                ELSE /\ UNCHANGED <<phase, held, results, chime>>
                     /\ SyncLoops(phase, paused, sheet, focused, visible, inView, sound, FALSE)
             /\ UNCHANGED <<paused, visible, focused, inView, sheet, kites, sound, engaged>>
\* stepGame → tug ≤ −1: yours gives. The last kite on the নাটাই ends the evening, with the lose tones.
TheyCutYours == /\ Ticking /\ hooked
                /\ hooked' = FALSE /\ kites' = kites - 1
                /\ IF kites = 1
                   THEN /\ phase' = "over" /\ held' = FALSE /\ results' = results + 1 /\ chime' = sound
                        /\ wind' = FALSE /\ hum' = FALSE
                   ELSE /\ UNCHANGED <<phase, held, results, chime>>
                        /\ SyncLoops(phase, paused, sheet, focused, visible, inView, sound, FALSE)
                /\ UNCHANGED <<paused, visible, focused, inView, sheet, left, sound, engaged>>
\* window blur (real): session.blur lets go; the player opens the menu once you've touched the game, cutting the chimes.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE
               /\ paused' = (paused \/ engaged)
               /\ chime' = (chime /\ ~engaged)
               /\ wind' = FALSE /\ hum' = FALSE
               /\ UNCHANGED <<phase, visible, inView, sheet, hooked, left, kites, sound, engaged, results>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ SyncLoops(phase, paused, sheet, TRUE, visible, inView, sound, hooked)
                 /\ UNCHANGED <<phase, paused, visible, inView, sheet, held, hooked, left, kites, sound, engaged, chime, results>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE
            /\ paused' = (paused \/ engaged)
            /\ chime' = (chime /\ ~engaged)
            /\ wind' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, inView, sheet, hooked, left, kites, sound, engaged, results>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE
            /\ SyncLoops(phase, paused, sheet, TRUE, TRUE, inView, sound, hooked)
            /\ UNCHANGED <<phase, paused, inView, sheet, held, hooked, left, kites, sound, engaged, chime, results>>
\* The sky scrolls off a desktop page: the game's own IntersectionObserver lets go (setInView), and the player's
\* observer opens the menu on that change, once you've touched the game.
ScrollAway == /\ visible /\ inView
              /\ inView' = FALSE /\ held' = FALSE
              /\ paused' = (paused \/ engaged)
              /\ chime' = (chime /\ ~engaged)
              /\ wind' = FALSE /\ hum' = FALSE
              /\ UNCHANGED <<phase, visible, focused, sheet, hooked, left, kites, sound, engaged, results>>
ScrollBack == /\ visible /\ ~inView
              /\ inView' = TRUE
              /\ SyncLoops(phase, paused, sheet, focused, visible, TRUE, sound, hooked)
              /\ UNCHANGED <<phase, paused, visible, focused, sheet, held, hooked, left, kites, sound, engaged, chime, results>>
\* Escape, ⏸ or P (player.requestPause): openMenu → pointercancel, a synthetic blur, silenceScheduled, onPause.
YouOpenTheMenu == /\ engaged /\ ~paused /\ visible
                  /\ paused' = TRUE /\ held' = FALSE /\ chime' = FALSE /\ focused' = FALSE
                  /\ wind' = FALSE /\ hum' = FALSE
                  /\ UNCHANGED <<phase, visible, inView, sheet, hooked, left, kites, sound, engaged, results>>
\* চালিয়ে যাও (in the menu, or the bar's ▶ below the stage, even with the sky scrolled away): focus, then onResume.
YouResume == /\ paused /\ visible
             /\ paused' = FALSE /\ focused' = TRUE /\ held' = FALSE
             /\ SyncLoops(phase, FALSE, sheet, TRUE, visible, inView, sound, hooked)
             /\ UNCHANGED <<phase, visible, inView, sheet, hooked, left, kites, sound, engaged, chime, results>>
\* নতুন করে শুরু: focus, then onRestart → begin() on the same level, which also shuts the level list (setSheet(false), goTo).
YouRestart == /\ paused /\ visible /\ phase \in {"ready", "fly", "over"}
              /\ Begin /\ paused' = FALSE /\ focused' = TRUE /\ sheet' = FALSE
              /\ SyncLoops("ready", FALSE, FALSE, TRUE, visible, inView, sound, FALSE)
              /\ UNCHANGED <<visible, inView, sound, engaged>>
\* সব লেভেল on the title or the card opens the list (a choice screen: session.openSheet, nothing ticks).
YouOpenTheList == /\ phase \in {"title", "over"} /\ ~paused /\ ~sheet /\ visible /\ focused
                  /\ sheet' = TRUE /\ held' = FALSE
                  /\ UNCHANGED <<phase, paused, visible, focused, inView, hooked, left, kites, wind, hum, sound, engaged, chime, results>>
YouCloseTheList == /\ sheet /\ ~paused
                   /\ sheet' = FALSE
                   /\ UNCHANGED <<phase, paused, visible, focused, inView, held, hooked, left, kites, wind, hum, sound, engaged, chime, results>>
\* A row of the list: begin() on that level.
YouPickALevel == /\ sheet /\ ~paused /\ visible /\ focused
                 /\ Begin /\ sheet' = FALSE /\ engaged' = TRUE
                 /\ SyncLoops("ready", paused, FALSE, focused, visible, inView, sound, FALSE)
                 /\ UNCHANGED <<paused, visible, focused, inView, sound>>
\* The card's ১ ২ (or a fresh Enter, freshResultKey): begin() a new evening.
YouPlayOn == /\ phase = "over" /\ ~paused /\ ~sheet /\ visible /\ focused
             /\ Begin
             /\ SyncLoops("ready", paused, sheet, focused, visible, inView, sound, FALSE)
             /\ UNCHANGED <<paused, visible, focused, inView, sheet, sound, engaged>>
\* The scheduled tones end on their own.
ChimesEnd == chime /\ chime' = FALSE
             /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, hooked, left, kites, wind, hum, sound, engaged, results>>
\* The site-wide switch: off stops every loop in the kit and cuts queued tones; on runs syncLoops at once.
SoundOff == /\ sound /\ sound' = FALSE /\ wind' = FALSE /\ hum' = FALSE /\ chime' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, hooked, left, kites, engaged, results>>
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ SyncLoops(phase, paused, sheet, focused, visible, inView, TRUE, hooked)
           /\ UNCHANGED <<phase, paused, visible, focused, inView, sheet, held, hooked, left, kites, engaged, chime, results>>

Next == YouTapTheKite \/ YouTouchTheSky \/ YouLetGo \/ StringsCross \/ YouCutOne \/ TheyCutYours
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack
        \/ YouOpenTheMenu \/ YouResume \/ YouRestart \/ YouOpenTheList \/ YouCloseTheList \/ YouPickALevel \/ YouPlayOn
        \/ ChimesEnd \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ sheet \in BOOLEAN /\ held \in BOOLEAN /\ hooked \in BOOLEAN /\ left \in 0..2 /\ kites \in 0..2
          /\ wind \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ engaged \in BOOLEAN /\ chime \in BOOLEAN
          /\ results \in 0..1

\* The reader's rules. The first ten are the old model's, in the new variables; the three that broke come first.
PausedWhenBlurred == (visible /\ ~focused /\ engaged /\ phase \in Play) => paused
NoProgressWhileAway == Ticking => (focused /\ visible /\ inView /\ ~paused /\ ~sheet)
OffScreenMeansPaused == Ticking => inView
InputReleasedWhenAway == (~focused \/ ~visible \/ ~inView \/ paused \/ sheet) => ~held
PausedWhenHidden == (~visible /\ engaged /\ phase \in Play) => paused
LoopOnlyWhenMeaningful == (wind => (Ticking /\ sound)) /\ (hum => (Ticking /\ sound /\ hooked))
LoopComesBack == (Ticking /\ sound) => (wind /\ (hooked => hum))
NoDoubleResult == results <= 1
NoFanfareAfterMovingOn == chime => (phase = "over" /\ ~paused /\ sound)
\* New with the rewrite.
ChoiceFreezesPlay == sheet => ~Ticking
\* The kite is hooked, cut or lost only while the sky ticks (the clock, the rivals and the wind run only then).
ProgressOnlyWhileTicking == [][(phase = "fly" /\ phase' \in {"fly", "over"} /\ (hooked' # hooked \/ left' < left \/ kites' < kites)) => Ticking]_vars
\* A finger or key starts holding only while the sky ticks: the click that brings focus back is not a move.
TheClickBackIsNotAMove == [][(held' /\ ~held) => Ticking]_vars
====
