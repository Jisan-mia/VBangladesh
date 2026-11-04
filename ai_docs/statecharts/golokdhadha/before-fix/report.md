# Golokdhadha

TLC reached 420 states and 2140 steps. The chart draws 19 states and 42 arrows.
The chart does not draw 40 steps that stay in one chart state.
The step you press an arrow changes Game and Card at the same time.
The step you press আজকের ধাঁধা changes Game and Maze, or Game, Speed and Maze, or Game and Speed, at the same time.
The step you hide the tab changes Game and Window at the same time.
The step you pick a level changes Game and Maze, or Game and Speed, or Game, Speed and Maze, or Maze and Card, at the same time.
The step you press আবার শুরু or আবার খেলো changes Game and Speed at the same time.
The step you swipe changes Game and Card at the same time.
The step you press the card's gold button changes Game and Maze, or Game and Speed, or Game, Speed and Maze, at the same time.
The step you press Enter on the card changes Game and Card, or Game and Speed, or Game, Speed and Card, at the same time.
The step you move the mouse without pressing changes Game and Card at the same time.

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you press an arrow: Game Walking, clock running, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
2. you click into another window: Game Walking, clock running, Window Another window has focus, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you press an arrow: Game Walking, clock running, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
2. you click into another window: Game Walking, clock running, Window Another window has focus, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you put a finger or the mouse down on the board: Game Waiting at home, Window You're on the page, Finger Finger or mouse held on the board, Speed Full speed, Maze A level, Card Card keys as labelled
2. you click into another window: Game Waiting at home, Window Another window has focus, Finger Finger or mouse held on the board, Speed Full speed, Maze A level, Card Card keys as labelled

## StarsMatchYourSpeed breaks
The shortest path has 3 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you press an arrow: Game Walking, clock running, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
2. you press ধীরে খেলো: Game Walking, clock running, Window You're on the page, Finger Hands off, Speed ধীরে খেলো on, after walking at full speed, Maze A level, Card Card keys as labelled
3. the walker reaches the shop: Game At the shop, graded at the slow par, Window You're on the page, Finger Hands off, Speed ধীরে খেলো on, after walking at full speed, Maze A level, Card Card keys as labelled

## NoSteeringWithoutAPress breaks
The shortest path has 3 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you put a finger or the mouse down on the board: Game Waiting at home, Window You're on the page, Finger Finger or mouse held on the board, Speed Full speed, Maze A level, Card Card keys as labelled
2. you click into another window: Game Waiting at home, Window Another window has focus, Finger Finger or mouse held on the board, Speed Full speed, Maze A level, Card Card keys as labelled
3. you let go in the other window: Game Waiting at home, Window Another window has focus, Finger Button up, but the game still thinks it's held, Speed Full speed, Maze A level, Card Card keys as labelled

## EnterDoesWhatTheButtonSays breaks
The shortest path has 4 steps:
0. Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze A level, Card Card keys as labelled
1. you press আজকের ধাঁধা: Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze Today's maze, Card Card keys as labelled
2. you press an arrow: Game Walking, clock running, Window You're on the page, Finger Hands off, Speed Full speed, Maze Today's maze, Card Card keys as labelled
3. the walker reaches the shop: Game At the shop, card shows, Window You're on the page, Finger Hands off, Speed Full speed, Maze Today's maze, Card Card keys as labelled
4. you press Enter on the card: Game Waiting at home, Window You're on the page, Finger Hands off, Speed Full speed, Maze Today's maze, Card Enter did something the gold button doesn't say

## Rules that hold
TypeOK, PausedWhenHidden, WalkerStillUnlessPlaying, NoDeadlock
