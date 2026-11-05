// What the canvas frame reads and writes, kept out of React so a frame never re-renders or allocates. Made once per mount.
export const DUST = 16;
export const RAIN = 40;

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    /** CSS px of the canvas, device ratio, the ground line and pixels per ডাং at zoom 1. */
    width: 0, height: 0, ratio: 1, ground: 0, unit: 1,
    world: -1,
    sky: null as HTMLCanvasElement | null,
    far: null as HTMLCanvasElement | null, farWidth: 0,
    /** ধীরে খেলো or reduced motion: no shake, flashes, dust or rain. */
    calm: false,
    clock: 0,
    /** The camera: world x at the left edge, and the zoom (1 near, smaller to show a high কাঠি). */
    camX: -1.6, zoom: 1,
    /** Where the কাঠি is drawn, its spin, and the kids' mood (0 idle, 1 watching, 2 cheering, 3 groaning) and its timer. */
    ball: { x: 0, y: 0 }, spin: 0, mood: 0, moodTime: 0,
    /** Seconds since the batter swung (-1: no swing this hit). */
    swing: -1,
    /** 1 → 0: the gold ring at the contact, the screen shake, the gust chevrons. */
    flash: 0, shake: 0, gust: 0, gustDir: 0,
    /** The কাঠি fell past the band without a swing: the bottom edge warns. */
    late: false,
    /** Dust or splash: position, speed and life per particle, in ডাং. */
    dx: new Float32Array(DUST), dy: new Float32Array(DUST), dvx: new Float32Array(DUST), dvy: new Float32Array(DUST), dl: new Float32Array(DUST),
    dustColor: "#8a6440",
    /** Rain streaks over the বর্ষার মাঠ, in CSS px. */
    rx: new Float32Array(RAIN), ry: new Float32Array(RAIN),
    /** The ডাং label shown on the কাঠি, and the count it rose from (counting while it flies). */
    shownDist: -1,
  };
}
export type View = ReturnType<typeof makeView>;
