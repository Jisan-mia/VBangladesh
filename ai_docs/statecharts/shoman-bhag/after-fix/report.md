# ShomanBhag

TLC reached 456 states and 2433 steps. The chart draws 16 states and 50 arrows.
The chart does not draw 510 steps that stay in one chart state.
The step the page opens again changes Round and Today, or Round and Menu, or Menu and Today, or Round, Menu and Today, at the same time.
The step the window blurs before the menu opens changes Round and Menu at the same time.
The step the child taps the mat or আবার খেলো changes only one of Round and Today at a time.
The step ⏸ / P / Esc, or the window blurs and the menu opens changes Round and Menu at the same time.
The step the child picks a level changes Round and Today at the same time.
The step the child lifts a piece changes only one of Round and Menu at a time.
The step নতুন করে শুরু, or শেষ changes Round and Menu, or Round, Menu and Today, at the same time.
The step সব লেভেল in the pause menu changes Round and Menu, or Round, Menu and Today, at the same time.
The step the child gives the last piece, everyone is equal changes Round and Today at the same time.
The step the child presses ➜ changes Round and Today at the same time.

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNewRoundPastLimit, EveryFinishCounts, ResultMatchesPlay, StarsNeverDrop, NothingMovesUnderTheMenu, WakeTapIsNotAMove, ChoiceFreezesPlay, ResultNeedsFreshPress, PieceGoesBackWhenAway, NoDeadlock, NoProgressWhileAway, NextGuestsOnlyByTheArrow
