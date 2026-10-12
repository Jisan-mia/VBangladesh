// The switchboard's own sounds, built from the shared kit's blocks (which stay silent when sound is off or audio is missing).
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** The signature টক্‌: a hard click and a short wooden knock. */
export function tok() {
  tone(2300, 0.012, 0.07, "square");
  tone(260, 0.05, 0.12, "triangle", 0.003, 160);
  buzz(6);
}

/** Every bulb lit: a ceiling fan spinning up under a warm chord. */
export function fanChord() {
  hiss(0.9, 0.05, 420);
  tone(70, 0.9, 0.07, "triangle", 0, 150);
  [392, 494, 587, 784].forEach((frequency, index) => tone(frequency, 0.6, 0.06, "triangle", 0.12 + index * 0.06));
}
