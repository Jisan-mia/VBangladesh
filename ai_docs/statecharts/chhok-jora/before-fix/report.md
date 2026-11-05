# ChhokJora

TLC reached 396 states and 1296 steps. The chart draws 17 states and 38 arrows.
1 state outside the constraints ends a rule's path, and the chart includes it. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The view hides 48 steps, so the chart does not draw them.
The step you hide the tab changes Quilt and Tab, or Tab and Finger, or Quilt, Tab and Finger, at the same time.
The step you open কাটাকুটি changes Quilt and Screen at the same time.
The step you press Enter on the last gap changes Quilt and Cheer at the same time.
The step you pick a quilt mode changes Quilt and Screen at the same time.
The step the bot sews the last box changes Quilt and Cheer at the same time.
The step you sew a stitch changes Quilt and Finger at the same time.
The step you sew the last box changes Quilt, Finger and Cheer, or Quilt and Finger, at the same time.

## NoCheerAfterMovingOn breaks
The shortest path has 2 steps:
0. Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Quiet
1. you press Enter on the last gap: Quilt Quilt just finished, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Cheer on its way
2. you press আরেকবার or Enter: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Cheer on its way

## ResultStaysABeat breaks
The shortest path has 2 steps:
0. Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Quiet
1. you press Enter on the last gap: Quilt Quilt just finished, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Cheer on its way
2. you press আরেকবার or Enter: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Cheer on its way

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Quiet
1. you touch the cloth: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger Finger on the cloth, Cheer Quiet
2. you hide the tab: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab hidden, Finger Page still thinks a finger is down, Cheer Quiet

## GhostOnlyUnderAFinger breaks
The shortest path has 3 steps:
0. Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Quiet
1. you touch the cloth: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger Finger on the cloth, Cheer Quiet
2. you hide the tab: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab hidden, Finger Page still thinks a finger is down, Cheer Quiet
3. the tab shows again: Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger Page still thinks a finger is down, Cheer Quiet

## BotsWaitWhileHidden breaks
TLC's counterexample is in tlc-BotsWaitWhileHidden.out. It has 4 steps:
0. Quilt Fresh quilt, Screen Quilt on screen, Tab Tab showing, Finger No finger, Cheer Quiet
1. you open কাটাকুটি: Quilt Fresh quilt, Screen কাটাকুটি, your turn, Tab Tab showing, Finger No finger, Cheer Quiet
2. you mark a cell: Quilt Fresh quilt, Screen কাটাকুটি, bot's turn, Tab Tab showing, Finger No finger, Cheer Quiet
3. you hide the tab: Quilt Fresh quilt, Screen কাটাকুটি, bot's turn, Tab Tab hidden, Finger No finger, Cheer Quiet
4. the কাটাকুটি bot marks: Quilt Fresh quilt, Screen কাটাকুটি, your turn, Tab Tab hidden, Finger No finger, Cheer Quiet

## QuiltWaitsOffScreen breaks
TLC found a counterexample. It is in tlc-QuiltWaitsOffScreen.out.

## Rules that hold
TypeOK, PausedWhenHidden, NoDoubleResult, NoDeadlock
