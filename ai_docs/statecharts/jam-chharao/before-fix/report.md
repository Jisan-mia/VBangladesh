# Jam

TLC reached 141 states and 483 steps. The chart draws 12 states and 33 arrows.
The chart does not draw 3 steps that stay in one chart state.
The view hides 66 steps, so the chart does not draw them.
The step you hide the tab changes Jam and Window at the same time.
The step you lift your finger changes Jam and Finger at the same time.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Jam no moves yet, Window You're on the page, Finger Finger off
1. you press on a car: Jam no moves yet, Window You're on the page, Finger Dragging a car
2. you click into another window: Jam no moves yet, Window Another window has focus, Finger Dragging a car

## NothingMovesWhilePaused breaks
TLC's counterexample is in tlc-NothingMovesWhilePaused.out. It has 4 steps:
0. Jam no moves yet, Window You're on the page, Finger Finger off
1. you slide a car with the arrows or a hint: Jam one move made, Window You're on the page, Finger Finger off
2. you hide the tab: Jam Paused, one move made, Window Tab hidden, Finger Finger off
3. the tab shows again: Jam Paused, one move made, Window You're on the page, Finger Finger off
4. you press ফিরিয়ে আনো: Jam Paused, no moves yet, Window You're on the page, Finger Finger off

## NoDropCountsWhilePaused breaks
TLC's counterexample is in tlc-NoDropCountsWhilePaused.out. It has 5 steps:
0. Jam no moves yet, Window You're on the page, Finger Finger off
1. you slide a car with the arrows or a hint: Jam one move made, Window You're on the page, Finger Finger off
2. you press on a car: Jam one move made, Window You're on the page, Finger Dragging a car
3. you hide the tab: Jam Paused, one move made, Window Tab hidden, Finger Dragging a car
4. the tab shows again: Jam Paused, one move made, Window You're on the page, Finger Dragging a car
5. you lift your finger: Jam Paused, two moves made, Window You're on the page, Finger Finger off

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, NoChimeAfterMovingOn, ResultMatchesPlay, NoDeadlock, StarsNeverDrop
