---- MODULE UltoKhela ----
EXTENDS Naturals
\* উল্টো খেলা (kids, 4–8): the round of pictures, the 0.7 s "next picture" timer, the bell that flips the rule and
\* speaks it, the optional চটপট pace timer, the সব ধাপ level drawer, window focus, the sound switch, the kids' daily
\* limit and rest screen, the parent gate, "আব্বু-আম্মুকে দেখাও" and the site frame. Mirrored from
\* (as of 2026-11-04, branch games-to-the-bar):
\*   tools/ulto-khela/components/ulto-game.tsx  (onChoice; the চটপট effect setTimeout(pass, paceSeconds*1000);
\*                                               the advance effect setTimeout(nextItem | record+atBreak+end, 700/300);
\*                                               restart; the end, closed, drawer, ShowParent, RestScreen, gate)
\*   tools/ulto-khela/lib/game.ts               (answer, pass: never on a demo picture, nextItem rings the bell)
\*   shared/game-ui.tsx SoundToggle, shared/game-sound.ts (every tone checks soundOn())
\*   shared/kids-kit.tsx at 23fd7c1             (speak() is silent when sound is off (b51e328); useKidsSession counts
\*                                               only a focused, visible tab and opens resting past the limit; RestScreen
\*                                               is a real modal; ParentGate shuts after one action, 60 s, or on hide;
\*                                               ParentGate stays open until বন্ধ করো)
\*   shared/site-shell.tsx PageFrame            (header search and nav, related tools, footer: plain links)
\* The game has no blur, visibilitychange or pause handling at all.
\* Abstractions: a round is three pictures of a bell level (levels 3–6; levels 1–2 have no bell and nothing else that
\* differs here). Picture 1 is the demo (the ghost finger; চটপট never passes a demo). The bell rings as picture 2 comes,
\* which makes it a demo too, and picture 3 is a normal one. আবার খেলো, পরের ধাপ and a level in সব ধাপ all restart. Wrong taps are left
\* out (they change nothing but a try count). The phone is assumed to have a Bangla voice, so speak() is audible.
\* Leaving the page (window/tab) is modelled while a round is in play, the only place a timer can run.
\* Variables the reader does not need mid-round (the settings, the gate) change between rounds; see Between and the gate.
VARIABLES phase, idx, stage, quick, sound, look, limit, resting, gate, showing, out,
          movedAway, passedInPicker, spokeMuted, net, stray
vars == <<phase, idx, stage, quick, sound, look, limit, resting, gate, showing, out,
          movedAway, passedInPicker, spokeMuted, net, stray>>

Covered == resting \/ showing               \* RestScreen and ShowParent: position fixed, inset 0, z-index 50
OnPage == out = "none"
\* look: where the child's eyes are: on the game, on the open সব ধাপ drawer (a <details> under the game), or away
\* (another window or a hidden tab; nothing in the game listens to either, so they act the same). Leaving folds the
\* drawer shut in the model; in the page it stays as it was.
Here == OnPage /\ look # "away" /\ gate = "closed"   \* the child's taps land only on a visible, focused page; while
                                                \* the gate is open the game waits (a parent is busy, or the model
                                                \* stops at the open-gate bug: only share, বন্ধ করো and links go on)
Parent == OnPage /\ look # "away" /\ (phase # "play" \/ resting)  \* parents use the gate between rounds
                                               \* share, বন্ধ করো and site links go on)
Demo == idx \in {1, 2}                      \* the first picture, and the first after the bell
Picking == phase = "play" /\ stage = "pick"
Between == phase # "play" \/ (idx = 1 /\ stage = "pick")

\* The three "it just happened" flags are true only in the state right after the step that breaks a rule, so the
\* states after a bug don't double the model.
Clear == movedAway' = FALSE /\ passedInPicker' = FALSE /\ spokeMuted' = FALSE

Init == /\ phase = "play" /\ idx = 1 /\ stage = "pick" /\ quick = FALSE /\ sound = TRUE
        /\ look = "game" /\ limit \in BOOLEAN /\ resting = limit /\ gate = "closed" /\ showing = FALSE
        /\ out = "none" /\ movedAway = FALSE /\ passedInPicker = FALSE /\ spokeMuted = FALSE /\ net = FALSE /\ stray = FALSE

Restart == /\ Clear /\ phase' = "play" /\ idx' = 1 /\ stage' = "pick"
              /\ UNCHANGED <<quick, sound, look, limit, resting, gate, showing, out, net, stray>>

\* onChoice → answer(): the right picture finishes the picture (stage "done"); a wrong one only shakes.
YouTapTheRightPicture == /\ Clear /\ Here /\ ~Covered /\ Picking /\ stage' = "done"
                         /\ UNCHANGED <<phase, idx, quick, sound, look, limit, resting, gate, showing, out, net, stray>>
\* চটপট effect: on a non-demo picture, after 4 s pass() counts a miss and finishes the picture. Nothing checks the
\* window, the tab or the open drawer.
TheQuickTimerPasses == /\ OnPage /\ quick /\ Picking /\ ~Demo /\ stage' = "done"
                       /\ movedAway' = (look = "away") /\ passedInPicker' = (look = "drawer") /\ spokeMuted' = FALSE
                       /\ UNCHANGED <<phase, idx, quick, sound, look, limit, resting, gate, showing, out, net, stray>>
\* Advance effect, 0.7 s (0.3 s in চটপট) after a finished picture: nextItem(); on a ring, bell() (gated by soundOn)
\* and speak("এবার …"), which since b51e328 returns at once when sound is off (before it, it did not check).
TheNextPictureComes == /\ OnPage /\ phase = "play" /\ stage = "done" /\ idx < 3
                       /\ idx' = idx + 1 /\ stage' = "pick"
                       /\ Clear                \* bell() and speak() both check soundOn() now: nothing is spoken on mute
                       /\ UNCHANGED <<phase, quick, sound, look, limit, resting, gate, showing, out, net, stray>>
\* ...or, after the last picture: levels.record, sfx.win, atBreak(), phase "end".
TheRoundEnds == /\ Clear /\ OnPage /\ phase = "play" /\ stage = "done" /\ idx = 3
                /\ phase' = "end" /\ resting' = limit
                /\ UNCHANGED <<idx, stage, quick, sound, look, limit, gate, showing, out, net, stray>>

\* The end screen: আবার খেলো (same level) or পরের ধাপ (next level); শেষ; আব্বু-আম্মুকে দেখাও. The closed screen's আবার খেলো.
YouPlayAgainOrNext == /\ Here /\ ~Covered /\ phase \in {"end", "closed"}
                      /\ Restart
YouPressShesh == /\ Clear /\ Here /\ ~Covered /\ phase = "end" /\ phase' = "closed"
                 /\ UNCHANGED <<idx, stage, quick, sound, look, limit, resting, gate, showing, out, net, stray>>
YouShowAParent == /\ Clear /\ Here /\ ~Covered /\ phase = "end" /\ showing' = TRUE
                  /\ UNCHANGED <<phase, idx, stage, quick, sound, look, limit, resting, gate, out, net, stray>>
ShowingIsOver == /\ Clear /\ Here /\ showing /\ showing' = FALSE
                 /\ UNCHANGED <<phase, idx, stage, quick, sound, look, limit, resting, gate, out, net, stray>>

\* The সব ধাপ drawer (<details>): opening it changes nothing in the game; a level button restarts and the drawer stays open.
YouOpenOrCloseTheDrawer == /\ Clear /\ Here /\ ~Covered /\ Picking /\ look' = IF look = "drawer" THEN "game" ELSE "drawer"
                           /\ UNCHANGED <<phase, idx, stage, quick, sound, limit, resting, gate, showing, out, net, stray>>
YouPickALevel == /\ Here /\ ~Covered /\ look = "drawer" /\ Restart

\* The চটপট pill and the sound switch, both in the controls row. Modelled at the start of a round or between rounds
\* (Between): a mid-round toggle reaches no state those don't.
YouToggleQuick == /\ Clear /\ Here /\ ~Covered /\ Between /\ quick' = ~quick
                  /\ UNCHANGED <<phase, idx, stage, sound, look, limit, resting, gate, showing, out, net, stray>>
YouToggleSound == /\ Clear /\ Here /\ ~Covered /\ Between /\ sound' = ~sound
                  /\ UNCHANGED <<phase, idx, stage, quick, look, limit, resting, gate, showing, out, net, stray>>

\* Window and tab: nothing in the game listens, so another window and a hidden tab act the same here.
YouLeave == /\ Clear /\ OnPage /\ phase = "play" /\ look # "away" /\ look' = "away" /\ gate' = "closed"
            /\ UNCHANGED <<phase, idx, stage, quick, sound, limit, resting, showing, out, net, stray>>
YouComeBack == /\ Clear /\ OnPage /\ look = "away" /\ look' = "game"
               /\ UNCHANGED <<phase, idx, stage, quick, sound, limit, resting, gate, showing, out, net, stray>>

TheDailyLimitPasses == /\ Clear /\ OnPage /\ look # "away" /\ ~limit /\ limit' = TRUE
                       /\ UNCHANGED <<phase, idx, stage, quick, sound, look, resting, gate, showing, out, net, stray>>

\* Parents use the gate between rounds (the end, closed or rest screen), not mid-round.
\* ParentGate: "closed", "parent" (open, a parent holds the phone), "child" (left open after the phone goes back with
\* no grown-up action: up to 60 s). SomeoneClosesTheGate is বন্ধ করো, two wrong sums or the 60 s timer.
AParentOpensTheGate == /\ Clear /\ Parent /\ gate = "closed" /\ gate' = "parent"
                       /\ UNCHANGED <<phase, idx, stage, quick, sound, look, limit, resting, showing, out, net, stray>>
TheParentHandsThePhoneBack == /\ Clear /\ Parent /\ gate = "parent" /\ gate' = "child"
                              /\ UNCHANGED <<phase, idx, stage, quick, sound, look, limit, resting, showing, out, net, stray>>
SomeoneClosesTheGate == /\ Clear /\ Parent /\ gate # "closed" /\ gate' = "closed"
                        /\ UNCHANGED <<phase, idx, stage, quick, sound, look, limit, resting, showing, out, net, stray>>
SomeoneGivesTenMinutes == /\ Clear /\ Parent /\ resting /\ gate # "closed" /\ resting' = FALSE /\ limit' = FALSE
                          /\ gate' = "closed"      \* one grown-up action, then the gate shuts
                          /\ UNCHANGED <<phase, idx, stage, quick, sound, look, showing, out, net, stray>>
\* Leaving the page: every other variable is parked so the model keeps one state per way out.
Leave(kind) == /\ out' = kind /\ phase' = "play" /\ idx' = 1 /\ stage' = "pick" /\ quick' = FALSE
               /\ sound' = TRUE /\ look' = "game" /\ limit' = FALSE /\ resting' = FALSE
               /\ gate' = "closed" /\ showing' = FALSE /\ Clear /\ UNCHANGED <<net, stray>>
SomeoneShares == /\ Parent /\ gate # "closed" /\ Leave(IF gate = "parent" THEN "parentShared" ELSE "childShared")
TheChildTapsASiteLink == /\ OnPage /\ look # "away" /\ ~Covered /\ gate # "parent" /\ Leave("childLeft")
Gone == ~OnPage /\ UNCHANGED vars

Next == YouTapTheRightPicture \/ TheQuickTimerPasses \/ TheNextPictureComes \/ TheRoundEnds
        \/ YouPlayAgainOrNext \/ YouPressShesh \/ YouShowAParent \/ ShowingIsOver
        \/ YouOpenOrCloseTheDrawer \/ YouPickALevel \/ YouToggleQuick \/ YouToggleSound
        \/ YouLeave \/ YouComeBack \/ TheDailyLimitPasses
        \/ AParentOpensTheGate \/ TheParentHandsThePhoneBack \/ SomeoneClosesTheGate \/ SomeoneGivesTenMinutes
        \/ SomeoneShares \/ TheChildTapsASiteLink \/ Gone

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"play", "end", "closed"} /\ idx \in 1..3 /\ stage \in {"pick", "done"} 
          /\ quick \in BOOLEAN /\ sound \in BOOLEAN /\ look \in {"game", "drawer", "away"}
          /\ limit \in BOOLEAN /\ resting \in BOOLEAN /\ gate \in {"closed", "parent", "child"} /\ showing \in BOOLEAN
          /\ out \in {"none", "parentShared", "childShared", "childLeft"}
          /\ movedAway \in BOOLEAN /\ passedInPicker \in BOOLEAN /\ spokeMuted \in BOOLEAN /\ net \in BOOLEAN /\ stray \in BOOLEAN

\* What a 4–5 year old must press on each screen, and which of those carry a picture or a sound cue.
OnScreen == IF Covered \/ ~OnPage THEN {} ELSE
            CASE phase = "end" -> {"again", "shesh", "nextLevel", "showParent"}
              [] phase = "closed" -> {"again"}
              [] OTHER -> {"picture"}
Pictured == {"picture"}   \* the two picture buttons (and the ghost finger); the end buttons are words only

\* The reader's rules.
NoProgressWhileAway == ~movedAway
ChoiceFreezesPlay == ~passedInPicker
MuteMeansSilent == ~spokeMuted
\* A break: between rounds, or before the first tap of a round (opening the game past the limit).
RestOnlyAtBreak == resting => (phase # "play" \/ (idx = 1 /\ stage = "pick"))
NoShareForKids == out # "childShared"
ParentGate == out # "childLeft"
GateClosesBehindParent == gate # "child"
NoNetwork == ~net          \* nothing calls fetch, sendBeacon, /api/*, share-client or tally
NoChildData == ~stray      \* writes: ektukhani-levels-ulto-khela, ektukhani-kids-time, ektukhani-slow, the sound key
NoReadingNeeded == OnScreen \subseteq Pictured
====
