// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** The signature: a cardboard piece clicking into its place, a dull thock with a papery edge. In a row, a little note climbs on top. */
export function snap(streak: number) {
  hiss(0.05, 0.22, 1100, "lowpass");
  tone(190, 0.08, 0.18, "sine", 0, 95);
  tone(1500, 0.025, 0.035, "square", 0.01);
  if (streak >= 2) sfx.combo(streak - 2);
  buzz(10);
}

/** A wrong drop: the piece slides back over the table, soft and low. */
export function slide() {
  hiss(0.26, 0.09, 650, "lowpass");
  tone(240, 0.16, 0.04, "sine", 0, 180);
  buzz(20);
}

/** A quarter turn: a small dry click. */
export function turn() {
  tone(900, 0.03, 0.05, "triangle");
  hiss(0.03, 0.06, 2600, "bandpass");
}

/** Picking a piece up from the tray. */
export const lift = () => sfx.pick();

/** The last piece in. */
export const finished = () => sfx.win();
