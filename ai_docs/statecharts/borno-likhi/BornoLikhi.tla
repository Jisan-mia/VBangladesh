---- MODULE BornoLikhi ----
\* বর্ণ লিখি after the rewrite: the screens (cover, set list, letters, end card), the finger and the keyboard's pen, the
\* player's pause, going away and coming back, a key held through a result, the kids' daily limit and rest screen.
\* The parent gate is the shared kit's (same as kar-chinho's KarChinhoGates.tla), so it isn't repeated here. Mirrored from:
\*   tools/borno-likhi/lib/session.ts      begin, touchDown/touchMove/touchUp, letterDone, goNext, writeAgain, pause, resume,
\*                                         blur, toTitle, openLevels/closeLevels, freshKey, route
\*   tools/borno-likhi/lib/trace.ts        a stroke is written only by a finger or the pen following the path (no key finishes one)
\*   tools/borno-likhi/components/likhi-game.tsx   begin() and the last letter ask kids.atBreak(); the last letter records the
\*                                         stars in the same touch; onPause/onResume/onRestart/onLevels; keys at window
\*   shared/kids-kit.tsx                   useKidsSession rests on mount past the limit; RestScreen is a real modal
\* Two letters stand in for a set (letterNo 1..2; the second is the last). A middle stroke changes nothing the rules read,
\* so only the stroke that finishes a letter is a step. The keyboard's pen (arrow keys) writes through the same move() rules as
\* a finger, so it is the same step and isn't drawn twice. Writing the last letter again is BornoLikhiLast.tla. No voice
\* anywhere on the site, so the old SilentWhenMuted rule is gone.
EXTENDS Naturals
VARIABLES screen, back, phase, letterNo, finished, records, begun,    \* the set
          pointer, paused, away, swallow,                             \* the hand, the menu, away and back
          moved, skipped, woke,                                        \* traps: a step the rules forbid
          overLimit, resting                                          \* the daily limit
set == <<screen, back, phase, letterNo, finished, records, begun>>
hand == <<pointer, paused, away, swallow>>
trap == <<moved, skipped, woke>>
kids == <<overLimit, resting>>
vars == <<set, hand, trap, kids>>

\* RestScreen renders on every screen but play (game.tsx: kids.resting && screen !== 'play') and covers the rest.
RestShows == resting /\ screen # "play"
Free == ~RestShows /\ ~paused
\* The board takes a touch or a pen only while a letter is being traced and nothing covers it.
Tracing == screen = "play" /\ phase = "tracing" /\ Free

Init == /\ screen = "cover" /\ back = "cover" /\ phase = "tracing" /\ letterNo = 1 /\ finished = FALSE /\ records = 0 /\ begun = "inTime"
        /\ pointer = FALSE /\ paused = FALSE /\ away = FALSE /\ swallow = FALSE
        /\ moved = FALSE /\ skipped = FALSE /\ woke = FALSE
        /\ overLimit \in BOOLEAN /\ resting = overLimit   \* useKidsSession: past today's limit the page opens resting

\* begin(): খেলো on the cover, আবার খেলো, Enter on the cover or a fresh Enter on the end card. atBreak() first: past the
\* limit, the rest screen instead and nothing starts.
YouStartASet == /\ screen \in {"cover", "end"} /\ Free
                /\ IF overLimit
                   THEN /\ resting' = TRUE /\ UNCHANGED <<screen, phase, letterNo, finished, records, begun>>
                   ELSE /\ screen' = "play" /\ phase' = "tracing" /\ letterNo' = 1 /\ finished' = FALSE /\ records' = 0
                        /\ resting' = FALSE /\ begun' = "inTime"
                /\ pointer' = FALSE /\ swallow' = FALSE
                /\ UNCHANGED <<back, paused, away, trap, overLimit>>

\* The set list opens from the cover or the end card, or from the player's menu while a letter is on the board (onLevels:
\* the menu closes, then the list opens). The finger is released. ← goes back to where it came from.
YouOpenTheSetList == /\ screen \in {"cover", "end"} /\ Free
                     /\ screen' = "levels" /\ back' = screen
                     /\ UNCHANGED <<phase, letterNo, finished, records, begun, hand, trap, kids>>
YouOpenTheSetListFromTheMenu == /\ screen = "play" /\ paused /\ ~RestShows
                                /\ screen' = "levels" /\ back' = "play" /\ paused' = FALSE /\ pointer' = FALSE /\ swallow' = FALSE
                                /\ UNCHANGED <<phase, letterNo, finished, records, begun, away, trap, kids>>
YouGoBackFromTheList == /\ screen = "levels" /\ screen' = back /\ swallow' = FALSE
                        /\ UNCHANGED <<back, phase, letterNo, finished, records, begun, pointer, paused, away, trap, kids>>
YouPickASet == /\ screen = "levels" /\ ~paused
               /\ IF overLimit
                  THEN /\ resting' = TRUE /\ screen' = "cover" /\ UNCHANGED <<phase, letterNo, finished, records, begun>>
                  ELSE /\ screen' = "play" /\ phase' = "tracing" /\ letterNo' = 1 /\ finished' = FALSE /\ records' = 0
                       /\ resting' = FALSE /\ begun' = "inTime"
               /\ pointer' = FALSE /\ swallow' = FALSE
               /\ UNCHANGED <<back, paused, away, trap, overLimit>>

\* touchDown(): the first pointer only, only while tracing. After coming back, the first tap only wakes the game; so does a
\* tap that arrives while the window still counts as away (the click that brings focus back comes before its focus event).
YouTouchTheBoard == /\ Tracing /\ ~pointer
                    /\ IF swallow \/ away THEN swallow' = FALSE /\ UNCHANGED pointer ELSE pointer' = TRUE /\ UNCHANGED swallow
                    /\ UNCHANGED <<set, paused, away, trap, kids>>
\* The finger moves along the path and writes the letter's last stroke. On the set's last letter this is the win: the stars
\* are recorded and atBreak() asked in this very touch (letterDone). A second completion of the same letter records nothing.
FinishLetter == /\ phase' = "drawn"
                /\ finished' = (letterNo = 2)
                /\ records' = IF letterNo = 2 /\ records = 0 THEN 1 ELSE records
                /\ resting' = IF letterNo = 2 /\ records = 0 THEN overLimit ELSE resting
YouTraceTheLastStroke == /\ Tracing /\ pointer /\ ~away /\ FinishLetter /\ pointer' = FALSE
                         /\ UNCHANGED <<screen, back, letterNo, begun, paused, away, swallow, trap, overLimit>>
YouLiftYourFinger == /\ pointer /\ pointer' = FALSE
                     /\ UNCHANGED <<set, paused, away, swallow, trap, kids>>
\* Enter or Space while a letter is being traced only replays the moving dot: no state of the game changes, and no stroke
\* is written. (The old board wrote a stroke here.) It is a step so the model shows it does nothing.
YouPressEnterOnTheBoard == /\ Tracing /\ UNCHANGED vars

\* → on the picture (goNext): the next letter, or after the last the end card. Not under the rest screen or the menu.
YouTapNext == /\ screen = "play" /\ phase = "drawn" /\ Free /\ ~pointer
              /\ IF letterNo = 2 THEN screen' = "end" /\ UNCHANGED <<phase, letterNo>> ELSE phase' = "tracing" /\ letterNo' = 2 /\ UNCHANGED screen
              /\ UNCHANGED <<back, finished, records, begun, hand, trap, kids>>
\* শেষ on the end card, or নতুন করে শুরু from the player's menu: back to the cover. Nothing starts by itself.
YouGoBackToTheCover == /\ (paused \/ (screen = "end" /\ Free))
                       /\ screen' = "cover" /\ phase' = "tracing" /\ paused' = FALSE /\ pointer' = FALSE /\ swallow' = FALSE
                       /\ UNCHANGED <<back, letterNo, finished, records, begun, away, trap, kids>>

\* ---------- away and back ----------
\* The window's own blur (or the tab hiding): the game releases the finger and arms the swallow.
WindowBlurs == /\ ~away /\ away' = TRUE /\ pointer' = FALSE /\ swallow' = (screen = "play" /\ phase = "tracing")
               /\ UNCHANGED <<set, paused, trap, kids>>
WindowFocuses == /\ away /\ away' = FALSE
                 /\ UNCHANGED <<set, pointer, paused, swallow, trap, kids>>
\* The player's menu: ⏸, P, Escape, blur or hide. The finger is released; nothing writes while it is open.
PlayerMenuOpens == /\ ~paused /\ paused' = TRUE /\ pointer' = FALSE
                   /\ UNCHANGED <<set, away, swallow, trap, kids>>
YouResume == /\ paused /\ paused' = FALSE /\ swallow' = FALSE
             /\ UNCHANGED <<set, pointer, away, trap, kids>>

\* ---------- the daily limit ----------
TimeIsUp == /\ ~overLimit /\ overLimit' = TRUE
            /\ UNCHANGED <<set, hand, trap, resting>>
\* A reload, or opening the game from the kids' hub: the cover, resting if past the limit.
ThePageOpens == /\ screen' = "cover" /\ phase' = "tracing" /\ letterNo' = 1 /\ finished' = FALSE /\ records' = 0
                /\ pointer' = FALSE /\ paused' = FALSE /\ away' = FALSE /\ swallow' = FALSE
                /\ resting' = overLimit
                /\ UNCHANGED <<back, begun, trap, overLimit>>
\* A grown-up's আজ আরও ১০ মিনিট on the rest screen (who can reach it is the kit's gate, as in KarChinhoGates.tla).
TenMoreMinutes == /\ RestShows /\ overLimit' = FALSE /\ resting' = FALSE /\ UNCHANGED <<set, hand, trap>>

Next == YouStartASet \/ YouOpenTheSetList \/ YouOpenTheSetListFromTheMenu \/ YouGoBackFromTheList \/ YouPickASet
        \/ YouTouchTheBoard \/ YouTraceTheLastStroke \/ YouLiftYourFinger \/ YouPressEnterOnTheBoard
        \/ YouTapNext \/ YouGoBackToTheCover
        \/ WindowBlurs \/ WindowFocuses \/ PlayerMenuOpens \/ YouResume
       
        \/ TimeIsUp \/ ThePageOpens \/ TenMoreMinutes

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in {"cover", "play", "end", "levels"} /\ back \in {"cover", "play", "end"} /\ phase \in {"tracing", "drawn"}
          /\ letterNo \in 1..2 /\ finished \in BOOLEAN /\ records \in 0..2 /\ begun \in {"inTime", "late"}
          /\ pointer \in BOOLEAN /\ paused \in BOOLEAN /\ away \in BOOLEAN /\ swallow \in BOOLEAN
          /\ moved \in BOOLEAN /\ skipped \in BOOLEAN /\ woke \in BOOLEAN
          /\ overLimit \in BOOLEAN /\ resting \in BOOLEAN

\* ---- the reader's rules ----
\* After you leave the window or the menu opens, no finger counts as on the board (bug 1).
InputReleasedWhenAway == pointer => (~away /\ ~paused)
\* Enter and Space never write a stroke: only a finger or the pen following the path does (bug 2 and the Enter-cheat gap).
EnterNeverWritesAStroke == ~skipped
\* A move or a pen step under the pause menu or while away writes nothing.
NothingWritesUnderTheMenu == ~moved
\* The first tap back after being away only wakes the game; it never writes.
TapBackIsNotAStroke == ~woke
\* The rest screen comes only between rounds, never over a letter.
RestOnlyAtBreak == RestShows => screen # "play"
\* Once today's time is up, no new set starts without the rest screen first.
NoNewRoundPastLimit == begun = "inTime"
\* Every finished set counts: once the last letter is written, its stars are saved and the limit checked, whatever comes next.
EveryFinishCounts == finished => records >= 1
\* The set list is a choice screen: no finger is on the board under it.
ChoiceFreezesPlay == screen = "levels" => ~pointer
====
