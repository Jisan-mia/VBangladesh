# Marble

TLC reached 134 states and 605 steps. The chart draws 12 states and 28 arrows.
The chart does not draw 166 steps that stay in one chart state.
The step a friend's link opens changes Game and Link at the same time.
The step you click into another window changes Game and Window at the same time.
The step you press P or ⏸ changes Game and Menu at the same time.
The step you press চালিয়ে যাও changes Game and Menu, or Window and Menu, or Game, Window and Menu, at the same time.
The step you press নতুন করে শুরু changes Game and Menu, or Window and Menu, or Game, Window and Menu, at the same time.

## Rules that hold
TypeOK, NoProgressWhileAway, InputReleasedWhenAway, MarbleRollsOnlyWhenHeld, PausedWhenHidden, PausedWhenBlurred, MenuFreezesPlay, ChoiceFreezesPlay, LoopOnlyWhenMeaningful, LoopComesBack, NoChimeAfterLeaving, ReplayIsExact, HeldKeyNeverSkips, OpenLevelsAreEarned, NoDeadlock
