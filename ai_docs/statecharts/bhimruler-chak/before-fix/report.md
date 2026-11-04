# Orchard

TLC reached 356 states and 1255 steps. The chart draws 15 states and 32 arrows.
The chart does not draw 66 steps that stay in one chart state.
The view hides 134 steps, so the chart does not draw them.
The step you hide the tab changes Window and Finger, or Game and Window, or Game, Window and Finger, at the same time.
The step you open a friend's link to level 3 changes Game and Levels at the same time.
The step the long press ties a গামছা changes Game and Finger at the same time.
The step you clear level 2 or 3 before level 1 changes Game and Levels at the same time.
The step you clear level 1 changes Game and Levels at the same time.

## LinkOpensOnlyItsLevel breaks
The shortest path has 1 step:
0. Game Waiting for your first tap, Window You're on the page, Finger Hands off, Levels No friend link; levels open as you clear them
1. you open a friend's link to level 3: Game Friend's orchard, clock not started, Window You're on the page, Finger Hands off, Levels Friend's link; levels 2–3 open, level 1 not cleared

## ClockStillWhileAway breaks
The shortest path has 2 steps:
0. Game Waiting for your first tap, Window You're on the page, Finger Hands off, Levels No friend link; levels open as you clear them
1. you clear a bush, tie a গামছা or take a hint: Game Playing, clock running, Window You're on the page, Finger Hands off, Levels No friend link; levels open as you clear them
2. you click into another window: Game Playing, clock running, Window Another window has focus, Finger Hands off, Levels No friend link; levels open as you clear them

## SavedUnlockIsEarned breaks
The shortest path has 2 steps:
0. Game Waiting for your first tap, Window You're on the page, Finger Hands off, Levels No friend link; levels open as you clear them
1. you open a friend's link to level 3: Game Friend's orchard, clock not started, Window You're on the page, Finger Hands off, Levels Friend's link; levels 2–3 open, level 1 not cleared
2. you clear level 2 or 3 before level 1: Game Orchard cleared, card shows, Window You're on the page, Finger Hands off, Levels Friend's level cleared; levels 2–3 saved open, level 1 never cleared

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Waiting for your first tap, Window You're on the page, Finger Hands off, Levels No friend link; levels open as you clear them
1. you press and hold a bush: Game Waiting for your first tap, Window You're on the page, Finger Finger held on a bush, Levels No friend link; levels open as you clear them
2. you click into another window: Game Waiting for your first tap, Window Another window has focus, Finger Finger held on a bush, Levels No friend link; levels open as you clear them

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, ReplayIsExact, NoDeadlock, UnlockNeverShrinks
