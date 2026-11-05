# Ghori

TLC reached 432 states and 2648 steps. The chart draws 16 states and 42 arrows.
The chart does not draw 684 steps that stay in one chart state.
The step the page opens again changes Round and Hand, or Round and Today, or Round and Window, or Window and Today, or Round, Hand and Today, or Round, Window and Today, at the same time.
The step the level list opens changes Round and Hand, or Round and Today, at the same time.
The step the child taps খেলো or আবার খেলো changes only one of Round and Today at a time.
The step the window blurs: the menu opens, the turn ends changes Hand and Window at the same time.
The step ⏸, P or Escape changes Hand and Window at the same time.
The step the child picks a level changes Round and Today at the same time.
The step ✓ or the right card changes Round and Today at the same time.
The step নতুন করে শুরু, or শেষ changes Round and Window, or Round, Window and Today, at the same time.
The step ▶ changes Round and Today at the same time.

## Rules that hold
TypeOK, NoDoubleResult, InputReleasedWhenAway, HandMovesOnlyUnderAFinger, RestOnlyAtBreak, NoNewRoundPastLimit, EveryFinishCounts, NothingMovesUnderTheMenu, ChoiceFreezesPlay, ResultNeedsFreshPress, NothingHeldOffTheClock, NoDeadlock
