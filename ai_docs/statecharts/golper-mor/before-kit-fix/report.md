# Golper

TLC reached 337 states and 1385 steps. The chart draws 21 states and 47 arrows.
The chart does not draw 33 steps that stay in one chart state.
The view hides 337 steps, so the chart does not draw them.
The step you press গল্প শেষ changes Story and Marks at the same time.
The step a grown-up gives ১০ more minutes changes Story and Today at the same time.

## NoStoryAfterTimeIsUp breaks
The shortest path has 2 steps:
0. Story Shelf, Marks Saved: nothing, Today Time left today
1. today's time runs out: Story Shelf, Marks Saved: nothing, Today Today's time is up
2. you open the story or press আবার পড়ো: Story Reading up to the মোড় after today's time is up, Marks Saved: nothing, Today Today's time is up

## ReadMarksNeverVanish breaks
The shortest path has 4 steps:
0. Story Shelf, Marks Saved: nothing, Today Time left today
1. you open the story or press আবার পড়ো: Story Reading up to the মোড়, Marks Saved: nothing, Today Time left today
2. you pick a turn at the মোড়: Story Reading turn ১, Marks Saved: nothing, Today Time left today
3. you press গল্প শেষ: Story End page, Marks Saved: turn ১, Today Time left today
4. in another tab you finish turn ২: Story End page, Marks A turn you read lost its mark. Saved: turn ২, this tab shows turn ১, Today Time left today

## Rules that hold
TypeOK, RestOnlyAtBreak, ShareOnlyOnTheShelf, ShowParentOnlyAtTheEnd, NoDeadlock
