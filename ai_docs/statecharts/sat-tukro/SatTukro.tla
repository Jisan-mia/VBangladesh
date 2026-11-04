---- MODULE SatTukro ----
\* সাত টুকরো as it is on 2026-11-04 (branch games-to-the-bar), mirrored from:
\*   tools/sat-tukro/components/tangram-game.tsx  Play (phase, finish() timer, start(), the title button, LevelGrid, আবার খেলো, শেষ)
\*                                                 Board (down/move/up/cancel on the SVG, the drag ref)
\*   tools/sat-tukro/lib/game.ts                   drop/tapPiece/settle: a piece clicks in or goes back
\*   shared/kids-kit.tsx                           useKidsSession().atBreak(), RestScreen, ParentGate, ShareToolLink
\*   shared/site-shell.tsx                         PageFrame: header, crumbs, related tools and footer links around the game
\* Two pieces stand for the seven. No blur, visibilitychange or keyup handler exists in the game, so "away" is one flag.
\* No sound loop and no speech: every sfx goes through tone(), which checks soundOn(), so sound is not modelled.
EXTENDS Naturals
CONSTANTS N
VARIABLES phase, placed, cheer, grip, finger, focused, resting, exit, dropped, lost, sent, stored
vars == <<phase, placed, cheer, grip, finger, focused, resting, exit, dropped, lost, sent, stored>>

Open == exit = "none" /\ ~resting /\ focused   \* the child can tap: still on the page, in front, no rest screen over it

Init == /\ phase = "play" /\ placed = 0 /\ cheer = FALSE /\ grip = FALSE /\ finger = FALSE /\ focused = TRUE
        /\ resting = FALSE /\ exit = "none" /\ dropped = FALSE /\ lost = FALSE /\ sent = FALSE /\ stored = FALSE

\* Board.down(): only the primary pointer, only when no drag is in flight (drag.current), never on a placed piece.
YouPressAPiece == /\ Open /\ phase = "play" /\ focused /\ ~grip /\ ~finger /\ placed < N
                  /\ grip' = TRUE /\ finger' = TRUE
                  /\ UNCHANGED <<phase, placed, cheer, focused, resting, exit, dropped, lost, sent, stored>>
\* Board.up() → onDrop → drop()/settle(): it clicks in. The last piece calls finish(): sfx.win() and a 1.2 s setTimeout.
YouDropItInPlace == /\ grip /\ finger /\ focused /\ placed < N
                    /\ placed' = placed + 1 /\ grip' = FALSE /\ finger' = FALSE
                    /\ cheer' = (placed + 1 = N)
                    /\ UNCHANGED <<phase, focused, resting, exit, dropped, lost, sent, stored>>
\* drop() → 'miss' | 'park' | 'home': the piece goes back or stays loose.
YouDropItWrong == /\ grip /\ finger /\ focused
                  /\ grip' = FALSE /\ finger' = FALSE
                  /\ UNCHANGED <<phase, placed, cheer, focused, resting, exit, dropped, lost, sent, stored>>
\* onPointerCancel={cancel}: the phone takes the touch away.
TouchIsCancelled == /\ grip /\ grip' = FALSE /\ finger' = FALSE
                    /\ UNCHANGED <<phase, placed, cheer, focused, resting, exit, dropped, lost, sent, stored>>
\* No blur handler: drag.current survives.
WindowBlurs == /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, placed, cheer, grip, finger, resting, exit, dropped, lost, sent, stored>>
\* The button or finger comes up while another window has it: Board.up() never runs.
YouLetGoAway == /\ finger /\ ~focused /\ finger' = FALSE
                /\ UNCHANGED <<phase, placed, cheer, grip, focused, resting, exit, dropped, lost, sent, stored>>
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, placed, cheer, grip, finger, resting, exit, dropped, lost, sent, stored>>
\* The title button (ছবি ৩/২২) or শেষ: setPhase('pick'). The Board unmounts, so the drag ref goes with it.
\* The finish() timer is not cleared.
YouOpenThePictures == /\ Open /\ phase \in {"play", "end"} /\ ~finger
                      /\ phase' = "pick" /\ grip' = FALSE
                      /\ UNCHANGED <<placed, cheer, finger, focused, resting, exit, dropped, lost, sent, stored>>
\* LevelGrid onPick={start}: clears the timer and starts that picture afresh with a new seed. There is no "back" button.
YouPickThisPicture == /\ Open /\ phase = "pick"
                      /\ lost' = (lost \/ (placed > 0 /\ placed < N))
                      /\ dropped' = (dropped \/ cheer)
                      /\ phase' = "play" /\ placed' = 0 /\ cheer' = FALSE
                      /\ UNCHANGED <<grip, finger, focused, resting, exit, sent, stored>>
YouPickAnotherPicture == /\ Open /\ phase = "pick"
                         /\ dropped' = (dropped \/ cheer)
                         /\ phase' = "play" /\ placed' = 0 /\ cheer' = FALSE
                         /\ UNCHANGED <<grip, finger, focused, resting, exit, lost, sent, stored>>
\* The finish() timer fires from whatever screen is up: record(), setPhase('end'), atBreak() (true once today's limit passed).
\* Stars go to localStorage (progress, allowed).
CheerEnds == /\ cheer
             /\ cheer' = FALSE /\ phase' = "end" /\ grip' = FALSE
             /\ resting' \in BOOLEAN
             /\ UNCHANGED <<placed, finger, focused, exit, dropped, lost, sent, stored>>
\* আবার খেলো: start(level % 22 + 1).
YouPlayAgain == /\ Open /\ phase = "end"
                /\ phase' = "play" /\ placed' = 0
                /\ UNCHANGED <<cheer, grip, finger, focused, resting, exit, dropped, lost, sent, stored>>
\* RestScreen → ParentGate → আজ আরও ১০ মিনিট: extend().
ParentGivesMoreTime == /\ resting /\ resting' = FALSE
                       /\ UNCHANGED <<phase, placed, cheer, grip, finger, focused, exit, dropped, lost, sent, stored>>
\* The bottom ParentGate (2 s hold, then a sum) → ShareToolLink: the plain address only.
ParentSharesTheLink == /\ Open /\ ~finger /\ exit' = "share"
                       /\ UNCHANGED <<phase, placed, cheer, grip, finger, focused, resting, dropped, lost, sent, stored>>
\* PageFrame's header, crumbs, "এগুলোও ভালো লাগতে পারে" cards and footer, and the print link: none is behind a gate.
YouTapALinkAroundTheGame == /\ Open /\ ~finger /\ exit' = "site"
                            /\ UNCHANGED <<phase, placed, cheer, grip, finger, focused, resting, dropped, lost, sent, stored>>
Done == exit # "none" /\ UNCHANGED vars

Next == YouPressAPiece \/ YouDropItInPlace \/ YouDropItWrong \/ TouchIsCancelled \/ WindowBlurs \/ YouLetGoAway \/ WindowFocuses
        \/ YouOpenThePictures \/ YouPickThisPicture \/ YouPickAnotherPicture \/ CheerEnds \/ YouPlayAgain
        \/ ParentGivesMoreTime \/ ParentSharesTheLink \/ YouTapALinkAroundTheGame \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "end", "pick"} /\ placed \in 0..N /\ cheer \in BOOLEAN /\ grip \in BOOLEAN /\ finger \in BOOLEAN
          /\ focused \in BOOLEAN /\ resting \in BOOLEAN /\ exit \in {"none", "share", "site"}
          /\ dropped \in BOOLEAN /\ lost \in BOOLEAN /\ sent \in BOOLEAN /\ stored \in BOOLEAN

\* What a child must tap to go on, per screen, and which of those carry a picture (not only words or numerals).
\* Ages 5–12 per the parent note, so the 3–5 rule covers the 5-year-olds.
Needed == CASE phase = "play" -> {"piece"}
          []   phase = "end"  -> {"again", "shesh"}        \* plain text buttons
          []   phase = "pick" -> {"numberTile"}            \* ১…২২ with stars; the names are a text line below
Pictured == {"piece", "flip", "sound"}

\* The reader's rules.
InputReleasedWhenAway == ~focused => ~grip
ChoiceFreezesPlay == phase = "pick" => ~cheer
FinishCounts == ~dropped
PickerKeepsWork == ~lost
RestOnlyAtBreak == resting => (phase = "end" /\ ~cheer)
ParentGate == exit # "site"
NoNetwork == ~sent
NoChildData == ~stored
NoReadingNeeded == Needed \subseteq Pictured
====
