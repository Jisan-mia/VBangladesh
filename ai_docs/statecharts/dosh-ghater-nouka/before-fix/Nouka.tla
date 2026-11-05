---- MODULE Nouka ----
\* দশ ঘাটের নৌকা: the race against আব্বু (turns, the চরকি spin timer, counting ghats, the end timer), leaving and coming
\* back, the sound switch and the spoken numbers, the kids' daily limit and rest screen, and the page's parent gate.
\* Mirrored from tools/dosh-ghater-nouka/components/nouka-game.tsx (turnSpinner, onGhat, restart, the auto-step,
\* bot-spin, pop/speak and end-of-race effects, the mode buttons and the সব ধাপ drawer), tools/dosh-ghater-nouka/lib/race.ts
\* (spin, step, tap, endTurn) and shared/kids-kit.tsx (useKidsSession, RestScreen, ParentGate, speak).
\* A turn is abstracted to "spin, then count to where it stops"; the child's count either hands the turn to আব্বু or
\* reaches the last ghat. The ParentGate's hold timer, ShowParent and the header search are the same shared code as
\* সৌরজগতের সফর and are modelled in full in ai_docs/statecharts/sourojogot/Sourojogot.tla; here the gate is one step.
\* The kit is mirrored as of f4f75be + 23fd7c1 (2026-11-04 16:47); the run against the kit at b51e328 is in before-kit-fix/.
VARIABLES phase, turn, spin, timer, over, away, sound, voice, due, resting, skipped, stage
vars == <<phase, turn, spin, timer, over, away, sound, voice, due, resting, skipped, stage>>

\* A race that starts after today's time is up (NoRoundAfterTimeIsUp) is the same shared useKidsSession path as in
\* Sourojogot.tla, so it is left out here to keep the chart under 500 states.
Playing == phase = "play"

Init == /\ phase = "play" /\ turn = 0 /\ spin = "none" /\ timer = "none" /\ over = FALSE
        /\ away = FALSE /\ sound = TRUE /\ voice = "quiet" /\ due = FALSE /\ resting = FALSE /\ skipped = FALSE
        /\ stage = "closed"

\* restart(): a new race. It does not clear the pending spin timeout (an untracked setTimeout), and the end-of-race
\* effect's cleanup cancels the 900 ms levels.record() + atBreak() if it has not fired yet. The page's ParentGate sits
\* outside the game and stays as it was.
Restart == /\ phase' = "play"
           /\ turn' = 0 /\ spin' = "none" /\ over' = FALSE
           /\ timer' = IF timer = "mine" THEN "old" ELSE timer
           /\ skipped' = (skipped \/ (over /\ Playing))
           /\ voice' = "quiet"
           /\ UNCHANGED <<away, sound, due, resting, stage>>

\* ---- the race ----
\* turnSpinner(0): only on your turn with no spin set and no spin running (`spinning === null`).
YouSpin == /\ Playing /\ turn = 0 /\ spin = "none" /\ timer = "none" /\ ~over /\ ~away /\ ~resting
           /\ timer' = "mine"
           /\ UNCHANGED <<phase, turn, spin, over, away, sound, voice, due, resting, skipped, stage>>
\* The bot effect: 1 s after আব্বু's turn starts, turnSpinner(1). Nothing checks visibility or focus.
AbbuSpins == /\ Playing /\ turn = 1 /\ spin = "none" /\ timer = "none" /\ ~over
             /\ timer' = "mine"
             /\ UNCHANGED <<phase, turn, spin, over, away, sound, voice, due, resting, skipped, stage>>
\* SPIN_MS later: setRace(current => spin(current, value)) on whatever race is current by then.
\* spin() ignores a race that is over or already has a spin. "old" = the spin came from the race before a restart.
TheSpinnerStops == /\ timer # "none"
                   /\ spin' = IF over \/ spin # "none" THEN spin ELSE IF timer = "old" THEN "old" ELSE "made"
                   /\ timer' = "none"
                   /\ UNCHANGED <<phase, turn, over, away, sound, voice, due, resting, skipped, stage>>
\* onGhat → tap(): each right ghat steps the boat; the pop effect plays a note and speak()s the number.
\* speak() speaks only with a Bangla voice and, since b51e328 (2026-11-04), only while soundOn(); before that commit it
\* ignored the switch and this line read IF sound THEN voice ELSE "spoke".
\* voice "spoke" = a number was spoken with sound off during this race.
Spoken == voice
YouCountToWhereItStops == /\ Playing /\ turn = 0 /\ spin # "none" /\ ~away /\ ~resting
                          /\ spin' = "none"
                          /\ \/ /\ turn' = 1 /\ over' = FALSE
                             \/ /\ turn' = 0 /\ over' = TRUE
                          /\ voice' = Spoken
                          /\ UNCHANGED <<phase, timer, away, sound, due, resting, skipped, stage>>
\* The auto-step effect: আব্বু counts one ghat every 850 ms, then endTurn() hands the turn back. No visibility check.
AbbuCounts == /\ Playing /\ turn = 1 /\ spin # "none" /\ ~over
              /\ spin' = "none" /\ turn' = 0 /\ voice' = Spoken
              /\ UNCHANGED <<phase, timer, over, away, sound, due, resting, skipped, stage>>
\* 900 ms after race.over: levels.record(), win sound, atBreak(), setPhase("end").
TheRaceEnds == /\ Playing /\ over
               /\ phase' = "end" /\ resting' = due /\ skipped' = FALSE
               /\ UNCHANGED <<turn, spin, timer, over, away, sound, voice, due, stage>>

\* ---- restarts ----
\* ফোন চালাবে / বড়রা চালাবে (live only while playing: the end card covers them; tapping the one already on also
\* restarts) and the সব ধাপ drawer (any time).
YouTapAModeOrAStage == /\ ~resting /\ Restart
YouPlayAgain == /\ phase \in {"end", "closed"} /\ ~resting /\ Restart
YouPressShesh == /\ phase = "end" /\ ~resting /\ phase' = "closed"
                 /\ UNCHANGED <<turn, spin, timer, over, away, sound, voice, due, resting, skipped, stage>>
\* The rest screen is a real modal (f4f75be): no key, tap or focus reaches the drawer or the mode buttons behind it.

\* ---- away and back, sound ----
\* The rest screen (fixed, z 50) covers the sound button and the gate, and nobody presses them while away.
YouLeave == /\ ~away /\ away' = TRUE /\ UNCHANGED <<phase, turn, spin, timer, over, sound, voice, due, resting, skipped, stage>>
YouComeBack == /\ away /\ away' = FALSE /\ UNCHANGED <<phase, turn, spin, timer, over, sound, voice, due, resting, skipped, stage>>
SoundOff == /\ sound /\ ~away /\ ~resting /\ sound' = FALSE
            /\ UNCHANGED <<phase, turn, spin, timer, over, away, voice, due, resting, skipped, stage>>
SoundOn == /\ ~sound /\ ~away /\ ~resting /\ sound' = TRUE /\ voice' = "quiet"
           /\ UNCHANGED <<phase, turn, spin, timer, over, away, due, resting, skipped, stage>>

\* ---- the daily limit and the parent gate ----
\* The session clock ticks only while the tab is visible and focused (f4f75be).
TodaysTimeRunsOut == /\ ~due /\ ~away /\ due' = TRUE
                     /\ UNCHANGED <<phase, turn, spin, timer, over, away, sound, voice, resting, skipped, stage>>
AGrownUpGivesTenMore == /\ resting /\ due' = FALSE /\ resting' = FALSE
                        /\ UNCHANGED <<phase, turn, spin, timer, over, away, sound, voice, skipped, stage>>
\* Hold বড়দের জন্য 2 s and answer the sum: ShareToolLink shows. It closes on বন্ধ করো, after one use (23fd7c1), after
\* 60 s, or when the tab hides (f4f75be); a blur alone leaves it open.
AGrownUpOpensTheGate == /\ stage = "closed" /\ ~away /\ ~resting /\ stage' = "open"
                        /\ UNCHANGED <<phase, turn, spin, timer, over, away, sound, voice, due, resting, skipped>>
TheGateCloses == /\ stage = "open" /\ stage' = "closed"
                   /\ UNCHANGED <<phase, turn, spin, timer, over, away, sound, voice, due, resting, skipped>>

Next == YouSpin \/ AbbuSpins \/ TheSpinnerStops \/ YouCountToWhereItStops \/ AbbuCounts \/ TheRaceEnds
        \/ YouTapAModeOrAStage \/ YouPlayAgain \/ YouPressShesh
        \/ YouLeave \/ YouComeBack \/ SoundOff \/ SoundOn
        \/ TodaysTimeRunsOut \/ AGrownUpGivesTenMore \/ AGrownUpOpensTheGate \/ TheGateCloses

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "end", "closed"} /\ turn \in {0, 1} /\ spin \in {"none", "made", "old"}
          /\ timer \in {"none", "mine", "old"} /\ over \in BOOLEAN /\ away \in BOOLEAN /\ sound \in BOOLEAN
          /\ voice \in {"quiet", "spoke"} /\ due \in BOOLEAN /\ resting \in BOOLEAN /\ skipped \in BOOLEAN
          /\ stage \in {"closed", "open"}

\* ---- the reader's rules ----
NothingRunsWhileAway == away => ~(Playing /\ turn = 1 /\ ~over)
FreshRaceStartsClean == spin # "old"
EveryFinishedRaceCounts == ~skipped
MuteMeansSilent == voice = "quiet"
RestOnlyAtBreak == resting => phase \in {"end", "closed"}
NoShareLinkDuringARace == stage = "open" => ~Playing
====
