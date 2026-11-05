# Juktoborno

TLC reached 372 states and 1700 steps. The chart draws 20 states and 48 arrows.
The chart does not draw 96 steps that stay in one chart state.
The view hides 388 steps, so the chart does not draw them.
The step the child taps a site link or the search changes Round and Voice at the same time.
The step you put in the last right letter changes Round and Voice at the same time.
The step they come back changes Round and Gate at the same time.
The step you press পরেরটা changes Round and Voice at the same time.
The step you press শেষ on the last word changes Round and Voice, or Round, Rest and Voice, or Round and Rest, at the same time.
The step a grown-up gives 10 more minutes changes Rest and Gate at the same time.

## NoWayOutWithoutGate breaks
The shortest path has 1 step:
0. Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
1. the child taps a site link or the search: Round Left the kids' area, Rest Time left today, Voice Sound on, Gate Gate shut

## VoiceOnlyWithSound breaks
The shortest path has 2 steps:
0. Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
1. you put in the last right letter: Round Word built, Rest Time left today, Voice Reading the word aloud, Gate Gate shut
2. you turn sound off: Round Word built, Rest Time left today, Voice Reading aloud with sound off, Gate Gate shut

## RestOnlyAtBreak breaks
The shortest path has 6 steps:
0. Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
1. today's time runs out: Round Building a word, Rest Today's time is up, Voice Sound on, Gate Gate shut
2. you put in the last right letter: Round Word built, Rest Today's time is up, Voice Reading the word aloud, Gate Gate shut
3. you press পরেরটা: Round Building a word, Rest Today's time is up, Voice Sound on, Gate Gate shut
4. you put in the last right letter: Round Last word built, Rest Today's time is up, Voice Reading the word aloud, Gate Gate shut
5. you press শেষ on the last word: Round Round card shows, Rest Rest screen shows, Voice Sound on, Gate Gate shut
6. you Tab to আবার খেলো under the rest screen and press Enter: Round Building a word, Rest Rest screen shows, Voice Sound on, Gate Gate shut

## ChildCannotOpenGate breaks
The shortest path has 7 steps:
0. Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
1. you put in the last right letter: Round Word built, Rest Time left today, Voice Reading the word aloud, Gate Gate shut
2. you press পরেরটা: Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
3. you put in the last right letter: Round Last word built, Rest Time left today, Voice Reading the word aloud, Gate Gate shut
4. you press শেষ on the last word: Round Round card shows, Rest Time left today, Voice Sound on, Gate Gate shut
5. someone holds বড়দের জন্য: Round Round card shows, Rest Time left today, Voice Sound on, Gate Gate held
6. 2 seconds pass: Round Round card shows, Rest Time left today, Voice Sound on, Gate Sum question shows
7. a child mashes the number pad: Round Round card shows, Rest Time left today, Voice Sound on, Gate Child opened the gate

## GateNeedsAFullHold breaks
The shortest path has 8 steps:
0. Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
1. you put in the last right letter: Round Word built, Rest Time left today, Voice Reading the word aloud, Gate Gate shut
2. you press পরেরটা: Round Building a word, Rest Time left today, Voice Sound on, Gate Gate shut
3. you put in the last right letter: Round Last word built, Rest Time left today, Voice Reading the word aloud, Gate Gate shut
4. you press শেষ on the last word: Round Round card shows, Rest Time left today, Voice Sound on, Gate Gate shut
5. someone holds বড়দের জন্য: Round Round card shows, Rest Time left today, Voice Sound on, Gate Gate held
6. Enter auto-repeats: Round Round card shows, Rest Time left today, Voice Sound on, Gate Gate held
7. they let go before 2 seconds: Round Round card shows, Rest Time left today, Voice Sound on, Gate Let go, timer still running
8. 2 seconds pass: Round Round card shows, Rest Time left today, Voice Sound on, Gate Sum question shows without a full hold

## Rules that hold
TypeOK, NoDoubleResult, NoNetwork, NoChildData, NoDeadlock, StarsNeverDrop
