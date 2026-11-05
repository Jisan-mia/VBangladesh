---- MODULE Nouka ----
\* দশ ঘাটের নৌকা after the rewrite: the screens, one race (the চরকি, counting ghats, the arrival, the finish), the player's
\* pause, going away and coming back, the mode chips on the title, the share gate, a key held through the end, and the
\* kids' daily limit and rest screen. Mirrored from:
\*   tools/dosh-ghater-nouka/lib/session.ts      begin, chooseMode, touch, arrived, cardShows, pause, resume, blur, toTitle,
\*                                               openLevels, freshKey
\*   tools/dosh-ghater-nouka/lib/sim.ts          spinNow, tap, hop; lib/clock.hot.ts advance (the only clock)
\*   tools/dosh-ghater-nouka/components/game.tsx begin() asks kids.atBreak(); drain() records the stars at EV.ARRIVED;
\*                                               the loop's step skips advance() while the menu is open
\*   shared/kids-kit.tsx                         useKidsSession rests on mount past the limit; ParentGate; RestScreen
\* A turn is abstracted to "spin, then count"; আব্বু's boat and the child's own predict-mode boat move in the same advance()
\* call as the চরকি, so one guard (the loop runs, the menu is shut) covers them all. There are no timers and no voice.
EXTENDS Naturals
VARIABLES screen, spin, over, recorded, fresh,           \* the race
          paused, away, swallow, moved, held, skipped,   \* away and back, keys
          mode, modeAtStart, stage,                      \* the title's mode chips and the share gate
          overLimit, resting, begun                      \* the daily limit
race == <<screen, spin, over, recorded, fresh>>
hand == <<paused, away, swallow, moved, held, skipped>>
title == <<mode, modeAtStart, stage>>
kids == <<overLimit, resting, begun>>
vars == <<race, hand, title, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== "play") and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ spin = "none" /\ over = FALSE /\ recorded = FALSE /\ fresh = FALSE
        /\ paused = FALSE /\ away = FALSE /\ swallow = FALSE /\ moved = FALSE /\ held = FALSE /\ skipped = FALSE
        /\ mode \in {"phone", "duo"} /\ modeAtStart = mode /\ stage = "closed"
        /\ overLimit \in BOOLEAN /\ resting = overLimit /\ begun = "inTime"

\* begin(): খেলো, আবার খেলো, Enter on the title, or a level from the list. atBreak() first: past the limit the rest screen
\* shows and nothing starts. A new race is a new Race object: no spin, no counted ghat, nothing carried over.
StartedRace == /\ screen' = "play" /\ spin' = "none" /\ over' = FALSE /\ recorded' = FALSE /\ fresh' = TRUE
               /\ modeAtStart' = mode /\ stage' = "closed" /\ resting' = FALSE /\ begun' = (IF overLimit THEN "late" ELSE "inTime")
YouStartARace == /\ screen \in {"title", "end"} /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ UNCHANGED <<screen, spin, over, recorded, fresh, modeAtStart, stage, begun>>
                    ELSE StartedRace
                 /\ swallow' = FALSE
                 /\ UNCHANGED <<paused, away, moved, held, skipped, mode, overLimit>>
\* The level list opens from the title or the end page only; the title unmounts, and its gate with it.
YouOpenTheLevelList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels" /\ stage' = "closed"
                       /\ UNCHANGED <<spin, over, recorded, fresh, hand, mode, modeAtStart, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<spin, over, recorded, fresh, modeAtStart, stage, begun>>
                    ELSE StartedRace
                 /\ swallow' = FALSE
                 /\ UNCHANGED <<paused, away, moved, held, skipped, mode, overLimit>>

\* ---- the race ----
\* touch(): only on the play screen, nothing covering it; the first tap after coming back only wakes the game.
YouPressTheSpinner == /\ screen = "play" /\ Free /\ ~away /\ ~over /\ spin = "none"
                      /\ IF swallow
                         THEN /\ swallow' = FALSE /\ UNCHANGED <<spin, fresh>>
                         ELSE /\ spin' = "turning" /\ fresh' = FALSE /\ UNCHANGED swallow
                      /\ UNCHANGED <<screen, over, recorded, paused, away, moved, held, skipped, title, kids>>
\* advance() lands the চরকি: it runs only while the page's loop runs (no blur, no hide) and the menu is shut.
\* `moved` would record a boat or চরকি that moved while the page was away or under the menu.
TheSpinnerLands == /\ spin = "turning" /\ ~away /\ ~paused
                   /\ spin' = "landed" /\ moved' = (moved \/ away \/ paused)
                   /\ UNCHANGED <<screen, over, recorded, fresh, paused, away, swallow, held, skipped, title, kids>>
YouTapAWrongGhat == /\ screen = "play" /\ Free /\ ~away /\ ~over /\ spin = "landed"
                    /\ swallow' = FALSE
                    /\ UNCHANGED <<screen, spin, over, recorded, fresh, paused, away, moved, held, skipped, title, kids>>
\* The right ghat: the turn ends, or the boat reaches the last ghat. Then arrived() runs in the same tap:
\* the stars are saved and atBreak() checked now, whatever the hand does next.
YouTapTheRightGhat == /\ screen = "play" /\ Free /\ ~away /\ ~over /\ spin = "landed"
                      /\ IF swallow
                         THEN /\ swallow' = FALSE /\ UNCHANGED <<spin, over, recorded, resting>>
                         ELSE /\ spin' = "none" /\ UNCHANGED swallow
                              /\ \/ UNCHANGED <<over, recorded, resting>>
                                 \/ /\ over' = TRUE /\ recorded' = TRUE /\ resting' = overLimit
                      /\ UNCHANGED <<screen, fresh, paused, away, moved, held, skipped, title, begun, overLimit>>
\* 1.3 s of finishing, counted by the same clock; then the end page.
TheEndPageComes == /\ screen = "play" /\ over /\ ~away /\ ~paused
                   /\ screen' = "end" /\ moved' = (moved \/ away \/ paused)
                   /\ UNCHANGED <<spin, over, recorded, fresh, paused, away, swallow, held, skipped, title, kids>>

\* ---- away and back ----
\* The player's menu (⏸, P, Escape) or a window blur (which opens the menu): the loop stops, held keys are dropped, and
\* the first tap back is swallowed unless the menu takes it.
YouOpenTheMenu == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
                  /\ UNCHANGED <<race, away, moved, skipped, title, kids>>
YouLeave == /\ ~away /\ away' = TRUE /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE
            /\ UNCHANGED <<race, moved, skipped, title, kids>>
\* A window focus restarts the loop, but a menu still open keeps advance() from being called.
YouComeBack == /\ away /\ away' = FALSE /\ UNCHANGED <<race, paused, swallow, moved, held, skipped, title, kids>>
YouResume == /\ paused /\ ~away /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<race, away, moved, held, skipped, title, kids>>
\* নতুন করে শুরু, সব লেভেল from the menu, or শেষ on the end page: back to the title with a clean race.
YouGoBackToTheTitle == /\ ~away /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ spin' = "none" /\ stage' = "closed" /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<over, recorded, fresh, away, moved, held, skipped, mode, modeAtStart, kids>>

\* ---- the title ----
\* The mode chips live on the title only. A tap on the mode already on changes nothing, and no chip exists in a race.
YouTapTheOtherMode == /\ screen = "title" /\ Free /\ mode' = (IF mode = "phone" THEN "duo" ELSE "phone")
                      /\ UNCHANGED <<race, hand, modeAtStart, stage, kids>>
\* Hold বড়দের জন্য 2 s and answer the sum: ShareToolLink shows on the title. It closes after one use, 20 s, a hidden tab, a
\* tap anywhere else in the game, the level list, and the start of a race (the title unmounts).
AGrownUpOpensTheGate == /\ screen = "title" /\ Free /\ stage = "closed" /\ stage' = "open"
                        /\ UNCHANGED <<race, hand, mode, modeAtStart, kids>>
TheGateCloses == /\ stage = "open" /\ stage' = "closed" /\ UNCHANGED <<race, hand, mode, modeAtStart, kids>>

\* ---- keys ----
\* Enter or Space held through the finish and auto-repeating on the end page: freshKey() refuses a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<race, paused, away, swallow, moved, skipped, title, kids>>
TheKeyRepeats == /\ held /\ screen = "end" /\ Free /\ skipped' = FALSE
                 /\ UNCHANGED <<race, paused, away, swallow, moved, held, title, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE /\ UNCHANGED <<race, paused, away, swallow, moved, skipped, title, kids>>

\* ---- the daily limit ----
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<race, hand, title, resting, begun>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit, a clean race, the gate shut.
ThePageOpens == /\ screen' = "title" /\ spin' = "none" /\ over' = FALSE /\ recorded' = FALSE /\ fresh' = FALSE
                /\ paused' = FALSE /\ away' = FALSE /\ swallow' = FALSE /\ held' = FALSE /\ stage' = "closed"
                /\ resting' = overLimit
                /\ UNCHANGED <<moved, skipped, mode, modeAtStart, overLimit, begun>>
\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is the kit's ParentGate).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<race, hand, title, begun>>

Next == YouStartARace \/ YouOpenTheLevelList \/ YouPickALevel \/ YouPressTheSpinner \/ TheSpinnerLands
        \/ YouTapAWrongGhat \/ YouTapTheRightGhat \/ TheEndPageComes
        \/ YouOpenTheMenu \/ YouLeave \/ YouComeBack \/ YouResume \/ YouGoBackToTheTitle
        \/ YouTapTheOtherMode \/ AGrownUpOpensTheGate \/ TheGateCloses
        \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ spin \in {"none", "turning", "landed"}
          /\ over \in BOOLEAN /\ recorded \in BOOLEAN /\ fresh \in BOOLEAN
          /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ swallow \in BOOLEAN /\ moved \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN
          /\ mode \in {"phone", "duo"} /\ modeAtStart \in {"phone", "duo"} /\ stage \in {"closed", "open"}
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ begun \in {"inTime", "late"}

\* ---- the reader's rules ----
\* A new race starts with no spin and nothing counted; only your own press turns the চরকি.
FreshRaceStartsClean == fresh => (spin = "none" /\ ~over)
\* A race your boat finished is recorded, and the daily break is checked, in the moment it arrives.
EveryFinishedRaceCounts == over => recorded
\* Nothing moves while you are away or under the menu: not the চরকি, not either boat.
NothingMovesWhileAway == ~moved
\* The mode chips exist on the title only, so the mode never changes in a race (and a tap on the current mode does nothing).
ModeNeverChangesInARace == screen = "play" => mode = modeAtStart
\* The share link is on the title and nowhere else: never in front of a race or the end page.
ShareLinkOnlyOnTheTitle == stage = "open" => screen = "title"
\* The rest screen comes only between races: if the limit passes mid-race it waits for the end page.
RestOnlyAtBreak == (resting /\ screen = "play") => over
\* Once today's time is up, no new race starts without the rest screen first.
NoNewRaceAfterTimeIsUp == begun = "inTime"
\* The level list is a choice screen: nothing is turning under it.
ChoiceFreezesPlay == screen = "levels" => spin = "none"
\* A key held through the finish never starts the next race.
ResultNeedsFreshPress == ~skipped
====
