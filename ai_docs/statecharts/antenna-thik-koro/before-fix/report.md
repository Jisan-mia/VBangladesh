# Antenna

TLC reached 66 states and 264 steps. The chart draws 14 states and 24 arrows.
The step you hide the tab changes Game, Window and Static, or Game and Window, at the same time.
The step you turn sound off changes Static and Sound at the same time.
The step you hold ← or → changes Game, Hand and Static, or Game and Hand, or Hand and Static, at the same time.
The step the last channel locks and the card shows changes Game and Static at the same time.
The step you play again changes Game and Hand at the same time.
The step you press চালিয়ে যাও changes Game, Hand and Static, or Game and Static, or Game and Hand, at the same time.

## DialStillWhileAway breaks
The shortest path has 2 steps:
0. Game Waiting for your first turn, Window You're on the page, Hand Hands off, Static Static off, Sound Sound on
1. you hold ← or →: Game Searching for the signal, Window You're on the page, Hand Holding ← or →, Static Static on, Sound Sound on
2. you click into another window: Game Searching for the signal, Window Another window has focus, Hand Holding ← or →, Static Static on, Sound Sound on

## StaticWhileSearching breaks
The shortest path has 3 steps:
0. Game Waiting for your first turn, Window You're on the page, Hand Hands off, Static Static off, Sound Sound on
1. you turn sound off: Game Waiting for your first turn, Window You're on the page, Hand Hands off, Static Static off, Sound Sound off
2. you hold ← or →: Game Searching for the signal, Window You're on the page, Hand Holding ← or →, Static Static off, Sound Sound off
3. you turn sound on: Game Searching for the signal, Window You're on the page, Hand Holding ← or →, Static Static off, Sound Sound on

## Rules that hold
TypeOK, StaticOnlyWhileListening, HiddenMeansPaused, NoStaticOnTheCard, NoDeadlock
