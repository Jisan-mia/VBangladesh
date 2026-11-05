// The orchard's sounds, all synthesized through shared/game-sound.ts. Later notes go on the audio clock with tone(…, delay),
// never setTimeout, so the player's pause (silenceScheduled) cuts them. The one loop (the hornets' hum after a sting) is
// owned by the game component, which starts it only while flow.wantsHum holds.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** Clearing a bush: a leaf rustle. A bigger opening rustles longer and climbs a few notes. */
export function rustle(opened: number) {
  hiss(opened > 1 ? 0.16 : 0.07, opened > 1 ? 0.13 : 0.09, 3200, "bandpass");
  hiss(0.05, 0.05, 6000, "highpass", 0.03);
  const notes = opened >= 8 ? Math.min(4, Math.floor(opened / 8) + 1) : 0;
  for (let step = 0; step < notes; step++) tone([784, 988, 1175, 1568][step], 0.1, 0.07, "triangle", 0.07 + step * 0.07);
  buzz(5);
}

/** বাগানে ঢোকো: the bamboo gate creaks, then the path's bushes rustle open in a wave. */
export function enterPath() {
  tone(220, 0.22, 0.05, "sawtooth", 0, 160);
  hiss(0.12, 0.06, 900, "bandpass", 0.02);
  for (let wave = 0; wave < 3; wave++) hiss(0.1, 0.09 - wave * 0.02, 3000 + wave * 600, "bandpass", 0.12 + wave * 0.08);
  tone(523, 0.12, 0.06, "triangle", 0.2);
  tone(784, 0.16, 0.06, "triangle", 0.3);
  buzz(10);
}

/** Tying a গামছা: one soft buzz from inside the bush, and the cloth's flap. */
export function tieSound() {
  tone(190, 0.14, 0.06, "sawtooth", 0, 210);
  hiss(0.05, 0.06, 1800, "bandpass", 0.02);
  buzz(8);
}
export const untieSound = () => hiss(0.05, 0.05, 1400, "bandpass");

/** A nest you set off and lived: a sharp angry buzz, a thump, the hornets waking. */
export function sting() {
  tone(320, 0.22, 0.09, "sawtooth", 0, 520);
  tone(560, 0.18, 0.05, "square", 0.04, 380);
  tone(110, 0.16, 0.18, "sine", 0, 60);
  buzz([30, 40, 30]);
}

/** The signature: a cartoon swarm. Buzzes that wobble up and fade as everyone runs, then a falling "oh no". */
export function swarm(slow: boolean) {
  const step = slow ? 0.16 : 0.09;
  for (let k = 0; k < 12; k++) tone(210 + (k % 2 ? 60 : 0) + k * 14, step * 1.4, Math.max(0.02, 0.09 - k * 0.006), "sawtooth", k * step);
  sfx.lose();
  buzz([40, 30, 40]);
}

/** The orchard cleared: mangoes thunk into the basket, then a three-note chord pitched per world. */
export function basket(world: number) {
  for (let k = 0; k < 3; k++) tone(150 - k * 12, 0.09, 0.12, "sine", k * 0.09, 90);
  const root = [523, 587, 494][Math.max(0, Math.min(2, world - 1))];
  [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(root * ratio, 0.3, 0.07, "triangle", 0.3 + index * 0.08));
  buzz([15, 30, 15]);
}

export const hintSound = sfx.pick;
export const blockedSound = sfx.tap;
