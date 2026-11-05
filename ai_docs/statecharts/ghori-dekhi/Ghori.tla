---- MODULE Ghori ----
\* ঘড়ি দেখি after the rewrite (2026-11-05): the screens, a round of items (each a clock to set or read), the finger on the clock
\* face and the window focus, ▶ after a right answer, the player's pause, a key held through the last item, the kids' daily limit
\* and rest screen. The parent gates are the same ParentGate as kar-chinho (KarChinhoGates.tla) and are not repeated here.
\* Mirrored from:
\*   tools/ghori-dekhi/lib/session.ts       begin, touch, solve, advance, freshKey, pause, resume, blur, toTitle, openLevels
\*   tools/ghori-dekhi/lib/drag.ts          down, move ("lost" when no button is down), up, drop
\*   tools/ghori-dekhi/components/face.tsx  onDown asks gate(); blur / visibilitychange / the player's pause call stopTurn(); a new item drops the gesture
\*   tools/ghori-dekhi/components/game.tsx  begin() and solved() ask kids.atBreak(); the last ✓ records the stars; keys at the window
\*   shared/kids-kit.tsx                    useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two items stand for six or eight: item 1, then the last item 2. No voice anywhere on the site, so no speech rule.
EXTENDS Naturals
VARIABLES screen, item, solved, finished, recorded, finishes, begun,   \* the round
          grip, finger, focused, followed,                            \* a hand under a finger, and the window
          paused, swallow, held, skipped, moved,                      \* the menu, away and back, keys
          overLimit, resting                                          \* the daily limit
round == <<screen, item, solved, finished, recorded, finishes, begun>>
hand == <<grip, finger, focused, followed>>
away == <<paused, swallow, held, skipped, moved>>
kids == <<overLimit, resting>>
vars == <<round, hand, away, kids>>

RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused

Init == /\ screen = "title" /\ item = 1 /\ solved = FALSE /\ finished = FALSE /\ recorded = FALSE /\ finishes = 0 /\ begun = "inTime"
        /\ grip = FALSE /\ finger = FALSE /\ focused = TRUE /\ followed = FALSE
        /\ paused = FALSE /\ swallow = FALSE /\ held = FALSE /\ skipped = FALSE /\ moved = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit

\* begin(): খেলো, আবার খেলো, Enter on the title. atBreak() first: past the limit, the rest screen instead.
YouStartARound == /\ screen \in {"title", "end"} /\ Free
                  /\ IF overLimit
                     THEN /\ resting' = TRUE /\ UNCHANGED round
                     ELSE /\ screen' = "play" /\ item' = 1 /\ solved' = FALSE /\ finished' = FALSE /\ recorded' = FALSE /\ finishes' = 0
                          /\ resting' = FALSE /\ begun' = "inTime"
                  /\ swallow' = FALSE /\ grip' = FALSE
                  /\ UNCHANGED <<finger, focused, followed, paused, held, skipped, moved, overLimit>>
\* openLevels(): from the title, the end screen, or the player's সব লেভেল mid-round (which leaves the round).
YouOpenTheLevelList == /\ ((screen \in {"title", "end"} /\ Free) \/ (screen = "play" /\ ~RestShows))
                       /\ screen' = "levels" /\ solved' = FALSE /\ grip' = FALSE
                       /\ UNCHANGED <<item, finished, recorded, finishes, begun, finger, focused, followed, away, kids>>
YouPickALevel == /\ screen = "levels" /\ Free
                 /\ IF overLimit
                    THEN /\ resting' = TRUE /\ screen' = "title" /\ UNCHANGED <<item, solved, finished, recorded, finishes, begun>>
                    ELSE /\ screen' = "play" /\ item' = 1 /\ solved' = FALSE /\ finished' = FALSE /\ recorded' = FALSE /\ finishes' = 0
                         /\ resting' = FALSE /\ begun' = "inTime"
                 /\ UNCHANGED <<hand, away, overLimit>>

\* face.tsx onDown(): the game's gate asks touch(). The first tap back from away only wakes the game (swallow); else drag.down().
YouPressTheClock == /\ screen = "play" /\ Free /\ ~solved /\ ~grip /\ focused
                    /\ IF swallow THEN /\ swallow' = FALSE /\ UNCHANGED <<grip, finger>>
                       ELSE /\ grip' = TRUE /\ finger' = TRUE /\ UNCHANGED swallow
                    /\ UNCHANGED <<round, focused, followed, paused, held, skipped, moved, kids>>
\* up(), pointercancel, lostpointercapture: the gesture ends and the hand clicks in.
YouLiftYourFinger == /\ finger /\ focused /\ finger' = FALSE /\ grip' = FALSE
                     /\ UNCHANGED <<round, focused, followed, away, kids>>
\* The button comes up in another window: the page never hears it.
YouLetGoInAnotherWindow == /\ finger /\ ~focused /\ finger' = FALSE
                           /\ UNCHANGED <<round, grip, focused, followed, away, kids>>
\* blur or hide: the player pauses (menu), game.tsx arms the swallow, face.tsx stopTurn() drops the gesture, held keys are dropped.
WindowBlurs == /\ focused /\ focused' = FALSE /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE /\ grip' = FALSE
               /\ UNCHANGED <<round, finger, followed, skipped, moved, kids>>
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<round, grip, finger, followed, away, kids>>
\* A hover over the clock with no button down: drag.move() answers "lost" and drops the gesture; the hand never follows.
TheMouseHovers == /\ screen = "play" /\ Free /\ focused
                  /\ grip' = (grip /\ finger)
                  /\ UNCHANGED <<round, finger, focused, followed, away, kids>>

\* ✓ or a card, right: solve(). On the last item the stars are saved and atBreak() runs in this very tap. The finger is up by then.
YouGetItRight == /\ screen = "play" /\ Free /\ ~solved /\ ~grip
                 /\ IF swallow
                    THEN /\ swallow' = FALSE /\ UNCHANGED <<solved, finished, recorded, resting>>
                    ELSE /\ solved' = TRUE /\ finished' = (item = 2) /\ recorded' = (item = 2)
                         /\ resting' = (IF item = 2 THEN overLimit ELSE resting) /\ UNCHANGED swallow
                 /\ UNCHANGED <<screen, item, finishes, begun, hand, paused, held, skipped, moved, overLimit>>
\* A slip: nothing in the round changes (a wobble, a ring), and the first tap back is used up.
YouSlip == /\ screen = "play" /\ Free /\ ~solved /\ ~grip /\ swallow' = FALSE
           /\ UNCHANGED <<round, hand, paused, held, skipped, moved, kids>>
\* advance(): ▶ by finger, or Enter from a fresh press. The last item's ▶ opens the end screen, once; a new item drops any gesture.
YouPressNext == /\ screen = "play" /\ Free /\ solved
                /\ solved' = FALSE /\ grip' = FALSE
                /\ IF item = 2 THEN /\ screen' = "end" /\ finishes' = finishes + 1 /\ UNCHANGED item
                   ELSE /\ item' = 2 /\ UNCHANGED <<screen, finishes>>
                /\ UNCHANGED <<finished, recorded, begun, finger, focused, followed, away, kids>>

\* The player's menu (⏸, P, Escape): the same as blur for the game.
YouPause == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play") /\ held' = FALSE /\ grip' = FALSE
            /\ UNCHANGED <<round, finger, focused, followed, skipped, moved, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<round, hand, held, skipped, moved, kids>>
\* নতুন করে শুরু, or শেষ on the end screen: back to the title.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ solved' = FALSE /\ grip' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<item, finished, recorded, finishes, begun, finger, focused, followed, held, skipped, moved, kids>>

\* Enter or Space held through the last answer, auto-repeating on ▶ and the end screen: advance() and freshKey() refuse a repeat.
YouHoldEnter == /\ screen = "play" /\ ~paused /\ ~held /\ held' = TRUE
                /\ UNCHANGED <<round, hand, paused, swallow, skipped, moved, kids>>
TheKeyRepeats == /\ held /\ (screen = "end" \/ (screen = "play" /\ solved)) /\ Free
                 /\ skipped' = FALSE
                 /\ UNCHANGED <<round, hand, paused, swallow, held, moved, kids>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE
                    /\ UNCHANGED <<round, hand, paused, swallow, skipped, moved, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<round, hand, away, resting>>
ThePageOpens == /\ screen' = "title" /\ item' = 1 /\ solved' = FALSE /\ finished' = FALSE /\ recorded' = FALSE /\ finishes' = 0
                /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE /\ grip' = FALSE /\ finger' = FALSE /\ focused' = TRUE
                /\ resting' = overLimit
                /\ UNCHANGED <<begun, followed, skipped, moved, overLimit>>
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, hand, away>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouPickALevel \/ YouPressTheClock \/ YouLiftYourFinger \/ YouLetGoInAnotherWindow
        \/ WindowBlurs \/ WindowFocuses \/ TheMouseHovers \/ YouGetItRight \/ YouSlip \/ YouPressNext \/ YouPause \/ YouResume
        \/ YouGoBackToTheTitle \/ YouHoldEnter \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ item \in 1..2 /\ solved \in BOOLEAN /\ finished \in BOOLEAN /\ recorded \in BOOLEAN
          /\ finishes \in 0..2 /\ begun \in {"inTime", "late"}
          /\ grip \in BOOLEAN /\ finger \in BOOLEAN /\ focused \in BOOLEAN /\ followed \in BOOLEAN
          /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ moved \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* A round ends and is recorded once: one win sound, one atBreak, one write of the stars (the old hidden শেষ দেখো button broke it).
NoDoubleResult == finishes <= 1
\* After you switch windows, no finger counts as holding a hand.
InputReleasedWhenAway == ~focused => ~grip
\* A hand moves only while a finger or the mouse button is down on it (the old gesture followed a hover after a lost press).
HandMovesOnlyUnderAFinger == ~followed
\* The rest screen comes only between rounds, never over an item.
RestOnlyAtBreak == RestShows => screen # "play"
NoNewRoundPastLimit == begun = "inTime"
\* Once the last item is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves under the pause menu.
NothingMovesUnderTheMenu == ~moved
\* The level list is a choice screen: no solved item is waiting under it.
ChoiceFreezesPlay == screen = "levels" => ~solved
\* A key held through the last answer never skips ▶ or starts the next round.
ResultNeedsFreshPress == ~skipped
\* A finger never turns a hand on a solved item, and a hand is never held on the end screen.
NothingHeldOffTheClock == grip => (screen = "play" /\ ~solved)
====
