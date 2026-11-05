---- MODULE Daripalla ----
\* দাঁড়িপাল্লা (kids, 6–11) as it is on 2026-11-04 with the kids' kit at 23fd7c1, before the rewrite. Mirrored from:
\*   tools/daripalla/components/balance-game.tsx  (press(): act on the first pointerdown, or a click with detail 0;
\*                                                 apply(add/remove/choose), goNext, the round-end effect with its
\*                                                 1800 ms timer, restart, the end and closed screens, the সব ধাপ drawer,
\*                                                 useGameLoop for the beam spring)
\*   tools/daripalla/lib/game.ts                   (add, remove, choose, balanced, finish, nextPuzzle, roundStars)
\*   shared/kids-kit.tsx                           (useKidsSession: tick, atBreak, the past-the-limit mount check, extend;
\*                                                  RestScreen, a real modal since f4f75be)
\*   shared/game-kit.ts / game-core.ts             (useGameLoop pauses the spring on blur and hide; recordLevel)
\* Abstractions: 2 levels — level 1 "fill" (৪ + ? = ৭: the pan is done when level), level 2 "find" (an unknown fruit:
\* level the pan, then choose its weight); 2 puzzles a round (the code has 5); stars 3 for a clean round, 1 otherwise.
EXTENDS Naturals
VARIABLES phase, level, idx, stage, missed, touched, unlocked, best, recorded, away,
          resting, over, restSeen, movedAway, skipped, lost, sent, wrote
vars == <<phase, level, idx, stage, missed, touched, unlocked, best, recorded, away, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>

Levels == 1..2
PUZZLES == 2
Max(a, b) == IF a >= b THEN a ELSE b
Earned == IF missed THEN 1 ELSE 3
Progress == {"stars", "playtime", "limit"}
Waiting == phase = "play" /\ stage = "done" /\ idx = PUZZLES   \* the last pan rests a moment before the end screen

Init == /\ phase = "play" /\ level = 1 /\ idx = 1 /\ stage = "balance" /\ missed = FALSE /\ touched = FALSE /\ unlocked = 1
        /\ best = [l \in Levels |-> 0] /\ recorded = 0 /\ away = FALSE
        /\ resting = FALSE /\ over = FALSE /\ restSeen = FALSE /\ movedAway = FALSE /\ skipped = FALSE /\ lost = FALSE
        /\ sent = FALSE /\ wrote = {}

Touchable == ~away /\ ~resting
\* restart(level): a new round of that level, phase "play". A pending round-end timer is dropped with the old round.
Restart(n) == /\ level' = n /\ phase' = "play" /\ idx' = 1 /\ stage' = "balance" /\ missed' = FALSE /\ touched' = FALSE /\ recorded' = 0
              /\ lost' = (lost \/ Waiting)

\* A tray piece's pointerdown → apply(add()): a piece too few (stays tipped), one too many (a miss on a fill pan),
\* or the one that levels the pan (fill: done; find: now ask its weight). With a mouse or a key, the click that follows
\* is ignored (detail ≠ 0) or lands on nothing.
YouPutOnAPiece == /\ phase = "play" /\ stage = "balance" /\ Touchable
                  /\ \/ /\ stage' = "balance" /\ missed' \in {missed, level = 1 \/ missed}
                     \/ /\ stage' = (IF level = 1 THEN "done" ELSE "ask") /\ missed' = missed
                  /\ touched' = TRUE /\ UNCHANGED <<phase, level, idx, unlocked, best, recorded, away, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>
\* On a phone, the same tap on the weight that levels a fill pan: pointerdown levels it and swaps the tray for
\* পরের পাল্লা, which fills the whole tray under the finger and has a plain onClick. Chrome sends the tap's click to
\* what is under the finger when it lifts, so the same tap goes on to the next pan.
YouTapTheLastWeightOnAPhone == /\ phase = "play" /\ stage = "balance" /\ level = 1 /\ idx < PUZZLES /\ Touchable
                               /\ idx' = idx + 1 /\ stage' = "balance" /\ skipped' = TRUE
                               /\ touched' = TRUE /\ UNCHANGED <<phase, level, missed, unlocked, best, recorded, away, resting, over, restSeen, movedAway, lost, sent, wrote>>
\* A number's pointerdown → apply(choose()): the right weight finishes the pan, a wrong one is a miss.
YouChooseAWeight == /\ phase = "play" /\ stage = "ask" /\ Touchable
                    /\ \/ /\ stage' = "done" /\ missed' = missed
                       \/ /\ stage' = "ask" /\ missed' = TRUE /\ ~missed
                    /\ touched' = TRUE /\ UNCHANGED <<phase, level, idx, unlocked, best, recorded, away, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>
\* goNext() from পরের পাল্লা, pressed on purpose.
YouPressNextPan == /\ phase = "play" /\ stage = "done" /\ idx < PUZZLES /\ Touchable
                   /\ idx' = idx + 1 /\ stage' = "balance"
                   /\ UNCHANGED <<touched, phase, level, missed, unlocked, best, recorded, away, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>
\* The round-end effect's 1800 ms timer: record the stars, sfx.win (+ confetti on levels 3 and 7), atBreak(), the end screen.
\* No check of visibility or focus.
TheRoundEnds == /\ Waiting
                /\ phase' = "end" /\ best' = [best EXCEPT ![level] = Max(@, Earned)]
                /\ unlocked' = IF level < 2 THEN Max(unlocked, level + 1) ELSE unlocked
                /\ recorded' = recorded + 1 /\ resting' = over /\ restSeen' = (restSeen \/ over)
                /\ movedAway' = (movedAway \/ away) /\ wrote' = wrote \cup {"stars"}
                /\ UNCHANGED <<touched, level, idx, stage, missed, away, over, skipped, lost, sent>>
\* The end screen: আবার খেলো, পরের ধাপ, শেষ; the closed screen's আবার খেলো.
YouPressPlayAgain == /\ phase \in {"end", "closed"} /\ Touchable /\ Restart(level)
                     /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, skipped, sent, wrote>>
YouPressNextLevel == /\ phase = "end" /\ level < 2 /\ Touchable /\ Restart(level + 1)
                     /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, skipped, sent, wrote>>
YouPressDone == /\ phase = "end" /\ Touchable /\ phase' = "closed"
                /\ UNCHANGED <<touched, level, idx, stage, missed, unlocked, best, recorded, away, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>
\* The সব ধাপ drawer is always on the page: picking a level restarts at once, also during the last pan's moment.
YouPickALevel == /\ Touchable /\ \E n \in 1..unlocked : Restart(n)
                 /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, skipped, sent, wrote>>
TodaysMinutesRunOut == /\ ~over /\ ~away /\ over' = TRUE /\ wrote' = wrote \cup {"playtime"}
                       /\ UNCHANGED <<touched, phase, level, idx, stage, missed, unlocked, best, recorded, away, resting, restSeen, movedAway, skipped, lost, sent>>
AGrownUpGivesTenMore == /\ resting /\ ~away
                        /\ resting' = FALSE /\ over' = FALSE /\ restSeen' = FALSE /\ wrote' = wrote \cup {"playtime"}
                        /\ UNCHANGED <<touched, phase, level, idx, stage, missed, unlocked, best, recorded, away, movedAway, skipped, lost, sent>>
\* Reload: the load effect starts the first level without stars; past the limit it opens on the rest screen.
ThePageReloads == /\ ~away
                  /\ \E n \in 1..unlocked : (/\ (best[n] = 0 \/ n = unlocked) /\ \A m \in 1..(n - 1) : best[m] > 0
                                            /\ level' = n /\ phase' = "play" /\ idx' = 1 /\ stage' = "balance" /\ missed' = FALSE /\ touched' = FALSE /\ recorded' = 0)
                  /\ resting' = over /\ restSeen' = (restSeen \/ over)
                  /\ UNCHANGED <<unlocked, best, away, over, movedAway, skipped, lost, sent, wrote>>
YouLookAway == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<touched, phase, level, idx, stage, missed, unlocked, best, recorded, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<touched, phase, level, idx, stage, missed, unlocked, best, recorded, resting, over, restSeen, movedAway, skipped, lost, sent, wrote>>

Next == YouPutOnAPiece \/ YouTapTheLastWeightOnAPhone \/ YouChooseAWeight \/ YouPressNextPan \/ TheRoundEnds
        \/ YouPressPlayAgain \/ YouPressNextLevel \/ YouPressDone \/ YouPickALevel
        \/ TodaysMinutesRunOut \/ AGrownUpGivesTenMore \/ ThePageReloads \/ YouLookAway \/ YouComeBack
Spec == Init /\ [][Next]_vars

\* Keep the chart small: stop past a broken history rule; level 2 and the time-over part are explored only with clean rounds.
Explore == /\ ~movedAway /\ ~skipped /\ ~lost
           /\ (level = 2 \/ over => ~missed)

TypeOK == /\ phase \in {"play", "end", "closed"} /\ level \in Levels /\ idx \in 1..PUZZLES
          /\ stage \in {"balance", "ask", "done"} /\ missed \in BOOLEAN /\ touched \in BOOLEAN /\ unlocked \in Levels
          /\ best \in [Levels -> {0, 1, 3}] /\ recorded \in 0..2 /\ away \in BOOLEAN
          /\ resting \in BOOLEAN /\ over \in BOOLEAN /\ restSeen \in BOOLEAN
          /\ movedAway \in BOOLEAN /\ skipped \in BOOLEAN /\ lost \in BOOLEAN /\ sent \in BOOLEAN /\ wrote \subseteq Progress

\* ---- The reader's rules ----
\* The round doesn't end, and no win chime plays, while you look away.
NoProgressWhileAway == ~movedAway
\* You see every pan balance: the tap that levels a pan never also presses পরের পাল্লা.
YouSeeEveryPanBalance == ~skipped
\* A round you finished is always recorded, even if you tap a level in the moment before the stars.
EveryFinishedRoundCounts == ~lost
NoDoubleResult == recorded <= 1
\* RestOnlyAtBreak: the rest screen is only over the end screen, the closed shop, or a round not yet touched.
RestOnlyAtBreak == resting => (phase \in {"end", "closed"} \/ (phase = "play" /\ idx = 1 /\ stage = "balance" /\ ~touched))
RestStaysUntilAGrownUp == (restSeen /\ over /\ ~resting) => ~(phase = "play" /\ touched)
NoNetwork == ~sent
NoChildData == wrote \subseteq Progress
StarsNeverDrop == [][\A l \in Levels : best'[l] >= best[l]]_best
UnlockNeverShrinks == [][unlocked' >= unlocked]_unlocked
====
