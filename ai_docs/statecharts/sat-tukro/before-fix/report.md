# SatTukro

TLC reached 280 states and 812 steps. The chart draws 14 states and 37 arrows.
The chart does not draw 264 steps that stay in one chart state.
The step you tap the picture's name (or শেষ) changes Game and Hand at the same time.
The step you drop it in its place changes Game and Hand at the same time.

## NoReadingNeeded breaks
The shortest path has 1 step:
0. Game Empty shadow, Hand Hands off
1. you tap the picture's name (or শেষ): Game Picture list, Hand Hands off

## ParentGate breaks
The shortest path has 1 step:
0. Game Empty shadow, Hand Hands off
1. you tap a link around the game: Game Left for another page, Hand Hands off

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Game Empty shadow, Hand Hands off
1. you press a piece: Game Empty shadow, Hand Dragging a piece
2. you click into another window: Game Empty shadow, Hand Away, piece still held

## PickerKeepsWork breaks
The shortest path has 4 steps:
0. Game Empty shadow, Hand Hands off
1. you press a piece: Game Empty shadow, Hand Dragging a piece
2. you drop it in its place: Game Half built, Hand Hands off
3. you tap the picture's name (or শেষ): Game Picture list, Hand Hands off
4. you pick the same picture: Game Empty shadow, Hand Hands off

## ChoiceFreezesPlay breaks
The shortest path has 5 steps:
0. Game Empty shadow, Hand Hands off
1. you press a piece: Game Empty shadow, Hand Dragging a piece
2. you drop it in its place: Game Half built, Hand Hands off
3. you press a piece: Game Half built, Hand Dragging a piece
4. you drop it in its place: Game Picture done, cheering, Hand Hands off
5. you tap the picture's name (or শেষ): Game Picture list, cheer still pending, Hand Hands off

## FinishCounts breaks
The shortest path has 6 steps:
0. Game Empty shadow, Hand Hands off
1. you press a piece: Game Empty shadow, Hand Dragging a piece
2. you drop it in its place: Game Half built, Hand Hands off
3. you press a piece: Game Half built, Hand Dragging a piece
4. you drop it in its place: Game Picture done, cheering, Hand Hands off
5. you tap the picture's name (or শেষ): Game Picture list, cheer still pending, Hand Hands off
6. you pick another picture: Game Empty shadow, Hand Hands off

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNetwork, NoChildData, NoDeadlock
