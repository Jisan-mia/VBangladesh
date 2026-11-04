# Hisab

TLC reached 468 states and 1647 steps. The chart draws 19 states and 41 arrows.
The chart does not draw 64 steps that stay in one chart state.
The view hides 270 steps, so the chart does not draw them.
The step you hide the tab changes Round and Window at the same time.
The step you open a friend's link to level 3 changes Round and Levels at the same time.
The step time runs out, level 2 or 3 cleared before level 1 changes Round and Levels at the same time.
The step time runs out, level 1 cleared changes Round and Levels at the same time.
The step you hide the tab again while paused changes Round and Window at the same time.

## LinkOpensOnlyItsLevel breaks
The shortest path has 1 step:
0. Round Waiting for শুরু করো, Window You're on the page, Levels No friend link; levels open as you clear them
1. you open a friend's link to level 3: Round Waiting for শুরু করো, Window You're on the page, Levels Friend's link; levels 2–3 open, level 1 not cleared

## ClockStillWhileAway breaks
The shortest path has 2 steps:
0. Round Waiting for শুরু করো, Window You're on the page, Levels No friend link; levels open as you clear them
1. you press শুরু করো: Round Playing, time left, Window You're on the page, Levels No friend link; levels open as you clear them
2. you click into another window: Round Playing, time left, Window Another window has focus, Levels No friend link; levels open as you clear them

## SumsOutlastTheClock breaks
The shortest path has 2 steps:
0. Round Waiting for শুরু করো, Window You're on the page, Levels No friend link; levels open as you clear them
1. you press শুরু করো: Round Playing, time left, Window You're on the page, Levels No friend link; levels open as you clear them
2. you answer the 120th sum: Round Page broken (কিছু একটা গড়বড়), Window You're on the page, Levels No friend link; levels open as you clear them

## SavedUnlockIsEarned breaks
The shortest path has 4 steps:
0. Round Waiting for শুরু করো, Window You're on the page, Levels No friend link; levels open as you clear them
1. you open a friend's link to level 3: Round Waiting for শুরু করো, Window You're on the page, Levels Friend's link; levels 2–3 open, level 1 not cleared
2. you press শুরু করো: Round Playing, time left, Window You're on the page, Levels Friend's link; levels 2–3 open, level 1 not cleared
3. a second passes: Round Playing, no time left, Window You're on the page, Levels Friend's link; levels 2–3 open, level 1 not cleared
4. time runs out, level 2 or 3 cleared before level 1: Round Time's up, card shows, Window You're on the page, Levels Friend's level cleared; levels 2–3 saved open, level 1 never cleared

## PauseKeepsYourTime breaks
The shortest path has 5 steps:
0. Round Waiting for শুরু করো, Window You're on the page, Levels No friend link; levels open as you clear them
1. you press শুরু করো: Round Playing, time left, Window You're on the page, Levels No friend link; levels open as you clear them
2. you hide the tab: Round Paused, time left, Window Tab hidden, Levels No friend link; levels open as you clear them
3. the tab shows again: Round Paused, time left, Window You're on the page, Levels No friend link; levels open as you clear them
4. you wait a while: Round Paused a while, time left, Window You're on the page, Levels No friend link; levels open as you clear them
5. you hide the tab again while paused: Round Paused a while, no time left (less than you had), Window Tab hidden, Levels No friend link; levels open as you clear them

## Rules that hold
TypeOK, PausedWhenHidden, NoCheerAfterYouMoveOn, NoDeadlock, UnlockNeverShrinks
