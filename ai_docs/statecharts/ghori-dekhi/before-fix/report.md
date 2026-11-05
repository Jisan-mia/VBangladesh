# Ghori

TLC reached 364 states and 1460 steps. The chart draws 26 states and 59 arrows.
The chart does not draw 62 steps that stay in one chart state.
The view hides 210 steps, so the chart does not draw them.
The step the child taps a site link or the search changes Round and Hand at the same time.
The step they come back changes Round and Gate at the same time.
The step you press শেষ দেখো changes Round and Rest at the same time.
The step you Tab to the hidden শেষ দেখো and press Enter changes Round and Rest at the same time.
The step a grown-up gives 10 more minutes changes Rest and Gate at the same time.

## NoWayOutWithoutGate breaks
The shortest path has 1 step:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. the child taps a site link or the search: Round Left the kids' area, Hand Hands off, Rest Time left today, Gate Gate shut

## NoReadingNeeded breaks
The shortest path has 2 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you get it right: Round Clock set right, Hand Hands off, Rest Time left today, Gate Gate shut
2. you press পরেরটা: Round Reading the clock, Hand Hands off, Rest Time left today, Gate Gate shut

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you press on the clock: Round Setting the clock, ghost finger shows, Hand Turning a hand, Rest Time left today, Gate Gate shut
2. you click into another window: Round Setting the clock, ghost finger shows, Hand Turning a hand, window away, Rest Time left today, Gate Gate shut

## HandMovesOnlyUnderAFinger breaks
The shortest path has 3 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you press on the clock: Round Setting the clock, ghost finger shows, Hand Turning a hand, Rest Time left today, Gate Gate shut
2. you click into another window: Round Setting the clock, ghost finger shows, Hand Turning a hand, window away, Rest Time left today, Gate Gate shut
3. you let go in another window: Round Setting the clock, ghost finger shows, Hand Hand stuck, window away, Rest Time left today, Gate Gate shut

## NoDoubleResult breaks
The shortest path has 7 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you get it right: Round Clock set right, Hand Hands off, Rest Time left today, Gate Gate shut
2. you press পরেরটা: Round Reading the clock, Hand Hands off, Rest Time left today, Gate Gate shut
3. you get it right: Round Read it right, Hand Hands off, Rest Time left today, Gate Gate shut
4. you press পরেরটা: Round Setting the clock, no ghost finger, Hand Hands off, Rest Time left today, Gate Gate shut
5. you get it right: Round Last one right, Hand Hands off, Rest Time left today, Gate Gate shut
6. you press শেষ দেখো: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate shut
7. you Tab to the hidden শেষ দেখো and press Enter: Round Card shows, round counted twice, Hand Hands off, Rest Time left today, Gate Gate shut

## RestOnlyAtBreak breaks
The shortest path has 8 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. today's time runs out: Round Setting the clock, ghost finger shows, Hand Hands off, Rest Today's time is up, Gate Gate shut
2. you get it right: Round Clock set right, Hand Hands off, Rest Today's time is up, Gate Gate shut
3. you press পরেরটা: Round Reading the clock, Hand Hands off, Rest Today's time is up, Gate Gate shut
4. you get it right: Round Read it right, Hand Hands off, Rest Today's time is up, Gate Gate shut
5. you press পরেরটা: Round Setting the clock, no ghost finger, Hand Hands off, Rest Today's time is up, Gate Gate shut
6. you get it right: Round Last one right, Hand Hands off, Rest Today's time is up, Gate Gate shut
7. you press শেষ দেখো: Round Card shows, Hand Hands off, Rest Rest screen shows, Gate Gate shut
8. you Tab to আবার খেলো under the rest screen and press Enter: Round Setting the clock, ghost finger shows, Hand Hands off, Rest Rest screen shows, Gate Gate shut

## ChildCannotOpenGate breaks
The shortest path has 9 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you get it right: Round Clock set right, Hand Hands off, Rest Time left today, Gate Gate shut
2. you press পরেরটা: Round Reading the clock, Hand Hands off, Rest Time left today, Gate Gate shut
3. you get it right: Round Read it right, Hand Hands off, Rest Time left today, Gate Gate shut
4. you press পরেরটা: Round Setting the clock, no ghost finger, Hand Hands off, Rest Time left today, Gate Gate shut
5. you get it right: Round Last one right, Hand Hands off, Rest Time left today, Gate Gate shut
6. you press শেষ দেখো: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate shut
7. someone holds বড়দের জন্য: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate held
8. 2 seconds pass: Round Card shows, Hand Hands off, Rest Time left today, Gate Sum question shows
9. a child mashes the number pad: Round Card shows, Hand Hands off, Rest Time left today, Gate Child opened the gate

## GateNeedsAFullHold breaks
The shortest path has 10 steps:
0. Round Setting the clock, ghost finger shows, Hand Hands off, Rest Time left today, Gate Gate shut
1. you get it right: Round Clock set right, Hand Hands off, Rest Time left today, Gate Gate shut
2. you press পরেরটা: Round Reading the clock, Hand Hands off, Rest Time left today, Gate Gate shut
3. you get it right: Round Read it right, Hand Hands off, Rest Time left today, Gate Gate shut
4. you press পরেরটা: Round Setting the clock, no ghost finger, Hand Hands off, Rest Time left today, Gate Gate shut
5. you get it right: Round Last one right, Hand Hands off, Rest Time left today, Gate Gate shut
6. you press শেষ দেখো: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate shut
7. someone holds বড়দের জন্য: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate held
8. Enter auto-repeats: Round Card shows, Hand Hands off, Rest Time left today, Gate Gate held
9. they let go before 2 seconds: Round Card shows, Hand Hands off, Rest Time left today, Gate Let go, timer still running
10. 2 seconds pass: Round Card shows, Hand Hands off, Rest Time left today, Gate Sum question shows without a full hold

## Rules that hold
TypeOK, NoNetwork, NoChildData, NoDeadlock
