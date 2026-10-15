// The tool's few soft sounds, synthesized: a washing tune of one note per beat, a brushing swish, germ pops.
import { hiss, tone } from "../../../shared/game-sound";

// C-major pentatonic, rising and falling, so any beat lands on a pleasant note.
const TUNE = [523, 659, 784, 659, 587, 784, 880, 784];

export const WASH_BEAT = 0.5;
export const BRUSH_BEAT = 0.6;

export const washBeat = (n: number) => tone(TUNE[n % TUNE.length], 0.16, n % 4 === 0 ? 0.06 : 0.04, "triangle");
export const brushStroke = (n: number) => hiss(0.12, 0.04, n % 2 ? 2000 : 2800, "bandpass");
export const germPop = () => { tone(520, 0.09, 0.06, "sine", 0, 1000); tone(640, 0.09, 0.05, "sine", 0.1, 1200); };
export const germBye = () => tone(600, 0.3, 0.05, "sine", 0, 1300);
export const softMiss = () => tone(330, 0.14, 0.06, "sine", 0, 262);
export const startChime = () => { tone(659, 0.1, 0.07, "triangle"); tone(988, 0.14, 0.06, "triangle", 0.08); };
