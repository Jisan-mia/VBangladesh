# Juktoborno

TLC reached 352 states and 1677 steps. The chart draws 13 states and 43 arrows.
The chart does not draw 339 steps that stay in one chart state.
The step the page opens again changes Round and Today, or Round and Menu, or Menu and Today, or Round, Menu and Today, at the same time.
The step the child opens the level list changes Round and Today at the same time.
The step the child taps খেলো or আবার খেলো changes only one of Round and Today at a time.
The step the child picks another level changes Round and Today at the same time.
The step the child places the last right letter changes Round and Today at the same time.
The step নতুন করে শুরু, or শেষ changes Round and Menu, or Round, Menu and Today, at the same time.
The step the child taps পরেরটা changes Round and Today at the same time.

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNewRoundPastLimit, EveryFinishCounts, NothingMovesUnderTheMenu, NextNeedsALook, RoundSurvivesTheList, ResultNeedsFreshPress, NoDeadlock
