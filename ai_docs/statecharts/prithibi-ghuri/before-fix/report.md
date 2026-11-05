# PrithibiGhuri

TLC reached 329 states and 1990 steps. The chart draws 23 states and 49 arrows.
The chart does not draw 8 steps that stay in one chart state.
The view hides 768 steps, so the chart does not draw them.
The step you reload the page or come back to it changes Trip and Today, or Today and Gate, or Trip, Key and Today, or Trip, Today and Gate, or Trip, Key, Today and Gate, at the same time.
The step you tap a trip number changes Trip and Key, or Trip and Today, or Trip, Key and Today, at the same time.
The step you tap the আমার ছোটবেলা card under the game changes Trip and Gate, or Trip and Today, or Trip, Today and Gate, at the same time.
The step you hold Enter on পরেরটা changes Trip and Key at the same time.
The step the held key repeats changes Trip and Key at the same time.
The step you tap সফর শেষ changes Trip and Today at the same time.
The step you tap আবার খেলো changes Trip and Key, or Trip and Today, or Trip, Key and Today, at the same time.

## GateClosesBehindTheParent breaks
The shortest path has 1 step:
0. Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate closed
1. a parent opens বড়দের জন্য and hands the phone back untouched: Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate left open by a parent

## GateNeedsAnAdult breaks
The shortest path has 1 step:
0. Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate closed
1. the child keeps holding বড়দের জন্য and mashing the pad: Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate opened by the child

## NoOutboundForKids breaks
The shortest path has 1 step:
0. Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate closed
1. you tap the আমার ছোটবেলা card under the game: Trip Left for আমার ছোটবেলা (a grown-up's tool), Key Keys up, Today Time left today, Gate Gate closed

## NoNewRoundPastLimit breaks
The shortest path has 2 steps:
0. Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate closed
1. today's time runs out: Trip Map: pick a country, Key Keys up, Today Today's time is up, Gate Gate closed
2. you tap a trip number: Trip Map: pick a country, Key Keys up, Today Today's time is up, and this trip started after it ran out, Gate Gate closed

## PostcardsAreNotSkipped breaks
The shortest path has 4 steps:
0. Trip Map: pick a country, Key Keys up, Today Time left today, Gate Gate closed
1. you tap a country: Trip Plane flying, Key Keys up, Today Time left today, Gate Gate closed
2. the plane lands: Trip Postcard 1 (হ্যালো), Key Keys up, Today Time left today, Gate Gate closed
3. you hold Enter on পরেরটা: Trip Last postcard, Key Enter held, Today Time left today, Gate Gate closed
4. the held key repeats: Trip Stamp question, Key Enter held, a postcard flipped past unseen, Today Time left today, Gate Gate closed

## Rules that hold
TypeOK, HeldKeyNeverActsOnTheCard, NoDoubleResult, RestOnlyAtBreak, NoDeadlock
