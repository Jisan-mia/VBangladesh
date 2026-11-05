# Latim

TLC reached 120 states and 410 steps. The chart draws 22 states and 51 arrows.
The chart does not draw 2 steps that stay in one chart state.
The step you turn sound off changes Hum and Sound at the same time.
The step you hide the tab changes Window and Hand, or Top, Window and Hum, or Top and Window, at the same time.
The step you let go and it throws changes Top, Hand and Hum, or Top and Hand, at the same time.
The step you turn sound on changes Hum and Sound at the same time.
The step you pick a level changes Top and Hum, or Top and Cheer, at the same time.
The step you pull down and let go changes Top, Hand and Hum, or Top and Hand, at the same time.
The step the top falls changes Top and Hum at the same time.
The step you press থামাও changes Top and Hum at the same time.
The step you press হাতে তোলো changes Top and Hum at the same time.
The step it comes to rest and the card shows changes Top and Cheer at the same time.
The step you press চালিয়ে যাও changes Top and Hum at the same time.
The step you press আবার খেলো changes Top and Cheer at the same time.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Top In your hand, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
1. you hold the button to wind: Top In your hand, Window You're on the page, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
2. you click into another window: Top In your hand, Window Another window has focus, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued

## PausedWhenBlurred breaks
The shortest path has 3 steps:
0. Top In your hand, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
1. you hold the button to wind: Top In your hand, Window You're on the page, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
2. you let go and it throws: Top Spinning, Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued
3. you click into another window: Top Spinning, Window Another window has focus, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued

## HumOnlyWhileSpinning breaks
The shortest path has 3 steps:
0. Top In your hand, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
1. you hold the button to wind: Top In your hand, Window You're on the page, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
2. you let go and it throws: Top Spinning, Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued
3. you click into another window: Top Spinning, Window Another window has focus, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued

## LevelPickerFreezesPlay breaks
The shortest path has 3 steps:
0. Top In your hand, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
1. you hold the button to wind: Top In your hand, Window You're on the page, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
2. you let go and it throws: Top Spinning, Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued
3. you open সব লেভেল: Top Spinning, Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list open, Cheer No cheer queued

## NothingMovesWhilePaused breaks
The shortest path has 5 steps:
0. Top In your hand, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
1. you hold the button to wind: Top In your hand, Window You're on the page, Hand Holding to wind, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
2. you let go and it throws: Top Spinning, Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued
3. the spin slows: Top Spinning slowly (হাতে তোলো shows), Window You're on the page, Hand Hands off, Hum Hum on, Sound Sound on, Levels Level list shut, Cheer No cheer queued
4. you press থামাও: Top Spinning slowly (হাতে তোলো shows), paused, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued
5. you press হাতে তোলো: Top Coming to rest, paused, Window You're on the page, Hand Hands off, Hum Hum off, Sound Sound on, Levels Level list shut, Cheer No cheer queued

## Rules that hold
TypeOK, PausedWhenHidden, HumComesBack, NoDoubleResult, CheerOnlyOnTheCard, NoDeadlock, NoProgressWhileAway
