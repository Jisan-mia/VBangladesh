# SurBanai

TLC reached 249 states and 964 steps. The chart draws 33 states and 137 arrows.
The chart does not draw 391 steps that stay in one chart state.
The model goes from Screen আমার সুর: nothing to lose, Tune A tune plays, Sound Sound on, Gate Gate shut to Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut by you press থামাও, which the regions chart cannot show. So the chart draws parent states in place of regions.

## NoWayOutWithoutGate breaks
The shortest path has 1 step:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you tap a card under the game: Screen Left for an adult tool, Tune Nothing plays, Sound Sound on, Gate Gate shut

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you press বাজাও: Screen আমার সুর: nothing to lose, Tune A tune plays, Sound Sound on, Gate Gate shut
2. you click into another window: Screen আমার সুর: nothing to lose, Tune A tune plays, you're away, Sound Sound on, Gate Gate shut

## RestOnlyAtBreak breaks
The shortest path has 2 steps:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you press বাজাও: Screen আমার সুর: nothing to lose, Tune A tune plays, Sound Sound on, Gate Gate shut
2. you press থামাও: Screen Rest screen, Tune Nothing plays, Sound Sound on, Gate Gate shut

## NoReadingNeeded breaks
The shortest path has 2 steps:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you tap a cell: Screen আমার সুর: a tune not kept, Tune Nothing plays, Sound Sound on, Gate Gate shut
2. you press রাখো: Screen End card, Tune Nothing plays, Sound Sound on, Gate Gate shut

## ChoiceFreezesPlay breaks
The shortest path has 3 steps:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you press সুরটা মেলাও: Screen সুরটা মেলাও, Tune Nothing plays, Sound Sound on, Gate Gate shut
2. you press শোনো: Screen সুরটা মেলাও, Tune A tune plays, Sound Sound on, Gate Gate shut
3. you open সব সুর: Screen সুরটা মেলাও, সব সুর open, Tune A tune plays, Sound Sound on, Gate Gate shut

## RestKeepsYourTune breaks
The shortest path has 3 steps:
0. Screen আমার সুর: nothing to lose, Tune Nothing plays, Sound Sound on, Gate Gate shut
1. you press বাজাও: Screen আমার সুর: nothing to lose, Tune A tune plays, Sound Sound on, Gate Gate shut
2. you tap a cell: Screen আমার সুর: a tune not kept, Tune A tune plays, Sound Sound on, Gate Gate shut
3. you press থামাও: Screen Rest screen, Tune Nothing plays, Sound Sound on, Gate Gate shut

## Rules that hold
TypeOK, SilentWhenHidden, BeatOnlyWithSound, LoopComesBack, QuietUnderRest, SilentWhenMuted, HoldMeansHold, NoDeadlock
