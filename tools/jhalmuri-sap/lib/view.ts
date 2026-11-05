// What the canvas frame reads and writes, kept out of React so a frame never re-renders or allocates. Made once per mount.
import { worldPalettes, type WorldPalette } from "./art";
import { CELLS } from "./levels";
import { MAX_CROWS } from "./rules";

export const PARTICLES = 24;
/** The frame's phase, as a number so the frame code never compares strings it built. */
export const Look = { Title: 0, Story: 1, Playing: 2, Paused: 3, Over: 4 } as const;
export type Look = typeof Look[keyof typeof Look];

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    width: 0, height: 0, fence: 0, cell: 0, ratio: 1,
    colors: worldPalettes.paper as WorldPalette,
    background: null as HTMLCanvasElement | null,
    atlas: null as HTMLCanvasElement | null, sprite: 0,
    danger: null as HTMLCanvasElement | null,
    dark: null as HTMLCanvasElement | null,
    look: Look.Title as Look,
    calm: false,
    /** Time banked towards the next move, and one move's length, in ms; no moves before `hold` (a breath after a start or resume). */
    acc: 0, every: 230, hold: 0,
    /** The body before the last move, for easing each segment from where it was. */
    prev: new Int16Array(CELLS), prevLength: 0,
    crowPrev: new Int16Array(MAX_CROWS),
    points: new Float32Array(CELLS * 2),
    /** Bites travelling down the body as bulges: segment index, or -1. */
    bulges: new Int16Array(4).fill(-1),
    px: new Float32Array(PARTICLES), py: new Float32Array(PARTICLES), vx: new Float32Array(PARTICLES), vy: new Float32Array(PARTICLES), life: new Float32Array(PARTICLES), hue: new Uint8Array(PARTICLES),
    /** A small integer noise for particle spread (the frame code stays deterministic and allocation-free). */
    noise: 1,
    shakeUntil: 0, crashAt: 0,
    /** The edge glows from this time on, while the next move would end the run. */
    dangerSince: -1,
  };
}
export type View = ReturnType<typeof makeView>;
