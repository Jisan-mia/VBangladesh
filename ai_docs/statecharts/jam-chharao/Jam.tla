---- MODULE Jam ----
\* জ্যাম ছাড়াও after the rewrite: the title and story, the jam, pause and focus, the finger on a vehicle, the hint (what it
\* costs and when it ends), the level sheet, the celebration timers, your own unlock and a friend's link, and a key held through
\* the win. Mirrored from tools/jam-chharao/components/jam-game.tsx (handlers and effects), street.tsx (the finger, drop() on
\* blur), lib/session.ts (phase and clock), lib/progress.ts (unlock, playable) and lib/motion.hot.ts (releaseDrag).
\* N levels stand in for thirty-two. "visit" is the jam a friend's link opened (0 = none). The clock is only a stat: it runs
\* exactly while phase = "playing", so ClockStillWhileAway is a rule about the phase. "jam" holds what is on the street:
\* moves made (none, or some), a hint on show, and hints taken (none, or some).
\* Full = FALSE (the chart run) leaves out the hidden tab (it takes the blur's path), the story (seen at the start) and
\* Enter held through the win; it opens friends' links only on the title and the sheet only mid-jam. The full run
\* (N = 3, Full = TRUE) checks all of them.
EXTENDS Naturals, FiniteSets
CONSTANT N, Full
VARIABLES phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam
vars == <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>

Levels == 1..N
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Here == visible /\ focused
\* progress.ts playable(): open, or already has stars, or this link's jam.
Playable(l) == l <= unlock \/ l \in cleared \/ l = visit
\* progress.ts afterClear(): the next jam opens only when the cleared one was already open.
AfterClear(u, l) == IF l <= u THEN Max(u, Min(N, l + 1)) ELSE u
\* session.ts resultKey(): only a fresh press (not a key repeat) goes on from the result.
ResultKey(repeat) == ~repeat
\* The longest unbroken run 1..k of cleared jams.
Run(c) == CHOOSE k \in 0..N : (\A j \in 1..k : j \in c) /\ (k = N \/ (k + 1) \notin c)
\* game.ts startGame(): nothing moved, no hint, no hints taken.
FreshJam == [moves |-> 0, hint |-> FALSE, helped |-> 0]
\* A move on the street clears any hint on show (setHint(null) in commit()).
Moved(j) == [j EXCEPT !.moves = Min(1, @ + 1), !.hint = FALSE]

Init == /\ phase = "title" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE /\ press = FALSE
        /\ chime = FALSE /\ level = 1 /\ unlock = 1 /\ opened = 1 /\ cleared = {} /\ visit = 0 /\ linked = FALSE
        /\ enter = FALSE /\ skipped = FALSE /\ woke = FALSE /\ seen = ~Full /\ jam = FreshJam

\* commit(): a move may clear the street (every hero out). cleared(): records the stars and your unlock at once, starts the timers.
Move == \/ /\ jam' = Moved(jam) /\ UNCHANGED <<phase, chime, unlock, opened, cleared>>
        \/ /\ jam' = Moved(jam) /\ phase' = "over" /\ chime' = TRUE
           /\ cleared' = cleared \cup {level}
           /\ unlock' = AfterClear(unlock, level) /\ opened' = Max(opened, unlock')

\* start(): খেলো on the title. The story plays on the first run only, never on a friend's link.
YouPressPlay == /\ phase = "title" /\ Here /\ ~sheet
                /\ phase' = IF ~seen /\ visit = 0 /\ level = 1 THEN "story" ELSE "playing"
                /\ UNCHANGED <<why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* nextPanel() past the last panel, or holding for 0.6 s: endStory().
TheStoryEnds == /\ phase = "story" /\ Here /\ phase' = "playing" /\ seen' = TRUE
                /\ UNCHANGED <<why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, jam>>
\* Street onPointerDown: wake() first, so the press that brings you back only resumes; otherwise a press while playing.
YouPressAVehicle == /\ Here /\ ~press /\ ~sheet
                    /\ \/ /\ phase = "paused" /\ why = "away"
                          /\ phase' = "playing" /\ why' = "none" /\ woke' = FALSE
                          /\ UNCHANGED press
                       \/ /\ phase = "playing" /\ press' = TRUE
                          /\ UNCHANGED <<phase, why, woke>>
                    /\ UNCHANGED <<sheet, visible, focused, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, seen, jam>>
\* onPointerUp: the car lands (or your CNG drives off); commit() checks live() (playing), so a drop while paused counts for nothing.
YouLiftYourFinger == /\ press /\ press' = FALSE
                     /\ IF phase = "playing" THEN Move ELSE UNCHANGED <<phase, chime, unlock, opened, cleared, jam>>
                     /\ UNCHANGED <<why, sheet, visible, focused, level, visit, linked, enter, skipped, woke, seen>>
\* Arrows, WASD or a tap on the CNG: the window key handler; nothing while the sheet is open or the jam isn't live.
\* A clear lets go of any vehicle still held (street.tsx drops it when game.won).
YouSlideWithKeys == /\ Here /\ ~sheet /\ phase = "playing" /\ Move
                    /\ press' = IF phase' = "over" THEN FALSE ELSE press
                    /\ UNCHANGED <<why, sheet, visible, focused, level, visit, linked, enter, skipped, woke, seen>>
\* takeBack(): ফিরিয়ে নাও, Z or Backspace; refused unless playing.
YouTakeBack == /\ Here /\ ~sheet /\ phase = "playing" /\ jam.moves > 0
               /\ jam' = [jam EXCEPT !.moves = @ - 1, !.hint = FALSE]
               /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* help(): the first press shows the move and why, and costs a hint's star (helped + 1). A second press plays it (Move).
YouAskForAHint == /\ Here /\ ~sheet /\ phase = "playing" /\ ~jam.hint
                  /\ jam' = [jam EXCEPT !.hint = TRUE, !.helped = Min(1, @ + 1)]
                  /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* Enter held down during play only picks the next vehicle, but stays down.
YouHoldEnter == /\ Full /\ Here /\ ~enter /\ phase = "playing" /\ enter' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, skipped, woke, seen, jam>>
YouLetGoOfEnter == /\ enter /\ enter' = FALSE
                   /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, skipped, woke, seen, jam>>

\* playLevel() / toTitle(): পরের জ্যাম, আরেকবার, a pick from the sheet. load() clears the timers, the hint and closes the sheet.
Load(next, to) == /\ level' = next /\ phase' = to /\ why' = "none" /\ sheet' = FALSE /\ chime' = FALSE /\ jam' = FreshJam
GoTo(next, to) == Load(next, to) /\ linked' = FALSE
NextLevelOrAgain == \E next \in Levels : Playable(next) /\ GoTo(next, "playing")
\* A fresh Enter on the result runs the primary choice; a held key's repeat is refused by resultKey().
YouPressEnterOnTheResult == /\ phase = "over" /\ Here /\ ~sheet /\ ~enter /\ ResultKey(FALSE)
                            /\ \E next \in Levels : Playable(next) /\ GoTo(next, "playing")
                            /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>
TheHeldEnterRepeats == /\ phase = "over" /\ Here /\ ~sheet /\ enter
                       /\ IF ResultKey(TRUE)
                          THEN /\ \E next \in Levels : Playable(next) /\ GoTo(next, "playing")
                               /\ skipped' = TRUE
                               /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, woke, seen>>
                          ELSE UNCHANGED vars
YouTapNextOrAgain == /\ phase = "over" /\ Here /\ ~sheet /\ NextLevelOrAgain
                     /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>

\* openSheet(): pauseFor("sheet") (a sheet pause takes over an away pause), then the sheet opens. The street (away = paused) lets go of a vehicle.
YouOpenTheSheet == /\ Here /\ ~sheet /\ phase \in (IF Full THEN {"title", "playing", "paused", "over"} ELSE {"playing", "paused"})
                   /\ sheet' = TRUE
                   /\ IF phase \in {"playing", "paused"} THEN phase' = "paused" /\ why' = "sheet" /\ press' = FALSE ELSE UNCHANGED <<phase, why, press>>
                   /\ UNCHANGED <<visible, focused, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* closeSheet(): resumeFrom("sheet").
YouCloseTheSheet == /\ sheet /\ Here /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
                    /\ UNCHANGED <<visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* pickLevel(): from the title, that jam's title; otherwise straight into play.
YouPickFromTheSheet == /\ sheet /\ Here
                       /\ \E next \in Levels : Playable(next) /\ GoTo(next, IF phase = "title" THEN "title" ELSE "playing")
                       /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>

\* Away: the player's pause, window blur and a hidden tab all run pauseFor("away"); the street drops the finger (drop()), and
\* the vehicle glides back to its cell.
Away == /\ press' = FALSE
        /\ IF phase = "playing" THEN phase' = "paused" /\ why' = "away" ELSE UNCHANGED <<phase, why>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ Away
               /\ UNCHANGED <<sheet, visible, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
TabHides == /\ Full /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Away
            /\ UNCHANGED <<sheet, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* চালিয়ে যাও in the player's menu (onResume), or Enter while paused away: resumeFrom("away").
YouResume == /\ Here /\ phase = "paused" /\ why = "away" /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* নতুন করে শুরু (onRestart): toTitle(level).
\* The menu is open (the street already let go of the vehicle), so no finger is held.
YouRestart == /\ Here /\ ~press /\ phase \in {"playing", "paused", "over"} /\ GoTo(level, "title")
              /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>
\* The win sound, confetti and the end screen's entrance fire from their timers.
TheCelebrationFires == /\ chime /\ chime' = FALSE
                       /\ UNCHANGED <<phase, why, sheet, visible, focused, press, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen, jam>>
\* hashchange → fromHash(): the friend's jam is a visit; your own unlock is untouched. The title is not "playing", so the
\* street lets go of a held vehicle (street.tsx drops it whenever the phase isn't playing).
AFriendsLinkOpens == /\ Here /\ (Full \/ phase = "title")
                     /\ \E f \in Levels : visit' = f /\ Load(f, "title") /\ linked' = TRUE
                     /\ press' = FALSE
                     /\ UNCHANGED <<visible, focused, unlock, opened, cleared, enter, skipped, woke, seen>>

Next == YouPressPlay \/ TheStoryEnds \/ YouPressAVehicle \/ YouLiftYourFinger \/ YouSlideWithKeys \/ YouTakeBack \/ YouAskForAHint
        \/ YouHoldEnter \/ YouLetGoOfEnter
        \/ YouPressEnterOnTheResult \/ TheHeldEnterRepeats \/ YouTapNextOrAgain \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickFromTheSheet
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ YouRestart \/ TheCelebrationFires \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "story", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"}
          /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ press \in BOOLEAN /\ chime \in BOOLEAN
          /\ level \in Levels /\ unlock \in Levels /\ opened \in Levels /\ cleared \subseteq Levels /\ visit \in 0..N
          /\ linked \in BOOLEAN /\ enter \in BOOLEAN /\ skipped \in BOOLEAN /\ woke \in BOOLEAN /\ seen \in BOOLEAN
          /\ jam.moves \in 0..1 /\ jam.hint \in BOOLEAN /\ jam.helped \in 0..1

\* The reader's rules.
\* After blur or hide, no finger counts as held on a vehicle (before: it stayed stuck to the pointer).
InputReleasedWhenAway == press => Here
\* A finger is held only while the jam is live: a pause (menu, blur, sheet) lets go of the vehicle at once.
PressOnlyWhilePlaying == press => phase = "playing"
\* The clock (and every move) runs only while you're on the page: blur and a hidden tab pause the jam.
ClockStillWhileAway == phase = "playing" => Here
PausedWhenHidden == ~visible => phase # "playing"
\* While সব জ্যাম is open, the jam is paused and the clock stopped.
ChoiceFreezesPlay == sheet => phase # "playing"
\* The paused screen always says why, and only a started jam is paused.
PausedMeansStarted == (phase = "paused") <=> (why # "none")
\* The win sound, confetti and the end screen's entrance belong to this win only.
ChimesOnlyForThisWin == chime => phase = "over"
\* A jam you could open stays open.
UnlockNeverShrinks == unlock = opened
\* Only your own unbroken run of cleared jams opens the next one (a friend's far-ahead jam opens nothing between).
OpenLevelsAreEarned == unlock <= Min(N, Run(cleared) + 1)
\* The jam on screen is always one you may play.
LevelIsOpen == Playable(level)
\* A friend's link opens exactly the friend's jam.
ReplayIsExact == linked => level = visit
\* A key held through the win never skips the result.
HeldKeyNeverSkips == ~skipped
\* The press that brings you back only resumes; it never moves a vehicle.
ComingBackIsNotAMove == ~woke
\* The story plays only before it was ever seen.
StoryOnce == phase = "story" => ~seen
\* A hint on show belongs to a jam in play.
HintNeverOutlivesPlay == jam.hint => phase \in {"playing", "paused"}
\* Nothing moves, and nothing is taken back, while the pause screen shows (before: ফিরিয়ে আনো worked behind it).
NothingMovesWhilePaused == [][(phase = "paused" /\ phase' = "paused") => jam' = jam]_vars
\* A move counts only while playing: a drop that began before the pause never lands behind it (before: it did).
NoDropCountsWhilePaused == [][(jam'.moves > jam.moves) => phase = "playing"]_vars
\* A hint costs once, when it is shown. Playing the shown hint costs nothing more.
HintCostsOnce == [][(jam'.helped > jam.helped) => (~jam.hint /\ jam'.hint)]_vars
\* Hints taken never go down within a jam.
HelpNeverShrinks == [][(jam'.helped < jam.helped) => jam'.helped = 0]_vars
====
