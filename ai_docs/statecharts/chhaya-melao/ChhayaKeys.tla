---- MODULE ChhayaKeys ----
\* ছায়া মেলাও: a key held through the end of a round. Enter or Space on the end screen starts the next round only from a fresh press
\* (no repeat, a keydown after the screen appeared): tools/chhaya-melao/lib/session.ts freshKey(), game.tsx's window keydown handler.
EXTENDS Naturals
VARIABLES screen, held, repeating, skipped
vars == <<screen, held, repeating, skipped>>
Init == screen = "title" /\ held = FALSE /\ repeating = FALSE /\ skipped = FALSE
\* The title: Enter starts (a fresh press, no repeat).
YouPressEnterOnTheTitle == /\ screen = "title" /\ ~held /\ screen' = "play" /\ held' = TRUE /\ UNCHANGED <<repeating, skipped>>
YouHoldEnterWhilePlaying == /\ screen = "play" /\ ~held /\ held' = TRUE /\ UNCHANGED <<screen, repeating, skipped>>
\* The hold after the last wall runs out and the end screen comes while the key is still down.
TheEndScreenComes == /\ screen = "play" /\ screen' = "end" /\ UNCHANGED <<held, repeating, skipped>>
\* The key auto-repeats while held: a repeat is never a fresh press.
TheKeyRepeats == /\ held /\ ~repeating /\ repeating' = TRUE /\ UNCHANGED <<screen, held, skipped>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE /\ repeating' = FALSE /\ UNCHANGED <<screen, skipped>>
\* A fresh press on the end screen: আবার খেলো. A repeat, or a key down since before the screen, is refused by freshKey().
YouPressEnterAgain == /\ screen = "end" /\ ~held /\ screen' = "play" /\ held' = TRUE /\ UNCHANGED <<repeating, skipped>>
YouGoBackToTheTitle == /\ screen = "end" /\ screen' = "title" /\ UNCHANGED <<held, repeating, skipped>>
Next == YouPressEnterOnTheTitle \/ YouHoldEnterWhilePlaying \/ TheEndScreenComes \/ TheKeyRepeats \/ YouLetGoOfTheKey \/ YouPressEnterAgain \/ YouGoBackToTheTitle
Spec == Init /\ [][Next]_vars
TypeOK == screen \in {"title", "play", "end"} /\ held \in BOOLEAN /\ repeating \in BOOLEAN /\ skipped \in BOOLEAN
\* A key held through the end never skips it or starts the next round.
ResultNeedsFreshPress == ~skipped
\* A repeat never begins a round.
RepeatNeverStarts == [][(screen = "end" /\ screen' = "play") => ~repeating]_vars
====
