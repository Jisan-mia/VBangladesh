// The sign's hop from its tile to its seat in the word, as Web Animations keyframes built once per tap (no per-frame code:
// the browser runs the curve). A right sign lands and stays; a wrong one tries the seat and hops back home with a wobble.

export const HOP_MS = 300;
export const MISS_MS = 950;

type Frame = { transform: string; offset: number; easing?: string };

const at = (x: number, y: number, scale: number, turn = 0) => `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(3)}) rotate(${turn}deg)`;

/** How high the arc lifts: a little more for a longer hop, never off the stage. */
export const lift = (dx: number, dy: number) => Math.min(90, 34 + Math.hypot(dx, dy) * 0.18);

/** Tile → seat: up in an arc, growing to the word's size, a small squash on landing. */
export function hopFrames(dx: number, dy: number, scale: number): Frame[] {
  const top = Math.min(dy, 0) - lift(dx, dy);
  return [
    { transform: at(0, 0, 1), offset: 0, easing: "cubic-bezier(.3,.7,.4,1)" },
    { transform: at(dx * 0.5, top, (1 + scale) / 2, -6), offset: 0.5, easing: "cubic-bezier(.6,0,.8,.4)" },
    { transform: at(dx, dy, scale * 1.06), offset: 0.88 },
    { transform: at(dx, dy, scale), offset: 1 },
  ];
}

/** Tile → seat → tile: it tries the seat, waits there a moment, then hops home and wobbles. */
export function missFrames(dx: number, dy: number, scale: number): Frame[] {
  const top = Math.min(dy, 0) - lift(dx, dy);
  return [
    { transform: at(0, 0, 1), offset: 0, easing: "cubic-bezier(.3,.7,.4,1)" },
    { transform: at(dx * 0.5, top, (1 + scale) / 2), offset: 0.16, easing: "cubic-bezier(.6,0,.8,.4)" },
    { transform: at(dx, dy, scale), offset: 0.32 },
    { transform: at(dx, dy, scale), offset: 0.55, easing: "cubic-bezier(.3,.7,.4,1)" },
    { transform: at(dx * 0.5, top * 0.6, (1 + scale) / 2), offset: 0.72, easing: "cubic-bezier(.6,0,.8,.4)" },
    { transform: at(0, 0, 1, -8), offset: 0.84 },
    { transform: at(0, 0, 1, 6), offset: 0.92 },
    { transform: at(0, 0, 1), offset: 1 },
  ];
}
