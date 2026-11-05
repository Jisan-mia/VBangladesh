---- MODULE Late ----
\* দেরি হয়ে গেল after the rewrite: the screens (title, story, the road, the end), the shared player's pause, where the
\* window is (here, another window, a hidden tab, or the road scrolled off), the level list, your hand (a key, the road under
\* a thumb, or a pad), the run and its bell, a friend's road against your own, and the end moment's scheduled chimes.
\* The model of the shipped game is kept as before-fix/Late.before.tla.txt, with its run in before-fix/.
\* Mirrored from tools/deri-hoye-gelo/components/late-game.tsx (begin, finish, keepStars on E.ARRIVE, the blur/focus/visibility
\* effect, the IntersectionObserver on the lane, the sheet effect, the hashchange effect, useGamePlayer's onPause/onResume/
\* onRestart/onLevels), lib/session.ts (ticking, breathing, blur, hide, setInView, pause, resume, openSheet, closeSheet,
\* goTo, letGo, laneDown/keyDown/padDown, takeInput, freshResultKey), lib/step.hot.ts and lib/game.ts (the first press, the
\* gate, the bell, the end moment) and shared/game-player-client.tsx (blur, hide and scrolling the stage away open the
\* menu once you have touched the game; চালিয়ে যাও and নতুন করে শুরু send a focus first; pausing cuts scheduled tones).
\* Abstractions: the road is the run itself, with no distance; you have already touched the game (so the player pauses on leaving);
\* sound is on (the game has no sound loops: the bell, the chimes and the tune are delayed tones, `chime`, which the
\* player's pause and begin() cut). A stumble changes only the bell's clock, which tests/levels.test.ts checks.
EXTENDS Naturals
VARIABLES screen, phase, paused, win, sheet, breath, held, duck, armed, won, recorded, chime, shown, ran
vars == <<screen, phase, paused, win, sheet, breath, held, duck, armed, won, recorded, chime, shown, ran>>

\* screen: "title", "intro" (the story), "play" (the road; phase: "ready" waiting for the first press, "going", "end" the
\* 1.3 s moment at the gate or the bell), "over" (the end screen).
\* win: "here", "blurred" (another window), "hidden" (a hidden tab) or "scrolled" (the road scrolled off a desktop page).
\* held is what the session thinks is held: "off", "jump" (a key, the road under a thumb or a pad), "duck", or "stale": a
\* key still physically down from before the end screen showed (its auto-repeat is `repeat`, so it never counts).
\* shown is the road on screen: "mine", or "friend" once their link is open; ran is the road of the run itself.
Moves == screen = "play" /\ ~paused /\ ~sheet /\ win = "here"
Ticking == Moves /\ ~breath
CanTap == ~paused /\ ~sheet /\ win = "here"
Released == /\ held' = "off" /\ duck' = FALSE /\ armed' = FALSE

\* begin(): a fresh run on the play screen, waiting for the first press; silenceScheduled cuts the last card's chimes.
BeginWith(road) == /\ screen' = "play" /\ phase' = "ready" /\ won' = FALSE /\ recorded' = FALSE
                   /\ held' = "off" /\ duck' = FALSE /\ armed' = FALSE /\ breath' = FALSE /\ sheet' = FALSE /\ chime' = FALSE
                   /\ shown' = road /\ ran' = road

\* start() on the title: the story first on the first run without a friend, else straight into the run.
YouTapStart == /\ screen = "title" /\ CanTap
               /\ \/ BeginWith(shown)
                  \/ /\ shown = "mine" /\ screen' = "intro" /\ Released
                     /\ UNCHANGED <<phase, breath, sheet, won, recorded, chime, shown, ran>>
               /\ UNCHANGED <<paused, win>>
YouFinishTheStory == /\ screen = "intro" /\ CanTap /\ BeginWith(shown) /\ UNCHANGED <<paused, win>>
\* A key, the road under a thumb or a pad: counts only while the road is moving (the click that brings focus back
\* does not), and nothing is already held. `armed` is the press the next step will take.
YouPress == /\ Moves /\ held = "off" /\ phase \in {"ready", "going"}
            /\ held' \in {"jump", "duck"} /\ armed' = TRUE
            /\ UNCHANGED <<screen, phase, paused, win, sheet, breath, duck, won, recorded, chime, shown, ran>>
YouLetGo == /\ held # "off" /\ held' = "off" /\ duck' = FALSE
            /\ UNCHANGED <<screen, phase, paused, win, sheet, breath, armed, won, recorded, chime, shown, ran>>
\* takeInput: the press since the last step counts once; the first one starts the run (and the bell).
StepTakesPress == /\ Ticking /\ armed /\ phase \in {"ready", "going"}
                  /\ armed' = FALSE /\ phase' = IF phase = "ready" THEN "going" ELSE phase
                  /\ duck' = (held = "duck")
                  /\ UNCHANGED <<screen, paused, win, sheet, breath, held, won, recorded, chime, shown, ran>>
\* stepRun: the kid runs, the bell runs.
RoadRuns == /\ Ticking /\ phase = "going" /\ (duck # (held = "duck") \/ armed)
            /\ duck' = (held = "duck") /\ armed' = FALSE
            /\ UNCHANGED <<screen, phase, paused, win, sheet, breath, held, won, recorded, chime, shown, ran>>
\* E.ARRIVE: the gate is reached before the bell: keepStars records the stars now, before the end moment.
GateReached == /\ Ticking /\ phase = "going"
               /\ phase' = "end" /\ won' = TRUE /\ recorded' = TRUE
               /\ UNCHANGED <<screen, paused, win, sheet, breath, held, duck, armed, chime, shown, ran>>
\* E.LATE: the bell rings first.
BellRings == /\ Ticking /\ phase = "going"
             /\ phase' = "end" /\ won' = FALSE
             /\ UNCHANGED <<screen, paused, win, sheet, breath, held, duck, armed, recorded, chime, shown, ran>>
\* E.OVER, END_TIME later: finish() shows the end screen (goTo lets go: a key still down is now ignored); the stars' chimes
\* and the bell's rings are delayed tones.
EndMomentPasses == /\ Ticking /\ phase = "end"
                   /\ screen' = "over" /\ chime' = TRUE
                   /\ held' = (IF held = "off" THEN "off" ELSE "stale") /\ duck' = FALSE /\ armed' = FALSE
                   /\ UNCHANGED <<phase, paused, win, sheet, breath, won, recorded, shown, ran>>
\* The breath after চালিয়ে যাও or closing the list: a press made now waits and counts once it ends.
BreathEnds == /\ Moves /\ breath /\ breath' = FALSE
              /\ UNCHANGED <<screen, phase, paused, win, sheet, held, duck, armed, won, recorded, chime, shown, ran>>

\* Where the window is. S.blur / S.hide / S.setInView let go of every key and finger at once, and the player opens its
\* menu and cuts scheduled tones.
WindowBlurs == /\ win = "here" /\ win' = "blurred" /\ Released /\ paused' = TRUE /\ chime' = FALSE
               /\ UNCHANGED <<screen, phase, sheet, breath, won, recorded, shown, ran>>
WindowFocuses == /\ win = "blurred" /\ win' = "here"
                 /\ UNCHANGED <<screen, phase, paused, sheet, breath, held, duck, armed, won, recorded, chime, shown, ran>>
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ Released /\ paused' = TRUE /\ chime' = FALSE
            /\ UNCHANGED <<screen, phase, sheet, breath, won, recorded, shown, ran>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<screen, phase, paused, sheet, breath, held, duck, armed, won, recorded, chime, shown, ran>>
ScrollAway == /\ win = "here" /\ win' = "scrolled" /\ Released /\ paused' = TRUE /\ chime' = FALSE
              /\ UNCHANGED <<screen, phase, sheet, breath, won, recorded, shown, ran>>
ScrollBack == /\ win = "scrolled" /\ win' = "here"
              /\ UNCHANGED <<screen, phase, paused, sheet, breath, held, duck, armed, won, recorded, chime, shown, ran>>
\* P, Esc or ⏸ (player.requestPause): the menu opens, a synthetic blur lets go, scheduled tones are cut, onPause.
YouOpenTheMenu == /\ ~paused /\ win \in {"here", "scrolled"}
                  /\ paused' = TRUE /\ win' = (IF win = "here" THEN "blurred" ELSE win) /\ Released /\ chime' = FALSE
                  /\ UNCHANGED <<screen, phase, sheet, breath, won, recorded, shown, ran>>
\* চালিয়ে যাও: a focus first, then onResume: fresh hands and a breath before the road moves.
YouResume == /\ paused /\ win # "hidden" /\ paused' = FALSE /\ win' = (IF win = "blurred" THEN "here" ELSE win) /\ Released /\ breath' = (screen = "play")
             /\ UNCHANGED <<screen, phase, sheet, won, recorded, chime, shown, ran>>
\* নতুন করে শুরু: a focus, then onRestart: begin() the same level (on the road or the end screen).
YouRestart == /\ paused /\ win # "hidden" /\ screen \in {"play", "over"}
              /\ BeginWith(ran) /\ paused' = FALSE /\ win' = (IF win = "blurred" THEN "here" ELSE win)
\* সব লেভেল in the menu (onLevels): resume, then open the list.
YouOpenTheListFromTheMenu == /\ paused /\ win # "hidden" /\ paused' = FALSE /\ win' = (IF win = "blurred" THEN "here" ELSE win) /\ sheet' = TRUE /\ Released /\ breath' = TRUE
                             /\ UNCHANGED <<screen, phase, won, recorded, chime, shown, ran>>
\* সব লেভেল on the title or the end screen: a choice screen, nothing moves behind it.
YouOpenTheList == /\ screen \in {"title", "over"} /\ CanTap /\ sheet' = TRUE /\ Released
                  /\ UNCHANGED <<screen, phase, paused, win, breath, won, recorded, chime, shown, ran>>
\* Shutting the list mid-run gives the same breath as চালিয়ে যাও.
YouCloseTheList == /\ sheet /\ ~paused /\ sheet' = FALSE /\ breath' = (screen = "play") /\ Released
                   /\ UNCHANGED <<screen, phase, paused, win, won, recorded, chime, shown, ran>>
\* A level from the list: the friend's road if it is their level (when their link is open), else a new one.
YouPickALevel == /\ sheet /\ CanTap
                 /\ \/ BeginWith("mine") \/ BeginWith(shown)
                 /\ UNCHANGED <<paused, win>>
\* The end screen's ১ ২ ৩ or a fresh Enter (freshResultKey): a held key's auto-repeat never counts, so a key still
\* down from the run (`stale`) cannot choose. A click on a choice also counts.
YouPlayOn == /\ screen = "over" /\ CanTap /\ held = "off"
             /\ BeginWith(ran)
             /\ UNCHANGED <<paused, win>>
\* A friend's link arrives (hashchange): never under a run. The run ends and the title shows their road.
FriendLinkOpens == /\ win # "hidden" /\ shown' = "friend" /\ ran' = "friend"
                   /\ screen' = "title" /\ phase' = "ready" /\ won' = FALSE /\ recorded' = FALSE
                   /\ Released /\ chime' = FALSE /\ sheet' = FALSE /\ breath' = FALSE
                   /\ UNCHANGED <<paused, win>>
YouPlayYourOwn == /\ screen = "title" /\ shown = "friend" /\ shown' = "mine" /\ ran' = "mine"
                  /\ UNCHANGED <<screen, phase, paused, win, sheet, breath, held, duck, armed, won, recorded, chime>>
ChimesEnd == /\ chime /\ chime' = FALSE
             /\ UNCHANGED <<screen, phase, paused, win, sheet, breath, held, duck, armed, won, recorded, shown, ran>>

Init == /\ screen = "title" /\ phase = "ready" /\ paused = FALSE /\ win = "here" /\ sheet = FALSE
        /\ breath = FALSE /\ held = "off" /\ duck = FALSE /\ armed = FALSE /\ won = FALSE /\ recorded = FALSE
        /\ chime = FALSE /\ shown = "mine" /\ ran = "mine"

Next == YouTapStart \/ YouFinishTheStory \/ YouPress \/ YouLetGo \/ StepTakesPress \/ RoadRuns \/ GateReached \/ BellRings
        \/ EndMomentPasses \/ BreathEnds \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ ScrollAway \/ ScrollBack
        \/ YouOpenTheMenu \/ YouResume \/ YouRestart \/ YouOpenTheListFromTheMenu \/ YouOpenTheList \/ YouCloseTheList
        \/ YouPickALevel \/ YouPlayOn \/ FriendLinkOpens \/ YouPlayYourOwn \/ ChimesEnd

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "intro", "play", "over"} /\ phase \in {"ready", "going", "end"}
          /\ paused \in BOOLEAN /\ win \in {"here", "blurred", "hidden", "scrolled"} /\ sheet \in BOOLEAN /\ breath \in BOOLEAN
          /\ held \in {"off", "jump", "duck", "stale"} /\ duck \in BOOLEAN /\ armed \in BOOLEAN
          /\ won \in BOOLEAN /\ recorded \in BOOLEAN /\ chime \in BOOLEAN
          /\ shown \in {"mine", "friend"} /\ ran \in {"mine", "friend"}

\* The reader's rules. The four that broke before come first.
PausedWhenBlurred == (win = "blurred" /\ screen = "play") => paused
InputReleasedWhenAway == (win # "here" \/ paused \/ sheet \/ screen # "play") => (held \in {"off", "stale"} /\ ~armed /\ ~duck)
InputMatchesHand == duck => held = "duck"
NoCelebrationAfterLeaving == chime => (screen = "over" /\ ~paused)
ReplayIsExact == screen = "play" => ran = shown
\* The old model's rules that held, in the new variables.
PausedWhenHidden == (win = "hidden" /\ screen = "play") => paused
\* The end screen's chimes are made once, when it shows, never while it is already up.
NoDoubleResult == [][(screen = "over" /\ screen' = "over" /\ chime') => chime]_vars
\* New with the rewrite.
ChoiceFreezesPlay == sheet => ~Ticking
StillWhenOffScreen == (win = "scrolled" /\ screen = "play") => ~Ticking
StarsKeptTheMomentYouWin == (won /\ (phase = "end" \/ screen = "over")) => recorded
\* A stale key never chooses: the end screen starts a run only from a fresh press.
ResultNeedsAFreshPress == [][(screen = "over" /\ screen' = "play") => held = "off"]_vars
\* Something happens on the road (a press taken, a step, the gate, the bell, the end moment) only while it moves, and a
\* press made in the breath waits for it to end.
ProgressOnlyWhileTicking == [][((phase' # phase /\ screen = "play" /\ screen' \in {"play", "over"} /\ ~(screen' = "play" /\ phase' = "ready"))) => Ticking]_vars
TheClickBackIsNotAPress == [][(held' \in {"jump", "duck"} /\ held \notin {"jump", "duck"}) => Moves]_vars
====
