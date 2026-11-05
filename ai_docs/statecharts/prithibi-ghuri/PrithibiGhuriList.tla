---- MODULE PrithibiGhuriList ----
\* পৃথিবী ঘুরি: the level list and the trip under it. Mirrored from lib/session.ts (openChoice, closeChoice, frozen) and
\* components/game.tsx (useGamePlayer onLevels → openChoice(…, true); pickLevel; the trip grid that used to sit under the game).
\* The old game had a trip-number grid under the game that restarted the trip on one tap, mid-visit, with no confirm.
\* Now the list is a choice screen: from the title or the end screen with a tap, and over a trip only from the pause menu.
\* While it is open the trip is frozen (the plane holds), and ফিরে যাও gives the trip back exactly as it was.
EXTENDS Naturals
CONSTANTS OneTapDrop   \* the old behaviour: a tap in play restarts at once. FALSE in the fixed code
VARIABLES screen, back, paused, progress, dropBy, fromMenu, saved
vars == <<screen, back, paused, progress, dropBy, fromMenu, saved>>

Init == screen = "title" /\ back = "title" /\ paused = FALSE /\ progress = 0 /\ dropBy = "none" /\ fromMenu = FALSE /\ saved = 0

YouStartATrip == /\ screen \in {"title", "end"} /\ screen' = "play" /\ progress' = 0 /\ UNCHANGED <<back, paused, dropBy, fromMenu, saved>>
\* The trip moves on: a stop, a postcard, an answer (progress stands for all of it).
TheTripMovesOn == /\ screen = "play" /\ ~paused /\ progress < 2 /\ progress' = progress + 1 /\ UNCHANGED <<screen, back, paused, dropBy, fromMenu, saved>>
TheTripEnds == /\ screen = "play" /\ ~paused /\ progress = 2 /\ screen' = "end" /\ UNCHANGED <<back, paused, progress, dropBy, fromMenu, saved>>
YouOpenThePauseMenu == /\ screen = "play" /\ ~paused /\ paused' = TRUE /\ UNCHANGED <<screen, back, progress, dropBy, fromMenu, saved>>
YouResume == /\ paused /\ paused' = FALSE /\ UNCHANGED <<screen, back, progress, dropBy, fromMenu, saved>>
\* The list opens from the title or the end screen with a tap.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ screen' = "levels" /\ back' = screen /\ fromMenu' = FALSE
                       /\ UNCHANGED <<paused, progress, dropBy, saved>>
\* সব লেভেল in the pause menu: the player resumes, then calls onLevels; the trip waits under the list.
YouOpenTheListFromTheMenu == /\ screen = "play" /\ paused /\ screen' = "levels" /\ back' = "play" /\ paused' = FALSE /\ fromMenu' = TRUE /\ saved' = progress
                             /\ UNCHANGED <<progress, dropBy>>
YouCloseTheList == /\ screen = "levels" /\ screen' = back /\ fromMenu' = FALSE /\ UNCHANGED <<back, paused, progress, dropBy, saved>>
\* A level from the list: over a trip it replaces it, which the child asked for in two steps (menu, then the level).
YouPickALevel == /\ screen = "levels" /\ screen' = "play" /\ progress' = 0
                 /\ dropBy' = (IF back = "play" /\ progress > 0 THEN "menu" ELSE dropBy) /\ fromMenu' = FALSE /\ UNCHANGED <<back, paused, saved>>
\* OLD gap 3: a tap on a trip number restarts the trip at once.
YouTapATripNumber == /\ OneTapDrop /\ screen = "play" /\ progress > 0 /\ progress' = 0 /\ dropBy' = "tap" /\ UNCHANGED <<screen, back, paused, fromMenu, saved>>
Next == YouStartATrip \/ TheTripMovesOn \/ TheTripEnds \/ YouOpenThePauseMenu \/ YouResume \/ YouOpenTheLevelList
        \/ YouOpenTheListFromTheMenu \/ YouCloseTheList \/ YouPickALevel \/ YouTapATripNumber

Spec == Init /\ [][Next]_vars

TypeOK == screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "end", "play"} /\ paused \in BOOLEAN /\ progress \in 0..2
          /\ dropBy \in {"none", "menu", "tap"} /\ fromMenu \in BOOLEAN /\ saved \in 0..2

\* Gap 3: one tap never drops a trip.
NoOneTapDrop == dropBy # "tap"
\* The list is a choice screen: a trip under it is only there because the pause menu put it there, and nothing moves it.
ChoiceFreezesPlay == (screen = "levels" /\ back = "play") => fromMenu
\* The trip comes back exactly as it was: closing the list never loses progress.
ListKeepsTheTrip == (screen = "levels" /\ back = "play") => progress = saved
====
