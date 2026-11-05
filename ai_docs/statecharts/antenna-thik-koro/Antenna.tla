---- MODULE Antenna ----
\* অ্যান্টেনা ঠিক করো after the rewrite: the screens, the shared player's pause, window focus, the hand on the dial,
\* the static loop and the card's chimes. Mirrored from tools/antenna-thik-koro/components/antenna.tsx (begin, finish,
\* the blur/focus/visibility effect, the sound effect, useGamePlayer's onPause/onResume/onRestart), lib/session.ts
\* (ticking, canTurn, wantHiss, syncLoops, blur, hide, pause, resume, press, release) and shared/game-player-client.tsx
\* (blur and hide open the menu once you've touched the game; চালিয়ে যাও sends a focus first; pausing cuts scheduled tones).
\* The before-fix model of the old code is in before-fix/; this file is the code as it is now.
VARIABLES phase, paused, visible, focused, held, hiss, sound, engaged, chime
vars == <<phase, paused, visible, focused, held, hiss, sound, engaged, chime>>

Phases == {"title", "ready", "search", "got", "over"}
PlayPhases == {"ready", "search", "got"}
\* The round is on and the menu is shut (the old model's "the game loop steps").
Running == ~paused /\ phase \in PlayPhases
\* session.ticking: the loop actually steps only with the tab showing and the window focused too (useGameLoop and step()).
Ticking == Running /\ visible /\ focused
\* session.wantHiss, as syncLoops applies it after every event and every step.
WantHiss(p, pa, vi, fo, so) == ~pa /\ p \in {"ready", "search"} /\ vi /\ fo /\ so

Init == /\ phase = "title" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ held = FALSE /\ hiss = FALSE /\ sound \in BOOLEAN /\ engaged = FALSE /\ chime = FALSE

\* Tap the set (or Enter) on the title: begin() shows the play screen and syncs the loops. (The first-run story is a
\* screen of its own before this with no loops or timers that matter here.)
YouTapTheSet == /\ phase = "title" /\ ~paused /\ visible /\ focused
                /\ phase' = "ready" /\ engaged' = TRUE
                /\ hiss' = WantHiss("ready", FALSE, TRUE, TRUE, sound)
                /\ UNCHANGED <<paused, visible, focused, held, sound, chime>>
\* press(): only while the game steps; the first turn starts the clock.
YouHoldTurn == /\ Ticking /\ ~held
               /\ held' = TRUE
               /\ phase' = IF phase = "ready" THEN "search" ELSE phase
               /\ hiss' = WantHiss(phase', paused, visible, focused, sound)
               /\ UNCHANGED <<paused, visible, focused, sound, engaged, chime>>
\* keyup or pointerup reach the page only while it has focus.
YouLetGo == /\ held /\ focused /\ held' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, hiss, sound, engaged, chime>>
\* window blur: session.blur lets go of everything; the player opens the menu once you've touched the game.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE /\ hiss' = FALSE
               /\ paused' = (paused \/ engaged)
               /\ chime' = (chime /\ ~engaged)
               /\ UNCHANGED <<phase, visible, sound, engaged>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE
                 /\ hiss' = WantHiss(phase, paused, TRUE, TRUE, sound)
                 /\ UNCHANGED <<phase, paused, visible, held, sound, engaged, chime>>
\* visibilitychange → hidden: session.hide, and the player's menu.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ hiss' = FALSE
            /\ paused' = (paused \/ engaged)
            /\ chime' = (chime /\ ~engaged)
            /\ UNCHANGED <<phase, sound, engaged>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE
            /\ hiss' = WantHiss(phase, paused, TRUE, TRUE, sound)
            /\ UNCHANGED <<phase, paused, held, sound, engaged, chime>>
\* Escape or the ⏸ button: openMenu → pointercancel, blur, silenceScheduled, onPause (session.pause, sync).
YouOpenTheMenu == /\ engaged /\ ~paused /\ visible
                  /\ paused' = TRUE /\ held' = FALSE /\ hiss' = FALSE /\ chime' = FALSE /\ focused' = FALSE
                  /\ UNCHANGED <<phase, visible, sound, engaged>>
\* চালিয়ে যাও: a synthetic focus, then onResume (session.resume: fresh hands, sync).
YouResume == /\ paused /\ visible
             /\ paused' = FALSE /\ focused' = TRUE /\ held' = FALSE
             /\ hiss' = WantHiss(phase, FALSE, TRUE, TRUE, sound)
             /\ UNCHANGED <<phase, visible, sound, engaged, chime>>
\* নতুন করে শুরু: focus, then onRestart → begin() on the same level, which also cuts queued tones.
YouRestart == /\ paused /\ visible /\ phase \in PlayPhases \cup {"over"}
              /\ paused' = FALSE /\ focused' = TRUE /\ held' = FALSE /\ phase' = "ready" /\ chime' = FALSE
              /\ hiss' = WantHiss("ready", FALSE, TRUE, TRUE, sound)
              /\ UNCHANGED <<visible, sound, engaged>>
SignalLocks == /\ Ticking /\ phase = "search" /\ phase' = "got" /\ hiss' = FALSE
               /\ UNCHANGED <<paused, visible, focused, held, sound, engaged, chime>>
NextChannel == /\ Ticking /\ phase = "got" /\ phase' = "search"
               /\ hiss' = WantHiss("search", paused, visible, focused, sound)
               /\ UNCHANGED <<paused, visible, focused, held, sound, engaged, chime>>
\* finish(): the card, then the ident and the star chimes as scheduled tones (with sound off, tone() plays nothing).
LastChannel == /\ Ticking /\ phase = "got" /\ phase' = "over" /\ hiss' = FALSE /\ held' = FALSE /\ chime' = sound
               /\ UNCHANGED <<paused, visible, focused, sound, engaged>>
\* The tones end on their own after about 1.5 s.
ChimesEnd == chime /\ chime' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, held, hiss, sound, engaged>>
\* The site-wide switch (the menu, or the desktop bar while playing). Off: the kit stops loops, the game cuts queued tones.
SoundOff == /\ sound /\ sound' = FALSE /\ hiss' = FALSE /\ chime' = FALSE /\ UNCHANGED <<phase, paused, visible, focused, held, engaged>>
\* On: the sound effect runs syncLoops at once.
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ hiss' = WantHiss(phase, paused, visible, focused, TRUE)
           /\ UNCHANGED <<phase, paused, visible, focused, held, engaged, chime>>
\* The card's ১ ২ ৩ (or a fresh Enter): begin() a new evening, cutting the card's tones.
YouPlayOn == /\ phase = "over" /\ ~paused /\ visible /\ focused
             /\ phase' = "ready" /\ chime' = FALSE
             /\ hiss' = WantHiss("ready", FALSE, TRUE, TRUE, sound)
             /\ UNCHANGED <<paused, visible, focused, held, sound, engaged>>

Next == YouTapTheSet \/ YouHoldTurn \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouOpenTheMenu
        \/ YouResume \/ YouRestart \/ SignalLocks \/ NextChannel \/ LastChannel \/ ChimesEnd \/ SoundOff \/ SoundOn \/ YouPlayOn

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ held \in BOOLEAN
          /\ hiss \in BOOLEAN /\ sound \in BOOLEAN /\ engaged \in BOOLEAN /\ chime \in BOOLEAN

\* The reader's rules. The first five are the old model's, word for word; the two that broke are the first two.
DialStillWhileAway == (held /\ Running) => focused
StaticWhileSearching == (phase = "search" /\ Running /\ visible /\ sound) => hiss
StaticOnlyWhileListening == (hiss /\ phase = "search") => (visible /\ ~paused /\ sound)
HiddenMeansPaused == (~visible /\ phase \in {"search", "got"}) => paused
NoStaticOnTheCard == phase = "over" => ~hiss
\* New with the rewrite.
PausedWhenBlurred == (~focused /\ phase \in PlayPhases) => paused
NoProgressWhileAway == Ticking => (visible /\ focused /\ ~paused)
InputReleasedWhenAway == (~focused \/ ~visible \/ paused) => ~held
LoopComesBack == (Ticking /\ sound /\ phase \in {"ready", "search"}) => hiss
StaticOnlyWhenMeaningful == hiss => (Ticking /\ sound /\ phase \in {"ready", "search"})
CelebrationOnItsOwnCard == chime => (phase = "over" /\ ~paused /\ sound)
====
