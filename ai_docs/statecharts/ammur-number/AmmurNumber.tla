---- MODULE AmmurNumber ----
\* আম্মুর নম্বর (ছোটদের জন্য, ৪–৮): the number set behind the gate, a round of pieces (the digits play and light, then
\* hide; the child dials them; a 1 s rest; the next, longer piece; the ring and a 1.7 s wait; the end screen), the
\* আবার দেখাও look, a held Enter key, the window, the spoken number, and the daily limit and rest screen.
\* Mirrored from tools/ammur-number/components/number-game.tsx (NumberGame: listen() and its setTimeouts,
\* stopListening, start, setNumber, tap → dial, lookAgain → peek, pickWho, the piece/end effect with its 1000 ms and
\* 1700 ms timers, the end screen's আবার খেলো / শেষ / পরের ধাপ, the সব ধাপ LevelGrid, SpeakButton on the rhyme line)
\* and tools/ammur-number/lib/game.ts (dial, nextPiece, peek, roundStars); shared/kids-kit.tsx at 23fd7c1 (useKidsSession,
\* RestScreen, now a modal, SpeakButton → speak(), which takes the first bn voice whatever its localService).
\* Abstractions: two pieces stand in for four, and the step is ধাপ ৩ (দেখে, তারপর লুকিয়ে: each piece plays once with
\* the digits showing, then they all hide), where the look matters most. A piece is dialled in one "right" step; misses
\* are left out (they change only the stars). Blur and hide are one "away" step: nothing in this game listens for
\* either. The parent gates are the shared kids-kit gate, modelled in ai_docs/statecharts/prithibi-ghuri/.
EXTENDS Naturals
CONSTANTS LookButtonHasAPicture
VARIABLES phase, piece, win, looked, held, charged, lost, sent, overLimit, resting
vars == <<phase, piece, win, looked, held, charged, lost, sent, overLimit, resting>>

\* setup: no number yet. listen: the digits play and light. typing: the child dials. pieceRest: the 1 s rest.
\* ringing: the whole number dialled, 1.7 s to the end screen. end, closed: the end screen and ফোন রেখে দিলাম.
Phases == {"setup", "listen", "typing", "pieceRest", "ringing", "end", "closed"}
Free == ~resting /\ win = "here"
InRound == phase \in {"listen", "typing", "pieceRest", "ringing"}

\* start(number, level): newRound, then listen(next, showFirst): the digits play while you may or may not be looking.
Start == /\ phase' = "listen" /\ piece' = 0 /\ looked' = (win = "here") /\ charged' = FALSE
         \* (the ghost marks for the rules clear with each round, so the model stays small)
         /\ sent' = FALSE

Init == /\ phase = "setup" /\ piece = 0 /\ win = "here" /\ looked = FALSE /\ held = FALSE /\ charged = FALSE
        /\ lost = FALSE /\ sent = FALSE /\ overLimit = FALSE /\ resting = FALSE

\* A parent opens নম্বর দাও (hold 2 s, the sum), types the number: setNumber → start; the gates re-key and close.
\* (নমুনা নম্বরে দেখো does the same with the demo number, no gate.)
AParentSetsTheNumber == /\ phase = "setup" /\ Free /\ Start /\ lost' = FALSE
                        /\ UNCHANGED <<win, held, overLimit, resting>>
\* The last digit's timer: setLit(null). The child may now dial.
ThePlaybackEnds == /\ phase = "listen" /\ phase' = "typing"
                   /\ UNCHANGED <<piece, win, looked, held, charged, lost, sent, overLimit, resting>>
\* tap() during the playback: stopListening(), then dial. The child chose to cut the look short.
\* tap() while typing: the piece is dialled (two pieces: a 1 s rest; the last: the ring).
\* (with the key let go: a finger tap moves focus to the digit, and a held key would repeat there instead)
YouDialThePiece == /\ phase \in {"listen", "typing"} /\ Free /\ ~held
                   /\ phase' = (IF piece = 0 THEN "pieceRest" ELSE "ringing") /\ looked' = FALSE /\ charged' = FALSE
                   /\ UNCHANGED <<piece, win, held, lost, sent, overLimit, resting>>
\* The [round, phase] effect, 1000 ms: nextPiece, listen(next). setTimeout runs whether or not anyone is looking.
TheNextPiecePlays == /\ phase = "pieceRest"
                     /\ phase' = "listen" /\ piece' = 1 /\ looked' = (win = "here") /\ charged' = FALSE
                     /\ UNCHANGED <<win, held, lost, sent, overLimit, resting>>
\* The same effect, 1700 ms after the ring: record stars, sfx.win, atBreak(), the end screen.
TheEndScreenComes == /\ phase = "ringing"
                     /\ phase' = "end" /\ resting' = overLimit
                     /\ UNCHANGED <<piece, win, looked, held, charged, lost, sent, overLimit>>
\* আবার দেখাও → lookAgain(): peek (helps + 1 while anything is hidden) and listen(next, true), also while a look
\* is already playing. A pointer press, or the first keydown of a held Enter.
LookAgain(isHeld) == /\ phase \in {"listen", "typing"} /\ Free
                     /\ charged' = (charged \/ phase = "listen")
                     /\ phase' = "listen" /\ looked' = TRUE /\ held' = isHeld
                     /\ UNCHANGED <<piece, win, lost, sent, overLimit, resting>>
YouTapLookAgain == ~held /\ LookAgain(FALSE)
YouHoldEnterOnLookAgain == ~held /\ LookAgain(TRUE)
\* Each auto-repeat keydown clicks the focused আবার দেখাও again: another help, the playback starts over.
TheKeyRepeats == held /\ LookAgain(TRUE)
YouLetGo == /\ held /\ held' = FALSE
            /\ UNCHANGED <<phase, piece, win, looked, charged, lost, sent, overLimit, resting>>
\* pickWho(other) (when both numbers are set) or a ধাপ in সব ধাপ: start() mid-round. In "ringing" the 1.7 s timer is
\* cleared: the number was dialled, but the round is never recorded and atBreak() never runs.
YouSwitchNumberOrStep == /\ InRound /\ Free /\ Start /\ lost' = (phase = "ringing")
                         /\ UNCHANGED <<win, held, overLimit, resting>>
\* The end screen: আবার খেলো or পরের ধাপ → start(); শেষ → closed (its আবার খেলো → start()).
YouPlayAgain == /\ phase \in {"end", "closed"} /\ Free /\ Start /\ lost' = FALSE
                /\ UNCHANGED <<win, held, overLimit, resting>>
YouPressShesh == /\ phase = "end" /\ Free /\ phase' = "closed"
                 /\ UNCHANGED <<piece, win, looked, held, charged, lost, sent, overLimit, resting>>
\* SpeakButton shows next to the rhyme line while the digits show; it appears only if the phone has a Bangla voice.
\* speak() takes the first bn voice, and Chrome's "Google" voices are network voices (localService = false):
\* the number's words go to the speech server.
YouTapTheSpeakerOnAPhoneWithANetworkVoice == /\ phase = "listen" /\ Free /\ sent' = TRUE
                                             /\ UNCHANGED <<phase, piece, win, looked, held, charged, lost, overLimit, resting>>
\* The window: no handler, so nothing pauses and nothing is released. Leaving is modelled where it changes what the
\* child sees: while the digits play, and in the 1 s rest before the next piece plays.
YouLeave == /\ win = "here" /\ phase \in {"listen", "pieceRest"} /\ win' = "away"
            /\ looked' = (looked /\ phase # "listen")
            /\ UNCHANGED <<phase, piece, held, charged, lost, sent, overLimit, resting>>
YouComeBack == /\ win = "away" /\ win' = "here"
               /\ UNCHANGED <<phase, piece, looked, held, charged, lost, sent, overLimit, resting>>
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, piece, win, looked, held, charged, lost, sent, resting>>
AParentGivesTenMinutes == /\ resting /\ win = "here" /\ resting' = FALSE /\ overLimit' = FALSE
                          /\ UNCHANGED <<phase, piece, win, looked, held, charged, lost, sent>>

Next == AParentSetsTheNumber \/ ThePlaybackEnds \/ YouDialThePiece \/ TheNextPiecePlays \/ TheEndScreenComes
        \/ YouTapLookAgain \/ YouHoldEnterOnLookAgain \/ TheKeyRepeats \/ YouLetGo \/ YouSwitchNumberOrStep
        \/ YouPlayAgain \/ YouPressShesh \/ YouTapTheSpeakerOnAPhoneWithANetworkVoice
        \/ YouLeave \/ YouComeBack \/ TimeIsUp \/ AParentGivesTenMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ piece \in 0..1 /\ win \in {"here", "away"} /\ looked \in BOOLEAN /\ held \in BOOLEAN
          /\ charged \in BOOLEAN /\ lost \in BOOLEAN /\ sent \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* The reader's rules.
\* The digits play and hide only while the child is on the page; nothing moves on while they're away.
NoProgressWhileAway == phase = "typing" => looked
\* One look costs one help: pressing আবার দেখাও again while the digits are already playing (a double tap, a held
\* Enter) doesn't charge again.
OneLookOneHelp == ~charged
\* A number you dialled to the end is always recorded and checked against the daily limit.
EveryFinishCounts == ~lost
\* The parent's number never leaves the phone.
NoChildData == ~sent
\* A 4–5 year old who missed the look gets it back by picture or sound, not by reading আবার দেখাও.
NoReadingNeeded == (phase = "typing" /\ ~looked) => LookButtonHasAPicture
\* The rest screen comes only between rounds.
RestOnlyAtBreak == resting => phase \in {"end", "closed"}
====
