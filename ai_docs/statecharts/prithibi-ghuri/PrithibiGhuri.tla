---- MODULE PrithibiGhuri ----
\* পৃথিবী ঘুরি (ছোটদের জন্য, ৬–১২) after the rewrite: the screens, one trip (map → plane → postcards → stamp question →
\* ➜), the player's pause, going away and coming back, and the kids' daily limit with its rest screen. Two more parts keep
\* each chart readable: PrithibiGhuriKeys.tla (a key held on a postcard) and PrithibiGhuriList.tla (the level list that
\* opens over a trip); the parent gates are PrithibiGhuriGates.tla. Mirrored from:
\*   tools/prithibi-ghuri/lib/session.ts       begin, tap, solved, advance, pause, resume, blur, focus, toTitle, frozen
\*   tools/prithibi-ghuri/lib/trip.ts          fly, land, nextCard, answer, advance (phases map / fly / card / ask)
\*   tools/prithibi-ghuri/components/game.tsx  begin() asks kids.atBreak(); pick() records the stars at the last right tap;
\*                                              the plane is a Web Animation that the game pauses while frozen
\*   shared/kids-kit.tsx                       useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two postcards stand for five, two stops for three. No voice anywhere on the site, so there is no sound rule to check.
EXTENDS Naturals
CONSTANTS StartIgnoresLimit, FlightIgnoresPause, NextRunsUnderTheMenu   \* the old behaviours: all FALSE in the fixed code
VARIABLES screen, phase, card, visited, answered, flight,   \* the trip
          finished, recorded, begun,                        \* stars and the limit's check
          paused, away, swallow, moved, flewAway,           \* away and back
          overLimit, resting                                \* the daily limit
trip == <<phase, card, visited, answered, flight>>
stars == <<finished, recorded, begun>>
hand == <<paused, away, swallow, moved, flewAway>>
kids == <<overLimit, resting>>
vars == <<screen, trip, stars, hand, kids>>

RestShows == resting /\ screen # "play"
Frozen == paused \/ away \/ screen # "play"
Free == ~RestShows /\ ~paused
Taps == screen = "play" /\ Free /\ ~away

Init == /\ screen = "title" /\ phase = "map" /\ card = 0 /\ visited = 0 /\ answered = FALSE /\ flight = 0
        /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ paused = FALSE /\ away = FALSE /\ swallow = FALSE /\ moved = FALSE /\ flewAway = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

FreshTrip == /\ phase' = "map" /\ card' = 0 /\ visited' = 0 /\ answered' = FALSE /\ flight' = 0 /\ screen' = "play" /\ finished' = FALSE /\ recorded' = FALSE

\* begin(): উড়াল দাও on the envelope, আবার খেলো. atBreak() first: past the limit, the rest screen instead.
YouStartATrip == /\ screen \in {"title", "end"} /\ Free
                 /\ IF overLimit /\ ~StartIgnoresLimit
                    THEN /\ resting' = TRUE /\ begun' = begun /\ UNCHANGED <<screen, phase, card, visited, answered, flight, finished, recorded>>
                    ELSE /\ FreshTrip /\ resting' = FALSE /\ begun' = (IF overLimit THEN "late" ELSE "inTime")
                 /\ swallow' = FALSE
                 /\ UNCHANGED <<paused, away, moved, flewAway, overLimit>>

\* fly(): a pin or a destination button, only from the map; the first tap after coming back only wakes the game.
YouTapAPin == /\ phase = "map" /\ Taps
              /\ IF swallow THEN swallow' = FALSE /\ UNCHANGED <<phase, flight>> ELSE phase' = "fly" /\ flight' = 0 /\ UNCHANGED swallow
              /\ UNCHANGED <<screen, card, visited, answered, stars, paused, away, moved, flewAway, kids>>
\* The plane is a Web Animation the game pauses while Frozen: it flies on only when nothing holds it.
ThePlaneFlies == /\ phase = "fly" /\ flight < 1 /\ ~Frozen /\ flight' = flight + 1
                 /\ UNCHANGED <<screen, phase, card, visited, answered, stars, hand, kids>>
ThePlaneLands == /\ phase = "fly" /\ flight = 1 /\ ~Frozen
                 /\ phase' = "card" /\ card' = 0 /\ visited' = visited + 1
                 /\ UNCHANGED <<screen, answered, flight, stars, hand, kids>>
\* OLD bug: the plane kept flying under the menu or while the window was blurred (the old rAF flight did not pause).
ThePlaneFliesUnderTheMenu == /\ FlightIgnoresPause /\ phase = "fly" /\ flight < 1 /\ Frozen /\ flight' = flight + 1 /\ flewAway' = TRUE
                             /\ UNCHANGED <<screen, phase, card, visited, answered, stars, paused, away, swallow, moved, kids>>

\* turn(): ➜ on a postcard.
YouTapNextOnACard == /\ phase = "card" /\ Taps
                     /\ IF swallow THEN swallow' = FALSE /\ UNCHANGED <<card, phase>>
                        ELSE (IF card < 1 THEN card' = card + 1 /\ phase' = "card" ELSE card' = card /\ phase' = "ask") /\ UNCHANGED swallow
                     /\ UNCHANGED <<screen, visited, answered, flight, stars, paused, away, moved, flewAway, kids>>

\* answer(): a wrong picture; the right picture (solved()). On the very last question the stars are saved and atBreak()
\* runs in this tap.
YouTapAWrongPicture == /\ phase = "ask" /\ Taps /\ ~answered
                       /\ IF swallow THEN swallow' = FALSE ELSE UNCHANGED swallow
                       /\ UNCHANGED <<screen, trip, stars, paused, away, moved, flewAway, kids>>
YouTapTheRightPicture == /\ phase = "ask" /\ Taps /\ ~answered
                         /\ IF swallow
                            THEN /\ swallow' = FALSE /\ UNCHANGED <<answered, finished, recorded, resting>>
                            ELSE /\ answered' = TRUE /\ finished' = (visited = 2) /\ recorded' = (visited = 2)
                                 /\ resting' = (IF visited = 2 THEN overLimit ELSE resting) /\ UNCHANGED swallow
                         /\ UNCHANGED <<screen, phase, card, visited, flight, begun, paused, away, moved, flewAway, overLimit>>
\* advance(): ➜ after a right answer: the map for the next stop, or after the last the end screen. Never under the menu.
YouTapNext == /\ phase = "ask" /\ answered /\ (NextRunsUnderTheMenu \/ ~paused) /\ ~RestShows /\ ~away
              /\ answered' = FALSE /\ moved' = (moved \/ paused)
              /\ IF visited = 2 THEN screen' = "end" /\ UNCHANGED <<phase, card, flight>> ELSE phase' = "map" /\ card' = 0 /\ flight' = 0 /\ UNCHANGED screen
              /\ UNCHANGED <<visited, stars, paused, away, swallow, flewAway, kids>>

\* The player's menu: ⏸, P, Escape; and blur or hide.
YouOpenThePauseMenu == /\ ~paused /\ paused' = TRUE /\ swallow' = (screen = "play")
                       /\ UNCHANGED <<screen, trip, stars, away, moved, flewAway, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<screen, trip, stars, away, moved, flewAway, kids>>
WindowBlurs == /\ ~away /\ away' = TRUE /\ swallow' = (screen = "play")
               /\ UNCHANGED <<screen, trip, stars, paused, moved, flewAway, kids>>
WindowFocuses == /\ away /\ away' = FALSE /\ UNCHANGED <<screen, trip, stars, paused, swallow, moved, flewAway, kids>>
\* নতুন করে শুরু from the menu, or শেষ on the end screen: back to the title.
YouGoBackToTheTitle == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "title" /\ answered' = FALSE /\ paused' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<phase, card, visited, flight, stars, away, moved, flewAway, kids>>

TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE /\ UNCHANGED <<screen, trip, stars, hand, resting>>
\* A reload, or opening the game from the kids' hub: the envelope, resting if past the limit.
ThePageOpens == /\ FreshTrip /\ screen' = "title" /\ paused' = FALSE /\ away' = FALSE /\ swallow' = FALSE
                /\ resting' = overLimit /\ UNCHANGED <<begun, moved, flewAway, overLimit>>
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<screen, trip, stars, hand>>

Next == YouStartATrip \/ YouTapAPin \/ ThePlaneFlies \/ ThePlaneLands \/ ThePlaneFliesUnderTheMenu \/ YouTapNextOnACard
        \/ YouTapAWrongPicture \/ YouTapTheRightPicture \/ YouTapNext
        \/ YouOpenThePauseMenu \/ YouResume \/ WindowBlurs \/ WindowFocuses \/ YouGoBackToTheTitle
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end"} /\ phase \in {"map", "fly", "card", "ask"}
          /\ card \in 0..1 /\ visited \in 0..2 /\ answered \in BOOLEAN /\ flight \in 0..1
          /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ swallow \in BOOLEAN /\ moved \in BOOLEAN /\ flewAway \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* The rest screen comes only between trips, never over a flight, a postcard or a question.
RestOnlyAtBreak == RestShows => screen # "play"
\* Bug 2: once today's time is up, no new trip starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished trip counts: once the last question is right, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => recorded
\* Nothing moves on under the pause menu: ➜ does nothing there.
NothingMovesUnderTheMenu == ~moved
\* The plane holds in the air while the menu is open, the window is away, or a list is over the trip.
NothingFliesWhileAway == ~flewAway
====
