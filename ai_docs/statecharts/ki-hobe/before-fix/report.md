# KiHobe

TLC reached 416 states and 1768 steps. The chart draws 17 states and 29 arrows.
The chart does not draw 32 steps that stay in one chart state.
The step you pick a step in সব ধাপ changes Game and Gate at the same time.
The step you tap a guess changes Game and Sound, or Game, Sound and Gate, or Game and Gate, at the same time.
The step you tap শেষ under the last answer changes Game and Rest, or Game and Gate, or Game, Rest and Gate, at the same time.
The step you tap আবার খেলো changes Game and Gate at the same time.
The step you tap শেষ changes Game and Gate at the same time.

## ParentGate breaks
The shortest path has 2 steps:
0. Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. a parent opens বড়দের জন্য: Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate open, parent holding
2. you tap a guess: Game The experiment plays, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate open, child holding

## SilentWhenMuted breaks
The shortest path has 2 steps:
0. Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you tap a guess: Game The experiment plays, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed
2. you turn sound off: Game The experiment plays, Window You're watching, Sound Sound off, a note still coming, Rest Time left today, Gate Gate closed

## NoReadingNeeded breaks
The shortest path has 3 steps:
0. Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you tap a guess: Game The experiment plays, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed
2. the experiment ends and the answer shows: Game What happened, and why, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed
3. you tap শেষ under the last answer: Game Round done: আবার খেলো / শেষ / পরের ধাপ, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed

## RestOnlyAtBreak breaks
The shortest path has 5 steps:
0. Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. today's minutes run out: Game Guess what will happen, Window You're watching, Sound Sound on, Rest Today's time used up, Gate Gate closed
2. you tap a guess: Game The experiment plays, Window You're watching, Sound Sound on, a note coming, Rest Today's time used up, Gate Gate closed
3. the experiment ends and the answer shows: Game What happened, and why, Window You're watching, Sound Sound on, a note coming, Rest Today's time used up, Gate Gate closed
4. you tap শেষ under the last answer: Game Round done: আবার খেলো / শেষ / পরের ধাপ, Window You're watching, Sound Sound on, a note coming, Rest Rest screen up, Gate Gate closed
5. you press Tab and Enter behind the rest screen: Game Guess what will happen, Window You're watching, Sound Sound on, a note coming, Rest Rest screen up, Gate Gate closed

## NoProgressWhileAway breaks
TLC's counterexample is in tlc-NoProgressWhileAway.out. It has 3 steps:
0. Game Guess what will happen, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you tap a guess: Game The experiment plays, Window You're watching, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed
2. you switch to another app or window: Game The experiment plays, Window You're away, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed
3. the experiment ends and the answer shows: Game What happened, and why, Window You're away, Sound Sound on, a note coming, Rest Time left today, Gate Gate closed

## Rules that hold
TypeOK, NoDoubleResult, NoNetwork, NoChildData, NoDeadlock
