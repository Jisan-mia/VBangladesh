---- MODULE SatChara ----
\* সাত চাড়া, the play: the throw, the aim, pause and window focus, the pull hum and the held Enter key.
\* Mirrored from tools/sat-chara/components/sat-chara-game.tsx (startLevel, launch, tap, settle, win, tick, hide, resume,
\* the window keydown handler, onPointerDown/Move/Up/Cancel, the SoundToggle onChange, the result buttons),
\* shared/game-kit.ts (useGameLoop as of 6775639: it cancels its frame while hidden and, since that commit, on window blur until focus),
\* shared/game-sound.ts (loop(); setSoundOn → stopLoops; nothing stops a loop on blur)
\* and tools/sat-chara/lib/sound.ts (stretch = loop("hum")). Saved levels and friend links are in SatCharaLevels.tla.
\* Abstractions: the three balls become "this throw was not the last" / "this was the last"; the pull (pointerdown plus a
\* move past TAP_SLOP) is one step; aim "keys" acts like "power" (the next tap throws); which level is played is left out.
VARIABLES phase, aim, paused, visible, focused, hum, sound, key, keyThrew, endedAway
vars == <<phase, aim, paused, visible, focused, hum, sound, key, keyThrew, endedAway>>

Phases == {"aim", "flying", "clear", "fail"}
Aims == {"sweep", "power", "drag"}

\* The loop steps the flight only while not paused, the tab shows and the window has focus (the loop's own `away` flag).
\* Nothing in the game itself knows: there is no overlay, and the hum and input are untouched.
Flies == phase = "flying" /\ ~paused /\ visible /\ focused
Here == visible /\ focused          \* clicks and key presses reach the page

Init == /\ phase = "aim" /\ aim = "sweep" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hum = FALSE /\ sound = TRUE /\ key = FALSE /\ keyThrew = FALSE /\ endedAway = FALSE

\* startLevel(): stopHum, a fresh pile, unpause, aim "sweep", phase "aim".
Start == /\ phase' = "aim" /\ aim' = "sweep" /\ paused' = FALSE /\ hum' = FALSE

\* ---- the pointer ----
\* onPointerDown (aim, not paused), then onPointerMove past TAP_SLOP: setAim("drag"); live.hum ??= stretch()
\* (loop() hands back a silent stub when sound is off).
YouPullBack == /\ Here /\ phase = "aim" /\ ~paused /\ aim # "drag"
               /\ aim' = "drag" /\ hum' = sound
               /\ UNCHANGED <<phase, paused, visible, focused, sound, key, keyThrew, endedAway>>
\* onPointerUp after a real pull: launch() → stopHum, release(), phase "flying". Pointer capture delivers it even without focus.
YouLetGo == /\ visible /\ phase = "aim" /\ aim = "drag" /\ ~paused
            /\ phase' = "flying" /\ aim' = "sweep" /\ hum' = FALSE /\ keyThrew' = FALSE
            /\ UNCHANGED <<paused, visible, focused, sound, key, endedAway>>
\* onPointerUp back where it started (pullAim() < 14), or onPointerCancel: stopHum, aim "sweep", no throw.
YouPullBackToStart == /\ visible /\ aim = "drag"
                      /\ aim' = "sweep" /\ hum' = FALSE
                      /\ UNCHANGED <<phase, paused, visible, focused, sound, key, keyThrew, endedAway>>

\* ---- taps: the big button or a still tap on the board ----
\* tap(): sweep → power (the direction is fixed); power → launch().
TapEffect == IF aim = "sweep" THEN /\ aim' = "power" /\ UNCHANGED <<phase, hum>>
             ELSE /\ phase' = "flying" /\ aim' = "sweep" /\ hum' = FALSE
YouTap == /\ Here /\ phase = "aim" /\ ~paused /\ aim # "drag" /\ TapEffect /\ keyThrew' = FALSE
          /\ UNCHANGED <<paused, visible, focused, sound, key, endedAway>>

\* ---- Space / Enter on the page (the window keydown handler never checks event.repeat) ----
\* paused → resume(); aim → tap(); fail → startLevel(level); clear → startLevel(level + 1).
EnterEffect == \/ /\ paused /\ paused' = FALSE /\ UNCHANGED <<phase, aim, hum>>
               \/ /\ ~paused /\ phase = "aim" /\ aim # "drag" /\ TapEffect /\ UNCHANGED paused
               \/ /\ ~paused /\ phase \in {"clear", "fail"} /\ Start
YouPressEnter == /\ Here /\ ~key /\ key' = TRUE /\ EnterEffect /\ keyThrew' = FALSE
                 /\ UNCHANGED <<visible, focused, sound, endedAway>>
\* Holding the key: the browser repeats keydown about 30 times a second after half a second, and each repeat acts again.
EnterRepeats == /\ Here /\ key /\ EnterEffect
                /\ keyThrew' = (keyThrew \/ phase' = "flying")
                /\ UNCHANGED <<visible, focused, sound, key, endedAway>>
YouLiftEnter == /\ key /\ key' = FALSE
                /\ UNCHANGED <<phase, aim, paused, visible, focused, hum, sound, keyThrew, endedAway>>

\* ---- the flight settles (settle() from tick) ----
AllSevenDown == /\ Flies /\ phase' = "clear" /\ endedAway' = (endedAway \/ ~focused)
                /\ UNCHANGED <<aim, paused, visible, focused, hum, sound, key, keyThrew>>
SomeStillStand == /\ Flies /\ phase' = "aim" /\ aim' = "sweep" /\ endedAway' = (endedAway \/ ~focused)
                  /\ UNCHANGED <<paused, visible, focused, hum, sound, key, keyThrew>>
LastBallGone == /\ Flies /\ phase' = "fail" /\ endedAway' = (endedAway \/ ~focused)
                /\ UNCHANGED <<aim, paused, visible, focused, hum, sound, key, keyThrew>>

\* ---- away and back ----
\* There is no blur listener in the game. The OS stops a key's repeat when focus leaves.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ key' = FALSE
               /\ UNCHANGED <<phase, aim, paused, visible, hum, sound, keyThrew, endedAway>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, aim, paused, visible, hum, sound, key, keyThrew, endedAway>>
\* hide(): stopHum, drop the pull (drag → sweep), pause only a flying ball.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ key' = FALSE /\ hum' = FALSE
            /\ aim' = IF aim = "drag" THEN "sweep" ELSE aim
            /\ paused' = (paused \/ phase = "flying")
            /\ UNCHANGED <<phase, sound, keyThrew, endedAway>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, aim, paused, hum, sound, key, keyThrew, endedAway>>
\* The চালিয়ে যাও button on the overlay.
YouResume == /\ Here /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<phase, aim, visible, focused, hum, sound, key, keyThrew, endedAway>>

\* ---- sound ----
\* SoundToggle off: setSoundOn(false) → stopLoops(); onChange sets live.hum = null.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, aim, paused, visible, focused, key, keyThrew, endedAway>>
\* SoundToggle on: onChange does nothing for on, and onPointerMove makes the hum only on the first move past TAP_SLOP.
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, aim, paused, visible, focused, hum, key, keyThrew, endedAway>>

\* ---- পরের লেভেল / আবার খেলো / আরেকবার, and a pick in সব লেভেল (any time) ----
YouMoveOn == /\ Here /\ phase \in {"clear", "fail"} /\ Start
             /\ UNCHANGED <<visible, focused, sound, key, keyThrew, endedAway>>
PickLevel == /\ Here /\ phase \in {"aim", "flying"} /\ Start
             /\ UNCHANGED <<visible, focused, sound, key, keyThrew, endedAway>>

Next == YouPullBack \/ YouLetGo \/ YouPullBackToStart \/ YouTap
        \/ YouPressEnter \/ EnterRepeats \/ YouLiftEnter
        \/ AllSevenDown \/ SomeStillStand \/ LastBallGone
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ SoundOff \/ SoundOn \/ YouMoveOn \/ PickLevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ aim \in Aims /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ key \in BOOLEAN /\ keyThrew \in BOOLEAN /\ endedAway \in BOOLEAN

\* ---- the reader's rules ----
\* PausedWhenHidden: a ball in the air stops when the tab hides.
PausedWhenHidden == (~visible /\ phase = "flying") => paused
\* NoProgressWhileAway: a ball in the air doesn't fly on, and the throw doesn't end, while you're in another window.
NoProgressWhileAway == ~endedAway
\* InputReleasedWhenAway: after you leave the window, you're not holding the ball any more.
InputReleasedWhenAway == ~focused => aim # "drag"
\* PausedMeansFrozen: the pause overlay covers only a ball in the air, with nothing held and no hum behind it.
PausedMeansFrozen == paused => (phase = "flying" /\ aim # "drag" /\ ~hum)
\* HumOnlyWhilePulling (LoopOnlyWhenMeaningful): the stretch hum plays only while you pull the ball back, on the page, with sound on.
HumOnlyWhilePulling == hum => (phase = "aim" /\ aim = "drag" /\ visible /\ focused /\ sound /\ ~paused)
\* HumComesBack (LoopComesBack): while you pull with sound on, you hear the hum.
HumComesBack == (phase = "aim" /\ aim = "drag" /\ Here /\ sound) => hum
\* OnePressOneThrow: a ball is thrown only by a press you meant, never by a held key's repeat.
OnePressOneThrow == ~keyThrew
\* NoHeldBallOnTheResult: the stars or the "three balls gone" screen never sit over a held ball or a hum.
NothingHeldOnTheResult == phase \in {"clear", "fail"} => (aim # "drag" /\ ~hum /\ ~paused)
====
