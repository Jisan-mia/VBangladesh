---- MODULE NamShikhi ----
\* নাম শিখি after the rewrite (games-to-the-bar): the name book's screens, a round of stickers, the player's pause menu,
\* pause and focus, and the kids' daily limit with its rest screen. Mirrored from tools/nam-shikhi/lib/session.ts (begin,
\* tapCounts, won, toEnd, endLive, home, openList, closeList, choosingAllowed, pause, resume, leave, back),
\* tools/nam-shikhi/lib/book.ts (choose, advance) and tools/nam-shikhi/components/name-book.tsx (begin, pick, finish, next,
\* finishUp, pickWorld, pickLevel, the #p= hashchange effect, the 1 s atBreak() check between rounds, the blur / focus /
\* visibility listeners, the keys handler, useGamePlayer onPause / onResume / onRestart, showRest), plus
\* shared/game-player-client.tsx (the menu on blur, hide, Escape, ⏸ and P once "engaged") and shared/kids-kit.tsx
\* (useKidsSession: rest on open past the limit, atBreak, extend; RestScreen: a modal over every screen but play).
\* The parent gate, sharing and voice: NamShikhiKids.tla. The spec before the rewrite is in git (before-fix/ is its run).
\* Two cards stand in for a page of six. A wrong sticker only marks itself (book.ts), so it is left out.
\* "tap": what the last tap on a sticker did, labelled by the conditions it came in under, so a guard that let a tap
\* through under the menu or as the first tap back would show up. "fresh": the end screen's guard has passed.
EXTENDS Naturals
VARIABLES screen, card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, overLimit, resting, begun
vars == <<screen, card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, overLimit, resting, begun>>

Here == window = "here"
\* showRest: the rest screen covers the stage on every screen but play, and blocks every tap outside it.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~menu

Init == /\ screen = "title" /\ card = 1 /\ solved = FALSE /\ recorded = FALSE /\ records = 0 /\ fresh = FALSE
        /\ menu = FALSE /\ engaged = FALSE /\ window = "here" /\ swallow = FALSE /\ tap = "none"
        /\ overLimit = FALSE /\ resting = FALSE /\ begun = "inTime"

\* begin(session, atBreak()): from the title, or from the end screen once its guard has passed. Past today's limit the
\* rest screen comes instead of a round.
YouPressStart == /\ Free /\ Here /\ (screen = "title" \/ (screen = "end" /\ fresh))
                 /\ IF overLimit
                    THEN resting' = TRUE /\ UNCHANGED <<screen, card, solved, recorded, records, begun, engaged, swallow, tap>>
                    ELSE /\ screen' = "play" /\ card' = 1 /\ solved' = FALSE /\ recorded' = FALSE /\ records' = 0
                         /\ begun' = "inTime" /\ engaged' = TRUE /\ swallow' = FALSE /\ tap' = "none" /\ UNCHANGED resting
                 /\ UNCHANGED <<fresh, menu, window, overLimit>>

\* pick(): the child taps the right sticker (or part). tapCounts decides: under the menu or away it is ignored; the first tap
\* after coming back only wakes the game; otherwise it is placed. Placing the last card wins the round at this very tap:
\* won(session, atBreak()) records the stars once and checks the limit.
Counts == ~menu /\ Here /\ ~swallow
YouTapTheRightSticker ==
  /\ screen = "play" /\ ~solved /\ ~RestShows
  /\ solved' = Counts
  /\ swallow' = (swallow /\ (menu \/ ~Here))
  /\ tap' = IF ~Counts THEN (IF swallow /\ ~menu /\ Here THEN "woke" ELSE "ignored")
            ELSE IF menu THEN "placedUnderMenu" ELSE IF swallow THEN "placedOnWake" ELSE "placed"
  /\ IF Counts /\ card = 2 /\ ~recorded
     THEN recorded' = TRUE /\ records' = records + 1 /\ resting' = overLimit
     ELSE UNCHANGED <<recorded, records, resting>>
  /\ UNCHANGED <<screen, card, fresh, menu, engaged, window, overLimit, begun>>

\* → (or the solved card, or Enter): next(), through tapCounts. The next card, or the end screen once the page is full
\* (toEnd: only after it was recorded). Off the play screen the 1 s atBreak() check runs again (modelled as at once).
YouPressNext == /\ screen = "play" /\ solved /\ Free /\ Here
                /\ IF swallow THEN swallow' = FALSE /\ UNCHANGED <<screen, card, solved, fresh, resting>>
                   ELSE IF card = 1
                   THEN card' = 2 /\ solved' = FALSE /\ UNCHANGED <<screen, fresh, swallow, resting>>
                   ELSE /\ recorded /\ screen' = "end" /\ fresh' = FALSE /\ resting' = (resting \/ overLimit)
                        /\ UNCHANGED <<card, solved, swallow>>
                /\ UNCHANGED <<recorded, records, menu, engaged, window, tap, overLimit, begun>>
\* GUARD_MS passes on the end screen (endLive).
TheGuardPasses == /\ screen = "end" /\ ~fresh /\ fresh' = TRUE
                  /\ UNCHANGED <<screen, card, solved, recorded, records, menu, engaged, window, swallow, tap, overLimit, resting, begun>>
\* শেষ (after the guard): home(); the next level waits on the title, nothing starts.
YouPressShesh == /\ screen = "end" /\ fresh /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, overLimit, resting, begun>>
\* সব লেভেল: openList() only from the title or the end; a picked level (or ফিরে যাও) closes it to a title. World tiles
\* (pickWorld, title only) just change which level waits there, so they need no step of their own.
YouOpenTheList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "list"
                  /\ UNCHANGED <<card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, overLimit, resting, begun>>
YouPickALevel == /\ screen = "list" /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, overLimit, resting, begun>>
\* A #p= link (hashchange), from any screen and even under the rest screen: toTitle(). It never starts a round.
ALinkOpens == /\ screen' = "title" /\ swallow' = FALSE /\ resting' = (resting \/ overLimit)
              /\ UNCHANGED <<card, solved, recorded, records, fresh, menu, engaged, window, tap, overLimit, begun>>
\* A reload or opening from the kids' hub: a fresh page on the title; the kit starts resting past the limit.
ThePageOpens == /\ screen' = "title" /\ card' = 1 /\ solved' = FALSE /\ recorded' = FALSE /\ records' = 0 /\ fresh' = FALSE
                /\ menu' = FALSE /\ engaged' = FALSE /\ window' = "here" /\ swallow' = FALSE /\ tap' = "none"
                /\ resting' = overLimit /\ begun' = "inTime"
                /\ UNCHANGED overLimit

\* The player's menu: ⏸, Escape or the game's own P (player.requestPause()), on any screen → pause().
YouPressPause == /\ Here /\ ~menu /\ ~RestShows /\ menu' = TRUE /\ engaged' = TRUE
                 /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, window, swallow, tap, overLimit, resting, begun>>
\* Blur or hide: the game's own leave() (mid-round the next tap only wakes) and the player's menu once engaged.
GoAway(w) == /\ window' = w /\ swallow' = (swallow \/ screen = "play") /\ menu' = (menu \/ engaged)
             /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, engaged, tap, overLimit, resting, begun>>
WindowBlurs == Here /\ GoAway("blurred")
TabHides == window # "hidden" /\ GoAway("hidden")
\* Focus or the tab shown again: back(). The menu (if any) stays until চালিয়ে যাও.
YouComeBack == /\ window # "here" /\ window' = "here"
               /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, menu, engaged, swallow, tap, overLimit, resting, begun>>
\* চালিয়ে যাও: resume(); the menu took the click that came back, so nothing is swallowed.
YouResume == /\ menu /\ Here /\ menu' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, engaged, window, tap, overLimit, resting, begun>>
\* নতুন করে শুরু: resume() then toTitle(level).
YouRestart == /\ menu /\ Here /\ menu' = FALSE /\ swallow' = FALSE /\ screen' = "title" /\ resting' = (resting \/ overLimit)
              /\ UNCHANGED <<card, solved, recorded, records, fresh, engaged, window, tap, overLimit, begun>>

\* Today's time passes the section's limit. Between rounds the game asks atBreak() every second (modelled as at once);
\* during play nothing asks until the round is won.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ resting' = (resting \/ screen # "play")
            /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, begun>>
\* Behind the rest screen's parent gate (NamShikhiKids.tla): আজ আরও ১০ মিনিট → extend().
AParentGivesMoreTime == /\ resting /\ resting' = FALSE /\ overLimit' = FALSE
                        /\ UNCHANGED <<screen, card, solved, recorded, records, fresh, menu, engaged, window, swallow, tap, begun>>

Next == YouPressStart \/ YouTapTheRightSticker \/ YouPressNext \/ TheGuardPasses \/ YouPressShesh \/ YouOpenTheList \/ YouPickALevel
        \/ ALinkOpens \/ ThePageOpens \/ YouPressPause \/ WindowBlurs \/ TabHides \/ YouComeBack \/ YouResume \/ YouRestart
        \/ TimeIsUp \/ AParentGivesMoreTime

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "list", "play", "end"} /\ card \in 1..2 /\ solved \in BOOLEAN /\ recorded \in BOOLEAN
          /\ records \in 0..3 /\ fresh \in BOOLEAN /\ menu \in BOOLEAN /\ engaged \in BOOLEAN
          /\ window \in {"here", "blurred", "hidden"} /\ swallow \in BOOLEAN
          /\ tap \in {"none", "ignored", "woke", "placed", "placedUnderMenu", "placedOnWake"}
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ begun \in {"inTime", "late"}

\* The reader's rules (the before-fix rules, kept, plus the shared patterns of the rewrite).
\* The rest screen never covers a card in progress: during play it can only be pending once the page is full.
RestOnlyAtBreak == (resting /\ screen = "play") => recorded
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Past today's limit, every screen but play is a break, and the rest screen is up there.
RestAtTheBreak == (screen # "play" /\ overLimit) => resting
\* A won round is recorded at the tap that won it, once, and the end screen only follows a recorded round.
WonIsRecorded == (screen = "play" /\ card = 2 /\ solved) => recorded
RecordedOnce == records <= 1
EndFollowsARecordedRound == screen = "end" => recorded
\* No sticker is placed under the pause menu, and the tap that brings focus back only wakes the game.
NothingPlacedUnderTheMenu == tap # "placedUnderMenu"
FirstTapBackIsNotAMove == tap # "placedOnWake"
\* A round in play while the window is away is either paused by the menu or waiting for a wake tap.
PausedOrWakingWhenAway == (screen = "play" /\ window # "here") => (menu \/ swallow)
====
