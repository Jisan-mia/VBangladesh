---- MODULE ShomanBhag ----
\* সমান ভাগ, as the code stands on 2026-11-04 (branch games-to-the-bar):
\*   tools/shoman-bhag/components/bhag-game.tsx  (apply + its speak() calls, the "serving rests, then the next guests come"
\*                                              effect and its 1.7 s / 2.8 s timer, restart, the end and closed screens,
\*                                              the সব ধাপ drawer, ParentGate)
\*   tools/shoman-bhag/lib/game.ts               (tapBasket, tapPlate, settle, decide, cut, complete, nextItem)
\*   shared/kids-kit.tsx                         (speak() never reads the sound switch; useKidsSession, RestScreen, ParentGate)
\* Two kinds of step stand for the five: a sharing step (ধাপ ১–৩: a plain serving, then the serving with one left over)
\* and the cutting step (ধাপ ৪: share, cut the last রুটি, give each a piece). The naming step (ধাপ ৫) speaks the same way.
\* Misses only add tries, so "you share fairly" is one step. The code has no blur or visibilitychange handler, so "away"
\* is one flag for both.
EXTENDS Naturals, FiniteSets

VARIABLES kind, item, stage, phase, away, sound, recorded, late, resting, gate, holder, sent, stored
vars == <<kind, item, stage, phase, away, sound, recorded, late, resting, gate, holder, sent, stored>>

Stages == {"share", "left", "cut", "done"}
Phases == {"play", "end", "closed"}
LastItem(k) == IF k = "share" THEN 2 ELSE 1

Init == /\ kind = "share" /\ item = 1 /\ stage = "share" /\ phase = "play"
        /\ away = FALSE /\ sound = TRUE /\ recorded = 0
        /\ late = FALSE /\ resting = FALSE /\ gate = FALSE /\ holder = "child" /\ sent = FALSE /\ stored = {}

\* restart(level): newRound, phase "play" (the effect's cleanup drops a pending serving timer).
\* The cutting step opens on its cut: its sharing part is the same as the sharing step's.
Restart(k) == /\ kind' = k /\ item' = 1 /\ stage' = (IF k = "cut" THEN "cut" ELSE "share") /\ phase' = "play" /\ recorded' = 0

\* tapBasket / tapPlate → settle: everyone has the same; then done, or the one left over.
YouShareFairly == /\ phase = "play" /\ stage = "share" /\ ~away /\ ~resting
                  /\ stage' = IF item = 2 THEN "left" ELSE "done"
                  /\ holder' = "child"
                  /\ UNCHANGED <<kind, item, phase, away, sound, recorded, late, resting, gate, sent, stored>>
\* decide(): one of the three text buttons, or a plate. The faces change and the serving rests 2.8 s.
YouGiveTheLastOne == /\ phase = "play" /\ stage = "left" /\ ~away /\ ~resting
                     /\ stage' = "done" /\ holder' = "child"
                     /\ UNCHANGED <<kind, item, phase, away, sound, recorded, late, resting, gate, sent, stored>>
\* cut(right) → apply: sfx.whoosh() (silent when muted) and speak(FRACTIONS[n].word), which ignores the switch.
\* Then tapPlate in the "give" stage hands each guest a piece (folded into this step: it only adds taps on pictures).
YouCutItRight == /\ phase = "play" /\ stage = "cut" /\ ~away /\ ~resting
                 /\ stage' = "done" /\ holder' = "child"
                 /\ UNCHANGED <<kind, item, phase, away, sound, recorded, late, resting, gate, sent, stored>>
\* The effect on [round, phase]: after 1.7 s (2.8 s after a leftover choice) the next guests come.
NextGuestsCome == /\ phase = "play" /\ stage = "done" /\ item < LastItem(kind)
                  /\ item' = item + 1 /\ stage' = "share"
                  /\ UNCHANGED <<kind, phase, away, sound, recorded, late, resting, gate, holder, sent, stored>>
\* …or, after the last serving: levels.record, sfx.win, atBreak(), phase "end".
TheRoundEnds == /\ phase = "play" /\ stage = "done" /\ item = LastItem(kind)
                /\ phase' = "end" /\ recorded' = recorded + 1 /\ resting' = late /\ stored' = stored \cup {"progress"}
                /\ UNCHANGED <<kind, item, stage, away, sound, late, gate, holder, sent>>
\* আবার খেলো / পরের ধাপ (restart), শেষ (closed), the closed screen's আবার খেলো (restart).
YouTapPlayAgain == /\ phase \in {"end", "closed"} /\ ~away /\ ~resting /\ Restart(kind) /\ holder' = "child"
                   /\ UNCHANGED <<away, sound, late, resting, gate, sent, stored>>
YouTapNextStep == /\ phase = "end" /\ kind = "share" /\ ~away /\ ~resting /\ Restart("cut") /\ holder' = "child"
                  /\ UNCHANGED <<away, sound, late, resting, gate, sent, stored>>
YouTapEnd == /\ phase = "end" /\ ~away /\ ~resting
             /\ phase' = "closed" /\ holder' = "child"
             /\ UNCHANGED <<kind, item, stage, away, sound, recorded, late, resting, gate, sent, stored>>
\* The সব ধাপ drawer works in every screen.
\* (Either of you may pick, so it doesn't say who holds the phone.)
YouPickAStep == /\ ~away /\ ~resting /\ \E k \in {"share", "cut"} : Restart(k)
                /\ UNCHANGED <<away, sound, late, resting, gate, holder, sent, stored>>
\* RestScreen neither traps focus nor makes the game inert.
YouTabAndEnterBehindRest == /\ resting /\ ~away /\ phase \in {"end", "closed"} /\ Restart(kind) /\ holder' = "child"
                            /\ UNCHANGED <<away, sound, late, resting, gate, sent, stored>>

YouLookAway == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<kind, item, stage, phase, sound, recorded, late, resting, gate, holder, sent, stored>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<kind, item, stage, phase, sound, recorded, late, resting, gate, holder, sent, stored>>
SoundOff == /\ sound /\ ~away /\ sound' = FALSE
            /\ UNCHANGED <<kind, item, stage, phase, away, recorded, late, resting, gate, holder, sent, stored>>
SoundOn == /\ ~sound /\ ~away /\ sound' = TRUE
           /\ UNCHANGED <<kind, item, stage, phase, away, recorded, late, resting, gate, holder, sent, stored>>

TodaysTimeRunsOut == /\ ~late /\ late' = TRUE
                     /\ UNCHANGED <<kind, item, stage, phase, away, sound, recorded, resting, gate, holder, sent, stored>>
ParentGivesTenMore == /\ resting /\ ~away /\ resting' = FALSE /\ late' = FALSE
                      /\ UNCHANGED <<kind, item, stage, phase, away, sound, recorded, gate, holder, sent, stored>>
ParentOpensTheGate == /\ ~gate /\ ~resting /\ ~away /\ gate' = TRUE /\ holder' = "parent"
                      /\ UNCHANGED <<kind, item, stage, phase, away, sound, recorded, late, resting, sent, stored>>
ParentClosesTheGate == /\ gate /\ ~away /\ gate' = FALSE /\ holder' = "child"
                       /\ UNCHANGED <<kind, item, stage, phase, away, sound, recorded, late, resting, sent, stored>>
ParentHandsThePhoneBack == /\ holder = "parent" /\ ~away /\ holder' = "child"
                           /\ UNCHANGED <<kind, item, stage, phase, away, sound, recorded, late, resting, gate, sent, stored>>

Next == YouShareFairly \/ YouGiveTheLastOne \/ YouCutItRight \/ NextGuestsCome \/ TheRoundEnds
        \/ YouTapPlayAgain \/ YouTapNextStep \/ YouTapEnd \/ YouPickAStep \/ YouTabAndEnterBehindRest
        \/ YouLookAway \/ YouComeBack \/ SoundOff \/ SoundOn
        \/ TodaysTimeRunsOut \/ ParentGivesTenMore \/ ParentOpensTheGate \/ ParentClosesTheGate \/ ParentHandsThePhoneBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ kind \in {"share", "cut"} /\ item \in {1, 2} /\ stage \in Stages /\ phase \in Phases
          /\ away \in BOOLEAN /\ sound \in BOOLEAN /\ recorded \in 0..2
          /\ late \in BOOLEAN /\ resting \in BOOLEAN /\ gate \in BOOLEAN /\ holder \in {"child", "parent"}
          /\ sent \in BOOLEAN /\ stored \subseteq {"progress", "name", "photo"}

\* The choices on each screen and whether each carries a picture (from the JSX).
Choices(p, s) ==
  IF p = "end" THEN {[c |-> "আবার খেলো", pic |-> FALSE], [c |-> "শেষ", pic |-> FALSE],
                     [c |-> "পরের ধাপ", pic |-> FALSE], [c |-> "আব্বু-আম্মুকে দেখাও", pic |-> FALSE]}
  ELSE IF p = "closed" THEN {[c |-> "আবার খেলো", pic |-> FALSE]}
  ELSE IF s = "share" THEN {[c |-> "the basket", pic |-> TRUE], [c |-> "a plate", pic |-> TRUE]}
  ELSE IF s = "left" THEN {[c |-> "a plate", pic |-> TRUE], [c |-> "ভেঙে সবাইকে দিই", pic |-> FALSE],
                           [c |-> "ছোটজনকে দিই", pic |-> FALSE], [c |-> "আম্মুর জন্য রাখি", pic |-> FALSE]}
  ELSE IF s = "cut" THEN {[c |-> "a knife with its cut রুটি", pic |-> TRUE]}
  ELSE {}

\* ---- The reader's rules ----
\* The table you just served (and the faces after the last-piece choice) waits for you while you're away.
NoProgressWhileAway == [][(phase = "play" /\ stage = "done" /\ (item' # item \/ phase' # phase)) => ~away]_vars
\* With sound off nothing makes a sound, the voice included. The only step that speaks here is a right cut.
SilentWhenMuted == [][(stage = "cut" /\ stage' = "done") => sound]_vars
NoDoubleResult == recorded <= 1
RestOnlyAtBreak == resting => phase \in {"end", "closed"}
ParentGate == gate => holder = "parent"
NoNetwork == ~sent
NoChildData == stored \subseteq {"progress"}
NoReadingNeeded == Cardinality(Choices(phase, stage)) <= 1 \/ \A ch \in Choices(phase, stage) : ch.pic
====
