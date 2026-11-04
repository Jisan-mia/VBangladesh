// The field's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s delay,
// so the player's pause (silenceScheduled) cuts it. The one loop (the rustle of birds eating) is owned by the component.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import { WORLDS } from "../lib/levels";

export const sound = {
  /** The world's three notes as the afternoon starts. */
  start(world: number) {
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.18, 0.05, "triangle", 0.1 + index * 0.14));
  },
  /** The signature: a landing. A sparrow's চিক-চিক, a শালিক's harsh ক্যাঁচ, a flock's quick triple, a boss's own call. */
  land(kind: number, world: number) {
    if (kind === 0) { tone(3400, 0.05, 0.035, "sine", 0, 4300); tone(3700, 0.06, 0.035, "sine", 0.08, 4700); }
    else if (kind === 1) { tone(900, 0.07, 0.03, "sawtooth", 0, 640); tone(1100, 0.06, 0.025, "sawtooth", 0.09, 760); }
    else if (kind === 2) for (let i = 0; i < 3; i++) tone(4200 + i * 300, 0.03, 0.025, "sine", i * 0.05);
    else sound.bossIn(world);
  },
  /** A boss arrives: পালের গোদা's low chirps, the ঝুঁটি শালিক's squawk, the ডাকাত টিয়া's screech. */
  bossIn(world: number) {
    if (world === 0) { tone(2200, 0.08, 0.05, "sine", 0, 2900); tone(2400, 0.08, 0.05, "sine", 0.12, 3100); tone(2000, 0.12, 0.05, "sine", 0.24, 2600); }
    else if (world === 1) { tone(620, 0.12, 0.05, "sawtooth", 0, 480); tone(760, 0.12, 0.05, "sawtooth", 0.15, 520); }
    else { tone(1800, 0.14, 0.05, "square", 0, 2600); tone(2000, 0.16, 0.045, "square", 0.18, 2900); }
  },
  /** A clap of the hands: a dry slap of noise over a low knock. Plays in the pointerdown itself. */
  clap() { hiss(0.06, 0.24, 1700, "highpass"); tone(200, 0.05, 0.07, "triangle"); },
  /** Wings beating away; a chord for several in one clap; the streak climbing the scale. */
  shoo(hits: number, combo: number) {
    hiss(0.22, 0.09, 3200, "bandpass", 0.03);
    if (hits > 1) [784, 988, 1175].forEach((frequency, index) => tone(frequency, 0.12, 0.05, "triangle", 0.05 + index * 0.04));
    if (combo >= 3) sfx.combo(combo - 3);
    buzz(8);
  },
  /** A শালিক that only hops aside: a cross squawk. */
  hop() { tone(820, 0.08, 0.04, "sawtooth", 0, 600); buzz(6); },
  /** A clap at empty paddy: nothing more than the clap itself. "একটুর জন্য" gets a soft second tap. */
  near() { tone(500, 0.04, 0.03, "triangle", 0.05); },
  /** A beak in the grain: very quiet, so it nags only a little. */
  peck: () => tone(2600, 0.015, 0.018, "square"),
  /** A tenth of the grain gone: a low warning knock. */
  tenth() { tone(180, 0.12, 0.06, "sine", 0, 140); },
  /** The boss knocked off its spot: a thud and wings; when it leaves for good, a falling whistle and a chord. */
  bossHit() { tone(130, 0.2, 0.18, "sine", 0, 70); hiss(0.2, 0.12, 2800, "bandpass"); buzz(25); },
  bossGone() { tone(1400, 0.5, 0.06, "triangle", 0, 300); hiss(0.25, 0.14, 3200, "bandpass"); [523, 659, 784].forEach((f, i) => tone(f, 0.18, 0.08, "triangle", 0.4 + i * 0.09)); buzz([30, 40, 30]); },
  /** Dusk: crickets start up. */
  dusk() { for (let i = 0; i < 6; i++) tone(4400, 0.03, 0.03, "sine", 0.1 + i * 0.09 + (i > 2 ? 0.25 : 0)); },
};

/** The rustle of birds at the grain: louder the more are eating. `level` 0 (none) to 1 (a crowd). */
export function makeRustle() {
  const rustle = loop("static", 4800);
  return { set(level: number) { rustle.set(level <= 0 ? 0 : 0.12 + level * 0.4); }, stop: rustle.stop };
}
