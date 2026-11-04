---- MODULE NamShikhi ----
\* নাম শিখি: the round of pictures, the পরেরটা / দেখো কী শিখলে steps, the pack tiles and level grid under the game,
\* a #p= link, the kids' daily limit and rest screen, and the two parent gates (the share-link gate under the game and
\* the gate on the rest screen), mirrored from tools/nam-shikhi/components/nam-game.tsx (NamGame: choose, next, finish,
\* start, pickPack, the hashchange effect) and shared/kids-kit.tsx (useKidsSession: atBreak / extend; RestScreen;
\* ParentGate; ShareToolLink).
\* Two pictures stand in for a round. "holder" is who has the phone: the child plays, a parent passes gates.
\* A gate's ask stage is folded into one step: a parent holds 2 s and answers the sum; a child holds 2 s and mashes
\* the pad until the sum comes up (press() accepts any one- or two-digit run that equals it, e.g. "07").
\* "sound" is the site-wide switch; "talk" is the phone speaking: speak(learnedLine(...).main) runs on every right tap and
\* never reads the switch. The line is short, so it has ended by the time পরেরটা is read and tapped: leaving the
\* solved picture ends it.
\* Nothing here runs on a clock or a timer, so the tab and window are left out.
EXTENDS Naturals
VARIABLES phase, target, overLimit, resting, holder, shareGate, restGate, begun, sound, talk
vars == <<phase, target, overLimit, resting, holder, shareGate, restGate, begun, sound, talk>>

Targets == 1..2
Gate == {"closed", "parent", "child"}   \* closed, or open and by whom
\* The RestScreen is position: fixed over the whole page, so while it shows only its own gate can be touched.
Free == ~resting
Begin == IF overLimit /\ ~resting THEN "late" ELSE "inTime"

Init == /\ phase = "play" /\ target = 1 /\ overLimit = FALSE /\ resting = FALSE
        /\ holder = "child" /\ shareGate = "closed" /\ restGate = "closed" /\ begun = "inTime"
        /\ sound = TRUE /\ talk = FALSE

\* choose(id) with the right picture (or body part): solved, sfx.good, speak. A wrong one only marks itself.
YouTapTheRightPicture == /\ phase = "play" /\ Free
                         /\ phase' = "solved" /\ talk' = TRUE
                         /\ UNCHANGED <<target, overLimit, resting, holder, shareGate, restGate, begun, sound>>
\* পরেরটা → next(): the next picture.
YouPressNext == /\ phase = "solved" /\ target = 1 /\ Free
                /\ talk' = FALSE /\ phase' = "play" /\ target' = 2
                /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, begun, sound>>
\* দেখো কী শিখলে → next() → finish(): record stars, confetti or sfx.win, atBreak().
YouPressSeeWhatYouLearned == /\ phase = "solved" /\ target = 2 /\ Free
                             /\ talk' = FALSE /\ phase' = "done" /\ resting' = overLimit
                             /\ UNCHANGED <<target, overLimit, holder, shareGate, restGate, begun, sound>>
\* আবার খেলো on the done screen: start(pack, level). No atBreak() here.
YouPressPlayAgain == /\ phase = "done" /\ Free
                     /\ phase' = "play" /\ target' = 1 /\ begun' = Begin
                     /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, sound, talk>>
\* শেষ on the done screen → idle (the pack tiles).
YouPressShesh == /\ phase = "done" /\ Free
                 /\ phase' = "idle"
                 /\ UNCHANGED <<target, overLimit, resting, holder, shareGate, restGate, begun, sound, talk>>
\* A pack tile (idle, or under the game) or a level in the grid under the game, in any phase: start(). No atBreak().
YouPickAPackOrLevel == /\ Free
                       /\ talk' = FALSE /\ phase' = "play" /\ target' = 1 /\ begun' = Begin
                       /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, sound>>
\* hashchange with #p=<pack>: start(id), even under the rest screen (the effect doesn't check resting).
ALinkOpens == /\ talk' = FALSE /\ phase' = "play" /\ target' = 1 /\ begun' = Begin
              /\ UNCHANGED <<overLimit, resting, holder, shareGate, restGate, sound>>
\* A reload, or opening নাম শিখি from the kids' hub after another game's rest screen: a fresh NamGame with
\* resting = false and the first round already on screen. Both gates start closed.
ThePageOpens == /\ talk' = FALSE /\ phase' = "play" /\ target' = 1 /\ resting' = FALSE /\ shareGate' = "closed" /\ restGate' = "closed"
                /\ begun' = (IF overLimit THEN "late" ELSE "inTime")
                /\ UNCHANGED <<overLimit, holder, sound>>
\* useKidsSession's 10 s tick pushes today's play time past the limit (any phase; the round goes on).
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, target, resting, holder, shareGate, restGate, begun, sound, talk>>

\* Who has the phone.
AParentTakesThePhone == /\ holder = "child" /\ holder' = "parent"
                        /\ UNCHANGED <<phase, target, overLimit, resting, shareGate, restGate, begun, sound, talk>>
TheChildTakesItBack == /\ holder = "parent" /\ holder' = "child"
                       /\ UNCHANGED <<phase, target, overLimit, resting, shareGate, restGate, begun, sound, talk>>

\* The gate under the game (বড়দের জন্য → ShareToolLink). It stays open until বন্ধ করো or a reload.
AParentOpensTheShareGate == /\ Free /\ holder = "parent" /\ shareGate = "closed" /\ shareGate' = "parent"
                            /\ UNCHANGED <<phase, target, overLimit, resting, holder, restGate, begun, sound, talk>>
TheChildOpensTheShareGate == /\ Free /\ holder = "child" /\ shareGate = "closed" /\ shareGate' = "child"
                             /\ UNCHANGED <<phase, target, overLimit, resting, holder, restGate, begun, sound, talk>>
SomeoneClosesTheShareGate == /\ Free /\ shareGate # "closed" /\ shareGate' = "closed"
                             /\ UNCHANGED <<phase, target, overLimit, resting, holder, restGate, begun, sound, talk>>

\* The gate on the rest screen (আজ আরও ১০ মিনিট, রোজ কতক্ষণ খেলবে). It unmounts with the rest screen.
AParentOpensTheRestGate == /\ resting /\ holder = "parent" /\ restGate = "closed" /\ restGate' = "parent"
                           /\ UNCHANGED <<phase, target, overLimit, resting, holder, shareGate, begun, sound, talk>>
TheChildOpensTheRestGate == /\ resting /\ holder = "child" /\ restGate = "closed" /\ restGate' = "child"
                            /\ UNCHANGED <<phase, target, overLimit, resting, holder, shareGate, begun, sound, talk>>
\* onExtend(10) → extend(): seconds -= 600, resting = false; the rest screen and its gate go away.
SomeoneGivesTenMinutes == /\ resting /\ restGate # "closed"
                          /\ overLimit' = FALSE /\ resting' = FALSE /\ restGate' = "closed"
                          /\ UNCHANGED <<phase, target, holder, shareGate, begun, sound, talk>>

\* The spoken line ends (nothing cancels it: not the switch, not পরেরটা).
TheVoiceEnds == /\ talk /\ talk' = FALSE
                /\ UNCHANGED <<phase, target, overLimit, resting, holder, shareGate, restGate, begun, sound>>
\* The 🔊 SoundToggle (setSoundOn). Turning it off cuts no speech already under way, and speak() never asks it.
SoundOff == /\ Free /\ sound /\ sound' = FALSE
            /\ UNCHANGED <<phase, target, overLimit, resting, holder, shareGate, restGate, begun, talk>>
SoundOn == /\ Free /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, target, overLimit, resting, holder, shareGate, restGate, begun, talk>>

Next == TheVoiceEnds \/ SoundOff \/ SoundOn \/ YouTapTheRightPicture \/ YouPressNext \/ YouPressSeeWhatYouLearned \/ YouPressPlayAgain \/ YouPressShesh
        \/ YouPickAPackOrLevel \/ ALinkOpens \/ ThePageOpens \/ TimeIsUp \/ AParentTakesThePhone \/ TheChildTakesItBack
        \/ AParentOpensTheShareGate \/ TheChildOpensTheShareGate \/ SomeoneClosesTheShareGate
        \/ AParentOpensTheRestGate \/ TheChildOpensTheRestGate \/ SomeoneGivesTenMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "solved", "done", "idle"} /\ target \in Targets
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ holder \in {"child", "parent"}
          /\ shareGate \in Gate /\ restGate \in Gate /\ begun \in {"inTime", "late"} /\ sound \in BOOLEAN /\ talk \in BOOLEAN

\* The reader's rules.
\* With sound off, the game never speaks on its own (only a tapped speaker button may).
SilentWhenMuted == talk => sound
\* The rest screen never covers a round in progress (a fresh, untouched round is not in progress).
RestOnlyAtBreak == resting => (phase \in {"done", "idle"} \/ (phase = "play" /\ target = 1))
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Only a grown-up opens a parent gate.
GateNeedsAnAdult == shareGate # "child" /\ restGate # "child"
\* When a parent hands the phone back, every gate they opened is closed again.
GateClosesWhenTheParentHandsBack == holder = "child" => (shareGate # "parent" /\ restGate # "parent")
\* While the child has the phone, the share link is behind a closed gate.
NoShareForKids == holder = "child" => shareGate = "closed"
\* While the child has the phone, "more time" is behind a closed gate.
OnlyParentsGiveMoreTime == (holder = "child" /\ resting) => restGate = "closed"
====
