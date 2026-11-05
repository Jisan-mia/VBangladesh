# Cycle

TLC reached 392 states and 1528 steps. The chart draws 20 states and 54 arrows.
The chart does not draw 22 steps that stay in one chart state.
The step you tap the road or a lane button changes Game and Card, or Game, Cheer and Card, or Game and Cheer, at the same time.
The step a friend's link opens changes Game, Route and Card, or Game and Route, or Route and Card, at the same time.
The step you scroll the road away changes Game and Window at the same time.
The step you hide the tab changes Game and Window at the same time.
The step you bump before the goal changes Game and Card, or Game, Route and Card, at the same time.
The step you bump past a star mark changes Game, Cheer and Card, or Game, Cheer, Route and Card, at the same time.
The step you pick a route changes Game and Card, or Game and Window, or Game and Route, or Window and Route, or Game, Route and Card, or Game, Window and Card, or Game, Window and Route, or Route and Card, or Game, Window, Route and Card, or Window, Route and Card, or Window and Card, at the same time.
The step you press পরের রুট changes Game and Card, or Game, Route and Card, or Game, Window and Card, or Game, Window, Route and Card, at the same time.
The step you press আবার খেলো changes Game and Card, or Game, Cheer and Card, at the same time.
The step you press আরেকবার খেলো on the card changes Game and Window at the same time.

## ChoiceFreezesPlay breaks
The shortest path has 2 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you open সব রুট: Game Waiting at the start, Window You're on the road, Routes সব রুট open, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট open, Cheer No chimes waiting, Route No friend's link, Card No result card

## PausedWhenOffScreen breaks
The shortest path has 2 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you scroll the road away: Game Waiting at the start, Window Road scrolled away, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you tap the road or a lane button: Game Riding, Window Road scrolled away, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card

## RouteMatchesRide breaks
The shortest path has 2 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. a friend's link opens: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route Label says the friend's route, you ride another, Card No result card

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you click into another window: Game Riding, Window Another window has focus, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you click into another window: Game Riding, Window Another window has focus, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card

## CompareOnlySameRoad breaks
The shortest path has 3 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you bump before the goal: Game Bumped, result shows, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card Card, no comparison
3. a friend's link opens: Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route On the friend's route, Card Card compares with the friend (a different road)

## NoFanfareAfterMovingOn breaks
The shortest path has 3 steps:
0. Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
1. you tap the road or a lane button: Game Riding, Window You're on the road, Routes সব রুট closed, Cheer No chimes waiting, Route No friend's link, Card No result card
2. you bump past a star mark: Game Bumped, result shows, Window You're on the road, Routes সব রুট closed, Cheer Chimes still to come, Route No friend's link, Card Card, no comparison
3. you press পরের রুট: Game Waiting at the start, Window You're on the road, Routes সব রুট closed, Cheer Chimes still to come, Route No friend's link, Card No result card

## Rules that hold
TypeOK, PausedWhenHidden, NoDeadlock
