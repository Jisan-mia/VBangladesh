# Dinosaur

TLC reached 368 states and 1968 steps. The chart draws 20 states and 45 arrows.
The chart does not draw 16 steps that stay in one chart state.
The step you pick a level changes Game and Hand, or Hand and Gate, or Game, Hand and Gate, or Game and Gate, at the same time.
The step the bones come up changes Game and Hand at the same time.
The step you place the last bone changes Game and Gate at the same time.
The step you pick the right food changes Game and Gate at the same time.
The step you press বইয়ে রাখো on the last dinosaur changes Game and Rest, or Game and Gate, or Game, Rest and Gate, at the same time.
The step you tap আবার খেলো changes Game and Gate at the same time.
The step you tap শেষ changes Game and Gate at the same time.
The step a parent gives ten more minutes changes Rest and Gate at the same time.

## ParentGate breaks
The shortest path has 2 steps:
0. Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
1. a parent opens বড়দের জন্য: Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Gate open, parent holding
2. the parent hands the phone back: Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Gate open, child holding

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
1. you touch the sand: Game Brushing the sand, Window You're on the page, Hand Finger on the sand, Rest Time left today, Gate Child holding
2. you click into another window: Game Brushing the sand, Window Another window has focus, Hand Finger on the sand, Rest Time left today, Gate Child holding

## SandClearsOnlyUnderAFinger breaks
The shortest path has 3 steps:
0. Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
1. you touch the sand: Game Brushing the sand, Window You're on the page, Hand Finger on the sand, Rest Time left today, Gate Child holding
2. you click into another window: Game Brushing the sand, Window Another window has focus, Hand Finger on the sand, Rest Time left today, Gate Child holding
3. you let go in the other window: Game Brushing the sand, Window Another window has focus, Hand No finger, sand still listening, Rest Time left today, Gate Child holding

## NoReadingNeeded breaks
The shortest path has 7 steps:
0. Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
1. you touch the sand: Game Brushing the sand, Window You're on the page, Hand Finger on the sand, Rest Time left today, Gate Child holding
2. the sand clears off the bones: Game Bones lifting out of the sand, Window You're on the page, Hand Finger on the sand, Rest Time left today, Gate Child holding
3. the bones come up: Game Building the skeleton, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
4. you place the last bone: Game Skeleton complete, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
5. the dinosaur stands up: Game What did it eat?, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
6. you pick the right food: Game Fact card, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
7. you press বইয়ে রাখো on the last dinosaur: Game Level done: আবার খেলো / শেষ, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding

## RestOnlyAtBreak breaks
The shortest path has 9 steps:
0. Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Time left today, Gate Child holding
1. today's minutes run out: Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Today's time used up, Gate Child holding
2. you touch the sand: Game Brushing the sand, Window You're on the page, Hand Finger on the sand, Rest Today's time used up, Gate Child holding
3. the sand clears off the bones: Game Bones lifting out of the sand, Window You're on the page, Hand Finger on the sand, Rest Today's time used up, Gate Child holding
4. the bones come up: Game Building the skeleton, Window You're on the page, Hand Hands off, Rest Today's time used up, Gate Child holding
5. you place the last bone: Game Skeleton complete, Window You're on the page, Hand Hands off, Rest Today's time used up, Gate Child holding
6. the dinosaur stands up: Game What did it eat?, Window You're on the page, Hand Hands off, Rest Today's time used up, Gate Child holding
7. you pick the right food: Game Fact card, Window You're on the page, Hand Hands off, Rest Today's time used up, Gate Child holding
8. you press বইয়ে রাখো on the last dinosaur: Game Level done: আবার খেলো / শেষ, Window You're on the page, Hand Hands off, Rest Rest screen up, Gate Child holding
9. you press Tab and Enter behind the rest screen: Game Brushing the sand, Window You're on the page, Hand Hands off, Rest Rest screen up, Gate Child holding

## Rules that hold
TypeOK, TimersBelongToThisDig, NoDoubleResult, NoNetwork, NoChildData, NoDeadlock
