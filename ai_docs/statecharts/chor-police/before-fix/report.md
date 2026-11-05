# ChorPolice

TLC reached 356 states and 1726 steps. The chart draws 21 states and 41 arrows.
The chart does not draw 212 steps that stay in one chart state.
The view hides 806 steps, so the chart does not draw them.
The step you look away (other window or tab) changes Game and Window at the same time.
The step you press Enter again / আরেকবার changes Game and Scores at the same time.

## DrumStopsWithRound breaks
The shortest path has 18 steps:
0. Game Setting up, Window On the page, Scores Scorecard kept
1. you press চিরকুট তোলো: Game Phone handed on, Window On the page, Scores Scorecard kept
2. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
3. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
4. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
5. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
6. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
7. you press দেখেছি: Game Phone handed on, Window On the page, Scores Scorecard kept
8. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
9. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
10. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
11. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
12. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
13. you press দেখেছি: Game Everyone has looked, Window On the page, Scores Scorecard kept
14. half a second passes: Game Everyone has looked, Window On the page, Scores Scorecard kept
15. you press বাবু-পুলিশ কে, দেখাও: Game Police choosing, Window On the page, Scores Scorecard kept
16. half a second passes: Game Police choosing, Window On the page, Scores Scorecard kept
17. the police names someone: Game Drumroll, Window On the page, Scores Scorecard kept
18. you press থামাও: Game Setting up, drum still beating, Window On the page, Scores Scorecard kept

## NoTapPastResult breaks
The shortest path has 20 steps:
0. Game Setting up, Window On the page, Scores Scorecard kept
1. you press চিরকুট তোলো: Game Phone handed on, Window On the page, Scores Scorecard kept
2. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
3. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
4. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
5. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
6. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
7. you press দেখেছি: Game Phone handed on, Window On the page, Scores Scorecard kept
8. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
9. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
10. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
11. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
12. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
13. you press দেখেছি: Game Everyone has looked, Window On the page, Scores Scorecard kept
14. half a second passes: Game Everyone has looked, Window On the page, Scores Scorecard kept
15. you press বাবু-পুলিশ কে, দেখাও: Game Police choosing, Window On the page, Scores Scorecard kept
16. half a second passes: Game Police choosing, Window On the page, Scores Scorecard kept
17. the police names someone: Game Drumroll, Window On the page, Scores Scorecard kept
18. the drumroll ends and the chits open: Game Chits open, round scored, Window On the page, Scores Scorecard kept
19. you press এখানেই শেষ করো: Game Scorecard just appeared, Window On the page, Scores Scorecard kept
20. you press Enter again / আরেকবার: Game Phone handed on, Window On the page, Scores Scorecard skipped by a stray tap

## FinishedStaysFinished breaks
The shortest path has 20 steps:
0. Game Setting up, Window On the page, Scores Scorecard kept
1. you press চিরকুট তোলো: Game Phone handed on, Window On the page, Scores Scorecard kept
2. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
3. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
4. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
5. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
6. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
7. you press দেখেছি: Game Phone handed on, Window On the page, Scores Scorecard kept
8. half a second passes: Game Phone handed on, Window On the page, Scores Scorecard kept
9. the next player takes the phone: Game Picking a chit, Window On the page, Scores Scorecard kept
10. half a second passes: Game Picking a chit, Window On the page, Scores Scorecard kept
11. you pick a chit: Game Chit folded in hand, Window On the page, Scores Scorecard kept
12. you hold the chit open: Game Chit open, Window On the page, Scores Scorecard kept
13. you press দেখেছি: Game Everyone has looked, Window On the page, Scores Scorecard kept
14. half a second passes: Game Everyone has looked, Window On the page, Scores Scorecard kept
15. you press বাবু-পুলিশ কে, দেখাও: Game Police choosing, Window On the page, Scores Scorecard kept
16. half a second passes: Game Police choosing, Window On the page, Scores Scorecard kept
17. the police names someone: Game Drumroll, Window On the page, Scores Scorecard kept
18. the drumroll ends and the chits open: Game Chits open, round scored, Window On the page, Scores Scorecard kept
19. you press এখানেই শেষ করো: Game Scorecard just appeared, Window On the page, Scores Scorecard kept
20. you reload the page: Game Paused, though the evening had ended, Window On the page, Scores Scorecard kept

## Rules that hold
TypeOK, ChitClosedWhenAway, ChitOnlyWhilePeeking, NoRollAfterLeaving, NoDoubleResult, NoDeadlock
