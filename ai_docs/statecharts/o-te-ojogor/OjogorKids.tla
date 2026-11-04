---- MODULE OjogorKids ----
\* অ-তে অজগর after the rewrite, against the kids' rules (research/kids/kids-brief.md §2–3). Mirrored from
\* tools/o-te-ojogor/components/tree-game.tsx (begin / playAgain call atBreak() before a round; finish calls it the moment
\* the round is won; ShowParentButton → ShowParent with the name-free card; <ParentGate><ShareToolLink/></ParentGate>),
\* tools/o-te-ojogor/lib/session.ts (start, finish, again, home), tools/o-te-ojogor/share.ts (normalize → null) and
\* shared/kids-kit.tsx (useKidsSession: rest on open past the limit, atBreak, extend; RestScreen; ParentGate: a 2 s hold and a
\* sum, shuts after one action, after a minute, or when the page hides; ShareToolLink shares location.origin + pathname).
\* There is no name field and no ShareBar any more: no action of this game can type a name or call /api/*.
EXTENDS Naturals
VARIABLES phase, overLimit, resting, holder, gate, sent, begun
vars == <<phase, overLimit, resting, holder, gate, sent, begun>>

Init == /\ phase = "title" /\ overLimit = FALSE /\ resting = FALSE /\ holder = "child" /\ gate = "closed"
        /\ sent = "nothing" /\ begun = "inTime"

\* খেলো: start(atBreak()): past the limit the rest screen comes instead of a round.
YouPressStart == /\ phase = "title" /\ ~resting
                 /\ IF overLimit THEN resting' = TRUE /\ UNCHANGED <<phase, begun>>
                    ELSE phase' = "play" /\ begun' = "inTime" /\ UNCHANGED resting
                 /\ UNCHANGED <<overLimit, holder, gate, sent>>
\* The last right letter lands → finish(…, atBreak()): the rest screen covers the end screen once time is up.
TheLevelEnds == /\ phase = "play" /\ phase' = "done" /\ resting' = overLimit
                /\ UNCHANGED <<overLimit, holder, gate, sent, begun>>
\* আবার খেলো: again(…, atBreak()).
YouPlayAgain == /\ phase = "done" /\ ~resting
                /\ IF overLimit THEN resting' = TRUE /\ UNCHANGED <<phase, begun>>
                   ELSE phase' = "play" /\ begun' = "inTime" /\ UNCHANGED resting
                /\ UNCHANGED <<overLimit, holder, gate, sent>>
\* শেষ: home(); nothing starts.
YouFinishUp == phase = "done" /\ ~resting /\ phase' = "title" /\ UNCHANGED <<overLimit, resting, holder, gate, sent, begun>>
\* Opening the page again: the kit starts on the rest screen past today's limit.
ThePageOpens == phase' = "title" /\ resting' = overLimit /\ gate' = "closed" /\ UNCHANGED <<overLimit, holder, sent, begun>>
\* The section's daily limit passes (time counted by every kids' game, this one included). Between rounds the game asks
\* atBreak() every second, so on the title or the end screen the rest screen comes within a second (modelled as at once).
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ resting' = (resting \/ phase # "play")
            /\ UNCHANGED <<phase, holder, gate, sent, begun>>
\* Behind the gate on the rest screen: আজ আরও ১০ মিনিট → extend().
AParentGivesMoreTime == /\ resting /\ gate = "open" /\ resting' = FALSE /\ overLimit' = FALSE /\ gate' = "closed"
                        /\ UNCHANGED <<phase, holder, sent, begun>>
AParentTakesThePhone == holder = "child" /\ holder' = "parent" /\ UNCHANGED <<phase, overLimit, resting, gate, sent, begun>>
\* The gate shuts by itself after a minute or when the page hides, so a phone handed back is locked again.
TheChildTakesItBack == holder = "parent" /\ holder' = "child" /\ gate' = "closed" /\ UNCHANGED <<phase, overLimit, resting, sent, begun>>
\* A 2-second hold and a sum in words: only the grown-up opens it.
AParentOpensTheGate == holder = "parent" /\ gate = "closed" /\ gate' = "open" /\ UNCHANGED <<phase, overLimit, resting, holder, sent, begun>>
\* খেলাটার লিংক পাঠাও (on the end screen's ShowParent): the tool's plain address through the phone's share sheet. One action, then the gate shuts.
AParentSharesTheLink == /\ gate = "open" /\ phase = "done" /\ sent' = "address" /\ gate' = "closed"
                        /\ UNCHANGED <<phase, overLimit, resting, holder, begun>>

Next == YouPressStart \/ TheLevelEnds \/ YouPlayAgain \/ YouFinishUp \/ ThePageOpens \/ TimeIsUp \/ AParentGivesMoreTime
        \/ AParentTakesThePhone \/ TheChildTakesItBack \/ AParentOpensTheGate \/ AParentSharesTheLink

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "play", "done"} /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN
          /\ holder \in {"child", "parent"} /\ gate \in {"closed", "open"}
          /\ sent \in {"nothing", "address", "card", "name"} /\ begun \in {"inTime", "late"}

\* The reader's rules (the same as before the fix).
\* At the end of a level past today's limit, the rest screen shows.
RestAtTheBreak == (phase = "done" /\ overLimit) => resting
\* The rest screen comes only between rounds.
RestOnlyAtBreak == resting => phase # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* While the child has the phone, no share button is in front of them (sharing is behind a parent gate).
NoShareForKids == holder = "child" => gate = "closed"
\* There is no name field for the child (no action types one).
NoNameField == sent # "name"
\* Nothing about the child leaves the phone: at most the tool's own address.
NoChildDataLeaves == sent \in {"nothing", "address"}
\* No network calls after the page loads: the address goes through the phone's share sheet, never to /api/*.
NoNetworkCalls == sent # "card" /\ sent # "name"
====
