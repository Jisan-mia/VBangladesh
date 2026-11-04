// The garden's sounds, all from shared/game-sound (no audio files). Long ones are scheduled on the audio clock with
// tone(…, delay), so the player's pause and ফেরত নাও (silenceScheduled) cut them mid-phrase. The wind is the only loop.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

export const sound = {
  /** Leaves brushing past: every swipe that moves something. */
  rustle: () => hiss(0.09, 0.05, 2800, "bandpass"),
  /** A soft thump when a swipe moves nothing. */
  thump: () => { tone(150, 0.09, 0.07, "sine", 0, 110); buzz(10); },
  /** A wooden টুক for a merge, a step higher with each swipe in a row that merges. */
  merge: (step: number, delay = 0) => {
    const f = 392 * 2 ** (PENTA[Math.max(0, Math.min(PENTA.length - 1, step))] / 12);
    tone(f, 0.08, 0.1, "triangle", delay); tone(f * 2, 0.05, 0.03, "sine", delay + 0.01); hiss(0.025, 0.04, 1800, "bandpass", delay);
  },
  /** The signature: a rising chord when a new stage grows, higher for each stage. */
  grow: (stage: number, delay = 0.12) => { [0, 4, 7, 12].forEach((semi, i) => tone(330 * 2 ** ((semi + stage * 2) / 12), 0.26, 0.08, "triangle", delay + i * 0.07)); buzz(14); },
  /** Two weeds pulled out: a little pop of soil. */
  pull: () => { tone(260, 0.06, 0.08, "sine", 0, 520); hiss(0.08, 0.06, 900, "lowpass", 0.02); },
  /** Rain: a patter and three bright drops. */
  rain: () => { hiss(0.5, 0.06, 5200, "highpass"); [1568, 1319, 1760].forEach((f, i) => tone(f, 0.05, 0.04, "sine", 0.08 + i * 0.11)); },
  /** Hail on a plate: icy clinks. */
  hail: () => { [2637, 2349, 2794].forEach((f, i) => tone(f, 0.03, 0.05, "square", i * 0.05)); buzz(18); },
  /** The crow's কা. */
  caw: () => { tone(620, 0.12, 0.06, "sawtooth", 0, 430); tone(600, 0.14, 0.05, "sawtooth", 0.18, 400); },
  /** A gust: a rush of air. */
  gust: () => hiss(0.4, 0.14, 1600, "bandpass"),
  /** A warning one move before hail or a gust. */
  warn: () => tone(1900, 0.03, 0.04, "square"),
  /** ফেরত নাও. */
  back: () => tone(330, 0.09, 0.1, "sine", 0, 220),
  /** A pick from মালির থলে. */
  pick: () => { tone(988, 0.09, 0.08, "triangle"); tone(1319, 0.14, 0.07, "triangle", 0.07); },
  /** A level cleared: the season's three notes, a fourth an octave up for three stars or a finale. */
  call: (notes: readonly number[], big: boolean, delay = 0) => {
    notes.forEach((f, i) => tone(f, 0.16, 0.09, "triangle", delay + i * 0.1));
    if (big) tone(notes[0] * 2, 0.4, 0.08, "triangle", delay + notes.length * 0.1);
  },
  /** A star landing on the end screen. */
  star: (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay),
  /** Out of room or moves: three falling notes. */
  lose: (delay = 0) => { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.1, "triangle", delay + i * 0.14)); buzz(40); },
  /** The wind through a gust level. */
  wind: () => { const live = loop("wind"); live.set(0.18); return live; },
};
