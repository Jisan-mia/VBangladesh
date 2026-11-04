---- MODULE OjogorKids ----
\* অ-তে অজগর at HEAD 6775639 against the kids' rules (research/kids/kids-brief.md §2–3). The page is a kids' page
\* (tools/o-te-ojogor/page.tsx: <GamePage kids note={<ParentNote age="৪–৮ বছর" …/>}>), but the game inside is unchanged:
\* tools/o-te-ojogor/components/ojogor-game.tsx (begin, finish, retry, nextLevel, the name field, ShareBar)
\* and shared/share-kit.tsx + shared/share-client.ts (ShareBar: শেয়ার করো and লিংক কপি করো call shareLink(),
\* which POSTs the card state, name included, to /api/share; ছবি ডাউনলোড করো saves the card).
\* From shared/kids-kit.tsx the page uses only ParentNote: no useKidsSession, no RestScreen, no ParentGate, no ShowParent.
\* So "resting" (the RestScreen) exists in the model only for the rules to ask about; no action of this game sets it.
\* "overLimit" is the kids' section's shared daily limit (ektukhani-kids-time), run up in any other kids' game.
\* The play-phase details (pause, focus, keys, levels) are in Ojogor.tla.
EXTENDS Naturals
VARIABLES phase, overLimit, resting, holder, named, sent, begun
vars == <<phase, overLimit, resting, holder, named, sent, begun>>
\* ShareBar renders under the card as soon as a level is done (`shared` is set), with no gate around it.
ShareShown == phase = "won"

Init == /\ phase = "ready" /\ overLimit = FALSE /\ resting = FALSE /\ holder = "child"
        /\ named = FALSE /\ sent = "nothing" /\ begun = "inTime"
\* A round begins: there's no atBreak() and no rest screen to come first.
Begins == begun' = (IF overLimit /\ ~resting THEN "late" ELSE "inTime")

\* শুরু করো: begin().
YouPressStart == /\ phase = "ready" /\ phase' = "play" /\ Begins
                 /\ UNCHANGED <<overLimit, resting, holder, named, sent>>
\* The last right letter lands → finish(): stars, the card, ShareBar and the name field under it. No atBreak().
TheLevelEnds == /\ phase = "play" /\ phase' = "won"
                /\ UNCHANGED <<overLimit, resting, holder, named, sent, begun>>
\* আবার খেলো: retry() starts the same level at once.
YouPlayAgain == /\ phase = "won" /\ phase' = "play" /\ Begins
                /\ UNCHANGED <<overLimit, resting, holder, named, sent>>
\* পরের লেভেল (or Space / Enter): nextLevel() → the next start screen.
YouGoToTheNextLevel == /\ phase = "won" /\ phase' = "ready"
                       /\ UNCHANGED <<overLimit, resting, holder, named, sent, begun>>
\* "তোমার নাম: কার্ডে বসবে" — a free-text field under the card, open to whoever holds the phone. The name stays for later levels.
SomeoneTypesAName == /\ phase = "won" /\ ~named /\ named' = TRUE
                     /\ UNCHANGED <<phase, overLimit, resting, holder, sent, begun>>
\* শেয়ার করো or লিংক কপি করো: shareLink() POSTs {tool, state} (level, seed, errors, name) to /api/share.
SomeoneSharesTheCard == /\ phase = "won"
                        /\ sent' = (IF named \/ sent = "name" THEN "name" ELSE "card")
                        /\ UNCHANGED <<phase, overLimit, resting, holder, named, begun>>
\* The kids' section's daily limit passes (time counted by the other kids' games; this one counts nothing).
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, resting, holder, named, sent, begun>>
AParentTakesThePhone == /\ holder = "child" /\ holder' = "parent"
                        /\ UNCHANGED <<phase, overLimit, resting, named, sent, begun>>
TheChildTakesItBack == /\ holder = "parent" /\ holder' = "child"
                       /\ UNCHANGED <<phase, overLimit, resting, named, sent, begun>>

Next == YouPressStart \/ TheLevelEnds \/ YouPlayAgain \/ YouGoToTheNextLevel \/ SomeoneTypesAName \/ SomeoneSharesTheCard
        \/ TimeIsUp \/ AParentTakesThePhone \/ TheChildTakesItBack

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "play", "won"} /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN
          /\ holder \in {"child", "parent"} /\ named \in BOOLEAN
          /\ sent \in {"nothing", "card", "name"} /\ begun \in {"inTime", "late"}

\* The reader's rules.
\* At the end of a level past today's limit, the rest screen shows.
RestAtTheBreak == (phase = "won" /\ overLimit) => resting
\* The rest screen comes only between rounds.
RestOnlyAtBreak == resting => phase # "play"
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* While the child has the phone, no share button is in front of them (sharing is behind a parent gate).
NoShareForKids == holder = "child" => ~ShareShown
\* There is no name field for the child.
NoNameField == ~named
\* Nothing about the child leaves the phone.
NoChildDataLeaves == sent # "name"
\* No network calls after the page loads (no /api/*).
NoNetworkCalls == sent = "nothing"
====
