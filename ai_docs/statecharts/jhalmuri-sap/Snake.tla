---- MODULE Snake ----
\* ঝালমুড়ি সাপ after the rewrite, part 1: the run. The title, the first-run story, the snake, the player's pause, going away
\* (blur, hide, scroll), the end screen's 0.7 s guard and celebration, and a key held through the crash.
\* Part 2 (SnakeLevels.tla) has the level list, a friend's link and the unlock.
\* Mirrored from tools/jhalmuri-sap/lib/session.ts (start, storyDone, pause, resume, finish, again, reset, cheerMayPlay) and
\* tools/jhalmuri-sap/components/snake-game.tsx (deal() clears every timer; the blur, focus, visibilitychange and in-view
\* effects; the keydown handler), with the shared player (shared/game-player-client.tsx: blur, hide, scroll-away, Escape and ⏸
\* call onPause; চালিয়ে যাও calls onResume; নতুন করে শুরু calls onRestart) and useGameLoop (no frames while blurred or hidden).
VARIABLES phase, from, away, guard, cheer, held, skipped, seen
vars == <<phase, from, away, guard, cheer, held, skipped, seen>>

Phases == {"title", "story", "playing", "paused", "over"}
Live == {"playing", "story"}
\* away: "" on the game, or why not (one at a time is enough for every rule).
CanPlay == away = ""

Init == /\ phase = "title" /\ from = "playing" /\ away = "" /\ guard = FALSE /\ cheer = FALSE
        /\ held = FALSE /\ skipped = FALSE /\ seen = FALSE

\* খেলো, Enter, an arrow or a swipe: session.start(), refused while away or off-screen; the story only the first time.
YouStart == /\ phase = "title" /\ CanPlay
            /\ phase' = IF seen THEN "playing" ELSE "story"
            /\ UNCHANGED <<from, away, guard, cheer, held, skipped, seen>>
\* The third panel ends, a tap past it, or a 0.6 s hold: storyDone().
StoryEnds == /\ phase = "story" /\ CanPlay /\ phase' = "playing" /\ seen' = TRUE
             /\ UNCHANGED <<from, away, guard, cheer, held, skipped>>
\* Escape, ⏸ or P: the player's menu → onPause → session.pause().
YouPause == /\ phase \in Live /\ phase' = "paused" /\ from' = phase
            /\ UNCHANGED <<away, guard, cheer, held, skipped, seen>>
\* চালিয়ে যাও → onResume → session.resume(), only when the game can be seen.
YouResume == /\ phase = "paused" /\ CanPlay /\ phase' = from
             /\ UNCHANGED <<from, away, guard, cheer, held, skipped, seen>>
YouHoldKey == /\ phase = "playing" /\ ~held /\ held' = TRUE
              /\ UNCHANGED <<phase, from, away, guard, cheer, skipped, seen>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, from, away, guard, cheer, skipped, seen>>
\* tick() → step() ends the run (frames run only while you're on the game): finish(), the 0.7 s guard, maybe a celebration.
RunEnds == /\ phase = "playing" /\ CanPlay
           /\ phase' = "over" /\ guard' = TRUE /\ cheer' \in BOOLEAN
           /\ UNCHANGED <<from, away, held, skipped, seen>>
GuardLifts == /\ guard /\ guard' = FALSE
              /\ UNCHANGED <<phase, from, away, cheer, held, skipped, seen>>
\* The 1 s celebration timer fires; cheerMayPlay() checks it is still this run's card.
CheerPlays == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, from, away, guard, held, skipped, seen>>
\* আবার খেলো / পরের লেভেল or a fresh Enter after the guard: session.again(), then deal() clears the old run's timers.
YouPlayAgain == /\ phase = "over" /\ ~guard /\ CanPlay
                /\ phase' = "playing" /\ cheer' = FALSE
                /\ UNCHANGED <<from, away, guard, held, skipped, seen>>
\* The key held through the crash repeats on the card: again() refuses a repeat or a press from before the card appeared.
HeldKeyRepeats == /\ phase = "over" /\ held
                  /\ UNCHANGED vars
\* নতুন করে শুরু, a level picked or a friend's link: reset() → deal() → the title, timers cleared.
YouReset == /\ phase \in {"paused", "over", "title"} /\ phase' = "title" /\ guard' = FALSE /\ cheer' = FALSE
            /\ UNCHANGED <<from, away, held, skipped, seen>>
\* Going away: the player's blur, hide and scroll-away pause (the game drops a held key and a swipe on blur and hide).
GoAway(why) == /\ away = "" /\ away' = why
               /\ IF phase \in Live THEN phase' = "paused" /\ from' = phase ELSE UNCHANGED <<phase, from>>
               /\ held' = IF why = "scroll" THEN held ELSE FALSE
               /\ UNCHANGED <<guard, cheer, skipped, seen>>
ComeBack == /\ away # "" /\ away' = ""
            /\ UNCHANGED <<phase, from, guard, cheer, held, skipped, seen>>

Next == YouStart \/ StoryEnds \/ YouPause \/ YouResume \/ YouHoldKey \/ YouLetGo \/ RunEnds \/ GuardLifts \/ CheerPlays
        \/ YouPlayAgain \/ HeldKeyRepeats \/ YouReset \/ GoAway("blur") \/ GoAway("hide") \/ GoAway("scroll") \/ ComeBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ from \in Live /\ away \in {"", "blur", "hide", "scroll"}
          /\ guard \in BOOLEAN /\ cheer \in BOOLEAN /\ held \in BOOLEAN /\ skipped \in BOOLEAN /\ seen \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == phase \in Live => away # "hide"
PausedWhenBlurred == phase \in Live => away # "blur"
PausedWhenScrolledAway == phase \in Live => away # "scroll"
CelebrationOnItsOwnCard == cheer => phase = "over"
ResultNeedsFreshPress == ~skipped
InputReleasedWhenAway == away \in {"blur", "hide"} => ~held
StoryOnlyOnce == phase = "story" => ~seen
====
