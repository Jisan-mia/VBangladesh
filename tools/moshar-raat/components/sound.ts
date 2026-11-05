// The night's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s delay,
// so the player's pause (silenceScheduled) cuts it. The two loops (the whine, the boss's hum) are owned by the component.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import { WORLDS } from "../lib/levels";

export const sound = {
  /** The light switch going off, then the world's three notes. */
  start(world: number) {
    tone(1800, 0.02, 0.08, "square"); tone(900, 0.03, 0.05, "square", 0.03);
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.2, 0.05, "triangle", 0.35 + index * 0.15));
  },
  /** The bat's mesh: a sharp crackle, a tick for each mosquito it caught, a chord for a ঝাঁক. */
  zap(hits: number, combo: number) {
    hiss(0.12, 0.2, 4200, "highpass");
    for (let i = 0; i < Math.min(5, 1 + hits); i++) tone(2400 + i * 520, 0.025, 0.05, "square", 0.012 + i * 0.03);
    if (hits > 1) [784, 988, 1175].forEach((frequency, index) => tone(frequency, 0.12, 0.05, "triangle", 0.05 + index * 0.04));
    if (combo >= 3) sfx.combo(combo - 3);
    buzz(14);
  },
  /** A swing through empty air. */
  swish: () => hiss(0.13, 0.07, 1500, "bandpass"),
  /** A bite: the sleeper's soft "উঁহু", never a scream. */
  bite() { tone(300, 0.2, 0.07, "triangle", 0, 220); buzz([20, 30, 20]); },
  /** A slap on the sleeping face: a dull ঠাস, then the same soft "উঁহু". */
  slap() { hiss(0.08, 0.22, 900, "lowpass"); tone(260, 0.2, 0.06, "triangle", 0.08, 200); buzz([30, 30, 30]); },
  /** A boss knocked back: a heavy thud and a zap; when it falls, a falling whistle and the zap. */
  bossHit() { tone(110, 0.22, 0.2, "sine", 0, 60); hiss(0.18, 0.2, 3600, "highpass"); buzz(30); },
  bossDown() { tone(900, 0.5, 0.07, "triangle", 0, 180); hiss(0.25, 0.22, 4200, "highpass"); [523, 659, 784].forEach((f, i) => tone(f, 0.18, 0.08, "triangle", 0.4 + i * 0.09)); buzz([30, 40, 30]); },
  /** Dawn: a rooster's call far off, then two birds. */
  dawn() {
    tone(620, 0.12, 0.05, "sawtooth", 0, 880); tone(880, 0.22, 0.05, "sawtooth", 0.13, 700); tone(700, 0.35, 0.04, "sawtooth", 0.36, 520);
    tone(2600, 0.06, 0.04, "sine", 0.85, 3200); tone(2900, 0.06, 0.04, "sine", 1.0, 3400);
  },
};

/** The signature: the পিন-পিন of the mosquito nearest its target. `near` 0 (none, or far) to 1 (right there): louder and higher. */
export function makeWhine() {
  const hum = loop("whine", 470);
  return {
    set(near: number, flutter: number) { hum.set(near <= 0 ? 0 : 0.08 + near * 0.72); hum.pitch(430 + near * 330 + flutter * 14); },
    stop: hum.stop,
  };
}

/** The boss's own low drone while it flies. */
export function makeDrone() {
  const hum = loop("whine", 210);
  return { set(level: number, flutter: number) { hum.set(level * 0.55); hum.pitch(200 + level * 60 + flutter * 8); }, stop: hum.stop };
}
