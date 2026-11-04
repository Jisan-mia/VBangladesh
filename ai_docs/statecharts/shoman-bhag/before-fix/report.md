# ShomanBhag

TLC reached 472 states and 2016 steps. The chart draws 19 states and 43 arrows.
The chart does not draw 48 steps that stay in one chart state.
The step you give everyone the same changes Game and Gate at the same time.
The step you cut the রুটি right and hand out the pieces changes Game and Gate at the same time.
The step the round ends changes Game and Rest at the same time.
The step you tap শেষ changes Game and Gate at the same time.
The step you tap আবার খেলো changes Game and Gate at the same time.
The step you choose who gets the last one changes Game and Gate at the same time.
The step you press Tab and Enter behind the rest screen changes Game and Gate at the same time.
The step you tap পরের ধাপ changes Game and Gate at the same time.

## ParentGate breaks
The shortest path has 2 steps:
0. Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. a parent opens বড়দের জন্য: Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate open, parent holding
2. you give everyone the same: Game First table: everyone served, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate open, child holding

## NoReadingNeeded breaks
The shortest path has 3 steps:
0. Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you give everyone the same: Game First table: everyone served, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
2. the next guests sit down: Game Last table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
3. you give everyone the same: Game Last table: who gets the last one?, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed

## RestOnlyAtBreak breaks
The shortest path has 5 steps:
0. Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. today's minutes run out: Game First table: share it out, Window You're watching, Sound Sound on, Rest Today's time used up, Gate Gate closed
2. you pick a step in সব ধাপ: Game রুটি কাটা: how many pieces?, Window You're watching, Sound Sound on, Rest Today's time used up, Gate Gate closed
3. you cut the রুটি right and hand out the pieces: Game রুটি কাটা: everyone served, Window You're watching, Sound Sound on, Rest Today's time used up, Gate Gate closed
4. the round ends: Game Round done: আবার খেলো / শেষ / পরের ধাপ, Window You're watching, Sound Sound on, Rest Rest screen up, Gate Gate closed
5. you press Tab and Enter behind the rest screen: Game রুটি কাটা: how many pieces?, Window You're watching, Sound Sound on, Rest Rest screen up, Gate Gate closed

## NoProgressWhileAway breaks
TLC's counterexample is in tlc-NoProgressWhileAway.out. It has 3 steps:
0. Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you give everyone the same: Game First table: everyone served, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
2. you switch to another app or window: Game First table: everyone served, Window You're away, Sound Sound on, Rest Time left today, Gate Gate closed
3. the next guests sit down: Game Last table: share it out, Window You're away, Sound Sound on, Rest Time left today, Gate Gate closed

## SilentWhenMuted breaks
TLC's counterexample is in tlc-SilentWhenMuted.out. It has 3 steps:
0. Game First table: share it out, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
1. you pick a step in সব ধাপ: Game রুটি কাটা: how many pieces?, Window You're watching, Sound Sound on, Rest Time left today, Gate Gate closed
2. you turn sound off: Game রুটি কাটা: how many pieces?, Window You're watching, Sound Sound off, Rest Time left today, Gate Gate closed
3. you cut the রুটি right and hand out the pieces: Game রুটি কাটা: everyone served, Window You're watching, Sound Sound off, Rest Time left today, Gate Gate closed

## Rules that hold
TypeOK, NoDoubleResult, NoNetwork, NoChildData, NoDeadlock
