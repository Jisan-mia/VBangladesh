---- MODULE HatDhui ----
\* হাত ধুই, দাঁত মাজি after the rewrite: the screens (title, a round, the end), a round that is a timed routine or the
\* কখন ধোব quiz, the one finish timer (the ring closed, the end screen follows), the player's pause, going away and coming
\* back, a key held through the end, the kids' daily limit and rest screen. The parent gates are HatDhuiGates.tla.
\* Mirrored from (as of 2026-11-05, branch games-to-the-bar):
\*   tools/hat-dhui/lib/session.ts       begin, tapGame, finish, goToEnd, timerFires, pause, resume, blur, toTitle, freshKey, clockMayRun
\*   tools/hat-dhui/lib/run.hot.ts       advance(): the ring's clock, which only the step calls
\*   tools/hat-dhui/components/game.tsx  begin() asks kids.atBreak(); won() saves the stars in the step that wins; armEnd() stamps
\*                                       its timer with the round's serial; clearAll() on begin, restart and unmount; onPause/onResume
\*   tools/hat-dhui/components/routine-view.tsx  the step moves the clock only while clockMayRun(session)
\*   shared/kids-kit.tsx                 useKidsSession rests on mount past the limit; RestScreen is a real modal
\* No voice and no wake-lock rule: speak() is a no-op and the game makes no speech calls; the wake lock follows `!paused && !done`.
EXTENDS Naturals
VARIABLES screen, mode, serial, finished, recorded, pending, pendingFor, endFor, begun,   \* the round
          paused, away, swallow, held, skipped, moved,                                    \* away and back, keys
          overLimit, resting                                                              \* the daily limit
round == <<screen, mode, serial, finished, recorded, pending, pendingFor, endFor, begun>>
hand == <<paused, away, swallow, held, skipped, moved>>
kids == <<overLimit, resting>>
vars == <<round, hand, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ mode = "routine" /\ serial = 0 /\ finished = FALSE /\ recorded = FALSE /\ pending = "none"
        /\ pendingFor = 0 /\ endFor = 0 /\ begun = "inTime"
        /\ paused = FALSE /\ away = "here" /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

\* begin(): ▶ খেলো or আবার খেলো (and Enter). atBreak() first: past the limit, the rest screen instead. A started round drops
\* any older finish timer (clearAll) and gets a new serial.
YouStartARound == /\ screen \in {"title", "end"} /\ Free /\ serial < 2
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED <<screen, mode, serial, finished, recorded, pending, pendingFor, endFor, begun>>
                     ELSE /\ \E m \in {"routine", "quiz"} : mode' = m
                          /\ screen' = "play" /\ serial' = serial + 1 /\ finished' = FALSE /\ recorded' = FALSE
                          /\ pending' = "none" /\ pendingFor' = 0 /\ endFor' = 0 /\ resting' = FALSE
                          /\ begun' = (IF overLimit THEN "late" ELSE "inTime")
                  /\ swallow' = FALSE
                  /\ UNCHANGED <<paused, away, held, skipped, moved, overLimit>>

\* The routine's step: advance() moves the ring only when clockMayRun(): play screen, menu shut, window here, not finished.
\* When the ring closes, won() runs in this very step: the stars are saved and atBreak() runs, then the 1 s timer is armed.
TheRingCloses == /\ screen = "play" /\ mode = "routine" /\ ~finished /\ ~paused /\ away = "here"
                 /\ finished' = TRUE /\ recorded' = TRUE /\ resting' = overLimit
                 /\ pending' = "end" /\ pendingFor' = serial
                 /\ moved' = (moved \/ paused \/ away # "here")
                 /\ UNCHANGED <<screen, mode, serial, endFor, begun, paused, away, swallow, held, skipped, overLimit>>
\* The quiz: the last right card is won() at this tap (stars saved, atBreak()). The first tap back from away only wakes the game.
YouPickTheLastCard == /\ screen = "play" /\ mode = "quiz" /\ ~finished /\ Free /\ away = "here"
                      /\ IF swallow
                         THEN /\ swallow' = FALSE /\ UNCHANGED <<finished, recorded, resting>>
                         ELSE /\ finished' = TRUE /\ recorded' = TRUE /\ resting' = overLimit /\ UNCHANGED swallow
                      /\ UNCHANGED <<screen, mode, serial, pending, pendingFor, endFor, begun, paused, away, held, skipped, moved, overLimit>>
\* → after the last right card: goToEnd(). The quiz has no timer.
YouPressTheArrow == /\ screen = "play" /\ mode = "quiz" /\ finished /\ Free /\ away = "here"
                    /\ screen' = "end" /\ endFor' = serial
                    /\ UNCHANGED <<mode, serial, finished, recorded, pending, pendingFor, begun, hand, kids>>
\* timerFires() runs only when timerMayRun() (menu shut) and only for the serial that armed it.
TheEndScreenComes == /\ pending = "end" /\ ~paused /\ pendingFor = serial
                     /\ screen' = "end" /\ endFor' = serial /\ pending' = "none"
                     /\ moved' = (moved \/ paused)
                     /\ UNCHANGED <<mode, serial, finished, recorded, pendingFor, begun, paused, away, swallow, held, skipped, kids>>

\* The player's menu (⏸, P, Escape, blur or hide): the timer freezes; the first tap back only wakes the game.
YouOpenTheMenu == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
                  /\ UNCHANGED <<round, away, skipped, moved, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, away, held, skipped, moved, kids>>
\* Window blur or tab hide (one state, "away"), even without the menu (not engaged yet): the loop stops by itself, the game arms the swallow.
WindowBlurs == /\ away = "here" /\ away' = "away" /\ swallow' = (screen = "play") /\ held' = FALSE
               /\ UNCHANGED <<round, paused, skipped, moved, kids>>
WindowComesBack == /\ away = "away" /\ away' = "here" /\ UNCHANGED <<round, paused, swallow, held, skipped, moved, kids>>
\* নতুন করে শুরু or সব লেভেল from the menu, or শেষ on the end screen: back to the title; toTitle() clears the timer.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ pending' = "none" /\ pendingFor' = 0 /\ finished' = FALSE
                       /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<mode, serial, recorded, endFor, begun, away, held, skipped, moved, kids>>

\* Enter or Space held through the end of a round and auto-repeating on the end screen: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, away, swallow, skipped, moved, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, away, swallow, held, moved, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, away, swallow, skipped, moved, kids>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<round, hand, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit.
ThePageOpens == /\ screen' = "title" /\ pending' = "none" /\ pendingFor' = 0 /\ finished' = FALSE /\ endFor' = 0
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE /\ away' = "here"
                /\ resting' = overLimit
                /\ UNCHANGED <<mode, serial, recorded, begun, skipped, moved, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is HatDhuiGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, hand>>

Next == YouStartARound \/ TheRingCloses \/ YouPickTheLastCard \/ YouPressTheArrow \/ TheEndScreenComes
        \/ YouOpenTheMenu \/ YouResume \/ WindowBlurs \/ WindowComesBack \/ YouGoBackToTheTitle
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end"} /\ mode \in {"routine", "quiz"} /\ serial \in 0..2
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ pending \in {"none", "end"} /\ pendingFor \in 0..2 /\ endFor \in 0..2
          /\ begun \in {"inTime", "late"} /\ paused \in BOOLEAN /\ away \in {"here", "away"}
          /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a wash, a brush or a card.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the ring closes (or the last card is right) its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* The done screen is for the round you just finished, never a stale timer's.
ResultMatchesPlay == screen = "end" => (endFor = serial /\ recorded)
\* The ring and the timers do not move under the pause menu, and the ring does not fill while the window is away.
NothingMovesUnderTheMenu == ~moved
\* A key held through the end never starts the next round.
ResultNeedsFreshPress == ~skipped
\* No round ends twice: the finish timer exists only for a finished round that is still on screen.
NoStaleTimer == pending = "end" => (finished /\ pendingFor = serial /\ screen = "play")
====
