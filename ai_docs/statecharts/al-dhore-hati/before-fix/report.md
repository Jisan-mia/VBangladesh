# AlDhore

TLC reached 114 states and 422 steps. The chart draws 15 states and 24 arrows.
The chart does not draw 16 steps that stay in one chart state.
The view hides 46 steps, so the chart does not draw them.
The step you hide the tab changes Walk and Window, or Walk, Window and Hand, or Walk, Window and Wind, or Walk, Window, Hand and Wind, at the same time.
The step you pick a level (the walk starts at once) changes Walk and Field, or Hand and Wind, or Hand and Field, or Wind and Field, or Hand, Wind and Field, at the same time.
The step you slip the third time changes Walk and Hand, or Walk and Wind, or Walk, Hand and Wind, at the same time.
The step you reach the end of the field changes Walk and Hand, or Walk and Wind, or Walk, Hand and Wind, at the same time.
The step you press আবার খেলো changes Walk and Field at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Walk Standing at the ridge, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
1. you pick a level (the walk starts at once): Walk Walking the আল, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
2. you click into another window: Walk Walking the আল, Window Another window has focus, Hand Hands off, Wind No wind, Field A fresh field

## InputReleasedWhenAway breaks
The shortest path has 3 steps:
0. Walk Standing at the ridge, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
1. you pick a level (the walk starts at once): Walk Walking the আল, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
2. you hold ← or →: Walk Walking the আল, Window You're on the page, Hand Holding ← or →, Wind No wind, Field A fresh field
3. you click into another window: Walk Walking the আল, Window Another window has focus, Hand Holding ← or →, Wind No wind, Field A fresh field

## LoopOnlyWhenMeaningful breaks
The shortest path has 3 steps:
0. Walk Standing at the ridge, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
1. you pick a level (the walk starts at once): Walk Walking the আল, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
2. the wind starts to blow: Walk Walking the আল, Window You're on the page, Hand Hands off, Wind Wind playing, Field A fresh field
3. you click into another window: Walk Walking the আল, Window Another window has focus, Hand Hands off, Wind Wind playing, Field A fresh field

## ReplayIsExact breaks
TLC's counterexample is in tlc-ReplayIsExact.out. It has 4 steps:
0. Walk Standing at the ridge, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field
1. you open a friend's link: Walk Standing at the ridge, Window You're on the page, Hand Hands off, Wind No wind, Field Friend's field
2. you tap শুরু করো: Walk Walking the আল, Window You're on the page, Hand Hands off, Wind No wind, Field Friend's field
3. you reach the end of the field: Walk Across: card shows, Window You're on the page, Hand Hands off, Wind No wind, Field Friend's field
4. you press আবার খেলো: Walk Walking the আল, Window You're on the page, Hand Hands off, Wind No wind, Field A fresh field

## Rules that hold
TypeOK, PausedWhenHidden, LoopComesBack, NoDoubleResult, NoDeadlock
