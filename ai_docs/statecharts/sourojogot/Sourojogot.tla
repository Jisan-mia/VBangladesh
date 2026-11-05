---- MODULE Sourojogot ----
\* সৌরজগতের সফর after the rewrite: the screens, the round of questions, the end timer or the ▶ button, the player's
\* pause, going away and coming back, a key held through the last answer, the kids' daily limit and rest screen. The parent
\* gates are SourojogotGates.tla. Mirrored from:
\*   tools/sourojogot/lib/session.ts      begin, tapAnswer, solved, goEnd, timerFires/timerMayRun, pause, resume, blur,
\*                                        toTitle, openLevels, freshKey
\*   tools/sourojogot/components/game.tsx begin() asks kids.atBreak(); pick() records the stars at the last answer and moves
\*                                        the orbit board straight on; nextPlanet() is the ▶ button; onPause/onResume/
\*                                        onRestart/onLevels via useGamePlayer
\*   shared/kids-kit.tsx                  useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two questions stand in for the round. "style" is how the round ends: "board" (tour, sort, build: the rocket flies, a timer
\* brings the end screen) or "button" (know, size, far, scale: a reveal waits for ▶). No voice anywhere, so no speech rule.
EXTENDS Naturals
VARIABLES screen, item, revealed, pending, finished, recorded, begun, style,   \* the round
          paused, swallow, held, skipped, moved,                                \* away and back, keys
          overLimit, resting                                                    \* the daily limit
round == <<screen, item, revealed, pending, finished, recorded, begun, style>>
away == <<paused, swallow, held, skipped, moved>>
kids == <<overLimit, resting>>
vars == <<round, away, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ item = 1 /\ revealed = FALSE /\ pending = "none" /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime" /\ style = "board"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

NewRound == /\ screen' = "play" /\ item' = 1 /\ revealed' = FALSE /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
            /\ style' \in {"board", "button"}

\* begin(): খেলো on the title, আবার খেলো, Enter on the title. atBreak() first: past the limit, the rest screen instead.
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED <<round>>
                     ELSE /\ NewRound /\ resting' = FALSE /\ begun' = "inTime"
                  /\ swallow' = FALSE
                  /\ UNCHANGED <<paused, held, skipped, moved, overLimit>>
\* The level list opens from the title or the end screen; a level from it is begin() too.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels"
                       /\ UNCHANGED <<item, revealed, pending, finished, recorded, begun, style, away, kids>>
\* The player's সব লেভেল (onLevels): from a round too. Nothing waits under the list.
TheMenuOpensTheLevelList == /\ screen = "play" /\ Free /\ screen' = "levels" /\ pending' = "none" /\ revealed' = FALSE
                            /\ UNCHANGED <<item, finished, recorded, begun, style, away, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<item, revealed, pending, finished, recorded, begun, style>>
                    ELSE /\ NewRound /\ resting' = FALSE /\ begun' = "inTime"
                 /\ UNCHANGED <<away, overLimit>>

\* tapAnswer(): only on play, nothing covering it, the round not already finished; a question already answered waits for ▶.
\* The first tap after coming back only wakes the game.
YouTapAWrongAnswer == /\ screen = "play" /\ Free /\ pending = "none" /\ ~revealed
                      /\ swallow' = FALSE
                      /\ UNCHANGED <<round, paused, held, skipped, moved, kids>>
\* The right answer: solved(). On the last question the stars are saved and atBreak() runs in this very tap. The orbit board
\* moves straight on to the next question; a reveal waits for ▶.
YouTapTheRightAnswer == /\ screen = "play" /\ Free /\ pending = "none" /\ ~revealed
                        /\ IF swallow
                           THEN /\ swallow' = FALSE /\ UNCHANGED <<item, revealed, pending, finished, recorded, resting>>
                           ELSE /\ swallow' = swallow
                                /\ IF item = 2
                                   THEN /\ pending' = (IF style = "board" THEN "end" ELSE "wait") /\ finished' = TRUE /\ recorded' = TRUE
                                        /\ resting' = overLimit /\ UNCHANGED <<item, revealed>>
                                   ELSE /\ IF style = "board" THEN (item' = 2 /\ revealed' = FALSE) ELSE (item' = item /\ revealed' = TRUE)
                                        /\ UNCHANGED <<pending, finished, recorded, resting>>
                        /\ UNCHANGED <<screen, begun, style, paused, held, skipped, moved, overLimit>>
\* ▶ after a reveal: the next question.
TheNextButton == /\ screen = "play" /\ Free /\ revealed /\ item = 1
                 /\ item' = 2 /\ revealed' = FALSE
                 /\ UNCHANGED <<screen, pending, finished, recorded, begun, style, away, kids>>
\* goEnd() and timerFires() run only when nothing covers the game; `moved` would record a step taken under the menu.
TheEndButtonIsTapped == /\ screen = "play" /\ pending = "wait" /\ Free
                        /\ pending' = "none" /\ screen' = "end"
                        /\ UNCHANGED <<item, revealed, finished, recorded, begun, style, away, kids>>
TheEndTimerFires == /\ pending = "end" /\ ~paused
                    /\ pending' = "none" /\ screen' = "end" /\ moved' = (moved \/ paused)
                    /\ UNCHANGED <<item, revealed, finished, recorded, begun, style, paused, swallow, held, skipped, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide (the game's blur handler arms the swallow; held keys are dropped).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
             /\ UNCHANGED <<round, skipped, moved, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title; the pending timer is cleared.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ pending' = "none" /\ revealed' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<item, finished, recorded, begun, style, held, skipped, moved, kids>>

\* Enter or Space held through the last answer and auto-repeating on the end screen: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, swallow, skipped, moved, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, swallow, held, moved, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, swallow, skipped, moved, kids>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<round, away, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit; both gates closed.
ThePageOpens == /\ screen' = "title" /\ item' = 1 /\ revealed' = FALSE /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE
                /\ resting' = overLimit
                /\ UNCHANGED <<begun, style, skipped, moved, overLimit>>

\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is SourojogotGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, away>>

Next == YouStartARound \/ YouOpenTheLevelList \/ TheMenuOpensTheLevelList \/ YouPickALevel \/ YouTapAWrongAnswer \/ YouTapTheRightAnswer
        \/ TheNextButton \/ TheEndButtonIsTapped \/ TheEndTimerFires \/ YouGoAway \/ YouResume \/ YouGoBackToTheTitle
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens
        \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ item \in 1..2 /\ revealed \in BOOLEAN /\ pending \in {"none", "end", "wait"}
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"} /\ style \in {"board", "button"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a question.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last answer is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* The level list is a choice screen: nothing is waiting under it.
ChoiceFreezesPlay == screen = "levels" => (pending = "none" /\ ~revealed)
\* A key held through the last answer never starts the next round.
ResultNeedsFreshPress == ~skipped
\* The end screen comes only after the last answer, never from a question still open.
EndOnlyAfterTheLastAnswer == screen = "end" => finished
====
