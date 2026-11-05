---- MODULE Churir ----
\* চুড়ির বাজার, after the rewrite: a move and its animation, the tray that shakes when no swap is left (and its rattle loop), the
\* player's pause menu, window focus, the press in flight, the sound switch and the end-of-level notes. Mirrored from tools/churir-bazar/components/churir-game.tsx (swap, settled, finish, begin, the player's onPause /
\* onResume, the blur / focus / visibility listeners), lib/session.ts (live, canMove and its 250 ms breath, press, dragCounts,
\* syncLoops / wantRattle, startRun, cheer) and lib/save.ts (readOpen, openAfter).
\* Abstractions: the tray is not modelled cell by cell. "anim" is the animation of a move that leaves the level going; "last" is the
\* animation of the move that ends it (game.over is already true, and the result shows when the animation has settled).
\* Left out: the open levels and the friend's link (lib/save.ts readOpen / openAfter, proved in tests/session.test.ts and by the
\* shared model ai_docs/statecharts/bhimruler-chak/Orchard.tla); together they would push the chart past its 500-state budget.
EXTENDS Naturals

VARIABLES g, paused, win, drag, btn, rattle, sound, cheer
vars == <<g, paused, win, drag, btn, rattle, sound, cheer>>

Here == win = "here"
Shown == win # "hidden"
\* live(session): on the play screen, no menu or choice, tab shown, window focused. The rAF loop runs only then.
Live == ~paused /\ Here
Playing == g \in {"ready", "still", "anim", "last", "shaking"}

Init == /\ g = "title" /\ paused = FALSE /\ win = "here" /\ drag = FALSE /\ btn = FALSE
        /\ rattle = FALSE /\ sound = TRUE /\ cheer = FALSE

\* begin(): from the title, the end screen, আবার খেলো, পরের লেভেল or নতুন করে শুরু. startRun cuts every scheduled note
\* (silenceScheduled), clears the shake, and the press in flight is gone (show() clears press.current).
YouStartALevel == /\ Here /\ (g = "title" \/ Playing \/ g \in {"won", "lost"}) /\ ~drag
                  /\ g' = "ready" /\ paused' = FALSE /\ cheer' = FALSE /\ rattle' = FALSE
                  /\ UNCHANGED <<win, drag, btn, sound>>

\* onPointerDown → S.press: only on a live tray (not in the breath after চালিয়ে যাও, which the model folds into Live).
YouPressABangle == /\ Live /\ btn = FALSE /\ g \in {"ready", "still", "anim", "last"} /\ ~drag
                   /\ btn' = TRUE /\ drag' = TRUE
                   /\ UNCHANGED <<g, paused, win, rattle, sound, cheer>>
\* onPointerMove: counts only while the press is down (dragCounts); the swap starts at once, a new press skips the old animation.
ThePointerMovesAcross == /\ Live /\ drag /\ btn /\ g \in {"ready", "still", "anim", "last"}
                         /\ drag' = FALSE /\ g' \in {"anim", "last"}
                         /\ UNCHANGED <<paused, win, btn, rattle, sound, cheer>>
\* A mouse that moves with no button held: dragCounts is false, the press is dropped, nothing swaps.
TheMouseMovesWithNoButton == /\ Live /\ drag /\ ~btn /\ drag' = FALSE
                             /\ UNCHANGED <<g, paused, win, btn, rattle, sound, cheer>>
\* onPointerUp / onPointerCancel / lostpointercapture.
YouLetGo == /\ Here /\ btn /\ btn' = FALSE /\ drag' = FALSE
            /\ UNCHANGED <<g, paused, win, rattle, sound, cheer>>

\* frame() → settled(): the animation is over. The next hint is armed; or the level ends and the result shows (finish, once).
TheMoveSettles == /\ Live /\ g = "anim" /\ g' = "still" /\ UNCHANGED <<paused, win, drag, btn, rattle, sound, cheer>>
NoSwapIsLeft == /\ Live /\ g = "anim" /\ g' = "shaking" /\ rattle' = sound
                /\ UNCHANGED <<paused, win, drag, btn, sound, cheer>>
\* finish(): levels.record once, openAfter (only your own open level opens the next), the call and the star notes are scheduled
\* on the audio clock (tone(…, delay)) and confetti fires at once.
TheLevelIsWon == /\ Live /\ g = "last" /\ g' = "won" /\ cheer' = TRUE
                 /\ UNCHANGED <<paused, win, drag, btn, rattle, sound>>
TheMovesRunOut == /\ Live /\ g = "last" /\ g' = "lost" /\ cheer' = TRUE
                  /\ UNCHANGED <<paused, win, drag, btn, rattle, sound>>
\* The notes sound out (time passes).
TheCheerEnds == /\ cheer /\ cheer' = FALSE
                /\ UNCHANGED <<g, paused, win, drag, btn, rattle, sound>>

\* The shake is part of the move's timeline: it ends with the shake segment (no fixed timer), and the rattle stops with it.
TheShakeEnds == /\ Live /\ g = "shaking" /\ g' = "still" /\ rattle' = FALSE
                /\ UNCHANGED <<paused, win, drag, btn, sound, cheer>>

\* blur / hide: S.blur / S.hide drop the press and stop the rattle (syncLoops); the player opens its menu.
WindowBlurs == /\ Here /\ win' = "away" /\ drag' = FALSE /\ rattle' = FALSE
               /\ UNCHANGED <<g, paused, btn, sound, cheer>>
WindowFocuses == /\ win = "away" /\ win' = "here" /\ rattle' = (sound /\ g = "shaking" /\ ~paused)
                 /\ UNCHANGED <<g, paused, drag, btn, sound, cheer>>
TabHides == /\ Shown /\ win' = "hidden" /\ drag' = FALSE /\ rattle' = FALSE
            /\ paused' = (paused \/ Playing)
            /\ UNCHANGED <<g, btn, sound, cheer>>
TabShows == /\ win = "hidden" /\ win' = "here" /\ rattle' = (sound /\ g = "shaking" /\ ~paused)
            /\ UNCHANGED <<g, paused, drag, btn, sound, cheer>>
\* P, Esc, ⏸, সব লেভেল (a choice): the menu opens; the press is dropped and the rattle stops.
YouPause == /\ Here /\ ~paused /\ (Playing \/ g \in {"won", "lost"}) /\ paused' = TRUE /\ drag' = FALSE /\ rattle' = FALSE
            /\ UNCHANGED <<g, win, btn, sound, cheer>>
\* চালিয়ে যাও: onResume → syncLoops: the rattle comes back if the tray is still shaking.
YouResume == /\ Here /\ paused /\ paused' = FALSE /\ rattle' = (sound /\ g = "shaking")
             /\ UNCHANGED <<g, win, drag, btn, sound, cheer>>

\* The site-wide switch. Off: setSoundOn stops every loop. On: the sound effect in churir-game.tsx calls setSound + syncLoops.
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ rattle' = FALSE
            /\ UNCHANGED <<g, paused, win, drag, btn, cheer>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE /\ rattle' = (g = "shaking" /\ Live)
           /\ UNCHANGED <<g, paused, win, drag, btn, cheer>>

Next == \/ YouStartALevel
        \/ YouPressABangle \/ ThePointerMovesAcross \/ TheMouseMovesWithNoButton \/ YouLetGo
        \/ TheMoveSettles \/ NoSwapIsLeft \/ TheLevelIsWon \/ TheMovesRunOut \/ TheCheerEnds \/ TheShakeEnds
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume
        \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ g \in {"title", "ready", "still", "anim", "last", "shaking", "won", "lost"}
          /\ paused \in BOOLEAN /\ win \in {"here", "away", "hidden"} /\ drag \in BOOLEAN /\ btn \in BOOLEAN
          /\ rattle \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in BOOLEAN

\* ---- the reader's rules ----
\* InputReleasedWhenAway: once you leave the window, the tab or open the menu, no press is still in flight.
InputReleasedWhenAway == drag => (Here /\ ~paused)
\* A press in flight always has a button (or finger) down: a mouse move with none held is never a drag.
NoDragWithoutAPress == drag => btn
\* PausedWhenHidden: a hidden tab with a level under way shows the pause menu when you come back.
PausedWhenHidden == (win = "hidden" /\ Playing) => paused
\* RattleOnlyWhileShaking: the rattle plays only while the tray shakes, with sound on, the window live.
RattleOnlyWhileShaking == rattle => (g = "shaking" /\ sound /\ Live)
\* RattleComesBack: while the tray shakes on a live screen with sound on, the rattle is playing.
RattleComesBack == (g = "shaking" /\ sound /\ Live) => rattle
\* NoCheerAfterYouMoveOn: the result's notes are scheduled only while that level's result is on screen.
NoCheerAfterYouMoveOn == cheer => g \in {"won", "lost"}
====
