---- MODULE Ghontar ----
\* ঘণ্টার সুর after the rewrite: a level's play phases, the pause (blur, hidden tab, the player's menu, the সব লেভেল sheet),
\* what is recorded and when, and a friend's link. Mirrors tools/ghontar-sur/lib/run.ts (the reducer) and
\* tools/ghontar-sur/components/bell-game.tsx (the listeners). There are no timers to cancel: every timed thing is the one
\* phase clock, which moves only while Running, so "nothing happens while paused" is a property of the state itself.
\* A round (two in the model) ends right, or with a slip; three slips end the level. Counters are abstract.
\* "why" is run.why (none, away or sheet), "sheet" is the open সব লেভেল. Links are modelled in GhontarLink.tla.
EXTENDS Naturals
VARIABLES phase, why, sheet, visible, focused, round, slips, done, recorded
vars == <<phase, why, sheet, visible, focused, round, slips, done, recorded>>

Active == {"lead", "call", "answer", "miss", "cheer", "encore"}
Here == visible /\ focused
Running == why = "none" /\ phase \in Active
Fresh == /\ phase' = "ready" /\ why' = "none" /\ sheet' = FALSE /\ round' = 1 /\ slips' = 0
            /\ done' = "none" /\ recorded' = FALSE
\* pause(s, "away"): only a running clock stops; a sheet's pause is never replaced by an away pause.
Away == IF Running THEN why' = "away" ELSE why' = why
\* resume(): a call you didn't hear (or an encore) starts over from its lead-in; any other phase carries on.
Restart == IF phase \in {"lead", "call"} THEN phase' = "lead" ELSE phase' = phase
AnswerTurn == Here /\ Running /\ phase = "answer"

Init == /\ phase = "ready" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE /\ round = 1 /\ slips = 0
        /\ done = "none" /\ recorded = FALSE

\* begin(): the big bell, or Enter, on the title.
YouStart == /\ Here /\ ~sheet /\ phase = "ready" /\ phase' = "lead"
            /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
\* tick(): lead → call → answer.
TheLeadEnds == /\ Running /\ phase = "lead" /\ phase' = "call"
               /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
TheCallEnds == /\ Running /\ phase = "call" /\ phase' = "answer"
               /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
\* tap(): the last note of a round that isn't the last.
YouFinishARound == /\ AnswerTurn /\ round < 2 /\ phase' = "cheer"
                   /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
\* tap(): the last note of the last round. finalize() records the stars and the best in this very event.
YouFinishTheLevel == /\ AnswerTurn /\ round = 2 /\ phase' = "cheer" /\ done' = "won" /\ recorded' = TRUE
                     /\ UNCHANGED <<why, sheet, visible, focused, round, slips>>
\* tap(): a wrong bell shows the right one; the call plays again.
YouSlip == /\ AnswerTurn /\ slips < 2 /\ phase' = "miss" /\ slips' = slips + 1
           /\ UNCHANGED <<why, sheet, visible, focused, round, done, recorded>>
YouSlipTheThirdTime == /\ AnswerTurn /\ slips = 2 /\ phase' = "miss" /\ slips' = 3 /\ done' = "lost" /\ recorded' = TRUE
                       /\ UNCHANGED <<why, sheet, visible, focused, round>>
\* tick(): the cheer ends: the next round, or on a win the encore (a finale only) and then the end screen.
TheCheerEnds == /\ Running /\ phase = "cheer"
                /\ IF done = "won" THEN phase' \in {"encore", "over"} /\ round' = round
                   ELSE phase' = "lead" /\ round' = round + 1
                /\ UNCHANGED <<why, sheet, visible, focused, slips, done, recorded>>
TheMissEnds == /\ Running /\ phase = "miss" /\ IF done = "lost" THEN phase' = "over" ELSE phase' = "lead"
               /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
TheEncoreEnds == /\ Running /\ phase = "encore" /\ phase' = "over"
                 /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
\* skipEncore(): a tap or Enter.
YouSkipTheEncore == /\ Here /\ Running /\ phase = "encore" /\ phase' = "over"
                    /\ UNCHANGED <<why, sheet, visible, focused, round, slips, done, recorded>>
\* The window's blur and the tab's visibilitychange both call pauseFor("away"). Coming back doesn't resume: চালিয়ে যাও does.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ Away
               /\ UNCHANGED <<phase, sheet, visible, round, slips, done, recorded>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, round, slips, done, recorded>>
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Away
            /\ UNCHANGED <<phase, sheet, round, slips, done, recorded>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, round, slips, done, recorded>>
\* resume(s, deal, now, "away"): চালিয়ে যাও in the player's menu, or the cover button outside it.
YouResume == /\ Here /\ why = "away" /\ why' = "none" /\ Restart
             /\ UNCHANGED <<sheet, visible, focused, round, slips, done, recorded>>
\* openSheet(): pauseFor("sheet") (an away pause is upgraded to the sheet's), then the sheet shows.
YouOpenTheLevels == /\ Here /\ ~sheet /\ sheet' = TRUE /\ why' = (IF Running \/ why = "away" THEN "sheet" ELSE why)
                    /\ UNCHANGED <<phase, visible, focused, round, slips, done, recorded>>
\* The pause menu's সব লেভেল: the menu closes and play resumes (a call starts over), then the sheet opens and pauses again.
YouOpenTheLevelsFromTheMenu == /\ Here /\ ~sheet /\ why = "away" /\ sheet' = TRUE /\ why' = "sheet" /\ Restart
                               /\ UNCHANGED <<visible, focused, round, slips, done, recorded>>
\* closeSheet(): resumeFrom("sheet") ends only the sheet's own pause.
YouCloseTheLevels == /\ Here /\ sheet /\ sheet' = FALSE
                     /\ IF why = "sheet" THEN why' = "none" /\ Restart ELSE why' = why /\ phase' = phase
                     /\ UNCHANGED <<visible, focused, round, slips, done, recorded>>
\* pickLevel(): load() drops everything about the last level and shows the start screen.
YouPickALevel == /\ Here /\ sheet /\ Fresh /\ UNCHANGED <<visible, focused>>
\* The end screen's আবার খেলো (a fresh tune, or the friend's tune again), and the player's নতুন করে শুরু.
YouPlayAgain == /\ Here /\ ~sheet /\ phase = "over" /\ Fresh /\ UNCHANGED <<visible, focused>>
YouRestart == /\ Here /\ Fresh /\ UNCHANGED <<visible, focused>>
\* fromHash(): the link names the level; load(makeDeal(level, seed)) opens that level on the title.
AFriendsLinkOpens == /\ Here /\ Fresh /\ UNCHANGED <<visible, focused>>

Next == YouStart \/ TheLeadEnds \/ TheCallEnds \/ YouFinishARound \/ YouFinishTheLevel \/ YouSlip \/ YouSlipTheThirdTime
        \/ TheCheerEnds \/ TheMissEnds \/ TheEncoreEnds \/ YouSkipTheEncore \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ YouOpenTheLevels \/ YouOpenTheLevelsFromTheMenu \/ YouCloseTheLevels \/ YouPickALevel \/ YouPlayAgain
        \/ YouRestart \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "lead", "call", "answer", "miss", "cheer", "encore", "over"} /\ why \in {"none", "away", "sheet"}
          /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ round \in 1..2 /\ slips \in 0..3
          /\ done \in {"none", "won", "lost"} /\ recorded \in BOOLEAN

\* The reader's rules.
\* A run in progress is paused while its tab is hidden ...
PausedWhenHidden == (~visible /\ phase \in Active) => why # "none"
\* ... and while you're in another window: no bell rings to an empty room.
PausedWhenBlurred == (~focused /\ phase \in Active) => why # "none"
\* The clock (and so the call, the cheer, the next round) only moves while you're on the page.
NoProgressWhileAway == Running => Here
\* While সব লেভেল is open, nothing in the level advances.
ChoiceFreezesPlay == sheet => ~Running
\* Every level you clear or fail is recorded the moment it is decided, once, and never before.
EveryClearIsRecorded == (done # "none") = recorded
\* Every level you clear gets its cheer, and the end screen after it: hiding the tab right after the last bell skips neither.
EveryClearIsShown == done = "won" => phase \in {"cheer", "encore", "over"}
\* The end screen has nothing left to play, and is only reached once the level is decided.
NothingAfterTheCard == phase = "over" => (~Running /\ done # "none")
\* The third slip, and only the third, loses.
ThirdSlipLoses == (slips = 3) = (done = "lost")
\* The title is always a fresh level: round one, no slips, nothing decided.
ReadyIsFresh == phase = "ready" => (round = 1 /\ slips = 0 /\ done = "none" /\ ~recorded)
====
