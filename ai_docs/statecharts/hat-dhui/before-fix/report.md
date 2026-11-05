# HatDhui

TLC reached 346 states and 1852 steps. The chart draws 27 states and 78 arrows.
The chart does not draw 169 steps that stay in one chart state.
The step you tap a tab changes Game and Timer at the same time.
The step the child taps a link in the header or the related games changes Game, Timer, Window, Rest and Gate at the same time.
The step the tab hides changes Window and Gate at the same time.
The step the ring fills changes Game and Timer at the same time.
The step someone shares the link or saves the picture changes Game, Timer, Window, Rest and Gate at the same time.
The step someone gives ১০ মিনিট more changes Rest and Gate at the same time.
The step 0.7 s later the finish timer fires changes Game and Timer, or Game, Timer and Rest, at the same time.
The step you press দেখো কী শিখলে changes Game and Rest at the same time.

## ParentGate breaks
The shortest path has 1 step:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. the child taps a link in the header or the related games: Game The child left for another page, Timer —, Window —, Rest —, Gate —

## NoReadingNeeded breaks
The shortest path has 1 step:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. you press শুরু করো: Game Ring filling, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut

## GateClosesBehindParent breaks
The shortest path has 2 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. a parent opens বড়দের জন্য: Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate A parent has the gate open
2. the parent hands the phone back: Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate left open, the child has the phone

## PausedWhenHidden breaks
The shortest path has 2 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. you press শুরু করো: Game Ring filling, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
2. the tab hides: Game Ring filling, Timer No finish timer, Window Tab hidden, Rest Time left today, Gate Gate shut

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. you press শুরু করো: Game Ring filling, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
2. you click into another window: Game Ring filling, Timer No finish timer, Window Another window has focus, Rest Time left today, Gate Gate shut

## NoShareForKids breaks
The shortest path has 3 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. a parent opens বড়দের জন্য: Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate A parent has the gate open
2. the parent hands the phone back: Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate left open, the child has the phone
3. someone shares the link or saves the picture: Game The share sheet opened, Timer —, Window —, Rest —, Gate —

## ResultMatchesPlay breaks
The shortest path has 4 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. you press শুরু করো: Game Ring filling, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
2. the ring fills: Game হয়ে গেছে, Timer Finish timer for this routine, Window On the page, Rest Time left today, Gate Gate shut
3. you tap a tab: Game Waiting for শুরু করো, Timer Finish timer for a routine you left, Window On the page, Rest Time left today, Gate Gate shut
4. 0.7 s later the finish timer fires: Game Done screen for a routine you never finished, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut

## RestOnlyAtBreak breaks
The shortest path has 5 steps:
0. Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Time left today, Gate Gate shut
1. today's time runs out: Game Waiting for শুরু করো, Timer No finish timer, Window On the page, Rest Today's time is up, Gate Gate shut
2. you press শুরু করো: Game Ring filling, Timer No finish timer, Window On the page, Rest Today's time is up, Gate Gate shut
3. the ring fills: Game হয়ে গেছে, Timer Finish timer for this routine, Window On the page, Rest Today's time is up, Gate Gate shut
4. you tap a tab: Game Waiting for শুরু করো, Timer Finish timer for a routine you left, Window On the page, Rest Today's time is up, Gate Gate shut
5. 0.7 s later the finish timer fires: Game Done screen for a routine you never finished, Timer No finish timer, Window On the page, Rest Rest screen, Gate Gate shut

## Rules that hold
TypeOK, NoProgressWhileAway, ScreenAwakeOnlyWhileRunning, ScreenAwakeWhileRunning, NoNetwork, NoChildData, NoDeadlock
