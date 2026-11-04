// The field's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** Boot on leather: a low thump with a short scuff. */
export function kickThump() {
  tone(120, 0.13, 0.26, "sine", 0, 55);
  hiss(0.05, 0.14, 1700, "bandpass");
  buzz(12);
}

/** The ball in the net: a soft high swish. */
export function netSwish() {
  hiss(0.34, 0.14, 3800, "highpass", 0.02);
  hiss(0.22, 0.08, 6200, "bandpass", 0.07);
}

/** The ball on a bamboo post: a hollow টক, not a metal ping. */
export function bambooKnock() {
  tone(480, 0.1, 0.16, "triangle", 0, 380);
  tone(1150, 0.05, 0.06, "square");
  buzz(18);
}

/** Gloves on the ball. */
export function gloveSave() {
  tone(170, 0.12, 0.2, "sine", 0, 90);
  hiss(0.08, 0.16, 900, "lowpass");
  buzz(20);
}

/**
 * The crowd along the touchline: noise bursts that rise and fall, about 0.7 s.
 * `cheer` is brighter and louder (a goal for us, a save); the "ওওও" is darker with a falling hum (a near miss).
 */
export function crowd(cheer: boolean) {
  const levels = [0.3, 0.6, 0.9, 1, 0.7, 0.35];
  levels.forEach((level, i) => hiss(0.42, (cheer ? 0.09 : 0.06) * level, (cheer ? 1500 : 800) + i * 120, "bandpass", i * 0.08));
  if (!cheer) tone(240, 0.75, 0.025, "sawtooth", 0.05, 170);
}

/** The referee's pea whistle: a fast trill between two pitches, then a short hold. */
export function whistle(long = false) {
  const trill = long ? 14 : 8;
  for (let i = 0; i < trill; i++) tone(i % 2 ? 2950 : 3250, 0.05, 0.045, "sine", i * 0.035);
  if (long) tone(3100, 0.35, 0.04, "sine", trill * 0.035);
}

/**
 * The crowd under every kick: a murmur whose level and brightness the step sets (0 calm → 1 the breath before a decisive kick).
 * Made only while sound is on, so it is never a silent stub; the component drops it on pause, the end, a hidden tab and
 * unmount, and makes a fresh one when sound comes back.
 */
export function crowdLoop() {
  const wind = loop("wind", 500);
  return {
    swell(level: number) { wind.set(0.08 + level * 0.55); wind.pitch(420 + level * 950); },
    stop: wind.stop,
  };
}
export type CrowdLoop = ReturnType<typeof crowdLoop>;

/** The four notes that open each cup (tone's delay, so the player's pause can cut them). */
const MOTIFS = [[523, 659, 784, 1047], [440, 554, 659, 880], [392, 494, 587, 784], [587, 740, 880, 1175]] as const;
export function cupMotif(world: number) {
  MOTIFS[Math.max(0, Math.min(3, world))].forEach((frequency, i) => tone(frequency, 0.18, 0.06, "triangle", 0.5 + i * 0.13));
}

/** The shot clock's last seconds. */
export const clockTick = (last: boolean) => tone(last ? 1320 : 990, 0.05, 0.06, "square");

/** A final won: the cup fanfare. */
export function cupFanfare() {
  [523, 659, 784, 1047, 784, 1047].forEach((frequency, i) => tone(frequency, i === 5 ? 0.5 : 0.16, 0.09, "triangle", 0.35 + i * 0.11));
}
