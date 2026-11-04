---- MODULE Switchboard ----
\* সুইচবোর্ড: the board, pause, tab visibility, the keyboard, the hum loop, the site sound switch,
\* the level-clear celebration, saved levels and friend links,
\* mirrored from tools/switchboard/components/switch-game.tsx (handlers press, takeBack, restart, goLevel,
\* celebrate, the visibilitychange `hide` effect, the window keydown `keys` handler, SoundToggle's
\* onClickCapture={stopHum}, the paused overlay) and shared/game-core.ts (recordLevel, unlockedLevel).
\* 30 levels are abstracted to 2; a friend link points at level 2, still locked; moves are 0, 1 or "2 or more".
EXTENDS Naturals
CONSTANTS LevelCount, FriendLevel
VARIABLES level, moves, solved, paused, frozenAt, visible, hum, sound, cleared, results, chime, linked
vars == <<level, moves, solved, paused, frozenAt, visible, hum, sound, cleared, results, chime, linked>>

Levels == 1..LevelCount
Max(S) == IF S = {} THEN 0 ELSE CHOOSE x \in S : \A y \in S : y <= x
\* unlockedLevel(): one past the highest cleared, never above the count.
Unlocked == IF 1 + Max(cleared) > LevelCount THEN LevelCount ELSE 1 + Max(cleared)
Playing == moves > 0 /\ ~solved

Init == /\ level = 1 /\ moves = 0 /\ solved = FALSE /\ paused = FALSE /\ frozenAt = 0
        /\ visible = TRUE /\ hum = "none" /\ sound = TRUE /\ cleared = {}
        /\ results = 0 /\ chime = FALSE /\ linked = FALSE

\* goLevel(next): stopHum, clearTimers, a fresh board, paused cleared.
GoLevel(next) == /\ level' = next /\ moves' = 0 /\ solved' = FALSE /\ paused' = FALSE /\ frozenAt' = 0
                 /\ hum' = "none" /\ results' = 0 /\ chime' = FALSE

\* press(i): ignored while paused or solved; starts the hum (a silent stub when sound is off) and sets its level.
YouPressASwitch == /\ visible /\ ~paused /\ ~solved
                   /\ moves' = IF moves < 2 THEN moves + 1 ELSE 2
                   /\ hum' = IF hum = "none" THEN (IF sound THEN "real" ELSE "stub") ELSE hum
                   /\ linked' = FALSE
                   /\ UNCHANGED <<level, solved, paused, frozenAt, visible, sound, cleared, results, chime>>
\* press(i) that lights the last bulb: celebrate() records stars, stops the hum, queues the star chimes.
YouLightTheLastBulb == /\ visible /\ ~paused /\ ~solved
                       /\ solved' = TRUE /\ moves' = IF moves < 2 THEN moves + 1 ELSE 2
                       /\ cleared' = cleared \cup {level} /\ results' = results + 1
                       /\ hum' = "none" /\ chime' = TRUE /\ linked' = FALSE
                       /\ UNCHANGED <<level, paused, frozenAt, visible, sound>>
\* takeBack() from the Z or Backspace key: the window keydown handler does not check `paused`
\* (only the ফিরিয়ে আনো button is disabled while paused). The hum is left as it was.
YouTakeBack == /\ visible /\ moves > 0 /\ ~solved
               /\ moves' \in IF moves = 2 THEN {1, 2} ELSE {0}
               /\ linked' = FALSE
               /\ UNCHANGED <<level, solved, paused, frozenAt, visible, hum, sound, cleared, results, chime>>
\* restart(): শুরু থেকে (enabled whenever there are moves, even under the pause overlay) or আবার খেলো.
YouStartOver == /\ visible /\ (moves > 0 \/ solved)
                /\ GoLevel(level) /\ linked' = FALSE
                /\ UNCHANGED <<visible, sound, cleared>>
\* পরের লেভেল or Enter on the clear screen: goLevel(min(count, level + 1)).
YouGoToNextLevel == /\ visible /\ solved
                    /\ GoLevel(IF level < LevelCount THEN level + 1 ELSE LevelCount) /\ linked' = FALSE
                    /\ UNCHANGED <<visible, sound, cleared>>
\* সব লেভেল: LevelGrid lets you pick only open levels.
YouPickALevel == /\ visible /\ \E l \in 1..Unlocked : GoLevel(l)
                 /\ linked' = FALSE /\ UNCHANGED <<visible, sound, cleared>>
\* readFriend() on load or hashchange: a valid link jumps to its level, whether or not it is open.
FriendLinkOpens == /\ visible /\ GoLevel(FriendLevel) /\ linked' = TRUE
                   /\ UNCHANGED <<visible, sound, cleared>>
\* The `hide` listener: stopHum(); pause only when there are moves and the board is not solved.
TabHides == /\ visible /\ visible' = FALSE /\ hum' = "none"
            /\ paused' = (paused \/ Playing)
            /\ frozenAt' = IF ~paused /\ Playing THEN moves ELSE frozenAt
            /\ UNCHANGED <<level, moves, solved, sound, cleared, results, chime, linked>>
TabShows == /\ ~visible /\ visible' = TRUE
            /\ UNCHANGED <<level, moves, solved, paused, frozenAt, hum, sound, cleared, results, chime, linked>>
\* চালিয়ে যাও or Enter: setPaused(false). Nothing restarts the hum.
YouResume == /\ visible /\ paused /\ paused' = FALSE /\ frozenAt' = 0
             /\ UNCHANGED <<level, moves, solved, visible, hum, sound, cleared, results, chime, linked>>
\* SoundToggle wrapped in onClickCapture={stopHum}: both directions drop the hum; turning on starts nothing.
SoundOff == /\ visible /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<level, moves, solved, paused, frozenAt, visible, cleared, results, chime, linked>>
SoundOn == /\ visible /\ ~sound /\ sound' = TRUE /\ hum' = "none"
           /\ UNCHANGED <<level, moves, solved, paused, frozenAt, visible, cleared, results, chime, linked>>
\* The star chimes and the levelUp/good sound queued by celebrate() fire 0.5–1.25 s later.
ChimesPlay == /\ chime /\ chime' = FALSE
              /\ UNCHANGED <<level, moves, solved, paused, frozenAt, visible, hum, sound, cleared, results, linked>>

Next == YouPressASwitch \/ YouLightTheLastBulb \/ YouTakeBack \/ YouStartOver \/ YouGoToNextLevel
        \/ YouPickALevel \/ FriendLinkOpens \/ TabHides \/ TabShows \/ YouResume \/ SoundOff \/ SoundOn \/ ChimesPlay

Spec == Init /\ [][Next]_vars

TypeOK == /\ level \in Levels /\ moves \in 0..2 /\ solved \in BOOLEAN /\ paused \in BOOLEAN /\ frozenAt \in 0..2
          /\ visible \in BOOLEAN /\ hum \in {"none", "real", "stub"} /\ sound \in BOOLEAN
          /\ cleared \subseteq Levels /\ results \in 0..2 /\ chime \in BOOLEAN /\ linked \in BOOLEAN

\* The reader's rules.
\* Hidden mid-board means paused (the board has no clock, but the overlay promises "যেমন ছিল তেমনই আছে").
HiddenMeansPaused == (~visible /\ Playing) => paused
\* Nothing on the board changes while the pause overlay is up.
BoardFrozenWhilePaused == paused => moves = frozenAt
\* The hum plays only on a live board you can see, with sound on.
HumOnlyWhilePlaying == hum = "real" => (visible /\ ~paused /\ sound /\ ~solved)
\* If you are mid-board, on the page, unpaused, with sound on, the hum is playing.
HumComesBack == (Playing /\ visible /\ ~paused /\ sound) => hum = "real"
\* A board is recorded once.
NoDoubleResult == results <= 1
\* The cleared screen's level is saved.
ResultMatchesPlay == solved => level \in cleared
\* Celebration sounds never fire on a board you've left.
NoChimeAfterMovingOn == chime => solved
\* Every open level was reached by clearing the one before it.
OpenLevelsAreEarned == \A l \in 2..Unlocked : (l - 1) \in cleared
\* A friend link opens that friend's level on a fresh board.
ReplayIsExact == linked => (level = FriendLevel /\ moves = 0 /\ ~solved /\ ~paused)
====
