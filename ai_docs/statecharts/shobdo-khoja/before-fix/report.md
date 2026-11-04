# ShobdoKhoja

TLC reached 471 states and 1597 steps. The chart draws 16 states and 38 arrows.
The chart does not draw 50 steps that stay in one chart state.
The step you touch a letter changes Game and Finger at the same time.
The step you hide the tab changes Game and Window at the same time.
The step you open a friend's level-2 link changes Game and Levels at the same time.
The step you let go on a listed word changes Game and Finger at the same time.
The step you strike the last word of level 1 changes Game, Finger and Levels, or Game and Finger, at the same time.
The step you strike the last word of level 2 changes Game, Finger and Levels, or Game and Finger, at the same time.

## NoStrokeUnderThePauseCard breaks
The shortest path has 2 steps:
0. Game Grid waiting, clock stopped, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared
1. you touch a letter: Game Hunting, clock running, Window You're on the page, Finger Finger on a letter, Levels Nothing cleared
2. you hide the tab: Game Pause card, clock stopped, Window Tab hidden, Finger Finger on a letter, Levels Nothing cleared

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Game Grid waiting, clock stopped, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared
1. you touch a letter: Game Hunting, clock running, Window You're on the page, Finger Finger on a letter, Levels Nothing cleared
2. you click into another window: Game Hunting, clock running, Window Another window has focus, Finger Finger on a letter, Levels Nothing cleared

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Grid waiting, clock stopped, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared
1. you touch a letter: Game Hunting, clock running, Window You're on the page, Finger Finger on a letter, Levels Nothing cleared
2. you click into another window: Game Hunting, clock running, Window Another window has focus, Finger Finger on a letter, Levels Nothing cleared

## UnlockOnlyByClearing breaks
The shortest path has 7 steps:
0. Game Grid waiting, clock stopped, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared
1. you open a friend's level-2 link: Game Grid waiting, clock stopped, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared, friend's level 2 open
2. you touch a letter: Game Hunting, clock running, Window You're on the page, Finger Finger on a letter, Levels Nothing cleared, friend's level 2 open
3. you drag across letters: Game Hunting, clock running, Window You're on the page, Finger Dragging a stroke, Levels Nothing cleared, friend's level 2 open
4. you let go on a listed word: Game Hunting, clock running, 1 of 2 struck, Window You're on the page, Finger Finger off the grid, Levels Nothing cleared, friend's level 2 open
5. you touch a letter: Game Hunting, clock running, 1 of 2 struck, Window You're on the page, Finger Finger on a letter, Levels Nothing cleared, friend's level 2 open
6. you drag across letters: Game Hunting, clock running, 1 of 2 struck, Window You're on the page, Finger Dragging a stroke, Levels Nothing cleared, friend's level 2 open
7. you strike the last word of level 2: Game All words struck, card shows, Window You're on the page, Finger Finger off the grid, Levels Only level 2 cleared, level 2 open for good

## Rules that hold
TypeOK, PausedWhenHidden, FanfareOnlyOnTheResult, ResultMatchesPlay, NoDeadlock
