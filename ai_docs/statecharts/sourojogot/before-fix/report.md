# Sourojogot

TLC reached 144 states and 725 steps. The chart draws 18 states and 42 arrows.
The chart does not draw 17 steps that stay in one chart state.
The view hides 60 steps, so the chart does not draw them.
The step you press আবার খেলো or pick a level changes Game and Gate at the same time.
The step you open or reload the game changes Game and Gate, or Game and Search, or Game, Gate and Search, at the same time.
The step a grown-up gives ১০ more minutes changes Game and Today at the same time.

## NoFreeTextForKids breaks
The shortest path has 1 step:
0. Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you type in the site search: Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Typing in the site search

## NothingLoadsAfterStart breaks
The shortest path has 1 step:
0. Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you type in the site search: Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Typing in the site search

## NoRoundAfterTimeIsUp breaks
The shortest path has 2 steps:
0. Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. today's time runs out: Game New round, nothing tapped yet, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched
2. you press আবার খেলো or pick a level: Game Playing a round after today's time is up, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched

## ShareNeverLeftOpenForTheChild breaks
The shortest path has 4 steps:
0. Game New round, nothing tapped yet, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you hold বড়দের জন্য: Game New round, nothing tapped yet, Today Time left today, Gate Holding বড়দের জন্য, Search Search untouched
2. 2 s pass: Game New round, nothing tapped yet, Today Time left today, Gate Sum question, Search Search untouched
3. a grown-up answers the sum: Game New round, nothing tapped yet, Today Time left today, Gate Share link open for a grown-up, Search Search untouched
4. you press আবার খেলো or pick a level: Game New round, nothing tapped yet, Today Time left today, Gate Share link left open for the child, Search Search untouched

## Rules that hold
TypeOK, RestOnlyAtBreak, RestNeverHidesBehindShowParent, GateAsksOnlyAfterAFullHold, SaveOnlyBehindTheGate, NoDeadlock
