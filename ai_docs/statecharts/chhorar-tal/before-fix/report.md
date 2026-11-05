# ChhorarTal

TLC reached 456 states and 1832 steps. The chart draws 25 states and 42 arrows.
The chart does not draw 272 steps that stay in one chart state.
The step you tap the drum changes Round and Keys at the same time.
The step you tap a ছড়া number changes Round and Keys at the same time.
The step you press Space changes Round and Keys at the same time.
The step the ছড়া ends and the pictures come changes Round and Keys at the same time.
The step you tap the right picture changes Round and Voice, or Round, Keys and Voice, or Round and Keys, at the same time.
The step the done screen comes changes Round and Today at the same time.

## SpaceNeverRestarts breaks
The shortest path has 2 steps:
0. Round Drum waiting (ঢোলে চাপ দাও), Window On the page, Keys Nothing focused, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today
1. you tap a ছড়া number: Round ছড়া playing, first lines, Window On the page, Keys Focus on a ছড়া button, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today
2. you press Space: Round ছড়া playing, first lines, Window On the page, Keys Space started the ছড়া over, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today

## NoReadingNeeded breaks
The shortest path has 3 steps:
0. Round Drum waiting (ঢোলে চাপ দাও), Window On the page, Keys Nothing focused, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today
1. you tap the drum: Round ছড়া playing, first lines, Window On the page, Keys Focus on the drum, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today
2. the beat moves on: Round ছড়া playing, last line, Window On the page, Keys Focus on the drum, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today
3. the ছড়া ends and the pictures come: Round Rhyme pick, nothing spoken: only words to read, Window On the page, Keys Nothing focused, Voice No Bangla voice on this phone, Sound Sound on, Today Time left today

## VoiceOnlyOnTheResult breaks
The shortest path has 5 steps:
0. Round Drum waiting (ঢোলে চাপ দাও), Window On the page, Keys Nothing focused, Voice Voice quiet, Sound Sound on, Today Time left today
1. you tap a ছড়া number: Round ছড়া playing, first lines, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
2. the beat moves on: Round ছড়া playing, last line, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
3. the ছড়া ends and the pictures come: Round Rhyme pick (the ছড়া was spoken), Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
4. you tap the right picture: Round Right picture, card in 1.8 s, Window On the page, Keys Nothing focused, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today
5. you tap a ছড়া number: Round ছড়া playing, first lines, the won round was never counted, Window On the page, Keys Focus on a ছড়া button, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today

## EveryFinishCounts breaks
The shortest path has 5 steps:
0. Round Drum waiting (ঢোলে চাপ দাও), Window On the page, Keys Nothing focused, Voice Voice quiet, Sound Sound on, Today Time left today
1. you tap a ছড়া number: Round ছড়া playing, first lines, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
2. the beat moves on: Round ছড়া playing, last line, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
3. the ছড়া ends and the pictures come: Round Rhyme pick (the ছড়া was spoken), Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
4. you tap the right picture: Round Right picture, card in 1.8 s, Window On the page, Keys Nothing focused, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today
5. you tap a ছড়া number: Round ছড়া playing, first lines, the won round was never counted, Window On the page, Keys Focus on a ছড়া button, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today

## SpaceReachesTheDrum breaks
The shortest path has 7 steps:
0. Round Drum waiting (ঢোলে চাপ দাও), Window On the page, Keys Nothing focused, Voice Voice quiet, Sound Sound on, Today Time left today
1. you tap a ছড়া number: Round ছড়া playing, first lines, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
2. the beat moves on: Round ছড়া playing, last line, Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
3. the ছড়া ends and the pictures come: Round Rhyme pick (the ছড়া was spoken), Window On the page, Keys Focus on a ছড়া button, Voice Voice quiet, Sound Sound on, Today Time left today
4. you tap the right picture: Round Right picture, card in 1.8 s, Window On the page, Keys Nothing focused, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today
5. the done screen comes: Round Done screen (আবার খেলো / শেষ), Window On the page, Keys Nothing focused, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today
6. you tap আবার খেলো: Round ছড়া playing, first lines, Window On the page, Keys Nothing focused, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today
7. you press Space: Round ছড়া playing, first lines, Window On the page, Keys Space scrolled the page, Voice Voice reading the ছড়া, Sound Sound on, Today Time left today

## Rules that hold
TypeOK, PausedWhenAway, RestOnlyAtBreak, NoDeadlock
