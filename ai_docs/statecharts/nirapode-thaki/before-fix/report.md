# NirapodeThaki

TLC reached 492 states and 1776 steps. The chart draws 13 states and 36 arrows.
The chart does not draw 336 steps that stay in one chart state.

## ParentGate breaks
The shortest path has 1 step:
0. Game First question, Sound Sound on
1. you tap a link around the game: Game Left for another page, Sound Sound on

## SilentWhenMuted breaks
The shortest path has 2 steps:
0. Game First question, Sound Sound on
1. you turn sound off: Game First question, Sound Sound off
2. you pick the safe one: Game First question, safe pick found, Sound Sound off

## SceneTileKeepsRound breaks
The shortest path has 2 steps:
0. Game First question, Sound Sound on
1. you pick a wrong one: Game First question, আরেকবার ভাবো, Sound Sound on
2. you tap a scene tile: Game First question, Sound Sound on

## Rules that hold
TypeOK, LinkOpensItsScene, RestOnlyAtBreak, NoNetwork, NoChildData, AnswersArePictures, NoDeadlock
