---- MODULE BaicherNouka ----
\* বাইচের নৌকা after the rewrite: the screens, the shared player's pause, window focus, the race list, the breath after চালিয়ে যাও,
\* তাল মেলাও, the river-rush loop, the site-wide sound switch, the result screen's key guard. A friend's link is a second small spec, link/BaicherLink.tla, so each chart stays under 500 states.
\* Mirrored from tools/baicher-nouka/components/river.tsx (begin, finish, start, startCalib/endCalib/cancelCalib, pickLevel, openSheet/
\* closeSheet, the blur/focus/visibility effect, the sound effect, the hashchange handler, useGamePlayer's onPause/onResume/onRestart)
\* and tools/baicher-nouka/lib/session.ts (ticking, canTap, wantRush, syncLoops, blur, hide, pause, resume, openSheet, closeSheet,
\* freshResultKey, takeCalibLost, linkArrives, takeOwed). The old model (five broken rules) is in before-fix/.
\* The page has no "river scrolled away" at all any more: the game fills the player's stage, and the player pauses a desktop page whose
\* stage scrolls off. A race is abstracted to "on the water" until its finish; time on the result is "fresh" (under the key guard) or "later".
EXTENDS Naturals
VARIABLES screen, menu, win, sheet, breath, sound, rush, moves, since
vars == <<screen, menu, win, sheet, breath, sound, rush, moves, since>>

Screens == {"title", "calib", "play", "over"}
\* On the page, away (another window has focus), or hidden (another tab).
Wins == {"on", "away", "hidden"}
Since == {"none", "fresh", "later", "skipped"}

\* session.ticking: a play or calibration screen, the menu and the list shut, the tab showing and the window focused.
TickingWith(sc, mn, w, sh) == sc \in {"play", "calib"} /\ ~mn /\ ~sh /\ w = "on"
\* session.wantRush: ticking, a race on the water, sound on.
WantRush(sc, mn, w, sh, so) == TickingWith(sc, mn, w, sh) /\ sc = "play" /\ so

Init == /\ screen = "title" /\ menu = FALSE /\ win = "on" /\ sheet = FALSE /\ breath = FALSE /\ sound \in BOOLEAN
        /\ rush = FALSE /\ moves = FALSE /\ since = "none"

\* syncLoops: called after every handler and every step. Everything below ends in it; `moves` is true only for the step action.
Sync(sc, mn, w, sh, so) == rush' = WantRush(sc, mn, w, sh, so)

\* begin(): a fresh race on the play screen with the count-in. silenceScheduled cuts the last card's chimes. takeOwed settles any debt.
Begin == /\ screen' = "play" /\ breath' = FALSE /\ since' = "none" /\ sheet' = FALSE /\ moves' = FALSE

\* The title's খেলো, Enter or Space: start().
YouTapStart == /\ screen = "title" /\ ~menu /\ ~sheet /\ win = "on"
               /\ Begin
               /\ UNCHANGED <<menu, win, sound>>
               /\ Sync("play", menu, win, FALSE, sound)
YouTapAChoice == /\ screen = "over" /\ ~menu /\ ~sheet /\ win = "on"
                 /\ Begin
                 /\ UNCHANGED <<menu, win, sound>>
                 /\ Sync("play", menu, win, FALSE, sound)
\* A result key (1, Enter, Space, R): refused unless it is a fresh press after the guard (a drummer's next tap is inside it).
YouPressAKey == /\ screen = "over" /\ ~menu /\ ~sheet /\ win = "on" /\ since = "later"
                /\ Begin
                /\ UNCHANGED <<menu, win, sound>>
                /\ Sync("play", menu, win, FALSE, sound)
\* The same press inside the guard: refused, nothing changes (it stays visible in the chart as a no-op).
YouDrumTooSoon == /\ screen = "over" /\ ~menu /\ ~sheet /\ win = "on" /\ since = "fresh"
                  /\ UNCHANGED <<screen, menu, win, sheet, breath, sound, rush, since>>
                  /\ moves' = FALSE
\* pickLevel(): a race chosen on purpose from সব বাইচ (a friend's if it matches); settles any debt.
YouPickARace == /\ sheet /\ win = "on" /\ ~menu
                /\ Begin
                /\ UNCHANGED <<menu, win, sound>>
                /\ Sync("play", menu, win, FALSE, sound)
\* The pause menu's নতুন করে শুরু (onRestart): the same race again from its count-in.
YouRestartFromMenu == /\ menu /\ screen \in {"play", "over"} /\ win = "on"
                      /\ Begin
                      /\ menu' = FALSE /\ UNCHANGED <<win, sound>>
                      /\ Sync("play", FALSE, win, FALSE, sound)

\* startCalib(): from the title only.
YouStartCalib == /\ screen = "title" /\ ~menu /\ ~sheet /\ win = "on"
                 /\ screen' = "calib" /\ moves' = FALSE
                 /\ UNCHANGED <<menu, win, sheet, breath, sound, since>>
                 /\ Sync("calib", menu, win, sheet, sound)
\* endCalib(): by itself after the eighth pulse, or বাদ দাও. The pulses are stepped only while ticking.
CalibEnds == /\ screen = "calib" /\ TickingWith(screen, menu, win, sheet) /\ ~breath
             /\ screen' = "title" /\ moves' = FALSE
             /\ UNCHANGED <<menu, win, sheet, breath, sound, since>>
             /\ Sync("title", menu, win, sheet, sound)
YouSkipCalib == /\ screen = "calib" /\ ~menu /\ ~sheet /\ win = "on"
                /\ screen' = "title" /\ moves' = FALSE
                /\ UNCHANGED <<menu, win, sheet, breath, sound, since>>
                /\ Sync("title", menu, win, sheet, sound)

\* step(): the race moves (and the clock, and the drum) only while ticking and after the breath.
RaceStep == /\ screen = "play" /\ TickingWith(screen, menu, win, sheet) /\ ~breath
            /\ moves' = TRUE
            /\ UNCHANGED <<screen, menu, win, sheet, breath, sound, rush, since>>
\* finish(): the bow crosses the rope while the race steps. The result shows once; syncLoops stops the rush.
YouFinish == /\ screen = "play" /\ TickingWith(screen, menu, win, sheet) /\ ~breath
             /\ screen' = "over" /\ since' = "fresh" /\ moves' = FALSE
             /\ UNCHANGED <<menu, win, sheet, breath, sound>>
             /\ Sync("over", menu, win, sheet, sound)
ResultAges == /\ screen = "over" /\ since = "fresh" /\ since' = "later" /\ moves' = FALSE
              /\ UNCHANGED <<screen, menu, win, sheet, breath, sound, rush>>
BreathPasses == /\ breath /\ TickingWith(screen, menu, win, sheet) /\ breath' = FALSE /\ moves' = FALSE
                /\ UNCHANGED <<screen, menu, win, sheet, sound, rush, since>>

\* Leaving the page while তাল মেলাও runs voids its pulses at once (takeCalibLost → cancelCalib → the title); a race just stops ticking.
Away(sc) == IF sc = "calib" THEN "title" ELSE sc
\* The player's menu opens on blur and hide, once the game has been touched (never over the title).
WindowBlurs == /\ win = "on" /\ win' = "away" /\ menu' = (menu \/ screen # "title") /\ screen' = Away(screen) /\ moves' = FALSE
               /\ UNCHANGED <<sheet, breath, sound, since>>
               /\ Sync(Away(screen), menu \/ screen # "title", "away", sheet, sound)
WindowFocuses == /\ win = "away" /\ win' = "on" /\ moves' = FALSE
                 /\ UNCHANGED <<screen, menu, sheet, breath, sound, since>>
                 /\ Sync(screen, menu, "on", sheet, sound)
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ menu' = (menu \/ screen # "title") /\ screen' = Away(screen) /\ moves' = FALSE
            /\ UNCHANGED <<sheet, breath, sound, since>>
            /\ Sync(Away(screen), menu \/ screen # "title", "hidden", sheet, sound)
TabShows == /\ win = "hidden" /\ win' = "on" /\ moves' = FALSE
            /\ UNCHANGED <<screen, menu, sheet, breath, sound, since>>
            /\ Sync(screen, menu, "on", sheet, sound)
\* The pause button, P or Escape (the player's menu).
YouPause == /\ ~menu /\ screen # "title" /\ win = "on" /\ menu' = TRUE /\ screen' = Away(screen) /\ moves' = FALSE
            /\ UNCHANGED <<win, sheet, breath, sound, since>>
            /\ Sync(Away(screen), TRUE, win, sheet, sound)
\* চালিয়ে যাও: the breath starts; the drum strokes are scheduled again from the next beat.
YouResume == /\ menu /\ win = "on" /\ menu' = FALSE /\ breath' = TRUE /\ moves' = FALSE
             /\ UNCHANGED <<screen, win, sheet, sound, since>>
             /\ Sync(screen, FALSE, win, sheet, sound)
\* সব বাইচ from the title, the result or the pause menu: nothing runs behind the list.
YouOpenTheList == /\ ~sheet /\ ~menu /\ win = "on" /\ sheet' = TRUE /\ screen' = Away(screen) /\ moves' = FALSE
                  /\ UNCHANGED <<menu, win, breath, sound, since>>
                  /\ Sync(Away(screen), menu, win, TRUE, sound)
YouCloseTheList == /\ sheet /\ sheet' = FALSE /\ breath' = TRUE /\ moves' = FALSE
                   /\ UNCHANGED <<screen, menu, win, sound, since>>
                   /\ Sync(screen, menu, win, FALSE, sound)
\* setSoundOn(false) stops every loop; the sound effect then syncs. Turning it on starts a fresh loop (never the silent stub).
SoundOff == /\ sound /\ sound' = FALSE /\ moves' = FALSE
            /\ UNCHANGED <<screen, menu, win, sheet, breath, since>>
            /\ Sync(screen, menu, win, sheet, FALSE)
SoundOn == /\ ~sound /\ sound' = TRUE /\ moves' = FALSE
           /\ UNCHANGED <<screen, menu, win, sheet, breath, since>>
           /\ Sync(screen, menu, win, sheet, TRUE)
Next == YouTapStart \/ YouTapAChoice \/ YouPressAKey \/ YouDrumTooSoon \/ YouPickARace \/ YouRestartFromMenu \/ YouStartCalib \/ CalibEnds \/ YouSkipCalib
        \/ RaceStep \/ YouFinish \/ ResultAges \/ BreathPasses \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume
        \/ YouOpenTheList \/ YouCloseTheList \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ menu \in BOOLEAN /\ win \in Wins /\ sheet \in BOOLEAN /\ breath \in BOOLEAN /\ sound \in BOOLEAN /\ rush \in BOOLEAN
          /\ moves \in BOOLEAN /\ since \in Since

\* The reader's rules.
NoProgressWhileAway == moves => (win = "on" /\ ~menu /\ ~sheet /\ ~breath /\ screen = "play")
PausedWhenHidden == screen = "play" /\ win = "hidden" => ~moves
PausedWhenBlurred == screen = "play" /\ win = "away" => ~moves
ChoiceFreezesPlay == sheet => ~moves
CalibVoidedWhenAway == screen = "calib" => (win = "on" /\ ~menu /\ ~sheet)
LoopOnlyWhenMeaningful == rush => (screen = "play" /\ sound /\ win = "on" /\ ~menu /\ ~sheet)
LoopComesBack == (screen = "play" /\ sound /\ win = "on" /\ ~menu /\ ~sheet) => rush
ResultStaysABeat == since # "skipped" /\ (screen = "over" => since \in {"fresh", "later"})
NoDoubleResult == screen = "over" => ~rush
====
