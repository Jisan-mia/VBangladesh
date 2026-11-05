# Moshar

TLC reached 168 states and 560 steps. The chart draws 14 states and 26 arrows.
The chart does not draw 6 steps that stay in one chart state.
The view hides 62 steps, so the chart does not draw them.
The step you turn sound on changes Whine and Sound at the same time.
The step you hide the tab changes Night and Window, or Night, Window and Whine, at the same time.
The step you scroll the room away changes Window and Whine at the same time.
The step you turn sound off changes Whine and Sound at the same time.
The step the third bite wakes the sleeper changes Night and Whine at the same time.
The step dawn comes changes Night and Whine at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Night Lights on, waiting, Window You're on the room, Whine No whine, Sound Sound off
1. you tap শুরু করো: Night Mosquitoes flying, Window You're on the room, Whine No whine, Sound Sound off
2. you click into another window: Night Mosquitoes flying, Window Another window has focus, Whine No whine, Sound Sound off

## LoopOnlyWhenMeaningful breaks
The shortest path has 3 steps:
0. Night Lights on, waiting, Window You're on the room, Whine No whine, Sound Sound on
1. you tap শুরু করো: Night Mosquitoes flying, Window You're on the room, Whine No whine, Sound Sound on
2. a mosquito flies near: Night Mosquitoes flying, Window You're on the room, Whine পিন-পিন playing, Sound Sound on
3. you click into another window: Night Mosquitoes flying, Window Another window has focus, Whine পিন-পিন playing, Sound Sound on

## Rules that hold
TypeOK, PausedWhenHidden, LoopComesBack, NoDoubleResult, NoWhineOnTheCard, NoDeadlock, StarsNeverDrop
