# SapLudu

TLC reached 54 states and 184 steps. The chart draws 12 states and 30 arrows.
The chart does not draw 13 steps that stay in one chart state.
The view hides 22 steps, so the chart does not draw them.
The step you hide the tab changes Game and Window at the same time.
The step you press নতুন খেলা changes Game and Dice at the same time.
The step you press আরেকবার changes Game and Dice at the same time.

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Game Waiting for the first roll, Window You're on the page, Dice Fresh dice
1. you tap the dice: Game Piece walks, Window You're on the page, Dice Fresh dice
2. you click into another window: Game Piece walks, Window Another window has focus, Dice Fresh dice

## Rules that hold
TypeOK, PausedWhenHidden, ChoiceFreezesPlay, NothingMovesWhilePaused, NoDoubleResult, ResultMatchesPlay, OneCoverAtATime, ReplayIsExact, NoDeadlock
