---- MODULE Dinosaur ----
\* ডাইনোসর খুঁজি, after the rewrite (branch games-to-the-bar, 2026-11-05):
\*   tools/dinosaur/components/game.tsx        (begin, stamped, placeAt, sort, go, the dig beat's effect, the window keys, the parent-gate closer)
\*   tools/dinosaur/components/sand-layer.tsx  (press / drag / lift / release on blur, hide, cancel, lostpointercapture, pause)
\*   tools/dinosaur/lib/stroke.ts              (press, drag, lift, release: a mouse needs its button, a new press replaces a stuck stroke)
\*   tools/dinosaur/lib/session.ts             (screens, pause, away + swallow, the book, solved, resting, fresh keys)
\*   tools/dinosaur/lib/round.ts               (dig → build → meet → facts per dinosaur; the last food wins the round)
\*   shared/kids-kit.tsx                       (atBreak, RestScreen as a modal, ParentGate closing after one action)
\* A level is two dinosaurs (`index` 0 and 1). A finale's second pit is not modelled: it is another dig with the same rules.
\* Bones are one abstract flag: the sand is either still hiding bones or every bone of the pit has lifted out.
EXTENDS Naturals

VARIABLES phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest
vars == <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>

Phases == {"title", "levels", "dig", "build", "meet", "facts", "end"}
PlayPhases == {"dig", "build", "meet", "facts"}
Breaks == {"title", "levels", "end"}

Init == /\ phase = "title" /\ index = 0 /\ settling = FALSE
        /\ focused = TRUE /\ paused = FALSE /\ finger = FALSE /\ stroke = FALSE /\ swallow = FALSE /\ book = FALSE
        /\ solved = FALSE /\ recorded = 0 /\ late = FALSE /\ resting = FALSE
        /\ gate = FALSE /\ holder = "child" /\ sent = FALSE /\ stored = {} /\ behindRest = FALSE

\* Anything the child does closes an open parent gate (the next tap outside it, or one action inside it) and means the phone is in the child's hands.
Child == holder' = "child" /\ gate' = FALSE

\* ---- Starting a round: खুঁড়ি, আবার খেলো or a level card. begin() asks atBreak(): past the limit the rest screen shows and nothing starts. ----
StartsRound == /\ phase' = "dig" /\ index' = 0 /\ settling' = FALSE /\ finger' = FALSE /\ stroke' = FALSE /\ swallow' = FALSE /\ book' = FALSE
               /\ solved' = FALSE /\ recorded' = 0 /\ paused' = FALSE
YouStartARound == /\ focused /\ phase \in Breaks /\ ~resting /\ ~book /\ ~late /\ StartsRound /\ resting' = FALSE /\ Child
                  /\ UNCHANGED <<focused, late, sent, stored, behindRest>>
YouStartPastTheLimit == /\ focused /\ phase \in Breaks /\ ~resting /\ ~book /\ late
                        /\ resting' = TRUE /\ Child
                        /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, sent, stored, behindRest>>
\* The level list (a choice screen: nothing runs under it). From the player's menu mid-round the round is left.
YouOpenTheLevels == /\ focused /\ (phase \in {"title", "end"} \/ (phase \in PlayPhases /\ paused)) /\ ~resting /\ ~book
                    /\ phase' = "levels" /\ settling' = FALSE /\ finger' = FALSE /\ stroke' = FALSE /\ swallow' = FALSE /\ solved' = FALSE /\ paused' = FALSE /\ Child
                    /\ UNCHANGED <<index, focused, book, recorded, late, resting, sent, stored, behindRest>>
YouTapEnd == /\ focused /\ phase = "end" /\ ~resting /\ ~book /\ phase' = "title" /\ Child
             /\ UNCHANGED <<index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, sent, stored, behindRest>>

\* ---- The sand (sand-layer.tsx + stroke.ts) ----
\* onPointerDown: the first finger only; touch() says "counts" or, right after coming back, "woke" (swallowed).
YouTouchTheSand == /\ phase = "dig" /\ focused /\ ~paused /\ ~book /\ ~settling /\ ~resting /\ ~finger
                   /\ finger' = TRUE /\ stroke' = ~swallow /\ swallow' = FALSE /\ Child
                   /\ UNCHANGED <<phase, index, settling, focused, paused, book, solved, recorded, late, resting, sent, stored, behindRest>>
\* The stamps run only while a stroke is open. The last bone of the pit starts the short beat (settling).
SandClears == /\ phase = "dig" /\ stroke /\ ~settling
              /\ settling' = TRUE
              /\ UNCHANGED <<phase, index, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
YouLiftYourFinger == /\ finger /\ focused /\ finger' = FALSE /\ stroke' = FALSE /\ Child
                     /\ UNCHANGED <<phase, index, settling, focused, paused, swallow, book, solved, recorded, late, resting, sent, stored, behindRest>>
\* The button comes up in the other window: the page never hears pointerup. The stroke already ended on blur; a mouse move with no button ends it too.
YouLetGoElsewhere == /\ finger /\ ~focused /\ finger' = FALSE
                     /\ UNCHANGED <<phase, index, settling, focused, paused, stroke, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
TouchIsCancelled == /\ finger /\ finger' = FALSE /\ stroke' = FALSE
                    /\ UNCHANGED <<phase, index, settling, focused, paused, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>

\* ---- Away and back (game.tsx window blur / visibilitychange, and the shared player) ----
\* The player opens its menu on blur once someone has played; the sand drops the stroke on blur, hide and pause; the first tap back is swallowed.
WindowBlurs == /\ focused /\ focused' = FALSE /\ stroke' = FALSE
               /\ paused' = (paused \/ phase \in PlayPhases)
               /\ swallow' = (swallow \/ phase \in PlayPhases)
               /\ UNCHANGED <<phase, index, settling, finger, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, index, settling, paused, finger, stroke, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
YouPause == /\ phase \in PlayPhases /\ ~paused /\ paused' = TRUE /\ stroke' = FALSE
            /\ UNCHANGED <<phase, index, settling, focused, finger, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
YouResume == /\ paused /\ focused /\ paused' = FALSE /\ swallow' = FALSE /\ Child
             /\ UNCHANGED <<phase, index, settling, focused, finger, stroke, book, solved, recorded, late, resting, sent, stored, behindRest>>

\* ---- The finder's book: a choice screen over the stage, play stops ----
YouOpenTheBook == /\ focused /\ ~book /\ ~resting /\ ~paused /\ book' = TRUE /\ stroke' = FALSE /\ Child
                  /\ UNCHANGED <<phase, index, settling, focused, paused, finger, swallow, solved, recorded, late, resting, sent, stored, behindRest>>
YouCloseTheBook == /\ focused /\ book /\ book' = FALSE /\ Child
                   /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, solved, recorded, late, resting, sent, stored, behindRest>>

\* ---- The round (game.tsx + round.ts) ----
\* The beat is an effect: it waits while paused or the book is open, and fires only in the dig it was set for.
BonesLiftOut == /\ phase = "dig" /\ settling /\ ~paused /\ ~book
                /\ phase' = "build" /\ settling' = FALSE /\ stroke' = FALSE /\ finger' = FALSE
                /\ UNCHANGED <<index, focused, paused, swallow, book, solved, recorded, late, resting, gate, holder, sent, stored, behindRest>>
YouFinishTheSkeleton == /\ focused /\ phase = "build" /\ ~paused /\ ~book /\ ~resting /\ ~swallow /\ phase' = "meet" /\ Child
                        /\ UNCHANGED <<index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, sent, stored, behindRest>>
\* chooseDiet(right) → S.solve(): on the last dinosaur the stars are saved and atBreak() runs in this very tap.
YouPickTheRightFood == /\ focused /\ phase = "meet" /\ ~paused /\ ~book /\ ~resting /\ ~swallow
                       /\ phase' = "facts" /\ solved' = TRUE /\ Child
                       /\ stored' = stored \cup {"progress"} \* the finder's book, and the stars on the last
                       /\ IF index = 1 THEN recorded' = recorded + 1 /\ resting' = late ELSE UNCHANGED <<recorded, resting>>
                       /\ UNCHANGED <<index, settling, focused, paused, finger, stroke, swallow, book, late, sent, behindRest>>
\* ▶: a fresh press, once. The next dinosaur's dig, or after the last one the end screen.
YouPressNext == /\ focused /\ phase = "facts" /\ solved /\ ~paused /\ ~book /\ ~(resting /\ phase \in Breaks)
                /\ solved' = FALSE /\ Child
                /\ IF index = 0 THEN phase' = "dig" /\ index' = 1 ELSE phase' = "end" /\ UNCHANGED index
                /\ UNCHANGED <<settling, focused, paused, finger, stroke, swallow, book, recorded, late, resting, sent, stored, behindRest>>

\* ---- The day's limit (kids-kit useKidsSession) ----
TodaysTimeRunsOut == /\ ~late /\ late' = TRUE
                     /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, resting, gate, holder, sent, stored, behindRest>>
\* RestScreen → ParentGate → "আজ আরও ১০ মিনিট" → extend(10). RestScreen is a modal: while it shows nothing else takes a key or tap.
ParentGivesTenMore == /\ resting /\ resting' = FALSE /\ late' = FALSE /\ holder' = "parent"
                      /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, gate, sent, stored, behindRest>>

\* ---- The parent gate under the title (ParentGate + ShareToolLink) ----
ParentOpensTheGate == /\ phase = "title" /\ ~resting /\ ~gate /\ gate' = TRUE /\ holder' = "parent"
                      /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, sent, stored, behindRest>>
ParentHandsThePhoneBack == /\ holder = "parent" /\ holder' = "child"
                           /\ UNCHANGED <<phase, index, settling, focused, paused, finger, stroke, swallow, book, solved, recorded, late, resting, gate, sent, stored, behindRest>>

Next == YouStartARound \/ YouStartPastTheLimit \/ YouOpenTheLevels \/ YouTapEnd
        \/ YouTouchTheSand \/ SandClears \/ YouLiftYourFinger \/ YouLetGoElsewhere \/ TouchIsCancelled
        \/ WindowBlurs \/ WindowFocuses \/ YouPause \/ YouResume \/ YouOpenTheBook \/ YouCloseTheBook
        \/ BonesLiftOut \/ YouFinishTheSkeleton \/ YouPickTheRightFood \/ YouPressNext
        \/ TodaysTimeRunsOut \/ ParentGivesTenMore \/ ParentOpensTheGate \/ ParentHandsThePhoneBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ index \in 0..1 /\ settling \in BOOLEAN
          /\ focused \in BOOLEAN /\ paused \in BOOLEAN /\ finger \in BOOLEAN /\ stroke \in BOOLEAN /\ swallow \in BOOLEAN /\ book \in BOOLEAN
          /\ solved \in BOOLEAN /\ recorded \in 0..2 /\ late \in BOOLEAN /\ resting \in BOOLEAN
          /\ gate \in BOOLEAN /\ holder \in {"child", "parent"} /\ sent \in BOOLEAN
          /\ stored \subseteq {"progress", "name", "photo"} /\ behindRest \in BOOLEAN

\* What each screen asks the child to choose between, and whether each choice is a picture (from the JSX: every button is an icon or a drawing).
Choices(p) ==
  IF p = "title" THEN {[c |-> "the pit: খুঁড়ি", pic |-> TRUE], [c |-> "the level chip with its dinosaurs", pic |-> TRUE], [c |-> "the book", pic |-> TRUE]}
  ELSE IF p = "dig" THEN {[c |-> "the sand", pic |-> TRUE]}
  ELSE IF p = "build" THEN {[c |-> "a bone in the tray", pic |-> TRUE], [c |-> "a place on the skeleton", pic |-> TRUE]}
  ELSE IF p = "meet" THEN {[c |-> "leaf: plant-eater", pic |-> TRUE], [c |-> "meat: meat-eater", pic |-> TRUE]}
  ELSE IF p = "facts" THEN {[c |-> "▶ with the size picture and the food picture", pic |-> TRUE]}
  ELSE IF p = "end" THEN {[c |-> "↻ আবার খেলো", pic |-> TRUE], [c |-> "house শেষ", pic |-> TRUE], [c |-> "two grown-ups: আব্বু-আম্মুকে দেখাও", pic |-> TRUE]}
  ELSE {[c |-> "a level card with its dinosaurs and stars", pic |-> TRUE]}

\* ---- The reader's rules ----
InputReleasedWhenAway == ~focused => ~stroke
SandClearsOnlyUnderAFinger == stroke => finger
NothingMovesUnderTheMenu == paused => ~stroke  \* the dig beat is only scheduled while paused: BonesLiftOut is guarded by ~paused
PausedWhenAway == (~focused /\ phase \in PlayPhases) => paused
ChoiceFreezesPlay == book => ~stroke
FirstTapBackOnlyWakes == swallow => ~stroke
TimersBelongToThisDig == settling => phase = "dig"
NoDoubleResult == recorded <= 1
RestOnlyAtBreak == resting => (phase \in Breaks \/ (phase = "facts" /\ recorded = 1))
RestNeverOverADig == resting => phase \notin {"dig", "build", "meet"}
NoRoundUnderRest == ~behindRest
\* The share button is never open while the child plays: the gate exists on the title only, and a round start (or any child tap elsewhere) shuts it.
GateOnlyOnTheTitle == gate => phase = "title"
ShareNeverBehindTheChild == (gate /\ holder = "child") => phase = "title"
NoNetwork == ~sent
NoChildData == stored \subseteq {"progress"}
NoReadingNeeded == \A ch \in Choices(phase) : ch.pic
====
