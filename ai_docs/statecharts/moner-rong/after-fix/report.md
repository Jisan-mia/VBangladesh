# MonerRong

TLC reached 394 states and 1975 steps. The chart draws 30 states and 89 arrows.
The chart does not draw 804 steps that stay in one chart state.
The model goes from Game Picture 1: a grey ?, faces on offer, Pause Playing, Saved 0 played, 0 stars, 0 pictures on the card, Today No rest screen to Game Title or level list, Pause Playing, Saved 0 played, 0 stars, 0 pictures on the card, Today No rest screen by the page opens again, which the regions chart cannot show. So the chart draws parent states in place of regions.

## Rules that hold
TypeOK, RestOnlyAtBreak, NoNewRoundPastLimit, RestAtTheBreak, WonIsRecorded, EndFollowsARecordedRound, StarsMatchPlays, CardMatchesPlays, PausedOrWakingWhenAway, NoDeadlock, StarsNeverDrop, NothingChosenWhenItCannotCount
