# ChhipFelo

TLC reached 136 states and 544 steps. The chart draws 16 states and 29 arrows.
2 states outside the constraints each end a rule's path, and the chart includes them. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 12 steps that stay in one chart state.
The view hides 370 steps, so the chart does not draw them.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Aiming the rod
1. you press and hold: Aiming the rod
2. you click into another window: Aiming the rod, you're away, Space still held

## PausedWhenBlurred breaks
The shortest path has 3 steps:
0. Aiming the rod
1. you press and hold: Aiming the rod
2. you let go and the float flies: Float in the air
3. you click into another window: Float in the air, you're away

## FanfareOnlyOnTheResult breaks
The shortest path has 5 steps:
0. Aiming the rod
1. you press and hold: Aiming the rod
2. you let go and the float flies: Float in the air
3. the float lands: Watching the float
4. the cast ends: Result just showed
5. you pick a level in সব লেভেল: Aiming the rod · the last result's fanfare still to go off

## LoopOnlyWhenMeaningful breaks
The shortest path has 5 steps:
0. Aiming the rod
1. you press and hold: Aiming the rod
2. you let go and the float flies: Float in the air
3. the float lands: Watching the float
4. you strike as the float goes under: Fish on the line
5. you click into another window: Fish on the line, you're away, Space still held

## OpenLevelsAreEarned breaks
The shortest path has 6 steps:
0. Aiming the rod
1. you open a friend's link: Aiming the rod
2. you press and hold: Aiming the rod
3. you let go and the float flies: Float in the air
4. the float lands: Watching the float
5. you strike as the float goes under: Fish on the line
6. you land the fish: Result just showed · a level opened that you never cleared

## Rules that hold
TypeOK, NoProgressWhileAway, PausedWhenHidden, LoopComesBack, PausedMeansFrozen, NoDeadlock
