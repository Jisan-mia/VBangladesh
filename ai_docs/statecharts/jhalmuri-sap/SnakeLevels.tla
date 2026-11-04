---- MODULE SnakeLevels ----
\* ঝালমুড়ি সাপ after the rewrite, part 2: the level list, a friend's link and this game's own unlock.
\* Mirrored from tools/jhalmuri-sap/lib/progress.ts (readUnlock, afterClear, playable), lib/session.ts (pick, reset) and
\* components/snake-game.tsx (choose, the hashchange effect, finish). Levels are abstract: 1 and 2 are your own, 3 is a friend's
\* level far ahead of yours. The run itself (pause, away, the card) is part 1, Snake.tla.
EXTENDS Naturals
VARIABLES phase, picking, friend, on, seed, unlock, ownBest
vars == <<phase, picking, friend, on, seed, unlock, ownBest>>
Max == 3
Playable(l) == l <= unlock \/ (friend /\ l = 3)
Fresh(l) == IF friend /\ l = 3 THEN "theirs" ELSE "fresh"

Init == /\ phase = "title" /\ picking = FALSE /\ friend = FALSE /\ on = 1 /\ seed = "fresh" /\ unlock = 1 /\ ownBest = 0

YouStart == /\ phase = "title" /\ ~picking /\ phase' = "playing"
            /\ UNCHANGED <<picking, friend, on, seed, unlock, ownBest>>
\* finish(): a clear raises the unlock only when the level was already open (afterClear); a friend's level keeps its stars only.
YouClear == /\ phase = "playing" /\ phase' = "over"
            /\ unlock' = IF on <= unlock THEN IF on + 1 > Max THEN Max ELSE IF on + 1 > unlock THEN on + 1 ELSE unlock ELSE unlock
            /\ ownBest' = IF on <= unlock /\ on > ownBest THEN on ELSE ownBest
            /\ UNCHANGED <<picking, friend, on, seed>>
YouCrash == /\ phase = "playing" /\ phase' = "over"
            /\ UNCHANGED <<picking, friend, on, seed, unlock, ownBest>>
\* সব লেভেল (title or card only) and ফিরে যাও.
YouOpenList == /\ phase \in {"title", "over"} /\ ~picking /\ picking' = TRUE
               /\ UNCHANGED <<phase, friend, on, seed, unlock, ownBest>>
YouCloseList == /\ picking /\ picking' = FALSE
                /\ UNCHANGED <<phase, friend, on, seed, unlock, ownBest>>
\* A row in the list or the লেভেল/ক্লাসিক chips: choose() → reset() → the title with that level's board.
YouPickLevel(l) == /\ phase \in {"title", "over"} /\ Playable(l)
                   /\ phase' = "title" /\ picking' = FALSE /\ on' = l /\ seed' = Fresh(l)
                   /\ UNCHANGED <<friend, unlock, ownBest>>
\* পরের লেভেল / আবার খেলো on the card: again() → deal(level).
YouPlayAgain(l) == /\ phase = "over" /\ ~picking /\ Playable(l)
                   /\ phase' = "playing" /\ on' = l /\ seed' = Fresh(l)
                   /\ UNCHANGED <<picking, friend, unlock, ownBest>>
\* hashchange with a valid link: the friend's seed and level, on the title.
FriendLinkOpens == /\ ~friend /\ friend' = TRUE /\ phase' = "title" /\ picking' = FALSE /\ on' = 3 /\ seed' = "theirs"
                   /\ UNCHANGED <<unlock, ownBest>>

Next == YouStart \/ YouClear \/ YouCrash \/ YouOpenList \/ YouCloseList \/ FriendLinkOpens
        \/ (\E l \in 1..Max : YouPickLevel(l) \/ YouPlayAgain(l))
Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "over"} /\ picking \in BOOLEAN /\ friend \in BOOLEAN
          /\ on \in 1..Max /\ seed \in {"theirs", "fresh"} /\ unlock \in 1..Max /\ ownBest \in 0..Max
ChoiceFreezesPlay == picking => phase # "playing"
ReplayIsExact == (friend /\ on = 3) => seed = "theirs"
FriendClearOpensNothingBetween == unlock <= ownBest + 1
OnlyPlayableLevels == on <= unlock \/ (friend /\ on = 3) \/ on <= ownBest
UnlockNeverShrinks == [][unlock' >= unlock]_unlock
====
