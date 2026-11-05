---- MODULE KiHobe ----
\* কী হবে বলো তো?, after the rewrite (branch games-to-the-bar). The code it mirrors:
\*   tools/ki-hobe/lib/round.ts     (predict, watched, replay, advance: guess -> watch -> answer -> next)
\*   tools/ki-hobe/lib/session.ts   (screens, begin, tapCounts + swallow, running, experimentEnds, settleWaiting, won, toEnd, leave/back)
\*   tools/ki-hobe/lib/finish.ts    (the stars, today's card and the daily-limit check, once, at the LAST GUESS)
\*   tools/ki-hobe/components/game.tsx and art.tsx (the experiment is CSS: data-run="paused" while away or a menu is up; its clock is a
\*                                   CSS animation, so it stops with the scene; sounds fire from animation start events, immediate tones)
\*   shared/game-sound.ts           (setSoundOn(false) now runs silenceScheduled(); the player's pause does too)
\*   shared/kids-kit.tsx            (RestScreen is a real modal; ParentGate closes itself after one action)
\* A round is `Questions` experiments here (2 for the full check, 1 for the chart; the code has 3-4). The experiment always ends by itself, in the same screen as the guess.
EXTENDS Naturals

CONSTANT MaxPlays, Questions
VARIABLES screen, q, away, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored
vars == <<screen, q, away, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

Play == {"guess", "watch", "answer"}
Screens == {"title"} \cup Play \cup {"end"}
\* The rest screen covers the stage at a break only (session.restShows).
RestUp == resting /\ screen \in {"title", "end"}
\* Nobody is looking at the experiment: the window is away (blur or hidden tab) or the player's menu is up.
Frozen == away \/ menu
\* A child's tap or key counts only with the page free: not in the ShowParent card, not behind the rest screen, nobody away, no menu.
Free == ~show /\ ~RestUp /\ ~Frozen

Init == /\ screen = "title" /\ q = 1 /\ away = FALSE /\ menu = FALSE /\ swallow = FALSE /\ waiting = FALSE
        /\ sound = TRUE /\ pending = FALSE /\ late = FALSE /\ resting = FALSE /\ show = FALSE /\ gate = FALSE /\ holder = "child"
        /\ plays = 0 /\ endStars = 0 /\ recorded = 0 /\ sent = FALSE /\ stored = {}

Same(v) == UNCHANGED v

\* begin(): atBreak() first. Past today's limit the round does not start and the rest screen shows instead.
YouTapPlay == /\ screen \in {"title", "end"} /\ Free
              /\ IF late THEN resting' = TRUE /\ screen' = screen /\ q' = q /\ recorded' = recorded /\ swallow' = swallow /\ waiting' = waiting
                 ELSE screen' = "guess" /\ q' = 1 /\ recorded' = 0 /\ swallow' = FALSE /\ waiting' = FALSE /\ resting' = resting
              /\ UNCHANGED <<away, menu, sound, pending, late, show, gate, holder, plays, endStars, sent, stored>>

\* predict() on the first finger's touch. The last experiment's guess wins the round: finishRound() saves the stars and atBreak() runs at this tap.
YouGuess == /\ screen = "guess" /\ Free /\ ~swallow
            /\ screen' = "watch"
            /\ IF q = Questions THEN /\ recorded' = recorded + 1 /\ plays' = (IF plays < MaxPlays THEN plays + 1 ELSE plays)
                             /\ endStars' = (IF plays < MaxPlays THEN plays + 1 ELSE plays) /\ resting' = late
                        ELSE UNCHANGED <<recorded, plays, endStars, resting>>
            /\ UNCHANGED <<q, away, menu, swallow, waiting, sound, pending, late, show, gate, holder, sent, stored>>

\* The first tap after looking away only wakes the game.
YouTapAndOnlyWake == /\ screen \in Play /\ Free /\ swallow /\ swallow' = FALSE
                     /\ UNCHANGED <<screen, q, away, menu, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* An animation with data-snd starts: a tone() goes out at once, but only while the scene runs (CSS paused otherwise).
AnAnimationStartsASound == /\ screen = "watch" /\ ~Frozen /\ sound /\ ~pending /\ pending' = TRUE
                           /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
TheSoundPlays == /\ pending /\ pending' = FALSE
                 /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* The CSS clock ends. experimentEnds() shows the answer; if the child is away (or a menu is up) it only notes `waiting`.
TheExperimentEnds == /\ screen = "watch" /\ ~Frozen /\ screen' = "answer"
                     /\ UNCHANGED <<q, away, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
TheClockFiresAway == /\ screen = "watch" /\ Frozen /\ ~waiting /\ waiting' = TRUE
                     /\ UNCHANGED <<screen, q, away, menu, swallow, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
\* settleWaiting(): back (or the menu closed), the answer shows now.
TheAnswerShowsOnReturn == /\ screen = "watch" /\ waiting /\ ~Frozen /\ screen' = "answer" /\ waiting' = FALSE
                          /\ UNCHANGED <<q, away, menu, swallow, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* আবার দেখো: replay(): the same experiment again. It records nothing.
YouTapSeeAgain == /\ screen = "answer" /\ Free /\ ~swallow /\ screen' = "watch"
                  /\ UNCHANGED <<q, away, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
\* → : advance(), or toEnd() on the last answer (only once the round was recorded). toEnd() calls atBreak() at once, so a limit that
\* ran out during the last experiment shows the rest screen on the end screen.
YouTapNext == /\ screen = "answer" /\ Free /\ ~swallow
              /\ IF q < Questions THEN screen' = "guess" /\ q' = q + 1 /\ resting' = resting
                 ELSE recorded = 1 /\ screen' = "end" /\ q' = q /\ resting' = late
              /\ UNCHANGED <<away, menu, swallow, waiting, sound, pending, late, show, gate, holder, plays, endStars, recorded, sent, stored>>
\* শেষ, and সব লেভেল from the title or the end screen: back to a title. Nothing starts by itself.
YouTapDone == /\ screen = "end" /\ Free /\ screen' = "title"
              /\ UNCHANGED <<q, away, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* The player's menu (⏸, P, Escape): onPause/onResume. The first tap after resuming belongs to the menu (resume() clears swallow).
PlayerOpensTheMenu == /\ screen \in Play /\ ~menu /\ ~show /\ menu' = TRUE
                      /\ UNCHANGED <<screen, q, away, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
YouTapResume == /\ menu /\ ~away /\ menu' = FALSE /\ swallow' = FALSE
                /\ UNCHANGED <<screen, q, away, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
\* সব লেভেল / নতুন করে শুরু from the menu: the round is left unrecorded (it may already be, if the last guess was made).
YouLeaveFromTheMenu == /\ menu /\ screen \in Play /\ ~away /\ menu' = FALSE /\ screen' = "title" /\ swallow' = FALSE /\ waiting' = FALSE
                       /\ UNCHANGED <<q, away, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* blur or hide: the player opens its menu, and the game's own leave() flags the next tap.
YouLookAway == /\ ~away /\ away' = TRUE /\ swallow' = (screen \in Play)
               /\ UNCHANGED <<screen, q, menu, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<screen, q, menu, swallow, waiting, sound, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* SoundToggle -> setSoundOn(false) -> stopLoops() and silenceScheduled(): nothing is left waiting.
SoundOff == /\ sound /\ sound' = FALSE /\ pending' = FALSE
            /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, pending, late, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>

TodaysTimeRunsOut == /\ ~late /\ late' = TRUE
                     /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, resting, show, gate, holder, plays, endStars, recorded, sent, stored>>
\* The 1-second check on the title and end screens (never in a round).
TheBreakCheck == /\ screen \in {"title", "end"} /\ late /\ ~resting /\ resting' = TRUE
                 /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, late, show, gate, holder, plays, endStars, recorded, sent, stored>>
ParentGivesTenMore == /\ RestUp /\ resting' = FALSE /\ late' = FALSE
                      /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, show, gate, holder, plays, endStars, recorded, sent, stored>>

\* আব্বু-আম্মুকে দেখাও: the card. The tool's link sits behind ParentGate inside it, and the card is a modal over the game.
YouTapShowParent == /\ screen = "end" /\ Free /\ show' = TRUE
                    /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, late, resting, gate, holder, plays, endStars, recorded, sent, stored>>
ParentOpensTheGate == /\ show /\ ~gate /\ gate' = TRUE /\ holder' = "parent"
                      /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, late, resting, show, plays, endStars, recorded, sent, stored>>
\* One grown-up action, the 20 s timeout or leaving the page: the gate shuts and the phone is the child's again.
TheGateShuts == /\ gate /\ gate' = FALSE /\ holder' = "child"
                /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, late, resting, show, plays, endStars, recorded, sent, stored>>
YouCloseTheCard == /\ show /\ show' = FALSE /\ gate' = FALSE /\ holder' = "child"
                   /\ UNCHANGED <<screen, q, away, menu, swallow, waiting, sound, pending, late, resting, plays, endStars, recorded, sent, stored>>

Next == YouTapPlay \/ YouGuess \/ YouTapAndOnlyWake \/ AnAnimationStartsASound \/ TheSoundPlays \/ TheExperimentEnds \/ TheClockFiresAway
        \/ TheAnswerShowsOnReturn \/ YouTapSeeAgain \/ YouTapNext \/ YouTapDone \/ PlayerOpensTheMenu \/ YouTapResume \/ YouLeaveFromTheMenu
        \/ YouLookAway \/ YouComeBack \/ SoundOff \/ SoundOn \/ TodaysTimeRunsOut \/ TheBreakCheck \/ ParentGivesTenMore
        \/ YouTapShowParent \/ ParentOpensTheGate \/ TheGateShuts \/ YouCloseTheCard

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ q \in 1..Questions /\ away \in BOOLEAN /\ menu \in BOOLEAN /\ swallow \in BOOLEAN /\ waiting \in BOOLEAN
          /\ sound \in BOOLEAN /\ pending \in BOOLEAN /\ late \in BOOLEAN /\ resting \in BOOLEAN /\ show \in BOOLEAN /\ gate \in BOOLEAN
          /\ holder \in {"child", "parent"} /\ plays \in 0..MaxPlays /\ endStars \in 0..MaxPlays /\ recorded \in 0..2
          /\ sent \in BOOLEAN /\ stored \subseteq {"progress", "name", "photo"}

\* The choices on each screen and whether each carries a picture (from the JSX): the title's pond, three world tiles and the level chip
\* (each with its picture); a guess's pictures; the answer's ⟳ eye and → arrow and the ? fold; the end's ⟳ and closed-book buttons and the show-parents icon.
Choices(s) ==
  IF s = "title" THEN {[c |-> "the pond", pic |-> TRUE], [c |-> "a world", pic |-> TRUE], [c |-> "the level chip", pic |-> TRUE]}
  ELSE IF s = "guess" THEN {[c |-> "a guess with its picture", pic |-> TRUE]}
  ELSE IF s = "watch" THEN {}
  ELSE IF s = "answer" THEN {[c |-> "আবার দেখো (an eye)", pic |-> TRUE], [c |-> "→", pic |-> TRUE], [c |-> "কেন? (a ?)", pic |-> TRUE]}
  ELSE {[c |-> "আবার খেলো (an arrow)", pic |-> TRUE], [c |-> "শেষ (a book)", pic |-> TRUE], [c |-> "আব্বু-আম্মুকে দেখাও (two figures)", pic |-> TRUE]}

\* ---- The reader's rules ----
\* The experiment doesn't run its course while you're away or a menu is up.
NoProgressWhileAway == [][(screen = "watch" /\ screen' = "answer") => ~Frozen']_vars
\* With sound off, nothing plays: no note is left waiting.
SilentWhenMuted == pending => sound
\* A round is recorded once.
NoDoubleResult == recorded <= 1
\* The rest screen appears only between rounds, and nothing behind it moves.
RestOnlyAtBreak == RestUp => screen \in {"title", "end"}
BehindRestNothingMoves == [][RestUp => (screen' = screen /\ q' = q /\ recorded' = recorded)]_vars
NoNewRoundPastLimit == [][(screen \in {"title", "end"} /\ screen' = "guess") => (~late /\ ~RestUp)]_vars
\* At the last guess the limit is checked: if today's time is up, the rest screen is waiting at the end screen.
RestAtTheBreak == [][(screen # "end" /\ screen' = "end" /\ late) => resting']_vars
\* A won round is recorded (stars saved) before the end screen can show, and the stars shown are the stars saved.
WonIsRecorded == screen = "end" => recorded = 1
ResultMatchesPlay == screen = "end" => endStars = plays
StarsNeverDrop == [][plays' >= plays]_vars
\* The tap that brings you back is not a move.
FirstTapBackIsNotAMove == [][(swallow /\ screen # screen') => (screen = "watch" /\ screen' = "answer") \/ (screen \in Play /\ screen' = "title")]_vars
\* The share link is only inside the ShowParent card, behind the gate, with a grown-up holding the phone.
ParentGate == gate => (holder = "parent" /\ show)
NoNetwork == ~sent
NoChildData == stored \subseteq {"progress"}
NoReadingNeeded == \A ch \in Choices(screen) : ch.pic
====
