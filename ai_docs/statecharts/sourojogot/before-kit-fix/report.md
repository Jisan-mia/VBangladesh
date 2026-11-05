# Sourojogot

TLC reached 476 states and 2754 steps. The chart draws 19 states and 35 arrows.
The chart does not draw 358 steps that stay in one chart state.
The view hides 728 steps, so the chart does not draw them.
The step you press আবার খেলো or pick a level changes Game and Gate at the same time.
The step a grown-up gives ১০ more minutes changes Game and Today at the same time.
The step you Tab to সব লেভেল behind the rest screen and press Enter changes Game and Gate at the same time.

## NoFreeTextForKids breaks
The shortest path has 1 step:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you type in the site search: Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Typing in the site search

## NothingLoadsAfterStart breaks
The shortest path has 1 step:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you type in the site search: Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Typing in the site search

## NoRoundAfterTimeIsUp breaks
The shortest path has 2 steps:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. today's time runs out: Game Playing a round, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched
2. you press আবার খেলো or pick a level: Game Playing a round after today's time is up, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched

## RestOnlyAtBreak breaks
The shortest path has 3 steps:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. today's time runs out: Game Playing a round, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched
2. you finish the round: Game Rest screen at the end of a round, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched
3. you Tab to সব লেভেল behind the rest screen and press Enter: Game Rest screen over a round in play, Today Today's time is up, Gate বড়দের জন্য closed, Search Search untouched

## ShareNeverLeftOpenForTheChild breaks
The shortest path has 4 steps:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you hold বড়দের জন্য: Game Playing a round, Today Time left today, Gate Holding বড়দের জন্য, Search Search untouched
2. 2 s pass: Game Playing a round, Today Time left today, Gate Sum question, Search Search untouched
3. a grown-up answers the sum: Game Playing a round, Today Time left today, Gate Share link open for a grown-up, Search Search untouched
4. you press আবার খেলো or pick a level: Game Playing a round, Today Time left today, Gate Share link left open for the child, Search Search untouched

## GateAsksOnlyAfterAFullHold breaks
The shortest path has 4 steps:
0. Game Playing a round, Today Time left today, Gate বড়দের জন্য closed, Search Search untouched
1. you hold বড়দের জন্য: Game Playing a round, Today Time left today, Gate Holding বড়দের জন্য, Search Search untouched
2. the held key repeats: Game Playing a round, Today Time left today, Gate Holding বড়দের জন্য, Search Search untouched
3. you let go before 2 s: Game Playing a round, Today Time left today, Gate Let go, a hold timer still running, Search Search untouched
4. 2 s pass: Game Playing a round, Today Time left today, Gate Sum question opened by a short press, Search Search untouched

## Rules that hold
TypeOK, RestNeverHidesBehindShowParent, SaveOnlyBehindTheGate, NoDeadlock
