---- MODULE Storm ----
\* কালবৈশাখী আম: the storm round, pause and window focus, the held arrow or thumb, the wind loop,
\* the delayed celebration, the storm list (LevelGrid, always on the page below the yard) and a friend's link.
\* Mirrored from tools/kalbaishakhi-aam/components/mango-game.tsx (start, choose, pause, resume, finish,
\* the keydown/keyup and pointer handlers, the visibilitychange and hashchange effects) and
\* shared/game-sound.ts (loop(), setSoundOn() stops every loop and starts none), shared/game-kit.ts (useGameLoop
\* stops frames while the tab is hidden, never on blur).
VARIABLES phase, visible, focused, held, wind, sound, cheer, friend, on, seed
vars == <<phase, visible, focused, held, wind, sound, cheer, friend, on, seed>>

Phases == {"ready", "playing", "paused", "over"}
\* on: which storm the top bar and the next start use ("theirs" = the friend's storm number, "mine" = another).
\* seed: the storm the next or current round falls from ("theirs" = the friend's seed, "fresh" = a new one).

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE /\ held = FALSE /\ wind = FALSE
        /\ sound = TRUE /\ cheer = FALSE
        /\ friend \in BOOLEAN
        /\ on = IF friend THEN "theirs" ELSE "mine"
        /\ seed = IF friend THEN "theirs" ELSE "fresh"

\* start(): a new round from `pending`, or the friend's seed when the chosen storm is theirs; startWind() makes a
\* real loop only while sound is on. It does not clear the celebration timer from the last card.
StartSeed == IF friend /\ on = "theirs" THEN "theirs" ELSE "fresh"

\* শুরু করো, a tap on the yard, or (on the card) আবার খেলো / আরেকবার: again_() → start().
YouStart == /\ phase \in {"ready", "over"} /\ visible /\ focused
            /\ phase' = "playing" /\ held' = FALSE /\ wind' = sound
            /\ seed' = IF phase = "over" THEN StartSeed ELSE seed
            /\ UNCHANGED <<visible, focused, sound, cheer, friend, on>>
\* keydown ← / →: on the ready screen it starts the storm too; input.keys = dir. A thumb held on one side (mode 3) is the same.
YouHoldArrow == /\ phase \in {"ready", "playing"} /\ visible /\ focused /\ ~held
                /\ held' = TRUE
                /\ phase' = "playing"
                /\ wind' = IF phase = "ready" THEN sound ELSE wind
                /\ UNCHANGED <<visible, focused, sound, cheer, friend, on, seed>>
\* keyup (or pointerup) reaches the page only while it has focus.
YouLetGo == /\ held /\ focused /\ held' = FALSE
            /\ UNCHANGED <<phase, visible, focused, wind, sound, cheer, friend, on, seed>>
\* There is no blur listener: nothing happens to the game.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, visible, held, wind, sound, cheer, friend, on, seed>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, held, wind, sound, cheer, friend, on, seed>>
\* visibilitychange → hidden: pause() = stopInput(); stopWind(); playing → paused.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ wind' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<sound, cheer, friend, on, seed>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, held, wind, sound, cheer, friend, on, seed>>
\* P, Esc or থামাও.
YouPause == /\ phase = "playing" /\ visible /\ focused
            /\ phase' = "paused" /\ held' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<visible, focused, sound, cheer, friend, on, seed>>
\* চালিয়ে যাও, Space or Enter: resume() = startWind(); playing.
YouResume == /\ phase = "paused" /\ visible /\ focused
             /\ phase' = "playing" /\ wind' = sound
             /\ UNCHANGED <<visible, focused, held, sound, cheer, friend, on, seed>>
\* stepGame() → finish(): runs on every frame while visible, focused or not. Stops the wind and input, shows
\* the card, and queues the stars' notes, confetti or the lose sound for 0.25–1.1 s later (never cleared).
StormEnds == /\ phase = "playing" /\ visible
             /\ phase' = "over" /\ wind' = FALSE /\ held' = FALSE /\ cheer' = TRUE
             /\ UNCHANGED <<visible, focused, sound, friend, on, seed>>
\* The window.setTimeout in finish() fires.
CheerPlays == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, visible, focused, held, wind, sound, friend, on, seed>>
\* LevelGrid onPick → choose(n): back to the ready screen with that storm and a fresh seed (or the friend's).
\* It neither stops the wind, nor clears input, nor the celebration timer. পরের ঝড় on the card is choose() too.
YouPickStorm(which) ==
    /\ visible /\ focused /\ (which = "theirs" => friend)
    /\ phase' = "ready" /\ on' = which
    /\ seed' = IF friend /\ which = "theirs" THEN "theirs" ELSE "fresh"
    /\ UNCHANGED <<visible, focused, held, wind, sound, cheer, friend>>
\* hashchange with a valid challenge: setLevel(friend's storm), setPending(friend's seed); phase stays "playing"
\* if a round is on, else back to "ready".
FriendLinkOpens == /\ ~friend /\ visible
                   /\ friend' = TRUE /\ on' = "theirs"
                   /\ seed' = IF phase = "playing" THEN seed ELSE "theirs"
                   /\ phase' = IF phase = "playing" THEN "playing" ELSE "ready"
                   /\ UNCHANGED <<visible, focused, held, wind, sound, cheer>>
\* The site-wide switch: off stops every loop (setSoundOn → stopLoops); on starts nothing.
SoundOff == /\ sound /\ focused /\ sound' = FALSE /\ wind' = FALSE
            /\ UNCHANGED <<phase, visible, focused, held, cheer, friend, on, seed>>
SoundOn == /\ ~sound /\ focused /\ sound' = TRUE
           /\ UNCHANGED <<phase, visible, focused, held, wind, cheer, friend, on, seed>>

Next == YouStart \/ YouHoldArrow \/ YouLetGo \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouPause \/ YouResume \/ StormEnds \/ CheerPlays
        \/ YouPickStorm("theirs") \/ YouPickStorm("mine") \/ FriendLinkOpens \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ held \in BOOLEAN
          /\ wind \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in BOOLEAN
          /\ friend \in BOOLEAN /\ on \in {"theirs", "mine"} /\ seed \in {"theirs", "fresh"}

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
InputReleasedWhenAway == held => focused
WindOnlyInTheStorm == wind => (phase = "playing" /\ visible /\ sound)
WindComesBack == (phase = "playing" /\ visible /\ sound) => wind
CelebrationOnItsOwnCard == cheer => phase = "over"
ReplayIsExact == (friend /\ on = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
====
