# GuneDekhi

TLC reached 262 states and 1167 steps. The chart draws 14 states and 43 arrows.
The chart does not draw 354 steps that stay in one chart state.

## ParentGate breaks
The shortest path has 1 step:
0. Game গুনি: counting the fish, Window On the page, Sound Sound on
1. you tap a link around the game: Game Left for another page, Window On the page, Sound Sound on

## SilentWhenMuted breaks
The shortest path has 2 steps:
0. Game গুনি: counting the fish, Window On the page, Sound Sound on
1. you turn sound off: Game গুনি: counting the fish, Window On the page, Sound Sound off
2. you answer right: Game Pond right, next one coming, Window On the page, Sound Sound off

## GlimpseOnlyWhileWatching breaks
The shortest path has 2 steps:
0. Game গুনি: counting the fish, Window On the page, Sound Sound on
1. you tap a mode button: Game এক নজরে: pattern showing, Window On the page, Sound Sound on
2. you look away (another window or tab): Game এক নজরে: pattern showing, Window Another window, Sound Sound on

## NoReadingNeeded breaks
The shortest path has 4 steps:
0. Game গুনি: counting the fish, Window On the page, Sound Sound on
1. you answer right: Game Pond right, next one coming, Window On the page, Sound Sound on
2. the next pond comes: Game গুনি: counting the fish, Window On the page, Sound Sound on
3. you answer right: Game Last pond right, cheering, Window On the page, Sound Sound on
4. the round ends and the card shows: Game End card, Window On the page, Sound Sound on

## FinishCounts breaks
The shortest path has 4 steps:
0. Game গুনি: counting the fish, Window On the page, Sound Sound on
1. you answer right: Game Pond right, next one coming, Window On the page, Sound Sound on
2. the next pond comes: Game গুনি: counting the fish, Window On the page, Sound Sound on
3. you answer right: Game Last pond right, cheering, Window On the page, Sound Sound on
4. you tap a mode button: Game এক নজরে: pattern showing, Window On the page, Sound Sound on

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNetwork, NoChildData, NoDeadlock
