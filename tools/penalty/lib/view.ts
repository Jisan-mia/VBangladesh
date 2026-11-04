// What the canvas frame reads and writes, kept out of React so a frame never re-renders or allocates. Made once per mount.
import { paletteFor, type Palette } from "./scene";

export const CROWD = 90;
export const TRAIL = 48;
export const BALL_TRAIL = 8;

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    /** CSS px of the canvas, the board scale (px per board unit), and the extra board units above and below the 360×340 field. */
    width: 0, height: 0, scale: 1, top: 0, bottom: 0, ratio: 1,
    palette: paletteFor(1) as Palette, level: 1,
    background: null as HTMLCanvasElement | null,
    danger: null as HTMLCanvasElement | null,
    calm: false,
    /** Look: 0 title (idle sway), 1 playing, 2 paused, 3 over. */
    look: 0,
    // the crowd on the wall or in the stands: position, shirt, a phase for the bob
    cx: new Float32Array(CROWD), cy: new Float32Array(CROWD), cr: new Float32Array(CROWD), cs: new Uint8Array(CROWD), cp: new Float32Array(CROWD), crowd: 0,
    /** 1 → 0: the crowd jumping after a goal or a save. Negative: a groan. */
    cheer: 0,
    /** 1 → 0: the net ripple at (rippleX, rippleY). */
    ripple: 0, rippleX: 0, rippleY: 0,
    /** 1 → 0: the struck post wobbling (side -1 left, 1 right, 0 the bar). */
    wobble: 0, wobbleSide: 0,
    /** 1 → 0: the white flash where the boot met the ball. */
    flash: 0,
    /** Seconds of a small shake left (the camera punch on a kick, a jolt on a miss). */
    shake: 0, shakeSize: 0,
    // the swipe, in board units and ms
    xs: new Float32Array(TRAIL), ys: new Float32Array(TRAIL), ts: new Float64Array(TRAIL), count: 0, pointer: -1, downX: 0, downY: 0, moved: false,
    /** How the player is aiming: 0 idle, 1 swipe, 2 meter, 3 keys. */
    aim: 0,
    /** A live power from the swipe's last stretch, for the bar while the finger moves. */
    swipePower: 0,
    // the ball's recent positions, for a short motion trail
    bx: new Float32Array(BALL_TRAIL), by: new Float32Array(BALL_TRAIL), bhead: 0, bcount: 0,
    /** A press on the ball: it squashes for a beat (1 → 0). */
    squash: 0,
    clock: 0,
  };
}
export type View = ReturnType<typeof makeView>;
