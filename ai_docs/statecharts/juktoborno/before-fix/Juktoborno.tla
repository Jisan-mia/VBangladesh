---- MODULE Juktoborno ----
EXTENDS Naturals
\* যুক্তবর্ণ ভাঙি-জুড়ি (ages 7–10): one round, the read-aloud voice, the site-wide sound switch, the kids' daily limit and
\* rest screen, the parent gate, and the ways out of the kids' area. Mirrored from, as of 2026-11-04:
\*   tools/juktoborno/components/juktoborno-game.tsx  (tapTile, goNext, restart, the end / closed screens, the drawers)
\*   tools/juktoborno/lib/words.ts                    (place: fill / right / wrong; next; starsOf)
\*   shared/kids-kit.tsx                              (speak, useKidsSession.atBreak/extend, RestScreen, ParentGate)
\*   shared/game-kit.ts, shared/game-core.ts          (useLevels.record = recordLevel: max of old and new stars)
\*   shared/game-sound.ts, shared/game-ui.tsx         (SoundToggle → setSoundOn: stops loops, not speech)
\*   shared/site-shell.tsx                            (PageFrame: header search and links, related tools, footer)
\* A round has two words here (the game has six). The round is the same at every word, so two show every step.
\* The parent gate behaves the same on every screen, so the model works it on the round card and the rest screen only,
\* and leaving the card shuts it (the real বড়দের জন্য under the game stays mounted; its states are the same).
\* The phone has a Bangla voice (Orca's browser does), so speak() really speaks. A word takes about a second to say, so it
\* has finished before the next tap; the model ends it on the next step of the round.
\* Leaving the page unmounts the game, so the model forgets the round while away and starts fresh on the way back.

VARIABLES pos, miss, best, recorded, sound, speaking, overLimit, rest, gate, away
vars == <<pos, miss, best, recorded, sound, speaking, overLimit, rest, gate, away>>

\* pos: which word is up, solved or not, then the end card ("end") or "কারখানা আজকের মতো বন্ধ" ("closed").
Pos == {"ask1", "ok1", "ask2", "ok2", "end", "closed"}
InRound == pos \in {"ask1", "ok1", "ask2", "ok2"}
AtBreak == pos \in {"end", "closed"}
\* The gate: shut; held by a finger or key (one 2 s timer); the key auto-repeats (a second timer, the first orphaned);
\* let go with the orphan still running; the sum question after a full hold, or after a let-go ("early");
\* opened by a grown-up's answer, or by a child mashing the pad.
Gate == {"shut", "holding", "repeat", "orphan", "ask", "early", "open", "child"}
\* What the code writes to the phone: stars per level, the খাতা, play time today, the daily limit, sound and slow.
KeysWritten == {"levels", "book", "kidsTime", "kidsLimit", "sound", "slow"}
Progress == {"levels", "book", "kidsTime", "kidsLimit", "sound", "slow"}
ASSUME KeysWritten \subseteq Progress

Init == /\ pos = "ask1" /\ miss = FALSE /\ best = 0 /\ recorded = 0
        /\ sound = TRUE /\ speaking = FALSE /\ overLimit = FALSE /\ rest = FALSE /\ gate = "shut" /\ away = FALSE

Here == ~away
Touch == Here /\ ~rest            \* a finger reaches the game only while the rest screen does not cover it

\* tapTile → place(): the last letter fits; clank(), speak(word). speak() asks soundOn() since 2026-11-04 10:12
\* (before that it spoke with sound off too; replayed live at 09:52).
YouSolveTheWord == /\ Touch /\ pos \in {"ask1", "ask2"}
                   /\ pos' = IF pos = "ask1" THEN "ok1" ELSE "ok2"
                   /\ speaking' = sound
                   /\ UNCHANGED <<miss, best, recorded, sound, overLimit, rest, gate, away>>
\* tapTile → place(): a wrong or swapped letter; a soft tone and a shake, the slots empty.
YouTryAWrongLetter == /\ Touch /\ pos \in {"ask1", "ask2"} /\ miss' = TRUE
                      /\ UNCHANGED <<pos, best, recorded, sound, speaking, overLimit, rest, gate, away>>
\* goNext(): পরেরটা, or শেষ on the last word: record the stars once, win sound, atBreak().
YouPressNext == /\ Touch /\ pos = "ok1" /\ pos' = "ask2" /\ speaking' = FALSE
                /\ UNCHANGED <<miss, best, recorded, sound, overLimit, rest, gate, away>>
YouFinishTheRound == /\ Touch /\ pos = "ok2" /\ pos' = "end"
                     /\ best' = IF miss THEN (IF best = 3 THEN 3 ELSE 1) ELSE 3
                     /\ recorded' = recorded + 1
                     /\ rest' = overLimit /\ speaking' = FALSE
                     /\ miss' = FALSE      \* the misses have done their work (the stars); nothing else reads them
                     /\ UNCHANGED <<sound, overLimit, gate, away>>
\* restart(): আবার খেলো, পরের ধাপ, নতুন খেলা, or a level from "সব ধাপ" — by finger, so only while nothing covers the game.
YouStartARound == /\ Touch /\ pos # "ask1"
                  /\ pos' = "ask1" /\ miss' = FALSE /\ recorded' = 0 /\ gate' = "shut"
                  /\ UNCHANGED <<best, sound, speaking, overLimit, rest, away>>
\* RestScreen is a fixed overlay with no inert and no focus trap: Tab reaches আবার খেলো under it, Enter starts a round.
YouTabUnderTheRestScreen == /\ Here /\ rest /\ AtBreak
                            /\ pos' = "ask1" /\ miss' = FALSE /\ recorded' = 0 /\ gate' = "shut"
                            /\ UNCHANGED <<best, sound, speaking, overLimit, rest, away>>
\* শেষ on the end card.
YouPressShesh == /\ Touch /\ pos = "end" /\ pos' = "closed" /\ gate' = "shut"
                 /\ UNCHANGED <<miss, best, recorded, sound, speaking, overLimit, rest, away>>

\* The site-wide switch: setSoundOn(false) stops loops (there are none here) but never calls speechSynthesis.cancel().
SoundOff == /\ Here /\ sound /\ sound' = FALSE /\ UNCHANGED <<pos, miss, best, recorded, speaking, overLimit, rest, gate, away>>
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE /\ UNCHANGED <<pos, miss, best, recorded, speaking, overLimit, rest, gate, away>>
TheWordIsSpoken == /\ speaking /\ speaking' = FALSE /\ UNCHANGED <<pos, miss, best, recorded, sound, overLimit, rest, gate, away>>

\* useKidsSession: every 10 s of visible time adds to today's total; it can pass the limit at any moment.
TodaysTimeRunsOut == /\ Here /\ ~overLimit /\ overLimit' = TRUE
                     /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, rest, gate, away>>

\* ParentGate. start() sets a fresh 2 s timer and overwrites hold.current; stop() clears only hold.current.
GateOnScreen == Here /\ (pos = "end" \/ rest)
SomeoneHoldsTheGate == /\ GateOnScreen /\ gate = "shut" /\ gate' = "holding"
                       /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
TheKeyAutoRepeats == /\ gate = "holding" /\ gate' = "repeat"
                     /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
TheyLetGoEarly == /\ gate \in {"holding", "repeat"} /\ gate' = IF gate = "repeat" THEN "orphan" ELSE "shut"
                  /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
TwoSecondsPass == /\ gate \in {"holding", "repeat", "orphan"} /\ gate' = IF gate = "orphan" THEN "early" ELSE "ask"
                  /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
\* press(): any digits; the right sum opens; a wrong pair just clears. No limit on tries.
AGrownUpAnswers == /\ gate \in {"ask", "early"} /\ gate' = "open"
                   /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
AChildMashesThePad == /\ gate \in {"ask", "early"} /\ gate' = "child"
                      /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
TheGateCloses == /\ gate \in {"ask", "early", "open", "child"} /\ gate' = "shut"
                 /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest, away>>
\* RestScreen behind the gate: আজ আরও ১০ মিনিট → extend().
TheyGiveTenMore == /\ rest /\ gate \in {"open", "child"} /\ rest' = FALSE /\ overLimit' = FALSE /\ gate' = "shut"
                   /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, away>>

\* PageFrame around every kids' game: the header search and গেম/কুইজ/টুলস, "এগুলোও ভালো লাগতে পারে" (the flagship first),
\* the footer — all in the child's view, none behind the gate. (The ?print link stays on this tool.)
TheChildTapsASiteLink == /\ Touch /\ away' = TRUE
                         /\ pos' = "ask1" /\ miss' = FALSE /\ recorded' = 0 /\ speaking' = FALSE /\ rest' = FALSE
                         /\ UNCHANGED <<best, sound, overLimit, gate>>
\* Back on the page: a fresh round; the rest screen (React state) is gone until the next round ends.
TheyComeBack == /\ away /\ away' = FALSE /\ gate' = "shut"
                /\ UNCHANGED <<pos, miss, best, recorded, sound, speaking, overLimit, rest>>

Next == YouSolveTheWord \/ YouTryAWrongLetter \/ YouPressNext \/ YouFinishTheRound \/ YouStartARound \/ YouTabUnderTheRestScreen
        \/ YouPressShesh \/ SoundOff \/ SoundOn \/ TheWordIsSpoken \/ TodaysTimeRunsOut
        \/ SomeoneHoldsTheGate \/ TheKeyAutoRepeats \/ TheyLetGoEarly \/ TwoSecondsPass \/ AGrownUpAnswers \/ AChildMashesThePad
        \/ TheGateCloses \/ TheyGiveTenMore \/ TheChildTapsASiteLink \/ TheyComeBack

Spec == Init /\ [][Next]_vars

TypeOK == pos \in Pos /\ miss \in BOOLEAN /\ best \in {0, 1, 3} /\ recorded \in 0..2 /\ sound \in BOOLEAN
          /\ speaking \in BOOLEAN /\ overLimit \in BOOLEAN /\ rest \in BOOLEAN /\ gate \in Gate /\ away \in BOOLEAN

\* The reader's rules.
RestOnlyAtBreak == rest => AtBreak
NoDoubleResult == recorded <= 1
StarsNeverDrop == [][best' >= best]_vars
VoiceOnlyWithSound == speaking => sound
GateNeedsAFullHold == gate # "early"
ChildCannotOpenGate == gate # "child"
NoWayOutWithoutGate == away => gate = "open"
NoNetwork == TRUE          \* no action above sends anything: the game has no fetch, tally or share-client call
NoChildData == KeysWritten \subseteq Progress
====
