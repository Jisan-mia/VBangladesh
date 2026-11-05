# KarChinho

TLC reached 384 states and 2136 steps. The chart draws 25 states and 63 arrows.
The chart does not draw 8 steps that stay in one chart state.
The step the page opens again (reload, or from the kids' hub) changes Round and Sound, or Round and ShareGate, or Round, ShareGate and Sound, or Round and Today, or Round, Today and ShareGate, at the same time.
The step the child taps the level button changes Round and Sound at the same time.
The step the child taps the right sign changes Round and Sound at the same time.
The step the next word comes (1.1 s) changes Round and Sound at the same time.
The step the end screen comes (1.1 s) changes Round and Sound, or Round, Today and Sound, at the same time.

## GateNeedsAnAdult breaks
The shortest path has 1 step:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child holds বড়দের জন্য and mashes the pad: Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by the child, Sound Sound on

## NoShareForKids breaks
The shortest path has 1 step:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child holds বড়দের জন্য and mashes the pad: Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by the child, Sound Sound on

## SilentWhenMuted breaks
The shortest path has 2 steps:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child turns sound off: Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound off
2. the child taps the right sign: Round Right sign, next word in 1.1 s, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound off, the phone says the word

## NoNewRoundPastLimit breaks
The shortest path has 2 steps:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. today's play time runs out: Round First word, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
2. the page opens again (reload, or from the kids' hub): Round First word, started after today's time ran out, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on

## GateClosesWhenTheParentHandsBack breaks
The shortest path has 3 steps:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. a parent takes the phone: Round First word, Today Time left today, Phone A parent has the phone, ShareGate Share gate closed, Sound Sound on
2. the parent opens বড়দের জন্য: Round First word, Today Time left today, Phone A parent has the phone, ShareGate Share gate opened by a parent, Sound Sound on
3. the child takes the phone back: Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by a parent, Sound Sound on

## EveryFinishCounts breaks
The shortest path has 4 steps:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child taps the right sign: Round Right sign, next word in 1.1 s, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the word
2. the next word comes (1.1 s): Round Last word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
3. the child taps the right sign: Round Last sign right, end screen in 1.1 s, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the word
4. the child taps the level button: Round Level picker, the finished round was never counted, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on

## OnlyParentsGiveMoreTime breaks
The shortest path has 6 steps:
0. Round First word, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. today's play time runs out: Round First word, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
2. the child taps the right sign: Round Right sign, next word in 1.1 s, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the word
3. the next word comes (1.1 s): Round Last word, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
4. the child taps the right sign: Round Last sign right, end screen in 1.1 s, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the word
5. the end screen comes (1.1 s): Round End screen (আবার খেলো / শেষ), Today Rest screen (আজ এটুকুই), its gate closed, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
6. the child holds the rest screen's gate and mashes the pad: Round End screen (আবার খেলো / শেষ), Today Rest screen (আজ এটুকুই), its gate opened by the child, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on

## Rules that hold
TypeOK, RestOnlyAtBreak, NoDeadlock
