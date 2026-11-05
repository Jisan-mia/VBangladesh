---- MODULE ChhayaStars ----
\* ছায়া মেলাও: how a round earns its stars and where they are saved. A round has 4 scored matches (the real one 3–9); the last toy on
\* the last open shadow can only be right, so it is not scored (tools/chhaya-melao/lib/round.ts place(): `forced`).
\*   round.ts starsOf / resultOf, game.tsx attempt() → levels.record at the last match, shared/game-core.ts recordLevel (keeps the better)
EXTENDS Naturals
VARIABLES phase, scored, first, forced, best, shown, dropped
vars == <<phase, scored, first, forced, best, shown, dropped>>
Stars(f) == IF f >= 3 THEN 3 ELSE IF f >= 2 THEN 2 ELSE 1   \* starsFor(first, count - 1, ceil(count / 2)) with count = 4

Init == phase = "title" /\ scored = 0 /\ first = 0 /\ forced = FALSE /\ best = 0 /\ shown = 0 /\ dropped = FALSE
YouStartARound == /\ phase \in {"title", "end"} /\ phase' = "play" /\ scored' = 0 /\ first' = 0 /\ forced' = FALSE /\ shown' = 0 /\ UNCHANGED <<best, dropped>>
\* A scored match: on the first try, or after a slip.
Record(f) == LET s == Stars(f) IN LET kept == (IF s > best THEN s ELSE best) IN /\ phase' = "end" /\ shown' = s /\ best' = kept /\ dropped' = (dropped \/ kept < best)
YouMatchOnTheFirstTry == /\ phase = "play" /\ scored < 4 /\ scored' = scored + 1 /\ first' = first + 1 /\ UNCHANGED forced
                         /\ IF scored + 1 = 4 THEN Record(first + 1) ELSE UNCHANGED <<phase, best, shown, dropped>>
YouMatchAfterASlip == /\ phase = "play" /\ scored < 4 /\ scored' = scored + 1 /\ UNCHANGED <<first, forced>>
                      /\ IF scored + 1 = 4 THEN Record(first) ELSE UNCHANGED <<phase, best, shown, dropped>>
\* The forced last toy: it lands, it earns and costs nothing. Only after every other match is scored.
YouMatchTheLastToy == /\ phase = "play" /\ scored = 4 /\ ~forced /\ forced' = TRUE /\ UNCHANGED <<phase, scored, first, best, shown, dropped>>
YouGoBackToTheTitle == /\ phase = "end" /\ phase' = "title" /\ UNCHANGED <<scored, first, forced, best, shown, dropped>>
Next == YouStartARound \/ YouMatchOnTheFirstTry \/ YouMatchAfterASlip \/ YouMatchTheLastToy \/ YouGoBackToTheTitle \/ (phase = "end" /\ UNCHANGED vars)
Spec == Init /\ [][Next]_vars
TypeOK == phase \in {"title", "play", "end"} /\ scored \in 0..4 /\ first \in 0..4 /\ forced \in BOOLEAN /\ best \in 0..3 /\ shown \in 0..3 /\ dropped \in BOOLEAN
\* A level's best only goes up: a worse round never lowers it.
StarsNeverDrop == ~dropped
\* The stars on the end screen are this round's, and the saved best is at least that.
ResultMatchesPlay == phase = "end" => (shown = Stars(first) /\ best >= shown)
\* A round that slipped on every scored match still finishes with a star, and never with 3.
EveryRoundEarnsAStar == phase = "end" => shown >= 1
NoThreeStarsWithSlips == (phase = "end" /\ first < 3) => shown < 3
====
