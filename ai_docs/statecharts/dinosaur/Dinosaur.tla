---- MODULE Dinosaur ----
\* ডাইনোসর খুঁজি, as the code stands on 2026-11-04 (branch games-to-the-bar):
\*   tools/dinosaur/components/dino-game.tsx  (startDig, begin, brushAt + its 900 ms timer, placeAt + its 500 ms timer,
\*                                            chooseDiet, keep, the end and menu buttons, the সব লেভেল drawer, ParentGate)
\*   tools/dinosaur/components/sand.tsx       (onPointerDown / Move / Up / Cancel and stroke.current; no blur handler)
\*   shared/kids-kit.tsx                      (useKidsSession.atBreak / extend, RestScreen, ParentGate, ShareToolLink)
\* One dinosaur per dig stands for the level's two (the second only repeats dig → build → meet → facts).
\* Bones are one abstract "dug" flag: the sand is either still hiding bones or every bone has lifted out.
EXTENDS Naturals, FiniteSets

VARIABLES phase, dug, timer, focused, finger, stroke, recorded, late, resting, gate, holder, sent, stored
vars == <<phase, dug, timer, focused, finger, stroke, recorded, late, resting, gate, holder, sent, stored>>

Phases == {"dig", "build", "meet", "facts", "done", "menu"}
Timers == {"none", "toBuild", "toMeet"}

Init == /\ phase = "dig" /\ dug = FALSE /\ timer = "none"
        /\ focused = TRUE /\ finger = FALSE /\ stroke = FALSE
        /\ recorded = 0 /\ late = FALSE /\ resting = FALSE
        /\ gate = FALSE /\ holder = "child" /\ sent = FALSE /\ stored = {}

\* begin(level) → startDig: clearTimeout, fresh sand (SandLayer is keyed by the seed, so stroke.current starts empty).
\* `finger` means a finger on the sand canvas, so it leaves with the canvas.
Begin == /\ phase' = "dig" /\ dug' = FALSE /\ timer' = "none" /\ stroke' = FALSE /\ finger' = FALSE /\ recorded' = 0

\* ---- The sand (sand.tsx) ----
\* onPointerDown: `if (stroke.current) return;` so a finger that lands while a stroke is open is ignored.
YouTouchTheSand == /\ phase = "dig" /\ focused /\ ~finger
                   /\ finger' = TRUE
                   /\ stroke' = TRUE \* a fresh stroke, or the old one if it never closed
                   /\ UNCHANGED <<phase, dug, timer, focused, recorded, late, resting, gate, holder, sent, stored>>
\* onPointerMove / the pointerdown erase → brushAt: every bone mostly uncovered lifts out; the last one starts the 900 ms timer.
\* It runs whenever stroke.current matches the pointer id: nothing checks that a button is still down.
SandClears == /\ phase = "dig" /\ stroke /\ ~dug /\ timer = "none"
              /\ dug' = TRUE /\ timer' = "toBuild"
              /\ UNCHANGED <<phase, focused, finger, stroke, recorded, late, resting, gate, holder, sent, stored>>
\* onPointerUp reaches the page only while it has focus.
YouLiftYourFinger == /\ finger /\ focused
                     /\ finger' = FALSE /\ stroke' = FALSE
                     /\ UNCHANGED <<phase, dug, timer, focused, recorded, late, resting, gate, holder, sent, stored>>
\* The button comes up in the other window: the page never hears pointerup, and there is no lostpointercapture handler.
YouLetGoElsewhere == /\ finger /\ ~focused
                     /\ finger' = FALSE
                     /\ UNCHANGED <<phase, dug, timer, focused, stroke, recorded, late, resting, gate, holder, sent, stored>>
\* onPointerCancel: the phone takes the touch (a call, the notification shade).
TouchIsCancelled == /\ finger
                    /\ finger' = FALSE /\ stroke' = FALSE
                    /\ UNCHANGED <<phase, dug, timer, focused, recorded, late, resting, gate, holder, sent, stored>>
\* The game has no blur or visibilitychange handler at all.
WindowBlurs == /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, dug, timer, finger, stroke, recorded, late, resting, gate, holder, sent, stored>>
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, dug, timer, finger, stroke, recorded, late, resting, gate, holder, sent, stored>>

\* ---- The round (dino-game.tsx) ----
\* The 900 ms timer: setPhase("build"). The SandLayer unmounts, so stroke.current (and any finger on it) goes with it.
BonesLiftOut == /\ timer = "toBuild"
                /\ phase' = "build" /\ timer' = "none" /\ stroke' = FALSE /\ finger' = FALSE
                /\ UNCHANGED <<dug, focused, recorded, late, resting, gate, holder, sent, stored>>
\* placeAt with the last right bone: the 500 ms timer → hum() and the "meet" screen.
YouFinishTheSkeleton == /\ phase = "build" /\ timer = "none" /\ ~resting
                        /\ timer' = "toMeet" /\ holder' = "child"
                        /\ UNCHANGED <<phase, dug, focused, finger, stroke, recorded, late, resting, gate, sent, stored>>
SkeletonStands == /\ timer = "toMeet"
                  /\ phase' = "meet" /\ timer' = "none"
                  /\ UNCHANGED <<dug, focused, finger, stroke, recorded, late, resting, gate, holder, sent, stored>>
\* chooseDiet(right): addToBook → localStorage only.
YouPickTheRightFood == /\ phase = "meet" /\ ~resting
                       /\ phase' = "facts" /\ holder' = "child" /\ stored' = stored \cup {"progress"} \* the finder's book
                       /\ UNCHANGED <<dug, timer, focused, finger, stroke, recorded, late, resting, gate, sent>>
\* keep() on the level's last dinosaur: levels.record, sfx.win, setPhase("done"), session.atBreak().
\* atBreak() shows RestScreen when today's minutes are used up.
YouKeepItInTheBook == /\ phase = "facts" /\ ~resting
                      /\ phase' = "done" /\ recorded' = recorded + 1 /\ resting' = late /\ holder' = "child"
                      /\ stored' = stored \cup {"progress"} \* the stars
                      /\ UNCHANGED <<dug, timer, focused, finger, stroke, late, gate, sent>>
\* The end screen's আবার খেলো (begin(level)) and শেষ (the menu); the menu's LevelGrid and the সব লেভেল drawer call begin.
\* A tap can't reach them under RestScreen (a fixed full-screen layer, z-index 50).
YouTapPlayAgain == /\ phase = "done" /\ ~resting /\ Begin /\ holder' = "child"
                   /\ UNCHANGED <<focused, late, resting, gate, sent, stored>>
YouTapEnd == /\ phase = "done" /\ ~resting
             /\ phase' = "menu" /\ holder' = "child"
             /\ UNCHANGED <<dug, timer, focused, finger, stroke, recorded, late, resting, gate, sent, stored>>
YouPickALevel == /\ ~resting /\ Begin /\ holder' = "child"
                 /\ UNCHANGED <<focused, late, resting, gate, sent, stored>>
\* RestScreen is aria-modal but neither traps focus nor makes the game inert: Tab and Enter still reach আবার খেলো,
\* the drawer and the level buttons behind it.
YouTabAndEnterBehindRest == /\ resting /\ phase \in {"done", "menu"} /\ Begin /\ holder' = "child"
                            /\ UNCHANGED <<focused, late, resting, gate, sent, stored>>

\* ---- The day's limit (kids-kit useKidsSession) ----
TodaysTimeRunsOut == /\ ~late /\ late' = TRUE
                     /\ UNCHANGED <<phase, dug, timer, focused, finger, stroke, recorded, resting, gate, holder, sent, stored>>
\* RestScreen → ParentGate → "আজ আরও ১০ মিনিট" → extend(10).
ParentGivesTenMore == /\ resting
                      /\ resting' = FALSE /\ late' = FALSE /\ holder' = "parent"
                      /\ UNCHANGED <<phase, dug, timer, focused, finger, stroke, recorded, gate, sent, stored>>

\* ---- The parent gate under the game (ParentGate + ShareToolLink) ----
\* A 2-second hold, then a sum in words: the gate opens and shows খেলাটার লিংক পাঠাও.
ParentOpensTheGate == /\ ~gate /\ ~resting
                      /\ gate' = TRUE /\ holder' = "parent"
                      /\ UNCHANGED <<phase, dug, timer, focused, finger, stroke, recorded, late, resting, sent, stored>>
\* বন্ধ করো is the only way it closes: no timeout, and nothing in the game closes it.
ParentClosesTheGate == /\ gate /\ gate' = FALSE
                       /\ UNCHANGED <<phase, dug, timer, focused, finger, stroke, recorded, late, resting, holder, sent, stored>>
ParentHandsThePhoneBack == /\ holder = "parent" /\ holder' = "child"
                           /\ UNCHANGED <<phase, dug, timer, focused, finger, stroke, recorded, late, resting, gate, sent, stored>>

Next == YouTouchTheSand \/ SandClears \/ YouLiftYourFinger \/ YouLetGoElsewhere \/ TouchIsCancelled
        \/ WindowBlurs \/ WindowFocuses \/ BonesLiftOut \/ YouFinishTheSkeleton \/ SkeletonStands
        \/ YouPickTheRightFood \/ YouKeepItInTheBook \/ YouTapPlayAgain \/ YouTapEnd \/ YouPickALevel
        \/ YouTabAndEnterBehindRest \/ TodaysTimeRunsOut \/ ParentGivesTenMore
        \/ ParentOpensTheGate \/ ParentClosesTheGate \/ ParentHandsThePhoneBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ timer \in Timers /\ dug \in BOOLEAN
          /\ focused \in BOOLEAN /\ finger \in BOOLEAN /\ stroke \in BOOLEAN
          /\ recorded \in 0..2 /\ late \in BOOLEAN /\ resting \in BOOLEAN
          /\ gate \in BOOLEAN /\ holder \in {"child", "parent"} /\ sent \in BOOLEAN
          /\ stored \subseteq {"progress", "name", "photo"}

\* What each screen asks the child to choose between, and whether each choice carries a picture (from the JSX).
Choices(p) ==
  IF p = "dig" THEN {[c |-> "the sand", pic |-> TRUE]}
  ELSE IF p = "build" THEN {[c |-> "a bone in the tray", pic |-> TRUE], [c |-> "a place on the skeleton", pic |-> TRUE]}
  ELSE IF p = "meet" THEN {[c |-> "leaf: plant-eater", pic |-> TRUE], [c |-> "meat: meat-eater", pic |-> TRUE]}
  ELSE IF p = "facts" THEN {[c |-> "বইয়ে রাখো", pic |-> FALSE]}
  ELSE IF p = "done" THEN {[c |-> "আবার খেলো", pic |-> FALSE], [c |-> "শেষ", pic |-> FALSE], [c |-> "আব্বু-আম্মুকে দেখাও", pic |-> FALSE]}
  ELSE {[c |-> "a numbered level with stars", pic |-> TRUE]} \* menu

\* ---- The reader's rules ----
InputReleasedWhenAway == ~focused => ~stroke
SandClearsOnlyUnderAFinger == stroke => finger
TimersBelongToThisDig == /\ (timer = "toBuild" => (phase = "dig" /\ dug))
                         /\ (timer = "toMeet" => phase = "build")
NoDoubleResult == recorded <= 1
RestOnlyAtBreak == resting => phase \in {"done", "menu"}
ParentGate == gate => holder = "parent"
NoNetwork == ~sent
\* Progress only: the finder's book (ektukhani-dinosaur-book) and the stars (ektukhani-levels-dinosaur).
NoChildData == stored \subseteq {"progress"}
NoReadingNeeded == Cardinality(Choices(phase)) <= 1 \/ \A ch \in Choices(phase) : ch.pic
====
