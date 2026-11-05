---- MODULE ShomanBhag ----
\* সমান ভাগ after the rewrite: the screens, a round of two servings (the real round has four to six, which differ only in
\* guests and food), the piece in the child's hand, the ➜ that brings the next guests, stars saved at the last piece, the
\* player's pause, going away and coming back, a key held through the last serving, the kids' daily limit and rest screen.
\* The parent gates are the same code as in abc-bazar (checked there). Mirrored from:
\*   tools/shoman-bhag/lib/round.ts      tapBasket, tapPlate, release, complete, nextItem
\*   tools/shoman-bhag/lib/session.ts    begin, tapBoard, servedDone, tapNext, pause, resume, blur, toTitle, openLevels, freshKey
\*   tools/shoman-bhag/components/game.tsx  begin() asks kids.atBreak(); play() records the stars at the last piece; goNext(); letGo()
\*                                       onPause/onResume/onRestart/onLevels; the window blur/focus/visibility handlers; no timer
\*   shared/kids-kit.tsx                 useKidsSession rests on mount past the limit; RestScreen is a real modal
\* There is no timer and no voice: a finished serving waits for the ➜ for as long as the child likes. The only clock is the
\* 7 s ghost finger, which is a picture and never moves a piece.
EXTENDS Naturals
VARIABLES screen, idx, solved, hand, slips, best, recorded, begun,   \* the round
          paused, swallow, held, skipped, moved, misfire, dropped,   \* away and back, keys
          overLimit, resting                                         \* the daily limit
round == <<screen, idx, solved, hand, slips, best, recorded, begun>>
guard == <<paused, swallow, held, skipped, moved, misfire, dropped>>
kids == <<overLimit, resting>>
vars == <<round, guard, kids>>

Stars(s) == IF s = 0 THEN 3 ELSE 2     \* starsOf: all but one first try → 3 (slips abstracted to none / some)
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ idx = 1 /\ solved = FALSE /\ hand = FALSE /\ slips = 0 /\ best = 0 /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE /\ misfire = FALSE
        /\ dropped = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit    \* useKidsSession: past today's limit the page opens resting

\* begin(): the mat, আবার খেলো, Enter on the title, or a level from the list. atBreak() first: past the limit, the rest screen instead.
Start == IF overLimit
         THEN (/\ resting' = TRUE /\ UNCHANGED <<idx, solved, hand, slips, recorded, begun>>)
         ELSE (/\ screen' = "play" /\ idx' = 1 /\ solved' = FALSE /\ hand' = FALSE /\ slips' = 0 /\ recorded' = FALSE /\ resting' = FALSE /\ begun' = "inTime")
Keep == UNCHANGED <<best, paused, held, skipped, moved, misfire, dropped, overLimit>>
YouStartARound == /\ screen \in {"title", "end"} /\ Free /\ Start /\ swallow' = FALSE /\ (overLimit => UNCHANGED screen) /\ Keep
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels"
                       /\ UNCHANGED <<idx, solved, hand, slips, best, recorded, begun, guard, kids>>
\* pickLevel(): the list closes to the title, then begin() runs: past the limit the rest screen shows on the title.
YouPickALevel == /\ screen = "levels" /\ Free /\ Start /\ swallow' = FALSE /\ (overLimit => screen' = "title") /\ Keep
YouCloseTheLevelList == /\ screen = "levels" /\ Free /\ screen' = "title"
                        /\ UNCHANGED <<idx, solved, hand, slips, best, recorded, begun, guard, kids>>
\* The pause menu's সব লেভেল: back to the mat, then the list opens (the unfinished serving is dropped).
YouOpenLevelsFromTheMenu == /\ paused /\ screen = "play" /\ screen' = "levels" /\ paused' = FALSE /\ swallow' = FALSE /\ hand' = FALSE /\ solved' = FALSE /\ idx' = 1
                            /\ UNCHANGED <<slips, best, recorded, begun, held, skipped, moved, misfire, dropped, kids>>

\* tapBoard(): only on play, nothing covering it, the serving still open; the first touch after coming back only wakes the game.
\* `moved` and `misfire` would record a step taken under the menu, or by the waking touch.
\* Lifting a piece off the basket or a plate: the piece is in the hand.
YouLiftAPiece == /\ screen = "play" /\ Free /\ ~solved /\ ~hand
                 /\ IF swallow THEN (/\ swallow' = FALSE /\ hand' = hand /\ misfire' = misfire)
                               ELSE (/\ swallow' = swallow /\ hand' = TRUE /\ misfire' = (misfire \/ swallow))
                 /\ moved' = (moved \/ paused)
                 /\ UNCHANGED <<screen, idx, solved, slips, best, recorded, begun, paused, held, skipped, dropped, kids>>
\* Putting a piece down on a plate that is still short: the serving goes on.
YouDropAPiece == /\ screen = "play" /\ Free /\ ~solved /\ hand
                 /\ IF swallow THEN (/\ swallow' = FALSE /\ hand' = hand /\ misfire' = misfire)
                               ELSE (/\ swallow' = swallow /\ hand' = FALSE /\ misfire' = (misfire \/ swallow))
                 /\ moved' = (moved \/ paused)
                 /\ UNCHANGED <<screen, idx, solved, slips, best, recorded, begun, paused, held, skipped, dropped, kids>>
\* A piece on a plate that already has its share: the face is surprised, an arrow shows to take one back. A miss, never a buzzer.
YouOverfillAPlate == /\ screen = "play" /\ Free /\ ~solved /\ hand
                     /\ IF swallow THEN (/\ swallow' = FALSE /\ slips' = slips /\ hand' = hand /\ misfire' = misfire)
                                   ELSE (/\ swallow' = swallow /\ slips' = 1 /\ hand' = FALSE /\ misfire' = (misfire \/ swallow))
                     /\ moved' = (moved \/ paused)
                     /\ UNCHANGED <<screen, idx, solved, best, recorded, begun, paused, held, skipped, dropped, kids>>
\* The last piece that makes everyone equal: servedDone(). On the last serving the stars are saved and atBreak() runs in this very touch.
YouGiveTheLastPiece == /\ screen = "play" /\ Free /\ ~solved /\ hand
                       /\ IF swallow
                          THEN (/\ swallow' = FALSE /\ misfire' = misfire /\ solved' = solved /\ hand' = hand /\ recorded' = recorded /\ resting' = resting /\ best' = best /\ dropped' = dropped)
                          ELSE (/\ swallow' = swallow /\ misfire' = (misfire \/ swallow) /\ solved' = TRUE /\ hand' = FALSE
                                /\ IF idx = 2
                                   THEN (LET kept == IF Stars(slips) > best THEN Stars(slips) ELSE best
                                         IN /\ best' = kept /\ dropped' = (dropped \/ kept < best) /\ recorded' = TRUE /\ resting' = overLimit)
                                   ELSE (/\ best' = best /\ dropped' = dropped /\ recorded' = recorded /\ resting' = resting))
                       /\ moved' = (moved \/ paused)
                       /\ UNCHANGED <<screen, idx, slips, begun, paused, held, skipped, overLimit>>
\* tapNext(): the ➜ is the only way to the next guests. The first touch back only wakes; on the last serving it brings the end screen.
YouPressTheArrow == /\ screen = "play" /\ Free /\ solved
                    /\ IF swallow
                       THEN (/\ swallow' = FALSE /\ misfire' = misfire /\ screen' = screen /\ idx' = idx /\ solved' = solved)
                       ELSE (/\ swallow' = swallow /\ misfire' = (misfire \/ swallow)
                             /\ IF idx = 1
                                THEN (/\ idx' = 2 /\ solved' = FALSE /\ screen' = screen)
                                ELSE (/\ screen' = "end" /\ idx' = idx /\ solved' = FALSE))
                    /\ moved' = (moved \/ paused)
                    /\ UNCHANGED <<hand, slips, best, recorded, begun, paused, held, skipped, dropped, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide. The game's blur handler arms the swallow, drops held keys and returns the piece (letGo()).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE /\ hand' = FALSE
             /\ UNCHANGED <<screen, idx, solved, slips, best, recorded, begun, skipped, moved, misfire, dropped, kids>>
\* A blur or hide before anyone has touched the game: the player opens no menu, the game's own handler does the same.
TheWindowBlurs == /\ ~paused /\ swallow' = (screen = "play") /\ held' = FALSE /\ hand' = FALSE
                  /\ UNCHANGED <<screen, idx, solved, slips, best, recorded, begun, paused, skipped, moved, misfire, dropped, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, misfire, dropped, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the mat. A finished round was already recorded.
YouGoBackToTheMat == /\ (paused \/ (screen = "end" /\ Free))
                     /\ screen' = "title" /\ solved' = FALSE /\ idx' = 1 /\ hand' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                     /\ UNCHANGED <<slips, best, recorded, begun, held, skipped, moved, misfire, dropped, kids>>

\* Enter or Space held through the last serving and auto-repeating on the end screen: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, swallow, skipped, moved, misfire, dropped, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, swallow, held, moved, misfire, dropped, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, swallow, skipped, moved, misfire, dropped, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<round, guard, resting>>
ThePageOpens == /\ screen' = "title" /\ idx' = 1 /\ solved' = FALSE /\ hand' = FALSE /\ slips' = 0 /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE /\ resting' = overLimit
                /\ UNCHANGED <<best, begun, skipped, moved, misfire, dropped, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট (who can reach it is the gate model's job, see abc-bazar's AbcBazarGates).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, guard>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouPickALevel \/ YouCloseTheLevelList \/ YouOpenLevelsFromTheMenu
        \/ YouLiftAPiece \/ YouDropAPiece \/ YouOverfillAPlate \/ YouGiveTheLastPiece \/ YouPressTheArrow
        \/ YouGoAway \/ TheWindowBlurs \/ YouResume \/ YouGoBackToTheMat
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ idx \in 1..2 /\ solved \in BOOLEAN /\ hand \in BOOLEAN /\ slips \in 0..1
          /\ best \in 0..3 /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ misfire \in BOOLEAN /\ dropped \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a serving. If the limit passes on the last piece, it waits for the end screen.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last serving is complete, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == (idx = 2 /\ solved) => recorded
\* The stars on the end screen are this round's, and the saved best is at least that; a worse round never lowers it.
ResultMatchesPlay == screen = "end" => best >= Stars(slips)
StarsNeverDrop == ~dropped
\* Nothing moves under the pause menu: the pieces and the ➜ wait.
NothingMovesUnderTheMenu == ~moved
\* The touch that brings focus back is not a move: it never lifts, drops or gives a piece, and never presses the ➜.
WakeTapIsNotAMove == ~misfire
\* The level list is a choice screen: no serving is waiting under it.
ChoiceFreezesPlay == screen = "levels" => ~solved
\* A key held through the last serving never starts the next round.
ResultNeedsFreshPress == ~skipped
\* A piece never stays in the hand while the window is away or the menu is open: it goes back to where it came from.
PieceGoesBackWhenAway == hand => ~swallow /\ ~paused
\* The served table, and the next guests, wait for you while you are away: the serving or the screen changes only when you are here and not paused.
NoProgressWhileAway == [][(idx' # idx \/ screen' # screen \/ solved' # solved) => ((~swallow /\ ~paused) \/ screen' = "title" \/ screen' = "levels")]_vars
\* No step moves a serving on by itself: a new serving or the end screen only ever follows the ➜.
NextGuestsOnlyByTheArrow == [][idx' # idx => ((solved /\ ~solved') \/ screen' = "title" \/ screen' = "levels" \/ (screen' = "play" /\ idx' = 1))]_vars
====
