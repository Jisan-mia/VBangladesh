# Plane

TLC reached 72 states and 278 steps. The chart draws 15 states and 33 arrows.
The step you hide the tab changes Game, You and Wind, or Game and You, or Game, You, Steering and Wind, or Game, You and Steering, at the same time.
The step you press উড়াও changes Game and Wind at the same time.
The step you play again or pick a level changes Game and Wind, or Game, Steering and Wind, or Game and Steering, at the same time.
The step the wave ends changes Game and Wind, or Game, Steering and Wind, or Game and Steering, at the same time.
The step you press থামাও or P changes Game and Wind, or Game, Steering and Wind, or Game and Steering, at the same time.
The step you press চালিয়ে যাও changes Game and Wind at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game First screen (উড়াও), You On the page, Steering Hands off, Wind Wind quiet
1. you press উড়াও: Game Wave in play, You On the page, Steering Hands off, Wind Wind blows
2. you click into another window: Game Wave in play, You Away, sky frozen, Steering Hands off, Wind Wind blows

## LoopOnlyWhenMeaningful breaks
The shortest path has 2 steps:
0. Game First screen (উড়াও), You On the page, Steering Hands off, Wind Wind quiet
1. you press উড়াও: Game Wave in play, You On the page, Steering Hands off, Wind Wind blows
2. you click into another window: Game Wave in play, You Away, sky frozen, Steering Hands off, Wind Wind blows

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Game First screen (উড়াও), You On the page, Steering Hands off, Wind Wind quiet
1. you press উড়াও: Game Wave in play, You On the page, Steering Hands off, Wind Wind blows
2. you hold a side: Game Wave in play, You On the page, Steering You steer, Wind Wind blows
3. you click into another window: Game Wave in play, You Away, sky frozen, Steering You steer, Wind Wind blows

## PlaneMovesOnlyWhenHeld breaks
The shortest path has 5 steps:
0. Game First screen (উড়াও), You On the page, Steering Hands off, Wind Wind quiet
1. you press উড়াও: Game Wave in play, You On the page, Steering Hands off, Wind Wind blows
2. you hold a side: Game Wave in play, You On the page, Steering You steer, Wind Wind blows
3. you click into another window: Game Wave in play, You Away, sky frozen, Steering You steer, Wind Wind blows
4. you let go: Game Wave in play, You Away, sky frozen, Steering Plane steers on its own, Wind Wind blows
5. you come back to the window: Game Wave in play, You On the page, Steering Plane steers on its own, Wind Wind blows

## Rules that hold
TypeOK, NoProgressWhileAway, PausedWhenHidden, LoopComesBack, NoCheerAfterLeaving, NoDeadlock
