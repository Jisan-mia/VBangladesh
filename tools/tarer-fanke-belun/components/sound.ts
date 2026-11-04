// The street's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s
// delay, so the player's pause (silenceScheduled) cuts it. Each has a visible twin, named beside it.
import { buzz, hiss, sfx, tone } from "../../../shared/game-kit";

/** A world's four-note motif at a level start, pitched per পাড়া. */
const MOTIF = [523, 659, 784, 1047];
const WORLD_PITCH = [1, 0.89, 0.75];

export const sound = {
  /** A breath of air on each press (the squash and the puff under the knot). */
  breath: () => hiss(0.07, 0.05, 1500, "bandpass"),
  /** Rubber on a wire (the shivering wire, the sparks, the ঘষা count). */
  squeak: () => { tone(880, 0.1, 0.07, "sawtooth", 0, 1320); tone(1320, 0.06, 0.04, "triangle", 0.08, 990); buzz(10); },
  /** ফটাস (the burst, the shake). */
  pop: () => { hiss(0.16, 0.3, 2600, "highpass"); tone(230, 0.08, 0.12, "square", 0, 90); buzz(40); },
  /** কা-কা: a crow is coming (the edge pointer). The big one is lower and longer. */
  caw: (boss: boolean) => {
    const base = boss ? 420 : 640;
    tone(base, 0.13, 0.06, "sawtooth", 0, base * 0.76); tone(base * 0.95, boss ? 0.2 : 0.14, 0.06, "sawtooth", 0.17, base * 0.7);
  },
  /** A crow you missed flaps off (it flies past). */
  flap: () => { hiss(0.08, 0.05, 900, "bandpass"); hiss(0.08, 0.04, 900, "bandpass", 0.1); },
  /** A gust is coming (the edge chevrons). */
  gust: (boss: boolean) => { sfx.whoosh(); if (boss) tone(80, 0.6, 0.1, "sine", 0, 55); },
  /** A crossing passed: a note that climbs with the clean streak (the HUD dot fills). */
  pass: (streak: number) => { if (streak > 0) sfx.combo(Math.min(9, streak - 1)); else sfx.tick(); },
  /** A tangle's knot, a big crow's swoop or a storm's blast survived (the bar loses a notch). */
  notch: () => { tone(523, 0.1, 0.08, "triangle"); tone(784, 0.18, 0.08, "triangle", 0.08); },
  /** A fresh balloon off the seller's stick. */
  fresh: () => { tone(660, 0.08, 0.06, "triangle"); tone(880, 0.12, 0.06, "triangle", 0.09); },
  /** The signature: the বেলুনওয়ালা's squeaky three-note twist. */
  seller: (delay = 0) => {
    tone(700, 0.07, 0.05, "sawtooth", delay, 900); tone(820, 0.07, 0.05, "sawtooth", delay + 0.1, 1050); tone(980, 0.16, 0.05, "sawtooth", delay + 0.2, 1400);
  },
  motif: (world: number) => MOTIF.forEach((note, at) => tone(note * WORLD_PITCH[world], 0.14, 0.07, "triangle", 0.05 + at * 0.12)),
  /** The end: the stars' chimes and a fanfare on three stars or a record, or a falling three on a loss. */
  stars: (count: number, party: boolean) => {
    for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
    if (party) [784, 988, 1175, 1568].forEach((note, at) => tone(note, 0.16, 0.08, "triangle", 1.2 + at * 0.06));
  },
  lose: () => [392, 330, 262].forEach((note, at) => tone(note, 0.24, 0.08, "triangle", 0.2 + at * 0.14)),
};
