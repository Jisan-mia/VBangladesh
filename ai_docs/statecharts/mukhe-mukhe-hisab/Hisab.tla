---- MODULE Hisab ----
\* মুখে মুখে হিসাব after the rewrite: the round and its two pausable clocks, pause and focus, the level sheet, the
\* sums (dealt lazily), the miss penalty and its how-line, the end screen's keys, the cheer, levels and the friend link.
\* Mirrored from tools/mukhe-mukhe-hisab/lib/session.ts (begin, tick, right, wrong, pause, resume), lib/game.ts (sumAt),
\* lib/save.ts (readOpen, openAfter) and components/hisab-play.tsx (the listeners, answer, finalize, load, the key handler).
\* Abstractions: time is one abstract second (Full = 1: a pause either keeps it or loses it); a miss's penalty either
\* leaves time (the how-line shows) or takes the last of it (the round ends). `left` is what the round will still give you; `owed` is a
\* ghost, the time you should still have, which only a running clock or a penalty may spend. `dealt` says the sum the
\* screen shows exists (sumAt deals more when the round gets there). `open` is your own open level (the
\* ektukhani-mukhe-mukhe-hisab-open key), `c1` whether level 1 has stars. Levels 2 and 3 act alike here, so `level` and
\* `open` are 1 or 2, and 2 also stands for the friend's level 3. `key` is a key held down (Enter or Space) and `skipped` a ghost that
\* turns TRUE if the end screen ever moved on by itself under a held key.
EXTENDS Naturals

Link == 3
Full == 1

VARIABLES phase, why, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped
vars == <<phase, why, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>

Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Here == win = "here"
Started == phase \in {"opening", "play", "lesson"}
RoundRuns == phase = "play" /\ why = "none"            \* session.roundRuns
PhaseRuns == phase \in {"opening", "lesson"} /\ why = "none"
CanPick(l) == l <= open \/ (link # 0 /\ l = 2)        \* canPick: to <= open || to === visit

Init == /\ phase = "ready" /\ why = "none" /\ win = "here"
        /\ left = Full /\ owed = Full /\ dealt = TRUE /\ cheer = FALSE
        /\ level = 1 /\ open = 1 /\ c1 = FALSE /\ link = 0 /\ key = "up" /\ skipped = FALSE

Fresh == /\ left' = Full /\ owed' = Full /\ dealt' = TRUE /\ cheer' = FALSE /\ why' = "none"

\* start(): the cash box, or a fresh Enter on the start card. session.begin → opening (the drawer).
YouStart == /\ Here /\ phase = "ready"
            /\ phase' = "opening"
            /\ UNCHANGED <<why, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>
\* tick(): the drawer's phase clock runs out; the first sum is up (sumAt deals it).
TheDrawerOpens == /\ phase = "opening" /\ PhaseRuns
                  /\ phase' = "play" /\ dealt' = TRUE
                  /\ UNCHANGED <<why, win, left, owed, cheer, level, open, c1, link, key, skipped>>
\* The round clock: only in play, only while nothing pauses it.
ASecondPasses == /\ RoundRuns /\ left > 0
                 /\ left' = left - 1 /\ owed' = owed - 1
                 /\ UNCHANGED <<phase, why, win, dealt, cheer, level, open, c1, link, key, skipped>>
\* tick(): roundMs >= budget → over. finalize() records once; the cheer is scheduled on the audio clock.
TimeRunsOut == /\ RoundRuns /\ left = 0
               /\ phase' = "over"
               /\ \/ /\ open' = open /\ c1' = c1 /\ cheer' = FALSE                          \* no stars
                  \/ /\ open' = IF level <= open THEN Max(open, Min(2, level + 1)) ELSE open   \* openAfter
                     /\ c1' = (c1 \/ level = 1) /\ cheer' = TRUE
               /\ UNCHANGED <<why, win, left, owed, dealt, level, link, key, skipped>>
\* answer() on pointerdown or a fresh key: right → session.right, the next sum dealt (never undefined).
YouAnswerRight == /\ Here /\ RoundRuns /\ dealt
                  /\ dealt' = TRUE
                  /\ UNCHANGED <<phase, why, win, left, owed, cheer, level, open, c1, link, key, skipped>>
\* wrong → session.wrong: the penalty comes off the budget (and the ghost); the how-line holds the clock, or the round ends.
YouAnswerWrong == /\ Here /\ RoundRuns /\ dealt /\ left > 0
                  /\ \/ /\ phase' = "lesson" /\ UNCHANGED <<left, owed, cheer, open, c1>>
                     \/ /\ left' = 0 /\ owed' = 0 /\ phase' = "over" /\ cheer' = FALSE /\ UNCHANGED <<open, c1>>
                  /\ UNCHANGED <<why, win, dealt, level, link, key, skipped>>
\* tick(): the how-line's phase clock runs out; the next sum.
TheLessonEnds == /\ phase = "lesson" /\ PhaseRuns
                 /\ phase' = "play" /\ dealt' = TRUE
                 /\ UNCHANGED <<why, win, left, owed, cheer, level, open, c1, link, key, skipped>>
\* The cheer (ident and StarReveal chimes) is on the audio clock: it sounds until it ends or load()'s silenceScheduled()
\* cuts it, so `cheer` stays TRUE for the end screen and only a load clears it.
\* session.pause("away"): window blur, a hidden tab and the player's menu all run pauseFor("away"). A sheet outranks it.
Away == IF Started /\ why = "none" THEN "away" ELSE why
WindowBlurs == /\ Here /\ win' = "away" /\ why' = Away /\ key' = "up"   \* the player releases held keys on blur
               /\ UNCHANGED <<phase, left, owed, dealt, cheer, level, open, c1, link, skipped>>
WindowFocuses == /\ win = "away" /\ win' = "here"
                 /\ UNCHANGED <<phase, why, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>
TabHides == /\ win \in {"here", "away"} /\ win' = "hidden" /\ why' = Away /\ key' = "up"
            /\ UNCHANGED <<phase, left, owed, dealt, cheer, level, open, c1, link, skipped>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<phase, why, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>
\* resumeFrom("away"): চালিয়ে যাও in the menu, the cash box cover, or a fresh Enter. Only ends an away pause.
YouResume == /\ Here /\ why = "away"
             /\ why' = "none"
             /\ UNCHANGED <<phase, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>
\* openSheet / closeSheet: the level badge or সব লেভেল.
YouOpenTheSheet == /\ Here /\ why # "sheet"
                   /\ why' = IF Started THEN "sheet" ELSE why
                   /\ UNCHANGED <<phase, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>
YouCloseTheSheet == /\ Here /\ why = "sheet"
                    /\ why' = "none"
                    /\ UNCHANGED <<phase, win, left, owed, dealt, cheer, level, open, c1, link, key, skipped>>

\* load(level): silenceScheduled() (the cheer goes), a fresh deck and session, the sheet closed. From the sheet, the start
\* card's arrows, or an end-screen choice (a button, or a fresh 1–3/Enter at least 0.4 s after the end shows).
YouStartALevel(l) == /\ Here /\ CanPick(l)
                     /\ level' = Min(2, l) /\ phase' = "ready" /\ Fresh
                     /\ UNCHANGED <<win, open, c1, link, key, skipped>>
\* keyHandler on the end screen: a keydown moves on only when it is fresh (!event.repeat, after the end showed); a held
\* key's repeats change nothing. The ghost `skipped` records any move on under a key held from before.
AKeyDownOnTheEnd == /\ Here /\ phase = "over" /\ why = "none"
                    /\ IF key = "up"
                         THEN /\ phase' = "ready" /\ Fresh /\ key' = "held"
                         ELSE UNCHANGED <<phase, left, owed, dealt, cheer, why, key>>
                    /\ skipped' = (skipped \/ (key = "held" /\ phase' # "over"))
                    /\ UNCHANGED <<win, level, open, c1, link>>
\* Only a key held as the round ends can matter (start, resume and the pad all need a fresh press too), so it goes down in the last moment.
YouHoldAKey == /\ Here /\ phase = "play" /\ left = 0 /\ key = "up" /\ key' = "held"
               /\ UNCHANGED <<phase, why, win, left, owed, dealt, cheer, level, open, c1, link, skipped>>
YouLetGo == /\ key = "held" /\ key' = "up"
            /\ UNCHANGED <<phase, why, win, left, owed, dealt, cheer, level, open, c1, link, skipped>>
\* fromHash() on boot or hashchange: a valid link to level 3 → setVisit(3), load(3, seed). Your open level is untouched.
YouOpenAFriendLink == /\ Here /\ link = 0
                      /\ link' = Link /\ level' = 2 /\ phase' = "ready" /\ Fresh
                      /\ UNCHANGED <<win, open, c1, key, skipped>>

Next == \/ YouStart \/ TheDrawerOpens \/ ASecondPasses \/ TimeRunsOut \/ YouAnswerRight \/ YouAnswerWrong \/ TheLessonEnds
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ YouOpenTheSheet \/ YouCloseTheSheet \/ (\E l \in 1..2 : YouStartALevel(l)) \/ AKeyDownOnTheEnd
        \/ YouHoldAKey \/ YouLetGo \/ YouOpenAFriendLink

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "opening", "play", "lesson", "over"} /\ why \in {"none", "away", "sheet"}
          /\ win \in {"here", "away", "hidden"} /\ left \in 0..Full /\ owed \in 0..Full /\ dealt \in BOOLEAN
          /\ cheer \in BOOLEAN /\ level \in 1..2 /\ open \in 1..2 /\ c1 \in BOOLEAN /\ link \in {0, Link}
          /\ key \in {"up", "held"} /\ skipped \in BOOLEAN

\* ---- the reader's rules ----
\* NoProgressWhileAway + PausedWhenBlurred: the 60 seconds, the drawer and the how-line never run in another window or tab.
ClockStillWhileAway == (RoundRuns \/ PhaseRuns) => Here
PausedWhenHidden == (win = "hidden" /\ Started) => why # "none"
\* A pause (any number of them) keeps every second you had: only the running clock or a miss spends time.
PauseKeepsYourTime == left = owed
\* The round never runs out of sums before the clock does.
SumsOutlastTheClock == phase \in {"play", "lesson"} => dealt
\* LevelPickerFreezesPlay: with সব লেভেল open, nothing counts down.
LevelPickerFreezesPlay == why = "sheet" => ~(RoundRuns \/ PhaseRuns)
\* NoCheerAfterYouMoveOn: the win sound and confetti play only on that round's end screen.
NoCheerAfterYouMoveOn == cheer => phase = "over"
\* ResultNeedsFreshPress: a key held through the end never skips the end screen.
ResultNeedsFreshPress == ~skipped
\* A friend's link opens its own level, not the ones before it; your saved open level only grows from your own clears.
LinkOpensOnlyItsLevel == open >= 2 => c1
SavedUnlockIsEarned == open >= 2 => c1
UnlockNeverShrinks == [][open' >= open /\ (c1 => c1')]_vars
\* A pause only starts from your leaving (or the sheet), and only চালিয়ে যাও ends an away pause.
OnlyResumeEndsAPause == [][(why = "away" /\ why' = "none") => (phase' = phase => Here)]_vars
====
