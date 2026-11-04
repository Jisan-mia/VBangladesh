# BaicherNouka

TLC reached 464 states and 1900 steps. The chart draws 15 states and 29 arrows.
The chart does not draw 152 steps that stay in one chart state.
The step you tap শুরু করো or the drum changes Race and Rush at the same time.
The step you turn sound off changes Rush and Sound at the same time.
The step you hide the tab changes Race, Window and Rush, or Race and Window, at the same time.
The step you scroll the river away changes Race, River and Rush, or Race and River, at the same time.
The step you cross the finish rope changes Race and Rush at the same time.
The step you press থামাও, P or Esc changes Race and Rush at the same time.
The step you turn sound on changes Rush and Sound at the same time.
The step you press চালিয়ে যাও changes Race and Rush at the same time.
The step you press আরেকবার or Space changes Race and Rush at the same time.
The step you tap Space for one more beat changes Race and Rush at the same time.

## PausedWhenScrolledAway breaks
The shortest path has 2 steps:
0. Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
1. you scroll the river away: Race Ready screen, Window You're on the page, River River scrolled away, Rush Rush sound off, Sound Sound on
2. you tap শুরু করো or the drum: Race Racing, Window You're on the page, River River scrolled away, Rush Rush sound on, Sound Sound on

## CalibWaitsWhileAway breaks
The shortest path has 2 steps:
0. Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
1. you press তাল মেলাও: Race তাল মেলাও running, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
2. you scroll the river away: Race তাল মেলাও running, Window You're on the page, River River scrolled away, Rush Rush sound off, Sound Sound on

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
1. you tap শুরু করো or the drum: Race Racing, Window You're on the page, River River on screen, Rush Rush sound on, Sound Sound on
2. you click into another window: Race Racing, Window Another window has focus, River River on screen, Rush Rush sound on, Sound Sound on

## ReplayIsExact breaks
The shortest path has 4 steps:
0. Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
1. you press তাল মেলাও: Race তাল মেলাও running, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
2. a friend's link opens: Race তাল মেলাও running, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
3. তাল মেলাও ends: Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
4. you tap শুরু করো or the drum: Race Racing, Window You're on the page, River River on screen, Rush Rush sound on, Sound Sound on

## ResultStaysABeat breaks
The shortest path has 4 steps:
0. Race Ready screen, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
1. you tap শুরু করো or the drum: Race Racing, Window You're on the page, River River on screen, Rush Rush sound on, Sound Sound on
2. you cross the finish rope: Race Result, first 450 ms, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
3. time passes on the result: Race Result shows, Window You're on the page, River River on screen, Rush Rush sound off, Sound Sound on
4. you tap Space for one more beat: Race Racing, Window You're on the page, River River on screen, Rush Rush sound on, Sound Sound on

## Rules that hold
TypeOK, PausedWhenHidden, LoopOnlyWhenMeaningful, LoopComesBack, NoDeadlock
