// The switchboard's sounds, all synthesized through shared/game-sound.ts. Later notes go on the audio clock with tone(…, delay),
// never setTimeout, so the player's pause (silenceScheduled) cuts them. The one loop (the hum) is owned by the game component.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** The signature টক্‌: a hard bakelite click, a wooden knock, a small low thump. `net` > 0 lit more than it put out. */
export function tok(net: number) {
  tone(2300, 0.012, 0.07, "square");
  tone(260, 0.05, 0.12, "triangle", 0.003, 160);
  tone(92, 0.06, 0.1, "sine", 0.004, 70);
  if (net > 0) tone(880, 0.07, 0.025, "sine", 0.03, 1320);
  else if (net < 0) tone(700, 0.08, 0.022, "sine", 0.03, 440);
  buzz(6);
}

/** A line switch: a longer clack, then a zip running down the string of lights. */
export function zip() {
  tone(1900, 0.014, 0.07, "square");
  tone(210, 0.07, 0.12, "triangle", 0.004, 130);
  hiss(0.22, 0.05, 3600, "bandpass", 0.03);
  for (let step = 0; step < 4; step++) tone(1200 + step * 160, 0.03, 0.02, "sine", 0.05 + step * 0.04);
  buzz([6, 20, 6]);
}

/** A taped switch: a dull thup through the tape. */
export function thup() {
  tone(150, 0.07, 0.09, "sine", 0, 110);
  hiss(0.05, 0.05, 700, "lowpass");
}

/** The main switch on শুরু করো: a heavy clunk, then the flicker of the bulbs coming on. */
export function mains() {
  tone(120, 0.12, 0.16, "triangle", 0, 70);
  tone(1600, 0.014, 0.06, "square");
  for (let flick = 0; flick < 3; flick++) hiss(0.03, 0.04, 5200, "bandpass", 0.08 + flick * 0.07);
  tone(100, 0.3, 0.025, "sawtooth", 0.12);
  buzz(14);
}

/** Every bulb lit: a ceiling fan spinning up under a warm chord. */
export function fanChord() {
  hiss(0.9, 0.05, 420);
  tone(70, 0.9, 0.07, "triangle", 0, 150);
  [392, 494, 587, 784].forEach((frequency, index) => tone(frequency, 0.6, 0.06, "triangle", 0.12 + index * 0.06));
}

export const takeBackSound = sfx.drop;
export const hintSound = sfx.pick;
