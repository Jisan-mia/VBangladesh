---- MODULE Ghontar ----
\* ঘণ্টার সুর: the run's phase, the tune and gap timers, the level-clear screen, pause and focus, the level list, and a
\* friend's link, mirrored from tools/ghontar-sur/components/pot-game.tsx and tools/ghontar-sur/lib/game.ts.
\* A round's outcome (a right note, the whole tune, a level, a slip, the third slip) is chosen freely: no counters.
\* "pending" is the timer that will fire next: the tune playing ("tune"), the gap before it replays ("gap"),
\* or the 300 ms before the level-clear screen ("clear"). The finish timers on the result are left out.
\* "from" is the level this run started at; "sent" is the start level of the friend who sent the link (0 = no link).
EXTENDS Naturals
VARIABLES phase, pending, paused, cleared, owed, visible, focused, list, from, sent
vars == <<phase, pending, paused, cleared, owed, visible, focused, list, from, sent>>

Here == visible /\ focused
Fresh(f) == /\ phase' = "ready" /\ pending' = "none" /\ paused' = FALSE /\ cleared' = FALSE /\ owed' = FALSE /\ from' = f

Init == /\ phase = "ready" /\ pending = "none" /\ paused = FALSE /\ cleared = FALSE /\ owed = FALSE
        /\ visible = TRUE /\ focused = TRUE /\ list = FALSE /\ from = 1 /\ sent = 0

\* begin(): শুরু করো, a pot or Enter on the ready shelf, and আরেকবার on the result. reset() then playTune().
YouStart == /\ Here /\ ~paused /\ ~cleared /\ phase \in {"ready", "over"}
            /\ phase' = "listen" /\ pending' = "tune" /\ cleared' = FALSE /\ owed' = FALSE
            /\ UNCHANGED <<paused, visible, focused, list, from, sent>>
\* playTune's last timer: yourTurn().
TheTuneEnds == /\ pending = "tune" /\ pending' = "none" /\ phase' = IF phase = "listen" THEN "play" ELSE phase
               /\ UNCHANGED <<paused, cleared, owed, visible, focused, list, from, sent>>
\* hitPot during your turn (not while paused or on the clear screen), by outcome.
Tap == Here /\ phase = "play" /\ ~paused /\ ~cleared
YouRepeatTheTuneOrSlip == /\ Tap /\ phase' = "listen" /\ pending' = "gap"
                          /\ UNCHANGED <<paused, cleared, owed, visible, focused, list, from, sent>>
YouClearALevel == /\ Tap /\ phase' = "listen" /\ pending' = "clear" /\ owed' = TRUE
                  /\ UNCHANGED <<paused, cleared, visible, focused, list, from, sent>>
YouSlipTheThirdTime == /\ Tap /\ phase' = "over" /\ pending' = "none"
                       /\ UNCHANGED <<paused, cleared, owed, visible, focused, list, from, sent>>
\* later(() => playTune(next), 900 or 1700).
TheTuneReplays == /\ pending = "gap" /\ pending' = "tune"
                  /\ UNCHANGED <<phase, paused, cleared, owed, visible, focused, list, from, sent>>
\* later(() => setCleared(...), 300): the clear screen, the fair bell, the star chimes.
TheClearScreenShows == /\ pending = "clear" /\ pending' = "none" /\ cleared' = TRUE /\ owed' = FALSE
                       /\ UNCHANGED <<phase, paused, visible, focused, list, from, sent>>
\* nextLevel(): setCleared(null), playTune(). It doesn't touch paused.
YouPressNextLevel == /\ Here /\ cleared /\ cleared' = FALSE /\ pending' = "tune"
                     /\ UNCHANGED <<phase, paused, owed, visible, focused, list, from, sent>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, pending, paused, cleared, owed, visible, list, from, sent>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, pending, paused, cleared, owed, visible, list, from, sent>>
\* hide(): during listen or play, clearTimers() and pause.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ IF phase \in {"listen", "play"} THEN pending' = "none" /\ paused' = TRUE ELSE UNCHANGED <<pending, paused>>
            /\ UNCHANGED <<phase, cleared, owed, list, from, sent>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, pending, paused, cleared, owed, list, from, sent>>
\* resume() (চালিয়ে যাও, or Enter): unpause, drop the clear screen, listen() and playTune().
\* A clear screen that was skipped is gone for good once the tune restarts (owed is dropped).
YouResume == /\ Here /\ paused /\ paused' = FALSE /\ cleared' = FALSE /\ owed' = FALSE
             /\ phase' = (IF phase = "over" THEN phase ELSE "listen") /\ pending' = "tune"
             /\ UNCHANGED <<visible, focused, list, from, sent>>
\* The সব লেভেল list (a <details>).
YouOpenTheLevels == /\ Here /\ ~list /\ list' = TRUE
                    /\ UNCHANGED <<phase, pending, paused, cleared, owed, visible, focused, from, sent>>
YouCloseTheLevels == /\ Here /\ list /\ list' = FALSE
                     /\ UNCHANGED <<phase, pending, paused, cleared, owed, visible, focused, from, sent>>
\* A level in the list: setUp(seed, level).
YouPickALevel == /\ Here /\ list /\ \E f \in 1..2 : Fresh(f)
                 /\ sent' = 0 /\ UNCHANGED <<visible, focused, list>>
\* readFriend(): the link holds the seed and the score, and setUp(seed) starts from level 1.
\* The sender may have started from any level.
AFriendsLinkOpens == /\ Here /\ \E s \in 1..2 : sent' = s /\ Fresh(1)
                     /\ UNCHANGED <<visible, focused, list>>

Next == YouStart \/ TheTuneEnds \/ YouRepeatTheTuneOrSlip \/ YouClearALevel \/ YouSlipTheThirdTime \/ TheTuneReplays
        \/ TheClearScreenShows \/ YouPressNextLevel \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ YouOpenTheLevels \/ YouCloseTheLevels \/ YouPickALevel \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "listen", "play", "over"} /\ pending \in {"none", "tune", "gap", "clear"}
          /\ paused \in BOOLEAN /\ cleared \in BOOLEAN /\ owed \in BOOLEAN /\ visible \in BOOLEAN
          /\ focused \in BOOLEAN /\ list \in BOOLEAN /\ from \in 1..2 /\ sent \in 0..2

\* The reader's rules.
\* A run in progress is paused while its tab is hidden.
PausedWhenHidden == (~visible /\ phase \in {"listen", "play"}) => paused
\* ... and while you're in another window: the tune doesn't play to an empty room.
PausedWhenBlurred == (~focused /\ phase = "listen") => paused
\* Paused means nothing is scheduled: no tune, no gap, no clear screen coming.
PausedMeansSilent == paused => pending = "none"
\* The tune only plays while you're on the page.
NoProgressWhileAway == pending = "tune" => Here
\* While the level list is open, the tune doesn't play on its own.
ChoiceFreezesPlay == list => pending # "tune"
\* Every level you clear gets its clear screen: the bell, the stars, পরের লেভেল.
EveryClearIsShown == owed => pending = "clear"
\* The result has nothing still to play.
NothingAfterTheCard == phase = "over" => pending = "none"
\* A friend's link starts you where the friend started.
ReplayIsExact == (sent # 0 /\ phase = "ready") => from = sent
====
