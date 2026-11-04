# AbcBazar

TLC reached 395 states and 1307 steps. The chart draws 23 states and 62 arrows.
The chart does not draw 185 steps that stay in one chart state.
The step the child taps a link in the header, the guide or the related games changes Game, Window and Grownups at the same time.
The step you go to another window or tab changes Window and Grownups at the same time.
The step someone shares the link or prints changes Game, Window and Grownups at the same time.
The step you press শেষ দেখো changes Game and Grownups at the same time.

## ParentGate breaks
The shortest path has 1 step:
0. Game On the first item, Window On the page, Grownups Time left, gate shut
1. the child taps a link in the header, the guide or the related games: Game The child left for another page, Window —, Grownups —

## GateClosesBehindParent breaks
The shortest path has 2 steps:
0. Game On the first item, Window On the page, Grownups Rest screen
1. a parent opens বড়দের জন্য: Game On the first item, Window On the page, Grownups Rest screen, a parent has the gate open
2. the parent hands the phone back: Game On the first item, Window On the page, Grownups Rest screen, gate left open, the child has the phone

## NoShareForKids breaks
The shortest path has 3 steps:
0. Game On the first item, Window On the page, Grownups Rest screen
1. a parent opens বড়দের জন্য: Game On the first item, Window On the page, Grownups Rest screen, a parent has the gate open
2. the parent hands the phone back: Game On the first item, Window On the page, Grownups Rest screen, gate left open, the child has the phone
3. someone shares the link or prints: Game The share sheet opened, Window —, Grownups —

## NoReadingNeeded breaks
The shortest path has 4 steps:
0. Game On the first item, Window On the page, Grownups Time left, gate shut
1. you tap the right one: Game first item solved, Window On the page, Grownups Time left, gate shut
2. you press পরেরটা: Game On the last item, Window On the page, Grownups Time left, gate shut
3. you tap the right one: Game last item solved, Window On the page, Grownups Time left, gate shut
4. you press শেষ দেখো: Game Done screen, Window On the page, Grownups Time left, gate shut

## Rules that hold
TypeOK, RestOnlyAtBreak, ResultMatchesPlay, StarsNeverDrop, NoProgressWhileAway, MuteMeansSilent, NoNetwork, NoChildData, NoDeadlock
