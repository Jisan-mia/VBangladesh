# JoraMelao

TLC reached 403 states and 1357 steps. The chart draws 12 states and 22 arrows.
1 state outside the constraints ends a rule's path, and the chart includes it. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 52 steps that stay in one chart state.
The view hides 80 steps, so the chart does not draw them.
The step you hide the tab changes Board and Tab at the same time.
The step you match the last pair of the friend's level 2 changes Board and Levels at the same time.

## LevelsOpenInOrder breaks
The shortest path has 2 steps:
0. Board Fresh board, demo pair up, Tab Tab showing, Levels Opened from a friend's level 2 link
1. you flip a card: Board One card up, Tab Tab showing, Levels Opened from a friend's level 2 link
2. you match the last pair of the friend's level 2: Board Last pair found, Tab Tab showing, Levels Level 2 has stars, level 1 never played

## Rules that hold
TypeOK, PausedWhenHidden, NothingShowingWhilePaused, NoDoubleResult, NoCheerAfterMovingOn, NoDeadlock, NoProgressWhilePaused, StarsNeverDrop, UnlockNeverShrinks
