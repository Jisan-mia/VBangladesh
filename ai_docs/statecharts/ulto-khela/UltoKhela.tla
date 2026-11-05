---- MODULE UltoKhela ----
\* উল্টো খেলা after the rewrite: the screens, a round of pictures, the rest after each picture, the optional চটপট clock, the
\* player's pause, going away and coming back, the level list, a key held through the last answer, the kids' daily limit and the
\* rest screen. The parent gates are UltoKhelaGates.tla. Mirrored from:
\*   tools/ulto-khela/lib/session.ts      begin, tapAnswer, solved, timerFires/timerMayRun, quickMayRun, pause, resume, blur,
\*                                        focus, toTitle, openLevels, setQuick, freshKey
\*   tools/ulto-khela/components/game.tsx begin() asks kids.atBreak(); finished() records the stars at the last picture;
\*                                        armPending() is the rest after a picture; quickPass() is চটপট's clock; the blur /
\*                                        visibility handlers; onPause/onResume/onRestart/onLevels via useGamePlayer
\*   shared/kids-kit.tsx                  useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two pictures stand in for a round: picture 1 is the demo (the ghost finger; চটপট never passes a demo), 2 is a normal
\* picture and the last. A wrong tap changes nothing but a try count, so it is left out. No voice anywhere, so no speech rule.
\* The flags `moved` and `passedAway` are true only in the state right after a step that breaks a rule; the guards below are the
\* real code's guards (S.timerMayRun, S.quickMayRun), so they never become true. Remove a guard and the rule breaks at once.
EXTENDS Naturals
VARIABLES screen, item, pending, finished, recorded, begun,      \* the round
          quick, paused, away, held, skipped, moved, passedAway, \* clocks, away and back, keys
          overLimit, resting                                              \* the daily limit
round == <<screen, item, pending, finished, recorded, begun>>
clocks == <<quick, paused, away, held, skipped, moved, passedAway>>
kids == <<overLimit, resting>>
vars == <<round, clocks, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
\* live(): on a round, nothing covering it, the child here. Every clock needs this.
Live == screen = "play" /\ ~paused /\ ~away /\ ~RestShows
Free == ~RestShows /\ ~paused /\ ~away

Init == /\ screen = "title" /\ item = 1 /\ pending = "none" /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ quick = FALSE /\ paused = FALSE /\ away = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE /\ passedAway = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

NewRound == /\ screen' = "play" /\ item' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE

\* খেলো on the title, আবার খেলো, Enter on the title. begin() asks atBreak() first: past the limit, the rest screen instead.
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED <<round>>
                     ELSE /\ NewRound /\ resting' = FALSE /\ begun' = "inTime"
                  /\ UNCHANGED <<quick, paused, away, held, skipped, moved, passedAway, overLimit>>
\* The pace chips, on the title only (setQuick refuses mid-round).
YouChooseThePace == /\ screen = "title" /\ Free /\ quick' = ~quick
                    /\ UNCHANGED <<round, paused, away, held, skipped, moved, passedAway, kids>>
\* The level list opens from the title or the end screen; a level from it is begin() too.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels"
                       /\ UNCHANGED <<item, pending, finished, recorded, begun, clocks, kids>>
\* The player's সব লেভেল (onLevels): from a round too. openLevels() drops the rest after a picture; the stars of a finished round were saved already.
TheMenuOpensTheLevelList == /\ screen = "play" /\ Free /\ screen' = "levels" /\ pending' = "none"
                            /\ UNCHANGED <<item, finished, recorded, begun, clocks, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<item, pending, finished, recorded, begun>>
                    ELSE /\ NewRound /\ resting' = FALSE /\ begun' = "inTime"
                 /\ UNCHANGED <<clocks, overLimit>>

\* tapAnswer(): only on a live round, the picture not already answered. A wrong tap changes nothing but a try count, and the first tap
\* after coming back only wakes the game (`swallow`): both are tests/session.test.ts, not states here.
\* finished(): a right tap (or a passed picture) ends the picture. On the last one the stars are saved and atBreak() runs in this very moment.
PictureEnds == /\ screen' = screen /\ item' = item /\ begun' = begun /\ overLimit' = overLimit
               /\ pending' = (IF item = 2 THEN "end" ELSE "next")
               /\ finished' = (finished \/ item = 2) /\ recorded' = (recorded \/ item = 2)
               /\ resting' = (IF item = 2 THEN overLimit ELSE resting)
YouTapTheRightPicture == /\ Live /\ pending = "none"
                         /\ PictureEnds
                         /\ UNCHANGED <<quick, paused, away, held, skipped, moved, passedAway>>
\* quickPass(): চটপট's clock, only while quickMayRun() (live, a waiting non-demo picture); nothing passes away, under the menu or on the list.
TheQuickClockPasses == /\ quick /\ item > 1 /\ pending = "none" /\ Live
                       /\ PictureEnds
                       /\ passedAway' = (passedAway \/ away \/ paused \/ screen # "play")
                       /\ UNCHANGED <<quick, paused, away, held, skipped, moved>>
\* The rest after a picture (armPending): timerFires() runs only when timerMayRun() (not frozen, live).
TheRestEnds == /\ pending # "none" /\ Live
               /\ IF pending = "next"
                  THEN /\ item' = item + 1 /\ pending' = "none" /\ UNCHANGED screen
                  ELSE /\ screen' = "end" /\ pending' = "none" /\ UNCHANGED item
               /\ moved' = (moved \/ away \/ paused)
               /\ UNCHANGED <<finished, recorded, begun, quick, paused, away, held, skipped, passedAway, kids>>

\* The player's menu: ⏸, P, Escape or hide pause it: the rest after a picture and চটপট's clock both stop (the code's `frozen` flag is only the bookkeeping for that). blur() also freezes it.
ThePlayerPauses == /\ ~paused /\ paused' = TRUE
                   /\ UNCHANGED <<screen, item, pending, finished, recorded, begun, quick, away, held, skipped, moved, passedAway, kids>>
YouResume == /\ paused /\ paused' = FALSE   \* resume(): the clocks run again after a 0.5 s breath, unless still away
             /\ UNCHANGED <<screen, item, pending, finished, recorded, begun, quick, away, held, skipped, moved, passedAway, kids>>
\* Window blur or tab hide: our own handler stops the clocks even when the player did not pause.
TheWindowLosesFocus == /\ ~away /\ away' = TRUE
                       /\ held' = FALSE
                       /\ UNCHANGED <<screen, item, pending, finished, recorded, begun, quick, paused, skipped, moved, passedAway, kids>>
TheWindowGetsFocusBack == /\ away /\ away' = FALSE
                          /\ UNCHANGED <<screen, item, pending, finished, recorded, begun, quick, paused, held, skipped, moved, passedAway, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title; every timer is cleared.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ pending' = "none" /\ paused' = FALSE
                       /\ UNCHANGED <<item, finished, recorded, begun, quick, away, held, skipped, moved, passedAway, kids>>

\* Enter or Space held through the last answer and auto-repeating on the end screen: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, quick, paused, away, skipped, moved, passedAway, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, quick, paused, away, held, moved, passedAway, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, quick, paused, away, skipped, moved, passedAway, kids>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<round, clocks, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit; both gates closed.
ThePageOpens == /\ screen' = "title" /\ item' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ away' = FALSE /\ held' = FALSE /\ quick' = FALSE
                /\ resting' = overLimit
                /\ UNCHANGED <<begun, skipped, moved, passedAway, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is UltoKhelaGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, clocks>>

Next == YouStartARound \/ YouChooseThePace \/ YouOpenTheLevelList \/ TheMenuOpensTheLevelList \/ YouPickALevel
        \/ YouTapTheRightPicture \/ TheQuickClockPasses \/ TheRestEnds
        \/ ThePlayerPauses \/ YouResume \/ TheWindowLosesFocus \/ TheWindowGetsFocusBack \/ YouGoBackToTheTitle
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ item \in 1..2 /\ pending \in {"none", "next", "end"}
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ quick \in BOOLEAN /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN
          /\ moved \in BOOLEAN /\ passedAway \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* Pictures don't pass, and the next one doesn't come, while you are away or the menu is open (the bug: 37 s away finished the round with 1 star).
NoProgressWhileAway == ~moved /\ ~passedAway
\* Nothing runs under the level list: no rest after a picture is waiting, and চটপট's clock may not run there.
ChoiceFreezesPlay == screen = "levels" => pending = "none"
\* The rest screen comes only between rounds, never over a picture.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last picture is done, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* A key held through the last answer never starts the next round.
ResultNeedsFreshPress == ~skipped
\* The end screen comes only after the last picture.
EndOnlyAfterTheLastPicture == screen = "end" => finished
====
