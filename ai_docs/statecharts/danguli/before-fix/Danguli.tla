---- MODULE Danguli ----
\* ডাংগুলি as it is today: the round of hits (one here, three in the game), pause, tab and window focus, the play key
\* (Space, Enter or ↑) and the keyboard's auto-repeat, the star-chime timers, the level grid and the friend's field.
\* Mirrored from tools/danguli/components/danguli-game.tsx (press, sync, finish, start, play, again, proceed, the
\* visibilitychange, keydown and hashchange effects) and tools/danguli/lib/game.ts (tap, step, next), with useGameLoop
\* from shared/game-kit.ts. Left out: saved stars (recordLevel in shared/game-core.ts keeps the max, so they never drop),
\* the name and card format, slow mode (it only scales time), and the canvas tap (the same press() with no key held).
EXTENDS Naturals

HITS == 1   \* the game has 3; at 2 TLC finds the same breaks in 504 states, too many to draw

VARIABLES phase, hit, paused, visible, focused, key, results, chimes, link, level, field
vars == <<phase, hit, paused, visible, focused, key, results, chimes, link, level, field>>

Phases == {"aim", "pop", "fly", "rest", "over"}
InPlay == {"pop", "fly", "rest"}                  \* the phases where step() moves the কাঠি
\* key: "up"; "down" after a fresh press; "swung" or "skipped" once the keyboard's auto-repeat has played a hit or
\* left the result by itself while the key is still held. It goes back to "up" when you let go.
Held == {"down", "swung", "skipped"}
\* useGameLoop runs while !paused && !over and stops itself while the tab is hidden. Focus plays no part.
Running == ~paused /\ visible /\ phase # "over"

\* start(seed, level): a fresh field, the star timers cleared, unpaused.
Fresh(f, l) == /\ phase' = "aim" /\ hit' = 0 /\ paused' = FALSE /\ results' = 0 /\ chimes' = FALSE
               /\ field' = f /\ level' = l

\* rest -> next(): the next hit, or the result. sync() calls finish() on the change to "over"; finish() sets the chimes.
NextHit == IF hit + 1 >= HITS
           THEN /\ phase' = "over" /\ hit' = hit /\ results' = results + 1 /\ chimes' = TRUE
           ELSE /\ phase' = "aim" /\ hit' = hit + 1 /\ UNCHANGED <<results, chimes>>

\* What one press does: press() (unpause first, else tap()), or proceed() on the result.
\* proceed(): a won level goes to the next (a new seed); otherwise again(): the friend's seed only while they are the rival.
Act == \/ /\ paused /\ phase # "over" /\ paused' = FALSE
          /\ UNCHANGED <<phase, hit, results, chimes, level, field>>
       \/ /\ ~paused /\ phase = "aim" /\ phase' = "pop"
          /\ UNCHANGED <<hit, paused, results, chimes, level, field>>
       \/ /\ ~paused /\ phase = "pop" /\ phase' \in {"fly", "rest"}   \* a hit flies; a swing on the rise is a whiff
          /\ UNCHANGED <<hit, paused, results, chimes, level, field>>
       \/ /\ ~paused /\ phase = "rest" /\ NextHit /\ UNCHANGED <<paused, level, field>>
       \/ /\ phase = "over"
          /\ \/ /\ level = 1 /\ Fresh("mine", 2)
             \/ Fresh(IF link /\ field = "friend" THEN "friend" ELSE "mine", level)

\* keydown on the window; a fresh press needs the page to have focus.
YouPressPlayKey == /\ focused /\ key = "up" /\ key' = "down" /\ Act
                   /\ UNCHANGED <<visible, focused, link>>
\* The keyboard repeats a held key. onKey never looks at event.repeat, so each repeat acts like a press.
KeyRepeats == /\ focused /\ key \in Held /\ Act
              /\ key' = IF phase = "over" THEN "skipped"
                        ELSE IF key = "down" /\ phase \in {"pop", "rest"} THEN "swung" ELSE key
              /\ UNCHANGED <<visible, focused, link>>
YouLetGo == /\ key \in Held /\ key' = "up"
            /\ UNCHANGED <<phase, hit, paused, visible, focused, results, chimes, link, level, field>>
\* P or Esc (or the থামাও button) toggles pause, except on the result.
YouTogglePause == /\ focused /\ phase # "over" /\ paused' = ~paused
                  /\ UNCHANGED <<phase, hit, visible, focused, key, results, chimes, link, level, field>>

\* The game loop: step() and sync().
KathiFalls == /\ Running /\ phase = "pop" /\ phase' = "rest"      \* it lands untouched: a miss
              /\ UNCHANGED <<hit, paused, visible, focused, key, results, chimes, link, level, field>>
ShotSettles == /\ Running /\ phase = "fly" /\ phase' = "rest"
               /\ UNCHANGED <<hit, paused, visible, focused, key, results, chimes, link, level, field>>
RestEnds == /\ Running /\ phase = "rest" /\ NextHit
            /\ UNCHANGED <<paused, visible, focused, key, link, level, field>>
\* The star chimes and confetti that finish() set with setTimeout play.
ChimesPlay == /\ chimes /\ chimes' = FALSE
              /\ UNCHANGED <<phase, hit, paused, visible, focused, key, results, link, level, field>>

\* Focus. A key held when focus leaves is let go somewhere else, so its keyup never reaches the page.
WindowBlurs == /\ focused /\ focused' = FALSE /\ key' = "up"
               /\ UNCHANGED <<phase, hit, paused, visible, results, chimes, link, level, field>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, hit, paused, visible, key, results, chimes, link, level, field>>
\* visibilitychange: pauses only while the কাঠি is up (pop, fly, rest).
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ key' = "up"
            /\ paused' = (paused \/ phase \in InPlay)
            /\ UNCHANGED <<phase, hit, results, chimes, link, level, field>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, hit, paused, key, results, chimes, link, level, field>>

\* The level grid: play(next) always draws a new seed, even for the friend's own level.
YouPickLevel == /\ focused /\ key = "up" /\ \E l \in {1, 2} : Fresh("mine", l)
                /\ UNCHANGED <<visible, focused, key, link>>
\* hashchange with a real challenge: the friend's field at their level (level 1 here).
FriendLinkOpens == /\ focused /\ key = "up" /\ link' = TRUE /\ Fresh("friend", 1)
                   /\ UNCHANGED <<visible, focused, key>>
\* "নতুন মাঠে খেলো": the link is cleared and a new field drawn.
YouPlayNewField == /\ focused /\ phase = "over" /\ link /\ link' = FALSE /\ Fresh("mine", level)
                   /\ UNCHANGED <<visible, focused, key>>

Init == /\ phase = "aim" /\ hit = 0 /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ key = "up" /\ results = 0 /\ chimes = FALSE
        /\ link \in BOOLEAN /\ level = 1 /\ field = (IF link THEN "friend" ELSE "mine")

Next == YouPressPlayKey \/ KeyRepeats \/ YouLetGo \/ YouTogglePause \/ KathiFalls \/ ShotSettles \/ RestEnds \/ ChimesPlay
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPickLevel \/ FriendLinkOpens \/ YouPlayNewField

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ hit \in 0..(HITS - 1) /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ key \in {"up"} \cup Held /\ results \in 0..1 /\ chimes \in BOOLEAN
          /\ link \in BOOLEAN /\ level \in {1, 2} /\ field \in {"mine", "friend"}

\* The reader's rules.
PausedWhenHidden == (~visible /\ phase \in InPlay) => paused
PausedWhenBlurred == (~focused /\ phase \in InPlay) => paused
InputReleasedWhenAway == ~focused => key = "up"
HeldKeyActsOnce == key # "swung"
ResultStaysUntilYouChoose == key # "skipped"
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == chimes => phase = "over"
ReplayIsExact == (link /\ level = 1) => field = "friend"
====
