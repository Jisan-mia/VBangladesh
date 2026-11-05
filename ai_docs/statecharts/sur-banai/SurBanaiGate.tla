---- MODULE SurBanaiGate ----
\* সুর বানাই: the parent gate and leaving the game. Mirrored from shared/kids-kit.tsx (ParentGate: a 2-second hold, a sum on
\* a pad, closes after one action, 20 seconds or leaving; key repeat and a second finger are ignored since f4f75be) and
\* shared/game-player.tsx (GamePage kids: the rails, the grid, the header and the footer link only to other kids' tools).
\* The gate shares no variable with the game, so it is explored from the title with nothing playing.

VARIABLES gate, page, held
vars == <<gate, page, held>>

Init == gate = "shut" /\ page = "game" /\ held = FALSE   \* held: the 2-second hold was completed for this opening

\* onPointerDown / onKeyDown Enter → start(): hold.current = setTimeout(open the sum, 2000). A second start returns while a
\* timer is set, and Enter's repeat is ignored, so no second timer can be armed.
YouHoldTheGate == /\ gate = "shut" /\ page = "game" /\ gate' = "holding" /\ UNCHANGED <<page, held>>
\* onPointerUp / onPointerLeave / onKeyUp / onBlur → stop(): clears the one timer.
YouLetGo == /\ gate = "holding" /\ gate' = "shut" /\ UNCHANGED <<page, held>>
\* The timer fires: the sum opens.
TwoSecondsPass == /\ gate = "holding" /\ gate' = "asks" /\ held' = TRUE /\ UNCHANGED page
\* A right sum opens the grown-up buttons: ShareToolLink (the tool's plain address, never a tune) and the clear-kept-tunes button.
GrownUpAnswers == /\ gate = "asks" /\ gate' = "open" /\ UNCHANGED <<page, held>>
\* ShareToolLink: shares the plain address. One action, then the gate shuts again (afterAction).
GrownUpShares == /\ gate = "open" /\ gate' = "shut" /\ held' = FALSE /\ UNCHANGED page
\* A wrong sum, or 20 seconds: the gate closes.
GrownUpClosesGate == /\ gate \in {"asks", "open"} /\ gate' = "shut" /\ held' = FALSE /\ UNCHANGED page
\* A card under the player: only kids' tools and ছোটদের খেলাঘর. There is no card to a grown-up page any more.
YouTapAKidsToolCard == /\ gate = "shut" /\ page = "game" /\ page' = "kids" /\ UNCHANGED <<gate, held>>
Done == page = "kids" /\ UNCHANGED vars

Next == YouHoldTheGate \/ YouLetGo \/ TwoSecondsPass \/ GrownUpAnswers \/ GrownUpShares \/ GrownUpClosesGate \/ YouTapAKidsToolCard \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ gate \in {"shut", "holding", "asks", "open"} /\ page \in {"game", "kids", "adult"} /\ held \in BOOLEAN

\* Nothing sends the child to a grown-up page (NoWayOutWithoutGate). Was bug 7.
NoWayOutWithoutGate == page # "adult"
\* The gate's question, and everything behind it (the plain-address share, clearing kept tunes), opens only after the 2-second
\* hold was completed: no timer survives letting go (HoldMeansHold, NoShareForKids).
HoldMeansHold == gate \in {"asks", "open"} => held
====
