# NodiPar

TLC reached 360 states and 1860 steps. The chart draws 36 states and 137 arrows.
The chart does not draw 555 steps that stay in one chart state.
The model goes from River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up to River Crossing, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up by you start the crossing, which the regions chart cannot show. So the chart draws parent states in place of regions.

## LevelPickerFreezesPlay breaks
The shortest path has 2 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you open সব নদী: River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
2. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up

## ShownRiverIsTheOneCrossed breaks
The shortest path has 2 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. a friend's link opens in this tab: River Crossing, Which Page names another river, Window You're on the page, Water Water sound on, Space Space up

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. you click into another window: River Crossing, Which Page names your river, Window Another window has focus, Water Water sound on, Space Space up

## WaterOnlyWhileCrossing breaks
The shortest path has 2 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. you click into another window: River Crossing, Which Page names your river, Window Another window has focus, Water Water sound on, Space Space up

## SavedUnderTheRiverCrossed breaks
The shortest path has 3 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. a friend's link opens in this tab: River Crossing, Which Page names another river, Window You're on the page, Water Water sound on, Space Space up
3. you reach the far ghat: River Across: card shows, Which Page names another river, Window You're on the page, Water Water sound off, Space Space up

## CheerOnlyOnTheCard breaks
The shortest path has 3 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. you reach the far ghat: River Across: card shows, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
3. you press আবার খেলো: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up

## CardNeedsAFreshPress breaks
TLC's counterexample is in tlc-CardNeedsAFreshPress.out. It has 4 steps:
0. River Ready card, Which Page names your river, Window You're on the page, Water Water sound off, Space Space up
1. you start the crossing: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space up
2. you hold Space for the last hop: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space held down
3. you reach the far ghat: River Across: card shows, Which Page names your river, Window You're on the page, Water Water sound off, Space Space held down
4. you press আবার খেলো: River Crossing, Which Page names your river, Window You're on the page, Water Water sound on, Space Space held down

## Rules that hold
TypeOK, PausedWhenHidden, WaterComesBack, NoDeadlock, NoProgressWhileAway
