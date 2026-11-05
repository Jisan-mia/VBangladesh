// The kitchen's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** The signature: the doorbell, two soft notes. */
export function doorbell() { tone(988, 0.5, 0.1, "sine"); tone(784, 0.7, 0.1, "sine", 0.32); }
/** The gas catching. */
export function ignite() { hiss(0.28, 0.1, 3400, "bandpass"); tone(140, 0.05, 0.08, "square"); }
/** A bubble, higher and louder as the foam climbs (`pitch` is 0..1 from the caller). */
export function bubble(level: number, pitch: number) { const hz = 260 + pitch * 420; tone(hz, 0.06, 0.02 + 0.05 * level, "sine", 0, hz * 1.7); }
/** The pot set down on the counter. */
export const setDown = () => tone(190, 0.12, 0.16, "triangle", 0, 120);
/** Boiled over. */
export function sizzle() { hiss(1.1, 0.2, 2600, "highpass"); hiss(0.5, 0.14, 700, "lowpass", 0.05); tone(196, 0.18, 0.09, "square", 0, 147); buzz([30, 40, 30]); }
/** The warning tick near the rim; the edge glow says the same thing. */
export const alarm = () => tone(1500, 0.03, 0.05, "square");
/** The flame leaps: a ফোঁস. */
export function flare() { hiss(0.55, 0.13, 1800, "bandpass"); tone(120, 0.5, 0.05, "sawtooth", 0, 220); }
/** A big bubble bursts. */
export function pop() { tone(500, 0.09, 0.12, "sine", 0, 950); hiss(0.06, 0.07, 4200, "highpass"); }
/** The foam sinks back: a falling note and a puff. */
export function sink() { tone(620, 0.4, 0.06, "sine", 0, 260); hiss(0.3, 0.06, 1200, "lowpass"); }
/** The lid rattling. */
export function rattle() { tone(240, 0.04, 0.06, "square"); tone(310, 0.04, 0.05, "square", 0.07); }
/** The lights going: the fan winding down. */
export const powerDown = () => tone(180, 0.6, 0.06, "sawtooth", 0, 60);

/** A level cleared: the doorbell's run, then a three-note tune pitched for the kitchen. */
const TUNE = [659, 784, 988];
const WORLD_PITCH = [1, 9 / 8, 4 / 3];
export function cleared(world: number) {
  const pitch = WORLD_PITCH[Math.max(0, Math.min(2, world))];
  TUNE.forEach((note, i) => tone(note * pitch, 0.22, 0.09, "triangle", 0.1 + i * 0.13));
  buzz([20, 40, 20]);
}
/** A star popping in on the end screen, `delay` seconds from now. */
export const starChime = (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay);
/** Not cleared. */
export function lost() { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.1, "triangle", i * 0.14)); buzz(60); }

/** The stove's hum: a soft tone that swells with the foam (0 silent .. 1 at the rim). */
export function hum() {
  const voice = loop("hum", 92);
  return { set: (foam: number) => voice.set(0.12 + 0.88 * foam * foam), stop: voice.stop };
}
