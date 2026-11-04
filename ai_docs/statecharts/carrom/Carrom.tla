---- MODULE Carrom ----
\* ক্যারম (solo): the board's phase, the strike in flight, the tab, window and scroll, a held pull or Space,
\* the pull's hum loop, the site sound switch, বড় স্ট্রাইকার, and the boards (levels).
\* Mirrored from tools/carrom/components/carrom-game.tsx: start/pause/resume/restart/pick/finish/fire/letGo,
\* tick() (hum ??= loop("hum") while pulling or charging, stopHum otherwise), the `hide` and window "blur"
\* listeners, keyHandler (Space and the arrows are ignored unless boardInView, keyup included), toggleBig
\* (setStrikerSize at any time), SoundToggle onChange={stopHum}, useGameLoop(running = playing, or ready
\* while the board is in view), and shared/game-core.ts recordLevel/unlockedLevel.
\* Abstract: one strike a board (the game has 10; each strike is the same aim -> roll -> stop loop), 2 boards
\* (the game has 10), a board is passed when the strike pockets something. "Pull" covers a finger pulling
\* on the board and a finger holding মারো: both end on pointerup, which pointer capture always delivers.
\* "Space" is the keyboard hold of মারো; a held ← or → follows the same keyup rule and is left out.
\* While sound is off loop() returns a silent stub; it is "no hum" here, since turning sound on calls stopHum.
EXTENDS Naturals

N == 2
Boards == 1..N

VARIABLES phase, shot, visible, focused, inView, hand, hum, sound, resized, level, cleared
vars == <<phase, shot, visible, focused, inView, hand, hum, sound, resized, level, cleared>>

Max(a, b) == IF a > b THEN a ELSE b
\* The saved stars, as far as unlocking goes: "none" (no board passed), "inOrder" (board 1 passed),
\* "skipped" (only board 2 passed). unlockedLevel() is one past the highest passed board, at most N.
Unlocked == IF cleared = "none" THEN 1 ELSE 2
Earned == IF cleared = "inOrder" THEN 1 ELSE 0
\* levels.record(level, stars) keeps the better result for that board.
Passed(l) == IF l = 1 THEN "inOrder" ELSE IF cleared = "none" THEN "skipped" ELSE cleared
\* The picker: LevelGrid unlocked={Math.max(levels.unlocked, level)}.
Open == Max(Unlocked, level)
Here == visible /\ focused
Active == phase \in {"ready", "playing"}

\* useGameLoop runs tick() only while this holds (and never while the tab is hidden).
LoopRuns(ph, vis, iv) == vis /\ (ph = "playing" \/ (ph = "ready" /\ iv))
\* tick(): power > 0 and (pulling or charging) while aiming.
WantsHum(h, sh, ph) == h \in {"pull", "space"} /\ sh = "aim" /\ ph \in {"ready", "playing"}
\* The hum after a step: `cut` is stopHum() inside the step; then the next tick starts or stops the loop,
\* if the loop runs at all. Written last in each action, after every other primed variable.
HumAfter(cut) ==
  LET base == hum /\ ~cut IN
  hum' = IF LoopRuns(phase', visible', inView')
           THEN WantsHum(hand', shot', phase') /\ (base \/ sound')
           ELSE base

Init == /\ phase = "ready" /\ shot = "aim" /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE
        /\ hand = "none" /\ hum = FALSE /\ sound = TRUE /\ resized = FALSE /\ level = 1 /\ cleared = "none"

\* reset(): a fresh board, input let go (and stopHum()). The buttons that call it sit at the board, and
\* pick() scrolls the board back into view, so the board is on screen afterwards.
Reset(ph, l) == /\ phase' = ph /\ shot' = "aim" /\ hand' = "none" /\ resized' = FALSE /\ level' = l /\ inView' = TRUE

\* onBoardDown + onBoardMove (pull), or onShootDown (hold মারো).
YouPull == /\ Here /\ Active /\ shot = "aim" /\ hand = "none" /\ inView
           /\ hand' = "pull"
           /\ UNCHANGED <<phase, shot, visible, focused, inView, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* keydown Space: only while boardInView.
YouHoldSpace == /\ Here /\ Active /\ shot = "aim" /\ hand = "none" /\ inView
                /\ hand' = "space"
                /\ UNCHANGED <<phase, shot, visible, focused, inView, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* fire(): onBoardUp / onShootUp (always delivered), or keyup Space (only counted while boardInView).
YouLetGoToShoot == /\ visible /\ shot = "aim" /\ Active
                   /\ \/ hand = "pull"
                      \/ hand = "space" /\ focused /\ inView
                   /\ hand' = "none" /\ shot' = "rolling" /\ phase' = "playing"
                   /\ UNCHANGED <<visible, focused, inView, sound, resized, level, cleared>> /\ HumAfter(TRUE)
\* Scrolling only matters while aiming (the loop and the keys depend on it), so the model scrolls only then.
YouScrollAway == /\ Here /\ Active /\ shot = "aim" /\ inView /\ inView' = FALSE
                 /\ UNCHANGED <<phase, shot, visible, focused, hand, sound, resized, level, cleared>> /\ HumAfter(FALSE)
YouScrollBack == /\ visible /\ ~inView /\ inView' = TRUE
                 /\ UNCHANGED <<phase, shot, visible, focused, hand, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* window "blur" -> letGo(): input released, hum stopped; play is not paused.
WindowBlurs == /\ Here /\ focused' = FALSE /\ hand' = "none"
               /\ UNCHANGED <<phase, shot, visible, inView, sound, resized, level, cleared>> /\ HumAfter(TRUE)
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, shot, visible, inView, hand, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* hide(): pause() (only from playing) and letGo().
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ hand' = "none"
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<shot, inView, sound, resized, level, cleared>> /\ HumAfter(TRUE)
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, shot, inView, hand, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* pause(): the pause button, P or Esc; letGo().
YouPause == /\ Here /\ phase = "playing" /\ phase' = "paused" /\ hand' = "none"
            /\ UNCHANGED <<shot, visible, focused, inView, sound, resized, level, cleared>> /\ HumAfter(TRUE)
YouResume == /\ Here /\ phase = "paused" /\ phase' = "playing"
             /\ UNCHANGED <<shot, visible, focused, inView, hand, sound, resized, level, cleared>> /\ HumAfter(FALSE)
\* tick() until !w.moving, then afterShot() -> finish(): letGo, levels.record when the board is passed.
DiscsStop == /\ shot = "rolling" /\ phase = "playing" /\ visible
             /\ phase' = "over" /\ shot' = "aim" /\ hand' = "none" /\ resized' = FALSE
             /\ \E pocketed \in BOOLEAN : cleared' = IF pocketed THEN Passed(level) ELSE cleared
             /\ UNCHANGED <<visible, focused, inView, sound, level>> /\ HumAfter(TRUE)
\* toggleBig(): setStrikerSize(g, next) whatever the strike is doing.
YouToggleBigStriker == /\ Here /\ resized' = (resized \/ shot = "rolling")
                       /\ UNCHANGED <<phase, shot, visible, focused, inView, hand, sound, level, cleared>> /\ HumAfter(FALSE)
\* SoundToggle: setSoundOn(next) (off stops every loop), then onChange -> stopHum().
SoundOff == /\ Here /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<phase, shot, visible, focused, inView, hand, resized, level, cleared>> /\ HumAfter(TRUE)
SoundOn == /\ Here /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, shot, visible, focused, inView, hand, resized, level, cleared>> /\ HumAfter(TRUE)
\* restart(): আবার খেলো / আরেকবার goes straight to playing.
YouPlayAgain == /\ Here /\ phase = "over" /\ Reset("playing", level)
                /\ UNCHANGED <<visible, focused, sound, cleared>> /\ HumAfter(TRUE)
\* পরের বোর্ড: after passing this board (here: once it has stars), below the last board.
YouGoToNextBoard == /\ Here /\ phase = "over" /\ (level = 1 /\ cleared = "inOrder") /\ level < N /\ Reset("ready", level + 1)
                    /\ UNCHANGED <<visible, focused, sound, cleared>> /\ HumAfter(TRUE)
\* সব বোর্ড -> pick(n): any open board, from any phase (solo asks no confirm).
YouPickABoard == /\ Here /\ hand = "none" /\ \E l \in 1..Open : Reset("ready", l)
                 /\ UNCHANGED <<visible, focused, sound, cleared>> /\ HumAfter(TRUE)
\* readFriend(): a friend's solo link for board N opens that board.
FriendLinkOpens == /\ Here /\ hand = "none" /\ level # N /\ Reset("ready", N)
                   /\ UNCHANGED <<visible, focused, sound, cleared>> /\ HumAfter(TRUE)

Next == YouPull \/ YouHoldSpace \/ YouLetGoToShoot \/ YouScrollAway \/ YouScrollBack
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPause \/ YouResume \/ DiscsStop
        \/ YouToggleBigStriker \/ SoundOff \/ SoundOn \/ YouPlayAgain \/ YouGoToNextBoard
        \/ YouPickABoard \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ shot \in {"aim", "rolling"}
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ inView \in BOOLEAN
          /\ hand \in {"none", "pull", "space"} /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ resized \in BOOLEAN /\ level \in Boards /\ cleared \in {"none", "inOrder", "skipped"}

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
InputReleasedWhenAway == hand # "none" => (visible /\ focused)
\* A key only counts as held while the board is on screen, because only then does its release count.
KeysOnlyWhileBoardShows == hand = "space" => inView
\* The hum plays only while you pull and the board answers.
LoopOnlyWhenMeaningful == hum => (WantsHum(hand, shot, phase) /\ LoopRuns(phase, visible, inView) /\ sound)
LoopComesBack == (WantsHum(hand, shot, phase) /\ LoopRuns(phase, visible, inView) /\ sound) => hum
NoHumOffThePlay == phase \in {"paused", "over"} => ~hum
\* Once the striker leaves your finger, nothing changes its size until the discs stop.
ShotFixedOnceFired == ~resized
\* Exploration stops at a resized striker: the bug is shown, and the model stays under the chart budget.
StopAtResize == ~resized

\* A board opens for good only by passing the one before it.
UnlockOnlyByClearing == Unlocked <= Earned + 1
====
