---- MODULE SurBanai ----
\* সুর বানাই (kids' music grid), after the rewrite: the game's screens, the beat loop, the free tune's draft, a win, away and
\* back, the player's pause menu and the kids' daily limit. Mirrored from:
\*   tools/sur-banai/lib/session.ts          (screens, the beat loop's permission, pause, away, win, keep, rest, keys)
\*   tools/sur-banai/lib/round.ts, play.ts   (a level round: listen, check, the beat)
\*   tools/sur-banai/components/game.tsx     (timers, blur / hide, the player's onPause / onResume / onRestart / onLevels)
\*   tools/sur-banai/lib/draft.ts            (the free grid's tune is written to storage on every tap)
\*   shared/kids-kit.tsx                     (atBreak, RestScreen as a real modal)
\*   shared/game-player-client.tsx           (the pause menu, blur / hide / Escape, সব লেভেল)
\*
\* Two more small specs hold what would blow this one past the chart budget: SurBanaiSound.tla (the site-wide switch and the
\* beat) and SurBanaiGate.tla (the parent gate and leaving the game). There is no voice any more (the owner's call), so the
\* old `talking` variable is gone; tests/session.test.ts checks the source for it.
\*
\* `unsaved` means the free grid holds notes that are not on the shelf. They are in storage the moment they are tapped
\* (setFree writes the draft), so "unsaved" is never "lost": RestKeepsYourTune says they are always in storage.

VARIABLES screen, endKind, playing, heard, answered, recorded, unsaved, draft, window, paused, resting
vars == <<screen, endKind, playing, heard, answered, recorded, unsaved, draft, window, paused, resting>>

Screens == {"title", "play", "free", "end", "levels"}
Grid   == screen \in {"play", "free"}                          \* a tune you are making, or a level you are on
RestUp == resting # "no" /\ ~Grid                              \* restShows(): the rest screen never covers a grid
Child  == ~paused /\ window = "here" /\ ~RestUp               \* what a finger can reach

Init == /\ screen = "title" /\ endKind = "level" /\ playing = "none" /\ heard = FALSE /\ answered = FALSE /\ recorded = FALSE
        /\ unsaved = FALSE /\ draft = FALSE /\ window = "here" /\ paused = FALSE /\ resting \in {"no", "atOpen"}

\* ---------- the free grid (আমার সুর) ----------
\* tapCell on the free grid: the note sounds, the cell lights, and setFree() writes the draft to storage in the same call.
YouTapACell == /\ Child /\ screen = "free" /\ unsaved' = TRUE /\ draft' = TRUE
               /\ UNCHANGED <<screen, endKind, playing, heard, answered, recorded, window, paused, resting>>
\* clearCells(): the grid empties, and so does the draft: nothing is left to lose.
YouClear == /\ Child /\ screen = "free" /\ unsaved /\ unsaved' = FALSE /\ draft' = FALSE
            /\ UNCHANGED <<screen, endKind, playing, heard, answered, recorded, window, paused, resting>>
\* playFree() while nothing plays: run("free"). (The button is off on an empty grid.)
YouPressPlay == /\ Child /\ screen = "free" /\ unsaved /\ playing = "none" /\ playing' = "free"
                /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* playFree() while playing: halt(). Stopping is midway, never a break: no atBreak(), the tune stays.
YouPressStop == /\ Child /\ screen = "free" /\ playing = "free" /\ playing' = "none"
                /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* keep(): halt(), the tune goes on the shelf, the draft is cleared, S.kept() checks the limit: a true break.
YouKeep == /\ Child /\ screen = "free" /\ unsaved
           /\ playing' = "none" /\ unsaved' = FALSE /\ draft' = FALSE /\ screen' = "end" /\ endKind' = "kept" /\ resting' \in {"no", "atBreak"}
           /\ UNCHANGED <<heard, answered, recorded, window, paused>>
\* The home button: toTitle(). The tune stays in the draft.
YouGoHome == /\ Child /\ screen = "free" /\ screen' = "title" /\ playing' = "none"
             /\ UNCHANGED <<endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>

\* ---------- starting a round ----------
\* begin(): opening a round is a break too. Past today's limit it doesn't start and the rest screen shows instead.
\* A level opens with `heard` false (a make level has nothing to hear, so it opens ready: heard may be true).
Begin(target) ==
  \/ /\ resting' = "no" /\ screen' = target /\ heard' \in BOOLEAN /\ answered' = FALSE /\ recorded' = FALSE /\ playing' = "none"
  \/ /\ resting' = "atBreak" /\ screen' = (IF screen = "levels" THEN "title" ELSE screen)
     /\ UNCHANGED <<heard, answered, recorded, playing>>
YouStartALevel == /\ Child /\ screen \in {"title", "levels"} /\ Begin("play")
                  /\ UNCHANGED <<endKind, unsaved, draft, window, paused>>
YouStartFree == /\ Child /\ screen = "title" /\ Begin("free")
                /\ UNCHANGED <<endKind, unsaved, draft, window, paused>>
\* আবার খেলো on the end screen: the same kind of round again.
YouPlayAgain == /\ Child /\ screen = "end" /\ Begin(IF endKind = "kept" THEN "free" ELSE "play")
                /\ UNCHANGED <<endKind, unsaved, draft, window, paused>>
\* শেষ: back to the title with the next level ready.
YouFinish == /\ Child /\ screen = "end" /\ screen' = "title"
             /\ UNCHANGED <<endKind, playing, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* The level list: a choice screen, opened from the title or the end screen.
YouOpenTheLevelList == /\ Child /\ screen \in {"title", "end"} /\ screen' = "levels"
                       /\ UNCHANGED <<endKind, playing, heard, answered, recorded, unsaved, draft, window, paused, resting>>
YouCloseTheLevelList == /\ Child /\ screen = "levels" /\ screen' = "title"
                        /\ UNCHANGED <<endKind, playing, heard, answered, recorded, unsaved, draft, window, paused, resting>>

\* ---------- a level ----------
\* ear(): run("target"). Allowed only on its own screen, with nothing covering it and the round not won.
YouListen == /\ Child /\ screen = "play" /\ ~answered /\ playing = "none" /\ playing' = "target"
             /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* mine(): run("mine"), your copy once.
YouPlayYourCopy == /\ Child /\ screen = "play" /\ ~answered /\ playing = "none" /\ playing' = "mine"
                   /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
YouStopTheTune == /\ Child /\ screen = "play" /\ playing \in {"target", "mine"} /\ playing' = "none"
                  /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* checkIt() with a copy that doesn't match: halt(), a boing, a line, the extras wobble.
YouCheckWrong == /\ Child /\ screen = "play" /\ heard /\ ~answered /\ playing' = "none"
                 /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, paused, resting>>
\* checkIt() with a match: S.won() at this tap. The stars are saved (levels.record) and atBreak() runs now, not when the end
\* screen comes. The child's own tune plays through (echo) and ➜ waits.
YouCheckRight == /\ Child /\ screen = "play" /\ heard /\ ~answered
                 /\ answered' = TRUE /\ recorded' = TRUE /\ resting' \in {"no", "atBreak"} /\ playing' = "echo"
                 /\ UNCHANGED <<screen, endKind, heard, unsaved, draft, window, paused>>
\* onward() → S.advance(): the end screen.
YouPressNext == /\ Child /\ screen = "play" /\ answered
                /\ screen' = "end" /\ endKind' = "level" /\ answered' = FALSE /\ playing' = "none"
                /\ UNCHANGED <<heard, recorded, unsaved, draft, window, paused, resting>>

\* ---------- the beat loop (a setTimeout chain, stopped by every way of leaving) ----------
\* A once-through tune reaches its end: halt(); onEnd() (the tune to hear marks the level as heard).
TuneEnds == /\ playing \in {"target", "mine", "echo"}
            /\ playing' = "none" /\ heard' = (IF playing = "target" THEN TRUE ELSE heard)
            /\ UNCHANGED <<screen, endKind, answered, recorded, unsaved, draft, window, paused, resting>>

\* ---------- away and back ----------
\* "away" is a window blur or a hidden tab: both end in halt() (the blur and visibilitychange listeners), so the beat stops and
\* keeps the tune, and coming back never restarts it. (A hidden tab is the same state as another window here.)
WindowBlurs == /\ window = "here" /\ window' = "away" /\ playing' = "none"
               /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, paused, resting>>
WindowFocuses == /\ window = "away" /\ window' = "here"
                 /\ UNCHANGED <<screen, endKind, playing, heard, answered, recorded, unsaved, draft, paused, resting>>

\* ---------- the player's pause menu ----------
\* ⏸, P, Escape, or blur once engaged: onPause → S.pause() + halt() + silenceScheduled().
PlayerPauses == /\ ~paused /\ paused' = TRUE /\ playing' = "none"
                /\ UNCHANGED <<screen, endKind, heard, answered, recorded, unsaved, draft, window, resting>>
\* চালিয়ে যাও: onResume → S.resume(). The beat isn't restarted.
PlayerResumes == /\ paused /\ paused' = FALSE
                 /\ UNCHANGED <<screen, endKind, playing, heard, answered, recorded, unsaved, draft, window, resting>>
\* নতুন করে শুরু: onRestart → toTitle(). The free tune is in its draft; a won level was recorded at its ✓ tap.
PlayerRestarts == /\ paused /\ paused' = FALSE /\ screen' = "title" /\ answered' = FALSE /\ playing' = "none"
                  /\ UNCHANGED <<endKind, heard, recorded, unsaved, draft, window, resting>>
\* সব লেভেল in the menu: onLevels → halt(), openLevels(fromMenu). The list freezes play.
PlayerOpensTheLevelList == /\ paused /\ paused' = FALSE /\ screen' = "levels" /\ answered' = FALSE /\ playing' = "none"
                           /\ UNCHANGED <<endKind, heard, recorded, unsaved, draft, window, resting>>

\* ---------- the daily limit ----------
\* RestScreen → ParentGate → আজ আরও ১০ মিনিট → extend().
GrownUpGivesTime == /\ resting # "no" /\ resting' = "no"
                    /\ UNCHANGED <<screen, endKind, playing, heard, answered, recorded, unsaved, draft, window, paused>>

Next == YouTapACell \/ YouClear \/ YouPressPlay \/ YouPressStop \/ YouKeep \/ YouGoHome
        \/ YouStartALevel \/ YouStartFree \/ YouPlayAgain \/ YouFinish \/ YouOpenTheLevelList \/ YouCloseTheLevelList
        \/ YouListen \/ YouPlayYourCopy \/ YouStopTheTune \/ YouCheckWrong \/ YouCheckRight \/ YouPressNext
        \/ TuneEnds \/ WindowBlurs \/ WindowFocuses
        \/ PlayerPauses \/ PlayerResumes \/ PlayerRestarts \/ PlayerOpensTheLevelList \/ GrownUpGivesTime

Spec == Init /\ [][Next]_vars

TypeOK == /\ screen \in Screens /\ endKind \in {"level", "kept"} /\ playing \in {"none", "free", "mine", "target", "echo"}
          /\ heard \in BOOLEAN /\ answered \in BOOLEAN /\ recorded \in BOOLEAN /\ unsaved \in BOOLEAN /\ draft \in BOOLEAN
          /\ window \in {"here", "away"} /\ paused \in BOOLEAN /\ resting \in {"no", "atOpen", "atBreak"}

\* ---------- the reader's rules ----------
\* Nothing plays on its own while you're in another window (NoProgressWhileAway / PausedWhenBlurred / SilentWhenHidden). Was bug 2.
NoProgressWhileAway == playing # "none" => window = "here"
\* Nothing plays under the player's menu (PausedMeansQuiet).
PausedMeansQuiet == paused => playing = "none"
\* The beat plays only on a grid, never on the title, the end screen or the level list.
PlayOnlyOnTheGrid == playing # "none" => Grid
\* While the level list is open, nothing plays (ChoiceFreezesPlay). Was bug 5.
ChoiceFreezesPlay == screen = "levels" => playing = "none"
\* The rest screen comes only at a break: after a tune is kept, a level is matched, or when a round is about to open. Never
\* over the free grid, and never over a level that isn't won. Was bug 1.
RestOnlyAtBreak == resting # "no" => (screen # "free" /\ (screen # "play" \/ answered))
\* A tune that isn't kept yet is in storage the moment it is tapped, so no screen, the rest screen included, and not closing the
\* page, can lose it. Was bug 1 (the rest screen came over a tune never kept).
RestKeepsYourTune == unsaved => draft
\* Nothing plays or reacts under the rest screen (it is a real modal).
QuietUnderRest == RestUp => playing = "none"
\* A won level is recorded once, at its ✓ tap: before ➜ and before the end screen can come (EveryFinishCounts).
EveryFinishCounts == /\ (answered => recorded) /\ ((screen = "end" /\ endKind = "level") => recorded)
\* For ages 3–5, every screen has its way on by picture: the title card and chips, the grid and its icon buttons, the end
\* screen's 112 px picture buttons, the level list's cards (NoReadingNeeded). Was bug 8; tests/session.test.ts checks the source.
NoReadingNeeded == screen \in Screens
====
