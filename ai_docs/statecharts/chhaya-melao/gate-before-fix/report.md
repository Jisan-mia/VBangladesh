# KidsGate

TLC reached 42 states and 114 steps. The chart draws 23 states and 42 arrows.
1 state outside the constraints ends a rule's path, and the chart includes it. TLC checks the rules in a state outside the constraints, but it does not explore past it.
The chart does not draw 20 steps that stay in one chart state.
The regions chart lets Gate Sum in words, number pad, Hands One finger or key down, Timer No timer, Tries No wrong answer yet, Link Not shared go to Gate Open, a child got in, Hands One finger or key down, Timer No timer, Tries One wrong answer, Link Not shared by a child taps two digits at random, which the model never does. So the chart draws parent states in place of regions.

## OnlyAGrownUpOpensIt breaks
The shortest path has 3 steps:
0. Gate Button: চেপে ধরো, Hands No finger down, Timer No timer, Tries —, Link Not shared
1. a finger or key goes down on the button: Gate Button: চেপে ধরো, Hands One finger or key down, Timer 2 s timer running, Tries —, Link Not shared
2. two seconds pass: Gate Sum in words, number pad, Hands One finger or key down, Timer No timer, Tries No wrong answer yet, Link Not shared
3. a child taps two digits at random: Gate Open, a child got in, Hands One finger or key down, Timer No timer, Tries —, Link Not shared

## NoShareForKids breaks
The shortest path has 4 steps:
0. Gate Button: চেপে ধরো, Hands No finger down, Timer No timer, Tries —, Link Not shared
1. a finger or key goes down on the button: Gate Button: চেপে ধরো, Hands One finger or key down, Timer 2 s timer running, Tries —, Link Not shared
2. two seconds pass: Gate Sum in words, number pad, Hands One finger or key down, Timer No timer, Tries No wrong answer yet, Link Not shared
3. a child taps two digits at random: Gate Open, a child got in, Hands One finger or key down, Timer No timer, Tries —, Link Not shared
4. someone taps খেলাটার লিংক পাঠাও: Gate Button: চেপে ধরো, Hands No finger down, Timer No timer, Tries —, Link A child shared the link

## Rules that hold
TypeOK, AskNeedsAHold, TwoTriesPerHold, ShutsAfterOneAction, NoDeadlock
