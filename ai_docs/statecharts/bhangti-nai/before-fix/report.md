# Bhangti

TLC reached 336 states and 1524 steps. The chart draws 12 states and 27 arrows.
The chart does not draw 104 steps that stay in one chart state.
The view hides 280 steps, so the chart does not draw them.
The step you hide the tab changes Shop and Window at the same time.
The step you scroll the counter away changes Shop and Window at the same time.

## OffScreenMeansPaused breaks
The shortest path has 2 steps:
0. Shop Shop not open yet, Window You're at the counter, Clock Clock on
1. you scroll the counter away: Shop Shop not open yet, Window Counter scrolled away, Clock Clock on
2. you tap শুরু করো: Shop Customer waits for change, Window Counter scrolled away, Clock Clock on

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Shop Shop not open yet, Window You're at the counter, Clock Clock on
1. you tap শুরু করো: Shop Customer waits for change, Window You're at the counter, Clock Clock on
2. you click into another window: Shop Customer waits for change, Window Another window has focus, Clock Clock on

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Shop Shop not open yet, Window You're at the counter, Clock Clock on
1. you tap শুরু করো: Shop Customer waits for change, Window You're at the counter, Clock Clock on
2. you click into another window: Shop Customer waits for change, Window Another window has focus, Clock Clock on

## NothingPendingWhilePaused breaks
The shortest path has 3 steps:
0. Shop Shop not open yet, Window You're at the counter, Clock Clock on
1. you tap শুরু করো: Shop Customer waits for change, Window You're at the counter, Clock Clock on
2. the customer's time runs out: Shop Customer leaving, Window You're at the counter, Clock Clock on
3. you press pause: Shop Paused, a customer is leaving, Window You're at the counter, Clock Clock on

## DayEndsOnlyWhilePlaying breaks
TLC's counterexample is in tlc-DayEndsOnlyWhilePlaying.out. It has 6 steps:
0. Shop Shop not open yet, Window You're at the counter, Clock Clock on
1. you tap শুরু করো: Shop Customer waits for change, Window You're at the counter, Clock Clock on
2. you hand over the right change: Shop Customer leaving, Window You're at the counter, Clock Clock on
3. the next customer steps up: Shop Customer waits for change, Window You're at the counter, Clock Clock on
4. you hand over the right change: Shop Customer leaving, Window You're at the counter, Clock Clock on
5. you press pause: Shop Paused, a customer is leaving, Window You're at the counter, Clock Clock on
6. the shop closes and the card shows: Shop Card shows, Window You're at the counter, Clock Clock on

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, NoFanfareAfterMovingOn, NoDeadlock, StarsNeverDrop
