// সাপলুডু's sounds, all synthesized through shared/game-sound.ts. Every later note is scheduled on the audio clock with
// tone(…, delay), never with setTimeout, so silenceScheduled() (the player's pause) cuts it. No loops.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { DICE_MS } from "../lib/motion.hot";

/** The signature, part one: the die rattling in a cupped hand. Part two, the wooden ঠক as it lands, is already scheduled. */
export function rattle(slow: boolean) {
  for (let i = 0; i < 4; i++) hiss(0.03, 0.09, 2600 + i * 350, "bandpass", i * 0.05);
  const land = slow ? 0.05 : DICE_MS / 1000;
  tone(190, 0.07, 0.16, "triangle", land, 120);
  hiss(0.05, 0.08, 900, "lowpass", land);
  tone(260, 0.05, 0.05, "triangle", land + 0.09, 200);
}

/** One square hopped: a soft tick that climbs a little with each hop. */
export const hop = (count: number) => tone(560 + 38 * Math.min(10, count), 0.035, 0.05, "triangle");

/** Up a ladder: one bright note per rung, rising. */
export function climb(rungs: number, seconds: number) {
  const notes = Math.max(3, Math.min(8, rungs)), gap = seconds / notes;
  for (let i = 0; i < notes; i++) tone(523 * Math.pow(2, i / 7), 0.12, 0.07, "triangle", i * gap);
  tone(1568, 0.3, 0.05, "sine", seconds);
  buzz(10);
}

/** Down a snake: a hiss as it bites, then a long, falling slide whistle. */
export function bite(seconds: number) {
  hiss(0.28, 0.12, 3200, "highpass");
  tone(1150, Math.max(0.3, seconds), 0.08, "triangle", 0.12, 150);
  tone(330, 0.14, 0.06, "sine", 0.12 + seconds, 200);
  buzz([20, 30, 40]);
}

/** A six: a bright two-note "আরেকবার". */
export const six = () => { tone(1175, 0.08, 0.07, "square"); tone(1568, 0.14, 0.06, "square", 0.07); };

/** Too far for the last square, or a third six: a short, dull "no". */
export const stuck = () => tone(196, 0.14, 0.07, "square", 0, 165);

/** Home: the fanfare for first, a softer chime for a later place, and the rival's arrival a small knock. */
export function homeSound(first: boolean, mine: boolean) {
  if (!mine) { tone(784, 0.1, 0.06, "triangle"); tone(659, 0.16, 0.05, "triangle", 0.08); return; }
  if (first) sfx.win(); else sfx.good();
}
