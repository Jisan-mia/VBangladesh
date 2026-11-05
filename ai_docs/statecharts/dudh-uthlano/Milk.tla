---- MODULE Milk ----
EXTENDS Naturals
\* দুধ উথলানোর আগে after the rewrite: the title and the play screen's phases, the player's menu and the level list, window focus and tab
\* visibility, the finger on the button, the breath after coming back, the stove's hum, the delayed confetti, and a friend's link.
\* The pots' count and the foam's curve are abstracted (tests/pots.test.ts, tests/levels.test.ts); the unlock rules have their own
\* small spec, Levels.tla. Story panels count as "title".
\* Mirrored from tools/dudh-uthlano/lib/session.ts (blur, hide, pause, openSheet, wake, press, release, syncHum, goTo),
\* lib/round.ts + lib/step.hot.ts (startPot, liftPot, stepRound), lib/slot.ts, and components/game.tsx (begin, step, finish, takeLink,
\* pickLevel, liftNow, press, release).
VARIABLES game, choice, win, held, away, hum, sound, cheer, link
vars == <<game, choice, win, held, away, hum, sound, cheer, link>>

Games == {"title", "waiting", "rising", "result", "over"}
\* choice: the player's menu or the level list (both pause). win: the window has focus, another has, or the tab is hidden.
\* away: the pot stopped mid-play ("stale") and on return waits a breath ("breath"). link: a friend's challenge is open.
Play == game \in {"waiting", "rising", "result"}
\* session.ts ticking(): the foam moves only on the play screen, menu and list shut, tab showing, window focused.
Ticks(g, c, w) == g \in {"waiting", "rising", "result"} /\ c = "none" /\ w = "on"
Ticking == Ticks(game, choice, win)
WantHum == Ticking /\ sound /\ game = "rising"

Init == /\ game = "title" /\ choice = "none" /\ win = "on" /\ held = FALSE /\ away = "no" /\ hum = FALSE /\ sound = TRUE
        /\ cheer = FALSE /\ link = "none"

\* begin(): a fresh round. It cancels the celebration slot (clearTimers), lets go of the button, shuts the list and the menu, stops the hum.
Begin(newLink) == /\ game' = "waiting" /\ choice' = "none" /\ held' = FALSE /\ away' = "no" /\ cheer' = FALSE /\ hum' = FALSE /\ link' = newLink
                  /\ UNCHANGED <<win, sound>>
\* away(): anything that stops the kitchen lets go of the button and marks the pot stale if it was ticking.
\* wake(): when it may tick again and was stale, a breath first. syncHum() runs after every event.
Wake(g, c, w) == away' = IF away = "stale" /\ Ticks(g, c, w) THEN "breath" ELSE away
Stale(g, c, w) == away' = IF Ticking /\ ~Ticks(g, c, w) THEN "stale" ELSE away

YouPressStart == /\ game = "title" /\ win = "on" /\ choice = "none" /\ Begin(IF link = "none" THEN "none" ELSE "theirs")
\* press(): only while ticking, never during the breath (the click that brings focus back is not a move), never twice.
YouPressToLight == /\ Ticking /\ away # "breath" /\ ~held /\ game = "waiting"
                   /\ game' = "rising" /\ held' = TRUE /\ hum' = sound /\ UNCHANGED <<choice, win, away, sound, cheer, link>>
YouPressToLift == /\ Ticking /\ away # "breath" /\ ~held /\ game = "rising"
                  /\ game' = "result" /\ held' = TRUE /\ hum' = FALSE /\ UNCHANGED <<choice, win, away, sound, cheer, link>>
\* release(): a keyup or pointerup reaches the page only while it has focus. A short tap leaves the milk heating.
YouLetGoQuickly == /\ held /\ win = "on" /\ held' = FALSE /\ UNCHANGED <<game, choice, win, away, hum, sound, cheer, link>>
\* A real hold (>= 260 ms) lifts the pot the moment it ends.
YouLetGoAfterHolding == /\ held /\ Ticking /\ game = "rising"
                        /\ held' = FALSE /\ game' = "result" /\ hum' = FALSE /\ UNCHANGED <<choice, win, away, sound, cheer, link>>
\* stepRound(): the foam reaches the rim. step() lets go of the button, the hum stops, sizzle.
MilkSpills == /\ Ticking /\ away # "breath" /\ game = "rising"
              /\ game' = "result" /\ held' = FALSE /\ hum' = FALSE /\ UNCHANGED <<choice, win, away, sound, cheer, link>>
NextPotComes == /\ Ticking /\ away # "breath" /\ game = "result" /\ game' = "waiting" /\ UNCHANGED <<choice, win, held, away, hum, sound, cheer, link>>
\* finish(): the stars are recorded now, the celebration is queued in the slot (a cleared level only).
RoundEndsCleared == /\ Ticking /\ away # "breath" /\ game = "result"
                    /\ game' = "over" /\ held' = FALSE /\ hum' = FALSE /\ cheer' = TRUE /\ UNCHANGED <<choice, win, away, sound, link>>
RoundEndsFailed == /\ Ticking /\ away # "breath" /\ game = "result"
                   /\ game' = "over" /\ held' = FALSE /\ hum' = FALSE /\ UNCHANGED <<choice, win, away, sound, cheer, link>>
CheerPlays == /\ cheer /\ cheer' = FALSE /\ UNCHANGED <<game, choice, win, held, away, hum, sound, link>>
\* The end screen's choices (fresh keys): আবার খেলো keeps a friend's pots, পরের লেভেল and the list start fresh ones.
YouPlayAgain == /\ game = "over" /\ win = "on" /\ choice = "none" /\ Begin(link)
YouPlayNext == /\ game = "over" /\ win = "on" /\ choice = "none" /\ Begin(IF link = "none" THEN "none" ELSE "other")
\* The level list is a choice screen: it pauses.
YouOpenList == /\ choice = "none" /\ win = "on" /\ choice' = "list" /\ held' = FALSE /\ Stale(game, "list", win) /\ hum' = FALSE
               /\ UNCHANGED <<game, win, sound, cheer, link>>
YouPickLevel == /\ choice = "list" /\ win = "on" /\ Begin(IF link = "none" THEN "none" ELSE "other")
YouCloseList == /\ choice = "list" /\ choice' = "none" /\ Wake(game, "none", win) /\ hum' = (Ticks(game, "none", win) /\ sound /\ game = "rising")
                /\ UNCHANGED <<game, win, held, sound, cheer, link>>
\* The player's menu (useGamePlayer onPause / onResume).
YouOpenMenu == /\ choice = "none" /\ game # "title" /\ win = "on" /\ choice' = "menu" /\ held' = FALSE /\ Stale(game, "menu", win) /\ hum' = FALSE
               /\ UNCHANGED <<game, win, sound, cheer, link>>
YouResume == /\ choice = "menu" /\ choice' = "none" /\ Wake(game, "none", win) /\ hum' = (Ticks(game, "none", win) /\ sound /\ game = "rising")
             /\ UNCHANGED <<game, win, held, sound, cheer, link>>
\* Window blur and focus (real, or the player's synthetic ones); hide and show.
WindowBlurs == /\ win = "on" /\ win' = "blurred" /\ held' = FALSE /\ Stale(game, choice, "blurred") /\ hum' = FALSE
               /\ UNCHANGED <<game, choice, sound, cheer, link>>
WindowFocuses == /\ win = "blurred" /\ win' = "on" /\ Wake(game, choice, "on") /\ hum' = (Ticks(game, choice, "on") /\ sound /\ game = "rising")
                 /\ UNCHANGED <<game, choice, held, sound, cheer, link>>
TabHides == /\ win # "hidden" /\ win' = "hidden" /\ held' = FALSE /\ Stale(game, choice, "hidden") /\ hum' = FALSE
            /\ UNCHANGED <<game, choice, sound, cheer, link>>
TabShows == /\ win = "hidden" /\ win' = "on" /\ Wake(game, choice, "on") /\ hum' = (Ticks(game, choice, "on") /\ sound /\ game = "rising")
            /\ UNCHANGED <<game, choice, held, sound, cheer, link>>
\* The breath after coming back runs down while the kitchen ticks.
BreathPasses == /\ Ticking /\ away = "breath" /\ away' = "no" /\ UNCHANGED <<game, choice, win, held, hum, sound, cheer, link>>
\* The site-wide switch: off stops every loop in the kit; on lets syncHum start a fresh hum if the milk is rising.
SoundOff == /\ sound /\ sound' = FALSE /\ hum' = FALSE /\ UNCHANGED <<game, choice, win, held, away, cheer, link>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ hum' = (Ticking /\ game = "rising") /\ UNCHANGED <<game, choice, win, held, away, cheer, link>>
\* hashchange with a valid link: takeLink() shows the title with the friend's challenge, cancels the celebration and lets go of
\* everything. (On a ticking round the code keeps the link pending until the player is away, then does exactly this; the model
\* lets it happen at any moment, which covers both.)
FriendLinkOpens == /\ link = "none" /\ win = "on"
                   /\ link' = "theirs" /\ game' = "title" /\ held' = FALSE /\ hum' = FALSE /\ cheer' = FALSE /\ away' = "no"
                   /\ UNCHANGED <<choice, win, sound>>

Next == YouPressStart \/ YouPressToLight \/ YouPressToLift \/ YouLetGoQuickly \/ YouLetGoAfterHolding
        \/ MilkSpills \/ NextPotComes \/ RoundEndsCleared \/ RoundEndsFailed \/ CheerPlays \/ YouPlayAgain \/ YouPlayNext
        \/ YouOpenList \/ YouPickLevel \/ YouCloseList \/ YouOpenMenu \/ YouResume
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ BreathPasses \/ SoundOff \/ SoundOn \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ game \in Games /\ choice \in {"none", "menu", "list"} /\ win \in {"on", "blurred", "hidden"} /\ held \in BOOLEAN
          /\ away \in {"no", "stale", "breath"} /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ cheer \in BOOLEAN /\ link \in {"none", "theirs", "other"}

\* The reader's rules.
\* The milk never rises while the tab is hidden or the window is blurred: either the pot ticks, or it is marked and will breathe on return.
PausedWhenAway == (game = "rising" /\ ~Ticking) => away # "no"
InputReleasedWhenAway == held => (Play /\ win = "on" /\ choice = "none")
ClickThatBringsFocusBackIsNotAMove == away = "breath" => ~held
ChoiceFreezesPlay == choice # "none" => ~Ticking
HumOnlyWhileHeating == hum => (game = "rising" /\ Ticking /\ sound)
HumComesBack == WantHum => hum
CelebrationOnItsOwnCard == cheer => game = "over"
====
