---- MODULE Sudoku ----
EXTENDS Naturals, FiniteSets
\* সুডোকু after the rewrite: the start card, the round and its clock, tab and window focus, the সব লেভেল sheet, hints,
\* the star chimes, the challenge link, saved half-done grids, the level ladder with friend links, and held keys.
\* Mirrors tools/sudoku/components/sudoku-game.tsx (handlers and effects), lib/session.ts (phase + clock reducer),
\* lib/save.ts (saved grids, own unlock) and lib/link.ts.
\* Abstractions: a puzzle has two blank cells left at the start (left = 2 → 0); hints are 0, "1–9" or "10 or more";
\* three levels; the clock "runs" exactly when phase = "playing" (session.elapsed). No sound loops exist in this game.
VARIABLES phase, why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped
vars == <<phase, why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>

\* The number of levels: 3 for the full check, 2 for the drawn chart (Sudoku.cfg says which).
CONSTANT N
\* Full = TRUE checks everything: held keys, and "10 or more" hints apart from "1–9". The drawn chart sets it FALSE to stay
\* within the chart budget: after the fix both hint counts make the same link, and a hidden tab runs the same pause as
\* a blur, so merging them loses no path.
CONSTANT Full
Phases == {"ready", "playing", "paused", "over"}
Whys == {"none", "away", "sheet"}
Hints == {"none", "few", "many"}
Links == {"none", "opens", "broken"}

Init == /\ phase = "ready" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ left = 2 /\ hints = "none" /\ work = FALSE /\ kept = FALSE /\ lost = FALSE
        /\ chime = FALSE /\ link = "none" /\ level = 1 /\ open = 1 /\ cleared = {} /\ visit = 0
        /\ held = FALSE /\ skipped = FALSE

Contig(c) == IF 1 \notin c THEN 0 ELSE IF 2 \notin c THEN 1 ELSE IF 3 \notin c THEN 2 ELSE 3
Min(a, b) == IF a < b THEN a ELSE b

\* solved(): session.finish, the saved grid dropped, stars recorded, and openAfter(open, level): only a level that was
\* already open opens the next one. StarReveal's chimes are pending while the result shows. Links take any hint count.
Solve == /\ phase' = "over" /\ chime' = TRUE /\ link' = "opens" /\ kept' = FALSE
         /\ cleared' = cleared \cup {level}
         /\ open' = IF level <= open THEN Min(N, IF level + 1 > open THEN level + 1 ELSE open) ELSE open

\* শুরু করো / চালিয়ে যাও on the start card (a click, or a fresh Enter): session.begin.
YouStart == /\ phase = "ready" /\ ~sheet /\ visible /\ focused
            /\ phase' = "playing"
            /\ UNCHANGED <<why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>

\* press(digit) → apply(place(..)): only while session.canMove (playing). Every move is saved (keep).
YouWriteADigit == /\ phase = "playing" /\ left > 0
                  /\ left' = left - 1 /\ work' = TRUE
                  /\ IF left = 1 THEN Solve ELSE /\ kept' = TRUE /\ UNCHANGED <<phase, chime, link, cleared, open>>
                  /\ UNCHANGED <<why, sheet, visible, focused, hints, lost, level, visit, held, skipped>>

NextHint(h) == IF h = "none" \/ ~Full THEN {"few"} ELSE {"few", "many"}
YouTakeAHint == /\ phase = "playing" /\ left > 0
                /\ \E h \in NextHint(hints) :
                     /\ hints' = h /\ left' = left - 1 /\ work' = TRUE
                     /\ IF left = 1 THEN Solve ELSE /\ kept' = TRUE /\ UNCHANGED <<phase, chime, link, cleared, open>>
                /\ UNCHANGED <<why, sheet, visible, focused, lost, level, visit, held, skipped>>

\* pause(s, now, "away"): window blur (the game's own listener and the player's menu), and a hidden tab. A sheet pause
\* outranks it. Pausing saves the grid (pauseFor does nothing on the start card or the result). Blur also ends any key
\* held (keyup never arrives).
Away(p, w) == /\ phase' = IF p = "playing" THEN "paused" ELSE p
              /\ why' = IF p = "playing" THEN "away" ELSE w
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ held' = FALSE
               /\ Away(phase, why) /\ kept' = (kept \/ (work /\ phase \in {"playing", "paused"}))
               /\ UNCHANGED <<sheet, visible, left, hints, work, lost, chime, link, level, open, cleared, visit, skipped>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>
TabHides == /\ Full /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE
            /\ Away(phase, why) /\ kept' = (kept \/ (work /\ phase \in {"playing", "paused"}))
            /\ UNCHANGED <<sheet, left, hints, work, lost, chime, link, level, open, cleared, visit, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>
\* resume(s, now, "away"): the menu's চালিয়ে যাও or the paper overlay's. It never ends a sheet pause.
YouResume == /\ phase = "paused" /\ why = "away" /\ visible /\ focused
             /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>

\* openSheet / closeSheet: the সব লেভেল sheet stops the clock while open (pause "sheet"), and closing it resumes that pause.
YouOpenTheSheet == /\ ~sheet /\ visible /\ focused /\ phase \in {"ready", "playing", "over"}
                   /\ sheet' = TRUE
                   /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                   /\ why' = IF phase = "playing" THEN "sheet" ELSE why
                   /\ kept' = (kept \/ (work /\ phase = "playing"))
                   /\ UNCHANGED <<visible, focused, left, hints, work, lost, chime, link, level, open, cleared, visit, held, skipped>>
YouCloseTheSheet == /\ sheet /\ visible /\ focused /\ sheet' = FALSE
                    /\ phase' = IF phase = "paused" /\ why = "sheet" THEN "playing" ELSE phase
                    /\ why' = IF phase = "paused" /\ why = "sheet" THEN "none" ELSE why
                    /\ UNCHANGED <<visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held, skipped>>

\* A StarReveal chime fires; its timers live only while the result is mounted (they are cleared on unmount).
StarsChime == /\ chime /\ phase = "over" /\ chime' = FALSE
              /\ UNCHANGED <<phase, why, sheet, visible, focused, left, hints, work, kept, lost, link, level, open, cleared, visit, held, skipped>>

\* load(puzzle): the new puzzle's start card; leaving the result unmounts StarReveal, so its chimes go. The grid being
\* left is lost if it has your work and no saved copy. (Every move saves it, `kept`; keepNow() here is a second save
\* that this model leaves out, so the rule rests on the per-move save alone.)
Load(to, v) == /\ level' = to /\ phase' = "ready" /\ why' = "none" /\ sheet' = FALSE /\ left' = 2 /\ hints' = "none"
               /\ work' = FALSE /\ link' = "none" /\ chime' = FALSE /\ visit' = v
               /\ kept' = FALSE
               /\ lost' = (lost \/ (work /\ phase # "over" /\ ~kept))
\* পরের লেভেল (a click, or a fresh Enter press on the result): only a level your own play opened.
YouGoOn == /\ phase = "over" /\ visible /\ focused /\ ~sheet /\ level < N /\ level + 1 <= open
           /\ Load(level + 1, visit) /\ UNCHANGED <<visible, focused, open, cleared, held, skipped>>
YouPlayAgain == /\ phase = "over" /\ visible /\ focused /\ ~sheet
                /\ Load(level, visit) /\ UNCHANGED <<visible, focused, open, cleared, held, skipped>>
\* The start card's ‹ ›, a level in the sheet, আজকের ধাঁধা and লেভেলে ফেরো: any open level (or this visit's friend level).
YouPickALevel == /\ visible /\ focused
                 /\ \E to \in 1..N : /\ (to <= open \/ to = visit)
                                     /\ Load(to, visit)
                 /\ UNCHANGED <<visible, focused, open, cleared, held, skipped>>
\* A friend's link opens their level for this visit only (setVisit), however far ahead it is.
FriendLinkOpens == /\ visible /\ focused /\ Load(N, N) /\ UNCHANGED <<visible, focused, open, cleared, held, skipped>>

\* Keys: you hold Enter (the last digit's Enter, say) and the browser repeats it. The result takes only a fresh keydown
\* after it appeared (!event.repeat, timeStamp > finish.at), so a repeat changes nothing.
YouHoldEnter == /\ Full /\ ~held /\ visible /\ focused /\ held' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, skipped>>
\* keyHandler: `const fresh = !event.repeat`, and the result acts only `if (fresh && … timeStamp > finish.at + 400)`.
ResultActsOnRepeat == FALSE
EnterRepeats == /\ held
                /\ skipped' = (skipped \/ (phase = "over" /\ ResultActsOnRepeat))
                /\ UNCHANGED <<phase, why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, held>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, why, sheet, visible, focused, left, hints, work, kept, lost, chime, link, level, open, cleared, visit, skipped>>

Next == YouStart \/ YouWriteADigit \/ YouTakeAHint \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ YouOpenTheSheet \/ YouCloseTheSheet \/ StarsChime \/ YouGoOn \/ YouPlayAgain \/ YouPickALevel
        \/ FriendLinkOpens \/ YouHoldEnter \/ EnterRepeats \/ YouLetGo

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ why \in Whys /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ left \in 0..2 /\ hints \in Hints /\ work \in BOOLEAN /\ kept \in BOOLEAN /\ lost \in BOOLEAN
          /\ chime \in BOOLEAN /\ link \in Links /\ level \in 1..N /\ open \in 1..N /\ cleared \subseteq 1..N
          /\ visit \in 0..N /\ held \in BOOLEAN /\ skipped \in BOOLEAN

\* ---- The reader's rules ----
ClockRuns == phase = "playing"
\* NoProgressWhileAway: the clock that decides your stars doesn't run while you're in another tab or window.
ClockStillWhileAway == ClockRuns => (visible /\ focused)
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
PausedMeansFrozen == phase = "paused" => ~ClockRuns
\* ChoiceFreezesPlay: while the level sheet is open, the clock is stopped.
ChoiceFreezesPlay == sheet => ~ClockRuns
ResultMeansSolved == phase = "over" <=> (left = 0 /\ link # "none")
ChimesOnlyOnTheResult == chime => phase = "over"
YourLinkOpens == link # "broken"
LevelIsOpen == level <= open \/ level = visit
\* OpenLevelsAreEarned: only your own unbroken run of cleared levels opens the next one.
OpenLevelsAreEarned == open <= Min(N, 1 + Contig(cleared))
WorkNeverLostByOneTap == ~lost
\* A key held through the end of a round never skips the result or starts the next run.
HeldKeyNeverSkips == ~skipped
====
