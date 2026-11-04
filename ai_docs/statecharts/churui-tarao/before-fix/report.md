# Churui

TLC reached 304 states and 1242 steps. The chart draws 17 states and 43 arrows.
The chart does not draw 54 steps that stay in one chart state.
The step a friend's link opens (the friend's level) changes Game and Link at the same time.
The step you hide the tab changes Game and Window at the same time.
The step dusk falls or the grain runs out, not passed changes Game and Grain at the same time.
The step dusk falls and the field is passed changes Game and Cheer, or Game, Cheer and Grain, at the same time.
The step you pick a level changes Game and Cheer at the same time.
The step you pick a level (the friend's level) changes Game and Link, or Game and Cheer, or Game, Cheer and Link, at the same time.
The step you pick a level (another level) changes Game and Link, or Game, Cheer and Link, or Game and Cheer, or Cheer and Link, at the same time.
The step you press পরের লেভেল changes Game and Cheer at the same time.
The step you press আবার খেলো changes Game and Link at the same time.
The step you press পরের লেভেল (the friend's level) changes Game and Cheer, or Game and Link, or Game, Cheer and Link, at the same time.
The step you press পরের লেভেল (another level) changes Game and Link, or Game, Cheer and Link, or Game and Cheer, at the same time.
The step dusk falls changes Game and Grain at the same time.

## ChoiceFreezesPlay breaks
The shortest path has 2 steps:
0. Game Waiting for your first tap, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
1. you open সব লেভেল: Game Waiting for your first tap, Window You're on the page, Levels সব লেভেল open, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
2. you tap the field: Game Sparrows landing, Window You're on the page, Levels সব লেভেল open, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting for your first tap, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
1. you tap the field: Game Sparrows landing, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
2. you click into another window: Game Sparrows landing, Window Another window has focus, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field

## NoFanfareAfterMovingOn breaks
The shortest path has 3 steps:
0. Game Waiting for your first tap, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
1. you tap the field: Game Sparrows landing, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
2. dusk falls and the field is passed: Game Card shows, Window You're on the page, Levels সব লেভেল closed, Cheer Cheer still to come, Grain Grain only eaten while you watched, Link On the friend's field
3. you press আবার খেলো: Game Sparrows landing, Window You're on the page, Levels সব লেভেল closed, Cheer Cheer still to come, Grain Grain only eaten while you watched, Link On the friend's field

## NoProgressWhileAway breaks
The shortest path has 3 steps:
0. Game Waiting for your first tap, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
1. you tap the field: Game Sparrows landing, Window You're on the page, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
2. you click into another window: Game Sparrows landing, Window Another window has focus, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain only eaten while you watched, Link On the friend's field
3. a sparrow nibbles: Game Sparrows landing, Window Another window has focus, Levels সব লেভেল closed, Cheer No cheer waiting, Grain Grain was eaten while you were away, Link On the friend's field

## Rules that hold
TypeOK, PausedWhenHidden, ReplayIsExact, NoDeadlock
