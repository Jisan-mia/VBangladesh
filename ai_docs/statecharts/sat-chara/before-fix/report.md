# SatChara

TLC reached 106 states and 462 steps. The chart draws 12 states and 22 arrows.
The chart does not draw 58 steps that stay in one chart state.
The step you pick a level in সব লেভেল changes Hand and Hum at the same time.
The step you pull the ball back changes Hand and Hum at the same time.
The step you hide the tab changes Window, Hand and Hum, or Window and Hand, or Game and Window, at the same time.
The step you bring it back to the start, or the touch is cancelled changes Hand and Hum at the same time.
The step you let go and the ball flies changes Game, Hand and Hum, or Game and Hand, at the same time.

## OnePressOneThrow breaks
The shortest path has 2 steps:
0. Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound on, no hum
1. you press Enter: Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound on, no hum
2. you keep holding Enter: Game Ball in the air, Window You're on the page, Hand Not pulling, Hum Sound on, no hum

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound on, no hum
1. you pull the ball back: Game Aiming, Window You're on the page, Hand Pulling the ball back, Hum Hum on
2. you click into another window: Game Aiming, Window Another window has focus, Hand Pulling the ball back, Hum Hum on

## HumOnlyWhilePulling breaks
The shortest path has 2 steps:
0. Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound on, no hum
1. you pull the ball back: Game Aiming, Window You're on the page, Hand Pulling the ball back, Hum Hum on
2. you click into another window: Game Aiming, Window Another window has focus, Hand Pulling the ball back, Hum Hum on

## HumComesBack breaks
The shortest path has 3 steps:
0. Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound on, no hum
1. you turn sound off: Game Aiming, Window You're on the page, Hand Not pulling, Hum Sound off
2. you pull the ball back: Game Aiming, Window You're on the page, Hand Pulling the ball back, Hum Sound off
3. you turn sound on: Game Aiming, Window You're on the page, Hand Pulling the ball back, Hum Sound on, no hum

## Rules that hold
TypeOK, PausedWhenHidden, NoProgressWhileAway, PausedMeansFrozen, NothingHeldOnTheResult, NoDeadlock
