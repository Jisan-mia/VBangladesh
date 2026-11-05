---- MODULE Storm ----
\* কালবৈশাখী আম after the rewrite: the run's screens, the storm list, window focus, the held arrow or thumb, the wind loop,
\* the delayed celebration, a friend's link, the Enter key at the end, and your own unlock.
\* Mirrored from tools/kalbaishakhi-aam/components/storm-game.tsx (begin, load, pause, resume, openList, closeList, finishRun,
\* again, the key and pointer handlers, the blur/focus/visibilitychange and hashchange effects, the step's windStep) and the
\* pure rules it calls: lib/session.ts (start, pause, resume, away, back, finish, again, reset, pick, cheerMayPlay, windStep)
\* and lib/progress.ts (afterClear, playable). shared/game-sound.ts: setSoundOn(false) stops every loop; loop() made while
\* muted is a silent stub. The player's pause sends a blur and calls onPause, its চালিয়ে যাও sends focus and calls onResume.
\* Full = FALSE (the chart run) leaves out the levels and the held Enter key, and merges a hidden tab into a blur.
EXTENDS Naturals, FiniteSets
CONSTANT Full
VARIABLES phase, picking, visible, focused, held, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped
vars == <<phase, picking, visible, focused, held, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>

Levels == 1..3
\* cheer: "none", "this" (queued for the card on screen) or "old" (queued for a run that is no longer on screen).
\* played: TRUE once a celebration has played while its own card was not showing (the bug; must never happen).
\* link: "none", "theirs" (the friend's storm is on screen), "other" (a friend's link was opened, you picked another storm).
\* seed: the storm on screen falls from "theirs" (the friend's seed) or "fresh".
\* enter: "up", "held" (pressed before the card, still down) — only in the full run.
\* skipped: TRUE once a key held from before the card took the card's choice (the bug; must never happen).
Moving == phase = "playing" /\ ~picking /\ visible /\ focused

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ held = FALSE /\ wind = FALSE
        /\ sound \in BOOLEAN /\ cheer = "none" /\ played = FALSE
        /\ link \in {"none", "theirs"} /\ seed = IF link = "theirs" THEN "theirs" ELSE "fresh"
        /\ enter = "up" /\ lvl = 1 /\ unlock = 1 /\ cleared = {} /\ skipped = FALSE

\* The wind follows windStep() on every step: it plays exactly while the storm moves with sound on.
WindAfter(m, s) == m /\ s

\* load(): a storm's title, with the friend's seed when it is their storm. Clears timers, wind and input; reset() bumps the run.
Load(to, theirs) == /\ phase' = "title" /\ picking' = FALSE /\ held' = FALSE /\ wind' = FALSE
                    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                    /\ seed' = IF theirs THEN "theirs" ELSE "fresh"
                    /\ lvl' = to

\* ঝড় শুরু, a tap or an arrow on the title: sessionStart needs the window; the storm and the wind start.
YouStart == /\ phase = "title" /\ ~picking /\ visible /\ focused
            /\ phase' = "playing" /\ wind' = sound
            /\ UNCHANGED <<picking, visible, focused, held, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* keydown ← / → or a finger down on the yard while the storm falls (a key reaching the page means the window has focus).
YouHold == /\ phase = "playing" /\ ~picking /\ visible /\ ~held
           /\ held' = TRUE /\ focused' = TRUE
           /\ UNCHANGED <<phase, picking, visible, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, picking, visible, focused, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* window blur (real, or the player's synthetic one): stopInput(), away() pauses, stopWind().
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ held' = FALSE /\ wind' = FALSE
               /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
               /\ UNCHANGED <<picking, visible, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* focus: back() only; nothing resumes by itself.
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, picking, visible, held, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
TabHides == /\ Full /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ wind' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<picking, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
TabShows == /\ Full /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, picking, held, wind, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* P (player.requestPause) or the player's ⏸: onPause → pause().
YouPause == /\ phase = "playing" /\ visible /\ focused
            /\ phase' = "paused" /\ held' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<picking, visible, focused, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* চালিয়ে যাও, or the first tap on our cover (it only resumes): sessionResume needs the window and a closed list.
YouResume == /\ phase = "paused" /\ ~picking /\ visible /\ focused
             /\ phase' = "playing" /\ wind' = sound
             /\ UNCHANGED <<picking, visible, focused, held, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* The storm badge or সব ঝড়: openList pauses a storm in progress.
YouOpenTheList == /\ ~picking /\ phase \in {"title", "playing", "paused", "over"} /\ visible /\ focused
                  /\ picking' = TRUE /\ held' = FALSE /\ wind' = FALSE
                  /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                  /\ UNCHANGED <<visible, focused, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* closeList: resumes only what the list paused (abstracted: a paused storm resumes when the window has focus).
YouCloseTheList == /\ picking /\ visible /\ focused
                   /\ picking' = FALSE
                   /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
                   /\ wind' = IF phase = "paused" THEN sound ELSE wind
                   /\ UNCHANGED <<visible, focused, held, sound, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
\* A storm picked from the list (only open ones, or the friend's): its title.
YouPickAStorm(to) == /\ picking /\ visible /\ focused
                     /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = 3))
                     /\ Load(to, link # "none" /\ to = 3)
                     /\ link' = IF link = "none" THEN "none" ELSE IF to = 3 THEN "theirs" ELSE "other"
                     /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped>>
\* stepGame → finishRun: the card, stars recorded, your own unlock raised only from the furthest open storm; the cheer queued.
StormEnds == /\ Moving
             /\ phase' = "over" /\ wind' = FALSE /\ held' = FALSE /\ cheer' = "this"
             /\ cleared' = IF Full THEN cleared \cup {lvl} ELSE cleared
             /\ unlock' = IF Full /\ lvl = unlock /\ unlock < 3 THEN unlock + 1 ELSE unlock
             /\ UNCHANGED <<picking, visible, focused, sound, played, link, seed, enter, lvl, skipped>>
\* The later() timer fires: it plays only when cheerMayPlay (its own run's card, list closed); otherwise it is dropped.
CheerFires == /\ cheer # "none"
              /\ cheer' = "none"
              /\ played' = played  \* the code plays it only inside cheerMayPlay, so it never plays off its card
              /\ UNCHANGED <<phase, picking, visible, focused, held, wind, sound, link, seed, enter, lvl, unlock, cleared, skipped>>
\* আবার খেলো (or a fresh Enter after the guard): again() bumps the run; a friend's storm keeps their seed.
YouPlayAgain == /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up"
                /\ phase' = "playing" /\ wind' = sound
                /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
                /\ UNCHANGED <<picking, visible, focused, held, sound, played, link, enter, lvl, unlock, cleared, skipped>>
\* পরের ঝড় (only when the next storm is open to you): its title.
YouGoOn == /\ Full /\ phase = "over" /\ ~picking /\ visible /\ focused /\ enter = "up" /\ lvl < 3 /\ lvl + 1 <= unlock
           /\ Load(lvl + 1, FALSE)
           /\ link' = IF link = "none" THEN "none" ELSE "other"
           /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped>>
\* নতুন করে শুরু in the player's menu: onRestart → load(the same storm).
YouRestart == /\ visible /\ focused /\ phase # "title"
              /\ Load(lvl, link = "theirs")
              /\ UNCHANGED <<visible, focused, sound, played, link, enter, unlock, cleared, skipped>>
\* hashchange with a valid challenge: load(their storm, their seed), even mid-storm.
FriendLinkOpens == /\ link = "none" /\ visible
                   /\ Load(IF Full THEN 3 ELSE lvl, TRUE)
                   /\ link' = "theirs"
                   /\ UNCHANGED <<visible, focused, sound, played, enter, unlock, cleared, skipped>>
\* Enter pressed during the storm and held through its end; its repeats reach the card.
YouHoldEnter == /\ Full /\ phase = "playing" /\ enter = "up" /\ enter' = "held"
                /\ UNCHANGED <<phase, picking, visible, focused, held, wind, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped>>
\* A repeat: again() refuses a repeated key or one pressed before the card appeared. Nothing changes.
EnterRepeats == /\ Full /\ enter = "held" /\ phase = "over"
                /\ UNCHANGED vars  \* (before the rewrite this was YouPlayAgain: skipped' = TRUE)
YouLetGoOfEnter == /\ Full /\ enter = "held" /\ enter' = "up"
                   /\ UNCHANGED <<phase, picking, visible, focused, held, wind, sound, cheer, played, link, seed, lvl, unlock, cleared, skipped>>
\* The site-wide switch. Off stops every loop; on: the next step's windStep starts a new one if the storm is moving.
SoundOff == /\ sound /\ sound' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<phase, picking, visible, focused, held, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ wind' = WindAfter(Moving, TRUE)
           /\ UNCHANGED <<phase, picking, visible, focused, held, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>

Next == YouStart \/ YouHold \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume
        \/ YouOpenTheList \/ YouCloseTheList \/ (\E to \in (IF Full THEN Levels ELSE {1}) : YouPickAStorm(to))
        \/ StormEnds \/ CheerFires \/ YouPlayAgain \/ YouGoOn \/ YouRestart \/ FriendLinkOpens
        \/ YouHoldEnter \/ EnterRepeats \/ YouLetGoOfEnter \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ held \in BOOLEAN /\ wind \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in {"none", "this", "old"} /\ played \in BOOLEAN
          /\ link \in {"none", "theirs", "other"} /\ seed \in {"theirs", "fresh"} /\ enter \in {"up", "held"}
          /\ lvl \in Levels /\ unlock \in Levels /\ cleared \subseteq Levels /\ skipped \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
InputReleasedWhenAway == held => (focused /\ visible)
ChoiceFreezesPlay == picking => phase # "playing"
WindOnlyInTheStorm == wind => (Moving /\ sound)
WindComesBack == (Moving /\ sound) => wind
CelebrationOnItsOwnCard == (cheer = "this" => phase = "over") /\ ~played
ReplayIsExact == (link = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
\* The only ways off the card by key need enter = "up" (a fresh press after it appeared): YouPlayAgain and YouGoOn.
HeldKeyNeverSkips == ~skipped
OpenLevelsAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
====
