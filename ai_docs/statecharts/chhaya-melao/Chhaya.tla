---- MODULE Chhaya ----
\* ছায়া মেলাও after the rewrite, the page around a round: the screens, a round of two walls (the real one has 3–9; they differ only in
\* the toys), the toy in the hand, the hold after a finished wall that brings the next one, the round saved at the last match, the
\* player's pause, going away and coming back, the kids' daily limit and rest screen. The stars are ChhayaStars.tla, a key held
\* through the end is ChhayaKeys.tla, the parent gate is KidsGate.tla (shared kit, unchanged). Mirrored from:
\*   tools/chhaya-melao/lib/session.ts      begin, touch, matched, tick, pause, resume, blur, focus, toTitle, openLevels, closeLevels
\*   tools/chhaya-melao/lib/drag.ts         one pointer, a toy in the hand, dropped on blur, pause or a list
\*   tools/chhaya-melao/components/game.tsx begin() asks kids.atBreak(); attempt() saves the round at the last match; the 100 ms
\*                                          interval calls S.tick; onPause/onResume/onRestart/onLevels; the blur/focus/visibility handlers
\*   shared/kids-kit.tsx                    useKidsSession rests on mount past the limit; RestScreen is a real modal
\* The one clock is the hold (`solved`): it runs only while play is live. There is no voice.
EXTENDS Naturals
VARIABLES screen, back, idx, solved, recorded, begun, hand,   \* the round and the toy in the hand
          paused, away, swallow, moved, misfire, kept,         \* pause, away and back
          overLimit, resting                                   \* the daily limit
round == <<screen, back, idx, solved, recorded, begun, hand>>
window == <<paused, away, swallow, moved, misfire, kept>>
kids == <<overLimit, resting>>
vars == <<round, window, kids>>

RestShows == resting /\ screen # "play"
Live == screen = "play" /\ ~paused /\ ~away /\ ~RestShows   \* session.live()

Init == /\ screen = "title" /\ back = "title" /\ idx = 1 /\ solved = FALSE /\ recorded = 0 /\ begun = "inTime" /\ hand = FALSE
        /\ paused = FALSE /\ away = FALSE /\ swallow = FALSE /\ moved = FALSE /\ misfire = FALSE /\ kept = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit    \* useKidsSession: past today's limit the page opens resting

\* begin(): the lamp, আবার খেলো, or a level from the list. atBreak() first: past the limit, the rest screen shows instead.
StartRound == /\ screen' = "play" /\ idx' = 1 /\ solved' = FALSE /\ recorded' = 0 /\ resting' = FALSE /\ begun' = "inTime"
NoRound(to) == /\ screen' = to /\ resting' = TRUE /\ UNCHANGED <<idx, solved, recorded, begun>>
Quiet == UNCHANGED <<paused, away, moved, misfire, kept, overLimit>>
YouLightTheLamp == /\ screen \in {"title", "end"} /\ ~RestShows /\ ~paused /\ IF overLimit THEN NoRound(screen) ELSE StartRound
                   /\ swallow' = FALSE /\ hand' = FALSE /\ back' = back /\ Quiet
\* The list opens from the title, the end screen, or the pause menu's সব লেভেল (the menu resumes first; a toy in the hand goes home).
YouOpenTheLevelList == /\ screen \in {"title", "end", "play"} /\ ~RestShows /\ screen' = "levels" /\ back' = screen
                       /\ paused' = FALSE /\ away' = (IF paused THEN FALSE ELSE away) /\ swallow' = FALSE /\ hand' = FALSE
                       /\ UNCHANGED <<idx, solved, recorded, begun, moved, misfire, kept, kids>>
\* pickLevel(): the list closes to the title, then begin() runs: past the limit the rest screen shows on the title.
YouPickALevel == /\ screen = "levels" /\ ~RestShows /\ IF overLimit THEN NoRound("title") ELSE StartRound
                 /\ swallow' = FALSE /\ hand' = FALSE /\ back' = "title" /\ Quiet
\* The list's ← : back to where it was opened. A round it paused is as it was, and the first tap on it only wakes it.
YouCloseTheLevelList == /\ screen = "levels" /\ ~RestShows /\ screen' = back /\ swallow' = (back = "play") /\ back' = "title"
                        /\ UNCHANGED <<idx, solved, recorded, begun, hand, kids, paused, away, moved, misfire, kept>>

\* touch(): only on play, nothing covering it; the first touch after coming back only wakes the game. A toy lifts only while its wall is open.
YouLiftAToy == /\ Live /\ ~solved /\ ~hand
               /\ IF swallow THEN (/\ swallow' = FALSE /\ hand' = FALSE /\ misfire' = misfire)
                             ELSE (/\ swallow' = swallow /\ hand' = TRUE /\ misfire' = (misfire \/ swallow))
               /\ moved' = (moved \/ paused \/ away)
               /\ UNCHANGED <<screen, back, idx, solved, recorded, begun, paused, away, kept, kids>>
\* A slip, or a let-go in the air: the toy goes home; nothing is lost and nothing moves on.
YouLetGoOfTheToy == /\ Live /\ hand /\ hand' = FALSE /\ moved' = (moved \/ paused \/ away)
                    /\ UNCHANGED <<screen, back, idx, solved, recorded, begun, paused, away, swallow, misfire, kept, kids>>
\* The right shadow, by a drop or by a tap on a toy with one open shadow: matched(). On the last wall the round is saved and atBreak()
\* runs in this very match, not in a timer.
YouMatchAShadow == /\ Live /\ ~solved /\ (hand \/ ~swallow) /\ hand' = FALSE /\ solved' = TRUE
                   /\ IF idx = 2 THEN (/\ recorded' = recorded + 1 /\ resting' = overLimit) ELSE (/\ recorded' = recorded /\ resting' = resting)
                   /\ moved' = (moved \/ paused \/ away)
                   /\ UNCHANGED <<screen, back, idx, begun, paused, away, swallow, misfire, kept, overLimit>>

\* tick(): the hold after a finished wall runs out, only while Live. It brings the next wall, or after the last one the end screen.
\* `kept` would record that it ran while away, paused or under a list.
TheHoldRunsOut == /\ screen = "play" /\ solved /\ Live
                  /\ solved' = FALSE /\ kept' = (kept \/ away \/ paused \/ RestShows)
                  /\ IF idx = 1 THEN (/\ idx' = 2 /\ screen' = screen) ELSE (/\ screen' = "end" /\ idx' = idx)
                  /\ UNCHANGED <<back, recorded, begun, hand, paused, away, swallow, moved, misfire, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide. A toy in the hand goes home; the game's blur handler arms the swallow.
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ hand' = FALSE
             /\ UNCHANGED <<screen, back, idx, solved, recorded, begun, away, moved, misfire, kept, kids>>
\* A blur or hide before anyone has touched the game: no menu, but the game's own handler goes away, drops the hand and arms the swallow.
TheWindowBlurs == /\ ~away /\ away' = TRUE /\ swallow' = (screen = "play") /\ hand' = FALSE
                  /\ UNCHANGED <<screen, back, idx, solved, recorded, begun, paused, moved, misfire, kept, kids>>
TheWindowComesBack == /\ away /\ away' = FALSE /\ UNCHANGED <<round, paused, swallow, moved, misfire, kept, kids>>
\* চালিয়ে যাও: the menu tap means the window is in front again.
YouResume == /\ paused /\ paused' = FALSE /\ away' = FALSE /\ swallow' = FALSE /\ UNCHANGED <<round, moved, misfire, kept, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title. A finished round was already saved.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ ~RestShows))
                       /\ screen' = "title" /\ solved' = FALSE /\ idx' = 1 /\ paused' = FALSE /\ swallow' = FALSE /\ hand' = FALSE
                       /\ UNCHANGED <<back, recorded, begun, away, moved, misfire, kept, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<round, window, resting>>
ThePageOpens == /\ screen' = "title" /\ idx' = 1 /\ solved' = FALSE /\ recorded' = 0 /\ hand' = FALSE
                /\ paused' = FALSE /\ away' = FALSE /\ swallow' = FALSE /\ resting' = overLimit
                /\ UNCHANGED <<back, begun, moved, misfire, kept, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট (who can reach it is KidsGate.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, window>>

Next == YouLightTheLamp \/ YouOpenTheLevelList \/ YouPickALevel \/ YouCloseTheLevelList \/ YouLiftAToy \/ YouLetGoOfTheToy
        \/ YouMatchAShadow \/ TheHoldRunsOut \/ YouGoAway \/ TheWindowBlurs \/ TheWindowComesBack \/ YouResume \/ YouGoBackToTheTitle
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "end", "play"} /\ idx \in 1..2 /\ solved \in BOOLEAN
          /\ recorded \in 0..2 /\ begun \in {"inTime", "late"} /\ hand \in BOOLEAN
          /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ swallow \in BOOLEAN /\ moved \in BOOLEAN /\ misfire \in BOOLEAN /\ kept \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a wall. If the limit passes on the last match, it waits for the end screen.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last shadow is matched, it is saved and the limit checked, whatever comes next.
EveryFinishCounts == (idx = 2 /\ solved) => recorded >= 1
\* A round is saved once: the match that finishes it is the only place that writes it (the hold after it only moves the screen).
NoDoubleResult == recorded <= 1
\* Nothing moves on while you look away or under a menu or list: no next wall, no end screen, no chime to an empty room.
NoProgressWhileAway == ~kept
\* After blur, hide, pause or a list, no toy is in the hand.
InputReleasedWhenAway == (away \/ paused \/ screen = "levels") => ~hand
\* A toy is lifted and dropped only while play is live; nothing moves under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* The touch that brings focus back is not a move: it lifts no toy and puts none down.
WakeTapIsNotAMove == ~misfire
\* The level list is a choice screen: no toy in the hand under it.
ChoiceFreezesPlay == screen = "levels" => ~hand
\* NoReadingNeeded (3–6): every control the child needs to go on is a picture, a number or a drawing; words are a second line under it.
Offered == CASE screen = "title" -> {"lamp", "levelChip"}
             [] screen = "play" -> {"toys", "shadows"}
             [] screen = "end" -> {"again", "shesh", "showParent"}
             [] OTHER -> {"levelCards", "back"}
Pictured == {"lamp", "levelChip", "toys", "shadows", "again", "shesh", "showParent", "levelCards", "back"}
NoReadingNeeded == Offered \subseteq Pictured
\* StrayTap: no level number is on screen during play, so one tap can never restart a round.
NoStrayRestart == screen = "play" => "levelCards" \notin Offered
====
