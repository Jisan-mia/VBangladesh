// The গলি's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** Strings on the shuttle: a bright, short ping. A smash rings higher and a touch longer. The signature sound. */
export function racketPing(strong = false) {
  tone(strong ? 1960 : 1560, strong ? 0.11 : 0.08, 0.1, "triangle", 0, strong ? 1700 : 1380);
  tone(strong ? 3900 : 3100, 0.035, 0.035, "square");
  hiss(0.03, 0.08, 5200, "highpass");
  buzz(strong ? 14 : 8);
}

/** The opponent's racket, further away: the same ping, softer and lower. */
export function farPing() {
  tone(1240, 0.07, 0.05, "triangle", 0, 1100);
  hiss(0.025, 0.04, 4200, "highpass");
}

/** Feathers through the air, a beat after the hit. */
export function swish(fast = false) {
  hiss(fast ? 0.16 : 0.26, fast ? 0.09 : 0.06, fast ? 3600 : 2600, "bandpass", 0.03);
}

/** An empty swing: just air. */
export function airSwing() {
  hiss(0.14, 0.07, 1500, "bandpass");
}

/** A neighbour at the window on a miss: a soft, falling "আ–হা". */
export function sigh() {
  tone(330, 0.2, 0.05, "triangle", 0, 300);
  tone(310, 0.5, 0.055, "triangle", 0.2, 205);
  hiss(0.45, 0.03, 700, "lowpass", 0.18);
}

/** The shuttle into the net: a dull flap. */
export function netFlap() {
  hiss(0.12, 0.12, 600, "lowpass");
  tone(180, 0.1, 0.06, "sine", 0, 120);
  buzz(20);
}

/**
 * Wind on a windy night, while the shuttle flies to you: louder and thinner the harder it pushes.
 * `set(push)` takes 0..1; `stop()` ends it.
 */
export function windLoop() {
  const wind = loop("wind", 500);
  return {
    set(push: number) { wind.set(0.12 + push * 0.55); wind.pitch(380 + push * 900); },
    stop: wind.stop,
  };
}
