---- MODULE BornoLikhi ----
\* বর্ণ লিখি (kids' letter tracing), as it is before the rewrite. Mirrored from:
\*   tools/borno-likhi/components/likhi-game.tsx  (onDown / onMove / onUp / onKey, goNext, again, restart, the effects)
\*   tools/borno-likhi/lib/trace.ts               (down / move / up / finishStroke: the pure tracing rules)
\*   shared/kids-kit.tsx                          (useKidsSession.atBreak, RestScreen, ParentGate, speak), as of f4f75be
\*   shared/game-sound.ts, shared/game-ui.tsx     (tone(), the SoundToggle button)
\*   shared/site-shell.tsx                        (PageFrame: the related-tool cards under every tool)
\*
\* Systems: the set (a letter being traced, a finished letter with its picture, the end card, closed), whether the
\* letter is the set's last, the finger on the board (pointer.current) and the window, keyboard focus and Enter (the
\* board's own key), the site-wide sound switch and Bangla speech, the daily limit and rest screen, the parent gate's
\* 2-second hold, and leaving through a related-tool card.
\*
\* Not modelled: the tab hiding (there is no visibilitychange or blur listener at all; tracing has no clock, and a
\* touch phone sends pointercancel when it hides, which onUp handles); the demo hand (a requestAnimationFrame loop with
\* no sound, which the browser stops while hidden); stars (computed and recorded in one call, goNext; recordLevel keeps
\* the higher count, shared/game-core.ts:69, covered by tests/borno-likhi.test.ts). There is no loop() and no cached
\* audio: every sound is a one-shot tone() that reads soundOn() when it plays.

VARIABLES phase, last, pointer, window, focus, misfire, sound, talking, resting, gate, page
vars == <<phase, last, pointer, window, focus, misfire, sound, talking, resting, gate, page>>

\* The parent gate and the voice share no variable with the game, so each is explored from one quiet moment while the
\* rest of the page waits. No rule mixes them with the game; this keeps the model under the chart's 500 states.
Free == gate = "shut" /\ ~talking
Child == resting = "no" /\ page = "kids" /\ window = "here" /\ Free   \* RestScreen is a fixed full-screen overlay

Init == /\ phase = "trace" /\ last = FALSE /\ pointer = FALSE /\ window = "here" /\ focus = "none" /\ misfire = FALSE
        /\ sound = TRUE /\ talking = FALSE /\ resting \in {"no", "atOpen"} /\ gate = "shut" /\ page = "kids"

\* A stroke counts (move() reaches fullAt, a dot is touched, or Enter on the board). It may be the letter's last:
\* then letterDone, chime(), and speak(pictureOf(char).label). speak() stays silent when sound is off, and muting
\* cancels a word already being read (current kit, f4f75be).
Written == \/ phase' = "trace" /\ UNCHANGED talking
           \/ phase' = "drawn" /\ talking' = (talking \/ sound)

\* ---------- the finger ----------
\* onDown: only the first pointer, only in play, not on a finished letter. setPointerCapture; the board takes focus.
YouTouchTheBoard == /\ Child /\ phase = "trace" /\ ~pointer
                    /\ pointer' = TRUE /\ focus' = "board"
                    /\ UNCHANGED <<phase, last, window, misfire, sound, talking, resting, gate, page>>
\* onMove: any move of that pointerId, pressed or not, may finish strokes.
YouTraceAStroke == /\ Free /\ pointer /\ window = "here" /\ phase = "trace" /\ Written
                   /\ UNCHANGED <<last, pointer, window, focus, misfire, sound, resting, gate, page>>
\* onUp / onPointerCancel: the pointer is released. Only events that reach the page count.
YouLiftYourFinger == /\ Free /\ pointer /\ window = "here" /\ pointer' = FALSE
                     /\ UNCHANGED <<phase, last, window, focus, misfire, sound, talking, resting, gate, page>>

\* ---------- the keyboard ----------
YouTabToTheBoard == /\ Child /\ phase = "trace" /\ focus # "board" /\ focus' = "board"
                    /\ UNCHANGED <<phase, last, pointer, window, misfire, sound, talking, resting, gate, page>>
YouTabToNext == /\ Child /\ phase = "drawn" /\ focus # "next" /\ focus' = "next"
                /\ UNCHANGED <<phase, last, pointer, window, misfire, sound, talking, resting, gate, page>>
\* Enter where focus is: on the board, onKey → finishStroke; on পরেরটা, goNext (below); on the sound toggle, the
\* browser clicks it again; on nothing (focus fell to <body>), nothing happens.
YouPressEnterOnTheBoard == /\ Child /\ focus = "board" /\ phase = "trace" /\ Written
                           /\ UNCHANGED <<last, pointer, window, focus, misfire, sound, resting, gate, page>>
YouPressEnterOnTheToggle == /\ Child /\ focus = "toggle" /\ sound' = ~sound
                            /\ misfire' = (misfire \/ phase = "trace")
                            /\ UNCHANGED <<phase, last, pointer, window, focus, talking, resting, gate, page>>

\* ---------- between letters ----------
\* goNext(): the next letter (the board remounts with a new key, so focus falls to <body>), or after the set's last
\* letter: levels.record(), sfx.win(), atBreak(), phase "end".
GoNext == /\ phase = "drawn"
          /\ IF last THEN phase' = "end" /\ resting' \in {"no", "atBreak"} /\ UNCHANGED last
                     ELSE phase' = "trace" /\ last' \in BOOLEAN /\ UNCHANGED resting
YouTapNext == /\ Child /\ ~pointer /\ GoNext /\ focus' = "none"
              /\ UNCHANGED <<pointer, window, misfire, sound, talking, gate, page>>
YouPressEnterOnNext == /\ Child /\ focus = "next" /\ GoNext /\ focus' = "lost"
                       /\ UNCHANGED <<pointer, window, misfire, sound, talking, gate, page>>
\* again(): the same letter from its first stroke (the board remounts).
YouTapWriteAgain == /\ Child /\ ~pointer /\ phase = "drawn" /\ phase' = "trace" /\ focus' = "none"
                    /\ UNCHANGED <<last, pointer, window, misfire, sound, talking, resting, gate, page>>
\* The end card: আবার খেলো / পরের সেট → restart(); শেষ → "closed"; নতুন খেলা → restart(). LevelGrid → restart(level).
YouStartASet == /\ Child /\ ~pointer
                /\ phase' = "trace" /\ last' = FALSE /\ focus' = "none"
                /\ UNCHANGED <<pointer, window, misfire, sound, talking, resting, gate, page>>
YouPressEnd == /\ Child /\ phase = "end" /\ phase' = "closed"
               /\ UNCHANGED <<last, pointer, window, focus, misfire, sound, talking, resting, gate, page>>

\* ---------- away and back: no blur or visibility listener ----------
WindowBlurs == /\ Free /\ window = "here" /\ window' = "away"
               /\ UNCHANGED <<phase, last, pointer, focus, misfire, sound, talking, resting, gate, page>>
WindowFocuses == /\ Free /\ window = "away" /\ window' = "here"
                 /\ UNCHANGED <<phase, last, pointer, focus, misfire, sound, talking, resting, gate, page>>

\* ---------- sound and speech ----------
\* <SoundToggle compact /> in the top row; a click leaves focus on it.
YouTapTheSoundToggle == /\ resting = "no" /\ page = "kids" /\ window = "here" /\ gate = "shut" /\ ~pointer
                        /\ sound' = ~sound /\ talking' = (talking /\ ~sound) /\ focus' = "toggle"
                        /\ UNCHANGED <<phase, last, pointer, window, misfire, resting, gate, page>>
SpeechEnds == /\ talking /\ talking' = FALSE
              /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, resting, gate, page>>

\* ---------- the daily limit ----------
\* resting: "atBreak" when atBreak() returned true at the end of a round; "atOpen" since 23fd7c1, when today's limit
\* had already passed as the page opened (useKidsSession's mount effect). RestScreen is a real modal since f4f75be:
\* window-capture listeners swallow keys, taps and focus outside it, which `Child` mirrors.
GrownUpGivesTime == /\ Free /\ resting # "no" /\ resting' = "no"
                    /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, gate, page>>

\* ---------- the parent gate (shared/kids-kit.tsx ParentGate), explored from the first screen ----------
Quiet == /\ resting = "no" /\ page = "kids" /\ window = "here" /\ ~talking /\ phase = "trace" /\ ~last /\ ~pointer
         /\ focus = "none" /\ sound /\ ~misfire
\* start(): hold.current = setTimeout(…, 2000). Since f4f75be a second start returns while a timer is set, and Enter's
\* key repeat is ignored, so no extra timer is armed.
YouHoldTheGate == /\ Quiet /\ gate = "shut"
                  /\ gate' = "holding"
                  /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, resting, page>>
\* stop(): clears hold.current only.
YouLetGoOfTheGate == /\ gate \in {"holding", "extra"} /\ gate' = IF gate = "extra" THEN "armed" ELSE "shut"
                     /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, resting, page>>
GateTimerFires == /\ gate \in {"holding", "extra", "armed"} /\ gate' = "asks"
                  /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, resting, page>>
GrownUpClosesGate == /\ gate = "asks" /\ gate' = "shut"
                     /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, resting, page>>

\* ---------- leaving the kids' section: PageFrame's related cards, the adult flagship first ----------
YouTapARelatedCard == /\ Quiet /\ gate = "shut" /\ page' = "adult"
                      /\ UNCHANGED <<phase, last, pointer, window, focus, misfire, sound, talking, resting, gate>>
Done == page = "adult" /\ UNCHANGED vars

Next == YouTouchTheBoard \/ YouTraceAStroke \/ YouLiftYourFinger \/ YouTabToTheBoard \/ YouTabToNext
        \/ YouPressEnterOnTheBoard \/ YouPressEnterOnTheToggle \/ YouTapNext \/ YouPressEnterOnNext \/ YouTapWriteAgain
        \/ YouStartASet \/ YouPressEnd \/ WindowBlurs \/ WindowFocuses \/ YouTapTheSoundToggle \/ SpeechEnds
        \/ GrownUpGivesTime \/ YouHoldTheGate \/ YouLetGoOfTheGate \/ GateTimerFires \/ GrownUpClosesGate
        \/ YouTapARelatedCard \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"trace", "drawn", "end", "closed"} /\ last \in BOOLEAN /\ pointer \in BOOLEAN
          /\ window \in {"here", "away"} /\ focus \in {"none", "board", "next", "toggle", "lost"} /\ misfire \in BOOLEAN
          /\ sound \in BOOLEAN /\ talking \in BOOLEAN /\ resting \in {"no", "atOpen", "atBreak"}
          /\ gate \in {"shut", "holding", "extra", "armed", "asks"} /\ page \in {"kids", "adult"}

\* ---------- the reader's rules ----------
\* After you leave the window, no finger counts as on the board (InputReleasedWhenAway).
InputReleasedWhenAway == pointer => window = "here"
\* Enter writes the stroke, as the board's label promises ("কিবোর্ডে Enter"), and never clicks a button instead.
EnterWritesTheStroke == ~misfire
\* After পরেরটা with Enter, the keyboard is still on the board for the next letter.
FocusStaysOnTheBoard == phase = "trace" => focus # "lost"
\* The rest screen appears only on the end card, never mid-set (RestOnlyAtBreak).
RestOnlyAtBreak == resting = "atBreak" => phase = "end"
\* Sound off means silent, the voice included.
SilentWhenMuted == ~sound => ~talking
\* The parent gate's question opens only after a 2-second hold.
HoldMeansHold == gate # "armed"
\* No path out of the kids' section without the parent gate.
NoWayOutWithoutGate == page = "kids"
\* For ages 4–5, every screen has a way on by picture or sound. Tracing has the glowing start dot, the arrow and the
\* demo hand; the finished letter (পরেরটা / আবার লিখি), the end card and the closed screen have only text buttons.
NoReadingNeeded == phase = "trace"
====
