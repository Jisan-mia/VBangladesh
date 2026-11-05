// What the frame drawer reads besides the game: the pre-rendered layers, cached fonts and the motion settings. Made once, mutated in place.
export type View = {
  scale: number;
  background: HTMLCanvasElement | null;
  basket: HTMLCanvasElement | null;
  fonts: Map<string, string>;
  fallback: string;
  /** Seconds of animation (runs while frames run; it only sways things). */
  clock: number;
  /** ধীরে খেলো or reduced motion: nothing sways, shakes or bobs. */
  calm: boolean;
  /** The ghost finger shows on the first fruit of the game. */
  finger: boolean;
  /** "টানা ৩" over the basket after a run of catches. */
  popT: number; popText: string; popX: number;
};

export const makeView = (): View => ({
  scale: 1, background: null, basket: null, fonts: new Map(), fallback: '700 30px "Display", "Bangla"',
  clock: 0, calm: false, finger: false, popT: 9, popText: "", popX: 0,
});
