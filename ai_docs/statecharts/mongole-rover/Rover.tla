---- MODULE Rover ----
\* মঙ্গলে রোভার (kids, 6–11) after the rewrite of 2026-11-05: the screens, a plan and its run (the rover's step arrives every
\* 520 ms of LIVE time), the থামাও button, the first-run story, the player's pause, going away and coming back, the kids' daily
\* limit and the rest screen. The parent gate is ../chhaya-melao/KidsGate.tla. Mirrored from:
\*   tools/mongole-rover/lib/session.ts      begin, storyDone, tapEdit, tapGo, tapStop, lifted, showWon, missed, pause, resume, blur,
\*                                           focus, openLevels, closeLevels, extend, live
\*   tools/mongole-rover/lib/run.hot.ts      tick: the clock moves only while the session is live
\*   tools/mongole-rover/components/game.tsx begin() asks kids.atBreak(); step() / lift() / finish(); the frame loop's live check;
\*                                           the stop button is its own element
\*   shared/kids-kit.tsx                     useKidsSession (rest on mount past the limit), RestScreen as a real modal
\* Abstractions: 2 levels; a run has 2 rover steps; a plan is empty, bad (a crater at the first step), long (wins, 1 star) or
\* short (wins, 3 stars). `guard` stands for "less than 450 ms since চালাও".
EXTENDS Naturals
VARIABLES screen, level, plan, step, fail, best, recorded, solved, guard,
          hand, swallow, resting, over, restSeen, storySeen,
          movedAway, cancelled, wokeMove, sent, wrote
vars == <<screen, level, plan, step, fail, best, recorded, solved, guard, hand, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>

Levels == 1..2
STEPS == 1
Max(a, b) == IF a >= b THEN a ELSE b
EarnedFor(p) == IF p = "short" THEN 3 ELSE 1
Progress == {"stars", "playtime", "limit", "intro"}

Init == /\ screen = "title" /\ level = 1 /\ plan = "empty" /\ step = 0 /\ fail = FALSE /\ best = [l \in Levels |-> 0]
        /\ recorded = 0 /\ solved = FALSE /\ guard = FALSE /\ hand = "here" /\ swallow = FALSE
        /\ over = FALSE /\ resting = FALSE /\ restSeen = FALSE /\ storySeen = FALSE
        /\ movedAway = FALSE /\ cancelled = FALSE /\ wokeMove = FALSE /\ sent = FALSE /\ wrote = {}

\* live(): the run's clock may move only on the run screen, with the menu closed and the child here.
Away == hand = "away"
Paused == hand = "menu"
Live == screen = "run" /\ hand = "here"
\* Touchable: the player's menu or the rest screen (a real modal) covers the game. Nothing is covered while away: the window has no touch.
Free == hand = "here" /\ ~(resting /\ screen # "run")
Rested == resting /\ screen # "run"

\* begin(): খেলো, আবার খেলো, পরের লেভেল or a card in the list. atBreak() first: past the limit, the rest screen instead.
\* Past the limit nothing else changes: the end screen (and its saved stars) stay under the rest screen; a pick from the list lands on the title.
Begin(n, next) == IF over
                  THEN (/\ resting' = TRUE /\ restSeen' = TRUE /\ level' = IF screen \in {"title", "levels"} THEN n ELSE level
                        /\ screen' = IF screen = "levels" THEN "title" ELSE screen
                        /\ UNCHANGED <<plan, step, fail, recorded, solved, guard, swallow>>)
                  ELSE (/\ level' = n /\ plan' = "empty" /\ step' = 0 /\ fail' = FALSE /\ recorded' = 0 /\ solved' = FALSE /\ guard' = FALSE
                        /\ resting' = FALSE /\ restSeen' = restSeen /\ swallow' = FALSE /\ screen' = next)
KeepFlags == UNCHANGED <<best, hand, over, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>

\* খেলো on the title: the story first, on this phone's first run (once), then the level.
YouTapTheHill == /\ screen = "title" /\ Free /\ Begin(level, IF ~storySeen /\ level = 1 THEN "story" ELSE "plan") /\ KeepFlags
\* The last panel, or a 0.6 s hold on the corner button.
YouFinishTheStory == /\ screen = "story" /\ Free /\ screen' = "plan" /\ storySeen' = TRUE /\ swallow' = FALSE /\ wrote' = wrote
                     /\ UNCHANGED <<level, plan, step, fail, best, recorded, solved, guard, hand, resting, over, restSeen, movedAway, cancelled, wokeMove, sent>>

\* tapEdit(): arrows, ⌫, আরেক বার, a block. The first tap after coming back only wakes the game (`wokeMove` would record it counting).
YouEditThePlan == /\ screen = "plan" /\ Free /\ ~swallow
                  /\ plan' \in (IF plan = "empty" THEN {"bad", "short"} ELSE IF plan = "bad" THEN {"empty", "short"} ELSE {"empty"})
                  /\ step' = 0 /\ fail' = FALSE /\ wokeMove' = (wokeMove \/ swallow)
                  /\ UNCHANGED <<screen, level, best, recorded, solved, guard, hand, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, sent, wrote>>
YouTapToWake == /\ screen \in {"plan", "run"} /\ Free /\ swallow /\ swallow' = FALSE
                /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, hand, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
\* tapGo(): an empty plan only shows a note; otherwise the run starts and চালাও is disabled. Stop is another button, not under this finger.
YouTapGo == /\ screen = "plan" /\ plan # "empty" /\ Free /\ ~swallow
            /\ screen' = "run" /\ step' = 0 /\ fail' = FALSE /\ solved' = FALSE /\ guard' = TRUE /\ wokeMove' = (wokeMove \/ swallow)
            /\ UNCHANGED <<level, plan, best, recorded, hand, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, sent, wrote>>
\* 450 ms after চালাও: থামাও now works.
TheGuardPasses == /\ guard /\ guard' = FALSE
                  /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, hand, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
\* tapStop(): the থামাও button, never within the guard, never before the rover has moved, never once the last rock is lifted. `cancelled` would record a stop before the rover moved.
YouTapStop == /\ screen = "run" /\ ~guard /\ step >= 1 /\ ~solved /\ Free /\ ~swallow
              /\ screen' = "plan" /\ step' = 0 /\ guard' = FALSE
              /\ cancelled' = (cancelled \/ step = 0) /\ wokeMove' = (wokeMove \/ swallow)
              /\ UNCHANGED <<level, plan, fail, best, recorded, solved, hand, swallow, resting, over, restSeen, storySeen, movedAway, sent, wrote>>

\* One step of the clock (tick): only while live. `movedAway` would record a step taken away or under the menu.
TheRoverMoves == /\ Live /\ ~solved /\ step < STEPS /\ (plan = "bad" => step = 0)
                 /\ step' = step + 1 /\ guard' = FALSE /\ movedAway' = (movedAway \/ ~Live)
                 /\ UNCHANGED <<screen, level, plan, fail, best, recorded, solved, hand, swallow, resting, over, restSeen, storySeen, cancelled, wokeMove, sent, wrote>>
\* lift(): the last rock. The stars are saved and atBreak() runs right here, not in a timer.
TheRoverLiftsTheLastRock == /\ Live /\ ~solved /\ plan \in {"long", "short"} /\ step = STEPS
                            /\ solved' = TRUE /\ recorded' = recorded + 1 /\ best' = [best EXCEPT ![level] = Max(@, EarnedFor(plan))]
                            /\ resting' = over /\ restSeen' = (restSeen \/ over) /\ movedAway' = (movedAway \/ ~Live) /\ wrote' = wrote \cup {"stars"}
                            /\ UNCHANGED <<screen, level, plan, step, fail, guard, hand, swallow, over, storySeen, cancelled, wokeMove, sent>>
\* showWon(): the closing beat is over; the end screen shows (under the rest screen when the limit passed).
TheEndScreenShows == /\ Live /\ solved /\ screen' = "won" /\ movedAway' = (movedAway \/ ~Live)
                     /\ UNCHANGED <<level, plan, step, fail, best, recorded, solved, guard, hand, swallow, resting, over, restSeen, storySeen, cancelled, wokeMove, sent, wrote>>
\* missed(): the bump, the lit block, back to planning, and atBreak() (a failed run is a break).
TheRoverBumps == /\ Live /\ ~solved /\ plan = "bad" /\ step = 1
                 /\ screen' = "plan" /\ fail' = TRUE /\ guard' = FALSE /\ resting' = over /\ restSeen' = (restSeen \/ over)
                 /\ movedAway' = (movedAway \/ ~Live)
                 /\ UNCHANGED <<level, plan, step, best, recorded, solved, hand, swallow, over, storySeen, cancelled, wokeMove, sent, wrote>>

\* The won screen: পরের লেভেল → begin(n + 1); আবার খেলো → begin(n); শেষ → the title.
YouPressNextLevel == /\ screen = "won" /\ level < 2 /\ Free /\ Begin(level + 1, "plan") /\ KeepFlags
YouPressPlayAgain == /\ screen = "won" /\ Free /\ Begin(level, "plan") /\ KeepFlags
YouPressDone == /\ screen = "won" /\ Free /\ screen' = "title" /\ solved' = FALSE /\ swallow' = FALSE /\ plan' = "empty" /\ step' = 0
                /\ UNCHANGED <<level, fail, best, recorded, guard, hand, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
\* The list opens from anywhere (the title chip, the end screen, the pause menu's সব লেভেল): a choice screen, nothing runs under it.
YouOpenTheLevelList == /\ screen \in {"title", "story", "plan", "run", "won"} /\ hand # "away" /\ ~Rested
                       /\ screen' = "levels" /\ hand' = (IF Paused THEN "here" ELSE hand) /\ solved' = FALSE /\ swallow' = FALSE /\ step' = 0 /\ guard' = FALSE
                       /\ UNCHANGED <<level, plan, fail, best, recorded, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
YouPickALevel == /\ screen = "levels" /\ Free /\ \E n \in Levels : Begin(n, "plan") /\ KeepFlags
YouCloseTheLevelList == /\ screen = "levels" /\ Free /\ screen' = "title"
                        /\ UNCHANGED <<level, plan, step, fail, best, recorded, solved, guard, hand, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>

\* The player: the menu opens on ⏸, P, Escape, blur or hide; চালিয়ে যাও closes it and the hand is fresh.
ThePlayerMenuOpens == /\ hand # "menu" /\ ~Rested /\ hand' = "menu"
                      /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
YouResume == /\ Paused /\ hand' = "here" /\ swallow' = FALSE
             /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
YouLookAway == /\ hand = "here" /\ hand' = "away" /\ swallow' = IF screen \in {"plan", "run"} THEN TRUE ELSE swallow
               /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>
YouComeBack == /\ Away /\ hand' = "here"
               /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, swallow, resting, over, restSeen, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>

\* The kids' daily limit: minutes run out (only counted, never acted on mid-run); a grown-up gives ten more; the page reloads.
TodaysMinutesRunOut == /\ ~over /\ ~Away /\ over' = TRUE /\ wrote' = wrote \cup {"playtime"}
                       /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, hand, swallow, resting, restSeen, storySeen, movedAway, cancelled, wokeMove, sent>>
AGrownUpGivesTenMore == /\ Rested /\ ~Away /\ resting' = FALSE /\ over' = FALSE /\ restSeen' = FALSE /\ wrote' = wrote \cup {"playtime"}
                        /\ UNCHANGED <<screen, level, plan, step, fail, best, recorded, solved, guard, hand, swallow, storySeen, movedAway, cancelled, wokeMove, sent>>
\* Reload: the title again; past the limit it opens on the rest screen.
ThePageReloads == /\ ~Away /\ screen' = "title" /\ level' = 1 /\ plan' = "empty" /\ step' = 0 /\ fail' = FALSE /\ solved' = FALSE /\ guard' = FALSE
                  /\ hand' = "here" /\ swallow' = FALSE /\ recorded' = 0 /\ resting' = over /\ restSeen' = (restSeen \/ over)
                  /\ UNCHANGED <<best, hand, over, storySeen, movedAway, cancelled, wokeMove, sent, wrote>>

Next == YouTapTheHill \/ YouFinishTheStory \/ YouEditThePlan \/ YouTapToWake \/ YouTapGo \/ TheGuardPasses \/ YouTapStop
        \/ TheRoverMoves \/ TheRoverLiftsTheLastRock \/ TheEndScreenShows \/ TheRoverBumps
        \/ YouPressNextLevel \/ YouPressPlayAgain \/ YouPressDone \/ YouOpenTheLevelList \/ YouPickALevel \/ YouCloseTheLevelList
        \/ ThePlayerMenuOpens \/ YouResume \/ YouLookAway \/ YouComeBack
        \/ TodaysMinutesRunOut \/ AGrownUpGivesTenMore \/ ThePageReloads
Spec == Init /\ [][Next]_vars

\* Keep the chart small: stop past a broken history rule; plans are empty, bad or the shortest; level 2 only as a fresh level;
\* looking away and the menu are explored while planning or driving.
Explore == /\ (over => (level = 1 /\ storySeen /\ hand = "here")) /\ (level = 2 => (hand = "here" /\ ~over)) /\ (hand # "here" => ~over) /\ ~movedAway /\ ~cancelled /\ ~wokeMove
           /\ plan \in {"empty", "bad", "short"}
           /\ (level = 2 => (plan = "empty" /\ screen # "run"))
           /\ (hand # "here" => screen \in {"plan", "run"})

TypeOK == /\ screen \in {"title", "story", "plan", "run", "won", "levels"} /\ level \in Levels /\ plan \in {"empty", "bad", "long", "short"}
          /\ step \in 0..STEPS /\ fail \in BOOLEAN /\ best \in [Levels -> {0, 1, 3}] /\ recorded \in 0..2 /\ solved \in BOOLEAN /\ guard \in BOOLEAN
          /\ hand \in {"here", "away", "menu"} /\ swallow \in BOOLEAN /\ resting \in BOOLEAN /\ over \in BOOLEAN /\ restSeen \in BOOLEAN
          /\ storySeen \in BOOLEAN /\ movedAway \in BOOLEAN /\ cancelled \in BOOLEAN /\ wokeMove \in BOOLEAN /\ sent \in BOOLEAN /\ wrote \subseteq Progress

\* ---- The reader's rules ----
\* The rover doesn't drive, lift a rock or win while you look away or the menu is open.
NoProgressWhileAway == ~movedAway
\* One tap on চালাও is one run: a quick second tap on the stop button, or a held Enter, never cancels it before the rover moved.
OneTapOneRun == ~cancelled
\* The tap that brings focus back (or closes the menu) is not a move.
WakeTapIsNotAMove == ~wokeMove
\* A level is won and recorded once per try; the end screen never shows without its stars saved.
NoDoubleResult == recorded <= 1
EveryFinishCounts == (solved \/ screen = "won") => recorded = 1
\* The stars saved are the stars of the plan that won.
ResultMatchesPlay == solved => best[level] >= EarnedFor(plan)
\* The rest screen is only at a break: while the rover drives, only a rest that waits for the end screen (the limit passing at the last rock).
RestOnlyAtBreak == resting => (screen # "run" \/ solved)
\* Past today's limit no run starts, and after the rest screen no run starts until a grown-up gives more time.
NoNewRoundPastLimit == (screen = "run" /\ ~solved) => ~resting
RestStaysUntilAGrownUp == (restSeen /\ over /\ ~resting) => (screen # "run" \/ solved)
\* A choice screen freezes play: the list is open, nothing has a step to take.
ChoiceFreezesPlay == screen = "levels" => (step = 0 /\ ~solved)
NoNetwork == ~sent
NoChildData == wrote \subseteq Progress
StarsNeverDrop == [][\A l \in Levels : best'[l] >= best[l]]_best
====
