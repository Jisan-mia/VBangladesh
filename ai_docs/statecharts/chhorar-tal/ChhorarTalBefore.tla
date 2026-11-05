---- MODULE ChhorarTalBefore ----
\* ছড়ার তালে (ছোটদের জন্য, ৩–৬): the round (ready → beat → rhyme pick → done), the beat loop and the window, where a
\* Space or Enter press lands, the spoken ছড়া, the daily limit and rest screen.
\* Mirrored from tools/chhorar-tal/components/chhorar-game.tsx (ChhorarGame: tap via the drum's onPointerDown and
\* onKeyDown, start, toRhyme, choose + its 1.8 s finish timer, finish, pickLevel, the done screen's আবার খেলো / শেষ,
\* the LevelGrid under the game); shared/game-kit.ts (useGameLoop: runs only while phase = "beat", stops on window
\* blur and on a hidden tab, restarts on focus or on visible-and-not-away); shared/kids-kit.tsx at 23fd7c1 (speak(), which runs only
\* when the phone has a Bangla voice; useKidsSession; RestScreen, now a modal; ParentGate); shared/game-ui.tsx + shared/game-sound.ts (SoundToggle → setSoundOn,
\* which since f4f75be cancels speech); shared/site-shell.tsx (PageFrame's related cards).
\* Abstractions: the ছড়া's two passes are two beat steps ("early" and "last line"). A wrong picture changes nothing
\* modelled. Taps count for stars but stars are left out (recordLevel keeps the higher). Hiding the tab also blurs
\* the window, and showing it focuses the window again (Chrome desktop and Android).
EXTENDS Naturals
VARIABLES phase, progress, win, focus, keyWent, voice, sound, speaking, lost, overLimit, resting
vars == <<phase, progress, win, focus, keyWent, voice, sound, speaking, lost, overLimit, resting>>

Phases == {"ready", "beat", "rhyme", "solved", "done", "idle"}
Free == ~resting /\ win = "here"
\* useGameLoop(step, draw, phase === "beat"): rAF runs only while the window has focus and the tab shows.
LoopRuns == phase = "beat" /\ win = "here"

\* start(level): a new run of the beat. It does not cancel speech.
Start == phase' = "beat" /\ progress' = 0

Init == /\ phase = "ready" /\ progress = 0 /\ win = "here" /\ focus = "body" /\ keyWent = "none"
        /\ voice \in BOOLEAN /\ sound = TRUE /\ speaking = FALSE /\ lost = FALSE
        /\ overLimit = FALSE /\ resting = FALSE

\* onPointerDown on the drum: in "ready" it starts the round; in "beat" it is a tap (on or off the beat).
\* A pointerdown on a <button> also focuses it.
YouTapTheDrum == /\ phase \in {"ready", "beat"} /\ Free
                 /\ focus' = "drum"
                 /\ IF phase = "ready" THEN Start /\ UNCHANGED keyWent ELSE UNCHANGED <<phase, progress, keyWent>>
                 /\ UNCHANGED <<win, voice, sound, speaking, lost, overLimit, resting>>
\* Space or Enter during the beat goes to whatever has focus. The drum's onKeyDown taps; a focused ছড়া button in the
\* LevelGrid is clicked (pickLevel → the ছড়া starts over); with nothing focused, Space scrolls the page.
YouPressSpace == /\ phase = "beat" /\ Free
                 /\ CASE focus = "drum" -> UNCHANGED <<progress, keyWent>>
                      [] focus = "level" -> progress' = 0 /\ keyWent' = "restart"
                      [] OTHER -> keyWent' = "scroll" /\ UNCHANGED <<progress>>
                 /\ UNCHANGED <<phase, win, focus, voice, sound, speaking, lost, overLimit, resting>>
\* LevelGrid onPick → pickLevel(n) → start(n), in any phase. clearTimeout(timer) drops a pending finish: the round was
\* won but is never recorded and atBreak() never runs. Chrome leaves focus on the clicked button.
YouPickAChhora == /\ Free
                  /\ Start /\ focus' = "level" /\ keyWent' = "none" /\ lost' = (phase = "solved")
                  /\ UNCHANGED <<win, voice, sound, speaking, overLimit, resting>>
\* The loop's step: the next beat (only while LoopRuns) ...
TheBeatMovesOn == /\ LoopRuns /\ progress = 0 /\ progress' = 1
                  /\ UNCHANGED <<phase, win, focus, keyWent, voice, sound, speaking, lost, overLimit, resting>>
\* ... and after the last beat, toRhyme(): the drum unmounts (focus falls to the page), the pictures show.
TheChhoraEnds == /\ LoopRuns /\ progress = 1
                 /\ phase' = "rhyme" /\ focus' = (IF focus = "drum" THEN "body" ELSE focus)
                 \* (the two key and lost marks are ghosts for the rules; they clear here so the model stays small)
                 /\ keyWent' = "none" /\ lost' = FALSE
                 /\ UNCHANGED <<progress, win, voice, sound, speaking, overLimit, resting>>
\* choose(answer): sfx.good; if soundOn() speak(the whole ছড়া), which only talks when a Bangla voice exists; 1.8 s timer.
YouTapTheRightPicture == /\ phase = "rhyme" /\ Free
                         /\ phase' = "solved" /\ speaking' = (voice /\ sound)
                         \* the tapped picture takes focus, and it unmounts with the done screen
                         /\ focus' = "body"
                         /\ UNCHANGED <<progress, win, keyWent, voice, sound, lost, overLimit, resting>>
\* The 1.8 s timer → finish(): record, chime, done screen, atBreak(). setTimeout fires in a hidden tab too.
TheRoundEnds == /\ phase = "solved"
                /\ phase' = "done" /\ resting' = overLimit
                /\ UNCHANGED <<progress, win, focus, keyWent, voice, sound, speaking, lost, overLimit>>
TheVoiceFinishes == /\ speaking /\ speaking' = FALSE
                    /\ UNCHANGED <<phase, progress, win, focus, keyWent, voice, sound, lost, overLimit, resting>>
\* The done screen: আবার খেলো → pickLevel(level) (its button unmounts, focus falls to the page); শেষ → idle.
YouPlayAgain == /\ phase = "done" /\ Free
                /\ Start /\ focus' = "body" /\ keyWent' = "none" /\ lost' = FALSE
                /\ UNCHANGED <<win, voice, sound, speaking, overLimit, resting>>
YouPressShesh == /\ phase = "done" /\ Free /\ phase' = "idle"
                 /\ UNCHANGED <<progress, win, focus, keyWent, voice, sound, speaking, lost, overLimit, resting>>
\* The window: another window takes focus, or the tab hides (both fire blur); coming back fires focus.
YouLeave == /\ win = "here" /\ phase \in {"beat", "solved"} /\ win' = "away"
            /\ UNCHANGED <<phase, progress, focus, keyWent, voice, sound, speaking, lost, overLimit, resting>>
YouComeBack == /\ win = "away" /\ win' = "here"
               /\ UNCHANGED <<phase, progress, focus, keyWent, voice, sound, speaking, lost, overLimit, resting>>
\* SoundToggle: setOn(!on). Since f4f75be, off also cancels scheduled notes and speechSynthesis.
\* Muting is modelled on the result, where it decides the voice; elsewhere it only silences one-shot tones.
SoundOff == /\ sound /\ Free /\ phase \in {"solved", "done"} /\ sound' = FALSE
            /\ UNCHANGED <<phase, progress, win, focus, keyWent, voice, speaking, lost, overLimit, resting>>
SoundOn == /\ ~sound /\ Free /\ sound' = TRUE
           /\ UNCHANGED <<phase, progress, win, focus, keyWent, voice, speaking, lost, overLimit, resting>>
\* The daily limit.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, progress, win, focus, keyWent, voice, sound, speaking, lost, resting>>
AParentGivesTenMinutes == /\ resting /\ win = "here" /\ resting' = FALSE /\ overLimit' = FALSE
                          /\ UNCHANGED <<phase, progress, win, focus, keyWent, voice, sound, speaking, lost>>
Next == YouTapTheDrum \/ YouPressSpace \/ YouPickAChhora \/ TheBeatMovesOn \/ TheChhoraEnds \/ YouTapTheRightPicture
        \/ TheRoundEnds \/ TheVoiceFinishes \/ YouPlayAgain \/ YouPressShesh
        \/ YouLeave \/ YouComeBack \/ SoundOff \/ SoundOn \/ TimeIsUp \/ AParentGivesTenMinutes

Spec == Init /\ [][Next]_vars

\* A phone without a Bangla voice is explored up to the rhyme pick, where it matters; past it, it plays like a phone
\* with a voice that never talks (TLC still checks every rule in the states at the bound).
NoVoiceUpToTheRhyme == voice \/ phase \in {"ready", "beat", "rhyme"}

TypeOK == /\ phase \in Phases /\ progress \in 0..1 /\ win \in {"here", "away"}
          /\ focus \in {"drum", "level", "body"} /\ keyWent \in {"none", "restart", "scroll"}
          /\ voice \in BOOLEAN /\ sound \in BOOLEAN /\ speaking \in BOOLEAN /\ lost \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* The reader's rules.
\* The beat stops while you're away: in another window or another tab.
PausedWhenAway == (phase = "beat" /\ win = "away") => ~LoopRuns
\* Space or Enter during the ছড়া plays the drum; it never starts the ছড়া over ...
SpaceNeverRestarts == keyWent # "restart"
\* ... and it never just scrolls the page.
SpaceReachesTheDrum == keyWent # "scroll"
\* The voice reads the ছড়া only on the result, with sound on, while you're on the page: not into the next ছড়া,
\* not after you mute, not while you're away.
VoiceOnlyOnTheResult == speaking => (phase \in {"solved", "done"} /\ sound /\ win = "here")
\* A round you finished is always recorded and checked against the daily limit.
EveryFinishCounts == ~lost
\* For ages 3–5 the rhyme pick can be done by picture and sound: the child hears the words to match.
NoReadingNeeded == phase = "rhyme" => voice
\* The kids' rules.
RestOnlyAtBreak == resting => phase \in {"done", "idle"}
====
