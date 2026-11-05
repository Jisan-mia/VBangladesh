---- MODULE Unlock ----
\* Which levels you may pick, after the rewrite: tools/golokdhadha/lib/levels.ts (openLevel, nextAhead) as finish() in
\* components/golokdhadha-game.tsx records a clear. Three levels stand in for thirty. `before` is what this phone had opened under the
\* old rule (shared/game-core unlockedLevel) when the rewrite shipped; old saved progress has no `ahead` list.
EXTENDS Naturals, FiniteSets
CONSTANT N
VARIABLES cleared, ahead, before, most
vars == <<cleared, ahead, before, most>>
Levels == 1..N
Max(S) == IF S = {} THEN 0 ELSE CHOOSE x \in S : \A y \in S : y <= x
Min2(a, b) == IF a < b THEN a ELSE b
\* game-core's rule: one past the highest cleared level.
Unlocked(S) == Min2(N, 1 + Max(S))
RECURSIVE Absorb(_, _, _)
Absorb(b, c, a) == IF b < N /\ b \in c /\ b \in a THEN Absorb(b + 1, c, a) ELSE b
\* openLevel: game-core's rule over your own clears, then any friend level you have since reached.
OpenOf(c, a) == Absorb(Unlocked(c \ a), c, a)
Open == OpenOf(cleared, ahead)
\* nextAhead: a level past what you had opened goes on the list; reached ones leave it.
AheadAfter(l) == LET rest == {x \in ahead : x # l /\ x >= Open} IN IF l > Open THEN rest \cup {l} ELSE rest

Init == /\ cleared \in SUBSET Levels /\ ahead = {} /\ before = Unlocked(cleared) /\ most = before

Clear(l) == /\ cleared' = cleared \cup {l} /\ ahead' = AheadAfter(l) /\ UNCHANGED before
            /\ most' = IF OpenOf(cleared', ahead') > most THEN OpenOf(cleared', ahead') ELSE most
\* পরের লেভেল or the level list: only levels you have opened.
YouClearALevel == \E l \in Levels : l <= Open /\ Clear(l)
\* A friend's link opens their level, wherever it is.
YouClearAFriendsLevel == \E l \in Levels : l > Open /\ Clear(l)

Next == YouClearALevel \/ YouClearAFriendsLevel
Spec == Init /\ [][Next]_vars

TypeOK == cleared \subseteq Levels /\ ahead \subseteq cleared /\ Open \in Levels
\* What you could pick never shrinks, from the old rule on.
UnlockNeverShrinks == Open >= most /\ Open >= before
\* Every level below the highest you may pick is one you cleared, or one the old rule had already opened.
FriendOpensNoGap == \A l \in 1..(Open - 1) : l \in cleared \/ l < before
\* A friend's level you cleared keeps its stars.
FriendStarsKept == ahead \subseteq cleared
====
