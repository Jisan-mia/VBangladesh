---- MODULE Hisab ----
\* মুখে মুখে হিসাব: the 60-second round and its clock, pause, window focus, the end-of-round cheer timer, levels and the
\* friend link, and the sums running out. Mirrored from tools/mukhe-mukhe-hisab/components/hisab-game.tsx (handlers named below),
\* shared/game-kit.ts (useLevels) and shared/game-core.ts (recordLevel, unlockedLevel).
\* Abstractions: time is counted in one abstract second (enough: a pause either keeps it or loses it).
\* `left` is what the game will still give you: endAt − now while
\* the clock runs, clock.remaining while paused. `owed` is a ghost: the time you should still have, which only a running
\* clock may spend. `stale` says endAt is at least a second in the past while paused (wall time went on).
\* Answers are not modelled one by one: the stars are decided when the time runs out. Saved progress is `unl`
\* (unlockedLevel: one past the highest level with stars, at most 3) and `c1` (level 1 has stars). Levels 2 and 3 act
\* alike here (clearing either saves level 3 open), so `level` is 1 or 2, and 2 also stands for the friend's level 3.
EXTENDS Naturals

Link == 3
Full == 1

VARIABLES phase, paused, win, left, owed, stale, cheer, level, unl, c1, link
vars == <<phase, paused, win, left, owed, stale, cheer, level, unl, c1, link>>

Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Open == Max(unl, link)        \* const open = Math.max(levels.unlocked, friend?.level ?? 1)
Here == win = "here"
Running == phase = "playing" /\ ~paused
Round == <<left, owed, stale>>

Init == /\ phase = "ready" /\ paused = FALSE /\ win = "here"
        /\ left = Full /\ owed = Full /\ stale = FALSE /\ cheer = FALSE
        /\ level = 1 /\ unl = 1 /\ c1 = FALSE /\ link = 0

\* start() from শুরু করো or Enter: drawer(), setPhase("playing"), startClock(seconds).
YouStart == /\ Here /\ phase = "ready" /\ ~paused
            /\ phase' = "playing"
            /\ UNCHANGED <<paused, win, left, owed, stale, cheer, level, unl, c1, link>>
\* The 100 ms meter while the clock runs: a second goes by. Nothing in the game looks at focus.
ASecondPasses == /\ Running /\ left > 0
                 /\ left' = left - 1 /\ owed' = Max(0, owed - 1)
                 /\ UNCHANGED <<phase, paused, win, stale, cheer, level, unl, c1, link>>
\* rest <= 0: stopAll(), setPhase("over"), bell(). The end effect records the stars once (finished = level:seed) and
\* queues the cheer with later(), which goTo's stopAll() clears.
TimeRunsOut == /\ Running /\ left = 0
               /\ phase' = "over" /\ cheer' = TRUE /\ owed' = 0   \* the ghost ends with the round
               /\ \/ unl' = unl /\ c1' = c1                                      \* too few right: no stars
                  \/ unl' = Max(unl, Min(3, level + 1)) /\ c1' = (c1 \/ level = 1)  \* cleared: levels.record
               /\ UNCHANGED <<paused, win, left, stale, level, link>>
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<phase, paused, win, left, owed, stale, level, unl, c1, link>>
\* submit() → answerRun(): run.index + 1, right or wrong. makeQuestions made QUESTIONS = 120 sums; the next render reads
\* questions[120] (undefined), `shown.answer` throws, and the error boundary replaces the game with "কিছু একটা গড়বড়".
\* Other answers change nothing the rules read, so only the 120th is modelled.
\* The unmount runs the effect cleanups (stopAll), and the component's state is gone.
YouAnswerTheLastSum == /\ Here /\ Running
                       /\ phase' = "broken" /\ paused' = FALSE
                       /\ left' = Full /\ owed' = Full /\ stale' = FALSE /\ cheer' = FALSE
                       /\ UNCHANGED <<win, level, unl, c1, link>>
\* আবার চেষ্টা করি: the boundary remounts the game, which reads the hash again (readFriend) or opens where you left off.
YouPressTryAgain == /\ Here /\ phase = "broken"
                    /\ phase' = "ready" /\ level' = IF link # 0 THEN 2 ELSE Min(2, unl)
                    /\ UNCHANGED <<paused, win, left, owed, stale, cheer, unl, c1, link>>

\* Wall time while paused: the interval is stopped, but endAt stays where it was.
TimeGoesByWhilePaused == /\ phase = "playing" /\ paused /\ ~stale
                         /\ stale' = TRUE
                         /\ UNCHANGED <<phase, paused, win, left, owed, cheer, level, unl, c1, link>>

\* No blur or focus listener in the component.
WindowBlurs == /\ Here /\ win' = "away" /\ UNCHANGED <<phase, paused, left, owed, stale, cheer, level, unl, c1, link>>
WindowFocuses == /\ win = "away" /\ win' = "here" /\ UNCHANGED <<phase, paused, left, owed, stale, cheer, level, unl, c1, link>>
\* hide(): only `phaseRef.current !== "playing"` is checked, not `paused`. It sets
\* clock.remaining = max(0, endAt − now), stopAll(), setMiss(null), setPaused(true). Already paused, endAt is stale.
TabHides == /\ win \in {"here", "away"} /\ win' = "hidden"
            /\ IF phase = "playing"
                 THEN /\ paused' = TRUE
                      /\ left' = IF paused /\ stale THEN Max(0, left - 1) ELSE left
                 ELSE UNCHANGED <<paused, left>>
            /\ UNCHANGED <<phase, owed, stale, cheer, level, unl, c1, link>>
TabShows == /\ win = "hidden" /\ win' = "here" /\ UNCHANGED <<phase, paused, left, owed, stale, cheer, level, unl, c1, link>>
\* resume() from চালিয়ে যাও or Enter: startClock(clock.remaining), so endAt is fresh again.
YouResume == /\ Here /\ paused
             /\ paused' = FALSE /\ stale' = FALSE
             /\ UNCHANGED <<phase, win, left, owed, cheer, level, unl, c1, link>>

\* goTo(next): stopAll() (the meter, the miss timer and the cheer), a fresh round, paused cleared. From LevelGrid (open
\* during play), আরেকবার, আবার খেলো, পরের লেভেল or Enter (those start at once), or the arrows when not playing.
YouStartALevel(l) == /\ Here /\ l <= Open
                     /\ level' = Min(2, l)
                     /\ phase' \in IF phase = "over" THEN {"ready", "playing"} ELSE {"ready"}
                     /\ paused' = FALSE
                     /\ left' = Full /\ owed' = Full /\ stale' = FALSE /\ cheer' = FALSE
                     /\ UNCHANGED <<win, unl, c1, link>>
\* readFriend() after the stars load, or on hashchange: a valid link to level 3 → goTo(3, seed).
YouOpenAFriendLink == /\ Here /\ link = 0
                      /\ link' = Link /\ level' = 2 /\ phase' = "ready" /\ paused' = FALSE
                      /\ left' = Full /\ owed' = Full /\ stale' = FALSE /\ cheer' = FALSE
                      /\ UNCHANGED <<win, unl, c1>>

Next == \/ YouStart \/ ASecondPasses \/ YouAnswerTheLastSum \/ YouPressTryAgain \/ TimeRunsOut \/ TheCheerPlays \/ TimeGoesByWhilePaused
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ \E l \in 1..3 : YouStartALevel(l)
        \/ YouOpenAFriendLink

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "over", "broken"} /\ paused \in BOOLEAN /\ win \in {"here", "away", "hidden"}
          /\ left \in 0..Full /\ owed \in 0..Full /\ stale \in BOOLEAN /\ cheer \in BOOLEAN
          /\ level \in 1..2 /\ unl \in 1..3 /\ c1 \in BOOLEAN /\ link \in {0, Link}

\* ---- the reader's rules ----
\* NoProgressWhileAway + PausedWhenBlurred: the 60 seconds never run while you're in another window or tab.
ClockStillWhileAway == Running => Here
\* PausedWhenHidden.
PausedWhenHidden == (win = "hidden" /\ phase = "playing") => paused
\* A pause keeps every second you had: the clock gives back exactly what it took away.
PauseKeepsYourTime == left = owed
\* The round never runs out of sums before the clock does.
SumsOutlastTheClock == phase # "broken"
\* NoCheerAfterYouMoveOn: the win sound and confetti play only on that round's result.
NoCheerAfterYouMoveOn == cheer => phase = "over"
\* UnlockFollowsClears: level 2 opens only after you clear level 1 (a link may open its own level, not the ones before it).
LinkOpensOnlyItsLevel == Open >= 2 => c1
SavedUnlockIsEarned == unl >= 2 => c1
UnlockNeverShrinks == [][unl' >= unl /\ (c1 => c1')]_vars
====
