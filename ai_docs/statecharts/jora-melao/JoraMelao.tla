---- MODULE JoraMelao ----
\* জোড়া মেলাও after the rewrite: a board's phases (start card, the peek of the hat, play, end screen), one card up and a
\* missed pair showing, the birds that fly when a miss turns back, the hidden tab, the blurred window and the player's menu,
\* the সব লেভেল sheet, the stars and the level you may open, a friend's far-ahead link.
\* Mirrors tools/jora-melao/lib/session.ts (start, tick, tap, pause, resume), lib/play.ts (begin, endPeek, flip, settle),
\* lib/save.ts (openAfter) and components/jora-game.tsx (commit/effects, finalize, load, pauseFor/resumeFrom, the blur and
\* visibilitychange listeners, openSheet/closeSheet, the key handler).
\* Abstractions: 2 levels (a peek board, a birds board; a plain board is the peek board without its first phase), 1 pair a board (more only repeat the flip loop), the
\* birds fly after every 2nd miss, a clear earns a star, two-player mode left out (the same pause and timers, no stars).
\* The page opens on a friend's link to level 2 while only level 1 is yours.
EXTENDS Naturals

VARIABLES link, level, phase, open, found, peekLeft, misses, flights, why, sheet, here, shown, recorded,
          stars, openTo
vars == <<link, level, phase, open, found, peekLeft, misses, flights, why, sheet, here, shown, recorded,
          stars, openTo>>

Levels == 1..2
Pairs == 1
Every == 2
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Kind(l) == IF l = 1 THEN "peek" ELSE "birds"
Here == here
Started == phase \in {"peek", "play"}
\* session.running: a started board and nothing pausing it.
Running == Started /\ why = "none"
Birds == Kind(level) = "birds"
\* settle(): the missed pair turns face down; if the birds are due they fly now.
Settle == /\ open' = "none"
          /\ flights' = IF Birds /\ misses % Every = 0 /\ misses > 0 THEN flights + 1 ELSE flights

\* Init: the page opens on a friend's level 2 link. Only level 1 is yours.
Init == /\ link = "friend" /\ level = 2
        /\ phase = "ready" /\ open = "none" /\ found = 0 /\ peekLeft = 0 /\ misses = 0 /\ flights = 0
        /\ why = "none" /\ sheet = FALSE /\ here = TRUE /\ shown = FALSE /\ recorded = 0
        /\ stars = [l \in Levels |-> 0] /\ openTo = 1

\* The sign across the board: session.start. The peek begins on level 2, else play.
YouStart == /\ Here /\ ~sheet /\ phase = "ready"
            /\ IF Kind(level) = "peek" THEN phase' = "peek" /\ peekLeft' = 1 ELSE phase' = "play" /\ UNCHANGED peekLeft
            /\ UNCHANGED <<link, level, open, found, misses, flights, why, sheet, here, shown, recorded, stars, openTo>>
\* session.tick: the peek's clock runs only while nothing pauses it.
ThePeekRuns == /\ Running /\ phase = "peek" /\ peekLeft > 0 /\ peekLeft' = peekLeft - 1
               /\ UNCHANGED <<link, level, phase, open, found, misses, flights, why, sheet, here, shown, recorded, stars, openTo>>
ThePeekEnds == /\ Running /\ phase = "peek" /\ peekLeft = 0 /\ phase' = "play"
               /\ UNCHANGED <<link, level, open, found, peekLeft, misses, flights, why, sheet, here, shown, recorded, stars, openTo>>

\* tap() → session.tap → flip(): nothing while paused, in the peek, or with the sheet open. A pair showing turns back first.
\* The last match ends the board; finalize() records the stars once, right now, and opens the next level only from your own clear.
Cleared(s) == /\ phase' = "over" /\ found' = Pairs /\ recorded' = recorded + 1
              /\ stars' = [stars EXCEPT ![level] = Max(@, s)]
              /\ openTo' = IF level <= openTo THEN Min(2, Max(openTo, level + 1)) ELSE openTo
YouFlipACard ==
  /\ Here /\ ~sheet /\ Running /\ phase = "play"
  /\ \/ /\ open = "none" /\ open' = "one" /\ UNCHANGED <<found, flights, misses, phase, recorded, stars, openTo>>
     \/ /\ open = "one" /\ open' = "missed" /\ misses' = misses + 1
        /\ UNCHANGED <<found, flights, phase, recorded, stars, openTo>>
     \/ /\ open = "one" /\ found + 1 < Pairs /\ found' = found + 1 /\ open' = "none"
        /\ UNCHANGED <<flights, misses, phase, recorded, stars, openTo>>
     \/ /\ open = "one" /\ found + 1 = Pairs /\ open' = "none" /\ Cleared(1)
        /\ UNCHANGED <<flights, misses>>
     \* A tap on another card with a missed pair showing, on a board without birds: it turns back and opens the card.
     \/ /\ open = "missed" /\ ~Birds /\ open' = "one"
        /\ UNCHANGED <<found, flights, misses, phase, recorded, stars, openTo>>
  /\ UNCHANGED <<link, level, peekLeft, why, sheet, here, shown>>
\* A tap on a missed card, or on any card where the birds fly: it only turns the pair back.
YouTapAMissedPair == /\ Here /\ ~sheet /\ Running /\ phase = "play" /\ open = "missed" /\ Settle
                     /\ UNCHANGED <<link, level, phase, found, peekLeft, misses, why, sheet, here, shown, recorded, stars, openTo>>
\* session.tick: the miss timer (1 s) runs out.
TheMissTurnsBack == /\ Running /\ open = "missed" /\ Settle
                    /\ UNCHANGED <<link, level, phase, found, peekLeft, misses, why, sheet, here, shown, recorded, stars, openTo>>

\* pauseFor("away"): blur, a hidden tab and the player's menu. A running clock stops, and a missed pair turns back right
\* now (the birds fly if due) so nothing is left face up. A sheet pause stays a sheet pause.
PauseNow == /\ why' = IF Running THEN "away" ELSE why
            /\ IF Running /\ open = "missed" THEN Settle ELSE UNCHANGED <<open, flights>>
\* TabHides and WindowBlurs (and the player's menu) run the same pauseFor("away"); TabShows and WindowFocuses only bring you back.
YouLeaveThePage == /\ here /\ here' = FALSE /\ PauseNow
                   /\ UNCHANGED <<link, level, phase, found, peekLeft, misses, sheet, shown, recorded, stars, openTo>>
YouComeBack == /\ ~here /\ here' = TRUE
               /\ UNCHANGED <<link, level, phase, open, found, peekLeft, misses, flights, why, sheet, shown, recorded, stars, openTo>>
\* চালিয়ে যাও in the menu, or the first tap on the covered board: resume("away") only wakes the board, it never turns a card.
YouResume == /\ Here /\ why = "away" /\ why' = "none"
             /\ UNCHANGED <<link, level, phase, open, found, peekLeft, misses, flights, sheet, here, shown, recorded, stars, openTo>>

\* openSheet(): pause("sheet") stops a running clock (and settles a missed pair) and outranks an away pause; closeSheet() resumes.
YouOpenTheLevelList == /\ Here /\ ~sheet /\ sheet' = TRUE
                       /\ why' = IF Running \/ why = "away" THEN "sheet" ELSE why
                       /\ IF Running /\ open = "missed" THEN Settle ELSE UNCHANGED <<open, flights>>
                       /\ UNCHANGED <<link, level, phase, found, peekLeft, misses, here, shown, recorded, stars, openTo>>
YouCloseTheLevelList == /\ Here /\ sheet /\ sheet' = FALSE /\ why' = IF why = "sheet" THEN "none" ELSE why
                        /\ UNCHANGED <<link, level, phase, open, found, peekLeft, misses, flights, here, shown, recorded, stars, openTo>>

\* load(): a level from the sheet, or পরের লেভেল / আবার খেলো on the end screen (a click, or a fresh Enter). Everything of the last
\* board goes. A level you may pick is one up to your open level, or the friend's own level.
Load(l) == /\ level' = l /\ phase' = "ready" /\ open' = "none" /\ found' = 0 /\ peekLeft' = 0 /\ misses' = 0 /\ flights' = 0
           /\ why' = "none" /\ sheet' = FALSE /\ shown' = FALSE /\ recorded' = 0
CanPick(l) == l <= openTo \/ (link = "friend" /\ l = 2)
YouPickALevel == /\ Here /\ sheet /\ \E l \in Levels : CanPick(l) /\ Load(l)
                 /\ UNCHANGED <<link, here, stars, openTo>>
\* The end screen shows 650 ms after the last pair.
TheEndScreenShows == /\ phase = "over" /\ ~shown /\ shown' = TRUE
                     /\ UNCHANGED <<link, level, phase, open, found, peekLeft, misses, flights, why, sheet, here, recorded, stars, openTo>>
YouPlayOn == /\ Here /\ ~sheet /\ shown /\ \E l \in Levels : (l = level \/ l = level + 1) /\ CanPick(l) /\ Load(l)
             /\ UNCHANGED <<link, here, stars, openTo>>

Next == YouStart \/ ThePeekRuns \/ ThePeekEnds \/ YouFlipACard \/ YouTapAMissedPair \/ TheMissTurnsBack
        \/ YouLeaveThePage \/ YouComeBack \/ YouResume \/ YouOpenTheLevelList \/ YouCloseTheLevelList
        \/ YouPickALevel \/ TheEndScreenShows \/ YouPlayOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ link = "friend" /\ level \in Levels /\ phase \in {"ready", "peek", "play", "over"}
          /\ open \in {"none", "one", "missed"} /\ found \in 0..Pairs /\ peekLeft \in 0..1 /\ misses \in 0..4 /\ flights \in 0..2
          /\ why \in {"none", "away", "sheet"} /\ sheet \in BOOLEAN /\ here \in BOOLEAN
          /\ shown \in BOOLEAN /\ recorded \in 0..2 /\ stars \in [Levels -> 0..1] /\ openTo \in Levels

\* ---- the reader's rules ----
\* The peek's seconds, the miss timer and the cards stop when the tab hides...
PausedWhenHidden == (~here /\ Started) => why # "none"
\* While paused, no missed pair is left face up.
NothingShowingWhilePaused == why # "none" => open # "missed"
\* While paused, no card turns, no pair is found, the peek does not run and the birds do not fly.
NoProgressWhilePaused == [][(why # "none" /\ why' # "none") => UNCHANGED <<phase, open, found, peekLeft, misses, flights>>]_vars
\* The tap or key that wakes the board (চালিয়ে যাও) never turns a card.
TheWakeTapIsNotAMove == [][(why = "away" /\ why' = "none") => UNCHANGED <<phase, open, found, misses, flights>>]_vars
\* Coming back from another window never closes the level list.
TheListOutranksAway == (sheet /\ Started) => why = "sheet"
\* While the level list is open, nothing counts.
LevelListFreezesPlay == sheet => ~Running
\* Nothing flips during the peek.
NoFlipsInThePeek == phase = "peek" => (open = "none" /\ found = 0)
\* The birds only fly as a missed pair turns back, only on the birds' board, once per second miss.
BirdsFlyOnlyWhenAMissTurnsBack == [][flights' > flights => (open = "missed" /\ open' = "none")]_vars
BirdsStayOnTheirBoard == (Kind(level) # "birds") => flights = 0
EveryFlightIsDue == open # "missed" => flights = (IF Birds THEN misses \div Every ELSE 0)
\* A board is recorded once, and the end screen shows only after it was saved.
NoDoubleResult == recorded <= 1
EndScreenMeansSaved == shown => (phase = "over" /\ recorded = 1)
\* Stars never drop.
StarsNeverDrop == [][\A l \in Levels : stars'[l] >= stars[l]]_vars
\* The level you may open never shrinks, and it opens only by your own clears: every level under it has stars. A friend's far-ahead
\* level records its stars but opens nothing in between.
UnlockNeverShrinks == [][openTo' >= openTo]_vars
OpenLevelsAreEarned == \A l \in Levels : l < openTo => stars[l] > 0
\* Exploration bound: a few misses are enough to show the birds twice.
Explore == misses <= 2
====
