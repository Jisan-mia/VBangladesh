---- MODULE SurBanaiSound ----
\* সুর বানাই: the beat and the site-wide sound switch. Mirrored from tools/sur-banai/components/game.tsx (run, halt, the beat's
\* setTimeout chain), tools/sur-banai/lib/sound.ts (playBeat → tone(): one-shot tones, no loop() and no cached audio node) and
\* shared/game-sound.ts (tone() reads soundOn() on every call; setSoundOn(false) also calls silenceScheduled()).
\* The game's screens are in SurBanai.tla; here only what the beat and the switch need.

VARIABLES playing, window, paused, sound, beatHeard
vars == <<playing, window, paused, sound, beatHeard>>

Init == playing = FALSE /\ window = "here" /\ paused = FALSE /\ sound = TRUE /\ beatHeard = FALSE

\* run(kind): the first beat sounds at once.
YouStartATune == /\ ~playing /\ window = "here" /\ ~paused /\ playing' = TRUE /\ beatHeard' = sound /\ UNCHANGED <<window, paused, sound>>
\* halt(): the timer is cleared and the last note is left to fade (or cut when sound goes off).
TheTuneStops == /\ playing /\ playing' = FALSE /\ beatHeard' = FALSE /\ UNCHANGED <<window, paused, sound>>
\* beat(): every beat playBeat() → tone(), silent only if soundOn() is false right now.
NextBeat == /\ playing /\ beatHeard' = sound /\ UNCHANGED <<playing, window, paused, sound>>
\* Blur and hide both call halt().
WindowBlurs == /\ window = "here" /\ window' = "away" /\ playing' = FALSE /\ beatHeard' = FALSE /\ UNCHANGED <<paused, sound>>
WindowFocuses == /\ window = "away" /\ window' = "here" /\ UNCHANGED <<playing, paused, sound, beatHeard>>
\* The player's menu: onPause → halt() + silenceScheduled().
PlayerPauses == /\ ~paused /\ paused' = TRUE /\ playing' = FALSE /\ beatHeard' = FALSE /\ UNCHANGED <<window, sound>>
PlayerResumes == /\ paused /\ paused' = FALSE /\ UNCHANGED <<playing, window, sound, beatHeard>>
\* The switch in the player's menu. Since f4f75be it also cuts notes already handed to the audio clock.
SoundOff == /\ sound /\ sound' = FALSE /\ beatHeard' = FALSE /\ UNCHANGED <<playing, window, paused>>
SoundOn == /\ ~sound /\ sound' = TRUE /\ UNCHANGED <<playing, window, paused, beatHeard>>

Next == YouStartATune \/ TheTuneStops \/ NextBeat \/ WindowBlurs \/ WindowFocuses \/ PlayerPauses \/ PlayerResumes \/ SoundOff \/ SoundOn

Spec == Init /\ [][Next]_vars

TypeOK == /\ playing \in BOOLEAN /\ window \in {"here", "away"} /\ paused \in BOOLEAN /\ sound \in BOOLEAN /\ beatHeard \in BOOLEAN

\* A beat makes sound only when sound is on: sound off means silent, at once, notes already ringing included (SilentWhenMuted).
BeatOnlyWithSound == beatHeard => sound
\* Turning sound back on is heard on the next beat: nothing is cached silent, so there is no stub to replace (LoopComesBack).
LoopComesBack == (playing /\ sound) => ENABLED (NextBeat /\ beatHeard')
\* The beat never runs in another window or under the menu.
NoBeatAwayOrPaused == playing => (window = "here" /\ ~paused)
====
