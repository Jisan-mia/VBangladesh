// The book's own sounds, built from the shared kit (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause cuts what is still ringing. Nothing here speaks.
import { buzz, hiss, tone } from "../../../shared/game-sound";

/** A page turns: a soft paper swish. */
export const swish = () => hiss(0.14, 0.05, 2400, "bandpass");

/** The signature, "মোড়": the story reaches its turn. A wooden signpost tick, then two bell notes that ask a question. */
export function turn(root: number) {
  tone(root * 0.5, 0.06, 0.1, "triangle");
  tone(root, 0.3, 0.08, "sine", 0.05);
  tone(root * 1.5, 0.45, 0.07, "sine", 0.17);
  buzz(10);
}

/** A path is picked: a soft low marimba note that settles. */
export function pick(root: number) {
  hiss(0.05, 0.08, 900, "lowpass");
  tone(root * 0.75, 0.18, 0.1, "triangle", 0.02, root * 0.7);
}

/** The story ends: three notes down that land on home, like a lullaby. */
export function theEnd(root: number) {
  [1.5, 1.25, 1].forEach((ratio, index) => tone(root * ratio, 0.34, 0.08, "sine", 0.05 + index * 0.2));
  buzz(10);
}

/** A shelf's lamp lights (all three stories read): four notes up and a high bell. */
export function lamp(root: number, delay = 0) {
  [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(root * ratio, 0.22, 0.09, "triangle", delay + 0.1 + index * 0.13));
  tone(root * 3, 0.5, 0.04, "sine", delay + 0.66);
}
