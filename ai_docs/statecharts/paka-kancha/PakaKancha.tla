---- MODULE PakaKancha ----
\* পাকা-কাঁচা after the rewrite: the play phase, where keyboard focus sits, what holds play (the player's menu, being away, the
\* level sheet), the come-back and result guards, the delayed cheer, saved levels and friend links. Mirrored from:
\*   tools/paka-kancha/lib/flow.ts   running, held, start, toTitle, finish, menu, away, sheet, awake, takesPress, takesResultKey
\*   tools/paka-kancha/lib/keys.ts   decideKey / landedOn (Enter on the pad with four digits typed is দেখো)
\*   tools/paka-kancha/lib/save.ts   openAfter (your own open level; unlockedLevel is never used for it)
\*   tools/paka-kancha/components/paka-game.tsx
\*     pressKey / pressErase / pressCheck (each gated by takesPress), finishGame (stars and the open level recorded in the same
\*     step as the last try), load (start card), the blur/focus/visibility effect (clears the cheer timers), useGamePlayer
\*     onPause / onResume / onRestart / onLevels, the window key handler, dropFocus (a click leaves no button focused), openFriend
\*     and the hashchange guard.
\*   shared/game-player-client.tsx   the menu opens on blur and hide once the game is touched; ⏸, P and Escape open it any time.
\* Abstractions: 2 levels (a friend link points at level 2 while it is still locked), 2 tries a game, a typed row is empty /
\* part / full, a clear earns 1 or 2 stars. There are no sound loops: only one-shot sounds and the delayed cheer.
EXTENDS Naturals
CONSTANTS LevelCount, FriendLevel
VARIABLES screen, menu, away, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit
vars == <<screen, menu, away, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>

Levels == 1..LevelCount
Tries == 2
Max(a, b) == IF a > b THEN a ELSE b
Held(m, a, s) == m \/ a \/ s
Running(sc, m, a, s) == sc = "play" /\ ~Held(m, a, s)
\* save.openAfter: clearing your open level or one below it opens the next; a far-ahead friend's level opens nothing.
OpenAfter(o, l) == IF l <= o THEN (IF l + 1 > LevelCount THEN LevelCount ELSE (IF l + 1 > o THEN l + 1 ELSE o)) ELSE o
Grow == IF input = "none" THEN "part" ELSE "full"
Shrink == IF input = "full" THEN "part" ELSE "none"

Init == /\ screen = "title" /\ menu = FALSE /\ away = FALSE /\ sheet = FALSE /\ guard = FALSE /\ overGuard = FALSE
        /\ level = 1 /\ guesses = 0 /\ input = "none" /\ won = FALSE /\ focus = "page" /\ enter = "fine"
        /\ stars = [l \in Levels |-> 0] /\ open = 1 /\ results = 0 /\ cheer = FALSE /\ linked = FALSE /\ woke = FALSE /\ visit = FALSE

\* load(puzzle): a fresh game on the start card; the cheer timers are cleared; the sheet closes; no button keeps focus.
Load(l) == /\ screen' = "title" /\ level' = l /\ guesses' = 0 /\ input' = "none" /\ won' = FALSE /\ results' = 0 /\ cheer' = FALSE
           /\ sheet' = FALSE /\ overGuard' = FALSE /\ focus' = "page"

\* শুরু করো (or Enter) on the start card: not while held, not in the come-back guard.
YouStart == /\ screen = "title" /\ ~Held(menu, away, sheet) /\ ~guard
            /\ screen' = "play" /\ linked' = FALSE
            /\ UNCHANGED <<menu, away, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, woke, visit>>
\* A digit typed on the keyboard: onKey acts only when takesPress. Focus does not move. woke records a digit that acted inside the
\* come-back guard; it must never happen.
YouTypeADigit == /\ Running(screen, menu, away, sheet) /\ ~guard /\ input # "full"
                 /\ input' = Grow /\ woke' = (woke \/ guard)
                 /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, won, focus, enter, stars, open, results, cheer, linked, visit>>
\* A tap on a pad key: the same, and dropFocus leaves nothing focused.
YouTapADigit == /\ Running(screen, menu, away, sheet) /\ ~guard /\ input # "full"
                /\ input' = Grow /\ focus' = "page" /\ woke' = (woke \/ guard)
                /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, won, enter, stars, open, results, cheer, linked, visit>>
\* A tap on মুছো: it acts, and dropFocus leaves nothing focused (bug 1 was this button keeping focus).
YouTapErase == /\ Running(screen, menu, away, sheet) /\ ~guard /\ input # "none"
               /\ input' = Shrink /\ focus' = "page"
               /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, won, enter, stars, open, results, cheer, linked, woke, visit>>
\* Tab moves focus to a pad key, or to another button (the level badge): the only way a button holds focus now.
YouTabToAKey == /\ Running(screen, menu, away, sheet) /\ focus' \in {"pad", "other"}
                /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, input, won, enter, stars, open, results, cheer, linked, woke, visit>>
\* The end of a game: finishGame records stars and your open level now, the cheer is queued, the result guard starts.
Check == /\ guesses' = guesses + 1 /\ input' = "none" /\ won' \in BOOLEAN
         /\ IF won' \/ guesses + 1 = Tries
              THEN /\ screen' = "over" /\ results' = results + 1 /\ cheer' = TRUE /\ overGuard' = TRUE
                   /\ \E s \in {1, 2} : stars' = IF won' THEN [stars EXCEPT ![level] = Max(@, s)] ELSE stars
                   /\ open' = IF won' THEN OpenAfter(open, level) ELSE open
              ELSE UNCHANGED <<screen, results, cheer, overGuard, stars, open>>
\* A tap on দেখো with a full row.
YouTapCheck == /\ Running(screen, menu, away, sheet) /\ ~guard /\ input = "full" /\ Check /\ focus' = "page"
               /\ woke' = (woke \/ guard)
               /\ UNCHANGED <<menu, away, sheet, guard, level, enter, linked, visit>>
\* Enter: keys.ts decideKey. With four digits typed and focus on the page or a pad key it is দেখো. With focus on another button
\* (the level badge) that button does its own job: the sheet opens and the row stays. On a pad key with room left it types that key.
YouPressEnter ==
  /\ Running(screen, menu, away, sheet) /\ ~guard
  /\ \/ /\ input = "full" /\ focus \in {"page", "pad"} /\ Check /\ UNCHANGED <<menu, away, sheet, guard, level, focus, enter, linked, woke, visit>>
     \/ /\ input = "full" /\ focus = "other" /\ sheet' = TRUE
        /\ UNCHANGED <<screen, menu, away, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
     \/ /\ input # "full" /\ focus = "pad" /\ input' = Grow
        /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
\* Blur or a hidden tab: away holds play and the cheer timers are cleared; the player's menu opens too.
YouLeave == /\ ~away
            /\ away' = TRUE /\ menu' = TRUE /\ cheer' = FALSE
            /\ UNCHANGED <<screen, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, linked, woke, visit>>
\* Focus or the tab shows again: away ends and the come-back guard starts. The menu is still up.
YouComeBack == /\ away /\ away' = FALSE /\ guard' = TRUE
               /\ UNCHANGED <<screen, menu, sheet, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
\* ⏸, P or Escape: the player's menu; onPause clears the cheer timers.
YouOpenTheMenu == /\ ~menu /\ menu' = TRUE /\ cheer' = FALSE
                  /\ UNCHANGED <<screen, away, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, linked, woke, visit>>
\* চালিয়ে যাও: the menu closes and the guard starts.
YouResume == /\ menu /\ ~away /\ menu' = FALSE /\ guard' = TRUE
             /\ UNCHANGED <<screen, away, sheet, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
\* নতুন করে শুরু: the menu closes and the same level goes back to its start card.
YouRestart == /\ menu /\ ~away /\ menu' = FALSE /\ guard' = TRUE /\ Load(level)
              /\ UNCHANGED <<away, enter, stars, open, linked, woke, visit>>
\* The 350 ms come-back guard and the 400 ms result guard run out.
GuardPasses == /\ guard /\ guard' = FALSE
               /\ UNCHANGED <<screen, menu, away, sheet, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
ResultGuardPasses == /\ overGuard /\ overGuard' = FALSE
                     /\ UNCHANGED <<screen, menu, away, sheet, guard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
\* সব লেভেল from the HUD badge, the start card or the player's menu: it holds play. Closing it lets play go on.
YouOpenTheSheet == /\ ~sheet /\ ~menu /\ ~away /\ ~guard /\ screen # "over"
                   /\ sheet' = TRUE
                   /\ UNCHANGED <<screen, menu, away, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
YouCloseTheSheet == /\ sheet /\ ~menu /\ ~away /\ sheet' = FALSE
                    /\ UNCHANGED <<screen, menu, away, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, cheer, linked, woke, visit>>
\* Picking a level in the sheet: only your own open levels (or the friend's level you were sent).
YouPickALevel == /\ sheet /\ ~menu /\ ~away
                 /\ \E l \in Levels : (l <= open \/ (visit /\ l = FriendLevel)) /\ Load(l)
                 /\ linked' = FALSE
                 /\ UNCHANGED <<menu, away, guard, enter, stars, open, woke, visit>>
\* পরের লেভেল / আবার খেলো (Enter or a click) on the result: Enter only after the result guard, never while held or in the guard.
YouGoOn == /\ screen = "over" /\ ~overGuard /\ ~Held(menu, away, sheet) /\ ~guard
           /\ Load(IF won /\ level < LevelCount /\ level + 1 <= open THEN level + 1 ELSE level)
           /\ linked' = FALSE
           /\ UNCHANGED <<menu, away, guard, enter, stars, open, woke, visit>>
\* openFriend on load or hashchange: not over a game you're in the middle of.
FriendLinkOpens == /\ ~(screen = "play" /\ guesses > 0)
                   /\ Load(FriendLevel) /\ linked' = TRUE /\ visit' = TRUE
                   /\ UNCHANGED <<menu, away, guard, enter, stars, open, woke>>
\* The setTimeout that plays the cheer or the lose sound: it fires only on a result nobody is holding.
TheCheerPlays == /\ cheer /\ screen = "over" /\ ~Held(menu, away, sheet) /\ cheer' = FALSE
                 /\ UNCHANGED <<screen, menu, away, sheet, guard, overGuard, level, guesses, input, won, focus, enter, stars, open, results, linked, woke, visit>>

Next == YouStart \/ YouTypeADigit \/ YouTapADigit \/ YouTapErase \/ YouTabToAKey \/ YouTapCheck \/ YouPressEnter \/ YouLeave
        \/ YouComeBack \/ YouOpenTheMenu \/ YouResume \/ YouRestart \/ GuardPasses \/ ResultGuardPasses \/ YouOpenTheSheet
        \/ YouCloseTheSheet \/ YouPickALevel \/ YouGoOn \/ FriendLinkOpens \/ TheCheerPlays

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ menu \in BOOLEAN /\ away \in BOOLEAN /\ sheet \in BOOLEAN
          /\ guard \in BOOLEAN /\ overGuard \in BOOLEAN /\ level \in Levels /\ guesses \in 0..Tries /\ input \in {"none", "part", "full"}
          /\ won \in BOOLEAN /\ focus \in {"page", "pad", "other"} /\ enter \in {"fine", "lost"}
          /\ stars \in [Levels -> 0..2] /\ open \in Levels /\ results \in 0..2 /\ cheer \in BOOLEAN
          /\ linked \in BOOLEAN /\ woke \in BOOLEAN /\ visit \in BOOLEAN

\* The reader's rules.
\* With four digits typed, Enter checks the row (from the page or a pad key); it never erases a digit or restarts the level instead.
EnterChecksTheRow == enter = "fine"
\* Away mid-game means the pause menu is up.
PausedWhenAway == (away /\ screen = "play") => menu
\* Nothing on the board changes while play is held (menu, away or the sheet) or in the come-back guard.
BoardFrozenWhileHeld == [][(screen = "play" /\ screen' = "play" /\ (Held(menu, away, sheet) \/ guard)) => (guesses' = guesses /\ input' = input)]_vars
\* While সব লেভেল is open, play is held.
ChoiceFreezesPlay == sheet => ~Running(screen, menu, away, sheet)
\* The click that brings you back never types a digit or checks a row.
ComeBackIsNotAMove == ~woke
\* A game is recorded and celebrated once.
NoDoubleResult == results <= 1
\* The cleared screen's level is saved.
ResultMatchesPlay == (screen = "over" /\ won) => stars[level] > 0
\* The cheer or the lose sound never plays on a game you have left, or under the menu, or while you are away.
NoCheerAfterMovingOn == cheer => (screen = "over" /\ ~Held(menu, away, sheet))
\* Every open level above 1 was opened by clearing the one before it. (Stars alone are not enough: a friend's level 2 has them.)
OpenLevelsAreEarned == \A l \in 2..open : stars[l - 1] > 0
\* Stars never go down, and an open level never closes.
StarsNeverDrop == [][\A l \in Levels : stars'[l] >= stars[l]]_vars
OpenNeverShrinks == [][open' >= open]_vars
\* A friend link opens that friend's level on a fresh start card.
ReplayIsExact == linked => (level = FriendLevel /\ guesses = 0 /\ screen = "title")

\* The drawn chart only (Chart.cfg): one level, no sheet or friend link, and the guards folded away.
ChartScope == ~sheet /\ ~linked /\ ~visit /\ focus = "page" /\ ~(screen = "over" /\ (menu \/ away))
====
