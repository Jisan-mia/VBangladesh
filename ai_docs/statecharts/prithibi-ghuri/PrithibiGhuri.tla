---- MODULE PrithibiGhuri ----
\* পৃথিবী ঘুরি (ছোটদের জন্য, ৬–১২): one trip, its postcards and stamp question, a held Enter key, the daily limit and
\* rest screen, the parent gate under the game, and the related-tool cards under the page.
\* Mirrored from tools/prithibi-ghuri/components/ghuri-game.tsx (GhuriGame: fly, landed, nextCard, choose + its 700 ms
\* timer, afterStamp → finish, startTrip, the done screen's আবার খেলো / শেষ, LevelGrid onPick) and WorldMap's landing timer;
\* shared/kids-kit.tsx as of commits f4f75be and 23fd7c1 (useKidsSession:
\* the 10 s tick, atBreak, extend, the past-the-limit mount check; RestScreen, now a modal; ParentGate; ShareToolLink) and
\* shared/site-shell.tsx (PageFrame's "এগুলোও ভালো লাগতে পারে" cards).
\* Abstractions: one country stands in for a trip's three (the other two repeat the same loop), two postcards stand in
\* for five, and a wrong pick is left out (it changes nothing modelled). Left out: window focus and the tab (the game has no
\* clock; the flight is a 1.8 s animation that rAF freezes in a hidden tab), sound (one-shot sfx only, no loops), stars'
\* values (recordLevel keeps the higher, shared/tests/game-kit.test.ts).
EXTENDS Naturals
VARIABLES phase, card, focus, held, skipped, recorded, overLimit, resting, begun, gate
vars == <<phase, card, focus, held, skipped, recorded, overLimit, resting, begun, gate>>

Phases == {"map", "fly", "visit", "ask", "solved", "stamp", "done", "idle", "adultPage"}
\* The RestScreen is a real modal (f4f75be): window-capture listeners drop every key, tap and focus outside it.
Free == ~resting /\ phase # "adultPage"

\* startTrip(level): a fresh trip; the round starts late if today's time ran out before it.
Fresh == /\ phase' = "map" /\ card' = 0 /\ skipped' = FALSE /\ recorded' = 0 /\ held' = FALSE
         /\ begun' = (IF overLimit THEN "late" ELSE "inTime")

Init == /\ phase = "map" /\ card = 0 /\ focus = "body" /\ held = FALSE /\ skipped = FALSE /\ recorded = 0
        /\ overLimit = FALSE /\ resting = FALSE /\ begun = "inTime" /\ gate = "closed"

\* fly(country): only from the map; the country buttons are disabled while flying.
YouTapACountry == /\ phase = "map" /\ Free
                  /\ phase' = "fly" /\ focus' = "body" /\ held' = FALSE
                  /\ UNCHANGED <<card, skipped, recorded, overLimit, resting, begun, gate>>
\* WorldMap's effect: the plane reaches the end (or 500 ms in slow mode), then landed() → phase "visit", card 0.
ThePlaneLands == /\ phase = "fly"
                 /\ phase' = "visit" /\ card' = 0
                 /\ UNCHANGED <<focus, held, skipped, recorded, overLimit, resting, begun, gate>>
\* nextCard(): the next postcard, or after the last one the stamp question. The পরেরটা button is one element for
\* every card, so it keeps focus; in "ask" it is gone and focus falls to the page.
Next1 == IF card < 1 THEN card' = card + 1 /\ phase' = "visit" /\ focus' = "next"
                     ELSE card' = card /\ phase' = "ask" /\ focus' = "body"
YouPressNext == /\ phase = "visit" /\ Free /\ ~held
                /\ Next1
                /\ UNCHANGED <<held, skipped, recorded, overLimit, resting, begun, gate>>
\* A keyboard Enter held down on পরেরটা: the first keydown clicks it ...
YouHoldEnterOnNext == /\ phase = "visit" /\ Free /\ ~held
                      /\ held' = TRUE /\ Next1
                      /\ UNCHANGED <<skipped, recorded, overLimit, resting, begun, gate>>
\* ... and every auto-repeat keydown clicks the focused button again, before the child has seen the new card.
TheKeyRepeats == /\ held /\ focus = "next" /\ phase = "visit" /\ Free
                 /\ Next1 /\ skipped' = TRUE
                 /\ UNCHANGED <<held, recorded, overLimit, resting, begun, gate>>
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, card, focus, skipped, recorded, overLimit, resting, begun, gate>>
\* choose(right picture): solved, then a 700 ms timer → the stamp page.
YouTapTheRightPicture == /\ phase = "ask" /\ Free
                         /\ phase' = "solved"
                         /\ UNCHANGED <<card, focus, held, skipped, recorded, overLimit, resting, begun, gate>>
TheStampComes == /\ phase = "solved"
                 /\ phase' = "stamp"
                 /\ UNCHANGED <<card, focus, held, skipped, recorded, overLimit, resting, begun, gate>>
\* afterStamp() on the last country → finish(): levels.record, the chime, setPhase("done"), atBreak().
\* The stamp page's button unmounts, so a held Enter lands on the page, not on the done screen's buttons.
YouFinishTheTrip == /\ phase = "stamp" /\ Free
                    /\ phase' = "done" /\ recorded' = recorded + 1 /\ resting' = overLimit /\ focus' = "body"
                    /\ UNCHANGED <<card, held, skipped, overLimit, begun, gate>>
\* The done screen: আবার খেলো → startTrip(level); শেষ → idle.
YouPlayAgain == /\ phase = "done" /\ Free /\ Fresh /\ focus' = "body"
                /\ UNCHANGED <<overLimit, resting, gate>>
YouPressShesh == /\ phase = "done" /\ Free /\ phase' = "idle"
                 /\ UNCHANGED <<card, focus, held, skipped, recorded, overLimit, resting, begun, gate>>
\* The trip grid under the game, in any phase: startTrip(n). Mid-trip it drops the trip without asking.
YouPickATrip == /\ Free /\ Fresh /\ focus' = "body"
                /\ UNCHANGED <<overLimit, resting, gate>>
\* useKidsSession's 10 s tick pushes today's play time past the limit, in any phase.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, card, focus, held, skipped, recorded, resting, begun, gate>>
\* RestScreen's gate → আজ আরও ১০ মিনিট → extend(10): resting off; the rest screen and its gate go away.
AParentGivesTenMinutes == /\ resting
                          /\ resting' = FALSE /\ overLimit' = FALSE
                          /\ UNCHANGED <<phase, card, focus, held, skipped, recorded, begun, gate>>
\* The gate under the game: a parent holds it 2 s, answers the sum, and hands the phone back without tapping
\* anything inside or বন্ধ করো. (Tapping the share link inside shuts it at once; 23fd7c1.)
AParentUsesTheGate == /\ Free /\ gate = "closed" /\ gate' = "parent"
                      /\ UNCHANGED <<phase, card, focus, held, skipped, recorded, overLimit, resting, begun>>
\* A child holds it 2 s and mashes the pad. Since f4f75be the sum is 10–18 and two misses close it, so one hold opens
\* it about 2 times in 100; a child who keeps holding and tapping gets in after a few dozen tries.
TheChildMashesTheGate == /\ Free /\ gate = "closed" /\ gate' = "child"
                         /\ UNCHANGED <<phase, card, focus, held, skipped, recorded, overLimit, resting, begun>>
\* বন্ধ করো, or the gate's own 60 s timer, or the tab hiding (f4f75be).
SomeoneClosesTheGate == /\ gate # "closed" /\ gate' = "closed"
                        /\ UNCHANGED <<phase, card, focus, held, skipped, recorded, overLimit, resting, begun>>
\* PageFrame's related cards sit under the game, ungated; the first is always the flagship আমার ছোটবেলা,
\* a grown-up's tool with share buttons. The child leaves; this page's state is gone.
YouTapTheFlagshipCard == /\ Free
                         /\ phase' = "adultPage" /\ card' = 0 /\ focus' = "body" /\ held' = FALSE /\ skipped' = FALSE
                         /\ recorded' = 0 /\ resting' = FALSE /\ gate' = "closed"
                         /\ UNCHANGED <<overLimit, begun>>
\* A reload, or coming back from another page: a fresh GhuriGame. Past today's limit it opens on the rest screen
\* (useKidsSession's mount effect, 23fd7c1).
ThePageOpens == /\ Fresh /\ focus' = "body" /\ resting' = overLimit /\ gate' = "closed"
                /\ UNCHANGED <<overLimit>>

Next == YouTapACountry \/ ThePlaneLands \/ YouPressNext \/ YouHoldEnterOnNext \/ TheKeyRepeats \/ YouLetGo
        \/ YouTapTheRightPicture \/ TheStampComes \/ YouFinishTheTrip \/ YouPlayAgain \/ YouPressShesh \/ YouPickATrip
        \/ TimeIsUp \/ AParentGivesTenMinutes
        \/ AParentUsesTheGate \/ TheChildMashesTheGate \/ SomeoneClosesTheGate \/ YouTapTheFlagshipCard \/ ThePageOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ card \in 0..1 /\ focus \in {"body", "next"} /\ held \in BOOLEAN /\ skipped \in BOOLEAN
          /\ recorded \in 0..2 /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ gate \in {"closed", "parent", "child"}

\* The reader's rules.
\* Every postcard is on screen until the child chooses to move on; a held key never flips past one.
PostcardsAreNotSkipped == ~skipped
\* A key held through the trip's end never acts on the done screen (pattern from other games).
HeldKeyNeverActsOnTheCard == ~(held /\ phase = "done" /\ focus # "body")
\* A trip is recorded once.
NoDoubleResult == recorded <= 1
\* The rest screen comes only between trips, never over a flight, a postcard or a question. The map before any country
\* is tapped is between trips (here one country stands for the trip; in the game the map also shows between countries,
\* and resting is never set there).
RestOnlyAtBreak == resting => phase \in {"map", "done", "idle"}
\* Once today's time is up, no new trip starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Only a grown-up opens the parent gate.
GateNeedsAnAdult == gate # "child"
\* When the parent hands the phone back, the share link is behind a closed gate again.
GateClosesBehindTheParent == gate # "parent"
\* No path out of the kids' section to a grown-up tool with share buttons without the gate.
NoOutboundForKids == phase # "adultPage"
====
