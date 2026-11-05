---- MODULE Cycle ----
\* পিয়নের সাইকেল (the rewrite): the title, the first-run story, the ride, pause and window focus, scrolling the road away,
\* the সব লেভেল list, পরের লেভেল / আবার খেলো, the star chimes and cheer, the road loop, a friend's link, and the result
\* card's comparison line. Mirrors tools/peoner-cycle/lib/session.ts (the pure machine) and components/ride-game.tsx.
\* Input is one tap per lane change (nothing is held); the story's hold-to-skip finger is released by the same blur.
VARIABLES phase, from, win, inView, picker, listPaused, fanfare, loop, link, lvl, rode, card
vars == <<phase, from, win, inView, picker, listPaused, fanfare, loop, link, lvl, rode, card>>

Phases == {"title", "story", "riding", "paused", "over"}
\* lvl: the route on screen (title, goal line, star marks) is the friend's route ("theirs") or another ("other").
\* rode: the route the ride in progress was started on. card: whose route the result card is from.
Routes == {"theirs", "other"}

Init == /\ phase = "title" /\ from = "riding" /\ win = "here" /\ inView = TRUE /\ picker = FALSE /\ listPaused = FALSE
        /\ fanfare = FALSE /\ loop = FALSE
        \* Opening the page from a friend's link is FriendLinkOpens from this first state.
        /\ link = "none" /\ lvl = "other" /\ rode = "other" /\ card = "none"

\* session.canPlay: the tab shows, the window has focus, the road is on screen.
CanPlay == win = "here" /\ inView
\* session.moving: the road rolls only here (the breath after a resume is a time, not a state).
Ticking == phase = "riding" /\ CanPlay /\ ~picker

\* start(): রওনা দাও, Space or an arrow from the title. The very first run shows the story first. startRoad() plays the loop.
YouStart == /\ phase = "title" /\ CanPlay /\ ~picker
            /\ \/ /\ phase' = "riding" /\ loop' = TRUE
               \/ /\ phase' = "story" /\ loop' = FALSE
            /\ rode' = lvl /\ fanfare' = FALSE /\ card' = "none"
            /\ UNCHANGED <<from, win, inView, picker, listPaused, link, lvl>>
\* storyDone(): the panels end or a hold skips them; the ride begins and its loop starts.
StoryEnds == /\ phase = "story" /\ ~picker
             /\ phase' = "riding" /\ loop' = TRUE
             /\ UNCHANGED <<from, win, inView, picker, listPaused, fanfare, link, lvl, rode, card>>
\* finish(): the bike reaches the place or the last allowed bump stops it. The stars are recorded here; the chimes are queued.
YouFinish == /\ Ticking
             /\ phase' = "over" /\ card' = rode /\ loop' = FALSE
             /\ fanfare' \in {fanfare, TRUE}
             /\ UNCHANGED <<from, win, inView, picker, listPaused, link, lvl, rode>>
\* The star chimes and the cheer, from a timer: cheerMayPlay(session, run) lets them play only on their own end screen.
FanfarePlays == /\ fanfare /\ phase = "over" /\ ~picker /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, from, win, inView, picker, listPaused, loop, link, lvl, rode, card>>
\* pause(): the player's menu, P or Esc. stopRoad().
YouPause == /\ phase \in {"riding", "story"} /\ win = "here"
            /\ from' = phase /\ phase' = "paused" /\ loop' = FALSE
            /\ UNCHANGED <<win, inView, picker, listPaused, fanfare, link, lvl, rode, card>>
\* resume(): চালিয়ে যাও or the first tap back (the road waits 0.45 s). Not under an open list, not away.
YouResume == /\ phase = "paused" /\ CanPlay /\ ~picker
             /\ phase' = from /\ loop' = (from = "riding")
             /\ UNCHANGED <<from, win, inView, picker, listPaused, fanfare, link, lvl, rode, card>>
\* visibilitychange: away(session, "hide") pauses and stops the loop.
TabHides == /\ win # "hidden"
            /\ win' = "hidden"
            /\ \/ /\ phase \in {"riding", "story"} /\ from' = phase /\ phase' = "paused"
               \/ /\ ~(phase \in {"riding", "story"}) /\ UNCHANGED <<phase, from>>
            /\ loop' = FALSE
            /\ UNCHANGED <<inView, picker, listPaused, fanfare, link, lvl, rode, card>>
TabShows == /\ win = "hidden" /\ win' = "here"
            /\ UNCHANGED <<phase, from, inView, picker, listPaused, fanfare, loop, link, lvl, rode, card>>
\* window blur: away(session, "blur"), the same pause. (The player also pauses on blur.)
WindowBlurs == /\ win = "here" /\ win' = "away"
               /\ \/ /\ phase \in {"riding", "story"} /\ from' = phase /\ phase' = "paused"
                  \/ /\ ~(phase \in {"riding", "story"}) /\ UNCHANGED <<phase, from>>
               /\ loop' = FALSE
               /\ UNCHANGED <<inView, picker, listPaused, fanfare, link, lvl, rode, card>>
WindowFocuses == /\ win = "away" /\ win' = "here"
                 /\ UNCHANGED <<phase, from, inView, picker, listPaused, fanfare, loop, link, lvl, rode, card>>
\* useInView(play) → away(session, "scroll"): the road scrolled away pauses it, and nothing starts or resumes meanwhile.
YouScrollAway == /\ inView /\ win = "here"
                 /\ inView' = FALSE
                 /\ \/ /\ phase \in {"riding", "story"} /\ from' = phase /\ phase' = "paused"
                    \/ /\ ~(phase \in {"riding", "story"}) /\ UNCHANGED <<phase, from>>
                 /\ loop' = FALSE
                 /\ UNCHANGED <<win, picker, listPaused, fanfare, link, lvl, rode, card>>
YouScrollBack == /\ ~inView /\ win = "here" /\ inView' = TRUE
                 /\ UNCHANGED <<phase, from, win, picker, listPaused, fanfare, loop, link, lvl, rode, card>>
\* openList(): a ride or the story in progress is paused first; the list is a choice screen that freezes play.
YouOpenList == /\ ~picker /\ win = "here"
               /\ picker' = TRUE
               /\ \/ /\ phase \in {"riding", "story"} /\ from' = phase /\ phase' = "paused" /\ listPaused' = TRUE
                  \/ /\ ~(phase \in {"riding", "story"}) /\ UNCHANGED <<phase, from, listPaused>>
               /\ loop' = FALSE
               /\ UNCHANGED <<win, inView, fanfare, link, lvl, rode, card>>
\* closeList(): closes it and, if it paused the ride, resumes (after a breath).
YouCloseList == /\ picker /\ win = "here"
                /\ picker' = FALSE /\ listPaused' = FALSE
                /\ \/ /\ listPaused /\ CanPlay /\ phase = "paused" /\ phase' = from /\ loop' = (from = "riding")
                   \/ /\ ~(listPaused /\ CanPlay /\ phase = "paused") /\ UNCHANGED <<phase, loop>>
                /\ UNCHANGED <<from, win, inView, fanfare, link, lvl, rode, card>>
\* load(): a level picked in the list, পরের লেভেল, নতুন করে শুরু: back to a title, timers cleared, the card gone.
LoadRoute == /\ phase' = "title" /\ card' = "none" /\ fanfare' = FALSE /\ loop' = FALSE
             /\ picker' = FALSE /\ listPaused' = FALSE
             /\ lvl' = "other"   \* back to the friend's route is the link again (FriendLinkOpens)
             /\ UNCHANGED <<from, win, inView, link, rode>>
YouPickRoute == picker /\ win = "here" /\ LoadRoute
YouGoNextRoute == phase = "over" /\ win = "here" /\ ~picker /\ LoadRoute
\* again(): আবার খেলো, 0.7 s after the end screen and only for a fresh press; needs the road on screen. A new run clears the timers.
YouRideAgain == /\ phase = "over" /\ CanPlay /\ ~picker
                /\ phase' = "riding" /\ rode' = lvl /\ fanfare' = FALSE /\ card' = "none" /\ loop' = TRUE
                /\ UNCHANGED <<from, win, inView, picker, listPaused, link, lvl>>
\* hashchange → fromHash(): the link is kept; the route on screen changes only when friendMayLoad(session) (a title or the
\* end screen). Mid-ride, mid-pause or mid-story it waits for after.
FriendLinkOpens == /\ (link = "none" \/ lvl = "other") /\ win = "here"
                   /\ link' = "friend"
                   /\ \/ /\ phase \in {"title", "over"}
                         /\ lvl' = "theirs" /\ phase' = "title" /\ card' = "none" /\ fanfare' = FALSE /\ loop' = FALSE
                         /\ picker' = FALSE /\ listPaused' = FALSE
                      \/ /\ ~(phase \in {"title", "over"})
                         /\ UNCHANGED <<lvl, phase, card, fanfare, loop, picker, listPaused>>
                   /\ UNCHANGED <<from, win, inView, rode>>

Next == YouStart \/ StoryEnds \/ YouFinish \/ FanfarePlays \/ YouPause \/ YouResume \/ TabHides \/ TabShows
        \/ WindowBlurs \/ WindowFocuses \/ YouScrollAway \/ YouScrollBack \/ YouOpenList \/ YouCloseList
        \/ YouPickRoute \/ YouGoNextRoute \/ YouRideAgain \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == phase \in Phases /\ from \in {"riding", "story"} /\ win \in {"here", "away", "hidden"} /\ inView \in BOOLEAN
          /\ fanfare \in BOOLEAN /\ picker \in BOOLEAN /\ listPaused \in BOOLEAN /\ loop \in BOOLEAN
          /\ link \in {"none", "friend"} /\ lvl \in Routes /\ rode \in Routes /\ card \in {"none"} \cup Routes

\* The result card's comparison line: versusLine() compares only when the card's ride was on the friend's road (same seed and route).
CardCompares == link = "friend" /\ card = "theirs"

\* The reader's rules.
PausedWhenHidden == win = "hidden" => phase # "riding"
PausedWhenBlurred == win = "away" => phase # "riding"
PausedWhenOffScreen == ~inView => phase # "riding"
\* The road rolls (meters, cows, a bump) only while Ticking; written on the state, since stepGame is called only when moving().
NoProgressWhileAway == ~(Ticking /\ win # "here")
ChoiceFreezesPlay == picker => phase # "riding"
NoFanfareAfterMovingOn == fanfare => phase = "over"
RouteMatchesRide == phase \in {"riding", "paused", "story"} => lvl = rode
CompareOnlySameRoad == CardCompares => card = "theirs"
\* The road loop plays only while the road rolls, never paused, hidden, away, scrolled off, under the list or on the result.
LoopOnlyWhenMeaningful == loop => Ticking
====
