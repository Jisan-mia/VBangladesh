---- MODULE Snake ----
\* ঝালমুড়ি সাপ: the run, pause on a hidden tab or a scrolled-away board, window focus, the 0.7 s guard
\* against crash taps, the delayed celebration, the level list and a friend's link.
\* Mirrored from tools/jhalmuri-sap/components/snake-game.tsx (start, pause, resume, restart, choose, press,
\* side, finish, tick, the visibilitychange, hashchange and in-view effects, the keydown handler) and
\* shared/game-kit.ts (useGameLoop stops frames while the tab is hidden, never on blur). Turns are discrete
\* (a swipe, a key, a tap), so nothing is ever held; the snake moves by itself every step.
VARIABLES phase, visible, focused, inView, guard, cheer, friend, on, seed
vars == <<phase, visible, focused, inView, guard, cheer, friend, on, seed>>

Phases == {"ready", "playing", "paused", "over"}
\* guard: the 0.7 s restartReady timer is still pending (it is never cleared). on: the level picked ("theirs" = the friend's level).
\* seed: whose ঠোঙা is on the board ("theirs" = the friend's seed).
\* Keys act only while the board is in view (boardInView); a click on a visible button acts regardless.
CanAct == visible /\ focused

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ guard = FALSE /\ cheer = FALSE
        /\ friend = FALSE /\ on = "mine" /\ seed = "fresh"

\* শুরু করো, Space, an arrow, a swipe or a tap on the board: start().
YouStart == /\ phase = "ready" /\ CanAct /\ phase' = "playing"
            /\ UNCHANGED <<visible, focused, inView, guard, cheer, friend, on, seed>>
\* P, Esc, Space or the pause button.
YouPause == /\ phase = "playing" /\ CanAct /\ phase' = "paused"
            /\ UNCHANGED <<visible, focused, inView, guard, cheer, friend, on, seed>>
\* P, Esc, Space, চালিয়ে যাও, an arrow or a tap: resume() (0.6 s breath first).
YouResume == /\ phase = "paused" /\ CanAct /\ phase' = "playing"
             /\ UNCHANGED <<visible, focused, inView, guard, cheer, friend, on, seed>>
\* tick() → step(): a crash or the level's last bite → finish(): the card shows, restartReady = false for 0.7 s,
\* and a celebration (confetti, sfx.good or sfx.win) may be queued for 0.15–1.1 s later (never cleared).
\* tick() runs on every frame while the tab is visible, focused or not.
\* Timing fact: a run can't end within 0.7 s of the last crash (the fastest crash after a start is ~0.6 s of moves,
\* plus picking a level and starting), so the old card's 0.7 s timer has always fired by then.
RunEnds == /\ phase = "playing" /\ visible /\ ~guard
           /\ phase' = "over" /\ guard' = TRUE /\ cheer' \in BOOLEAN
           /\ UNCHANGED <<visible, focused, inView, friend, on, seed>>
\* The 0.7 s timer: setRestartReady(true).
GuardLifts == /\ guard /\ guard' = FALSE
              /\ UNCHANGED <<phase, visible, focused, inView, cheer, friend, on, seed>>
\* The 1.1 s timer fires (after the 0.7 s one).
CheerPlays == /\ cheer /\ ~guard /\ cheer' = FALSE
              /\ UNCHANGED <<phase, visible, focused, inView, guard, friend, on, seed>>
\* আবার খেলো / পরের লেভেল / আরেকবার or Space on the card: restart(), only once restartReady.
YouPlayAgain(which) == /\ phase = "over" /\ ~guard /\ visible /\ focused /\ (which = "theirs" => friend)
                       /\ phase' = "playing" /\ on' = which
                       /\ seed' = IF friend /\ which = "theirs" THEN "theirs" ELSE "fresh"
                       /\ UNCHANGED <<visible, focused, inView, guard, cheer, friend>>
\* LevelGrid, the লেভেল/ক্লাসিক buttons or the card's link: choose() → reset() and the ready screen, from any screen.
YouPickLevel(which) == /\ visible /\ focused /\ (which = "theirs" => friend)
                       /\ phase' = "ready" /\ on' = which /\ inView' = TRUE
                       /\ seed' = IF friend /\ which = "theirs" THEN "theirs" ELSE "fresh"
                       /\ UNCHANGED <<visible, focused, guard, cheer, friend>>
\* hashchange with a valid link: reset(friend's seed, friend's level) and the ready screen.
FriendLinkOpens == /\ ~friend /\ visible
                   /\ friend' = TRUE /\ on' = "theirs" /\ seed' = "theirs" /\ phase' = "ready"
                   /\ UNCHANGED <<visible, focused, inView, guard, cheer>>
\* There is no blur listener.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, visible, inView, guard, cheer, friend, on, seed>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, inView, guard, cheer, friend, on, seed>>
\* visibilitychange → hidden: pause().
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<inView, guard, cheer, friend, on, seed>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, inView, guard, cheer, friend, on, seed>>
\* useInView(board) turns false → pause().
YouScrollAway == /\ visible /\ inView /\ inView' = FALSE
                 /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                 /\ UNCHANGED <<visible, focused, guard, cheer, friend, on, seed>>
YouScrollBack == /\ visible /\ ~inView /\ inView' = TRUE
                 /\ UNCHANGED <<phase, visible, focused, guard, cheer, friend, on, seed>>

Next == YouStart \/ YouPause \/ YouResume \/ RunEnds \/ GuardLifts \/ CheerPlays
        \/ YouPlayAgain("theirs") \/ YouPlayAgain("mine") \/ YouPickLevel("theirs") \/ YouPickLevel("mine")
        \/ FriendLinkOpens \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouScrollAway \/ YouScrollBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ guard \in BOOLEAN /\ cheer \in BOOLEAN /\ friend \in BOOLEAN
          /\ on \in {"theirs", "mine"} /\ seed \in {"theirs", "fresh"}

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
PausedWhenScrolledAway == phase = "playing" => inView
CelebrationOnItsOwnCard == cheer => phase = "over"
ReplayIsExact == (friend /\ on = "theirs") => seed = "theirs"
====
