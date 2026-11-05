# AtirAam

TLC reached 262 states and 905 steps. The chart draws 21 states and 32 arrows.
The chart does not draw 63 steps that stay in one chart state.
The view hides 157 steps, so the chart does not draw them.
The step you swipe two কাঁচা আম into a পাকা আম changes Run, Board and Celebration, or Board and Celebration, at the same time.
The step you swipe changes only one of Run and Board at a time.

## CelebrationMatchesBoard breaks
The shortest path has 2 steps:
0. Run Fresh plot, Board No পাকা আম yet, Celebration Nothing yet
1. you swipe two কাঁচা আম into a পাকা আম: Run Swiping, Board পাকা আম just grown (ফেরত নাও removes it), Celebration banner showing, confetti due
2. you press ফেরত নাও: Run Swiping, Board No পাকা আম yet, Celebration banner showing, confetti due

## CheerOncePerRun breaks
The shortest path has 4 steps:
0. Run Fresh plot, Board No পাকা আম yet, Celebration Nothing yet
1. you swipe two কাঁচা আম into a পাকা আম: Run Swiping, Board পাকা আম just grown (ফেরত নাও removes it), Celebration banner showing, confetti due
2. the confetti falls: Run Swiping, Board পাকা আম just grown (ফেরত নাও removes it), Celebration banner showing, confetti fell once
3. you press ফেরত নাও: Run Swiping, Board No পাকা আম yet, Celebration banner showing, confetti fell once
4. you swipe two কাঁচা আম into a পাকা আম: Run Swiping, Board পাকা আম just grown (ফেরত নাও removes it), Celebration banner showing, confetti due again, confetti fell once

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, NoDeadlock
