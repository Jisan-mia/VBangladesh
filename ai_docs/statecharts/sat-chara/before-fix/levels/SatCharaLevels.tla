---- MODULE SatCharaLevels ----
\* সাত চাড়া, saved progress: which levels are open, and what a friend's link opens.
\* Mirrored from tools/sat-chara/components/sat-chara-game.tsx (readFriend → startLevel(found.level); the levels.loaded effect;
\* win() → levels.record; unlockedOrFriend = max(levels.unlocked, friend.level) for the সব লেভেল grid; the result buttons),
\* shared/game-kit.ts (useLevels) and shared/game-core.ts (unlockedLevel = min(count, 1 + highest level with stars)).
\* Three levels; the friend's link is for level 3. Throwing is one step: you clear the level or you don't.
EXTENDS Naturals
VARIABLES level, done, cleared, friend
vars == <<level, done, cleared, friend>>

Levels == 1..3
Top(c) == IF 3 \in c THEN 3 ELSE IF 2 \in c THEN 2 ELSE IF 1 \in c THEN 1 ELSE 0
Run(c) == IF 1 \notin c THEN 0 ELSE IF 2 \notin c THEN 1 ELSE IF 3 \notin c THEN 2 ELSE 3
Unlocked == IF Top(cleared) + 1 > 3 THEN 3 ELSE Top(cleared) + 1
Open == IF friend > Unlocked THEN friend ELSE Unlocked

\* A fresh phone, opened without a link: the levels.loaded effect starts at levels.unlocked = 1.
Init == level = 1 /\ done = FALSE /\ cleared = {} /\ friend = 0

\* win(): levels.record(level, stars).
YouClearIt == /\ ~done /\ done' = TRUE /\ cleared' = cleared \cup {level} /\ UNCHANGED <<level, friend>>
\* পরের লেভেল (or Enter on the stars).
NextLevel == /\ done /\ level < 3 /\ level' = level + 1 /\ done' = FALSE /\ UNCHANGED <<cleared, friend>>
\* আবার খেলো / আরেকবার after three balls.
PlayAgain == /\ done' = FALSE /\ UNCHANGED <<level, cleared, friend>> /\ done
\* The সব লেভেল grid: any level up to unlockedOrFriend.
PickLevel == /\ \E n \in 1..Open : n # level /\ level' = n /\ done' = FALSE /\ UNCHANGED <<cleared, friend>>
\* readFriend: a valid #s=24757&t=…&l=3 link sets friend and startLevel(3) (on load or on hashchange).
FriendLinkOpens == /\ friend = 0 /\ friend' = 3 /\ level' = 3 /\ done' = FALSE /\ UNCHANGED cleared

Next == YouClearIt \/ NextLevel \/ PlayAgain \/ PickLevel \/ FriendLinkOpens
Spec == Init /\ [][Next]_vars

TypeOK == level \in Levels /\ done \in BOOLEAN /\ cleared \subseteq Levels /\ friend \in {0, 3}
\* LevelIsOpen: the level you play is one you can open.
LevelIsOpen == level <= Open
\* OpenLevelsAreEarned: on this phone, a level opens only after you clear every level before it.
\* A friend's level is playable for that visit, but it never opens the levels between.
OpenLevelsAreEarned == Unlocked <= Run(cleared) + 1
====
