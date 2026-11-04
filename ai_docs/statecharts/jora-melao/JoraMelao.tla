---- MODULE JoraMelao ----
\* জোড়া মেলাও (solo levels): one board (ready, one card up, a missed pair showing, over), the hidden-tab pause,
\* the miss timer, the "সব জোড়া মিলেছে" panel and cheer timers, the levels and their stars, and a friend's link.
\* Mirrored from tools/jora-melao/components/pairs-game.tsx (tap, start, playLevel, again, nextLevel, pick,
\* the miss effect, the end effect, the visibilitychange effect, the opened/hashchange effect),
\* tools/jora-melao/lib/game.ts (flip, settle) and shared/game-core.ts (recordLevel, unlockedLevel).
\* Abstractions: 2 levels, 1 pair a board (more pairs only repeat the flip loop), a clear earns 1 or 2 stars (by moves), two-player mode left out
\* (no stars; the same pause and timers). No sound loops: only one-shot sounds.
EXTENDS Naturals
VARIABLES link, level, board, found, paused, visible, panel, cheer, stars, recorded
vars == <<link, level, board, found, paused, visible, panel, cheer, stars, recorded>>

Levels == 1..2
Pairs == 1
Max(a, b) == IF a > b THEN a ELSE b
Unlocked == IF stars[1] > 0 \/ stars[2] > 0 THEN 2 ELSE 1
\* board: "ready" (the demo pair up, nothing tapped), "none" (no unmatched card up), "one" (first card of a move up),
\* "missed" (a missed pair waiting to turn back), "over".
Playing == board \in {"none", "one", "missed"}
Fresh(l) == /\ level' = l /\ board' = "ready" /\ found' = 0 /\ paused' = FALSE /\ panel' = FALSE /\ cheer' = FALSE /\ recorded' = 0

\* opened effect: a friend's link (parseCard accepts any level) or the level this phone left off at.
Init == /\ link \in {"none", "friend"} /\ level = (IF link = "friend" THEN 2 ELSE 1)
        /\ board = "ready" /\ found = 0 /\ paused = FALSE /\ visible = TRUE /\ panel = FALSE /\ cheer = FALSE
        /\ stars = [l \in Levels |-> 0] /\ recorded = 0

\* tap() → flip(): nothing while paused. A missed pair still up turns back first. The second card matches or misses.
\* The last match ends the board, and the end effect records the stars once and queues the panel and the cheer.
YouFlipACard ==
  /\ visible /\ ~paused /\ board # "over"
  /\ \/ /\ board \in {"ready", "none", "missed"} /\ board' = "one"
        /\ UNCHANGED <<found, panel, cheer, stars, recorded>>
     \/ /\ board = "one" /\ board' = "missed" /\ UNCHANGED <<found, panel, cheer, stars, recorded>>
     \/ /\ board = "one" /\ found + 1 < Pairs /\ found' = found + 1 /\ board' = "none"
        /\ UNCHANGED <<panel, cheer, stars, recorded>>
     \/ /\ board = "one" /\ found + 1 = Pairs /\ found' = Pairs /\ board' = "over"
        /\ recorded' = recorded + 1 /\ cheer' = TRUE /\ UNCHANGED panel
        /\ \E s \in {1, 2} : stars' = [stars EXCEPT ![level] = Max(@, s)]
  /\ UNCHANGED <<link, level, paused, visible>>
\* A tap on one of the two missed cards only turns them back.
YouTapAMissedCard == /\ visible /\ ~paused /\ board = "missed" /\ board' = "none"
                     /\ UNCHANGED <<link, level, found, paused, visible, panel, cheer, stars, recorded>>
\* The miss effect: after a second (unless paused) the missed pair turns back.
TheMissTurnsBack == /\ ~paused /\ board = "missed" /\ board' = "none"
                    /\ UNCHANGED <<link, level, found, paused, visible, panel, cheer, stars, recorded>>
\* visibilitychange: a hidden tab pauses a board in play and turns a missed pair back.
TabHides == /\ visible /\ visible' = FALSE
            /\ paused' = (paused \/ Playing)
            /\ board' = IF board = "missed" THEN "none" ELSE board
            /\ UNCHANGED <<link, level, found, panel, cheer, stars, recorded>>
TabShows == /\ ~visible /\ visible' = TRUE /\ UNCHANGED <<link, level, board, found, paused, panel, cheer, stars, recorded>>
\* The cover's চালিয়ে যাও.
YouResume == /\ visible /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<link, level, board, found, visible, panel, cheer, stars, recorded>>
\* The end effect's timers: the panel after 650 ms, the cheer after the stars.
ThePanelShows == /\ board = "over" /\ ~panel /\ panel' = TRUE
                 /\ UNCHANGED <<link, level, board, found, paused, visible, cheer, stars, recorded>>
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<link, level, board, found, paused, visible, panel, stars, recorded>>
\* again() / nextLevel() on the panel: start() clears every timer.
YouPressNextLevel == /\ visible /\ panel /\ level < 2 /\ Fresh(level + 1) /\ UNCHANGED <<link, visible, stars>>
YouPlayAgain == /\ visible /\ panel /\ Fresh(level) /\ UNCHANGED <<link, visible, stars>>
\* pick() from সব লেভেল: any open level, plus the one being played (unlocked = max(levels.unlocked, level)).
YouPickALevel == /\ visible /\ \E l \in Levels : l <= Max(Unlocked, level) /\ Fresh(l)
                 /\ UNCHANGED <<link, visible, stars>>

Next == YouFlipACard \/ YouTapAMissedCard \/ TheMissTurnsBack \/ TabHides \/ TabShows \/ YouResume
        \/ ThePanelShows \/ TheCheerPlays \/ YouPressNextLevel \/ YouPlayAgain \/ YouPickALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ link \in {"none", "friend"} /\ level \in Levels /\ board \in {"ready", "none", "one", "missed", "over"}
          /\ found \in 0..Pairs /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ panel \in BOOLEAN /\ cheer \in BOOLEAN
          /\ stars \in [Levels -> 0..2] /\ recorded \in 0..2

\* The reader's rules.
\* A hidden tab means a paused board.
PausedWhenHidden == (~visible /\ Playing) => paused
\* While paused nothing is left face up from a miss.
NothingShowingWhilePaused == paused => board # "missed"
\* While paused, no card turns and no pair is found.
NoProgressWhilePaused == [][(paused /\ paused') => (board' = board /\ found' = found)]_vars
\* A board is recorded once.
NoDoubleResult == recorded <= 1
\* The panel and the cheer belong to a finished board.
NoCheerAfterMovingOn == (cheer \/ panel) => board = "over"
\* A level has stars only if the level before it has stars: levels open one by one.
LevelsOpenInOrder == stars[2] > 0 => stars[1] > 0
StarsNeverDrop == [][\A l \in Levels : stars'[l] >= stars[l]]_vars
UnlockNeverShrinks == [][Unlocked' >= Unlocked]_vars

\* Exploration bound: stop past a skipped level (the states after it repeat the ones before).
Explore == LevelsOpenInOrder
====
