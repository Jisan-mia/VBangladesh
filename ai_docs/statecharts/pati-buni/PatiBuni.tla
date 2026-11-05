---- MODULE PatiBuni ----
\* পাটি বুনি after the rewrite: the run's screens, সব পাটি, the tab, window and scroll, a held control, the stack and its
\* গোটানো, the delayed celebration, a friend's link, the Enter key at the end, and your own unlock.
\* Mirrored from tools/pati-buni/components/loom-game.tsx (begin, load, pause, resume, openList, closeList, finishRun, again,
\* act/press/release, the key and pointer handlers, the blur/focus/visibilitychange effect, the IntersectionObserver on the
\* play area, the hashchange effect) and the pure rules it calls: lib/session.ts (start, pause, resume, away, back, finish,
\* again, reset, pick, cheerMayPlay), lib/hand.ts (letGo), lib/progress.ts (afterClear, playable) and lib/step.hot.ts
\* (a strip lands: it weaves or the stack grows; a full frame rolls up while গোটানো lasts). There are no sound loops.
\* The player's pause sends a blur and calls onPause; its চালিয়ে যাও sends focus and calls onResume.
\* Abstract: the goal is 2 rows, the frame is full at stack 2, গোটানো is 0 or 1. Full = FALSE (the chart run) leaves out the
\* levels, the held Enter key, a hidden tab (a blur stands in for it), কঠিন (no গোটানো) and the second kind of hold.
EXTENDS Naturals
CONSTANT Full
VARIABLES phase, picking, visible, focused, inView, hand, stack, woven, rolls, mode, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped
vars == <<phase, picking, visible, focused, inView, hand, stack, woven, rolls, mode, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped>>

\* The chart run weaves a one-row goal in a frame full at one; the full check uses two of each.
GOAL == IF Full THEN 2 ELSE 1
FULL == IF Full THEN 2 ELSE 1
Levels == 1..3
Here == visible /\ focused /\ inView
Moving == phase = "playing" /\ ~picking /\ Here

Init == /\ phase = "title" /\ picking = FALSE /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE /\ hand = "none"
        /\ stack = 0 /\ woven = 0 /\ mode \in (IF Full THEN {0, 1} ELSE {1}) /\ rolls = mode /\ cheer = "none" /\ played = FALSE
        /\ link \in {"none", "theirs"} /\ seed = IF link = "theirs" THEN "theirs" ELSE "fresh"
        /\ enter = "up" /\ lvl = 1 /\ unlock = 1 /\ cleared = {} /\ skipped = FALSE

\* load(): a পাটি's title with a fresh frame (the friend's seed when it is their পাটি). Clears timers, lets go, reset() bumps the run.
Load(to, theirs) == /\ phase' = "title" /\ picking' = FALSE /\ hand' = "none" /\ stack' = 0 /\ woven' = 0 /\ rolls' = mode
                    /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                    /\ seed' = IF theirs THEN "theirs" ELSE "fresh"
                    /\ lvl' = to

\* বোনা শুরু, a key or a tap on the title: sessionStart needs the tab, the window and the frame on screen.
YouStart == /\ phase = "title" /\ ~picking /\ Here /\ phase' = "playing"
            /\ UNCHANGED <<picking, visible, focused, inView, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* keydown ← → ↓, a button or a finger held while strips fall (a press reaching the page means the window has focus).
YouHold == /\ Moving /\ hand = "none" /\ \E h \in (IF Full THEN {"side", "down"} ELSE {"side"}) : hand' = h
           /\ UNCHANGED <<phase, picking, visible, focused, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
YouLetGo == /\ hand # "none" /\ hand' = "none"
            /\ UNCHANGED <<phase, picking, visible, focused, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* tick(): a strip lands. It weaves a row (the goal woven ends the run) or the stack grows; a full frame rolls up while
\* গোটানো lasts, else the run ends. finishRun lets go and queues the cheer.
StripLands == /\ Moving
              /\ \/ /\ woven' = woven + 1 /\ stack' = stack /\ rolls' = rolls
                    /\ IF woven + 1 = GOAL THEN phase' = "over" /\ hand' = "none" /\ cheer' = "this" ELSE UNCHANGED <<phase, hand, cheer, mode>>
                 \/ /\ woven' = woven
                    /\ IF stack + 1 < FULL THEN stack' = stack + 1 /\ rolls' = rolls /\ UNCHANGED <<phase, hand, cheer, mode>>
                       ELSE IF rolls > 0 THEN stack' = 0 /\ rolls' = rolls - 1 /\ UNCHANGED <<phase, hand, cheer, mode>>
                       ELSE stack' = FULL /\ rolls' = 0 /\ phase' = "over" /\ hand' = "none" /\ cheer' = "this"
              /\ cleared' = IF Full /\ woven + 1 = GOAL /\ woven' = GOAL THEN cleared \cup {lvl} ELSE cleared
              /\ unlock' = IF Full /\ woven' = GOAL /\ lvl = unlock /\ unlock < 3 THEN unlock + 1 ELSE unlock
              /\ UNCHANGED <<picking, visible, focused, inView, played, link, seed, enter, lvl, skipped, mode>>
\* window blur (real, or the player's synthetic one): letGo(), away() pauses.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ hand' = "none"
               /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
               /\ UNCHANGED <<picking, visible, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, picking, visible, inView, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
TabHides == /\ Full /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ hand' = "none"
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<picking, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
TabShows == /\ Full /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, picking, inView, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* The IntersectionObserver: under half the play area on screen is away("scroll"): letGo and pause.
YouScrollAway == /\ visible /\ focused /\ inView
                 /\ inView' = FALSE /\ hand' = "none"
                 /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                 /\ UNCHANGED <<picking, visible, focused, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
YouScrollBack == /\ visible /\ focused /\ ~inView /\ inView' = TRUE
                 /\ UNCHANGED <<phase, picking, visible, focused, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* P (player.requestPause) or the player's ⏸: onPause → pause().
YouPause == /\ Moving
            /\ phase' = "paused" /\ hand' = "none"
            /\ UNCHANGED <<picking, visible, focused, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* চালিয়ে যাও, a button, or the first tap on our cover (it only resumes): needs the tab, the window and the frame on screen.
YouResume == /\ phase = "paused" /\ ~picking /\ Here /\ phase' = "playing"
             /\ UNCHANGED <<picking, visible, focused, inView, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* The পাটি badge or সব পাটি: openList lets go and pauses a run in progress.
YouOpenTheList == /\ ~picking /\ Here
                  /\ picking' = TRUE /\ hand' = "none"
                  /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                  /\ UNCHANGED <<visible, focused, inView, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* closeList: resumes what the list paused, through resume() (which needs the frame on screen).
YouCloseTheList == /\ picking /\ Here
                   /\ picking' = FALSE
                   /\ phase' = IF phase = "paused" THEN "playing" ELSE phase
                   /\ UNCHANGED <<visible, focused, inView, hand, stack, woven, rolls, cheer, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* A পাটি picked from the list (only open ones, or the friend's, pictured as পাটি 3): its title.
YouPickAPati(to) == /\ picking /\ Here
                    /\ (to <= unlock \/ to \in cleared \/ (link # "none" /\ to = 3))
                    /\ Load(to, link # "none" /\ to = 3)
                    /\ link' = IF link = "none" THEN "none" ELSE IF to = 3 THEN "theirs" ELSE "other"
                    /\ UNCHANGED <<visible, focused, inView, played, enter, unlock, cleared, skipped, mode>>
\* The later() timer fires: it plays only when cheerMayPlay (its own run's end screen, list closed); otherwise it is dropped.
CheerFires == /\ cheer # "none" /\ cheer' = "none"
              /\ UNCHANGED <<phase, picking, visible, focused, inView, hand, stack, woven, rolls, played, link, seed, enter, lvl, unlock, cleared, skipped, mode>>
\* আবার খেলো (or a fresh Enter after the guard): again() needs the frame on screen and bumps the run.
YouPlayAgain == /\ phase = "over" /\ ~picking /\ Here /\ enter = "up"
                /\ phase' = "playing" /\ stack' = 0 /\ woven' = 0 /\ rolls' = mode
                /\ cheer' = IF cheer = "none" THEN "none" ELSE "old"
                /\ seed' = IF link = "theirs" THEN "theirs" ELSE "fresh"
                /\ UNCHANGED <<picking, visible, focused, inView, hand, played, link, enter, lvl, unlock, cleared, skipped, mode>>
\* পরের পাটি (only when the next পাটি is open to you): its title.
YouGoOn == /\ Full /\ phase = "over" /\ woven = GOAL /\ ~picking /\ Here /\ enter = "up" /\ lvl < 3 /\ lvl + 1 <= unlock
           /\ Load(lvl + 1, FALSE)
           /\ link' = IF link = "none" THEN "none" ELSE "other"
           /\ UNCHANGED <<visible, focused, inView, played, enter, unlock, cleared, skipped, mode>>
\* নতুন করে শুরু in the player's menu: onRestart → load(the same পাটি).
YouRestart == /\ Here /\ phase # "title"
              /\ Load(lvl, link = "theirs")
              /\ UNCHANGED <<visible, focused, inView, played, link, enter, unlock, cleared, skipped, mode>>
\* hashchange with a valid challenge: load(their পাটি, their seed), even mid-run.
FriendLinkOpens == /\ link = "none" /\ visible
                   /\ Load(IF Full THEN 3 ELSE lvl, TRUE)
                   /\ link' = "theirs"
                   /\ UNCHANGED <<visible, focused, inView, played, enter, unlock, cleared, skipped, mode>>
\* Enter or Space pressed during play and held through the end; its repeats reach the end screen.
YouHoldEnter == /\ Full /\ phase = "playing" /\ enter = "up" /\ enter' = "held"
                /\ UNCHANGED <<phase, picking, visible, focused, inView, hand, stack, woven, rolls, cheer, played, link, seed, lvl, unlock, cleared, skipped, mode>>
\* A repeat: again() refuses a repeated key or one pressed before the end screen appeared. Nothing changes.
EnterRepeats == /\ Full /\ enter = "held" /\ phase = "over" /\ UNCHANGED vars
YouLetGoOfEnter == /\ Full /\ enter = "held" /\ enter' = "up"
                   /\ UNCHANGED <<phase, picking, visible, focused, inView, hand, stack, woven, rolls, cheer, played, link, seed, lvl, unlock, cleared, skipped, mode>>

Next == YouStart \/ YouHold \/ YouLetGo \/ StripLands \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouScrollAway \/ YouScrollBack \/ YouPause \/ YouResume \/ YouOpenTheList \/ YouCloseTheList
        \/ (\E to \in (IF Full THEN Levels ELSE {1}) : YouPickAPati(to))
        \/ CheerFires \/ YouPlayAgain \/ YouGoOn \/ YouRestart \/ FriendLinkOpens
        \/ YouHoldEnter \/ EnterRepeats \/ YouLetGoOfEnter

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ picking \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ inView \in BOOLEAN /\ hand \in {"none", "side", "down"} /\ stack \in 0..FULL /\ woven \in 0..GOAL /\ rolls \in 0..1 /\ mode \in 0..1
          /\ cheer \in {"none", "this", "old"} /\ played \in BOOLEAN /\ link \in {"none", "theirs", "other"} /\ seed \in {"theirs", "fresh"}
          /\ enter \in {"up", "held"} /\ lvl \in Levels /\ unlock \in Levels /\ cleared \subseteq Levels /\ skipped \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == phase = "playing" => visible
PausedWhenBlurred == phase = "playing" => focused
PausedWhenScrolledAway == phase = "playing" => inView
InputReleasedWhenAway == hand # "none" => Here
NoHoldOffThePlay == phase # "playing" => hand = "none"
ChoiceFreezesPlay == picking => phase # "playing"
ResultMatchesPlay == (phase = "over") <=> (woven = GOAL \/ (stack = FULL /\ rolls = 0))
CelebrationOnItsOwnCard == (cheer = "this" => phase = "over") /\ ~played
ReplayIsExact == (link = "theirs" /\ phase \in {"playing", "paused"}) => seed = "theirs"
HeldKeyNeverSkips == ~skipped
OpenLevelsAreEarned == \A l \in 1..(unlock - 1) : l \in cleared
====
