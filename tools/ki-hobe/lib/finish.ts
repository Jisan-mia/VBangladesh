// A won round's bookkeeping in one pure place: the stars saved (practice, one more per play-through), today's card, and the
// limit check, all at the tap that made the last guess and once per round. The component calls this and obeys.
import { recordLevel, type LevelStars } from "../../../shared/game-core";
import { practised } from "./progress";
import type { Round } from "./round";
import { won, type Session } from "./session";
import { addToday, type Today } from "./lines";

export type Finished = { stars: LevelStars; today: Today; earned: number; right: number; total: number };

/** Null when this round was already recorded (a second tap): nothing changes, nothing is counted twice. */
export function finishRound(s: Session, stars: LevelStars, today: Today, round: Round, over: boolean): Finished | null {
  if (!round.full || !won(s, over)) return null;
  const earned = practised(stars[round.level] ?? 0);
  return { stars: recordLevel(stars, round.level, earned), today: addToday(today, round), earned, right: round.right, total: round.items.length };
}
