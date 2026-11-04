---- MODULE BaicherNouka ----
\* বাইচের নৌকা: the race phase, pause (P/Esc, the bar button, a hidden tab, the river scrolled away), window focus,
\* তাল মেলাও, the river-rush sound loop and the site-wide sound switch, the result screen's restart guard, and a
\* friend's link, mirrored from tools/baicher-nouka/components/baich-game.tsx (ready, start, pause, resume, finish,
\* startCalib/endCalib, side/beat, step, the keydown handler, readFriend, the stageInView effect, the phase→stopRush
\* effect, the SoundToggle onChange, primary/restart with settled()'s 450 ms, playFromCard, pickLevel) and
\* shared/game-kit.ts useGameLoop (stops while the tab is hidden, keeps running while the window is blurred).
\* Abstractions: the race is "on" until it finishes; the 0.8 s resume grace and the 2.6 s settle of the other boats
\* are left out (no rule needs them); the race number collapses to "the friend's race or not", so starting a race
\* after a link may or may not land on their river (seedFor: only when friend.level matches).
VARIABLES phase, win, seen, sound, rush, since, link, river
vars == <<phase, win, seen, sound, rush, since, link, river>>

Phases == {"ready", "calib", "playing", "paused", "over"}
\* Time on the result screen: under 450 ms, then within the next drum beat (the gap is 1.6–2.2 s), then later.
Since == {"none", "fresh", "beat", "later", "skipped"}
\* none: no link, or its river already raced · midrace: a link arrived during a race or তাল মেলাও · owed: their river is due next.
Links == {"none", "midrace", "owed"}

Init == /\ phase = "ready" /\ win = "on" /\ seen = TRUE /\ sound = TRUE /\ rush = FALSE
        /\ since = "none" /\ link = "none" /\ river = "mine"

\* seedFor(at): the friend's river only when the friend's race number is the one being opened.
Rivers == IF link = "none" THEN {"mine"} ELSE {"mine", "theirs"}
Met(r) == IF link = "owed" /\ r = "theirs" THEN "none" ELSE link

\* start(): the waiting race on the ready screen (same river), the rush loop on (a silent stub when sound is off).
\* Reached by শুরু করো, the drum pad, the side buttons or Space; the pad sits below the river and never checks it is in view.
YouStart == /\ phase = "ready" /\ win = "on"
            /\ phase' = "playing" /\ rush' = sound /\ link' = Met(river)
            /\ UNCHANGED <<win, seen, sound, since, river>>
YouCalibrate == /\ phase = "ready" /\ win = "on" /\ seen /\ phase' = "calib"
                /\ UNCHANGED <<win, seen, sound, rush, since, link, river>>
\* endCalib(): by itself after the eighth pulse (the loop must be running), or বাদ দাও.
CalibEnds == /\ phase = "calib" /\ win # "hidden" /\ phase' = "ready"
             /\ link' = IF link = "midrace" THEN "owed" ELSE link
             /\ UNCHANGED <<win, seen, sound, rush, since, river>>
\* step(): the race reaches the finish only while the loop runs. finish() stops the rush.
YouFinish == /\ phase = "playing" /\ win # "hidden"
             /\ phase' = "over" /\ rush' = FALSE /\ since' = "fresh"
             /\ link' = IF link = "midrace" THEN "owed" ELSE link
             /\ UNCHANGED <<win, seen, sound, river>>
ResultAges == /\ phase = "over" /\ since \in {"fresh", "beat"}
              /\ since' = IF since = "fresh" THEN "beat" ELSE "later"
              /\ UNCHANGED <<phase, win, seen, sound, rush, link, river>>
\* primary()/restart() after settled(): a fresh race at once (the next race once you placed).
NewRace(tapped) == /\ phase = "over" /\ since \in {"beat", "later"} /\ win = "on" /\ seen
                   /\ \E r \in Rivers : river' = r /\ link' = Met(r)
                   /\ phase' = "playing" /\ rush' = sound
                   /\ since' = IF tapped /\ since = "beat" THEN "skipped" ELSE "none"
                   /\ UNCHANGED <<win, seen, sound>>
\* Space or Enter on the result (the keydown handler, or the focused আরেকবার button after 600 ms).
YouTapDrumKey == NewRace(TRUE)
\* A click on পরের বাইচ / আরেকবার / আবার খেলো.
YouPressAgain == NewRace(FALSE)
\* আরেকবার খেলো under the card: ready(at) on the river seedFor gives.
YouPlayFromCard == /\ phase = "over" /\ win = "on"
                   /\ \E r \in Rivers : river' = r
                   /\ phase' = "ready" /\ since' = "none"
                   /\ UNCHANGED <<win, seen, sound, rush, link>>
\* pickLevel(): refused while racing or calibrating; picking a race on purpose settles any debt to a link.
YouPickARace == /\ phase \in {"ready", "paused", "over"} /\ win = "on"
                /\ \E r \in Rivers : river' = r
                /\ phase' = "ready" /\ since' = "none" /\ rush' = FALSE
                /\ link' = "none"
                /\ UNCHANGED <<win, seen, sound>>
\* pause(): P, Esc or থামাও. The phase effect stops the rush.
YouPause == /\ phase = "playing" /\ win = "on" /\ phase' = "paused" /\ rush' = FALSE
            /\ UNCHANGED <<win, seen, sound, since, link, river>>
\* resume(): the overlay button or Space (both need the river in view), or the bar's চালিয়ে যাও (doesn't).
YouResume == /\ phase = "paused" /\ win = "on" /\ phase' = "playing" /\ rush' = sound
             /\ UNCHANGED <<win, seen, sound, since, link, river>>
\* The stageInView effect pauses a race when the river scrolls out of view (under 15% showing).
ScrollAway == /\ seen /\ win = "on" /\ seen' = FALSE
              /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
              /\ rush' = IF phase = "playing" THEN FALSE ELSE rush
              /\ UNCHANGED <<win, sound, since, link, river>>
ScrollBack == /\ ~seen /\ win = "on" /\ seen' = TRUE /\ UNCHANGED <<phase, win, sound, rush, since, link, river>>
TabHides == /\ win # "hidden" /\ win' = "hidden"
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ rush' = IF phase = "playing" THEN FALSE ELSE rush
            /\ UNCHANGED <<seen, sound, since, link, river>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ UNCHANGED <<phase, seen, sound, rush, since, link, river>>
\* No blur or focus listener.
WindowBlurs == /\ win = "on" /\ win' = "away" /\ UNCHANGED <<phase, seen, sound, rush, since, link, river>>
WindowFocuses == /\ win = "away" /\ win' = "on" /\ UNCHANGED <<phase, seen, sound, rush, since, link, river>>
\* setSoundOn(false) stops every loop; SoundToggle's onChange restarts the rush only while racing.
SoundOff == /\ sound /\ win = "on" /\ sound' = FALSE /\ rush' = FALSE /\ UNCHANGED <<phase, win, seen, since, link, river>>
SoundOn == /\ ~sound /\ win = "on" /\ sound' = TRUE /\ rush' = (phase = "playing") /\ UNCHANGED <<phase, win, seen, since, link, river>>
\* readFriend() on hashchange: mid-race or mid-তাল মেলাও it only remembers the friend; otherwise their river waits on the ready screen.
LinkOpens == /\ win = "on"
             /\ IF phase \in {"playing", "calib"}
                  THEN link' = "midrace" /\ UNCHANGED <<phase, rush, since, river>>
                  ELSE phase' = "ready" /\ river' = "theirs" /\ link' = "owed" /\ since' = "none" /\ rush' = FALSE
             /\ UNCHANGED <<win, seen, sound>>

Next == YouStart \/ YouCalibrate \/ CalibEnds \/ YouFinish \/ ResultAges \/ YouTapDrumKey \/ YouPressAgain
        \/ YouPlayFromCard \/ YouPickARace \/ YouPause \/ YouResume \/ ScrollAway \/ ScrollBack
        \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ SoundOff \/ SoundOn \/ LinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ win \in {"on", "away", "hidden"} /\ seen \in BOOLEAN /\ sound \in BOOLEAN
          /\ rush \in BOOLEAN /\ since \in Since /\ link \in Links /\ river \in {"mine", "theirs"}

\* The reader's rules.
PausedWhenHidden == phase = "playing" => win # "hidden"
PausedWhenBlurred == phase = "playing" => win # "away"
PausedWhenScrolledAway == phase = "playing" => seen
CalibWaitsWhileAway == phase = "calib" => (win # "away" /\ seen)
LoopOnlyWhenMeaningful == rush => (phase = "playing" /\ sound)
LoopComesBack == (phase = "playing" /\ sound) => rush
ResultStaysABeat == since # "skipped"
ReplayIsExact == phase \in {"playing", "paused"} => link # "owed"
====
