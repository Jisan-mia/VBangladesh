---- MODULE SurBanai ----
\* সুর বানাই (kids' music grid), as it is before the rewrite. Mirrored from:
\*   tools/sur-banai/components/sur-game.tsx  (every handler and effect below names its function)
\*   tools/sur-banai/lib/sound.ts             (playNote / playBeat: one-shot tone() + hiss(), no loop())
\*   shared/game-sound.ts                     (tone() reads soundOn() on every call; setSoundOn(false) stops loop()s only)
\*   shared/kids-kit.tsx                      (useKidsSession.atBreak, RestScreen, ParentGate, speak / SpeakButton),
\*                                            as of commit f4f75be (gate ignores repeats, rest screen is a real modal,
\*                                            mute cuts scheduled notes and speech)
\*   shared/site-shell.tsx                    (PageFrame: the "এগুলোও ভালো লাগতে পারে" cards under every tool)
\*
\* Systems: the screen (free grid, match grid, saved card, won card, idle), the beat loop (startPlay's setTimeout chain:
\* the free tune, or the target tune with its onEnd → heard), the free tune's saved/unsaved state, the সব সুর drawer,
\* the window (here / another window / tab hidden), the site-wide sound switch, Bangla speech, the kids' daily limit and
\* rest screen, the parent gate's 2-second hold, and leaving the kids' section through a related-tool card.
\*
\* Sound: there is no loop() and no cached audio node. Each beat calls playBeat → tone(), which reads soundOn() then and
\* there, so turning sound back on is heard on the very next beat (the "??= keeps a silent stub" pattern cannot happen).
\* `beatHeard` records whether the last beat made a sound.

VARIABLES screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, gate, page
vars == <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, gate, page>>

Screens == {"free", "match", "saved", "won", "idle"}   \* mode × phase: free+play, match+play, free+saved, match+won, idle
\* The parent gate and the voice share no variable with the game, so each is explored from one quiet moment and the
\* rest of the page waits while a hold or a sentence is in progress. No rule mixes them with the game, so this checks
\* every path of each and keeps the model under the chart's 500 states.
Free == gate = "shut" /\ ~talking
Child == resting = "no" /\ page = "kids" /\ window = "here" /\ Free  \* you can tap only on the page; RestScreen is a fixed full-screen overlay (kids-kit.css .kk-rest)
Play  == screen \in {"free", "match"}                  \* phase === "play": the grid, speaker and drawer are on screen

Init == /\ screen = "free" /\ playing = "none" /\ unsaved = FALSE /\ heard = FALSE /\ drawer = FALSE
        /\ window = "here" /\ sound = TRUE /\ beatHeard = FALSE /\ talking = FALSE /\ resting \in {"no", "atOpen"}
        /\ gate = "shut" /\ page = "kids"

\* stopPlay(): clearTimeout + setPlaying(null).
Stop == playing' = "none" /\ beatHeard' = FALSE

\* ---------- the free grid ----------
\* tapCell() in free mode: toggles a note (we model adding one), plays it.
YouTapACell == /\ Child /\ screen = "free" /\ unsaved' = TRUE
               /\ UNCHANGED <<screen, playing, heard, drawer, window, sound, beatHeard, talking, resting, gate, page>>
\* clear() in free mode: the grid empties; nothing is left to lose.
YouClear == /\ Child /\ screen = "free" /\ unsaved /\ unsaved' = FALSE
            /\ UNCHANGED <<screen, playing, heard, drawer, window, sound, beatHeard, talking, resting, gate, page>>
\* playFree() while nothing plays: startPlay("free", …) — the first beat sounds at once.
YouPressPlay == /\ Child /\ screen = "free" /\ playing = "none"
                /\ playing' = "free" /\ beatHeard' = sound
                /\ UNCHANGED <<screen, unsaved, heard, drawer, window, sound, talking, resting, gate, page>>
\* playFree() while playing: sfx.tap(); stopPlay(); atBreak(). atBreak shows the rest screen if today's limit has passed.
YouPressStop == /\ Child /\ screen = "free" /\ playing = "free"
                /\ Stop /\ resting' \in {"no", "atBreak"}
                /\ UNCHANGED <<screen, unsaved, heard, drawer, window, sound, talking, gate, page>>
\* save(): stopPlay(), store the tune, phase "saved", atBreak().
YouSave == /\ Child /\ screen = "free" /\ unsaved
           /\ Stop /\ unsaved' = FALSE /\ screen' = "saved" /\ resting' \in {"no", "atBreak"}
           /\ UNCHANGED <<heard, drawer, window, sound, talking, gate, page>>

\* ---------- the beat loop (setTimeout chain; it never checks focus) ----------
\* beat(): every TEMPOS[tempo].ms, playBeat() → tone(), which is silent only if soundOn() is false right now.
NextBeat == /\ Free /\ playing # "none" /\ beatHeard' = sound
            /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, talking, resting, gate, page>>
\* The target tune's last beat: stopPlay(); onEnd() → setHeard(true).
TuneEnds == /\ Free /\ playing = "target" /\ Stop /\ heard' = TRUE
            /\ UNCHANGED <<screen, unsaved, drawer, window, sound, talking, resting, gate, page>>

\* ---------- সুরটা মেলাও ----------
\* switchMode(next): returns early only when next === mode && phase === "play"; else stopPlay(), and for match openLevel(n).
YouPickFree == /\ Child /\ screen # "free"
               /\ Stop /\ screen' = "free" /\ drawer' = FALSE
               /\ UNCHANGED <<unsaved, heard, window, sound, talking, resting, gate, page>>
YouPickMatch == /\ Child /\ screen # "match"
                /\ Stop /\ screen' = "match" /\ heard' = FALSE /\ drawer' = FALSE
                /\ UNCHANGED <<unsaved, window, sound, talking, resting, gate, page>>
\* listen(): ignored while the target plays; else startPlay("target", …, () => setHeard(true)).
YouListen == /\ Child /\ screen = "match" /\ playing # "target"
             /\ playing' = "target" /\ beatHeard' = sound
             /\ UNCHANGED <<screen, unsaved, heard, drawer, window, sound, talking, resting, gate, page>>
\* check() (button disabled until heard and while the target plays). A copy that doesn't match: a line and a wobble.
YouCheckWrong == /\ Child /\ screen = "match" /\ heard /\ playing # "target"
                 /\ UNCHANGED vars
\* A copy that matches: levels.record(), phase "won", atBreak().
YouCheckRight == /\ Child /\ screen = "match" /\ heard /\ playing # "target"
                 /\ Stop /\ screen' = "won" /\ drawer' = FALSE /\ resting' \in {"no", "atBreak"}
                 /\ UNCHANGED <<unsaved, heard, window, sound, talking, gate, page>>
\* <details className="sb-drawer"> toggles on its own; opening it doesn't touch the beat loop.
YouOpenDrawer == /\ Child /\ screen = "match" /\ ~drawer /\ drawer' = TRUE
                 /\ UNCHANGED <<screen, playing, unsaved, heard, window, sound, beatHeard, talking, resting, gate, page>>
\* LevelGrid onPick → openLevel(pick): stopPlay(), heard false. (The drawer stays open; the model closes it to stay small.)
YouPickATune == /\ Child /\ screen = "match" /\ drawer
                /\ Stop /\ heard' = FALSE /\ drawer' = FALSE
                /\ UNCHANGED <<screen, unsaved, window, sound, talking, resting, gate, page>>

\* ---------- the end screens ----------
\* saved: আবার খেলো → empty grid, phase play. won: পরের সুর / আবার খেলো → openLevel().
YouPlayAgain == /\ Child /\ screen \in {"saved", "won"}
                /\ screen' = IF screen = "saved" THEN "free" ELSE "match"
                /\ heard' = FALSE /\ drawer' = FALSE
                /\ UNCHANGED <<playing, unsaved, window, sound, beatHeard, talking, resting, gate, page>>
YouEnd == /\ Child /\ screen \in {"saved", "won"} /\ screen' = "idle"
          /\ UNCHANGED <<playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, gate, page>>

\* ---------- away and back ----------
\* There is no blur listener. The only one is visibilitychange: if (document.hidden) stopPlay().
WindowBlurs == /\ Free /\ window = "here" /\ window' = "away"
               /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, sound, beatHeard, talking, resting, gate, page>>
WindowFocuses == /\ Free /\ window = "away" /\ window' = "here"
                 /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, sound, beatHeard, talking, resting, gate, page>>
TabHides == /\ Free /\ window # "hidden" /\ window' = "hidden" /\ Stop
            /\ UNCHANGED <<screen, unsaved, heard, drawer, sound, talking, resting, gate, page>>
TabShows == /\ Free /\ window = "hidden" /\ window' = "here"
            /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, sound, beatHeard, talking, resting, gate, page>>

\* ---------- sound and speech ----------
\* SoundToggle → setSoundOn(false): since f4f75be it stops loop()s, calls silenceScheduled() (notes already handed to
\* the audio clock are cut) and speechSynthesis.cancel(). The beat chain keeps running, silently.
SoundOff == /\ resting = "no" /\ page = "kids" /\ window = "here" /\ gate = "shut" /\ sound
            /\ sound' = FALSE /\ beatHeard' = FALSE /\ talking' = FALSE
            /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, resting, gate, page>>
SoundOn == /\ resting = "no" /\ page = "kids" /\ window = "here" /\ gate = "shut" /\ ~sound /\ sound' = TRUE
           /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, beatHeard, talking, resting, gate, page>>
\* <SpeakButton> beside the line under the grid (shown when the phone has a Bangla voice). speak() returns early when
\* soundOn() is false, and muting cancels a sentence already started (both in the current kit).
\* (Explored from the first screen; the voice reads the same line however you got there.)
YouTapTheSpeaker == /\ Child /\ screen = "free" /\ playing = "none" /\ ~unsaved /\ talking' = sound
                    /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, resting, gate, page>>
SpeechEnds == /\ talking /\ talking' = FALSE
              /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, resting, gate, page>>

\* ---------- the daily limit ----------
\* resting: "atBreak" when atBreak() returned true at the end of a round; "atOpen" since 23fd7c1, when today's limit
\* had already passed as the page opened (useKidsSession's mount effect). RestScreen is a real modal since f4f75be:
\* window-capture listeners swallow keys, taps and focus outside it, which `Child` mirrors.
\* RestScreen → ParentGate → আজ আরও ১০ মিনিট → extend(): resting false.
GrownUpGivesTime == /\ Free /\ resting # "no" /\ resting' = "no"
                    /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, gate, page>>

\* ---------- the parent gate (shared/kids-kit.tsx ParentGate), 2-second hold ----------
\* The gate shares no variable with the game, so it is explored from one quiet moment (the first screen: an
\* empty grid, nothing playing, window here, sound on). That checks every gate path and keeps the chart under 500 states.
Quiet == /\ resting = "no" /\ page = "kids" /\ window = "here" /\ ~talking /\ screen = "free" /\ playing = "none"
         /\ ~unsaved /\ sound
\* onPointerDown / onKeyDown Enter → start(): hold.current = setTimeout(open the sum, 2000). Since f4f75be a second
\* start (a second finger) returns while hold.current is set, and Enter's key repeat (event.repeat) is ignored, so
\* the "extra" timer of the old kit can no longer be armed.
YouHoldTheGate == /\ Quiet /\ gate = "shut"
                  /\ gate' = "holding"
                  /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, page>>
\* onPointerUp / onPointerLeave / onKeyUp / onBlur → stop(): clears the one timer.
YouLetGoOfTheGate == /\ gate \in {"holding", "extra"}
                     /\ gate' = IF gate = "extra" THEN "armed" ELSE "shut"
                     /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, page>>
\* A surviving timer fires: the sum question opens (the sum still guards the share link).
GateTimerFires == /\ gate \in {"holding", "extra", "armed"} /\ gate' = "asks"
                  /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, page>>
GrownUpClosesGate == /\ gate = "asks" /\ gate' = "shut"
                     /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, page>>

\* ---------- leaving the kids' section ----------
\* PageFrame's related cards: the flagship (আমার ছোটবেলা, an adult tool with share buttons) always comes first. No gate.
YouTapARelatedCard == /\ Quiet /\ gate = "shut" /\ page' = "adult"
                      /\ UNCHANGED <<screen, playing, unsaved, heard, drawer, window, sound, beatHeard, talking, resting, gate>>
Done == page = "adult" /\ UNCHANGED vars

Next == YouTapACell \/ YouClear \/ YouPressPlay \/ YouPressStop \/ YouSave \/ NextBeat \/ TuneEnds
        \/ YouPickFree \/ YouPickMatch \/ YouListen \/ YouCheckWrong \/ YouCheckRight \/ YouOpenDrawer \/ YouPickATune
        \/ YouPlayAgain \/ YouEnd \/ WindowBlurs \/ WindowFocuses \/ TabHides \/ TabShows
        \/ SoundOff \/ SoundOn \/ YouTapTheSpeaker \/ SpeechEnds \/ GrownUpGivesTime
        \/ YouHoldTheGate \/ YouLetGoOfTheGate \/ GateTimerFires \/ GrownUpClosesGate \/ YouTapARelatedCard \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ playing \in {"none", "free", "target"} /\ unsaved \in BOOLEAN /\ heard \in BOOLEAN
          /\ drawer \in BOOLEAN /\ window \in {"here", "away", "hidden"} /\ sound \in BOOLEAN /\ beatHeard \in BOOLEAN
          /\ talking \in BOOLEAN /\ resting \in {"no", "atOpen", "atBreak"} /\ gate \in {"shut", "holding", "extra", "armed", "asks"}
          /\ page \in {"kids", "adult"}

\* ---------- the reader's rules ----------
\* The tune stops when the tab hides.
SilentWhenHidden == window = "hidden" => playing = "none"
\* Nothing plays on its own while you're in another window (NoProgressWhileAway / PausedWhenBlurred).
NoProgressWhileAway == playing # "none" => window = "here"
\* A beat makes sound only when sound is on (LoopOnlyWhenMeaningful) ...
BeatOnlyWithSound == beatHeard => sound
\* ... and turning sound back on is heard on the next beat: no silent stub is kept (LoopComesBack).
LoopComesBack == (playing # "none" /\ sound) => ENABLED (NextBeat /\ beatHeard')
\* While the সব সুর list is open, the tune doesn't play on (ChoiceFreezesPlay).
ChoiceFreezesPlay == drawer => playing = "none"
\* The rest screen appears only after a tune is kept or matched, never midway (RestOnlyAtBreak; the FAQ promises
\* "সুর রাখা বা মেলানো শেষ হলে, মাঝপথে নয়").
RestOnlyAtBreak == resting = "atBreak" => screen \in {"saved", "won"}
\* And never over a tune that isn't kept yet.
RestKeepsYourTune == resting # "no" => ~unsaved
\* Nothing plays under the rest screen.
QuietUnderRest == resting # "no" => playing = "none"
\* Sound off means silent, speech included (the FAQ: "শব্দ একবার বন্ধ করলে এই সাইটের সব খেলায় বন্ধ থাকে").
SilentWhenMuted == ~sound => ~talking
\* The parent gate's question opens only after a 2-second hold: no timer survives letting go.
HoldMeansHold == gate # "armed"
\* No path out of the kids' section without the parent gate (ParentGate / NoShareForKids).
NoWayOutWithoutGate == page = "kids"
\* For ages 3–5, every screen has a way on by picture or sound (NoReadingNeeded). The play screens have the ghost
\* finger, ▶ and pictures; the saved, won and idle screens offer only text buttons (আবার খেলো, শেষ, পরের সুর).
NoReadingNeeded == screen \in {"free", "match"}
====
