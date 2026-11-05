---- MODULE Sourojogot ----
EXTENDS Naturals
\* সৌরজগতের সফর: the round, the end screen and level menu, the kids' daily limit and rest screen, the parent gate
\* (hold, sum, open), আব্বু-আম্মুকে দেখাও with its picture gate, and the site header search.
\* Mirrored from tools/sourojogot/components/solar-game.tsx (begin, tapPlanet, choose, nextPlanet, finish, EndScreen, Menu),
\* shared/kids-kit.tsx (ParentGate start/stop/press, ShowParent, useKidsSession tick/atBreak/extend, RestScreen),
\* shared/game-kit.ts useLevels.record, and shared/site-shell.tsx + components/header-search.tsx (HeaderSearch).
\* A round is abstracted to its end: the last right tap (tour, sort) or the last "শেষ দেখো" (size, far). Slips, stars and
\* the gentle pace are pure functions with node tests (tests/sourojogot.test.ts) and change no state here.
\* The game has no clock, so pause and focus change nothing in it and are left out; the day's clock counts only while the
\* tab is visible and focused.
\* The kit is mirrored as of f4f75be + 23fd7c1 (2026-11-04 16:47). The kit at b51e328, checked this morning, is in
\* before-kit-fix/: its hold timer leaked on key repeat, its rest screen let Tab through, and a reload skipped the rest.
VARIABLES phase, due, resting, stage, hold, show, search
vars == <<phase, due, resting, stage, hold, show, search>>

\* phase "fresh" = a new round on screen, nothing tapped yet (a break); "late" = a round begun after today's time was up.
Phases == {"fresh", "play", "late", "done", "menu"}
Playing == phase \in {"fresh", "play", "late"}
Fresh == IF due THEN "late" ELSE "fresh"
\* begin() leaves the page's ParentGate alone, so a gate a grown-up opened stays open into the child's next round.
LeftOpen == IF stage = "open" THEN "stale" ELSE stage

Init == /\ phase = "fresh" /\ due = FALSE /\ resting = FALSE
        /\ stage = "closed" /\ hold = "none" /\ show = "off" /\ search = "never"

\* ---- the round ----
\* The first tap on a planet or a choice.
YouStartTapping == /\ phase = "fresh" /\ ~resting /\ show = "off" /\ phase' = "play"
                   /\ UNCHANGED <<due, resting, stage, hold, show, search>>
\* tapPlanet(last) / nextPlanet(last) → finish(): record stars (max), win sound, then atBreak().
YouFinishTheRound == /\ phase \in {"play", "late"} /\ ~resting
                     /\ phase' = "done" /\ resting' = due
                     /\ UNCHANGED <<due, stage, hold, show, search>>
\* EndScreen আবার খেলো → begin(level). The rest screen (a real modal since f4f75be) and ShowParent cover it.
YouPlayAgain == /\ phase = "done" /\ ~resting /\ show = "off"
                /\ phase' = Fresh /\ stage' = LeftOpen
                /\ UNCHANGED <<due, resting, hold, show, search>>
YouPressShesh == /\ phase = "done" /\ ~resting /\ show = "off" /\ phase' = "menu"
                 /\ UNCHANGED <<due, resting, stage, hold, show, search>>
\* LevelGrid in the Menu or in the সব লেভেল drawer → begin(level), from any phase, mid-round too.
YouPickALevel == /\ ~resting /\ show = "off"
                 /\ phase' = Fresh /\ stage' = LeftOpen
                 /\ UNCHANGED <<due, resting, hold, show, search>>
\* The rest screen blocks every key, tap and focus outside itself (f4f75be), so nothing behind it can start a round.

\* ---- the daily limit ----
\* useKidsSession: +10 s every 10 s while visible and focused; atBreak() compares it with the limit when a round ends,
\* and once on mount. begin() never checks it.
TodaysTimeRunsOut == /\ ~due /\ due' = TRUE
                     /\ UNCHANGED <<phase, resting, stage, hold, show, search>>
\* RestScreen → its own ParentGate → আজ আরও ১০ মিনিট → extend(10).
AGrownUpGivesTenMore == /\ resting /\ due' = FALSE /\ resting' = FALSE
                        /\ UNCHANGED <<phase, stage, hold, show, search>>
\* A reload (or opening the tool again): a fresh round, and since 23fd7c1 the rest screen at once if the time is up.
YouReload == /\ phase' = "fresh" /\ resting' = due
             /\ stage' = "closed" /\ hold' = "none" /\ show' = "off" /\ search' = "never"
             /\ UNCHANGED due

\* ---- the parent gate (বড়দের জন্য) ----
\* start(): a 2 s timeout into hold.current, only if none is running. A key auto-repeat (event.repeat) or a second
\* finger does nothing, so there is no second timer.
YouHoldTheGate == /\ stage = "closed" /\ hold = "none" /\ hold' = "held"
                  /\ UNCHANGED <<phase, due, resting, stage, show, search>>
\* stop() on pointerup / leave / cancel, keyup or blur: clears the one timer.
YouLetGoEarly == /\ hold = "held" /\ hold' = "none"
                 /\ UNCHANGED <<phase, due, resting, stage, show, search>>
\* The timer fires: a two-digit sum (10–18). "early" would be a question opened by a hold let go before 2 s.
TheHoldTimerFires == /\ hold = "held" /\ stage = "closed" /\ stage' = "ask" /\ hold' = "none"
                     /\ UNCHANGED <<phase, due, resting, show, search>>
AGrownUpAnswersTheSum == /\ stage \in {"ask", "early"} /\ stage' = "open"
                         /\ UNCHANGED <<phase, due, resting, hold, show, search>>
\* থাক / বন্ধ করো, two wrong answers, one grown-up action inside (share or print), 60 s open, or the tab hiding.
TheGateCloses == /\ stage \in {"ask", "early", "open", "stale"} /\ stage' = "closed"
                 /\ UNCHANGED <<phase, due, resting, hold, show, search>>

\* ---- আব্বু-আম্মুকে দেখাও ----
YouShowAGrownUp == /\ phase = "done" /\ ~resting /\ show = "off" /\ show' = "on"
                   /\ UNCHANGED <<phase, due, resting, stage, hold, search>>
\* ছবিটা রাখো is its own ParentGate inside ShowParent; ফোনে ছবি রাখো appears only once it is open.
AGrownUpOpensSave == /\ show = "on" /\ show' = "gate"
                     /\ UNCHANGED <<phase, due, resting, stage, hold, search>>
YouCloseShowParent == /\ show # "off" /\ show' = "off"
                      /\ UNCHANGED <<phase, due, resting, stage, hold, search>>

\* ---- the site header ----
\* HeaderSearch: a free-text box on every page; focusing it import()s the search code, typing loads tile pictures.
YouTypeInTheSearch == /\ search = "never" /\ ~resting /\ show = "off" /\ search' = "open"
                      /\ UNCHANGED <<phase, due, resting, stage, hold, show>>

Next == YouStartTapping \/ YouFinishTheRound \/ YouPlayAgain \/ YouPressShesh \/ YouPickALevel
        \/ TodaysTimeRunsOut \/ AGrownUpGivesTenMore \/ YouReload
        \/ YouHoldTheGate \/ YouLetGoEarly \/ TheHoldTimerFires \/ AGrownUpAnswersTheSum \/ TheGateCloses
        \/ YouShowAGrownUp \/ AGrownUpOpensSave \/ YouCloseShowParent
        \/ YouTypeInTheSearch

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ due \in BOOLEAN /\ resting \in BOOLEAN
          /\ stage \in {"closed", "ask", "early", "open", "stale"} /\ hold \in {"none", "held"}
          /\ show \in {"off", "on", "gate"} /\ search \in {"never", "open"}

\* ---- the reader's rules ----
RestOnlyAtBreak == resting => phase \in {"fresh", "done", "menu"}
NoRoundAfterTimeIsUp == phase # "late"
RestNeverHidesBehindShowParent == ~(resting /\ show # "off")
GateAsksOnlyAfterAFullHold == stage # "early"
ShareNeverLeftOpenForTheChild == stage # "stale"
SaveOnlyBehindTheGate == show = "gate" => phase = "done"
NoFreeTextForKids == search # "open"
NothingLoadsAfterStart == search = "never"   \* the same step breaks both: typing needs the loaded code
====
