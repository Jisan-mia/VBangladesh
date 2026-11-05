---- MODULE Churui ----
\* চড়ুই তাড়াও after the rewrite: the afternoon's screens, সব ক্ষেত, window focus, the eating rustle (the one sound loop), birds at the
\* grain, a finale's boss that holds the dusk, the delayed celebration, a friend's link, Enter at the end, the tap that brings you
\* back, and your own unlock.
\* Mirrored from tools/churui-tarao/components/field-game.tsx (begin, load, pause, resume, openList, closeList, finishRun, again,
\* clapAt, steerLoops, the key and pointer handlers, the blur/focus/visibilitychange and hashchange effects) and the pure rules it
\* calls: lib/session.ts (start, pause, resume, away, back, finish, again, choiceOk, reset, pick, cheerMayPlay, canClap, moving,
\* loopStep) and lib/progress.ts (afterClear, playable); lib/step.hot.ts holds the dusk while the boss is up.
\* shared/game-sound.ts: setSoundOn(false) stops every loop; loop() made while muted is a silent stub, so loopStep makes a new one.
\* The player's pause sends a blur and calls onPause; its চালিয়ে যাও sends focus and calls onResume.
\* Nothing is held (a clap is one tap or one key press; the arrows hop the hand), so there is no held-input variable.
\* Full = FALSE (the chart run) has one ক্ষেত (a finale, so the boss is drawn), and leaves out the held Enter and a hidden tab.
EXTENDS Naturals, FiniteSets
CONSTANT Full
VARIABLES phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome
vars == <<phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

Top == IF Full THEN 3 ELSE 1
Levels == 1..Top
Finale(l) == l = Top
\* eating: a bird sits at the grain (the rustle is wanted only then). rustle: the loop is live (not a stub).
\* cheer: "none", "this" (queued for the card on screen) or "old". played: a celebration played off its own card (the bug; never).
\* skipped: a held Enter took the card's choice (never). results: rounds ended in this run. swungAway: a tap while paused clapped (never).
\* boss: "none" (not yet in, or no boss), "here" (at the grain), "gone". outcome: how the round on the card ended.
Moving == phase = "playing" /\ ~picking /\ visible /\ focused
Wanted == Moving /\ eating

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ eating = FALSE /\ rustle = FALSE
        /\ sound \in BOOLEAN /\ cheer = "none" /\ played = FALSE
        /\ link \in {"none", "theirs"} /\ seed = IF link = "theirs" THEN "theirs" ELSE "fresh"
        /\ enter = "up" /\ lvl = 1 /\ unlock = 1 /\ cleared = {} /\ skipped = FALSE /\ results = 0 /\ swungAway = FALSE
        /\ boss = "none" /\ outcome = "none"

\* মাঠে নামো / Enter on the title: sessionStart needs the window (the story is a short pause-able screen before play).
YouStart == 
    /\ phase = "title" /\ ~picking /\ visible /\ focused
    /\ phase' = "playing"
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ UNCHANGED <<picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, swungAway>>

\* The afternoon's step: a bird lands and starts pecking. steerLoops then wants the rustle.
ABirdLands == 
    /\ Moving /\ ~eating
    /\ eating' = TRUE
    /\ rustle' = sound
    /\ UNCHANGED <<phase, picking, visible, focused, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* The last bird at the grain is shooed (or flies home).
TheGrassClears == 
    /\ Moving /\ eating
    /\ eating' = FALSE
    /\ rustle' = FALSE
    /\ UNCHANGED <<phase, picking, visible, focused, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* A finale's boss bird flies in at its time. Dusk will wait for it.
TheBossArrives == 
    /\ Moving /\ Finale(lvl) /\ boss = "none"
    /\ boss' = "here"
    /\ UNCHANGED <<phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, outcome>>

\* The boss takes its last clap and flies off for good.
YouChaseTheBossOff == 
    /\ Moving /\ boss = "here"
    /\ boss' = "gone"
    /\ UNCHANGED <<phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, outcome>>

\* A tap on the field. While paused it only resumes (onPointerDown returns before clapAt); while playing it claps and nothing else changes.
YouTapTheField ==
    /\ visible /\ phase \in {"playing", "paused"} /\ ~picking
    /\ IF phase = "paused"
         THEN /\ phase' = "playing" /\ focused' = TRUE /\ rustle' = (sound /\ eating)
              /\ UNCHANGED <<picking, visible, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>
         ELSE UNCHANGED vars

\* window blur (real, or the player's synthetic one): away() pauses, stopRustle().
WindowBlurs == 
    /\ visible /\ focused
    /\ focused' = FALSE
    /\ rustle' = FALSE
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ UNCHANGED <<picking, visible, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* focus: back() only; nothing resumes by itself.
WindowFocuses == 
    /\ visible /\ ~focused
    /\ focused' = TRUE
    /\ UNCHANGED <<phase, picking, visible, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* visibilitychange (hidden): away("hide") pauses.
TabHides == 
    /\ Full /\ visible
    /\ visible' = FALSE
    /\ focused' = FALSE
    /\ rustle' = FALSE
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ UNCHANGED <<picking, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

TabShows == 
    /\ Full /\ ~visible
    /\ visible' = TRUE
    /\ focused' = TRUE
    /\ UNCHANGED <<phase, picking, eating, rustle, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* P (player.requestPause) or the player's pause button: onPause pauses.
YouPause == 
    /\ phase = "playing" /\ visible /\ focused
    /\ phase' = "paused"
    /\ rustle' = FALSE
    /\ UNCHANGED <<picking, visible, focused, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* The player's চালিয়ে যাও: sessionResume needs the window and a closed list; the rustle comes back on the next step.
YouResume == 
    /\ phase = "paused" /\ ~picking /\ visible /\ focused
    /\ phase' = "playing"
    /\ rustle' = (sound /\ eating)
    /\ UNCHANGED <<picking, visible, focused, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* The ক্ষেত badge or সব ক্ষেত: openList pauses a round in progress.
YouOpenTheList == 
    /\ phase \in {"title", "playing", "paused", "over"} /\ ~picking /\ visible /\ focused
    /\ picking' = TRUE
    /\ rustle' = FALSE
    /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
    /\ UNCHANGED <<visible, focused, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* closeList: resumes only what the list paused (abstracted: a paused round resumes when the window has focus).
YouCloseTheList == 
    /\ picking /\ visible /\ focused
    /\ picking' = FALSE
    /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
    /\ rustle' = IF phase = "paused" THEN (sound /\ eating) ELSE rustle
    /\ UNCHANGED <<visible, focused, eating, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* A ক্ষেত picked from the list (only open ones, or the friend's): its title, a fresh seed (or the friend's).
YouPickAField(to) == 
    /\ picking /\ visible /\ focused /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = Top))
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ seed' = IF link # "none" /\ to = Top THEN "theirs" ELSE "fresh"
    /\ lvl' = to
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ link' = IF link = "none" THEN "none" ELSE IF to = Top THEN "theirs" ELSE "other"
    /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>

\* stepGame → finishRun (dusk): the field is passed, stars recorded once, your own unlock raised only from the furthest open ক্ষেত;
\* the cheer is queued with its run. A finale's dusk waits until its boss has been chased off.
DuskFalls == 
    /\ Moving /\ (~Finale(lvl) \/ boss = "gone")
    /\ phase' = "over"
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = "this"
    /\ results' = results + 1
    /\ outcome' = "dusk"
    /\ cleared' = IF Full THEN cleared \cup {lvl} ELSE cleared
    /\ unlock' = IF Full /\ lvl = unlock /\ unlock < Top THEN unlock + 1 ELSE unlock
    /\ UNCHANGED <<picking, visible, focused, sound, played, link, seed, enter, lvl, skipped, swungAway, boss>>

\* stepGame → finishRun (the last grain eaten): the lost card. No stars, nothing opens.
TheGrainIsGone == 
    /\ Moving
    /\ phase' = "over"
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = "this"
    /\ results' = results + 1
    /\ outcome' = "lost"
    /\ UNCHANGED <<picking, visible, focused, sound, played, link, seed, enter, lvl, unlock, cleared, skipped, swungAway, boss>>

\* The later() timer fires: cheerMayPlay lets it play only on its own run's card with the list closed; otherwise it is dropped. Nothing else changes.
CheerFires == /\ cheer # "none" /\ cheer' = "none" /\ played' = played
              /\ UNCHANGED <<phase, picking, visible, focused, eating, rustle, sound, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* আবার খেলো (or a fresh Enter / 2 after the guard): again() bumps the run; a friend's ক্ষেত keeps their seed.
YouPlayAgain == 
    /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up"
    /\ phase' = "playing"
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
    /\ UNCHANGED <<picking, visible, focused, eating, rustle, sound, played, link, enter, lvl, unlock, cleared, skipped, swungAway>>

\* পরের ক্ষেত (only when the next one is open to you): its title.
YouGoOn == 
    /\ Full /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up" /\ lvl < Top /\ lvl + 1 <= unlock
    /\ phase' = "title"
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ seed' = "fresh"
    /\ lvl' = lvl + 1
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ link' = IF link = "none" THEN "none" ELSE "other"
    /\ UNCHANGED <<picking, visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>

\* নতুন করে শুরু in the player's menu: onRestart → load(the same ক্ষেত).
YouRestart == 
    /\ visible /\ focused /\ phase # "title"
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ UNCHANGED <<visible, focused, sound, played, link, enter, lvl, unlock, cleared, skipped, swungAway>>

\* hashchange with a valid challenge: load(their ক্ষেত, their seed), even mid-round.
FriendLinkOpens == 
    /\ link = "none" /\ visible
    /\ phase' = "title"
    /\ picking' = FALSE
    /\ rustle' = FALSE
    /\ eating' = FALSE
    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
    /\ seed' = "theirs"
    /\ lvl' = IF Full THEN Top ELSE lvl
    /\ results' = 0
    /\ boss' = "none"
    /\ outcome' = "none"
    /\ link' = "theirs"
    /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped, swungAway>>

\* Enter or Space pressed during the round (a clap) and held through its end; its repeats reach the card.
YouHoldEnter == 
    /\ Full /\ phase = "playing" /\ enter = "up"
    /\ enter' = "held"
    /\ UNCHANGED <<phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* A repeat: choiceOk refuses a repeated key or one pressed before the card appeared. Nothing changes.
EnterRepeats == /\ Full /\ enter = "held" /\ phase = "over" /\ UNCHANGED vars

YouLetGoOfEnter == 
    /\ Full /\ enter = "held"
    /\ enter' = "up"
    /\ UNCHANGED <<phase, picking, visible, focused, eating, rustle, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* The site-wide switch. Off stops every loop.
SoundOff == 
    /\ sound
    /\ sound' = FALSE
    /\ rustle' = FALSE
    /\ UNCHANGED <<phase, picking, visible, focused, eating, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

\* On: the next step's loopStep starts a new rustle if it is wanted.
SoundOn == 
    /\ ~sound
    /\ sound' = TRUE
    /\ rustle' = Wanted
    /\ UNCHANGED <<phase, picking, visible, focused, eating, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, results, swungAway, boss, outcome>>

Next == YouStart \/ ABirdLands \/ TheGrassClears \/ TheBossArrives \/ YouChaseTheBossOff \/ YouTapTheField \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume \/ YouOpenTheList \/ YouCloseTheList \/ (\E to \in Levels : YouPickAField(to)) \/ DuskFalls \/ TheGrainIsGone \/ CheerFires \/ YouPlayAgain \/ YouGoOn \/ YouRestart \/ FriendLinkOpens \/ YouHoldEnter \/ EnterRepeats \/ YouLetGoOfEnter \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ eating \in BOOLEAN /\ rustle \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in {"none", "this", "old"} /\ played \in BOOLEAN
          /\ link \in {"none", "theirs", "other"} /\ seed \in {"theirs", "fresh"} /\ enter \in {"up", "held"}
          /\ lvl \in Levels /\ unlock \in Levels /\ cleared \subseteq Levels /\ skipped \in BOOLEAN /\ results \in 0..2 /\ swungAway \in BOOLEAN
          /\ boss \in {"none", "here", "gone"} /\ outcome \in {"none", "dusk", "lost"}

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
\* The birds only eat while the afternoon moves: the grain left on the card is what was left when you looked away.
NoProgressWhileAway == ~Moving => ~Wanted
ChoiceFreezesPlay == picking => phase # "playing"
\* The rustle plays only while a bird eats in a live round on a focused, visible page with sound on.
LoopOnlyWhenMeaningful == rustle => (Wanted /\ sound)
\* Whenever a bird eats in a live round with sound on, the rustle plays, even after sound off and on or a pause.
LoopComesBack == (Wanted /\ sound) => rustle
NoRustleOnTheCard == phase \in {"title", "over"} => ~rustle
NoDoubleResult == results <= 1
CelebrationOnItsOwnCard == (cheer = "this" => phase = "over") /\ ~played
ReplayIsExact == (link = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
HeldKeyNeverSkips == ~skipped
FirstTapOnlyResumes == ~swungAway
OpenLevelsAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
\* A finale's dusk waits: the card shows "dusk" on a finale only after its boss was chased off.
DuskWaitsForBoss == (phase = "over" /\ outcome = "dusk" /\ Finale(lvl)) => boss = "gone"
StarsNeverDrop == [][cleared \subseteq cleared']_vars
====
