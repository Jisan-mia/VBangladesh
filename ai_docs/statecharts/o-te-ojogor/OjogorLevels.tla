---- MODULE OjogorLevels ----
\* অ-তে অজগর after the rewrite: levels, this game's own unlock, and old links, seen from the level list. Mirrored from
\* tools/o-te-ojogor/lib/progress.ts (readUnlock, afterClear, playable, nextUp, readOpened / withOpened) and
\* tools/o-te-ojogor/components/tree-game.tsx (finish → levels.record + afterClear; finishUp → nextUp; pickLevel; readLink
\* → withOpened + toTitle; seedFor: a link's level replays the link's seed). Pause and focus are in Ojogor.tla.
\* Three levels stand in for 22, so a link can land past a level that's still shut.
\* "links": levels an old link opened on this phone (ektukhani-links-o-te-ojogor). "friend": the last link's level.
\* "rival": the tree on screen grows from the link's seed. "ever": every level that was ever playable.
\* A reload reads the same stars, unlock and links back from the phone, so it is left out (it changes nothing here).
EXTENDS Naturals
VARIABLES phase, level, unlocked, cleared, links, friend, rival, ever
vars == <<phase, level, unlocked, cleared, links, friend, rival, ever>>

Levels == 1..3
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Playable(u, c, ls) == {l \in Levels : l <= u \/ l \in c \/ l \in ls}

Init == phase = "title" /\ level = 1 /\ unlocked = 1 /\ cleared = {} /\ links = {} /\ friend = 0 /\ rival = FALSE /\ ever = {1}

\* খেলো and the round won, as one step (the round itself changes no level): finish() keeps the stars (cleared), and
\* afterClear() opens the next level only if this one was already open. আবার খেলো and a win again is the same step from the end screen.
YouClearTheLevel == /\ phase' = "done" /\ cleared' = cleared \cup {level}
                    /\ unlocked' = IF level <= unlocked THEN Max(unlocked, Min(3, level + 1)) ELSE unlocked
                    /\ ever' = ever \cup Playable(unlocked', cleared', links)
                    /\ UNCHANGED <<level, links, friend, rival>>
\* শেষ: nextUp(): the next level when it is open, else this one.
YouFinishUp == /\ phase = "done" /\ phase' = "title"
               /\ level' = IF level < 3 /\ level + 1 <= unlocked THEN level + 1 ELSE level
               /\ rival' = (level' = friend)
               /\ UNCHANGED <<unlocked, cleared, links, friend, ever>>
\* সব লেভেল (only between rounds): any playable level; its tree is the link's when it is the link's level.
YouPickALevel == /\ \E next \in Playable(unlocked, cleared, links) : level' = next /\ rival' = (next = friend)
                 /\ phase' = "title" /\ UNCHANGED <<unlocked, cleared, links, friend, ever>>
\* readLink(): the link's level joins `links` on the phone, and toTitle(link level).
AnOldLinkOpens == /\ \E f \in Levels : friend' = f /\ links' = links \cup {f} /\ level' = f
                  /\ rival' = TRUE /\ phase' = "title"
                  /\ ever' = ever \cup Playable(unlocked, cleared, links')
                  /\ UNCHANGED <<unlocked, cleared>>
Next == YouClearTheLevel \/ YouFinishUp \/ YouPickALevel \/ AnOldLinkOpens
Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "done"} /\ level \in Levels /\ unlocked \in Levels /\ cleared \subseteq Levels
          /\ links \subseteq Levels /\ friend \in 0..3 /\ rival \in BOOLEAN /\ ever \subseteq Levels

\* A level you could open stays open.
UnlockNeverShrinks == ever \subseteq Playable(unlocked, cleared, links)
\* A friend's link plays exactly the friend's level (and, with it, the friend's seed).
ReplayIsExact == rival => level = friend
\* A link opens only its own level: the unlock rises only by clearing the level just below it.
LinkOpensOnlyItsLevel == unlocked > 1 => (unlocked - 1) \in cleared
\* The level on screen is always one you may play.
OnlyPlayableLevels == level \in Playable(unlocked, cleared, links)
====
