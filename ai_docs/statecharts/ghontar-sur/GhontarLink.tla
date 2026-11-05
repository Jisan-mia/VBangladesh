---- MODULE GhontarLink ----
\* ঘণ্টার সুর links: a friend's level link opens that level (levels 1–2 here, 0 is the endless run) and starts it from its
\* first note; mirrors fromHash() and pickLevel() in tools/ghontar-sur/components/bell-game.tsx. The old game's link carried no
\* start level, so a run started from level 2 replayed from level 1 (bug 5 of the first report).
EXTENDS Naturals
VARIABLES phase, level, sent, round
vars == <<phase, level, sent, round>>
Init == phase = "ready" /\ level = 1 /\ sent = 0 /\ round = 1
YouStart == phase = "ready" /\ phase' = "play" /\ UNCHANGED <<level, sent, round>>
YouClearARound == phase = "play" /\ round < 2 /\ round' = round + 1 /\ UNCHANGED <<phase, level, sent>>
YouPickALevel == \E l \in 1..2 : level' = l /\ sent' = 0 /\ phase' = "ready" /\ round' = 1
AFriendsLevelLinkOpens == \E s \in 1..2 : sent' = s /\ level' = s /\ phase' = "ready" /\ round' = 1
AnEndlessLinkOpens == level' = 0 /\ sent' = 0 /\ phase' = "ready" /\ round' = 1
YouPlayAgain == level' = level /\ phase' = "ready" /\ round' = 1 /\ UNCHANGED sent
Next == YouStart \/ YouClearARound \/ YouPickALevel \/ AFriendsLevelLinkOpens \/ AnEndlessLinkOpens \/ YouPlayAgain
Spec == Init /\ [][Next]_vars
TypeOK == phase \in {"ready", "play"} /\ level \in 0..2 /\ sent \in 0..2 /\ round \in 1..2
\* A friend's level link opens that level on the title.
ReplayIsExact == (sent # 0 /\ phase = "ready") => level = sent
\* Every title, a friend's or your own, starts from the first note.
StartsAtTheFirstNote == phase = "ready" => round = 1
====
