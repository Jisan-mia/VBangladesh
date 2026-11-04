---- MODULE Chhobi ----
\* ছবি ফোটাও after the rewrite: the round and its clock (which waits for the first stitch), the window, a drag stroke, the
\* level sheet, the mistakes and the stars recorded, the celebration timers, your own unlock and a friend's visit. Mirrored from
\* tools/chhobi-photao/components/photao-game.tsx (start, load/toTitle/playLevel, pauseFor/resumeFrom/wake, act, solved,
\* openSheet/closeSheet/pickLevel, the blur, pagehide and visibilitychange listeners, the boot's fromHash),
\* components/board.tsx (onDown/onMove/onUp/release), lib/session.ts (begin, arm, pause, resume, finish, canPlay),
\* lib/play.ts (stitch's refusal) and lib/progress.ts (afterClear, playable).
\* Abstractions: 2 levels; mistakes are counted 0..3 (3 stands for "three or more"); the story and the end screen's delay
\* are left out (they only delay things; session.test and rewrite.test cover them); a finished round's timers (confetti,
\* the end screen) are one flag, `cheer`.
EXTENDS Naturals, FiniteSets
CONSTANTS Count, Cap               \* levels in the model (the game has 30); mistakes counted up to Cap (3 = "three or more")
VARIABLES phase, why, armed, clock, visible, focused, stroke, sheet, level, wrong, cleared, rec, wasRec, unlock, visit, cheer, was
vars == <<phase, why, armed, clock, visible, focused, stroke, sheet, level, wrong, cleared, rec, wasRec, unlock, visit, cheer, was>>

Levels == 1..Count
Max(S) == CHOOSE x \in S : \A y \in S : y <= x
Min2(a, b) == IF a < b THEN a ELSE b
Max2(a, b) == IF a > b THEN a ELSE b
\* lib/game.ts starsFor(mistakes, no hint): 0 mistakes 3 stars, 1–2 two, more one.
StarsOf(w) == IF w = 0 THEN 3 ELSE IF w <= 2 THEN 2 ELSE 1
\* lib/progress.ts: playable, afterClear.
Playable(l) == l <= unlock \/ l \in cleared \/ l = visit
AfterClear(l) == IF l <= unlock THEN Max2(unlock, Min2(Count, l + 1)) ELSE unlock
Run == Max({k \in 0..Count : \A j \in 1..k : j \in cleared})
Earned == Min2(Count, 1 + Run)
Here == visible /\ focused
\* Every step remembers what unlock and the recorded stars were before it.
Note == was' = unlock /\ wasRec' = rec

Init == /\ phase = "title" /\ why = "none" /\ armed = FALSE /\ clock = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ stroke = FALSE /\ sheet = FALSE /\ level = 1 /\ wrong = 0 /\ cleared = {} /\ rec = [l \in Levels |-> 0]
        /\ wasRec = [l \in Levels |-> 0] /\ unlock = 1 /\ visit = 0 /\ cheer = FALSE /\ was = 1

\* load(to): clearTimers() and board.release(), a fresh board, the sheet closed, no mistakes, the clock not started.
Fresh(next, start) == /\ level' = next /\ phase' = start /\ why' = "none" /\ armed' = FALSE /\ clock' = FALSE
                      /\ stroke' = FALSE /\ sheet' = FALSE /\ wrong' = 0 /\ cheer' = FALSE /\ Note
                      /\ UNCHANGED <<visible, focused, cleared, rec, unlock, visit>>

\* ফোটাও on the title (session.begin): into play, the clock waiting for the first stitch.
YouPressPlay == /\ phase = "title" /\ Here /\ ~sheet
                /\ phase' = "playing" /\ Note
                /\ UNCHANGED <<why, armed, clock, visible, focused, stroke, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
\* onDown on a cell, then onMove: only while canPlay (playing). The first stitch arms the clock (session.arm).
YouStartAStroke == /\ phase = "playing" /\ Here /\ ~stroke
                   /\ stroke' = TRUE /\ armed' = TRUE /\ clock' = TRUE /\ Note
                   /\ UNCHANGED <<phase, why, visible, focused, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
YouLetGo == /\ stroke /\ focused /\ stroke' = FALSE /\ Note
            /\ UNCHANGED <<phase, why, armed, clock, visible, focused, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
\* A stitch that contradicts the picture is refused: the cell stays empty, the mistake counts, the thread snaps (the stroke ends).
YouStitchWrong == /\ phase = "playing" /\ Here
                  /\ wrong' = Min2(Cap, wrong + 1) /\ stroke' = FALSE /\ armed' = TRUE /\ clock' = TRUE /\ Note
                  /\ UNCHANGED <<phase, why, visible, focused, sheet, level, cleared, rec, unlock, visit, cheer>>
\* A right stitch (a tap, a key or a hint): arms the clock.
YouStitchRight == /\ phase = "playing" /\ Here /\ armed' = TRUE /\ clock' = TRUE /\ Note
                  /\ UNCHANGED <<phase, why, visible, focused, stroke, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
\* The last cell goes in: solved() stops the clock, records the stars (the best only), raises your unlock by your own rule,
\* and queues the confetti and the end screen.
YouStitchTheLastCell == /\ phase = "playing" /\ Here
                        /\ phase' = "over" /\ armed' = TRUE /\ clock' = FALSE /\ stroke' = FALSE
                        /\ cleared' = cleared \cup {level} /\ rec' = [rec EXCEPT ![level] = Max2(@, StarsOf(wrong))]
                        /\ unlock' = AfterClear(level) /\ cheer' = TRUE /\ was' = unlock /\ wasRec' = rec
                        /\ UNCHANGED <<why, visible, focused, sheet, level, wrong, visit>>
CheerFires == /\ cheer /\ cheer' = FALSE /\ Note
              /\ UNCHANGED <<phase, why, armed, clock, visible, focused, stroke, sheet, level, wrong, cleared, rec, unlock, visit>>
\* pauseFor("away"): blur, pagehide, a hidden tab and the player's menu all stop the clock and release the stroke.
Away(p, w) == /\ phase' = IF p = "playing" THEN "paused" ELSE p
              /\ why' = IF p = "playing" THEN "away" ELSE w
              /\ clock' = FALSE /\ stroke' = FALSE
WindowBlurs == /\ Here /\ focused' = FALSE /\ Away(phase, why) /\ Note
               /\ UNCHANGED <<armed, visible, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE /\ Note
                 /\ UNCHANGED <<phase, why, armed, clock, visible, stroke, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Away(phase, why) /\ Note
            /\ UNCHANGED <<armed, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE /\ Note
            /\ UNCHANGED <<phase, why, armed, clock, stroke, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
\* চালিয়ে যাও, Enter, or the first press on the board after coming back (wake): resumes only, never a stitch.
YouResume == /\ phase = "paused" /\ why = "away" /\ Here
             /\ phase' = "playing" /\ why' = "none" /\ clock' = armed /\ Note
             /\ UNCHANGED <<armed, visible, focused, stroke, sheet, level, wrong, cleared, rec, unlock, visit, cheer>>
\* The level badge, সব লেভেল, or the pause menu's সব লেভেল: a choice moment. It pauses play (session.pause "sheet" outranks "away").
YouOpenTheSheet == /\ Here /\ ~sheet /\ sheet' = TRUE
                   /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                   /\ why' = IF phase \in {"playing", "paused"} THEN "sheet" ELSE why
                   /\ clock' = FALSE /\ stroke' = FALSE /\ Note
                   /\ UNCHANGED <<armed, visible, focused, level, wrong, cleared, rec, unlock, visit, cheer>>
YouCloseTheSheet == /\ sheet /\ Here /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet"
                         THEN phase' = "playing" /\ why' = "none" /\ clock' = armed
                         ELSE UNCHANGED <<phase, why, clock>>
                    /\ Note
                    /\ UNCHANGED <<armed, visible, focused, stroke, level, wrong, cleared, rec, unlock, visit, cheer>>
\* A level in the sheet: only a playable one; from the title it opens that title, mid-round it plays at once.
YouPickALevel == /\ sheet /\ Here /\ \E l \in Levels : Playable(l) /\ Fresh(l, IF phase = "title" THEN "title" ELSE "playing")
\* পরের লেভেল (only when the next level is yours to play), আবার খেলো.
YouPressNextLevel == /\ phase = "over" /\ Here /\ level < Count /\ Playable(level + 1) /\ Fresh(level + 1, "playing")
YouPlayAgain == /\ phase = "over" /\ Here /\ Fresh(level, "playing")
\* The player's নতুন করে শুরু: onRestart → toTitle of this level.
YouRestart == /\ Here /\ phase # "title" /\ Fresh(level, "title")
\* fromHash(): a valid #s=…&l=L link is a visit to L, on its title, whatever was on screen.
FriendLinkOpens == /\ Here /\ \E l \in Levels : /\ level' = l /\ phase' = "title" /\ why' = "none" /\ armed' = FALSE /\ clock' = FALSE
                                                /\ stroke' = FALSE /\ sheet' = FALSE /\ wrong' = 0 /\ cheer' = FALSE /\ visit' = l /\ Note
                                                /\ UNCHANGED <<visible, focused, cleared, rec, unlock>>

Next == YouPressPlay \/ YouStartAStroke \/ YouLetGo \/ YouStitchWrong \/ YouStitchRight \/ YouStitchTheLastCell \/ CheerFires
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickALevel \/ YouPressNextLevel \/ YouPlayAgain \/ YouRestart
        \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"} /\ armed \in BOOLEAN /\ clock \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ stroke \in BOOLEAN /\ sheet \in BOOLEAN /\ level \in Levels /\ wrong \in 0..Cap
          /\ cleared \subseteq Levels /\ rec \in [Levels -> 0..3] /\ wasRec \in [Levels -> 0..3] /\ unlock \in Levels /\ visit \in 0..Count /\ cheer \in BOOLEAN

\* The reader's rules.
ClockStillWhileAway == clock => (visible /\ focused)                       \* NoProgressWhileAway
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == stroke => (visible /\ focused /\ phase = "playing")   \* no drag counts as held away, paused, in a sheet or on the result
PausedMeansFrozen == phase = "paused" => (~clock /\ ~stroke)
ClockMeansPlaying == clock <=> (phase = "playing" /\ armed)               \* the clock runs exactly while playing, after the first stitch
ClockWaitsForTheFirstStitch == ~armed => ~clock
CheerOnlyOnTheResult == cheer => phase = "over"
OpenLevelsAreEarned == unlock <= Earned                                    \* a friend's level never opens the ones before it
UnlockNeverShrinks == unlock >= was
StarsNeverDrop == \A l \in Levels : rec[l] >= wasRec[l]
ResultMatchesPlay == phase = "over" => rec[level] >= StarsOf(wrong)         \* what's recorded is at least what this round earned
ChoiceFreezesPlay == sheet => phase # "playing"
LevelIsPlayable == level <= unlock \/ level \in cleared \/ level = visit
====
