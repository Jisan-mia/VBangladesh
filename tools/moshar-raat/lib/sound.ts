// The night's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/**
 * The signature sound: the পিন-পিন of the mosquito nearest the pillow. `set(near)` takes 0 (none, or far away)
 * to 1 (right at the pillow): it gets louder and thinner as one closes in. Stop it on pause, game over and unmount.
 */
export function whine() {
  const hum = loop("whine", 470);
  return {
    set(near: number, flutter: number) {
      hum.set(near <= 0 ? 0 : 0.1 + near * 0.75);
      hum.pitch(430 + near * 200 + flutter * 14);
    },
    stop: hum.stop,
  };
}

/** The bat's mesh: a sharp crackle, a tick for each mosquito it caught. */
export function crackle(hits: number) {
  hiss(0.12, 0.2, 4200, "highpass");
  for (let i = 0; i < Math.min(5, 2 + hits); i++) tone(2400 + i * 520, 0.025, 0.05, "square", 0.012 + i * 0.03);
  buzz(14);
}

/** A swing through empty air. */
export const swish = () => hiss(0.13, 0.07, 1500, "bandpass");

/** A bite: the sleeper's soft "উঁহু", never a scream. */
export function bite() {
  tone(300, 0.2, 0.07, "triangle", 0, 220);
  buzz([20, 30, 20]);
}

/** The light switch going off at the start of a night. */
export function lightSwitch() {
  tone(1800, 0.02, 0.08, "square");
  tone(900, 0.03, 0.05, "square", 0.03);
}
