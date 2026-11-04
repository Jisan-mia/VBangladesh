# Carrom

TLC reached 492 states and 2326 steps. The chart draws 21 states and 60 arrows.
1 state outside the constraints ends a rule's path, and the chart includes it. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 304 steps that stay in one chart state.
The step you pick a board changes Game and Window at the same time.
The step you turn sound off changes Hand and Sound at the same time.
The step you hide the tab changes Window and Hand, or Game and Window, or Game, Window and Hand, at the same time.
The step you click into another window changes Window and Hand at the same time.
The step you open a friend's board-2 link changes Game and Window at the same time.
The step you turn sound on changes Hand and Sound at the same time.
The step you scroll back to the board changes Window and Hand at the same time.
The step you let go and the striker flies changes Game and Hand at the same time.
The step you let go of Space and the striker flies changes Game and Hand at the same time.
The step the discs stop and board 1 is passed for the first time changes Game and Boards at the same time.
The step you press pause changes Game and Hand at the same time.
The step you press আবার খেলো changes Game and Window at the same time.
The step you press পরের বোর্ড changes Game and Window at the same time.
The step the discs stop and board 2 is passed for the first time changes Game and Boards at the same time.

## KeysOnlyWhileBoardShows breaks
The shortest path has 2 steps:
0. Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
1. you hold Space: Game Board waiting for the first strike, Window Board on screen, Hand Holding Space, hum playing, Sound Sound on, Boards No board passed
2. you scroll past the board: Game Board waiting for the first strike, Window Scrolled past the board, Hand Holding Space, hum playing, Sound Sound on, Boards No board passed

## LoopOnlyWhenMeaningful breaks
The shortest path has 2 steps:
0. Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
1. you pull back or hold মারো: Game Board waiting for the first strike, Window Board on screen, Hand Pulling back, hum playing, Sound Sound on, Boards No board passed
2. you scroll past the board: Game Board waiting for the first strike, Window Scrolled past the board, Hand Pulling back, hum playing, Sound Sound on, Boards No board passed

## PausedWhenBlurred breaks
The shortest path has 3 steps:
0. Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
1. you hold Space: Game Board waiting for the first strike, Window Board on screen, Hand Holding Space, hum playing, Sound Sound on, Boards No board passed
2. you let go of Space and the striker flies: Game Discs rolling, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
3. you click into another window: Game Discs rolling, Window Another window has focus, Hand Hands off, Sound Sound on, Boards No board passed

## ShotFixedOnceFired breaks
The shortest path has 3 steps:
0. Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
1. you hold Space: Game Board waiting for the first strike, Window Board on screen, Hand Holding Space, hum playing, Sound Sound on, Boards No board passed
2. you let go of Space and the striker flies: Game Discs rolling, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
3. you tap বড় স্ট্রাইকার: Game Discs rolling, striker resized, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed

## UnlockOnlyByClearing breaks
The shortest path has 4 steps:
0. Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
1. you open a friend's board-2 link: Game Board waiting for the first strike, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
2. you hold Space: Game Board waiting for the first strike, Window Board on screen, Hand Holding Space, hum playing, Sound Sound on, Boards No board passed
3. you let go of Space and the striker flies: Game Discs rolling, Window Board on screen, Hand Hands off, Sound Sound on, Boards No board passed
4. the discs stop and board 2 is passed for the first time: Game Strikes done, slip shows, Window Board on screen, Hand Hands off, Sound Sound on, Boards Only board 2 passed, board 2 open for good

## Rules that hold
TypeOK, PausedWhenHidden, InputReleasedWhenAway, LoopComesBack, NoHumOffThePlay, NoDeadlock
