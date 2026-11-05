---- MODULE JoraKey ----
\* জোড়া মেলাও: Enter held through the end of a board. Mirrors the result branch of keyHandler in
\* tools/jora-melao/components/jora-game.tsx: a numbered choice acts only on a keydown with !event.repeat that arrives
\* 400 ms after the end screen showed, and a button reached with Tab does its own job. Kept apart from JoraMelao.tla
\* so the main chart stays under the state budget.
EXTENDS Naturals
VARIABLES phase, held, repeat, skipped
vars == <<phase, held, repeat, skipped>>

Init == phase = "play" /\ held = FALSE /\ repeat = FALSE /\ skipped = FALSE
\* You press Enter (a fresh keydown) while playing: it flips a focused card, never the end screen.
YouPressEnter == /\ ~held /\ held' = TRUE /\ repeat' = FALSE
                 /\ IF phase = "end" THEN /\ phase' = "play" /\ UNCHANGED skipped ELSE UNCHANGED <<phase, skipped>>
\* Holding it down: the OS sends repeats, `event.repeat` is true, and the handler ignores them.
EnterRepeats == /\ held /\ repeat' = TRUE /\ skipped' = (skipped \/ FALSE) /\ UNCHANGED <<phase, held>>
YouLetGo == /\ held /\ held' = FALSE /\ UNCHANGED <<phase, repeat, skipped>>
\* The last pair is found and the end screen shows.
TheEndScreenShows == /\ phase = "play" /\ phase' = "end" /\ UNCHANGED <<held, repeat, skipped>>
Next == YouPressEnter \/ EnterRepeats \/ YouLetGo \/ TheEndScreenShows
Spec == Init /\ [][Next]_vars

TypeOK == phase \in {"play", "end"} /\ held \in BOOLEAN /\ repeat \in BOOLEAN /\ skipped \in BOOLEAN
\* A key held through the end of a board never skips the end screen: only a fresh press leaves it.
ResultNeedsFreshPress == ~skipped
LeavingTheEndNeedsAFreshPress == [][(phase = "end" /\ phase' = "play") => (~held /\ held')]_vars
====
