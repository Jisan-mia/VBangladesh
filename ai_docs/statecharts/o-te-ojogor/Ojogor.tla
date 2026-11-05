---- MODULE Ojogor ----
\* অ-তে অজগর after the rewrite (games-to-the-bar): the round, the player's pause menu, pause and focus, and the held arrow
\* (or finger) that steers the basket in ঝড়ো হাওয়া. Mirrored from tools/o-te-ojogor/lib/session.ts (start, finish, again,
\* home, pause, resume, leave, back, grab, letGo), tools/o-te-ojogor/lib/tree.ts (hold) and
\* tools/o-te-ojogor/components/tree-game.tsx (begin, finish, playAgain, finishUp, toTitle, pauseNow, the window
\* blur / focus / visibility listeners, the keys handler, onBoardDown, readLink, useGamePlayer onPause / onResume / onRestart),
\* plus shared/game-player-client.tsx (openMenu on blur, hide, Escape, ⏸ and P once "engaged"; resume; restart).
\* Levels, unlocks and links: OjogorLevels.tla. The kids' rules: OjogorKids.tla.
\* "hand": off; held (an arrow or finger steers the basket); stuck (let go, but the basket still glides to the edge).
\* Left out: গাছতলা's taps (a tap only picks; it moves nothing by itself), the stage scrolled off screen (the player
\* pauses it like blur), and the per-letter rules in lib/ (node tests).
EXTENDS Naturals
VARIABLES phase, paused, menu, engaged, window, hand
vars == <<phase, paused, menu, engaged, window, hand>>

Here == window = "here"
\* useGameLoop runs while phase === "play" && !paused; it also stops on blur and hide.
Running == phase = "play" /\ ~paused /\ Here

Init == phase = "title" /\ paused = FALSE /\ menu = FALSE /\ engaged = FALSE /\ window = "here" /\ hand = "off"

\* openMenu(): the menu shows; onPause → pauseNow(): the session pauses a round in play, and hold() lets go.
OpenMenu == menu' = TRUE /\ paused' = (paused \/ phase = "play") /\ hand' = "off"
\* The game's own leave() on blur and hide: pause a round in play and let go. The player's away() opens the menu once engaged.
GoAway(w) == /\ window' = w /\ paused' = (paused \/ phase = "play") /\ hand' = "off" /\ menu' = (menu \/ engaged)
             /\ UNCHANGED <<phase, engaged>>

\* খেলো (a tap inside the player, so now engaged), or Space / Enter: begin() → start(). Refused while away.
YouPressStart == /\ phase = "title" /\ Here /\ ~menu /\ phase' = "play" /\ engaged' = TRUE /\ paused' = FALSE /\ hand' = "off"
                 /\ UNCHANGED <<menu, window>>
\* keydown ← / → or a finger on the board: grab(), only while the round moves and no menu swallows keys.
YouHoldAnArrow == /\ phase = "play" /\ ~paused /\ ~menu /\ Here /\ hand = "off" /\ hand' = "held"
                  /\ UNCHANGED <<phase, paused, menu, engaged, window>>
\* keyup / pointerup: letGo() and hold() on every arrow keyup, paused or not.
YouLetGo == /\ hand = "held" /\ Here /\ hand' = "off"
            /\ UNCHANGED <<phase, paused, menu, engaged, window>>
\* ⏸, Escape, or the game's own P (player.requestPause()).
YouPressPause == /\ Here /\ ~menu /\ OpenMenu /\ UNCHANGED <<phase, engaged, window>>
WindowBlurs == Here /\ GoAway("blurred")
WindowFocuses == window = "blurred" /\ window' = "here" /\ UNCHANGED <<phase, paused, menu, engaged, hand>>
TabHides == window # "hidden" /\ GoAway("hidden")
TabShows == window = "hidden" /\ window' = "here" /\ UNCHANGED <<phase, paused, menu, engaged, hand>>
\* চালিয়ে যাও: focus → back(), then onResume → resume() and hold().
YouResume == /\ menu /\ Here /\ menu' = FALSE /\ paused' = FALSE /\ hand' = "off" /\ UNCHANGED <<phase, engaged, window>>
\* No menu up (it blurred before anyone touched the game): the first tap on the board only wakes the round, never a move.
YouTapToWake == /\ paused /\ ~menu /\ Here /\ paused' = FALSE /\ UNCHANGED <<phase, menu, engaged, window, hand>>
\* নতুন করে শুরু: onRestart → toTitle(level): this level's title, nothing moving.
YouRestart == /\ menu /\ Here /\ menu' = FALSE /\ phase' = "title" /\ paused' = FALSE /\ hand' = "off" /\ UNCHANGED <<engaged, window>>
\* step(): the last right letter lands → finish().
TheLastLetterLands == Running /\ phase' = "done" /\ hand' = "off" /\ UNCHANGED <<paused, menu, engaged, window>>
\* আবার খেলো (or a fresh Space / Enter), after the guard.
YouPlayAgain == /\ phase = "done" /\ Here /\ ~menu /\ phase' = "play" /\ hand' = "off" /\ UNCHANGED <<paused, menu, engaged, window>>
\* শেষ (finishUp), a picked level (only between rounds), or an old link (from any screen): a title, nothing moving.
YouGoToATitle == /\ Here /\ ~menu /\ phase # "title" /\ phase' = "title" /\ paused' = FALSE /\ hand' = "off"
                 /\ (phase = "done" \/ phase = "play") /\ UNCHANGED <<menu, engaged, window>>

Next == YouPressStart \/ YouHoldAnArrow \/ YouLetGo \/ YouPressPause \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ YouTapToWake \/ YouRestart \/ TheLastLetterLands \/ YouPlayAgain \/ YouGoToATitle

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "play", "done"} /\ paused \in BOOLEAN /\ menu \in BOOLEAN /\ engaged \in BOOLEAN
          /\ window \in {"here", "blurred", "hidden"} /\ hand \in {"off", "held", "stuck"}

\* The reader's rules (the same as before the fix, never weakened).
\* The letters don't fall while you're in another window or tab.
NoProgressWhileAway == Running => Here
\* A round in progress is paused while you're in another window.
PausedWhenBlurred == (phase = "play" /\ window = "blurred") => paused
\* A round in progress is paused while its tab is hidden.
PausedWhenHidden == (phase = "play" /\ window = "hidden") => paused
\* While the pause menu is open, nothing falls.
MenuFreezesPlay == menu => ~Running
\* After blur or hide, no key counts as held.
InputReleasedWhenAway == hand = "held" => Here
\* When you let go of the arrow, the basket stops.
BasketStopsWhenYouLetGo == hand # "stuck"
\* Only a round in progress is ever paused.
PausedOnlyMidLevel == paused => phase = "play"
\* Nothing is held unless the round is moving.
HeldOnlyWhileMoving == hand = "held" => Running
====
