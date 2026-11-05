---- MODULE DanguliLink ----
\* ডাংগুলি: a friend's challenge link and the field each screen plays. Mirrored from tools/danguli/lib/challenge.ts (seedFor) and
\* tools/danguli/components/game.tsx (readLink, start, begin, again, pickLevel, the end screen's choices, onRestart). A link
\* carries one level (level 1 here) and its seed; a level you start gets the friend's seed only when it is their level
\* (seedFor), else a fresh one. Which level the screen shows, and whether a link is up, are the variables.
VARIABLES screen, link, level, field
vars == <<screen, link, level, field>>

\* seedFor(friend, level, mode, fresh): the friend's own seed on the friend's level, a fresh one elsewhere.
FieldFor(l) == IF link /\ l = 1 THEN "friend" ELSE "mine"

Init == /\ screen = "title" /\ link = FALSE /\ level = 1 /\ field = "mine"

\* hashchange with a real challenge (or the page opening on one): the first screen shows their level and their field.
FriendLinkOpens == /\ link' = TRUE /\ level' = 1 /\ field' = "friend" /\ screen' = "title"
\* খেলো on the first screen plays the field it shows.
YouStart == /\ screen = "title" /\ screen' = "play" /\ UNCHANGED <<link, level, field>>
\* The round ends: the end screen.
TheRoundEnds == /\ screen = "play" /\ screen' = "over" /\ UNCHANGED <<link, level, field>>
\* আবার খেলো, and নতুন করে শুরু from the menu: again(run) keeps the friend's seed on their level.
YouPlayAgain == /\ screen \in {"play", "over"} /\ screen' = "play" /\ field' = FieldFor(level) /\ UNCHANGED <<link, level>>
\* পরের লেভেল: a fresh field on the next level.
YouPlayTheNextLevel == /\ screen = "over" /\ level = 1 /\ screen' = "play" /\ level' = 2 /\ field' = "mine" /\ UNCHANGED link
\* A level from সব লেভেল: pickLevel(l) → seedFor(friend, l, ...).
YouPickALevel == /\ \E l \in {1, 2} : level' = l /\ field' = FieldFor(l)
                 /\ screen' = "play" /\ UNCHANGED link

Next == FriendLinkOpens \/ YouStart \/ TheRoundEnds \/ YouPlayAgain \/ YouPlayTheNextLevel \/ YouPickALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ link \in BOOLEAN /\ level \in {1, 2} /\ field \in {"mine", "friend"}

\* While a friend's challenge is up and you are on their level, you play their field.
ReplayIsExact == (link /\ level = 1 /\ screen \in {"play", "over"}) => field = "friend"
====
