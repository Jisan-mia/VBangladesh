---- MODULE Milk ----
\* দুধ উথলানোর আগে: the pots of one kitchen (the count abstracted: after any pot's score, the next pot or the card), pause on a hidden tab, window focus, the held
\* Space or finger, the hum loop, the delayed celebration, the kitchen list and a friend's link.
\* Mirrored from tools/dudh-uthlano/components/milk-game.tsx (begin, press, release, liftNow, finishRound,
\* step, the visibilitychange and hashchange effects, again/primary/choose) and tools/dudh-uthlano/lib/dudh.ts
\* (startPot, liftPot, stepRound), plus shared/game-sound.ts (loop(), setSoundOn) and shared/game-kit.ts
\* (useGameLoop stops frames while the tab is hidden, never on blur).
VARIABLES phase, paused, visible, focused, hold, hum, sound, cheer, friend, on, seed
vars == <<phase, paused, visible, focused, hold, hum, sound, cheer, friend, on, seed>>

Phases == {"waiting", "rising", "result", "over"}
\* on: which kitchen is open ("theirs" = the friend's kitchen, "mine" = another); seed: whose pots are on the stove.
Running == ~paused /\ visible            \* useGameLoop steps the round

Init == /\ phase = "waiting" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ hold = FALSE /\ hum = FALSE /\ sound = TRUE /\ cheer = FALSE
        /\ friend = FALSE /\ on = "mine" /\ seed = "fresh"

\* begin(seed, kitchen): a fresh round; it stops the hum and clears hold and paused, not the celebration timer.
Begin(which, linked) == /\ phase' = "waiting" /\ paused' = FALSE /\ hold' = FALSE /\ hum' = FALSE
                /\ on' = which
                /\ seed' = IF linked /\ which = "theirs" THEN "theirs" ELSE "fresh"

\* press(): Space keydown or pointerdown on the stage or the big button.
\* While paused it only resumes (and restarts the hum on a rising pot).
YouPressToResume == /\ paused /\ visible /\ focused
                    /\ paused' = FALSE /\ hum' = (phase = "rising" /\ sound)
                    /\ UNCHANGED <<phase, visible, focused, hold, sound, cheer, friend, on, seed>>
\* On a waiting pot: startPot(), ignite, the hum starts, the press counts as held.
YouPressToLight == /\ ~paused /\ visible /\ focused /\ ~hold /\ phase = "waiting"
                   /\ phase' = "rising" /\ hold' = TRUE /\ hum' = sound
                   /\ UNCHANGED <<paused, visible, focused, sound, cheer, friend, on, seed>>
\* On a rising pot after a short tap: liftNow().
YouPressToLift == /\ ~paused /\ visible /\ focused /\ ~hold /\ phase = "rising"
                  /\ phase' = "result" /\ hum' = FALSE
                  /\ UNCHANGED <<paused, visible, focused, hold, sound, cheer, friend, on, seed>>
\* release(): keyup or pointerup reaches the page only while it has focus. A short tap leaves the milk heating.
YouLetGoQuickly == /\ hold /\ focused
                   /\ hold' = FALSE
                   /\ UNCHANGED <<phase, paused, visible, focused, hum, sound, cheer, friend, on, seed>>
\* A real hold (≥ 260 ms) lifts the pot the moment it ends.
YouLetGoAfterHolding == /\ hold /\ focused /\ phase = "rising"
                        /\ hold' = FALSE /\ phase' = "result" /\ hum' = FALSE
                        /\ UNCHANGED <<paused, visible, focused, sound, cheer, friend, on, seed>>
\* stepRound(): the foam reaches the rim. step() clears hold, stops the hum, sizzles.
MilkSpills == /\ phase = "rising" /\ Running
              /\ phase' = "result" /\ hold' = FALSE /\ hum' = FALSE
              /\ UNCHANGED <<paused, visible, focused, sound, cheer, friend, on, seed>>
\* stepRound(): after 1.4 s the next pot comes, or the round ends: finishRound() stops the hum, records stars,
\* and queues the stars' notes, confetti or the lose sound for 0.3–1.1 s later (never cleared).
NextPotComes == /\ phase = "result" /\ Running
                /\ phase' = "waiting"
                /\ UNCHANGED <<paused, visible, focused, hold, hum, sound, cheer, friend, on, seed>>
RoundEnds == /\ phase = "result" /\ Running
             /\ phase' = "over" /\ hum' = FALSE /\ cheer' = TRUE
             /\ UNCHANGED <<paused, visible, focused, hold, sound, friend, on, seed>>
CheerPlays == /\ cheer /\ cheer' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, hold, hum, sound, friend, on, seed>>
\* On the card, after the 0.6 s guard: পরের রান্নাঘর / আরেকবার / আবার এই রান্নাঘরে খেলো → begin().
YouPlayOn == /\ phase = "over" /\ visible /\ focused
             /\ Begin(on, friend)
             /\ UNCHANGED <<visible, focused, sound, cheer, friend>>
\* নতুন পাতিলে খেলো under a friend's card: setFriend(null), begin(fresh pots) in the same kitchen.
YouPlayFreshPots == /\ phase = "over" /\ friend /\ visible /\ focused
                    /\ friend' = FALSE /\ Begin(on, FALSE)
                    /\ UNCHANGED <<visible, focused, sound, cheer>>
\* LevelGrid onPick → choose(): begin() on any screen.
YouPickKitchen(which) == /\ visible /\ focused /\ (which = "theirs" => friend)
                         /\ Begin(which, friend)
                         /\ UNCHANGED <<visible, focused, sound, cheer, friend>>
\* hashchange with a valid link: begin(friend's seed, friend's kitchen) on any screen.
FriendLinkOpens == /\ ~friend /\ visible
                   /\ friend' = TRUE /\ Begin("theirs", TRUE)
                   /\ UNCHANGED <<visible, focused, sound, cheer>>
\* There is no blur listener.
WindowBlurs == /\ visible /\ focused /\ focused' = FALSE
               /\ UNCHANGED <<phase, paused, visible, hold, hum, sound, cheer, friend, on, seed>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, hold, hum, sound, cheer, friend, on, seed>>
\* visibilitychange → hidden: only a rising pot pauses (hold cleared; the paused effect stops the hum).
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE
            /\ paused' = (paused \/ phase = "rising")
            /\ hold' = IF phase = "rising" THEN FALSE ELSE hold
            /\ hum' = IF phase = "rising" THEN FALSE ELSE hum
            /\ UNCHANGED <<phase, sound, cheer, friend, on, seed>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, hold, hum, sound, cheer, friend, on, seed>>
\* The site-wide switch: off stops every loop; on starts nothing.
SoundOff == /\ sound /\ focused /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, hold, cheer, friend, on, seed>>
SoundOn == /\ ~sound /\ focused /\ sound' = TRUE
           /\ UNCHANGED <<phase, paused, visible, focused, hold, hum, cheer, friend, on, seed>>

Next == YouPressToResume \/ YouPressToLight \/ YouPressToLift \/ YouLetGoQuickly \/ YouLetGoAfterHolding
        \/ MilkSpills \/ NextPotComes \/ RoundEnds \/ CheerPlays \/ YouPlayOn \/ YouPlayFreshPots
        \/ YouPickKitchen("theirs") \/ YouPickKitchen("mine") \/ FriendLinkOpens
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN
          /\ focused \in BOOLEAN /\ hold \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ cheer \in BOOLEAN /\ friend \in BOOLEAN /\ on \in {"theirs", "mine"} /\ seed \in {"theirs", "fresh"}

\* The reader's rules.
PausedWhenHidden == (phase = "rising" /\ ~visible) => paused
PausedWhenBlurred == (phase = "rising" /\ ~paused) => focused
InputReleasedWhenAway == hold => focused
HumOnlyWhileHeating == hum => (phase = "rising" /\ ~paused /\ visible /\ sound)
HumComesBack == (phase = "rising" /\ ~paused /\ visible /\ sound) => hum
CelebrationOnItsOwnCard == cheer => phase = "over"
ReplayIsExact == (friend /\ on = "theirs") => seed = "theirs"
====
