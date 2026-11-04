# Roshi

TLC reached 288 states and 944 steps. The chart draws 14 states and 36 arrows.
The chart does not draw 12 steps that stay in one chart state.
The view hides 108 steps, so the chart does not draw them.
The step you turn sound on changes Crowd and Sound at the same time.
The step you tap the drum to start changes Match and Crowd at the same time.
The step you hide the tab changes Match, Window and Crowd, or Match and Window, at the same time.
The step you scroll the field away changes Match, Window and Crowd, or Match and Window, at the same time.
The step you turn sound off changes Crowd and Sound at the same time.
The step the ribbon reaches their line changes Match and Crowd at the same time.
The step the ribbon reaches our line changes Match and Crowd at the same time.
The step you press চালিয়ে যাও changes Match and Crowd at the same time.

## LoopComesBack breaks
The shortest path has 2 steps:
0. Match Drum waiting for your tap, Window You're on the field, Crowd No crowd, Sound Sound off
1. you tap the drum to start: Match Pulling on the beat, Window You're on the field, Crowd Crowd silent (made while muted), Sound Sound off
2. you turn sound on: Match Pulling on the beat, Window You're on the field, Crowd Crowd silent (made while muted), Sound Sound on

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Match Drum waiting for your tap, Window You're on the field, Crowd No crowd, Sound Sound off
1. you tap the drum to start: Match Pulling on the beat, Window You're on the field, Crowd Crowd silent (made while muted), Sound Sound off
2. you click into another window: Match Pulling on the beat, Window Another window has focus, Crowd Crowd silent (made while muted), Sound Sound off

## LoopOnlyWhenMeaningful breaks
The shortest path has 2 steps:
0. Match Drum waiting for your tap, Window You're on the field, Crowd No crowd, Sound Sound on
1. you tap the drum to start: Match Pulling on the beat, Window You're on the field, Crowd Crowd playing, Sound Sound on
2. you click into another window: Match Pulling on the beat, Window Another window has focus, Crowd Crowd playing, Sound Sound on

## NoProgressWhileAway breaks
The shortest path has 3 steps:
0. Match Drum waiting for your tap, Window You're on the field, Crowd No crowd, Sound Sound off
1. you tap the drum to start: Match Pulling on the beat, Window You're on the field, Crowd Crowd silent (made while muted), Sound Sound off
2. you click into another window: Match Pulling on the beat, Window Another window has focus, Crowd Crowd silent (made while muted), Sound Sound off
3. a beat goes by while the loop is frozen: Match Beats going by unseen, Window Another window has focus, Crowd Crowd silent (made while muted), Sound Sound off

## Rules that hold
TypeOK, PausedWhenHidden, OffScreenMeansPaused, NoDoubleResult, NoDeadlock, StarsNeverDrop
