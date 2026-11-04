---- MODULE Sudoku ----
EXTENDS Naturals
\* সুডোকু: the round and its clock, tab and window focus, hints, the star chimes, the challenge link, and the level ladder,
\* mirrored from tools/sudoku/components/sudoku-game.tsx (handlers and effects) and tools/sudoku/lib/game.ts + lib/link.ts.
\* Abstractions: a puzzle has two blank cells left at the start (left = 2 → 0); hints are 0, "1–9" or "10 or more";
\* two levels; the clock "runs" exactly when phase = "playing" (timer.since ≠ 0 and the 250 ms interval is mounted).
\* No sound loops exist in this game (only one-shot tones, which tone() mutes itself), so sound is not modelled.
VARIABLES phase, visible, focused, left, hints, work, chime, link, level, unlocked, lost
vars == <<phase, visible, focused, left, hints, work, chime, link, level, unlocked, lost>>

Phases == {"ready", "playing", "paused", "over"}
Hints == {"none", "few", "many"}           \* none, 1–9, 10 or more
Links == {"none", "opens", "broken"}       \* what your challenge link opens for a friend
Locked == phase \in {"paused", "over"}      \* const locked = phase === "paused" || phase === "over"

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE
        /\ left = 2 /\ hints = "none" /\ work = FALSE
        /\ chime = FALSE /\ link = "none" /\ level = 1 /\ unlocked = 1 /\ lost = FALSE

\* solved(): stopClock, record stars (unlocks level + 1), phase "over", and setTimeout(() => sfx.star(i)) — never cleared.
\* The card's link is sharedHash(fromPuzzle(..)); parseShared accepts h only when /^\d$/ (0–9), so 10+ hints make a dead link.
Solve(h) == /\ phase' = "over" /\ chime' = TRUE
            /\ link' = IF h = "many" THEN "broken" ELSE "opens"
            /\ unlocked' = IF level + 1 > unlocked /\ level < 2 THEN level + 1 ELSE unlocked   \* unlockedLevel caps at the level count

\* Taps and keys need the page in front (focused): a click into the page focuses it first.
\* choose(cell): ignored while locked; begin() turns "ready" into "playing" and starts the clock.
YouTapACell == /\ ~Locked /\ focused /\ phase = "ready"
               /\ phase' = "playing"
               /\ UNCHANGED <<visible, focused, left, hints, work, chime, link, level, unlocked, lost>>

\* press(digit) → apply(place(..), "pen"): begin(), then either one more cell is right or the grid is solved.
YouWriteADigit == /\ ~Locked /\ focused /\ left > 0
                  /\ left' = left - 1 /\ work' = TRUE
                  /\ IF left = 1 THEN Solve(hints)
                     ELSE /\ phase' = "playing" /\ UNCHANGED <<chime, link, unlocked>>
                  /\ UNCHANGED <<visible, focused, hints, level, lost>>

\* help() → giveHint → apply(.., "hint"): fills one cell and counts the hint; hints taken stay counted after undo.
\* Our two-cell abstraction stands in for a level with 10+ blanks, where "few" can become "many".
NextHint(h) == IF h = "none" THEN {"few"} ELSE {"few", "many"}
YouTakeAHint == /\ ~Locked /\ focused /\ left > 0
                /\ \E h \in NextHint(hints) :
                     /\ hints' = h /\ left' = left - 1 /\ work' = TRUE
                     /\ IF left = 1 THEN Solve(h)
                        ELSE /\ phase' = "playing" /\ UNCHANGED <<chime, link, unlocked>>
                /\ UNCHANGED <<visible, focused, level, lost>>

\* No blur or focus listener anywhere in the component: the clock keeps running.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, visible, left, hints, work, chime, link, level, unlocked, lost>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, left, hints, work, chime, link, level, unlocked, lost>>
\* visibilitychange → hidden: "playing" becomes "paused" and stopClock(); other phases are left alone.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<left, hints, work, chime, link, level, unlocked, lost>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, left, hints, work, chime, link, level, unlocked, lost>>
\* resume(): the overlay's চালিয়ে যাও, or Space/Enter while paused.
YouResume == /\ phase = "paused" /\ visible /\ phase' = "playing"
             /\ UNCHANGED <<visible, focused, left, hints, work, chime, link, level, unlocked, lost>>

\* A pending sfx.star(i) timeout fires, in whatever phase the page is in by then (450–970 ms after solving).
StarsChime == /\ chime /\ chime' = FALSE
              /\ UNCHANGED <<phase, visible, focused, left, hints, work, link, level, unlocked, lost>>

\* load(puzzle): phase "ready", clock zero, fresh board. It does not clear the star timeouts.
Load(to) == /\ level' = to /\ phase' = "ready" /\ left' = 2 /\ hints' = "none" /\ work' = FALSE /\ link' = "none"
            /\ UNCHANGED <<visible, focused, chime, unlocked>>
\* পরের লেভেল or Space/Enter on the result, and আবার খেলো.
YouGoOn == /\ phase = "over" /\ visible /\ level < 2 /\ Load(level + 1) /\ UNCHANGED lost
YouPlayAgain == /\ phase = "over" /\ visible /\ Load(level) /\ UNCHANGED lost
\* The ‹ › level arrows, the সব লেভেল grid and আজকের ধাঁধা are never disabled by phase: they load at once, no question asked.
YouPickALevel == /\ visible
                 /\ \E to \in 1..unlocked :
                      /\ Load(to)
                      /\ lost' = (lost \/ (work /\ phase \in {"playing", "paused"}))

Next == YouTapACell \/ YouWriteADigit \/ YouTakeAHint \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ StarsChime \/ YouGoOn \/ YouPlayAgain \/ YouPickALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ left \in 0..2
          /\ hints \in Hints /\ work \in BOOLEAN /\ chime \in BOOLEAN /\ link \in Links
          /\ level \in 1..2 /\ unlocked \in 1..2 /\ lost \in BOOLEAN

\* ---- The reader's rules ----
ClockRuns == phase = "playing"
\* NoProgressWhileAway: the clock that decides your stars doesn't run while you're in another tab or window.
ClockStillWhileAway == ClockRuns => (visible /\ focused)
\* PausedWhenHidden.
PausedWhenHidden == ~visible => phase # "playing"
\* Nothing on the board changes while paused (writes, hints and taps are locked).
PausedMeansFrozen == phase = "paused" => ~ClockRuns
\* The result shows exactly once per solved grid, with no blanks left.
ResultMeansSolved == phase = "over" <=> (left = 0 /\ link # "none")
\* Celebrations belong to the result: a star chime never rings over a new puzzle.
ChimesOnlyOnTheResult == chime => phase = "over"
\* ReplayIsExact: the link on your card opens the same puzzle for a friend.
YourLinkOpens == link # "broken"
\* UnlockNeverShrinks / the level you're on is always open (solving opens the next).
LevelIsOpen == level <= unlocked
\* Half-done work is never thrown away by one stray tap.
WorkNeverLostByOneTap == ~lost
====
