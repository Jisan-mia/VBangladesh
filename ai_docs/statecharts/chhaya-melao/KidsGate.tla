---- MODULE KidsGate ----
\* The kids' kit parent gate (ParentGate in shared/kids-kit.tsx) at commit 23fd7c1 (2026-11-04 16:47), the code every kids'
\* game uses now. ছায়া মেলাও, মঙ্গলে রোভার and দাঁড়িপাল্লা put ShareToolLink behind it; RestScreen puts "আজ আরও ১০ মিনিট"
\* and the daily-limit choice behind it; ShowParent puts "ফোনে ছবি রাখো" behind it. Kept apart from the game specs because
\* it is shared and independent of the round. Handlers mirrored, one action each:
\*   onPointerDown / Enter-Space keydown → start(): returns if a timer is already armed; key repeats are ignored
\*   onPointerUp / Leave / Cancel / keyup / blur → stop(): clears the armed timer and forgets it
\*   the 2000 ms timer → stage "ask", misses = 0, a two-digit sum (10–18) in words
\*   press(digit): the right sum → "open"; a wrong answer asks a new sum; the second wrong answer closes the gate
\*   open: one action inside (onClickCapture) shuts it; so do 60 s, a hidden tab and pagehide; থাক / বন্ধ করো close it
\* The earlier kit (before f4f75be) let a second finger or a key repeat arm a timer stop() couldn't clear, and let a
\* child tap digits forever; see README "Found on the earlier kit".
EXTENDS Naturals
VARIABLES stage, down, armed, misses, askedWithNoHold, opener, shared
vars == <<stage, down, armed, misses, askedWithNoHold, opener, shared>>

Init == /\ stage = "closed" /\ down = 0 /\ armed = FALSE /\ misses = 0
        /\ askedWithNoHold = FALSE /\ opener = "nobody" /\ shared = FALSE

\* A finger or key goes down on "বড়দের জন্য". A second finger finds the timer armed and does nothing.
AFingerGoesDown == /\ stage = "closed" /\ down < 2
                   /\ down' = down + 1 /\ armed' = TRUE
                   /\ UNCHANGED <<stage, misses, askedWithNoHold, opener, shared>>
\* A held key auto-repeats: keydown with repeat = true is ignored.
TheKeyRepeats == /\ stage = "closed" /\ down > 0
                 /\ UNCHANGED vars
\* Any finger or key comes up (or the button loses focus): stop() clears the timer.
AFingerLifts == /\ stage = "closed" /\ down > 0
                /\ down' = down - 1 /\ armed' = FALSE
                /\ UNCHANGED <<stage, misses, askedWithNoHold, opener, shared>>
TwoSecondsPass == /\ stage = "closed" /\ armed
                  /\ stage' = "ask" /\ armed' = FALSE /\ misses' = 0
                  /\ askedWithNoHold' = (askedWithNoHold \/ down = 0)
                  /\ UNCHANGED <<down, opener, shared>>
AGrownUpAnswers == /\ stage = "ask" /\ stage' = "open" /\ opener' = "parent" /\ shared' = FALSE
                   /\ UNCHANGED <<down, armed, misses, askedWithNoHold>>
\* A child taps two digits at random: about 1 time in 100 it is the sum; otherwise a miss, and the second miss closes.
AChildTapsTwoDigits == /\ stage = "ask"
                       /\ \/ /\ stage' = "open" /\ opener' = "child" /\ shared' = FALSE /\ UNCHANGED misses
                          \/ /\ misses' = misses + 1 /\ stage' = (IF misses + 1 >= 2 THEN "closed" ELSE "ask")
                             /\ UNCHANGED <<opener, shared>>
                       /\ UNCHANGED <<down, armed, askedWithNoHold>>
\* খেলাটার লিংক পাঠাও: the share runs, and the gate shuts after this one action.
SomeoneSharesTheLink == /\ stage = "open" /\ shared' = TRUE /\ stage' = "closed" /\ down' = 0
                        /\ UNCHANGED <<opener, armed, misses, askedWithNoHold>>
\* থাক, বন্ধ করো, 60 s, a hidden tab or pagehide.
TheGateCloses == /\ stage # "closed" /\ stage' = "closed" /\ down' = 0 /\ opener' = (IF shared THEN opener ELSE "nobody")
                 /\ UNCHANGED <<armed, misses, askedWithNoHold, shared>>

Next == AFingerGoesDown \/ TheKeyRepeats \/ AFingerLifts \/ TwoSecondsPass \/ AGrownUpAnswers \/ AChildTapsTwoDigits
        \/ SomeoneSharesTheLink \/ TheGateCloses
Spec == Init /\ [][Next]_vars
\* Stop exploring once a child has shared, to keep the chart small.
Explore == ~(shared /\ opener = "child")

TypeOK == stage \in {"closed", "ask", "open"} /\ down \in 0..2 /\ armed \in BOOLEAN /\ misses \in 0..2
          /\ askedWithNoHold \in BOOLEAN /\ opener \in {"nobody", "parent", "child"} /\ shared \in BOOLEAN

\* The question comes only after a real 2-second hold: never with no finger and no key down.
AskNeedsAHold == ~askedWithNoHold
\* A child tapping at random gets at most two tries per 2-second hold.
TwoTriesPerHold == misses <= 2 /\ (misses = 2 => stage = "closed")
\* ParentGate: the grown-ups' side opens only for a grown-up. (Any number pad can be guessed; this measures how often.)
OnlyAGrownUpOpensIt == stage = "open" => opener = "parent"
\* The gate never stays open after its one action (shared is reset each time the gate opens).
ShutsAfterOneAction == shared => stage # "open"
\* NoShareForKids: the link is never shared by a child.
NoShareForKids == shared => opener # "child"
====
