---- MODULE Daripalla ----
\* দাঁড়িপাল্লা (kids, 6–11) after the rewrite of 2026-11-05. Mirrored from:
\*   tools/daripalla/lib/session.ts      (screens, begin, touch, moved, won, cardShows, pause/resume, blur/focus, the level list's ask)
\*   tools/daripalla/lib/sim.ts          (put, choose, next: the pan's stage, the hold, the pace)
\*   tools/daripalla/lib/clock.hot.ts    (the hold, the question's wait and the end page's wait, all on the fixed-step clock)
\*   tools/daripalla/components/game.tsx (drain: EV.WON records the stars and calls atBreak() at once; useGameLoop; useGamePlayer)
\*   shared/kids-kit.tsx                 (useKidsSession: atBreak, the past-the-limit mount check, extend; RestScreen)
\* Abstractions: a level is only its kind, "fill" (৪ + ? = ৭: level pan = pan done) or "find" (level pan, then choose the
\* fruit's weight); 2 pans a round (the code has 5); stars 3 for a clean round, 1 otherwise. The pause menu's সব লেভেল opens
\* the list from a round (back = "play"). The clock advances only on the fixed-step loop, which stops on blur, hide and the
\* pause menu, so every "time passes" action below is guarded by "not away, not paused".
EXTENDS Naturals
VARIABLES screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, away,
          resting, over, restSeen, best, sent, wrote
vars == <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>

Kinds == {"fill", "find"}
PUZZLES == 2
Max(a, b) == IF a >= b THEN a ELSE b
Earned == IF missed THEN 1 ELSE 3
Progress == {"stars", "playtime", "limit"}
LastLevel == screen = "play" /\ stage = "done" /\ idx = PUZZLES   \* the last pan is level: the round is won, the end page waits

Init == /\ screen = "title" /\ back = "title" /\ kind = "fill" /\ idx = 1 /\ stage = "balance" /\ ready = FALSE /\ missed = FALSE /\ dirty = FALSE
        /\ ask = "none" /\ recorded = 0 /\ paused = FALSE /\ away = FALSE /\ resting = FALSE /\ over = FALSE /\ restSeen = FALSE
        /\ best = 0 /\ sent = FALSE /\ wrote = {}

\* A tap or key counts only on a screen the child can reach: not away, not under the menu, not under the rest screen.
Touchable == ~away /\ ~paused /\ ~(resting /\ screen # "play")
Clock == screen = "play" /\ ~paused /\ ~away      \* clockMayRun(), and the loop itself has stopped on blur

\* begin(id, over): খেলো, আবার খেলো or a level. Opening a round is a break too: past the limit the rest screen shows instead.
Begin(k) == IF over
            THEN /\ resting' = TRUE /\ restSeen' = TRUE /\ ask' = "none"
                 /\ UNCHANGED <<screen, kind, idx, stage, ready, missed, dirty, recorded>>
            ELSE /\ screen' = "play" /\ kind' = k /\ idx' = 1 /\ stage' = "balance" /\ ready' = FALSE /\ missed' = FALSE /\ dirty' = FALSE
                 /\ recorded' = 0 /\ ask' = "none"  /\ resting' = FALSE
                 /\ UNCHANGED restSeen
\* The pan is done at a press. If it is the last one the round is won at this very moment: stars saved, atBreak() asked.
Win == /\ best' = Max(best, Earned) /\ recorded' = recorded + 1 /\ resting' = over
       /\ restSeen' = (restSeen \/ over) /\ wrote' = wrote \cup {"stars"} /\ dirty' = FALSE

YouStart == /\ screen = "title" /\ Touchable /\ Begin(kind)
            /\ UNCHANGED <<back, away, paused, best, sent, wrote, over>>
\* A weight tapped (pointerdown): a piece too few, one too many (a miss on a fill pan), or the one that levels the pan.
YouPutOnAPiece == /\ screen = "play" /\ stage = "balance" /\ Touchable
                  /\ \/ /\ stage' = "balance" /\ missed' \in {missed, kind = "fill" \/ missed} /\ dirty' = TRUE
                        /\ UNCHANGED <<idx, ready, recorded, resting, restSeen, best, wrote>>
                     \/ /\ kind = "fill" /\ idx < PUZZLES /\ stage' = "done" /\ ready' = FALSE /\ missed' = missed /\ dirty' = TRUE
                        /\ UNCHANGED <<idx, recorded, resting, restSeen, best, wrote>>
                     \/ /\ kind = "fill" /\ idx = PUZZLES /\ stage' = "done" /\ ready' = FALSE /\ missed' = missed /\ Win
                        /\ UNCHANGED <<idx>>
                     \/ /\ kind = "find" /\ stage' = "ask" /\ ready' = FALSE /\ missed' = missed /\ dirty' = TRUE
                        /\ UNCHANGED <<idx, recorded, resting, restSeen, best, wrote>>
                  /\ UNCHANGED <<screen, back, kind, ask, paused, away, over, sent>>
\* The question's numbers show after a short wait on the clock, so the level pan is seen first.
TheQuestionAppears == /\ Clock /\ stage = "ask" /\ ~ready /\ ready' = TRUE
                      /\ UNCHANGED <<screen, back, kind, idx, stage, missed, dirty, ask, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
\* A number tapped: the right one finishes the pan (the last pan wins the round), a wrong one is a miss.
YouChooseAWeight == /\ screen = "play" /\ stage = "ask" /\ ready /\ Touchable
                    /\ \/ /\ idx < PUZZLES /\ stage' = "done" /\ ready' = FALSE /\ missed' = missed /\ dirty' = TRUE
                          /\ UNCHANGED <<idx, recorded, resting, restSeen, best, wrote>>
                       \/ /\ idx = PUZZLES /\ stage' = "done" /\ ready' = FALSE /\ missed' = missed /\ Win /\ UNCHANGED <<idx>>
                       \/ /\ stage' = "ask" /\ missed' = TRUE /\ ~missed /\ dirty' = TRUE
                          /\ UNCHANGED <<idx, ready, recorded, resting, restSeen, best, wrote>>
                    /\ UNCHANGED <<screen, back, kind, ask, paused, away, over, sent>>
\* The level pan holds for 900 ms on the clock, then পরের পাল্লা appears (not on the last pan).
TheHoldPasses == /\ Clock /\ stage = "done" /\ idx < PUZZLES /\ ~ready /\ ready' = TRUE
                 /\ UNCHANGED <<screen, back, kind, idx, stage, missed, dirty, ask, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
\* পরের পাল্লা exists only once the hold has passed, so no tap on a weight can ever press it.
YouPressNextPan == /\ screen = "play" /\ stage = "done" /\ idx < PUZZLES /\ ready /\ Touchable
                   /\ idx' = idx + 1 /\ stage' = "balance" /\ ready' = FALSE
                   /\ UNCHANGED <<screen, back, kind, missed, dirty, ask, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
\* The last pan's wait is over (the clock): the end page, the star chimes. Nothing to record: it was recorded at the win.
TheEndPageComes == /\ Clock /\ LastLevel /\ screen' = "end"
                   /\ UNCHANGED <<back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
YouPressPlayAgain == /\ screen = "end" /\ Touchable /\ Begin(kind)
                     /\ UNCHANGED <<back, away, paused, best, sent, wrote, over>>
\* শেষ: the title, with the next level ready (a level's kind is only chosen from the list here).
YouPressDone == /\ screen = "end" /\ Touchable /\ screen' = "title" /\ kind' = kind /\ recorded' = 0   \* "no round on screen": the next begin() starts a new serial
                /\ UNCHANGED <<back, idx, stage, ready, missed, dirty, ask, paused, away, resting, over, restSeen, best, sent, wrote>>
\* The level list: from the title, the end page, or (the pause menu's সব লেভেল) a round. Nothing runs under it.
YouOpenLevels == /\ screen \in {"title", "end", "play"} /\ ~away /\ ~(resting /\ screen # "play") /\ back' = screen /\ screen' = "levels" /\ ask' = "none"
                 /\ UNCHANGED <<kind, idx, stage, ready, missed, dirty, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
YouCloseLevels == /\ screen = "levels" /\ Touchable /\ screen' = back /\ ask' = "none"
                  /\ UNCHANGED <<back, kind, idx, stage, ready, missed, dirty, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
\* A level card. Mid-round it asks first (the two picture buttons); otherwise it starts.
YouPickALevel == /\ screen = "levels" /\ Touchable /\ \E k \in Kinds :
                    IF back = "play" /\ dirty
                    THEN /\ ask' = k /\ UNCHANGED <<screen, kind, idx, stage, ready, missed, dirty, recorded, resting, restSeen>>
                    ELSE Begin(k)
                 /\ UNCHANGED <<back, away, paused, best, sent, wrote, over>>
YouStay == /\ screen = "levels" /\ ask # "none" /\ Touchable /\ ask' = "none"
           /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, recorded, paused, away, resting, over, restSeen, best, sent, wrote>>
YouLeaveTheRound == /\ screen = "levels" /\ ask # "none" /\ Touchable /\ Begin(ask)
                    /\ UNCHANGED <<back, away, paused, best, sent, wrote, over>>
TheMenuOpens == /\ ~paused /\ paused' = TRUE
                /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, away, resting, over, restSeen, best, sent, wrote>>
YouResume == /\ paused /\ paused' = FALSE 
             /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, away, resting, over, restSeen, best, sent, wrote>>
\* Blur or a hidden tab: the player opens its menu, the loop stops (the first tap back only wakes the game: a node test, not modelled).
YouLookAway == /\ ~away /\ away' = TRUE /\ paused' = TRUE
               /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, resting, over, restSeen, best, sent, wrote>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, resting, over, restSeen, best, sent, wrote>>
TodaysMinutesRunOut == /\ ~over /\ ~away /\ over' = TRUE /\ wrote' = wrote \cup {"playtime"}
                       /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, away, resting, restSeen, best, sent>>
AGrownUpGivesTenMore == /\ resting /\ Touchable /\ screen # "play"
                        /\ resting' = FALSE /\ over' = FALSE /\ restSeen' = FALSE /\ wrote' = wrote \cup {"playtime"}
                        /\ UNCHANGED <<screen, back, kind, idx, stage, ready, missed, dirty, ask, recorded, paused, away, best, sent>>
\* Reload: the title with the first level without stars ready; past the limit it opens on the rest screen.
ThePageReloads == /\ ~away /\ screen' = "title" /\ back' = "title" /\ ask' = "none" /\ paused' = FALSE  /\ dirty' = FALSE
                  /\ kind' = "fill" /\ idx' = 1 /\ stage' = "balance" /\ ready' = FALSE /\ missed' = FALSE /\ recorded' = 0
                  /\ resting' = over /\ restSeen' = (restSeen \/ over)
                  /\ UNCHANGED <<away, over, best, sent, wrote>>

Next == YouStart \/ YouPutOnAPiece \/ TheQuestionAppears \/ YouChooseAWeight \/ TheHoldPasses \/ YouPressNextPan
        \/ TheEndPageComes \/ YouPressPlayAgain \/ YouPressDone \/ YouOpenLevels \/ YouCloseLevels \/ YouPickALevel \/ YouStay \/ YouLeaveTheRound
        \/ TheMenuOpens \/ YouResume \/ YouLookAway \/ YouComeBack \/ TodaysMinutesRunOut \/ AGrownUpGivesTenMore \/ ThePageReloads
Spec == Init /\ [][Next]_vars

\* Keep the chart small: a "find" level and the time-over part are explored with clean rounds, and leaving the page or opening the menu
\* is explored inside a round, where the clock runs.
Explore == /\ (kind = "find" \/ over) => ~missed
           /\ (paused \/ away) => (screen = "play" /\ ~over /\ ~(kind = "find" /\ stage = "balance"))
           /\ over => (kind = "fill" /\ ask = "none")
           /\ (ask # "none") => kind = "fill"
           /\ (screen = "levels") => (back # "end" /\ (back = "play" \/ ~over))
           /\ (screen = "levels" /\ back = "play") => (~paused /\ ~away /\ kind = "fill")
           /\ best # 1     \* a round with a miss after a 3-star one is explored (best stays 3); the one-star record is not drawn

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "end", "play"} /\ kind \in Kinds /\ idx \in 1..PUZZLES
          /\ stage \in {"balance", "ask", "done"} /\ ready \in BOOLEAN /\ missed \in BOOLEAN /\ dirty \in BOOLEAN /\ ask \in Kinds \cup {"none"}
          /\ best \in {0, 1, 3} /\ recorded \in 0..2 /\ paused \in BOOLEAN /\ away \in BOOLEAN 
          /\ resting \in BOOLEAN /\ over \in BOOLEAN /\ restSeen \in BOOLEAN /\ sent \in BOOLEAN /\ wrote \subseteq Progress

\* ---- The reader's rules ----
\* Nothing finishes on its own while you look away or the menu is open: the hold, the question and the end page all run on the clock.
NothingMovesWhileAway == [][(\/ (stage = "ask" /\ ~ready /\ ready') \/ (stage = "done" /\ ~ready /\ ready') \/ (screen = "play" /\ screen' = "end")) => (~away /\ ~paused)]_vars
\* You see every pan balance: the next pan comes only after the level pan has held (stage done AND the hold passed).
YouSeeEveryPanBalance == [][(screen = "play" /\ screen' = "play" /\ idx' = idx + 1) => (stage = "done" /\ ready)]_vars
\* A round you finished is recorded at that moment, so nothing you press next can lose it.
EveryFinishedRoundCounts == LastLevel => recorded = 1
NoDoubleResult == recorded <= 1
\* The rest screen is never over a round: a flag set at the win waits for the end page.
RestOnlyAtBreak == (resting /\ screen = "play") => LastLevel
\* A fresh round starts at the first pan, untouched, with no easing carried over from the last.
FreshRoundStartsClean == (screen = "play" /\ idx = 1 /\ stage = "balance" /\ ~dirty) => ~missed
\* Leaving a round you have touched, from the list, asks first.
LeavingAsksFirst == [][(screen = "levels" /\ screen' = "play" /\ back = "play" /\ dirty /\ ~dirty') => ask # "none"]_vars
\* The list opens only when nothing is turning under it.
ChoiceFreezesPlay == [][(screen = "levels" /\ screen' = "levels") => (idx' = idx /\ stage' = stage /\ ready' = ready)]_vars
NoNetwork == ~sent
NoChildData == wrote \subseteq Progress
RestStaysUntilAGrownUp == (restSeen /\ over /\ ~resting) => ~(screen = "play" /\ dirty)
StarsNeverDrop == [][best' >= best]_best
====
