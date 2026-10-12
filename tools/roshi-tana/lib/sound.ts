// The sports-day field's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** The signature: a ঢোল stroke. `delay` (seconds) lands it right on the beat; strong beats are deeper. Count-in beats are a dry tap on the rim. */
export function drum(kind: "strong" | "weak" | "count", delay = 0) {
  if (kind === "count") { tone(420, 0.07, 0.1, "triangle", delay, 300); hiss(0.03, 0.08, 2500, "bandpass", delay); return; }
  const strong = kind === "strong";
  tone(strong ? 92 : 118, strong ? 0.28 : 0.2, strong ? 0.34 : 0.26, "sine", delay, 52);
  hiss(0.07, strong ? 0.14 : 0.1, 850, "lowpass", delay);
}

/** "হেঁইয়ো": two low, short grunts from the team as the pull lands. */
export function grunt() {
  tone(155, 0.08, 0.07, "triangle", 0, 140);
  tone(128, 0.15, 0.08, "triangle", 0.075, 96);
}

/** The jute rope taking the strain. */
export function creak() {
  tone(640, 0.11, 0.022, "sawtooth", 0, 470);
  hiss(0.1, 0.035, 2300, "bandpass");
}

/** Feet sliding in the dust: a tap off the beat. */
export function scuff() {
  hiss(0.14, 0.09, 520, "lowpass");
  tone(170, 0.09, 0.04, "triangle", 0, 120);
}

/** The winner's crowd: a cheer that swells and fades, with a few claps on top. */
export function cheer() {
  [0.3, 0.6, 0.9, 1, 1, 0.8, 0.5, 0.25].forEach((level, i) => hiss(0.45, 0.1 * level, 1400 + i * 110, "bandpass", i * 0.09));
  for (let i = 0; i < 6; i++) hiss(0.04, 0.09, 3200, "highpass", 0.15 + i * 0.13);
  buzz([20, 40, 20]);
}

/** The crowd along the rope: louder and higher as the ribbon nears either line (0 = middle, 1 = on a line). */
export function crowd() {
  const wind = loop("wind", 500);
  return {
    set(near: number) { wind.set(0.08 + near * 0.45); wind.pitch(420 + near * 800); },
    stop: wind.stop,
  };
}
