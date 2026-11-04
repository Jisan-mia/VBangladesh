---- MODULE ChhipFelo ----
\* ছিপ ফেলো: one cast of a fishing trip, pause and window focus, the held finger or Space, the reel hum,
\* the result fanfare's timer, and a friend's link to a locked level,
\* mirrored from tools/chhip-felo/components/fishing-game.tsx (handlers and effects) and tools/chhip-felo/lib/game.ts.
\* Abstractions: a trip is one cast (aim → fly → wait → reel → done; the 2.1 s catch / 1.5 s miss display is folded
\* into the step that ends the cast); "held" is trip.charging (aim) or trip.holding (reel) or a held Space key;
\* the clock runs when useGameLoop runs (running = !paused && phase !== "done"; the loop stops while the tab is hidden and,
\* since the working-tree change to shared/game-kit.ts on 4 Nov 09:36, while the window is blurred). At HEAD (a03ce2a)
\* the loop ignored blur; drop "/\ focused" from Running to model that version (NoProgressWhileAway then breaks too).
\* Levels: friendTrip means the trip is a friend's link to a level you haven't opened; skipped means levels opened that
\* you never cleared (unlockedLevel = 1 + the highest level with stars, capped only by the album's place).
VARIABLES phase, paused, visible, focused, held, hum, sound, owed, guard, friendTrip, skipped
vars == <<phase, paused, visible, focused, held, hum, sound, owed, guard, friendTrip, skipped>>

Phases == {"aim", "fly", "wait", "reel", "done"}
Live == {"fly", "wait", "reel"}                       \* the phases hide() pauses
Running == ~paused /\ visible /\ focused /\ phase # "done"   \* useGameLoop steps the trip
Window == <<visible, focused>>

Init == /\ phase = "aim" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ held = FALSE /\ hum = FALSE /\ sound \in BOOLEAN
        /\ owed = "none" /\ guard = FALSE /\ friendTrip = FALSE /\ skipped = FALSE

\* begin(level, seed): stopHum(), a fresh trip, down = null, setPaused(false). It never clears finish()'s setTimeout.
Begin(friend) == /\ phase' = "aim" /\ paused' = FALSE /\ held' = FALSE /\ hum' = FALSE /\ guard' = FALSE
                 /\ owed' = IF owed \in {"soon", "late"} THEN "stale" ELSE owed
                 /\ friendTrip' = friend
                 /\ UNCHANGED <<visible, focused, sound, skipped>>

\* ---- input: onDown/onUp on the pond and the big button, and Space/Enter on window keydown/keyup ----
\* press() in aim: trip.charging = true.
YouHoldToAim == /\ Running /\ focused /\ phase = "aim" /\ ~held
                /\ held' = TRUE
                /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, owed, guard, friendTrip, skipped>>
\* release() in aim: cast() → "fly".
YouLetGoToCast == /\ focused /\ held /\ phase = "aim"
                  /\ held' = FALSE /\ phase' = "fly"
                  /\ UNCHANGED <<paused, visible, focused, hum, sound, owed, guard, friendTrip, skipped>>
\* press() in wait inside the dip's window: startReel() (holding = true) and "hook" → reelHum().
YouStrike == /\ Running /\ focused /\ phase = "wait" /\ ~held
             /\ phase' = "reel" /\ held' = TRUE /\ hum' = sound
             /\ UNCHANGED <<paused, visible, focused, sound, owed, guard, friendTrip, skipped>>
\* press() in wait outside the window: "early" / "nibble" → endCast, the miss line, then next() → "done".
YouStrikeTooSoon == /\ Running /\ focused /\ phase = "wait" /\ ~held
                    /\ phase' = "done" /\ owed' = "soon" /\ guard' = TRUE
                    /\ UNCHANGED <<paused, visible, focused, held, hum, sound, friendTrip, skipped>>
\* press() / release() in reel: holding on and off.
YouHoldToReel == /\ Running /\ focused /\ phase = "reel" /\ ~held
                 /\ held' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, owed, guard, friendTrip, skipped>>
YouSlacken == /\ focused /\ held /\ phase = "reel"
              /\ held' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, owed, guard, friendTrip, skipped>>

\* ---- time: step() in useGameLoop ----
FloatLands == /\ Running /\ phase = "fly" /\ phase' = "wait"
              /\ UNCHANGED <<paused, visible, focused, held, hum, sound, owed, guard, friendTrip, skipped>>
\* "late": the float stayed under past the window. endCast("late") → stopHum → next() → finish().
FishTakesTheBait == /\ Running /\ phase = "wait"
                    /\ phase' = "done" /\ owed' = "soon" /\ guard' = TRUE
                    /\ UNCHANGED <<paused, visible, focused, held, hum, sound, friendTrip, skipped>>
\* "snap" (held in the red) or "slip" (slack too long): stopHum, the miss, then the result.
LineGives == /\ Running /\ phase = "reel"
             /\ phase' = "done" /\ hum' = FALSE /\ held' = FALSE /\ owed' = "soon" /\ guard' = TRUE
             /\ UNCHANGED <<paused, visible, focused, sound, friendTrip, skipped>>
\* progress reaches 1: caught() then finish(): levels.record(level, stars). On a friend's far level that opens every level below it.
FishLanded == /\ Running /\ phase = "reel"
              /\ phase' = "done" /\ hum' = FALSE /\ held' = FALSE /\ owed' = "late" /\ guard' = TRUE
              /\ skipped' = (skipped \/ friendTrip)
              /\ UNCHANGED <<paused, visible, focused, sound, friendTrip>>

\* ---- the result ----
\* overAt + 600 ms: primary() and again() stop ignoring presses.
GuardLapses == /\ phase = "done" /\ guard /\ owed # "soon" /\ guard' = FALSE
               /\ UNCHANGED <<phase, paused, visible, focused, held, hum, sound, owed, friendTrip, skipped>>
\* finish()'s setTimeout: 250 ms for no stars (sfx.lose, "soon", inside the 600 ms guard),
\* 950 ms for a cleared level (levelUp + confetti or sfx.good, "late", after the guard). A stale one fires over the new trip.
FanfarePlays == /\ owed # "none" /\ (owed = "late" => ~guard) /\ owed' = "none"
                /\ UNCHANGED <<phase, paused, visible, focused, held, hum, sound, guard, friendTrip, skipped>>
\* primary(): পরের লেভেল / আবার খেলো / Space on the result, ignored for 600 ms.
YouPlayOn == /\ phase = "done" /\ ~guard /\ focused /\ Begin(FALSE)
\* The সব লেভেল grid: onPick → begin() at any moment, no 600 ms guard, no question.
YouPickALevel == /\ focused /\ Begin(FALSE)
\* readFriend() on mount or hashchange: begin(found.level, found.seed), even for a level this phone hasn't opened.
YouOpenAFriendsLink == /\ visible /\ ~friendTrip /\ Begin(TRUE)

\* ---- away and back ----
\* The component has no blur listener: no overlay, and a held Space key or finger stays counted (trip.charging / holding).
\* useGameLoop's own blur listener only freezes the steps; the reel hum keeps sounding. Focus restarts the loop at once.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, held, hum, sound, owed, guard, friendTrip, skipped>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, held, hum, sound, owed, guard, friendTrip, skipped>>
\* hide(): charging = holding = false, down = null; in fly/wait/reel stopHum() and setPaused(true).
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE
            /\ paused' = (paused \/ phase \in Live)
            /\ hum' = (hum /\ phase \notin Live)
            /\ UNCHANGED <<phase, sound, owed, guard, friendTrip, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, held, hum, sound, owed, guard, friendTrip, skipped>>
\* resume(): the overlay's চালিয়ে যাও, a tap on the pond, or Space; reelHum() again in reel.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ hum' = (hum \/ (phase = "reel" /\ sound))
             /\ UNCHANGED <<phase, visible, focused, held, sound, owed, guard, friendTrip, skipped>>

\* ---- the site-wide switch ----
\* Off: stopLoops() and hum.current = null. On: reelHum() if reeling and not paused.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, held, owed, guard, friendTrip, skipped>>
SoundOn == /\ ~sound /\ visible /\ sound' = TRUE /\ hum' = (hum \/ (phase = "reel" /\ ~paused))
           /\ UNCHANGED <<phase, paused, visible, focused, held, owed, guard, friendTrip, skipped>>

Next == YouHoldToAim \/ YouLetGoToCast \/ YouStrike \/ YouStrikeTooSoon \/ YouHoldToReel \/ YouSlacken
        \/ FloatLands \/ FishTakesTheBait \/ LineGives \/ FishLanded
        \/ GuardLapses \/ FanfarePlays \/ YouPlayOn \/ YouPickALevel \/ YouOpenAFriendsLink
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ held \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ owed \in {"none", "soon", "late", "stale"}
          /\ guard \in BOOLEAN /\ friendTrip \in BOOLEAN /\ skipped \in BOOLEAN

\* TLC stops exploring past a stale fanfare or a skipped level (it still checks the rules there), so the chart stays readable.
StopAtLeftovers == owed # "stale" /\ ~skipped

\* ---- the reader's rules ----
\* The float, the bite and the line don't move while you're in another window or tab.
NoProgressWhileAway == (phase \in Live /\ ~focused) => ~Running
\* After you leave the window or tab, no finger or key still counts as held.
InputReleasedWhenAway == ~focused => ~held
PausedWhenHidden == (~visible /\ phase \in Live) => paused
PausedWhenBlurred == (~focused /\ phase \in Live) => paused
\* The reel hums only while a fish is on the line, the line is moving, and sound is on.
LoopOnlyWhenMeaningful == hum => (phase = "reel" /\ Running /\ sound)
\* If a fish is on the line, you're playing and sound is on, the hum plays (also after sound comes back on).
LoopComesBack == (phase = "reel" /\ Running /\ sound) => hum
\* Nothing in the trip moves while the pause overlay is up.
PausedMeansFrozen == paused => ~Running
\* The result's fanfare and confetti belong to the result; they never go off over a new trip.
FanfareOnlyOnTheResult == owed # "stale"
\* Only levels you cleared open the next one; a friend's link lets you play their level, not skip the ones before it.
OpenLevelsAreEarned == ~skipped
====
