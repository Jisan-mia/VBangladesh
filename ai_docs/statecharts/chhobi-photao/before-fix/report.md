# Chhobi

TLC reached 320 states and 1680 steps. The chart draws 9 states and 36 arrows.
The chart does not draw 639 steps that stay in one chart state.
The view hides 560 steps, so the chart does not draw them.

## ChoiceFreezesPlay breaks
The shortest path has 2 steps:
0. Blank picture, clock not started
1. you open সব লেভেল or the album: Blank picture, clock not started
2. you press a cell and drag: Filling in, clock counting, dragging, levels drawer open

## ClockStillWhileAway breaks
The shortest path has 2 steps:
0. Blank picture, clock not started
1. you press a cell and drag: Filling in, clock counting, dragging
2. you click into another window: Filling in, clock counting, drag still held while you're away, you're in another window

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Blank picture, clock not started
1. you press a cell and drag: Filling in, clock counting, dragging
2. you click into another window: Filling in, clock counting, drag still held while you're away, you're in another window

## Rules that hold
TypeOK, PausedWhenHidden, PausedMeansStill, ClockStopsOnTheCard, CheerOnlyForThisPicture, ReplayIsExact, NoDeadlock
