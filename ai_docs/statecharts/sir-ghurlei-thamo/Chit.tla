---- MODULE Chit ----
\* স্যার ঘুরলেই থামো after the rewrite: the screens (title, class, result), the player's pause menu and the level list, tab and
\* window focus, the breath after coming back, the teacher at the board or facing the class, the chit held or not (hold mode and
\* one-tap mode), the Enter key and its auto-repeat, the chit's hum, the scheduled star chimes and confetti, and a friend's link.
\* Mirrored from tools/sir-ghurlei-thamo/lib/session.ts (ticking, wantHum, syncHum, blur, hide, pause, openSheet, wake, press,
\* release, caught, freshResultKey), lib/step.hot.ts (stepGame), and components/class-game.tsx (begin, finish, takeLink, the
\* hashchange, blur and visibility handlers, the keys), with useGamePlayer from shared/game-player-client.tsx (it pauses on blur,
\* hide and Escape, and calls silenceScheduled) and loop() / setSoundOn() from shared/game-sound.ts.
\* Left out: the bench count (one step "the chit reaches the last bench"), the second watcher and the lights (more routines on the
\* same teacher track), saved stars, the story, and slow mode (it only removes motion).
EXTENDS Naturals

VARIABLES phase, paused, sheet, visible, focused, breath, teacher, holding, tapMode, hand, hum, sound, party, results, pending
vars == <<phase, paused, sheet, visible, focused, breath, teacher, holding, tapMode, hand, hum, sound, party, results, pending>>

\* hand is the Enter key: "off" or "down" (its auto-repeats are ignored everywhere, see KeyRepeats).
\* session.ts ticking(): the class steps only on the class screen, menu and list shut, tab showing, window focused.
Ticking == phase \in {"ready", "playing"} /\ ~paused /\ ~sheet /\ visible /\ focused
\* The routine moves only when ticking and past the breath.
Running == Ticking /\ ~breath /\ phase = "playing"
\* session.ts wantHum(): the hum plays only while the class ticks and sound is on. syncHum runs after every event and every step,
\* so hum is always set from the new state (a fresh loop each time, never a stub made while muted).
HumFor(ph, pa, sh, vi, fo, so) == ph \in {"ready", "playing"} /\ ~pa /\ ~sh /\ vi /\ fo /\ so

\* begin(): a fresh class. silenceScheduled() cuts queued notes, the breath and the hold clear, the teacher is at the board.
NewClass == /\ phase' = "ready" /\ sheet' = FALSE /\ breath' = FALSE /\ teacher' = "board" /\ holding' = FALSE
            /\ party' = FALSE /\ results' = 0 /\ pending' = FALSE
\* takeLink(): a friend's class on the title with their challenge (queued notes cut, the class forgotten).
OpenLink == /\ phase' = "title" /\ breath' = FALSE /\ teacher' = "board" /\ holding' = FALSE /\ party' = FALSE /\ results' = 0 /\ pending' = FALSE
\* begin() with a link waiting closes the list and opens the link instead of the class asked for.
Begin == IF pending THEN OpenLink /\ sheet' = FALSE ELSE NewClass

\* press(): only while ticking and past the breath; the chit is held, or in one-tap mode toggled. stepGame moves ready to playing.
PressRules == LET h == IF tapMode THEN ~holding ELSE TRUE IN
              /\ holding' = IF Ticking /\ ~breath THEN h ELSE holding
              /\ phase' = IF Ticking /\ ~breath /\ phase = "ready" /\ h THEN "playing" ELSE phase

\* keydown Enter on the window (never while the menu or the list is open: they keep the keys).
YouPressEnter == /\ hand = "off" /\ focused /\ ~paused /\ ~sheet /\ hand' = "down"
                 /\ \/ /\ phase = "title" /\ Begin /\ UNCHANGED <<paused, visible, focused, tapMode, sound, results>>
                       /\ hum' = HumFor(phase', paused, sheet', visible, focused, sound)
                    \/ /\ phase \in {"ready", "playing"} /\ PressRules
                       /\ UNCHANGED <<paused, sheet, visible, focused, breath, teacher, tapMode, sound, party, results, pending>>
                       /\ hum' = HumFor(phase', paused, sheet, visible, focused, sound)
                    \/ /\ phase = "over" /\ Begin /\ UNCHANGED <<paused, visible, focused, tapMode, sound>>
                       /\ hum' = HumFor(phase', paused, sheet', visible, focused, sound)
\* A pointer press on the chit or the big button: the same press, no key.
YouTapChit == /\ Ticking /\ ~breath /\ PressRules
              /\ UNCHANGED <<paused, sheet, visible, focused, breath, teacher, tapMode, hand, hum, sound, party, results, pending>>
\* A held Enter repeats: ignored (event.repeat) in the class, on the result and on the title, so nothing changes.
KeyRepeats == /\ hand = "down" /\ UNCHANGED vars
\* keyup / pointerup: release() lets go in hold mode; one-tap mode ignores it.
YouLetGo == /\ hand = "down" /\ hand' = "off" /\ holding' = (tapMode /\ holding)
            /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, teacher, tapMode, hum, sound, party, results, pending>>
\* আবার খেলো, পরের লেভেল, a level from the list (the list closes), or the title's খেলো button.
YouChooseClass == /\ focused /\ ~paused /\ phase \in {"title", "over"} /\ hand = "off" /\ Begin
                  /\ UNCHANGED <<paused, visible, focused, tapMode, hand, sound>>
                  /\ hum' = HumFor(phase', paused, sheet', visible, focused, sound)
\* The title's one-tap chip: setTapMode lets go.
YouSwitchMode == /\ focused /\ ~paused /\ ~sheet /\ phase = "title" /\ tapMode' = ~tapMode /\ holding' = FALSE
                 /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, teacher, hand, hum, sound, party, results, pending>>
\* The player's menu: Escape, P, the ⏸ button, blur and hide all open it. The player cuts queued notes (silenceScheduled) and the
\* game lets go of the chit; a link waiting is taken now (onPause).
MenuOpens == /\ ~paused /\ paused' = TRUE /\ holding' = FALSE /\ party' = FALSE /\ breath' = (breath \/ Ticking)
             /\ IF pending THEN OpenLink ELSE UNCHANGED <<phase, teacher, results, pending>>
             /\ UNCHANGED <<sheet, visible, focused, tapMode, hand, sound>>
             /\ hum' = HumFor(IF pending THEN "title" ELSE phase, TRUE, sheet, visible, focused, sound)
\* চালিয়ে যাও: S.resume then wake(): a breath if the class stopped mid-play.
YouResume == /\ paused /\ focused /\ visible /\ paused' = FALSE /\ breath' = (breath \/ (phase \in {"ready", "playing"} /\ ~sheet))
             /\ UNCHANGED <<phase, sheet, visible, focused, teacher, holding, tapMode, hand, sound, party, results, pending>>
             /\ hum' = HumFor(phase, FALSE, sheet, visible, focused, sound)
\* The pause menu's সব লেভেল, or the title's, or the result's: the list opens, play is frozen behind it, the hold is let go.
YouOpenLevels == /\ ~sheet /\ focused /\ phase \in {"title", "ready", "playing", "over"} /\ sheet' = TRUE /\ holding' = FALSE
                 /\ breath' = (breath \/ Ticking)
                 /\ IF pending THEN OpenLink ELSE UNCHANGED <<phase, teacher, party, results, pending>>
                 /\ UNCHANGED <<paused, visible, focused, tapMode, hand, sound>>
                 /\ hum' = HumFor(IF pending THEN "title" ELSE phase, paused, TRUE, visible, focused, sound)
YouCloseLevels == /\ sheet /\ ~paused /\ sheet' = FALSE
                  /\ UNCHANGED <<phase, paused, visible, focused, breath, teacher, holding, tapMode, hand, party, results, pending, sound>>
                  /\ hum' = HumFor(phase, paused, FALSE, visible, focused, sound)

\* The teacher's routine and what it does to a held chit. Every one needs Running.
TeacherTurns == /\ Running /\ teacher = "board" /\ teacher' = "class"
                /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, holding, tapMode, hand, hum, sound, party, results, pending>>
TeacherTurnsBack == /\ Running /\ teacher = "class" /\ ~holding /\ teacher' = "board"
                    /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, holding, tapMode, hand, hum, sound, party, results, pending>>
\* A catch: the scolding, then back to the board. caught(): one-tap mode lets go.
ChitCaught == /\ Running /\ teacher = "class" /\ holding /\ teacher' = "board" /\ holding' = (holding /\ ~tapMode)
              /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, tapMode, hand, hum, sound, party, results, pending>>
\* finish(): the result; the hum stops with the class; star chimes are scheduled and the confetti starts.
ChitArrives == /\ Running /\ teacher = "board" /\ holding
               /\ phase' = "over" /\ holding' = FALSE /\ party' = TRUE /\ results' = results + 1
               /\ UNCHANGED <<paused, sheet, visible, focused, breath, teacher, tapMode, hand, sound, pending>>
               /\ hum' = HumFor("over", paused, sheet, visible, focused, sound)
PartyEnds == /\ party /\ party' = FALSE
             /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, teacher, holding, tapMode, hand, hum, sound, results, pending>>

\* blur: S.blur lets go (one-tap mode too) and the player opens its menu; a waiting link is taken.
WindowBlurs == /\ focused /\ focused' = FALSE /\ hand' = "off" /\ holding' = FALSE /\ breath' = (breath \/ Ticking)
               /\ paused' = TRUE /\ party' = FALSE
               /\ IF pending THEN OpenLink ELSE UNCHANGED <<phase, teacher, results, pending>>
               /\ UNCHANGED <<sheet, visible, tapMode, sound>>
               /\ hum' = HumFor(IF pending THEN "title" ELSE phase, TRUE, sheet, visible, FALSE, sound)
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, paused, sheet, visible, breath, teacher, holding, tapMode, hand, sound, party, results, pending>>
                 /\ hum' = HumFor(phase, paused, sheet, visible, TRUE, sound)
\* visibilitychange -> hidden: let go, the player opens its menu, a waiting link is taken.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE /\ hand' = "off" /\ holding' = FALSE /\ breath' = (breath \/ Ticking)
            /\ paused' = TRUE /\ party' = FALSE
            /\ IF pending THEN OpenLink ELSE UNCHANGED <<phase, teacher, results, pending>>
            /\ UNCHANGED <<sheet, tapMode, sound>>
            /\ hum' = HumFor(IF pending THEN "title" ELSE phase, TRUE, sheet, FALSE, FALSE, sound)
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, paused, sheet, breath, teacher, holding, tapMode, hand, sound, party, results, pending>>
            /\ hum' = HumFor(phase, paused, sheet, TRUE, TRUE, sound)

\* The site-wide switch, in the player's menu. Off: the kit stops every loop and cuts queued notes. On: syncHum starts a fresh hum.
SoundOff == /\ sound /\ sound' = FALSE /\ party' = FALSE
            /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, teacher, holding, tapMode, hand, results, pending>>
            /\ hum' = FALSE
SoundOn == /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<phase, paused, sheet, visible, focused, breath, teacher, holding, tapMode, hand, party, results, pending>>
           /\ hum' = HumFor(phase, paused, sheet, visible, focused, TRUE)

\* A friend's link pasted into this tab (hashchange): a running class is not taken over (it waits for the next pause, blur, hide,
\* or the next new class); anything else opens their class on the title at once.
FriendLinkArrives == /\ ~pending /\ phase # "title"
                     /\ IF Ticking THEN /\ pending' = TRUE /\ UNCHANGED <<phase, breath, teacher, holding, party, results, sheet>>
                        ELSE /\ OpenLink /\ sheet' = sheet
                     /\ UNCHANGED <<paused, visible, focused, tapMode, hand, sound>>
                     /\ hum' = HumFor(IF Ticking THEN phase ELSE "title", paused, sheet', visible, focused, sound)
\* The breath ends (0.5 s of class time with nothing moving).
BreathEnds == /\ Ticking /\ breath /\ breath' = FALSE
              /\ UNCHANGED <<phase, paused, sheet, visible, focused, teacher, holding, tapMode, hand, hum, sound, party, results, pending>>

Init == /\ phase = "title" /\ paused = FALSE /\ sheet = FALSE /\ visible = TRUE /\ focused = TRUE /\ breath = FALSE /\ teacher = "board"
        /\ holding = FALSE /\ tapMode = FALSE /\ hand = "off" /\ hum = FALSE /\ sound = TRUE
        /\ party = FALSE /\ results = 0 /\ pending = FALSE

Next == YouPressEnter \/ YouTapChit \/ KeyRepeats \/ YouLetGo \/ YouChooseClass \/ YouSwitchMode \/ MenuOpens \/ YouResume
        \/ YouOpenLevels \/ YouCloseLevels
        \/ TeacherTurns \/ TeacherTurnsBack \/ ChitCaught \/ ChitArrives \/ PartyEnds
        \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows \/ SoundOff \/ SoundOn \/ FriendLinkArrives \/ BreathEnds

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"title", "ready", "playing", "over"} /\ paused \in BOOLEAN /\ sheet \in BOOLEAN /\ visible \in BOOLEAN
          /\ focused \in BOOLEAN /\ breath \in BOOLEAN /\ teacher \in {"board", "class"} /\ holding \in BOOLEAN /\ tapMode \in BOOLEAN
          /\ hand \in {"off", "down"} /\ hum \in BOOLEAN /\ sound \in BOOLEAN /\ party \in BOOLEAN /\ results \in 0..1
          /\ pending \in BOOLEAN

\* The reader's rules.
PausedWhenHidden == (~visible /\ phase = "playing") => paused
PausedWhenBlurred == (~focused /\ phase = "playing") => paused
InputReleasedWhenAway == (~focused \/ ~visible \/ paused \/ sheet) => ~holding
ClickThatBringsFocusBackIsNotAMove == breath => ~holding
ChoiceFreezesPlay == (sheet \/ paused) => ~Running
LoopOnlyWhenMeaningful == hum => (Ticking /\ sound)
LoopComesBack == (Ticking /\ sound) => hum
ResultStaysUntilYouChoose == (phase = "over" /\ hand = "down") => (results = 1)
NoDoubleResult == results <= 1
CelebrationOnlyOnResult == party => phase = "over"
FriendLinkOpensTheirClass == pending => (Ticking \/ phase = "over")
OneNewClassAtATime == (phase = "title") => ~pending
====
