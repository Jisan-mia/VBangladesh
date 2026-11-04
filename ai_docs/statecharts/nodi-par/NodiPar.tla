---- MODULE NodiPar ----
EXTENDS Naturals
\* নদী পার: the crossing, pause and focus, the water loop, the river list, a friend's link arriving mid-crossing,
\* and the cheer timer, mirrored from tools/nodi-par/components/river-game.tsx (with shared/game-kit.ts useGameLoop
\* and shared/game-sound.ts loop()). The page is not inside the shared game player (tools/nodi-par/page.tsx).
\*
\* phase:    React's phase: "ready" | "playing" | "paused" | "over".
\* level:    the river the page shows and saves under (`level` state; useBest's key follows it). Rivers 1 and 2 stand
\*           for "yours" and "a friend's".
\* runLevel: the river run.current was built from (createRun(riverRef.current) in start()); 0 = no run.
\* misSaved: the card on screen comes from a finish() that wrote stars and the best time under a river other than the one
\*           crossed (cleared when the card goes away, since only the card shows it).
\* water:    a real "wind" loop is sounding (startWater() with sound on).
\* cheer:    the 260·(stars+1) ms setTimeout in finish() (win/confetti or sfx.good) is still pending. Nothing clears it.
\* key:      Space (or Enter) is held down and its auto-repeat reaches the page (a blur or hide ends the stream).
VARIABLES phase, level, runLevel, misSaved, visible, focused, water, sound, drawer, cheer, key
vars == <<phase, level, runLevel, misSaved, visible, focused, water, sound, drawer, cheer, key>>

Here == visible /\ focused
\* useGameLoop runs for "playing". Since 6775639 (Nov 4) it also freezes rAF on window blur and on hide, and restarts
\* on focus / show: the river stands still while you're away, but the game itself is not paused.
Loop == visible /\ focused /\ phase = "playing"

Init == /\ phase = "ready" /\ level = 1 /\ runLevel = 0 /\ misSaved = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ water = FALSE /\ sound = TRUE /\ drawer = FALSE /\ cheer = FALSE /\ key = FALSE

\* start(): a run on the river showing now, the water loop on. From the ready card, a tap, a key, or নদীর শুরু থেকে.
YouStart == /\ Here /\ phase \in {"ready", "paused"}
            /\ phase' = "playing" /\ runLevel' = level /\ water' = sound
            /\ misSaved' = FALSE /\ UNCHANGED <<level, visible, focused, sound, drawer, cheer, key>>
\* restart() from the card (after the 450 ms guard): the same start(); the cheer timer is not cleared.
YouPlayAgain == /\ Here /\ phase = "over"
                /\ phase' = "playing" /\ runLevel' = level /\ water' = sound
                /\ misSaved' = FALSE /\ UNCHANGED <<level, visible, focused, sound, drawer, cheer, key>>
\* stepRun → done → finish(played): stopWater, levels.record(level, …), submitBest under `level`, queue the cheer.
YouReachTheGhat == /\ Loop
                   /\ phase' = "over" /\ misSaved' = (level # runLevel) /\ water' = FALSE /\ cheer' = TRUE
                   /\ UNCHANGED <<level, runLevel, visible, focused, sound, drawer, key>>
CheerFires == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, water, sound, drawer, key>>
\* থামাও, P, Esc, or the stage scrolled out of view: pause() stops the water.
YouPause == /\ Here /\ phase = "playing" /\ phase' = "paused" /\ water' = FALSE
            /\ UNCHANGED <<level, runLevel, misSaved, visible, focused, sound, drawer, cheer, key>>
\* resume(): back to playing, startWater().
YouResume == /\ Here /\ phase = "paused" /\ phase' = "playing" /\ water' = sound
             /\ UNCHANGED <<level, runLevel, misSaved, visible, focused, sound, drawer, cheer, key>>
\* The game has no blur or focus listener; only useGameLoop's freezes the river.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ key' = FALSE /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, water, sound, drawer, cheer>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, water, sound, drawer, cheer, key>>
\* visibilitychange → hidden: pause() (only acts from "playing").
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ water' = IF phase = "playing" THEN FALSE ELSE water
            /\ key' = FALSE /\ UNCHANGED <<level, runLevel, misSaved, sound, drawer, cheer>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, level, runLevel, misSaved, water, sound, drawer, cheer, key>>
\* soundChanged(): off → stopWater; on → startWater only while playing.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ water' = FALSE
            /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, drawer, cheer, key>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE /\ water' = (water \/ phase = "playing")
           /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, drawer, cheer, key>>
\* <details> সব নদী: opening it does nothing to the crossing.
YouOpenRivers == /\ Here /\ ~drawer /\ drawer' = TRUE
                 /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, water, sound, cheer, key>>
YouCloseRivers == /\ Here /\ drawer /\ drawer' = FALSE
                  /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, water, sound, cheer, key>>
\* pickRiver(next) from the list or পরের নদী: stopWater, run = null, the ready card (the cheer timer is not cleared).
\* Modelled as going back to your own river 1; the friend's river 2 comes only from a link.
YouPickARiver == /\ Here /\ (drawer \/ phase = "over")
                 /\ level' = 1
                 /\ phase' = "ready" /\ runLevel' = 0 /\ water' = FALSE
                 /\ misSaved' = FALSE /\ UNCHANGED <<visible, focused, sound, drawer, cheer, key>>
\* hashchange with a challenge link: readFriend() sets the level to the friend's river and the ready card,
\* except while playing, when only the level changes and run.current keeps crossing the old river.
FriendLinkArrives == /\ visible /\ level # 2
                     /\ level' = 2
                     /\ phase' = IF phase = "playing" THEN "playing" ELSE "ready"
                     /\ UNCHANGED <<runLevel, misSaved, visible, focused, water, sound, drawer, cheer, key>>

\* The key handler on the card: restart() once 450 ms have passed, with no event.repeat check (the crossing branch
\* ignores repeats). So Space held through the last hop restarts the river from its auto-repeat, until the 600 ms
\* focus moves to পরের নদী. A fresh press on the card is YouPlayAgain.
YouHoldSpaceForTheLastHop == /\ Here /\ phase = "playing" /\ ~key /\ key' = TRUE
                             /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, water, sound, drawer, cheer>>
SpaceRepeatsOnTheCard == /\ Here /\ key /\ phase = "over"
                         /\ phase' = "playing" /\ runLevel' = level /\ water' = sound
                         /\ misSaved' = FALSE /\ UNCHANGED <<level, visible, focused, sound, drawer, cheer, key>>
YouLetGoOfSpace == /\ focused /\ key /\ key' = FALSE
                   /\ UNCHANGED <<phase, level, runLevel, misSaved, visible, focused, water, sound, drawer, cheer>>

Next == YouStart \/ YouPlayAgain \/ YouReachTheGhat \/ CheerFires \/ YouPause \/ YouResume \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn \/ YouOpenRivers \/ YouCloseRivers \/ YouPickARiver \/ FriendLinkArrives
        \/ YouHoldSpaceForTheLastHop \/ SpaceRepeatsOnTheCard \/ YouLetGoOfSpace

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ level \in {1, 2} /\ runLevel \in 0..2 /\ misSaved \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ water \in BOOLEAN /\ sound \in BOOLEAN
          /\ drawer \in BOOLEAN /\ cheer \in BOOLEAN /\ key \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
WaterOnlyWhileCrossing == water => (phase = "playing" /\ visible /\ focused /\ sound)
WaterComesBack == (phase = "playing" /\ visible /\ sound) => water
LevelPickerFreezesPlay == drawer => phase # "playing"
CheerOnlyOnTheCard == cheer => phase = "over"
\* The page names, and saves under, the river you are actually crossing.
ShownRiverIsTheOneCrossed == phase \in {"playing", "paused"} => level = runLevel
SavedUnderTheRiverCrossed == phase = "over" => ~misSaved
\* The card stays until you press a key fresh (or tap a button).
CardNeedsAFreshPress == [][~(phase = "over" /\ phase' # "over" /\ key /\ key')]_vars
\* The river only moves while you're on the page.
NoProgressWhileAway == [][YouReachTheGhat => (visible /\ focused)]_vars
====
