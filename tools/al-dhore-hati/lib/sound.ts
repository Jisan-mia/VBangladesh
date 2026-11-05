// The field's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** A bare foot on a grassy ridge: a soft low pat, the two feet a little different. Its rhythm follows the walking speed. */
export function footstep(foot: 0 | 1) {
  tone(foot ? 128 : 112, 0.06, 0.07, "sine", 0, 70);
  hiss(0.045, 0.03, foot ? 900 : 760, "lowpass");
}

/** The signature: a foot sinking into wet mud, a wet ছপ and a little suck as it comes out. */
export function squelch() {
  hiss(0.22, 0.22, 520, "lowpass");
  tone(240, 0.16, 0.09, "sine", 0, 80);
  tone(170, 0.12, 0.05, "triangle", 0.2, 320);
  hiss(0.08, 0.06, 1400, "bandpass", 0.22);
  buzz(28);
}

/** A goat's "ব্যা-অ্যা": a reedy note that wavers, made of short steps. */
export function bleat() {
  const notes = [560, 610, 545, 600, 530, 585, 515];
  notes.forEach((frequency, index) => tone(frequency, 0.09, 0.045, "sawtooth", index * 0.065));
  tone(1100, 0.4, 0.012, "square", 0.02, 1000);
}

/** Egrets lifting off: two quick high chirps and a soft wingbeat. */
export function birds() {
  tone(2600, 0.06, 0.035, "sine", 0, 3300);
  tone(2900, 0.05, 0.03, "sine", 0.1, 3600);
  hiss(0.12, 0.03, 1800, "bandpass", 0.02);
}

/** Stepping back up onto the ridge: a light pat and a breath. */
export function stepUp() {
  tone(150, 0.07, 0.08, "sine", 0, 95);
  hiss(0.1, 0.025, 1200, "lowpass", 0.05);
}

/**
 * Wind across the paddy on the windy fields: louder and thinner the harder it pushes.
 * `set(push)` takes 0..1; `stop()` ends it.
 */
export function windLoop() {
  const wind = loop("wind", 500);
  return {
    set(push: number) { wind.set(0.1 + push * 0.5); wind.pitch(360 + push * 800); },
    stop: wind.stop,
  };
}

/** The ridge creaks when the feet pass four fifths of its width. You see the edge glow and the walker flap. */
export function creak() {
  tone(98, 0.3, 0.06, "sawtooth", 0, 70);
  tone(160, 0.14, 0.035, "square", 0.1, 120);
}

/** A gust hits: a short rush of air. You see the arrow and the streaks. */
export function gust() {
  hiss(0.45, 0.14, 1500, "bandpass");
  hiss(0.3, 0.08, 700, "lowpass", 0.1);
}

/** Each world opens with a four-note motif at its own pitch (scheduled tones, so the pause cuts them). */
const MOTIF = [392, 523, 494, 659];
export function motif(pitch: number) {
  MOTIF.forEach((note, at) => tone(note * pitch, 0.14, 0.06, "triangle", 0.1 + at * 0.13));
}
