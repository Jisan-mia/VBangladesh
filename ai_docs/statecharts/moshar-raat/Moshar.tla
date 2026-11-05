---- MODULE Moshar ----
\* মশার রাত after the rewrite: the night's screens, সব রাত, window focus, held arrow keys, the sound loops (the whine
\* and the boss's drone), mosquitoes in the air, the delayed celebration, a friend's link, Enter at the end, the tap that
\* brings you back, and your own unlock.
\* Mirrored from tools/moshar-raat/components/night-game.tsx (begin, load, pause, resume, openList, closeList, finishRun,
\* again, swingAt, steerLoops, the key and pointer handlers, the blur/focus/visibilitychange and hashchange effects) and the
\* pure rules it calls: lib/session.ts (start, pause, resume, away, back, finish, again, choiceOk, reset, pick, cheerMayPlay,
\* canSwing, moving, loopStep) and lib/progress.ts (afterClear, playable). shared/game-sound.ts: setSoundOn(false) stops
\* every loop; loop() made while muted is a silent stub, so loopStep makes a new one when sound returns.
\* The player's pause sends a blur and calls onPause; its চালিয়ে যাও sends focus and calls onResume.
\* Full = FALSE (the chart run) leaves out the levels and the held Enter key, and merges a hidden tab into a blur.
EXTENDS Naturals, FiniteSets
CONSTANT Full
VARIABLES phase, picking, visible, focused, held, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway
vars == <<phase, picking, visible, focused, held, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>

Levels == 1..3
\* flying: a mosquito is in the air (the whine is wanted only then).
\* whine: the sound loops are live (not a stub). cheer: "none", "this" (queued for the card on screen) or "old".
\* played: a celebration played off its own card (the bug; never). skipped: a held Enter took the card's choice (never).
\* results: nights ended in this run (NoDoubleResult). swungAway: a tap while paused swung the bat (never).
Moving == phase = "playing" /\ ~picking /\ visible /\ focused
Wanted == Moving /\ flying

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ held = FALSE /\ flying = FALSE /\ whine = FALSE
        /\ sound \in BOOLEAN /\ cheer = "none" /\ played = FALSE
        /\ link \in {"none", "theirs"} /\ seed = IF link = "theirs" THEN "theirs" ELSE "fresh"
        /\ enter = "up" /\ lvl = 1 /\ unlock = 1 /\ cleared = {} /\ skipped = FALSE /\ results = 0 /\ swungAway = FALSE

\* load(): a night's title, with the friend's seed when it is their night. Clears timers, loops and input; reset() bumps the run.
Load(to, theirs) == /\ phase' = "title" /\ picking' = FALSE /\ held' = FALSE /\ whine' = FALSE /\ flying' = FALSE
                    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                    /\ seed' = IF theirs THEN "theirs" ELSE "fresh"
                    /\ lvl' = to /\ results' = 0

\* রাত শুরু, or Enter on the title: sessionStart needs the window. (The story is a short pause-able screen before play.)
YouStart == /\ phase = "title" /\ ~picking /\ visible /\ focused
            /\ phase' = "playing" /\ results' = 0
            /\ UNCHANGED <<picking, visible, focused, held, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, swungAway>>
\* The night's step: a mosquito comes in, or the last one is zapped or bites. The next step's steerLoops follows.
AMosquitoArrives == /\ Moving /\ ~flying /\ flying' = TRUE /\ whine' = sound
                    /\ UNCHANGED <<phase, picking, visible, focused, held, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
TheAirClears == /\ Moving /\ flying /\ flying' = FALSE /\ whine' = FALSE
                /\ UNCHANGED <<phase, picking, visible, focused, held, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* keydown on an arrow while the night is on (a key reaching the page means the window has focus).
YouHoldAnArrow == /\ phase = "playing" /\ ~picking /\ visible /\ ~held
                  /\ held' = TRUE /\ focused' = TRUE
                  /\ UNCHANGED <<phase, picking, visible, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, picking, visible, focused, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* A tap on the room. While paused it only resumes (onPointerDown returns before swingAt); while playing it swings.
YouTapTheRoom == /\ visible
                 /\ phase \in {"playing", "paused"} /\ ~picking
                 /\ IF phase = "paused"
                      THEN /\ phase' = "playing" /\ focused' = TRUE /\ whine' = (sound /\ flying)
                           /\ UNCHANGED swungAway
                      ELSE /\ UNCHANGED <<phase, focused, whine, swungAway>>
                 /\ UNCHANGED <<picking, visible, held, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results>>
\* window blur (real, or the player's synthetic one): stopInput(), away() pauses, stopLoops().
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE /\ whine' = FALSE
               /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
               /\ UNCHANGED <<picking, visible, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* focus: back() only; nothing resumes by itself.
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, picking, visible, held, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
TabHides == /\ Full /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ whine' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<picking, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
TabShows == /\ Full /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, picking, held, flying, whine, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* P (player.requestPause) or the player's ⏸: onPause → pause().
YouPause == /\ phase = "playing" /\ visible /\ focused
            /\ phase' = "paused" /\ held' = FALSE /\ whine' = FALSE
            /\ UNCHANGED <<picking, visible, focused, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* চালিয়ে যাও: sessionResume needs the window and a closed list; the loops come back on the next step.
YouResume == /\ phase = "paused" /\ ~picking /\ visible /\ focused
             /\ phase' = "playing" /\ whine' = (sound /\ flying)
             /\ UNCHANGED <<picking, visible, focused, held, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* The রাত badge or সব রাত: openList pauses a night in progress.
YouOpenTheList == /\ ~picking /\ phase \in {"title", "playing", "paused", "over"} /\ visible /\ focused
                  /\ picking' = TRUE /\ held' = FALSE /\ whine' = FALSE
                  /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                  /\ UNCHANGED <<visible, focused, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* closeList: resumes only what the list paused (abstracted: a paused night resumes when the window has focus).
YouCloseTheList == /\ picking /\ visible /\ focused
                   /\ picking' = FALSE
                   /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
                   /\ whine' = IF phase = "paused" THEN (sound /\ flying) ELSE whine
                   /\ UNCHANGED <<visible, focused, held, flying, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* A রাত picked from the list (only open ones, or the friend's): its title.
YouPickANight(to) == /\ picking /\ visible /\ focused
                     /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = 3))
                     /\ Load(to, link # "none" /\ to = 3)
                     /\ link' = IF link = "none" THEN "none" ELSE IF to = 3 THEN "theirs" ELSE "other"
                     /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>
\* stepGame → finishRun (dawn, or the last bite; a slap from a swing too): the card, stars recorded once, your own unlock
\* raised only from the furthest open রাত; the cheer queued with its run.
NightEnds == /\ Moving
             /\ phase' = "over" /\ whine' = FALSE /\ flying' = FALSE /\ held' = FALSE /\ cheer' = "this" /\ results' = results + 1
             /\ cleared' = IF Full THEN cleared \cup {lvl} ELSE cleared
             /\ unlock' = IF Full /\ lvl = unlock /\ unlock < 3 THEN unlock + 1 ELSE unlock
             /\ UNCHANGED <<picking, visible, focused, sound, played, link, seed, enter, lvl, skipped, swungAway>>
\* The later() timer fires: it plays only when cheerMayPlay (its own run's card, list closed); otherwise it is dropped.
CheerFires == /\ cheer # "none"
              /\ cheer' = "none"
              /\ played' = played
              /\ UNCHANGED <<phase, picking, visible, focused, held, flying, whine, sound, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
\* আবার খেলো (or a fresh Enter / 2 after the guard): again() bumps the run; a friend's night keeps their seed.
YouPlayAgain == /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up"
                /\ phase' = "playing" /\ results' = 0
                /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
                /\ UNCHANGED <<picking, visible, focused, held, flying, whine, sound, played, link, enter, lvl, unlock, cleared, skipped, swungAway>>
\* পরের রাত (only when the next রাত is open to you): its title.
YouGoOn == /\ Full /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up" /\ lvl < 3 /\ lvl + 1 <= unlock
           /\ Load(lvl + 1, FALSE)
           /\ link' = IF link = "none" THEN "none" ELSE "other"
           /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>
\* নতুন করে শুরু in the player's menu: onRestart → load(the same রাত).
YouRestart == /\ visible /\ focused /\ phase # "title"
              /\ Load(lvl, link = "theirs")
              /\ UNCHANGED <<visible, focused, sound, played, link, enter, unlock, cleared, skipped, swungAway>>
\* hashchange with a valid challenge: load(their night, their seed), even mid-night.
FriendLinkOpens == /\ link = "none" /\ visible
                   /\ Load(IF Full THEN 3 ELSE lvl, TRUE)
                   /\ link' = "theirs"
                   /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>
\* Enter pressed during the night (a swing) and held through its end; its repeats reach the card.
YouHoldEnter == /\ Full /\ phase = "playing" /\ enter = "up" /\ enter' = "held"
                /\ UNCHANGED <<phase, picking, visible, focused, held, flying, whine, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped, results, swungAway>>
\* A repeat: choiceOk refuses a repeated key or one pressed before the card appeared. Nothing changes.
EnterRepeats == /\ Full /\ enter = "held" /\ phase = "over"
                /\ UNCHANGED vars
YouLetGoOfEnter == /\ Full /\ enter = "held" /\ enter' = "up"
                   /\ UNCHANGED <<phase, picking, visible, focused, held, flying, whine, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped, results, swungAway>>
\* The site-wide switch. Off stops every loop; on: the next step's loopStep starts a new one if it is wanted.
SoundOff == /\ sound /\ sound' = FALSE /\ whine' = FALSE
            /\ UNCHANGED <<phase, picking, visible, focused, held, flying, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ whine' = Wanted
           /\ UNCHANGED <<phase, picking, visible, focused, held, flying, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway>>

Next == YouStart \/ AMosquitoArrives \/ TheAirClears \/ YouHoldAnArrow \/ YouLetGo \/ YouTapTheRoom \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouPause \/ YouResume \/ YouOpenTheList \/ YouCloseTheList
        \/ (\E to \in (IF Full THEN Levels ELSE {1}) : YouPickANight(to))
        \/ NightEnds \/ CheerFires \/ YouPlayAgain \/ YouGoOn \/ YouRestart \/ FriendLinkOpens
        \/ YouHoldEnter \/ EnterRepeats \/ YouLetGoOfEnter \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ held \in BOOLEAN /\ flying \in BOOLEAN /\ whine \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in {"none", "this", "old"} /\ played \in BOOLEAN
          /\ link \in {"none", "theirs", "other"} /\ seed \in {"theirs", "fresh"} /\ enter \in {"up", "held"}
          /\ lvl \in Levels /\ unlock \in Levels /\ cleared \subseteq Levels /\ skipped \in BOOLEAN /\ results \in 0..2 /\ swungAway \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
InputReleasedWhenAway == held => (focused /\ visible)
ChoiceFreezesPlay == picking => phase # "playing"
\* The পিন-পিন (and the boss's drone) play only while a mosquito flies on a focused, visible page with sound on.
LoopOnlyWhenMeaningful == whine => (Wanted /\ sound)
\* Whenever a mosquito flies on screen with sound on, the whine plays, even after sound off and on or a pause.
LoopComesBack == (Wanted /\ sound) => whine
NoWhineOnTheCard == phase \in {"title", "over"} => ~whine
NoDoubleResult == results <= 1
CelebrationOnItsOwnCard == (cheer = "this" => phase = "over") /\ ~played
ReplayIsExact == (link = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
HeldKeyNeverSkips == ~skipped
FirstTapOnlyResumes == ~swungAway
OpenLevelsAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
StarsNeverDrop == [][cleared \subseteq cleared']_vars
====
