---- MODULE Marble ----
\* মার্বেল-সিঁড়ি after the rewrite: the run's screens, সব তলা, the player's pause menu, window focus and the tab, the held side
\* (a key or a finger) and whether it is really down, the roll hum, the delayed celebration, a friend's link, Enter held
\* through the end, and your own unlock.
\* Mirrored from tools/marble-sinri/components/marble.tsx (begin, load, pause, resume, openList, closeList, finishRun, again,
\* the useGamePlayer onPause/onResume/onRestart, the key and pointer handlers, the blur/focus/visibilitychange and hashchange
\* effects, the step's humStep) and the pure rules it calls: lib/session.ts (start, pause, resume, away, back, finish, again,
\* reset, pick, menu, cheerMayPlay, humStep), lib/hands.ts (press, lift, release, direction) and lib/progress.ts (afterClear).
\* shared/game-sound.ts: setSoundOn(false) stops every loop; loop() made while muted is a silent stub. The player's pause sends
\* a blur and calls onPause; its চালিয়ে যাও sends focus and calls onResume.
\* `held` is what the game believes (lib/hands.ts); `hand` is whether a key or finger is really down. Keyup and pointerup
\* reach the page only while it has focus.
\* Full = FALSE (the chart run) leaves out the hand, the second floor, পরের তলা and the held Enter key, and merges a hidden tab
\* into a blur; Full = TRUE (MarbleFull.cfg) checks all of it.
EXTENDS Naturals
CONSTANT Full
VARIABLES phase, picking, menu, visible, focused, held, hand, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared
vars == <<phase, picking, menu, visible, focused, held, hand, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>

Levels == 1..2
\* A friend's link opens floor 2 in the full run (floor 1 in the chart run).
FriendFloor == IF Full THEN 2 ELSE 1
Moving == phase = "playing" /\ ~picking /\ ~menu /\ visible /\ focused
\* The step's humStep, run on the next frame after any change: a real hum exactly while the stairs move with sound on.
\* startHum() while muted makes a silent stub; humStep then starts a fresh loop when sound returns (never ??= the stub).
HumAfter(m, s, h) == IF m /\ s THEN "real" ELSE IF h = "stub" /\ m THEN "stub" ELSE "none"

Init == /\ phase = "title" /\ picking = FALSE /\ menu = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ held = FALSE /\ hand = FALSE /\ hum = "none" /\ sound \in BOOLEAN /\ cheer = FALSE /\ chimedWrong = FALSE
        /\ link \in {"none", "theirs"} /\ seed = (IF link = "theirs" THEN "theirs" ELSE "fresh")
        /\ enter = "up" /\ skipped = FALSE /\ lvl = 1 /\ unlock = 1 /\ cleared = {}

\* load(): a floor's title. clearTimers (the celebration goes), stopHum, release(); reset() bumps the run.
Load(to, theirs) == /\ phase' = "title" /\ picking' = FALSE /\ held' = FALSE /\ hum' = "none" /\ cheer' = FALSE
                    /\ seed' = (IF theirs THEN "theirs" ELSE "fresh")
                    /\ lvl' = to

\* গড়াও, an arrow or Space on the title: sessionStart needs the window; startHum (a stub when muted), then humStep.
YouStart == /\ phase = "title" /\ ~picking /\ ~menu /\ visible /\ focused
            /\ phase' = "playing" /\ held' = FALSE /\ cheer' = FALSE /\ hum' = HumAfter(TRUE, sound, IF sound THEN "real" ELSE "stub")
            /\ UNCHANGED <<picking, menu, visible, focused, hand, sound, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* press(): keydown ← → or a finger down on the board while the stairs move (a key reaching the page means it has focus).
YouHoldSide == /\ Full /\ phase = "playing" /\ ~picking /\ ~menu /\ visible /\ focused /\ ~hand
               /\ hand' = TRUE /\ held' = TRUE
               /\ UNCHANGED <<phase, picking, menu, visible, focused, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* lift(): keyup, pointerup, pointercancel, lost capture. They reach the page only while it has focus.
YouLetGo == /\ hand /\ hand' = FALSE /\ held' = IF focused THEN FALSE ELSE held
            /\ UNCHANGED <<phase, picking, menu, visible, focused, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* blur (real, or the player's synthetic one): release(), away() pauses the stairs or the story, stopHum().
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE /\ hum' = "none"
               /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
               /\ UNCHANGED <<picking, menu, visible, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* focus: back() only; nothing resumes by itself.
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, picking, menu, visible, held, hand, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
TabHides == /\ Full /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ hum' = "none"
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<picking, menu, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
TabShows == /\ Full /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, picking, menu, held, hand, hum, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* P (player.requestPause), the player's ⏸, Escape, leaving full screen: the menu opens (menu(true)), onPause → pause():
\* release() and stopHum(); the stairs pause. It can open over the title or the end screen too.
MenuOpens == /\ ~menu /\ visible /\ focused
             /\ menu' = TRUE /\ held' = FALSE /\ hum' = "none"
             /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
             /\ UNCHANGED <<picking, visible, focused, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* চালিয়ে যাও: the player sends focus (back), menu(false), onResume → resume() (only from paused, list closed), then humStep.
MenuResumes == /\ menu /\ visible
               /\ menu' = FALSE /\ focused' = TRUE
               /\ phase' = IF phase = "paused" /\ ~picking THEN "playing" ELSE phase
               /\ hum' = HumAfter(phase = "paused" /\ ~picking, sound, IF sound THEN "real" ELSE "stub")
               /\ UNCHANGED <<picking, visible, held, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* নতুন করে শুরু in the menu: menu(false), onRestart → load(the same floor).
YouRestart == /\ menu /\ visible
              /\ menu' = FALSE /\ focused' = TRUE /\ Load(lvl, link = "theirs")
              /\ UNCHANGED <<visible, hand, sound, chimedWrong, link, enter, skipped, unlock, cleared>>
\* Our own cover's চালিয়ে যাও, or the first tap back on the board (it only resumes, never rolls the marble).
YouResume == /\ phase = "paused" /\ ~picking /\ ~menu /\ visible /\ focused
             /\ phase' = "playing" /\ held' = FALSE /\ hum' = HumAfter(TRUE, sound, IF sound THEN "real" ELSE "stub")
             /\ UNCHANGED <<picking, menu, visible, focused, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* The floor badge or সব তলা: openList pauses a floor in progress.
YouOpenTheList == /\ ~picking /\ ~menu /\ visible /\ focused /\ phase # "paused"
                  /\ picking' = TRUE /\ held' = FALSE /\ hum' = "none"
                  /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                  /\ UNCHANGED <<menu, visible, focused, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* closeList: resumes what the list paused.
YouCloseTheList == /\ picking /\ ~menu /\ visible /\ focused
                   /\ picking' = FALSE
                   /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
                   /\ hum' = HumAfter(phase \in {"paused", "playing"}, sound, IF sound THEN "real" ELSE "stub")
                   /\ UNCHANGED <<menu, visible, focused, held, hand, sound, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
\* A floor picked from the list (open ones, or the friend's floor 2): its title.
YouPickAFloor(to) == /\ picking /\ ~menu /\ visible /\ focused
                     /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = FriendFloor))
                     /\ Load(to, link # "none" /\ to = FriendFloor)
                     /\ link' = IF link = "none" THEN "none" ELSE IF to = FriendFloor THEN "theirs" ELSE "other"
                     /\ UNCHANGED <<menu, visible, focused, hand, sound, chimedWrong, enter, skipped, unlock, cleared>>
\* stepGame reaches the landing or the last chance goes → finishRun: the card, stopHum, release, stars recorded, your own
\* unlock raised only from the furthest open floor; the celebration queued with later().
FloorEnds == /\ Moving
             /\ phase' = "over" /\ hum' = "none" /\ held' = FALSE /\ cheer' = TRUE
             /\ cleared' = IF Full THEN cleared \cup {lvl} ELSE cleared
             /\ unlock' = IF Full /\ lvl = unlock /\ unlock < 2 THEN unlock + 1 ELSE unlock
             /\ UNCHANGED <<picking, menu, visible, focused, hand, sound, chimedWrong, link, seed, enter, skipped, lvl>>
\* The later() timer fires. It plays only when cheerMayPlay: its own run's card, the list and the menu closed, the window ours.
CheerFires == /\ cheer
              /\ cheer' = FALSE
              /\ LET may == phase = "over" /\ ~picking /\ ~menu /\ visible /\ focused
                 IN chimedWrong' = (chimedWrong \/ (may /\ ~(phase = "over" /\ ~menu /\ visible)))
              /\ UNCHANGED <<phase, picking, menu, visible, focused, held, hand, hum, sound, link, seed, enter, skipped, lvl, unlock, cleared>>
\* আবার (or a fresh Enter/১/২ after the guard): again() clears the timers and bumps the run; a friend's floor keeps their seed.
YouPlayAgain == /\ phase = "over" /\ ~picking /\ ~menu /\ visible /\ focused /\ enter = "up"
                /\ phase' = "playing" /\ cheer' = FALSE /\ held' = FALSE /\ hum' = HumAfter(TRUE, sound, IF sound THEN "real" ELSE "stub")
                /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
                /\ UNCHANGED <<picking, menu, visible, focused, hand, sound, chimedWrong, link, enter, skipped, lvl, unlock, cleared>>
\* পরের তলা (only when the next floor is open to you): its title.
YouGoOn == /\ Full /\ phase = "over" /\ ~picking /\ ~menu /\ visible /\ focused /\ enter = "up" /\ lvl < 2 /\ lvl + 1 <= unlock
           /\ Load(lvl + 1, FALSE)
           /\ link' = IF link = "none" THEN "none" ELSE "other"
           /\ UNCHANGED <<menu, visible, focused, hand, sound, chimedWrong, enter, skipped, unlock, cleared>>
\* hashchange with a valid challenge: load(their floor, their seed), even mid-floor.
FriendLinkOpens == /\ link = "none" /\ visible
                   /\ Load(FriendFloor, TRUE) /\ link' = "theirs"
                   /\ UNCHANGED <<menu, visible, focused, hand, sound, chimedWrong, enter, skipped, unlock, cleared>>
\* Enter pressed while rolling and held through the end; its repeats reach the card. again() and the choices refuse a
\* repeated key or one pressed before the card appeared, so nothing changes (before the rewrite: skipped' = TRUE).
YouHoldEnter == /\ Full /\ phase = "playing" /\ enter = "up" /\ enter' = "held"
                /\ UNCHANGED <<phase, picking, menu, visible, focused, held, hand, hum, sound, cheer, chimedWrong, link, seed, skipped, lvl, unlock, cleared>>
EnterRepeats == /\ Full /\ enter = "held" /\ phase = "over" /\ UNCHANGED vars
YouLetGoOfEnter == /\ Full /\ enter = "held" /\ enter' = "up"
                   /\ UNCHANGED <<phase, picking, menu, visible, focused, held, hand, hum, sound, cheer, chimedWrong, link, seed, skipped, lvl, unlock, cleared>>
\* The site-wide switch. Off stops every loop; on: the next step's humStep starts a new hum if the stairs move.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<phase, picking, menu, visible, focused, held, hand, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = HumAfter(Moving, TRUE, hum)
           /\ UNCHANGED <<phase, picking, menu, visible, focused, held, hand, cheer, chimedWrong, link, seed, enter, skipped, lvl, unlock, cleared>>

Next == YouStart \/ YouHoldSide \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ MenuOpens \/ MenuResumes \/ YouRestart \/ YouResume \/ YouOpenTheList \/ YouCloseTheList \/ (\E to \in (IF Full THEN Levels ELSE {1}) : YouPickAFloor(to))
        \/ FloorEnds \/ CheerFires \/ YouPlayAgain \/ YouGoOn \/ FriendLinkOpens
        \/ YouHoldEnter \/ EnterRepeats \/ YouLetGoOfEnter \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ menu \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ held \in BOOLEAN /\ hand \in BOOLEAN /\ hum \in {"none", "stub", "real"} /\ sound \in BOOLEAN /\ cheer \in BOOLEAN /\ chimedWrong \in BOOLEAN
          /\ link \in {"none", "theirs", "other"} /\ seed \in {"theirs", "fresh"} /\ enter \in {"up", "held"} /\ skipped \in BOOLEAN
          /\ lvl \in Levels /\ unlock \in Levels /\ cleared \subseteq Levels

\* The reader's rules.
NoProgressWhileAway == Moving => (focused /\ visible)
InputReleasedWhenAway == held => (focused /\ visible)
MarbleRollsOnlyWhenHeld == (Moving /\ held) => hand
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
MenuFreezesPlay == menu => phase # "playing"
ChoiceFreezesPlay == picking => phase # "playing"
LoopOnlyWhenMeaningful == (hum = "real" /\ sound) => Moving
LoopComesBack == (Moving /\ sound) => hum = "real"
NoChimeAfterLeaving == (cheer => phase = "over") /\ ~chimedWrong
ReplayIsExact == (link = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
HeldKeyNeverSkips == ~skipped
OpenLevelsAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
====
