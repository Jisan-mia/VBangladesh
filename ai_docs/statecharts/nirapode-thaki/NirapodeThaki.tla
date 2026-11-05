---- MODULE NirapodeThaki ----
\* নিরাপদে থাকি after the rewrite: the screens, the round of questions, the answer that waits for ➜, the player's pause,
\* going away and coming back, a key held through an answer, and the kids' daily limit with its rest screen. The pace that
\* carries from round to round is NirapodeThakiPace.tla, the parent gates NirapodeThakiGates.tla. Mirrored from:
\*   tools/nirapode-thaki/lib/session.ts    begin, tapTile, solved, advance, pause, resume, blur, toTitle, openLevels, freshNext, freshKey
\*   tools/nirapode-thaki/lib/play.ts       answer (first-tap right or not), nextPace, createRound(…, pace)
\*   tools/nirapode-thaki/components/game.tsx  begin() asks kids.atBreak() and keeps roundRef.current.pace; pick() records the
\*                                          stars at the last right tap; onward() is ➜; onPause/onResume/onRestart
\*   shared/kids-kit.tsx                    useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two questions stand for five.
\* No voice anywhere on the site (speak() is a no-op), so the old SilentWhenMuted rule has nothing left to check.
EXTENDS Naturals
VARIABLES screen, back, q, answered, tried, finished, recorded, begun,   \* the round
          paused, swallow, held, skipped, moved, lost,                  \* away and back, keys
          overLimit, resting                                            \* the daily limit
round == <<screen, back, q, answered, tried, finished, recorded, begun>>
away == <<paused, swallow, held, skipped, moved, lost>>
kids == <<overLimit, resting>>
vars == <<round, away, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ back = "title" /\ q = 1 /\ answered = FALSE /\ tried = FALSE /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE /\ lost = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

\* begin(): খেলো on the postcard, আবার খেলো, a level from the list. atBreak() first: past the limit, the rest screen instead.
StartRound == /\ q' = 1 /\ answered' = FALSE /\ tried' = FALSE /\ finished' = FALSE /\ recorded' = FALSE /\ screen' = "play"
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED <<screen, q, answered, tried, finished, recorded>>
                     ELSE /\ StartRound /\ resting' = FALSE
                  /\ UNCHANGED <<back, begun, paused, held, skipped, moved, lost, overLimit>> /\ swallow' = FALSE
\* The level list opens from the title or the end screen only, never over a question; `back` remembers which.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels" /\ back' = screen
                       /\ UNCHANGED <<q, answered, tried, finished, recorded, begun, away, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<q, answered, tried, finished, recorded>>
                    ELSE /\ StartRound /\ resting' = FALSE
                 \* lost: a round in progress thrown away by a tap on the scene picture (back = "play" is impossible in the code).
                 /\ lost' = (lost \/ (~overLimit /\ back = "play"))
                 /\ UNCHANGED <<back, begun, paused, swallow, held, skipped, moved, overLimit>>

\* tapTile(): only on play, nothing covering it, no answer already showing; the first tap after coming back only wakes the game.
YouTapAWrongPicture == /\ screen = "play" /\ Free /\ ~answered
                       /\ IF swallow THEN /\ swallow' = FALSE /\ UNCHANGED tried ELSE /\ tried' = TRUE /\ UNCHANGED swallow
                       /\ UNCHANGED <<screen, back, q, answered, finished, recorded, begun, paused, held, skipped, moved, lost, kids>>
\* The safe picture: solved(). On the last question the stars are saved and atBreak() runs in this very tap.
\* answer(): a right tap with no wrong one before it is "first try", and nextPace() counts it.
YouTapTheSafePicture == /\ screen = "play" /\ Free /\ ~answered
                        /\ IF swallow
                           THEN /\ swallow' = FALSE /\ UNCHANGED <<answered, finished, recorded, resting>>
                           ELSE /\ answered' = TRUE
                                /\ finished' = (q = 2) /\ recorded' = (q = 2)
                                /\ resting' = (IF q = 2 THEN overLimit ELSE resting)
                                /\ UNCHANGED swallow
                        /\ UNCHANGED <<screen, back, q, tried, begun, paused, held, skipped, moved, lost, overLimit>>
\* ➜ (advance()): only with an answer showing and the menu shut. The next question, or the end screen after the last.
\* `moved` would record a step taken under the menu.
YouTapNext == /\ screen = "play" /\ answered /\ ~paused
              /\ answered' = FALSE /\ tried' = FALSE /\ moved' = (moved \/ paused)
              /\ IF q = 2 THEN screen' = "end" /\ UNCHANGED q ELSE q' = 2 /\ UNCHANGED screen
              /\ UNCHANGED <<back, finished, recorded, begun, paused, swallow, held, skipped, lost, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide (the game's blur handler arms the swallow while a question is open; held keys drop).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play" /\ ~answered) /\ held' = FALSE
             /\ UNCHANGED <<round, skipped, moved, lost, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, lost, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title (toTitle()).
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ answered' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<back, q, tried, finished, recorded, begun, held, skipped, moved, lost, kids>>

\* Enter or Space held through an answer and auto-repeating: freshNext()/freshKey() refuse a repeat or a keydown from before.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, paused, swallow, skipped, moved, lost, kids>>
TheKeyRepeats == /\ held /\ (screen = "end" \/ (screen = "play" /\ answered)) /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, paused, swallow, held, moved, lost, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, paused, swallow, skipped, moved, lost, kids>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<round, away, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit (a new page has a fresh pace).
ThePageOpens == /\ screen' = "title" /\ back' = "title" /\ q' = 1 /\ answered' = FALSE /\ tried' = FALSE /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE
                /\ resting' = overLimit
                /\ UNCHANGED <<begun, skipped, moved, lost, overLimit>>

\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is NirapodeThakiGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, away>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouPickALevel \/ YouTapAWrongPicture \/ YouTapTheSafePicture \/ YouTapNext
        \/ YouGoAway \/ YouResume \/ YouGoBackToTheTitle \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "end", "play"} /\ q \in 1..2
          /\ answered \in BOOLEAN /\ tried \in BOOLEAN /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN /\ lost \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a question.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last question is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves on under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* The level list is a choice screen: opened only from the title or the end screen, so no question waits under it.
ChoiceFreezesPlay == screen = "levels" => back # "play" /\ ~answered
\* Bug 2: a round in progress is never thrown away by a tap on a scene picture.
SceneTileKeepsRound == ~lost
\* A key held through an answer or the end screen never moves on.
ResultNeedsFreshPress == ~skipped
====
