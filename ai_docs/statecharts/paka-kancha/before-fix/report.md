# PakaKancha

TLC reached 498 states and 2575 steps. The chart draws 12 states and 23 arrows.
2 states outside the constraints each end a rule's path, and the chart includes them. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 79 steps that stay in one chart state.
The view hides 141 steps, so the chart does not draw them.
The step you pick a level under সব লেভেল changes Game and Focus at the same time.
The step you tap a digit on the pad changes Game and Focus at the same time.
The step you press Enter changes Game and Enter, or Game and Focus, at the same time.
The step you tap মুছো changes Game and Focus at the same time.
The step you crack the friend's level 2 code changes Game and Levels at the same time.
The step you press পরের লেভেল or আবার খেলো changes Game and Focus at the same time.

## LevelsOpenInOrder breaks
The shortest path has 3 steps:
0. Game Row empty, Focus Focus on the page, Enter Enter did what it said, Levels Opened from a friend's level 2 link
1. you tap a digit on the pad: Game Typing a row, Focus Focus on the page, Enter Enter did what it said, Levels Opened from a friend's level 2 link
2. you tap a digit on the pad: Game Four digits typed, Focus Focus on the page, Enter Enter did what it said, Levels Opened from a friend's level 2 link
3. you crack the friend's level 2 code: Game Result shows, Focus Focus on the page, Enter Enter did what it said, Levels Level 2 has stars, level 1 never played

## EnterChecksTheRow breaks
The shortest path has 4 steps:
0. Game Row empty, Focus Focus on the page, Enter Enter did what it said, Levels Opened on level 1
1. you pick a level under সব লেভেল: Game Row empty, Focus Focus on a level button, Enter Enter did what it said, Levels Opened on level 1
2. you type a digit: Game Typing a row, Focus Focus on a level button, Enter Enter did what it said, Levels Opened on level 1
3. you type a digit: Game Four digits typed, Focus Focus on a level button, Enter Enter did what it said, Levels Opened on level 1
4. you press Enter: Game Row empty, Focus Focus on a level button, Enter Enter threw a full row away, Levels Opened on level 1

## Rules that hold
TypeOK, NoDoubleResult, NoCheerAfterMovingOn, NoDeadlock, StarsNeverDrop, UnlockNeverShrinks
