---- MODULE Danguli ----
\* ডাংগুলি after the rewrite: the screen and the hit, the player's pause menu, the window and tab, the level list, a held play
\* key and its auto-repeat, the breath after coming back, the wind loop, the site-wide sound switch, the star chimes, the result
\* keys and the friend's link reopening the first screen. Mirrored from tools/danguli/lib/session.ts (ticking, canTap, wantWind, syncLoops, blur/focus/hide/
\* show, pause/resume, openSheet/closeSheet, setSound, keyDown/keyUp, goTo, freshResultKey, wake, step), tools/danguli/lib/
\* challenge.ts (seedFor) and tools/danguli/components/game.tsx (begin, again, show, engaged, away/back, the player's onPause/
\* onResume/onRestart/onLevels, tap, onDown, finish, readLink, pickLevel, the sound effect, the window keys). The round moves only
\* inside step(), which advances it only while ticking and after the breath; `focused` starts from document.hasFocus() and lives
\* in the session, so remounting useGameLoop changes nothing. Leaving in any way lets go of a held key. The player opens its menu
\* on blur and hide once the game was touched. One hit, not three (a hit changes nothing the rules look at); a windy level (the
\* চর), because only those have a loop; the intro story is part of the first screen.
EXTENDS Naturals

VARIABLES phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, skipped, byItself,
          results, chimes
vars == <<phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, skipped, byItself,
          results, chimes>>

Phases == {"title", "play", "over"}
Balls == {"aim", "pop", "fly", "rest"}
Winds == {"none", "stub", "live"}

\* session.ts ticking(): the only state in which step() runs at all.
TickingOf(ph, pz, sh, vi, fo) == ph = "play" /\ ~pz /\ ~sh /\ vi /\ fo
Ticking == TickingOf(phase, paused, sheet, visible, focused)
\* step() moves the round only after the breath; taps count only then (canTap).
ClockRuns == Ticking /\ ~breath
CanTap == Ticking /\ ~breath
\* syncLoops: the wind it leaves behind for a state (a fresh loop() each time it turns on, so never a stub).
WindOf(ph, pz, sh, vi, fo, so) == IF TickingOf(ph, pz, sh, vi, fo) /\ so THEN "live" ELSE "none"
\* session.keyDown(s, repeat): a repeat never acts; a fresh press acts only while taps count.
KeyDownActs(repeat) == ~repeat /\ CanTap
\* session.freshResultKey(s, event): not a repeat, and the keydown arrived after the screen appeared (`fresh` is the moment
\* when only keys already on their way, or held through the end, can land), and neither the menu nor the list is open.
ResultKeyActs(repeat) == phase = "over" /\ ~paused /\ ~sheet /\ ~repeat /\ ~fresh

\* Starting unfocused or muted is reached by WindowBlurs and SoundOff.
Init == /\ phase = "title" /\ ball = "aim" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ sheet = FALSE
        /\ sound = TRUE /\ wind = "none" /\ key = "up" /\ stale = FALSE /\ breath = FALSE /\ fresh = FALSE
        /\ skipped = FALSE /\ byItself = FALSE /\ results = 0 /\ chimes = FALSE

\* begin(): a fresh round on the play screen: the star timers cut (silenceScheduled), the list shut, the wind decided afresh.
\* A press on a window without focus first gives it focus (engaged(), the same as WindowFocuses), so a start runs focused.
Begin == /\ phase' = "play" /\ ball' = "aim" /\ sheet' = FALSE /\ stale' = FALSE /\ breath' = FALSE /\ fresh' = FALSE
               /\ results' = 0 /\ chimes' = FALSE
               /\ wind' = WindOf("play", FALSE, FALSE, TRUE, TRUE, sound)
CanBegin == ~paused /\ ~sheet /\ visible /\ focused
\* finish(): the result screen (the wind stops, the star chimes are set, a key already on its way is still `fresh`).
Finish == /\ phase' = "over" /\ ball' = ball /\ results' = results + 1 /\ chimes' = TRUE /\ fresh' = TRUE /\ wind' = "none"
          /\ UNCHANGED <<sheet, stale, breath>>

\* The title's খেলো (button, Enter or Space).
YouStart == /\ phase = "title" /\ CanBegin /\ Begin
            /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>
\* The end screen's buttons (আবার খেলো, পরের লেভেল): another round. Which field it plays is DanguliLink.tla's question.
YouPlayAgain == /\ phase = "over" /\ ~paused /\ visible /\ focused /\ Begin
                /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>
\* A key on the end screen (1, Enter, Space, R): freshResultKey takes only a non-repeating keydown after the screen appeared.
\* While `fresh`, a key is the one already on its way (or held through the end), and is ignored.
YouPressAKeyOnTheResult == /\ phase = "over" /\ ~paused /\ ~sheet /\ visible /\ focused
                           /\ IF ResultKeyActs(FALSE) THEN /\ Begin
                                                          /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>
                              ELSE UNCHANGED vars
TheResultSettles == /\ fresh /\ fresh' = FALSE
                    /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, breath, skipped, byItself, results, chimes>>

\* tap(): a finger or a fresh key press, when taps count: flick, then strike or swing at air, or skip the rest.
TapEffect == \/ /\ ball = "aim" /\ ball' = "pop" /\ UNCHANGED <<phase, results, chimes, fresh, wind, sheet, stale, breath>>
             \/ /\ ball = "pop" /\ ball' \in {"fly", "rest"} /\ UNCHANGED <<phase, results, chimes, fresh, wind, sheet, stale, breath>>
             \/ /\ ball = "rest" /\ Finish
YouTapTheField == /\ CanTap /\ TapEffect
                  /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>
\* The press that brings an unfocused window back: engaged() focuses and wakes the round, and it is never a tap.
YouClickAnUnfocusedWindow == /\ phase = "play" /\ visible /\ ~focused /\ ~paused /\ ~sheet
                             /\ focused' = TRUE /\ stale' = FALSE /\ breath' = (breath \/ stale)
                             /\ wind' = WindOf("play", FALSE, FALSE, TRUE, TRUE, sound)
                             /\ UNCHANGED <<phase, ball, paused, visible, sheet, sound, key, fresh, skipped, byItself, results, chimes>>
\* keydown of Space, Enter or ↑ in play. A fresh press acts when taps count; the key counts as held either way.
YouPressAPlayKey == /\ phase = "play" /\ ~paused /\ ~sheet /\ visible /\ focused /\ key = "up" /\ key' = "down"
                    /\ IF KeyDownActs(FALSE) THEN TapEffect
                       ELSE UNCHANGED <<phase, ball, results, chimes, fresh, wind, sheet, stale, breath>>
                    /\ UNCHANGED <<paused, visible, focused, sound, skipped, byItself>>
\* keyup. The keyboard's auto-repeat of a held key arrives as keydown with repeat: it never acts, in play or on the result.
YouLetGo == /\ key = "down" /\ key' = "up"
            /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, sound, wind, stale, breath, fresh, skipped, byItself, results, chimes>>
TheKeyRepeats == /\ key = "down"
                 /\ byItself' = (byItself \/ KeyDownActs(TRUE))
                 /\ skipped' = (skipped \/ ResultKeyActs(TRUE))
                 /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, results, chimes>>

\* step(): the clock runs only while ticking and past the breath.
TheKathiLands == /\ ClockRuns /\ ball = "pop" /\ ball' = "rest"
                 /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, skipped, byItself, results, chimes>>
TheShotSettles == /\ ClockRuns /\ ball = "fly" /\ ball' = "rest"
                  /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, skipped, byItself, results, chimes>>
TheRestEnds == /\ ClockRuns /\ ball = "rest" /\ Finish
               /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>
\* The breath after coming back runs out (step() counts it down only while ticking).
TheBreathEnds == /\ Ticking /\ breath /\ breath' = FALSE
                 /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, fresh, skipped, byItself, results, chimes>>
\* The star chimes (scheduled tones) play out.
TheChimesPlay == /\ chimes /\ chimes' = FALSE
                 /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, sound, wind, key, stale, breath, fresh, skipped, byItself, results>>

\* Leaving (session away(): stale if it was ticking; a held key lets go; syncLoops). The player opens its menu in a round.
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ key' = "up" /\ wind' = "none"
               /\ UNCHANGED <<phase, ball, visible, sheet, sound, breath, fresh, skipped, byItself, results, chimes>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ key' = "up" /\ wind' = "none"
            /\ UNCHANGED <<phase, ball, sheet, sound, breath, fresh, skipped, byItself, results, chimes>>
\* ⏸ or P: the player's menu (it cuts scheduled tones, so pending chimes stop).
YouPause == /\ ~paused /\ visible /\ focused
            /\ paused' = TRUE /\ stale' = (stale \/ Ticking) /\ key' = "up" /\ wind' = "none" /\ chimes' = FALSE
            /\ UNCHANGED <<phase, ball, visible, focused, sheet, sound, breath, fresh, skipped, byItself, results>>
\* Coming back (session back(): wake gives a breath when the round may tick again after time away; syncLoops).
Wake(ph, pz, sh, vi, fo) == LET t == TickingOf(ph, pz, sh, vi, fo) IN
                            /\ stale' = (stale /\ ~t) /\ breath' = (breath \/ (stale /\ t))
                            /\ wind' = WindOf(ph, pz, sh, vi, fo, sound)
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ Wake(phase, paused, sheet, TRUE, TRUE)
                 /\ UNCHANGED <<phase, ball, paused, visible, sheet, sound, key, fresh, skipped, byItself, results, chimes>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE /\ Wake(phase, paused, sheet, TRUE, TRUE)
            /\ UNCHANGED <<phase, ball, paused, sheet, sound, key, fresh, skipped, byItself, results, chimes>>
\* চালিয়ে যাও (onResume).
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ Wake(phase, FALSE, sheet, visible, focused)
             /\ UNCHANGED <<phase, ball, visible, focused, sheet, sound, key, fresh, skipped, byItself, results, chimes>>
\* নতুন করে শুরু (onRestart): resume, then begin(again(run)) on the same level.
YouRestart == /\ paused /\ phase \in {"play", "over"} /\ visible /\ focused
              /\ paused' = FALSE /\ Begin
              /\ UNCHANGED <<visible, focused, sound, key, skipped, byItself>>

\* The level list: a choice screen. Opening stops the round and lets a held key go; closing wakes it with a breath. It opens
\* from the first screen and the end screen, and from the menu's সব লেভেল (which resumes first, then opens).
OpenTheList == /\ ~sheet /\ ~paused /\ visible /\ focused /\ phase # "play"
               /\ sheet' = TRUE /\ key' = "up" /\ wind' = "none"
               /\ UNCHANGED <<phase, ball, paused, visible, focused, sound, stale, breath, fresh, skipped, byItself, results, chimes>>
OpenTheListFromTheMenu == /\ paused /\ ~sheet /\ visible /\ focused
                          /\ paused' = FALSE /\ sheet' = TRUE /\ key' = "up" /\ wind' = "none"
                          /\ stale' = (stale \/ phase = "play") /\ breath' = (breath \/ (stale /\ phase = "play"))
                          /\ UNCHANGED <<phase, ball, visible, focused, sound, fresh, skipped, byItself, results, chimes>>
CloseTheList == /\ sheet /\ ~paused /\ visible /\ focused
                /\ sheet' = FALSE /\ Wake(phase, FALSE, FALSE, visible, focused)
                /\ UNCHANGED <<phase, ball, paused, visible, focused, sound, key, fresh, skipped, byItself, results, chimes>>
\* pickLevel(): a level from the list begins a fresh round (the list shuts).
YouPickALevel == /\ sheet /\ ~paused /\ visible /\ focused /\ Begin
                 /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself>>

\* hashchange with a real challenge: the page goes back to the first screen (show("title") resets the breath, stops the wind and
\* cuts the star chimes). The friend's field itself is DanguliLink.tla.
FriendLinkOpens == /\ phase' = "title" /\ ball' = "aim"
                   /\ stale' = FALSE /\ breath' = FALSE /\ wind' = "none" /\ chimes' = FALSE /\ fresh' = FALSE
                   /\ UNCHANGED <<paused, visible, focused, sheet, sound, key, skipped, byItself, results>>

\* The site-wide switch. Off: the kit stops every loop and cuts queued notes. On: syncLoops starts a fresh one.
SoundOff == /\ sound /\ sound' = FALSE /\ wind' = "none" /\ chimes' = FALSE
            /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, key, stale, breath, fresh, skipped, byItself, results>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ wind' = WindOf(phase, paused, sheet, visible, focused, TRUE)
           /\ UNCHANGED <<phase, ball, paused, visible, focused, sheet, key, stale, breath, fresh, skipped, byItself, results, chimes>>

Next == YouStart \/ YouPlayAgain \/ YouPressAKeyOnTheResult \/ TheResultSettles
        \/ YouTapTheField \/ YouClickAnUnfocusedWindow \/ YouPressAPlayKey \/ YouLetGo \/ TheKeyRepeats
        \/ TheKathiLands \/ TheShotSettles \/ TheRestEnds \/ TheBreathEnds \/ TheChimesPlay
        \/ WindowBlurs \/ TabHides \/ YouPause \/ WindowFocuses \/ TabShows \/ YouResume \/ YouRestart
        \/ OpenTheList \/ OpenTheListFromTheMenu \/ CloseTheList \/ YouPickALevel \/ FriendLinkOpens \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ ball \in Balls /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN /\ sheet \in BOOLEAN
          /\ sound \in BOOLEAN /\ wind \in Winds /\ key \in {"up", "down"} /\ stale \in BOOLEAN /\ breath \in BOOLEAN
          /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN /\ byItself \in BOOLEAN /\ results \in 0..1 /\ chimes \in BOOLEAN

\* The reader's rules: seven of the eight from before the rewrite (ReplayIsExact is DanguliLink.tla), plus the shared ones.
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
InputReleasedWhenAway == key = "down" => (focused /\ visible /\ ~paused /\ ~sheet)
HeldKeyActsOnce == ~byItself
ResultStaysUntilYouChoose == ~skipped
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == chimes => phase = "over"
NoProgressWhileAway == ClockRuns => (focused /\ visible /\ ~paused)
PauseOnlyMidRound == (stale \/ breath) => phase = "play"
LoopOnlyWhenMeaningful == wind = "live" => (Ticking /\ sound)
LoopComesBack == (Ticking /\ sound) => wind = "live"
NeverAStub == wind # "stub"
ChoiceFreezesPlay == sheet => ~ClockRuns
\* Whenever the round moves again after time away, the breath ran first.
BreathAfterAway == Ticking => ~stale
====
