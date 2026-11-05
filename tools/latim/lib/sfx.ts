// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting. Every sound has its picture.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import { K_BROOM, K_CRACK, K_HEN, K_PEBBLE, K_PUDDLE, K_RIDGE } from "./levels";

/** A turn of string while winding, a little higher each turn. */
export function windTick(wraps: number, power: number) { tone(900 + Math.min(14, wraps) * 55 + power * 300, 0.025, 0.05, "square"); }
/** The string pays out and the top leaves the hand: the signature zip. */
export function zip(power: number) { hiss(0.22, 0.12, 2200, "bandpass"); tone(500 + 500 * power, 0.14, 0.09, "sawtooth", 0, 140); tone(130, 0.12, 0.18, "sine", 0.18, 60); }
/** The top hits the ground: a wooden clack and a short rattle. */
export function clack() { tone(1250, 0.04, 0.16, "square", 0, 500); hiss(0.06, 0.12, 2500, "highpass"); buzz(14); }
/** The fall: the clack, then the rattle as it rolls to a stop. */
export function rattle() {
  clack();
  const delays = [0.12, 0.22, 0.3, 0.36, 0.41, 0.45];
  for (let i = 0; i < delays.length; i++) tone(900 - i * 60, 0.025, 0.07 * (1 - i / 7), "square", delays[i]);
}

/** A good touch climbs the scale with the streak; a fair one is a plain tap; a miss is a dull knock. */
export function good(combo: number) { sfx.combo(Math.min(9, Math.max(0, combo - 1))); if (combo > 0 && combo % 5 === 0) buzz(12); }
export function fair() { sfx.tap(); }
export function bad() { tone(180, 0.1, 0.1, "square", 0, 120); }

/** What landed on the top: a tick for a leaf or pebble, a clatter for hens, a tonk for a ridge, a crack, a whoosh, a wet slap. */
export function knock(kind: number, braced: boolean) {
  const v = braced ? 0.5 : 1;
  if (kind === K_RIDGE) tone(420, 0.05, 0.06 * v, "square", 0, 300);
  else if (kind === K_PEBBLE) { tone(700, 0.04, 0.1 * v, "triangle", 0, 300); tone(1100, 0.03, 0.05 * v, "square"); }
  else if (kind === K_HEN) { tone(520, 0.05, 0.08 * v, "square", 0, 700); hiss(0.05, 0.06 * v, 1800, "bandpass"); }
  else if (kind === K_CRACK) { tone(240, 0.06, 0.14 * v, "square", 0, 90); hiss(0.05, 0.1 * v, 3000, "highpass"); buzz(braced ? 8 : 16); }
  else if (kind === K_BROOM) { hiss(0.2, 0.14 * v, 1500, "bandpass"); tone(150, 0.1, 0.16 * v, "sine", 0, 70); buzz(braced ? 8 : 18); }
  else if (kind === K_PUDDLE) { hiss(0.2, 0.1 * v, 900); tone(200, 0.1, 0.06, "sine", 0, 110); }
  else tone(1600, 0.03, 0.05 * v, "triangle");
}

/** The lift: a soft chime as the palm rises. */
export function liftUp() { tone(660, 0.07, 0.09, "triangle", 0, 880); tone(988, 0.12, 0.07, "triangle", 0.1); }
/** Lifting becomes possible: a tiny two-note nudge. */
export function liftOpen() { tone(784, 0.08, 0.06, "triangle"); tone(1047, 0.1, 0.06, "triangle", 0.07); }

/** The courtyard's four-note tune at the throw. */
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
 * The hum of the top: deeper and softer as it slows, with a flutter as it wobbles. `set(omega, wobble, phase)` retunes it.
 * A fresh one each time it should sound, so one made while muted (a silent stub) is never kept.
 */
export function humLoop() {
  const hum = loop("hum", 260);
  return {
    set(omega: number, wobble: number, sway: number) {
      const spin = omega > 0 ? omega : 0;
      hum.set(0.25 + 0.75 * spin);
      hum.pitch(60 + 200 * spin + 12 * wobble * Math.sin(sway * 2));
    },
    stop: hum.stop,
  };
}
/** The wind over the chaal: louder and thinner the harder it pushes. */
export function windLoop() {
  const wind = loop("wind", 500);
  return {
    set(push: number) { wind.set(0.06 + push * 0.4); wind.pitch(380 + push * 700); },
    stop: wind.stop,
  };
}
