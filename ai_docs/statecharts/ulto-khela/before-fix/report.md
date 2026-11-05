# UltoKhela

TLC reached 335 states and 1245 steps. The chart draws 29 states and 82 arrows.
The chart does not draw 59 steps that stay in one chart state.
The step the child taps a link in the header or the related games changes Game, Settings, Eyes and Grownups at the same time.
The step you go to another window or tab changes Eyes and Grownups at the same time.
The step someone shares the link or saves the picture changes Game, Settings, Eyes and Grownups at the same time.
The step 0.7 s later the round ends changes Game and Grownups at the same time.

## ParentGate breaks
The shortest path has 1 step:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
1. the child taps a link in the header or the related games: Game The child left for another page, Settings —, Eyes —, Grownups —

## GateClosesBehindParent breaks
The shortest path has 2 steps:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen
1. a parent opens বড়দের জন্য: Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen, a parent has the gate open
2. the parent hands the phone back: Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen, gate left open, the child has the phone

## NoShareForKids breaks
The shortest path has 3 steps:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen
1. a parent opens বড়দের জন্য: Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen, a parent has the gate open
2. the parent hands the phone back: Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Rest screen, gate left open, the child has the phone
3. someone shares the link or saves the picture: Game The share sheet opened, Settings —, Eyes —, Grownups —

## NoReadingNeeded breaks
The shortest path has 6 steps:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
1. you tap the right picture: Game Got the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
2. 0.7 s later the next picture comes: Game Waiting on the picture after the bell (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
3. you tap the right picture: Game Got the picture after the bell (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
4. 0.7 s later the next picture comes: Game Waiting on the last picture, Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
5. you tap the right picture: Game Got the last picture, Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
6. 0.7 s later the round ends: Game End screen, Settings চটপট off, Eyes On the game, Grownups Time left, gate shut

## ChoiceFreezesPlay breaks
The shortest path has 7 steps:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
1. you open or close সব ধাপ: Game Waiting on the first picture (demo), Settings চটপট off, Eyes সব ধাপ open, Grownups Time left, gate shut
2. you press চটপট: Game Waiting on the first picture (demo), Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut
3. you tap the right picture: Game Got the first picture (demo), Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut
4. 0.7 s later the next picture comes: Game Waiting on the picture after the bell (demo), Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut
5. you tap the right picture: Game Got the picture after the bell (demo), Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut
6. 0.7 s later the next picture comes: Game Waiting on the last picture, Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut
7. 4 s pass and the picture passes as a miss: Game Got the last picture, Settings চটপট on, Eyes সব ধাপ open, Grownups Time left, gate shut

## NoProgressWhileAway breaks
The shortest path has 7 steps:
0. Game Waiting on the first picture (demo), Settings চটপট off, Eyes On the game, Grownups Time left, gate shut
1. you press চটপট: Game Waiting on the first picture (demo), Settings চটপট on, Eyes On the game, Grownups Time left, gate shut
2. you tap the right picture: Game Got the first picture (demo), Settings চটপট on, Eyes On the game, Grownups Time left, gate shut
3. 0.7 s later the next picture comes: Game Waiting on the picture after the bell (demo), Settings চটপট on, Eyes On the game, Grownups Time left, gate shut
4. you tap the right picture: Game Got the picture after the bell (demo), Settings চটপট on, Eyes On the game, Grownups Time left, gate shut
5. 0.7 s later the next picture comes: Game Waiting on the last picture, Settings চটপট on, Eyes On the game, Grownups Time left, gate shut
6. you go to another window or tab: Game Waiting on the last picture, Settings চটপট on, Eyes Away (another window or tab), Grownups Time left, gate shut
7. 4 s pass and the picture passes as a miss: Game Got the last picture, Settings চটপট on, Eyes Away (another window or tab), Grownups Time left, gate shut

## Rules that hold
TypeOK, MuteMeansSilent, RestOnlyAtBreak, NoNetwork, NoChildData, NoDeadlock
