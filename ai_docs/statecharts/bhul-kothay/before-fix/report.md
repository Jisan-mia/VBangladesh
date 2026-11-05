# BhulKothay

TLC reached 38 states and 122 steps. The chart draws 11 states and 21 arrows.
The chart does not draw 1 steps that stay in one chart state.
The view hides 14 steps, so the chart does not draw them.
The step you hide the tab changes Game and Window at the same time.

## LevelPickerFreezesPlay breaks
The shortest path has 2 steps:
0. Game Veil: শুরু করো, Window You're on the page, Levels Level list shut
1. you open সব লেভেল: Game Veil: শুরু করো, Window You're on the page, Levels Level list open
2. you start a level (পরের লেভেল, আবার খেলো, শুরু থেকে or one from the list): Game Hunting, none found (clock running), Window You're on the page, Levels Level list open

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Veil: শুরু করো, Window You're on the page, Levels Level list shut
1. you press শুরু করো or চালিয়ে যাও: Game Hunting, none found (clock running), Window You're on the page, Levels Level list shut
2. you click into another window: Game Hunting, none found (clock running), Window Another window has focus, Levels Level list shut

## Rules that hold
TypeOK, ClockOnlyWhilePlaying, PausedWhenHidden, NoDoubleResult, NoCheerAfterMovingOn, NoDeadlock
