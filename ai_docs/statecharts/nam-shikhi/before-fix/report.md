# NamShikhi

TLC reached 420 states and 2808 steps. The chart draws 24 states and 55 arrows.
The chart does not draw 92 steps that stay in one chart state.
The step a #p= link opens changes Round and Sound at the same time.
The step the page opens again (reload, or from the kids' hub) changes Round and Sound, or Round and ShareGate, or Round, ShareGate and Sound, or Round and Today, or Round, Today and ShareGate, at the same time.
The step the child presses আবার খেলো or picks a pack or level changes Round and Sound at the same time.
The step the child taps the right picture changes Round and Sound at the same time.
The step the child presses পরেরটা changes Round and Sound at the same time.
The step the child presses দেখো কী শিখলে changes Round and Sound, or Round, Today and Sound, or Round and Today, at the same time.

## GateNeedsAnAdult breaks
The shortest path has 1 step:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child holds বড়দের জন্য and mashes the pad: Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by the child, Sound Sound on

## NoShareForKids breaks
The shortest path has 1 step:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child holds বড়দের জন্য and mashes the pad: Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by the child, Sound Sound on

## SilentWhenMuted breaks
The shortest path has 2 steps:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. the child turns sound off: Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound off
2. the child taps the right picture: Round Right picture, পরেরটা shows, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound off, the phone says the name

## NoNewRoundPastLimit breaks
The shortest path has 2 steps:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. today's play time runs out: Round First picture, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
2. a #p= link opens: Round First picture, started after today's time ran out, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on

## GateClosesWhenTheParentHandsBack breaks
The shortest path has 3 steps:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. a parent takes the phone: Round First picture, Today Time left today, Phone A parent has the phone, ShareGate Share gate closed, Sound Sound on
2. the parent opens বড়দের জন্য: Round First picture, Today Time left today, Phone A parent has the phone, ShareGate Share gate opened by a parent, Sound Sound on
3. the child takes the phone back: Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate opened by a parent, Sound Sound on

## OnlyParentsGiveMoreTime breaks
The shortest path has 6 steps:
0. Round First picture, Today Time left today, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
1. today's play time runs out: Round First picture, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
2. the child taps the right picture: Round Right picture, পরেরটা shows, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the name
3. the child presses পরেরটা: Round Last picture, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
4. the child taps the right picture: Round Last picture right, দেখো কী শিখলে shows, Today Today's time is up, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on, the phone says the name
5. the child presses দেখো কী শিখলে: Round Done screen (আবার খেলো / শেষ), Today Rest screen (আজ এটুকুই), its gate closed, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on
6. the child holds the rest screen's gate and mashes the pad: Round Done screen (আবার খেলো / শেষ), Today Rest screen (আজ এটুকুই), its gate opened by the child, Phone The child has the phone, ShareGate Share gate closed, Sound Sound on

## Rules that hold
TypeOK, RestOnlyAtBreak, NoDeadlock
