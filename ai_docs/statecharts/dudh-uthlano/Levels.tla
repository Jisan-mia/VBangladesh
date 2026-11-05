---- MODULE Levels ----
EXTENDS Naturals
\* The unlock rules, apart from the play flow: which levels are cleared, which clears came from a friend's far-ahead level (`ahead`),
\* and which level you may pick. Three levels stand for the twelve; FAR is the level a friend's link carries.
\* Mirrored from tools/dudh-uthlano/lib/levels.ts (openLevel, nextAhead) and components/game.tsx (finish, pickLevel),
\* with shared/game-core.ts unlockedLevel() left as it is (it opens everything below the highest recorded level, on purpose).
VARIABLES cleared, ahead, lvl, played
vars == <<cleared, ahead, lvl, played>>
Levels == 1..3
FAR == 3

Max0(S) == IF S = {} THEN 0 ELSE CHOOSE m \in S : \A x \in S : x <= m
Own == LET o == 1 + Max0(cleared \ ahead) IN IF o > 3 THEN 3 ELSE o
Next1(o) == IF o < 3 /\ o \in cleared /\ o \in ahead THEN o + 1 ELSE o
OpenLevel == Next1(Next1(Own))

Init == cleared = {} /\ ahead = {} /\ lvl = 1 /\ played = FALSE

\* pickLevel(k): only an open level (the list's keys 1-9 and the rows do the same).
YouPickLevel(k) == /\ k <= OpenLevel /\ lvl' = k /\ played' = FALSE /\ UNCHANGED <<cleared, ahead>>
\* A friend's link opens their far level for that round only; it is not an unlock.
YouOpenFriendsLevel == /\ lvl' = FAR /\ played' = FALSE /\ UNCHANGED <<cleared, ahead>>
\* finish(): levels.record(level, stars), and nextAhead(): a level beyond what you had open is kept apart.
YouClearIt == /\ ~played /\ played' = TRUE /\ cleared' = cleared \cup {lvl}
              /\ ahead' = LET rest == {x \in ahead : x # lvl /\ x >= OpenLevel}
                          IN IF lvl > OpenLevel THEN rest \cup {lvl} ELSE rest
              /\ UNCHANGED lvl
YouLoseIt == /\ ~played /\ played' = TRUE /\ UNCHANGED <<cleared, ahead, lvl>>
Next == (\E k \in Levels : YouPickLevel(k)) \/ YouOpenFriendsLevel \/ YouClearIt \/ YouLoseIt

Spec == Init /\ [][Next]_vars

TypeOK == cleared \subseteq Levels /\ ahead \subseteq cleared /\ lvl \in Levels /\ played \in BOOLEAN
OnlyOpenLevelsAreOurs == (lvl <= OpenLevel \/ lvl = FAR)
FriendFarLevelOpensNothingBetween == (FAR \in ahead) => OpenLevel <= 1 + Max0(cleared \ {FAR})
ClearedLevelsStayCleared == \A k \in cleared : k \in Levels
OpenLevelCoversWhatYouCleared == \A k \in cleared \ ahead : k < 3 => k + 1 <= OpenLevel
====
