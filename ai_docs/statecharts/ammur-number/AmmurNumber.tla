---- MODULE AmmurNumber ----
\* আম্মুর নম্বর (ছোটদের জন্য, ৪–৮), after the rewrite. The title (the parent's form behind the gate, খেলো), a round of pieces (the look:
\* the digits play and light, then hide; the child dials a piece; the rest; the next, longer piece; the whole number rings; the end
\* screen), the eye key, the window and the player's menu, the parent's tick to keep the number on this phone, and the daily limit.
\* Mirrored from tools/ammur-number/lib/session.ts (begin, lookDone, tapKey, askLook, dialled, restDone, ringDone, pause/blur,
\* toTitle), lib/play.ts (look, dial, nextPiece), lib/saved.ts, and the beat effect in components/game.tsx, which starts a beat's timer
\* only while nobody is away and clears it on pause or blur; coming back starts the beat again from its first digit.
\* shared/kids-kit.tsx at the same commit (useKidsSession, RestScreen).
\* Abstractions: two pieces stand for four; the model is the hidden worlds, where every piece opens with the look; a piece is dialled in
\* one step; misses are left out (they change only the stars). "away" stands for a blurred window, a hidden tab and the player's
\* open menu: they hold the game the same way. The gates are the shared kids-kit gate, modelled in ai_docs/statecharts/prithibi-ghuri/.
EXTENDS Naturals
CONSTANTS LookButtonHasAPicture
VARIABLES phase, piece, win, looked, charged, recorded, keep, stored, overLimit, resting
vars == <<phase, piece, win, looked, charged, recorded, keep, stored, overLimit, resting>>

\* title: no round. look: the digits play and light. dial: the child dials. rest: a piece is dialled, the next comes.
\* ring: the whole number dialled, the round already recorded. end: the end screen.
Phases == {"title", "look", "dial", "rest", "ring", "end"}
InRound == phase \in {"look", "dial", "rest", "ring"}
Free == ~resting /\ win = "here"

Init == /\ phase = "title" /\ piece = 0 /\ win = "here" /\ looked = FALSE /\ charged = FALSE /\ recorded = FALSE
        /\ keep = FALSE /\ stored = FALSE /\ overLimit = FALSE /\ resting = FALSE

\* The form behind নম্বর দাও (hold 2 s, the sum): the number goes to page memory; the tick decides whether this phone's storage keeps it.
AParentSetsTheNumber(tick) == /\ phase = "title" /\ Free /\ keep' = tick /\ stored' = tick
                              /\ UNCHANGED <<phase, piece, win, looked, charged, recorded, overLimit, resting>>
\* নম্বর মুছে দাও: the page's copy and the stored one both go.
AParentClearsTheNumber == /\ phase = "title" /\ Free /\ keep' = FALSE /\ stored' = FALSE
                          /\ UNCHANGED <<phase, piece, win, looked, charged, recorded, overLimit, resting>>
\* begin(): atBreak() first; past the limit nothing starts and the rest screen shows.
YouPlay == /\ phase \in {"title", "end"} /\ Free /\ ~overLimit
           /\ phase' = "look" /\ piece' = 0 /\ looked' = FALSE /\ charged' = FALSE /\ recorded' = FALSE
           /\ UNCHANGED <<win, keep, stored, overLimit, resting>>
YouPlayPastTheLimit == /\ phase \in {"title", "end"} /\ Free /\ overLimit /\ resting' = TRUE
                       /\ UNCHANGED <<phase, piece, win, looked, charged, recorded, keep, stored, overLimit>>
\* The beat effect: the last light goes out, lookDone() (only while nobody is away).
TheLookEnds == /\ phase = "look" /\ win = "here" /\ phase' = "dial" /\ looked' = (win = "here")
               /\ UNCHANGED <<piece, win, charged, recorded, keep, stored, overLimit, resting>>
\* tapKey() while the look plays: ignored. The look is never cut short.
YouTapADigitWhileTheDigitsPlay == /\ phase = "look" /\ Free /\ UNCHANGED vars
\* askLook() while the look plays: ignored, never charged again (a double tap, a held Enter).
YouTapTheEyeWhileTheDigitsPlay == /\ phase = "look" /\ Free /\ UNCHANGED vars
\* askLook() while dialling: one look, which plays from its first digit.
YouTapTheEye == /\ phase = "dial" /\ Free /\ phase' = "look" /\ looked' = FALSE
                /\ UNCHANGED <<piece, win, charged, recorded, keep, stored, overLimit, resting>>
\* dial() the last digit of the first piece: dialled(): the rest.
YouDialTheFirstPiece == /\ phase = "dial" /\ piece = 0 /\ Free /\ phase' = "rest" /\ looked' = FALSE
                        /\ UNCHANGED <<piece, win, charged, recorded, keep, stored, overLimit, resting>>
\* The last digit of the whole number: dialled(): ring, recorded and atBreak() at this very tap.
YouDialTheWholeNumber == /\ phase = "dial" /\ piece = 1 /\ Free /\ phase' = "ring" /\ looked' = FALSE
                         /\ recorded' = TRUE /\ resting' = overLimit
                         /\ UNCHANGED <<piece, win, charged, keep, stored, overLimit>>
\* The beat effect, 1000 ms: restDone(), nextPiece, the look again (only while nobody is away).
TheNextPiecePlays == /\ phase = "rest" /\ win = "here" /\ phase' = "look" /\ piece' = 1 /\ looked' = FALSE
                     /\ UNCHANGED <<win, charged, recorded, keep, stored, overLimit, resting>>
\* The beat effect, 1600 ms after the ring: ringDone(), the end screen (only while nobody is away).
TheEndScreenComes == /\ phase = "ring" /\ win = "here" /\ phase' = "end"
                     /\ UNCHANGED <<piece, win, looked, charged, recorded, keep, stored, overLimit, resting>>
\* ⟳ in the player, শেষ, or the pause menu's নতুন করে শুরু / সব লেভেল: toTitle(). The menu closes.
YouRestart == /\ phase # "title" /\ phase' = "title" /\ win' = "here" /\ looked' = FALSE
              /\ UNCHANGED <<piece, charged, recorded, keep, stored, overLimit, resting>>
\* blur, hide, or ⏸ / P / Escape: the beat's timers are cleared.
YouLeave == /\ win = "here" /\ win' = "away"
            /\ UNCHANGED <<phase, piece, looked, charged, recorded, keep, stored, overLimit, resting>>
\* focus or চালিয়ে যাও: the beat starts again from its first digit; the phase is what it was.
YouComeBack == /\ win = "away" /\ win' = "here"
               /\ UNCHANGED <<phase, piece, looked, charged, recorded, keep, stored, overLimit, resting>>
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<phase, piece, win, looked, charged, recorded, keep, stored, resting>>
AParentGivesTenMinutes == /\ resting /\ win = "here" /\ resting' = FALSE /\ overLimit' = FALSE
                          /\ UNCHANGED <<phase, piece, win, looked, charged, recorded, keep, stored>>

Next == AParentSetsTheNumber(TRUE) \/ AParentSetsTheNumber(FALSE) \/ AParentClearsTheNumber \/ YouPlay \/ YouPlayPastTheLimit
        \/ TheLookEnds \/ YouTapADigitWhileTheDigitsPlay \/ YouTapTheEyeWhileTheDigitsPlay \/ YouTapTheEye
        \/ YouDialTheFirstPiece \/ YouDialTheWholeNumber \/ TheNextPiecePlays \/ TheEndScreenComes \/ YouRestart
        \/ YouLeave \/ YouComeBack \/ TimeIsUp \/ AParentGivesTenMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in Phases /\ piece \in 0..1 /\ win \in {"here", "away"} /\ looked \in BOOLEAN /\ charged \in BOOLEAN
          /\ recorded \in BOOLEAN /\ keep \in BOOLEAN /\ stored \in BOOLEAN /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* The reader's rules.
\* The digits play and hide only while the child is on the page: dialling starts only after a look that was seen.
NoProgressWhileAway == phase = "dial" => looked
\* While away, no beat moves: the phase, the piece and the look stay as they were (the only exit is the menu's restart, which comes back first).
AwayFreezes == [][(win = "away" /\ win' = "away") => UNCHANGED <<phase, piece, looked>>]_vars
\* One look costs one help: a look already playing is never charged again (a double tap, a held Enter).
OneLookOneHelp == ~charged
\* A number dialled to the end is always recorded and checked against the daily limit, at the last digit.
EveryFinishCounts == phase \in {"ring", "end"} => recorded
\* The number is kept on this phone only when a parent ticked keep, and forgotten when a parent clears it.
StoredOnlyWhenKept == stored => keep
\* A 4–5 year old who missed the look gets it back by picture or sound: the eye key is a picture, and the ghost finger points to it.
NoReadingNeeded == (phase = "dial" /\ ~looked) => LookButtonHasAPicture
\* The rest screen comes only between rounds: it can be owed during the ring, and shows from the end screen.
RestOnlyAtBreak == resting => phase \in {"title", "ring", "end"}
====
