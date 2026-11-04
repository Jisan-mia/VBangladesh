---- MODULE Ojogor ----
\* অ-তে অজগর at HEAD 6775639 (the game-player pilot): the level, the player's pause menu, pause and focus, the held
\* arrow key that steers the basket, the game clock, levels and a friend's link, mirrored from
\* tools/o-te-ojogor/components/ojogor-game.tsx (startLevel, begin, finish, tick, the visibilitychange hide(), resume,
\* retry, nextLevel, the keys handler, readFriend, useGamePlayer onPause / onResume / onRestart),
\* shared/game-player-client.tsx (openMenu on blur, tab hide, Escape and the pause button once "engaged"; resume;
\* restart; keys swallowed while the menu is open) and shared/game-kit.ts (useGameLoop stops on hide and on blur).
\* The kids' rules (daily limit, share, name, network) are in OjogorKids.tla.
\* Two levels stand in for 22. "friend" is the level a friend's link opened (0 = no link).
\* "hand": off; held (an arrow key is down, so the basket heads for that edge); stuck (the key is up, but the keyup
\* never reached the game, so the basket still glides to the edge on its own).
\* "engaged": the player has seen a tap or key inside it (record()); before that, away() opens no menu.
\* Left out: the board scrolled off screen (the player pauses it like blur), ◀ ▶ on screen (a held finger gets a
\* pointercancel from openMenu, and their pointerup / pointercancel always call hold()), and phones outside full screen
\* (the stage is hidden there, so nothing plays).
EXTENDS Naturals
VARIABLES phase, paused, menu, engaged, window, hand, level, unlocked, friend, opened, rival
vars == <<phase, paused, menu, engaged, window, hand, level, unlocked, friend, opened, rival>>

Levels == 1..2
Max(a, b) == IF a > b THEN a ELSE b
Min(a, b) == IF a < b THEN a ELSE b
\* unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1): what the level grid lets you open.
Open(u, f) == Max(u, f)
Here == window = "here"
\* useGameLoop runs while !paused && phase === "play" (and in view); it stops on a hidden tab and on window blur.
Running == phase = "play" /\ ~paused /\ Here

Init == /\ phase = "ready" /\ paused = FALSE /\ menu = FALSE /\ engaged = FALSE /\ window = "here" /\ hand = "off"
        /\ level = 1 /\ unlocked = 1 /\ friend = 0 /\ opened = 1 /\ rival = FALSE

\* startLevel(next, seed): a fresh tree with the basket centred and aimed where it stands; unpauses the game
\* (not the player's menu). A key still down steers again only on its next auto-repeat, counted as a new hold.
Fresh(next, isRival) == /\ level' = next /\ paused' = FALSE /\ rival' = isRival /\ hand' = "off"
\* openMenu(): the menu shows, a synthetic blur goes out, and onPause pauses the game only while live.phase === "play".
OpenMenu == /\ menu' = TRUE /\ paused' = (paused \/ phase = "play")

\* শুরু করো (a tap inside the player, so it is now engaged), or Space / Enter: begin().
YouPressStart == /\ phase = "ready" /\ Here /\ ~menu /\ phase' = "play" /\ engaged' = TRUE
                 /\ UNCHANGED <<paused, menu, window, hand, level, unlocked, friend, opened, rival>>
\* keydown ← / →: steer(edge), only while playing, not paused, and with no menu swallowing keys.
YouHoldAnArrow == /\ phase = "play" /\ ~paused /\ ~menu /\ Here /\ hand # "held" /\ hand' = "held"
                  /\ UNCHANGED <<phase, paused, menu, engaged, window, level, unlocked, friend, opened, rival>>
\* keyup reaches the page only while it has focus. With the menu open the player stops it; while paused the game's
\* handler returns before hold(). Either way a level in play keeps its edge aim. (On the card or a fresh start screen
\* the aim no longer matters.)
YouLetGo == /\ hand = "held" /\ Here
            /\ hand' = IF phase = "play" /\ (menu \/ paused) THEN "stuck" ELSE "off"
            /\ UNCHANGED <<phase, paused, menu, engaged, window, level, unlocked, friend, opened, rival>>
\* The pause button (⏸) or Escape: openMenu(). Escape counts only once engaged; the button always works.
YouPressPause == /\ Here /\ ~menu /\ OpenMenu
                 /\ UNCHANGED <<phase, engaged, window, hand, level, unlocked, friend, opened, rival>>
\* blur → away(): the menu opens once engaged. Nothing in the game drops the held key.
WindowBlurs == /\ Here /\ window' = "blurred"
               /\ IF engaged /\ ~menu THEN OpenMenu ELSE UNCHANGED <<menu, paused>>
               /\ UNCHANGED <<phase, engaged, hand, level, unlocked, friend, opened, rival>>
WindowFocuses == /\ window = "blurred" /\ window' = "here"
                 /\ UNCHANGED <<phase, paused, menu, engaged, hand, level, unlocked, friend, opened, rival>>
\* visibilitychange: the game's hide() pauses a level in play, and the player's away() opens the menu once engaged.
TabHides == /\ window # "hidden" /\ window' = "hidden"
            /\ paused' = (paused \/ phase = "play")
            /\ menu' = (menu \/ engaged)
            /\ UNCHANGED <<phase, engaged, hand, level, unlocked, friend, opened, rival>>
TabShows == /\ window = "hidden" /\ window' = "here"
            /\ UNCHANGED <<phase, paused, menu, engaged, hand, level, unlocked, friend, opened, rival>>
\* The menu's চালিয়ে যাও: resume() → focus → onResume → the game's resume() (only clears paused; the aim stays).
YouResume == /\ menu /\ Here /\ menu' = FALSE /\ paused' = FALSE
             /\ UNCHANGED <<phase, engaged, window, hand, level, unlocked, friend, opened, rival>>
\* The menu's নতুন করে শুরু: onRestart → startLevel(level, rival ? seed : newSeed()) on its start screen.
YouRestart == /\ menu /\ Here /\ menu' = FALSE /\ phase' = "ready" /\ Fresh(level, rival)
              /\ UNCHANGED <<engaged, window, unlocked, friend, opened>>
\* tick → step(): the last right letter lands in the basket (EV_DONE) → finish(): levels.record(level, stars).
TheLastLetterLands == /\ Running /\ phase' = "won"
                      /\ unlocked' = Min(2, Max(unlocked, level + 1))
                      /\ opened' = Max(opened, Open(unlocked', friend))
                      /\ UNCHANGED <<paused, menu, engaged, window, hand, level, friend, rival>>
\* আবার খেলো: retry() = startLevel(level, rival ? seed : newSeed(), play = true).
YouPlayAgain == /\ phase = "won" /\ Here /\ ~menu /\ phase' = "play" /\ Fresh(level, rival)
                /\ UNCHANGED <<menu, engaged, window, unlocked, friend, opened>>
\* পরের লেভেল, or Space / Enter on the card: nextLevel() = startLevel(level + 1) with a new seed.
YouGoToTheNextLevel == /\ phase = "won" /\ Here /\ ~menu /\ phase' = "ready" /\ Fresh(Min(2, level + 1), FALSE)
                       /\ UNCHANGED <<menu, engaged, window, unlocked, friend, opened>>
\* সব লেভেল → LevelGrid, in any phase: startLevel(pick) with a new seed.
YouPickALevel == /\ Here /\ ~menu /\ \E next \in 1..Open(unlocked, friend) : phase' = "ready" /\ Fresh(next, FALSE)
                 /\ UNCHANGED <<menu, engaged, window, unlocked, friend, opened>>
\* hashchange → readFriend(): a valid link sets the friend and startLevel(link level, link seed). The menu stays as it is.
AFriendsLinkOpens == /\ Here /\ \E f \in Levels :
                          /\ friend' = f /\ phase' = "ready" /\ Fresh(f, TRUE)
                          /\ opened' = Max(opened, Open(unlocked, f))
                     /\ UNCHANGED <<menu, engaged, window, unlocked>>

Next == YouPressStart \/ YouHoldAnArrow \/ YouLetGo \/ YouPressPause \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ YouResume \/ YouRestart \/ TheLastLetterLands \/ YouPlayAgain \/ YouGoToTheNextLevel \/ YouPickALevel \/ AFriendsLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "play", "won"} /\ paused \in BOOLEAN /\ menu \in BOOLEAN /\ engaged \in BOOLEAN
          /\ window \in {"here", "blurred", "hidden"} /\ hand \in {"off", "held", "stuck"} /\ level \in Levels
          /\ unlocked \in Levels /\ friend \in 0..2 /\ opened \in Levels /\ rival \in BOOLEAN

\* The reader's rules.
\* The letters don't fall while you're in another window or tab.
NoProgressWhileAway == Running => Here
\* A level in progress is paused while you're in another window.
PausedWhenBlurred == (phase = "play" /\ window = "blurred") => paused
\* A level in progress is paused while its tab is hidden.
PausedWhenHidden == (phase = "play" /\ window = "hidden") => paused
\* While the pause menu is open, nothing falls.
MenuFreezesPlay == menu => ~Running
\* After blur or hide, no key counts as held.
InputReleasedWhenAway == hand = "held" => Here
\* When you let go of the arrow, the basket stops.
BasketStopsWhenYouLetGo == hand # "stuck"
\* Only a level in progress is ever paused.
PausedOnlyMidLevel == paused => phase = "play"
\* A level you could open stays open.
UnlockNeverShrinks == Open(unlocked, friend) >= opened
\* A friend's link plays exactly the friend's level (and, with it, the friend's seed).
ReplayIsExact == rival => level = friend
====
