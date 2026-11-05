---- MODULE AbcBazar ----
\* এবিসি বাজার after the rewrite: the screens, a round of two items (the six differ only in letters), the ➜ that moves the
\* round on, stars saved at the last right tap, the player's pause, going away and coming back, a key held through the last
\* item, the kids' daily limit and rest screen. The parent gates are AbcBazarGates.tla. Mirrored from:
\*   tools/abc-bazar/lib/session.ts      begin, tapTile, solvedItem, tapNext, pause, resume, blur, toTitle, openLevels, freshKey
\*   tools/abc-bazar/components/game.tsx begin() asks kids.atBreak(); pick() records the stars at the last tap; goNext();
\*                                       onPause/onResume/onRestart; the window blur/focus/visibility handlers
\*   shared/kids-kit.tsx                 useKidsSession rests on mount past the limit; RestScreen is a real modal
\* There is no timer and no voice: nothing moves unless the child taps (the 7 s finger nudge is only a hint picture).
EXTENDS Naturals
VARIABLES screen, idx, solved, slips, best, recorded, begun,   \* the round
          paused, swallow, held, skipped, moved, misfire, dropped,   \* away and back, keys
          overLimit, resting                                         \* the daily limit
round == <<screen, idx, solved, slips, best, recorded, begun>>
away == <<paused, swallow, held, skipped, moved, misfire, dropped>>
kids == <<overLimit, resting>>
vars == <<round, away, kids>>

Stars(s) == IF s = 0 THEN 3 ELSE 2     \* starsOf: all but one right first time → 3 (slips abstracted to none / some)
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ idx = 1 /\ solved = FALSE /\ slips = 0 /\ best = 0 /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE /\ misfire = FALSE /\ dropped = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit    \* useKidsSession: past today's limit the page opens resting

\* begin(): খেলো, আবার খেলো, Enter on the title, or a level from the list. atBreak() first: past the limit, the rest screen instead.
Start == IF overLimit
         THEN (/\ resting' = TRUE /\ UNCHANGED <<idx, solved, slips, recorded, begun>>)
         ELSE (/\ screen' = "play" /\ idx' = 1 /\ solved' = FALSE /\ slips' = 0 /\ recorded' = FALSE /\ resting' = FALSE /\ begun' = "inTime")
Keep == UNCHANGED <<best, paused, held, skipped, moved, misfire, dropped, overLimit>>
YouStartARound == /\ screen \in {"title", "end"} /\ Free /\ Start /\ swallow' = FALSE /\ (overLimit => UNCHANGED screen) /\ Keep
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels"
                       /\ UNCHANGED <<idx, solved, slips, best, recorded, begun, away, kids>>
\* pickLevel(): the list closes to the title, then begin() runs: past the limit the rest screen shows on the title.
YouPickALevel == /\ screen = "levels" /\ Free /\ Start /\ swallow' = FALSE /\ (overLimit => screen' = "title") /\ Keep
\* The list's ← : back to where it was opened (the title or the end screen; one word stands for both).
YouCloseTheLevelList == /\ screen = "levels" /\ Free /\ screen' = "title"
                        /\ UNCHANGED <<idx, solved, slips, best, recorded, begun, away, kids>>

\* tapTile(): only on play, nothing covering it, the item still open; the first tap after coming back only wakes the game.
\* `moved` and `misfire` would record a step taken under the menu, or by the waking tap.
YouTapAWrongTile == /\ screen = "play" /\ Free /\ ~solved
                    /\ IF swallow THEN (/\ swallow' = FALSE /\ slips' = slips /\ misfire' = misfire)
                                  ELSE (/\ swallow' = swallow /\ slips' = 1 /\ misfire' = (misfire \/ swallow))
                    /\ moved' = (moved \/ paused)
                    /\ UNCHANGED <<screen, idx, solved, best, recorded, begun, paused, held, skipped, dropped, kids>>
\* The right tile: solvedItem(). On the last item the stars are saved and atBreak() runs in this very tap.
YouTapTheRightTile == /\ screen = "play" /\ Free /\ ~solved
                      /\ IF swallow
                         THEN (/\ swallow' = FALSE /\ misfire' = misfire /\ solved' = solved /\ recorded' = recorded /\ resting' = resting /\ best' = best /\ dropped' = dropped)
                         ELSE (/\ swallow' = swallow /\ misfire' = (misfire \/ swallow) /\ solved' = TRUE
                               /\ IF idx = 2
                                  THEN (LET kept == IF Stars(slips) > best THEN Stars(slips) ELSE best
                                        IN /\ best' = kept /\ dropped' = (dropped \/ kept < best) /\ recorded' = TRUE /\ resting' = overLimit)
                                  ELSE (/\ best' = best /\ dropped' = dropped /\ recorded' = recorded /\ resting' = resting))
                      /\ moved' = (moved \/ paused)
                      /\ UNCHANGED <<screen, idx, slips, begun, paused, held, skipped, overLimit>>
\* tapNext(): the ➜. The first tap back only wakes; on the last item it brings the end screen.
YouPressTheArrow == /\ screen = "play" /\ Free /\ solved
                    /\ IF swallow
                       THEN (/\ swallow' = FALSE /\ misfire' = misfire /\ screen' = screen /\ idx' = idx /\ solved' = solved)
                       ELSE (/\ swallow' = swallow /\ misfire' = (misfire \/ swallow)
                             /\ IF idx = 1
                                THEN (/\ idx' = 2 /\ solved' = FALSE /\ screen' = screen)
                                ELSE (/\ screen' = "end" /\ idx' = idx /\ solved' = FALSE))
                    /\ moved' = (moved \/ paused)
                    /\ UNCHANGED <<slips, best, recorded, begun, paused, held, skipped, dropped, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide (the game's blur handler arms the swallow; held keys are dropped).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
             /\ UNCHANGED <<round, skipped, moved, misfire, dropped, kids>>
\* A blur or hide before anyone has touched the game: the player opens no menu, the game's own handler arms the swallow.
TheWindowBlurs == /\ ~paused /\ swallow' = (screen = "play") /\ held' = FALSE /\ UNCHANGED <<round, paused, skipped, moved, misfire, dropped, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, misfire, dropped, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title. A finished round was already recorded.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ solved' = FALSE /\ idx' = 1 /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<slips, best, recorded, begun, held, skipped, moved, misfire, dropped, kids>>

\* Enter or Space held through the last item and auto-repeating on the end screen: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, swallow, skipped, moved, misfire, dropped, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, swallow, held, moved, misfire, dropped, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, swallow, skipped, moved, misfire, dropped, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<round, away, resting>>
ThePageOpens == /\ screen' = "title" /\ idx' = 1 /\ solved' = FALSE /\ slips' = 0 /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE /\ resting' = overLimit
                /\ UNCHANGED <<best, begun, skipped, moved, misfire, dropped, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট (who can reach it is AbcBazarGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, away>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouPickALevel \/ YouCloseTheLevelList \/ YouTapAWrongTile \/ YouTapTheRightTile
        \/ YouPressTheArrow \/ YouGoAway \/ TheWindowBlurs \/ YouResume \/ YouGoBackToTheTitle \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ idx \in 1..2 /\ solved \in BOOLEAN /\ slips \in 0..1
          /\ best \in 0..3 /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ misfire \in BOOLEAN /\ dropped \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over an item. If the limit passes on the last tap, it waits for the end screen.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last item is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == (idx = 2 /\ solved) => recorded
\* The stars on the end screen are this round's, and the saved best is at least that; a worse round never lowers it.
ResultMatchesPlay == screen = "end" => best >= Stars(slips)
StarsNeverDrop == ~dropped
\* Nothing moves under the pause menu: the ➜ and the tiles wait.
NothingMovesUnderTheMenu == ~moved
\* The tap that brings focus back is not a move.
WakeTapIsNotAMove == ~misfire
\* The level list is a choice screen: no item is waiting under it.
ChoiceFreezesPlay == screen = "levels" => ~solved
\* A key held through the last item never starts the next round.
ResultNeedsFreshPress == ~skipped
====
