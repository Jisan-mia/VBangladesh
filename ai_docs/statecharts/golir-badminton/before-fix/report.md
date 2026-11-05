# Badminton

TLC reached 268 states and 1182 steps. The chart draws 16 states and 42 arrows.
The chart does not draw 180 steps that stay in one chart state.
The view hides 136 steps, so the chart does not draw them.
The step you pick a level or play again changes Game and Leftovers at the same time.
The step the court scrolls off screen changes You and Leftovers at the same time.
The step you hide the tab changes Game and You, or Game, You and Leftovers, or You and Leftovers, at the same time.
The step someone reaches five points changes Game and Leftovers, or Game and You, or Game, You and Leftovers, or You and Leftovers, at the same time.
The step you press Space changes Game and Leftovers at the same time.

## PauseOnlyMidMatch breaks
The shortest path has 1 step:
0. Game First screen, You On the page, Leftovers Nothing left on
1. you hide the tab: Game Paused before the first serve, You Tab hidden, Leftovers Nothing left on

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game First screen, You On the page, Leftovers Nothing left on
1. you pick a level or play again: Game Match in play, You On the page, Leftovers Nothing left on
2. you click into another window: Game Match in play, You Away, shuttle frozen, Leftovers Nothing left on

## NoTapPastResult breaks
The shortest path has 3 steps:
0. Game First screen, You On the page, Leftovers Nothing left on
1. you pick a level or play again: Game Match in play, You On the page, Leftovers Nothing left on
2. someone reaches five points: Game Result just appeared, You On the page, Leftovers Nothing left on
3. you press Space: Game Result skipped by a key, You On the page, Leftovers Nothing left on

## LoopOnlyWhenMeaningful breaks
The shortest path has 3 steps:
0. Game First screen, You On the page, Leftovers Nothing left on
1. you pick a level or play again: Game Match in play, You On the page, Leftovers Nothing left on
2. the next shuttle flies: Game Match in play, You On the page, Leftovers wind howls
3. you click into another window: Game Match in play, You Away, shuttle frozen, Leftovers wind howls

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Game First screen, You On the page, Leftovers Nothing left on
1. you pick a level or play again: Game Match in play, You On the page, Leftovers Nothing left on
2. you press and hold: Game Match in play, You On the page, Leftovers racket up
3. you click into another window: Game Match in play, You Away, shuttle frozen, Leftovers racket up

## NoProgressWhileAway breaks
The shortest path has 4 steps:
0. Game First screen, You On the page, Leftovers Nothing left on
1. the court scrolls off screen: Game First screen, You Court off screen, Leftovers Nothing left on
2. you pick a level or play again: Game Match in play, You Court off screen, Leftovers Nothing left on
3. you click into another window: Game Match in play, You Away, shuttle frozen, Leftovers Nothing left on
4. the court scrolls back: Game Match in play, You Away, shuttle moving, Leftovers Nothing left on

## Rules that hold
TypeOK, PausedWhenHidden, LoopComesBack, NoDeadlock
