---- MODULE KarChinho ----
\* কার-চিহ্ন বসাও after the rewrite: the screens, the round of words, the one pending timer (next word / end screen),
\* the player's pause, going away and coming back, a key held through the last word, the kids' daily limit and rest
\* screen. The parent gates are KarChinhoGates.tla. Mirrored from:
\*   tools/kar-chinho/lib/session.ts     begin, tapTile, solved, timerFires/timerMayRun, pause, resume, blur, toTitle,
\*                                       openLevels, freshKey
\*   tools/kar-chinho/components/game.tsx begin() asks kids.atBreak(); pick() records the stars at the last tap; the
\*                                       share gate's key is bumped by any touch outside it; onPause/onResume/onRestart
\*   shared/kids-kit.tsx                 useKidsSession rests on mount past the limit; ParentGate: a two-digit sum, one
\*                                       action, 20 s; RestScreen is a real modal
\* Two words stand in for ten. "holder" is who has the phone. A child's hold and mashing never opens a gate.
\* No voice anywhere on the site (speak() is a no-op), so the old SilentWhenMuted rule has nothing left to check.
EXTENDS Naturals
VARIABLES screen, word, pending, finished, recorded, begun,      \* the round
          paused, swallow, held, skipped, moved,                 \* away and back, keys
          overLimit, resting                                     \* the daily limit
round == <<screen, word, pending, finished, recorded, begun>>
away == <<paused, swallow, held, skipped, moved>>
kids == <<overLimit, resting>>
vars == <<round, away, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ word = 1 /\ pending = "none" /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting


\* begin(): খেলো on the slate, আবার খেলো, Enter on the title. atBreak() first: past the limit, the rest screen instead.
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED round
                     ELSE /\ screen' = "play" /\ word' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
                          /\ resting' = FALSE /\ begun' = (IF overLimit THEN "late" ELSE "inTime")
                  /\ swallow' = FALSE
                  /\ UNCHANGED <<paused, held, skipped, moved, overLimit>>
\* The level list opens from the title or the end screen only; a level from it is begin() too.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels"
                       /\ UNCHANGED <<word, pending, finished, recorded, begun, away, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<word, pending, finished, recorded, begun>>
                    ELSE /\ screen' = "play" /\ word' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
                         /\ resting' = FALSE /\ begun' = "inTime"
                 /\ UNCHANGED <<away, overLimit>>

\* tapTile(): only on play, nothing covering it, no word mid-hop; the first tap after coming back only wakes the game.
YouTapAWrongSign == /\ screen = "play" /\ Free /\ pending = "none"
                    /\ swallow' = FALSE
                    /\ UNCHANGED <<round, paused, held, skipped, moved, kids>>
\* The right sign: solved(). On the last word the stars are saved and atBreak() runs in this very tap.
YouTapTheRightSign == /\ screen = "play" /\ Free /\ pending = "none"
                      /\ IF swallow
                         THEN /\ swallow' = FALSE /\ UNCHANGED <<pending, finished, recorded, resting>>
                         ELSE /\ pending' = (IF word = 2 THEN "end" ELSE "next")
                              /\ finished' = (word = 2) /\ recorded' = (word = 2)
                              /\ resting' = (IF word = 2 THEN overLimit ELSE resting)
                              /\ UNCHANGED swallow
                      /\ UNCHANGED <<screen, word, begun, paused, held, skipped, moved, overLimit>>
\* timerFires() runs only when timerMayRun(): the menu shut. `moved` would record a step taken under the menu.
TheNextWordComes == /\ pending = "next" /\ ~paused
                    /\ pending' = "none" /\ word' = 2 /\ moved' = (moved \/ paused)
                    /\ UNCHANGED <<screen, finished, recorded, begun, paused, swallow, held, skipped, kids>>
TheEndScreenComes == /\ pending = "end" /\ ~paused
                     /\ pending' = "none" /\ screen' = "end" /\ moved' = (moved \/ paused)
                     /\ UNCHANGED <<word, finished, recorded, begun, paused, swallow, held, skipped, kids>>

\* The player's menu: ⏸, P, Escape, blur or hide (the game's blur handler arms the swallow; held keys are dropped).
YouGoAway == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
             /\ UNCHANGED <<round, skipped, moved, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, held, skipped, moved, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the slate; the pending timer is cleared.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ pending' = "none" /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<word, finished, recorded, begun, held, skipped, moved, kids>>

\* Enter or Space held through the last word and auto-repeating on the end screen: freshKey() refuses a repeat.
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
ThePageOpens == /\ screen' = "title" /\ word' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE
                /\ resting' = overLimit
                /\ UNCHANGED <<begun, skipped, moved, overLimit>>

\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is KarChinhoGates.tla's job).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, away>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouPickALevel \/ YouTapAWrongSign \/ YouTapTheRightSign
        \/ TheNextWordComes \/ TheEndScreenComes \/ YouGoAway \/ YouResume \/ YouGoBackToTheTitle
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens
        \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ word \in 1..2 /\ pending \in {"none", "next", "end"}
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between rounds, never over a word.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last word is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* The level list is a choice screen: no word is waiting under it.
ChoiceFreezesPlay == screen = "levels" => pending = "none"
\* A key held through the last word never starts the next round.
ResultNeedsFreshPress == ~skipped
====
