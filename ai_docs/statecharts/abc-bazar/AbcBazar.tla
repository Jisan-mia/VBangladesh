---- MODULE AbcBazar ----
\* এবিসি বাজার (kids, 4–7): a six-item letter round, wrong taps, পরেরটা / শেষ দেখো, the done and menu screens, the
\* সব লেভেল drawer, stars, the sound switch, window focus, the kids' daily limit and rest screen, the parent gate,
\* "আব্বু-আম্মুকে দেখাও" and the site frame. Mirrored from (as of 2026-11-04, branch games-to-the-bar):
\*   tools/abc-bazar/components/abc-game.tsx  (begin, ready, choose, next, finish → levels.record + atBreak, the done
\*                                             and menu screens, the drawer's LevelGrid, ShowParent, RestScreen, gate)
\*   tools/abc-bazar/lib/round.ts             (starsOf: 3 with no slip, 2 with up to two, else 1)
\*   shared/game-core.ts recordLevel          (keeps the better result)
\*   shared/game-sound.ts, art.tsx sayEnglish (tones check soundOn(); choose() speaks the word only if soundOn())
\*   shared/kids-kit.tsx at 23fd7c1           (useKidsSession counts only a focused, visible tab and opens resting
\*                                             past the limit; RestScreen is a real modal; ParentGate shuts after one
\*                                             action, after 60 s or on hide; ShowParent)
\*   shared/site-shell.tsx PageFrame          (header search and nav, related tools, footer: plain links)
\* The game has no timers of its own, no blur and no visibility handling: nothing moves unless the child taps.
\* Abstractions: a round is two items (the six differ only in letters); slips are "none" or "some"; the level is left out (begin(level) is one restart). The 🔈 শোনো button speaks only when tapped.
EXTENDS Naturals
VARIABLES phase, idx, solved, slips, shown, best, sound, away, limit, resting, gate, showing, out,
          dropped, spokeMuted, movedAway, net, stray
vars == <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, gate, showing, out,
          dropped, spokeMuted, movedAway, net, stray>>

Stars(s) == IF s = 0 THEN 3 ELSE 2               \* starsOf: 3 with no slip, 2 with one or two (1 for three or more: left out)
Covered == resting \/ showing               \* RestScreen and ShowParent: position fixed, inset 0, z-index 50
OnPage == out = "none"
Here == OnPage /\ ~away /\ gate = "closed" /\ ~Covered   \* the child's taps; while a gate is open the game waits
Parent == OnPage /\ ~away /\ (phase # "play" \/ resting)  \* parents use the gate between rounds
\* The "it just happened" flags are true only in the state right after a step that breaks a rule.
Clear == dropped' = FALSE /\ spokeMuted' = FALSE /\ movedAway' = FALSE

Init == /\ phase = "play" /\ idx = 1 /\ solved = FALSE /\ slips = 0 /\ shown = 0 /\ best = 0 /\ sound = TRUE
        /\ away = FALSE /\ limit \in BOOLEAN /\ resting = limit /\ gate = "closed" /\ showing = FALSE /\ out = "none"
        /\ dropped = FALSE /\ spokeMuted = FALSE /\ movedAway = FALSE /\ net = FALSE /\ stray = FALSE

\* begin(level): a fresh round, mistakes 0, ShowParent closed.
Begin == /\ Clear /\ phase' = "play" /\ idx' = 1 /\ solved' = FALSE /\ slips' = 0 /\ showing' = FALSE
         /\ UNCHANGED <<shown, best, sound, away, limit, resting, gate, out, net, stray>>

\* choose(): the right answer → solved, sfx.good, sayEnglish only if soundOn(). A wrong one → shake, mistakes + 1.
YouTapTheRightPicture == /\ Here /\ phase = "play" /\ ~solved /\ solved' = TRUE
                         /\ dropped' = FALSE /\ movedAway' = FALSE
                         /\ spokeMuted' = FALSE          \* `if (soundOn()) sayEnglish(entry.word)`
                         /\ UNCHANGED <<phase, idx, slips, shown, best, sound, away, limit, resting, gate, showing, out, net, stray>>
YouTapAWrongPicture == /\ Here /\ phase = "play" /\ ~solved /\ Clear /\ slips' = 1
                       /\ UNCHANGED <<phase, idx, solved, shown, best, sound, away, limit, resting, gate, showing, out, net, stray>>
\* next(): পরেরটা → ready(next item); on the last item শেষ দেখো → finish(): levels.record, confetti or win, done, atBreak().
YouPressNext == /\ Here /\ phase = "play" /\ solved /\ idx = 1 /\ Clear /\ idx' = 2 /\ solved' = FALSE
                /\ UNCHANGED <<phase, slips, shown, best, sound, away, limit, resting, gate, showing, out, net, stray>>
YouPressSeeTheEnd == /\ Here /\ phase = "play" /\ solved /\ idx = 2
                     /\ LET kept == IF Stars(slips) > best THEN Stars(slips) ELSE best   \* recordLevel: the better result
                        IN /\ best' = kept /\ dropped' = (kept < best)
                     /\ phase' = "done" /\ shown' = Stars(slips) /\ resting' = limit
                     /\ spokeMuted' = FALSE /\ movedAway' = FALSE
                     /\ UNCHANGED <<idx, solved, slips, sound, away, limit, gate, showing, out, net, stray>>

YouPressPlayAgain == /\ Here /\ phase = "done" /\ Begin
YouPressShesh == /\ Here /\ phase = "done" /\ Clear /\ phase' = "menu"
                 /\ UNCHANGED <<idx, solved, slips, shown, best, sound, away, limit, resting, gate, showing, out, net, stray>>
\* The menu's LevelGrid, or the সব লেভেল drawer (open on every screen): begin(level).
YouPickALevel == /\ Here /\ Begin
YouShowAParent == /\ Here /\ phase = "done" /\ Clear /\ showing' = TRUE
                  /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, gate, out, net, stray>>
ShowingIsOver == /\ OnPage /\ ~away /\ showing /\ Clear /\ showing' = FALSE
                 /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, gate, out, net, stray>>
\* The sound switch, modelled at a round's start or between rounds: a mid-round toggle reaches nothing new.
YouToggleSound == /\ Here /\ (phase # "play" \/ (idx = 1 /\ ~solved)) /\ Clear /\ sound' = ~sound
                  /\ UNCHANGED <<phase, idx, solved, slips, shown, best, away, limit, resting, gate, showing, out, net, stray>>

\* Window and tab: nothing listens, and nothing in the game moves by itself.
YouLeave == /\ OnPage /\ phase = "play" /\ ~away /\ Clear /\ away' = TRUE /\ gate' = "closed"   \* an open gate shuts on hide
            /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, limit, resting, showing, out, net, stray>>
YouComeBack == /\ OnPage /\ away /\ Clear /\ away' = FALSE
               /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, limit, resting, gate, showing, out, net, stray>>
TheDailyLimitPasses == /\ OnPage /\ ~away /\ ~limit /\ Clear /\ limit' = TRUE
                       /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, resting, gate, showing, out, net, stray>>

\* ParentGate: "closed", "parent" (open, a parent holds the phone), "child" (left open after the phone goes back with
\* no grown-up action: up to 60 s). SomeoneClosesTheGate is বন্ধ করো, two wrong sums or the 60 s timer.
AParentOpensTheGate == /\ Parent /\ gate = "closed" /\ Clear /\ gate' = "parent"
                       /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, showing, out, net, stray>>
TheParentHandsThePhoneBack == /\ Parent /\ gate = "parent" /\ Clear /\ gate' = "child"
                              /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, showing, out, net, stray>>
SomeoneClosesTheGate == /\ Parent /\ gate # "closed" /\ Clear /\ gate' = "closed"
                        /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, limit, resting, showing, out, net, stray>>
SomeoneGivesTenMinutes == /\ Parent /\ resting /\ gate # "closed" /\ Clear /\ resting' = FALSE /\ limit' = FALSE
                          /\ gate' = "closed"      \* one grown-up action, then the gate shuts
                          /\ UNCHANGED <<phase, idx, solved, slips, shown, best, sound, away, showing, out, net, stray>>
\* Leaving the page: the rest is parked so the model keeps one state per way out.
Leave(kind) == /\ out' = kind /\ phase' = "play" /\ idx' = 1 /\ solved' = FALSE /\ slips' = 0 /\ shown' = 0
               /\ sound' = TRUE /\ away' = FALSE /\ limit' = FALSE /\ resting' = FALSE /\ gate' = "closed"
               /\ showing' = FALSE /\ Clear /\ UNCHANGED <<best, net, stray>>
\* ShareToolLink, the print link and "ফোনে ছবি রাখো" sit inside an open gate.
SomeoneShares == /\ Parent /\ gate # "closed" /\ Leave(IF gate = "parent" THEN "parentShared" ELSE "childShared")
\* PageFrame's header, related tools and footer, and the guide's own "A–Z রং করার পাতা" link: no gate.
TheChildTapsASiteLink == /\ OnPage /\ ~away /\ ~Covered /\ gate # "parent" /\ Leave("childLeft")
Gone == ~OnPage /\ UNCHANGED vars

Next == YouTapTheRightPicture \/ YouTapAWrongPicture \/ YouPressNext \/ YouPressSeeTheEnd
        \/ YouPressPlayAgain \/ YouPressShesh \/ YouPickALevel \/ YouShowAParent \/ ShowingIsOver \/ YouToggleSound
        \/ YouLeave \/ YouComeBack \/ TheDailyLimitPasses
        \/ AParentOpensTheGate \/ TheParentHandsThePhoneBack \/ SomeoneClosesTheGate \/ SomeoneGivesTenMinutes
        \/ SomeoneShares \/ TheChildTapsASiteLink \/ Gone

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "done", "menu"} /\ idx \in 1..2 /\ solved \in BOOLEAN /\ slips \in 0..1
          /\ shown \in 0..3 /\ best \in 0..3 /\ sound \in BOOLEAN /\ away \in BOOLEAN /\ limit \in BOOLEAN
          /\ resting \in BOOLEAN /\ gate \in {"closed", "parent", "child"} /\ showing \in BOOLEAN
          /\ out \in {"none", "parentShared", "childShared", "childLeft"}
          /\ dropped \in BOOLEAN /\ spokeMuted \in BOOLEAN /\ movedAway \in BOOLEAN /\ net \in BOOLEAN /\ stray \in BOOLEAN

\* What a 4–5 year old must press on each screen, and which of those carry a picture or a sound cue.
OnScreen == IF Covered \/ ~OnPage THEN {} ELSE
            CASE phase = "done" -> {"again", "shesh", "showParent"}
              [] phase = "menu" -> {"levelGrid"}
              [] solved -> {"next"}
              [] OTHER -> {"picture"}
Pictured == {"picture", "next"}   \* the picture choices (and the ghost finger); পরেরটা carries a → arrow

\* The reader's rules.
\* A break: between rounds, or before the first tap of a round (opening the game past the limit).
RestOnlyAtBreak == resting => (phase # "play" \/ (idx = 1 /\ ~solved /\ slips = 0))
ResultMatchesPlay == phase = "done" => (shown = Stars(slips) /\ best >= shown)
StarsNeverDrop == ~dropped
NoProgressWhileAway == ~movedAway
MuteMeansSilent == ~spokeMuted
NoShareForKids == out # "childShared"
ParentGate == out # "childLeft"
GateClosesBehindParent == gate # "child"
NoNetwork == ~net          \* nothing calls fetch, sendBeacon, /api/*, share-client or tally
NoChildData == ~stray      \* writes: ektukhani-levels-abc-bazar, ektukhani-kids-time, ektukhani-slow, the sound key
NoReadingNeeded == OnScreen \subseteq Pictured
====
