# Late

TLC reached 364 states and 1438 steps. The chart draws 12 states and 26 arrows.
The chart does not draw 1091 steps that stay in one chart state.
The view hides 148 steps, so the chart does not draw them.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Ready
1. you press Space: Running
2. you click into another window: Running while you're away

## ReplayIsExact breaks
The shortest path has 3 steps:
0. Ready
1. you press Space: Running
2. you let go: Running
3. you open a friend's link: Your road under the friend's banner

## CelebrationOnlyOnResult breaks
The shortest path has 4 steps:
0. Ready
1. you press Space: Running
2. the kid reaches the gate: Result
3. you let go: Result
4. you open a friend's link: Ready, the old confetti still to come

## ResultStaysUntilYouChoose breaks
The shortest path has 4 steps:
0. Ready
1. you press Space: Running
2. the kid bumps into something: Result
3. আরেকবার takes focus: Result
4. you let go: Space let go: a new run started by itself

## InputReleasedWhenAway breaks
The shortest path has 4 steps:
0. Ready
1. you press Space: Running
2. you let go: Running
3. you hold ↓: Ducking
4. you click into another window: Running ducked while you're away

## InputMatchesHand breaks
The shortest path has 4 steps:
0. Ready
1. you press Space: Running
2. you let go: Running
3. you hold ↓: Ducking
4. you click into another window: Running ducked while you're away

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, NoDeadlock
