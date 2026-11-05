---- MODULE MonerRong ----
\* মনের রং after the rewrite (games-to-the-bar): the screens, a round of pictures (name the feeling → a kind thing → →), the
\* player's pause menu, pause and focus, the end screen's guard, saved stars and today's card, and the kids' daily limit with its
\* rest screen. Mirrored from tools/moner-rong/lib/session.ts (begin, tapCounts, stepped, won, toEnd, endLive, home, openList,
\* closeList, choosingAllowed, pause, resume, leave, back), lib/round.ts (nameFeeling, chooseKind, advance), lib/finish.ts
\* (finishRound), lib/progress.ts (practised) and components/game.tsx (begin, pickFace, pickKind, next, finishUp, pickLevel, the
\* 1 s atBreak() check between rounds, the blur / focus / visibility listeners, the keys handler, useGamePlayer onPause / onResume
\* / onRestart / onLevels, showRest), plus shared/game-player-client.tsx (the menu on blur, hide, Escape, ⏸ and P once "engaged")
\* and shared/kids-kit.tsx (useKidsSession: rest on open past the limit, atBreak, extend; RestScreen: a modal over every screen
\* but play). The parent gate, sharing and voice: MonerRongKids.tla. The spec before the rewrite is in git (before-fix/ is its run).
\* Two pictures stand in for a round of three to five, and a level is played at most twice (enough to show the stars and the
\* card count up). A wrong face only wobbles (round.ts: tries, no step), so it has no action.
\* A tap on a face or a kind picture is checked as a step of the picture (NothingChosenWhenItCannotCount), so a guard that let a
\* tap through under the menu, away, as the first tap back or inside the settle time would show up as a broken rule.
\* "settled": SETTLE_MS has passed since the last step. "fresh": the end screen's guard has passed.
\* "stars": the stars saved for the level, "cardPictures": the pictures the parents' card says (2 a finished round).
EXTENDS Naturals
CONSTANT MaxPlays   \* rounds that may be won: 1 for the chart, 2 for the run that checks the stars and the card count up
VARIABLES screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, overLimit, resting, begun
vars == <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, overLimit, resting, begun>>

Here == window = "here"
\* showRest: the rest screen covers the stage on every screen but play, and blocks every tap outside it.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~menu
Counts == ~menu /\ Here /\ ~swallow /\ settled
\* The first tap back (not under the menu, window here, settle time over): it only wakes the game.
Wakes == ~menu /\ Here /\ swallow /\ settled

Init == /\ screen = "title" /\ picture = 1 /\ step = "name" /\ recorded = FALSE /\ plays = 0 /\ stars = 0 /\ cardPictures = 0
        /\ fresh = FALSE /\ settled = FALSE /\ menu = FALSE /\ engaged = FALSE /\ window = "here" /\ swallow = FALSE 
        /\ overLimit = FALSE /\ resting = FALSE /\ begun = "inTime"

\* begin(session, atBreak()): from the title, or from the end screen once its guard has passed. Past today's limit the rest screen
\* comes instead of a round. A level is played at most twice here.
YouPressStart == /\ Free /\ Here /\ (screen = "title" \/ (screen = "end" /\ fresh)) /\ plays < MaxPlays
                 /\ IF overLimit
                    THEN resting' = TRUE /\ UNCHANGED <<screen, picture, step, recorded, begun, engaged, swallow, settled>>
                    ELSE /\ screen' = "play" /\ picture' = 1 /\ step' = "name" /\ recorded' = FALSE
                         /\ begun' = "inTime" /\ engaged' = TRUE /\ swallow' = FALSE /\ settled' = FALSE
                         /\ UNCHANGED resting
                 /\ UNCHANGED <<plays, stars, cardPictures, fresh, menu, window, overLimit>>

\* SETTLE_MS passes: the next tap counts.
TheSettleTimePasses == /\ screen = "play" /\ ~settled /\ settled' = TRUE
                       /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, menu, engaged, window, swallow, overLimit, resting, begun>>

\* pickFace(): the child taps the face that fits. tapCounts decides: under the menu, away or inside the settle time it is
\* ignored; the first tap after coming back only wakes the game; otherwise the colour fills and the picture goes on to its kind
\* things (stepped(): the settle time starts again).
YouTapTheRightFace ==
  /\ screen = "play" /\ step = "name" /\ ~RestShows
  /\ IF Counts THEN step' = "kind" /\ settled' = FALSE ELSE UNCHANGED <<step, settled>>
  /\ swallow' = IF Wakes THEN FALSE ELSE swallow
  /\ UNCHANGED <<screen, picture, recorded, plays, stars, cardPictures, fresh, menu, engaged, window, overLimit, resting, begun>>

\* pickKind(): the child taps one of the two kind pictures. Same guards. On the last picture this wins the round at this very
\* tap: finishRound() saves the stars (practice: one more per play-through), adds the pictures to today's card and checks the
\* limit, once (won(): recorded === serial).
YouTapAKindPicture ==
  /\ screen = "play" /\ step = "kind" /\ ~RestShows
  /\ IF Counts
     THEN /\ step' = "after" /\ settled' = FALSE
          /\ IF picture = 2 /\ ~recorded
             THEN /\ recorded' = TRUE /\ plays' = plays + 1 /\ stars' = plays + 1
                  /\ cardPictures' = cardPictures + 2 /\ resting' = overLimit
             ELSE UNCHANGED <<recorded, plays, stars, cardPictures, resting>>
     ELSE UNCHANGED <<step, settled, recorded, plays, stars, cardPictures, resting>>
  /\ swallow' = IF Wakes THEN FALSE ELSE swallow
  /\ UNCHANGED <<screen, picture, fresh, menu, engaged, window, overLimit, begun>>

\* next(): → (or Enter or Space). The next picture, or the end screen once the last picture is won (toEnd: only after it was
\* recorded). Off the play screen the 1 s atBreak() check runs again (modelled as at once).
YouPressNext == /\ screen = "play" /\ step = "after" /\ Free /\ Here
                /\ IF ~settled \/ swallow
                   THEN /\ swallow' = FALSE /\ UNCHANGED <<screen, picture, step, settled, fresh, resting>>
                   ELSE IF picture = 1
                   THEN picture' = 2 /\ step' = "name" /\ settled' = FALSE /\ UNCHANGED <<screen, fresh, swallow, resting>>
                   ELSE /\ recorded /\ screen' = "end" /\ fresh' = FALSE /\ resting' = (resting \/ overLimit)
                        /\ UNCHANGED <<picture, step, settled, swallow>>
                /\ UNCHANGED <<recorded, plays, stars, cardPictures, menu, engaged, window, overLimit, begun>>
\* GUARD_MS passes on the end screen (endLive).
TheGuardPasses == /\ screen = "end" /\ ~fresh /\ fresh' = TRUE
                  /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, settled, menu, engaged, window, swallow, overLimit, resting, begun>>
\* শেষ (after the guard): home(); the next level waits on the title, nothing starts.
YouPressShesh == /\ screen = "end" /\ fresh /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, overLimit, resting, begun>>
\* সব লেভেল: openList() from the title or the end screen, or from the pause menu mid-round (the menu resumes, then asks for the
\* list; the round is left unfinished, nothing is recorded). A picked level (or ফিরে যাও) closes it to a title. World tiles
\* (pickWorld, title only) just change which level waits there, so they need no step of their own.
YouOpenTheList == /\ screen \in {"title", "end"} /\ Free /\ screen' = "list"
                  /\ UNCHANGED <<picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, overLimit, resting, begun>>
YouPickAllLevelsInThePauseMenu == /\ screen = "play" /\ menu /\ Here /\ screen' = "list" /\ menu' = FALSE /\ swallow' = FALSE
                                  /\ resting' = (resting \/ overLimit)   \* the game calls atBreak() as it leaves the round
                                  /\ UNCHANGED <<picture, step, recorded, plays, stars, cardPictures, fresh, settled, engaged, window, overLimit, begun>>
YouPickALevel == /\ screen = "list" /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, overLimit, resting, begun>>
\* A reload or opening from the kids' hub: a fresh page on the title; the kit starts resting past the limit. Saved stars stay.
ThePageOpens == /\ screen' = "title" /\ picture' = 1 /\ step' = "name" /\ recorded' = FALSE /\ fresh' = FALSE
                /\ settled' = FALSE /\ menu' = FALSE /\ engaged' = FALSE /\ window' = "here" /\ swallow' = FALSE
                /\ resting' = overLimit /\ begun' = "inTime"
                /\ UNCHANGED <<plays, stars, cardPictures, overLimit>>

\* The player's menu: ⏸, Escape or the game's own P (player.requestPause()), on any screen → pause().
YouPressPause == /\ Here /\ ~menu /\ ~RestShows /\ menu' = TRUE /\ engaged' = TRUE
                 /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, window, swallow, overLimit, resting, begun>>
\* Blur or hide: the game's own leave() (mid-round the next tap only wakes) and the player's menu once engaged.
GoAway(w) == /\ window' = w /\ swallow' = (swallow \/ screen = "play") /\ menu' = (menu \/ engaged)
             /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, engaged, overLimit, resting, begun>>
WindowBlurs == Here /\ GoAway("blurred")
TabHides == window # "hidden" /\ GoAway("hidden")
\* Focus or the tab shown again: back(). The menu (if any) stays until চালিয়ে যাও.
YouComeBack == /\ window # "here" /\ window' = "here"
               /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, swallow, overLimit, resting, begun>>
\* চালিয়ে যাও: resume(); the menu took the click that came back, so nothing is swallowed.
YouResume == /\ menu /\ Here /\ menu' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, engaged, window, overLimit, resting, begun>>
\* নতুন করে শুরু: resume() then toTitle(level).
YouRestart == /\ menu /\ Here /\ menu' = FALSE /\ swallow' = FALSE /\ screen' = "title" /\ resting' = (resting \/ overLimit)
              /\ UNCHANGED <<picture, step, recorded, plays, stars, cardPictures, fresh, settled, engaged, window, overLimit, begun>>

\* Today's time passes the section's limit. Between rounds the game asks atBreak() every second (modelled as at once);
\* during play nothing asks until the round is won.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ resting' = (resting \/ screen # "play")
            /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, begun>>
\* Behind the rest screen's parent gate (MonerRongKids.tla): আজ আরও ১০ মিনিট → extend().
AParentGivesMoreTime == /\ resting /\ resting' = FALSE /\ overLimit' = FALSE
                        /\ UNCHANGED <<screen, picture, step, recorded, plays, stars, cardPictures, fresh, settled, menu, engaged, window, swallow, begun>>

Next == YouPressStart \/ TheSettleTimePasses \/ YouTapTheRightFace \/ YouTapAKindPicture \/ YouPressNext \/ TheGuardPasses \/ YouPressShesh
        \/ YouOpenTheList \/ YouPickAllLevelsInThePauseMenu \/ YouPickALevel \/ ThePageOpens \/ YouPressPause \/ WindowBlurs \/ TabHides
        \/ YouComeBack \/ YouResume \/ YouRestart \/ TimeIsUp \/ AParentGivesMoreTime

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "list", "play", "end"} /\ picture \in 1..2 /\ step \in {"name", "kind", "after"} 
          /\ recorded \in BOOLEAN /\ plays \in 0..2 /\ stars \in 0..2 /\ cardPictures \in 0..4 /\ fresh \in BOOLEAN /\ settled \in BOOLEAN
          /\ menu \in BOOLEAN /\ engaged \in BOOLEAN /\ window \in {"here", "blurred", "hidden"} /\ swallow \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ begun \in {"inTime", "late"}

\* The reader's rules (the before-fix rules, kept, plus the shared patterns of the rewrite).
\* The rest screen never covers a picture in progress: during play it can only be pending once the round is recorded.
RestOnlyAtBreak == (resting /\ screen = "play") => recorded
\* Once today's time is up, no new round starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Past today's limit, every screen but play is a break, and the rest screen is up there.
RestAtTheBreak == (screen # "play" /\ overLimit) => resting
\* The old NoDoubleResult and StarsMatchPlays: a won round is recorded at the tap that won it, once; the stars are the times a
\* level was played through, and the parents' card counts the pictures of exactly those rounds (never more).
WonIsRecorded == (screen = "play" /\ picture = 2 /\ step = "after") => recorded
EndFollowsARecordedRound == screen = "end" => recorded
StarsMatchPlays == stars = plays
CardMatchesPlays == cardPictures = 2 * plays
\* No face or kind picture is chosen under the pause menu, away, as the first tap back, or inside the settle time: a step of the
\* picture only ever comes from a tap that counted. (A reload, or → going on to the next picture, is not a choice.)
NothingChosenWhenItCannotCount == [][(screen = "play" /\ screen' = "play" /\ step \in {"name", "kind"} /\ step' # step)
                                       => (~menu /\ Here /\ ~swallow /\ settled)]_vars
\* A round in play while the window is away is either paused by the menu or waiting for a wake tap.
PausedOrWakingWhenAway == (screen = "play" /\ window # "here") => (menu \/ swallow)
StarsNeverDrop == [][stars' >= stars /\ cardPictures' >= cardPictures]_vars
====
