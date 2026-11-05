---- MODULE Rover ----
\* মঙ্গলে রোভার (kids, 6–11) as it is on 2026-11-04 with the kids' kit at 23fd7c1, before the rewrite. Mirrored from:
\*   tools/mongole-rover/components/rover-game.tsx  (edit/tapArrow/tapRepeat/back/removeAt, go, the step timers, stopped, win,
\*                                                   halt, open, the won buttons, the drawer LevelGrid, the idle LevelGrid)
\*   tools/mongole-rover/lib/rover.ts                (runPlan, starsOf)
\*   shared/kids-kit.tsx                              (useKidsSession: tick, atBreak, the past-the-limit mount check, extend;
\*                                                     RestScreen, a real modal since f4f75be)
\*   shared/game-core.ts                              (recordLevel keeps the better stars, unlockedLevel)
\* Abstractions: 2 levels; a run has 2 rover steps; a plan is empty, bad (hits a crater or falls short),
\* long (wins, 1 star) or short (wins, 3 stars). No blur, visibility or pause handler exists, so look-away is one flag.
\* চালাও and থামাও are the two arms of one JSX ternary in the same slot, so React keeps one <button> element:
\* the button under your finger and in focus turns into থামাও the moment the run starts (`spot`).
EXTENDS Naturals
VARIABLES phase, level, plan, step, fail, unlocked, best, recorded, away, spot,
          resting, over, restSeen, movedAway, cancelled, sent, wrote
vars == <<phase, level, plan, step, fail, unlocked, best, recorded, away, spot, resting, over, restSeen, movedAway, cancelled, sent, wrote>>

Levels == 1..2
STEPS == 2
Max(a, b) == IF a >= b THEN a ELSE b
EarnedFor(p) == IF p = "short" THEN 3 ELSE 1
Progress == {"stars", "playtime", "limit"}

Init == /\ phase = "plan" /\ level = 1 /\ plan = "empty" /\ step = 0 /\ fail = FALSE /\ unlocked = 1
        /\ best = [l \in Levels |-> 0] /\ recorded = 0 /\ away = FALSE /\ spot = "none"
        /\ resting = FALSE /\ over = FALSE /\ restSeen = FALSE /\ movedAway = FALSE /\ cancelled = FALSE
        /\ sent = FALSE /\ wrote = {}

Touchable == ~away /\ ~resting
\* open(next): stop() clears every step timer; an empty plan, phase "plan", the rover back at the start.
Open(n) == /\ level' = n /\ phase' = "plan" /\ plan' = "empty" /\ step' = 0 /\ fail' = FALSE /\ recorded' = 0

\* tapArrow / tapRepeat / back / removeAt → edit(): only while not running; resets the rover; the plan changes.
YouEditThePlan == /\ phase = "plan" /\ Touchable
                   /\ plan' \in {"empty", "bad", "long", "short"} /\ plan' # plan
                   /\ step' = 0 /\ fail' = FALSE /\ spot' = "none"
                   /\ UNCHANGED <<phase, level, unlocked, best, recorded, away, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
\* go(): an empty plan only shows a note; otherwise the run starts and the same button now says থামাও.
YouTapGo == /\ phase = "plan" /\ plan # "empty" /\ Touchable
            /\ phase' = "run" /\ step' = 0 /\ fail' = FALSE /\ spot' = "go"
            /\ UNCHANGED <<level, plan, unlocked, best, recorded, away, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
\* One of the step timeouts (520 ms, 850 in slow mode). Nothing checks visibility or focus.
TheRoverMoves == /\ phase = "run" /\ step < STEPS /\ (plan = "bad" => step = 0)
                 /\ step' = step + 1 /\ movedAway' = (movedAway \/ away)
                 /\ UNCHANGED <<phase, level, plan, fail, unlocked, best, recorded, away, spot, resting, over, restSeen, cancelled, sent, wrote>>
\* The last timeout, a bad plan → stopped(): the bump, the wrong block glows, back to planning.
TheRoverStops == /\ phase = "run" /\ plan = "bad" /\ step = 1
                 /\ phase' = "plan" /\ fail' = TRUE /\ movedAway' = (movedAway \/ away)
                 /\ UNCHANGED <<level, plan, step, unlocked, best, recorded, away, spot, resting, over, restSeen, cancelled, sent, wrote>>
\* The last timeout, a good plan → win(): levels.record, the chime or confetti, scrollIntoView, phase "won", atBreak().
\* The board and the buttons unmount, so focus falls to the page.
TheRoverWins == /\ phase = "run" /\ plan \in {"long", "short"} /\ step = STEPS
                /\ phase' = "won" /\ best' = [best EXCEPT ![level] = Max(@, EarnedFor(plan))]
                /\ unlocked' = IF level < 2 THEN Max(unlocked, level + 1) ELSE unlocked
                /\ recorded' = recorded + 1 /\ spot' = "none"
                /\ resting' = over /\ restSeen' = (restSeen \/ over)
                /\ movedAway' = (movedAway \/ away) /\ wrote' = wrote \cup {"stars"}
                /\ UNCHANGED <<level, plan, step, fail, away, over, cancelled, sent>>
\* halt() from থামাও when you mean it, after watching the rover move: stop(), reset(), phase "plan".
YouTapStop == /\ phase = "run" /\ Touchable /\ step >= 1
              /\ phase' = "plan" /\ step' = 0
              /\ UNCHANGED <<level, plan, fail, unlocked, best, recorded, away, spot, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
\* The second tap of a quick double tap, or Enter (or a held Enter's repeat) on the button that still has focus:
\* it is থামাও now, so halt() runs and the rover goes back to the start.
YouTapTheSameSpotAgain == /\ phase = "run" /\ spot = "go" /\ step = 0 /\ ~away
                          /\ phase' = "plan" /\ step' = 0 /\ cancelled' = TRUE
                          /\ UNCHANGED <<level, plan, fail, unlocked, best, recorded, away, spot, resting, over, restSeen, movedAway, sent, wrote>>
\* The সব লেভেল drawer is on screen while planning, running and on the won screen; the idle screen has its own grid.
YouPickALevel == /\ phase \in {"plan", "run", "won", "idle"} /\ Touchable
                 /\ \E n \in 1..unlocked : Open(n)
                 /\ spot' = "none"
                 /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
\* The won screen: পরের লেভেল → open(n + 1); আবার খেলো → open(n); শেষ → "idle".
YouPressNextLevel == /\ phase = "won" /\ level < 2 /\ Touchable /\ Open(level + 1) /\ spot' = "none"
                     /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
YouPressPlayAgain == /\ phase = "won" /\ Touchable /\ Open(level) /\ spot' = "none"
                     /\ UNCHANGED <<unlocked, best, away, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
YouPressDone == /\ phase = "won" /\ Touchable /\ phase' = "idle"
                /\ UNCHANGED <<level, plan, step, fail, unlocked, best, recorded, away, spot, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
TodaysMinutesRunOut == /\ ~over /\ ~away /\ over' = TRUE /\ wrote' = wrote \cup {"playtime"}
                       /\ UNCHANGED <<phase, level, plan, step, fail, unlocked, best, recorded, away, spot, resting, restSeen, movedAway, cancelled, sent>>
AGrownUpGivesTenMore == /\ resting /\ ~away
                        /\ resting' = FALSE /\ over' = FALSE /\ restSeen' = FALSE /\ wrote' = wrote \cup {"playtime"}
                        /\ UNCHANGED <<phase, level, plan, step, fail, unlocked, best, recorded, away, spot, movedAway, cancelled, sent>>
\* Reload or come back later: the load effect opens the first level without stars; past the limit it opens on the rest screen.
ThePageReloads == /\ ~away /\ \E n \in 1..unlocked : (Open(n) /\ (best[n] = 0 \/ n = unlocked) /\ \A m \in 1..(n - 1) : best[m] > 0)
                  /\ resting' = over /\ restSeen' = (restSeen \/ over) /\ spot' = "none"
                  /\ UNCHANGED <<unlocked, best, away, over, movedAway, cancelled, sent, wrote>>
YouLookAway == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<phase, level, plan, step, fail, unlocked, best, recorded, spot, resting, over, restSeen, movedAway, cancelled, sent, wrote>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<phase, level, plan, step, fail, unlocked, best, recorded, spot, resting, over, restSeen, movedAway, cancelled, sent, wrote>>

Next == YouEditThePlan \/ YouTapGo \/ TheRoverMoves \/ TheRoverStops \/ TheRoverWins \/ YouTapStop \/ YouTapTheSameSpotAgain
        \/ YouPickALevel \/ YouPressNextLevel \/ YouPressPlayAgain \/ YouPressDone
        \/ TodaysMinutesRunOut \/ AGrownUpGivesTenMore \/ ThePageReloads \/ YouLookAway \/ YouComeBack
Spec == Init /\ [][Next]_vars

\* Keep the chart small: stop past a broken history rule, explore level 2 only with an empty board, keep sound/time simple.
Explore == /\ ~movedAway /\ ~cancelled
           /\ (level = 2 => (phase \in {"plan", "won", "idle"} /\ plan \in {"empty", "short"}))
           /\ (over => plan \in {"empty", "short"})

TypeOK == /\ phase \in {"plan", "run", "won", "idle"} /\ level \in Levels /\ plan \in {"empty", "bad", "long", "short"}
          /\ step \in 0..STEPS /\ fail \in BOOLEAN /\ unlocked \in Levels /\ best \in [Levels -> {0, 1, 3}]
          /\ recorded \in 0..2 /\ away \in BOOLEAN /\ spot \in {"none", "go"}
          /\ resting \in BOOLEAN /\ over \in BOOLEAN /\ restSeen \in BOOLEAN
          /\ movedAway \in BOOLEAN /\ cancelled \in BOOLEAN /\ sent \in BOOLEAN /\ wrote \subseteq Progress

\* ---- The reader's rules ----
\* The rover doesn't drive, and the level doesn't end, while you look away.
NoProgressWhileAway == ~movedAway
\* One tap on চালাও is one run: the second tap of a double tap, or Enter on the focused button, never cancels it before it moves.
OneTapOneRun == ~cancelled
\* A level is won and recorded once per try.
NoDoubleResult == recorded <= 1
\* RestOnlyAtBreak: the rest screen is only ever over a won level, the idle screen, or a level not yet touched.
RestOnlyAtBreak == resting => (phase \in {"won", "idle"} \/ (phase = "plan" /\ plan = "empty" /\ ~fail))
RestStaysUntilAGrownUp == (restSeen /\ over /\ ~resting) => phase # "run"
NoNetwork == ~sent
NoChildData == wrote \subseteq Progress
StarsNeverDrop == [][\A l \in Levels : best'[l] >= best[l]]_best
UnlockNeverShrinks == [][unlocked' >= unlocked]_unlocked
====
