# Daripalla

TLC reached 496 states and 1665 steps. The chart draws 13 states and 25 arrows.
3 states outside the constraints each end a rule's path, and the chart includes them. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 302 steps that stay in one chart state.
The step the page reloads changes Shop and Rest at the same time.
The step a moment later the end screen comes changes Shop and Rest at the same time.

## YouSeeEveryPanBalance breaks
The shortest path has 1 step:
0. Shop First pan: tipped, add weights, Rest Time left today, You Here
1. on a phone, you tap the weight that levels the pan: Shop Last pan: tipped, add weights, Rest Time left today, You Here

## EveryFinishedRoundCounts breaks
The shortest path has 4 steps:
0. Shop First pan: tipped, add weights, Rest Time left today, You Here
1. you tap a weight: Shop First pan level, পরের পাল্লা shows, Rest Time left today, You Here
2. you press পরের পাল্লা: Shop Last pan: tipped, add weights, Rest Time left today, You Here
3. you tap a weight: Shop Last pan level, resting a moment, Rest Time left today, You Here
4. you pick a level in সব ধাপ: Shop First pan: tipped, add weights, Rest Time left today, You Here

## NoProgressWhileAway breaks
The shortest path has 5 steps:
0. Shop First pan: tipped, add weights, Rest Time left today, You Here
1. you tap a weight: Shop First pan level, পরের পাল্লা shows, Rest Time left today, You Here
2. you press পরের পাল্লা: Shop Last pan: tipped, add weights, Rest Time left today, You Here
3. you tap a weight: Shop Last pan level, resting a moment, Rest Time left today, You Here
4. you look away: Shop Last pan level, resting a moment, Rest Time left today, You Looking away
5. a moment later the end screen comes: Shop End screen: stars, আবার খেলো, পরের ধাপ, Rest Time left today, You Looking away

## Rules that hold
TypeOK, NoDoubleResult, RestOnlyAtBreak, RestStaysUntilAGrownUp, NoNetwork, NoChildData, NoDeadlock, StarsNeverDrop, UnlockNeverShrinks
