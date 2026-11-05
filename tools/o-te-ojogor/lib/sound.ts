// The tree's own sounds, built from the shared kit (silent when sound is off or audio is missing).
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** The signature: a soft two-note chime when the picture word shows, like a small brass bell. */
export function chime(delay = 0.1) {
  tone(1319, 0.5, 0.06, "sine", delay);
  tone(1976, 0.6, 0.035, "sine", delay + 0.07);
}

/** The basket rocking after a wrong letter: a springy boing, never a buzzer. */
export function boing() {
  tone(170, 0.28, 0.11, "triangle", 0, 340);
  tone(340, 0.22, 0.05, "sine", 0.08, 190);
  buzz(18);
}

/** The right fruit missed: it drops on the grass with a soft টুপ, and will come back. */
export const thump = () => tone(240, 0.14, 0.08, "sine", 0, 120);

/** A fruit leaves its branch: a soft rustle of leaves. */
export const rustle = () => { hiss(0.16, 0.07, 3200, "bandpass"); hiss(0.1, 0.05, 2000, "bandpass", 0.06); };
