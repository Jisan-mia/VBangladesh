---- MODULE AlDhore ----
\* আল ধরে হাঁটি as it is today: the walk's phase, pause, the window, your hand (← → / A D held, or a finger on
\* a side), the wind loop on a windy field, the site-wide sound switch, results and a friend's field.
\* Mirrored from tools/al-dhore-hati/components/al-game.tsx (startLevel, pickLevel, begin, finish, tick,
\* handleEvents, clearInput, resume, keys.down/up, onBoardDown/onButtonDown/onRelease, the visibilitychange effect,
\* `useEffect(() => { if (!looping) stopWind() })`, SoundToggle onChange) and tools/al-dhore-hati/lib/walk.ts
\* (step: walk → slip → walk, done, fell). useGameLoop (shared/game-kit.ts) stops stepping on blur and hide.
\* windLoop() is loop("wind") in lib/sound.ts; loop() returns a silent stub when sound is off. The field is one of
\* the windy ones (level 11+); on calm fields the wind variable just stays "none".
EXTENDS Naturals
VARIABLES phase, paused, visible, focused, held, sound, wind, results, field, sameLevel
vars == <<phase, paused, visible, focused, held, sound, wind, results, field, sameLevel>>

\* "walk" covers walk.ts's walk and slip (hide pauses both; the wind stops during a slip and comes back).
Phases == {"ready", "walk", "won", "fell"}
Winds == {"none", "stub", "live"}
\* field: the seed of the field you're on. "friend" = the seed from a friend's link, "fresh" = newSeed().
Fields == {"fresh", "friend"}
LoopSteps == phase = "walk" /\ ~paused /\ visible /\ focused
Made == IF sound THEN "live" ELSE "stub"

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ held = FALSE
        /\ sound \in BOOLEAN /\ wind = "none" /\ results = 0 /\ field = "fresh" /\ sameLevel = FALSE

\* A friend's link (readFriend → startLevel(found.level, found.seed, false)): their field, on the ready screen.
YouOpenAFriendsLink == /\ phase = "ready" /\ field = "fresh" /\ ~sameLevel
                       /\ field' = "friend" /\ sameLevel' = TRUE
                       /\ UNCHANGED <<phase, paused, visible, focused, held, sound, wind, results>>
\* begin() (শুরু করো, Space, or the first ←/→/tap on the field).
YouStart == /\ phase = "ready" /\ visible /\ focused
            /\ phase' = "walk"
            /\ UNCHANGED <<paused, visible, focused, held, sound, wind, results, field, sameLevel>>
\* keys.down ← → (A D), or a finger on a side or a pad: live.keys / live.presses → game.dir. Ignored while paused.
YouHoldASide == /\ phase = "walk" /\ ~paused /\ visible /\ focused /\ ~held
                /\ held' = TRUE
                /\ UNCHANGED <<phase, paused, visible, focused, sound, wind, results, field, sameLevel>>
\* keys.up / pointerup / pointercancel: they reach the page only while it has focus.
YouLetGo == /\ held /\ focused
            /\ held' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, sound, wind, results, field, sameLevel>>
\* tick() on a windy field: `live.wind ??= windLoop()` while walking.
TheWindBlows == /\ LoopSteps
                /\ wind' = IF wind = "none" THEN Made ELSE wind
                /\ UNCHANGED <<phase, paused, visible, focused, held, sound, results, field, sameLevel>>
\* handleEvents: "done" → finish(true) / "fell" → finish(false): stopWind(), clearInput(), record once.
YouReachTheEnd == /\ LoopSteps
                  /\ phase' = "won" /\ wind' = "none" /\ held' = FALSE /\ results' = results + 1
                  /\ UNCHANGED <<paused, visible, focused, sound, field, sameLevel>>
YouFallTheThirdTime == /\ LoopSteps
                       /\ phase' = "fell" /\ wind' = "none" /\ held' = FALSE /\ results' = results + 1
                       /\ UNCHANGED <<paused, visible, focused, sound, field, sameLevel>>
\* useGameLoop's blur listener: cancelAnimationFrame only. No clearInput(), no pause, the wind plays on.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, held, sound, wind, results, field, sameLevel>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, held, sound, wind, results, field, sameLevel>>
\* visibilitychange → hidden: stopWind(), clearInput(), pause in walk or slip.
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ wind' = "none" /\ held' = FALSE
            /\ paused' = (paused \/ phase = "walk")
            /\ UNCHANGED <<phase, sound, results, field, sameLevel>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, held, sound, wind, results, field, sameLevel>>
\* resume(): চালিয়ে যাও or Space.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE
             /\ UNCHANGED <<phase, visible, focused, held, sound, wind, results, field, sameLevel>>
\* SoundToggle: setSoundOn() (off stops every loop), then onChange → live.wind = null either way.
SoundOff == /\ sound /\ visible /\ focused
            /\ sound' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, held, results, field, sameLevel>>
SoundOn == /\ ~sound /\ visible /\ focused
           /\ sound' = TRUE /\ wind' = "none"
           /\ UNCHANGED <<phase, paused, visible, focused, held, results, field, sameLevel>>
\* The fell card's আরেকবার (or Space): startLevel(level, rival ? seed : newSeed()), straight into the walk.
YouTryAgainAfterAFall == /\ phase = "fell" /\ visible /\ focused
                         /\ phase' = "walk" /\ paused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ results' = 0
                         /\ UNCHANGED <<visible, focused, sound, field, sameLevel>>
\* The won card's আবার খেলো (or Space on the last level): pickLevel(level) → startLevel(level), always newSeed().
YouPlayAgainAfterAWin == /\ phase = "won" /\ visible /\ focused
                         /\ phase' = "walk" /\ paused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ results' = 0
                         /\ field' = "fresh"
                         /\ UNCHANGED <<visible, focused, sound, sameLevel>>
\* পরের লেভেল (or Space on the won card), or the LevelGrid in any phase: pickLevel → straight into a walk on a new field.
YouPickAnotherLevel == /\ visible /\ focused
                       /\ phase' = "walk" /\ paused' = FALSE /\ held' = FALSE /\ wind' = "none" /\ results' = 0
                       /\ field' = "fresh" /\ sameLevel' = FALSE
                       /\ UNCHANGED <<visible, focused, sound>>

Next == YouOpenAFriendsLink \/ YouStart \/ YouHoldASide \/ YouLetGo \/ TheWindBlows \/ YouReachTheEnd \/ YouFallTheThirdTime
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ SoundOff \/ SoundOn
        \/ YouTryAgainAfterAFall \/ YouPlayAgainAfterAWin \/ YouPickAnotherLevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ held \in BOOLEAN
          /\ sound \in BOOLEAN /\ wind \in Winds /\ results \in 0..2 /\ field \in Fields /\ sameLevel \in BOOLEAN

\* The reader's rules.
InputReleasedWhenAway == (~focused \/ ~visible) => ~held
PausedWhenHidden == (~visible /\ phase = "walk") => paused
PausedWhenBlurred == (~focused /\ phase = "walk") => paused
\* The wind plays only while you walk on a focused, visible page with sound on.
LoopOnlyWhenMeaningful == wind = "live" => (LoopSteps /\ sound)
LoopComesBack == (LoopSteps /\ sound) => wind # "stub"
NoDoubleResult == results <= 1
\* Replaying the friend's level from either card keeps the friend's field (the compare line needs the same seed).
ReplayIsExact == [][(sameLevel /\ sameLevel' /\ field = "friend" /\ phase \in {"won", "fell"}) => field' = "friend"]_vars
====
