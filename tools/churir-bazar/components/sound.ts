// The stall's sounds, all from shared/game-sound (no audio files). Every note of a move is scheduled on the audio clock with
// tone(…, delay), so the player's pause and the next level (silenceScheduled) cut them mid-phrase, and each lines up with the
// pop it belongs to. The shake's rattle is the only loop.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19];

export const sound = {
  /** You pick up a bangle: a small glass tick. */
  pick: () => tone(1500, 0.04, 0.05, "sine"),
  /** The swap itself, heard at once. */
  swap: () => { tone(900, 0.05, 0.06, "triangle"); hiss(0.04, 0.03, 3000, "bandpass"); },
  /** A swap that makes no line: a dull wooden knock. */
  wrong: () => { tone(170, 0.14, 0.1, "sine", 0, 110); tone(130, 0.1, 0.06, "triangle", 0.05); buzz([20, 30, 20]); },
  /** A glass clink with a low thock under it so a lift has weight, a step higher with each step of a cascade. */
  clink: (step: number, many: number, delay: number) => {
    const f = 1180 * 2 ** (PENTA[Math.max(0, Math.min(PENTA.length - 1, step))] / 12);
    tone(f, 0.24, 0.07, "sine", delay); tone(f * 2.76, 0.13, 0.025, "sine", delay + 0.004); tone(f * 4.07, 0.07, 0.012, "sine", delay + 0.008);
    tone(150, 0.1, 0.07 + Math.min(0.06, many * 0.006), "sine", delay, 90);
  },
  /** The glass breaking: a bright rush and two falling bits. */
  shatter: (many: number, delay: number) => {
    hiss(0.14 + Math.min(0.1, many * 0.01), 0.05, 6500, "highpass", delay);
    tone(3300, 0.05, 0.02, "sine", delay + 0.02, 2400); tone(2700, 0.05, 0.02, "sine", delay + 0.05, 2000);
  },
  /** A ঝিকমিক bangle forms: four bright notes. */
  shimmer: (delay: number) => { [1568, 2093, 2637, 3136].forEach((f, i) => tone(f, 0.12, 0.04, "triangle", delay + i * 0.035)); buzz(10); },
  /** A রংধনু forms: a sweep up. */
  sweep: (delay: number) => { [523, 659, 784, 988, 1175, 1568, 2093].forEach((f, i) => tone(f, 0.14, 0.045, "triangle", delay + i * 0.03)); buzz(16); },
  /** A ঝিকমিক goes off: a whoosh along its lanes. */
  blast: (delay: number) => { hiss(0.28, 0.1, 1500, "bandpass", delay); tone(220, 0.16, 0.08, "sine", delay, 90); buzz(18); },
  /** A তালা falls on a bangle: a clack and a chain. */
  lock: (delay: number) => { tone(330, 0.05, 0.1, "square", delay); tone(200, 0.08, 0.09, "square", delay + 0.04); hiss(0.12, 0.05, 2600, "bandpass", delay + 0.06); buzz([15, 20, 15]); },
  /** A tied bangle is freed: the lock opens and the chain drops. */
  free: (delay: number) => { tone(520, 0.05, 0.09, "square", delay); tone(780, 0.1, 0.08, "triangle", delay + 0.06); hiss(0.14, 0.06, 2200, "bandpass", delay + 0.08); },
  /** Dust wiped off the velvet: a soft brush. */
  dust: (delay: number) => hiss(0.1, 0.05, 900, "lowpass", delay),
  /** Moves running low: one thin tick. */
  warn: () => tone(1900, 0.04, 0.05, "square"),
  /** The signature: a wrist of glass bangles shaken, রিনিঝিনি. */
  jingle: (delay = 0) => [2093, 2637, 2349, 3136, 2794, 3520].forEach((f, i) => { tone(f, 0.16, 0.034, "sine", delay + i * 0.05); tone(f * 2.4, 0.08, 0.012, "sine", delay + i * 0.05 + 0.003); }),
  /** A level cleared: the মেলা's three notes, a fourth an octave up for three stars or a finale. */
  call: (notes: readonly number[], big: boolean, delay = 0) => {
    notes.forEach((f, i) => tone(f, 0.16, 0.09, "triangle", delay + i * 0.1));
    if (big) tone(notes[0] * 2, 0.4, 0.08, "triangle", delay + notes.length * 0.1);
  },
  /** A star landing on the end screen. */
  star: (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay),
  /** Out of moves: three falling notes. */
  lose: (delay = 0) => { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.1, "triangle", delay + i * 0.14)); buzz(40); },
  /** The tray shaking when no swap is left. */
  rattle: () => { const live = loop("static", 3600); live.set(0.3); return live; },
  /** A choice picked. */
  chosen: () => { tone(988, 0.09, 0.08, "triangle"); tone(1319, 0.14, 0.07, "triangle", 0.07); },
};
