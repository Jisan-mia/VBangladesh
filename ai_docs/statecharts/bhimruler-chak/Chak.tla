---- MODULE Chak ----
\* ভিমরুলের চাক after the rewrite: the screen, what holds play, the star clock, the finger held on a bush and its long press,
\* the come-back and result guards, stings and the hornets' hum, the site sound switch, the end screen's chimes, your own open
\* level and friend links. Mirrored from:
\*   tools/bhimruler-chak/lib/flow.ts   running, held, retime (the clock, and any hold lets go of the finger), start, toTitle,
\*                                      finish, menu, away, sheet, awake, takesPress, takesResultKey, pressDown, pressUp,
\*                                      holdTies, wantsHum
\*   tools/bhimruler-chak/lib/play.ts   enter, dig (a sting is forgiven up to `forgive`, then the swarm), tie
\*   tools/bhimruler-chak/lib/save.ts   openAfter (your own open level; unlockedLevel is never used for it after the migration)
\*   tools/bhimruler-chak/components/chak-game.tsx
\*     act / askHint (gated by takesPress), the grid handlers (pointerdown → pressDown and a timer; the timer ties only through
\*     holdTies; pointerup → pressUp and a tap), endRound (stars and the open level recorded in the same step as the last bush),
\*     load (start card), the blur / focus / visibility effect and useGamePlayer onPause / onResume / onRestart (both clear the
\*     timer and let go of the finger), the window key handler (P = requestPause, result keys only through takesResultKey),
\*     the hum effect (a fresh loop whenever wantsHum turns true, stopped and dropped whenever it turns false), openFriend and
\*     the hashchange guard (never over an orchard in play).
\*   shared/game-player-client.tsx   the menu opens on blur and hide once the game is touched; ⏸, P and Escape open it any time.
\* 30 levels are abstracted to 2; a friend link points at level 2 while it is still locked. The board is not modelled cell by
\* cell: "you clear a bush" and "you clear the last safe bush" stand for every move, and Forgive stings are forgiven.
EXTENDS Naturals
CONSTANTS LevelCount, FriendLevel, Forgive
VARIABLES screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, sound, hum,
          level, cleared, open, results, chime, linked, visit, woke
vars == <<screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, sound, hum,
          level, cleared, open, results, chime, linked, visit, woke>>

Levels == 1..LevelCount
Held(m, a, s) == m \/ a \/ s
Running(sc, m, a, s) == sc = "play" /\ ~Held(m, a, s)
\* retime: the clock runs exactly while play runs.
ClockOf(sc, m, a, s) == IF Running(sc, m, a, s) THEN "running" ELSE "stopped"
\* flow.wantsHum: sound on, a live orchard, at least one sting.
WantsHum(so, sc, m, a, s, st) == so /\ Running(sc, m, a, s) /\ st > 0
\* The hum effect after every render: a fresh loop when wanted (never a kept stub), none otherwise.
HumOf(so, sc, m, a, s, st) == IF WantsHum(so, sc, m, a, s, st) THEN "real" ELSE "none"
\* save.openAfter: clearing your open level or one below it opens the next; a far-ahead friend's level opens nothing.
OpenAfter(o, l) == IF l <= o THEN (IF l + 1 > LevelCount THEN LevelCount ELSE (IF l + 1 > o THEN l + 1 ELSE o)) ELSE o
\* A press counts only while play runs and not in the come-back guard (flow.takesPress).
Takes == Running(screen, menu, away, sheet) /\ ~guard

Init == /\ screen = "title" /\ won = FALSE /\ menu = FALSE /\ away = FALSE /\ sheet = FALSE /\ guard = FALSE /\ overGuard = FALSE
        /\ clock = "stopped" /\ hold = FALSE /\ timer = FALSE /\ ghost = FALSE /\ stings = 0 /\ sound = TRUE /\ hum = "none"
        /\ level = 1 /\ cleared = {} /\ open = 1 /\ results = 0 /\ chime = FALSE /\ linked = FALSE /\ visit = FALSE /\ woke = FALSE

\* load(puzzle): a fresh orchard on the start card (clearTimers: no timer); StarReveal unmounts, so its chimes stop.
Load(l) == /\ screen' = "title" /\ won' = FALSE /\ level' = l /\ stings' = 0 /\ results' = 0 /\ chime' = FALSE /\ sheet' = FALSE
           /\ overGuard' = FALSE /\ clock' = "stopped" /\ hold' = FALSE /\ timer' = FALSE /\ hum' = "none"

\* বাগানে ঢোকো (or Enter) on the start card: the path opens and the clock starts. Not while held, not in the come-back guard.
YouEnter == /\ screen = "title" /\ ~Held(menu, away, sheet) /\ ~guard
            /\ screen' = "play" /\ clock' = "running" /\ linked' = FALSE
            /\ hum' = HumOf(sound, "play", menu, away, sheet, stings)
            /\ UNCHANGED <<won, menu, away, sheet, guard, overGuard, hold, timer, ghost, stings, sound, level, cleared, open, results, chime, visit, woke>>
\* A tap that clears a bush, ties a গামছা or takes a hint (act / askHint, all gated by takesPress).
YouClearABush == /\ Takes
                 /\ woke' = (woke \/ guard)
                 /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, sound, hum, level, cleared, open, results, chime, linked, visit>>
\* A tap on a nest: a sting the hornets forgive, or (past Forgive) the swarm, which ends the round.
YouStepOnANest == /\ Takes
                  /\ IF stings < Forgive
                     THEN /\ stings' = stings + 1 /\ hum' = HumOf(sound, screen, menu, away, sheet, stings + 1)
                          /\ UNCHANGED <<screen, overGuard, clock, hold, timer, results>>
                     ELSE /\ screen' = "over" /\ overGuard' = TRUE /\ clock' = "stopped" /\ hold' = FALSE /\ hum' = "none"
                          /\ results' = results + 1 /\ UNCHANGED <<stings, timer>>
                  /\ UNCHANGED <<won, menu, away, sheet, guard, ghost, sound, level, cleared, open, chime, linked, visit, woke>>
\* The last safe bush: endRound records the stars and your open level now, the result guard starts, the chimes play.
YouClearTheLastBush == /\ Takes
                       /\ screen' = "over" /\ won' = TRUE /\ clock' = "stopped" /\ hold' = FALSE /\ hum' = "none"
                       /\ cleared' = cleared \cup {level} /\ open' = OpenAfter(open, level)
                       /\ results' = results + 1 /\ chime' = TRUE /\ overGuard' = TRUE
                       /\ UNCHANGED <<menu, away, sheet, guard, timer, ghost, stings, sound, level, linked, visit, woke>>

\* pointerdown with a finger: pressDown holds the bush only if the press counts, and a timer starts.
YouPressAndHold == /\ Takes /\ ~hold
                   /\ hold' = TRUE /\ timer' = TRUE
                   /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, ghost, stings, sound, hum, level, cleared, open, results, chime, linked, visit, woke>>
\* pointerup, a finger that travels, or pointercancel: pressUp, the timer cleared.
YouLiftYourFinger == /\ hold
                     /\ hold' = FALSE /\ timer' = FALSE
                     /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, ghost, stings, sound, hum, level, cleared, open, results, chime, linked, visit, woke>>
\* The 400 ms timer fires. It ties only through holdTies (the bush still held, play running); ghost records a tie made
\* while play was held, which must never happen.
TheLongPressFires == /\ timer
                     /\ timer' = FALSE /\ hold' = FALSE
                     /\ ghost' = (ghost \/ (hold /\ Held(menu, away, sheet)))
                     /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, stings, sound, hum, level, cleared, open, results, chime, linked, visit, woke>>

\* Blur or a hidden tab: away holds play (retime: the clock stops, the finger is let go); the player's menu opens too.
\* The timer is left pending here on purpose (the code clears it, but holdTies alone must be enough).
YouLeave == /\ ~away
            /\ away' = TRUE /\ menu' = TRUE /\ clock' = "stopped" /\ hold' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<screen, won, sheet, guard, overGuard, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
\* Focus or the tab shows again: away ends and the come-back guard starts. The menu is still up, so the clock stays stopped.
YouComeBack == /\ away
               /\ away' = FALSE /\ guard' = TRUE
               /\ clock' = ClockOf(screen, menu, FALSE, sheet) /\ hum' = HumOf(sound, screen, menu, FALSE, sheet, stings)
               /\ UNCHANGED <<screen, won, menu, sheet, overGuard, hold, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
\* ⏸, P or Escape: the player's menu.
YouOpenTheMenu == /\ ~menu
                  /\ menu' = TRUE /\ clock' = "stopped" /\ hold' = FALSE /\ hum' = "none"
                  /\ UNCHANGED <<screen, won, away, sheet, guard, overGuard, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
\* চালিয়ে যাও: the menu closes, the guard starts, the clock runs on, and the hum effect brings a fresh loop back when wanted.
YouResume == /\ menu /\ ~away
             /\ menu' = FALSE /\ guard' = TRUE
             /\ clock' = ClockOf(screen, FALSE, away, sheet) /\ hum' = HumOf(sound, screen, FALSE, away, sheet, stings)
             /\ UNCHANGED <<screen, won, away, sheet, overGuard, hold, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
\* নতুন করে শুরু: the menu closes and the level goes back to its start card.
YouRestart == /\ menu /\ ~away
              /\ menu' = FALSE /\ guard' = TRUE /\ Load(level)
              /\ UNCHANGED <<away, ghost, sound, cleared, open, linked, visit, woke>>
\* The 350 ms come-back guard and the 400 ms result guard run out.
GuardPasses == /\ guard /\ guard' = FALSE
               /\ UNCHANGED <<screen, won, menu, away, sheet, overGuard, clock, hold, timer, ghost, stings, sound, hum, level, cleared, open, results, chime, linked, visit, woke>>
ResultGuardPasses == /\ overGuard /\ overGuard' = FALSE
                     /\ UNCHANGED <<screen, won, menu, away, sheet, guard, clock, hold, timer, ghost, stings, sound, hum, level, cleared, open, results, chime, linked, visit, woke>>
\* সব লেভেল from the HUD badge, the start card or the result: it holds play. Closing it lets play go on.
YouOpenTheSheet == /\ ~sheet /\ ~menu /\ ~away /\ ~guard
                   /\ sheet' = TRUE /\ clock' = "stopped" /\ hold' = FALSE /\ hum' = "none"
                   /\ UNCHANGED <<screen, won, menu, away, guard, overGuard, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
YouCloseTheSheet == /\ sheet /\ ~menu /\ ~away
                    /\ sheet' = FALSE
                    /\ clock' = ClockOf(screen, menu, away, FALSE) /\ hum' = HumOf(sound, screen, menu, away, FALSE, stings)
                    /\ UNCHANGED <<screen, won, menu, away, guard, overGuard, hold, timer, ghost, stings, sound, level, cleared, open, results, chime, linked, visit, woke>>
\* Picking a level in the sheet (or 1–9): only your own open levels, or the friend's level you were sent.
YouPickALevel == /\ sheet /\ ~menu /\ ~away
                 /\ \E l \in Levels : (l <= open \/ (visit /\ l = FriendLevel)) /\ Load(l)
                 /\ linked' = FALSE
                 /\ UNCHANGED <<menu, away, guard, ghost, sound, cleared, open, visit, woke>>
\* Choice ১ on the result (Enter, 1 or a click): পরের লেভেল when it is open, else আবার খেলো / আরেকবার.
\* Only after the result guard, never while held or in the come-back guard.
YouGoOn == /\ screen = "over" /\ ~overGuard /\ ~Held(menu, away, sheet) /\ ~guard
           /\ Load(IF won /\ level < LevelCount /\ level + 1 <= open THEN level + 1 ELSE level)
           /\ linked' = FALSE
           /\ UNCHANGED <<menu, away, guard, ghost, sound, cleared, open, visit, woke>>
\* openFriend on load or hashchange: never over an orchard in play.
FriendLinkOpens == /\ screen # "play"
                   /\ Load(FriendLevel) /\ linked' = TRUE /\ visit' = TRUE
                   /\ UNCHANGED <<menu, away, guard, ghost, sound, cleared, open, woke>>
\* The site sound switch (in the player's menu, or another game's): the hum follows it.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, level, cleared, open, results, chime, linked, visit, woke>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = HumOf(TRUE, screen, menu, away, sheet, stings)
           /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, level, cleared, open, results, chime, linked, visit, woke>>
\* StarReveal's chimes, while the end screen is mounted.
ChimesPlay == /\ chime /\ screen = "over" /\ chime' = FALSE
              /\ UNCHANGED <<screen, won, menu, away, sheet, guard, overGuard, clock, hold, timer, ghost, stings, sound, hum, level, cleared, open, results, linked, visit, woke>>

Next == \/ YouEnter \/ YouClearABush \/ YouStepOnANest \/ YouClearTheLastBush
        \/ YouPressAndHold \/ YouLiftYourFinger \/ TheLongPressFires
        \/ YouLeave \/ YouComeBack \/ YouOpenTheMenu \/ YouResume \/ YouRestart \/ GuardPasses \/ ResultGuardPasses
        \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickALevel \/ YouGoOn \/ FriendLinkOpens \/ SoundOff \/ SoundOn \/ ChimesPlay

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ won \in BOOLEAN /\ menu \in BOOLEAN /\ away \in BOOLEAN /\ sheet \in BOOLEAN
          /\ guard \in BOOLEAN /\ overGuard \in BOOLEAN /\ clock \in {"running", "stopped"} /\ hold \in BOOLEAN /\ timer \in BOOLEAN
          /\ ghost \in BOOLEAN /\ stings \in 0..Forgive /\ sound \in BOOLEAN /\ hum \in {"none", "real"} /\ level \in Levels
          /\ cleared \subseteq Levels /\ open \in Levels /\ results \in 0..2 /\ chime \in BOOLEAN /\ linked \in BOOLEAN
          /\ visit \in BOOLEAN /\ woke \in BOOLEAN

\* ---- the reader's rules ----
\* ClockStillWhileAway (NoProgressWhileAway, PausedWhenBlurred): the star clock never runs while you're in another window or
\* tab, under the menu, or in সব লেভেল.
ClockStillWhileAway == clock = "running" => (screen = "play" /\ ~away /\ ~menu /\ ~sheet)
\* PausedWhenAway: away mid-orchard, the pause menu is up.
PausedWhenAway == (away /\ screen = "play") => menu
\* InputReleasedWhenAway: once you leave (or the menu or the sheet opens), no finger counts as held.
InputReleasedWhenAway == hold => (~away /\ ~menu /\ ~sheet)
\* NoTieBehindYourBack: a long press never ties a গামছা while play is held.
NoTieBehindYourBack == ~ghost
\* ChoiceFreezesPlay: while সব লেভেল is open, the clock is still.
ChoiceFreezesPlay == sheet => clock = "stopped"
\* HumOnlyWhenMeaningful: the hornets' hum plays only after a sting, on a live orchard, with sound on.
HumOnlyWhenMeaningful == hum = "real" => (sound /\ Running(screen, menu, away, sheet) /\ stings > 0)
\* HumComesBack: a live orchard with a sting and sound on is humming (after resume, after sound comes back on).
HumComesBack == WantsHum(sound, screen, menu, away, sheet, stings) => hum = "real"
\* ComeBackIsNotAMove: the click that brings you back never clears a bush.
ComeBackIsNotAMove == ~woke
\* NoDoubleResult: a round ends, is recorded and celebrated once.
NoDoubleResult == results <= 1
\* ResultMatchesPlay: a cleared orchard's level is saved.
ResultMatchesPlay == (screen = "over" /\ won) => level \in cleared
\* NoChimeAfterMovingOn: star chimes never ring on an orchard you've left.
NoChimeAfterMovingOn == chime => screen = "over"
\* OpenLevelsAreEarned (LinkOpensOnlyItsLevel, SavedUnlockIsEarned): every open level above 1 was opened by clearing the one before.
OpenLevelsAreEarned == \A l \in 2..open : (l - 1) \in cleared
\* ReplayIsExact: a friend link opens that friend's level on a fresh start card.
ReplayIsExact == linked => (level = FriendLevel /\ screen = "title" /\ stings = 0)
\* UnlockNeverShrinks.
UnlockNeverShrinks == [][open' >= open /\ cleared \subseteq cleared']_vars

\* The drawn chart only (Chart.cfg): one level, no sheet or friend link, the result guard and chimes merged by the view.
ChartScope == ~sheet /\ ~linked /\ ~visit /\ ~(screen = "over" /\ (menu \/ away \/ ~sound))
====
