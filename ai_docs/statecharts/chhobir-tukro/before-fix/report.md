# Jigsaw

TLC reached 164 states and 826 steps. The chart draws 18 states and 32 arrows.
The chart does not draw 54 steps that stay in one chart state.
The view hides 156 steps, so the chart does not draw them.
The step you pick up a piece and drag it changes Game and Hand, or Game, Window and Hand, or Window and Hand, at the same time.
The step you tap a piece changes Game and Window at the same time.
The step you hide the tab changes Game, Window and Hand, or Game and Window, at the same time.
The step the last piece goes in changes Game, Hand, Cheer and Levels, or Game, Cheer and Levels, or Game, Hand and Cheer, or Game and Cheer, at the same time.
The step you press চালিয়ে যাও changes Game and Window at the same time.

## PieceDroppedWhenAway breaks
The shortest path has 2 steps:
0. Game Pieces in the tray, clock at zero (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
1. you pick up a piece and drag it: Game Putting pieces in, clock running (level 1), Window You're on the page, Hand A piece under your finger, Cheer Nothing waiting, Levels Only level 1 open
2. you click into another window: Game Putting pieces in, clock running (level 1), Window Another window has focus, Hand A piece under your finger, Cheer Nothing waiting, Levels Only level 1 open

## ClockStillWhileAway breaks
The shortest path has 2 steps:
0. Game Pieces in the tray, clock at zero (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
1. you tap a piece: Game Putting pieces in, clock running (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
2. you click into another window: Game Putting pieces in, clock running (level 1), Window Another window has focus, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Pieces in the tray, clock at zero (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
1. you tap a piece: Game Putting pieces in, clock running (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
2. you click into another window: Game Putting pieces in, clock running (level 1), Window Another window has focus, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open

## OpenLevelsAreEarned breaks
The shortest path has 3 steps:
0. Game Pieces in the tray, clock at zero (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
1. you open a friend's link: Game Pieces in the tray, clock at zero (level 2), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
2. you pick up a piece and drag it: Game Putting pieces in, clock running (level 2), Window You're on the page, Hand A piece under your finger, Cheer Nothing waiting, Levels Only level 1 open
3. the last piece goes in: Game The painting is whole, result shows (level 2), Window You're on the page, Hand Hands off, Cheer Win sound and confetti still to go off, Levels A level opened that you never earned

## CheerOnlyOnTheResult breaks
The shortest path has 3 steps:
0. Game Pieces in the tray, clock at zero (level 1), Window You're on the page, Hand Hands off, Cheer Nothing waiting, Levels Only level 1 open
1. you pick up a piece and drag it: Game Putting pieces in, clock running (level 1), Window You're on the page, Hand A piece under your finger, Cheer Nothing waiting, Levels Only level 1 open
2. the last piece goes in: Game The painting is whole, result shows (level 1), Window You're on the page, Hand Hands off, Cheer Win sound and confetti still to go off, Levels Level 2 open, earned
3. you press পরের লেভেল, আবার খেলো or a level in সব লেভেল: Game Pieces in the tray, clock at zero (level 2), Window You're on the page, Hand Hands off, Cheer Win sound and confetti still to go off, Levels Level 2 open, earned

## Rules that hold
TypeOK, PausedWhenHidden, PausedMeansFrozen, ClockMeansPlaying, NoDeadlock
