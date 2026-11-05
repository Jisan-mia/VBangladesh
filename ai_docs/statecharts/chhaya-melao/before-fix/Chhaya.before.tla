---- MODULE Chhaya ----
\* ছায়া মেলাও (kids, 3–6) as it is on 2026-11-04 with the kids' kit at 23fd7c1, before the rewrite. Mirrored from:
\*   tools/chhaya-melao/components/chhaya-game.tsx  (start, choose, finish, the NEXT_MS timer, pickLevel, the done buttons)
\*   shared/kids-kit.tsx                             (useKidsSession: the 10 s tick (focused, visible tab only), atBreak,
\*                                                    the mount check that opens on the rest screen past the limit, extend;
\*                                                    RestScreen, a real modal since f4f75be: nothing behind it hears input)
\*   shared/game-kit.ts / shared/game-core.ts        (useLevels.record → recordLevel keeps the better stars)
\*   shared/game-ui.tsx                              (LevelGrid: always on screen under the wall, in every phase)
\* Abstractions: a round has 2 shadows (the code has 6); stars are 3 for a clean round, 1 otherwise; one level's best.
\* There is no blur, visibility or pause handler in this game, so "another window" and "hidden tab" act the same: `away`.
\* The parent gate lives in its own spec, KidsGate.tla, because it is the shared kit's and it doubles the state count here.
EXTENDS Naturals
VARIABLES phase, item, solved, clean, away, resting, over, restSeen, best, recorded, focus,
          movedAway, wiped, sent, wrote
vars == <<phase, item, solved, clean, away, resting, over, restSeen, best, recorded, focus, movedAway, wiped, sent, wrote>>

ROUND == 2
Earned == IF clean THEN 3 ELSE 1
Max(a, b) == IF a >= b THEN a ELSE b
Progress == {"stars", "playtime", "limit"}   \* what the kids' brief allows on the phone

Init == /\ phase = "dark" /\ item = 1 /\ solved = FALSE /\ clean = TRUE /\ away = FALSE
        /\ resting = FALSE /\ over = FALSE /\ restSeen = FALSE /\ best = 0 /\ recorded = 0
        /\ focus = "none" /\ movedAway = FALSE /\ wiped = FALSE /\ sent = FALSE /\ wrote = {}

\* start(next): clearTimeout, a fresh round of shadows, phase "play". `resting` is not touched.
Start == /\ phase' = "play" /\ item' = 1 /\ solved' = FALSE /\ clean' = TRUE /\ recorded' = 0

Touchable == ~away /\ ~resting        \* the rest screen is position:fixed and covers every tap target

\* The light switch (phase "dark"): onClick → start(level). The button unmounts, so focus falls to the page.
YouFlipTheSwitch == /\ phase = "dark" /\ Touchable /\ Start /\ focus' = "none"
                    /\ UNCHANGED <<away, resting, over, restSeen, best, movedAway, wiped, sent, wrote>>
\* choose(): the right picture → solved, and a 1500 ms timer queues the next shadow. Clicking moves focus to the picture.
YouPickTheRightPicture == /\ phase = "play" /\ ~solved /\ Touchable
                          /\ solved' = TRUE /\ focus' = "none"
                          /\ UNCHANGED <<phase, item, clean, away, resting, over, restSeen, best, recorded, movedAway, wiped, sent, wrote>>
\* choose(): a wrong picture wobbles; the round is no longer clean.
YouPickAWrongPicture == /\ phase = "play" /\ ~solved /\ clean /\ Touchable
                        /\ clean' = FALSE /\ focus' = "none"
                        /\ UNCHANGED <<phase, item, solved, away, resting, over, restSeen, best, recorded, movedAway, wiped, sent, wrote>>
\* The NEXT_MS timeout, not the last shadow: lampClick, the next shadow. No check of visibility or focus.
NextShadowComes == /\ phase = "play" /\ solved /\ item < ROUND
                   /\ item' = item + 1 /\ solved' = FALSE /\ movedAway' = (movedAway \/ away)
                   /\ UNCHANGED <<phase, clean, away, resting, over, restSeen, best, recorded, focus, wiped, sent, wrote>>
\* The NEXT_MS timeout on the last shadow → finish(): levels.record, the chime or confetti, the result, atBreak().
RoundEnds == /\ phase = "play" /\ solved /\ item = ROUND
             /\ phase' = "done" /\ best' = Max(best, Earned) /\ recorded' = recorded + 1
             /\ resting' = over /\ restSeen' = (restSeen \/ over)
             /\ movedAway' = (movedAway \/ away) /\ wrote' = wrote \cup {"stars"}
             /\ UNCHANGED <<item, solved, clean, away, over, focus, wiped, sent>>
\* LevelGrid is on screen in every phase: a tap starts that level at once, mid-round too. Focus stays on the level button.
YouTapALevel == /\ Touchable /\ Start /\ focus' = "level"
                /\ UNCHANGED <<away, resting, over, restSeen, best, movedAway, wiped, sent, wrote>>
\* Enter or Space while a level button still has focus: the browser clicks it, so start(level) again.
YouPressEnter == /\ focus = "level" /\ ~away /\ Start
                 /\ wiped' = (wiped \/ (phase = "play" /\ (item > 1 \/ solved \/ ~clean)))
                 /\ UNCHANGED <<away, resting, over, restSeen, best, focus, movedAway, sent, wrote>>
\* The done screen: আবার খেলো → pickLevel(result.level) (the button unmounts); শেষ → phase "idle".
YouPressPlayAgain == /\ phase = "done" /\ Touchable /\ Start /\ focus' = "none"
                     /\ UNCHANGED <<away, resting, over, restSeen, best, movedAway, wiped, sent, wrote>>
YouPressDone == /\ phase = "done" /\ Touchable /\ phase' = "idle" /\ focus' = "none"
                /\ UNCHANGED <<item, solved, clean, away, resting, over, restSeen, best, recorded, movedAway, wiped, sent, wrote>>
TodaysMinutesRunOut == /\ ~over /\ ~away /\ over' = TRUE /\ wrote' = wrote \cup {"playtime"}
                       /\ UNCHANGED <<phase, item, solved, clean, away, resting, restSeen, best, recorded, focus, movedAway, wiped, sent>>
\* RestScreen → ParentGate → আজ আরও ১০ মিনিট → extend(10).
AGrownUpGivesTenMore == /\ resting /\ ~away
                        /\ resting' = FALSE /\ over' = FALSE /\ restSeen' = FALSE /\ wrote' = wrote \cup {"playtime"}
                        /\ UNCHANGED <<phase, item, solved, clean, away, best, recorded, focus, movedAway, wiped, sent>>
\* Reload, or leave and come back: a fresh wall; past today's limit the page opens on the rest screen (23fd7c1).
ThePageReloads == /\ ~away /\ phase' = "dark" /\ item' = 1 /\ solved' = FALSE /\ clean' = TRUE /\ recorded' = 0
                  /\ resting' = over /\ restSeen' = (restSeen \/ over) /\ focus' = "none"
                  /\ UNCHANGED <<away, over, best, movedAway, wiped, sent, wrote>>
YouLookAway == /\ ~away /\ away' = TRUE
               /\ UNCHANGED <<phase, item, solved, clean, resting, over, restSeen, best, recorded, focus, movedAway, wiped, sent, wrote>>
YouComeBack == /\ away /\ away' = FALSE
               /\ UNCHANGED <<phase, item, solved, clean, resting, over, restSeen, best, recorded, focus, movedAway, wiped, sent, wrote>>

Next == YouFlipTheSwitch \/ YouPickTheRightPicture \/ YouPickAWrongPicture \/ NextShadowComes \/ RoundEnds
        \/ YouTapALevel \/ YouPressEnter \/ YouPressPlayAgain \/ YouPressDone
        \/ TodaysMinutesRunOut \/ AGrownUpGivesTenMore \/ ThePageReloads \/ YouLookAway \/ YouComeBack

Spec == Init /\ [][Next]_vars

\* Stop exploring past a state that already broke a history rule, to keep the chart under 500 states.
Explore == ~movedAway /\ ~wiped

TypeOK == /\ phase \in {"dark", "play", "done", "idle"} /\ item \in 1..ROUND /\ solved \in BOOLEAN /\ clean \in BOOLEAN
          /\ away \in BOOLEAN /\ resting \in BOOLEAN /\ over \in BOOLEAN /\ restSeen \in BOOLEAN
          /\ best \in {0, 1, 3} /\ recorded \in 0..2 /\ focus \in {"none", "level"}
          /\ movedAway \in BOOLEAN /\ wiped \in BOOLEAN /\ sent \in BOOLEAN /\ wrote \subseteq Progress

\* ---- The reader's rules ----
\* Nothing moves on while you look away: no shadow comes, no round ends, no chime plays to an empty room.
NoProgressWhileAway == ~movedAway
\* A stray Enter never throws away a round in progress (the last-focused-button pattern).
KeyNeverWipesTheRound == ~wiped
\* A round ends once and is recorded once.
NoDoubleResult == recorded <= 1
\* RestOnlyAtBreak: the rest screen is only ever over a finished round or an empty wall, never over a round in play.
RestOnlyAtBreak == resting => phase \in {"done", "idle", "dark"}
\* Once the rest screen has come today, no new round starts until a grown-up gives more time.
RestStaysUntilAGrownUp == (restSeen /\ over /\ ~resting) => phase # "play"
\* NoNetwork / NoChildData: no handler sends anything; only stars and play time are written.
NoNetwork == ~sent
NoChildData == wrote \subseteq Progress
\* NoReadingNeeded (3–6): every control the child needs to go on is a picture (or a number), not a word.
\* The controls each screen offers the child, from the JSX (settings pills and the parent gate left out).
Offered == CASE phase = "dark" -> {"switch", "levels"}
             [] phase = "play" -> {"pictures", "levels"}
             [] phase = "done" -> {"again", "shesh", "showParent", "levels"}
             [] OTHER -> {"levels"}
Pictured == {"switch", "pictures", "levels"}   \* আবার খেলো, শেষ and আব্বু-আম্মুকে দেখাও are words only
NoReadingNeeded == Offered \subseteq Pictured
\* StarsNeverDrop: a level's best only goes up.
StarsNeverDrop == [][best' >= best]_best
====
