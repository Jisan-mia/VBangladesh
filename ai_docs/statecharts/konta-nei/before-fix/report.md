# KontaNei

TLC reached 444 states and 1476 steps. The chart draws 20 states and 31 arrows.
The view hides 156 steps, so the chart does not draw them.
The step you press শুরু করো changes Game and Hum at the same time.
The step you turn sound off changes Hum and Sound at the same time.
The step you hide the tab changes Game, Window and Hum, or Game and Window, or Window and Clock, at the same time.
The step the look time runs out changes Game and Hum at the same time.
The step you turn sound on changes Hum and Sound at the same time.
The step the eyes open on the shelf with a gap changes Game and Clock at the same time.
The step you press চালিয়ে যাও changes Game and Hum at the same time.
The step the eyes open on a new shelf changes Game and Hum at the same time.

## LevelPickerFreezesPlay breaks
The shortest path has 2 steps:
0. Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
1. you open সব লেভেল: Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list open
2. you press শুরু করো: Game Looking at the shelf, Window You're on the page, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list open

## PausedWhenBlurred breaks
The shortest path has 2 steps:
0. Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
1. you press শুরু করো: Game Looking at the shelf, Window You're on the page, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut
2. you click into another window: Game Looking at the shelf, Window Another window has focus, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut

## HumOnlyWhileLooking breaks
The shortest path has 4 steps:
0. Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
1. you turn sound off: Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound off, Clock Fair clock, Levels Level list shut
2. you press শুরু করো: Game Looking at the shelf, Window You're on the page, Hum Hum off, Sound Sound off, Clock Fair clock, Levels Level list shut
3. the look time runs out: Game Eyes closing, মামা takes one, Window You're on the page, Hum Hum off, Sound Sound off, Clock Fair clock, Levels Level list shut
4. you turn sound on: Game Eyes closing, মামা takes one, Window You're on the page, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut

## AwayTimeNeverCharged breaks
The shortest path has 6 steps:
0. Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
1. you press শুরু করো: Game Looking at the shelf, Window You're on the page, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut
2. the look time runs out: Game Eyes closing, মামা takes one, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
3. the eyes open on the shelf with a gap: Game কোনটা নেই? choices, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
4. you hide the tab: Game Paused on the question, Window Tab hidden, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
5. the tab shows again: Game Paused on the question, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
6. you hide the tab: Game Paused on the question, Window Tab hidden, Hum Hum off, Sound Sound on, Clock Away time charged, Levels Level list shut

## PausedWhenHidden breaks
The shortest path has 7 steps:
0. Game Shutter down, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
1. you press শুরু করো: Game Looking at the shelf, Window You're on the page, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut
2. the look time runs out: Game Eyes closing, মামা takes one, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
3. the eyes open on the shelf with a gap: Game কোনটা নেই? choices, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
4. you pick an answer: Game Answer shown, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
5. you press পরের তাক: Game Eyes closing before a shelf, Window You're on the page, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
6. you hide the tab: Game Eyes closing before a shelf, Window Tab hidden, Hum Hum off, Sound Sound on, Clock Fair clock, Levels Level list shut
7. the eyes open on a new shelf: Game Looking at the shelf, Window Tab hidden, Hum Hum on, Sound Sound on, Clock Fair clock, Levels Level list shut

## Rules that hold
TypeOK, HumComesBack, NoDoubleResult, NoDeadlock
