# Bangles

TLC reached 164 states and 606 steps. The chart draws 19 states and 38 arrows.
The chart does not draw 4 steps that stay in one chart state.
The view hides 38 steps, so the chart does not draw them.
The step you hide the tab changes Tray and Window, or Tray, Window and Sound, at the same time.
The step the moves run out changes Tray and Cheer at the same time.
The step the goals are met changes Tray and Cheer at the same time.
The step the pointer moves across the tray changes Tray and Pointer at the same time.
The step you press চুড়ি ঝাঁকাও changes Tray and Sound at the same time.
The step the shake ends changes Tray and Sound at the same time.

## InputReleasedWhenAway breaks
The shortest path has 2 steps:
0. Tray Waiting for your first swap, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer Nothing to come
1. you press on a bangle: Tray Waiting for your first swap, Window You're on the page, Pointer A bangle is being dragged, Sound Sound on, no rattle, Cheer Nothing to come
2. you click into another window: Tray Waiting for your first swap, Window Another window has focus, Pointer A bangle is being dragged, Sound Sound on, no rattle, Cheer Nothing to come

## NoCheerAfterYouMoveOn breaks
The shortest path has 3 steps:
0. Tray Waiting for your first swap, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer Nothing to come
1. you swap two bangles: Tray Last move's bangles falling, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer Nothing to come
2. the goals are met: Tray Level cleared, card shows, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer End sound and confetti still to come
3. you start a level or open a friend's link: Tray Waiting for your first swap, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer End sound and confetti still to come

## RattleWhileShaking breaks
The shortest path has 5 steps:
0. Tray Waiting for your first swap, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer Nothing to come
1. you turn sound off: Tray Waiting for your first swap, Window You're on the page, Pointer Pointer free, Sound Sound off, Cheer Nothing to come
2. you swap two bangles: Tray Bangles lifting and falling, Window You're on the page, Pointer Pointer free, Sound Sound off, Cheer Nothing to come
3. no swap is left: Tray No swap left, চুড়ি ঝাঁকাও shows, Window You're on the page, Pointer Pointer free, Sound Sound off, Cheer Nothing to come
4. you press চুড়ি ঝাঁকাও: Tray Tray shaking, Window You're on the page, Pointer Pointer free, Sound Sound off, Cheer Nothing to come
5. you turn sound on: Tray Tray shaking, Window You're on the page, Pointer Pointer free, Sound Sound on, no rattle, Cheer Nothing to come

## Rules that hold
TypeOK, PausedWhenHidden, RattleOnlyWhileShaking, NoDeadlock
