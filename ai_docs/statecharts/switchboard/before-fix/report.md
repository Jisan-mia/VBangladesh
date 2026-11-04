# Switchboard

TLC reached 352 states and 1826 steps. The chart draws 9 states and 36 arrows.
The chart does not draw 666 steps that stay in one chart state.

## OpenLevelsAreEarned breaks
The shortest path has 2 steps:
0. Fresh board
1. you open a friend's link: Fresh board on a locked level
2. you light the last bulb: All bulbs lit, level 2 saved though level 1 never was

## HumComesBack breaks
The shortest path has 3 steps:
0. Fresh board
1. you turn sound off: Fresh board
2. you press a switch: Flipping switches, hum plays when sound is on
3. you turn sound on: Flipping switches, hum silent though sound is on

## BoardFrozenWhilePaused breaks
The shortest path has 4 steps:
0. Fresh board
1. you press a switch: Flipping switches, hum plays when sound is on
2. you hide the tab: Paused, board as you left it
3. the tab shows again: Paused, board as you left it
4. you press Z to take back: Paused, but a move was taken back

## Rules that hold
TypeOK, HiddenMeansPaused, HumOnlyWhilePlaying, NoDoubleResult, ResultMatchesPlay, NoChimeAfterMovingOn, ReplayIsExact, NoDeadlock
