---- MODULE Juktoborno ----
\* যুক্তবর্ণ ভাঙি-জুড়ি after the rewrite: the screens, the round of words, the child-paced step from a solved word to the next
\* (there are no timers), the level list opened from a round, the player's pause, going away and coming back, a key held
\* through a word or the page, the kids' daily limit and rest screen. The parent gates are JuktobornoGates.tla. Mirrored from:
\*   tools/juktoborno/lib/session.ts          begin, tapLetter, solved, tapNext (SETTLE_MS), pause, resume, blur, toTitle,
\*                                            openLevels/closeLevels, freshNextKey, freshEndKey
\*   tools/juktoborno/components/game.tsx     begin() asks kids.atBreak(); pick() records the stars at the last right letter;
\*                                            advance(); pickLevel() resumes the round in progress; onPause/onResume/onRestart/onLevels
\*   shared/kids-kit.tsx                      useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two words stand in for six to ten. "holder" is who has the phone (see the gates spec). No voice anywhere on the site.
EXTENDS Naturals
VARIABLES screen, back, word, waiting, settled, finished, recorded, begun,   \* the round
          paused, swallow, held, skipped, moved, unseen, lost,               \* away and back, keys, the double-tap, a round lost to the list
          snapW, snapWait,                                                   \* the round as it was when the list opened
          overLimit, resting                                                 \* the daily limit
round == <<screen, back, word, waiting, settled, finished, recorded, begun>>
away == <<paused, swallow, held, skipped, moved, unseen, lost>>
snap == <<snapW, snapWait>>
kids == <<overLimit, resting>>
vars == <<round, away, snap, kids>>

RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ back = "title" /\ word = 1 /\ waiting = FALSE /\ settled = FALSE /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE /\ unseen = FALSE /\ lost = FALSE
        /\ snapW = 1 /\ snapWait = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit

\* begin(): খেলো, আবার খেলো, Enter on the title. atBreak() first: past the limit, the rest screen instead.
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED <<screen, back, word, waiting, settled, finished, recorded, begun>>
                     ELSE /\ screen' = "play" /\ back' = "title" /\ word' = 1 /\ waiting' = FALSE /\ settled' = FALSE /\ finished' = FALSE /\ recorded' = FALSE
                          /\ resting' = FALSE /\ begun' = "inTime"
                  /\ swallow' = FALSE
                  /\ UNCHANGED <<paused, held, skipped, moved, unseen, lost, snap, overLimit>>
\* openLevels(): from the title, the end page or a round (the pause menu's সব লেভেল). The round stays as it is.
YouOpenTheLevelList == /\ screen \in {"title", "end", "play"} /\ Free /\ back' = screen /\ screen' = "levels"
                       /\ snapW' = word /\ snapWait' = waiting
                       /\ UNCHANGED <<word, waiting, settled, finished, recorded, begun, away, kids>>
\* closeLevels(), or a pick of the level already in progress: back to the same round.
YouCloseTheList == /\ screen = "levels" /\ Free /\ screen' = back /\ snapW' = 1 /\ snapWait' = FALSE
                   /\ UNCHANGED <<back, word, waiting, settled, finished, recorded, begun, paused, swallow, held, skipped, moved, unseen, kids>>
                   /\ lost' = (lost \/ (back = "play" /\ (word' # snapW \/ waiting' # snapWait)))
\* pickLevel() of another level is begin() too.
YouPickAnotherLevel == /\ screen = "levels" /\ Free
                       /\ IF overLimit
                          THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<back, word, waiting, settled, finished, recorded, begun>>
                          ELSE /\ screen' = "play" /\ back' = "title" /\ word' = 1 /\ waiting' = FALSE /\ settled' = FALSE /\ finished' = FALSE /\ recorded' = FALSE
                               /\ resting' = FALSE /\ begun' = "inTime"
                       /\ snapW' = 1 /\ snapWait' = FALSE
                       /\ UNCHANGED <<away, overLimit>>

\* tapLetter(): only on play, nothing covering it, the word not yet solved; the first tap after coming back only wakes the game.
YouTryAWrongSet == /\ screen = "play" /\ Free /\ ~waiting
                   /\ swallow' = FALSE
                   /\ UNCHANGED <<round, paused, held, skipped, moved, unseen, lost, snap, kids>>
\* The last right letter: solved(). On the last word the stars are saved and atBreak() runs in this very tap.
YouSolveTheWord == /\ screen = "play" /\ Free /\ ~waiting
                   /\ IF swallow
                      THEN /\ swallow' = FALSE /\ UNCHANGED <<waiting, settled, finished, recorded, resting>>
                      ELSE /\ waiting' = TRUE /\ settled' = FALSE
                           /\ finished' = (word = 2) /\ recorded' = (word = 2)
                           /\ resting' = (IF word = 2 THEN overLimit ELSE resting)
                           /\ UNCHANGED swallow
                   /\ UNCHANGED <<screen, back, word, begun, paused, held, skipped, moved, unseen, lost, snap, overLimit>>
\* SETTLE_MS (0.4 s) passes: only now does a tap on পরেরটা count.
AMomentPasses == /\ waiting /\ ~settled /\ settled' = TRUE
                 /\ UNCHANGED <<screen, back, word, waiting, finished, recorded, begun, away, snap, kids>>
\* A tap on পরেরটা before that is ignored by tapNext(): the model simply has no step for it.
\* tapNext(): the menu shut, the rest screen not up, the word solved and settled; after a blur the first tap only wakes.
YouPressNext == /\ screen = "play" /\ Free /\ waiting /\ settled
                /\ IF swallow
                   THEN /\ swallow' = FALSE /\ UNCHANGED <<screen, word, waiting>>
                   ELSE /\ waiting' = FALSE
                        /\ IF word = 2 THEN (screen' = "end" /\ UNCHANGED word) ELSE (word' = 2 /\ UNCHANGED screen)
                        /\ UNCHANGED swallow
                /\ moved' = (moved \/ paused) /\ unseen' = (unseen \/ ~settled)
                /\ UNCHANGED <<back, settled, finished, recorded, begun, paused, held, skipped, lost, snap, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide (the game's blur handler arms the swallow; held keys are dropped).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
             /\ UNCHANGED <<round, skipped, moved, unseen, lost, snap, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, unseen, lost, snap, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end page: back to the factory; a solved word waiting is cleared.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ back' = "title" /\ waiting' = FALSE /\ settled' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                       /\ snapW' = 1 /\ snapWait' = FALSE
                       /\ UNCHANGED <<word, finished, recorded, begun, held, skipped, moved, unseen, lost, kids>>

\* Enter or Space held through a solved word or the end page: freshNextKey() and freshEndKey() refuse a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, swallow, skipped, moved, unseen, lost, snap, kids>>
TheKeyRepeats == /\ held /\ ((screen = "play" /\ waiting) \/ screen = "end") /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, swallow, held, moved, unseen, lost, snap, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, swallow, skipped, moved, unseen, lost, snap, kids>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<round, away, snap, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit.
ThePageOpens == /\ screen' = "title" /\ back' = "title" /\ word' = 1 /\ waiting' = FALSE /\ settled' = FALSE /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE
                /\ resting' = overLimit
                /\ snapW' = 1 /\ snapWait' = FALSE
                /\ UNCHANGED <<begun, skipped, moved, unseen, lost, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is JuktobornoGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, away, snap>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouCloseTheList \/ YouPickAnotherLevel \/ YouTryAWrongSet \/ YouSolveTheWord
        \/ AMomentPasses \/ YouPressNext \/ YouGoAway \/ YouResume \/ YouGoBackToTheTitle
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "play", "end"} /\ word \in 1..2
          /\ waiting \in BOOLEAN /\ settled \in BOOLEAN /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN /\ unseen \in BOOLEAN /\ lost \in BOOLEAN
          /\ snapW \in 1..2 /\ snapWait \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a word.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last word is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* A double-tap on a tile never skips the word just solved: পরেরটা counts only after it has settled.
NextNeedsALook == ~unseen
\* The level list is a choice screen, and a round in progress is exactly as it was when the list closes.
RoundSurvivesTheList == ~lost /\ ((screen = "levels" /\ back = "play") => (word = snapW /\ waiting = snapWait))
\* A key held through a word or the end page never skips it.
ResultNeedsFreshPress == ~skipped
====
