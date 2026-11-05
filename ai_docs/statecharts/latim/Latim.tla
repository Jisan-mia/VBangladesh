---- MODULE Latim ----
\* লাটিম after the rewrite: the screen and the top, the player's pause menu, the window and tab, the level list, the hand (a
\* hold on the button or key to wind, a finger pulling down), a held play key and its auto-repeat, the breath after coming back,
\* the hum, the site-wide sound switch, the star chimes, the result keys, হাতে তোলো and the friend's link reopening the first
\* screen. Mirrored from tools/latim/lib/session.ts (ticking, canTap, wantHum, syncLoops, blur/focus/hide/show, pause/resume,
\* openSheet/closeSheet, setSound, setSpinning, keyDown/keyUp, goTo, freshResultKey, wake, step), tools/latim/lib/top.ts
\* (beginWind, endWind, cancelWind, throwTop, lift, releaseInput) and tools/latim/components/game.tsx (begin, away/back,
\* releaseHand, the player's onPause/onResume/onRestart/onLevels, onDown/onUp (the pull), onMainDown/onMainUp (the pad), tryLift,
\* finish, readLink, pickLevel, the sound effect, the window keys). The top moves only inside step(), which advances it only while
\* ticking and after the breath; `focused` lives in the session, so remounting useGameLoop changes nothing. Leaving in any way
\* lets go of every hand (hold, pull, key) and throws nothing. One level, a windless one (the hum is the loop).
EXTENDS Naturals

VARIABLES phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself,
          liftedAway, results, chimes
vars == <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself,
          liftedAway, results, chimes>>

Phases == {"title", "play", "over"}
Tops == {"hand", "spin", "fallen"}
Hums == {"none", "stub", "live"}

\* session.ts ticking(): the only state in which step() runs at all.
TickingOf(ph, pz, sh, vi, fo) == ph = "play" /\ ~pz /\ ~sh /\ vi /\ fo
Ticking == TickingOf(phase, paused, sheet, visible, focused)
ClockRuns == Ticking /\ ~breath
CanTap == Ticking /\ ~breath
\* syncLoops: the hum it leaves behind (a fresh loop() each time it turns on, so never a stub): ticking, sound, and spinning.
HumOf(ph, tp, pz, sh, vi, fo, so) == IF TickingOf(ph, pz, sh, vi, fo) /\ so /\ tp = "spin" THEN "live" ELSE "none"
KeyDownActs(repeat) == ~repeat /\ CanTap
ResultKeyActs(repeat) == phase = "over" /\ ~paused /\ ~sheet /\ ~repeat /\ ~fresh

Init == /\ phase = "title" /\ top = "hand" /\ winding = FALSE /\ pull = FALSE /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE
        /\ sheet = FALSE /\ sound = TRUE /\ hum = "none" /\ key = "up" /\ stale = FALSE /\ breath = FALSE /\ fresh = FALSE
        /\ skipped = FALSE /\ byItself = FALSE /\ liftedAway = FALSE /\ results = 0 /\ chimes = FALSE

\* begin(): a fresh spin on the play screen: the star timers cut, the list shut, the hum decided afresh (nothing spins yet).
Begin == /\ phase' = "play" /\ top' = "hand" /\ winding' = FALSE /\ pull' = FALSE /\ sheet' = FALSE /\ stale' = FALSE
         /\ breath' = FALSE /\ fresh' = FALSE /\ results' = 0 /\ chimes' = FALSE /\ hum' = "none"
CanBegin == ~paused /\ ~sheet /\ visible /\ focused
\* finish(): the result screen (the hum is long gone, the star chimes are set, a key already on its way is still `fresh`).
Finish == /\ phase' = "over" /\ top' = top /\ results' = results + 1 /\ chimes' = TRUE /\ fresh' = TRUE /\ hum' = "none"
          /\ winding' = FALSE /\ pull' = FALSE
          /\ UNCHANGED <<sheet, stale, breath>>

YouStart == /\ phase = "title" /\ CanBegin /\ Begin
            /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself, liftedAway>>
YouPlayAgain == /\ phase = "over" /\ ~paused /\ visible /\ focused /\ Begin
                /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself, liftedAway>>
YouPressAKeyOnTheResult == /\ phase = "over" /\ ~paused /\ ~sheet /\ visible /\ focused
                           /\ IF ResultKeyActs(FALSE) THEN /\ Begin
                                                          /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself, liftedAway>>
                              ELSE UNCHANGED vars
TheResultSettles == /\ fresh /\ fresh' = FALSE
                    /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, skipped, byItself, liftedAway, results, chimes>>

\* throwTop(): endWind() (the button or key let go after a long enough wind) or the pull's pointerup. The hum starts (setSpinning).
Throw == /\ top' = "spin" /\ winding' = FALSE /\ pull' = FALSE /\ hum' = HumOf("play", "spin", paused, sheet, visible, focused, sound)
         /\ UNCHANGED <<phase, paused, visible, focused, sheet, sound, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
\* onMainDown / the play key in the hand: beginWind(), only while touches count.
YouHoldToWind == /\ CanTap /\ top = "hand" /\ ~winding /\ ~pull /\ winding' = TRUE
                 /\ UNCHANGED <<phase, top, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
\* onDown on the stage in the hand: a pull starts.
YouPutAFingerOnTheTop == /\ CanTap /\ top = "hand" /\ ~winding /\ ~pull /\ pull' = TRUE
                         /\ UNCHANGED <<phase, top, winding, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
\* keyup / pointerup of the button after a wind: endWind(). The page must be ticking (letGo checks it); a keyup that lands after
\* the hand was dropped finds winding FALSE and throws nothing.
YouLetGoAndItThrows == /\ Ticking /\ top = "hand" /\ winding /\ Throw
YouPullDownAndLetGo == /\ CanTap /\ top = "hand" /\ pull /\ Throw
\* The pull or the wind-up ends without a throw (too short, upwards, or the finger lifted).
YouLetGoWithoutAThrow == /\ top = "hand" /\ (winding \/ pull) /\ winding' = FALSE /\ pull' = FALSE
                         /\ UNCHANGED <<phase, top, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>

\* tapNudge(): a touch while it spins (no effect on the screen's state; it still has to be inside CanTap, which the guard shows).
YouNudge == /\ CanTap /\ top = "spin" /\ UNCHANGED vars
\* tryLift(): হাতে তোলো (the button or ↑/H): a palm or a slip, either way it ends the spin. Only while touches count.
\* `liftedAway` records any lift that acts while touches don't count; the guard makes that impossible.
YouPressLift == /\ top = "spin"
                /\ IF CanTap THEN /\ top' = "fallen" /\ hum' = "none" /\ UNCHANGED liftedAway
                   ELSE /\ UNCHANGED <<top, hum, liftedAway>>
                /\ UNCHANGED <<phase, winding, pull, paused, visible, focused, sheet, sound, key, stale, breath, fresh, skipped, byItself, results, chimes>>

\* The press that brings an unfocused window back: engaged() focuses and wakes the round, and it is never a touch.
YouClickAnUnfocusedWindow == /\ phase = "play" /\ visible /\ ~focused /\ ~paused /\ ~sheet
                             /\ focused' = TRUE /\ stale' = FALSE /\ breath' = (breath \/ stale)
                             /\ hum' = HumOf("play", top, FALSE, FALSE, TRUE, TRUE, sound)
                             /\ UNCHANGED <<phase, top, winding, pull, paused, visible, sheet, sound, key, fresh, skipped, byItself, liftedAway, results, chimes>>
\* The play key (Space, Enter, ↑): a fresh press acts when touches count (winds in the hand, nudges while it spins).
YouPressAPlayKey == /\ phase = "play" /\ ~paused /\ ~sheet /\ visible /\ focused /\ key = "up" /\ key' = "down"
                    /\ IF KeyDownActs(FALSE) /\ top = "hand" /\ ~pull THEN winding' = TRUE ELSE winding' = winding
                    /\ UNCHANGED <<phase, top, pull, paused, visible, focused, sheet, sound, hum, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
YouLetGoOfTheKey == /\ key = "down" /\ key' = "up"
                    /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
TheKeyRepeats == /\ key = "down"
                 /\ byItself' = (byItself \/ KeyDownActs(TRUE))
                 /\ skipped' = (skipped \/ ResultKeyActs(TRUE))
                 /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, liftedAway, results, chimes>>

\* step(): the clock runs only while ticking and past the breath.
TheTopFalls == /\ ClockRuns /\ top = "spin" /\ top' = "fallen" /\ hum' = "none"
               /\ UNCHANGED <<phase, winding, pull, paused, visible, focused, sheet, sound, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
TheFallSettles == /\ ClockRuns /\ top = "fallen" /\ Finish
                  /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself, liftedAway>>
TheBreathEnds == /\ Ticking /\ breath /\ breath' = FALSE
                 /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, fresh, skipped, byItself, liftedAway, results, chimes>>
TheChimesPlay == /\ chimes /\ chimes' = FALSE
                 /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, sound, hum, key, stale, breath, fresh, skipped, byItself, liftedAway, results>>

\* Leaving (session away(): stale if it was ticking; a held key lets go; releaseHand drops the wind-up and the pull; syncLoops).
WindowBlurs == /\ visible /\ focused
               /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ key' = "up"
               /\ winding' = FALSE /\ pull' = FALSE /\ hum' = "none"
               /\ UNCHANGED <<phase, top, visible, sheet, sound, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
TabHides == /\ visible
            /\ visible' = FALSE /\ focused' = FALSE /\ paused' = (paused \/ phase = "play") /\ stale' = (stale \/ Ticking) /\ key' = "up"
            /\ winding' = FALSE /\ pull' = FALSE /\ hum' = "none"
            /\ UNCHANGED <<phase, top, sheet, sound, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
\* ⏸ or P: the player's menu (it cuts scheduled tones, so pending chimes stop; it sends pointercancel to a finger still held).
YouPause == /\ ~paused /\ visible /\ focused
            /\ paused' = TRUE /\ stale' = (stale \/ Ticking) /\ key' = "up" /\ winding' = FALSE /\ pull' = FALSE /\ hum' = "none" /\ chimes' = FALSE
            /\ UNCHANGED <<phase, top, visible, focused, sheet, sound, breath, fresh, skipped, byItself, liftedAway, results>>
Wake(ph, tp, pz, sh, vi, fo) == LET t == TickingOf(ph, pz, sh, vi, fo) IN
                                /\ stale' = (stale /\ ~t) /\ breath' = (breath \/ (stale /\ t))
                                /\ hum' = HumOf(ph, tp, pz, sh, vi, fo, sound)
WindowFocuses == /\ visible /\ ~focused
                 /\ focused' = TRUE /\ Wake(phase, top, paused, sheet, TRUE, TRUE)
                 /\ UNCHANGED <<phase, top, winding, pull, paused, visible, sheet, sound, key, fresh, skipped, byItself, liftedAway, results, chimes>>
TabShows == /\ ~visible
            /\ visible' = TRUE /\ focused' = TRUE /\ Wake(phase, top, paused, sheet, TRUE, TRUE)
            /\ UNCHANGED <<phase, top, winding, pull, paused, sheet, sound, key, fresh, skipped, byItself, liftedAway, results, chimes>>
YouResume == /\ paused /\ visible /\ focused
             /\ paused' = FALSE /\ Wake(phase, top, FALSE, sheet, visible, focused)
             /\ UNCHANGED <<phase, top, winding, pull, visible, focused, sheet, sound, key, fresh, skipped, byItself, liftedAway, results, chimes>>
YouRestart == /\ paused /\ phase \in {"play", "over"} /\ visible /\ focused
              /\ paused' = FALSE /\ Begin
              /\ UNCHANGED <<visible, focused, sound, key, skipped, byItself, liftedAway>>

\* The level list: a choice screen. Opening drops the hands and stops the round; closing wakes it with a breath.
OpenTheList == /\ ~sheet /\ ~paused /\ visible /\ focused /\ phase # "play"
               /\ sheet' = TRUE /\ key' = "up" /\ winding' = FALSE /\ pull' = FALSE /\ hum' = "none"
               /\ UNCHANGED <<phase, top, paused, visible, focused, sound, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>
OpenTheListFromTheMenu == /\ paused /\ ~sheet /\ visible /\ focused
                          /\ paused' = FALSE /\ sheet' = TRUE /\ key' = "up" /\ winding' = FALSE /\ pull' = FALSE /\ hum' = "none"
                          /\ stale' = (stale \/ phase = "play") /\ breath' = (breath \/ (stale /\ phase = "play"))
                          /\ UNCHANGED <<phase, top, visible, focused, sound, fresh, skipped, byItself, liftedAway, results, chimes>>
CloseTheList == /\ sheet /\ ~paused /\ visible /\ focused
                /\ sheet' = FALSE /\ Wake(phase, top, FALSE, FALSE, visible, focused)
                /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sound, key, fresh, skipped, byItself, liftedAway, results, chimes>>
YouPickALevel == /\ sheet /\ ~paused /\ visible /\ focused /\ Begin
                 /\ UNCHANGED <<paused, visible, focused, sound, key, skipped, byItself, liftedAway>>

\* hashchange with a real challenge: back to the first screen (show("title") resets the breath and stops the hum).
FriendLinkOpens == /\ phase' = "title" /\ top' = "hand" /\ winding' = FALSE /\ pull' = FALSE
                   /\ stale' = FALSE /\ breath' = FALSE /\ hum' = "none" /\ chimes' = FALSE /\ fresh' = FALSE
                   /\ UNCHANGED <<paused, visible, focused, sheet, sound, key, skipped, byItself, liftedAway, results>>

\* The site-wide switch. Off: the kit stops every loop and cuts queued notes. On: syncLoops starts a fresh one.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = "none" /\ chimes' = FALSE
            /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, key, stale, breath, fresh, skipped, byItself, liftedAway, results>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = HumOf(phase, top, paused, sheet, visible, focused, TRUE)
           /\ UNCHANGED <<phase, top, winding, pull, paused, visible, focused, sheet, key, stale, breath, fresh, skipped, byItself, liftedAway, results, chimes>>

Next == YouStart \/ YouPlayAgain \/ YouPressAKeyOnTheResult \/ TheResultSettles
        \/ YouHoldToWind \/ YouPutAFingerOnTheTop \/ YouLetGoAndItThrows \/ YouPullDownAndLetGo \/ YouLetGoWithoutAThrow
        \/ YouNudge \/ YouPressLift \/ YouClickAnUnfocusedWindow \/ YouPressAPlayKey \/ YouLetGoOfTheKey \/ TheKeyRepeats
        \/ TheTopFalls \/ TheFallSettles \/ TheBreathEnds \/ TheChimesPlay
        \/ WindowBlurs \/ TabHides \/ YouPause \/ WindowFocuses \/ TabShows \/ YouResume \/ YouRestart
        \/ OpenTheList \/ OpenTheListFromTheMenu \/ CloseTheList \/ YouPickALevel \/ FriendLinkOpens \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ top \in Tops /\ winding \in BOOLEAN /\ pull \in BOOLEAN /\ paused \in BOOLEAN /\ visible \in BOOLEAN
          /\ focused \in BOOLEAN /\ sheet \in BOOLEAN /\ sound \in BOOLEAN /\ hum \in Hums /\ key \in {"up", "down"}
          /\ stale \in BOOLEAN /\ breath \in BOOLEAN /\ fresh \in BOOLEAN /\ skipped \in BOOLEAN /\ byItself \in BOOLEAN
          /\ liftedAway \in BOOLEAN /\ results \in 0..1 /\ chimes \in BOOLEAN

\* The reader's rules (the ten from before the rewrite, restated, plus the shared ones).
PausedWhenHidden == (~visible /\ phase = "play") => paused
PausedWhenBlurred == (~focused /\ phase = "play") => paused
InputReleasedWhenAway == (winding \/ pull \/ key = "down") => (focused /\ visible /\ ~paused /\ ~sheet)
NothingMovesWhilePaused == ~liftedAway
HumOnlyWhileSpinning == hum = "live" => (Ticking /\ sound /\ top = "spin")
HumComesBack == (Ticking /\ sound /\ top = "spin") => hum = "live"
NeverAStub == hum # "stub"
LevelPickerFreezesPlay == sheet => ~ClockRuns
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == chimes => phase = "over"
HeldKeyActsOnce == ~byItself
ResultStaysUntilYouChoose == ~skipped
NoProgressWhileAway == ClockRuns => (focused /\ visible /\ ~paused)
PauseOnlyMidRound == (stale \/ breath) => phase = "play"
BreathAfterAway == Ticking => ~stale
\* Nothing is wound or pulled in the hand unless the page is ticking.
HandOnlyWhileTicking == (winding \/ pull) => (Ticking /\ top = "hand")
====
