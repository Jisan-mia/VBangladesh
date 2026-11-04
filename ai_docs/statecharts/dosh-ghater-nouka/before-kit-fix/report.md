# Nouka

TLC reached 468 states and 1964 steps. The chart draws 24 states and 43 arrows.
The chart does not draw 72 steps that stay in one chart state.
The step you tap a mode button or a ধাপ changes Race and Today, or Race and Sound, or Race, Sound and Today, at the same time.
The step you tap the ghats to where it stops changes Race and Sound at the same time.
The step 0.9 s later the card shows changes Race and Today at the same time.
The step you press আবার খেলো or নতুন খেলা changes Race and Sound at the same time.
The step a grown-up gives ১০ more minutes changes Race and Today at the same time.
The step you Tab to সব ধাপ behind the rest screen changes Race and Sound at the same time.
The step আব্বু's boat counts its ghats changes Race and Sound at the same time.

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

## MuteMeansSilent breaks
The shortest path has 4 steps:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. you turn sound off: Race Your turn, Window You're on the page, Sound Sound off, Today Time left today, Gate বড়দের জন্য closed
2. you spin your চরকি: Race Your চরকি spinning, Window You're on the page, Sound Sound off, Today Time left today, Gate বড়দের জন্য closed
3. the চরকি stops: Race Your turn, tap the ghats, Window You're on the page, Sound Sound off, Today Time left today, Gate বড়দের জন্য closed
4. you tap the ghats to where it stops: Race আব্বু's turn, Window You're on the page, Sound Sound off, but numbers were spoken, Today Time left today, Gate বড়দের জন্য closed

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

## RestOnlyAtBreak breaks
The shortest path has 6 steps:
0. Race Your turn, Window You're on the page, Sound Sound on, Today Time left today, Gate বড়দের জন্য closed
1. today's time runs out: Race Your turn, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed
2. you spin your চরকি: Race Your চরকি spinning, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed
3. the চরকি stops: Race Your turn, tap the ghats, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed
4. you tap the ghats to where it stops: Race Your boat at the last ghat, card coming, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed
5. 0.9 s later the card shows: Race Rest screen after the race, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed
6. you Tab to সব ধাপ behind the rest screen: Race Rest screen over a race in play, Window You're on the page, Sound Sound on, Today Today's time is up, Gate বড়দের জন্য closed

## Rules that hold
TypeOK, NoDeadlock
