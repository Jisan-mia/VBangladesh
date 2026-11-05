---- MODULE SatCharaLevels ----
\* সাত চাড়া after the rewrite, saved progress: which levels are open, and what a friend's link opens.
\* Mirrored from tools/sat-chara/components/game.tsx (the first-load effect → toTitle(link.kind, link.level); finish() →
\* recordLevel + openAfter; pickLevel → playable; nextLevel; the old-link round) and tools/sat-chara/lib/save.ts
\* (openAfter, playable, readOpen, recommended), on top of shared/game-kit.ts recordLevel (stars only go up).
\* The kit's unlockedLevel (which counts the highest level cleared) is not used for what opens: the game keeps its own key.
\* Three levels; a friend's link is for level 3; an old-format link opens one old pile as a one-off round.
\* Throwing is one step: you clear the level or you don't.
EXTENDS Naturals
VARIABLES kind, level, done, cleared, open, visit
vars == <<kind, level, done, cleared, open, visit>>

Levels == 1..3
Run(c) == IF 1 \notin c THEN 0 ELSE IF 2 \notin c THEN 1 ELSE IF 3 \notin c THEN 2 ELSE 3
\* save.ts playable(): a level you opened yourself, or the one a friend's link brought you to this visit.
Playable(n) == n <= open \/ n = visit
\* save.ts openAfter(): clearing the frontier level opens the next one; any other clear opens nothing.
OpenAfter(o, l) == IF l = o /\ o < 3 THEN o + 1 ELSE o

\* A fresh phone, no link: the title shows the recommended level, 1.
Init == kind = "level" /\ level = 1 /\ done = FALSE /\ cleared = {} /\ open = 1 /\ visit = 0

\* finish(): a cleared level round records its stars and may open the next. An old-link round records nothing.
YouClearIt == /\ ~done /\ done' = TRUE
              /\ IF kind = "level" THEN cleared' = cleared \cup {level} /\ open' = OpenAfter(open, level)
                 ELSE cleared' = cleared /\ open' = open
              /\ UNCHANGED <<kind, level, visit>>
\* পরের লেভেল: offered only when the next level is playable.
NextLevel == /\ done /\ kind = "level" /\ level < 3 /\ Playable(level + 1) /\ level' = level + 1 /\ done' = FALSE
             /\ UNCHANGED <<kind, cleared, open, visit>>
\* আবার খেলো.
PlayAgain == /\ done /\ done' = FALSE /\ UNCHANGED <<kind, level, cleared, open, visit>>
\* The সব লেভেল list: a row you may play.
PickLevel == /\ \E n \in Levels : Playable(n) /\ level' = n /\ kind' = "level" /\ done' = FALSE /\ UNCHANGED <<cleared, open, visit>>
\* A valid #…&v=2&c=3 link on load or on hashchange: the title for level 3, playable this visit only.
FriendLinkOpens == /\ visit = 0 /\ visit' = 3 /\ kind' = "level" /\ level' = 3 /\ done' = FALSE /\ UNCHANGED <<cleared, open>>
\* An old-format link: one old pile as a one-off round.
OldLinkOpens == /\ kind' = "old" /\ level' = 1 /\ done' = FALSE /\ UNCHANGED <<cleared, open, visit>>

Next == YouClearIt \/ NextLevel \/ PlayAgain \/ PickLevel \/ FriendLinkOpens \/ OldLinkOpens
Spec == Init /\ [][Next]_vars

TypeOK == kind \in {"level", "old"} /\ level \in Levels /\ done \in BOOLEAN /\ cleared \subseteq Levels /\ open \in Levels /\ visit \in {0, 3}
\* LevelIsOpen: the level you play is one you can open.
LevelIsOpen == kind = "level" => Playable(level)
\* OpenLevelsAreEarned: on this phone, a level opens only after you clear every level before it.
\* A friend's level is playable for that visit, but it never opens the levels between.
OpenLevelsAreEarned == open <= Run(cleared) + 1
\* UnlockNeverShrinks and StarsNeverDrop (a cleared level stays cleared).
UnlockNeverShrinks == [][open' >= open]_vars
StarsNeverDrop == [][cleared \subseteq cleared']_vars
\* OldPileRecordsNothing: an old-format round never changes stars or open levels.
OldPileRecordsNothing == [][kind = "old" => (cleared' = cleared /\ open' = open)]_vars
====
