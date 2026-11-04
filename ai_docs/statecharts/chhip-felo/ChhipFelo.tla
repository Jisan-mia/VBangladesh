---- MODULE ChhipFelo ----
\* ছিপ ফেলো after the rewrite (Nov 2026): the screens, one cast at a time, the shared player's menu, window focus,
\* the choice screens (সব লেভেল, the album), your finger or Space, the reel hum, the end screen's scheduled tones,
\* ধীরে খেলো mid-cast, and a friend's far-ahead level.
\* Mirrors tools/chhip-felo/components/chhip-felo.tsx (begin, finish, the blur/focus/visibility effect, the sheet effect,
\* the sound effect, useGamePlayer's onPause/onResume), tools/chhip-felo/lib/session.ts (ticking, wantHum, syncHum, blur,
\* hide, pause, resume, openSheet, goTo, pointerDown with its wake-up swallow, keyDown), tools/chhip-felo/lib/trip.ts +
\* step.hot.ts (aim → fly → wait → reel → the catch or miss card; every clock is game time), lib/levels.ts (afterClear) and
\* shared/game-player-client.tsx (blur, hide and P open the menu once you've touched the game; pausing cuts scheduled tones).
\* Abstractions: one cast stands for a level's casts (CardEnds either starts the next cast or ends the level); "held" is a
\* finger on the pond or Space/Enter; the intro story is folded into the title; "owed" is the end screen's scheduled tones.
VARIABLES screen, phase, paused, visible, focused, sheet, swallow, held, hum, sound, owed, dip, lateNoDip, friendTrip, skipped
vars == <<screen, phase, paused, visible, focused, sheet, swallow, held, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>

Screens == {"title", "play", "over"}
Phases == {"aim", "fly", "wait", "reel", "card"}
\* session.ticking: the water moves only on the play screen with the menu and sheets shut, the tab showing and the window focused.
Running == screen = "play" /\ ~paused /\ ~sheet /\ focused /\ visible
\* session.wantHum
WantHum == Running /\ sound /\ phase = "reel"

Init == /\ screen = "title" /\ phase = "aim" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ sheet = FALSE
        /\ swallow = FALSE /\ held = FALSE /\ hum = FALSE /\ sound \in BOOLEAN /\ owed = "none"
        /\ dip = FALSE /\ lateNoDip = FALSE /\ friendTrip = FALSE /\ skipped = FALSE

\* begin(): silenceScheduled() cuts the last result's tones, a fresh trip, goTo("play") lets go, the sheet shuts.
Begin(friend) == /\ screen' = "play" /\ phase' = "aim" /\ paused' = FALSE /\ sheet' = FALSE /\ swallow' = FALSE
                 /\ held' = FALSE /\ hum' = FALSE /\ owed' = "none" /\ dip' = FALSE /\ friendTrip' = friend
                 /\ UNCHANGED <<visible, focused, sound, lateNoDip, skipped>>

YouStart == /\ screen = "title" /\ ~sheet /\ focused /\ visible /\ Begin(friendTrip)

\* ---- input: pointerDown / keyDown only count while ticking and never as the wake-up tap ----
YouHoldToAim == /\ Running /\ phase = "aim" /\ ~held /\ ~swallow /\ held' = TRUE
                /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouLetGoToCast == /\ Running /\ held /\ phase = "aim" /\ held' = FALSE /\ phase' = "fly"
                  /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
\* The first pointerdown after coming back: s.swallow, so it only wakes the game.
YouTapToWake == /\ screen = "play" /\ ~paused /\ focused /\ visible /\ swallow /\ swallow' = FALSE
                /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, held, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
\* press() in wait: inside the dip's window it hooks; before the dip it's a miss (early or a nibble).
YouStrike == /\ Running /\ phase = "wait" /\ dip /\ ~held /\ ~swallow
             /\ phase' = "reel" /\ held' = TRUE /\ hum' = sound
             /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouStrikeTooSoon == /\ Running /\ phase = "wait" /\ ~dip /\ ~held /\ ~swallow /\ phase' = "card"
                    /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, held, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouHoldToReel == /\ Running /\ phase = "reel" /\ ~held /\ ~swallow /\ held' = TRUE
                 /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouSlacken == /\ Running /\ phase = "reel" /\ held /\ held' = FALSE
              /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>

\* ---- game time: stepTrip, only while ticking ----
FloatLands == /\ Running /\ phase = "fly" /\ phase' = "wait" /\ dip' = FALSE
              /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, held, hum, sound, owed, lateNoDip, friendTrip, skipped>>
FloatDips == /\ Running /\ phase = "wait" /\ ~dip /\ dip' = TRUE
             /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, held, hum, sound, owed, lateNoDip, friendTrip, skipped>>
\* "late": only after the dip, because the window is counted on the same game clock as the bite.
FishTakesTheBait == /\ Running /\ phase = "wait" /\ phase' = "card"
                    /\ lateNoDip' = (lateNoDip \/ ~dip)
                    /\ dip
                    /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, held, hum, sound, owed, dip, friendTrip, skipped>>
\* A snap, a slip, a leap on a tight line, or the fish landed: the cast ends; syncHum stops the hum.
CastEnds == /\ Running /\ phase = "reel" /\ phase' = "card" /\ held' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, sound, owed, dip, lateNoDip, friendTrip, skipped>>
\* The catch or miss card ends: the next cast...
NextCast == /\ Running /\ phase = "card" /\ phase' = "aim" /\ held' = FALSE
            /\ UNCHANGED <<screen, paused, visible, focused, sheet, swallow, hum, sound, owed, dip, lateNoDip, friendTrip, skipped>>
\* ...or the level ends: finish() records the stars, afterClear keeps a friend's far level from opening the ones before it,
\* goTo("over") lets go, and the stars and fanfare are scheduled as tones.
LevelEnds == /\ Running /\ phase = "card" /\ screen' = "over" /\ held' = FALSE /\ owed' = "due"
             /\ UNCHANGED <<phase, paused, visible, focused, sheet, swallow, hum, sound, dip, lateNoDip, friendTrip, skipped>>
\* ধীরে খেলো from the menu's switch, mid-cast: only the step's size changes; game time and the bite stay where they are.
SlowToggles == /\ screen = "play" /\ UNCHANGED vars

\* ---- the end screen and its choices ----
FanfarePlays == /\ owed = "due" /\ owed' = "none"
                /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, held, hum, sound, dip, lateNoDip, friendTrip, skipped>>
\* পরের লেভেল / আবার খেলো (a fresh press only), or নতুন করে শুরু.
YouPlayOn == /\ screen = "over" /\ ~sheet /\ ~paused /\ focused /\ Begin(friendTrip)
\* সব লেভেল or the album: a choice screen; the sheet effect calls openSheet (let go) and syncHum.
YouOpenASheet == /\ ~sheet /\ ~paused /\ focused /\ sheet' = TRUE /\ held' = FALSE /\ hum' = FALSE
                 /\ UNCHANGED <<screen, phase, paused, visible, focused, swallow, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouCloseTheSheet == /\ sheet /\ sheet' = FALSE /\ hum' = (screen = "play" /\ ~paused /\ focused /\ visible /\ sound /\ phase = "reel")
                    /\ UNCHANGED <<screen, phase, paused, visible, focused, swallow, held, sound, owed, dip, lateNoDip, friendTrip, skipped>>
YouPickALevel == /\ sheet /\ focused /\ Begin(FALSE)
\* A friend's link (hashchange): silenceScheduled, their water on the title.
YouOpenAFriendsLink == /\ visible /\ ~friendTrip /\ screen' = "title" /\ phase' = "aim" /\ friendTrip' = TRUE /\ sheet' = FALSE
                       /\ held' = FALSE /\ hum' = FALSE /\ owed' = "none" /\ swallow' = FALSE /\ dip' = FALSE
                       /\ UNCHANGED <<paused, visible, focused, sound, lateNoDip, skipped>>
\* Clearing a friend's level that was beyond your unlock: its stars are kept, nothing in between opens (afterClear).
FriendLevelCleared == /\ screen = "over" /\ friendTrip /\ UNCHANGED vars

\* ---- away and back: the player pauses (menu) once you've touched the game, which is always so on the play screen ----
\* session.blur lets go and arms the wake-up swallow; the player's onPause → session.pause; pausing cuts scheduled tones.
WindowBlurs == /\ focused /\ focused' = FALSE /\ held' = FALSE /\ hum' = FALSE
               /\ swallow' = (screen = "play")
               /\ paused' = (paused \/ screen = "play")
               /\ owed' = IF screen = "play" THEN "none" ELSE owed
               /\ UNCHANGED <<screen, phase, visible, sheet, sound, dip, lateNoDip, friendTrip, skipped>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ hum' = (screen = "play" /\ ~paused /\ ~sheet /\ sound /\ phase = "reel")
                 /\ UNCHANGED <<screen, phase, paused, visible, sheet, swallow, held, sound, owed, dip, lateNoDip, friendTrip, skipped>>
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ held' = FALSE /\ hum' = FALSE
            /\ swallow' = (screen = "play")
            /\ paused' = (paused \/ screen = "play")
            /\ owed' = IF screen = "play" THEN "none" ELSE owed
            /\ UNCHANGED <<screen, phase, sheet, sound, dip, lateNoDip, friendTrip, skipped>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ hum' = (screen = "play" /\ ~paused /\ ~sheet /\ sound /\ phase = "reel")
            /\ UNCHANGED <<screen, phase, paused, sheet, swallow, held, sound, owed, dip, lateNoDip, friendTrip, skipped>>
\* The game's own P key calls player.requestPause(): the same menu.
YouPressP == /\ screen = "play" /\ ~paused /\ ~sheet /\ focused /\ paused' = TRUE /\ held' = FALSE /\ hum' = FALSE /\ owed' = "none"
             /\ UNCHANGED <<screen, phase, visible, focused, sheet, swallow, sound, dip, lateNoDip, friendTrip, skipped>>
\* চালিয়ে যাও: session.resume (fresh hands, no swallow: that click was the wake-up), then syncHum.
YouResume == /\ paused /\ visible /\ focused /\ paused' = FALSE /\ swallow' = FALSE /\ held' = FALSE
             /\ hum' = (screen = "play" /\ ~sheet /\ sound /\ phase = "reel")
             /\ UNCHANGED <<screen, phase, visible, focused, sheet, sound, owed, dip, lateNoDip, friendTrip, skipped>>

\* ---- the site-wide switch: off stops every loop; on lets syncHum start a fresh one ----
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, held, owed, dip, lateNoDip, friendTrip, skipped>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = (Running /\ phase = "reel")
           /\ UNCHANGED <<screen, phase, paused, visible, focused, sheet, swallow, held, owed, dip, lateNoDip, friendTrip, skipped>>

Next == YouStart \/ YouHoldToAim \/ YouLetGoToCast \/ YouTapToWake \/ YouStrike \/ YouStrikeTooSoon \/ YouHoldToReel \/ YouSlacken
        \/ FloatLands \/ FloatDips \/ FishTakesTheBait \/ CastEnds \/ NextCast \/ LevelEnds \/ SlowToggles
        \/ FanfarePlays \/ YouPlayOn \/ YouOpenASheet \/ YouCloseTheSheet \/ YouPickALevel \/ YouOpenAFriendsLink \/ FriendLevelCleared
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ YouPressP \/ YouResume \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ phase \in Phases /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ sheet \in BOOLEAN /\ swallow \in BOOLEAN /\ held \in BOOLEAN /\ hum \in BOOLEAN /\ sound \in BOOLEAN
          /\ owed \in {"none", "due"} /\ dip \in BOOLEAN /\ lateNoDip \in BOOLEAN /\ friendTrip \in BOOLEAN /\ skipped \in BOOLEAN

\* ---- the reader's rules ----
\* The float, the bite and the line don't move while you're in another window or tab.
NoProgressWhileAway == (~focused \/ ~visible) => ~Running
\* After you leave, no finger or Space key still counts as held.
InputReleasedWhenAway == (~focused \/ ~visible) => ~held
PausedWhenHidden == (~visible /\ screen = "play") => paused
PausedWhenBlurred == (~focused /\ screen = "play") => paused
\* Until the wake-up tap has happened, the game sits on the menu, so the click that brings you back never strikes.
ClickBackIsNotAMove == (screen = "play" /\ swallow) => paused
\* The reel hums only while a fish is on the line, the water is moving and sound is on...
LoopOnlyWhenMeaningful == hum => WantHum
\* ...and whenever that is so it plays, also after sound comes back on or after চালিয়ে যাও.
LoopComesBack == WantHum => hum
PausedMeansFrozen == paused => ~Running
\* While সব লেভেল or the album is open, nothing in the pond moves.
ChoiceFreezesPlay == sheet => ~Running
\* The end screen's chimes and fanfare belong to it; they never go off over a new level.
FanfareOnlyOnTheResult == owed = "due" => screen = "over"
\* Only levels you cleared open the next one; a friend's link lets you play their level, not skip the ones before it.
OpenLevelsAreEarned == ~skipped
\* Turning ধীরে খেলো on or off mid-wait never loses a fish that hasn't bitten.
SlowToggleKeepsTheBite == ~lateNoDip
====
