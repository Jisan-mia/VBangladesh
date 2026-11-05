---- MODULE KiHobe ----
\* কী হবে বলো তো?, as the code stands on 2026-11-04 (branch games-to-the-bar):
\*   tools/ki-hobe/components/ki-hobe-game.tsx  (choose + its SCENE_MS reveal timer, sceneSound, goNext, restart,
\*                                              the end and closed screens, the সব ধাপ drawer, ParentGate)
\*   tools/ki-hobe/lib/game.ts                   (predict, next, done)
\*   shared/game-sound.ts                        (tone/hiss schedule notes ahead on the audio clock; setSoundOn(false) runs
\*                                              only stopLoops(), not silenceScheduled())
\*   shared/kids-kit.tsx                         (useKidsSession.atBreak / extend, RestScreen, ParentGate)
\* One question stands for a round's four or five (পরেরটা only repeats guess → watch → answer). The code has no blur or visibilitychange handler, so "away" is one flag
\* for both (a hidden tab or another window).
EXTENDS Naturals, FiniteSets

VARIABLES screen, away, sound, pending, recorded, late, resting, gate, holder, sent, stored
vars == <<screen, away, sound, pending, recorded, late, resting, gate, holder, sent, stored>>

Screens == {"choose", "watch", "result", "end", "closed"}

Init == /\ screen = "choose" /\ away = FALSE
        /\ sound = TRUE /\ pending = FALSE /\ recorded = 0
        /\ late = FALSE /\ resting = FALSE /\ gate = FALSE /\ holder = "child" /\ sent = FALSE /\ stored = {}

\* restart(level): clearTimeout(timer), a fresh round, phase "play". Notes already on the audio clock are not touched.
Restart == /\ screen' = "choose" /\ recorded' = 0

\* choose(): predict(), sceneSound(item) (a splash at +0.75 s, a ring at +1.2 s, a click at +0.55 s), and the reveal timer.
YouGuess == /\ screen = "choose" /\ ~away /\ ~resting
            /\ screen' = "watch" /\ pending' = (pending \/ sound) /\ holder' = "child"
            /\ UNCHANGED <<away, sound, recorded, late, resting, gate, sent, stored>>
\* The scheduled note sounds (or would, if the audio clock still has it).
SceneNoteSounds == /\ pending /\ pending' = FALSE
                   /\ UNCHANGED <<screen, away, sound, recorded, late, resting, gate, holder, sent, stored>>
\* The SCENE_MS timer (2.4–4.4 s) → setRevealed(true). The CSS experiment runs on the document clock either way.
TheExperimentEnds == /\ screen = "watch"
                     /\ screen' = "result"
                     /\ UNCHANGED <<away, sound, pending, recorded, late, resting, gate, holder, sent, stored>>
\* goNext(): the next question, or (on the last) levels.record, sfx.win, atBreak(), phase "end".
YouTapLast == /\ screen = "result" /\ ~away /\ ~resting
              /\ screen' = "end" /\ recorded' = recorded + 1 /\ resting' = late /\ holder' = "child"
              /\ stored' = stored \cup {"progress"}
              /\ UNCHANGED <<away, sound, pending, late, gate, sent>>
\* The end screen: আবার খেলো / পরের ধাপ (restart), শেষ (closed); the closed screen's নতুন খেলা (restart).
YouTapPlayAgain == /\ screen \in {"end", "closed"} /\ ~resting /\ ~away /\ Restart /\ holder' = "child"
                   /\ UNCHANGED <<away, sound, pending, late, resting, gate, sent, stored>>
YouTapEnd == /\ screen = "end" /\ ~resting /\ ~away
             /\ screen' = "closed" /\ holder' = "child"
             /\ UNCHANGED <<away, sound, pending, recorded, late, resting, gate, sent, stored>>
\* The সব ধাপ drawer is open in every screen and calls restart(pick).
YouPickAStep == /\ ~resting /\ ~away /\ Restart /\ holder' = "child"
                /\ UNCHANGED <<away, sound, pending, late, resting, gate, sent, stored>>
\* RestScreen neither traps focus nor makes the game inert.
YouTabAndEnterBehindRest == /\ resting /\ ~away /\ screen \in {"end", "closed"} /\ Restart /\ holder' = "child"
                            /\ UNCHANGED <<away, sound, pending, late, resting, gate, sent, stored>>

\* No handler for either: nothing pauses, nothing waits.
YouLookAway == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<screen, sound, pending, recorded, late, resting, gate, holder, sent, stored>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<screen, sound, pending, recorded, late, resting, gate, holder, sent, stored>>

\* SoundToggle → setSoundOn(false) → stopLoops(): notes already scheduled stay scheduled.
SoundOff == /\ sound /\ ~away /\ sound' = FALSE
            /\ UNCHANGED <<screen, away, pending, recorded, late, resting, gate, holder, sent, stored>>
SoundOn == /\ ~sound /\ ~away /\ sound' = TRUE
           /\ UNCHANGED <<screen, away, pending, recorded, late, resting, gate, holder, sent, stored>>

TodaysTimeRunsOut == /\ ~late /\ late' = TRUE
                     /\ UNCHANGED <<screen, away, sound, pending, recorded, resting, gate, holder, sent, stored>>
ParentGivesTenMore == /\ resting /\ ~away /\ resting' = FALSE /\ late' = FALSE
                      /\ UNCHANGED <<screen, away, sound, pending, recorded, gate, holder, sent, stored>>

ParentOpensTheGate == /\ ~gate /\ ~resting /\ ~away /\ gate' = TRUE /\ holder' = "parent"
                      /\ UNCHANGED <<screen, away, sound, pending, recorded, late, resting, sent, stored>>
\* বন্ধ করো, then the phone goes back to the child.
ParentClosesTheGate == /\ gate /\ ~away /\ gate' = FALSE /\ holder' = "child"
                       /\ UNCHANGED <<screen, away, sound, pending, recorded, late, resting, sent, stored>>
ParentHandsThePhoneBack == /\ holder = "parent" /\ ~away /\ holder' = "child"
                           /\ UNCHANGED <<screen, away, sound, pending, recorded, late, resting, gate, sent, stored>>

Next == YouGuess \/ SceneNoteSounds \/ TheExperimentEnds \/ YouTapLast \/ YouTapPlayAgain \/ YouTapEnd
        \/ YouPickAStep \/ YouTabAndEnterBehindRest \/ YouLookAway \/ YouComeBack \/ SoundOff \/ SoundOn
        \/ TodaysTimeRunsOut \/ ParentGivesTenMore \/ ParentOpensTheGate \/ ParentClosesTheGate \/ ParentHandsThePhoneBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ away \in BOOLEAN
          /\ sound \in BOOLEAN /\ pending \in BOOLEAN /\ recorded \in 0..2
          /\ late \in BOOLEAN /\ resting \in BOOLEAN /\ gate \in BOOLEAN /\ holder \in {"child", "parent"}
          /\ sent \in BOOLEAN /\ stored \subseteq {"progress", "name", "photo"}

\* The choices on each screen and whether each carries a picture (from the JSX).
Choices(s) ==
  IF s = "choose" THEN {[c |-> "a guess with its picture", pic |-> TRUE]}
  ELSE IF s = "watch" THEN {}
  ELSE IF s = "result" THEN {[c |-> "পরেরটা or শেষ", pic |-> FALSE]}
  ELSE IF s = "end" THEN {[c |-> "আবার খেলো", pic |-> FALSE], [c |-> "শেষ", pic |-> FALSE],
                          [c |-> "পরের ধাপ", pic |-> FALSE], [c |-> "আব্বু-আম্মুকে দেখাও", pic |-> FALSE]}
  ELSE {[c |-> "নতুন খেলা", pic |-> FALSE]} \* closed

\* ---- The reader's rules ----
\* The experiment is the whole point: it doesn't run its course while you're away.
NoProgressWhileAway == [][(screen = "watch" /\ screen' = "result") => ~away]_vars
\* With sound off, nothing plays: no note is left waiting on the audio clock.
SilentWhenMuted == pending => sound
NoDoubleResult == recorded <= 1
RestOnlyAtBreak == resting => screen \in {"end", "closed"}
ParentGate == gate => holder = "parent"
NoNetwork == ~sent
NoChildData == stored \subseteq {"progress"}
NoReadingNeeded == Cardinality(Choices(screen)) <= 1 \/ \A ch \in Choices(screen) : ch.pic
====
