---- MODULE Late ----
\* দেরি হয়ে গেল as it is today: the run (ready, playing, paused, over), tab and window focus, the jump key (Space) and
\* the duck key (↓) and what the game thinks is held, the 600 ms before আরেকবার takes focus, the celebration timer,
\* and the day and road on screen against the ones being run (a friend's link).
\* Mirrored from tools/deri-hoye-gelo/components/late-game.tsx (start, letGo, pause, resume, finish, restart, primary,
\* choose, the keydown/keyup effect, the readFriend + visibilitychange effect, the focus-after-600-ms effect) and
\* tools/deri-hoye-gelo/lib/road.ts (pressJump, releaseJump, pressDuck, releaseDuck, stepRun ending on a bump or the gate),
\* with useGameLoop from shared/game-kit.ts.
\* Left out: the jump flag (held, it only floats one jump 0.2 s longer; only the duck flag can stick in a way you see), the pointer and the on-screen buttons (they press and release the same flags, and pointercancel lets go),
\* slow mode, the resume grace (0.7 s with the road still), sound (no loops), saved stars (recordLevel keeps the max), and
\* the 450 ms and 600 ms guards as separate times (one "settled" moment stands for both).
EXTENDS Naturals

VARIABLES phase, visible, focused, duck, hand, settled, party, results, left, shown, run
vars == <<phase, visible, focused, duck, hand, settled, party, results, left, shown, run>>

\* hand is the physical key: "off", "jump" (Space, pressed fresh), "stale" (Space held since before the bump), "duck" (↓).
\* left records how the last result was left: "none", or "stale" when letting go of a Space held since the run did it.
\* shown is the day and road on screen: "mine", or "friend" (their day, their road) once their link is open.
\* run is the day and road of the run itself, fixed by start().
Running == phase = "playing" /\ visible

\* start(forDay = day): a fresh run of the day on screen, the friend's road when their link fits that day.
Start == /\ phase' = "playing" /\ duck' = FALSE /\ settled' = FALSE /\ results' = 0
         /\ run' = shown
\* finish(): the result, letGo(), and a setTimeout for the bell, stars or confetti (not cleared by start()).
Finish(p) == /\ Running /\ phase' = "over" /\ duck' = FALSE /\ settled' = FALSE
             /\ results' = results + 1 /\ party' = p
             /\ hand' = IF hand = "jump" THEN "stale" ELSE hand

\* keydown Space: during play pressJump() (it stands the kid up); on the ready screen start(); paused resume().
\* On the result it does nothing before 600 ms, and after that আরেকবার has focus, so the window handler skips it.
YouPressJump == /\ focused /\ hand = "off" /\ hand' = "jump" /\ left' = "none"
                /\ \/ /\ phase = "playing" /\ duck' = FALSE
                      /\ UNCHANGED <<phase, settled, results, run>>
                   \/ /\ phase = "ready" /\ Start
                   \/ /\ phase = "paused" /\ phase' = "playing"
                      /\ UNCHANGED <<duck, settled, results, run>>
                   \/ /\ phase = "over" /\ UNCHANGED <<phase, duck, settled, results, run>>
                /\ UNCHANGED <<visible, focused, party, shown>>
\* keydown ↓: only during play.
YouPressDuck == /\ focused /\ hand = "off" /\ phase = "playing" /\ hand' = "duck" /\ duck' = TRUE /\ left' = "none"
                /\ UNCHANGED <<phase, visible, focused, settled, party, results, shown, run>>
\* keyup: releaseJump / releaseDuck. Space let go on the focused আরেকবার clicks it: restart() -> start().
\* (The browser clicks a button on Space-up only if a Space keydown reached it. A Space held since the run gets there
\* through the keyboard's auto-repeat, which starts about 0.5 s into a hold, so "settled" with a stale Space means it did.)
YouLetGo == /\ focused /\ hand # "off" /\ hand' = "off"
            /\ IF phase = "over" /\ settled /\ hand \in {"jump", "stale"}
               THEN /\ Start /\ left' = (IF hand = "stale" THEN "stale" ELSE "none")
               ELSE /\ duck' = (duck /\ hand # "duck")
                    /\ UNCHANGED <<phase, settled, results, left, run>>
            /\ UNCHANGED <<visible, focused, party, shown>>
\* P, Esc or থামাও: pause() lets go of both and pauses. চালিয়ে যাও: resume().
YouPause == /\ focused /\ phase = "playing" /\ phase' = "paused" /\ duck' = FALSE
            /\ UNCHANGED <<visible, focused, hand, settled, party, results, left, shown, run>>
YouResume == /\ focused /\ hand = "off" /\ phase = "paused" /\ phase' = "playing"
             /\ UNCHANGED <<visible, focused, duck, hand, settled, party, results, left, shown, run>>
\* 600 ms after the result: আরেকবার takes focus, and the 450 ms guard on its click has passed.
AgainTakesFocus == /\ phase = "over" /\ ~settled /\ settled' = TRUE
                   /\ UNCHANGED <<phase, visible, focused, duck, hand, party, results, left, shown, run>>
\* Clicking আরেকবার or পরের দিন.
YouPressAgain == /\ focused /\ hand = "off" /\ phase = "over" /\ settled /\ Start /\ left' = "none"
                 /\ UNCHANGED <<visible, focused, hand, party, shown>>

\* The road: a bump, or the day's gate (stars, so the timer will celebrate).
KidBumps == /\ Finish(party) /\ UNCHANGED <<visible, focused, left, shown, run>>
GateReached == /\ Finish(TRUE) /\ UNCHANGED <<visible, focused, left, shown, run>>
PartyFires == /\ party /\ party' = FALSE
              /\ UNCHANGED <<phase, visible, focused, duck, hand, settled, results, left, shown, run>>

\* Focus. There is no blur handler: a held key's keyup goes to the other window and the flags stay as they were.
WindowBlurs == /\ focused /\ focused' = FALSE /\ hand' = "off"
               /\ UNCHANGED <<phase, visible, duck, settled, party, results, left, shown, run>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, duck, hand, settled, party, results, left, shown, run>>
\* visibilitychange -> hidden: pause() (letGo, and paused if playing).
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ hand' = "off" /\ duck' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<settled, party, results, left, shown, run>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, duck, hand, settled, party, results, left, shown, run>>

\* A friend's link (hashchange): their day on screen; back to the ready screen unless a run is under way.
FriendLinkOpens == /\ focused /\ hand = "off" /\ shown' = "friend"
                   /\ phase' = IF phase = "playing" THEN "playing" ELSE "ready"
                   /\ UNCHANGED <<visible, focused, duck, hand, settled, party, results, left, run>>
\* choose(to): a day from the grid, back to the ready screen.
\* (Picking the friend's day again acts like their link, so only picking another day is a separate step.)
YouPickDay == /\ focused /\ hand = "off" /\ shown' = "mine"
              /\ phase' = "ready"
              /\ UNCHANGED <<visible, focused, duck, hand, settled, party, results, left, run>>

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE /\ duck = FALSE /\ hand = "off"
        /\ settled = FALSE /\ party = FALSE /\ results = 0 /\ left = "none"
        /\ shown = "mine" /\ run = "mine"

Next == YouPressJump \/ YouPressDuck \/ YouLetGo \/ YouPause \/ YouResume \/ AgainTakesFocus \/ YouPressAgain
        \/ KidBumps \/ GateReached \/ PartyFires \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ FriendLinkOpens \/ YouPickDay

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ duck \in BOOLEAN /\ hand \in {"off", "jump", "stale", "duck"} /\ settled \in BOOLEAN
          /\ party \in BOOLEAN /\ results \in 0..1 /\ left \in {"none", "stale"}
          /\ shown \in {"mine", "friend"} /\ run \in {"mine", "friend"}

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == ~focused => ~duck
InputMatchesHand == duck => hand = "duck"
ResultStaysUntilYouChoose == left = "none"
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == party => phase = "over"
ReplayIsExact == phase \in {"playing", "paused"} => run = shown
====
