// The river's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a scheduled
// tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/**
 * The signature: a ঢোল stroke. `delay` (seconds) lands it right on the beat the ring shows. A strong beat is deeper, the big stroke deeper
 * still with a long boom; the count-in is a dry tap on the rim.
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

/** The crew's "হেঁই!" as the oars bite on the beat, with the blades hitting water. A perfect catch is brighter and the big stroke is a long shout. */
export function haul(perfect: boolean, big: boolean) {
  tone(155, 0.08, 0.07, "triangle", 0, 140);
  tone(128, 0.15, 0.08, "triangle", 0.075, 96);
  hiss(0.16, perfect ? 0.14 : 0.08, perfect ? 1500 : 1000, "bandpass");
  if (perfect) tone(660, 0.1, 0.05, "triangle", 0.02, 880);
  if (big) { tone(98, 0.36, 0.12, "sawtooth", 0.05, 90); hiss(0.3, 0.1, 700, "lowpass", 0.05); }
}

/** A tap off the beat: the oars fumble, a dull knock and a short scrape. */
export function fumble() {
  tone(120, 0.07, 0.08, "sine", 0, 90);
  hiss(0.1, 0.06, 500, "lowpass");
}

/** A lane change: the oars swing the boat over. */
export const swish = () => hiss(0.14, 0.06, 1800, "bandpass");
/** A boat alongside, or the bank, knocks it back. */
export const knock = () => tone(260, 0.05, 0.07, "square");
/** ছপ: into the কচুরিপানা. */
export function snag() { hiss(0.3, 0.24, 900); tone(90, 0.2, 0.12, "sine", 0, 55); buzz(25); }

/** A crosswind: a rising rush (the gust, and the arrow on the edge). */
export function gustWarn() { hiss(0.5, 0.1, 1200, "bandpass"); tone(300, 0.4, 0.04, "sine", 0, 520); }
/** The banks closing: two reed knocks (the amber edges). */
export function narrowWarn() { tone(210, 0.07, 0.08, "square"); tone(210, 0.07, 0.08, "square", 0.12); }
/** The champion flags its last pull: two low brass notes (the red top edge and the gold name). */
export function surgeWarn() {
  tone(196, 0.22, 0.09, "sawtooth", 0, 185);
  tone(147, 0.34, 0.1, "sawtooth", 0.22, 131);
}
/** The tempo is about to quicken: a quick double tap on the rim (the right edge). */
export function quicken() { drum("count"); drum("count", 0.09); }
/** The streak climbs: a bright two-note lift, higher the longer the run. */
export function rhythm(level: number) { tone(660 + level * 90, 0.08, 0.07, "triangle"); tone(990 + level * 90, 0.14, 0.07, "triangle", 0.06); }

/** The start horn, and the finish horn: a low note and a higher one. */
export function horn(delay = 0, long = false) {
  tone(220, long ? 0.6 : 0.3, 0.1, "sawtooth", delay, 235);
  tone(330, long ? 0.6 : 0.3, 0.06, "triangle", delay, 350);
}

const TUNE = [523, 659, 784, 1047];
const WORLD_PITCH = [1, 9 / 8, 4 / 3];
/** A placing: a quick drum roll, then a four-note tune pitched for the world, then the crowd's cheer. */
export function placed(world: number, rank: number) {
  for (let i = 0; i < 6; i++) tone(110 + i * 4, 0.1, 0.16, "sine", i * 0.06, 70);
  const pitch = WORLD_PITCH[Math.max(0, Math.min(2, world))];
  TUNE.slice(0, rank === 1 ? 4 : rank === 2 ? 3 : 2).forEach((note, i) => tone(note * pitch, 0.2, 0.1, "triangle", 0.4 + i * 0.12));
  cheer(0.4, rank === 1 ? 1 : 0.6);
}
/** Last place: a falling pair, softly. */
export function lastPlace() { [392, 330, 262].forEach((note, at) => tone(note, 0.24, 0.08, "triangle", 0.2 + at * 0.14)); }

/** The banks' cheer swells and fades, with a few claps on top. */
export function cheer(delay = 0, scale = 1) {
  [0.3, 0.6, 0.9, 1, 1, 0.8, 0.5, 0.25].forEach((level, i) => hiss(0.45, 0.1 * level * scale, 1400 + i * 110, "bandpass", delay + i * 0.09));
  for (let i = 0; i < 6; i++) hiss(0.04, 0.09 * scale, 3200, "highpass", delay + 0.15 + i * 0.13);
  buzz([20, 40, 20]);
}

/** A star popping in on the end screen, `delay` seconds from now. */
export const starChime = (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay);

/** The river rushing past the hull: louder and brighter the faster you row. Runs only while racing. */
export function rush() {
  const wind = loop("wind", 500);
  return {
    /** speed 0 to 1 of the top speed. */
    set(speed: number) { wind.set(0.1 + 0.5 * speed); wind.pitch(320 + speed * 750); },
    stop: wind.stop,
  };
}
