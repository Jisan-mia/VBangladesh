---- MODULE Bangles ----
\* চুড়ির বাজার: the move and its cascade, the stuck tray and its shake (with the rattle loop), pause, window focus, the
\* drag in flight, the sound switch, the end-of-level celebration timers. Mirrored from
\* tools/churir-bazar/components/bangle-game.tsx (handlers named below), shared/game-kit.ts (useGameLoop, useLevels),
\* shared/game-sound.ts (loop, setSoundOn).
\* Abstractions: the tray is not modelled cell by cell. A cascade is one step; "final" is the cascade of the move that ends
\* the level (game.over is already true, so the tab hiding does not pause it).
\* Levels and the friend link are left out to keep the chart under 500 states: this game opens levels with the same
\* shared code as bhimruler-chak (`open = Math.max(levels.unlocked, friend?.level ?? 1)`, line 109, and
\* shared/game-core.ts unlockedLevel), which ai_docs/statecharts/bhimruler-chak/Orchard.tla models. See the README.
EXTENDS Naturals

VARIABLES g, paused, win, drag, rattle, sound, cheer
vars == <<g, paused, win, drag, rattle, sound, cheer>>

Here == win = "here"
Shown == win # "hidden"
\* useGameLoop runs while !paused && (busy || !done), and its rAF stops while the tab is hidden.
Animates == ~paused /\ Shown
Moved == g \in {"still", "busy", "stuck", "shaking"}   \* game.moves.length && !game.over

Init == /\ g = "ready" /\ paused = FALSE /\ win = "here" /\ drag = FALSE
        /\ rattle = FALSE /\ sound = TRUE /\ cheer = FALSE

\* trySwap(): only when not busy, not paused, not over. Tap one then the other, or Enter and an arrow.
YouSwap == /\ Here /\ ~drag /\ ~paused /\ g \in {"ready", "still"}
           /\ g' \in {"busy", "final"}
           /\ UNCHANGED <<paused, win, drag, rattle, sound, cheer>>
\* onPointerDown: press.current = the bangle under the pointer (not when busy, paused or done).
YouStartADrag == /\ Here /\ ~drag /\ ~paused /\ g \in {"ready", "still"}
                 /\ drag' = TRUE
                 /\ UNCHANGED <<g, paused, win, rattle, sound, cheer>>
\* onPointerMove: any move past 35% of a cell with press.current set swaps, whatever the buttons are now.
ThePointerMovesAcross == /\ Here /\ drag
                         /\ drag' = FALSE
                         /\ IF ~paused /\ g \in {"ready", "still"} THEN g' \in {"busy", "final"} ELSE g' = g
                         /\ UNCHANGED <<paused, win, rattle, sound, cheer>>
\* onPointerUp / onPointerCancel: press.current = null. They reach the canvas only while you're on the page.
YouLetGo == /\ Here /\ drag /\ drag' = FALSE
            /\ UNCHANGED <<g, paused, win, rattle, sound, cheer>>

\* step() → settle(): the queue empties. The tray can also run out of swaps (a shake phase waits for you).
TheCascadeEnds == /\ Animates /\ g = "busy" /\ g' = "still"
                  /\ UNCHANGED <<paused, win, drag, rattle, sound, cheer>>
NoSwapIsLeft == /\ Animates /\ g = "busy" /\ g' = "stuck"
                /\ UNCHANGED <<paused, win, drag, rattle, sound, cheer>>
\* settle() with game.over → done → the end effect: levels.record once, then setTimeout(jingle, 120) and
\* setTimeout(win or good, 450 + 260 × stars), never cleared. Moves run out: setTimeout(sfx.lose, 150).
TheLevelIsWon == /\ Animates /\ g = "final"
                 /\ g' = "won" /\ cheer' = TRUE
                 /\ UNCHANGED <<paused, win, drag, rattle, sound>>
TheMovesRunOut == /\ Animates /\ g = "final"
                  /\ g' = "lost" /\ cheer' = TRUE
                  /\ UNCHANGED <<paused, win, drag, rattle, sound>>
\* The setTimeouts fire, wherever you are by then.
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<g, paused, win, drag, rattle, sound>>

\* shakeTray() from চুড়ি ঝাঁকাও or Enter: jingle, rattle = loop("static") (a silent stub when sound is off).
YouShakeTheTray == /\ Here /\ ~paused /\ g = "stuck"
                   /\ g' = "shaking" /\ rattle' = sound
                   /\ UNCHANGED <<paused, win, drag, sound, cheer>>
\* The shake phase ends (p >= 1) and stops the rattle; its 800 ms timer stops it at about the same time.
TheShakeEnds == /\ Animates /\ g = "shaking"
                /\ g' = "still" /\ rattle' = FALSE
                /\ UNCHANGED <<paused, win, drag, sound, cheer>>

\* No blur or focus listener in the component.
WindowBlurs == /\ Here /\ win' = "away" /\ UNCHANGED <<g, paused, drag, rattle, sound, cheer>>
WindowFocuses == /\ win = "away" /\ win' = "here" /\ UNCHANGED <<g, paused, drag, rattle, sound, cheer>>
\* hide(): stop the rattle; pause if a move was made and the level isn't over. press.current is left as it is.
TabHides == /\ Shown
            /\ win' = "hidden" /\ rattle' = FALSE
            /\ paused' = (paused \/ Moved)
            /\ UNCHANGED <<g, drag, sound, cheer>>
TabShows == /\ win = "hidden" /\ win' = "here" /\ UNCHANGED <<g, paused, drag, rattle, sound, cheer>>
\* চালিয়ে যাও or Enter: setPaused(false). Nothing restarts the rattle.
YouResume == /\ Here /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<g, win, drag, rattle, sound, cheer>>

\* SoundToggle: off → setSoundOn(false) stops every loop, and onChange stops the rattle. On starts nothing.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ rattle' = FALSE
            /\ UNCHANGED <<g, paused, win, drag, cheer>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<g, paused, win, drag, rattle, cheer>>

\* begin(startGame(l)) from LevelGrid (open even mid-cascade), আরেকবার, আবার খেলো, পরের লেভেল, Enter, or a friend's
\* link (readFriend → playLevel): stops the rattle, clears paused, busy and needShake. It does not clear the end timers
\* or press.current.
YouStartALevel == /\ Here /\ ~drag
                  /\ g' = "ready" /\ paused' = FALSE /\ rattle' = FALSE
                  /\ UNCHANGED <<win, drag, sound, cheer>>

Next == \/ YouSwap \/ YouStartADrag \/ ThePointerMovesAcross \/ YouLetGo
        \/ TheCascadeEnds \/ NoSwapIsLeft \/ TheLevelIsWon \/ TheMovesRunOut \/ TheCheerPlays
        \/ YouShakeTheTray \/ TheShakeEnds
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume
        \/ SoundOff \/ SoundOn
        \/ YouStartALevel

Spec == Init /\ [][Next]_vars

TypeOK == /\ g \in {"ready", "still", "busy", "final", "stuck", "shaking", "won", "lost"}
          /\ paused \in BOOLEAN /\ win \in {"here", "away", "hidden"} /\ drag \in BOOLEAN
          /\ rattle \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in BOOLEAN

\* ---- the reader's rules ----
\* InputReleasedWhenAway: once you leave the window or the tab, no drag is still in flight.
InputReleasedWhenAway == drag => Here
\* PausedWhenHidden: a hidden tab with a level under way shows the pause card when you come back.
PausedWhenHidden == (win = "hidden" /\ Moved) => paused
\* LoopOnlyWhenMeaningful: the rattle plays only while the tray shakes, with sound on, the tab shown and not paused.
RattleOnlyWhileShaking == rattle => (g = "shaking" /\ sound /\ Shown /\ ~paused)
\* LoopComesBack: while the tray shakes on screen with sound on, the rattle is playing.
RattleWhileShaking == (g = "shaking" /\ sound /\ Animates) => rattle
\* NoDoubleResult / timers: the end jingle, the win or lose sound and the confetti play only on that level's result.
NoCheerAfterYouMoveOn == cheer => g \in {"won", "lost"}
====
