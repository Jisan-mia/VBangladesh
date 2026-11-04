---- MODULE Badminton ----
\* গলির ব্যাডমিন্টন: the match, pause, window and tab, the raised racket, scrolling, the wind loop and the result screen,
\* mirrored from tools/golir-badminton/components/badminton-game.tsx (begin, raise, hit, keys.down/up, onPointerDown/Up/Cancel,
\* resume, startLevel/pickLevel, finish, tick's windLoop, the `!looping` effect, the visibilitychange `hide` handler and the
\* SoundToggle onChange) and from useGameLoop in shared/game-kit.ts (working copy: blur cancels the frame and sets `away`,
\* focus clears it; every remount of the loop effect starts with `away = false`). Modelled on a wind night (levels 2, 5, 8, 11, 14),
\* the only nights with a loop. A point that doesn't end the match changes nothing here, so only the match point is an action.
VARIABLES phase, paused, visible, focused, away, inView, cocked, wind, sound, fresh, skipped
vars == <<phase, paused, visible, focused, away, inView, cocked, wind, sound, fresh, skipped>>

Phases == {"ready", "play", "won", "lost"}
Over == phase \in {"won", "lost"}
\* `looping` in the component: the effect of useGameLoop is mounted.
LoopingOf(ph, pa, iv) == ph = "play" /\ ~pa /\ iv
Looping == LoopingOf(phase, paused, inView)
\* The rAF loop actually steps the match: mounted, tab visible, no blur seen since the mount.
ClockRuns == Looping /\ visible /\ ~away
WindSounds == wind = "real" /\ sound

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ away = FALSE
        /\ inView = TRUE /\ cocked = FALSE /\ wind = "none" /\ sound = TRUE /\ fresh = FALSE /\ skipped = FALSE

\* begin(): from the big button, the court or Space/Enter/↑ on the first screen. The overlay and the disabled button block it while paused.
YouStart == /\ phase = "ready" /\ ~paused /\ visible /\ focused /\ inView
            /\ phase' = "play" /\ away' = FALSE
            /\ UNCHANGED <<paused, visible, focused, inView, cocked, wind, sound, fresh, skipped>>
\* raise(): press and hold the court, the মারো button, or Space/Enter/↑.
YouRaiseRacket == /\ phase = "play" /\ ~paused /\ visible /\ focused /\ inView /\ ~cocked
                  /\ cocked' = TRUE
                  /\ UNCHANGED <<phase, paused, visible, focused, away, inView, wind, sound, fresh, skipped>>
\* hit(): pointerup, pointercancel or keyup. They reach the page only while it has focus.
YouLetGo == /\ cocked /\ visible /\ focused
            /\ cocked' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, away, inView, wind, sound, fresh, skipped>>
\* tick(): the first step on a wind night opens the loop (live.wind ??= windLoop()); a stub while sound is off.
TheShuttleFlies == /\ ClockRuns /\ wind = "none"
                   /\ wind' = IF sound THEN "real" ELSE "stub"
                   /\ UNCHANGED <<phase, paused, visible, focused, away, inView, cocked, sound, fresh, skipped>>
\* step() reaches five points: the "done" event runs finish(): stopWind(), the result. `cocked` is left as it was.
TheMatchEnds == /\ ClockRuns
                /\ phase' \in {"won", "lost"} /\ fresh' = TRUE /\ wind' = "none" /\ away' = FALSE
                /\ UNCHANGED <<paused, visible, focused, inView, cocked, sound, skipped>>
\* The result has been on screen long enough to read.
TheResultSettles == /\ fresh /\ fresh' = FALSE
                    /\ UNCHANGED <<phase, paused, visible, focused, away, inView, cocked, wind, sound, skipped>>
\* keys.down on the result: Space/Enter/↑ starts the next game at once (won: next level; lost: the same level). No settle check.
YouPressSpaceOnResult == /\ Over /\ visible /\ focused /\ inView
                         /\ phase' = "play" /\ skipped' = (skipped \/ fresh) /\ fresh' = FALSE
                         /\ paused' = FALSE /\ cocked' = FALSE /\ wind' = "none" /\ away' = FALSE
                         /\ UNCHANGED <<visible, focused, inView, sound>>
\* pickLevel(): পরের লেভেল, আবার খেলো, আরেকবার, or a level in সব লেভেল, any time.
YouPickALevel == /\ visible /\ focused
                 /\ phase' = "play" /\ fresh' = FALSE /\ paused' = FALSE /\ cocked' = FALSE /\ wind' = "none" /\ away' = FALSE
                 /\ UNCHANGED <<visible, focused, inView, sound, skipped>>
\* useGameLoop's blur: cancels the frame and sets away, only while its effect is mounted. Nothing in the game hears it.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ away' = Looping
               /\ UNCHANGED <<phase, paused, visible, inView, cocked, wind, sound, fresh, skipped>>
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ away' = FALSE
                 /\ UNCHANGED <<phase, paused, visible, inView, cocked, wind, sound, fresh, skipped>>
\* hide(): stopWind(), cocked = false, and pause unless the match is done (so also on the first screen).
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ cocked' = FALSE /\ wind' = "none" /\ away' = FALSE
            /\ paused' = (paused \/ phase \in {"ready", "play"})
            /\ UNCHANGED <<phase, inView, sound, fresh, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, away, inView, cocked, wind, sound, fresh, skipped>>
\* resume(): the চালিয়ে যাও button or any of Space/Enter/↑. The loop effect remounts with away = false.
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ away' = FALSE
             /\ UNCHANGED <<phase, visible, focused, inView, cocked, wind, sound, fresh, skipped>>
\* The board leaves the screen (useInView): looping goes false, the effect stops the wind. A wheel or trackpad
\* scrolls a background window too, so these don't need focus.
ScrollAway == /\ visible /\ inView
              /\ inView' = FALSE /\ wind' = "none" /\ away' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, cocked, sound, fresh, skipped>>
\* Back on screen: the loop effect remounts, and its `away` starts false whatever the window's focus.
ScrollBack == /\ visible /\ ~inView
              /\ inView' = TRUE /\ away' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, cocked, wind, sound, fresh, skipped>>
\* The site-wide switch. Off: stopLoops() and live.wind = null. On: live.wind = null, so the next step opens a real loop.
SoundOff == /\ sound /\ visible /\ focused /\ sound' = FALSE /\ wind' = "none"
            /\ UNCHANGED <<phase, paused, visible, focused, away, inView, cocked, fresh, skipped>>
SoundOn == /\ ~sound /\ visible /\ focused /\ sound' = TRUE /\ wind' = "none"
           /\ UNCHANGED <<phase, paused, visible, focused, away, inView, cocked, fresh, skipped>>

Next == YouStart \/ YouRaiseRacket \/ YouLetGo \/ TheShuttleFlies \/ TheMatchEnds \/ TheResultSettles
        \/ YouPressSpaceOnResult \/ YouPickALevel \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ ScrollAway \/ ScrollBack \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ away \in BOOLEAN
          /\ inView \in BOOLEAN /\ cocked \in BOOLEAN /\ wind \in {"none", "stub", "real"} /\ sound \in BOOLEAN
          /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN

\* The reader's rules.
\* The match clock moves only while you are on the page.
NoProgressWhileAway == ClockRuns => focused
\* After you click away or hide the tab, the game doesn't think you are still holding the racket up.
InputReleasedWhenAway == cocked => focused
\* A match in play is paused while the tab is hidden, and while another window has focus.
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
\* "খেলা থেমে আছে" shows only in a match that has started.
PauseOnlyMidMatch == paused => phase = "play"
\* The wind is heard only while the match runs in front of you.
LoopOnlyWhenMeaningful == WindSounds => (phase = "play" /\ ~paused /\ visible /\ focused)
\* With sound on, the wind is never stuck as a silent stub.
LoopComesBack == (sound /\ phase = "play") => wind # "stub"
\* A key that lands as the result appears doesn't throw the result away.
NoTapPastResult == ~skipped
====
