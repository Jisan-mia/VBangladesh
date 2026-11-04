---- MODULE Carrom ----
\* ক্যারম after the rewrite: the session's screens, the strike in flight, the tab, window and stage, what the hand holds,
\* the pull's hum and the site sound switch, সব বোর্ড, the end slip and its keys, the fanfare timer, and your own open boards.
\* Mirrored from:
\*   tools/carrom/lib/session.ts      start, pause, resume, away, back, hold, release, finish, again, reset, replay, openSheet, closeSheet, humWanted, cheerMayPlay
\*   tools/carrom/lib/save.ts         openAfter, playable, readOpen
\*   tools/carrom/components/carrom-game.tsx   the blur, focus, visibility and useInView effects; strike(); afterShot(); finish()
\*                                    (the fanfare timer, cleared by load()); keyHandler (a held key ends on its own keyup; the slip's keys
\*                                    need a fresh press); setHand (only on the start card); useGamePlayer onPause / onResume
\*   tools/carrom/components/sound.ts makeHum: off when not wanted; replaced whenever the switch flipped since it was made
\* Abstract: one strike per board (each strike is the same aim → roll → stop loop), 2 boards, a board is cleared when the strike
\* pockets enough. "pull" covers a finger pulling on the board and a finger on মারো (pointer capture always delivers their up);
\* "key" is Space or Enter held. With Full = FALSE (the chart run, under the 500-state budget) a hidden tab and a scroll away are
\* merged into a blur (all three take the same Away step), and the held key into the pull (both end on their own release).
EXTENDS Naturals

CONSTANT Full
N == 2
Boards == 1..N

VARIABLES phase, why, shot, visible, focused, inView, hold, keyDown, stale, hum, sound, level, open, visit, cleared, cheer, resized
vars == <<phase, why, shot, visible, focused, inView, hold, keyDown, stale, hum, sound, level, open, visit, cleared, cheer, resized>>

Here == visible /\ focused /\ inView
\* session.live: the discs roll, the meter swings and input counts only here.
Live(ph, wy, vis, foc, iv) == ph = "playing" /\ wy # "sheet" /\ vis /\ foc /\ iv
LiveNow == Live(phase, why, visible, focused, inView)
\* humWanted: live play, something held, the strike not yet gone; makeHum gives a real hum only with sound on.
HumWanted(ph, wy, vis, foc, iv, h, sh, snd) == Live(ph, wy, vis, foc, iv) /\ h # "none" /\ sh = "aim" /\ snd
\* The hum after a step: the loop's tick sets it to exactly what is wanted while play is live; otherwise letGo() stopped it.
HumAfter == hum' = HumWanted(phase', why', visible', focused', inView', hold', shot', sound')
\* save.ts: clearing the frontier board opens the next; any other board (an earlier one, a friend's) opens nothing.
OpenAfter(o, l) == IF l = o /\ o < N THEN o + 1 ELSE o
Playable(l, o, v) == l <= o \/ l = v
Passed(l) == IF l = 1 THEN (IF cleared = "skipped" THEN "both" ELSE IF cleared = "none" THEN "inOrder" ELSE cleared)
             ELSE (IF cleared = "none" THEN "skipped" ELSE IF cleared = "inOrder" THEN "both" ELSE cleared)

Init == /\ phase = "title" /\ why = "none" /\ shot = "aim" /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ hold = "none" /\ keyDown = FALSE /\ stale = FALSE /\ hum = FALSE /\ sound = TRUE
        /\ level = 1 /\ open = 1 /\ visit = 0 /\ cleared = "none" /\ cheer = FALSE /\ resized = FALSE

\* load(): a board on the start card; timers cleared (the fanfare goes), input let go.
Load(l) == /\ phase' = "title" /\ why' = "none" /\ shot' = "aim" /\ hold' = "none" /\ level' = l /\ cheer' = FALSE /\ resized' = FALSE

\* ---- play ----
YouPressStart == /\ phase = "title" /\ why # "sheet" /\ Here /\ phase' = "playing"
                 /\ UNCHANGED <<why, shot, visible, focused, inView, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouPull == /\ LiveNow /\ shot = "aim" /\ hold = "none" /\ hold' = "pull"
           /\ UNCHANGED <<phase, why, shot, visible, focused, inView, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouLetGoOfThePull == /\ hold = "pull" /\ hold' = "none" /\ shot' = IF LiveNow /\ shot = "aim" THEN "rolling" ELSE shot
                     /\ UNCHANGED <<phase, why, visible, focused, inView, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
\* keydown Space/Enter: a hold only while live; the key is physically down either way.
YouPressSpace == /\ ~keyDown /\ Here /\ keyDown' = TRUE
                 /\ hold' = IF LiveNow /\ shot = "aim" /\ hold = "none" THEN "key" ELSE hold
                 /\ UNCHANGED <<phase, why, shot, visible, focused, inView, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
\* keyup: always honoured for the hold its own keydown started, wherever focus is; it strikes only while play is live.
YouReleaseSpace == /\ keyDown /\ keyDown' = FALSE /\ stale' = FALSE
                   /\ hold' = IF hold = "key" THEN "none" ELSE hold
                   /\ shot' = IF hold = "key" /\ LiveNow /\ shot = "aim" THEN "rolling" ELSE shot
                   /\ UNCHANGED <<phase, why, visible, focused, inView, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
\* The discs stop: settle(); a board that ends shows the slip (session.finish lets go) and queues the fanfare.
DiscsStop == /\ shot = "rolling" /\ LiveNow /\ shot' = "aim"
             /\ \E ends \in BOOLEAN, pocketed \in BOOLEAN :
                  IF ends
                  THEN /\ phase' = "over" /\ hold' = "none" /\ cheer' = pocketed /\ stale' = keyDown
                       /\ cleared' = IF pocketed THEN Passed(level) ELSE cleared
                       /\ open' = IF pocketed THEN OpenAfter(open, level) ELSE open
                  ELSE UNCHANGED <<phase, hold, cheer, stale, cleared, open>>
             /\ UNCHANGED <<why, visible, focused, inView, keyDown, sound, level, visit, resized>> /\ HumAfter
\* The fanfare timer fires: cheerMayPlay (its own run's slip) — it plays, or does nothing.
FanfarePlays == /\ cheer /\ cheer' = FALSE
                /\ UNCHANGED <<phase, why, shot, visible, focused, inView, hold, keyDown, stale, hum, sound, level, open, visit, cleared, resized>>

\* ---- away and back (the player's menu sends the same blur and focus) ----
Away(vis, foc, iv) == /\ visible' = vis /\ focused' = foc /\ inView' = iv /\ hold' = "none"
                      /\ IF phase = "playing" THEN phase' = "paused" /\ why' = IF why = "sheet" THEN "sheet" ELSE "away" ELSE UNCHANGED <<phase, why>>
WindowBlurs == /\ focused /\ Away(visible, FALSE, inView)
               /\ UNCHANGED <<shot, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, why, shot, visible, inView, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
TabHides == /\ Full /\ visible /\ Away(FALSE, FALSE, inView)
            /\ UNCHANGED <<shot, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
TabShows == /\ Full /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, why, shot, inView, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouScrollAway == /\ Full /\ inView /\ visible /\ focused /\ Away(visible, focused, FALSE)
                 /\ UNCHANGED <<shot, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouScrollBack == /\ ~inView /\ inView' = TRUE
                 /\ UNCHANGED <<phase, why, shot, visible, focused, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
\* চালিয়ে যাও (the menu's onResume or our own card): only from an away pause, only when the game can be seen.
YouResume == /\ phase = "paused" /\ why = "away" /\ Here /\ phase' = "playing" /\ why' = "none"
             /\ UNCHANGED <<shot, visible, focused, inView, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter

\* ---- choices ----
YouOpenTheSheet == /\ Here /\ why # "sheet" /\ phase # "over" /\ why' = "sheet" /\ hold' = "none"
                   /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
                   /\ UNCHANGED <<shot, visible, focused, inView, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouCloseTheSheet == /\ why = "sheet" /\ Here
                    /\ IF phase = "paused" THEN phase' = "playing" /\ why' = "none" ELSE phase' = phase /\ why' = "none"
                    /\ UNCHANGED <<shot, visible, focused, inView, hold, keyDown, stale, sound, level, open, visit, cleared, cheer, resized>> /\ HumAfter
YouPickABoard == /\ why = "sheet" /\ Here /\ \E l \in Boards : Playable(l, open, visit) /\ Load(l)
                 /\ UNCHANGED <<visible, focused, inView, keyDown, stale, sound, open, visit, cleared>> /\ HumAfter
\* The end slip: পরের বোর্ড / আবার খেলো by tap, or Enter/R — a key only from a fresh press (never the one held through the end).
YouLeaveTheResult == /\ phase = "over" /\ Here /\ why # "sheet" /\ ~stale
                     /\ \E l \in Boards : (l = level \/ (l = level + 1 /\ Playable(l, open, visit))) /\ Load(l)
                     /\ UNCHANGED <<visible, focused, inView, keyDown, stale, sound, open, visit, cleared>> /\ HumAfter
\* A friend's link for board N opens that board for this visit.
FriendLinkOpens == /\ Here /\ hold = "none" /\ visit = 0 /\ visit' = N /\ Load(N)
                   /\ UNCHANGED <<visible, focused, inView, keyDown, stale, sound, open, cleared>> /\ HumAfter
\* setHand: the difficulty (and the striker's size) changes only on the start card.
YouChangeTheHand == /\ phase = "title" /\ Here /\ resized' = (resized \/ shot = "rolling")
                    /\ UNCHANGED <<phase, why, shot, visible, focused, inView, hold, keyDown, stale, hum, sound, level, open, visit, cleared, cheer>>

\* ---- sound ----
SoundOff == /\ Here /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<phase, why, shot, visible, focused, inView, hold, keyDown, stale, level, open, visit, cleared, cheer, resized>> /\ HumAfter
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, why, shot, visible, focused, inView, hold, keyDown, stale, level, open, visit, cleared, cheer, resized>> /\ HumAfter

Next == YouPressStart \/ YouPull \/ YouLetGoOfThePull \/ (Full /\ (YouPressSpace \/ YouReleaseSpace)) \/ DiscsStop \/ FanfarePlays
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouScrollAway \/ YouScrollBack \/ YouResume
        \/ YouOpenTheSheet \/ YouCloseTheSheet \/ YouPickABoard \/ YouLeaveTheResult \/ FriendLinkOpens \/ YouChangeTheHand
        \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "playing", "paused", "over"} /\ why \in {"none", "away", "sheet"} /\ shot \in {"aim", "rolling"}
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN /\ hold \in {"none", "pull", "key"}
          /\ keyDown \in BOOLEAN /\ stale \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ level \in Boards /\ open \in Boards /\ visit \in 0..N /\ cleared \in {"none", "inOrder", "skipped", "both"}
          /\ cheer \in BOOLEAN /\ resized \in BOOLEAN

\* ---- the reader's rules ----
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
\* KeysOnlyWhileBoardShows (bug 1): nothing counts as held unless play is live, so a scroll can't strand a held Space.
InputReleasedWhenAway == hold # "none" => LiveNow
\* PausedWhenScrolledAway: the discs don't roll off screen either.
PausedWhenScrolledAway == ~inView => phase # "playing"
\* LoopOnlyWhenMeaningful (bug 2) and LoopComesBack: the hum plays exactly while it means something.
LoopOnlyWhenMeaningful == hum => HumWanted(phase, why, visible, focused, inView, hold, shot, sound)
LoopComesBack == HumWanted(phase, why, visible, focused, inView, hold, shot, sound) => hum
NoHumOffThePlay == phase \in {"title", "paused", "over"} => ~hum
\* ShotFixedOnceFired (bug 4): nothing changes the striker's size while it rolls.
ShotFixedOnceFired == ~resized
\* ChoiceFreezesPlay: while সব বোর্ড is open, nothing moves.
ChoiceFreezesPlay == why = "sheet" => phase # "playing"
\* UnlockOnlyByClearing (bug 5): your own open boards are your unbroken run of clears; a friend's board 2 opens nothing for good.
UnlockOnlyByClearing == open <= (IF cleared \in {"inOrder", "both"} THEN 2 ELSE 1)
LevelIsPlayable == Playable(level, open, visit)
\* CheerOnlyOnItsResult: the fanfare is queued only on its own slip.
CheerOnlyOnItsResult == cheer => phase = "over"
\* HeldKeyNeverSkips: a key held through the end is stale until released, and the slip never leaves on it (YouLeaveTheResult needs ~stale).
HeldKeyIsStale == (phase = "over" /\ stale) => keyDown
====
