# Nouka

TLC reached 328 states and 1460 steps. The chart draws 22 states and 35 arrows.
The chart does not draw 64 steps that stay in one chart state.
The step you tap a mode button or a ধাপ changes Race and Today at the same time.
The step 0.9 s later the card shows changes Race and Today at the same time.
The step a grown-up gives ১০ more minutes changes Race and Today at the same time.

## NoShareLinkDuringARace breaks
The shortest path has 1 step:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. a grown-up opens বড়দের জন্য: Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate Share link open

## FreshRaceStartsClean breaks
The shortest path has 3 steps:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. you spin your চরকি: Race Your চরকি spinning, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
2. you tap a mode button or a ধাপ: Race Your turn, the last race's চরকি still spinning, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
3. the চরকি stops: Race Your turn, a spin you never made is set, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed

## NothingRunsWhileAway breaks
The shortest path has 4 steps:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. you spin your চরকি: Race Your চরকি spinning, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
2. the চরকি stops: Race Your turn, tap the ghats, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
3. you tap the ghats to where it stops: Race আব্বু's turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
4. you leave (another window or tab): Race আব্বু's turn, Window You're away, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed

## EveryFinishedRaceCounts breaks
The shortest path has 4 steps:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. you spin your চরকি: Race Your চরকি spinning, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
2. the চরকি stops: Race Your turn, tap the ghats, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
3. you tap the ghats to where it stops: Race Your boat at the last ghat, card coming, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
4. you tap a mode button or a ধাপ: Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, a finished race never counted, Gate বড়দের জন্য closed

## Rules that hold
TypeOK, MuteMeansSilent, RestOnlyAtBreak, NoDeadlock
