---- MODULE BaicherLink ----
\* বাইচের নৌকা: a friend's link and whose river the next race is. Mirrored from tools/baicher-nouka/components/river.tsx (the hashchange
\* handler, start(), pickLevel(), the end screen's choices) and tools/baicher-nouka/lib/session.ts (linkArrives, takeOwed).
\* Mid-race or mid-তাল মেলাও a link is only remembered (owed); every start that is not a race picked on purpose takes their river.
VARIABLES screen, owed, owedAtStart, river
vars == <<screen, owed, owedAtStart, river>>
Screens == {"title", "play", "calib", "over"}

Init == screen = "title" /\ owed = FALSE /\ owedAtStart = FALSE /\ river = "mine"
Rivers == IF owed THEN {"theirs"} ELSE {"mine", "theirs"}

\* start(), and the end screen's আবার খেলো / পরের বাইচ: takeOwed settles the debt, and the owed river wins.
YouStart == /\ screen \in {"title", "over"}
            /\ \E r \in Rivers : river' = r /\ owedAtStart' = owed
            /\ screen' = "play" /\ owed' = FALSE
\* pickLevel(): a race chosen on purpose settles any debt.
YouPickARace == /\ screen \in {"title", "over"} /\ \E r \in {"mine", "theirs"} : river' = r
                /\ screen' = "play" /\ owed' = FALSE /\ owedAtStart' = FALSE
YouFinish == /\ screen = "play" /\ screen' = "over" /\ UNCHANGED <<owed, owedAtStart, river>>
YouStartCalib == /\ screen = "title" /\ screen' = "calib" /\ UNCHANGED <<owed, owedAtStart, river>>
\* endCalib() / cancelCalib() back to the title: a link that arrived meanwhile is shown now (settleOwed).
CalibEnds == /\ screen = "calib" /\ screen' = "title" /\ owed' = FALSE /\ river' = (IF owed THEN "theirs" ELSE river) /\ UNCHANGED owedAtStart
\* hashchange: mid-race or mid-তাল মেলাও only remembered; elsewhere their race shows at once.
LinkOpens == IF screen \in {"play", "calib"}
               THEN owed' = TRUE /\ UNCHANGED <<screen, river, owedAtStart>>
               ELSE owed' = FALSE /\ screen' = "title" /\ river' = "theirs" /\ UNCHANGED owedAtStart

Next == YouStart \/ YouPickARace \/ YouFinish \/ YouStartCalib \/ CalibEnds \/ LinkOpens
Spec == Init /\ [][Next]_vars

TypeOK == screen \in Screens /\ owed \in BOOLEAN /\ owedAtStart \in BOOLEAN /\ river \in {"mine", "theirs"}
ReplayIsExact == (owedAtStart /\ screen \in {"play", "over"}) => river = "theirs"
OwedOnlyMidRace == owed => screen \in {"play", "calib", "over"}
====
