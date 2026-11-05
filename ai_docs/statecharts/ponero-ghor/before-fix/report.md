# Ponero

TLC reached 352 states and 1602 steps. The chart draws 11 states and 30 arrows.
The chart does not draw 490 steps that stay in one chart state.
The view hides 578 steps, so the chart does not draw them.

## UnlockNeverShrinks breaks
The shortest path has 2 steps:
0. Fresh plate
1. a friend's link opens: Fresh plate
2. a friend's link opens: Fresh plate, a level you opened is locked again

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Fresh plate
1. you press a ঘুঁটি: Fresh plate, finger down
2. you leave (another window or tab): Fresh plate, finger still counts as down while you're away

## Rules that hold
TypeOK, PausedWhenHidden, PausedOnlyMidPlate, ChimesOnlyForThisWin, ReplayIsExact, NoDeadlock
