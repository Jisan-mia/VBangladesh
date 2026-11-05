# Handi

TLC reached 416 states and 2160 steps. The chart draws 19 states and 38 arrows.
The chart does not draw 16 steps that stay in one chart state.
The step you scroll the stall away changes Game and Window at the same time.
The step you click into another window changes Window and Keys at the same time.
The step you hide the tab changes Game and Window, or Window and Keys, or Game, Window and Keys, at the same time.
The step the round ends with no stars changes Game and Chances at the same time.
The step the round ends with stars changes Game and Cheer, or Game, Cheer and Chances, at the same time.
The step the ball falls, a chance is lost changes Game and Chances at the same time.
The step you pick a level or press পরের লেভেল changes Game and Cheer at the same time.
The step you press আবার খেলো changes Game and Cheer at the same time.

## ChoiceFreezesPlay breaks
The shortest path has 2 steps:
0. Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
1. you open সব লেভেল: Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল open, Cheer No cheer waiting, Chances Every ball fell while you watched
2. you press শুরু করো or the চাপো pad: Game Ball in the air, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল open, Cheer No cheer waiting, Chances Every ball fell while you watched

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
1. you press on the stall: Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger or mouse down on the stall, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
2. you hide the tab: Game Waiting for your first throw, Window Tab hidden, Keys Keys up, Finger Finger or mouse down on the stall, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched

## PausedWhenOffScreen breaks
The shortest path has 2 steps:
0. Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
1. you scroll the stall away: Game Waiting for your first throw, Window Stall scrolled away, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
2. you press শুরু করো or the চাপো pad: Game Ball in the air, Window Stall scrolled away, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
1. you press শুরু করো or the চাপো pad: Game Ball in the air, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
2. you click into another window: Game Ball in the air, Window Another window has focus, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched

## NoProgressWhileAway breaks
The shortest path has 3 steps:
0. Game Waiting for your first throw, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
1. you press শুরু করো or the চাপো pad: Game Ball in the air, Window You're on the stall, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
2. you click into another window: Game Ball in the air, Window Another window has focus, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances Every ball fell while you watched
3. the ball falls, a chance is lost: Game Ball on the stick, Window Another window has focus, Keys Keys up, Finger Finger up, Levels সব লেভেল closed, Cheer No cheer waiting, Chances A ball fell while you were away

## Rules that hold
TypeOK, PausedWhenHidden, NoFanfareAfterMovingOn, NoDeadlock
