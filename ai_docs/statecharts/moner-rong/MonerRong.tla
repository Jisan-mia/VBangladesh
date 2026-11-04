---- MODULE MonerRong ----
EXTENDS Naturals
\* মনের রং (ages 4–9): one set of scenes (name the feeling → pick a kind thing → talk about it → next), the read-aloud
\* voice and the site-wide sound switch, the end card and the hidden button under it, the practice stars, the cues a
\* pre-reader gets, the kids' daily limit and rest screen, the parent gate, and the ways out of the kids' area.
\* Mirrored from, as of 2026-11-04:
\*   tools/moner-rong/components/moner-game.tsx  (onFace, onKind, onNext, restart, the end / closed screens, the drawer)
\*   tools/moner-rong/lib/scenes.ts              (nameFeeling, chooseKind, nextScene → null on the last scene, practised)
\*   shared/kids-kit.tsx                         (speak, atBreak/extend, RestScreen, ParentGate)
\*   shared/game-kit.ts, shared/game-core.ts     (useLevels.record = recordLevel: max of old and new)
\*   shared/game-sound.ts, shared/game-ui.tsx    (SoundToggle → setSoundOn: stops loops, not speech)
\*   shared/site-shell.tsx                       (PageFrame: header search and links, related tools, footer)
\* A set has two scenes here (the game has four to six). The phone has a Bangla voice, so speak() really speaks; a line
\* has finished before the child's next choice, so the model ends it on the next step.
\* Stars mean "times this set was played through", capped at 3 (practised); the model plays it through once (a second set can start, to show what starts under the rest screen, but not finish).
\* The gate works the same on every screen, so the model uses it on the end card and the rest screen only.

VARIABLES step, speaking, sound, plays, stars, recorded, overLimit, rest, gate, away
vars == <<step, speaking, sound, plays, stars, recorded, overLimit, rest, gate, away>>

Steps == {"name1", "kind1", "talk1", "name2", "kind2", "talk2", "end", "closed"}
InSet == step \in {"name1", "kind1", "talk1", "name2", "kind2", "talk2"}
AtBreak == step \in {"end", "closed"}
Gate == {"shut", "holding", "repeat", "orphan", "ask", "early", "open", "child"}
KeysWritten == {"levels", "kidsTime", "kidsLimit", "sound", "slow"}
Progress == {"levels", "kidsTime", "kidsLimit", "sound", "slow"}
ASSUME KeysWritten \subseteq Progress
Min(a, b) == IF a < b THEN a ELSE b

Init == /\ step = "name1" /\ speaking = FALSE /\ sound = TRUE /\ plays = 0 /\ stars = 0 /\ recorded = 0
        /\ overLimit = FALSE /\ rest = FALSE /\ gate = "shut" /\ away = FALSE

Here == ~away
Touch == Here /\ ~rest /\ ~AtBreak   \* the end card (.mr-over, z-index 5) and the rest screen cover the scene
Card == Here /\ ~rest /\ AtBreak

\* onFace(): a face that fits → sfx.good, speak(sayLine). speak() asks soundOn() since 2026-11-04 10:12 (before that it
\* spoke with sound off too; replayed live at 10:05). setSoundOn(false) never calls speechSynthesis.cancel().
YouNameTheFeeling == /\ Touch /\ step \in {"name1", "name2"}
                     /\ step' = (IF step = "name1" THEN "kind1" ELSE "kind2") /\ speaking' = sound
                     /\ UNCHANGED <<sound, plays, stars, recorded, overLimit, rest, gate, away>>
\* onFace(): a face that doesn't fit → a soft tone, a shake, "আরেকবার ভাবো" (the round's ease, not modelled).
YouPickAnotherFace == /\ Touch /\ step \in {"name1", "name2"} /\ speaking' = FALSE
                      /\ UNCHANGED <<step, sound, plays, stars, recorded, overLimit, rest, gate, away>>
\* onKind(): a note, speak(after).
YouPickAKindThing == /\ Touch /\ step \in {"kind1", "kind2"}
                     /\ step' = (IF step = "kind1" THEN "talk1" ELSE "talk2") /\ speaking' = sound
                     /\ UNCHANGED <<sound, plays, stars, recorded, overLimit, rest, gate, away>>
\* onNext(): পরের ছবি → the next scene, speak(scene text).
YouPressNextPicture == /\ Touch /\ step = "talk1" /\ step' = "name2" /\ speaking' = sound
                       /\ UNCHANGED <<sound, plays, stars, recorded, overLimit, rest, gate, away>>
\* onNext() on the last scene: nextScene() is null → record practised(stars), add to today's card, win, atBreak(), "end".
\* The last scene stays drawn under the card with its ধাপ শেষ button.
YouPressSetDone == /\ Touch /\ step = "talk2" /\ plays < 1
                   /\ step' = "end" /\ speaking' = FALSE
                   /\ plays' = plays + 1 /\ stars' = Min(3, stars + 1) /\ recorded' = recorded + 1 /\ rest' = overLimit
                   /\ UNCHANGED <<sound, overLimit, gate, away>>
\* The card covers ধাপ শেষ for a finger, not a keyboard: press() acts on click with detail 0, so Enter runs onNext() again.
YouPressTheHiddenButton == /\ Here /\ AtBreak /\ recorded < 2 /\ stars < 3
                           /\ step' = "end" /\ stars' = Min(3, stars + 1) /\ recorded' = recorded + 1 /\ rest' = overLimit
                           /\ UNCHANGED <<speaking, sound, plays, overLimit, gate, away>>
\* শেষ → "আজকের ছবিগুলো তোলা রইল।"
YouPressShesh == /\ Card /\ step = "end" /\ step' = "closed" /\ gate' = "shut"
                 /\ UNCHANGED <<speaking, sound, plays, stars, recorded, overLimit, rest, away>>
\* restart(): আবার খেলো, পরের ধাপ, or a set from "সব ধাপ" (the model replays the same set).
YouStartASet == /\ Here /\ ~rest /\ step # "name1"
                /\ step' = "name1" /\ recorded' = 0 /\ speaking' = FALSE /\ gate' = "shut"
                /\ UNCHANGED <<sound, plays, stars, overLimit, rest, away>>
\* RestScreen has no inert or focus trap: Tab reaches আবার খেলো under it.
YouTabUnderTheRestScreen == /\ Here /\ rest /\ AtBreak
                            /\ step' = "name1" /\ recorded' = 0 /\ gate' = "shut"
                            /\ UNCHANGED <<speaking, sound, plays, stars, overLimit, rest, away>>

SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ UNCHANGED <<step, speaking, plays, stars, recorded, overLimit, rest, gate, away>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE /\ UNCHANGED <<step, speaking, plays, stars, recorded, overLimit, rest, gate, away>>
TheLineIsSpoken == /\ speaking /\ speaking' = FALSE /\ UNCHANGED <<step, sound, plays, stars, recorded, overLimit, rest, gate, away>>

TodaysTimeRunsOut == /\ Here /\ ~overLimit /\ overLimit' = TRUE
                     /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, rest, gate, away>>

\* ParentGate (see Juktoborno.tla for the timer story).
GateOnScreen == Here /\ (step = "end" \/ rest)
SomeoneHoldsTheGate == /\ GateOnScreen /\ gate = "shut" /\ gate' = "holding"
                       /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
TheKeyAutoRepeats == /\ gate = "holding" /\ gate' = "repeat"
                     /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
TheyLetGoEarly == /\ gate \in {"holding", "repeat"} /\ gate' = IF gate = "repeat" THEN "orphan" ELSE "shut"
                  /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
TwoSecondsPass == /\ gate \in {"holding", "repeat", "orphan"} /\ gate' = IF gate = "orphan" THEN "early" ELSE "ask"
                  /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
AGrownUpAnswers == /\ gate \in {"ask", "early"} /\ gate' = "open"
                   /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
AChildMashesThePad == /\ gate \in {"ask", "early"} /\ gate' = "child"
                      /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
TheGateCloses == /\ gate \in {"ask", "early", "open", "child"} /\ gate' = "shut"
                 /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest, away>>
TheyGiveTenMore == /\ rest /\ gate \in {"open", "child"} /\ rest' = FALSE /\ overLimit' = FALSE /\ gate' = "shut"
                   /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, away>>

\* PageFrame: header search and links, related tools (the flagship first), the footer — in the child's view.
TheChildTapsASiteLink == /\ Here /\ ~rest /\ step \in {"name1", "end"}
                         /\ away' = TRUE /\ step' = "name1" /\ recorded' = 0 /\ speaking' = FALSE
                         /\ UNCHANGED <<sound, plays, stars, overLimit, rest, gate>>
TheyComeBack == /\ away /\ away' = FALSE /\ gate' = "shut"
                /\ UNCHANGED <<step, speaking, sound, plays, stars, recorded, overLimit, rest>>

\* Played through once: the model stops replaying (one play is enough to show every rule).
Done == /\ plays = 1 /\ AtBreak /\ UNCHANGED vars

Next == YouNameTheFeeling \/ YouPickAnotherFace \/ YouPickAKindThing \/ YouPressNextPicture \/ YouPressSetDone
        \/ YouPressTheHiddenButton \/ YouPressShesh \/ YouStartASet \/ YouTabUnderTheRestScreen
        \/ SoundOff \/ SoundOn \/ TheLineIsSpoken \/ TodaysTimeRunsOut
        \/ SomeoneHoldsTheGate \/ TheKeyAutoRepeats \/ TheyLetGoEarly \/ TwoSecondsPass \/ AGrownUpAnswers \/ AChildMashesThePad
        \/ TheGateCloses \/ TheyGiveTenMore \/ TheChildTapsASiteLink \/ TheyComeBack
        \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == step \in Steps /\ speaking \in BOOLEAN /\ sound \in BOOLEAN /\ plays \in 0..2 /\ stars \in 0..3 /\ recorded \in 0..2
          /\ overLimit \in BOOLEAN /\ rest \in BOOLEAN /\ gate \in Gate /\ away \in BOOLEAN

\* What a pre-reader has, besides the words, on each screen: faces (name), icons (kind), a → and a ghost finger after a
\* wait (talk). The end card's আবার খেলো, শেষ and পরের ধাপ are words only, the same size, no picture, no 🔈.
Cue == step \notin {"end"}

\* The reader's rules.
NoReadingNeeded == Here /\ ~rest => Cue
VoiceOnlyWithSound == speaking => sound
NoDoubleResult == recorded <= 1
StarsMatchPlays == stars = Min(3, plays)
StarsNeverDrop == [][stars' >= stars]_vars
RestOnlyAtBreak == rest => AtBreak
GateNeedsAFullHold == gate # "early"
ChildCannotOpenGate == gate # "child"
NoWayOutWithoutGate == away => gate = "open"
NoNetwork == TRUE          \* no action above sends anything
NoChildData == KeysWritten \subseteq Progress
====
