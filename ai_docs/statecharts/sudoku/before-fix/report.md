# Sudoku

TLC reached 252 states and 1128 steps. The chart draws 13 states and 19 arrows.
The chart does not draw 46 steps that stay in one chart state.
The step you tap a level arrow, a level or আজকের ধাঁধা changes Game and Work at the same time.
The step you write a digit or take a hint changes Game and Work at the same time.
The step you hide the tab changes Game and Window at the same time.
The step you take a 10th or later hint and the grid fills changes Game and Chimes at the same time.
The step a hint fills the last cell changes Game and Chimes at the same time.
The step you write the last digit changes Game and Chimes at the same time.
The step you press পরের লেভেল or আবার খেলো changes Game and Work at the same time.

## WorkNeverLostByOneTap breaks
The shortest path has 2 steps:
0. Game New grid, clock at zero, Window You're on the page, Chimes No chimes waiting, Work Nothing written yet
1. you write a digit or take a hint: Game Solving, clock running, Window You're on the page, Chimes No chimes waiting, Work Your digits on the grid
2. you tap a level arrow, a level or আজকের ধাঁধা: Game New grid, clock at zero, Window You're on the page, Chimes No chimes waiting, Work A half-done grid was thrown away

## YourLinkOpens breaks
The shortest path has 2 steps:
0. Game New grid, clock at zero, Window You're on the page, Chimes No chimes waiting, Work Nothing written yet
1. you write a digit or take a hint: Game Solving, clock running, Window You're on the page, Chimes No chimes waiting, Work Your digits on the grid
2. you take a 10th or later hint and the grid fills: Game Result shows, its link opens nothing, Window You're on the page, Chimes Star chimes still to ring, Work Your digits on the grid

## ClockStillWhileAway breaks
The shortest path has 2 steps:
0. Game New grid, clock at zero, Window You're on the page, Chimes No chimes waiting, Work Nothing written yet
1. you tap a cell: Game Solving, clock running, Window You're on the page, Chimes No chimes waiting, Work Nothing written yet
2. you click into another window: Game Solving, clock running, Window Another window has focus, Chimes No chimes waiting, Work Nothing written yet

## ChimesOnlyOnTheResult breaks
The shortest path has 3 steps:
0. Game New grid, clock at zero, Window You're on the page, Chimes No chimes waiting, Work Nothing written yet
1. you write a digit or take a hint: Game Solving, clock running, Window You're on the page, Chimes No chimes waiting, Work Your digits on the grid
2. you take a 10th or later hint and the grid fills: Game Result shows, its link opens nothing, Window You're on the page, Chimes Star chimes still to ring, Work Your digits on the grid
3. you press পরের লেভেল or আবার খেলো: Game New grid, clock at zero, Window You're on the page, Chimes Star chimes still to ring, Work Nothing written yet

## Rules that hold
TypeOK, PausedWhenHidden, PausedMeansFrozen, ResultMeansSolved, LevelIsOpen, NoDeadlock
