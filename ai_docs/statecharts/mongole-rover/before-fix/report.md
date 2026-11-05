# Rover

TLC reached 288 states and 1053 steps. The chart draws 13 states and 30 arrows.
2 states outside the constraints each end a rule's path, and the chart includes them. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 127 steps that stay in one chart state.
The step the page reloads changes Game and Rest, or Game and You, or Game, Rest and You, at the same time.
The step you pick a level changes Game and You at the same time.
The step you tap চালাও changes Game and You at the same time.
The step you tap চালাও again quickly (or press Enter) changes Game and You at the same time.
The step you tap থামাও changes Game and You at the same time.
The step the rover bumps and stops changes Game and You at the same time.
The step the rover picks up the last rock changes Game and You, or Game, Rest and You, at the same time.

## OneTapOneRun breaks
The shortest path has 3 steps:
0. Game No arrows yet, Rest Time left today, You Here
1. you add or remove arrows: Game Planning, Rest Time left today, You Here
2. you tap চালাও: Game Run starting, rover still at the start, Rest Time left today, You Here, finger on the চালাও spot
3. you tap চালাও again quickly (or press Enter): Game Planning, Rest Time left today, You Here

## NoProgressWhileAway breaks
The shortest path has 4 steps:
0. Game No arrows yet, Rest Time left today, You Here
1. you add or remove arrows: Game Planning, Rest Time left today, You Here
2. you tap চালাও: Game Run starting, rover still at the start, Rest Time left today, You Here, finger on the চালাও spot
3. you look away: Game Run starting, rover still at the start, Rest Time left today, You Looking away
4. the rover moves a square: Game Rover driving, Rest Time left today, You Looking away

## Rules that hold
TypeOK, NoDoubleResult, RestOnlyAtBreak, RestStaysUntilAGrownUp, NoNetwork, NoChildData, NoDeadlock, StarsNeverDrop, UnlockNeverShrinks
