# TarerFankeBelun

TLC reached 216 states and 892 steps. The chart draws 20 states and 33 arrows.
The chart does not draw 8 steps that stay in one chart state.
The view hides 72 steps, so the chart does not draw them.
The step you tap (puff) changes Game and Hum at the same time.
The step you hide the tab changes Game and Window, or Game, Window and Hum, at the same time.
The step you scroll the game out of view changes Game and Window, or Game, Window and Hum, at the same time.
The step you turn sound off changes Hum and Sound at the same time.
The step the balloon touches a wire or the street changes Game and Hum at the same time.
The step the last crossing is passed changes Game and Celebration, or Game, Hum and Celebration, or Game and Hum, at the same time.
The step you pick যত দূর পারো changes Game and Street at the same time.
The step you pick a level changes Game and Street at the same time.
The step the result shows a new best changes Game and Celebration at the same time.

## LoopComesBack breaks
The shortest path has 2 steps:
0. Game Waiting for the first puff, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
1. you tap (puff): Game Flying, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
2. you turn sound on: Game Flying, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound on, Celebration Nothing waiting

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting for the first puff, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
1. you tap (puff): Game Flying, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
2. you click into another window: Game Flying, Street যত দূর পারো, Window Another window has focus, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting

## NoCelebrationAfterLeaving breaks
The shortest path has 3 steps:
0. Game Waiting for the first puff, Street A level, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
1. you tap (puff): Game Flying, Street A level, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Nothing waiting
2. the last crossing is passed: Game Level cleared (just now), Street A level, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Fanfare waiting to fire
3. you pick যত দূর পারো: Game Waiting for the first puff, Street যত দূর পারো, Window On the page, Hum Wire hum off, Sound Sound off, Celebration Fanfare waiting to fire

## Rules that hold
TypeOK, PausedWhenHidden, PausedWhenOffScreen, LoopOnlyWhenMeaningful, NoTapPastResult, NoDoubleResult, NoDeadlock
