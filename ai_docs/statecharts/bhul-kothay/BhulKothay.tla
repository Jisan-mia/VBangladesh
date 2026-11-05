---- MODULE BhulKothay ----
\* ভুল কোথায়? after the rewrite: the level and its clock, the tab and window, a finger held on a picture (the হারিকেন drag
\* in the dark), সব লেভেল and the ask-before-wiping card, the confetti timer, what is saved, and your own unlock. Mirrored from
\* tools/bhul-kothay/components/bhul-game.tsx (start, pauseFor, resumeFrom, load, replay, leave, pickLevel, stay, solved, tap,
\* onPointerDown/Move/letGo, the blur and visibilitychange effect, the player's onPause/onResume/onRestart, the hashchange
\* fromHash), lib/session.ts (begin, pause, resume, finish, canMove, started) and lib/save.ts (openAfter, playable).
\* The clock runs exactly while phase = "playing". Abstract: W differences (the game has 3–7), N levels (the game has 30).
EXTENDS Naturals

\* Full = FALSE merges a hidden tab into a blur (both run pauseFor("away")), to fit the chart budget.
CONSTANTS W, N, Full
Levels == 1..N

VARIABLES phase, why, visible, focused, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost
vars == <<phase, why, visible, focused, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>

Here == visible /\ focused
Started == phase \in {"playing", "paused"}
\* The levels cleared one after another from level 1.
Earned == IF \E k \in Levels : k \notin cleared THEN (CHOOSE k \in Levels : k \notin cleared /\ \A j \in 1..(k - 1) : j \in cleared) - 1 ELSE N
\* playable: your own open levels, plus the friend's own level on this link.
CanPick(s) == s <= open \/ (friend /\ s = N)

Init == /\ phase = "ready" /\ why = "none" /\ visible = TRUE /\ focused = TRUE /\ press = "none"
        /\ found = 0 /\ sheet = FALSE /\ ask = 0 /\ cheer = FALSE /\ saves = 0 /\ stage = 1 /\ open = 1
        /\ cleared = {} /\ friend = FALSE /\ lost = FALSE

\* load(next): a level on its start card; press released, clearTimers (the confetti), silenceScheduled; sheet and ask close.
\* `wiped` is TRUE when a started level is thrown away by a choice inside the game without the ask card's yes.
Load(s, wiped) == /\ phase' = "ready" /\ why' = "none" /\ press' = "none" /\ found' = 0 /\ sheet' = FALSE /\ ask' = 0
                  /\ cheer' = FALSE /\ saves' = 0 /\ stage' = s /\ lost' = (lost \/ (wiped /\ Started))
\* pauseFor(why): press released always; session.pause only from playing (a sheet pause outranks an away one).
Pause(w) == /\ press' = "none"
            /\ IF phase = "playing" THEN phase' = "paused" /\ why' = w
               ELSE IF phase = "paused" /\ w = "sheet" THEN phase' = phase /\ why' = "sheet"
               ELSE UNCHANGED <<phase, why>>

YouPressStart == /\ Here /\ phase = "ready" /\ ~sheet /\ ask = 0 /\ phase' = "playing" /\ why' = "none"
                 /\ UNCHANGED <<visible, focused, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* onPointerDown → tap(): only while the clock runs and no sheet is up. In the dark the finger is captured (press held) to
\* carry the lamp; in daylight it is not. Nothing differs there, or it moved the lamp: nothing else changes.
YouTapWhereNothingDiffers == /\ Here /\ phase = "playing" /\ ~sheet /\ ask = 0 /\ press = "none" /\ press' \in {"none", "held"}
                             /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
YouFindOne == /\ Here /\ phase = "playing" /\ ~sheet /\ ask = 0 /\ press = "none" /\ found + 1 < W
              /\ found' = found + 1 /\ press' \in {"none", "held"}
              /\ UNCHANGED <<phase, why, visible, focused, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* The last one → solved(): finish, record the stars once, openAfter, the done sound; confetti 450 ms later on a big result.
YouFindTheLast == /\ Here /\ phase = "playing" /\ ~sheet /\ ask = 0 /\ press = "none" /\ found + 1 = W
                  /\ found' = W /\ phase' = "over" /\ press' \in {"none", "held"} /\ saves' = saves + 1 /\ cheer' \in BOOLEAN
                  /\ cleared' = cleared \cup {stage}
                  /\ open' = IF stage <= open /\ stage < N THEN stage + 1 ELSE open
                  /\ UNCHANGED <<why, visible, focused, sheet, ask, stage, friend, lost>>
\* onPointerMove: carries the lamp while the clock runs; with the clock stopped it lets go instead.
YouDragTheLamp == /\ press = "held" /\ IF phase = "playing" THEN UNCHANGED press ELSE press' = "none"
                  /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
YouLiftYourFinger == /\ press = "held" /\ press' = "none"
                     /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* The window blur listener, and the player's onPause (it also sends pointercancel and a synthetic blur).
WindowBlurs == /\ Here /\ focused' = FALSE /\ Pause("away")
               /\ UNCHANGED <<visible, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, visible, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
TabHides == /\ Full /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Pause("away")
            /\ UNCHANGED <<found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* চালিয়ে যাও (the player's menu or the paper cover): resumes only an away pause.
YouResume == /\ Here /\ phase = "paused" /\ why = "away" /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<visible, focused, press, found, sheet, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* The confetti timer: it checks it is still the same result before it bursts.
CheerFires == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, why, visible, focused, press, found, sheet, ask, saves, stage, open, cleared, friend, lost>>
\* openSheet: the badge, সব লেভেল, or পরের লেভেল's place on level 30; a running clock stops first.
YouOpenTheSheet == /\ Here /\ ~sheet /\ ask = 0 /\ sheet' = TRUE /\ Pause("sheet")
                   /\ UNCHANGED <<visible, focused, found, ask, cheer, saves, stage, open, cleared, friend, lost>>
YouCloseTheSheet == /\ Here /\ sheet /\ ask = 0 /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
                    /\ UNCHANGED <<visible, focused, press, found, ask, cheer, saves, stage, open, cleared, friend, lost>>
\* pickLevel → leave(): a started level asks first; otherwise the level loads on its start card.
YouPickALevel == /\ Here /\ sheet /\ ask = 0 /\ \E s \in Levels :
                   /\ CanPick(s)
                   /\ IF Started THEN ask' = s /\ UNCHANGED <<phase, why, press, found, sheet, cheer, saves, stage, lost>> ELSE Load(s, TRUE)
                 /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* The ask card: ১ এখানেই থাকো closes it and the sheet and resumes; ২ ছেড়ে যাও loads the level.
YouStay == /\ Here /\ ask # 0 /\ ask' = 0 /\ sheet' = FALSE
           /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
           /\ UNCHANGED <<visible, focused, press, found, cheer, saves, stage, open, cleared, friend, lost>>
YouLeave == /\ Here /\ ask # 0 /\ Load(ask, FALSE)
            /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* The result: পরের লেভেল only when it is open by your own play, আবার খেলো always (a click, or a fresh Enter).
YouGoToNextLevel == /\ Here /\ phase = "over" /\ ~sheet /\ stage < N /\ stage + 1 <= open /\ Load(stage + 1, TRUE)
                    /\ UNCHANGED <<visible, focused, open, cleared, friend>>
YouPlayAgain == /\ Here /\ phase = "over" /\ ~sheet /\ Load(stage, TRUE)
                /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* নতুন করে শুরু in the player's own menu: an explicit restart of this level (the menu, not a choice inside the game).
YouRestartFromTheMenu == /\ Here /\ phase = "paused" /\ why = "away" /\ Load(stage, FALSE)
                         /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* fromHash: you open a friend's link to the last level, an explicit navigation.
FriendLinkOpens == /\ Here /\ ~friend /\ friend' = TRUE /\ Load(N, FALSE)
                   /\ UNCHANGED <<visible, focused, open, cleared>>

Next == YouPressStart \/ YouTapWhereNothingDiffers \/ YouFindOne \/ YouFindTheLast \/ YouDragTheLamp \/ YouLiftYourFinger
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ CheerFires \/ YouOpenTheSheet \/ YouCloseTheSheet
        \/ YouPickALevel \/ YouStay \/ YouLeave \/ YouGoToNextLevel \/ YouPlayAgain \/ YouRestartFromTheMenu \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"}
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ press \in {"none", "held"} /\ found \in 0..W
          /\ sheet \in BOOLEAN /\ ask \in 0..N /\ cheer \in BOOLEAN /\ saves \in 0..2 /\ stage \in Levels /\ open \in Levels
          /\ cleared \subseteq Levels /\ friend \in BOOLEAN /\ lost \in BOOLEAN

\* The reader's rules.
NoProgressWhileAway == phase = "playing" => Here
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == press # "none" => Here
NoTapUnderTheCover == phase \in {"ready", "paused"} => press = "none"
LevelPickerFreezesPlay == (sheet \/ ask # 0) => phase # "playing"
NoWipeWithoutAsking == ~lost
NoDoubleResult == saves <= 1
NoCheerAfterMovingOn == cheer => phase = "over"
ResultMatchesPlay == (phase = "over") <=> (found = W)
UnlockOnlyByClearing == open <= Earned + 1
LevelIsOpen == stage <= open \/ (friend /\ stage = N)
====
