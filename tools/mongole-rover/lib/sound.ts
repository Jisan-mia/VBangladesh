// The rover's few soft sounds, synthesized: a motor hum per step, a chime for a sample, a soft bump, a start chirp.
import { tone } from "../../../shared/game-sound";

export const motor = (n: number) => tone(n % 2 ? 196 : 220, 0.09, 0.05, "triangle", 0, n % 2 ? 233 : 262);
export const gotSample = () => { tone(1047, 0.1, 0.06, "triangle"); tone(1568, 0.18, 0.05, "triangle", 0.08); };
export const bump = () => tone(180, 0.16, 0.07, "sine", 0, 120);
export const startChirp = () => { tone(659, 0.08, 0.06, "triangle"); tone(880, 0.12, 0.05, "triangle", 0.07); };
