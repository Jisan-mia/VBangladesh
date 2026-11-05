// What the canvas frame reads and writes, kept out of React so a frame never re-renders or allocates. Made once per mount.
export const DUST = 14;
export const LEAVES = 8;
export const POPS = 4;

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    /** CSS px of the canvas, device ratio, the horizon, and the top's size (its height) and spot. */
    width: 0, height: 0, ratio: 1, horizon: 0, cx: 0, cy: 0, size: 0, world: -1, level: -1,
    bg: null as HTMLCanvasElement | null,
    sprite: null as HTMLCanvasElement | null, spriteFor: 0,
    things: [] as HTMLCanvasElement[], thingsFor: 0,
    /** ধীরে খেলো or reduced motion: no shake, flashes, dust or particles. */
    calm: false,
    clock: 0,
    /** Seconds since the throw landed, since the fall or the palm began (their little animations). */
    landT: 9, endT: 0, fallDir: 1, fallTilt: 0, spinLeft: 0, turn: 0,
    /** How far the finger has pulled the hanging top (0..1), and how much string is wound (turns), in the hand. */
    drag: 0, wound: 0, windPower: 0,
    /** 1 → 0: the ring at a good touch, the screen shake, the dot's pulse. */
    flash: 0, shake: 0, flashSide: 1,
    /** The wobble, smoothed for the edge glow. */
    danger: 0,
    /** Floating text: a few slots (text, colour, age). */
    popText: ["", "", "", ""] as string[], popColor: ["", "", "", ""] as string[], popAge: new Float32Array(POPS), popX: new Float32Array(POPS), popNext: 0,
    /** Dust or sand: position, speed and life per particle, in px. */
    dx: new Float32Array(DUST), dy: new Float32Array(DUST), dvx: new Float32Array(DUST), dvy: new Float32Array(DUST), dl: new Float32Array(DUST),
    /** Leaves blown by the wind. */
    lx: new Float32Array(LEAVES), ly: new Float32Array(LEAVES), lp: new Float32Array(LEAVES),
  };
}
export type View = ReturnType<typeof makeView>;
