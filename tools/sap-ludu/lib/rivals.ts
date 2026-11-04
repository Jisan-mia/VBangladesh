// How a computer seat picks between its two pieces. Deterministic: the same race replays the same way on every phone.
import { previews, smartPick, type Game } from "./game";
import { RIVALS, type RivalStyle } from "./levels";

export function rivalPick(game: Game, style: RivalStyle) {
  const list = previews(game);
  if (list.length < 2) return list[0]?.piece ?? 0;
  if (style === "rear") {
    // The piece further back moves, unless that walks it into a snake.
    let rear = list[0];
    for (const option of list) if (option.at < rear.at) rear = option;
    return rear.end >= rear.to ? rear.piece : smartPick(game);
  }
  if (style === "ladder") {
    let climb = -1, gain = 0;
    for (const option of list) if (option.end - option.to > gain) { gain = option.end - option.to; climb = option.piece; }
    if (climb >= 0) return climb;
    // No ladder in reach: push the leading piece, unless it meets a snake.
    let lead = list[0];
    for (const option of list) if (option.at > lead.at) lead = option;
    return lead.end >= lead.to ? lead.piece : smartPick(game);
  }
  return smartPick(game);
}

/** The style of the computer in `seat` (seat 1 is মিনু আপা, 2 ছোট মামা, 3 নানু). */
export const styleOf = (seat: number) => RIVALS[(seat - 1) % RIVALS.length].style;
export const rivalName = (seat: number) => RIVALS[(seat - 1) % RIVALS.length].name;
