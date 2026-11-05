---- MODULE Ponero ----
\* ১৫ ঘরের ধাঁধা after the rewrite: the title and story, the plate, pause and focus, the finger on the plate, the level
\* sheet, the celebration timers, your own unlock and a friend's link, and a key held through the win. Mirrored from
\* tools/ponero-ghor/components/plate-game.tsx and plate.tsx (handlers and effects), lib/session.ts (phase and clock),
\* lib/progress.ts (unlock, playable), lib/drag.hot.ts (release on blur).
\* N levels stand in for thirty. "visit" is the level a friend's link opened (0 = none). The clock is only a stat: it runs
\* exactly while phase = "playing", so ClockStillWhileAway is a rule about the phase.
\* Full = FALSE (the chart run) leaves out the hidden tab (it takes the blur's path), the story (seen at the start) and
\* Enter held through the win; it opens friends' links only on the title and the sheet only mid-plate. The full run
\* (N = 3, Full = TRUE) checks all of them.
EXTENDS Naturals, FiniteSets
CONSTANT N, Full
VARIABLES phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen
vars == <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>

Levels == 1..N
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
Here == visible /\ focused
\* progress.ts playable(): open, or already has stars, or this link's level.
Playable(l) == l <= unlock \/ l \in cleared \/ l = visit
\* progress.ts afterClear(): the next level opens only when the cleared one was already open.
AfterClear(u, l) == IF l <= u THEN Max(u, Min(N, l + 1)) ELSE u
\* session.ts resultKey(): only a fresh press (not a key repeat) goes on from the result.
ResultKey(repeat) == ~repeat
\* The longest unbroken run 1..k of cleared levels.
Run(c) == CHOOSE k \in 0..N : (\A j \in 1..k : j \in c) /\ (k = N \/ (k + 1) \notin c)

Init == /\ phase = "title" /\ why = "none" /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE /\ press = FALSE
        /\ chime = FALSE /\ level = 1 /\ unlock = 1 /\ opened = 1 /\ cleared = {} /\ visit = 0 /\ linked = FALSE
        /\ enter = FALSE /\ skipped = FALSE /\ woke = FALSE /\ seen = ~Full

\* commit(): a move may solve the plate. solved(): records the stars and your unlock at once, starts the celebration timers.
Move == \/ UNCHANGED <<phase, chime, unlock, opened, cleared>>
        \/ /\ phase' = "over" /\ chime' = TRUE
           /\ cleared' = cleared \cup {level}
           /\ unlock' = AfterClear(unlock, level) /\ opened' = Max(opened, unlock')

\* start(): খেলো on the title. The story plays on the first run only, never on a friend's link.
YouPressPlay == /\ phase = "title" /\ Here /\ ~sheet
                /\ phase' = IF ~seen /\ visit = 0 /\ level = 1 THEN "story" ELSE "playing"
                /\ UNCHANGED <<why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* nextPanel() past the last panel, or holding for 0.6 s: endStory().
TheStoryEnds == /\ phase = "story" /\ Here /\ phase' = "playing" /\ seen' = TRUE
                /\ UNCHANGED <<why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke>>
\* Plate onPointerDown: wake() first, so the press that brings you back only resumes; otherwise a press while playing.
YouPressTheplate == /\ Here /\ ~press /\ ~sheet
                    /\ \/ /\ phase = "paused" /\ why = "away"
                          /\ phase' = "playing" /\ why' = "none" /\ woke' = FALSE
                          /\ UNCHANGED press
                       \/ /\ phase = "playing" /\ press' = TRUE
                          /\ UNCHANGED <<phase, why, woke>>
                    /\ UNCHANGED <<sheet, visible, focused, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, seen>>
\* onPointerUp: releaseOf() lands the line, taps it or swipes; commit() checks live() (playing, past the shuffle).
YouLiftYourFinger == /\ press /\ press' = FALSE
                     /\ IF phase = "playing" THEN Move ELSE UNCHANGED <<phase, chime, unlock, opened, cleared>>
                     /\ UNCHANGED <<why, sheet, visible, focused, level, visit, linked, enter, skipped, woke, seen>>
\* Arrows, WASD, Z or H: the window key handler; nothing while the sheet is open or the plate isn't live.
YouSlideWithKeys == /\ Here /\ ~sheet /\ phase = "playing" /\ Move
                    /\ UNCHANGED <<why, sheet, visible, focused, press, level, visit, linked, enter, skipped, woke, seen>>
\* Enter held down during play does nothing there, but stays down.
YouHoldEnter == /\ Full /\ Here /\ ~enter /\ phase = "playing" /\ enter' = TRUE
                /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, skipped, woke, seen>>
YouLetGoOfEnter == /\ enter /\ enter' = FALSE
                   /\ UNCHANGED <<phase, why, sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, skipped, woke, seen>>

\* playLevel() / toTitle(): পরের লেভেল, আবার খেলো, a pick from the sheet. load() clears the timers and closes the sheet.
Load(next, to) == /\ level' = next /\ phase' = to /\ why' = "none" /\ sheet' = FALSE /\ chime' = FALSE
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

\* openSheet(): pauseFor("sheet") (a sheet pause takes over an away pause), then the sheet opens.
YouOpenTheSheet == /\ Here /\ ~sheet /\ phase \in (IF Full THEN {"title", "playing", "paused", "over"} ELSE {"playing", "paused"})
                   /\ sheet' = TRUE
                   /\ IF phase \in {"playing", "paused"} THEN phase' = "paused" /\ why' = "sheet" ELSE UNCHANGED <<phase, why>>
                   /\ UNCHANGED <<visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* closeSheet(): resumeFrom("sheet").
YouCloseTheSheet == /\ sheet /\ Here /\ sheet' = FALSE
                    /\ IF phase = "paused" /\ why = "sheet" THEN phase' = "playing" /\ why' = "none" ELSE UNCHANGED <<phase, why>>
                    /\ UNCHANGED <<visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* pickLevel(): from the title, that level's title; otherwise straight into play.
YouPickFromTheSheet == /\ sheet /\ Here
                       /\ \E next \in Levels : Playable(next) /\ GoTo(next, IF phase = "title" THEN "title" ELSE "playing")
                       /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>

\* Away: the player's pause, window blur and a hidden tab all run pauseFor("away"); the plate drops the finger (drop()).
Away == /\ press' = FALSE
        /\ IF phase = "playing" THEN phase' = "paused" /\ why' = "away" ELSE UNCHANGED <<phase, why>>
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE /\ Away
               /\ UNCHANGED <<sheet, visible, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, sheet, visible, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
TabHides == /\ Full /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ Away
            /\ UNCHANGED <<sheet, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, sheet, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* চালিয়ে যাও in the player's menu (onResume), or Enter while paused away: resumeFrom("away").
YouResume == /\ Here /\ phase = "paused" /\ why = "away" /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<sheet, visible, focused, press, chime, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* নতুন করে শুরু (onRestart): toTitle(level).
YouRestart == /\ Here /\ phase \in {"playing", "paused", "over"} /\ GoTo(level, "title")
              /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, visit, enter, skipped, woke, seen>>
\* The win sound, confetti and the end screen's entrance fire from their timers.
TheCelebrationFires == /\ chime /\ chime' = FALSE
                       /\ UNCHANGED <<phase, why, sheet, visible, focused, press, level, unlock, opened, cleared, visit, linked, enter, skipped, woke, seen>>
\* hashchange → fromHash(): the friend's level is a visit; your own unlock is untouched.
AFriendsLinkOpens == /\ Here /\ (Full \/ phase = "title")
                     /\ \E f \in Levels : visit' = f /\ Load(f, "title") /\ linked' = TRUE
                     /\ UNCHANGED <<visible, focused, press, unlock, opened, cleared, enter, skipped, woke, seen>>

Next == YouPressPlay \/ TheStoryEnds \/ YouPressTheplate \/ YouLiftYourFinger \/ YouSlideWithKeys \/ YouHoldEnter \/ YouLetGoOfEnter
        \/ YouPressEnterOnTheResult \/ TheHeldEnterRepeats \/ YouTapNextOrAgain \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickFromTheSheet
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ YouRestart \/ TheCelebrationFires \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "story", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"}
          /\ sheet \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ press \in BOOLEAN /\ chime \in BOOLEAN
          /\ level \in Levels /\ unlock \in Levels /\ opened \in Levels /\ cleared \subseteq Levels /\ visit \in 0..N
          /\ linked \in BOOLEAN /\ enter \in BOOLEAN /\ skipped \in BOOLEAN /\ woke \in BOOLEAN /\ seen \in BOOLEAN

\* The reader's rules.
\* After blur or hide, no finger counts as on the plate.
InputReleasedWhenAway == press => Here
\* The clock (and every move) runs only while you're on the page: blur and a hidden tab pause the plate.
ClockStillWhileAway == phase = "playing" => Here
PausedWhenHidden == ~visible => phase # "playing"
\* While সব লেভেল is open, the plate is paused and the clock stopped.
ChoiceFreezesPlay == sheet => phase # "playing"
\* The paused screen always says why, and only a started plate is paused.
PausedMeansStarted == (phase = "paused") <=> (why # "none")
\* The win sound, confetti and the end screen's entrance belong to this win only.
ChimesOnlyForThisWin == chime => phase = "over"
\* A level you could open stays open.
UnlockNeverShrinks == unlock = opened
\* Only your own unbroken run of cleared levels opens the next one (a friend's far-ahead level opens nothing between).
OpenLevelsAreEarned == unlock <= Min(N, Run(cleared) + 1)
\* The level on screen is always one you may play.
LevelIsOpen == Playable(level)
\* A friend's link opens exactly the friend's level.
ReplayIsExact == linked => level = visit
\* A key held through the win never skips the result.
HeldKeyNeverSkips == ~skipped
\* The press that brings you back only resumes; it never slides a ঘুঁটি.
ComingBackIsNotAMove == ~woke
\* The story plays only before it was ever seen.
StoryOnce == phase = "story" => ~seen
====
