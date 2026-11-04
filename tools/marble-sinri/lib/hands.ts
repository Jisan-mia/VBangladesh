// Which sides are held: every finger on the board and each arrow key, counted on press and release (never per frame).
// Pure, so the statechart's "the marble rolls only while you hold a side" replays in node tests.
export type Hands = { sides: Map<string, -1 | 1>; last: -1 | 0 | 1 };

export const makeHands = (): Hands => ({ sides: new Map(), last: 0 });
export function press(hands: Hands, id: string, side: -1 | 1) { hands.sides.set(id, side); hands.last = side; }
export function lift(hands: Hands, id: string) { hands.sides.delete(id); }
/** Blur, a hidden tab, a pause, the end: nothing counts as held any more (a keyup lost to another window can't stick). */
export function release(hands: Hands) { hands.sides.clear(); hands.last = 0; }
/** The side to roll: the one held, or the latest pressed when both are. */
export function direction(hands: Hands) {
  let left = false, right = false;
  for (const side of hands.sides.values()) { if (side < 0) left = true; else right = true; }
  return left && right ? hands.last : left ? -1 : right ? 1 : 0;
}
