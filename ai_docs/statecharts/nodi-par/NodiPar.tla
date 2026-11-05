---- MODULE NodiPar ----
\* নদী পার after the rewrite: the crossing's screens (title, the first-run story, crossing, paused, the card), সব নদী, window focus, the
\* water (the one sound loop), a finger in its 40 ms tap-or-swipe window, the delayed cheer, a friend's link arriving mid-crossing,
\* Space held through the last hop, the tap that brings you back, and your own unlock.
\* Mirrored from tools/nodi-par/components/river-game.tsx (begin, endStory, load, pause, resume, openList, closeList, finishRun, again,
\* steerWater, the key and pointer handlers, the blur/focus/visibilitychange and hashchange effects) and the pure rules it calls:
\* lib/session.ts (start, storyDone, pause, resume, away, back, finish, again, choiceOk, reset, pick, cheerMayPlay, canHop, moving, loopStep)
\* and lib/progress.ts (afterClear, playable). The player's pause sends a blur and calls onPause; its resume sends focus and calls onResume.
\* shared/game-sound.ts: setSoundOn(false) stops every loop; loop() made while muted is a silent stub, so loopStep makes a new one.
\* Full = FALSE (the chart run) has two rivers (river 2 is the friend's), sound on, and leaves out the finger in its 40 ms window, the held Space
\* and a hidden tab; Full = TRUE adds those, a third river and the sound switch.
\* (The story is modelled as a screen you finish; a pause inside it freezes it the same way and is not drawn.)
EXTENDS Naturals, FiniteSets
CONSTANT Full
VARIABLES phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung
vars == <<phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

Top == IF Full THEN 3 ELSE 2
Levels == 1..Top
\* water: the loop is live (not a stub). cheer: "none", "this" (queued for the card on screen) or "old". played: a cheer played off its own card
\* (the bug; never). recorded: the river the card's stars were saved under (0 until a crossing ends). runLvl: the river the crossing began on.
\* touch: a finger is down on the river inside the 40 ms window. skipped: a held Space took the card's choice (never). swung: a tap while paused hopped (never).
Moving == phase = "playing" /\ ~picking /\ visible /\ focused

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ water = FALSE /\ sound = TRUE /\ cheer = "none" /\ played = FALSE
        /\ link \in {"none", "theirs"} /\ lvl = (IF link = "theirs" THEN Top ELSE 1) /\ runLvl = 0 /\ recorded = 0 /\ enter = "up" /\ skipped = FALSE
        /\ results = 0 /\ unlock = 1 /\ cleared = {} /\ touch = FALSE /\ seen = FALSE /\ swung = FALSE

\* লাফ দাও / Enter on the title: sessionStart needs the window. The first river you ever play opens the story (a short screen); every other start goes straight to the crossing.
YouStart == 
    /\ phase = "title" /\ ~picking /\ visible /\ focused
    /\ phase' = IF ~seen /\ link = "none" /\ lvl = 1 THEN "story" ELSE "playing"
    /\ water' = IF ~seen /\ link = "none" /\ lvl = 1 THEN FALSE ELSE sound
    /\ runLvl' = lvl
    /\ recorded' = 0
    /\ results' = 0
    /\ touch' = FALSE
    /\ UNCHANGED <<picking, visible, focused, sound, cheer, played, link, lvl, enter, skipped, unlock, cleared, seen, swung>>

\* The third panel (or holding the corner button): storyDone, the crossing begins, the water comes on.
YouFinishTheStory == 
    /\ phase = "story" /\ ~picking /\ visible /\ focused
    /\ phase' = "playing"
    /\ water' = sound
    /\ seen' = TRUE
    /\ UNCHANGED <<picking, visible, focused, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, swung>>

\* A finger goes down on the river: the 40 ms swipe-or-tap window is open (pendingTouch), a timer is waiting.
YouTouchTheRiver == 
    /\ Full /\ Moving /\ ~touch
    /\ touch' = TRUE
    /\ UNCHANGED <<phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* The finger lifts or swipes: the hop is made and the pending touch is gone.
YouLiftYourFinger == 
    /\ Full /\ touch /\ visible /\ focused
    /\ touch' = FALSE
    /\ UNCHANGED <<phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* Our own pause cover, or the first tap back: onPointerDown only resumes (it returns before input), so it never hops.
YouTapWhilePaused == 
    /\ phase = "paused" /\ ~picking /\ visible
    /\ phase' = "playing"
    /\ focused' = TRUE
    /\ water' = sound
    /\ UNCHANGED <<picking, visible, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* stepRun -> done -> finishRun(played): the result is keyed to played.river.level (the river crossed), stars recorded then, your own unlock raised only from the furthest open river, the cheer queued with its run.
YouReachTheGhat == 
    /\ Moving
    /\ phase' = "over"
    /\ water' = FALSE
    /\ cheer' = "this"
    /\ recorded' = runLvl
    /\ results' = results + 1
    /\ unlock' = IF runLvl = unlock /\ unlock < Top THEN unlock + 1 ELSE unlock
    /\ cleared' = cleared \cup {runLvl}
    /\ touch' = FALSE
    /\ UNCHANGED <<picking, visible, focused, sound, played, link, lvl, runLvl, enter, skipped, seen, swung>>

\* The later() timer fires: cheerMayPlay lets it play only on its own run's card with the list closed; otherwise it is dropped.
CheerFires == 
    /\ cheer # "none"
    /\ cheer' = "none"
    /\ UNCHANGED <<phase, picking, visible, focused, water, sound, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* P (player.requestPause) or the player's pause button: onPause pauses and stops the water.
YouPause == 
    /\ phase = "playing" /\ visible /\ focused
    /\ phase' = "paused"
    /\ water' = FALSE
    /\ touch' = FALSE
    /\ UNCHANGED <<picking, visible, focused, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* The player's চালিয়ে যাও: sessionResume needs the window and a closed list; the water comes back on the next step.
YouResume == 
    /\ phase = "paused" /\ ~picking /\ visible /\ focused
    /\ phase' = "playing"
    /\ water' = sound
    /\ UNCHANGED <<picking, visible, focused, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* window blur (real, or the player's synthetic one): away() pauses, stopWater(), dropTouch().
WindowBlurs == 
    /\ visible /\ focused
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ focused' = FALSE
    /\ water' = FALSE
    /\ touch' = FALSE
    /\ UNCHANGED <<picking, visible, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* focus: back() only; nothing resumes by itself.
WindowFocuses == 
    /\ visible /\ ~focused
    /\ focused' = TRUE
    /\ UNCHANGED <<phase, picking, visible, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* visibilitychange (hidden): away("hide") pauses.
TabHides == 
    /\ Full /\ visible
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ visible' = FALSE
    /\ focused' = FALSE
    /\ water' = FALSE
    /\ touch' = FALSE
    /\ UNCHANGED <<picking, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* The tab shows again: back("show").
TabShows == 
    /\ Full /\ ~visible
    /\ visible' = TRUE
    /\ focused' = TRUE
    /\ UNCHANGED <<phase, picking, water, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* The river badge or সব নদী (or the player's menu): openList pauses a crossing in progress.
YouOpenRivers == 
    /\ phase \in {"title", "playing", "paused", "over"} /\ ~picking /\ visible /\ focused
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ picking' = TRUE
    /\ water' = FALSE
    /\ touch' = FALSE
    /\ UNCHANGED <<visible, focused, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, seen, swung>>

\* closeList: resumes only what the list paused (abstracted: a paused crossing resumes when the window has focus).
YouCloseRivers == 
    /\ picking /\ visible /\ focused
    /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
    /\ picking' = FALSE
    /\ water' = IF phase = "paused" THEN sound ELSE water
    /\ UNCHANGED <<visible, focused, sound, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* A river picked from the list (only open ones, ones you cleared, or the friend's): its title. The old crossing is dropped.
YouPickARiver(to) == 
    /\ picking /\ visible /\ focused /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = Top))
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ water' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ link' = IF link = "none" THEN "none" ELSE IF to = Top THEN "theirs" ELSE "other"
    /\ lvl' = to
    /\ runLvl' = 0
    /\ recorded' = 0
    /\ results' = 0
    /\ touch' = FALSE
    /\ UNCHANGED <<visible, focused, sound, played, enter, skipped, unlock, cleared, seen, swung>>

\* আবার খেলো (or a fresh Enter / 2 after the guard): again() bumps the run; the cheer for the old card is dropped.
YouPlayAgain == 
    /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up"
    /\ phase' = "playing"
    /\ water' = sound
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ runLvl' = lvl
    /\ recorded' = 0
    /\ results' = 0
    /\ UNCHANGED <<picking, visible, focused, sound, played, link, lvl, enter, skipped, unlock, cleared, touch, seen, swung>>

\* পরের নদী (only when the next one is open to you): its title.
YouGoOn == 
    /\ Full /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up" /\ lvl < Top /\ lvl + 1 <= unlock
    /\ phase' = "title"
    /\ water' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ link' = IF link = "none" THEN "none" ELSE "other"
    /\ lvl' = lvl + 1
    /\ runLvl' = 0
    /\ recorded' = 0
    /\ results' = 0
    /\ UNCHANGED <<picking, visible, focused, sound, played, enter, skipped, unlock, cleared, touch, seen, swung>>

\* নতুন করে শুরু in the player's menu: onRestart -> load(the same river), the title.
YouRestart == 
    /\ visible /\ focused /\ phase # "title"
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ water' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ runLvl' = 0
    /\ recorded' = 0
    /\ results' = 0
    /\ touch' = FALSE
    /\ UNCHANGED <<visible, focused, sound, played, link, lvl, enter, skipped, unlock, cleared, seen, swung>>

\* hashchange with a valid challenge: load(their river), even mid-crossing. The crossing is dropped, so the page never names one river while crossing another.
FriendLinkOpens == 
    /\ link = "none" /\ visible
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ water' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ link' = "theirs"
    /\ lvl' = Top
    /\ runLvl' = 0
    /\ recorded' = 0
    /\ results' = 0
    /\ touch' = FALSE
    /\ UNCHANGED <<visible, focused, sound, played, enter, skipped, unlock, cleared, seen, swung>>

\* Space pressed for a hop during the crossing and held through its end; its repeats reach the card.
YouHoldSpace == 
    /\ Full /\ phase = "playing" /\ enter = "up"
    /\ enter' = "held"
    /\ UNCHANGED <<phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, skipped, results, unlock, cleared, touch, seen, swung>>

\* keyup.
YouLetGoOfSpace == 
    /\ Full /\ enter = "held"
    /\ enter' = "up"
    /\ UNCHANGED <<phase, picking, visible, focused, water, sound, cheer, played, link, lvl, runLvl, recorded, skipped, results, unlock, cleared, touch, seen, swung>>

\* The site-wide switch. Off stops every loop.
SoundOff == 
    /\ Full /\ sound
    /\ water' = FALSE
    /\ sound' = FALSE
    /\ UNCHANGED <<phase, picking, visible, focused, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* On: the next step's loopStep starts a new water loop if it is wanted (never the old silent stub).
SoundOn == 
    /\ Full /\ ~sound
    /\ water' = Moving
    /\ sound' = TRUE
    /\ UNCHANGED <<phase, picking, visible, focused, cheer, played, link, lvl, runLvl, recorded, enter, skipped, results, unlock, cleared, touch, seen, swung>>

\* A repeat of a held key on the card: choiceOk refuses it (not fresh, or pressed before the card). Nothing changes.
SpaceRepeats == /\ Full /\ enter = "held" /\ phase = "over" /\ UNCHANGED vars

Next == YouStart \/ YouFinishTheStory \/ YouTouchTheRiver \/ YouLiftYourFinger \/ YouTapWhilePaused \/ YouReachTheGhat \/ CheerFires \/ YouPause \/ YouResume \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouOpenRivers \/ YouCloseRivers \/ (\E to \in Levels : YouPickARiver(to)) \/ YouPlayAgain \/ YouGoOn \/ YouRestart \/ FriendLinkOpens \/ YouHoldSpace \/ YouLetGoOfSpace \/ SoundOff \/ SoundOn \/ SpaceRepeats

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "story", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ water \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in {"none", "this", "old"} /\ played \in BOOLEAN /\ link \in {"none", "theirs", "other"}
          /\ lvl \in Levels /\ runLvl \in 0..Top /\ recorded \in 0..Top /\ enter \in {"up", "held"} /\ skipped \in BOOLEAN /\ results \in 0..2
          /\ unlock \in Levels /\ cleared \subseteq Levels /\ touch \in BOOLEAN /\ seen \in BOOLEAN /\ swung \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
\* The river only moves, and its clock only runs, while the crossing is on screen, focused and not under the list.
NoProgressWhileAway == ~Moving => ~water
ChoiceFreezesPlay == picking => phase # "playing"
\* The water plays only in a live crossing on a focused, visible page with sound on; it comes back after a pause or sound off and on.
WaterOnlyWhileCrossing == water => (Moving /\ sound)
WaterComesBack == (Moving /\ sound) => water
NoWaterOffTheRiver == phase \in {"title", "story", "over"} => ~water
CheerOnlyOnTheCard == (cheer = "this" => phase = "over") /\ ~played
\* The page names, and saves under, the river you are actually crossing.
ShownRiverIsTheOneCrossed == phase \in {"playing", "paused"} => lvl = runLvl
SavedUnderTheRiverCrossed == phase = "over" => (recorded = runLvl /\ recorded # 0)
NoDoubleResult == results <= 1
\* A Space held from before the card never takes its choice.
CardNeedsAFreshPress == ~skipped
\* A finger never stays down once you leave the river (blur, hide, pause, list, the end).
InputReleasedWhenAway == touch => Moving
FirstTapOnlyResumes == ~swung
OpenRiversAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
StoryOnlyOnce == seen => phase # "story"
StarsNeverDrop == [][cleared \subseteq cleared']_vars
====
