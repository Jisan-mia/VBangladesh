// What the drawing needs besides the round: the clock, ধীরে খেলো, and the moments of the last pop and bell. Plain data, mutated in place.
export type View = {
  slow: boolean;
  /** Seconds of animation time (advances only while the kitchen runs). */
  clock: number;
  /** `clock` when the last big bubble burst, or -9. */
  popAt: number;
  /** `clock` when the foam last sank (the second boil), or -9. */
  sinkAt: number;
};
export const makeView = (): View => ({ slow: false, clock: 0, popAt: -9, sinkAt: -9 });
