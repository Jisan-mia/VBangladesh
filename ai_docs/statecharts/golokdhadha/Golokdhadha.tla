---- MODULE Golokdhadha ----
\* গোলকধাঁধা after the rewrite: the screens, the shared player's menu, window focus, the finger on the board, the click that
\* brings the window back, ধীরে খেলো, the level list and the end screen's keys. Mirrored from
\* tools/golokdhadha/components/golokdhadha-game.tsx (begin, finish, the blur/focus/visibility effect, the key handler,
\* onPointerDown/Move/Up, useGamePlayer's onPause/onResume/onRestart), lib/session.ts (ticking, blur, hide, pause, resume,
\* pointerDown, pointerMoves, openSheet, freshResultKey), lib/choices.ts (endChoices, choiceForKey) and
\* shared/game-player-client.tsx (blur, hide, Esc and ⏸ open the menu once the game is touched; চালিয়ে যাও and
\* নতুন করে শুরু send a focus first). The walker's own rules are tested in tests/game.test.ts; here it is "walking or standing".
\* No sound loops: footsteps, bumps, the bell and the chimes are scheduled one-shot tones the pause cuts.
EXTENDS Naturals
VARIABLES screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results
vars == <<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>

\* session.ticking: the play screen, the menu and the list shut, the tab showing, the window focused.
Ticking == screen = "play" /\ menu = "shut" /\ ~sheet /\ window = "focused"

Init == /\ screen = "title" /\ walking = FALSE /\ menu = "shut" /\ window = "focused" /\ hand = "off" /\ wake = FALSE
        /\ slow \in BOOLEAN /\ runSlow = FALSE /\ graded = FALSE /\ kind = "level" /\ went = "none" /\ sheet = FALSE
        /\ wokeMove = FALSE /\ enter = "up" /\ skipped = FALSE /\ results = 0

Keep(v) == UNCHANGED v

\* begin(): a fresh walk; the speed is read from ধীরে খেলো here and fixed for the run.
Begin(k) == /\ screen' = "play" /\ walking' = FALSE /\ runSlow' = slow /\ graded' = FALSE /\ kind' = k /\ sheet' = FALSE
            /\ hand' = "off" /\ results' = 0

YouTapThePlayArt == /\ screen = "title" /\ ~sheet /\ window = "focused" /\ Begin("level") /\ went' = "none"
                    /\ Keep(<<menu, window, wake, slow, wokeMove, enter, skipped>>)
YouPickTodaysMaze == /\ screen \in {"title", "over"} /\ window = "focused" /\ menu = "shut" /\ Begin("daily") /\ went' = "none"
                     /\ Keep(<<menu, window, wake, slow, wokeMove, enter, skipped>>)

\* An arrow key, a pad press or a swipe: steer() only while ticking.
YouSwipe == /\ Ticking /\ walking' = TRUE
            /\ Keep(<<screen, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* onPointerDown: pointerDown says "steer" only while ticking (and not as the wake-up click).
YouPutFingerDown == /\ Ticking /\ hand = "off" /\ ~wake /\ hand' = "down"
                    /\ Keep(<<screen, walking, menu, window, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
YouDragAcross == /\ Ticking /\ hand = "down" /\ walking' = TRUE
                 /\ Keep(<<screen, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* pointerMoves needs the pointer that went down here and, for a mouse, a held button: a plain move steers only a ghost hand.
MouseMovesWithNoButton == /\ Ticking /\ hand = "ghost" /\ walking' = TRUE
                          /\ Keep(<<screen, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
YouLiftFinger == /\ hand = "down" /\ window = "focused" /\ hand' = "off"
                 /\ Keep(<<screen, walking, menu, window, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* The button comes up in another window: the page never hears it.
YouLetGoElsewhere == /\ hand = "down" /\ window # "focused" /\ hand' = "ghost"
                     /\ Keep(<<screen, walking, menu, window, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)

WalkerStopsAtATurn == /\ Ticking /\ walking /\ walking' = FALSE
                      /\ Keep(<<screen, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* finish(): graded with the run's own speed (parOf(game.where, game.mode, game.slow)); recorded once.
WalkerReachesTheShop == /\ Ticking /\ walking
                        /\ screen' = "over" /\ walking' = FALSE /\ graded' = runSlow /\ results' = results + 1 /\ hand' = "off"
                        /\ Keep(<<menu, window, wake, slow, runSlow, kind, went, sheet, wokeMove, enter, skipped>>)

\* The player opens its menu on blur, hide, Esc, ⏸ and the game's own P, once the game is touched (any screen but the title).
Engaged == screen # "title"
OpensMenu == IF Engaged THEN "open" ELSE menu
\* session.blur/hide: let go of the finger, and the next click only wakes.
WindowBlurs == /\ window = "focused" /\ window' = "blurred" /\ hand' = "off" /\ wake' = TRUE /\ menu' = OpensMenu /\ enter' = "up"
               /\ Keep(<<screen, walking, slow, runSlow, graded, kind, went, sheet, wokeMove, skipped, results>>)
TabHides == /\ window # "hidden" /\ window' = "hidden" /\ hand' = "off" /\ wake' = TRUE /\ menu' = OpensMenu /\ enter' = "up"
            /\ Keep(<<screen, walking, slow, runSlow, graded, kind, went, sheet, wokeMove, skipped, results>>)
TabShows == /\ window = "hidden" /\ window' = "focused"
            /\ Keep(<<screen, walking, menu, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* Back by keyboard (alt-tab): no click arrives, and a swipe seconds later is a real swipe (the wake window has passed).
YouComeBackByKeyboard == /\ window = "blurred" /\ window' = "focused" /\ wake' = FALSE
                         /\ Keep(<<screen, walking, menu, hand, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* Back by clicking on the board: focus, then that pointerdown. With the menu up, the menu takes it; otherwise
\* pointerDown answers "wake" and nothing moves.
YouClickBackIn == /\ window = "blurred" /\ window' = "focused" /\ wake' = FALSE
                  /\ wokeMove' = (wokeMove \/ (menu = "shut" /\ ~wake /\ screen = "play"))
                  /\ Keep(<<screen, walking, menu, hand, slow, runSlow, graded, kind, went, sheet, enter, skipped, results>>)
YouPressPause == /\ window = "focused" /\ Engaged /\ menu = "shut" /\ menu' = "open" /\ hand' = "off"
                 /\ Keep(<<screen, walking, window, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* চালিয়ে যাও: a focus first, then resume; the menu took the click, so nothing is left to wake.
YouResume == /\ menu = "open" /\ window # "hidden" /\ menu' = "shut" /\ window' = "focused" /\ wake' = FALSE /\ hand' = "off"
             /\ Keep(<<screen, walking, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)
\* নতুন করে শুরু: the same maze again from home.
YouRestart == /\ menu = "open" /\ window # "hidden" /\ screen \in {"play", "over"} /\ Begin(kind) /\ menu' = "shut" /\ window' = "focused" /\ wake' = FALSE /\ went' = "none"
              /\ Keep(<<slow, wokeMove, enter, skipped>>)
\* ধীরে খেলো in the menu: the setting changes; the running walk keeps the speed it began with.
YouToggleSlow == /\ menu = "open" /\ slow' = ~slow
                 /\ Keep(<<screen, walking, menu, window, hand, wake, runSlow, graded, kind, went, sheet, wokeMove, enter, skipped, results>>)

\* Holding Enter (or Space) as the walker arrives, and letting go.
YouHoldEnter == /\ window = "focused" /\ enter = "up" /\ screen = "play" /\ enter' = "held"
                /\ Keep(<<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, skipped, results>>)
YouReleaseEnter == /\ enter = "held" /\ enter' = "up"
                   /\ Keep(<<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, skipped, results>>)
\* The held key's auto-repeat on the card: freshResultKey refuses repeats and keys pressed before the card.
RepeatCounts == FALSE
HeldEnterRepeats == /\ enter = "held" /\ screen = "over" /\ menu = "shut" /\ ~sheet /\ skipped' = (skipped \/ RepeatCounts)
                    /\ Keep(<<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, sheet, wokeMove, enter, results>>)
\* A fresh Enter or ১ on the card runs choices[0], the marked button's own action (endChoices).
YouPressEnterOnTheCard == /\ screen = "over" /\ menu = "shut" /\ ~sheet /\ window = "focused" /\ enter = "up"
                          /\ Begin("level") /\ went' = "asSaid"
                          /\ Keep(<<menu, window, wake, slow, wokeMove, enter, skipped>>)
YouPressTheMarkedButton == /\ screen = "over" /\ menu = "shut" /\ ~sheet /\ window = "focused"
                           /\ Begin("level") /\ went' = "asSaid"
                           /\ Keep(<<menu, window, wake, slow, wokeMove, enter, skipped>>)
\* সব লেভেল: a choice screen; nothing runs behind it.
YouOpenTheList == /\ screen \in {"title", "over"} /\ ~sheet /\ menu = "shut" /\ window = "focused" /\ sheet' = TRUE
                  /\ Keep(<<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, wokeMove, enter, skipped, results>>)
YouPickALevel == /\ sheet /\ menu = "shut" /\ window = "focused" /\ Begin("level") /\ went' = "none"
                 /\ Keep(<<menu, window, wake, slow, wokeMove, enter, skipped>>)
YouCloseTheList == /\ sheet /\ sheet' = FALSE
                   /\ Keep(<<screen, walking, menu, window, hand, wake, slow, runSlow, graded, kind, went, wokeMove, enter, skipped, results>>)

Next == YouTapThePlayArt \/ YouPickTodaysMaze \/ YouSwipe \/ YouPutFingerDown \/ YouDragAcross \/ MouseMovesWithNoButton
        \/ YouLiftFinger \/ YouLetGoElsewhere \/ WalkerStopsAtATurn \/ WalkerReachesTheShop
        \/ WindowBlurs \/ TabHides \/ TabShows \/ YouComeBackByKeyboard \/ YouClickBackIn \/ YouPressPause \/ YouResume \/ YouRestart
        \/ YouToggleSlow \/ YouHoldEnter \/ YouReleaseEnter \/ HeldEnterRepeats \/ YouPressEnterOnTheCard \/ YouPressTheMarkedButton
        \/ YouOpenTheList \/ YouPickALevel \/ YouCloseTheList

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "over"} /\ walking \in BOOLEAN /\ menu \in {"shut", "open"}
          /\ window \in {"focused", "blurred", "hidden"} /\ hand \in {"off", "down", "ghost"} /\ wake \in BOOLEAN
          /\ slow \in BOOLEAN /\ runSlow \in BOOLEAN /\ graded \in BOOLEAN /\ kind \in {"level", "daily"}
          /\ went \in {"none", "asSaid", "otherwise"} /\ sheet \in BOOLEAN /\ wokeMove \in BOOLEAN
          /\ enter \in {"up", "held"} /\ skipped \in BOOLEAN /\ results \in 0..1

\* The reader's rules.
NoProgressWhileAway == window # "focused" => ~Ticking
PausedWhenHidden == window = "hidden" /\ screen = "play" => menu = "open"
PausedWhenBlurred == window = "blurred" /\ screen = "play" => menu = "open"
InputReleasedWhenAway == window # "focused" \/ menu = "open" => hand = "off"
NoSteeringWithoutAPress == hand # "ghost"
ClickBackIsNotAMove == ~wokeMove
WalkerStillUnlessPlaying == walking => screen = "play"
StarsMatchYourSpeed == screen = "over" => graded = runSlow
EnterDoesWhatTheButtonSays == went # "otherwise"
ResultKeyNeedsFreshPress == ~skipped
ChoiceFreezesPlay == sheet => ~Ticking
NoDoubleResult == results <= 1
====
