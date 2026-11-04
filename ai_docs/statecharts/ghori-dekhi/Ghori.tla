---- MODULE Ghori ----
EXTENDS Naturals
\* ঘড়ি দেখি (ages 5–9): one round of set-the-clock and read-the-clock items, the drag on the clock face and the window
\* focus, the end card and the hidden buttons under it, the cues a pre-reader gets, the kids' daily limit and rest screen,
\* the parent gate, and the ways out of the kids' area. Mirrored from, as of 2026-11-04:
\*   tools/ghori-dekhi/components/ghori-game.tsx  (ready, begin, finish, right, slip, turn, check, choose, next, the end / menu)
\*   tools/ghori-dekhi/components/clock.tsx       (down / move / up / cancel: the gesture ref and pointer capture)
\*   tools/ghori-dekhi/lib/day.ts                 (makeRound: set, read, set…; shouldGlow after two tries; starsOf)
\*   shared/kids-kit.tsx                          (SpeakButton only with a Bangla voice, atBreak/extend, RestScreen, ParentGate)
\*   shared/game-kit.ts, shared/game-core.ts      (useLevels.record = recordLevel)
\*   shared/site-shell.tsx                        (PageFrame: header search and links, related tools, footer)
\* A round here has three items (the game has six): set, read, set. Level 2 (সাড়ে), the last level the parent note
\* calls enough for 5–6 year olds. The phone has no Bangla voice (CONSTANT Voice), as on many cheap phones.
\* The gate works the same on every screen, so the model uses it on the round card and the rest screen only.
\* Leaving the page unmounts the game, so the model forgets the round while away and starts fresh on the way back.
CONSTANTS Voice, Level

VARIABLES pos, slips, recorded, focused, grip, finger, overLimit, rest, gate, away
vars == <<pos, slips, recorded, focused, grip, finger, overLimit, rest, gate, away>>

\* pos: item 1 (set) → solved → item 2 (read) → solved → item 3 (set) → solved → the card ("done") → শেষ ("menu").
Pos == {"set1", "ok1", "read2", "ok2", "set3", "ok3", "done", "menu"}
Setting == pos \in {"set1", "set3"}
AtBreak == pos \in {"done", "menu"}
Gate == {"shut", "holding", "repeat", "orphan", "ask", "early", "open", "child"}
KeysWritten == {"levels", "kidsTime", "kidsLimit", "sound", "slow"}
Progress == {"levels", "kidsTime", "kidsLimit", "sound", "slow"}
ASSUME KeysWritten \subseteq Progress

Init == /\ pos = "set1" /\ slips = 0 /\ recorded = 0 /\ focused = TRUE /\ grip = FALSE /\ finger = FALSE
        /\ overLimit = FALSE /\ rest = FALSE /\ gate = "shut" /\ away = FALSE

Here == ~away
Touch == Here /\ ~rest /\ ~AtBreak   \* the end card (z-index 3) and the rest screen cover the clock and its buttons
Card == Here /\ ~rest /\ AtBreak

\* clock.tsx down(): only if no gesture is held; setPointerCapture.
YouPressTheClock == /\ Touch /\ Setting /\ ~grip /\ focused
                    /\ grip' = TRUE /\ finger' = TRUE
                    /\ UNCHANGED <<pos, slips, recorded, focused, overLimit, rest, gate, away>>
\* up() or pointercancel / lostpointercapture: the gesture ends — but only if the event reaches the page.
YouLiftYourFinger == /\ finger /\ focused /\ finger' = FALSE /\ grip' = FALSE
                     /\ UNCHANGED <<pos, slips, recorded, focused, overLimit, rest, gate, away>>
\* The finger or mouse button comes up in another window: the page never hears it.
YouLetGoInAnotherWindow == /\ finger /\ ~focused /\ finger' = FALSE
                           /\ UNCHANGED <<pos, slips, recorded, focused, grip, overLimit, rest, gate, away>>
\* Nothing in the game listens for blur or visibilitychange. Focus matters only to the clock's drag, so the model
\* leaves the window only while a clock is being set.
WindowBlurs == /\ Here /\ Setting /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<pos, slips, recorded, grip, finger, overLimit, rest, gate, away>>
WindowFocuses == /\ Here /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<pos, slips, recorded, grip, finger, overLimit, rest, gate, away>>

\* check() on হয়েছে, or choose() on a time: right() or slip(). Two slips on an item make the answer glow.
YouGetItRight == /\ Touch /\ focused /\ pos \in {"set1", "read2", "set3"}
                 /\ pos' = CASE pos = "set1" -> "ok1" [] pos = "read2" -> "ok2" [] OTHER -> "ok3"
                
                 /\ UNCHANGED <<slips, recorded, focused, grip, finger, overLimit, rest, gate, away>>
YouSlip == /\ Touch /\ focused /\ pos \in {"set1", "read2", "set3"} /\ slips < 2
           /\ slips' = slips + 1
           /\ UNCHANGED <<pos, recorded, focused, grip, finger, overLimit, rest, gate, away>>
\* next(): পরেরটা readies the next item (tries back to 0); শেষ দেখো on the last one calls finish().
YouPressNext == /\ Touch /\ focused /\ pos \in {"ok1", "ok2"}
                /\ pos' = (IF pos = "ok1" THEN "read2" ELSE "set3") /\ slips' = 0
                /\ UNCHANGED <<recorded, focused, grip, finger, overLimit, rest, gate, away>>
\* finish(): record the stars, win sound, setPhase("done"), atBreak(). index becomes 6 but the last item stays drawn,
\* solved, with its শেষ দেখো button in the DOM under the card.
YouPressSeeTheEnd == /\ Touch /\ focused /\ pos = "ok3"
                     /\ pos' = "done" /\ recorded' = recorded + 1 /\ rest' = overLimit /\ slips' = 0
                     /\ UNCHANGED <<focused, grip, finger, overLimit, gate, away>>
\* The card covers that button for a finger, not for a keyboard: Tab reaches it and Enter calls next() → finish() again.
YouPressTheHiddenButton == /\ Here /\ AtBreak /\ recorded < 2
                           /\ pos' = "done" /\ recorded' = recorded + 1 /\ rest' = overLimit
                           /\ UNCHANGED <<slips, focused, grip, finger, overLimit, gate, away>>
\* শেষ on the card → the level menu.
YouPressShesh == /\ Card /\ pos = "done" /\ pos' = "menu" /\ gate' = "shut"
                 /\ UNCHANGED <<slips, recorded, focused, grip, finger, overLimit, rest, away>>
\* begin(): আবার খেলো or a level from the menu or "সব লেভেল": a fresh round, untouched, so the ghost finger shows again.
\* The ClockFace stays mounted (same type, same place), so its gesture ref survives a new item and a new round.
YouStartARound == /\ Here /\ ~rest /\ pos # "set1"
                  /\ pos' = "set1" /\ slips' = 0 /\ recorded' = 0 /\ gate' = "shut"
                  /\ UNCHANGED <<focused, grip, finger, overLimit, rest, away>>
\* RestScreen has no inert or focus trap: Tab reaches আবার খেলো under it.
YouTabUnderTheRestScreen == /\ Here /\ rest /\ AtBreak
                            /\ pos' = "set1" /\ slips' = 0 /\ recorded' = 0 /\ gate' = "shut"
                            /\ UNCHANGED <<focused, grip, finger, overLimit, rest, away>>

TodaysTimeRunsOut == /\ Here /\ ~overLimit /\ overLimit' = TRUE
                     /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, rest, gate, away>>

\* ParentGate (see Juktoborno.tla for the timer story): start() sets a fresh timer, stop() clears only the latest.
GateOnScreen == Here /\ (pos = "done" \/ rest)
SomeoneHoldsTheGate == /\ GateOnScreen /\ gate = "shut" /\ gate' = "holding"
                       /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
TheKeyAutoRepeats == /\ gate = "holding" /\ gate' = "repeat"
                     /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
TheyLetGoEarly == /\ gate \in {"holding", "repeat"} /\ gate' = IF gate = "repeat" THEN "orphan" ELSE "shut"
                  /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
TwoSecondsPass == /\ gate \in {"holding", "repeat", "orphan"} /\ gate' = IF gate = "orphan" THEN "early" ELSE "ask"
                  /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
AGrownUpAnswers == /\ gate \in {"ask", "early"} /\ gate' = "open"
                   /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
AChildMashesThePad == /\ gate \in {"ask", "early"} /\ gate' = "child"
                      /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
TheGateCloses == /\ gate \in {"ask", "early", "open", "child"} /\ gate' = "shut"
                 /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest, away>>
TheyGiveTenMore == /\ rest /\ gate \in {"open", "child"} /\ rest' = FALSE /\ overLimit' = FALSE /\ gate' = "shut"
                   /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, away>>

\* PageFrame: header search and links, related tools (the flagship first), the footer — in the child's view.
TheChildTapsASiteLink == /\ Here /\ ~rest /\ focused /\ ~finger /\ pos \in {"set1", "done"}
                         /\ away' = TRUE /\ pos' = "set1" /\ slips' = 0 /\ recorded' = 0 /\ rest' = FALSE
                         /\ grip' = FALSE
                         /\ UNCHANGED <<focused, finger, overLimit, gate>>
TheyComeBack == /\ away /\ away' = FALSE /\ gate' = "shut"
                /\ UNCHANGED <<pos, slips, recorded, focused, grip, finger, overLimit, rest>>

Next == YouPressTheClock \/ YouLiftYourFinger \/ YouLetGoInAnotherWindow \/ WindowBlurs \/ WindowFocuses
        \/ YouGetItRight \/ YouSlip \/ YouPressNext \/ YouPressSeeTheEnd \/ YouPressTheHiddenButton \/ YouPressShesh
        \/ YouStartARound \/ YouTabUnderTheRestScreen \/ TodaysTimeRunsOut
        \/ SomeoneHoldsTheGate \/ TheKeyAutoRepeats \/ TheyLetGoEarly \/ TwoSecondsPass \/ AGrownUpAnswers \/ AChildMashesThePad
        \/ TheGateCloses \/ TheyGiveTenMore \/ TheChildTapsASiteLink \/ TheyComeBack

Spec == Init /\ [][Next]_vars

TypeOK == pos \in Pos /\ slips \in 0..2 /\ recorded \in 0..2 /\ focused \in BOOLEAN /\ grip \in BOOLEAN
          /\ finger \in BOOLEAN /\ overLimit \in BOOLEAN /\ rest \in BOOLEAN /\ gate \in Gate /\ away \in BOOLEAN

\* What a pre-reader has, besides the words, to know what to do on each screen.
\*  set items: the ghost finger shows the first move on item 1 only; after that, the 🔈 (only with a Bangla voice) or the
\*  glowing hands (after 2 slips).
\*  read items: the choices are words ("সাড়ে ৭টা") with no picture and no 🔈; at level 1 they are just the clock's numerals.
\*  the card: আবার খেলো and শেষ are two words of the same size and colour.
Cue == CASE pos = "set1" -> TRUE
         [] pos = "set3" -> Voice \/ slips >= 2
         [] pos = "read2" -> Level = 1 \/ slips >= 2
         [] pos = "done" -> FALSE
         [] OTHER -> TRUE

\* The reader's rules.
NoReadingNeeded == Here /\ ~rest => Cue
InputReleasedWhenAway == ~focused => ~grip
HandMovesOnlyUnderAFinger == grip => finger
NoDoubleResult == recorded <= 1
RestOnlyAtBreak == rest => AtBreak
GateNeedsAFullHold == gate # "early"
ChildCannotOpenGate == gate # "child"
NoWayOutWithoutGate == away => gate = "open"
NoNetwork == TRUE          \* no action above sends anything
NoChildData == KeysWritten \subseteq Progress
====
