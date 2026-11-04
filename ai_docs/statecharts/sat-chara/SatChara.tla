---- MODULE SatChara ----
\* সাত চাড়া after the rewrite: the screens, the throw, the player's pause, সব লেভেল, window focus, the pull, the held key and the hum.
\* Mirrored from tools/sat-chara/components/game.tsx (begin, toTitle, throwNow, tap, step → settled/finish, onPointerDown/Move/Up/Cancel,
\* the window keydown/keyup effect, the blur/focus/visibility effect, the sound effect, useGamePlayer onPause/onResume/onRestart/onLevels,
\* openList/closeList/pickLevel), which forwards every event to tools/sat-chara/lib/session.ts (ticking, canPress, pullStart/pullMoved/
\* pullEnd/pullCancel, keyDown/keyUp, freshResultKey, blur/focus/hide/show, pause/resume, openSheet/closeSheet, setSound, humWanted,
\* syncHum), and shared/game-player-client.tsx (blur and hide open the menu once the game is touched; the menu's সব লেভেল resumes, then
\* opens the list; restart calls onRestart).
\* Abstractions: the three balls and "the last ball" are left out (a settled ball either ends the round or lets you throw again); the pull past TAP_SLOP is `dragging`; `fixed` is the two-tap
\* path's "direction fixed, power swings"; `guard` is "under RESUME_GUARD since চালিয়ে যাও, ✕ or a new round"; `fresh` is "the end screen
\* appeared under RESULT_GUARD ago"; the level is left out (SatCharaLevels.tla). A flight is one step, taken only while the session ticks.
\* The keydown event carries `repeat`, which is true exactly while the key is already down (keyDown); the model lets the repeat
\* through the same handler, so the code's own checks are what keep it from acting.
VARIABLES screen, phase, fixed, paused, sheet, visible, focused, hold, dragging, sound, hum, guard, fresh, keyDown, keyFromPlay, badRepeat, badSkip, badThrow
vars == <<screen, phase, fixed, paused, sheet, visible, focused, hold, dragging, sound, hum, guard, fresh, keyDown, keyFromPlay, badRepeat, badSkip, badThrow>>
Flags == <<badRepeat, badSkip, badThrow>>
Page == <<paused, sheet, visible, focused>>

Ticking == screen = "play" /\ ~paused /\ ~sheet /\ visible /\ focused
CanPress == Ticking /\ ~guard
\* syncHum after every event: the hum plays exactly while a real pull aims on a live round with sound on.
SyncHum == hum' = (screen' = "play" /\ ~paused' /\ ~sheet' /\ visible' /\ focused' /\ hold' = "pull" /\ dragging' /\ sound')

Init == /\ screen = "title" /\ phase = "aim" /\ fixed = FALSE /\ paused = FALSE /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hold = "none" /\ dragging = FALSE /\ sound = TRUE /\ hum = FALSE /\ guard = FALSE /\ fresh = FALSE /\ keyDown = FALSE /\ keyFromPlay = FALSE
        /\ badRepeat = FALSE /\ badSkip = FALSE /\ badThrow = FALSE

\* begin(): a fresh round with the ball in the hand; toTitle(): back to a level's title. Both let go and start a breath (closeSheet).
Begin == /\ screen' = "play" /\ phase' = "aim" /\ fixed' = FALSE /\ hold' = "none" /\ dragging' = FALSE
         /\ sheet' = FALSE /\ guard' = TRUE /\ fresh' = FALSE /\ keyFromPlay' = FALSE
ToTitle == /\ screen' = "title" /\ phase' = "aim" /\ fixed' = FALSE /\ hold' = "none" /\ dragging' = FALSE
           /\ sheet' = FALSE /\ guard' = TRUE /\ fresh' = FALSE /\ keyFromPlay' = FALSE

\* ---- the title: খেলো ----
YouStart == /\ screen = "title" /\ visible /\ focused /\ ~paused /\ ~sheet /\ Begin
            /\ UNCHANGED <<paused, visible, focused, sound, keyDown, Flags>> /\ SyncHum

\* ---- the pull: pullStart only while the ball is in the hand and a press can count; pullMoved past the slop; pullEnd throws or taps ----
YouPressTheLane == /\ CanPress /\ phase = "aim" /\ hold = "none" /\ hold' = "pull" /\ dragging' = FALSE
                   /\ UNCHANGED <<screen, phase, fixed, Page, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
YouPullBack == /\ hold = "pull" /\ ~dragging /\ dragging' = TRUE
               /\ UNCHANGED <<screen, phase, fixed, Page, hold, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* pointerup: a real pull throws; a still press is a tap (the first fixes the direction, the second throws); not ticking → nothing.
YouLetGo == /\ hold = "pull" /\ hold' = "none" /\ dragging' = FALSE
            /\ phase' = IF Ticking /\ phase = "aim" /\ (dragging \/ fixed) THEN "flying" ELSE phase
            /\ fixed' = IF Ticking /\ phase = "aim" THEN (IF dragging THEN FALSE ELSE ~fixed) ELSE fixed
            /\ badThrow' = (badThrow \/ (phase' = "flying" /\ phase = "aim" /\ guard))
            /\ UNCHANGED <<screen, Page, sound, guard, fresh, keyDown, keyFromPlay, badRepeat, badSkip>> /\ SyncHum
\* The pull brought back to where it started, pointercancel, or lostpointercapture.
YouCancelThePull == /\ hold = "pull" /\ hold' = "none" /\ dragging' = FALSE
                    /\ UNCHANGED <<screen, phase, fixed, Page, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum

\* ---- Space / Enter: one keydown event, a repeat when keyDown. The window handler routes it by screen. ----
PressInPlay == /\ screen = "play"
               /\ LET acts == ~keyDown /\ hold # "key" /\ CanPress /\ phase = "aim" IN
                  /\ hold' = IF hold = "none" THEN "key" ELSE hold
                  /\ phase' = IF acts /\ fixed THEN "flying" ELSE phase
                  /\ fixed' = IF acts THEN ~fixed ELSE fixed
                  /\ badRepeat' = (badRepeat \/ (keyDown /\ (phase' # phase \/ fixed' # fixed)))
                  /\ badThrow' = (badThrow \/ (phase' = "flying" /\ phase = "aim" /\ guard))
               /\ UNCHANGED <<screen, Page, dragging, sound, guard, fresh, keyFromPlay, badSkip>>
\* On the title only a fresh press starts (a repeat is refused).
PressOnTitle == /\ screen = "title"
                /\ IF ~keyDown THEN Begin ELSE UNCHANGED <<screen, phase, fixed, hold, dragging, sheet, guard, fresh, keyFromPlay>>
                /\ UNCHANGED <<paused, visible, focused, sound, Flags>>
\* On the end screen freshResultKey: not a repeat, and the screen is older than RESULT_GUARD.
PressOnResult == /\ screen = "over"
                 /\ IF ~keyDown /\ ~fresh
                    THEN /\ \/ Begin \/ ToTitle
                         /\ badSkip' = (badSkip \/ keyFromPlay)
                    ELSE /\ UNCHANGED <<screen, phase, fixed, hold, dragging, sheet, guard, fresh, keyFromPlay>> /\ UNCHANGED badSkip
                 /\ UNCHANGED <<paused, visible, focused, sound, badRepeat, badThrow>>
YouPressEnter == /\ visible /\ focused /\ ~paused /\ ~sheet /\ keyDown' = TRUE
                 /\ (PressInPlay \/ PressOnTitle \/ PressOnResult)
                 /\ SyncHum
YouLiftEnter == /\ keyDown /\ keyDown' = FALSE /\ hold' = (IF hold = "key" THEN "none" ELSE hold) /\ keyFromPlay' = FALSE
                /\ UNCHANGED <<screen, phase, fixed, Page, dragging, sound, guard, fresh, Flags>> /\ SyncHum

\* ---- the ball settles (advance → E_SETTLE), only while ticking ----
SomeStillStand == /\ Ticking /\ phase = "flying" /\ phase' = "aim" /\ fixed' = FALSE
                  /\ UNCHANGED <<screen, Page, hold, dragging, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* All seven down, or the last ball gone: finish() → show("over"), which lets go of whatever is held. A key still down is remembered.
RoundEnds == /\ Ticking /\ phase = "flying" /\ screen' = "over" /\ phase' = "aim" /\ fixed' = FALSE /\ fresh' = TRUE
             /\ hold' = "none" /\ dragging' = FALSE /\ keyFromPlay' = keyDown
             /\ UNCHANGED <<Page, sound, guard, keyDown, Flags>> /\ SyncHum
\* RESULT_GUARD passes.
TheResultSettles == /\ fresh /\ fresh' = FALSE
                    /\ UNCHANGED <<screen, phase, fixed, Page, hold, dragging, sound, guard, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* On the end screen, a click on পরের লেভেল (to the next title) or আবার খেলো (into play); সব লেভেল is YouOpenTheList.
YouChooseOnTheResult == /\ screen = "over" /\ ~paused /\ ~sheet /\ visible /\ focused /\ \/ Begin \/ ToTitle
                        /\ UNCHANGED <<paused, visible, focused, sound, keyDown, Flags>> /\ SyncHum

\* ---- away and back ----
\* blur: session.blur lets go; the player opens its menu (the game is only on screen after খেলো on the launch card, so it counts as touched, title included).
WindowBlurs == /\ focused /\ focused' = FALSE /\ hold' = "none" /\ dragging' = FALSE /\ paused' = TRUE
               /\ UNCHANGED <<screen, phase, fixed, sheet, visible, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<screen, phase, fixed, paused, sheet, visible, hold, dragging, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ hold' = "none" /\ dragging' = FALSE /\ paused' = TRUE
            /\ UNCHANGED <<screen, phase, fixed, sheet, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<screen, phase, fixed, paused, sheet, hold, dragging, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* P, ⏸ or Escape: the player's menu (onPause → session.pause lets go).
YouPause == /\ visible /\ focused /\ ~paused /\ paused' = TRUE /\ hold' = "none" /\ dragging' = FALSE
            /\ UNCHANGED <<screen, phase, fixed, sheet, visible, focused, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* চালিয়ে যাও: fresh hands and a short breath (the guard).
YouResume == /\ paused /\ visible /\ focused /\ paused' = FALSE /\ guard' = TRUE /\ hold' = "none" /\ dragging' = FALSE
             /\ UNCHANGED <<screen, phase, fixed, sheet, visible, focused, sound, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* ↻ in the menu: onRestart → resume, then begin().
YouRestart == /\ paused /\ screen # "title" /\ visible /\ focused /\ paused' = FALSE /\ Begin
              /\ UNCHANGED <<visible, focused, sound, keyDown, Flags>> /\ SyncHum
TheBreathPasses == /\ guard /\ guard' = FALSE
                   /\ UNCHANGED <<screen, phase, fixed, Page, hold, dragging, sound, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum

\* ---- সব লেভেল: the badge, the title's button, the end screen's choice, or the pause menu's সব লেভেল (which resumes first) ----
YouOpenTheList == /\ ~sheet /\ ~paused /\ visible /\ focused /\ sheet' = TRUE /\ hold' = "none" /\ dragging' = FALSE
                  /\ UNCHANGED <<screen, phase, fixed, paused, visible, focused, sound, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
YouOpenTheListFromTheMenu == /\ paused /\ ~sheet /\ visible /\ focused /\ paused' = FALSE /\ sheet' = TRUE /\ hold' = "none" /\ dragging' = FALSE /\ guard' = TRUE
                             /\ UNCHANGED <<screen, phase, fixed, visible, focused, sound, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
\* ✕ closes it (a breath before a press counts); a pick goes to that level's title.
YouCloseTheList == /\ sheet /\ ~paused /\ sheet' = FALSE /\ guard' = TRUE
                   /\ UNCHANGED <<screen, phase, fixed, paused, visible, focused, hold, dragging, sound, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
YouPickALevel == /\ sheet /\ ~paused /\ ToTitle /\ UNCHANGED <<paused, visible, focused, sound, keyDown, Flags>> /\ SyncHum

\* ---- sound ----
SoundOff == /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<screen, phase, fixed, Page, hold, dragging, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<screen, phase, fixed, Page, hold, dragging, guard, fresh, keyDown, keyFromPlay, Flags>> /\ SyncHum

Next == YouStart \/ YouPressTheLane \/ YouPullBack \/ YouLetGo \/ YouCancelThePull
        \/ YouPressEnter \/ YouLiftEnter
        \/ SomeStillStand \/ RoundEnds \/ TheResultSettles \/ YouChooseOnTheResult
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume \/ YouRestart \/ TheBreathPasses
        \/ YouOpenTheList \/ YouOpenTheListFromTheMenu \/ YouCloseTheList \/ YouPickALevel \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ phase \in {"aim", "flying"} /\ hold \in {"none", "pull", "key"}
          /\ fixed \in BOOLEAN /\ paused \in BOOLEAN /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ dragging \in BOOLEAN
          /\ sound \in BOOLEAN /\ hum \in BOOLEAN /\ guard \in BOOLEAN /\ fresh \in BOOLEAN /\ keyDown \in BOOLEAN /\ keyFromPlay \in BOOLEAN
          /\ badRepeat \in BOOLEAN /\ badSkip \in BOOLEAN /\ badThrow \in BOOLEAN

\* ---- the reader's rules ----
\* PausedWhenHidden / PausedWhenBlurred: leaving the tab or the window freezes the round, so a ball in the air stays in the air.
PausedWhenHidden == (screen = "play" /\ ~visible) => ~Ticking
PausedWhenBlurred == (screen = "play" /\ ~focused) => ~Ticking
\* ChoiceFreezesPlay: the player's menu or the level list open means nothing flies on.
ChoiceFreezesPlay == (paused \/ sheet) => ~Ticking
\* InputReleasedWhenAway: away, paused or in the list, you hold nothing.
InputReleasedWhenAway == (~focused \/ ~visible \/ paused \/ sheet) => (hold = "none" /\ ~dragging)
\* LoopOnlyWhenMeaningful: the stretch hum plays only while you pull on a live round with sound on.
HumOnlyWhilePulling == hum => (Ticking /\ hold = "pull" /\ dragging /\ sound)
\* LoopComesBack: while you pull on a live round with sound on, you hear it (turning sound on restores it).
HumComesBack == (Ticking /\ hold = "pull" /\ dragging /\ sound) => hum
\* OnePressOneThrow: a held key's auto-repeat never aims or throws.
OnePressOneThrow == ~badRepeat
\* FocusClickIsNotAThrow: nothing throws inside the breath after চালিয়ে যাও, ✕ or a new round.
FocusClickIsNotAThrow == ~badThrow
\* NoKeyPastResult: a key held through the end of a round never skips the result.
NoKeyPastResult == ~badSkip
\* NothingHeldOnTheResult: the end screen never sits over a held ball or a hum.
NothingHeldOnTheResult == screen = "over" => (hold # "pull" /\ ~hum)
====
