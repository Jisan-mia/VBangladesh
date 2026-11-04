---- MODULE PatiBuni ----
\* পাটি বুনি: the round, the tab, window and scroll, a held control, the breath after resuming, the stack,
\* and the friend's bundle. Mirrored from tools/pati-buni/components/pati-game.tsx: start/pause/resume/
\* restart/playFromCard/finish/letGo, press()/release() and control() (◀ ▶ hold repeats through
\* live.repeatDir, নামাও or ↓ hold is live.soft), tick() (nothing falls before live.hold), keyHandler
\* (keyup ↓ ends the soft drop; arrows rely on the keyboard's own repeat), the visibilitychange `hide`
\* listener, the boardInView pause effect, and the hashchange `readFriend` effect. No blur listener exists.
\* Abstract: the stack is 0..2 rows high and full at 2 (the frame is 14); a landing strip either weaves a
\* row (stack stays) or adds one.
EXTENDS Naturals

FULL == 2

VARIABLES phase, visible, focused, inView, hand, breath, stack, friend, bundle
vars == <<phase, visible, focused, inView, hand, breath, stack, friend, bundle>>

Here == visible /\ focused

Init == /\ phase = "ready" /\ visible = TRUE /\ focused = TRUE /\ inView = TRUE /\ hand = "none"
        /\ breath = FALSE /\ stack = 0 /\ friend = FALSE /\ bundle = "own"

\* start(): শুরু করো, a tap on the board, Space/Enter, or the first control press. No breath (hold = 0).
YouStart == /\ Here /\ inView /\ phase = "ready" /\ phase' = "playing" /\ breath' = FALSE
            /\ UNCHANGED <<visible, focused, inView, hand, stack, friend, bundle>>
\* press("left"/"right") with a pointer sets repeatDir; press("drop") sets soft.
YouHoldAControl == /\ Here /\ inView /\ phase = "playing" /\ hand = "none"
                   /\ \E h \in {"side", "down"} : hand' = h
                   /\ UNCHANGED <<phase, visible, focused, inView, breath, stack, friend, bundle>>
\* release() on pointerup / pointercancel / lostpointercapture, or keyup ↓ (ignored unless boardInView).
\* The release only reaches the page while it has focus.
YouLetGo == /\ Here /\ hand # "none" /\ hand' = "none"
            /\ UNCHANGED <<phase, visible, focused, inView, breath, stack, friend, bundle>>
\* tick() -> advance(): a strip lands while playing, past the breath, with the tab shown (useGameLoop).
\* The last one that fits calls finish(): letGo, the result.
StripLands == /\ phase = "playing" /\ ~breath /\ visible
              /\ \E s \in {stack, stack + 1} :
                   IF s = FULL
                     THEN phase' = "over" /\ stack' = s /\ hand' = "none"
                     ELSE stack' = s /\ UNCHANGED <<phase, hand>>
              /\ UNCHANGED <<visible, focused, inView, breath, friend, bundle>>
\* performance.now() passes live.hold.
BreathEnds == /\ phase = "playing" /\ breath /\ breath' = FALSE
              /\ UNCHANGED <<phase, visible, focused, inView, hand, stack, friend, bundle>>
WindowBlurs == /\ Here /\ focused' = FALSE
               /\ UNCHANGED <<phase, visible, inView, hand, breath, stack, friend, bundle>>
WindowFocuses == /\ visible /\ ~focused /\ focused' = TRUE
                 /\ UNCHANGED <<phase, visible, inView, hand, breath, stack, friend, bundle>>
\* hide(): pause() (only from playing), which lets go.
TabHides == /\ visible /\ visible' = FALSE /\ focused' = FALSE
            /\ IF phase = "playing" THEN phase' = "paused" /\ hand' = "none" ELSE UNCHANGED <<phase, hand>>
            /\ UNCHANGED <<inView, breath, stack, friend, bundle>>
TabShows == /\ ~visible /\ visible' = TRUE /\ focused' = TRUE
            /\ UNCHANGED <<phase, inView, hand, breath, stack, friend, bundle>>
\* useEffect(() => { if (!boardInView) pause(); }).
YouScrollAway == /\ Here /\ inView /\ inView' = FALSE
                 /\ IF phase = "playing" THEN phase' = "paused" /\ hand' = "none" ELSE UNCHANGED <<phase, hand>>
                 /\ UNCHANGED <<visible, focused, breath, stack, friend, bundle>>
YouScrollBack == /\ Here /\ ~inView /\ inView' = TRUE
                 /\ UNCHANGED <<phase, visible, focused, hand, breath, stack, friend, bundle>>
\* pause(): the pause button, P, Esc or Enter.
YouPause == /\ Here /\ phase = "playing" /\ phase' = "paused" /\ hand' = "none"
            /\ UNCHANGED <<visible, focused, inView, breath, stack, friend, bundle>>
\* resume(): চালিয়ে যাও, any control, a tap on the board, Space, or the HUD's play button above the board
\* (which stays on screen when the board has scrolled below the fold); a 600 ms breath follows.
YouResume == /\ Here /\ phase = "paused" /\ phase' = "playing" /\ breath' = TRUE
             /\ UNCHANGED <<visible, focused, inView, hand, stack, friend, bundle>>
\* restart(): আরেকবার right under the board (on screen while under 15% of the board is), straight into play with a 350 ms breath; the friend's seed if any.
YouPlayAgain == /\ Here /\ phase = "over" /\ phase' = "playing" /\ breath' = TRUE /\ stack' = 0
                /\ bundle' = IF friend THEN "friend" ELSE "own"
                /\ UNCHANGED <<visible, focused, inView, hand, friend>>
\* playFromCard(): আরেকবার খেলো under the card: the ready screen, the friend's seed if any.
YouPlayFromTheCard == /\ Here /\ phase = "over" /\ phase' = "ready" /\ stack' = 0 /\ inView' = TRUE
                      /\ bundle' = IF friend THEN "friend" ELSE "own"
                      /\ UNCHANGED <<visible, focused, hand, breath, friend>>
\* readFriend(): a challenge link resets onto the friend's seed, on the ready screen.
FriendLinkOpens == /\ Here /\ ~friend /\ friend' = TRUE /\ bundle' = "friend"
                   /\ phase' = "ready" /\ stack' = 0 /\ hand' = "none"
                   /\ UNCHANGED <<visible, focused, inView, breath>>

Next == YouStart \/ YouHoldAControl \/ YouLetGo \/ StripLands \/ BreathEnds \/ WindowBlurs \/ WindowFocuses
        \/ TabHides \/ TabShows \/ YouScrollAway \/ YouScrollBack \/ YouPause \/ YouResume
        \/ YouPlayAgain \/ YouPlayFromTheCard \/ FriendLinkOpens

Spec == Init /\ [][Next]_vars

TypeOK == /\ phase \in {"ready", "playing", "paused", "over"} /\ visible \in BOOLEAN /\ focused \in BOOLEAN
          /\ inView \in BOOLEAN /\ hand \in {"none", "side", "down"} /\ breath \in BOOLEAN
          /\ stack \in 0..FULL /\ friend \in BOOLEAN /\ bundle \in {"own", "friend"}

\* The reader's rules.
PausedWhenHidden == ~visible => phase # "playing"
\* Strips fall only while you are on the page to steer them.
PausedWhenBlurred == ~focused => phase # "playing"
PausedWhenScrolledAway == ~inView => phase # "playing"
InputReleasedWhenAway == hand # "none" => (visible /\ focused)
\* No control counts as held on the start, pause or result screen.
NoHoldOffThePlay == phase # "playing" => hand = "none"
\* The result shows exactly when the frame is full.
ResultMatchesPlay == (phase = "over") <=> (stack = FULL)
\* After a friend's link, every replay deals the friend's bundle; without one, your own.
ReplayIsExact == bundle = (IF friend THEN "friend" ELSE "own")
====
