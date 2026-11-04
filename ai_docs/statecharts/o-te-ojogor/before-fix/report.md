# Ojogor

TLC reached 400 states and 1735 steps. The chart draws 48 states and 138 arrows.
The chart does not draw 113 steps that stay in one chart state.
The view hides 273 steps, so the chart does not draw them.
The model goes from Game Start screen (শুরু করো), Window You're on the page, Basket Basket still to Game Start screen (শুরু করো), Window Another window has focus, Basket Basket still by you click into another window, which the regions chart cannot show. So the chart draws parent states in place of regions.

## UnlockNeverShrinks breaks
The shortest path has 2 steps:
0. Game Start screen (শুরু করো), Window You're on the page, Basket Basket still
1. a friend's link opens: Game Start screen (শুরু করো), Window You're on the page, Basket Basket still
2. a friend's link opens: Game Start screen (শুরু করো), a level you opened is locked again, Window You're on the page, Basket Basket still

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Game Start screen (শুরু করো), Window You're on the page, Basket Basket still
1. you press শুরু করো: Game Letters falling, Window You're on the page, Basket Basket still
2. you hold ← or →: Game Letters falling, Window You're on the page, Basket Arrow held, basket heads for the edge
3. you click into another window: Game Paused, menu open, Window Another window has focus, Basket Arrow held, basket heads for the edge

## BasketStopsWhenYouLetGo breaks
The shortest path has 4 steps:
0. Game Start screen (শুরু করো), Window You're on the page, Basket Basket still
1. you press শুরু করো: Game Letters falling, Window You're on the page, Basket Basket still
2. you hold ← or →: Game Letters falling, Window You're on the page, Basket Arrow held, basket heads for the edge
3. you press ⏸ or Escape: Game Paused, menu open, Window You're on the page, Basket Arrow held, basket heads for the edge
4. you let go: Game Paused, menu open, Window You're on the page, Basket You let go, the basket still runs to the edge

## Rules that hold
TypeOK, NoProgressWhileAway, PausedWhenBlurred, PausedWhenHidden, MenuFreezesPlay, PausedOnlyMidLevel, ReplayIsExact, NoDeadlock
