# Marble

TLC reached 336 states and 1456 steps. The chart draws 18 states and 37 arrows.
The chart does not draw 100 steps that stay in one chart state.
The step you hide the tab changes Game, You, Side and Hum, or Game, You and Hum, or Game, You and Side, or You and Side, or Game and You, at the same time.
The step you hold a side changes Game, Side and Hum, or Game and Side, at the same time.
The step you lose the last chance changes Game, Side and Hum, or Game and Hum, or Game and Side, at the same time.
The step you play again or pick a floor changes Game and Hum at the same time.
The step you press থামাও or P changes Game and Hum at the same time.
The step you press চালিয়ে যাও changes Game and Hum at the same time.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime No chime due
2. you click into another window: Game Marble rolling down, You Away, stairs frozen, Side You hold a side, Hum Hum on, Chime No chime due

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime No chime due
2. you click into another window: Game Marble rolling down, You Away, stairs frozen, Side You hold a side, Hum Hum on, Chime No chime due

## LoopOnlyWhenMeaningful breaks
The shortest path has 2 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime No chime due
2. you click into another window: Game Marble rolling down, You Away, stairs frozen, Side You hold a side, Hum Hum on, Chime No chime due

## LoopComesBack breaks
The shortest path has 3 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you turn sound off: Game First screen, You On the page, Side Hands off, Hum Sound off, Chime No chime due
2. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Sound off, Chime No chime due
3. you turn sound on: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum stuck silent, Chime No chime due

## NoChimeAfterLeaving breaks
The shortest path has 4 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime No chime due
2. you clear a floor without a fall: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime Chime coming
3. you lose the last chance: Game Result shows, You On the page, Side Holding, game didn't notice, Hum Hum off, Chime Chime coming
4. the chime plays: Game Result shows, You On the page, Side Holding, game didn't notice, Hum Hum off, Chime Chime played out of place

## MarbleRollsOnlyWhenHeld breaks
The shortest path has 4 steps:
0. Game First screen, You On the page, Side Hands off, Hum Hum off, Chime No chime due
1. you hold a side: Game Marble rolling down, You On the page, Side You hold a side, Hum Hum on, Chime No chime due
2. you click into another window: Game Marble rolling down, You Away, stairs frozen, Side You hold a side, Hum Hum on, Chime No chime due
3. you let go: Game Marble rolling down, You Away, stairs frozen, Side Marble rolls on its own, Hum Hum on, Chime No chime due
4. you come back to the window: Game Marble rolling down, You On the page, Side Marble rolls on its own, Hum Hum on, Chime No chime due

## Rules that hold
TypeOK, NoProgressWhileAway, PausedWhenHidden, NoDeadlock
