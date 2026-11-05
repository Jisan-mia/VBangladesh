---- MODULE AlDhore ----
\* আল ধরে হাঁটি after the rewrite: the screen (title, ready card, play, end), the player's menu, the level list, the window,
\* what your hand holds (a key, a finger), the wake-up guard, the wind loop on a windy field, the site-wide sound switch,
\* the intro card for a new level, and a friend's field.
\* Mirrors tools/al-dhore-hati/components/walk-game.tsx (begin, finish, startFromTitle, goFromReady, pickLevel, again, the keydown/keyup
\* effect, onDown/onUp, the blur/focus/visibility effect, the sound effect, useGamePlayer's onPause/onResume/onLevels) and
\* lib/session.ts (ticking, canSteer, press, keyDown, wantWind, syncLoops, blur, hide, pause, resume, openSheet, closeSheet),
\* lib/step.hot.ts (stepGame), lib/link.ts (retrySeed) and lib/levels.ts (showsIntro).
\* Abstractions: the field is a windy one (so the wind loop is in play); "guard" = চালিয়ে যাও, the window or the list came back
\* under 250 ms ago; "held" = a key or a finger is down; "walked" counts the steps the walk has taken (0..1).
EXTENDS Naturals
VARIABLES screen, sheet, paused, focused, held, finger, guard, sound, wind, seenThis, results, field, walked
vars == <<screen, sheet, paused, focused, held, finger, guard, sound, wind, seenThis, results, field, walked>>

Screens == {"title", "ready", "play", "over"}
Fields == {"fresh", "friend"}
\* session.ticking: the walk steps only on the play screen, with the menu and the list shut, the tab showing and the window focused.
Ticking == screen = "play" /\ ~paused /\ ~sheet /\ focused
\* syncLoops runs after every event: the wind plays exactly when wantWind holds in the state the event leaves.
WindNext == wind' = (screen' = "play" /\ ~paused' /\ ~sheet'  /\ focused' /\ sound')

Init == /\ screen = "title" /\ sheet = FALSE /\ paused = FALSE /\ focused = TRUE /\ held = FALSE /\ finger = FALSE
        /\ guard = FALSE /\ sound = TRUE /\ wind = FALSE /\ seenThis = FALSE /\ results = 0 /\ field = "fresh" /\ walked = 0

\* readFriend: a friend's link sets their seed on the title.
YouOpenAFriendsLink == /\ screen = "title" /\ field = "fresh"
                       /\ field' = "friend"
                       /\ UNCHANGED <<screen, sheet, paused, focused, held, finger, guard, sound, wind, seenThis, results, walked>>
\* startFromTitle: straight into the walk (the title already showed this level's one new thing).
YouTapChalo == /\ screen = "title" /\ ~sheet /\ ~paused /\ focused
               /\ screen' = "play" /\ seenThis' = TRUE /\ results' = 0 /\ held' = FALSE /\ finger' = FALSE /\ guard' = FALSE
               /\ UNCHANGED <<sheet, paused, focused, sound, field, walked>> /\ WindNext
\* pickLevel: from the level list or the end card, a new field; its ready card shows when the level is unseen (showsIntro), else the walk starts.
YouPickAnUnseenLevel == /\ (sheet \/ screen = "over") /\ ~paused /\ focused
                        /\ screen' = "ready" /\ sheet' = FALSE /\ seenThis' = FALSE /\ results' = 0 /\ held' = FALSE /\ finger' = FALSE /\ guard' = FALSE
                        /\ field' = "fresh"
                        /\ UNCHANGED <<paused, focused, sound, walked>> /\ WindNext
YouPickASeenLevel == /\ (sheet \/ screen = "over") /\ ~paused /\ focused
                     /\ screen' = "play" /\ sheet' = FALSE /\ seenThis' = TRUE /\ results' = 0 /\ held' = FALSE /\ finger' = FALSE /\ guard' = FALSE
                     /\ field' = "fresh"
                     /\ UNCHANGED <<paused, focused, sound, walked>> /\ WindNext
\* goFromReady: the চলো button, Enter or Space (a fresh press, 450 ms after the card appeared).
YouTapChaloOnTheCard == /\ screen = "ready" /\ ~sheet /\ ~paused /\ focused
                        /\ screen' = "play" /\ seenThis' = TRUE /\ held' = FALSE /\ finger' = FALSE /\ guard' = FALSE
                        /\ UNCHANGED <<sheet, paused, focused, sound, results, field, walked>> /\ WindNext
\* keydown ← → (A D) at window: keyDown counts only while the walk steps.
YouHoldAKey == /\ Ticking /\ ~held /\ held' = TRUE
               /\ UNCHANGED <<screen, sheet, paused, focused, finger, guard, sound, wind, seenThis, results, field, walked>>
\* onDown: session.press refuses a finger inside the 250 ms wake-up guard (canSteer).
YouPressTheField == /\ Ticking /\ ~guard /\ ~finger /\ finger' = TRUE /\ held' = TRUE
                    /\ UNCHANGED <<screen, sheet, paused, focused, guard, sound, wind, seenThis, results, field, walked>>
\* keyup / pointerup / pointercancel reach the page only while it has focus.
YouLetGo == /\ held /\ focused /\ held' = FALSE /\ finger' = FALSE
            /\ UNCHANGED <<screen, sheet, paused, focused, guard, sound, wind, seenThis, results, field, walked>>
\* stepGame: one step of the walk.
TheWalkAdvances == /\ Ticking /\ walked < 1 /\ walked' = walked + 1
                   /\ UNCHANGED <<screen, sheet, paused, focused, held, finger, guard, sound, wind, seenThis, results, field>>
\* finish(): the yard, or the last slip. The end screen; held input is cleared.
YouReachTheEnd == /\ Ticking /\ screen' = "over" /\ results' = results + 1 /\ held' = FALSE /\ finger' = FALSE
                  /\ UNCHANGED <<sheet, paused, focused, guard, sound, seenThis, field, walked>> /\ WindNext
\* The window blur listener: S.blur lets go of every key and finger, whether or not the player opens its menu.
WindowBlurs == /\ focused /\ focused' = FALSE /\ held' = FALSE /\ finger' = FALSE
               /\ UNCHANGED <<screen, sheet, paused, guard, sound, seenThis, results, field, walked>> /\ WindNext
WindowFocuses ==  /\ ~focused /\ focused' = TRUE /\ guard' = TRUE
                 /\ UNCHANGED <<screen, sheet, paused, held, finger, sound, seenThis, results, field, walked>> /\ WindNext
GuardEnds == /\ guard /\ guard' = FALSE
             /\ UNCHANGED <<screen, sheet, paused, focused, held, finger, sound, wind, seenThis, results, field, walked>>
\* The player's menu (the button, P, Escape, blur or hide once touched): onPause → S.pause.
TheMenuOpens == /\ ~paused /\ paused' = TRUE /\ held' = FALSE /\ finger' = FALSE
                /\ UNCHANGED <<screen, sheet, focused, guard, sound, seenThis, results, field, walked>> /\ WindNext
YouResume == /\ paused /\ focused /\ paused' = FALSE /\ guard' = TRUE
             /\ UNCHANGED <<screen, sheet, focused, held, finger, sound, seenThis, results, field, walked>> /\ WindNext
\* সব লেভেল (the title, the end card, or the player's menu, which resumes first): S.openSheet.
YouOpenTheList == /\ ~sheet /\ ~paused /\ focused /\ screen # "ready" /\ sheet' = TRUE /\ held' = FALSE /\ finger' = FALSE
                  /\ UNCHANGED <<screen, paused, focused, guard, sound, seenThis, results, field, walked>> /\ WindNext
\* ✕ on the list: S.closeSheet, then the menu reopens if you were mid-walk (closeSheet(true)).
YouCloseTheList == /\ sheet /\ sheet' = FALSE /\ guard' = TRUE /\ paused' = (paused \/ screen = "play")
                   /\ UNCHANGED <<screen, focused, held, finger, sound, seenThis, results, field, walked>> /\ WindNext
\* The site-wide sound switch: turning it off stops every loop; turning it on lets syncLoops start a real one.
SoundOff == /\ sound /\ sound' = FALSE /\ UNCHANGED <<screen, sheet, paused, focused, held, finger, guard, seenThis, results, field, walked>> /\ WindNext
SoundOn == /\ ~sound /\ sound' = TRUE /\ UNCHANGED <<screen, sheet, paused, focused, held, finger, guard, seenThis, results, field, walked>> /\ WindNext
\* আবার খেলো, or আরেকবার, on the end card (one `again()` for both): retrySeed keeps a friend's field.
YouTryAgain == /\ screen = "over" /\ ~sheet /\ ~paused /\ focused
               /\ screen' = "play" /\ results' = 0 /\ held' = FALSE /\ finger' = FALSE /\ guard' = FALSE /\ seenThis' = TRUE
               /\ UNCHANGED <<sheet, paused, focused, sound, field, walked>> /\ WindNext

Next == YouOpenAFriendsLink \/ YouTapChalo \/ YouPickAnUnseenLevel \/ YouPickASeenLevel \/ YouTapChaloOnTheCard \/ YouHoldAKey \/ YouPressTheField
        \/ YouLetGo \/ TheWalkAdvances \/ YouReachTheEnd \/ WindowBlurs \/ WindowFocuses \/ GuardEnds \/ TheMenuOpens
        \/ YouResume \/ YouOpenTheList \/ YouCloseTheList \/ SoundOff \/ SoundOn \/ YouTryAgain

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ sheet \in BOOLEAN /\ paused \in BOOLEAN /\ focused \in BOOLEAN /\ held \in BOOLEAN /\ finger \in BOOLEAN
          /\ guard \in BOOLEAN /\ sound \in BOOLEAN /\ wind \in BOOLEAN /\ seenThis \in BOOLEAN /\ results \in 0..2 /\ field \in Fields
          /\ walked \in 0..1

\* The reader's rules.
InputReleasedWhenAway == (~focused \/ paused \/ sheet) => ~held
\* The walk (and so the clock, the pull, the wind, the gusts) moves only while it ticks: not paused, not behind the list, not away.
NoProgressWhileAway == [][(walked' # walked) => Ticking]_vars
LoopOnlyWhenMeaningful == wind => (Ticking /\ sound)
LoopComesBack == (Ticking /\ sound) => wind
NoDoubleResult == results <= 1
\* The press that brings you back (from the menu, the list or another window) never steers.
FocusClickIsNotAMove == guard => ~finger
\* Every level's intro is shown (or already seen) before its walk starts.
IntroShownBeforePlay == screen = "play" => seenThis
\* Retrying a friend's field, from either end card, keeps the friend's field (so the compare line still means something).
ReplayIsExact == [][YouTryAgain => field' = field]_vars
====
