// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Anything that
// lands later is scheduled on the audio clock (tone's delay), so the player's pause cuts it. Each has a visible twin.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

const RUN = [523, 587, 659, 784, 880, 1047, 1175, 1319];

/** The signature: the needle goes in and the thread is pulled through, a short rising swish. `step` climbs along a drag. */
export function stitch(step = 0) {
  hiss(0.07, 0.07, 2600 + Math.min(7, step) * 140, "bandpass");
  tone(900 + Math.min(7, step) * 70, 0.03, 0.03, "triangle", 0.02, 1300 + Math.min(7, step) * 80);
  buzz(5);
}

/** A ✕: a small dry tick. */
export const crossed = () => sfx.tick();

/** A refused stitch: the thread snaps, a low pluck with a short fall. */
export function snap() {
  tone(220, 0.14, 0.1, "sawtooth", 0, 90);
  hiss(0.05, 0.08, 3200, "highpass");
  buzz([25, 35, 25]);
}

/** A row or column just matched its clue; the pitch climbs with each one in a row. */
export const lineDone = (streak: number) => sfx.combo(streak);

/** A hint: a small glint. */
export function glint() {
  tone(1568, 0.08, 0.06, "triangle");
  tone(2093, 0.16, 0.05, "sine", 0.06);
}

/** The picture blooms corner to corner, a run of notes following the ripple; a finale adds its world's 4-note motif. */
export function bloom(size: number, world: number, finale: boolean) {
  RUN.slice(0, Math.min(8, size)).forEach((frequency, step) => tone(frequency, 0.2, 0.1, "triangle", step * 0.07));
  if (!finale) return;
  const motif = [[523, 659, 784, 1047], [587, 740, 880, 1175], [440, 554, 659, 880]][world] ?? [523, 659, 784, 1047];
  motif.forEach((f, i) => { tone(f, 0.3, 0.1, "triangle", 0.7 + i * 0.15); tone(f / 2, 0.34, 0.05, "sine", 0.7 + i * 0.15); });
  buzz([20, 40, 20, 40, 30]);
}

/** The signature of the old build, kept for the card preview path and old tests. */
export function reveal(size: number) { bloom(size, 0, false); }
