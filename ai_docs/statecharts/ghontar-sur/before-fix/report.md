# Ghontar

TLC reached 240 states and 976 steps. The chart draws 13 states and 35 arrows.
The chart does not draw 418 steps that stay in one chart state.
The view hides 312 steps, so the chart does not draw them.

## ReplayIsExact breaks
The shortest path has 1 step:
0. Ready to start
1. a friend's link opens: Friend's tune ready, from level ১

## ChoiceFreezesPlay breaks
The shortest path has 2 steps:
0. Ready to start
1. you open সব লেভেল: Ready to start
2. you press শুরু করো or আরেকবার: The tune plays, level list open

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Ready to start
1. you press শুরু করো or আরেকবার: The tune plays
2. you click into another window: The tune plays, you're away

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Ready to start
1. you press শুরু করো or আরেকবার: The tune plays
2. you click into another window: The tune plays, you're away

## EveryClearIsShown breaks
The shortest path has 4 steps:
0. Ready to start
1. you press শুরু করো or আরেকবার: The tune plays
2. the tune ends: Your turn
3. you finish a level's last tune: Level done, clear screen coming
4. you hide the tab: Paused, clear screen skipped

## PausedMeansSilent breaks
The shortest path has 7 steps:
0. Ready to start
1. you press শুরু করো or আরেকবার: The tune plays
2. the tune ends: Your turn
3. you finish a level's last tune: Level done, clear screen coming
4. the clear screen shows: Level clear screen
5. you hide the tab: Paused on the clear screen
6. you come back: Paused on the clear screen
7. you press পরের লেভেল: Paused, but the tune plays

## Rules that hold
TypeOK, PausedWhenHidden, NothingAfterTheCard, NoDeadlock
