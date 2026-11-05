# Storm

TLC reached 276 states and 1322 steps. The chart draws 19 states and 44 arrows.
The chart does not draw 36 steps that stay in one chart state.
The step you pick another storm from সব ঝড় changes Game and Link at the same time.
The step a friend's link opens changes Game and Link at the same time.
The step you hide the tab changes Game, Window and Wind, or Game, Window, Hand and Wind, or Game and Window, or Window and Wind, or Game, Window and Hand, or Window, Hand and Wind, or Window and Hand, at the same time.
The step you turn sound off changes Wind and Sound at the same time.
The step you press শুরু করো or আবার খেলো changes Game and Wind, or Game and Hand, or Game, Wind and Link, or Game, Hand and Wind, or Game and Link, at the same time.
The step you hold ← / → changes Game, Hand and Wind, or Game and Hand, at the same time.
The step you pick the friend's storm from সব ঝড় changes Game and Link at the same time.
The step you press থামাও or P changes Game and Wind, or Game, Hand and Wind, or Game and Hand, at the same time.
The step the storm ends and the card shows changes Game, Wind and Celebration, or Game, Hand, Wind and Celebration, or Game and Celebration, or Game, Hand and Celebration, or Game and Wind, or Game, Hand and Wind, or Game and Hand, at the same time.
The step you press চালিয়ে যাও changes Game and Wind at the same time.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you hold ← / →: Game Storm falling, Window You're on the page, Hand Holding ← / → or a side, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. you click into another window: Game Storm falling, Window Another window has focus, Hand Holding ← / → or a side, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link

## ReplayIsExact breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press শুরু করো or আবার খেলো: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. a friend's link opens: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link Bar says friend's storm, your own storm falls

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press শুরু করো or আবার খেলো: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. you click into another window: Game Storm falling, Window Another window has focus, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link

## WindOnlyInTheStorm breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press শুরু করো or আবার খেলো: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. you pick another storm from সব ঝড়: Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link

## WindComesBack breaks
The shortest path has 3 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you turn sound off: Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound off, Celebration Nothing queued, Link No friend's link
2. you press শুরু করো or আবার খেলো: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound off, Celebration Nothing queued, Link No friend's link
3. you turn sound on: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link

## CelebrationOnItsOwnCard breaks
The shortest path has 3 steps:
0. Game Ready screen, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you hold ← / →: Game Storm falling, Window You're on the page, Hand Holding ← / → or a side, Wind Wind blowing, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. the storm ends and the card shows: Game Card shows, Window You're on the page, Hand Hands off, Wind Wind quiet, Sound Sound on, Celebration Stars or confetti queued, Link No friend's link
3. you press শুরু করো or আবার খেলো: Game Storm falling, Window You're on the page, Hand Hands off, Wind Wind blowing, Sound Sound on, Celebration Stars or confetti queued, Link No friend's link

## Rules that hold
TypeOK, PausedWhenHidden, NoDeadlock
