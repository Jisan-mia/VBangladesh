// The picture book's own sounds, built from the shared kit (silent when sound is off or audio is missing). Every note is a
// scheduled tone(), so the player's pause cuts what is still ringing. No loops, no music.
import { buzz, hiss, tone } from "../../../shared/game-sound";
import type { Feeling } from "./faces";

/** One root note per feeling, so the colour that fills is also a pitch. */
const ROOT: Record<Feeling, number> = { khushi: 784, "mon-kharap": 494, rag: 440, bhoy: 523, obak: 880, lojja: 659 };

/** The signature, "রং ভরা": a soft paint swish, then two rising marimba notes on the feeling's root. */
export function fill(feeling: Feeling) {
  hiss(0.18, 0.07, 1400, "bandpass");
  tone(ROOT[feeling], 0.18, 0.1, "triangle", 0.03);
  tone(ROOT[feeling] * 1.5, 0.28, 0.08, "triangle", 0.13);
  buzz(10);
}

/** A face that doesn't fit wobbles: a soft low boing, never a buzzer. */
export function boing() {
  tone(220, 0.24, 0.09, "triangle", 0, 150);
  tone(330, 0.16, 0.04, "sine", 0.06, 220);
}

/** A kind thing is chosen: a warm two-note answer. */
export function warm(choice: number) {
  tone(choice ? 659 : 587, 0.16, 0.09, "triangle");
  tone(choice ? 988 : 880, 0.26, 0.07, "triangle", 0.1);
  buzz(8);
}

/** The next picture slides in: a paper swish. */
export const swish = () => hiss(0.16, 0.06, 2600, "bandpass");

/** A world's last picture is done (a finale): four notes up from the world's root, then a soft high bell. */
export function worldTune(root: number) {
  [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(root * ratio, 0.22, 0.09, "triangle", 0.1 + index * 0.13));
  tone(root * 3, 0.5, 0.04, "sine", 0.66);
}
