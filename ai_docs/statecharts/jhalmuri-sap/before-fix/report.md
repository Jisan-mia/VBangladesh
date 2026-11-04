# Snake

TLC reached 264 states and 1210 steps. The chart draws 16 states and 36 arrows.
The chart does not draw 12 steps that stay in one chart state.
The step you pick another level or ক্লাসিক changes Game and Board, or Board and Link, or Game and Link, or Game, Board and Link, at the same time.
The step you scroll the board away changes Game and Board at the same time.
The step you hide the tab changes Game and Window at the same time.
The step a friend's link opens changes Game and Link at the same time.
The step the snake crashes changes Game and Guard, or Game, Guard and Celebration, at the same time.
The step the run ends with stars or a record changes Game, Guard and Celebration, or Game and Guard, at the same time.
The step you pick the friend's level changes Board and Link, or Game and Link, or Game and Board, or Game, Board and Link, at the same time.
The step you press আরেকবার or পরের লেভেল changes Game and Link at the same time.
The step you press আবার খেলো on the friend's level changes Game and Link at the same time.

## PausedWhenScrolledAway breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
1. you scroll the board away: Game Ready screen, Window You're on the page, Board Board scrolled away, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
2. you press শুরু করো or swipe: Game Snake moving, Window You're on the page, Board Board scrolled away, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Ready screen, Window You're on the page, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
1. you press শুরু করো or swipe: Game Snake moving, Window You're on the page, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
2. you click into another window: Game Snake moving, Window Another window has focus, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link

## CelebrationOnItsOwnCard breaks
The shortest path has 3 steps:
0. Game Ready screen, Window You're on the page, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
1. you press শুরু করো or swipe: Game Snake moving, Window You're on the page, Board Board on screen, Guard Card buttons ready, Celebration Nothing queued, Link No friend's link
2. the run ends with stars or a record: Game Card shows, Window You're on the page, Board Board on screen, Guard Card buttons wait 0.7 s, Celebration Stars or confetti queued, Link No friend's link
3. you pick another level or ক্লাসিক: Game Ready screen, Window You're on the page, Board Board on screen, Guard Card buttons wait 0.7 s, Celebration Stars or confetti queued, Link No friend's link

## Rules that hold
TypeOK, PausedWhenHidden, ReplayIsExact, NoDeadlock
