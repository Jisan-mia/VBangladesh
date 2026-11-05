---- MODULE GuneDekhi ----
\* গুনে দেখি after the rewrite: the screens, the round of ponds, the one pending timer (next pond / end screen), the 1.5 s
\* glimpse of এক নজরে, the player's pause, going away and coming back, the level list, the kids' daily limit and the rest
\* screen. Mirrored from:
\*   tools/gune-dekhi/lib/session.ts      begin, tapOn, showPattern, glimpseEnds / glimpseMayRun, solved, timerFires /
\*                                         timerMayRun, pause, resume, blur, focus, toTitle, openLevels
\*   tools/gune-dekhi/components/game.tsx onAnswer() records the stars and calls atBreak() at the last right answer;
\*                                         begin() asks atBreak(); the glimpse effect is keyed on watching; onPause stops
\*                                         the pending timer; onLevels opens the list; blur/focus handlers
\*   shared/kids-kit.tsx                  useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two ponds stand for five, and every pond is a glimpse pond (the counting ponds have no timer, so they add nothing here).
\* Held through tests/session.test.ts instead: a scroll is not a tap, a key held through the last pond (freshKey), the picture
\* end buttons, no network or child data, the parent gate on the share link. No voice anywhere, so no SilentWhenMuted.
EXTENDS Naturals
CONSTANT Items
VARIABLES screen, back, item, pending, looking, finished, recorded, begun,   \* the round
          paused, away, moved, unseen,                                       \* away and back, ghosts
          overLimit, resting                                                 \* the daily limit
round == <<screen, back, item, pending, looking, finished, recorded, begun>>
hand == <<paused, away, moved, unseen>>
kids == <<overLimit, resting>>
vars == <<round, hand, kids>>

RestShows == resting /\ screen # "play"
\* Someone can see the game and play it: the menu is shut, the window is in front, no rest screen covers it.
Watching == ~paused /\ ~away /\ ~RestShows
TimerMayRun == pending # "none" /\ screen = "play" /\ Watching
GlimpseMayRun == looking /\ screen = "play" /\ Watching

Init == /\ screen = "title" /\ back = "title" /\ item = 1 /\ pending = "none" /\ looking = FALSE
        /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ away = FALSE /\ moved = FALSE /\ unseen = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit      \* useKidsSession: past today's limit the page opens resting

\* A new round opens (begin()): atBreak() first. Past the limit the rest screen shows and nothing starts.
OpenRound == /\ screen' = "play" /\ item' = 1 /\ pending' = "none" /\ finished' = FALSE /\ recorded' = FALSE
             /\ looking' = TRUE /\ resting' = FALSE /\ begun' = "inTime"
Refuse == /\ resting' = TRUE /\ UNCHANGED <<screen, item, pending, looking, finished, recorded, begun>>

\* খেলো on the title, আবার খেলো, Enter on the title.
YouStartARound == /\ screen \in {"title", "end"} /\ Watching
                  /\ IF overLimit THEN Refuse ELSE OpenRound
                  /\ UNCHANGED <<back, paused, away, moved, unseen, overLimit>>
\* The level list: from the title, the end screen, or the player's সব লেভেল in mid-play. A pond waiting under it stays.
YouOpenTheLevelList == /\ screen \in {"title", "end", "play"} /\ Watching
                       /\ back' = screen /\ screen' = "levels"
                       /\ UNCHANGED <<item, pending, looking, finished, recorded, begun, hand, kids>>
YouCloseTheLevelList == /\ screen = "levels" /\ Watching /\ screen' = back
                        /\ UNCHANGED <<back, item, pending, looking, finished, recorded, begun, hand, kids>>
YouPickALevel == /\ screen = "levels" /\ Watching
                 /\ IF overLimit THEN Refuse /\ screen' = "title" ELSE OpenRound
                 /\ UNCHANGED <<back, paused, away, moved, unseen, overLimit>>

\* tapOn(): only on play, nothing covering it, no pond mid-cheer.
YouTapAWrongAnswer == /\ screen = "play" /\ Watching /\ pending = "none"
                      /\ looking' = TRUE   \* a miss shows the pattern again
                      /\ UNCHANGED <<screen, back, item, pending, finished, recorded, begun, paused, away, moved, unseen, kids>>
\* The right answer: solved(). On the last pond the stars are saved and atBreak() runs in this very tap.
YouTapTheRightAnswer == /\ screen = "play" /\ Watching /\ pending = "none"
                        /\ pending' = (IF item = Items THEN "end" ELSE "next") /\ looking' = FALSE
                        /\ finished' = (item = Items) /\ recorded' = (item = Items)
                        /\ resting' = (IF item = Items THEN overLimit ELSE resting)
                        /\ UNCHANGED <<screen, back, item, begun, paused, away, moved, unseen, overLimit>>
\* The covered pattern is a button: tap it to look again.
YouTapTheCover == /\ screen = "play" /\ Watching /\ pending = "none" /\ ~looking
                  /\ looking' = TRUE
                  /\ UNCHANGED <<screen, back, item, pending, finished, recorded, begun, hand, kids>>

\* The 1.5 s timer fires. glimpseEnds() hides the pattern only if someone is looking (glimpseMayRun); `unseen` would record
\* a pattern that ran out unseen.
TheGlimpseEnds == /\ GlimpseMayRun
                  /\ looking' = FALSE /\ unseen' = ~(screen = "play" /\ Watching)
                  /\ UNCHANGED <<screen, back, item, pending, finished, recorded, begun, paused, away, moved, kids>>
\* timerFires() runs only when timerMayRun(): the menu shut, the window in front, the play screen showing.
TheNextPondComes == /\ pending = "next" /\ TimerMayRun
                    /\ pending' = "none" /\ item' = item + 1 /\ looking' = TRUE
                    /\ moved' = (moved \/ ~(screen = "play" /\ Watching))
                    /\ UNCHANGED <<screen, back, finished, recorded, begun, paused, away, unseen, kids>>
TheEndScreenComes == /\ pending = "end" /\ TimerMayRun
                     /\ pending' = "none" /\ screen' = "end"
                     /\ moved' = (moved \/ ~(screen = "play" /\ Watching))
                     /\ UNCHANGED <<back, item, looking, finished, recorded, begun, paused, away, unseen, kids>>

\* The window blurs or the tab hides (blur()). The swallowed first tap back is in tests/session.test.ts.
WindowBlurs == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<round, paused, moved, unseen, kids>>
WindowFocuses == /\ away /\ away' = FALSE
                 /\ UNCHANGED <<round, paused, moved, unseen, kids>>
\* The player's menu: ⏸, P, Escape, blur or hide.
TheMenuOpens == /\ ~paused /\ paused' = TRUE
                /\ UNCHANGED <<round, away, moved, unseen, kids>>
YouResume == /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<round, away, moved, unseen, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title; the pending timer is cleared.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Watching))
                       /\ screen' = "title" /\ pending' = "none" /\ looking' = FALSE /\ paused' = FALSE
                       /\ UNCHANGED <<back, item, finished, recorded, begun, away, moved, unseen, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<round, hand, resting>>
\* A reload, or opening the game from the kids' hub: the title, resting if past the limit.
ThePageOpens == /\ screen' = "title" /\ pending' = "none" /\ looking' = FALSE /\ item' = 1 /\ finished' = FALSE /\ recorded' = FALSE
                /\ paused' = FALSE /\ resting' = overLimit
                /\ UNCHANGED <<back, begun, away, moved, unseen, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট (through ParentGate).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<round, hand>>

Next == YouStartARound \/ YouOpenTheLevelList \/ YouCloseTheLevelList \/ YouPickALevel
        \/ YouTapAWrongAnswer \/ YouTapTheRightAnswer \/ YouTapTheCover
        \/ TheGlimpseEnds \/ TheNextPondComes \/ TheEndScreenComes
        \/ WindowBlurs \/ WindowFocuses \/ TheMenuOpens \/ YouResume \/ YouGoBackToTheTitle
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "play", "end"}
          /\ item \in 1..Items /\ pending \in {"none", "next", "end"} /\ looking \in BOOLEAN
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ away \in BOOLEAN
          /\ moved \in BOOLEAN /\ unseen \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen waits for the end of a round: it only shows over a pond that is already finished.
RestOnlyAtBreak == (resting /\ screen = "play") => finished
NoNewRoundPastLimit == begun = "inTime"
\* Every finished round counts: once the last pond is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* The 1.5 s pattern never runs out while you are looking away, under the menu or under the level list.
GlimpseNeverRunsOutUnseen == ~unseen
\* Nothing moves under the pause menu, while away, under the level list or the rest screen.
NothingMovesWhileCovered == ~moved
====
