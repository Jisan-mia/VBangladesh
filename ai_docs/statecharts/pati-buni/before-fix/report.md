# PatiBuni

TLC reached 142 states and 531 steps. The chart draws 17 states and 51 arrows.
The chart does not draw 32 steps that stay in one chart state.
The step you hide the tab changes Game and Window, or Game, Window and Hand, at the same time.
The step you scroll past the board changes Game and Window, or Game, Window and Hand, at the same time.
The step you open a friend's link changes Game and Bundle, or Game, Hand and Bundle, at the same time.
The step you press pause changes Game and Hand at the same time.
The step the last strip tops out changes Game and Hand at the same time.
The step you press আরেকবার খেলো under the card changes Game and Window at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Start card, Window Board on screen, Hand Hands off, Bundle Own bundle
1. you press শুরু করো: Game Strips falling, stack low, Window Board on screen, Hand Hands off, Bundle Own bundle
2. you click into another window: Game Strips falling, stack low, Window Another window has focus, Hand Hands off, Bundle Own bundle

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Game Start card, Window Board on screen, Hand Hands off, Bundle Own bundle
1. you press শুরু করো: Game Strips falling, stack low, Window Board on screen, Hand Hands off, Bundle Own bundle
2. you hold a control: Game Strips falling, stack low, Window Board on screen, Hand Holding ◀ or ▶, Bundle Own bundle
3. you click into another window: Game Strips falling, stack low, Window Another window has focus, Hand Holding ◀ or ▶, Bundle Own bundle

## PausedWhenScrolledAway breaks
The shortest path has 3 steps:
0. Game Start card, Window Board on screen, Hand Hands off, Bundle Own bundle
1. you press শুরু করো: Game Strips falling, stack low, Window Board on screen, Hand Hands off, Bundle Own bundle
2. you scroll past the board: Game Paused, Window Scrolled past the board, Hand Hands off, Bundle Own bundle
3. you press চালিয়ে যাও: Game Breath after resuming, stack low, Window Scrolled past the board, Hand Hands off, Bundle Own bundle

## Rules that hold
TypeOK, PausedWhenHidden, NoHoldOffThePlay, ResultMatchesPlay, ReplayIsExact, NoDeadlock
