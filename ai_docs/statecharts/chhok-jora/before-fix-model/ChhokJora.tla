---- MODULE ChhokJora ----
\* ছক-জোড়া: the quilt (dots and boxes against a bot), its hidden-tab pause, the finger on the cloth, the bot's timer,
\* the end-of-game cheer timer, the Enter key on the result, and the কাটাকুটি side game with its own bot.
\* Mirrored from tools/chhok-jora/components/quilt-game.tsx (stitch, fresh, the bot effect, the finished effect,
\* the hide handler, keyHandler, onPointerDown/Up/Cancel, the mode buttons) and
\* tools/chhok-jora/components/katakuti-game.tsx (play, the bot effect, again).
\* Abstractions: one box left to win on the quilt (a stitch closes it or passes the turn), a কাটাকুটি round is
\* "your turn / the bot's turn / over". Two-player quilt, undo, the best score and কাটাকুটি stars are left out
\* (no state-machine change). No sound loops: only one-shot sounds.
EXTENDS Naturals
VARIABLES mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, beat, wiped, kturn
vars == <<mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, beat, wiped, kturn>>

Over == left = 0
CanPlay == mode = "quilt" /\ ~Over /\ ~paused /\ turn = "you"
\* fresh(): a new quilt; it does not clear the cheer timer or the finger.
Fresh == /\ left' = 1 /\ turn' = "you" /\ started' = FALSE /\ paused' = FALSE /\ ghost' = FALSE
         /\ recorded' = 0 /\ beat' = FALSE /\ wiped' = (wiped \/ beat)

Init == /\ mode = "quilt" /\ left = 1 /\ turn = "you" /\ started = FALSE /\ paused = FALSE /\ visible = TRUE
        /\ held = "no" /\ ghost = FALSE /\ cheer = FALSE /\ recorded = 0 /\ beat = FALSE /\ wiped = FALSE /\ kturn = "you"

\* play(): a stitch closes the last box (the end: the finished effect records the best once, queues the cheer
\* in a bare setTimeout, and the result shows) or passes the turn.
Sew(who) == /\ started' = TRUE
            /\ \/ /\ left' = 0 /\ turn' = turn /\ recorded' = recorded + 1 /\ cheer' = TRUE /\ beat' = TRUE
               \/ /\ left' = left /\ turn' = (IF who = "you" THEN "bot" ELSE "you") /\ UNCHANGED <<recorded, cheer, beat>>

\* held: "no", "yes" (pointer.current is this finger), or "stale" (pointer.current still names a finger
\* that went away while the tab was hidden; its pointerup never comes, and a later touch has a new id).
\* onPointerDown on the cloth: pointer.current takes the new finger and the ghost stitch shows under it.
YouTouchTheCloth == /\ visible /\ CanPlay /\ held # "yes" /\ held' = "yes" /\ ghost' = TRUE
                    /\ UNCHANGED <<mode, left, turn, started, paused, visible, cheer, recorded, beat, wiped, kturn>>
\* onPointerUp with the same pointer: the ghost goes and stitch() sews if play is allowed.
YouLiftYourFinger == /\ visible /\ held = "yes" /\ held' = "no" /\ ghost' = FALSE
                     /\ IF CanPlay THEN Sew("you") ELSE UNCHANGED <<left, turn, started, recorded, cheer, beat>>
                     /\ UNCHANGED <<mode, paused, visible, wiped, kturn>>
\* Arrow keys and Enter: Enter on a chosen gap sews it.
YouPressEnterOnAGap == /\ visible /\ held # "yes" /\ CanPlay /\ Sew("you")
                       /\ UNCHANGED <<mode, paused, visible, held, ghost, wiped, kturn>>
\* onPointerCancel.
TheTouchIsCancelled == /\ held = "yes" /\ held' = "no" /\ ghost' = FALSE
                       /\ UNCHANGED <<mode, left, turn, started, paused, visible, cheer, recorded, beat, wiped, kturn>>
\* The bot effect: on its turn and not paused, it sews after a beat. It does not look at which game is on screen.
TheBotSews == /\ turn = "bot" /\ ~Over /\ ~paused /\ Sew("bot")
              /\ UNCHANGED <<mode, paused, visible, held, ghost, wiped, kturn>>
\* The hide handler: pause a quilt in play. Nothing releases the finger.
TabHides == /\ visible /\ visible' = FALSE /\ paused' = (paused \/ (started /\ ~Over))
            /\ held' = (IF held = "yes" THEN "stale" ELSE held)
            /\ UNCHANGED <<mode, left, turn, started, ghost, cheer, recorded, beat, wiped, kturn>>
TabShows == /\ ~visible /\ visible' = TRUE
            /\ UNCHANGED <<mode, left, turn, started, paused, held, ghost, cheer, recorded, beat, wiped, kturn>>
\* চালিয়ে যাও (a new tap, or Space): unpauses; the old ghost is still set.
YouResume == /\ visible /\ held # "yes" /\ mode = "quilt" /\ paused /\ paused' = FALSE
             /\ UNCHANGED <<mode, left, turn, started, visible, held, ghost, cheer, recorded, beat, wiped, kturn>>
\* The finished effect's bare setTimeout(…, 450): sfx.win and confetti, or the lose sound.
TheCheerPlays == /\ cheer /\ cheer' = FALSE
                 /\ UNCHANGED <<mode, left, turn, started, paused, visible, held, ghost, recorded, beat, wiped, kturn>>
\* The result has been on screen for a moment.
TheMomentPasses == /\ beat /\ beat' = FALSE
                   /\ UNCHANGED <<mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, wiped, kturn>>
\* আরেকবার, or Enter / Space on the result (keyHandler: phase "over" → fresh(level)), with no guard.
YouStartANewQuilt == /\ visible /\ held # "yes" /\ mode = "quilt" /\ Over /\ Fresh
                     /\ UNCHANGED <<mode, visible, held, cheer, kturn>>
\* A mode button (সহজ বট / কঠিন বট / দুজনে) or নতুন খেলা mid-game.
YouPickAQuiltMode == /\ visible /\ held # "yes" /\ (mode = "kata" \/ started) /\ ~Over /\ mode' = "quilt" /\ Fresh
                     /\ UNCHANGED <<visible, held, cheer, kturn>>
\* The কাটাকুটি button: the quilt stays mounted underneath, not paused; a fresh round starts (you open it).
YouOpenKatakuti == /\ visible /\ held # "yes" /\ mode = "quilt" /\ mode' = "kata" /\ paused' = FALSE /\ kturn' = "you" /\ ghost' = FALSE
                   /\ UNCHANGED <<left, turn, started, visible, held, cheer, recorded, beat, wiped>>
\* কাটাকুটি: your mark, the bot's mark after 480 ms (no pause, no visibility check), আরেক দান.
YouMarkACell == /\ visible /\ mode = "kata" /\ kturn = "you" /\ kturn' \in {"bot", "over"}
                /\ UNCHANGED <<mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, beat, wiped>>
TheKatakutiBotMarks == /\ mode = "kata" /\ kturn = "bot" /\ kturn' \in {"you", "over"}
                       /\ UNCHANGED <<mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, beat, wiped>>
YouPlayAnotherRound == /\ visible /\ mode = "kata" /\ kturn = "over" /\ kturn' \in {"you", "bot"}
                       /\ UNCHANGED <<mode, left, turn, started, paused, visible, held, ghost, cheer, recorded, beat, wiped>>

Next == YouTouchTheCloth \/ YouLiftYourFinger \/ YouPressEnterOnAGap \/ TheTouchIsCancelled \/ TheBotSews
        \/ TabHides \/ TabShows \/ YouResume \/ TheCheerPlays \/ TheMomentPasses \/ YouStartANewQuilt
        \/ YouPickAQuiltMode \/ YouOpenKatakuti \/ YouMarkACell \/ TheKatakutiBotMarks \/ YouPlayAnotherRound

Spec == Init /\ [][Next]_vars

TypeOK == /\ mode \in {"quilt", "kata"} /\ left \in 0..1 /\ turn \in {"you", "bot"} /\ started \in BOOLEAN
          /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ held \in {"no", "yes", "stale"} /\ ghost \in BOOLEAN /\ cheer \in BOOLEAN
          /\ recorded \in 0..2 /\ beat \in BOOLEAN /\ wiped \in BOOLEAN /\ kturn \in {"you", "bot", "over"}

\* The reader's rules.
\* A hidden tab pauses a quilt in play.
PausedWhenHidden == (~visible /\ mode = "quilt" /\ started /\ ~Over) => paused
\* No bot moves while the tab is hidden, on either board.
BotsWaitWhileHidden == [][~visible => (left' = left /\ turn' = turn /\ kturn' = kturn)]_vars
\* While কাটাকুটি is on screen, the quilt underneath does not move.
QuiltWaitsOffScreen == [][(mode = "kata" /\ mode' = "kata") => (left' = left /\ turn' = turn)]_vars
\* After a hide, no finger counts as on the cloth.
InputReleasedWhenAway == ~visible => held = "no"
\* The ghost stitch shows on screen only under a finger that is down now.
GhostOnlyUnderAFinger == (ghost /\ CanPlay /\ visible) => held = "yes"
\* The win sound and the confetti play only while that quilt's result is on screen.
NoCheerAfterMovingOn == cheer => (mode = "quilt" /\ Over)
\* The finished quilt stays on screen for a moment; a stray key can't wipe it at once.
ResultStaysABeat == ~wiped
\* A quilt is recorded once.
NoDoubleResult == recorded <= 1

\* Exploration bound: stop past a wiped result, and past a quilt that finished under কাটাকুটি
\* (the states after them repeat the ones before).
Explore == ~wiped /\ ~(mode = "kata" /\ Over)
====
