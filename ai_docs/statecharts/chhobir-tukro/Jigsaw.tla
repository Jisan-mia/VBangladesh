---- MODULE Jigsaw ----
\* ছবির টুকরো: the round and its clock, the window, a piece in your hand, the win sound and confetti
\* timeouts, and which levels are open. Mirrored from tools/chhobir-tukro/components/jigsaw-game.tsx
\* (wake, finish, settle, onDown/onMove/onUp/onCancel, goLevel, the visibilitychange `hide`, readFriend,
\* the window keydown handler) and tools/chhobir-tukro/lib/game.ts, shared/game-core.ts (unlockedLevel).
\* Abstractions: 2 levels; a painting needs one more piece (placing it finishes the round); stars are
\* "cleared or not" (recordLevel keeps the max, which is pure and tested).
EXTENDS Naturals, FiniteSets
CONSTANT Count                     \* levels in the model (the game has 30)
VARIABLES phase, clock, visible, focused, hand, level, cleared, cheer
vars == <<phase, clock, visible, focused, hand, level, cleared, cheer>>

Levels == 1..Count
Max(S) == CHOOSE x \in S : \A y \in S : y <= x
Min2(a, b) == IF a < b THEN a ELSE b
\* shared/game-core.ts unlockedLevel: min(count, 1 + the highest level with stars).
Unlocked == Min2(Count, 1 + Max(cleared \cup {0}))
\* What the player has earned: one past the unbroken run of cleared levels from 1.
Run == Max({k \in 0..Count : \A j \in 1..k : j \in cleared})
Earned == Min2(Count, 1 + Run)

Init == /\ phase = "ready" /\ clock = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hand = "none" /\ level = 1 /\ cleared = {} /\ cheer = FALSE

\* goLevel(next): a fresh table, clock at zero, grab cleared. It does not touch the finish() timeouts.
Fresh(next) == /\ level' = next /\ phase' = "ready" /\ clock' = FALSE /\ hand' = "none"
               /\ UNCHANGED <<visible, focused, cleared, cheer>>

\* tapPiece → wake(): the clock starts on the first touch of a piece (a click also focuses the window).
YouTouchAPiece == /\ phase = "ready" /\ visible
                  /\ phase' = "playing" /\ clock' = TRUE /\ focused' = TRUE
                  /\ UNCHANGED <<visible, hand, level, cleared, cheer>>
\* onDown on a tray piece, then onMove past 8px: wake() and the piece follows the finger. onDown refuses paused and done.
YouPickUpAPiece == /\ phase \in {"ready", "playing"} /\ visible /\ hand = "none"
                   /\ hand' = "drag" /\ phase' = "playing" /\ clock' = TRUE /\ focused' = TRUE
                   /\ UNCHANGED <<visible, level, cleared, cheer>>
\* onUp → settle(): "wrong", "turn" or "away" glide the piece back. pointerup reaches the page only while it has focus.
YouDropItWrong == /\ hand = "drag" /\ focused
                  /\ hand' = "none"
                  /\ UNCHANGED <<phase, clock, visible, focused, level, cleared, cheer>>
\* settle() → "snap" on the last piece (by drop, or by tapping its cell) → finish(): stopClock, record the stars,
\* setTimeout(finished, 250) and setTimeout(confetti, 900), neither id kept.
\* (~cheer: no painting is finished within 900 ms of the last one, so the old timeouts have fired by then.)
YouPlaceTheLastPiece == /\ phase = "playing" /\ focused /\ ~cheer
                        /\ phase' = "done" /\ clock' = FALSE /\ hand' = "none"
                        /\ cleared' = cleared \cup {level} /\ cheer' = TRUE
                        /\ UNCHANGED <<visible, focused, level>>
\* There is no blur listener.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, clock, visible, hand, level, cleared, cheer>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, clock, visible, hand, level, cleared, cheer>>
\* hide(): only when React's phase is "playing": stopClock(), onCancel() (drops the grab), phase "paused".
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ IF phase = "playing"
                 THEN /\ phase' = "paused" /\ clock' = FALSE /\ hand' = "none"
                 ELSE UNCHANGED <<phase, clock, hand>>
            /\ UNCHANGED <<level, cleared, cheer>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, clock, hand, level, cleared, cheer>>
\* The veil's চালিয়ে যাও, Enter/Space, or touching a piece by keyboard: wake() from paused.
YouResume == /\ phase = "paused" /\ visible
             /\ phase' = "playing" /\ clock' = TRUE /\ focused' = TRUE
             /\ UNCHANGED <<visible, hand, level, cleared, cheer>>
\* The 250 ms win sound and the 900 ms confetti go off, whatever is on screen by then.
CheerFires == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, clock, visible, focused, hand, level, cleared>>
\* পরের লেভেল, or Enter on the result: goLevel(level + 1).
YouPressNextLevel == /\ phase = "done" /\ visible /\ level < Count /\ Fresh(level + 1)
\* আবার খেলো: goLevel(level).
YouPlayAgain == /\ phase = "done" /\ visible /\ Fresh(level)
\* The সব লেভেল drawer: any open level, at any time.
YouPickALevel == /\ visible /\ \E l \in 1..Unlocked : Fresh(l)
\* readFriend(): a valid #s=…&l=L link opens level L, locked or not (load or hashchange).
FriendLinkOpens == /\ phase = "ready" /\ visible /\ \E l \in Levels : Fresh(l)

Next == YouTouchAPiece \/ YouPickUpAPiece \/ YouDropItWrong \/ YouPlaceTheLastPiece
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouResume \/ CheerFires
        \/ YouPressNextLevel \/ YouPlayAgain \/ YouPickALevel \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "done"} /\ clock \in BOOLEAN
          /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ hand \in {"none", "drag"}
          /\ level \in Levels /\ cleared \subseteq Levels /\ cheer \in BOOLEAN

\* The reader's rules.
ClockStillWhileAway == clock => (visible /\ focused)                       \* NoProgressWhileAway
PausedWhenHidden == ~visible => phase # "playing"
PausedWhenBlurred == ~focused => phase # "playing"
PieceDroppedWhenAway == hand = "drag" => (visible /\ focused)               \* InputReleasedWhenAway
PausedMeansFrozen == phase = "paused" => (~clock /\ hand = "none")
ClockMeansPlaying == clock <=> phase = "playing"
CheerOnlyOnTheResult == cheer => phase = "done"
OpenLevelsAreEarned == Unlocked <= Earned                                  \* UnlockNeverShrinks' twin: never more than earned
====
