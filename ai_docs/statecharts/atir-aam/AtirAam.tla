---- MODULE AtirAam ----
\* আঁটি থেকে আম: a run (ready, playing, paused, over), the one-step ফেরত নাও (undo), the পাকা আম celebration
\* (the stage toast, the 200 ms confetti and levelUp timer), tab hiding, and the once-per-run save.
\* Mirrored from tools/atir-aam/components/mango-game.tsx (go, takeBack, begin, stopHere, the [game] end effect,
\* the visibilitychange effect, the keyboard handler) and tools/atir-aam/lib/game.ts (move).
\* The board is abstracted to its top stage: "small" (below পাকা আম) or "big" (পাকা আম, TOP − 2, the first stage
\* that sets off confetti while it beats this phone's best stage). Turn-based: nothing moves unless you swipe, so
\* window focus and held input aren't modelled (a press is read only on pointerup, and every pointerdown replaces it).
EXTENDS Naturals

VARIABLES phase, visible, top, undo, toast, cheerDue, cheers, saves
vars == <<phase, visible, top, undo, toast, cheerDue, cheers, saves>>

Phases == {"ready", "playing", "paused", "over"}
Live == phase \in {"ready", "playing"}     \* go() and takeBack() run: not paused, not over
Keep(vs) == UNCHANGED vs

Init == /\ phase = "ready" /\ visible = TRUE /\ top = "small" /\ undo = "none"
        /\ toast = FALSE /\ cheerDue = FALSE /\ cheers = 0 /\ saves = 0

\* go(): a swipe that moves but grows no new top stage. setUndo(current).
YouSwipe == /\ visible /\ Live
            /\ phase' = "playing" /\ undo' = top
            /\ Keep(<<visible, top, toast, cheerDue, cheers, saves>>)
\* go(): the swipe that grows পাকা আম. next.top > current.top → the toast (fades after 1.7 s);
\* next.top > bestStage and ≥ TOP − 2 → later(200, levelUp + confetti). bestStage is only saved when the run ends.
YouGrowAMango == /\ visible /\ Live /\ top = "small"
                 /\ phase' = "playing" /\ top' = "big" /\ undo' = "small"
                 /\ toast' = TRUE /\ cheerDue' = TRUE
                 /\ Keep(<<visible, cheers, saves>>)
\* The 200 ms timer: sfx.levelUp() and confetti().
TheConfettiFalls == /\ cheerDue /\ cheerDue' = FALSE /\ cheers' = IF cheers < 2 THEN cheers + 1 ELSE 2
                    /\ Keep(<<phase, visible, top, undo, toast, saves>>)
TheToastFades == /\ toast /\ toast' = FALSE /\ Keep(<<phase, visible, top, undo, cheerDue, cheers, saves>>)
\* takeBack(): setGame(undo), setUndo(null). No clearTimers(), the toast stays.
YouTakeItBack == /\ visible /\ phase = "playing" /\ undo # "none"
                 /\ top' = undo /\ undo' = "none"
                 /\ Keep(<<phase, visible, toast, cheerDue, cheers, saves>>)
\* move() sets over (no move left, the level's goal or move limit), or এখানেই থামো. The [game] effect saves once
\* per Game object (finished.current) in the same commit.
TheRunEnds == /\ visible /\ phase = "playing"
              /\ phase' = "over" /\ saves' = saves + 1
              /\ Keep(<<visible, top, undo, toast, cheerDue, cheers>>)
\* begin(): আরেকবার, আবার খেলো, পরের লেভেল, the mode buttons, the level arrows or list, a friend's link.
\* clearTimers(), a fresh plot.
YouStartAnew == /\ visible
                /\ phase' = "ready" /\ top' = "small" /\ undo' = "none" /\ toast' = FALSE /\ cheerDue' = FALSE
                /\ cheers' = 0 /\ saves' = 0
                /\ Keep(<<visible>>)
\* visibilitychange → hidden: pause once a move is made and the run isn't over.
TabHides == /\ visible /\ visible' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ Keep(<<top, undo, toast, cheerDue, cheers, saves>>)
TabShows == /\ ~visible /\ visible' = TRUE /\ Keep(<<phase, top, undo, toast, cheerDue, cheers, saves>>)
\* চালিয়ে যাও or Enter.
YouResume == /\ visible /\ phase = "paused" /\ phase' = "playing"
             /\ Keep(<<visible, top, undo, toast, cheerDue, cheers, saves>>)

Next == YouSwipe \/ YouGrowAMango \/ TheConfettiFalls \/ TheToastFades \/ YouTakeItBack \/ TheRunEnds
        \/ YouStartAnew \/ TabHides \/ TabShows \/ YouResume

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ visible \in BOOLEAN /\ top \in {"small", "big"} /\ undo \in {"none", "small", "big"}
          /\ toast \in BOOLEAN /\ cheerDue \in BOOLEAN /\ cheers \in 0..2 /\ saves \in 0..2

\* ---- the reader's rules ----
\* Hiding the tab mid-run pauses it.
PausedWhenHidden == (~visible /\ phase # "over") => phase # "playing"
\* The পাকা আম confetti comes once a run.
CheerOncePerRun == cheers + (IF cheerDue THEN 1 ELSE 0) <= 1
\* The "new stage" banner and the confetti only celebrate a stage that's on the board.
CelebrationMatchesBoard == (toast \/ cheerDue) => top = "big"
\* A run is saved once.
NoDoubleResult == saves <= 1
====
