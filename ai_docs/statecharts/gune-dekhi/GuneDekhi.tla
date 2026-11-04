---- MODULE GuneDekhi ----
\* গুনে দেখি as it is on 2026-11-04 (branch games-to-the-bar), mirrored from:
\*   tools/gune-dekhi/components/gune-game.tsx  GuneGame: phase, the 1.1 s "next pond" effect, the 1.5 s এক নজরে glimpse
\*                                               effect, onAnswer (speak), mode buttons, the step drawer, আবার খেলো / শেষ / পরের ধাপ
\*   tools/gune-dekhi/lib/game.ts               answer(), nextItem(): five items a round (two here)
\*   shared/kids-kit.tsx                        useKidsSession().atBreak(), RestScreen, ParentGate, speak()
\*   shared/game-sound.ts                       tone()/sfx check soundOn(); speak() does not
\*   shared/site-shell.tsx                      PageFrame links around the game
\* Two modes (গুনি, এক নজরে) and two items stand for three modes and five items. A counted-then-picked answer is one step.
\* The page has no blur or visibilitychange handler, so "away" is one flag. The phone has a Bangla voice (Voice).
EXTENDS Naturals
CONSTANTS Items, Voice
VARIABLES mode, phase, item, stage, looking, focused, sound, resting, exit, dropped, spokeMuted, sent, stored
vars == <<mode, phase, item, stage, looking, focused, sound, resting, exit, dropped, spokeMuted, sent, stored>>
\* dropped and spokeMuted are true only in the state right after the step that did it (Quiet clears them).
Quiet == dropped' = FALSE /\ spokeMuted' = FALSE
Modes == {"guni", "nojor"}

Open == exit = "none" /\ ~resting /\ focused     \* a tap needs the page in front (tapping it focuses it)
Restart(m) == /\ mode' = m /\ phase' = "play" /\ item' = 0 /\ stage' = "ask"
              /\ looking' = (m = "nojor")                     \* the glimpse effect runs on every new item in এক নজরে
              /\ dropped' = (phase = "play" /\ stage = "done" /\ item = Items - 1) /\ spokeMuted' = FALSE

Init == /\ mode = "guni" /\ phase = "play" /\ item = 0 /\ stage = "ask" /\ looking = FALSE /\ focused = TRUE /\ sound = TRUE
        /\ resting = FALSE /\ exit = "none" /\ dropped = FALSE /\ spokeMuted = FALSE /\ sent = FALSE /\ stored = FALSE

\* onAnswer → answer() 'right': sfx.good(), speak(NUMBER_WORDS[...]). Fish taps also speak each number (onFish).
YouAnswerRight == /\ Open /\ phase = "play" /\ stage = "ask"
                  /\ stage' = "done"
                  /\ spokeMuted' = (Voice /\ ~sound) /\ dropped' = FALSE
                  /\ UNCHANGED <<mode, phase, item, looking, focused, sound, resting, exit, sent, stored>>
\* এক নজরে: আবার দেখাও, or a wrong answer (setFlash): the group shows again for 1.5 s.
YouSeeItAgain == /\ Open /\ phase = "play" /\ mode = "nojor" /\ stage = "ask" /\ ~looking
                 /\ looking' = TRUE
                 /\ UNCHANGED <<mode, phase, item, stage, focused, sound, resting, exit, sent, stored>> /\ Quiet
\* The glimpse setTimeout(1500) fires whether or not anyone is looking; nothing hides or pauses it on blur.
GlimpseEnds == /\ looking /\ looking' = FALSE /\ Quiet
               /\ UNCHANGED <<mode, phase, item, stage, focused, sound, resting, exit, sent, stored>>
\* The 1.1 s effect after a right answer: the next pond, or after the last one record(), sfx.win(), atBreak(), setPhase('end').
NextPondComes == /\ phase = "play" /\ stage = "done" /\ item < Items - 1
                 /\ item' = item + 1 /\ stage' = "ask" /\ looking' = (mode = "nojor")
                 /\ UNCHANGED <<mode, phase, focused, sound, resting, exit, sent, stored>> /\ Quiet
RoundEnds == /\ phase = "play" /\ stage = "done" /\ item = Items - 1
             /\ phase' = "end" /\ resting' \in BOOLEAN
             /\ UNCHANGED <<mode, item, stage, looking, focused, sound, exit, sent, stored>> /\ Quiet
\* The mode buttons (always on screen) and the "সব ধাপ" drawer: restart(), which drops the pending 1.1 s timer.
YouTapAModeOrStep == /\ Open /\ \E m \in Modes : (m # mode \/ phase # "play") /\ Restart(m)
                     /\ UNCHANGED <<focused, sound, resting, exit, sent, stored>>
YouTapAStepInTheDrawer == /\ Open /\ Restart(mode)
                          /\ UNCHANGED <<focused, sound, resting, exit, sent, stored>>
\* The end card: আবার খেলো / পরের ধাপ restart; শেষ closes ("মাছগুলো পুকুরেই রইল।") with its own আবার খেলো.
YouPlayAgain == /\ Open /\ phase \in {"end", "closed"} /\ Restart(mode)
                /\ UNCHANGED <<focused, sound, resting, exit, sent, stored>>
YouTapShesh == /\ Open /\ phase = "end" /\ phase' = "closed"
               /\ UNCHANGED <<mode, item, stage, looking, focused, sound, resting, exit, sent, stored>> /\ Quiet
WindowBlurs == /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<mode, phase, item, stage, looking, sound, resting, exit, sent, stored>> /\ Quiet
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<mode, phase, item, stage, looking, sound, resting, exit, sent, stored>> /\ Quiet
SoundOff == /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<mode, phase, item, stage, looking, focused, resting, exit, sent, stored>> /\ Quiet
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<mode, phase, item, stage, looking, focused, resting, exit, sent, stored>> /\ Quiet
ParentGivesMoreTime == /\ resting /\ resting' = FALSE
                       /\ UNCHANGED <<mode, phase, item, stage, looking, focused, sound, exit, sent, stored>> /\ Quiet
ParentSharesTheLink == /\ Open /\ exit' = "share"
                       /\ UNCHANGED <<mode, phase, item, stage, looking, focused, sound, resting, sent, stored>> /\ Quiet
YouTapALinkAroundTheGame == /\ Open /\ exit' = "site"
                            /\ UNCHANGED <<mode, phase, item, stage, looking, focused, sound, resting, sent, stored>> /\ Quiet
Done == exit # "none" /\ UNCHANGED vars

Next == YouAnswerRight \/ YouSeeItAgain \/ GlimpseEnds \/ NextPondComes \/ RoundEnds \/ YouTapAModeOrStep \/ YouTapAStepInTheDrawer
        \/ YouPlayAgain \/ YouTapShesh \/ WindowBlurs \/ WindowFocuses \/ SoundOff \/ SoundOn
        \/ ParentGivesMoreTime \/ ParentSharesTheLink \/ YouTapALinkAroundTheGame \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ mode \in Modes /\ phase \in {"play", "end", "closed"} /\ item \in 0..(Items - 1) /\ stage \in {"ask", "done"}
          /\ looking \in BOOLEAN /\ focused \in BOOLEAN /\ sound \in BOOLEAN /\ resting \in BOOLEAN /\ exit \in {"none", "share", "site"}
          /\ dropped \in BOOLEAN /\ spokeMuted \in BOOLEAN /\ sent \in BOOLEAN /\ stored \in BOOLEAN

\* What a 3–6 year old must tap to go on, per screen, and which of those carry a picture.
Needed == CASE phase = "play"   -> {"fish", "tile", "mode"}
          []   phase = "end"    -> {"again", "shesh", "nextStep"}     \* three text-only buttons
          []   phase = "closed" -> {"again"}
Pictured == {"fish", "tile", "mode", "sound"}

\* The reader's rules.
FinishCounts == ~dropped
\* The 1.5 s glimpse never runs while you are away (it would run out unseen).
GlimpseOnlyWhileWatching == looking => focused
SilentWhenMuted == ~spokeMuted
RestOnlyAtBreak == resting => phase = "end"
ParentGate == exit # "site"
NoNetwork == ~sent
NoChildData == ~stored
NoReadingNeeded == Needed \subseteq Pictured
====
