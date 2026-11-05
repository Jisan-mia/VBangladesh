---- MODULE SatTukro ----
\* সাত টুকরো after the rewrite (branch games-to-the-bar), mirrored from:
\*   tools/sat-tukro/lib/session.ts          begin, pressTable, finished, timerFires/timerMayRun, pause, resume, blur, toTitle,
\*                                           openLevels, closeLevels, pickFromList, freshKey
\*   tools/sat-tukro/components/game.tsx     begin() asks kids.atBreak(); landed() records the stars at the last drop; the
\*                                           cheer timer; useGamePlayer(onPause, onResume, onRestart, onLevels); keys at window
\*   tools/sat-tukro/components/table.tsx    onDown/onMove/onUp/cancel: the hand is dropped on blur, hide, pointercancel,
\*                                           lost capture and a mouse move with no button; a stale press is replaced
\*   shared/kids-kit.tsx                     useKidsSession().atBreak(), RestScreen (a real modal), ParentGate, ShareToolLink
\* Two pieces stand for the seven. "paused" is the player's menu, which opens on blur and hide too. No sound loop and no voice,
\* so sound is not modelled. The child's view has no link out: the only exits are behind the parent gate.
EXTENDS Naturals
CONSTANTS N
VARIABLES screen, back, placed, pending, finished, recorded, begun,   \* the picture
          grip, finger, focused, paused, swallow, moved,              \* hand and window
          overLimit, resting, lost, exit, sent, stored

vars == <<screen, back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>

RestShows == resting /\ screen # "play"          \* game.tsx: kids.resting && screen !== 'play'
Free == exit = "none" /\ ~RestShows /\ ~paused /\ focused

Init == /\ screen = "title" /\ back = "title" /\ placed = 0 /\ pending = FALSE /\ finished = FALSE /\ recorded = FALSE /\ begun = "inTime"
        /\ grip = FALSE /\ finger = FALSE /\ focused = TRUE /\ paused = FALSE /\ swallow = FALSE /\ moved = FALSE
       
        /\ overLimit \in BOOLEAN /\ resting = overLimit        \* useKidsSession: past today's limit the page opens resting
        /\ lost = FALSE /\ exit = "none" /\ sent = FALSE /\ stored = FALSE

\* begin(): খেলো, আবার খেলো, Enter, or a picture from the list. atBreak() first: past the limit, the rest screen instead.
Begins == IF overLimit
          THEN /\ resting' = TRUE /\ UNCHANGED <<screen, placed, pending, finished, recorded, begun>>
          ELSE /\ screen' = "play" /\ placed' = 0 /\ pending' = FALSE /\ finished' = FALSE /\ recorded' = FALSE /\ resting' = FALSE
               /\ begun' = "inTime"

YouStartAPicture == /\ screen \in {"title", "end"} /\ Free /\ ~grip
                    /\ Begins /\ swallow' = FALSE
                    /\ UNCHANGED <<back, grip, finger, focused, paused, moved, overLimit, lost, exit, sent, stored>>
YouPlayAgain == YouStartAPicture      \* আবার খেলো is begin() of the same picture: the same step in the model

\* table.onDown: only the primary pointer, no press in flight, never a placed piece; the first press back only wakes.
YouPressAPiece == /\ screen = "play" /\ Free /\ ~pending /\ ~grip /\ ~finger /\ placed < N
                  /\ IF swallow THEN /\ swallow' = FALSE /\ UNCHANGED <<grip, finger>>
                     ELSE /\ grip' = TRUE /\ finger' = TRUE /\ UNCHANGED swallow
                  /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, focused, paused, moved, overLimit, resting, lost, exit, sent, stored>>
\* The piece lands. The last one finishes the picture at this very drop: stars saved, the limit checked (landed(), S.finished).
YouDropItInPlace == /\ grip /\ finger /\ screen = "play" /\ focused /\ ~paused /\ placed < N
                    /\ placed' = placed + 1 /\ grip' = FALSE /\ finger' = FALSE
                    /\ IF placed + 1 = N
                       THEN /\ pending' = TRUE /\ finished' = TRUE /\ recorded' = TRUE /\ resting' = overLimit
                       ELSE UNCHANGED <<pending, finished, recorded, resting>>
                    /\ UNCHANGED <<screen, back, begun, focused, paused, swallow, moved, overLimit, lost, exit, sent, stored>>
YouDropItWrong == /\ grip /\ finger /\ focused /\ ~paused /\ screen = "play"
                  /\ grip' = FALSE /\ finger' = FALSE
                  /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>
TouchIsCancelled == /\ grip /\ grip' = FALSE /\ finger' = FALSE
                    /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>

\* The window blurs or the tab hides: the player's menu opens, the table lets go of the piece (a glide home), the cheer timer
\* freezes, and the first press back only wakes the game.
WindowBlurs == /\ focused /\ focused' = FALSE /\ grip' = FALSE /\ paused' = TRUE /\ swallow' = (screen = "play")
               /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, finger, moved, overLimit, resting, lost, exit, sent, stored>>
\* The button or finger comes up while another window has it: the table never sees pointerup, and holds nothing anyway.
YouLetGoAway == /\ finger /\ ~focused /\ finger' = FALSE
                /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>
WindowFocuses == /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, finger, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>
\* The player's ⏸, P or Esc.
YouPause == /\ ~paused /\ paused' = TRUE /\ grip' = FALSE /\ swallow' = (screen = "play")
            /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, finger, focused, moved, overLimit, resting, lost, exit, sent, stored>>
\* চালিয়ে যাও.
YouResume == /\ paused /\ focused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, finger, focused, moved, overLimit, resting, lost, exit, sent, stored>>
\* নতুন করে শুরু from the menu: back to the title; the cheer timer is cleared.
YouRestartFromTheMenu == /\ paused /\ screen' = "title" /\ pending' = FALSE /\ paused' = FALSE /\ swallow' = FALSE /\ grip' = FALSE
                         /\ UNCHANGED <<back, placed, finished, recorded, begun, finger, focused, moved, overLimit, resting, lost, exit, sent, stored>>

\* timerFires() runs only when timerMayRun(): the menu shut. `moved` would record a step taken under the menu.
CheerEnds == /\ pending /\ ~paused /\ screen = "play"
             /\ pending' = FALSE /\ screen' = "end" /\ moved' = (moved \/ paused)
             /\ UNCHANGED <<back, placed, finished, recorded, begun, grip, finger, focused, paused, swallow, overLimit, resting, lost, exit, sent, stored>>

\* The picture list, from the title, the end screen or mid-picture (the player's সব লেভেল, or the title chip). During the cheer
\* it lets the end screen come first: the picture is done and its stars are saved.
YouOpenThePictures == /\ screen \in {"title", "end", "play"} /\ Free /\ ~finger
                      /\ IF screen = "play" /\ pending
                         THEN /\ back' = "end" /\ pending' = FALSE
                         ELSE /\ back' = screen /\ UNCHANGED pending
                      /\ screen' = "levels" /\ grip' = FALSE
                      /\ UNCHANGED <<placed, finished, recorded, begun, finger, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>
\* ফিরে যাও: nothing changes.
YouGoBack == /\ screen = "levels" /\ Free /\ screen' = back /\ swallow' = FALSE
             /\ UNCHANGED <<back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, moved, overLimit, resting, lost, exit, sent, stored>>
\* The picture being built, tapped in the list: pickFromList() answers 'resume', and the pieces stay.
YouPickThisPicture == /\ screen = "levels" /\ Free /\ back = "play" /\ screen' = "play" /\ swallow' = FALSE
                      /\ UNCHANGED <<back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, moved, overLimit, resting, lost, exit, sent, stored>>
\* Any other picture, or any picture from the title or end screen: begin().
YouPickAnotherPicture == /\ screen = "levels" /\ Free /\ \/ back # "play" \/ TRUE
                         /\ Begins /\ swallow' = FALSE
                         /\ UNCHANGED <<back, grip, finger, focused, paused, moved, overLimit, lost, exit, sent, stored>>
\* শেষ: the title; nothing starts by itself.
YouPressShesh == /\ screen = "end" /\ Free /\ screen' = "title"
                 /\ UNCHANGED <<back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, swallow, moved, overLimit, resting, lost, exit, sent, stored>>

\* useKidsSession's tick pushes today's time past the limit, at any moment.
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, swallow, moved, resting, lost, exit, sent, stored>>
\* A grown-up's আজ আরও ১০ মিনিট behind the gate on the rest screen.
ParentGivesMoreTime == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE
                       /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, swallow, moved, lost, exit, sent, stored>>
\* The grown-ups' row on the title: the gate (a hold, then a sum), then the plain link or the print sheet.
ParentOpensThePrintSheetOrShares == /\ screen = "title" /\ Free /\ ~finger /\ exit' = "share"
                                    /\ UNCHANGED <<screen, back, placed, pending, finished, recorded, begun, grip, finger, focused, paused, swallow, moved, overLimit, resting, lost, sent, stored>>
Done == exit # "none" /\ UNCHANGED vars

Next == YouStartAPicture \/ YouPressAPiece \/ YouDropItInPlace \/ YouDropItWrong \/ TouchIsCancelled \/ WindowBlurs \/ YouLetGoAway
        \/ WindowFocuses \/ YouPause \/ YouResume \/ YouRestartFromTheMenu \/ CheerEnds \/ YouOpenThePictures \/ YouGoBack
        \/ YouPickThisPicture \/ YouPickAnotherPicture \/ YouPressShesh
        \/ TimeIsUp \/ ParentGivesMoreTime \/ ParentOpensThePrintSheetOrShares \/ Done

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"title", "play", "end", "levels"} /\ back \in {"title", "play", "end"} /\ placed \in 0..N
          /\ pending \in BOOLEAN /\ finished \in BOOLEAN /\ recorded \in BOOLEAN /\ begun \in {"inTime", "late"}
          /\ grip \in BOOLEAN /\ finger \in BOOLEAN /\ focused \in BOOLEAN /\ paused \in BOOLEAN /\ swallow \in BOOLEAN /\ moved \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN /\ lost \in BOOLEAN
          /\ exit \in {"none", "share", "site"} /\ sent \in BOOLEAN /\ stored \in BOOLEAN

\* What a child must tap to go on, per screen: each is a picture (a piece, a ↻ and a ✓ at 112 px, a thumbnail and a ← at 64 px).
Needed == CASE screen = "play"   -> {"piece"}
          []   screen = "end"    -> {"again", "shesh"}
          []   screen = "levels" -> {"thumbnail", "back"}
          []   screen = "title"  -> {"board"}
Pictured == {"piece", "again", "shesh", "thumbnail", "back", "board"}

\* ---- the reader's rules ----
InputReleasedWhenAway == ~focused => ~grip
ChoiceFreezesPlay == screen = "levels" => ~pending
FinishCounts == finished => recorded
PickerKeepsWork == ~lost
RestOnlyAtBreak == RestShows => screen # "play"
NoNewRoundPastLimit == begun = "inTime"
NothingMovesUnderTheMenu == ~moved
ParentGate == exit # "site"
NoNetwork == ~sent
NoChildData == ~stored
NoReadingNeeded == Needed \subseteq Pictured
====
