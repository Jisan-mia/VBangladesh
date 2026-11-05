---- MODULE NirapodeThakiPace ----
\* নিরাপদে থাকি: how many pictures the next question shows. Mirrored from:
\*   tools/nirapode-thaki/lib/play.ts       nextPace (three first-tap misses in a row → one picture fewer, five first-tap rights in a
\*                                          row → one more), choiceCount, createRound(id, seed, pace)
\*   tools/nirapode-thaki/components/game.tsx  begin() starts the next round with roundRef.current.pace, finishRound() likewise
\* Three first-tap rights stand for five, two questions a round: a run that earns the extra picture has to cross the end of a
\* round. The old game reset its streak in newRound(), so a five-question scene could never reach "five right in a row" from a
\* fresh start. `offset` is -1, 0 or +1 pictures from the level's own count.
EXTENDS Naturals
VARIABLES q, tried, rounds, run, miss, offset, rightRun, dropped
vars == <<q, tried, rounds, run, miss, offset, rightRun, dropped>>

Init == /\ q = 1 /\ tried = FALSE /\ rounds = 0 /\ run = 0 /\ miss = 0 /\ offset = 0 /\ rightRun = 0 /\ dropped = FALSE

\* answer(): a wrong picture on this question. Only the first miss counts for the pace (a repeat is ignored).
YouTapAWrongPicture == /\ ~tried /\ tried' = TRUE /\ UNCHANGED <<q, rounds, run, miss, offset, rightRun, dropped>>
\* The safe picture: first-tap or not, nextPace() moves the pace.
YouTapTheSafePicture == /\ IF tried
                           THEN /\ IF miss = 2 THEN (miss' = 0 /\ offset' = (IF offset = 0 THEN 0 ELSE offset - 1)) ELSE (miss' = miss + 1 /\ UNCHANGED offset)
                                /\ run' = 0 /\ rightRun' = 0
                           ELSE /\ miss' = 0 /\ rightRun' = (IF rightRun = 3 THEN 3 ELSE rightRun + 1)
                                /\ IF run = 2 THEN (run' = 0 /\ offset' = (IF offset = 1 THEN 1 ELSE offset + 1)) ELSE (run' = run + 1 /\ UNCHANGED offset)
                        /\ tried' = FALSE
                        /\ IF q = 2 THEN (q' = 1 /\ rounds' = (IF rounds = 2 THEN 2 ELSE rounds + 1)) ELSE (q' = 2 /\ UNCHANGED rounds)
                        /\ UNCHANGED dropped

Next == YouTapAWrongPicture \/ YouTapTheSafePicture

Spec == Init /\ [][Next]_vars

TypeOK == /\ q \in 1..2 /\ tried \in BOOLEAN /\ rounds \in 0..2 /\ run \in 0..2 /\ miss \in 0..2 /\ offset \in 0..1 /\ rightRun \in 0..3 /\ dropped \in BOOLEAN

\* The pace is kept when a new round starts: a run of first-tap rights is never cut by the end of a scene.
PaceSurvivesTheRound == ~dropped
\* Gap 1: after three first-tap rights in a row (five in the game), whatever rounds they spanned, a fourth picture is on offer.
FiveRightAddsAChoice == rightRun = 3 => offset = 1
====
