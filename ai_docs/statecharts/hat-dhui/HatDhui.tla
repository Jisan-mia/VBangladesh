---- MODULE HatDhui ----
\* হাত ধুই, দাঁত মাজি (kids, 3–8): the three tabs, the timed wash/brush routine, the কখন ধোব quiz, the 700 ms
\* finish timer, window focus, the screen wake lock, the kids' daily limit and rest screen, the parent gate,
\* "আব্বু-আম্মুকে দেখাও", and the site frame around the game. Mirrored from (as of 2026-11-04, branch games-to-the-bar):
\*   tools/hat-dhui/components/hat-dhui-game.tsx  (open, pick, finish, the done/idle screens, ShowParent, RestScreen, gate)
\*   tools/hat-dhui/components/routine.tsx        (ready/run/pause/end, wake lock, setTimeout(() => done.current(), 700))
\*   tools/hat-dhui/components/quiz.tsx           (choose, next → onDone)
\*   shared/game-kit.ts useGameLoop               (the clock stops on blur and while hidden; Routine state stays "run")
\*   shared/kids-kit.tsx at 23fd7c1               (useKidsSession: counts only a focused, visible tab; opens on the
\*                                                 rest screen past the limit; RestScreen is a real modal; ParentGate
\*                                                 shuts after one action, after 60 s, or when the tab hides)
\*   shared/site-shell.tsx PageFrame              (header search and nav, related-tools grid, footer: plain links)
\* Left out: the six wash steps / seven brush zones (one "ring fills" step stands for them), the quiz's six questions
\* (one "answered" state), star counts (shared recordLevel keeps the max), the slow toggle, the sound switch (every
\* tone goes through game-sound's soundOn() gate and speech through `say`, which checks soundOn()).
VARIABLES mode, phase, rstate, pending, away, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray
vars == <<mode, phase, rstate, pending, away, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray>>

Modes == {"hat", "dat", "kokhon"}
Routine == mode \in {"hat", "dat"}
Covered == resting \/ showing                 \* RestScreen and ShowParent are position:fixed, inset 0, z-index 50
OnPage == out = "none"
Here == OnPage /\ away = "here"          \* a tap or click lands only on a visible, focused page
Calm == pending = "none"                 \* the 0.7 s finish window is too short for anything but a tap on a tab or শুরু
Running == phase = "play" /\ Routine /\ rstate = "run"

Init == /\ mode = "hat" /\ phase = "play" /\ rstate = "ready" /\ pending = "none" /\ away = "here" /\ awake = FALSE
        /\ fake = FALSE /\ limit \in BOOLEAN /\ resting = limit /\ gate = "closed"   \* past today's limit it opens resting
        /\ showing = FALSE /\ out = "none" /\ movedAway = FALSE /\ net = FALSE /\ stray = FALSE

\* open(id): a fresh Routine or Quiz (new key). The old Routine unmounts and releases the wake lock,
\* but its 700 ms finish timer is never cleared, so `pending` stays.
Open(m) == /\ mode' = m /\ phase' = "play" /\ rstate' = "ready" /\ fake' = FALSE /\ awake' = FALSE
           /\ UNCHANGED <<pending, away, limit, resting, gate, showing, out, movedAway, net, stray>>
YouPickATab == /\ Here /\ ~Covered /\ \E m \in Modes : Open(m)
YouPressPlayAgain == /\ Here /\ ~Covered /\ phase = "done" /\ Open(mode)

\* Routine start() and resume(): startChime, wakeLock.request, run. pause(): release the lock.
YouPressStart == /\ Here /\ ~Covered /\ phase = "play" /\ Routine /\ rstate = "ready"
                 /\ rstate' = "run" /\ awake' = (away # "hidden")
                 /\ UNCHANGED <<mode, phase, pending, away, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
YouPause == /\ Calm /\ Here /\ ~Covered /\ Running /\ rstate' = "pause" /\ awake' = FALSE
            /\ UNCHANGED <<mode, phase, pending, away, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
YouResume == /\ Calm /\ Here /\ ~Covered /\ phase = "play" /\ Routine /\ rstate = "pause" /\ rstate' = "run" /\ awake' = (away # "hidden")
             /\ UNCHANGED <<mode, phase, pending, away, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
\* useGameLoop steps only while the tab is visible and the window focused (the guard below);
\* at.done → state "end", release the lock, arm the 700 ms timer with this Routine's onDone.
TheRingFills == /\ Running /\ away = "here"
                /\ pending = "none"      \* a routine lasts 20 s or 2 min, so an older 700 ms timer has always fired by now
                /\ movedAway' = (movedAway \/ away # "here")
                /\ rstate' = "end" /\ awake' = FALSE /\ pending' = mode
                /\ UNCHANGED <<mode, phase, away, fake, limit, resting, gate, showing, out, net, stray>>
\* setTimeout(() => done.current(), 700): finish() with the closure of the Routine that armed it. It records that
\* routine's level, but shows the done screen for whatever `mode` is now, unmounts whatever runs (lock released),
\* and calls atBreak().
TheFinishTimerFires == /\ pending # "none"
                       /\ fake' = ~(phase = "play" /\ rstate = "end" /\ pending = mode)   \* the round on screen is the one that ended
                       /\ pending' = "none" /\ phase' = "done" /\ resting' = limit /\ awake' = FALSE
                       /\ UNCHANGED <<mode, rstate, away, limit, gate, showing, out, movedAway, net, stray>>

\* The quiz, folded to one solved state: choose() the right pictures, then "দেখো কী শিখলে" → onDone → finish().
YouAnswerTheQuiz == /\ Calm /\ Here /\ ~Covered /\ phase = "play" /\ mode = "kokhon" /\ rstate = "ready" /\ rstate' = "end"
                    /\ UNCHANGED <<mode, phase, pending, away, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
YouSeeWhatYouLearned == /\ Calm /\ Here /\ ~Covered /\ phase = "play" /\ mode = "kokhon" /\ rstate = "end"
                        /\ phase' = "done" /\ resting' = limit
                        /\ UNCHANGED <<mode, rstate, pending, away, awake, fake, limit, gate, showing, out, movedAway, net, stray>>

YouPressShesh == /\ Calm /\ Here /\ ~Covered /\ phase = "done" /\ phase' = "idle"
                 /\ UNCHANGED <<mode, rstate, pending, away, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
YouShowAParent == /\ Calm /\ Here /\ ~Covered /\ phase = "done" /\ showing' = TRUE
                  /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, limit, resting, gate, out, movedAway, net, stray>>
ShowingIsOver == /\ Calm /\ Here /\ showing /\ showing' = FALSE
                 /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, limit, resting, gate, out, movedAway, net, stray>>

\* Window and tab, modelled only during a routine (the only place the code reacts to them; elsewhere nothing is timed).
\* useGameLoop cancels its frame on blur and on hide; the Routine's own state is untouched.
\* The browser drops the wake lock on hide; Routine's visibilitychange effect takes it back while state is "run".
WindowBlurs == /\ Calm /\ OnPage /\ away = "here" /\ phase = "play" /\ Routine /\ away' = "blurred"
               /\ UNCHANGED <<mode, phase, rstate, pending, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
WindowFocuses == /\ Calm /\ OnPage /\ away = "blurred" /\ away' = "here"
                 /\ UNCHANGED <<mode, phase, rstate, pending, awake, fake, limit, resting, gate, showing, out, movedAway, net, stray>>
TabHides == /\ Calm /\ OnPage /\ away # "hidden" /\ phase = "play" /\ Routine /\ away' = "hidden" /\ awake' = FALSE
            /\ gate' = "closed"      \* an open ParentGate shuts on hide
            /\ UNCHANGED <<mode, phase, rstate, pending, fake, limit, resting, showing, out, movedAway, net, stray>>
TabShows == /\ Calm /\ OnPage /\ away = "hidden" /\ away' = "here" /\ awake' = Running
            /\ UNCHANGED <<mode, phase, rstate, pending, fake, limit, resting, gate, showing, out, movedAway, net, stray>>

\* useKidsSession: every 10 s of focused, visible time is saved under ektukhani-kids-time; the limit can pass mid-round.
TheDailyLimitPasses == /\ OnPage /\ away = "here" /\ ~limit /\ limit' = TRUE
                       /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, resting, gate, showing, out, movedAway, net, stray>>

\* ParentGate (2 s hold + a two-digit sum in words). gate: "closed", "parent" (open, a parent holds the phone),
\* "child" (still open after the phone goes back without a grown-up action: up to 60 s until it shuts itself).
AParentOpensTheGate == /\ Calm /\ Here /\ gate = "closed" /\ gate' = "parent"
                       /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, limit, resting, showing, out, movedAway, net, stray>>
TheParentHandsThePhoneBack == /\ Calm /\ Here /\ gate = "parent" /\ gate' = "child"
                              /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, limit, resting, showing, out, movedAway, net, stray>>
\* বন্ধ করো, two wrong sums, or the gate's own 60 s timer.
SomeoneClosesTheGate == /\ Calm /\ Here /\ gate # "closed" /\ gate' = "closed"
                        /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, limit, resting, showing, out, movedAway, net, stray>>
\* RestScreen → its ParentGate → "আজ আরও ১০ মিনিট" → extend(10).
SomeoneGivesTenMinutes == /\ Calm /\ Here /\ resting /\ gate # "closed" /\ resting' = FALSE /\ limit' = FALSE
                          /\ gate' = "closed"      \* one grown-up action, then the gate shuts
                          /\ UNCHANGED <<mode, phase, rstate, pending, away, awake, fake, showing, out, movedAway, net, stray>>
\* ShareToolLink (navigator.share / clipboard) or "ফোনে ছবি রাখো": both sit inside an open gate.
\* Once the page hands off (share sheet, or another page), nothing on it matters: every other variable is
\* parked at its start value so the model keeps one state per way out.
Leave(kind) == /\ out' = kind /\ mode' = "hat" /\ phase' = "play" /\ rstate' = "ready" /\ pending' = "none" /\ away' = "here"
               /\ awake' = FALSE /\ fake' = FALSE /\ limit' = FALSE /\ resting' = FALSE /\ gate' = "closed"
               /\ showing' = FALSE /\ UNCHANGED <<movedAway, net, stray>>
\* ShareToolLink (navigator.share / clipboard) or "ফোনে ছবি রাখো": both sit inside an open gate.
SomeoneShares == /\ Calm /\ Here /\ gate # "closed" /\ Leave(IF gate = "parent" THEN "parentShared" ELSE "childShared")
\* PageFrame: header search and nav, the related-tools grid (the adult flagship first) and the footer, with no gate.
TheChildTapsASiteLink == /\ Calm /\ Here /\ ~Covered /\ gate # "parent" /\ Leave("childLeft")
Gone == ~OnPage /\ UNCHANGED vars

Next == YouPickATab \/ YouPressPlayAgain \/ YouPressStart \/ YouPause \/ YouResume \/ TheRingFills \/ TheFinishTimerFires
        \/ YouAnswerTheQuiz \/ YouSeeWhatYouLearned \/ YouPressShesh \/ YouShowAParent \/ ShowingIsOver
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ TheDailyLimitPasses
        \/ AParentOpensTheGate \/ TheParentHandsThePhoneBack \/ SomeoneClosesTheGate
        \/ SomeoneGivesTenMinutes \/ SomeoneShares \/ TheChildTapsASiteLink \/ Gone

Spec == Init /\ [][Next]_vars

TypeOK == /\ mode \in Modes /\ phase \in {"play", "done", "idle"} /\ rstate \in {"ready", "run", "pause", "end"}
          /\ pending \in {"none", "hat", "dat"} /\ away \in {"here", "blurred", "hidden"} /\ awake \in BOOLEAN
          /\ fake \in BOOLEAN /\ limit \in BOOLEAN /\ resting \in BOOLEAN
          /\ gate \in {"closed", "parent", "child"} /\ showing \in BOOLEAN
          /\ out \in {"none", "parentShared", "childShared", "childLeft"} /\ movedAway \in BOOLEAN
          /\ net \in BOOLEAN /\ stray \in BOOLEAN

\* What a child aged 3–5 must press on each screen, and which of those carry a picture or a sound cue.
OnScreen == IF Covered \/ ~OnPage THEN {} ELSE
            CASE phase = "done" -> {"tab", "again", "shesh", "showParent"}
              [] phase = "idle" -> {"tab"}
              [] mode = "kokhon" -> IF rstate = "end" THEN {"tab", "next"} ELSE {"tab", "choice"}
              [] rstate = "ready" -> {"tab", "start"}
              [] rstate \in {"run", "pause"} -> {"tab", "pauseButton"}
              [] OTHER -> {"tab"}
Pictured == {"tab", "start", "choice", "next"}   \* tab icons, ▶ + ghost finger, choice pictures, the → arrow

\* The reader's rules.
\* A break: between rounds, or before a routine or the quiz has begun (opening the game past the limit).
RestOnlyAtBreak == resting => (~fake /\ (phase # "play" \/ rstate = "ready"))
ResultMatchesPlay == phase = "done" => ~fake
PausedWhenHidden == (away = "hidden" /\ phase = "play" /\ Routine) => rstate # "run"
PausedWhenBlurred == (away = "blurred" /\ phase = "play" /\ Routine) => rstate # "run"
NoProgressWhileAway == ~movedAway
ScreenAwakeOnlyWhileRunning == awake => (Running /\ away # "hidden")
ScreenAwakeWhileRunning == (Running /\ away # "hidden") => awake
NoShareForKids == out # "childShared"
ParentGate == out # "childLeft"
GateClosesBehindParent == gate # "child"
NoNetwork == ~net          \* no action calls fetch, sendBeacon, /api/* or share-client: none exists in the code
NoChildData == ~stray      \* the only writes are ektukhani-levels-hat-dhui, ektukhani-kids-time and the two settings
NoReadingNeeded == OnScreen \subseteq Pictured
====
