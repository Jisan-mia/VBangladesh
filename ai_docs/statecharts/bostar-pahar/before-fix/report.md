# BostarPahar

TLC reached 296 states and 1212 steps. The chart draws 19 states and 47 arrows.
The chart does not draw 72 steps that stay in one chart state.
The step you press Space changes Game and Key, or Game, Key and Result, or Game, Key, Chimes, Truck and Result, or Game, Key, Truck and Result, or Game, Key, Chimes and Truck, or Game, Key and Truck, at the same time.
The step you click into another window changes Window and Key at the same time.
The step you hide the tab changes Game and Window, or Game, Window and Key, or Window and Key, at the same time.
The step the held key repeats changes Game and Drops, or Game and Result, or Game, Chimes, Truck and Result, or Game, Truck and Result, or Game, Chimes and Truck, or Game and Truck, at the same time.
The step the result shows changes Game and Chimes at the same time.
The step you press আবার খেলো / পরের ঘাট changes Game, Chimes and Truck, or Game and Truck, at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Sack swinging, Window On the page, Key Key up, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
1. you press Space: Game Sack dropping or landing, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
2. you click into another window: Game Sack dropping or landing, Window Another window has focus, Key Key up, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen

## EveryDropIsATap breaks
The shortest path has 3 steps:
0. Game Sack swinging, Window On the page, Key Key up, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
1. you press থামাও / চালাও (or P): Game Paused, Window On the page, Key Key up, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
2. you press Space: Game Sack swinging, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
3. the held key repeats: Game Sack dropping or landing, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops A sack dropped on key repeat, Result Result seen

## NoTapPastResult breaks
The shortest path has 4 steps:
0. Game Sack swinging, Window On the page, Key Key up, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
1. you press Space: Game Sack dropping or landing, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
2. the sack slips off: Game Pile tipping over, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
3. the result shows: Game Result just appeared, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result seen
4. the held key repeats: Game Sack swinging, Window On the page, Key Holding Space, Chimes No chimes waiting, Truck Truck not full yet, Drops Every drop was a press, Result Result skipped by a stray press

## Rules that hold
TypeOK, PausedWhenHidden, NoChimeAfterLeaving, NoDoubleResult, NoDeadlock
