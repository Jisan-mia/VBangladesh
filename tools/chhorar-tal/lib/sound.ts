// The ঢোল, synthesized: a soft low thump for the steady beat, a brighter "ধিন" when the child's tap lands on it, and a quiet tap when it doesn't.
import { hiss, tone } from "../../../shared/game-sound";

export const beatThump = (strong: boolean) => { tone(strong ? 120 : 105, 0.22, strong ? 0.16 : 0.11, "sine", 0, 55); hiss(0.05, 0.04, 500); };
export const tapOnBeat = () => { tone(190, 0.2, 0.18, "sine", 0, 90); tone(420, 0.08, 0.05, "triangle"); };
export const tapOffBeat = () => tone(170, 0.1, 0.07, "sine", 0, 120);
export const softMiss = () => tone(330, 0.14, 0.06, "sine", 0, 262);
