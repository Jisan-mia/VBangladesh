---- MODULE KarChinho ----
\* কার-চিহ্ন বসাও: the round of words, the 1.1 s advance timer, the kids' daily limit and rest screen,
\* and the two parent gates (the share-link gate under the game and the gate on the rest screen),
\* mirrored from tools/kar-chinho/components/kar-game.tsx (Play: tap, finish, start, the level button, the timers)
\* and shared/kids-kit.tsx (useKidsSession: atBreak / extend; RestScreen; ParentGate; ShareToolLink).
\* Two words stand in for ten. "holder" is who has the phone: the child plays, a parent passes gates.
\* A gate's ask stage is folded into one step: a parent holds 2 s and answers the sum; a child holds 2 s and mashes
\* the pad until the sum comes up (press() accepts any one- or two-digit run that equals it, e.g. "07").
\* "sound" is the site-wide switch. speak(item.word) runs on every right tap and never reads it; the word is shorter than
\* the 1.1 s timer, so the phone is speaking exactly while phase = "solved".
\* Left out: the tab (nothing here runs on a clock; the 1.1 s timer firing in a hidden tab is noted in the README).
EXTENDS Naturals
VARIABLES phase, word, overLimit, resting, holder, shareGate, restGate, begun, lost, sound
vars == <<phase, word, overLimit, resting, holder, shareGate, restGate, begun, lost, sound>>
Speaking == phase = "solved"

Words == 1..2
Gate == {"closed", "parent", "child"}   \* closed, or open and by whom
\* The RestScreen is position: fixed over the whole page, so while it shows only its own gate can be touched.
Free == ~resting

Init == /\ phase = "play" /\ word = 1 /\ overLimit = FALSE /\ resting = FALSE
        /\ holder = "child" /\ shareGate = "closed" /\ restGate = "closed" /\ begun = "inTime" /\ lost = FALSE /\ sound = TRUE

\* tap(kar) with the right sign: solved, sfx.good, speak, then later(1100 ms) → finish or nextWord.
YouTapTheRightSign == /\ phase = "play" /\ Free
                      /\ phase' = "solved"
                      /\ UNCHANGED <<word, overLimit, resting, holder, shareGate, restGate, begun, lost, sound>>
\* The 1.1 s timer → nextWord(next).
TheNextWordComes == /\ phase = "solved" /\ word = 1
                    /\ phase' = "play" /\ word' = 2
                    /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, begun, lost, sound>>
\* The 1.1 s timer → finish(next): record stars, sfx.win, atBreak() (resting = today's limit has passed).
TheRoundEnds == /\ phase = "solved" /\ word = 2
                /\ phase' = "end" /\ resting' = overLimit
                /\ UNCHANGED <<word, overLimit, holder, shareGate, restGate, begun, lost, sound>>
\* The level button at the top, in any phase: clearTimers(); setPhase('pick').
\* A pending finish dies with the timers: the last word was solved, but the round is never recorded and atBreak never runs.
YouTapTheLevelButton == /\ Free /\ phase \in {"play", "solved", "end"}
                        /\ phase' = "pick" /\ lost' = (phase = "solved" /\ word = 2)
                        /\ UNCHANGED <<word, overLimit, resting, holder, shareGate, restGate, begun, sound>>
\* শেষ on the end screen → the level picker.
YouPressShesh == /\ phase = "end" /\ Free
                 /\ phase' = "pick"
                 /\ UNCHANGED <<word, overLimit, resting, holder, shareGate, restGate, begun, lost, sound>>
\* আবার খেলো on the end screen, or a level in the picker: start(level). No atBreak() here.
YouStartARound == /\ phase \in {"end", "pick"} /\ Free
                  /\ phase' = "play" /\ word' = 1 /\ begun' = (IF overLimit THEN "late" ELSE "inTime") /\ lost' = FALSE
                  /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, sound>>
\* A reload, or opening কার-চিহ্ন from the kids' hub after another game's rest screen: a fresh Play with
\* resting = false and the first round already on screen. Both gates start closed.
ThePageOpens == /\ phase' = "play" /\ word' = 1 /\ resting' = FALSE /\ shareGate' = "closed" /\ restGate' = "closed"
                /\ begun' = (IF overLimit THEN "late" ELSE "inTime") /\ lost' = FALSE
                /\ UNCHANGED <<overLimit, holder, sound>>
\* useKidsSession's 10 s tick pushes today's play time past the limit (any phase; the round goes on).
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, word, resting, holder, shareGate, restGate, begun, lost, sound>>

\* Who has the phone.
AParentTakesThePhone == /\ holder = "child" /\ holder' = "parent"
                        /\ UNCHANGED <<phase, word, overLimit, resting, shareGate, restGate, begun, lost, sound>>
TheChildTakesItBack == /\ holder = "parent" /\ holder' = "child"
                       /\ UNCHANGED <<phase, word, overLimit, resting, shareGate, restGate, begun, lost, sound>>

\* The gate under the game (বড়দের জন্য → ShareToolLink). It stays open until বন্ধ করো or a reload.
AParentOpensTheShareGate == /\ Free /\ holder = "parent" /\ shareGate = "closed" /\ shareGate' = "parent"
                            /\ UNCHANGED <<phase, word, overLimit, resting, holder, restGate, begun, lost, sound>>
TheChildOpensTheShareGate == /\ Free /\ holder = "child" /\ shareGate = "closed" /\ shareGate' = "child"
                             /\ UNCHANGED <<phase, word, overLimit, resting, holder, restGate, begun, lost, sound>>
SomeoneClosesTheShareGate == /\ Free /\ shareGate # "closed" /\ shareGate' = "closed"
                             /\ UNCHANGED <<phase, word, overLimit, resting, holder, restGate, begun, lost, sound>>

\* The gate on the rest screen (আজ আরও ১০ মিনিট, রোজ কতক্ষণ খেলবে). It unmounts with the rest screen.
AParentOpensTheRestGate == /\ resting /\ holder = "parent" /\ restGate = "closed" /\ restGate' = "parent"
                           /\ UNCHANGED <<phase, word, overLimit, resting, holder, shareGate, begun, lost, sound>>
TheChildOpensTheRestGate == /\ resting /\ holder = "child" /\ restGate = "closed" /\ restGate' = "child"
                            /\ UNCHANGED <<phase, word, overLimit, resting, holder, shareGate, begun, lost, sound>>
\* onExtend(10) → extend(): seconds -= 600, resting = false; the rest screen and its gate go away.
SomeoneGivesTenMinutes == /\ resting /\ restGate # "closed"
                          /\ overLimit' = FALSE /\ resting' = FALSE /\ restGate' = "closed"
                          /\ UNCHANGED <<phase, word, holder, shareGate, begun, lost, sound>>

\* The 🔊 SoundToggle (setSoundOn). Turning it off cuts no speech already under way, and speak() never asks it.
SoundOff == /\ Free /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<phase, word, overLimit, resting, holder, shareGate, restGate, begun, lost>>
SoundOn == /\ Free /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, word, overLimit, resting, holder, shareGate, restGate, begun, lost>>

Next == SoundOff \/ SoundOn \/ YouTapTheRightSign \/ TheNextWordComes \/ TheRoundEnds \/ YouTapTheLevelButton \/ YouPressShesh \/ YouStartARound
        \/ ThePageOpens \/ TimeIsUp \/ AParentTakesThePhone \/ TheChildTakesItBack
        \/ AParentOpensTheShareGate \/ TheChildOpensTheShareGate \/ SomeoneClosesTheShareGate
        \/ AParentOpensTheRestGate \/ TheChildOpensTheRestGate \/ SomeoneGivesTenMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "solved", "end", "pick"} /\ word \in Words
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ holder \in {"child", "parent"}
          /\ shareGate \in Gate /\ restGate \in Gate /\ begun \in {"inTime", "late"} /\ lost \in BOOLEAN /\ sound \in BOOLEAN

\* The reader's rules.
\* With sound off, the game never speaks on its own (only a tapped speaker button may).
SilentWhenMuted == Speaking => sound
\* The rest screen comes only between rounds, never over a word.
RestOnlyAtBreak == resting => phase \in {"end", "pick"}
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: its stars are saved and the daily limit is checked.
EveryFinishCounts == ~lost
\* Only a grown-up opens a parent gate.
GateNeedsAnAdult == shareGate # "child" /\ restGate # "child"
\* When a parent hands the phone back, every gate they opened is closed again.
GateClosesWhenTheParentHandsBack == holder = "child" => (shareGate # "parent" /\ restGate # "parent")
\* While the child has the phone, the share link is behind a closed gate.
NoShareForKids == holder = "child" => shareGate = "closed"
\* While the child has the phone, "more time" is behind a closed gate.
OnlyParentsGiveMoreTime == (holder = "child" /\ resting) => restGate = "closed"
====
