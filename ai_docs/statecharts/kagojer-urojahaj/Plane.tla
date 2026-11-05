---- MODULE Plane ----
\* কাগজের উড়োজাহাজ after the rewrite: the flight, the story, the level list, pause, window and tab, the hold (a finger or
\* Space/↑/W), the wind loop, the celebration timer and the end screen's key. Mirrored from
\* tools/kagojer-urojahaj/lib/session.ts (start, storyDone, pause, resume, away, back, press, finish, again, reset, pick,
\* cheerMayPlay, windStep) and tools/kagojer-urojahaj/components/flight-game.tsx (begin, letGo, onPointerDown/Up, the key
\* handler, the blur/visibility effect, openList/closeList, finishRun, the step's windStep check).
\* `grip` is your finger or key: "none" (up), "live" (pressed while flying: it holds the nose up) or "dead" (pressed on
\* another screen, or held through a pause: it holds nothing until you lift it). `held` is what the game counts as holding.
\* `fresh` says a key pressed on the end screen came after it appeared.
VARIABLES phase, picking, visible, focused, grip, held, wind, sound, cheer, fresh
vars == <<phase, picking, visible, focused, grip, held, wind, sound, cheer, fresh>>

Phases == {"title", "story", "flying", "paused", "over"}
OnPage == visible /\ focused
Moving == phase = "flying" /\ ~picking /\ OnPage
NewLoop == IF sound THEN "real" ELSE "none"

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ grip = "none" /\ held = FALSE
        /\ wind = "none" /\ sound = TRUE /\ cheer = FALSE /\ fresh = TRUE

\* begin(): ছোড়ো, Enter on the title. The story plays first on the very first run.
YouThrow == /\ phase = "title" /\ ~picking /\ OnPage
            /\ \E first \in BOOLEAN : /\ phase' = IF first THEN "story" ELSE "flying"
                                      /\ wind' = IF first THEN "none" ELSE NewLoop
            /\ UNCHANGED <<picking, visible, focused, grip, held, sound, cheer, fresh>>
\* A finger on the scene, or Space/↑/W. On the title it throws and holds; flying, it holds; paused, it only resumes.
YouPress == /\ grip = "none" /\ OnPage
            /\ IF phase = "title" /\ ~picking THEN /\ phase' = "flying" /\ grip' = "live" /\ held' = TRUE /\ wind' = NewLoop /\ UNCHANGED fresh
               ELSE IF phase = "flying" /\ ~picking THEN /\ grip' = "live" /\ held' = TRUE /\ UNCHANGED <<phase, wind, fresh>>
               ELSE IF phase = "paused" /\ ~picking THEN /\ phase' = "flying" /\ grip' = "dead" /\ held' = FALSE /\ wind' = NewLoop /\ UNCHANGED fresh
               ELSE /\ grip' = "dead" /\ fresh' = (phase = "over") /\ UNCHANGED <<phase, held, wind>>
            /\ UNCHANGED <<picking, visible, focused, sound, cheer>>
\* pointerup / keyup. In another window the release never reaches the page (the blur already let go).
YouLetGo == /\ grip # "none"
            /\ grip' = "none" /\ held' = IF OnPage THEN FALSE ELSE held
            /\ UNCHANGED <<phase, picking, visible, focused, wind, sound, cheer, fresh>>
\* The story's last panel, or holding to skip it.
StoryEnds == /\ phase = "story" /\ ~picking /\ OnPage
             /\ phase' = "flying" /\ held' = FALSE /\ wind' = NewLoop
             /\ UNCHANGED <<picking, visible, focused, grip, sound, cheer, fresh>>
\* finishRun(): a landing or the last page down. The wind stops; a celebration may be queued; a key still down is not fresh.
TheFlightEnds == /\ Moving
                 /\ phase' = "over" /\ wind' = "none" /\ held' = FALSE /\ cheer' \in BOOLEAN /\ fresh' = (grip = "none")
                 /\ UNCHANGED <<picking, visible, focused, grip, sound>>
\* The later() timer fires; cheerMayPlay lets it sound only on its own run's end screen.
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<phase, picking, visible, focused, grip, held, wind, sound, fresh>>
\* আবার খেলো or পরের লেভেল (a button), or Enter/Space on the end screen (only a fresh press, after the guard).
YouPlayAgain == /\ phase = "over" /\ ~picking /\ OnPage
                /\ \E byKey \in BOOLEAN : byKey => (fresh /\ grip = "none")
                /\ phase' = "flying" /\ wind' = NewLoop /\ cheer' = FALSE /\ held' = FALSE
                /\ UNCHANGED <<picking, visible, focused, grip, sound, fresh>>
\* নতুন করে শুরু, a level picked in the list, ‹ › on the title, a friend's link: back to a title. Timers are dropped.
YouReset == /\ OnPage
            /\ phase' = "title" /\ picking' = FALSE /\ held' = FALSE /\ wind' = "none" /\ cheer' = FALSE
            /\ UNCHANGED <<visible, focused, grip, sound, fresh>>
\* The badge or সব লেভেল opens the list: a choice screen, so it pauses a flight or the story and lets go.
YouOpenTheList == /\ ~picking /\ OnPage
                  /\ picking' = TRUE /\ held' = FALSE /\ wind' = "none"
                  /\ phase' = IF phase \in {"flying", "story"} THEN "paused" ELSE phase
                  /\ grip' = IF grip = "live" THEN "dead" ELSE grip
                  /\ UNCHANGED <<visible, focused, sound, cheer, fresh>>
\* ✕ on the list: back to the flight it paused, after a breath.
YouCloseTheList == /\ picking /\ OnPage
                   /\ picking' = FALSE
                   /\ phase' = IF phase = "paused" THEN "flying" ELSE phase
                   /\ wind' = IF phase = "paused" THEN NewLoop ELSE wind
                   /\ UNCHANGED <<visible, focused, grip, held, sound, cheer, fresh>>
\* P (player.requestPause) or the player's ⏸: freezes the flight or the story and lets go.
YouPause == /\ phase \in {"flying", "story"} /\ ~picking /\ OnPage
            /\ phase' = "paused" /\ held' = FALSE /\ wind' = "none" /\ grip' = IF grip = "live" THEN "dead" ELSE grip
            /\ UNCHANGED <<picking, visible, focused, sound, cheer, fresh>>
\* চালিয়ে যাও (or our own cover): back after a breath; a finger still down holds nothing.
YouResume == /\ phase = "paused" /\ ~picking /\ OnPage
             /\ phase' = "flying" /\ held' = FALSE /\ wind' = NewLoop /\ grip' = IF grip = "live" THEN "dead" ELSE grip
             /\ UNCHANGED <<picking, visible, focused, sound, cheer, fresh>>
\* The blur listener (and the player's own pause on blur): letGo(), away(), stopWind().
WindowBlurs == /\ OnPage
               /\ focused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ grip' = IF grip = "live" THEN "dead" ELSE grip
               /\ phase' = IF phase \in {"flying", "story"} THEN "paused" ELSE phase
               /\ UNCHANGED <<picking, visible, sound, cheer, fresh>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, picking, visible, grip, held, wind, sound, cheer, fresh>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ grip' = IF grip = "live" THEN "dead" ELSE grip
            /\ phase' = IF phase \in {"flying", "story"} THEN "paused" ELSE phase
            /\ UNCHANGED <<picking, sound, cheer, fresh>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, picking, grip, held, wind, sound, cheer, fresh>>
\* The player's sound switch. Off: the step's windStep stops the loop. On: it makes a new one while the flight moves.
SoundOff == /\ sound /\ sound' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, picking, visible, focused, grip, held, cheer, fresh>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ wind' = IF Moving THEN "real" ELSE wind
           /\ UNCHANGED <<phase, picking, visible, focused, grip, held, cheer, fresh>>

Next == YouThrow \/ YouPress \/ YouLetGo \/ StoryEnds \/ TheFlightEnds \/ TheCheerPlays \/ YouPlayAgain \/ YouReset
        \/ YouOpenTheList \/ YouCloseTheList \/ YouPause \/ YouResume
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ grip \in {"none", "live", "dead"} /\ held \in BOOLEAN /\ wind \in {"none", "real"} /\ sound \in BOOLEAN
          /\ cheer \in BOOLEAN /\ fresh \in BOOLEAN

\* The reader's rules.
\* The flight moves only while you are on the page.
NoProgressWhileAway == (phase = "flying" /\ ~picking) => OnPage
\* After you click away, the game doesn't think you are still holding.
InputReleasedWhenAway == held => OnPage
\* The nose goes up only while a finger or key, pressed during the flight, is really down.
PlaneMovesOnlyWhenHeld == held => (grip = "live" /\ phase = "flying" /\ ~picking)
\* The tap that brings you back (or a press on any other screen) is never a hold.
FocusTapIsNotAMove == grip = "dead" => ~held
PausedWhenHidden == ~visible => phase \notin {"flying", "story"}
PausedWhenBlurred == ~focused => phase \notin {"flying", "story"}
\* While the level list is open, nothing flies.
ChoiceFreezesPlay == picking => phase # "flying"
\* The wind is heard only while the flight moves in front of you with sound on, and then it is.
LoopOnlyWhenMeaningful == wind = "real" => (Moving /\ sound)
LoopComesBack == (Moving /\ sound) => wind = "real"
\* A celebration is heard only on its own end screen.
NoCheerAfterLeaving == cheer => phase = "over"
====
