# BornoLikhi

TLC reached 314 states and 913 steps. The chart draws 29 states and 78 arrows.
The chart does not draw 38 steps that stay in one chart state.
The step you start a set changes Set and Keys at the same time.
The step you tap the speaker changes Keys and Sound at the same time.
The step you touch the board changes Finger and Keys at the same time.
The step you press Enter to write changes Keys and Sound at the same time.
The step you press Enter on the board changes Set and Sound at the same time.
The step you trace a stroke changes Set and Sound at the same time.
The step you tap পরেরটা changes Set and Keys at the same time.
The step you tap আবার লিখি changes Set and Keys at the same time.
The step you press Enter on পরেরটা changes Set and Keys at the same time.

## NoWayOutWithoutGate breaks
The shortest path has 1 step:
0. Set Tracing a letter, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut
1. you tap a card under the game: Set Left for an adult tool, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut

## EnterWritesTheStroke breaks
The shortest path has 2 steps:
0. Set Tracing a letter, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut
1. you tap the speaker: Set Tracing a letter, Finger Hands off, Keys Sound toggle focused, Sound Sound off, Gate Gate shut
2. you press Enter to write: Set Tracing a letter, Finger Hands off, Keys Sound toggle focused, Enter clicked a button, Sound Sound on, Gate Gate shut

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Set Tracing a letter, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut
1. you touch the board: Set Tracing a letter, Finger Finger on the board, Keys Board focused, Sound Sound on, Gate Gate shut
2. you click into another window: Set Tracing a letter, Finger Finger counted on the board, you're away, Keys Board focused, Sound Sound on, Gate Gate shut

## NoReadingNeeded breaks
The shortest path has 2 steps:
0. Set Tracing a letter, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut
1. you touch the board: Set Tracing a letter, Finger Finger on the board, Keys Board focused, Sound Sound on, Gate Gate shut
2. you press Enter on the board: Set Letter done: পরেরটা, Finger Finger on the board, Keys Board focused, Sound Sound on, speaking, Gate Gate shut

## FocusStaysOnTheBoard breaks
The shortest path has 5 steps:
0. Set Tracing a letter, Finger Hands off, Keys Nothing focused, Sound Sound on, Gate Gate shut
1. you touch the board: Set Tracing a letter, Finger Finger on the board, Keys Board focused, Sound Sound on, Gate Gate shut
2. you press Enter on the board: Set Letter done: পরেরটা, Finger Finger on the board, Keys Board focused, Sound Sound on, speaking, Gate Gate shut
3. the voice finishes: Set Letter done: পরেরটা, Finger Finger on the board, Keys Board focused, Sound Sound on, Gate Gate shut
4. you Tab to পরেরটা: Set Letter done: পরেরটা, Finger Finger on the board, Keys পরেরটা focused, Sound Sound on, Gate Gate shut
5. you press Enter on পরেরটা: Set Tracing a letter, Finger Finger on the board, Keys Focus fell to the page, Sound Sound on, Gate Gate shut

## Rules that hold
TypeOK, RestOnlyAtBreak, SilentWhenMuted, HoldMeansHold, NoDeadlock
