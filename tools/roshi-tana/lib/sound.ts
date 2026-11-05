// The sports-day field's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
// Every note is a scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/**
 * The signature: a ঢোল stroke. `delay` (seconds) lands it right on the beat. Strong beats are deeper, a বড় ঢোল deeper still
 * with a long boom; count-in beats are a dry tap on the rim.
 */
export function drum(kind: "strong" | "weak" | "big" | "count", delay = 0) {
  if (kind === "count") { tone(420, 0.07, 0.1, "triangle", delay, 300); hiss(0.03, 0.08, 2500, "bandpass", delay); return; }
  if (kind === "big") {
    tone(70, 0.42, 0.42, "sine", delay, 42);
    tone(140, 0.12, 0.12, "triangle", delay, 90);
    hiss(0.1, 0.18, 700, "lowpass", delay);
    return;
  }
  const strong = kind === "strong";
  tone(strong ? 92 : 118, strong ? 0.28 : 0.2, strong ? 0.34 : 0.26, "sine", delay, 52);
  hiss(0.07, strong ? 0.14 : 0.1, 850, "lowpass", delay);
}

/** "হেঁইয়ো": two low, short grunts from the team as the pull lands. */
export function grunt() {
  tone(155, 0.08, 0.07, "triangle", 0, 140);
  tone(128, 0.15, 0.08, "triangle", 0.075, 96);
}

/** The jute rope snapping taut. */
export function creak() {
  tone(640, 0.11, 0.022, "sawtooth", 0, 470);
  hiss(0.1, 0.035, 2300, "bandpass");
}

/** Feet sliding in the dust: a tap off the beat or on a rest. */
export function scuff() {
  hiss(0.14, 0.09, 520, "lowpass");
  tone(170, 0.09, 0.04, "triangle", 0, 120);
}

/** The other team's captain calls the heave: two low brass notes, `delay` seconds from now. */
export function heaveCall(delay = 0) {
  tone(196, 0.22, 0.09, "sawtooth", delay, 185);
  tone(147, 0.34, 0.1, "sawtooth", delay + 0.22, 131);
}

/** The heave landing on the rope: a deep thud. */
export function heaveThud() {
  tone(96, 0.24, 0.24, "sine", 0, 55);
  hiss(0.16, 0.12, 400, "lowpass");
  buzz(18);
}

/** A heave held: a bright two-note lift. */
export function held() {
  tone(880, 0.08, 0.08, "triangle");
  tone(1320, 0.16, 0.08, "triangle", 0.06);
}

/** The PT teacher's whistle: the match starts and ends on it. */
export function whistle(delay = 0, long = false) {
  tone(2900, long ? 0.5 : 0.22, 0.07, "square", delay, long ? 2750 : 3050);
  hiss(long ? 0.5 : 0.22, 0.03, 3200, "bandpass", delay);
}

/** The win: a quick drum roll, then a three-note tune pitched for the world, then the crowd. */
const TUNE = [523, 659, 784, 1047];
const WORLD_PITCH = [1, 9 / 8, 4 / 3];
export function victory(world: number) {
  for (let i = 0; i < 6; i++) tone(110 + i * 4, 0.1, 0.16, "sine", i * 0.06, 70);
  const pitch = WORLD_PITCH[Math.max(0, Math.min(2, world))];
  TUNE.forEach((note, i) => tone(note * pitch, 0.2, 0.1, "triangle", 0.4 + i * 0.12));
  cheer(0.4);
}

/** The winner's crowd: a cheer that swells and fades, with a few claps on top. */
export function cheer(delay = 0) {
  [0.3, 0.6, 0.9, 1, 1, 0.8, 0.5, 0.25].forEach((level, i) => hiss(0.45, 0.1 * level, 1400 + i * 110, "bandpass", delay + i * 0.09));
  for (let i = 0; i < 6; i++) hiss(0.04, 0.09, 3200, "highpass", delay + 0.15 + i * 0.13);
  buzz([20, 40, 20]);
}

/** A star popping in on the end screen, `delay` seconds from now. */
export const starChime = (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay);

/** The crowd along the rope: louder and brighter as it gets excited (0 calm .. 1 on its feet). */
export function crowd() {
  const wind = loop("wind", 500);
  return {
    set(excite: number) { wind.set(0.08 + excite * 0.45); wind.pitch(420 + excite * 900); },
    stop: wind.stop,
  };
}
