---- MODULE JuktobornoGates ----
\* যুক্তবর্ণ ভাঙি-জুড়ি after the rewrite: who has the phone, and the two parent gates.
\*   the share gate on the title: tools/juktoborno/components/game.tsx (<ParentGate key={gateKey}> holding ShareToolLink
\*     and the print link; any pointerdown outside it bumps gateKey, so a touch anywhere else in the game shuts it;
\*     starting a round unmounts the title and the gate with it)
\*   the rest screen's gate: shared/kids-kit.tsx RestScreen (আজ আরও ১০ মিনিট, the daily limit), shown by game.tsx on
\*     every screen but play
\*   ParentGate itself (kids-kit): a 2 s hold that ignores key auto-repeat, then a sum of 10–18 checked only after two
\*     digits; a wrong answer shuts it and rests the hold 10 s; open, it shuts after one action, after 20 s, and on hide.
\* The screen is abstracted to the title, play, and the other screens.
EXTENDS Naturals
VARIABLES screen, resting, holder, gate, opener, shares, restGate, restOpener, extendedBy
vars == <<screen, resting, holder, gate, opener, shares, restGate, restOpener, extendedBy>>

RestShows == resting /\ screen # "play"
Free == ~RestShows

Init == /\ screen = "title" /\ resting \in BOOLEAN /\ holder = "child"
        /\ gate = "closed" /\ opener = "none" /\ shares = 0 /\ restGate = "closed" /\ restOpener = "none" /\ extendedBy = "none"

\* Any touch on the game outside the open gate shuts it (and leaving the title unmounts it).
Shut == /\ gate' = "closed" /\ opener' = (IF gate = "open" THEN "none" ELSE opener)

\* The child plays: start a round (atBreak() may rest instead), finish one, go back to the title, open the level list.
YouStartARound == /\ screen \in {"title", "other"} /\ Free /\ Shut
                  /\ \/ (screen' = "play" /\ resting' = FALSE)
                     \/ (resting' = TRUE /\ UNCHANGED screen)
                  /\ UNCHANGED <<holder, shares, restGate, restOpener, extendedBy>>
TheRoundEnds == /\ screen = "play" /\ screen' = "other" /\ resting' \in BOOLEAN
                /\ UNCHANGED <<holder, gate, opener, shares, restGate, restOpener, extendedBy>>
YouGoToTheTitle == /\ screen # "title" /\ Free /\ screen' = "title" /\ Shut
                   /\ UNCHANGED <<resting, holder, shares, restGate, restOpener, extendedBy>>
YouOpenTheLevelList == /\ screen = "title" /\ Free /\ screen' = "other" /\ Shut
                       /\ UNCHANGED <<resting, holder, shares, restGate, restOpener, extendedBy>>
\* A reload: both gates start closed; useKidsSession rests if past the limit.
ThePageOpens == /\ screen' = "title" /\ resting' \in BOOLEAN /\ gate' = "closed" /\ opener' = "none" /\ restGate' = "closed" /\ restOpener' = "none"
                /\ UNCHANGED <<holder, shares, extendedBy>>

AParentTakesThePhone == /\ holder = "child" /\ holder' = "parent" /\ UNCHANGED <<screen, resting, gate, opener, shares, restGate, restOpener, extendedBy>>
TheChildTakesItBack == /\ holder = "parent" /\ holder' = "child" /\ UNCHANGED <<screen, resting, gate, opener, shares, restGate, restOpener, extendedBy>>

\* The share gate (on the title, under the factory).
AParentOpensTheGate == /\ screen = "title" /\ Free /\ holder = "parent" /\ gate = "closed" /\ gate' = "open" /\ opener' = "parent"
                       /\ UNCHANGED <<screen, resting, holder, shares, restGate, restOpener, extendedBy>>
\* A child's hold and mashing never gets a two-digit sum right before a wrong digit shuts it.
TheChildMashesTheGate == /\ screen = "title" /\ Free /\ holder = "child" /\ gate = "closed" /\ UNCHANGED vars
\* Its one action: the tool's plain address to the share sheet, or the print sheet. afterAction shuts it.
SomeoneUsesTheGate == /\ gate = "open" /\ shares < 2 /\ gate' = "closed" /\ opener' = "none" /\ shares' = shares + 1
                      /\ UNCHANGED <<screen, resting, holder, restGate, restOpener, extendedBy>>
TwentySecondsPass == /\ gate = "open" /\ gate' = "closed" /\ opener' = "none"
                     /\ UNCHANGED <<screen, resting, holder, shares, restGate, restOpener, extendedBy>>

\* The rest screen's gate.
AParentOpensTheRestGate == /\ RestShows /\ holder = "parent" /\ restGate = "closed" /\ restGate' = "open" /\ restOpener' = "parent"
                           /\ UNCHANGED <<screen, resting, holder, gate, opener, shares, extendedBy>>
TheChildMashesTheRestGate == /\ RestShows /\ holder = "child" /\ restGate = "closed" /\ UNCHANGED vars
TenMoreMinutes == /\ RestShows /\ restGate = "open" /\ resting' = FALSE /\ restGate' = "closed" /\ restOpener' = "none" /\ extendedBy' = restOpener
                  /\ UNCHANGED <<screen, holder, gate, opener, shares>>
TheRestGateShuts == /\ restGate = "open" /\ restGate' = "closed" /\ restOpener' = "none"
                    /\ UNCHANGED <<screen, resting, holder, gate, opener, shares, extendedBy>>

Next == YouStartARound \/ TheRoundEnds \/ YouGoToTheTitle \/ YouOpenTheLevelList \/ ThePageOpens
        \/ AParentTakesThePhone \/ TheChildTakesItBack
        \/ AParentOpensTheGate \/ TheChildMashesTheGate \/ SomeoneUsesTheGate \/ TwentySecondsPass
        \/ AParentOpensTheRestGate \/ TheChildMashesTheRestGate \/ TenMoreMinutes \/ TheRestGateShuts

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "other"} /\ resting \in BOOLEAN /\ holder \in {"child", "parent"}
          /\ gate \in {"closed", "open"} /\ opener \in {"none", "parent", "child"} /\ shares \in 0..2
          /\ restGate \in {"closed", "open"} /\ restOpener \in {"none", "parent", "child"} /\ extendedBy \in {"none", "parent", "child"}

\* Only a grown-up opens a parent gate.
GateNeedsAnAdult == opener # "child" /\ restOpener # "child"
\* The share gate exists only on the title: it never stays open into a round or another screen.
GateShutOutsideTheTitle == screen # "title" => gate = "closed"
\* The rest screen's gate exists only on the rest screen.
RestGateOnlyOnTheRestScreen == restGate = "open" => RestShows
\* Only a grown-up gives more time.
OnlyParentsGiveMoreTime == extendedBy # "child"
\* The rest screen never covers a word.
RestOnlyAtBreak == RestShows => screen # "play"
====
