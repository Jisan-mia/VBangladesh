# AbcBazar

TLC reached 402 states and 2100 steps. The chart draws 14 states and 39 arrows.
The chart does not draw 507 steps that stay in one chart state.
The step the page opens again changes Round and Today, or Round and Menu, or Menu and Today, or Round, Menu and Today, at the same time.
The step the child taps the stall or আবার খেলো changes only one of Round and Today at a time.
The step the child picks a level changes Round and Today at the same time.
The step the child taps the right tile changes Round and Today at the same time.
The step নতুন করে শুরু, or শেষ changes Round and Menu, or Round, Menu and Today, at the same time.
The step the child presses ➜ changes Round and Today at the same time.

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNewRoundPastLimit, EveryFinishCounts, ResultMatchesPlay, StarsNeverDrop, NothingMovesUnderTheMenu, WakeTapIsNotAMove, ChoiceFreezesPlay, ResultNeedsFreshPress, NoDeadlock
