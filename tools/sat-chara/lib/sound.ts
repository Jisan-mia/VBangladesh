// The গলি's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";

/** The signature: clay pieces clattering, a dry খট. `n` shifts the pitch so a falling pile doesn't sound like one click. */
export function clatter(n: number) {
  tone(1500 + (n % 5) * 170, 0.03, 0.06, "square");
  hiss(0.045, 0.07, 3400 + (n % 3) * 500, "bandpass");
}

/** The ball meeting a stone: a dull rubber thwack. */
export function thwack() {
  tone(190, 0.09, 0.2, "triangle", 0, 95);
  hiss(0.05, 0.12, 2200, "bandpass");
  buzz(12);
}

/** The ball bouncing on the ground. */
export const bounce = () => tone(115, 0.07, 0.08, "sine", 0, 70);

/** A miss: a dog barks twice, very soft and far away. */
export function farDog() {
  for (const delay of [0, 0.2]) {
    tone(560, 0.08, 0.03, "sawtooth", delay, 360);
    hiss(0.06, 0.02, 900, "bandpass", delay);
  }
}

/** The pull while aiming: a low hum that rises with the power (the ring round the ball shows the same). */
export function stretch() {
  const hum = loop("hum", 90);
  return {
    set(power: number) { hum.set(0.08 + power * 0.22); hum.pitch(90 + power * 170); },
    stop: hum.stop,
  };
}

export const release = () => sfx.whoosh();
