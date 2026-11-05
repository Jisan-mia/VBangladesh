// What the canvas frame reads and writes, kept out of React so a frame never re-renders or allocates. Made once per mount.
import type { Layout } from "./scene";

export const TRAIL = 10;
export const DUST = 36;

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    /** CSS px of the canvas, device ratio, and the court's layout in it. */
    width: 0, height: 0, ratio: 1, layout: { scale: 1, ox: 0, top: 0 } as Layout,
    world: -1,
    back: null as HTMLCanvasElement | null,
    fog: null as HTMLCanvasElement | null,
    /** ধীরে খেলো or reduced motion: no shake, flashes, dust or moths. */
    calm: false,
    /** Seconds since the view started, for idle motion. */
    clock: 0,
    // the shuttle's recent positions, for a short trail
    tx: new Float32Array(TRAIL), ty: new Float32Array(TRAIL), thead: 0, tcount: 0,
    // dust and leaves blowing on the rooftop
    dx: new Float32Array(DUST), dy: new Float32Array(DUST), ds: new Float32Array(DUST),
    /** 1 → 0: the gold burst at (fx, fy); the smash streak; the net bulging; the neighbour at the window; the court shake. */
    flash: 0, fx: 0, fy: 0, streak: 0, bulge: 0, sigh: 0, shake: 0,
    /** A gust is coming or blowing: −1 towards you, 1 towards them, 0 none; and how strong (0..1). */
    gust: 0, gustPow: 0,
    /** A finger is down: the shot the pull has chosen so far (−1: none yet). */
    aiming: -1,
  };
}
export type View = ReturnType<typeof makeView>;
