---- MODULE MonerRongKids ----
\* মনের রং after the rewrite, against the kids' rules (research/kids/kids-brief.md §2–3) and the no-voice rule. Mirrored from
\* tools/moner-rong/components/game.tsx (begin calls atBreak() before a round; finish() calls it at the winning tap, the last
\* picture's kind thing; ShowParentButton → ShowParent with the name-free card; <ParentGate><ShareToolLink/></ParentGate> inside
\* it; showRest only once the stage is on screen), tools/moner-rong/share.ts (normalize → null, no tally) and shared/kids-kit.tsx
\* (useKidsSession; RestScreen; ParentGate: a 2 s hold, key repeat never counts, a two-digit sum, a wrong answer rests it 10 s,
\* shut after one action, after 20 s or when the page hides; ShareToolLink shares location.origin + pathname).
\* No action of this game can speak: speak(), SpeakButton and speechSynthesis are gone (tests/moner-rong.test.ts greps for them).
\* There is no name field and no fetch: nothing a child types or does can be sent, and no link in the child's view goes outside
\* the kids' area (GamePage kids mode).
\* "stage": the phone's launch card hides the game until খেলো, and the rest screen mounts only on a visible stage.
EXTENDS Naturals
VARIABLES phase, stage, overLimit, resting, holder, gate, sent, sound, talk, begun, dead
vars == <<phase, stage, overLimit, resting, holder, gate, sent, sound, talk, begun, dead>>

RestShows == resting /\ phase # "play" /\ stage = "shown"

Init == /\ phase = "title" /\ stage = "hidden" /\ overLimit = FALSE /\ resting = FALSE /\ holder = "child"
        /\ gate = "closed" /\ sent = "nothing" /\ sound = TRUE /\ talk = FALSE /\ begun = "inTime" /\ dead = FALSE

\* The launch card's খেলো (the player). Before the fix the rest screen, mounted in the hidden stage, swallowed this tap.
\* Mounted: where the RestScreen (and its window-wide tap blocker) is in the page. Before the fix it was
\* resting /\ phase # "play", whatever the stage; now it is RestShows (stage shown).
Mounted == RestShows
YouOpenThePlayer == /\ stage = "hidden"
                    /\ IF Mounted THEN dead' = TRUE /\ UNCHANGED stage ELSE stage' = "shown" /\ UNCHANGED dead
                    /\ UNCHANGED <<phase, overLimit, resting, holder, gate, sent, sound, talk, begun>>
\* Back, swipe-back or বের হও: the launch card again.
YouLeaveThePlayer == /\ stage = "shown" /\ stage' = "hidden"
                     /\ UNCHANGED <<phase, overLimit, resting, holder, gate, sent, sound, talk, begun, dead>>
\* খেলো in the game: begin(session, atBreak()).
YouPressStart == /\ stage = "shown" /\ phase \in {"title", "done"} /\ ~RestShows
                 /\ IF overLimit THEN resting' = TRUE /\ UNCHANGED <<phase, begun>>
                    ELSE phase' = "play" /\ begun' = "inTime" /\ UNCHANGED resting
                 /\ UNCHANGED <<stage, overLimit, holder, gate, sent, sound, talk, dead>>
\* The last picture's kind thing is chosen: finish() → won(session, atBreak()); the end screen follows on →.
ThePageFills == /\ phase = "play" /\ phase' = "done" /\ resting' = overLimit
                /\ UNCHANGED <<stage, overLimit, holder, gate, sent, sound, talk, begun, dead>>
\* শেষ or নতুন করে শুরু: a title; nothing starts.
YouGoToTheTitle == /\ phase # "title" /\ ~RestShows /\ phase' = "title" /\ resting' = (resting \/ overLimit)
                   /\ UNCHANGED <<stage, overLimit, holder, gate, sent, sound, talk, begun, dead>>
ThePageOpens == /\ phase' = "title" /\ stage' = "hidden" /\ resting' = overLimit /\ gate' = "closed"
                /\ UNCHANGED <<overLimit, holder, sent, sound, talk, begun, dead>>
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ resting' = (resting \/ phase # "play")
            /\ UNCHANGED <<phase, stage, holder, gate, sent, sound, talk, begun, dead>>
AParentGivesMoreTime == /\ RestShows /\ gate = "open" /\ resting' = FALSE /\ overLimit' = FALSE /\ gate' = "closed"
                        /\ UNCHANGED <<phase, stage, holder, sent, sound, talk, begun, dead>>
AParentTakesThePhone == holder = "child" /\ holder' = "parent" /\ UNCHANGED <<phase, stage, overLimit, resting, gate, sent, sound, talk, begun, dead>>
TheChildTakesItBack == holder = "parent" /\ holder' = "child" /\ gate' = "closed" /\ UNCHANGED <<phase, stage, overLimit, resting, sent, sound, talk, begun, dead>>
AParentOpensTheGate == /\ holder = "parent" /\ gate = "closed" /\ (RestShows \/ phase = "done") /\ gate' = "open"
                       /\ UNCHANGED <<phase, stage, overLimit, resting, holder, sent, sound, talk, begun, dead>>
\* খেলাটার লিংক পাঠাও inside আব্বু-আম্মুকে দেখাও: the plain address only; then the gate shuts.
AParentSharesTheLink == /\ gate = "open" /\ phase = "done" /\ ~RestShows /\ sent' = "address" /\ gate' = "closed"
                        /\ UNCHANGED <<phase, stage, overLimit, resting, holder, sound, talk, begun, dead>>
\* The site-wide sound switch (the player's menu). Off also cuts scheduled notes (silenceScheduled).
SoundSwitch == /\ sound' = ~sound /\ talk' = (talk /\ sound')
               /\ UNCHANGED <<phase, stage, overLimit, resting, holder, gate, sent, begun, dead>>

Next == YouOpenThePlayer \/ YouLeaveThePlayer \/ YouPressStart \/ ThePageFills \/ YouGoToTheTitle \/ ThePageOpens \/ TimeIsUp
        \/ AParentGivesMoreTime \/ AParentTakesThePhone \/ TheChildTakesItBack \/ AParentOpensTheGate \/ AParentSharesTheLink \/ SoundSwitch
Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "play", "done"} /\ stage \in {"hidden", "shown"} /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN
          /\ holder \in {"child", "parent"} /\ gate \in {"closed", "open"} /\ sent \in {"nothing", "address", "card", "name"}
          /\ sound \in BOOLEAN /\ talk \in BOOLEAN /\ begun \in {"inTime", "late"} /\ dead \in BOOLEAN

\* The before-fix rules, kept.
\* With sound off, the game never speaks on its own; and now it never speaks at all.
SilentWhenMuted == talk => sound
NoVoice == ~talk
NoNewRoundPastLimit == begun = "inTime"
RestOnlyAtBreak == resting => (phase # "play" \/ overLimit)
\* While the child has the phone, the gate is shut: no share link and no "more time" in front of them.
NoShareForKids == holder = "child" => gate = "closed"
OnlyParentsGiveMoreTime == (holder = "child" /\ resting) => gate = "closed"
\* Nothing about the child leaves the phone: at most the tool's own address. No /api/*, no card, no name.
NoChildDataLeaves == sent \in {"nothing", "address"}
\* The launch card's খেলো always works: the rest screen never sits invisible in the hidden stage, swallowing taps.
LaunchCardStaysLive == ~dead
====
