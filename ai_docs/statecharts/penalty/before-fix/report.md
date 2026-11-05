# Penalty

TLC reached 294 states and 1186 steps. The chart draws 50 states and 136 arrows.
The chart does not draw 310 steps that stay in one chart state.
The model goes from Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up to Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up by their run-up starts, which the regions chart cannot show. So the chart draws parent states in place of regions.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you click into another window: Match Your kick: aiming, Window Another window has focus, Finger Finger on the board, Crowd Murmur off, Space Space up

## LevelPickerFreezesPlay breaks
The shortest path has 5 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you open সব ম্যাচ: Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
2. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
3. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up

## PausedWhenBlurred breaks
The shortest path has 5 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
3. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. you click into another window: Match Their whistle, Window Another window has focus, Finger Finger off, Crowd Murmur off, Space Space up

## MurmurOnlyInTheRunUp breaks
The shortest path has 6 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
3. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. their run-up starts: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur on, Space Space up
6. you click into another window: Match Their run-up, Window Another window has focus, Finger Finger off, Crowd Murmur on, Space Space up

## MurmurComesBack breaks
The shortest path has 7 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
3. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. their run-up starts: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur on, Space Space up
6. you turn sound off: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
7. you turn sound on: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up

## NoDoubleResult breaks
The shortest path has 9 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
3. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. their run-up starts: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur on, Space Space up
6. they kick: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
7. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
8. the match is decided: Match Match decided once, card not drawn yet, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
9. the match is decided: Match Match decided twice, card not drawn yet, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up

## CardNeedsAFreshPress breaks
TLC's counterexample is in tlc-CardNeedsAFreshPress.out. It has 11 steps:
0. Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
1. you put a finger on the board: Match Your kick: aiming, Window You're on the page, Finger Finger on the board, Crowd Murmur off, Space Space up
2. you swipe and shoot: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
3. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
4. their kicker steps up: Match Their whistle, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space up
5. their run-up starts: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur on, Space Space up
6. you hold Space to dive to the middle: Match Their run-up, Window You're on the page, Finger Finger off, Crowd Murmur on, Space Space held down
7. they kick: Match Ball in the air, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space held down
8. the ball lands: Match Ball landed, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space held down
9. the match is decided: Match Match decided once, card not drawn yet, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space held down
10. the card shows: Match Card shows, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space held down
11. you press আবার খেলো: Match Your kick: aiming, Window You're on the page, Finger Finger off, Crowd Murmur off, Space Space held down

## Rules that hold
TypeOK, PausedWhenHidden, NoDeadlock, NoProgressWhileAway
