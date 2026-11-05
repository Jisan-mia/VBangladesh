// The গলি's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** The signature: strings on the cork. A gold hit rings higher and a touch longer. */
export function ping(gold = false) {
  tone(gold ? 2090 : 1620, gold ? 0.12 : 0.08, 0.1, "triangle", 0, gold ? 1800 : 1420);
  tone(gold ? 4180 : 3240, 0.035, 0.035, "square");
  hiss(0.03, 0.08, 5200, "highpass");
  buzz(gold ? 14 : 8);
}

/** A smash: a crack, then the ping on top. */
export function crack(gold = false) {
  hiss(0.06, 0.22, 2600, "bandpass");
  tone(gold ? 2350 : 1900, 0.09, 0.09, "triangle", 0.01, 1500);
  tone(140, 0.08, 0.12, "sine", 0, 80);
  buzz(gold ? 22 : 14);
}

/** A drop: a soft টুক. */
export function tick() {
  tone(980, 0.05, 0.07, "triangle", 0, 760);
  hiss(0.02, 0.04, 3000, "bandpass");
}

/** The rival's racket, further away: softer and lower. */
export function farPing(hard = false) {
  if (hard) hiss(0.05, 0.12, 2200, "bandpass");
  tone(hard ? 1380 : 1240, 0.07, 0.05, "triangle", 0, 1100);
  hiss(0.025, 0.04, 4200, "highpass");
}

/** Feathers through the air, a beat after the hit: faster is brighter. */
export function swish(fast = false) {
  hiss(fast ? 0.16 : 0.26, fast ? 0.09 : 0.06, fast ? 3600 : 2600, "bandpass", 0.03);
}

/** An empty swing: just air. */
export function air() { hiss(0.14, 0.07, 1500, "bandpass"); }

/** The shuttle into the net: a dull flap. */
export function netFlap() {
  hiss(0.12, 0.12, 600, "lowpass");
  tone(180, 0.1, 0.06, "sine", 0, 120);
  buzz(20);
}

/** Your point: a quick clap from the window. */
export function clap() {
  hiss(0.04, 0.1, 1800, "bandpass");
  hiss(0.04, 0.08, 1800, "bandpass", 0.09);
  tone(880, 0.08, 0.05, "triangle", 0.02);
}

/** Their point: a neighbour at the window, a soft falling "আ–হা". */
export function sigh() {
  tone(330, 0.2, 0.05, "triangle", 0, 300);
  tone(310, 0.5, 0.055, "triangle", 0.2, 205);
  hiss(0.45, 0.03, 700, "lowpass", 0.18);
}

/** A gust coming: a rising whoosh. */
export function whoosh() { hiss(0.6, 0.07, 900, "bandpass"); hiss(0.4, 0.05, 1600, "bandpass", 0.2); }

/** The finale's bar is full: two low notes. */
export function warn() { tone(196, 0.16, 0.08, "square", 0, 185); tone(147, 0.24, 0.08, "square", 0.17, 140); }

/** The পাড়া's four-note tune at the first serve. */
const TUNES = [[659, 784, 880, 784], [587, 740, 880, 988], [523, 622, 784, 698]] as const;
export function tune(world: number) {
  const notes = TUNES[Math.max(0, Math.min(2, world))];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.16, 0.07, "triangle", i * 0.13);
}

/** The win: the tune again, up an octave, and a chime per star. */
export function victory(world: number, stars: number) {
  const notes = TUNES[Math.max(0, Math.min(2, world))];
  for (let i = 0; i < notes.length; i++) tone(notes[i] * 2, 0.18, 0.07, "triangle", i * 0.1);
  for (let star = 0; star < stars; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.55 + star * 0.28);
  buzz([20, 40, 20]);
}

/**
 * The wind on the rooftops: louder and thinner the harder it pushes. `set(push)` takes 0..1; `stop()` ends it.
 * A fresh one each time it should sound, so one made while muted (a silent stub) is never kept.
 */
export function windLoop() {
  const wind = loop("wind", 500);
  return {
    set(push: number) { wind.set(0.1 + push * 0.5); wind.pitch(380 + push * 900); },
    stop: wind.stop,
  };
}
