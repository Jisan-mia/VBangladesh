---- MODULE PakaKancha ----
\* পাকা-কাঁচা: one code game (typing, checking, result), where the keyboard focus sits, the levels and their stars,
\* the friend's link that opens the page, and the delayed cheer.
\* Mirrored from tools/paka-kancha/components/code-game.tsx (press, start, playLevel, the onKey effect,
\* the guesses.length effect), shared/game-ui.tsx (LevelGrid) and shared/game-core.ts (recordLevel, unlockedLevel).
\* Abstractions: 2 levels, 1 try a game (every check ends it; more tries only repeat the typing loop),
\* a typed row is empty / part / full, a clear earns 1 or 2 stars. The daily code and the seeded "আরেকবার"
\* code type and check the same way but record no stars, so they are left out. No sound loops: only one-shot sounds.
EXTENDS Naturals
VARIABLES link, level, guesses, input, won, focus, enter, stars, recorded, cheer
vars == <<link, level, guesses, input, won, focus, enter, stars, recorded, cheer>>

Levels == 1..2
Tries == 1
Max(a, b) == IF a > b THEN a ELSE b
\* unlockedLevel(): one past the highest level with stars, never above the last.
Unlocked == IF stars[2] > 0 THEN 2 ELSE IF stars[1] > 0 THEN 2 ELSE 1
Over == won \/ guesses = Tries
Fresh(l) == /\ level' = l /\ guesses' = 0 /\ input' = "none" /\ won' = FALSE /\ recorded' = 0 /\ cheer' = FALSE
Grow == IF input = "none" THEN "part" ELSE "full"
Shrink == IF input = "full" THEN "part" ELSE "none"

\* The page opens on লেভেল ১, or on a friend's link to লেভেল ২ (parseShare accepts any valid level, locked or not).
Init == /\ link \in {"none", "friend"} /\ level = (IF link = "friend" THEN 2 ELSE 1)
        /\ guesses = 0 /\ input = "none" /\ won = FALSE /\ focus = "page" /\ enter = "fine"
        /\ stars = [l \in Levels |-> 0] /\ recorded = 0 /\ cheer = FALSE

\* onKey: a digit key types from anywhere; focus does not move.
YouTypeADigit == /\ ~Over /\ input # "full" /\ input' = Grow
                 /\ UNCHANGED <<link, level, guesses, won, focus, enter, stars, recorded, cheer>>
\* A tap on a pad key: the key turns disabled, so the browser drops focus to the page.
YouTapADigit == /\ ~Over /\ input # "full" /\ input' = Grow /\ focus' = "page"
                /\ UNCHANGED <<link, level, guesses, won, enter, stars, recorded, cheer>>
\* A tap on মুছো: it keeps focus while something is left to erase (it is disabled only on an empty row).
YouTapErase == /\ ~Over /\ input # "none" /\ input' = Shrink /\ focus' = IF Shrink = "none" THEN "page" ELSE "erase"
               /\ UNCHANGED <<link, level, guesses, won, enter, stars, recorded, cheer>>
\* A click on the board moves focus back to the page.
YouClickTheBoard == /\ focus # "page" /\ focus' = "page"
                    /\ UNCHANGED <<link, level, guesses, input, won, enter, stars, recorded, cheer>>

\* submit(), then the guesses.length effect: the end of a game records stars once and queues the cheer or the lose sound.
Check == /\ guesses' = guesses + 1 /\ input' = "none" /\ won' \in BOOLEAN
         /\ IF won' \/ guesses + 1 = Tries
              THEN /\ recorded' = recorded + 1 /\ cheer' = TRUE
                   /\ \E s \in {1, 2} : stars' = IF won' THEN [stars EXCEPT ![level] = Max(@, s)] ELSE stars
              ELSE UNCHANGED <<recorded, cheer, stars>>

\* onKey Enter: with focus on the page it checks a full row; with focus on a button
\* (target.closest('button')) the handler steps aside and the browser clicks that button.
YouPressEnter ==
  /\ ~Over
  /\ \/ /\ focus = "page" /\ input = "full" /\ Check /\ UNCHANGED <<link, level, focus, enter>>
     \/ /\ focus = "erase" /\ input # "none"
        /\ input' = Shrink /\ focus' = IF Shrink = "none" THEN "page" ELSE "erase"
        /\ enter' = IF input = "full" THEN "lost" ELSE enter
        /\ UNCHANGED <<link, level, guesses, won, stars, recorded, cheer>>
     \/ /\ focus = "pick" /\ Fresh(level) /\ enter' = IF input = "full" THEN "lost" ELSE enter
        /\ UNCHANGED <<link, focus, stars>>
\* A tap on দেখো with a full row.
YouTapCheck == /\ ~Over /\ input = "full" /\ Check /\ UNCHANGED <<link, level, focus, enter>>

\* LevelGrid onPick: any open level, plus the level being played even when locked (unlocked = max(levels.unlocked, level)).
\* The level button keeps focus.
YouPickALevel == /\ \E l \in Levels : l <= Max(Unlocked, level) /\ Fresh(l)
                 /\ focus' = "pick" /\ UNCHANGED <<link, enter, stars>>
\* পরের লেভেল / আবার খেলো on the result: start() clears the timers; the panel goes away, so focus drops to the page.
YouPressNextLevel == /\ Over /\ won /\ level < 2 /\ Fresh(level + 1) /\ focus' = "page" /\ UNCHANGED <<link, enter, stars>>
YouPlayAgain == /\ Over /\ Fresh(level) /\ focus' = "page" /\ UNCHANGED <<link, enter, stars>>
\* The setTimeout that plays the cheer or the lose sound.
TheCheerPlays == /\ cheer /\ cheer' = FALSE /\ UNCHANGED <<link, level, guesses, input, won, focus, enter, stars, recorded>>

Next == YouTypeADigit \/ YouTapADigit \/ YouTapErase \/ YouClickTheBoard \/ YouPressEnter \/ YouTapCheck
        \/ YouPickALevel \/ YouPressNextLevel \/ YouPlayAgain \/ TheCheerPlays

Spec == Init /\ [][Next]_vars

TypeOK == /\ link \in {"none", "friend"} /\ level \in Levels /\ guesses \in 0..Tries /\ input \in {"none", "part", "full"}
          /\ won \in BOOLEAN /\ focus \in {"page", "erase", "pick"} /\ enter \in {"fine", "lost"}
          /\ stars \in [Levels -> 0..2] /\ recorded \in 0..2 /\ cheer \in BOOLEAN

\* The reader's rules.
\* With four digits typed, Enter checks the row; it never erases a digit or restarts the level instead.
EnterChecksTheRow == enter = "fine"
\* A game is recorded once.
NoDoubleResult == recorded <= 1
\* The cheer or the lose sound plays only while that game's result is on screen.
NoCheerAfterMovingOn == cheer => Over
\* A level has stars only if the level before it has stars: levels open one by one.
LevelsOpenInOrder == stars[2] > 0 => stars[1] > 0
\* Stars never go down, and an open level never closes.
StarsNeverDrop == [][\A l \in Levels : stars'[l] >= stars[l]]_vars
UnlockNeverShrinks == [][Unlocked' >= Unlocked]_vars

\* Exploration bound: stop past a broken Enter or a skipped level (the states after them repeat the ones before).
Explore == enter = "fine" /\ LevelsOpenInOrder
====
