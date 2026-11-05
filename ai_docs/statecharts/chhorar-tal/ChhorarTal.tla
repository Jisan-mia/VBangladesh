---- MODULE ChhorarTal ----
\* ছড়ার তালে (ছোটদের জন্য, ৩–৬), after the rewrite: the screens (title → ছড়া → end, and the ছড়া list), the beat clock and the
\* window, the player's pause and the count-in that brings the beat back, where a Space or Enter press lands, the end screen's
\* guard, and the daily limit and rest screen.
\* Mirrored from tools/chhorar-tal/lib/session.ts (begin, tapCounts, finished, pause, resume, blur, focus, openLevels,
\* routeKey), tools/chhorar-tal/lib/run.ts (rewind) and lib/tick.hot.ts (advance), tools/chhorar-tal/components/game.tsx
\* (the window key handler, onEvents → finishRun), shared/game-kit.ts (useGameLoop: stops on window blur and on a hidden tab,
\* restarts on focus), shared/game-player-client.tsx (the pause menu sends a blur, then focus on resume) and shared/kids-kit.tsx
\* (useKidsSession's atBreak(); RestScreen, a modal). There is no voice and no sound loop: nothing to model.
\* Abstractions: the ছড়া's beats are two steps ("early", "last beat"). Hiding the tab also blurs the window and showing it
\* focuses it again (Chrome desktop and Android). The player's pause is one step that also owes the beat a count-in.
EXTENDS Naturals
VARIABLES screen, beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting
vars == <<screen, beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>

Screens == {"title", "levels", "play", "end"}
Free == ~resting /\ win = "here" /\ ~menu

\* session.begin → a new round: two beats counted in, the clock running. The clicked button is blurred; Space is handled at window.
Begin == /\ screen' = "play" /\ beat' = 0 /\ loop' = TRUE /\ counting' = TRUE /\ owed' = FALSE /\ swallow' = FALSE
         /\ recorded' = FALSE /\ guard' = FALSE /\ focus' = "body"
\* Opening a round is a break: past the limit nothing starts and the rest screen shows (atBreak() inside begin).
BeginOrRest == IF overLimit THEN /\ resting' = TRUE /\ UNCHANGED <<screen, beat, loop, counting, owed, swallow, recorded, guard, focus>>
               ELSE /\ Begin /\ UNCHANGED resting

Init == /\ screen = "title" /\ beat = 0 /\ loop = FALSE /\ counting = FALSE /\ win = "here" /\ menu = FALSE /\ owed = FALSE
        /\ swallow = FALSE /\ focus = "body" /\ keyWent = "none" /\ recorded = FALSE /\ guard = FALSE
        /\ overLimit = FALSE /\ resting = FALSE

\* The title's big drum, or Space / Enter on the title (a window key, so it never presses a stale button).
YouTapTheStart == /\ screen = "title" /\ Free /\ BeginOrRest /\ keyWent' = "none" /\ UNCHANGED <<win, menu, overLimit>>
YouPressSpaceOnTheTitle == /\ screen = "title" /\ Free /\ BeginOrRest /\ keyWent' = "start" /\ UNCHANGED <<win, menu, overLimit>>
\* A ছড়া card in the list.
YouPickAChhora == /\ screen = "levels" /\ Free /\ BeginOrRest /\ keyWent' = "none" /\ UNCHANGED <<win, menu, overLimit>>
YouOpenTheList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "levels" /\ loop' = FALSE
                  /\ UNCHANGED <<beat, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>
YouCloseTheList == /\ screen = "levels" /\ Free /\ screen' = (IF recorded THEN "end" ELSE "title")
                   /\ UNCHANGED <<beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>

\* The drum: a tap by finger. The first tap after coming back only wakes the game (swallow); otherwise it lands on a beat.
YouTapTheDrum == /\ screen = "play" /\ Free /\ swallow' = FALSE /\ focus' = "body" /\ keyWent' = "tap"
                 /\ UNCHANGED <<screen, beat, loop, counting, win, menu, owed, recorded, guard, overLimit, resting>>
\* Space or Enter in a ছড়া is routed at window and always prevented: it taps, whatever is focused, and never scrolls the page.
YouPressSpace == /\ screen = "play" /\ Free /\ keyWent' = "tap"
                 /\ UNCHANGED <<screen, beat, loop, counting, win, menu, owed, swallow, focus, recorded, guard, overLimit, resting>>

\* tick.hot advance(): the count-in's two beats, then the beats; only while the loop runs.
CountInEnds == /\ loop /\ counting /\ counting' = FALSE
               /\ UNCHANGED <<screen, beat, loop, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>
TheBeatMovesOn == /\ loop /\ ~counting /\ beat = 0 /\ beat' = 1
                  /\ UNCHANGED <<screen, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>
\* EV_END → finishRun(): session.finished records the stars and runs atBreak() at this very step, then the end screen shows.
TheChhoraEnds == /\ loop /\ ~counting /\ beat = 1
                 /\ screen' = "end" /\ loop' = FALSE /\ recorded' = TRUE /\ guard' = FALSE /\ resting' = overLimit
                 /\ owed' = FALSE /\ swallow' = FALSE
                 /\ UNCHANGED <<beat, counting, win, menu, focus, keyWent, overLimit>>
\* The end screen's buttons and keys are live after the guard (700 ms): আবার খেলো and শেষ below are enabled only then, so the
\* tap that was still drumming when the ছড়া ended, and a held Space, never start the next round or skip the result.
TheGuardPasses == /\ screen = "end" /\ ~guard /\ guard' = TRUE
                  /\ UNCHANGED <<screen, beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, overLimit, resting>>
\* আবার খেলো (a button or a fresh key press after the guard); শেষ goes to the title.
YouPlayAgain == /\ screen = "end" /\ guard /\ Free /\ BeginOrRest /\ keyWent' = "none" /\ UNCHANGED <<win, menu, overLimit>>
YouPressShesh == /\ screen = "end" /\ guard /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, overLimit, resting>>

\* The window: another window takes focus, or the tab hides (both fire blur): the frame is cancelled and the beat is owed a count-in.
YouLeave == /\ win = "here" /\ win' = "away" /\ loop' = FALSE
            /\ owed' = (owed \/ (screen = "play")) /\ swallow' = (swallow \/ (screen = "play"))
            /\ UNCHANGED <<screen, beat, counting, menu, focus, keyWent, recorded, guard, overLimit, resting>>
\* Coming back (focus): with the menu shut and a beat owed, two beats are counted in again from the start of the line.
YouComeBack == /\ win = "away" /\ win' = "here"
               /\ IF screen = "play" /\ ~menu /\ owed
                    THEN loop' = TRUE /\ counting' = TRUE /\ owed' = FALSE
                    ELSE UNCHANGED <<loop, counting, owed>>
               /\ UNCHANGED <<screen, beat, menu, swallow, focus, keyWent, recorded, guard, overLimit, resting>>
\* The player's pause (⏸, P, Escape): it blurs, cancels the frame and owes the beat a count-in.
YouPause == /\ ~menu /\ menu' = TRUE /\ loop' = FALSE /\ owed' = (owed \/ (screen = "play"))
            /\ UNCHANGED <<screen, beat, counting, win, swallow, focus, keyWent, recorded, guard, overLimit, resting>>
\* চালিয়ে যাও: the menu took the click (nothing swallowed), focus comes back, and a beat owed is counted in once.
YouResume == /\ menu /\ menu' = FALSE /\ win' = "here" /\ swallow' = FALSE
             /\ IF screen = "play" /\ owed
                  THEN loop' = TRUE /\ counting' = TRUE /\ owed' = FALSE
                  ELSE UNCHANGED <<loop, counting, owed>>
             /\ UNCHANGED <<screen, beat, focus, keyWent, recorded, guard, overLimit, resting>>

\* The daily limit.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<screen, beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard, resting>>
AParentGivesTenMinutes == /\ resting /\ win = "here" /\ resting' = FALSE /\ overLimit' = FALSE
                          /\ UNCHANGED <<screen, beat, loop, counting, win, menu, owed, swallow, focus, keyWent, recorded, guard>>

Next == YouTapTheStart \/ YouPressSpaceOnTheTitle \/ YouPickAChhora \/ YouOpenTheList \/ YouCloseTheList
        \/ YouTapTheDrum \/ YouPressSpace \/ CountInEnds \/ TheBeatMovesOn \/ TheChhoraEnds \/ TheGuardPasses
        \/ YouPlayAgain \/ YouPressShesh \/ YouLeave \/ YouComeBack \/ YouPause \/ YouResume
        \/ TimeIsUp \/ AParentGivesTenMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ beat \in 0..1 /\ loop \in BOOLEAN /\ counting \in BOOLEAN /\ win \in {"here", "away"}
          /\ menu \in BOOLEAN /\ owed \in BOOLEAN /\ swallow \in BOOLEAN /\ focus \in {"body"}
          /\ keyWent \in {"none", "tap", "start", "restart", "scroll"} /\ recorded \in BOOLEAN /\ guard \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* The reader's rules.
\* The beat stops while you're away, or the player's menu is open.
NoProgressWhileAway == loop => (win = "here" /\ ~menu /\ screen = "play")
\* Coming back (or resuming), the beat is counted in again: the clock never runs on while a count-in is still owed.
CountInOnReturn == ~(loop /\ owed)
\* Space or Enter during the ছড়া plays the drum; it never starts the ছড়া over ...
SpaceNeverRestarts == keyWent # "restart"
\* ... and it never just scrolls the page.
SpaceReachesTheDrum == keyWent # "scroll"
\* A ছড়া you finished is always recorded and checked against the daily limit, at the moment it ends.
EveryFinishCounts == screen = "end" => recorded
\* The first tap after returning only wakes the game; and a count-in is owed only inside a ছড়া.
WakeAndOweOnlyInARound == (swallow \/ owed) => screen = "play"
\* The kids' rules.
RestOnlyAtBreak == resting => screen # "play"
====
