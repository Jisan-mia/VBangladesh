---- MODULE ShobdoKhoja ----
\* শব্দ খোঁজা: the round and its clock, the tab and window, the finger on the grid, the fanfare timer,
\* and the levels. Mirrored from tools/shobdo-khoja/components/word-search.tsx (start, resume, finish,
\* attempt, begin, onPointerDown/Move/Up/Cancel, the visibilitychange `hide` effect, LevelGrid onPick,
\* the hashchange `readFriend` effect) and shared/game-kit.ts useLevels + shared/game-core.ts
\* recordLevel/unlockedLevel. The clock runs exactly while phase = "playing" (startClock/stopClock).
\* Abstract: 2 words to find (the game has 6), 2 levels (the game has 24), no free grids, no hints.
EXTENDS Naturals, FiniteSets

W == 2
N == 2
Levels == 1..N

VARIABLES phase, visible, focused, press, found, fanfare, stage, cleared, friend
vars == <<phase, visible, focused, press, found, fanfare, stage, cleared, friend>>

Max(a, b) == IF a > b THEN a ELSE b
Top == IF cleared = {} THEN 0 ELSE CHOOSE s \in cleared : \A t \in cleared : t <= s
\* unlockedLevel(): one past the highest level with stars, never above the count.
Unlocked == IF Top + 1 > N THEN N ELSE Top + 1
\* The levels cleared one after another from level 1.
Earned == IF 1 \notin cleared THEN 0 ELSE IF 2 \notin cleared THEN 1 ELSE 2
\* The picker: LevelGrid unlocked={Math.max(levels.unlocked, friend?.stage ?? 1)}.
Open == Max(Unlocked, IF friend THEN N ELSE 1)
Here == visible /\ focused
Playable == phase \in {"ready", "playing"}

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE /\ press = "none"
        /\ found = 0 /\ fanfare = FALSE /\ stage = 1 /\ cleared = {} /\ friend = FALSE

\* begin(next): a fresh grid on the ready screen; clears the fanfare timer. It never touches press.current.
Begin(s) == /\ phase' = "ready" /\ found' = 0 /\ fanfare' = FALSE /\ stage' = s

\* onPointerDown: only while playable; start() turns ready into playing and starts the clock.
YouTouchALetter == /\ Here /\ Playable /\ press = "none"
                   /\ press' = "down" /\ phase' = "playing"
                   /\ UNCHANGED <<visible, focused, found, fanfare, stage, cleared, friend>>
\* onPointerMove: no phase check; once it moves a cell it is a drag with a trail.
YouDrag == /\ visible /\ press = "down" /\ press' = "drag"
           /\ UNCHANGED <<phase, visible, focused, found, fanfare, stage, cleared, friend>>
\* onPointerUp -> attempt(cells): no phase check. A right word is struck; the last one calls finish().
\* finish(): stopClock, levels.record(stage, stars) (stars >= 1 for any finish), fanfare setTimeout.
YouLetGoOnAWord == /\ visible /\ press = "drag" /\ found < W
                   /\ press' = "none" /\ found' = found + 1
                   /\ IF found + 1 = W
                        THEN phase' = "over" /\ fanfare' = TRUE /\ cleared' = cleared \cup {stage}
                        ELSE UNCHANGED <<phase, fanfare, cleared>>
                   /\ UNCHANGED <<visible, focused, stage, friend>>
\* onPointerUp on a miss or a still tap, or onPointerCancel: the press ends, nothing struck.
YouLetGoElsewhere == /\ visible /\ press # "none" /\ press' = "none"
                     /\ UNCHANGED <<phase, visible, focused, found, fanfare, stage, cleared, friend>>
\* No blur listener at all.
WindowBlurs == /\ Here /\ focused' = FALSE
               /\ UNCHANGED <<phase, visible, press, found, fanfare, stage, cleared, friend>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, press, found, fanfare, stage, cleared, friend>>
\* hide(): only when document.hidden and phase is "playing": stopClock, phase paused. press.current untouched.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ phase' = IF phase = "playing" THEN "paused" ELSE phase
            /\ UNCHANGED <<press, found, fanfare, stage, cleared, friend>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, press, found, fanfare, stage, cleared, friend>>
\* resume(): the চালিয়ে যাও button, or Space/Enter on the grid.
YouResume == /\ Here /\ phase = "paused" /\ phase' = "playing"
             /\ UNCHANGED <<visible, focused, press, found, fanfare, stage, cleared, friend>>
\* The setTimeout in finish(): sfx.levelUp + confetti or sfx.good. It fires whether or not the tab shows.
FanfarePlays == /\ fanfare /\ fanfare' = FALSE
                /\ UNCHANGED <<phase, visible, focused, press, found, stage, cleared, friend>>
\* আবার খেলো: begin(roundFor(round.stage)).
YouPlayAgain == /\ Here /\ phase = "over" /\ press = "none" /\ Begin(stage)
                /\ UNCHANGED <<visible, focused, press, cleared, friend>>
\* পরের লেভেল: only after a clear, below the last level.
YouGoToNextLevel == /\ Here /\ phase = "over" /\ press = "none" /\ stage < N /\ Begin(stage + 1)
                    /\ UNCHANGED <<visible, focused, press, cleared, friend>>
\* সব লেভেল -> LevelGrid onPick: any open level, from any phase.
YouPickALevel == /\ Here /\ press = "none"
                 /\ \E s \in 1..Open : Begin(s)
                 /\ UNCHANGED <<visible, focused, press, cleared, friend>>
\* readFriend(): a challenge link for the last level (stage v=N) opens on that level.
FriendLinkOpens == /\ Here /\ press = "none" /\ ~friend /\ friend' = TRUE /\ Begin(N)
                   /\ UNCHANGED <<visible, focused, press, cleared>>

Next == YouTouchALetter \/ YouDrag \/ YouLetGoOnAWord \/ YouLetGoElsewhere \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouResume \/ FanfarePlays \/ YouPlayAgain \/ YouGoToNextLevel
        \/ YouPickALevel \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ press \in {"none", "down", "drag"} /\ found \in 0..W /\ fanfare \in BOOLEAN
          /\ stage \in Levels /\ cleared \subseteq Levels /\ friend \in BOOLEAN

\* The reader's rules.
\* The clock only runs while you are on the page.
NoProgressWhileAway == phase = "playing" => (visible /\ focused)
PausedWhenHidden == ~visible => phase # "playing"
\* After you leave, no finger counts as on the grid.
InputReleasedWhenAway == press # "none" => (visible /\ focused)
\* Under the pause card no stroke is in flight, so no word can be struck while paused.
NoStrokeUnderThePauseCard == phase = "paused" => press = "none"
\* The fanfare belongs to the result it celebrates.
FanfareOnlyOnTheResult == fanfare => phase = "over"
\* The result shows exactly when every word is struck.
ResultMatchesPlay == (phase = "over") <=> (found = W)
\* A level opens for good only by clearing the one before it.
UnlockOnlyByClearing == Unlocked <= Earned + 1
====
