# Chit

TLC reached 456 states and 1948 steps. The chart draws 12 states and 22 arrows.
The chart does not draw 1566 steps that stay in one chart state.
The view hides 231 steps, so the chart does not draw them.

## FriendLinkOpensTheirClass breaks
The shortest path has 1 step:
0. Ready
1. you open a friend's link in this tab: Friend's link ignored

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Ready
1. you press Enter: Passing the chit
2. you click into another window: Clock running while you're away

## ResultStaysUntilYouChoose breaks
The shortest path has 3 steps:
0. Ready
1. you press Enter: Passing the chit
2. the chit reaches the last bench: Result
3. the held key repeats: Enter held: the result was skipped

## CelebrationOnlyOnResult breaks
The shortest path has 3 steps:
0. Ready
1. you press Enter: Passing the chit
2. the chit reaches the last bench: Result
3. the held key repeats: Enter held: the result was skipped

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Ready
1. you switch to one-tap: Ready
2. you press Enter: Passing the chit
3. you click into another window: Chit moving while you're away

## LoopComesBack breaks
The shortest path has 5 steps:
0. Ready
1. you turn sound off: Ready
2. you switch to one-tap: Ready
3. you press Enter: Passing the chit
4. you let go: Passing the chit
5. you turn sound on: Chit moving in silence

## Rules that hold
TypeOK, PausedWhenHidden, LoopOnlyWhenMeaningful, NoDoubleResult, NoDeadlock
