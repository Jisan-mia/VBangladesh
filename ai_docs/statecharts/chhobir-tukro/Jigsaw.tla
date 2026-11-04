---- MODULE Jigsaw ----
\* ছবির টুকরো after the rewrite: the round and its clock, the window, a piece in your hand, the level sheet, the
\* celebration timers, your own unlock and a friend's visit. Mirrored from tools/chhobir-tukro/components/tukro-game.tsx
\* (start, load/toTitle/playLevel, pauseFor/resumeFrom/wake, onDrop/solved, openSheet/closeSheet/pickLevel, the blur,
\* pagehide and visibilitychange listeners, the boot's fromHash), components/table.tsx (onDown/onMove/onUp/cancel),
\* lib/session.ts (begin, pause, resume, finish, canPlay), lib/progress.ts (afterClear, playable) and lib/play.ts.
\* Abstractions: 2 levels; one more piece finishes a picture; the scatter's 0.6 s hold and the story are left out (both
\* only delay the clock's start; session.test.ts covers them); stars are "cleared or not"; a finished round's timers
\* (confetti, the end screen) are one flag, `cheer`.
EXTENDS Naturals, FiniteSets
CONSTANT Count                     \* levels in the model (the game has 30)
VARIABLES phase, why, clock, visible, focused, hand, sheet, level, cleared, unlock, visit, cheer, was
vars == <<phase, why, clock, visible, focused, hand, sheet, level, cleared, unlock, visit, cheer, was>>

Levels == 1..Count
Max(S) == CHOOSE x \in S : \A y \in S : y <= x
Min2(a, b) == IF a < b THEN a ELSE b
Max2(a, b) == IF a > b THEN a ELSE b
\* lib/progress.ts: playable, afterClear.
Playable(l) == l <= unlock \/ l \in cleared \/ l = visit
AfterClear(l) == IF l <= unlock THEN Max2(unlock, Min2(Count, l + 1)) ELSE unlock
\* What the player has earned: one past the unbroken run of cleared levels from 1.
Run == Max({k \in 0..Count : \A j \in 1..k : j \in cleared})
Earned == Min2(Count, 1 + Run)

Init == /\ phase = "title" /\ why = "none" /\ clock = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hand = "none" /\ sheet = FALSE /\ level = 1 /\ cleared = {} /\ unlock = 1 /\ visit = 0
        /\ cheer = FALSE /\ was = 1

\* load(to): clearTimers() and table.cancel(), a fresh table, the sheet closed. `start` is "title" or "playing".
Fresh(next, start) == /\ level' = next /\ phase' = start /\ why' = "none" /\ clock' = (start = "playing")
                      /\ hand' = "none" /\ sheet' = FALSE /\ cheer' = FALSE /\ was' = unlock
                      /\ UNCHANGED <<visible, focused, cleared, unlock, visit>>
Here == visible /\ focused

\* খেলো on the title (session.begin): into play; the clock starts once the pieces land.
YouPressPlay == /\ phase = "title" /\ Here /\ ~sheet
                /\ phase' = "playing" /\ clock' = TRUE /\ was' = unlock
                /\ UNCHANGED <<why, visible, focused, hand, sheet, level, cleared, unlock, visit, cheer>>
\* onDown on a tray piece, then onMove past 8 px: only while canPlay (playing, not paused).
YouPickUpAPiece == /\ phase = "playing" /\ Here /\ hand = "none"
                   /\ hand' = "drag" /\ was' = unlock
                   /\ UNCHANGED <<phase, why, clock, visible, focused, sheet, level, cleared, unlock, visit, cheer>>
\* onUp → onDrop → dropPiece: a wrong drop glides the piece back.
YouDropItWrong == /\ hand = "drag" /\ Here
                  /\ hand' = "none" /\ was' = unlock
                  /\ UNCHANGED <<phase, why, clock, visible, focused, sheet, level, cleared, unlock, visit, cheer>>
\* The last piece goes in (by drop, or by tapping its cell): solved() stops the clock, records the stars, raises your
\* unlock only by your own rule, and queues the confetti and the end screen in the cleared timer list.
YouPlaceTheLastPiece == /\ phase = "playing" /\ Here
                        /\ phase' = "over" /\ clock' = FALSE /\ hand' = "none"
                        /\ cleared' = cleared \cup {level} /\ unlock' = AfterClear(level) /\ cheer' = TRUE /\ was' = unlock
                        /\ UNCHANGED <<why, visible, focused, sheet, level, visit>>
CheerFires == /\ cheer /\ cheer' = FALSE /\ was' = unlock
              /\ UNCHANGED <<phase, why, clock, visible, focused, hand, sheet, level, cleared, unlock, visit>>
\* pauseFor("away"): blur, pagehide, a hidden tab and the player's menu all stop the clock and cancel the hand.
Away(p, w) == /\ phase' = IF p = "playing" THEN "paused" ELSE p
              /\ why' = IF p = "playing" THEN "away" ELSE w
              /\ clock' = FALSE /\ hand' = "none"
WindowBlurs == /\ Here /\ focused' = FALSE /\ Away(phase, why) /\ was' = unlock
               /\ UNCHANGED <<visible, sheet, level, cleared, unlock, visit, cheer>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE /\ was' = unlock
                 /\ UNCHANGED <<phase, why, clock, visible, hand, sheet, level, cleared, unlock, visit, cheer>>
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Away(phase, why) /\ was' = unlock
            /\ UNCHANGED <<sheet, level, cleared, unlock, visit, cheer>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE /\ was' = unlock
            /\ UNCHANGED <<phase, why, clock, hand, sheet, level, cleared, unlock, visit, cheer>>
\* চালিয়ে যাও, Enter, or the first press on the table after coming back (wake): resumes only, never a move.
YouResume == /\ phase = "paused" /\ why = "away" /\ Here
             /\ phase' = "playing" /\ why' = "none" /\ clock' = TRUE /\ was' = unlock
             /\ UNCHANGED <<visible, focused, hand, sheet, level, cleared, unlock, visit, cheer>>
\* The level badge or সব লেভেল: a choice moment. It pauses play (session.pause "sheet" outranks "away").
YouOpenTheSheet == /\ Here /\ ~sheet /\ sheet' = TRUE
                   /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                   /\ why' = IF phase \in {"playing", "paused"} THEN "sheet" ELSE why
                   /\ clock' = FALSE /\ hand' = "none" /\ was' = unlock
                   /\ UNCHANGED <<visible, focused, level, cleared, unlock, visit, cheer>>
YouCloseTheSheet == /\ sheet /\ Here /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet"
                         THEN phase' = "playing" /\ why' = "none" /\ clock' = TRUE
                         ELSE UNCHANGED <<phase, why, clock>>
                    /\ was' = unlock
                    /\ UNCHANGED <<visible, focused, hand, level, cleared, unlock, visit, cheer>>
\* A level in the sheet: only a playable one; from the title it opens that title, mid-round it plays at once.
YouPickALevel == /\ sheet /\ Here /\ \E l \in Levels : Playable(l) /\ Fresh(l, IF phase = "title" THEN "title" ELSE "playing")
\* পরের লেভেল (only when the next level is yours to play), আবার খেলো.
YouPressNextLevel == /\ phase = "over" /\ Here /\ level < Count /\ Playable(level + 1) /\ Fresh(level + 1, "playing")
YouPlayAgain == /\ phase = "over" /\ Here /\ Fresh(level, "playing")
\* The player's নতুন করে শুরু: onRestart → toTitle of this level.
YouRestart == /\ Here /\ phase # "title" /\ Fresh(level, "title")
\* fromHash(): a valid #s=…&l=L link is a visit to L, on its title, whatever was on screen.
FriendLinkOpens == /\ Here /\ \E l \in Levels : /\ level' = l /\ phase' = "title" /\ why' = "none" /\ clock' = FALSE
                                                /\ hand' = "none" /\ sheet' = FALSE /\ cheer' = FALSE /\ visit' = l /\ was' = unlock
                                                /\ UNCHANGED <<visible, focused, cleared, unlock>>

Next == YouPressPlay \/ YouPickUpAPiece \/ YouDropItWrong \/ YouPlaceTheLastPiece \/ CheerFires
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickALevel \/ YouPressNextLevel \/ YouPlayAgain \/ YouRestart
        \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"} /\ clock \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ hand \in {"none", "drag"} /\ sheet \in BOOLEAN
          /\ level \in Levels /\ cleared \subseteq Levels /\ unlock \in Levels /\ visit \in 0..Count /\ cheer \in BOOLEAN

\* The reader's rules.
ClockStillWhileAway == clock => (visible /\ focused)                       \* NoProgressWhileAway
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
PieceDroppedWhenAway == hand = "drag" => (visible /\ focused)               \* InputReleasedWhenAway
PausedMeansFrozen == phase = "paused" => (~clock /\ hand = "none")
ClockMeansPlaying == clock <=> phase = "playing"
CheerOnlyOnTheResult == cheer => phase = "over"
OpenLevelsAreEarned == unlock <= Earned                                    \* a friend's level never opens the ones before it
UnlockNeverShrinks == unlock >= was
ChoiceFreezesPlay == sheet => phase # "playing"
LevelIsPlayable == level <= unlock \/ level \in cleared \/ level = visit
====
