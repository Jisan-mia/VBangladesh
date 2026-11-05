---- MODULE Unlock ----
\* Which levels open on this phone, with a friend's link in the mix, and the stars kept. Mirrors tools/vo-katta/lib/levels.ts
\* (openLevel, nextAhead, starsOf) and the component's finish(): a clear records max(stars) and, when the level is beyond
\* your own unlock (a friend's far link), lists it in `ahead` so it doesn't open the levels in between. Three levels stand in
\* for twelve. A separate spec only so each chart stays under the tool's 500-state budget.
EXTENDS Naturals, FiniteSets
CONSTANT N
VARIABLES stars, ahead
vars == <<stars, ahead>>
Levels == 1..N
Max(a, b) == IF a > b THEN a ELSE b
Cleared == {l \in Levels : stars[l] > 0}
\* unlockedLevel from shared/game-core.ts: one past the highest cleared.
Unlocked(c) == IF c = {} THEN 1 ELSE IF (CHOOSE m \in c : \A k \in c : k <= m) + 1 > N THEN N ELSE (CHOOSE m \in c : \A k \in c : k <= m) + 1
RECURSIVE Climb(_)
Climb(o) == IF o < N /\ stars[o] > 0 /\ o \in ahead THEN Climb(o + 1) ELSE o
Open == Climb(Unlocked(Cleared \ ahead))
Init == stars = [l \in Levels |-> 0] /\ ahead = {}
\* You clear an open level (stars 1–3 by kites kept).
YouClear(l, s) == /\ l <= Open
                  /\ stars' = [stars EXCEPT ![l] = Max(@, s)]
                  /\ ahead' = {a \in ahead : a # l /\ a >= Open}
\* A friend's link opens their level; you clear it from there, even if it is beyond your own unlock.
YouClearFriendsLevel(l, s) == /\ l > Open
                              /\ stars' = [stars EXCEPT ![l] = Max(@, s)]
                              /\ ahead' = {a \in ahead : a # l /\ a >= Open} \cup {l}
Next == \E l \in Levels, s \in 1..3 : YouClear(l, s) \/ YouClearFriendsLevel(l, s)
Spec == Init /\ [][Next]_vars
TypeOK == stars \in [Levels -> 0..3] /\ ahead \subseteq Levels
\* Every level below the highest you may pick was cleared by you.
FriendOpensNoGap == \A l \in 1..(Open - 1) : stars[l] > 0
StarsNeverDrop == [][\A l \in Levels : stars'[l] >= stars[l]]_vars
UnlockNeverShrinks == [][Open' >= Open]_vars
FriendStarsKept == \A l \in ahead : stars[l] > 0
====
