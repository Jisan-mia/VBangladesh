# VoKatta

TLC reached 294 states and 1312 steps. The chart draws 13 states and 26 arrows.
The chart does not draw 146 steps that stay in one chart state.
The view hides 268 steps, so the chart does not draw them.
The step you tap শুরু করো changes Evening and Sound at the same time.
The step you hold টান, a key or drag the sky changes Evening and Hand, or Evening, Hand and Sound, at the same time.
The step you hide the tab changes Evening and Window, or Evening, Window and Hand, or Evening, Window and Sound, or Evening, Window, Hand and Sound, at the same time.
The step you click into another window changes Window and Hand at the same time.
The step you scroll the sky away changes Evening and Window, or Evening, Window and Hand, or Evening, Window and Sound, or Evening, Window, Hand and Sound, or Evening and Sound, at the same time.
The step you press pause changes Evening and Hand, or Evening and Sound, or Evening, Hand and Sound, at the same time.
The step you press চালিয়ে যাও changes Evening and Sound at the same time.
The step the last round ends and the card shows changes Evening and Hand, or Evening and Sound, or Evening, Hand and Sound, at the same time.
The step you press আবার খেলো changes Evening and Sound at the same time.

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Evening Waiting on the roof, Window You're on the sky, Hand Hands off, Sound Sound off
1. you hold টান, a key or drag the sky: Evening Flying kites, Window You're on the sky, Hand Holding টান or a key, Sound Sound off
2. you click into another window: Evening Flying kites, Window Another window has focus, Hand Hands off, Sound Sound off

## NoProgressWhileAway breaks
The shortest path has 2 steps:
0. Evening Waiting on the roof, Window You're on the sky, Hand Hands off, Sound Sound off
1. you hold টান, a key or drag the sky: Evening Flying kites, Window You're on the sky, Hand Holding টান or a key, Sound Sound off
2. you click into another window: Evening Flying kites, Window Another window has focus, Hand Hands off, Sound Sound off

## OffScreenMeansPaused breaks
The shortest path has 3 steps:
0. Evening Waiting on the roof, Window You're on the sky, Hand Hands off, Sound Sound off
1. you hold টান, a key or drag the sky: Evening Flying kites, Window You're on the sky, Hand Holding টান or a key, Sound Sound off
2. you scroll the sky away: Evening Paused, Window Sky scrolled away, Hand Hands off, Sound Sound off
3. you press চালিয়ে যাও: Evening Flying kites, Window Sky scrolled away, Hand Hands off, Sound Sound off

## Rules that hold
TypeOK, InputReleasedWhenAway, PausedWhenHidden, LoopOnlyWhenMeaningful, LoopComesBack, NoDoubleResult, NoFanfareAfterMovingOn, NoDeadlock, StarsNeverDrop
