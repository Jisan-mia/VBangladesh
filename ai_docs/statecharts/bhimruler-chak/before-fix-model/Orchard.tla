---- MODULE Orchard ----
\* ভিমরুলের চাক: the round and its clock, pause, window focus, the touch long press, levels and the friend link,
\* mirrored from tools/bhimruler-chak/components/orchard-game.tsx (handlers named below) and
\* shared/game-core.ts (recordLevel, unlockedLevel), shared/game-kit.ts (useLevels).
\* Abstractions: the board is not modelled cell by cell. "running" means clockRef.since !== null; "friendBoard" is a
\* friend's orchard with their first opening done and the clock not started yet. Saved progress is kept as `unl`
\* (unlockedLevel: one past the highest level with stars, at most 3, which is all LevelGrid reads) and `c1` (level 1 has stars).
EXTENDS Naturals

Levels == 1..3
Link == 3              \* the friend link, when there is one, points at level 3

VARIABLES game, win, press, level, unl, c1, link, records
vars == <<game, win, press, level, unl, c1, link, records>>

Games == {"ready", "friendBoard", "running", "paused", "won", "lost"}
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
\* unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1): what LevelGrid lets you pick
Open == Max(unl, link)
Here == win = "here"
Touchable == game \in {"ready", "friendBoard", "running"}

\* First load: no link (or an invalid one, which parseShared refuses), level 1, nothing cleared.
Init == /\ link = 0 /\ level = 1 /\ game = "ready"
        /\ win = "here" /\ press = FALSE
        /\ unl = 1 /\ c1 = FALSE /\ records = 0

\* readFriend() on load or on hashchange: a valid link to level 3 → goLevel(3) lays the friend's board with their
\* first cell already open. (A second link changes nothing the rules read, so only the first is modelled.)
YouOpenAFriendLink == /\ Here /\ ~press /\ link = 0
                      /\ link' = Link /\ level' = Link /\ game' = "friendBoard" /\ records' = 0
                      /\ UNCHANGED <<win, press, unl, c1>>

\* clear() / mark() / hint() → startClock(): the first move starts the clock; later ones keep it running.
YouMakeAMove == /\ Here /\ game \in {"ready", "friendBoard", "running"}
                /\ game' = "running"
                /\ UNCHANGED <<win, press, level, unl, c1, link, records>>
\* land() → win(): stopClock, levels.record(level, stars), confetti or sfx.good.
YouClearTheLastBush == /\ Here /\ game \in {"friendBoard", "running"}
                       /\ game' = "won" /\ records' = records + 1
                       /\ unl' = Max(unl, Min(3, level + 1)) /\ c1' = (c1 \/ level = 1)
                       /\ UNCHANGED <<win, press, level, link>>
\* land() → lose(): stopClock, the swarm hum (1.3 s, stopped by goLevel).
YouHitANest == /\ Here /\ game \in {"friendBoard", "running"}
               /\ game' = "lost"
               /\ UNCHANGED <<win, press, level, unl, c1, link, records>>

\* onDown (touch only): a 420 ms timer that ties a গামছা. onUp / onMove past 10px / pointercancel clear it.
YouTouchAndHold == /\ Here /\ Touchable /\ ~press
                   /\ press' = TRUE
                   /\ UNCHANGED <<game, win, level, unl, c1, link, records>>
YouLiftYourFinger == /\ Here /\ press
                     /\ press' = FALSE
                     /\ UNCHANGED <<game, win, level, unl, c1, link, records>>
\* The timer fires mark(cell) with no check of focus. mark() → startClock(), so it also starts a friend board's clock.
TheLongPressTies == /\ press /\ Touchable
                    /\ press' = FALSE
                    /\ game' = IF game = "ready" THEN "ready" ELSE "running"
                    /\ UNCHANGED <<win, level, unl, c1, link, records>>

\* No blur or focus listener in the component.
WindowBlurs == /\ Here /\ win' = "away" /\ UNCHANGED <<game, press, level, unl, c1, link, records>>
WindowFocuses == /\ win = "away" /\ win' = "here" /\ UNCHANGED <<game, press, level, unl, c1, link, records>>
\* hide(): cancelPress(); if the clock runs and the round is playing, stopClock() and setPaused(true).
TabHides == /\ win \in {"here", "away"}
            /\ win' = "hidden" /\ press' = FALSE
            /\ game' = IF game = "running" THEN "paused" ELSE game
            /\ UNCHANGED <<level, unl, c1, link, records>>
TabShows == /\ win = "hidden" /\ win' = "here" /\ UNCHANGED <<game, press, level, unl, c1, link, records>>
\* resume() from চালিয়ে যাও or Enter: since = now when spent > 0.
YouResume == /\ Here /\ game = "paused"
             /\ game' = "running"
             /\ UNCHANGED <<win, press, level, unl, c1, link, records>>

\* goLevel(next) from LevelGrid, আবার খেলো, পরের লেভেল, আরেকবার or Enter: a fresh orchard (the friend's on their level),
\* clock reset, paused cleared. It does not clear a touch in flight, so it needs the finger up.
YouStartALevel(l) == /\ Here /\ ~press /\ l <= Open
                     /\ level' = l
                     /\ game' = IF l = link THEN "friendBoard" ELSE "ready"
                     /\ records' = 0
                     /\ UNCHANGED <<win, press, unl, c1, link>>

Next == \/ YouOpenAFriendLink \/ YouMakeAMove \/ YouClearTheLastBush \/ YouHitANest
        \/ YouTouchAndHold \/ YouLiftYourFinger \/ TheLongPressTies
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ \E l \in Levels : YouStartALevel(l)

Spec == Init /\ [][Next]_vars

TypeOK == /\ game \in Games /\ win \in {"here", "away", "hidden"} /\ press \in BOOLEAN
          /\ level \in Levels /\ unl \in Levels /\ c1 \in BOOLEAN /\ link \in {0, Link} /\ records \in 0..2

\* ---- the reader's rules ----
\* NoProgressWhileAway + PausedWhenBlurred: the star clock never runs while you're in another window or tab.
ClockStillWhileAway == game = "running" => Here
\* PausedWhenHidden: a hidden tab never leaves the clock running.
PausedWhenHidden == win = "hidden" => game # "running"
\* InputReleasedWhenAway: once you leave, no finger counts as held (so no গামছা gets tied behind your back).
InputReleasedWhenAway == press => Here
\* NoDoubleResult: a round records its stars once.
NoDoubleResult == records <= 1
\* ReplayIsExact: the friend's level always gives the friend's orchard, never a fresh one.
ReplayIsExact == (link # 0 /\ level = link) => game # "ready"
\* UnlockFollowsClears: level 2 opens only after you clear level 1 (a link may open its own level, not the ones before it).
LinkOpensOnlyItsLevel == Open >= 2 => c1
\* ...and the progress saved on this phone opens level 2 or 3 only after you clear level 1.
SavedUnlockIsEarned == unl >= 2 => c1
\* UnlockNeverShrinks (and StarsNeverDrop, as far as unlocking reads them).
UnlockNeverShrinks == [][unl' >= unl /\ (c1 => c1')]_vars
====
