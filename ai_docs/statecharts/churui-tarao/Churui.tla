---- MODULE Churui ----
\* চড়ুই তাড়াও: the afternoon, pause, window focus, the সব লেভেল list, পরের লেভেল / আবার খেলো,
\* the celebration timer, and a friend's link, mirrored from tools/churui-tarao/components/churui-game.tsx.
\* There is no held input (every clap is one tap or one key press) and no sound loop, only one-shot sounds.
VARIABLES phase, win, ateAway, fanfare, picker, link, lvl, seed
vars == <<phase, win, ateAway, fanfare, picker, link, lvl, seed>>

Phases == {"ready", "playing", "paused", "over"}
\* win: "here" (the page has focus), "away" (another window has focus, the tab still shows), "hidden".
\* lvl: is the field on screen the friend's field ("theirs") or another ("other")? seed: whose sparrows are on it.
SeedFor(l) == IF link = "friend" /\ l = "theirs" THEN "theirs" ELSE "fresh"

Init == /\ phase = "ready" /\ win = "here" /\ ateAway = FALSE /\ fanfare = FALSE /\ picker = FALSE
        /\ link \in {"none", "friend"}
        /\ lvl = (IF link = "friend" THEN "theirs" ELSE "other")
        /\ seed = SeedFor(lvl)

\* useGameLoop runs while playing; rAF keeps firing in a blurred window and stops only when the tab hides.
Ticking == phase = "playing" /\ win # "hidden"

\* start() from the ready screen: a tap on the field, শুরু করো, Space or an arrow. The waiting game keeps its seed.
YouStart == /\ phase = "ready" /\ win = "here"
            /\ phase' = "playing"
            /\ UNCHANGED <<win, ateAway, fanfare, picker, link, lvl, seed>>
\* step(): stepGame nibbles grain. Records whether it happened while another window had focus.
SparrowsEat == /\ Ticking
               /\ ateAway' = (ateAway \/ win = "away")
               /\ UNCHANGED <<phase, win, fanfare, picker, link, lvl, seed>>
\* finish(): dusk or the grain is gone. Stars > 0 queue sfx.good / levelUp+confetti in timers.current.
RoundEnds == /\ Ticking
             /\ phase' = "over"
             /\ fanfare' \in {fanfare, TRUE}   \* a pass (stars > 0) queues one more; an older one still waits
             /\ ateAway' = (ateAway \/ win = "away")
             /\ UNCHANGED <<win, picker, link, lvl, seed>>
\* The queued timeout fires.
FanfarePlays == /\ fanfare /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, win, ateAway, picker, link, lvl, seed>>
\* pause(): P, Esc or থামাও.
YouPause == /\ phase = "playing" /\ win = "here"
            /\ phase' = "paused"
            /\ UNCHANGED <<win, ateAway, fanfare, picker, link, lvl, seed>>
\* চালিয়ে যাও (overlay or bar) or Space.
YouResume == /\ phase = "paused" /\ win = "here"
             /\ phase' = "playing"
             /\ UNCHANGED <<win, ateAway, fanfare, picker, link, lvl, seed>>
\* visibilitychange: pause() only.
TabHides == /\ win # "hidden"
            /\ win' = "hidden"
            /\ phase' = (IF phase = "playing" THEN "paused" ELSE phase)
            /\ UNCHANGED <<ateAway, fanfare, picker, link, lvl, seed>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<phase, ateAway, fanfare, picker, link, lvl, seed>>
\* No blur or focus listener in the game.
WindowBlurs == /\ win = "here" /\ win' = "away"
               /\ UNCHANGED <<phase, ateAway, fanfare, picker, link, lvl, seed>>
WindowFocuses == /\ win = "away" /\ win' = "here"
                 /\ UNCHANGED <<phase, ateAway, fanfare, picker, link, lvl, seed>>
\* <details className="ct-levels">: opening it does nothing to the game.
YouOpenLevels == /\ ~picker /\ win = "here" /\ picker' = TRUE
                 /\ UNCHANGED <<phase, win, ateAway, fanfare, link, lvl, seed>>
YouCloseLevels == /\ picker /\ win = "here" /\ picker' = FALSE
                  /\ UNCHANGED <<phase, win, ateAway, fanfare, link, lvl, seed>>
\* pick() → setUp(): clears timers, a fresh field on the ready screen (the friend's seed on their level).
YouPickLevel == /\ picker /\ win = "here"
                /\ phase' = "ready" /\ fanfare' = FALSE
                /\ lvl' \in (IF link = "friend" THEN {"theirs", "other"} ELSE {"other"})
                /\ seed' = SeedFor(lvl')
                /\ UNCHANGED <<win, ateAway, picker, link>>
\* পরের লেভেল (shown after a pass; the model lets it show after any round): pick(level + 1), the same setUp().
YouGoNext == /\ phase = "over" /\ win = "here"
             /\ phase' = "ready" /\ fanfare' = FALSE
             /\ lvl' \in (IF link = "friend" THEN {"theirs", "other"} ELSE {"other"})
             /\ seed' = SeedFor(lvl')
             /\ UNCHANGED <<win, ateAway, picker, link>>
\* আবার খেলো / আরেকবার: start() from "over" makes a new game but leaves timers.current alone.
YouPlayAgain == /\ phase = "over" /\ win = "here"
                /\ phase' = "playing"
                /\ seed' = SeedFor(lvl)
                /\ UNCHANGED <<win, ateAway, fanfare, picker, link, lvl>>
\* hashchange → readFriend(): mid-round only the banner changes; otherwise the friend's field waits on the ready screen.
\* It does not clear timers.current.
FriendLinkOpens == /\ link = "none" /\ win = "here"
                   /\ link' = "friend"
                   /\ IF phase = "playing"
                        THEN /\ lvl' \in {"theirs", "other"} /\ UNCHANGED <<phase, seed>>
                        ELSE /\ phase' = "ready" /\ lvl' = "theirs" /\ seed' = "theirs"
                   /\ UNCHANGED <<win, ateAway, fanfare, picker>>

Next == YouStart \/ SparrowsEat \/ RoundEnds \/ FanfarePlays \/ YouPause \/ YouResume \/ TabHides \/ TabShows
        \/ WindowBlurs \/ WindowFocuses \/ YouOpenLevels \/ YouCloseLevels \/ YouPickLevel \/ YouGoNext
        \/ YouPlayAgain \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ win \in {"here", "away", "hidden"} /\ ateAway \in BOOLEAN /\ fanfare \in BOOLEAN
          /\ picker \in BOOLEAN /\ link \in {"none", "friend"} /\ lvl \in {"theirs", "other"}
          /\ seed \in {"fresh", "theirs"}

\* The reader's rules.
PausedWhenHidden == win = "hidden" => phase # "playing"
PausedWhenBlurred == win = "away" => phase # "playing"
NoProgressWhileAway == ~ateAway
ChoiceFreezesPlay == picker => phase # "playing"
NoFanfareAfterMovingOn == fanfare => phase = "over"
ReplayIsExact == (link = "friend" /\ lvl = "theirs" /\ phase = "ready") => seed = "theirs"
====
