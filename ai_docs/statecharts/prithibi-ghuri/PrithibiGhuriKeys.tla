---- MODULE PrithibiGhuriKeys ----
\* পৃথিবী ঘুরি: Enter and Space held down while the screens change. Mirrored from tools/prithibi-ghuri/components/game.tsx
\* (the keydown handler at window: turn(), onward(), begin()) and lib/session.ts (freshKey: !repeat && timeStamp > shownAt).
\* The old game had one পরেরটা button for every postcard and kept focus on it, so every auto-repeat keydown clicked it again
\* and the postcards flew past. Now keys go to the window, a repeat is ignored, and so is a press that began before the screen appeared.
\* Two postcards stand for five.
EXTENDS Naturals
CONSTANTS RepeatActs   \* the old behaviour: a repeating key acts. FALSE in the fixed code
VARIABLES screen, held, skippedCard, skippedResult, trips
vars == <<screen, held, skippedCard, skippedResult, trips>>

Init == screen = "card1" /\ held = FALSE /\ skippedCard = FALSE /\ skippedResult = FALSE /\ trips = 1

\* The thing a key press does on each screen.
After == CASE screen = "card1" -> "card2"
           [] screen = "card2" -> "ask"
           [] screen = "answered" -> "end"
           [] screen = "end" -> "card1"
           [] OTHER -> screen
Acts == screen \in {"card1", "card2", "answered", "end"} /\ ~(screen = "end" /\ trips = 2)

\* A fresh keydown: the child lets go of the key first, so only one press acts per press.
YouPressEnter == /\ ~held /\ held' = TRUE /\ Acts /\ screen' = After /\ trips' = (IF screen = "end" THEN trips + 1 ELSE trips)
                 /\ UNCHANGED <<skippedCard, skippedResult>>
\* A press on a screen with no key action (the question: keys 1–4 pick; the pictures need a tap).
YouPressEnterOnAQuestion == /\ ~held /\ ~Acts /\ held' = TRUE /\ UNCHANGED <<screen, skippedCard, skippedResult, trips>>
\* The held key repeats ~30 times a second. freshKey() ignores a repeat; the old game clicked the focused পরেরটা each time.
TheKeyRepeats == /\ RepeatActs /\ held /\ Acts /\ screen' = After /\ trips' = (IF screen = "end" THEN trips + 1 ELSE trips)
                 /\ skippedCard' = (skippedCard \/ screen \in {"card1", "card2"}) /\ skippedResult' = (skippedResult \/ screen \in {"answered", "end"})
                 /\ UNCHANGED held
YouLetGo == /\ held /\ held' = FALSE /\ UNCHANGED <<screen, skippedCard, skippedResult, trips>>
\* The child taps the right picture: the answer shows and ➜ waits.
YouTapTheRightPicture == /\ screen = "ask" /\ screen' = "answered" /\ UNCHANGED <<held, skippedCard, skippedResult, trips>>

Next == YouPressEnter \/ YouPressEnterOnAQuestion \/ TheKeyRepeats \/ YouLetGo \/ YouTapTheRightPicture

Spec == Init /\ [][Next]_vars

TypeOK == screen \in {"card1", "card2", "ask", "answered", "end"} /\ held \in BOOLEAN /\ skippedCard \in BOOLEAN /\ skippedResult \in BOOLEAN /\ trips \in 1..2

\* Bug 1: every postcard stays on screen until the child chooses to move on; a held key never flips past one.
PostcardsAreNotSkipped == ~skippedCard
\* A key held through an answer or the end screen never moves on or starts the next trip.
ResultNeedsFreshPress == ~skippedResult
====
