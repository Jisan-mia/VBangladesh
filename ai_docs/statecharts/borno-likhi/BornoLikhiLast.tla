---- MODULE BornoLikhiLast ----
\* বর্ণ লিখি, the last letter of a set and the end card, on their own so each chart stays small. Mirrored from:
\*   tools/borno-likhi/lib/session.ts   letterDone (records once per set: s.recorded === s.serial), goNext, writeAgain,
\*                                      freshKey (a repeat, or a key that began before the screen appeared, is refused), route
\*   tools/borno-likhi/components/likhi-game.tsx   the last letter calls levels.record and kids.atBreak() in the same touch
\* A child can write the last letter again (↺) after its picture appeared; the set must still record once. A key held
\* through the last stroke (Enter or Space) auto-repeats on the picture and on the end card; it must neither skip the picture
\* nor start another round. The key's own first press is `held`; `fresh` is whether it began after the screen appeared.
EXTENDS Naturals
VARIABLES screen, phase, records, held, fresh, skipped, overLimit, resting
vars == <<screen, phase, records, held, fresh, skipped, overLimit, resting>>

RestShows == resting /\ screen # "play"

Init == /\ screen = "play" /\ phase = "tracing" /\ records = 0 /\ held = FALSE /\ fresh = FALSE
        /\ skipped = FALSE /\ overLimit \in BOOLEAN /\ resting = FALSE

\* letterDone(last = TRUE): the first completion records the set and asks the limit; later ones record nothing.
YouWriteTheLastStroke == /\ screen = "play" /\ phase = "tracing" /\ phase' = "drawn"
                         /\ records' = IF records = 0 THEN 1 ELSE records
                         /\ resting' = IF records = 0 THEN overLimit ELSE resting
                         /\ fresh' = FALSE
                         /\ UNCHANGED <<screen, held, skipped, overLimit>>
YouTapWriteAgain == /\ screen = "play" /\ phase = "drawn" /\ ~RestShows /\ phase' = "tracing"
                    /\ UNCHANGED <<screen, records, held, fresh, skipped, overLimit, resting>>
YouTapNext == /\ screen = "play" /\ phase = "drawn" /\ ~RestShows /\ screen' = "end" /\ fresh' = FALSE
              /\ UNCHANGED <<phase, records, held, skipped, overLimit, resting>>
\* begin(): atBreak() first. Past the limit the rest screen shows and nothing starts.
YouTapTheEndButton == /\ screen = "end" /\ ~RestShows
                      /\ IF overLimit THEN resting' = TRUE /\ UNCHANGED <<screen, phase, records>>
                         ELSE screen' = "play" /\ phase' = "tracing" /\ records' = 0 /\ resting' = FALSE
                      /\ UNCHANGED <<held, fresh, skipped, overLimit>>
\* A key goes down on the picture or the end card. If it went down before the screen appeared it is not fresh.
YouPressTheKey == /\ screen \in {"play", "end"} /\ ~held /\ held' = TRUE
                  /\ fresh' = (phase = "drawn" \/ screen = "end") /\ UNCHANGED <<screen, phase, records, skipped, overLimit, resting>>
\* route(): a result key counts only when !repeat and its timeStamp is after the screen's. An unrepeated, fresh press is a
\* real press (it taps → or আবার খেলো); a repeat or an old press does nothing.
TheKeyRepeats == /\ held /\ ~RestShows /\ skipped' = skipped
                 /\ UNCHANGED <<screen, phase, records, held, fresh, overLimit, resting>>
YouLetGoOfTheKey == /\ held /\ held' = FALSE /\ fresh' = FALSE /\ UNCHANGED <<screen, phase, records, skipped, overLimit, resting>>
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<screen, phase, records, held, fresh, skipped, resting>>
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<screen, phase, records, held, fresh, skipped>>

Next == YouWriteTheLastStroke \/ YouTapWriteAgain \/ YouTapNext \/ YouTapTheEndButton \/ YouPressTheKey \/ TheKeyRepeats
        \/ YouLetGoOfTheKey \/ TimeIsUp \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"play", "end"} /\ phase \in {"tracing", "drawn"} /\ records \in 0..2
          /\ held \in BOOLEAN /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* A set records once, however many times its last letter is written again.
NoDoubleResult == records <= 1
\* The picture and the end card are never skipped or restarted by a key held through them.
ResultNeedsFreshPress == ~skipped
\* The rest screen comes only between rounds, never over a letter.
RestOnlyAtBreak == RestShows => screen # "play"
====
