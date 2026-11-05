# Danguli

TLC reached 279 states and 1318 steps. The chart draws 12 states and 22 arrows.
The view hides 1090 steps, so the chart does not draw them.

## ReplayIsExact breaks
The shortest path has 1 step:
0. Ready to flick
1. you pick a level from the grid: Friend's challenge up, on a new field

## HeldKeyActsOnce breaks
The shortest path has 2 steps:
0. Ready to flick
1. you press Space: কাঠি in the air
2. the held key repeats: Space held: the game plays by itself

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Ready to flick
1. you press Space: কাঠি in the air
2. you click into another window: কাঠি in the air while you're away

## ResultStaysUntilYouChoose breaks
The shortest path has 4 steps:
0. Ready to flick
1. you press Space: কাঠি in the air
2. the কাঠি lands untouched: Hit in play
3. the held key repeats: Space held: the game plays by itself
4. the held key repeats: Space held: the card was skipped

## Rules that hold
TypeOK, PausedWhenHidden, InputReleasedWhenAway, NoDoubleResult, CelebrationOnlyOnResult, NoDeadlock
