// The name book's own sounds, built from the shared kit (silent when sound is off or audio is missing). Every note is a
// scheduled tone(), so the player's pause cuts what is still ringing.
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** The signature, "চট": a paper pat as the sticker lands, then two rising marimba notes on the world's root. */
export function stick(root: number) {
  hiss(0.05, 0.12, 900, "lowpass");
  tone(root, 0.16, 0.1, "triangle", 0.04);
  tone(root * 1.5, 0.26, 0.08, "triangle", 0.12);
  buzz(10);
}

/** A wrong sticker wobbles: a soft low boing, never a buzzer. */
export function boing() {
  tone(220, 0.24, 0.09, "triangle", 0, 150);
  tone(330, 0.16, 0.04, "sine", 0.06, 220);
}

/** The next card slides in: a paper swish. */
export const swish = () => hiss(0.16, 0.06, 2600, "bandpass");

/** A world's page is full (a finale): four notes up from the world's root, then a soft high bell. */
export function worldTune(root: number) {
  [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(root * ratio, 0.22, 0.09, "triangle", 0.1 + index * 0.13));
  tone(root * 3, 0.5, 0.04, "sine", 0.66);
}
