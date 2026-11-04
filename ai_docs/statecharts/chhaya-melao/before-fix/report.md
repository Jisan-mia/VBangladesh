# Chhaya

TLC reached 228 states and 672 steps. The chart draws 13 states and 27 arrows.
1 state outside the constraints ends a rule's path, and the chart includes it. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 45 steps that stay in one chart state.
The step the page reloads changes Wall and You, or Wall, Rest and You, or Wall and Rest, at the same time.
The step you tap a level number changes Wall and You at the same time.
The step you tap the right picture changes Wall and You at the same time.
The step a moment later the round ends changes Wall and Rest at the same time.

## NoProgressWhileAway breaks
The shortest path has 4 steps:
0. Wall Lamp off, switch waiting, Rest Time left today, You Here
1. you press the light switch: Wall First shadow on the wall, Rest Time left today, You Here
2. you tap the right picture: Wall First shadow matched, next one coming, Rest Time left today, You Here
3. you look away: Wall First shadow matched, next one coming, Rest Time left today, You Looking away
4. a moment later the next shadow comes: Wall Last shadow on the wall, Rest Time left today, You Looking away

## NoReadingNeeded breaks
The shortest path has 5 steps:
0. Wall Lamp off, switch waiting, Rest Time left today, You Here
1. you press the light switch: Wall First shadow on the wall, Rest Time left today, You Here
2. you tap the right picture: Wall First shadow matched, next one coming, Rest Time left today, You Here
3. a moment later the next shadow comes: Wall Last shadow on the wall, Rest Time left today, You Here
4. you tap the right picture: Wall Last shadow matched, next one coming, Rest Time left today, You Here
5. a moment later the round ends: Wall Round over: stars and the found pictures, Rest Time left today, You Here

## Rules that hold
TypeOK, KeyNeverWipesTheRound, NoDoubleResult, RestOnlyAtBreak, RestStaysUntilAGrownUp, NoNetwork, NoChildData, NoDeadlock, StarsNeverDrop
