// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** Filling a cell: the needle goes in and the thread is pulled through, a short rising swish. */
export function stitch() {
  hiss(0.07, 0.07, 2600, "bandpass");
  tone(900, 0.03, 0.03, "triangle", 0.02, 1300);
  buzz(5);
}

/** The signature: the picture colours in corner to corner, a run of notes following the ripple. */
export function reveal(size: number) {
  [523, 587, 659, 784, 880, 1047, 1175, 1319].slice(0, Math.min(8, size)).forEach((frequency, step) => tone(frequency, 0.2, 0.1, "triangle", step * 0.07));
}

/** A row or column just matched its clue; the pitch climbs with each one in a row. */
export const lineDone = (streak: number) => sfx.combo(streak);
