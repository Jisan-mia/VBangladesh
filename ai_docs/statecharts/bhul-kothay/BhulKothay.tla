---- MODULE BhulKothay ----
\* ভুল কোথায়?: the level's phases (ready veil, playing, paused veil, done), the clock, tab and window focus,
\* the সব লেভেল drawer, the end-of-level save and the delayed confetti.
\* Mirrored from tools/bhul-kothay/components/spot-game.tsx (start, tap, finish, goLevel, stopClock, the mount
\* effect's visibilitychange handler and hashchange readFriend, the drawer's LevelGrid onPick, the window keydown handler).
\* A level has 5–7 differences; the model uses 2 (found 0, 1, then the last).
EXTENDS Naturals

VARIABLES phase, clock, visible, focused, found, drawer, saves, cheer
vars == <<phase, clock, visible, focused, found, drawer, saves, cheer>>

Phases == {"ready", "playing", "paused", "done"}
Here == visible /\ focused
Keep(vs) == UNCHANGED vs

Init == /\ phase = "ready" /\ clock = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ found = 0 /\ drawer = FALSE /\ saves = 0 /\ cheer = FALSE

\* start(): the veil button, a tap on a picture, or Enter: ready → playing (clock from now), paused → playing (since = now).
YouStart == /\ Here /\ phase \in {"ready", "paused"}
            /\ phase' = "playing" /\ clock' = TRUE
            /\ Keep(<<visible, focused, found, drawer, saves, cheer>>)
\* tap() → "found", not the last one.
YouFindOne == /\ Here /\ phase = "playing" /\ found = 0
              /\ found' = 1
              /\ Keep(<<phase, clock, visible, focused, drawer, saves, cheer>>)
\* tap() → the last one → finish(): stopClock, levels.record, setPhase("done"), later(1000, confetti) when it's 3 stars,
\* a record, or a world's last level (the model lets either happen).
YouFindTheLast == /\ Here /\ phase = "playing" /\ found = 1
                  /\ found' = 2 /\ phase' = "done" /\ clock' = FALSE /\ saves' = saves + 1
                  /\ cheer' \in BOOLEAN
                  /\ Keep(<<visible, focused, drawer>>)
CheerFires == /\ cheer /\ cheer' = FALSE /\ Keep(<<phase, clock, visible, focused, found, drawer, saves>>)
\* goLevel(next, play = true): পরের লেভেল / আবার খেলো (done), শুরু থেকে (playing, after a find), or a drawer pick (any time).
\* clearTimers, a fresh clock from now, setPhase("playing").
YouPlayALevel == /\ Here /\ (phase = "done" \/ drawer \/ (phase = "playing" /\ found > 0))
                 /\ phase' = "playing" /\ clock' = TRUE /\ found' = 0 /\ saves' = 0 /\ cheer' = FALSE
                 /\ Keep(<<visible, focused, drawer>>)
\* hashchange → readFriend → goLevel(level, play = false): the ready veil.
FriendsLinkOpens == /\ Here /\ phase' = "ready" /\ clock' = FALSE /\ found' = 0 /\ saves' = 0 /\ cheer' = FALSE
                    /\ Keep(<<visible, focused, drawer>>)
\* visibilitychange → hidden: only while playing: stopClock, setPhase("paused").
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ IF phase = "playing" THEN phase' = "paused" /\ clock' = FALSE ELSE Keep(<<phase, clock>>)
            /\ Keep(<<found, drawer, saves, cheer>>)
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE /\ Keep(<<phase, clock, found, drawer, saves, cheer>>)
\* No blur or focus listener.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ Keep(<<phase, clock, visible, found, drawer, saves, cheer>>)
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE /\ Keep(<<phase, clock, visible, found, drawer, saves, cheer>>)
YouOpenTheLevels == /\ Here /\ ~drawer /\ drawer' = TRUE /\ Keep(<<phase, clock, visible, focused, found, saves, cheer>>)
YouCloseTheLevels == /\ Here /\ drawer /\ drawer' = FALSE /\ Keep(<<phase, clock, visible, focused, found, saves, cheer>>)

Next == YouStart \/ YouFindOne \/ YouFindTheLast \/ CheerFires \/ YouPlayALevel \/ FriendsLinkOpens
        \/ TabHides \/ TabShows \/ WindowBlurs \/ WindowFocuses \/ YouOpenTheLevels \/ YouCloseTheLevels

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ clock \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ found \in 0..2 /\ drawer \in BOOLEAN /\ saves \in 0..2 /\ cheer \in BOOLEAN

\* ---- the reader's rules ----
\* The clock runs exactly while you're playing.
ClockOnlyWhilePlaying == clock <=> phase = "playing"
\* Hiding the tab stops the clock.
PausedWhenHidden == ~visible => ~clock
\* Clicking into another window stops the clock.
PausedWhenBlurred == (visible /\ ~focused) => ~clock
\* While the level list is open, the clock doesn't run.
LevelPickerFreezesPlay == drawer => ~clock
\* A level is saved once.
NoDoubleResult == saves <= 1
\* The confetti never lands on a new level.
NoCheerAfterMovingOn == cheer => phase = "done"
====
