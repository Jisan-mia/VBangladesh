---- MODULE NirapodeThaki ----
\* নিরাপদে থাকি as it is on 2026-11-04 (branch games-to-the-bar), mirrored from:
\*   tools/nirapode-thaki/components/safe-game.tsx  SafeGame: phase, start(), the #s= hash on load, choose() (speak), next(),
\*                                                  finish() (record, atBreak), আবার খেলো / শেষ, SetTiles under the game
\*   tools/nirapode-thaki/lib/round.ts              choiceCount, starsOf
\*   shared/kids-kit.tsx                            useKidsSession().atBreak(), RestScreen, ParentGate, speak()
\*   shared/game-sound.ts                           tone()/sfx check soundOn(); speak() does not
\*   shared/site-shell.tsx                          PageFrame links around the game
\* Two questions stand for five, two scenes for six. Nothing in the game runs on a timer, so focus is not modelled.
\* Ages 6–10 (parent note), so the 3–5 NoReadingNeeded rule is replaced by its 6+ form: every answer is a picture.
\* The phone has a Bangla voice (Voice).
EXTENDS Naturals
CONSTANTS Questions, Voice
VARIABLES link, opened, scene, phase, q, solved, tried, sound, resting, exit, lost, spokeMuted, sent, stored
vars == <<link, opened, scene, phase, q, solved, tried, sound, resting, exit, lost, spokeMuted, sent, stored>>
Scenes == {"rasta", "pukur"}
Quiet == lost' = FALSE /\ spokeMuted' = FALSE
Open == exit = "none" /\ ~resting

\* The mount effect: start(setFromHash(location.hash) ?? firstOpenSet(...)). "pukur" plays the first set without stars.
Init == /\ link \in {"none", "rasta", "junk"}
        /\ scene = IF link = "rasta" THEN "rasta" ELSE "pukur"
        /\ opened = scene
        /\ phase = "play" /\ q = 0 /\ solved = FALSE /\ tried = FALSE /\ sound = TRUE /\ resting = FALSE /\ exit = "none"
        /\ lost = FALSE /\ spokeMuted = FALSE /\ sent = FALSE /\ stored = FALSE

\* choose(right): sfx.good(), speak(question.rule).
YouPickTheSafeOne == /\ Open /\ phase = "play" /\ ~solved
                     /\ solved' = TRUE /\ spokeMuted' = (Voice /\ ~sound) /\ lost' = FALSE
                     /\ UNCHANGED <<link, opened, scene, phase, q, tried, sound, resting, exit, sent, stored>>
\* choose(wrong): a soft tone and a wobble, "আরেকবার ভাবো।"
YouPickAWrongOne == /\ Open /\ phase = "play" /\ ~solved /\ ~tried
                    /\ tried' = TRUE
                    /\ UNCHANGED <<link, opened, scene, phase, q, solved, sound, resting, exit, sent, stored>> /\ Quiet
\* next(): পরেরটা, or on the last question দেখো কী শিখলে → finish(): record(), confetti or sfx.win(), setPhase('done'), atBreak().
YouTapNext == /\ Open /\ phase = "play" /\ solved
              /\ IF q < Questions - 1
                 THEN q' = q + 1 /\ solved' = FALSE /\ tried' = FALSE /\ UNCHANGED <<phase, resting>>
                 ELSE phase' = "done" /\ resting' \in BOOLEAN /\ UNCHANGED <<q, solved, tried>>
              /\ UNCHANGED <<link, opened, scene, sound, exit, sent, stored>> /\ Quiet
\* আবার খেলো on the done screen: start(set.id).
YouPlayAgain == /\ Open /\ phase = "done"
                /\ phase' = "play" /\ q' = 0 /\ solved' = FALSE /\ tried' = FALSE
                /\ UNCHANGED <<link, opened, scene, sound, resting, exit, sent, stored>> /\ Quiet
\* শেষ: setPhase('idle'), the scene tiles.
YouTapShesh == /\ Open /\ phase = "done" /\ phase' = "idle"
               /\ UNCHANGED <<link, opened, scene, q, solved, tried, sound, resting, exit, sent, stored>> /\ Quiet
\* SetTiles (under the game while playing, and on the idle screen): pickSet() → start(id), even for the scene in play.
YouTapASceneTile == /\ Open
                    /\ \E s \in Scenes : scene' = s /\ lost' = (phase = "play" /\ s = scene /\ (q > 0 \/ solved \/ tried))
                    /\ phase' = "play" /\ q' = 0 /\ solved' = FALSE /\ tried' = FALSE /\ spokeMuted' = FALSE
                    /\ UNCHANGED <<link, opened, sound, resting, exit, sent, stored>>
SoundOff == /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<link, opened, scene, phase, q, solved, tried, resting, exit, sent, stored>> /\ Quiet
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<link, opened, scene, phase, q, solved, tried, resting, exit, sent, stored>> /\ Quiet
ParentGivesMoreTime == /\ resting /\ resting' = FALSE
                       /\ UNCHANGED <<link, opened, scene, phase, q, solved, tried, sound, exit, sent, stored>> /\ Quiet
ParentSharesTheLink == /\ Open /\ exit' = "share"
                       /\ UNCHANGED <<link, opened, scene, phase, q, solved, tried, sound, resting, sent, stored>> /\ Quiet
YouTapALinkAroundTheGame == /\ Open /\ exit' = "site"
                            /\ UNCHANGED <<link, opened, scene, phase, q, solved, tried, sound, resting, sent, stored>> /\ Quiet
Done == exit # "none" /\ UNCHANGED vars

Next == YouPickTheSafeOne \/ YouPickAWrongOne \/ YouTapNext \/ YouPlayAgain \/ YouTapShesh \/ YouTapASceneTile
        \/ SoundOff \/ SoundOn \/ ParentGivesMoreTime \/ ParentSharesTheLink \/ YouTapALinkAroundTheGame \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ link \in {"none", "rasta", "junk"} /\ opened \in Scenes /\ scene \in Scenes /\ phase \in {"play", "done", "idle"} /\ q \in 0..(Questions - 1)
          /\ solved \in BOOLEAN /\ tried \in BOOLEAN /\ sound \in BOOLEAN /\ resting \in BOOLEAN /\ exit \in {"none", "share", "site"}
          /\ lost \in BOOLEAN /\ spokeMuted \in BOOLEAN /\ sent \in BOOLEAN /\ stored \in BOOLEAN

\* What the child must tap to go on (6+ form): the answers are icon + word; পরেরটা, আবার খেলো, শেষ are words.
Answers == {"choice"}
Pictured == {"choice", "sceneTile", "sound"}

\* The reader's rules.
\* A #s=<scene> link opens that scene; a broken one falls back to the first scene without stars (checked live too).
LinkOpensItsScene == opened = (IF link = "rasta" THEN "rasta" ELSE "pukur")
SilentWhenMuted == ~spokeMuted
SceneTileKeepsRound == ~lost
RestOnlyAtBreak == resting => phase = "done"
ParentGate == exit # "site"
NoNetwork == ~sent
NoChildData == ~stored
AnswersArePictures == Answers \subseteq Pictured
====
