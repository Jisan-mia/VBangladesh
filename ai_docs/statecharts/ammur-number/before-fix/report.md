# AmmurNumber

TLC reached 430 states and 1835 steps. The chart draws 30 states and 67 arrows.
The chart does not draw 212 steps that stay in one chart state.
The step a parent types the number behind নম্বর দাও changes Round and Look at the same time.
The step you tap আব্বু or a ধাপ changes Round and Look, or Help and Number, or Round, Look and Number, or Round and Help, or Round and Number, or Look and Help, or Look and Number, or Round, Help and Number, or Look, Help and Number, or Round, Look and Help, or Round, Look, Help and Number, at the same time.
The step you click into another window or hide the tab changes Look and Window at the same time.
The step you tap আবার দেখাও changes Look and Help, or Round and Look, at the same time.
The step you hold Enter on আবার দেখাও changes Round and Help, or Look and Help, or Round, Look and Help, or Round and Look, at the same time.
The step you dial the piece changes Round and Look, or Round, Look and Help, at the same time.
The step the held key repeats changes Look and Help, or Round and Look, at the same time.
The step the next piece plays changes Round and Look at the same time.
The step the end screen comes changes Round and Today at the same time.
The step you tap আবার খেলো or পরের ধাপ changes Round and Look, or Round, Look and Number, at the same time.

## OneLookOneHelp breaks
The shortest path has 2 steps:
0. Round No number yet (নম্বর দাও), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
1. a parent types the number behind নম্বর দাও: Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
2. you tap আবার দেখাও: Round First piece playing (০১৭), Look Saw the digits, Help A help charged while the digits already showed, Window On the page, Number Number only in this page, Today Time left today

## NoChildData breaks
The shortest path has 2 steps:
0. Round No number yet (নম্বর দাও), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
1. a parent types the number behind নম্বর দাও: Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
2. you tap 🔈 (a phone whose Bangla voice is online): Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number's words sent to a speech server, Today Time left today

## NoProgressWhileAway breaks
The shortest path has 3 steps:
0. Round No number yet (নম্বর দাও), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
1. a parent types the number behind নম্বর দাও: Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
2. you click into another window or hide the tab: Round First piece playing (০১৭), Look The digits played and hid while away, Help Each look charged once, Window Away (another window or tab), Number Number only in this page, Today Time left today
3. the digits finish playing and hide: Round Dialling the first piece, Look The digits played and hid while away, Help Each look charged once, Window Away (another window or tab), Number Number only in this page, Today Time left today

## NoReadingNeeded breaks
The shortest path has 3 steps:
0. Round No number yet (নম্বর দাও), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
1. a parent types the number behind নম্বর দাও: Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
2. you click into another window or hide the tab: Round First piece playing (০১৭), Look The digits played and hid while away, Help Each look charged once, Window Away (another window or tab), Number Number only in this page, Today Time left today
3. the digits finish playing and hide: Round Dialling the first piece, Look The digits played and hid while away, Help Each look charged once, Window Away (another window or tab), Number Number only in this page, Today Time left today

## EveryFinishCounts breaks
The shortest path has 5 steps:
0. Round No number yet (নম্বর দাও), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
1. a parent types the number behind নম্বর দাও: Round First piece playing (০১৭), Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
2. you dial the piece: Round Piece done, the next plays in 1 s, Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
3. the next piece plays: Round Longer piece playing, Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
4. you dial the piece: Round Whole number dialled, phone rings (1.7 s), Look No look on screen, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today
5. you tap আব্বু or a ধাপ: Round First piece playing (০১৭), the dialled number was never counted, Look Saw the digits, Help Each look charged once, Window On the page, Number Number only in this page, Today Time left today

## Rules that hold
TypeOK, RestOnlyAtBreak, NoDeadlock
