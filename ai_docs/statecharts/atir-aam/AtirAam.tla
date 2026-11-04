---- MODULE AtirAam ----
\* আঁটি থেকে আম after the rewrite: the screen (title, play, মালির থলে, the end), the player's menu and the window,
\* a finger on the bed, ফেরত নাও, the new-stage celebration (the grow chord, the HUD line, the confetti), the wind loop on
\* gust levels and the saved result. A key held through the end (freshResultKey) is checked in tests/session.test.ts
\* (ResultNeedsFreshPress) rather than here, to keep the chart inside its 500-state budget.
\* Mirrored from tools/atir-aam/components/garden-game.tsx (swipe, undo, pick, finish, the player's onPause/onResume,
\* the blur/focus/visibility listeners, the key handler), tools/atir-aam/lib/session.ts (live, canSwipe, press,
\* syncLoops/wantWind, freshResultKey, cheerOf, newsOf) and tools/atir-aam/lib/rules.ts (move, takeBack, pickOffer).
\* The board is abstracted to its top stage: "small" or "big" (পাকা আম or more, the first stage that sets off confetti).
\* `peak` is the run's biggest stage, which ফেরত নাও never lowers. Swipes are attempted from every state, because a
\* person can swipe any time; the code decides whether they count. The level is a gust level (`gusty`), the one where
\* the wind loop plays; on a calm level wantWind is always false (tests/session.test.ts checks both).
EXTENDS Naturals

VARIABLES screen, away, menu, guard, pressing, gusty, sound, wind, top, peak, prevTop, hasPrev, news, chord, cheers,
          saves, stray
vars == <<screen, away, menu, guard, pressing, gusty, sound, wind, top, peak, prevTop, hasPrev, news, chord, cheers,
          saves, stray>>

Screens == {"title", "play", "choosing", "over"}
\* session.live: the bed takes swipes only on the play screen, nothing over it, the window here.
Live == screen = "play" /\ ~menu /\ ~away
\* session.wantWind: a gust level being played, not paused, away, muted, choosing or over.
Want(sc, aw, me, so, gu) == sc = "play" /\ ~me /\ ~aw /\ so /\ gu
\* The code calls sync() after this event, so the loop matches what the session wants.
Sync(sc, aw, me, so, gu) == wind' = Want(sc, aw, me, so, gu)

Init == /\ screen = "title" /\ away = FALSE /\ menu = FALSE /\ guard = FALSE /\ pressing = FALSE
        /\ gusty = TRUE /\ sound \in BOOLEAN /\ wind = FALSE
        /\ top = "small" /\ peak = "small" /\ prevTop = "small" /\ hasPrev = FALSE
        /\ news = FALSE /\ chord = FALSE /\ cheers = 0 /\ saves = 0 /\ stray = FALSE

Fresh == /\ top' = "small" /\ peak' = "small" /\ prevTop' = "small" /\ hasPrev' = FALSE /\ news' = FALSE /\ chord' = FALSE
         /\ cheers' = 0 /\ saves' = 0 /\ stray' = FALSE /\ pressing' = FALSE

\* The plate on the title (or a level picked from the list, পরের লেভেল, আবার খেলো): begin() runs a fresh plot.
YouStart == /\ screen \in {"title", "over"} /\ ~away /\ ~menu /\ gusty' = gusty
            /\ screen' = "play" /\ Fresh /\ Sync("play", away, menu, sound, gusty')
            /\ UNCHANGED <<away, menu, guard, sound>>

\* A finger lands on the bed: session.press records it only when canSwipe (live, past the resume guard).
YouPress == /\ ~pressing /\ pressing' = (Live /\ ~guard)
            /\ UNCHANGED <<screen, away, menu, guard, gusty, sound, wind, top, peak, prevTop, hasPrev, news, chord, cheers, saves, stray>>
YouLift == /\ pressing /\ pressing' = FALSE
           /\ UNCHANGED <<screen, away, menu, guard, gusty, sound, wind, top, peak, prevTop, hasPrev, news, chord, cheers, saves, stray>>

\* A swipe (a finger travelling 18 px, or an arrow key): swipe() returns unless canSwipe and no offer waits.
\* `stray` records a swipe that moved plates while the bed wasn't live, or in the breath after চালিয়ে যাও.
Counts == Live /\ ~guard
YouSwipe == /\ screen # "title"
            /\ IF Counts
               THEN /\ prevTop' = top /\ hasPrev' = TRUE /\ news' = FALSE
                    /\ UNCHANGED <<top, peak, chord, cheers>>
               ELSE UNCHANGED <<prevTop, hasPrev, news, top, peak, chord, cheers>>
            /\ stray' = (stray \/ (Counts /\ ~(screen = "play" /\ ~menu /\ ~away)))
            /\ pressing' = FALSE /\ Sync(screen, away, menu, sound, gusty)
            /\ UNCHANGED <<screen, away, menu, guard, gusty, sound, saves>>
\* The swipe that grows a পাকা আম. E_PEAK only when the run's peak rises: then the chord (scheduled tones), the HUD
\* line (newsOf), and confetti when cheerOf says it beats the peak (this phone's best is below it here).
YouGrowAMango == /\ Counts /\ top = "small"
                 /\ top' = "big" /\ prevTop' = "small" /\ hasPrev' = TRUE /\ peak' = "big"
                 /\ news' = (peak = "small") /\ chord' = (chord \/ peak = "small")
                 /\ cheers' = IF peak = "small" THEN cheers + 1 ELSE cheers
                 /\ pressing' = FALSE /\ Sync(screen, away, menu, sound, gusty)
                 /\ UNCHANGED <<screen, away, menu, guard, gusty, sound, saves, stray>>
TheChordEnds == /\ chord /\ chord' = FALSE
                /\ UNCHANGED <<screen, away, menu, guard, pressing, gusty, sound, wind, top, peak, prevTop, hasPrev, news, cheers, saves, stray>>

\* ফেরত নাও: takeBack() needs the last board, a take-back left, no offer and no end. undo() then silences scheduled
\* notes (the chord) and settles the scene; the restored game has no `last`, so newsOf is 0.
YouTakeBack == /\ Live /\ hasPrev
               /\ top' = prevTop /\ hasPrev' = FALSE /\ news' = FALSE /\ chord' = FALSE
               /\ Sync(screen, away, menu, sound, gusty)
               /\ UNCHANGED <<screen, away, menu, guard, pressing, gusty, sound, peak, prevTop, cheers, saves, stray>>

\* মালির থলে (the garden): a new stage opens three cards; move() refuses swipes until pickOffer.
AnOfferOpens == /\ Counts /\ screen' = "choosing" /\ news' = FALSE
                /\ Sync("choosing", away, menu, sound, gusty)
                /\ UNCHANGED <<away, menu, guard, pressing, gusty, sound, top, peak, prevTop, hasPrev, chord, cheers, saves, stray>>
YouPickACard == /\ screen = "choosing" /\ ~menu /\ ~away
                /\ screen' = "play" /\ hasPrev' = FALSE
                /\ Sync("play", away, menu, sound, gusty)
                /\ UNCHANGED <<away, menu, guard, pressing, gusty, sound, top, peak, prevTop, news, chord, cheers, saves, stray>>

\* The goal grows, the bed fills, the moves run out, or থামো: finish() records once per game (finished ref).
TheRunEnds == /\ Live
              /\ screen' = "over" /\ saves' = saves + 1 /\ pressing' = FALSE
              /\ Sync("over", away, menu, sound, gusty)
              /\ UNCHANGED <<away, menu, guard, gusty, sound, top, peak, prevTop, hasPrev, news, chord, cheers, stray>>

\* Window blur or a hidden tab: the listeners drop the press and sync; the player then opens its menu (once engaged).
YouGoAway == /\ ~away /\ away' = TRUE /\ pressing' = FALSE /\ menu' = (menu \/ screen # "title") /\ chord' = FALSE
             /\ Sync(screen, TRUE, menu \/ screen # "title", sound, gusty)
             /\ UNCHANGED <<screen, guard, gusty, sound, top, peak, prevTop, hasPrev, news, cheers, saves, stray>>
YouComeBack == /\ away /\ away' = FALSE
               /\ Sync(screen, FALSE, menu, sound, gusty)
               /\ UNCHANGED <<screen, menu, guard, pressing, gusty, sound, top, peak, prevTop, hasPrev, news, chord, cheers, saves, stray>>
\* P, ⏸, Esc, or সব লেভেল: session.pause drops the press; the player's pause cuts scheduled notes.
YouOpenTheMenu == /\ ~menu /\ screen # "title" /\ menu' = TRUE /\ pressing' = FALSE /\ chord' = FALSE
                  /\ Sync(screen, away, TRUE, sound, gusty)
                  /\ UNCHANGED <<screen, away, guard, gusty, sound, top, peak, prevTop, hasPrev, news, cheers, saves, stray>>
\* চালিয়ে যাও: session.resume starts the 250 ms breath.
YouResume == /\ menu /\ ~away /\ menu' = FALSE /\ guard' = TRUE /\ pressing' = FALSE
             /\ Sync(screen, away, FALSE, sound, gusty)
             /\ UNCHANGED <<screen, away, gusty, sound, top, peak, prevTop, hasPrev, news, chord, cheers, saves, stray>>
TheBreathPasses == /\ guard /\ guard' = FALSE
                   /\ UNCHANGED <<screen, away, menu, pressing, gusty, sound, wind, top, peak, prevTop, hasPrev, news, chord, cheers, saves, stray>>
\* The site-wide switch: off stops every loop in the kit and silences notes; the effect then syncs.
YouSwitchSound == /\ sound' = ~sound /\ chord' = (chord /\ ~sound)
                  /\ Sync(screen, away, menu, ~sound, gusty)
                  /\ UNCHANGED <<screen, away, menu, guard, pressing, gusty, top, peak, prevTop, hasPrev, news, cheers, saves, stray>>

Next == YouStart \/ YouPress \/ YouLift \/ YouSwipe \/ YouGrowAMango \/ TheChordEnds \/ YouTakeBack \/ AnOfferOpens
        \/ YouPickACard \/ TheRunEnds \/ YouGoAway \/ YouComeBack
        \/ YouOpenTheMenu \/ YouResume \/ TheBreathPasses \/ YouSwitchSound

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ cheers \in 0..2 /\ saves \in 0..2 /\ top \in {"small", "big"} /\ peak \in {"small", "big"}

\* ---- the reader's rules ----
\* The পাকা আম confetti comes once a run, however often you take it back and grow it again.
CheerOncePerRun == cheers <= 1
\* The new-stage line and the grow chord only celebrate a stage that's on the board.
CelebrationMatchesBoard == (news \/ chord) => top = "big"
\* A run is saved once.
NoDoubleResult == saves <= 1
\* Away or under the menu, no finger counts as on the bed.
InputReleasedWhenAway == (away \/ menu) => ~pressing
\* No swipe moves the plates while away, under the menu, choosing, or in the breath after চালিয়ে যাও.
NothingMovesWhenItShouldnt == ~stray
\* The wind blows only while a gust level is played with sound on, and then it always blows.
WindOnlyWhenMeaningful == wind => Want(screen, away, menu, sound, gusty)
WindComesBack == Want(screen, away, menu, sound, gusty) => wind
\* While মালির থলে is open, nothing in the garden moves.
ChoiceFreezesPlay == screen = "choosing" => ~Live
====
