# OjogorKids

TLC reached 90 states and 282 steps. The chart draws 13 states and 14 arrows.
The chart does not draw 12 steps that stay in one chart state.

## NoNewRoundPastLimit breaks
The shortest path has 2 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. today's kids' time runs out: Game Start screen, Today Today's kids' time is up, Phone The child has the phone, Name No name, Server Nothing sent
2. you press শুরু করো: Game Letters falling, started after today's time ran out, Today Today's kids' time is up, Phone The child has the phone, Name No name, Server Nothing sent

## NoShareForKids breaks
The shortest path has 2 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. you press শুরু করো: Game Letters falling, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
2. the level ends: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent

## NoNetworkCalls breaks
The shortest path has 3 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. you press শুরু করো: Game Letters falling, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
2. the level ends: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
3. someone taps শেয়ার করো or লিংক কপি করো: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server The card went to /api/share

## NoNameField breaks
The shortest path has 3 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. you press শুরু করো: Game Letters falling, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
2. the level ends: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
3. someone types a name under the card: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name A name typed on the card, Server Nothing sent

## RestAtTheBreak breaks
The shortest path has 3 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. you press শুরু করো: Game Letters falling, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
2. the level ends: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
3. today's kids' time runs out: Game Card with শেয়ার করো and a name field, Today Today's kids' time is up, Phone The child has the phone, Name No name, Server Nothing sent

## NoChildDataLeaves breaks
The shortest path has 4 steps:
0. Game Start screen, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
1. you press শুরু করো: Game Letters falling, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
2. the level ends: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name No name, Server Nothing sent
3. someone types a name under the card: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name A name typed on the card, Server Nothing sent
4. someone taps শেয়ার করো or লিংক কপি করো: Game Card with শেয়ার করো and a name field, Today Time left today, Phone The child has the phone, Name A name typed on the card, Server The name went to /api/share

## Rules that hold
TypeOK, RestOnlyAtBreak, NoDeadlock
