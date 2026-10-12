// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** One pentatonic note per pot, low to high (G A C D): the biggest pot sounds lowest. */
export const POT_HZ = [392, 440, 523, 587] as const;

/** The signature টুং: a round clay note that sags a little, an overtone, and the stick's knock. */
export function potNote(pot: number) {
  const frequency = POT_HZ[pot];
  if (!frequency) return;
  tone(frequency, 0.5, 0.15, "sine", 0, frequency * 0.985);
  tone(frequency * 2.02, 0.14, 0.04, "triangle");
  hiss(0.035, 0.05, 1800, "bandpass");
}

/** A level cleared: the fair's brass bell, two strikes. */
export function fairBell() {
  for (const delay of [0, 0.32]) {
    tone(1175, 1.1, 0.07, "sine", delay);
    tone(1175 * 2.4, 0.5, 0.025, "sine", delay);
    tone(1175 * 3.9, 0.25, 0.015, "sine", delay);
  }
  buzz([15, 30, 15]);
}
