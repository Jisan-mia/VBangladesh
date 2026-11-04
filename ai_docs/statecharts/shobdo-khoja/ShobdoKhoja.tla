---- MODULE ShobdoKhoja ----
\* শব্দ খোঁজা after the rewrite: the page and its clock, the tab and window, the finger on the grid, the sheet and the
\* ask-before-wiping card, the result's fanfare, and your own unlock. Mirrored from
\* tools/shobdo-khoja/components/shobdo-game.tsx (start, pauseFor, resumeFrom, load, leave, pickPage, stay, solved,
\* letGo, onPointerDown/Move/Up, cancelPress, the blur and visibilitychange effect, the player's onPause/onResume, the
\* hashchange fromHash), lib/session.ts (begin, pause, resume, finish, canMove, started) and lib/save.ts (openAfter).
\* The clock runs exactly while phase = "playing". Abstract: W words (the game has 3–8), N levels (the game has 32).
EXTENDS Naturals, FiniteSets

\* Full = FALSE merges a hidden tab into a blur (both run pauseFor("away")), to fit the chart budget.
CONSTANTS W, N, Full
Levels == 1..N

VARIABLES phase, why, visible, focused, press, found, sheet, ask, song, stage, open, cleared, friend, lost
vars == <<phase, why, visible, focused, press, found, sheet, ask, song, stage, open, cleared, friend, lost>>

Here == visible /\ focused
Started == phase \in {"playing", "paused"}
\* The levels cleared one after another from level 1.
Earned == IF \E k \in Levels : k \notin cleared THEN (CHOOSE k \in Levels : k \notin cleared /\ \A j \in 1..(k - 1) : j \in cleared) - 1 ELSE N
\* canPick: your own open levels, plus the friend's own level.
CanPick(s) == s <= open \/ (friend /\ s = N)

Init == /\ phase = "ready" /\ why = "none" /\ visible = TRUE /\ focused = TRUE /\ press = "none"
        /\ found = 0 /\ sheet = FALSE /\ ask = 0 /\ song = FALSE /\ stage = 1 /\ open = 1
        /\ cleared = {} /\ friend = FALSE /\ lost = FALSE

\* load(next): a fresh page on its start card; cancelPress, clearTimers and silenceScheduled; the sheet and ask close.
\* `wiped` is TRUE when a started page is thrown away without the ask card's yes.
Load(s, wiped) == /\ phase' = "ready" /\ why' = "none" /\ press' = "none" /\ found' = 0 /\ sheet' = FALSE /\ ask' = 0
                  /\ song' = FALSE /\ stage' = s /\ lost' = (lost \/ (wiped /\ Started))
\* pauseFor(why): cancelPress always; session.pause only from playing (a sheet pause outranks an away one).
Pause(w) == /\ press' = "none"
            /\ IF phase = "playing" THEN phase' = "paused" /\ why' = w
               ELSE IF phase = "paused" /\ w = "sheet" THEN phase' = phase /\ why' = "sheet"
               ELSE UNCHANGED <<phase, why>>

YouPressStart == /\ Here /\ phase = "ready" /\ ~sheet /\ ask = 0 /\ phase' = "playing" /\ why' = "none"
                 /\ UNCHANGED <<visible, focused, press, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* onPointerDown: only while the clock runs.
YouTouchALetter == /\ Here /\ phase = "playing" /\ press = "none" /\ press' = "down"
                   /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* onPointerMove: a move with the clock stopped ends the stroke instead.
YouDrag == /\ press = "down" /\ IF phase = "playing" THEN press' = "drag" ELSE press' = "none"
           /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* onPointerUp -> letGo -> strike: the last word calls solved(): finish, record stars, openAfter, the fanfare on the audio clock.
YouLetGoOnAWord == /\ press = "drag" /\ phase = "playing" /\ found < W
                   /\ press' = "none" /\ found' = found + 1
                   /\ IF found + 1 = W
                        THEN /\ phase' = "over" /\ song' = TRUE /\ cleared' = cleared \cup {stage}
                             /\ open' = IF stage <= open /\ stage < N THEN stage + 1 ELSE open
                        ELSE UNCHANGED <<phase, song, cleared, open>>
                   /\ UNCHANGED <<why, visible, focused, sheet, ask, stage, friend, lost>>
YouLetGoElsewhere == /\ press # "none" /\ press' = "none"
                     /\ UNCHANGED <<phase, why, visible, focused, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* The window blur listener, and the player's onPause (which also cuts scheduled tones: the fanfare).
WindowBlurs == /\ Here /\ focused' = FALSE /\ Pause("away")
               /\ UNCHANGED <<visible, found, sheet, ask, song, stage, open, cleared, friend, lost>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, visible, press, found, sheet, ask, song, stage, open, cleared, friend, lost>>
TabHides == /\ Full /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Pause("away")
            /\ UNCHANGED <<found, sheet, ask, song, stage, open, cleared, friend, lost>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, press, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* চালিয়ে যাও (the player's menu or the paper cover): resumes only an away pause.
YouResume == /\ Here /\ phase = "paused" /\ why = "away" /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<visible, focused, press, found, sheet, ask, song, stage, open, cleared, friend, lost>>
\* The fanfare's tones end by themselves.
FanfareEnds == /\ song /\ song' = FALSE
               /\ UNCHANGED <<phase, why, visible, focused, press, found, sheet, ask, stage, open, cleared, friend, lost>>
\* openSheet: the badge or সব লেভেল; a running clock stops first.
YouOpenTheSheet == /\ Here /\ ~sheet /\ ask = 0 /\ press = "none" /\ sheet' = TRUE /\ Pause("sheet")
                   /\ UNCHANGED <<visible, focused, found, ask, song, stage, open, cleared, friend, lost>>
YouCloseTheSheet == /\ Here /\ sheet /\ ask = 0 /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
                    /\ UNCHANGED <<visible, focused, press, found, ask, song, stage, open, cleared, friend, lost>>
\* pickPage -> leave(): a started page asks first; otherwise the level loads.
YouPickALevel == /\ Here /\ sheet /\ ask = 0 /\ \E s \in Levels :
                   /\ CanPick(s)
                   /\ IF Started THEN ask' = s /\ UNCHANGED <<phase, why, press, found, sheet, song, stage, lost>> ELSE Load(s, TRUE)
                 /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* The ask card: ১ এখানেই থাকো closes it and the sheet and resumes; ২ ছেড়ে যাও loads the level.
YouStay == /\ Here /\ ask # 0 /\ ask' = 0 /\ sheet' = FALSE
           /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
           /\ UNCHANGED <<visible, focused, press, found, song, stage, open, cleared, friend, lost>>
YouLeave == /\ Here /\ ask # 0 /\ Load(ask, FALSE)
            /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* The result: পরের লেভেল only when it is open by your own play, আবার খেলো always (a click, or a fresh Enter).
YouGoToNextLevel == /\ Here /\ phase = "over" /\ ~sheet /\ stage < N /\ stage + 1 <= open /\ Load(stage + 1, TRUE)
                    /\ UNCHANGED <<visible, focused, open, cleared, friend>>
YouPlayAgain == /\ Here /\ phase = "over" /\ ~sheet /\ Load(stage, TRUE)
                /\ UNCHANGED <<visible, focused, open, cleared, friend>>
\* fromHash: you open a friend's link to the last level, an explicit navigation (it is not a choice inside the game).
FriendLinkOpens == /\ Here /\ ~friend /\ friend' = TRUE /\ Load(N, FALSE)
                   /\ UNCHANGED <<visible, focused, open, cleared>>

Next == YouPressStart \/ YouTouchALetter \/ YouDrag \/ YouLetGoOnAWord \/ YouLetGoElsewhere \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouResume \/ FanfareEnds \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickALevel
        \/ YouStay \/ YouLeave \/ YouGoToNextLevel \/ YouPlayAgain \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"}
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ press \in {"none", "down", "drag"} /\ found \in 0..W
          /\ sheet \in BOOLEAN /\ ask \in 0..N /\ song \in BOOLEAN /\ stage \in Levels /\ open \in Levels
          /\ cleared \subseteq Levels /\ friend \in BOOLEAN /\ lost \in BOOLEAN

\* The reader's rules.
NoProgressWhileAway == phase = "playing" => Here
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == press # "none" => Here
NoStrokeUnderThePauseCard == phase # "playing" => press = "none"
ChoiceFreezesPlay == (sheet \/ ask # 0) => phase # "playing"
NoWipeWithoutAsking == ~lost
ChimesOnlyOnTheResult == song => phase = "over"
ResultMatchesPlay == (phase = "over") <=> (found = W)
UnlockOnlyByClearing == open <= Earned + 1
LevelIsOpen == stage <= open \/ (friend /\ stage = N)
====
