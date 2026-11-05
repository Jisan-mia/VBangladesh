// The field's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** The flick: a light wooden tick as the কাঠি jumps off the hole. */
export function flick() { tone(620, 0.06, 0.12, "triangle", 0, 1100); hiss(0.03, 0.05, 3000, "bandpass"); }

/** The signature: ডাং on কাঠি, a wooden knock. Stronger is deeper and louder; gold rings with a high partial on top. */
export function knock(grade: number, power: number) {
  tone(150 + 220 * power, 0.14, 0.2, "square", 0, 70);
  tone(420 + 300 * power, 0.05, 0.08, "triangle", 0, 300);
  hiss(0.04, 0.12, 2400, "bandpass");
  if (grade === 2) { tone(1760, 0.18, 0.06, "triangle", 0.01, 1980); tone(2640, 0.12, 0.03, "sine", 0.02); }
  buzz(grade === 2 ? 22 : 12);
}

/** A swing that meets only air. */
export function air() { hiss(0.18, 0.1, 1400, "bandpass"); }

/** Landing: a thud on grass, a soft shff on sand, a skid on wet grass, a splash in the pond. */
export function land(zone: number) {
  if (zone === 3) { hiss(0.36, 0.22, 900); tone(240, 0.12, 0.05, "sine", 0.02, 120); return; }
  if (zone === 1) { hiss(0.2, 0.14, 700); return; }
  if (zone === 2) { hiss(0.28, 0.1, 1800, "bandpass"); tone(160, 0.08, 0.1, "sine", 0, 90); return; }
  tone(140, 0.12, 0.18, "sine", 0, 60); hiss(0.08, 0.06, 800);
}

/** The count: a tick at every 5 ডাং peg the কাঠি passes, a little higher each time. */
export function peg(n: number) { tone(1200 + Math.min(12, n / 5) * 70, 0.03, 0.04, "square"); }

/** The kids on the side: an "ওওও" for a big hit. */
export function cheer() {
  const notes = [196, 247, 294, 349];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.7, 0.035, "triangle", i * 0.02, notes[i] * 1.3);
  hiss(0.6, 0.04, 900);
}
/** A catch: the kids groan, the fielder's "হেই!" */
export function groan() { tone(330, 0.12, 0.08, "square", 0, 440); tone(260, 0.35, 0.05, "triangle", 0.1, 180); buzz([30, 40, 30]); }
/** A miss: a dull drop. */
export function drop() { tone(300, 0.1, 0.1, "sine", 0, 200); }

/** A gust coming: a rising whoosh. */
export function whoosh() { hiss(0.5, 0.07, 900, "bandpass"); hiss(0.35, 0.05, 1700, "bandpass", 0.18); }

/** Passing the neighbour's score. */
export function pass() { const notes = [784, 988, 1175]; for (let i = 0; i < notes.length; i++) tone(notes[i], 0.14, 0.08, "triangle", i * 0.06); buzz([15, 30, 15]); }

/** The মাঠ's four-note tune at the first flick of a round. */
const TUNES = [[523, 659, 784, 659], [440, 587, 659, 523], [392, 466, 587, 523]] as const;
export function tune(world: number) {
  const notes = TUNES[Math.max(0, Math.min(2, world))];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.16, 0.07, "triangle", i * 0.13);
}

/** The win: the tune an octave up, then a chime per star (scheduled, so a pause cuts the tail). */
export function victory(world: number, stars: number) {
  const notes = TUNES[Math.max(0, Math.min(2, world))];
  for (let i = 0; i < notes.length; i++) tone(notes[i] * 2, 0.18, 0.07, "triangle", i * 0.1);
  for (let star = 0; star < stars; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.55 + star * 0.28);
  buzz([20, 40, 20]);
}
export function lose() { const notes = [392, 330, 262]; for (let i = 0; i < notes.length; i++) tone(notes[i], 0.24, 0.1, "triangle", i * 0.14); }

/**
 * The wind over the চর: louder and thinner the harder it pushes. `set(push)` takes 0..1; `stop()` ends it.
 * A fresh one each time it should sound, so one made while muted (a silent stub) is never kept.
 */
export function windLoop() {
  const wind = loop("wind", 500);
  return {
    set(push: number) { wind.set(0.08 + push * 0.45); wind.pitch(380 + push * 800); },
    stop: wind.stop,
  };
}
