---- MODULE Switchboard ----
\* সুইচবোর্ড after the rewrite: the screen, what holds play, the come-back and result guards, the hum loop, the site sound
\* switch, the end screen's chimes, saved levels and friend links. Mirrored from:
\*   tools/switchboard/lib/flow.ts   running, held, start, toTitle, finish, menu, away, sheet, awake, takesPress, takesResultKey, wantsHum
\*   tools/switchboard/lib/save.ts   openAfter (your own open level; unlockedLevel is never used for it)
\*   tools/switchboard/components/switchboard-game.tsx
\*     pressSwitch / takeBack / askHint (each gated by takesPress), finishBoard (stars and open level recorded in the same step),
\*     load (start card), the blur/focus/visibility effect, useGamePlayer onPause / onResume / onRestart, the window key handler
\*     (P = requestPause, Enter on the result only through takesResultKey), the hum effect (a fresh loop whenever wantsHum turns
\*     true, stopped and dropped whenever it turns false), openFriend and the hashchange guard.
\*   shared/game-player-client.tsx   the menu opens on blur and hide once the game is touched; ⏸, P and Escape open it any time.
\* 30 levels are abstracted to 2; a friend link points at level 2 while it is still locked; presses are 0, 1 or "2 or more".
EXTENDS Naturals
CONSTANTS LevelCount, FriendLevel
VARIABLES screen, menu, away, sheet, guard, overGuard, level, moves, frozenAt, sound, hum, cleared, open, results, chime, linked, woke, visit
vars == <<screen, menu, away, sheet, guard, overGuard, level, moves, frozenAt, sound, hum, cleared, open, results, chime, linked, woke, visit>>

Levels == 1..LevelCount
Held(m, a, s) == m \/ a \/ s
Running(sc, m, a, s) == sc = "play" /\ ~Held(m, a, s)
\* flow.wantsHum: sound on, a live board you can see, at least one press, not yet lit.
WantsHum(so, sc, m, a, s, mv) == so /\ Running(sc, m, a, s) /\ mv > 0
\* The hum effect after every render: a fresh loop when wanted (never a kept stub), none otherwise.
HumAfter(so, sc, m, a, s, mv) == IF WantsHum(so, sc, m, a, s, mv) THEN "real" ELSE "none"
\* save.openAfter: clearing your open level or one below it opens the next; a far-ahead friend's level opens nothing.
OpenAfter(o, l) == IF l <= o THEN (IF l + 1 > LevelCount THEN LevelCount ELSE (IF l + 1 > o THEN l + 1 ELSE o)) ELSE o
\* The moves when play last stopped (for BoardFrozenWhilePaused).
Freeze(wasHeld, nowHeld, mv) == IF ~wasHeld /\ nowHeld THEN mv ELSE frozenAt

Init == /\ screen = "title" /\ menu = FALSE /\ away = FALSE /\ sheet = FALSE /\ guard = FALSE /\ overGuard = FALSE
        /\ level = 1 /\ moves = 0 /\ frozenAt = 0 /\ sound = TRUE /\ hum = "none"
        /\ cleared = {} /\ open = 1 /\ results = 0 /\ chime = FALSE /\ linked = FALSE /\ woke = FALSE /\ visit = FALSE

\* load(puzzle): a fresh board on the start card; StarReveal unmounts, so its chimes are cleared. Holds stay; the sheet closes.
Load(l) == /\ screen' = "title" /\ level' = l /\ moves' = 0 /\ results' = 0 /\ chime' = FALSE /\ sheet' = FALSE /\ overGuard' = FALSE
           /\ hum' = "none" /\ frozenAt' = 0

\* শুরু করো (or Enter) on the start card: not while held, not in the come-back guard.
YouStart == /\ screen = "title" /\ ~Held(menu, away, sheet) /\ ~guard
            /\ screen' = "play" /\ linked' = FALSE
            /\ hum' = HumAfter(sound, "play", menu, away, sheet, moves)
            /\ UNCHANGED <<menu, away, sheet, guard, overGuard, level, moves, frozenAt, sound, cleared, open, results, chime, woke, visit>>
\* A press on a switch (finger, mouse, or Enter on the cursor): pressSwitch acts only when takesPress.
\* woke records a press that acted inside the come-back guard; it must never happen.
YouPressASwitch == /\ Running(screen, menu, away, sheet) /\ ~guard
                   /\ moves' = IF moves < 2 THEN moves + 1 ELSE 2
                   /\ woke' = (woke \/ guard)
                   /\ hum' = HumAfter(sound, screen, menu, away, sheet, moves')
                   /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, frozenAt, sound, cleared, open, results, chime, linked, visit>>
\* The press that lights the last bulb: finishBoard records stars and your open level now, the result guard starts.
YouLightTheLastBulb == /\ Running(screen, menu, away, sheet) /\ ~guard
                       /\ screen' = "over" /\ moves' = IF moves < 2 THEN moves + 1 ELSE 2
                       /\ cleared' = cleared \cup {level} /\ open' = OpenAfter(open, level)
                       /\ results' = results + 1 /\ chime' = TRUE /\ overGuard' = TRUE /\ hum' = "none"
                       /\ UNCHANGED <<menu, away, sheet, guard, level, frozenAt, sound, linked, woke, visit>>
\* Z, Backspace or ফিরিয়ে আনো: takeBack acts only when takesPress (bug 1 was this missing check).
YouTakeBack == /\ Running(screen, menu, away, sheet) /\ ~guard /\ moves > 0
               /\ moves' \in IF moves = 2 THEN {1, 2} ELSE {0}
               /\ hum' = HumAfter(sound, screen, menu, away, sheet, moves')
               /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, frozenAt, sound, cleared, open, results, chime, linked, woke, visit>>
\* Blur or a hidden tab: away holds play; the player's menu opens too. The hum effect stops the loop.
YouLeave == /\ ~away
            /\ away' = TRUE /\ menu' = TRUE
            /\ frozenAt' = Freeze(Held(menu, away, sheet), TRUE, moves)
            /\ hum' = "none"
            /\ UNCHANGED <<screen, sheet, guard, overGuard, level, moves, sound, cleared, open, results, chime, linked, woke, visit>>
\* Focus or the tab shows again: away ends and the come-back guard starts. The menu is still up.
YouComeBack == /\ away
               /\ away' = FALSE /\ guard' = TRUE
               /\ hum' = HumAfter(sound, screen, menu, FALSE, sheet, moves)
               /\ UNCHANGED <<screen, menu, sheet, overGuard, level, moves, frozenAt, sound, cleared, open, results, chime, linked, woke, visit>>
\* ⏸, P or Escape: the player's menu.
YouOpenTheMenu == /\ ~menu
                  /\ menu' = TRUE /\ frozenAt' = Freeze(Held(menu, away, sheet), TRUE, moves) /\ hum' = "none"
                  /\ UNCHANGED <<screen, away, sheet, guard, overGuard, level, moves, sound, cleared, open, results, chime, linked, woke, visit>>
\* চালিয়ে যাও: the menu closes, the guard starts, and the hum effect brings a fresh loop back when it is wanted (bug 2).
YouResume == /\ menu /\ ~away
             /\ menu' = FALSE /\ guard' = TRUE
             /\ hum' = HumAfter(sound, screen, FALSE, away, sheet, moves)
             /\ UNCHANGED <<screen, away, sheet, overGuard, level, moves, frozenAt, sound, cleared, open, results, chime, linked, woke, visit>>
\* নতুন করে শুরু: the menu closes and the same level goes back to its start card.
YouRestart == /\ menu /\ ~away
              /\ menu' = FALSE /\ guard' = TRUE /\ Load(level)
              /\ UNCHANGED <<away, sound, cleared, open, linked, woke, visit>>
\* The 350 ms come-back guard and the 400 ms result guard run out.
GuardPasses == /\ guard /\ guard' = FALSE
               /\ UNCHANGED <<screen, menu, away, sheet, overGuard, level, moves, frozenAt, sound, hum, cleared, open, results, chime, linked, woke, visit>>
ResultGuardPasses == /\ overGuard /\ overGuard' = FALSE
                     /\ UNCHANGED <<screen, menu, away, sheet, guard, level, moves, frozenAt, sound, hum, cleared, open, results, chime, linked, woke, visit>>
\* সব লেভেল from the HUD badge or the start card: it holds play. Closing it lets play go on.
YouOpenTheSheet == /\ ~sheet /\ ~menu /\ ~away /\ ~guard /\ screen # "over"
                   /\ sheet' = TRUE /\ frozenAt' = Freeze(Held(menu, away, sheet), TRUE, moves) /\ hum' = "none"
                   /\ UNCHANGED <<screen, menu, away, guard, overGuard, level, moves, sound, cleared, open, results, chime, linked, woke, visit>>
YouCloseTheSheet == /\ sheet /\ ~menu /\ ~away
                    /\ sheet' = FALSE /\ hum' = HumAfter(sound, screen, menu, away, FALSE, moves)
                    /\ UNCHANGED <<screen, menu, away, guard, overGuard, level, moves, frozenAt, sound, cleared, open, results, chime, linked, woke, visit>>
\* Picking a level in the sheet: only your own open levels (or the friend's level you were sent).
YouPickALevel == /\ sheet /\ ~menu /\ ~away
                 /\ \E l \in Levels : (l <= open \/ (visit /\ l = FriendLevel)) /\ Load(l)
                 /\ linked' = FALSE
                 /\ UNCHANGED <<menu, away, guard, sound, cleared, open, woke, visit>>
\* পরের লেভেল (Enter or a click) on the result: only after the result guard, never while held or in the come-back guard.
YouGoOn == /\ screen = "over" /\ ~overGuard /\ ~Held(menu, away, sheet) /\ ~guard
           /\ Load(IF level < LevelCount /\ level + 1 <= open THEN level + 1 ELSE level)
           /\ linked' = FALSE
           /\ UNCHANGED <<menu, away, guard, sound, cleared, open, woke, visit>>
\* openFriend on load or hashchange: not over a board you're in the middle of.
FriendLinkOpens == /\ ~(screen = "play" /\ moves > 0)
                   /\ Load(FriendLevel) /\ linked' = TRUE /\ visit' = TRUE
                   /\ UNCHANGED <<menu, away, guard, sound, cleared, open, woke>>
\* The site sound switch (in the player's menu, or another game's): the hum follows it.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, moves, frozenAt, cleared, open, results, chime, linked, woke, visit>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = HumAfter(TRUE, screen, menu, away, sheet, moves)
           /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, moves, frozenAt, cleared, open, results, chime, linked, woke, visit>>
\* StarReveal's chimes, while the end screen is mounted.
ChimesPlay == /\ chime /\ screen = "over" /\ chime' = FALSE
              /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, moves, frozenAt, sound, hum, cleared, open, results, linked, woke, visit>>

Next == YouStart \/ YouPressASwitch \/ YouLightTheLastBulb \/ YouTakeBack \/ YouLeave \/ YouComeBack \/ YouOpenTheMenu
        \/ YouResume \/ YouRestart \/ GuardPasses \/ ResultGuardPasses \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickALevel
        \/ YouGoOn \/ FriendLinkOpens \/ SoundOff \/ SoundOn \/ ChimesPlay

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ menu \in BOOLEAN /\ away \in BOOLEAN /\ sheet \in BOOLEAN
          /\ guard \in BOOLEAN /\ overGuard \in BOOLEAN /\ level \in Levels /\ moves \in 0..2 /\ frozenAt \in 0..2
          /\ sound \in BOOLEAN /\ hum \in {"none", "real", "stub"} /\ cleared \subseteq Levels /\ open \in Levels
          /\ results \in 0..2 /\ chime \in BOOLEAN /\ linked \in BOOLEAN /\ woke \in BOOLEAN /\ visit \in BOOLEAN

\* The reader's rules.
\* Away mid-board means the pause menu is up.
PausedWhenAway == (away /\ screen = "play") => menu
\* Nothing on the board changes while play is held (menu, away or the sheet).
BoardFrozenWhilePaused == (Held(menu, away, sheet) /\ screen = "play") => moves = frozenAt
\* While you're away, nothing runs: no press acts and the hum is silent.
NoProgressWhileAway == away => (~Running(screen, menu, away, sheet) /\ hum = "none")
\* While সব লেভেল is open, play is held.
ChoiceFreezesPlay == sheet => ~Running(screen, menu, away, sheet)
\* The hum plays only on a live board you can see, with sound on.
HumOnlyWhilePlaying == hum = "real" => (sound /\ Running(screen, menu, away, sheet) /\ moves > 0)
\* If the board is live with presses on it and sound is on, the hum is playing.
HumComesBack == WantsHum(sound, screen, menu, away, sheet, moves) => hum = "real"
\* The click that brings you back never presses a switch.
ComeBackIsNotAMove == ~woke
\* A board is recorded and celebrated once.
NoDoubleResult == results <= 1
\* The cleared screen's level is saved.
ResultMatchesPlay == screen = "over" => level \in cleared
\* Star chimes never ring on a board you've left.
NoChimeAfterMovingOn == chime => screen = "over"
\* Every open level above 1 was opened by clearing the one before it.
OpenLevelsAreEarned == \A l \in 2..open : (l - 1) \in cleared
\* A friend link opens that friend's level on a fresh start card.
ReplayIsExact == linked => (level = FriendLevel /\ moves = 0 /\ screen = "title")

\* The drawn chart only (Chart.cfg): one level, no sheet or friend link, presses 0 or 1, the result guard and chimes folded away.
ChartScope == ~sheet /\ ~linked /\ ~visit /\ moves <= 1 /\ frozenAt <= 1 /\ ~(screen = "over" /\ (menu \/ away \/ ~sound))
====
