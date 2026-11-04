# Baghbandi

TLC reached 201 states and 944 steps. The chart draws 10 states and 28 arrows.
The chart does not draw 61 steps that stay in one chart state.
The view hides 327 steps, so the chart does not draw them.
The step you hide the tab changes Game and Window at the same time.

## BotWaitsWhileBlurred breaks
The shortest path has 2 steps:
0. Game Your first move, Window You're on the page
1. you move a piece: Game Bot is thinking, Window You're on the page
2. you click into another window: Game Bot is thinking, Window Another window has focus

## BotWaitsWhileHidden breaks
The shortest path has 2 steps:
0. Game Your first move, Window You're on the page
1. you pick ছাগল হবো, বাঘ হবো or দুজনে: Game Bot opens (you're the tiger), Window You're on the page
2. you hide the tab: Game Bot opens (you're the tiger), Window Tab hidden

## PausedWhenHidden breaks
The shortest path has 3 steps:
0. Game Your first move, Window You're on the page
1. you pick ছাগল হবো, বাঘ হবো or দুজনে: Game Bot opens (you're the tiger), Window You're on the page
2. you hide the tab: Game Bot opens (you're the tiger), Window Tab hidden
3. the bot moves: Game Your move, Window Tab hidden

## Rules that hold
TypeOK, BotOnlyAgainstYou, NoDoubleResult, ReplayIsExact, NoDeadlock
