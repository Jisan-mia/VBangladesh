// Everything the canvas loop reads and writes, made once per mount and mutated in place, so a frame never re-renders or allocates.
import { COUNT } from "./table";
import type { Hand } from "./game";

export function makeView() {
  return {
    context: null as CanvasRenderingContext2D | null,
    /** The canvas's CSS size (square) and CSS px per board millimetre. */
    size: 0, scale: 1,
    background: null as HTMLCanvasElement | null,
    sprites: [null, null, null, null] as Array<HTMLCanvasElement | null>,
    /** Which world's board is painted in `background`, -1 for none yet. */
    painted: -1,
    clock: 0, calm: false, flip: false,
    hand: "n" as Hand,
    /** The aim, an angle from straight up in the shooter's view; the power 0–1 while a pull or a hold is on. */
    aim: 0, power: 0,
    /** The power মারো uses on a tap, shown as a faint ring while you aim. */
    restPower: 0.5,
    /** The power window of the pot the aim is on (0 when it isn't on one): green inside, amber below, red above. */
    lo: 0, hi: 0,
    /** The angle the drag started from, and where the pull crossed the dead zone (screen px), for the damped turn. */
    aimFrom: 0, refX: 0, refY: 0, refSet: false,
    pulling: false, charging: false, chargeAt: 0, turnDir: 0,
    /** Aiming is live (draw the guide), the ghost finger shows, the striker sits on a coin. */
    aiming: false, demo: false, blocked: false,
    simCarry: 0, seen: 0, pots: 0, lastClack: 0, lastBump: 0, tickU: 0.5,
    fallAt: new Float64Array(COUNT).fill(-10),
    popAt: new Float64Array(4).fill(-10),
    popKind: new Uint8Array(4),
    shakeAt: -10,
  };
}
export type View = ReturnType<typeof makeView>;
