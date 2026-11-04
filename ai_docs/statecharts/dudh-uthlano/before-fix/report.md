# Milk

TLC reached 288 states and 1336 steps. The chart draws 19 states and 47 arrows.
The chart does not draw 16 steps that stay in one chart state.
The step you pick another kitchen from সব রান্নাঘর changes Game, Hand and Hum, or Game and Hand, or Game and Hum, or Game, Hand, Hum and Link, or Game and Link, or Game, Hand and Link, or Game, Hum and Link, at the same time.
The step you press and hold চেপে ধরো changes Game, Hand and Hum, or Game and Hand, at the same time.
The step you turn sound off changes Hum and Sound at the same time.
The step you hide the tab changes Game, Window, Hand and Hum, or Game, Window and Hand, or Game, Window and Hum, or Game and Window, at the same time.
The step a friend's link opens changes Game, Hand, Hum and Link, or Game and Link, or Game, Hand and Link, or Game, Hum and Link, at the same time.
The step the milk boils over changes Game, Hand and Hum, or Game and Hand, or Game and Hum, at the same time.
The step you let go after holding changes Game, Hand and Hum, or Game and Hand, at the same time.
The step you pick the friend's kitchen from সব রান্নাঘর changes Game, Hand and Hum, or Game and Hand, or Game, Hand, Hum and Link, or Game and Hum, or Game and Link, or Game, Hand and Link, or Game, Hum and Link, at the same time.
The step the round ends and the card shows changes Game and Celebration at the same time.
The step you press নামাও changes Game and Hum at the same time.
The step you press চালিয়ে যাও changes Game and Hum at the same time.
The step you press নতুন পাতিলে খেলো changes Game and Link at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press and hold চেপে ধরো: Game Milk rising, Window You're on the page, Hand Holding Space or a finger, Hum Stove hums, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. you click into another window: Game Milk rising, Window Another window has focus, Hand Holding Space or a finger, Hum Stove hums, Sound Sound on, Celebration Nothing queued, Link No friend's link

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press and hold চেপে ধরো: Game Milk rising, Window You're on the page, Hand Holding Space or a finger, Hum Stove hums, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. you click into another window: Game Milk rising, Window Another window has focus, Hand Holding Space or a finger, Hum Stove hums, Sound Sound on, Celebration Nothing queued, Link No friend's link

## HumComesBack breaks
The shortest path has 3 steps:
0. Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you turn sound off: Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound off, Celebration Nothing queued, Link No friend's link
2. you press and hold চেপে ধরো: Game Milk rising, Window You're on the page, Hand Holding Space or a finger, Hum No hum, Sound Sound off, Celebration Nothing queued, Link No friend's link
3. you turn sound on: Game Milk rising, Window You're on the page, Hand Holding Space or a finger, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link

## CelebrationOnItsOwnCard breaks
The shortest path has 4 steps:
0. Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link
1. you press and hold চেপে ধরো: Game Milk rising, Window You're on the page, Hand Holding Space or a finger, Hum Stove hums, Sound Sound on, Celebration Nothing queued, Link No friend's link
2. the milk boils over: Game Pot's score shows, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Nothing queued, Link No friend's link
3. the round ends and the card shows: Game Card shows, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Stars or confetti queued, Link No friend's link
4. you pick another kitchen from সব রান্নাঘর: Game Pot waiting on the stove, Window You're on the page, Hand Hands off, Hum No hum, Sound Sound on, Celebration Stars or confetti queued, Link No friend's link

## Rules that hold
TypeOK, PausedWhenHidden, HumOnlyWhileHeating, ReplayIsExact, NoDeadlock
