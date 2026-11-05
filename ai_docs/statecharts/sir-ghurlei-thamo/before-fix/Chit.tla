---- MODULE Chit ----
\* স্যার ঘুরলেই থামো as it is today: the class (ready, playing, over), the teacher at the board or facing the class,
\* the chit held or not (hold mode and one-tap mode), pause, tab and window focus, the Enter key and its auto-repeat,
\* the chit's hum loop and the site-wide sound switch, the celebration timer, and a friend's link.
\* Mirrored from tools/sir-ghurlei-thamo/components/chit-game.tsx (press, release, resume, reset, again, finish, step,
\* the visibilitychange + blur effect, the keydown/keyup effect, SoundToggle onChange={stopHum}, the mount effect that
\* reads the link once) and tools/sir-ghurlei-thamo/lib/game.ts (stepGame), with useGameLoop from shared/game-kit.ts and
\* loop() and setSoundOn() from shared/game-sound.ts.
\* Left out: the bench count (one step "the chit reaches the last bench"), needRelease after a catch (it only stops the
\* chit until you lift, which no rule here reads), slow mode, saved stars (recordLevel keeps the max) and the level grid
\* (the same reset() as আবার খেলো).
EXTENDS Naturals

VARIABLES phase, paused, visible, focused, teacher, holding, tapMode, hand, hum, sound, party, results, pending
vars == <<phase, paused, visible, focused, teacher, holding, tapMode, hand, hum, sound, party, results, pending>>

\* hand is the Enter key: "off", "down", or "skipped" once its auto-repeat has left the result while still held.
Held == {"down", "skipped"}
\* useGameLoop runs while !paused && phase !== "over", and stops itself while the tab is hidden. Focus plays no part.
Running == ~paused /\ visible /\ phase # "over"

\* reset(): a fresh class; the hum stops. The setTimeout that finish() started is not cleared.
Reset == /\ phase' = "ready" /\ paused' = FALSE /\ teacher' = "board" /\ holding' = FALSE /\ hum' = FALSE /\ results' = 0
\* press(): only while playable. The hum starts from inside the press (a stub when sound is off); the chit is held,
\* or in one-tap mode toggled. stepGame moves ready to playing on the first held step.
Press == LET h == IF tapMode THEN ~holding ELSE TRUE IN
         /\ holding' = h
         /\ hum' = (hum \/ sound)
         /\ phase' = IF phase = "ready" /\ h THEN "playing" ELSE phase
         /\ UNCHANGED <<paused, teacher, results>>

\* keydown Enter on the window: paused -> resume(); over -> again(); otherwise press() unless it is a repeat.
YouPressEnter == /\ focused /\ hand = "off" /\ hand' = "down"
                 /\ \/ /\ paused /\ paused' = FALSE /\ holding' = FALSE
                       /\ UNCHANGED <<phase, teacher, hum, results>>
                    \/ /\ ~paused /\ phase = "over" /\ Reset
                    \/ /\ ~paused /\ phase # "over" /\ Press
                 /\ UNCHANGED <<visible, focused, tapMode, sound, party, pending>>
\* A held Enter repeats. During play the repeat is ignored (event.repeat), but on the result it calls again() too.
KeyRepeats == /\ focused /\ hand \in Held
              /\ \/ /\ paused /\ paused' = FALSE /\ holding' = FALSE /\ hand' = hand
                    /\ UNCHANGED <<phase, teacher, hum, results>>
                 \/ /\ ~paused /\ phase = "over" /\ Reset /\ hand' = "skipped"
              /\ UNCHANGED <<visible, focused, tapMode, sound, party, pending>>
\* keyup: release() lets go of the chit in hold mode; in one-tap mode it does nothing.
YouLetGo == /\ hand \in Held /\ hand' = "off"
            /\ holding' = (tapMode /\ holding)
            /\ UNCHANGED <<phase, paused, visible, focused, teacher, tapMode, hum, sound, party, results, pending>>
\* The চালিয়ে যাও button.
YouResume == /\ paused /\ focused /\ hand = "off" /\ paused' = FALSE /\ holding' = FALSE
             /\ UNCHANGED <<phase, visible, focused, teacher, tapMode, hand, hum, sound, party, results, pending>>
\* "চেপে না ধরে খেলো": setHolding(false), then switch mode. Shown only before the result.
YouSwitchMode == /\ focused /\ hand = "off" /\ phase # "over" /\ tapMode' = ~tapMode /\ holding' = FALSE
                 /\ UNCHANGED <<phase, paused, visible, focused, teacher, hand, hum, sound, party, results, pending>>
\* আবার খেলো, পরের ক্লাস, or a class from the grid: again() -> reset().
YouPlayAgain == /\ focused /\ hand = "off" /\ phase = "over" /\ Reset
                /\ UNCHANGED <<visible, focused, tapMode, hand, sound, party, pending>>

\* The teacher's routine, and what it does to a held chit.
TeacherTurns == /\ Running /\ phase = "playing" /\ teacher = "board" /\ teacher' = "class"
                /\ UNCHANGED <<phase, paused, visible, focused, holding, tapMode, hand, hum, sound, party, results, pending>>
TeacherTurnsBack == /\ Running /\ phase = "playing" /\ teacher = "class" /\ ~holding /\ teacher' = "board"
                    /\ UNCHANGED <<phase, paused, visible, focused, holding, tapMode, hand, hum, sound, party, results, pending>>
\* A catch: the scolding, then back to the board. One-tap mode lets go of the chit (setHolding(false)).
ChitCaught == /\ Running /\ phase = "playing" /\ teacher = "class" /\ holding
              /\ teacher' = "board" /\ holding' = (holding /\ ~tapMode)
              /\ UNCHANGED <<phase, paused, visible, focused, tapMode, hand, hum, sound, party, results, pending>>
\* finish(): the result, the hum stops, holding clears, and a setTimeout for the win sound and confetti.
ChitArrives == /\ Running /\ phase = "playing" /\ teacher = "board" /\ holding
               /\ phase' = "over" /\ holding' = FALSE /\ hum' = FALSE /\ party' = TRUE /\ results' = results + 1
               /\ UNCHANGED <<paused, visible, focused, teacher, tapMode, hand, sound, pending>>
PartyFires == /\ party /\ party' = FALSE
              /\ UNCHANGED <<phase, paused, visible, focused, teacher, holding, tapMode, hand, hum, sound, results, pending>>

\* Focus. blur lets go of the chit in hold mode only; it never pauses.
WindowBlurs == /\ focused /\ focused' = FALSE /\ hand' = "off" /\ holding' = (tapMode /\ holding)
               /\ UNCHANGED <<phase, paused, visible, teacher, tapMode, hum, sound, party, results, pending>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, visible, teacher, holding, tapMode, hand, hum, sound, party, results, pending>>
\* visibilitychange -> hidden: let go, stop the hum, and pause if the class is under way.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ hand' = "off" /\ holding' = FALSE /\ hum' = FALSE
            /\ paused' = (paused \/ phase = "playing")
            /\ UNCHANGED <<phase, teacher, tapMode, sound, party, results, pending>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, teacher, holding, tapMode, hand, hum, sound, party, results, pending>>

\* The sound switch: setSoundOn() stops every loop when off, and onChange={stopHum} drops the hum either way.
SoundOff == /\ focused /\ hand = "off" /\ sound /\ sound' = FALSE /\ hum' = FALSE
            /\ UNCHANGED <<phase, paused, visible, focused, teacher, holding, tapMode, hand, party, results, pending>>
SoundOn == /\ focused /\ hand = "off" /\ ~sound /\ sound' = TRUE /\ hum' = FALSE
           /\ UNCHANGED <<phase, paused, visible, focused, teacher, holding, tapMode, hand, party, results, pending>>

\* A friend's link opened in this tab changes only the hash: nothing listens for hashchange.
FriendLinkArrives == /\ focused /\ ~pending /\ phase # "playing" /\ pending' = TRUE
                     /\ UNCHANGED <<phase, paused, visible, focused, teacher, holding, tapMode, hand, hum, sound, party, results>>

Init == /\ phase = "ready" /\ paused = FALSE /\ visible = TRUE /\ focused = TRUE /\ teacher = "board"
        /\ holding = FALSE /\ tapMode = FALSE /\ hand = "off" /\ hum = FALSE /\ sound = TRUE
        /\ party = FALSE /\ results = 0 /\ pending = FALSE

Next == YouPressEnter \/ KeyRepeats \/ YouLetGo \/ YouResume \/ YouSwitchMode \/ YouPlayAgain
        \/ TeacherTurns \/ TeacherTurnsBack \/ ChitCaught \/ ChitArrives \/ PartyFires
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn \/ FriendLinkArrives

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "over"} /\ paused \in BOOLEAN /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ teacher \in {"board", "class"} /\ holding \in BOOLEAN /\ tapMode \in BOOLEAN /\ hand \in {"off"} \cup Held
          /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ party \in BOOLEAN /\ results \in 0..1 /\ pending \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == (~visible /\ phase = "playing") => paused
PausedWhenBlurred == (~focused /\ phase = "playing") => paused
InputReleasedWhenAway == ~focused => ~holding
LoopOnlyWhenMeaningful == hum => (phase = "playing" /\ ~paused /\ visible /\ sound)
LoopComesBack == (phase = "playing" /\ Running /\ holding /\ sound) => hum
ResultStaysUntilYouChoose == hand # "skipped"
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == party => phase = "over"
FriendLinkOpensTheirClass == ~pending
====
